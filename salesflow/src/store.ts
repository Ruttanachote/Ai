import { computed, reactive } from 'vue'
import { APPROVAL_CHAIN, type Approval, type Leave, type OutboxMail, type Role, type StageKey, type WeeklyReport } from './data/model'
import { PEOPLE, PROJECTS, TICKETS, person, groupOf, GROUP_NAME } from './data/mock'

// Demo session — in production this comes from Microsoft Entra ID (app roles claim).
export const session = reactive({
  signedIn: false,
  role: 'sm' as Role,
  userId: 'rk',
})

export const ROLE_USER: Record<Role, string> = {
  sm: 'rk', head: 'sw', deputy: 'kr', exec: 'tc', pmo: 'pj', opn: 'op', pm: 'ak', dev: 'dev3', ma: 'wm', callcenter: 'cc', admin: 'tc',
}

export function setRole(r: Role, userId?: string) {
  session.role = r
  session.userId = userId ?? ROLE_USER[r]
}
/** Dev-team accounts (one per person — SA, BA, UX/UI, Front-end, Back-end, DevOps, QA). */
export const devAccounts = () => PEOPLE.filter((p) => p.role === 'dev').sort((a, b) => (a.team ?? '').localeCompare(b.team ?? '') || (a.position ?? '').localeCompare(b.position ?? ''))

import { seedDocs } from './data/seedDocs'
seedDocs(PROJECTS)
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
import { DEFAULT_HOURS } from './domain/timesheet'
export const SETTINGS = reactive({ tolerancePct: 2, gpDropPct: 3, approvalValidDays: 60, hours: { ...DEFAULT_HOURS }, channels: { email: true, teams: true } })

