// PM assignment: SM asks, PMO (head of the PM team) picks a PM whose skills fit the project —
// e.g. hardware installation with frequent site work vs. software development.
import type { Person, PmSkill, Project } from '../data/model.ts'

/** Skills a project needs, from its type, work scope and the selling team. */
export function projectNeeds(p: Project): { skills: PmSkill[]; onsite: boolean } {
  const team = p.team
  if (team.startsWith('DT4-IoT')) return { skills: ['iot', 'hardware'], onsite: true }
  if (p.type === 'Rental') return { skills: ['cloud', 'hardware'], onsite: true }
  if (p.type === 'MS') return { skills: ['network', 'cloud'], onsite: true }
  if (p.type === 'SUB') return { skills: ['software', 'cloud'], onsite: false }
  if (p.scope === 'hardware' || p.type === 'WT') return { skills: ['hardware', 'network'], onsite: true }
  if (p.scope === 'mixed') return { skills: ['software', 'hardware'], onsite: true }
  if (team.startsWith('DT4-AI')) return { skills: ['software', 'ai'], onsite: false }
  return { skills: ['software'], onsite: false }
}

export interface PmCandidate { pm: Person; match: number; matched: PmSkill[]; active: number; max: number; full: boolean; onsiteOk: boolean }

/** PMs ranked for a project: best skill match first, then the lightest current load. */
export function rankPms(p: Project, people: Person[], projects: Project[]): PmCandidate[] {
  const need = projectNeeds(p)
  return people
    .filter((u) => u.role === 'pm')
    .map((pm) => {
      const skills = pm.pmProfile?.skills ?? []
      const matched = need.skills.filter((s) => skills.includes(s))
      const onsiteOk = !need.onsite || !!pm.pmProfile?.onsite
      const active = projects.filter((x) => x.id !== p.id && x.pm === pm.id && ['win', 'handover', 'delivery'].includes(x.stage)).length
      const max = pm.pmProfile?.maxProjects ?? 3
      return { pm, matched, onsiteOk, active, max, full: active >= max, match: matched.length * 2 + (onsiteOk ? 1 : 0) }
    })
    .sort((a, b) => Number(a.full) - Number(b.full) || b.match - a.match || a.active - b.active)
}
