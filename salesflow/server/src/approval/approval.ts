// P0-2 · Approvals that know which file version they approved.
//
// At submit we capture the workbook's SharePoint version + eTag and the snapshot values,
// hash them, and keep a read-only record copy under "Cost Sheet/Submitted/vN.xlsx".
// Any newer version seen afterwards (delta query / webhook) marks the request `stale`,
// which disables "send quotation" until it is re-approved.
import { createHash } from 'node:crypto'
import type { GraphClient } from '../graph/client.ts'
import type { CostSheetSummary } from '../graph/costsheet.ts'

export type Status = 'pending' | 'approved' | 'rejected' | 'recalled' | 'stale' | 'expired'
export interface Step { order: number; approverId: string; delegateId?: string; status: 'waiting' | 'pending' | 'approved' | 'rejected'; at?: string; note?: string; actorId?: string; channel?: 'web' | 'email_link' }
export interface ApprovalEvent { action: 'submit' | 'approve' | 'reject' | 'recall' | 'stale' | 'expire'; actorId: string; onBehalfOf?: string; channel?: string; at: string }

export interface ApprovalRequest {
  id: string
  projectId: string
  version: number
  submittedBy: string
  snapshot: { revenue: number; cost: number; gp: number; templateVersion: string }
  snapshotHash: string
  driveId: string
  itemId: string
  spVersionId: string
  eTag: string
  archivedPath: string
  validUntil: string
  status: Status
  steps: Step[]
  events: ApprovalEvent[]
}

export class ApprovalRuleError extends Error {}

/** Stable JSON (sorted keys) → SHA-256, so the same figures always give the same hash. */
export function snapshotHash(s: object): string {
  const canon = (v: unknown): unknown =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, canon((v as Record<string, unknown>)[k])]))
      : v
  return createHash('sha256').update(JSON.stringify(canon(s))).digest('hex')
}

export function submit(args: {
  id: string; projectId: string; previousVersion: number; submittedBy: string; summary: CostSheetSummary
  driveId: string; itemId: string; spVersionId: string; eTag: string; approverIds: string[]; now: string; validDays?: number
}): ApprovalRequest {
  if (!args.approverIds.length) throw new ApprovalRuleError('ต้องมีผู้อนุมัติอย่างน้อย 1 คน')
  if (args.approverIds.includes(args.submittedBy)) throw new ApprovalRuleError('ผู้ส่งขออนุมัติต้องไม่เป็นผู้อนุมัติในคำขอเดียวกัน')
  const version = args.previousVersion + 1
  const snapshot = { revenue: args.summary.revenue, cost: args.summary.cost, gp: Math.round(args.summary.gp * 100) / 100, templateVersion: args.summary.templateVersion }
  const valid = new Date(args.now)
  valid.setUTCDate(valid.getUTCDate() + (args.validDays ?? 60))
  return {
    id: args.id, projectId: args.projectId, version, submittedBy: args.submittedBy, snapshot,
    snapshotHash: snapshotHash({ ...snapshot, spVersionId: args.spVersionId }),
    driveId: args.driveId, itemId: args.itemId, spVersionId: args.spVersionId, eTag: args.eTag,
    archivedPath: `Cost Sheet/Submitted/v${version}.xlsx`, validUntil: valid.toISOString().slice(0, 10),
    status: 'pending',
    steps: args.approverIds.map((approverId, i) => ({ order: i + 1, approverId, status: i === 0 ? 'pending' : 'waiting' })),
    events: [{ action: 'submit', actorId: args.submittedBy, channel: 'web', at: args.now }],
  }
}

