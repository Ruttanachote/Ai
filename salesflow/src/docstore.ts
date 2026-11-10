// Sales document actions: upload / versions / rename / move / soft delete, Cost Sheet and
// Quotation revisions, Send to Approve, and the project activity log. In production these call
// the document API (presigned upload to object storage); here they update the in-memory project.
import type { Activity, ActivityType, CostSheet, PreMeeting, Project, ProjectDocument, Quotation } from './data/model'
import { TODAY_ISO, person } from './data/mock'
import { folderOf, standardName, docNo, addDaysIso, costTotals, linesFromCostSheet, DEFAULT_PAYMENTS, paymentText } from './domain/salesdocs'
import { newApprovalSteps, notify, outbox, session, SETTINGS } from './store'

let n = 1
const uid = (p: string) => `${p}${Date.now().toString(36)}${n++}`
const me = () => person(session.userId)?.name ?? session.userId
const stamp = () => `${TODAY_ISO} ${new Date().toTimeString().slice(0, 5)}`

export function log(p: Project, type: ActivityType, text: string, from?: string, to?: string) {
  p.activities ??= []
  p.activities.unshift({ id: uid('a'), at: stamp(), who: me(), type, text, from, to } as Activity)
}

/* ---------------- permissions (spec §6) ---------------- */
/** Owner / SM of the deal (and admin) manage everything; MA owns renewal (MA-type) deals. */
export const isOwner = (p: Project) => session.role === 'admin' || (session.role === 'sm' && p.sm === session.userId) || (p.type === 'MA' && session.role === 'ma')
const isCollaborator = (p: Project) => p.collaborators.includes(session.userId) || p.pm === session.userId || p.workspace?.members?.some((m) => m.userId === session.userId)
/** Internal cost (Cost Sheet, Contract) — owner, SM, approvers and executives only. */
export const canSeeCost = (p: Project) => isOwner(p) || ['head', 'deputy', 'exec', 'admin'].includes(session.role) || (session.role === 'sm' && p.collaborators.includes(session.userId))
export const canUpload = (p: Project, folder: string) => isOwner(p) || (isCollaborator(p) && folderOf(folder)?.phase !== 'pre')
export const canOpenFolder = (p: Project, folder: string) => !folderOf(folder)?.restricted || canSeeCost(p)
export const canDelete = (p: Project, d: ProjectDocument) => isOwner(p) || (isCollaborator(p) && d.createdBy === session.userId)

/* ---------------- files ---------------- */
export interface UploadMeta { docNo?: string; docDate?: string; amount?: number; note?: string; title?: string }
/** Add a file as a new document, or as the next version of `target`. */
export function addFile(p: Project, folder: string, file: { name: string; size: number; type: string; url?: string }, meta: UploadMeta, target?: ProjectDocument) {
  p.documents ??= []
  const f = folderOf(folder)!
  if (target) {
    const v = target.versions.length + 1
    target.versions.push({ no: v, fileName: file.name, stdName: standardName(p.code, f.name, v, TODAY_ISO, file.name), size: file.size, mime: file.type, at: TODAY_ISO, by: session.userId, note: meta.note, url: file.url })
    if (meta.docNo) target.docNo = meta.docNo
    log(p, 'file', `อัปโหลดเวอร์ชันใหม่ v${v} ของ “${target.title}” (${f.name})`)
    return target
  }
  const d: ProjectDocument = {
    id: uid('d'), folder, title: meta.title?.trim() || file.name.replace(/\.[^.]+$/, ''), docNo: meta.docNo, docDate: meta.docDate, amount: meta.amount, note: meta.note, createdBy: session.userId,
    versions: [{ no: 1, fileName: file.name, stdName: standardName(p.code, f.name, 1, TODAY_ISO, file.name), size: file.size, mime: file.type, at: TODAY_ISO, by: session.userId, note: meta.note, url: file.url }],
  }
  p.documents.unshift(d)
  // TOR / Proposal files feed the Forecast checklist that already exists.
  p.salesDocs ??= {}
  if (folder === 'tor') p.salesDocs.tor = d.versions[0].stdName
  if (folder === 'proposal') p.salesDocs.proposal = d.versions[0].stdName
  log(p, 'file', `อัปโหลด “${d.title}” ลงโฟลเดอร์ ${f.name}`)
  return d
}
export function renameDoc(p: Project, d: ProjectDocument, title: string) { const old = d.title; d.title = title.trim(); log(p, 'file', 'เปลี่ยนชื่อเอกสาร', old, d.title) }
export function moveDoc(p: Project, d: ProjectDocument, folder: string) { const old = folderOf(d.folder)?.name; d.folder = folder; log(p, 'file', `ย้าย “${d.title}”`, old, folderOf(folder)?.name) }
export function deleteDoc(p: Project, d: ProjectDocument) { d.deletedAt = TODAY_ISO; d.deletedBy = session.userId; log(p, 'file', `ลบ “${d.title}” ไปถังขยะ (กู้คืนได้ 30 วัน)`) }
export function restoreDoc(p: Project, d: ProjectDocument) { d.deletedAt = undefined; d.deletedBy = undefined; log(p, 'file', `กู้คืน “${d.title}” จากถังขยะ`) }
/** Restore an older version by copying it as the newest one (history is never rewritten). */
export function restoreVersion(p: Project, d: ProjectDocument, no: number) {
  const v = d.versions.find((x) => x.no === no)
  if (!v) return
  const next = d.versions.length + 1
  d.versions.push({ ...v, no: next, at: TODAY_ISO, by: session.userId, note: `ย้อนกลับจาก v${no}`, locked: false, stdName: v.stdName.replace(/_v\d+_/, `_v${next}_`) })
  log(p, 'file', `ย้อนกลับ “${d.title}” เป็นเนื้อหา v${no} (สร้าง v${next})`)
}
export function logDownload(p: Project, d: ProjectDocument, no: number) {
  if (folderOf(d.folder)?.restricted) log(p, 'file', `ดาวน์โหลด ${folderOf(d.folder)?.name} “${d.title}” v${no}`)
}

