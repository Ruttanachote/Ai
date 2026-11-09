// UI glue for the workflow engine: every view moves and edits work items through here, so the
// transition rules, history, automation and notifications behave the same on board, list and drawer.
import type { Project, Task } from '../../data/model'
import { TODAY_ISO } from '../../data/mock'
import { canMove, logChange, memberRole, moveItem } from '../../domain/workflow'
import { notify, pushNotices, session } from '../../store'

export const isAdmin = () => ['admin', 'pmo'].includes(session.role)
export const me = () => session.userId

export function move(p: Project, t: Task, to: string, quiet = false) {
  const r = moveItem(p, t, to, me(), TODAY_ISO, { isAdmin: isAdmin() })
  if (!r.ok) { if (!quiet) notify(r.reason ?? 'ย้ายไม่ได้', 'warning'); return false }
  pushNotices(r.notices)
  return true
}
export const check = (p: Project, t: Task, to: string) => canMove(p, t, to, me(), { isAdmin: isAdmin() })

/** Record a field edit in the item's history (and the workspace activity feed for key fields). */
export function edited(t: Task, field: string, from: unknown, to: unknown) {
  logChange(t, me(), field, from === undefined || from === '' ? undefined : String(from), to === undefined || to === '' ? undefined : String(to), TODAY_ISO)
}

/** Workspace managers: the project's PM, PM-role members, PMO and Admin. */
export const canManage = (p: Project) => isAdmin() || p.pm === me() || memberRole(p, me()) === 'pm'
/** Who can edit items at all (members except viewers, managers). */
export const canEdit = (p: Project) => canManage(p) || (!!memberRole(p, me()) && memberRole(p, me()) !== 'viewer')
