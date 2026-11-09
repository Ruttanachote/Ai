// PM workspace engine: configurable workflow, transition rules, per-item history, automation,
// worklog → OT, epic ↔ contract milestone sync and burndown. Pure — callers pass "who" and "today".
import type { AutomationRule, MemberRole, Project, Sprint, Task, Workflow, WorkflowStatus, WorkspaceMember, WorkspaceTemplate, WorkStatus } from '../data/model.ts'
import { addDays, keyOf, record, typeOf } from './work.ts'

const S = (id: string, name: string, category: WorkStatus, wipLimit?: number): WorkflowStatus => ({ id, name, category, wipLimit })

/** Default workflow per template — the DT standard, editable per workspace. */
export function defaultWorkflow(t: WorkspaceTemplate): Workflow {
  if (t === 'kanban') return { statuses: [S('todo', 'To Do', 'todo'), S('doing', 'In Progress', 'doing', 4), S('done', 'Done', 'done')], transitions: [], requireAcceptanceForDone: false }
  const statuses = [
    S('todo', 'To Do', 'todo'), S('doing', 'In Progress', 'doing'), S('review', 'Code Review', 'review'),
    S('readyqa', 'Ready for QA', 'review'), S('qa', 'QA', 'review'),
    ...(t === 'milestone' ? [S('uat', 'UAT ลูกค้า', 'review')] : []),
    S('done', 'Done', 'done'),
  ]
  const ids = statuses.map((x) => x.id)
  // Forward one step at a time, back to any earlier step; Done only from the last check (QA / UAT).
  const transitions = ids.flatMap((from, i) => [
    ...(i < ids.length - 1 ? [{ from, to: ids[i + 1], roles: ids[i + 1] === 'done' ? (['qa', 'pm', 'lead'] as MemberRole[]) : undefined }] : []),
    ...ids.slice(0, i).map((to) => ({ from, to })),
  ])
  return { statuses, transitions, requireAcceptanceForDone: true }
}

export function defaultAutomation(wf: Workflow): AutomationRule[] {
  const qa = wf.statuses.find((s) => s.id === 'readyqa')
  return [
    ...(qa ? [{ id: 'a1', on: true, label: `ย้ายไป ${qa.name} → มอบหมายให้ QA ของทีม`, when: { toStatus: qa.id }, then: { assignRole: 'qa' as MemberRole, notify: 'assignee' as const } }] : []),
    { id: 'a2', on: true, label: 'ย้ายไป Done → แจ้งผู้แจ้งงาน', when: { toStatus: wf.statuses[wf.statuses.length - 1].id }, then: { notify: 'reporter' } },
  ]
}

export const workflowOf = (p: Project) => p.workspace?.workflow ?? defaultWorkflow(p.workspace?.template ?? 'milestone')

/** The workflow status an item is in (falls back to the first status of its category). */
export function statusOf(p: Project, t: Task): WorkflowStatus {
  const wf = workflowOf(p)
  return wf.statuses.find((s) => s.id === t.statusId) ?? wf.statuses.find((s) => s.category === t.status) ?? wf.statuses[0]
}

export const memberRole = (p: Project, userId: string): MemberRole | undefined => p.workspace?.members?.find((m) => m.userId === userId)?.role

export interface MoveCheck { ok: boolean; reason?: string }

