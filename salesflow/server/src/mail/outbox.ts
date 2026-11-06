// P0-5/6 · Transactional outbox for e-mail.
// Business code writes a message row in the same transaction as the state change; a worker
// sends pending rows from the single shared mailbox (Mail.Send scoped by Exchange RBAC for
// Applications to salesflow@ only). Dedupe keys make re-runs safe.
import type { GraphClient } from '../graph/client.ts'
import { GraphError } from '../graph/client.ts'

export interface OutboxMessage {
  id: string
  dedupeKey: string
  to: string[]
  cc?: string[]
  subject: string
  html: string
  attachments?: { name: string; contentType: string; base64: string }[]
  status: 'pending' | 'sent' | 'failed'
  attempts: number
  nextAttemptAt: number
  lastError?: string
}

export interface OutboxStore {
  insert(m: OutboxMessage): boolean
  due(now: number, limit: number): OutboxMessage[]
  update(m: OutboxMessage): void
}

export class MemoryOutbox implements OutboxStore {
  rows = new Map<string, OutboxMessage>()
  insert(m: OutboxMessage) {
    if ([...this.rows.values()].some((r) => r.dedupeKey === m.dedupeKey)) return false
    this.rows.set(m.id, m)
    return true
  }
  due(now: number, limit: number) {
    return [...this.rows.values()].filter((r) => r.status === 'pending' && r.nextAttemptAt <= now).slice(0, limit)
  }
  update(m: OutboxMessage) { this.rows.set(m.id, m) }
}

export function enqueue(store: OutboxStore, m: Omit<OutboxMessage, 'status' | 'attempts' | 'nextAttemptAt'>, now = Date.now()) {
  return store.insert({ ...m, status: 'pending', attempts: 0, nextAttemptAt: now })
}

/** Graph sendMail inline attachments must stay under ~3 MB; bigger files go as a SharePoint link. */
export const INLINE_ATTACHMENT_LIMIT = 3 * 1024 * 1024

export async function dispatch(g: GraphClient, store: OutboxStore, appToken: string, mailbox: string, now = Date.now(), maxAttempts = 6) {
  const batch = store.due(now, 20)
  await Promise.all(batch.map(async (m) => {
    const tooBig = (m.attachments ?? []).some((a) => (a.base64.length * 3) / 4 > INLINE_ATTACHMENT_LIMIT)
    try {
      if (tooBig) throw new Error('ไฟล์แนบใหญ่เกิน 3 MB — ส่งเป็นลิงก์ SharePoint แทน')
      await g.post(`/users/${encodeURIComponent(mailbox)}/sendMail`, {
        token: appToken, mailbox,
        body: {
          message: {
            subject: m.subject,
            body: { contentType: 'HTML', content: m.html },
            toRecipients: m.to.map((address) => ({ emailAddress: { address } })),
            ccRecipients: (m.cc ?? []).map((address) => ({ emailAddress: { address } })),
            attachments: (m.attachments ?? []).map((a) => ({ '@odata.type': '#microsoft.graph.fileAttachment', name: a.name, contentType: a.contentType, contentBytes: a.base64 })),
          },
          saveToSentItems: true,
        },
      })
      m.status = 'sent'
    } catch (e) {
      m.attempts++
      m.lastError = e instanceof Error ? e.message : String(e)
      const permanent = tooBig || (e instanceof GraphError && [400, 403, 404].includes(e.status))
      if (permanent || m.attempts >= maxAttempts) m.status = 'failed'
      else m.nextAttemptAt = now + Math.min(3_600_000, 60_000 * 2 ** (m.attempts - 1))
    }
    store.update(m)
  }))
  return batch.map((m) => ({ id: m.id, status: m.status }))
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** Approval request e-mail: primary action is a deep link into the app (works on mobile web, never expires). */
export function approvalEmail(a: { approverName: string; projectCode: string; projectName: string; customer: string; revenue: string; gp: string; version: string; link: string; dueText: string }) {
  return {
    subject: `[ขออนุมัติราคา] ${a.projectCode} ${a.projectName} (${a.version})`,
    html: `<p>เรียน คุณ${esc(a.approverName)}</p>
<p>มีคำขออนุมัติราคาโครงการ <b>${esc(a.projectName)}</b> ลูกค้า ${esc(a.customer)}</p>
<p>ราคาเสนอ ${esc(a.revenue)} · GP ${esc(a.gp)} · เวอร์ชัน ${esc(a.version)}</p>
<p><a href="${esc(a.link)}" style="display:inline-block;padding:10px 16px;background:#161b26;color:#fff;border-radius:6px;text-decoration:none">เปิดเพื่อพิจารณา</a></p>
<p style="color:#6b7384">ครบกำหนดพิจารณา ${esc(a.dueText)} · ลิงก์นี้เข้าผ่านบัญชี Microsoft ของบริษัท</p>`,
  }
}