/* ---------------- Cost Sheet / Quotation ---------------- */
const seqOf = (p: Project) => Number(p.costSheets?.[0]?.docNo.slice(-4)) || 100 + Number(p.id.replace(/\D/g, ''))
export function blankCostSheet(p: Project): CostSheet {
  const rev = (p.costSheets?.reduce((m, c) => Math.max(m, c.revision), 0) ?? 0) + 1
  // A fresh workbook from the template: header from the project, one revenue line, the standard cost groups.
  return {
    id: uid('cs'), docNo: docNo('CS', 2026, seqOf(p)), revision: rev, status: 'DRAFT', source: 'form',
    refNo: String(69000000 + seqOf(p)), profitCenter: p.team, preparedAt: TODAY_ISO, createdBy: session.userId,
    revenue: [{ id: uid('r'), type: p.type === 'MA' ? 'MA SVC' : p.type === 'Rental' ? 'Rental SVC' : p.type === 'MS' ? 'Other' : 'Software', description: p.name, qty: 1, unitPrice: p.budget || 0 }],
    payments: [...DEFAULT_PAYMENTS],
    costs: [
      { id: uid('c'), group: 'manday', description: 'ทีมพัฒนา', qty: 0, unitPrice: 6500 },
      { id: uid('c'), group: 'contingency', sub: 'Contingency (5%)', description: 'สำรองความเสี่ยง', qty: 0.05 },
      { id: uid('c'), group: 'inter', sub: 'Prime SM', description: 'Solution Management', qty: 1, unitPrice: 0 },
    ],
  }
}
/** Copy a revision as the next DRAFT revision (approved / rejected documents are never edited). */
export function nextCostRevision(p: Project, from: CostSheet): CostSheet {
  const b = blankCostSheet(p)
  return { ...JSON.parse(JSON.stringify(from)), id: b.id, revision: b.revision, status: 'DRAFT', preparedAt: TODAY_ISO, createdBy: session.userId, approvedAt: undefined }
}
export function saveCostSheet(p: Project, cs: CostSheet) {
  p.costSheets ??= []
  const i = p.costSheets.findIndex((c) => c.id === cs.id)
  const t = costTotals(cs)
  if (i >= 0) { p.costSheets[i] = cs; log(p, 'document', `บันทึก Cost Sheet ${cs.docNo} rev.${cs.revision} (Draft)`) }
  else { p.costSheets.push(cs); log(p, 'document', `สร้าง Cost Sheet ${cs.docNo} rev.${cs.revision} · COGS ${t.cogs.toLocaleString('en-US')} · GM ${t.gmPct}%`) }
  // Before approval the project shows the draft figures as an estimate.
  if (!p.financeSource) { p.revenue = t.revenue; p.cost = t.cogs }
}
export function blankQuotation(p: Project, cs: CostSheet): Quotation {
  const rev = (p.quotations?.reduce((m, q) => Math.max(m, q.revision), 0) ?? 0) + 1
  return {
    id: uid('qt'), docNo: cs.docNo.replace('CS', 'QT'), revision: rev, status: 'DRAFT', costSheetId: cs.id,
    issueDate: TODAY_ISO, validUntil: addDaysIso(TODAY_ISO, 30), contact: p.stakeholders?.find((s) => s.side === 'customer')?.name ?? '', phone: p.stakeholders?.find((s) => s.side === 'customer')?.phone, email: p.stakeholders?.find((s) => s.side === 'customer')?.email, projectName: p.name,
    items: linesFromCostSheet(cs).map((l) => ({ id: uid('q'), ...l })), discount: 0,
    termOfPayment: paymentText(cs.payments), termOfDelivery: 'ภายใน 180 วันนับจากวันลงนามสัญญา / PO', vatIncluded: true,
    warranty: 'รับประกัน 12 เดือนนับจากวันตรวจรับ', salesPerson: p.sales.join(', '), approvedBy: 'Thanakorn C. (ผู้บริหาร DT)', remark: '', createdBy: session.userId, createdAt: TODAY_ISO,
  }
}
export function saveQuotation(p: Project, q: Quotation) {
  p.quotations ??= []
  const i = p.quotations.findIndex((x) => x.id === q.id)
  if (i >= 0) p.quotations[i] = q
  else p.quotations.push(q)
  log(p, 'document', `${i >= 0 ? 'บันทึก' : 'สร้าง'} Quotation ${q.docNo} rev.${q.revision} (Draft)`)
}