export function decide(r: ApprovalRequest, actorId: string, action: 'approve' | 'reject', now: string, opts: { note?: string; channel?: 'web' | 'email_link' } = {}) {
  if (r.status !== 'pending') throw new ApprovalRuleError(`คำขออยู่ในสถานะ ${r.status} พิจารณาไม่ได้`)
  if (actorId === r.submittedBy) throw new ApprovalRuleError('ผู้ส่งขออนุมัติอนุมัติคำขอของตัวเองไม่ได้')
  const step = r.steps.find((s) => s.status === 'pending')!
  const onBehalf = step.delegateId === actorId
  if (step.approverId !== actorId && !onBehalf) throw new ApprovalRuleError('ไม่ใช่ผู้อนุมัติของขั้นนี้')
  if (action === 'reject' && !opts.note?.trim()) throw new ApprovalRuleError('ส่งกลับแก้ไขต้องระบุเหตุผล')
  step.status = action === 'approve' ? 'approved' : 'rejected'
  step.at = now
  step.note = opts.note
  step.actorId = actorId
  step.channel = opts.channel ?? 'web'
  r.events.push({ action, actorId, onBehalfOf: onBehalf ? step.approverId : undefined, channel: step.channel, at: now })
  if (action === 'reject') r.status = 'rejected'
  else {
    const next = r.steps.find((s) => s.status === 'waiting')
    if (next) next.status = 'pending'
    else r.status = 'approved'
  }
  return r
}

export function recall(r: ApprovalRequest, actorId: string, now: string) {
  if (actorId !== r.submittedBy) throw new ApprovalRuleError('เฉพาะผู้ส่งเท่านั้นที่ดึงคำขอกลับได้')
  if (r.status !== 'pending') throw new ApprovalRuleError('ดึงกลับได้เฉพาะคำขอที่รอพิจารณา')
  r.status = 'recalled'
  r.events.push({ action: 'recall', actorId, at: now })
  return r
}

/** Called for every drive change: a newer version of the approved workbook invalidates the approval. */
export function markStaleIfChanged(r: ApprovalRequest, latest: { itemId: string; eTag: string }, now: string) {
  if (latest.itemId !== r.itemId) return false
  if (latest.eTag === r.eTag) return false
  if (r.status !== 'approved' && r.status !== 'pending') return false
  r.status = 'stale'
  r.events.push({ action: 'stale', actorId: 'system', at: now })
  return true
}

export function expireIfDue(r: ApprovalRequest, today: string) {
  if (r.status === 'approved' && r.validUntil < today) {
    r.status = 'expired'
    r.events.push({ action: 'expire', actorId: 'system', at: today })
    return true
  }
  return false
}

export const canSendQuotation = (r: ApprovalRequest | undefined, today: string) =>
  !!r && r.status === 'approved' && r.validUntil >= today

/**
 * Keep a read-only record copy of exactly what was approved. `copy` is asynchronous
 * (202 + monitor URL) and does not carry metadata, so the retention label is applied after.
 */
export async function archiveSubmittedCopy(g: GraphClient, appToken: string, r: ApprovalRequest, submittedFolderId: string, retentionLabel?: string) {
  const res = await g.post<Response>(`/drives/${r.driveId}/items/${r.itemId}/copy?@microsoft.graph.conflictBehavior=fail`, {
    token: appToken, raw: true,
    body: { parentReference: { driveId: r.driveId, id: submittedFolderId }, name: `v${r.version}.xlsx` },
  })
  const monitor = res.headers.get('Location')
  if (!monitor) throw new Error('copy ไม่ส่ง Location กลับมา')
  const { resourceId } = await g.waitForOperation(monitor)
  if (resourceId && retentionLabel)
    await g.patch(`/drives/${r.driveId}/items/${resourceId}/retentionLabel`, { token: appToken, body: { name: retentionLabel } })
  return resourceId
}

/** Walk a drive delta feed and mark affected approvals stale. Returns the next deltaLink. */
export async function processDelta(g: GraphClient, appToken: string, startLink: string, open: ApprovalRequest[], now: string) {
  let link: string | undefined = startLink
  const staled: string[] = []
  let deltaLink = startLink
  while (link) {
    const page: { value: { id: string; eTag?: string; deleted?: unknown }[]; '@odata.nextLink'?: string; '@odata.deltaLink'?: string } =
      await g.get(link, { token: appToken })
    for (const item of page.value) {
      if (!item.eTag) continue
      for (const r of open) if (markStaleIfChanged(r, { itemId: item.id, eTag: item.eTag }, now)) staled.push(r.id)
    }
    link = page['@odata.nextLink']
    if (page['@odata.deltaLink']) deltaLink = page['@odata.deltaLink']
  }
  return { deltaLink, staled }
}
