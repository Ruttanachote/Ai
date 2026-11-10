import { computed, reactive } from 'vue'
import { APPROVAL_CHAIN, type Approval, type Leave, type Role, type StageKey } from './data/model'
import { PROJECTS, TICKETS, person, groupOf, GROUP_NAME } from './data/mock'

// Demo session — in production this comes from Microsoft Entra ID (app roles claim).
export const session = reactive({
  signedIn: false,
  role: 'sm' as Role,
  userId: 'rk',
})

export const ROLE_USER: Record<Role, string> = {
  sm: 'rk', head: 'sw', deputy: 'kr', exec: 'tc', pmo: 'pj', opn: 'op', pm: 'ak', dev: 'dev3', ma: 'wm', callcenter: 'cc', admin: 'tc',
}

export function setRole(r: Role) {
  session.role = r
  session.userId = ROLE_USER[r]
}

export const projects = reactive(PROJECTS)
/** Helpdesk tickets — Call center adds them, MA works them; one list for every page. */
export const tickets = reactive(TICKETS)

/**
 * The single project scope every page starts from, so a menu shows the same set of
 * projects (and therefore the same totals) wherever it appears.
 *   SM   — projects they own or collaborate on
 *   Head — every project of their DT group (DT4 → DT4-1, DT4-2), including revenue splits
 *   PM   — projects they manage or work on
 *   MA / Call center — from delivery (MA takes over at hand-off) to warranty, plus MA contracts
 *   OPN  — won projects (procurement and project finance)
 *   Deputy, Exec, PMO, Admin — everything
 */
export const scope = computed(() => {
  const me = person(session.userId)
  const group = me?.team ? groupOf(me.team) : undefined
  switch (session.role) {
    case 'sm':
      return { label: 'โครงการของคุณ', list: projects.filter((p) => p.sm === session.userId || p.collaborators.includes(session.userId)) }
    case 'head': {
      const inGroup = (t: string) => groupOf(t) === group
      return { label: GROUP_NAME[group ?? ''] ?? `ทีม ${group}`, teams: (t: string) => inGroup(t), list: projects.filter((p) => inGroup(p.team) || (p.splits ?? []).some((x) => inGroup(x.team))) }
    }
    case 'pm':
      return { label: 'โครงการที่คุณดูแล', list: projects.filter((p) => p.pm === session.userId || p.collaborators.includes(session.userId)) }
    case 'dev':
      return { label: 'โครงการที่คุณเป็นสมาชิก', list: projects.filter((p) => p.workspace?.members?.some((m) => m.userId === session.userId)) }
    case 'ma':
    case 'callcenter':
      return { label: 'โครงการในระยะประกันและ MA', list: projects.filter((p) => ['delivery', 'warranty', 'ended'].includes(p.stage) || p.type === 'MA') }
    case 'opn':
      return { label: 'โครงการที่ชนะแล้ว', list: projects.filter((p) => ['win', 'handover', 'delivery', 'warranty'].includes(p.stage)) }
    default:
      return { label: 'ทุกทีม DT', list: [...projects] }
  }
})

/** Admin-tunable approval thresholds (Settings → ลำดับการอนุมัติ). */
export const SETTINGS = reactive({ tolerancePct: 2, gpDropPct: 3, approvalValidDays: 60 })

export function moveStage(id: string, to: StageKey, note: string, by: string) {
  const p = projects.find((x) => x.id === id)
  if (!p) return
  p.stage = to
  p.history.push({ stage: to, note, at: 'วันนี้', by })
}

/** Feedback messages — rendered by Naive UI's message API in App (see Feedback.vue). */
export const toast = reactive({ text: '', show: false, seq: 0, kind: 'success' as 'success' | 'warning' | 'error' | 'info' })
let timer: number | undefined
export function notify(text: string, kind: 'success' | 'warning' | 'error' | 'info' = 'success') {
  toast.text = text
  toast.kind = kind
  toast.seq += 1
  toast.show = true
  clearTimeout(timer)
  timer = window.setTimeout(() => (toast.show = false), 3200)
}

/** Who holds each approval role today (from Entra ID App Roles in production). */
export const APPROVER_OF: Partial<Record<Role, string>> = { deputy: 'kr', exec: 'tc' }

/** Steps for a new Cost Sheet + Quotation request: submitter, then the DT approval chain in order. */
export function newApprovalSteps(submitterId: string, submitLabel: string): Approval['steps'] {
  return [
    { who: person(submitterId)?.name ?? '', whoId: submitterId, role: submitLabel, status: 'approved', at: 'วันนี้' },
    ...APPROVAL_CHAIN.map((c, i) => ({
      who: person(APPROVER_OF[c.role])?.name ?? c.label, whoId: APPROVER_OF[c.role], role: c.label, approver: c.role,
      status: (i === 0 ? 'pending' : 'waiting') as 'pending' | 'waiting',
    })),
  ]
}

/** A step can be decided by the role it names (admin may act for support cases). */
export const canDecideStep = (step: { approver?: Role } | undefined, role: Role) => !!step?.approver && (step.approver === role || role === 'admin')

/** In-app notifications (also sent by e-mail / Teams through the server outbox in production). */
export const notifications = reactive<{ id: number; to: string; text: string; link: string; at: string; read: boolean }[]>([
  { id: 1, to: 'ak', text: 'SPP-4 หน้าจอตรวจสอบเอกสารของเจ้าหน้าที่ — ย้ายไป Code Review', link: '/work/p6', at: '6 พ.ย. 10:24', read: false },
  { id: 2, to: 'dev3', text: 'คุณถูกมอบหมาย SPP-7 ปรับ callback รับผลการชำระเงิน', link: '/work/p6', at: '5 พ.ย. 17:41', read: false },
])
let nid = 10
export function pushNotices(list: { to: string; text: string; projectId: string }[]) {
  list.forEach((n) => notifications.unshift({ id: nid++, to: n.to, text: n.text, link: `/work/${n.projectId}`, at: 'เมื่อสักครู่', read: false }))
}

/** Leave declarations (log) — not synced with HR. Seed: dev2 12–13 Nov (overlaps SPP-8), dev4 half day 11 Nov. */
export const leaves = reactive<Leave[]>([
  {
    id: 'lv1', who: 'dev2', from: '2026-11-12', to: '2026-11-13', part: 'full', type: 'personal', note: 'ธุระที่ต่างจังหวัด', createdAt: '2026-11-03', status: 'active',
    impacts: [{ projectId: 'p6', taskId: 't4', key: 'SPP-8', title: 'Dashboard สถิติคำขอรายเดือน', start: '2026-11-02', due: '2026-11-14', action: 'before', resolved: true }],
    log: [{ at: '3 พ.ย. 09:12', who: 'dev2', text: 'แจ้งลา 12–13 พ.ย. (ลากิจ) · กระทบ 1 งาน' }, { at: '3 พ.ย. 09:12', who: 'dev2', text: 'SPP-8: ทำเสร็จก่อนลา' }],
  },
  {
    id: 'lv2', who: 'dev4', from: '2026-11-11', to: '2026-11-11', part: 'pm', type: 'sick', createdAt: '2026-11-06', status: 'active', impacts: [],
    log: [{ at: '6 พ.ย. 08:40', who: 'dev4', text: 'แจ้งลาครึ่งวันบ่าย 11 พ.ย. (ลาป่วย) · ไม่กระทบงาน' }],
  },
])