/** Send a Cost Sheet + Quotation pair for approval (deputy → executive). */
export function sendToApprove(p: Project, cs: CostSheet, q: Quotation, message: string, meeting: PreMeeting) {
  const t = costTotals(cs)
  cs.status = 'PENDING'; q.status = 'PENDING'
  p.approval = {
    version: `rev.${cs.revision}`, submittedAt: 'วันนี้', status: 'pending', submittedBy: session.userId,
    snapshot: { revenue: t.revenue, cost: t.cogs, gp: t.gmPct }, snapshotHash: [t.revenue, t.cogs, t.gmPct].map((x) => Math.round(x).toString(16)).join('').slice(0, 20),
    archivedPath: `Cost Sheet/${cs.docNo} rev.${cs.revision}`, validUntil: q.validUntil || addDaysIso(TODAY_ISO, SETTINGS.approvalValidDays),
    steps: newApprovalSteps(session.userId, p.type === 'MA' ? 'ทีม MA ส่งขออนุมัติ' : 'SM ส่งขออนุมัติ'),
    message: message.trim() || undefined, preMeeting: meeting, costSheetId: cs.id, quotationId: q.id,
  }
  const first = p.approval.steps[1]
  outbox.unshift({ id: uid('m'), at: TODAY_ISO, from: me(), to: first.who, kind: 'email', subject: `[Cost Sheet] ${p.name} — ขออนุมัติ rev.${cs.revision}` })
  log(p, 'approval', `ส่งขออนุมัติ ${cs.docNo} + ${q.docNo} rev.${cs.revision} ถึง ${first.who}`)
  notify(`ส่งขออนุมัติแล้ว — อีเมลถึง ${first.who} (Outlook + Mail Inbox)`)
}
/** The submitter withdraws a pending request. */
export function cancelApproval(p: Project) {
  const a = p.approval
  if (!a) return
  a.status = 'recalled'
  a.steps.forEach((s) => { if (s.status === 'pending') s.status = 'waiting' })
  const cs = p.costSheets?.find((c) => c.id === a.costSheetId); if (cs) cs.status = 'CANCELLED'
  const q = p.quotations?.find((c) => c.id === a.quotationId); if (q) q.status = 'CANCELLED'
  log(p, 'approval', `ยกเลิกคำขออนุมัติ ${a.version}`)
}