export function moveStage(id: string, to: StageKey, note: string, by: string) {
  const p = projects.find((x) => x.id === id)
  if (!p) return
  const from = p.stage
  p.stage = to
  p.history.push({ stage: to, note, at: 'วันนี้', by })
  p.activities ??= []
  p.activities.unshift({ id: 'st' + Date.now(), at: TODAY_ISO, who: by, type: 'stage', text: `เปลี่ยนสถานะ${note ? ' — ' + note : ''}`, from, to })
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
    { who: person(submitterId)?.name ?? '', whoId: submitterId, role: submitLabel, status: 'approved', at: 'วันนี้', signature: signatures[submitterId]?.dataUrl, signedAt: signatures[submitterId] ? TODAY_ISO : undefined },
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

/* ---------------- Scheduled jobs (07:00 daily in production) + outbox ---------------- */
import { dailyJobs } from './domain/scheduler'
import { TODAY_ISO } from './data/mock'
export const outbox = reactive<OutboxMail[]>([])
export const weeklyReports = reactive<WeeklyReport[]>([])
export const jobLog = reactive<{ at: string; count: number; items: { rule: string; text: string; to: string }[] }[]>([])
const sentKeys = new Set<string>()
let mailNo = 1
/** Run the daily job now: notices in-app (+ email / Teams per channel settings), mails to the outbox. */
export function runScheduler(forceWeekly = false) {
  const headOf = (team: string) => PEOPLE.find((u) => u.role === 'head' && (u.team === team || groupOf(u.team ?? '') === groupOf(team)))?.id
  const { jobs, reports } = dailyJobs(projects, tickets, leaves, TODAY_ISO, { headOf, maLead: 'wm', forceWeekly })
  const fresh = jobs.filter((j) => !sentKeys.has(j.key))
  fresh.forEach((j) => {
    sentKeys.add(j.key)
    notifications.unshift({ id: nid++, to: j.to, text: j.text, link: j.link, at: 'งานอัตโนมัติ 07:00', read: false })
    if (j.mail && SETTINGS.channels[j.mail.kind]) outbox.unshift({ id: 'm' + mailNo++, at: TODAY_ISO, ...j.mail, ref: j.key })
    if (SETTINGS.channels.teams && !j.mail) outbox.unshift({ id: 'm' + mailNo++, at: TODAY_ISO, from: 'One Platform', to: j.to, subject: j.text, kind: 'teams', ref: j.key })
    if (j.apply && j.projectId) { const p = projects.find((x) => x.id === j.projectId); if (p) j.apply(p) }
  })
  reports.filter((r) => !weeklyReports.some((x) => x.id === r.id)).forEach((r) => weeklyReports.unshift(r))
  jobLog.unshift({ at: TODAY_ISO + ' 07:00', count: fresh.length, items: fresh.map((j) => ({ rule: j.rule, text: j.text, to: j.to })) })
  return fresh.length
}

/* ---------------- Approval decisions (Cost Sheet tab, Mail Inbox, email link) ---------------- */
import type { Project } from './data/model'
/**
 * Record the approver's decision on the pending step. Approve passes the request to the next
 * step (or closes it and locks the approved figures); reject sends it back to the SM with the
 * documents to fix. Same rule wherever the approver decides.
 */
import { costTotals } from './domain/salesdocs'
import type { CostSheet } from './data/model'
/** After a Cost Sheet is approved: Revenue / COGS / GP / CM go back to the project and dashboards read them. */
export function writeBack(p: Project, cs: CostSheet) {
  const t = costTotals(cs)
  p.revenue = t.revenue; p.cost = t.cogs; p.contributionMargin = t.cm
  p.financeSource = { costSheetId: cs.id, label: `จาก Cost Sheet rev.${cs.revision} · อนุมัติ ${cs.approvedAt ?? TODAY_ISO}` }
}
export function decideApproval(p: Project, kind: 'approve' | 'reject', note: string, fixDocs: string[], channel: 'web' | 'email_link' | 'mail_inbox' = 'web') {
  const a = p.approval
  if (!a) return
  const i = a.steps.findIndex((s) => s.status === 'pending')
  if (i < 0) return
  const s = a.steps[i]
  s.status = kind === 'approve' ? 'approved' : 'rejected'
  s.at = 'วันนี้'
  // The approver's e-signature goes with the decision (approve only).
  const sig = signatures[session.userId]
  if (kind === 'approve' && sig) { s.signature = sig.dataUrl; s.signedAt = TODAY_ISO }
  s.channel = channel
  s.note = ((kind === 'reject' && fixDocs.length ? `[แก้: ${fixDocs.join(', ')}] ` : '') + note) || undefined
  const cs = p.costSheets?.find((c) => c.id === a.costSheetId)
  const qt = p.quotations?.find((q) => q.id === a.quotationId)
  if (kind === 'reject') {
    a.status = 'rejected'; a.fixDocs = [...fixDocs]
    if (cs) cs.status = 'REJECTED'
    if (qt) qt.status = 'REJECTED'
  } else if (a.steps[i + 1]) a.steps[i + 1].status = 'pending'
  else {
    a.status = 'approved'
    if (a.snapshot) { p.revenue = a.snapshot.revenue; p.cost = a.snapshot.cost }
    // Approved: lock both documents and write the figures back to the project.
    if (cs) { cs.status = 'APPROVED'; cs.approvedAt = TODAY_ISO; writeBack(p, cs) }
    if (qt) { qt.status = 'APPROVED'; qt.approvedAt = TODAY_ISO }
  }
  p.activities ??= []
  p.activities.unshift({ id: 'a' + Date.now(), at: TODAY_ISO, who: s.who, type: 'approval', text: `${s.role}: ${kind === 'approve' ? 'อนุมัติ' : 'ส่งกลับแก้ไข'} ${a.version}${s.note ? ' — ' + s.note : ''}` })
  const sm = a.submittedBy ?? p.sm
  const next = kind === 'approve' ? a.steps[i + 1] : undefined
  outbox.unshift({ id: 'm' + mailNo++, at: TODAY_ISO, from: 'One Platform', to: sm, kind: 'email', ref: p.id + ':' + a.version + ':' + i,
    subject: kind === 'reject' ? `[Cost Sheet] ${p.name} ${a.version} — ส่งกลับแก้ไข` : next ? `[Cost Sheet] ${p.name} ${a.version} — ผ่านขั้น ${s.role} ส่งต่อ ${next.who}` : `[Cost Sheet] ${p.name} ${a.version} — อนุมัติครบทุกขั้น` })
  if (next?.whoId) outbox.unshift({ id: 'm' + mailNo++, at: TODAY_ISO, from: 'One Platform', to: next.whoId, kind: 'email', ref: p.id + ':' + a.version + ':next', subject: `[Cost Sheet] ${p.name} — ขออนุมัติ ${a.version}` })
  pushNotices([{ to: sm, projectId: p.id, text: kind === 'reject' ? `${s.who} ส่งกลับ ${p.name} ${a.version} ให้แก้ไข` : next ? `${s.who} อนุมัติ ${p.name} แล้ว — รอ ${next.who}` : `${p.name} ${a.version} อนุมัติครบแล้ว` }])
  notifications[0].link = `/projects/${p.id}`
}

/** Mails the approver has opened in Mail Inbox (key: projectId:version). */
export const mailRead = reactive(new Set<string>(['p3:rev.2', 'p4:rev.2']))
export const mailStarred = reactive(new Set<string>())

/* ---------------- Team administration (admin) ---------------- */
import type { Team, TeamChange } from './data/model'
import { TEAMS, SALES_TEAMS } from './data/mock'
import { diffTeam } from './domain/teams'
/** reactive() proxies the same arrays every page reads, so changes show everywhere. */
export const teams = reactive(TEAMS)
const salesTeams = reactive(SALES_TEAMS)
export const teamLog = reactive<TeamChange[]>([
  { id: 'tl1', team: 'DT4-LC', at: '2026-01-05 09:10', by: 'tc', action: 'create', changes: [{ field: 'รหัสทีม', to: 'DT4-LC' }, { field: 'ชื่อทีม', to: 'Low Code' }, { field: 'กลุ่ม', to: 'DT4' }], reason: 'โครงสร้าง DT SBU 2026 (แยกจาก BU3)' },
  { id: 'tl2', team: 'DT4-LC', at: '2026-04-01 14:22', by: 'tc', action: 'update', changes: [{ field: 'เป้ายอดขาย', from: '฿35,000,000', to: '฿40,000,000' }], reason: 'ปรับเป้าครึ่งปีหลัง' },
  { id: 'tl3', team: 'DT4-LC', at: '2026-06-15 10:05', by: 'tc', action: 'update', changes: [{ field: 'หัวหน้าทีม', to: 'Somkiat L.' }] },
  { id: 'tl4', team: 'DT4-AI', at: '2026-01-05 09:12', by: 'tc', action: 'create', changes: [{ field: 'รหัสทีม', to: 'DT4-AI' }, { field: 'ชื่อทีม', to: 'AI' }], reason: 'โครงสร้าง DT SBU 2026' },
])
let tlNo = 10
const nowStamp = () => `${TODAY_ISO} ${new Date().toTimeString().slice(0, 5)}`
const nameOf = (id?: string) => person(id)?.name ?? ''
/** Add a team or save edits; records who changed which field. Returns the number of changed fields. */
export function saveTeam(draft: Team, isNew: boolean, by: string, reason?: string) {
  if (isNew) {
    const t = { ...draft, active: true }
    teams.push(t)
    if (t.kind === 'sales') salesTeams.push(teams[teams.length - 1])
    teamLog.unshift({ id: 'tl' + tlNo++, team: t.code, at: nowStamp(), by, action: 'create', changes: diffTeam({}, t, nameOf), reason })
    return 1
  }
  const t = teams.find((x) => x.code === draft.code)
  if (!t) return 0
  const changes = diffTeam(t, draft, nameOf)
  if (!changes.length) return 0
  const wasSales = t.kind === 'sales'
  Object.assign(t, draft)
  if (!wasSales && t.kind === 'sales') salesTeams.push(t)
  if (wasSales && t.kind !== 'sales') salesTeams.splice(salesTeams.indexOf(t), 1)
  teamLog.unshift({ id: 'tl' + tlNo++, team: t.code, at: nowStamp(), by, action: 'update', changes, reason })
  return changes.length
}
export function setTeamActive(code: string, active: boolean, by: string, reason: string) {
  const t = teams.find((x) => x.code === code)
  if (!t) return
  teamLog.unshift({ id: 'tl' + tlNo++, team: code, at: nowStamp(), by, action: active ? 'activate' : 'deactivate', changes: diffTeam(t, { ...t, active }, nameOf), reason })
  t.active = active
}

/* ---------------- SM personal sales target (set by the SM on the SM Dashboard) ---------------- */
export const smTargets = reactive<Record<string, number>>({ rk: 40_000_000, np: 35_000_000 })
export const smTargetLog = reactive<{ who: string; at: string; from?: number; to: number; note?: string }[]>([
  { who: 'rk', at: '2026-01-08', to: 40_000_000, note: 'ตั้งเป้าปี 2569' },
  { who: 'np', at: '2026-01-09', to: 35_000_000, note: 'ตั้งเป้าปี 2569' },
])
export function setSmTarget(who: string, amount: number, note?: string) {
  smTargetLog.unshift({ who, at: TODAY_ISO, from: smTargets[who], to: amount, note })
  smTargets[who] = amount
}

/* ---------------- Profile + e-Signature ---------------- */
/** Roles that sign approval documents: SM submits, executives approve (admin for support). */
export const SIGNER_ROLES: Role[] = ['sm', 'deputy', 'exec', 'head', 'ma', 'admin']
export interface SignatureRec { dataUrl: string; method: 'draw' | 'type'; updatedAt: string }
/** A handwriting-style demo signature for seeded people (production: drawn by the person). */
const demoSig = (name: string) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="120" viewBox="0 0 360 120"><text x="18" y="78" font-family="'Segoe Script','Brush Script MT','Snell Roundhand',cursive" font-size="46" fill="#1f2a5a">${name}</text><path d="M20 92 C 120 82, 220 104, 330 86" stroke="#1f2a5a" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`)
export const signatures = reactive<Record<string, SignatureRec>>({
  kr: { dataUrl: demoSig('Kittiya R.'), method: 'type', updatedAt: '2026-10-01' },
  tc: { dataUrl: demoSig('Thanakorn C.'), method: 'type', updatedAt: '2026-10-01' },
  np: { dataUrl: demoSig('Nattapong P.'), method: 'type', updatedAt: '2026-10-02' },
})
export const signatureLog = reactive<{ who: string; at: string; text: string }[]>([])
export function setSignature(who: string, dataUrl: string, method: 'draw' | 'type') {
  signatureLog.unshift({ who, at: TODAY_ISO, text: signatures[who] ? 'เปลี่ยนลายเซ็น' : 'สร้างลายเซ็น' })
  signatures[who] = { dataUrl, method, updatedAt: TODAY_ISO }
}
export function removeSignature(who: string) { delete signatures[who]; signatureLog.unshift({ who, at: TODAY_ISO, text: 'ลบลายเซ็น' }) }
/** Profile details the person can edit (the rest comes from Microsoft Entra ID). */
export const profiles = reactive<Record<string, { phone?: string; notify: { email: boolean; teams: boolean; inapp: boolean } }>>({})
export const profileOf = (id: string) => (profiles[id] ??= { phone: '', notify: { email: true, teams: true, inapp: true } })
// Seeded approvals: attach the approvers' demo signatures to steps they already approved.
for (const p of PROJECTS) for (const s of p.approval?.steps ?? []) if (s.status === 'approved' && s.whoId && signatures[s.whoId]) { s.signature = signatures[s.whoId].dataUrl; s.signedAt = s.at }