/** May `userId` move `t` to status `to`? Checks the transition table, role, WIP limit and DoD. */
export function canMove(p: Project, t: Task, to: string, userId: string, opts: { isAdmin?: boolean } = {}): MoveCheck {
  const wf = workflowOf(p)
  const from = statusOf(p, t).id
  const target = wf.statuses.find((s) => s.id === to)
  if (!target) return { ok: false, reason: 'ไม่พบสถานะนี้ใน Workflow' }
  if (from === to) return { ok: true }
  const role = memberRole(p, userId)
  if (!role && !opts.isAdmin) return { ok: false, reason: 'คุณไม่ได้เป็นสมาชิกของพื้นที่งานนี้' }
  if (role === 'viewer') return { ok: false, reason: 'สิทธิ์ดูอย่างเดียว' }
  if (wf.transitions.length) {
    const rule = wf.transitions.find((x) => (x.from === from || x.from === '*') && x.to === to)
    if (!rule) return { ok: false, reason: `Workflow ไม่อนุญาตให้ย้ายจาก ${statusOf(p, t).name} ไป ${target.name} โดยตรง` }
    if (rule.roles?.length && !opts.isAdmin && !(role && rule.roles.includes(role))) return { ok: false, reason: `ย้ายไป ${target.name} ได้เฉพาะ ${rule.roles.join(' / ').toUpperCase()}` }
  }
  if (target.wipLimit && (p.tasks ?? []).filter((x) => x.id !== t.id && statusOf(p, x).id === target.id).length >= target.wipLimit)
    return { ok: false, reason: `${target.name} เต็มแล้ว (จำกัด ${target.wipLimit} งาน)` }
  if (target.category === 'done' && wf.requireAcceptanceForDone && (t.acceptance ?? []).some((a) => !a.done))
    return { ok: false, reason: 'ยังติ๊ก Acceptance criteria ไม่ครบ (Definition of Done)' }
  return { ok: true }
}

/** Statuses the user may move this item to right now (for dropdowns). */
export const allowedTargets = (p: Project, t: Task, userId: string, isAdmin = false) =>
  workflowOf(p).statuses.filter((s) => s.id === statusOf(p, t).id || canMove(p, t, s.id, userId, { isAdmin }).ok)

export function logChange(t: Task, who: string, field: string, from: string | undefined, to: string | undefined, today: string, at = 'เมื่อสักครู่') {
  if ((from ?? '') === (to ?? '')) return
  t.history = [{ at, day: today, who, field, from, to }, ...(t.history ?? [])]
  t.updated = today
}

export interface Notice { to: string; text: string; projectId: string; key: string }

/** Move an item, record history + activity, run automation, sync milestones. Returns notices to send. */
export function moveItem(p: Project, t: Task, to: string, who: string, today: string, opts: { isAdmin?: boolean } = {}): { ok: boolean; reason?: string; notices: Notice[] } {
  const check = canMove(p, t, to, who, opts)
  if (!check.ok) return { ...check, notices: [] }
  const before = statusOf(p, t)
  const target = workflowOf(p).statuses.find((s) => s.id === to)!
  if (before.id === to) return { ok: true, notices: [] }
  t.statusId = target.id
  t.status = target.category
  logChange(t, who, 'สถานะ', before.name, target.name, today)
  record(p, who, t, `เปลี่ยนสถานะเป็น ${target.name}`, today)
  const notices = runAutomation(p, t, to, who, today)
  syncMilestones(p)
  return { ok: true, notices }
}

export function runAutomation(p: Project, t: Task, to: string, who: string, today: string): Notice[] {
  const out: Notice[] = []
  for (const r of (p.workspace?.automation ?? []).filter((x) => x.on && x.when.toStatus === to)) {
    if (r.then.assignRole) {
      const m = pickMember(p.workspace?.members ?? [], r.then.assignRole, p.tasks ?? [])
      if (m && m !== t.assignee) {
        logChange(t, 'automation', 'ผู้รับผิดชอบ', t.assignee, m, today)
        t.assignee = m
      }
    }
    const target = r.then.notify === 'pm' ? p.pm : r.then.notify === 'reporter' ? t.reporter : t.assignee
    if (target && target !== who) out.push({ to: target, projectId: p.id, key: keyOf(t), text: `${keyOf(t)} ${t.title} — ${r.label.split('→')[0].trim()}` })
  }
  return out
}

/** Least-loaded member with the role (open items count). */
function pickMember(members: WorkspaceMember[], role: MemberRole, items: Task[]) {
  const c = members.filter((m) => m.role === role)
  if (!c.length) return undefined
  const load = (id: string) => items.filter((t) => t.assignee === id && t.status !== 'done').length
  return [...c].sort((a, b) => load(a.userId) - load(b.userId))[0].userId
}

