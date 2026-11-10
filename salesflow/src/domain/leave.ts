// Leave declarations: who is away which days, which open work items they overlap on the
// timeline, and who of the same workspace role could take them. Not synced with HR.
import type { ImpactAction, Leave, LeaveImpact, Project, Task } from '../data/model.ts'
import { isWorkday as isWorkingDay, TH_GOV_2026, type BusinessCalendar } from './calendar.ts'
import { addDays, keyOf, typeOf } from './work.ts'

export const isActive = (l: Leave) => l.status === 'active'

/** Working days covered by a leave (weekends and public holidays don't count). */
export function leaveDays(l: Pick<Leave, 'from' | 'to' | 'part'>, cal: BusinessCalendar = TH_GOV_2026) {
  const days: string[] = []
  for (let d = l.from; d <= l.to; d = addDays(d, 1)) if (isWorkingDay(d, cal)) days.push(d)
  return days
}
export const leaveLength = (l: Pick<Leave, 'from' | 'to' | 'part'>, cal: BusinessCalendar = TH_GOV_2026) =>
  l.part === 'full' ? leaveDays(l, cal).length : leaveDays(l, cal).length * 0.5

/** Is `userId` away on `day`? */
export const awayOn = (leaves: Leave[], userId: string, day: string) =>
  leaves.find((l) => isActive(l) && l.who === userId && l.from <= day && day <= l.to)

/** An open item of this person whose [start, due] window touches the leave. */
export function overlaps(t: Task, who: string, from: string, to: string) {
  if (typeOf(t) === 'epic' || t.status === 'done' || !t.due) return false
  if (t.assignee !== who && !(t.coAssignees ?? []).includes(who)) return false
  const start = t.start || t.due
  return start <= to && t.due >= from
}

/** Every affected item across the projects, sorted by due date. Keeps decisions already made. */
export function findImpacts(projects: Project[], who: string, from: string, to: string, previous: LeaveImpact[] = []): LeaveImpact[] {
  return projects.flatMap((p) => (p.tasks ?? []).filter((t) => overlaps(t, who, from, to)).map((t) => {
    const old = previous.find((x) => x.taskId === t.id)
    // Due inside the leave is a real risk; an item that only runs through it may still make it.
    const dueInside = t.due >= from && t.due <= to
    return old ?? { projectId: p.id, taskId: t.id, key: keyOf(t), title: t.title, start: t.start, due: t.due, action: (dueInside ? 'pending' : 'none') as ImpactAction }
  })).sort((a, b) => a.due.localeCompare(b.due))
}

/** Same workspace role, not away during the leave, fewest open items. */
export function suggestStandIn(p: Project, who: string, from: string, to: string, leaves: Leave[]) {
  const role = p.workspace?.members?.find((m) => m.userId === who)?.role
  if (!role) return []
  const load = (id: string) => (p.tasks ?? []).filter((t) => t.assignee === id && t.status !== 'done' && typeOf(t) !== 'epic').length
  return (p.workspace?.members ?? [])
    .filter((m) => m.role === role && m.userId !== who)
    .filter((m) => !leaves.some((l) => isActive(l) && l.who === m.userId && l.from <= to && l.to >= from))
    .map((m) => ({ userId: m.userId, open: load(m.userId) }))
    .sort((a, b) => a.open - b.open)
}

/** First working day after the leave — the default "move due date to". */
export function firstDayBack(to: string, cal: BusinessCalendar = TH_GOV_2026) {
  let d = addDays(to, 1)
  while (!isWorkingDay(d, cal)) d = addDays(d, 1)
  return d
}

export const unresolved = (l: Leave) => l.impacts.filter((i) => !i.resolved && (i.action === 'pending' || i.action === 'move' || i.action === 'reassign'))
