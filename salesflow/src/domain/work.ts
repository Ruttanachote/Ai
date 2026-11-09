// Work-item helpers for the PM workspace. Pure functions — list, board, calendar, timeline
// and summary all filter, group and sort through these, so they always agree.
import { PRIORITIES, type Project, type Task, type WorkStatus, type WorkType, type WorkspaceTemplate } from '../data/model.ts'

export interface WorkFilter { q: string; assignees: string[]; types: WorkType[]; statuses: WorkStatus[]; priorities: string[]; sprint?: string }
export const emptyFilter = (): WorkFilter => ({ q: '', assignees: [], types: [], statuses: [], priorities: [] })

export const items = (p: Project) => p.tasks ?? []
export const typeOf = (t: Task): WorkType => t.type ?? 'task'
export const keyOf = (t: Task) => t.key ?? t.id.toUpperCase()

export function matches(t: Task, f: WorkFilter) {
  const q = f.q.trim().toLowerCase()
  if (q && ![t.title, keyOf(t), ...(t.labels ?? [])].some((v) => v.toLowerCase().includes(q))) return false
  if (f.assignees.length && !f.assignees.includes(t.assignee)) return false
  if (f.types.length && !f.types.includes(typeOf(t))) return false
  if (f.statuses.length && !f.statuses.includes(t.status)) return false
  if (f.priorities.length && !f.priorities.includes(t.priority ?? 'medium')) return false
  if (f.sprint !== undefined && (t.sprint ?? '') !== f.sprint) return false
  return true
}

/** Hierarchical order for the list: epics, then their children, then grandchildren (sub-tasks). */
export function tree(list: Task[]) {
  const byParent = new Map<string, Task[]>()
  list.forEach((t) => {
    const k = t.parentId && list.some((x) => x.id === t.parentId) ? t.parentId : ''
    byParent.set(k, [...(byParent.get(k) ?? []), t])
  })
  const out: { t: Task; depth: number }[] = []
  const walk = (pid: string, depth: number) =>
    (byParent.get(pid) ?? []).sort((a, b) => keyNo(a) - keyNo(b)).forEach((t) => { out.push({ t, depth }); walk(t.id, depth + 1) })
  walk('', 0)
  return out
}
const keyNo = (t: Task) => Number((t.key ?? '').split('-')[1] ?? 0)

export type GroupBy = 'none' | 'status' | 'assignee' | 'priority' | 'type' | 'milestone' | 'sprint'
export function groupKey(t: Task, g: GroupBy): string {
  switch (g) {
    case 'status': return t.status
    case 'assignee': return t.assignee || '—'
    case 'priority': return t.priority ?? 'medium'
    case 'type': return typeOf(t)
    case 'milestone': return t.milestone || '—'
    case 'sprint': return t.sprint || 'Backlog'
    default: return ''
  }
}
export const byPriority = (a: Task, b: Task) => PRIORITIES[a.priority ?? 'medium'].rank - PRIORITIES[b.priority ?? 'medium'].rank

/** Create a work item with the next key in the workspace. */
export function newItem(p: Project, part: Partial<Task> & { title: string }, by: string, today: string): Task {
  const ws = p.workspace!
  const key = `${ws.key}-${ws.nextNo}`
  ws.nextNo += 1
  return {
    id: 'w' + Date.now().toString(36) + ws.nextNo, key, type: 'task', status: 'todo', priority: 'medium', assignee: '', reporter: by,
    due: part.due ?? '', start: part.start ?? (part.due ? today : ''), hours: 0, spent: 0, milestone: part.milestone ?? '', created: today, updated: today, ...part,
  }
}

/** Suggested key from the project code/name: SPP for "Smart Permit Platform". */
export function suggestKey(p: Project) {
  const words = p.name.replace(/[^A-Za-z ]/g, ' ').split(/\s+/).filter(Boolean)
  const k = words.length >= 2 ? words.map((w) => w[0]).join('').slice(0, 4) : (words[0] ?? p.code.replace(/[^A-Z]/g, '')).slice(0, 4)
  return (k || 'PRJ').toUpperCase()
}

/** Seed a new workspace: epics from contract milestones (milestone template) or two sprints (scrum). */
export function createWorkspace(p: Project, template: WorkspaceTemplate, key: string, by: string, today: string) {
  p.workspace = { template, key, nextNo: 1, createdAt: today }
  const existing = p.tasks ?? []
  p.tasks = existing
  if (template === 'scrum') {
    p.workspace.sprints = [
      { id: 's1', name: `${key} Sprint 1`, start: today, end: addDays(today, 13), state: 'planned', goal: 'ตั้งค่าโครงการและส่งมอบฟังก์ชันแรก' },
      { id: 's2', name: `${key} Sprint 2`, start: addDays(today, 14), end: addDays(today, 27), state: 'planned' },
    ]
  }
  if (template === 'milestone' && !existing.length) {
    ;(p.milestones ?? []).forEach((m) => p.tasks!.push(newItem(p, { title: m.name, type: 'epic', start: m.start, due: m.end, milestone: m.name, assignee: p.pm ?? by }, by, today)))
  }
  existing.forEach((t) => { if (!t.key) { t.key = `${key}-${p.workspace!.nextNo}`; p.workspace!.nextNo += 1 } })
}

export function addDays(iso: string, n: number) {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Activity feed entry (Summary → กิจกรรมล่าสุด). Newest first, capped. */
export function record(p: Project, who: string, t: Task, text: string, today: string, at = 'เมื่อสักครู่') {
  const ws = p.workspace
  if (!ws) return
  ws.activity = [{ who, at, day: today, key: keyOf(t), title: t.title, text, status: t.status }, ...(ws.activity ?? [])].slice(0, 60)
}
export const STATUS_TH: Record<string, string> = { todo: 'ยังไม่เริ่ม', doing: 'กำลังทำ', review: 'รอตรวจ', done: 'เสร็จ' }
