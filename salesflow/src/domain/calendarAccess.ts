// Who sees what on the central calendar: your own items and your own team's, as far as your
// role is allowed. Pure functions — the calendar page and the tests use the same rules.
import type { Meeting, Person, Project, Role } from '../data/model.ts'

export const groupOf = (team = '') => (team.startsWith('DT4') ? 'DT4' : team.startsWith('DT3') ? 'DT3' : team.split('-')[0])
const ALL_SEEING: Role[] = ['exec', 'deputy', 'admin']

/** Members of the projects a PM runs count as the PM's team for leave. */
export function projectTeam(pmId: string, projects: Project[]) {
  const ids = new Set<string>()
  for (const p of projects) if (p.pm === pmId) for (const m of p.workspace?.members ?? []) ids.add(m.userId)
  return ids
}

/**
 * Leave: everyone sees their own. SM — only their own (team leave is not their concern).
 * Group head — the whole group. PM — own team (PMs) and the people on projects they run.
 * PMO, OPN, MA, Call center, Dev — their own team. Executives and Admin — everyone.
 */
export function canSeeLeave(viewer: Person, role: Role, owner: Person | undefined, pmTeam: Set<string> = new Set()): boolean {
  if (!owner) return false
  if (owner.id === viewer.id) return true
  if (ALL_SEEING.includes(role)) return true
  if (role === 'sm') return false
  if (role === 'head') return groupOf(owner.team) === groupOf(viewer.team)
  if (role === 'pm' && pmTeam.has(owner.id)) return true
  return !!viewer.team && owner.team === viewer.team
}

/**
 * Meetings: the ones you attend or organise, or of a project you own as SM / PM.
 * Group head, PMO, executives and Admin also see the meetings of the projects in their scope.
 */
export function canSeeMeeting(viewerId: string, role: Role, m: Meeting, p: Project): boolean {
  if (m.attendees.includes(viewerId) || m.by === viewerId || p.sm === viewerId || p.pm === viewerId) return true
  return ['head', 'pmo', ...ALL_SEEING].includes(role)
}

/** One line for the page header: what this role's calendar contains. */
export function calendarScopeText(role: Role, team?: string): string {
  if (ALL_SEEING.includes(role)) return 'ทุกทีม DT'
  if (role === 'sm') return 'เฉพาะของคุณ (โครงการ ประชุม และการลาของคุณ)'
  if (role === 'head') return `ของคุณและทีมในกลุ่ม ${groupOf(team)}`
  if (role === 'pm') return `ของคุณ ทีม ${team ?? ''} และสมาชิกโครงการที่คุณดูแล`
  return `ของคุณและทีม ${team ?? ''}`
}
