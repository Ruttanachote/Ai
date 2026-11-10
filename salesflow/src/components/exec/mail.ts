// Approval mails for one approver, built from the projects' approval records. In production the
// same items come from the approver's Microsoft 365 mailbox (Graph: messages in the "Approval"
// folder, matched to the request by the id in the mail header); the decision is written back here.
import { computed } from 'vue'
import type { Approval, Project } from '../../data/model'
import { person } from '../../data/mock'
import { projects, session, mailRead } from '../../store'

export type MailState = 'pending' | 'upcoming' | 'approved' | 'returned' | 'withdrawn'
export const MAIL_STATE: Record<MailState, { label: string; tone: '' | 'warn' | 'win' | 'lose' }> = {
  pending: { label: 'รอคุณพิจารณา', tone: 'warn' },
  upcoming: { label: 'รอขั้นก่อนหน้า', tone: '' },
  approved: { label: 'Approved', tone: 'win' },
  returned: { label: 'Rejected', tone: 'lose' },
  withdrawn: { label: 'SM ดึงกลับ', tone: '' },
}

export interface ApprovalMail {
  key: string
  p: Project
  a: Approval
  state: MailState
  from: string
  subject: string
  at: string
  step: Approval['steps'][number]
  unread: boolean
}

export function mailsFor(list: Project[], userId: string): ApprovalMail[] {
  return list.flatMap((p) => {
    const a = p.approval
    if (!a) return []
    const step = a.steps.find((s) => s.approver && s.whoId === userId)
    if (!step) return []
    const off = a.status === 'stale' || a.status === 'recalled'
    const state: MailState =
      step.status === 'approved' ? 'approved'
      : step.status === 'rejected' ? 'returned'
      : off ? 'withdrawn'
      : step.status === 'pending' ? 'pending'
      : a.status === 'rejected' ? 'withdrawn' : 'upcoming'
    const key = `${p.id}:${a.version}`
    return [{
      key, p, a, state, step,
      from: person(a.submittedBy ?? p.sm)?.name ?? 'SM',
      subject: `[Cost Sheet] ${p.name}`,
      at: a.submittedAt,
      unread: state === 'pending' && !mailRead.has(key),
    }]
  })
}

/** The signed-in approver's mails, newest request first (pending on top). */
export const myMails = computed(() => {
  const order: Record<MailState, number> = { pending: 0, upcoming: 1, approved: 2, returned: 3, withdrawn: 4 }
  return mailsFor(projects, session.userId).sort((x, y) => order[x.state] - order[y.state])
})
export const mailboxOf = (id: string) => {
  const n = person(id)?.name.split(' ')[0].toLowerCase() ?? id
  return `${n}.${id}@stream.co.th`
}