/** Epic progress drives the contract milestone it belongs to; a finished epic marks the milestone delivered. */
export function syncMilestones(p: Project) {
  for (const m of p.milestones ?? []) {
    const epics = (p.tasks ?? []).filter((t) => typeOf(t) === 'epic' && t.milestone === m.name)
    if (!epics.length) continue
    const kids = (p.tasks ?? []).filter((t) => typeOf(t) !== 'epic' && t.milestone === m.name)
    if (kids.length) m.progress = Math.round((kids.filter((k) => k.status === 'done').length / kids.length) * 100)
    if (epics.every((e) => e.status === 'done') && (!m.state || m.state === 'planned')) { m.state = 'delivered'; m.progress = 100 }
  }
}

/** Worklog adds to spent hours; overtime entries raise an OT request for the PM to approve. */
export function addWorklog(p: Project, t: Task, who: string, day: string, hours: number, overtime: boolean, note: string, today: string) {
  if (!(hours > 0)) return
  t.worklogs = [{ who, day, hours, overtime, note }, ...(t.worklogs ?? [])]
  t.spent = (t.spent ?? 0) + hours
  logChange(t, who, 'บันทึกเวลา', undefined, `${hours} ชม.${overtime ? ' (OT)' : ''}`, today)
  if (overtime) {
    const rate = p.workspace?.hourlyRate ?? 600
    p.ot = [...(p.ot ?? []), { id: 'ot' + Date.now().toString(36), who, week: day, hours, amount: hours * rate, reason: `${keyOf(t)} ${note || t.title}`, status: 'pending' }]
  }
}

export const sizeOf = (p: Project, t: Task) => (p.workspace?.estimate === 'points' ? t.storyPoints ?? 0 : t.hours ?? 0)

/** Day an item reached a done-category status, from its history (undefined = not done). */
export function doneDay(p: Project, t: Task) {
  if (t.status !== 'done') return undefined
  const doneNames = workflowOf(p).statuses.filter((s) => s.category === 'done').map((s) => s.name)
  return t.history?.find((h) => h.field === 'สถานะ' && doneNames.includes(h.to ?? ''))?.day ?? t.updated
}

/** Burndown: remaining size per day of the sprint, plus the ideal straight line. */
export function burndown(p: Project, sp: Sprint, today: string) {
  const items = (p.tasks ?? []).filter((t) => t.sprint === sp.id && typeOf(t) !== 'epic')
  const total = items.reduce((s, t) => s + sizeOf(p, t), 0)
  const days: string[] = []
  for (let d = sp.start; d <= sp.end; d = addDays(d, 1)) days.push(d)
  const n = Math.max(1, days.length - 1)
  return {
    total,
    points: days.map((day, i) => ({
      day,
      ideal: Math.round((total - (total * i) / n) * 10) / 10,
      remaining: day > today ? undefined : items.filter((t) => { const dd = doneDay(p, t); return !dd || dd > day }).reduce((s, t) => s + sizeOf(p, t), 0),
    })),
  }
}

/** Velocity: completed size per closed sprint. */
export const velocity = (p: Project) =>
  (p.workspace?.sprints ?? []).filter((s) => s.state === 'closed').map((s) => ({ name: s.name, committed: s.committed ?? 0, completed: s.completed ?? 0 }))

/** Close a sprint: snapshot committed/completed and move open items to the chosen sprint or backlog. */
export function completeSprint(p: Project, sprintId: string, moveTo: string | '', who: string, today: string) {
  const sp = p.workspace?.sprints?.find((s) => s.id === sprintId)
  if (!sp) return { done: 0, open: 0 }
  const items = (p.tasks ?? []).filter((t) => t.sprint === sprintId && typeOf(t) !== 'epic')
  const open = items.filter((t) => t.status !== 'done')
  sp.committed = items.reduce((s, t) => s + sizeOf(p, t), 0)
  sp.completed = items.filter((t) => t.status === 'done').reduce((s, t) => s + sizeOf(p, t), 0)
  open.forEach((t) => { logChange(t, who, 'Sprint', sp.name, p.workspace?.sprints?.find((s) => s.id === moveTo)?.name ?? 'Backlog', today); t.sprint = moveTo || undefined })
  sp.state = 'closed'
  return { done: items.length - open.length, open: open.length }
}
