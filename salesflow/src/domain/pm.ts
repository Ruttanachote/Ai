// Preventive Maintenance rounds: the cycle (1 / 3 / 6 months) and first date are agreed in the
// proposal; rounds run until the warranty (or MA contract) ends. The dev team prepares the report
// from the template, hands it to the MA team, and MA sends it from the central mailbox.
import type { PmPlan, PmRound, Project } from '../data/model.ts'
import { addDays } from './work.ts'

export function addMonths(iso: string, n: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1 + n, 1))
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate()
  t.setUTCDate(Math.min(d, last)) // 31 Jan + 1 month → 28/29 Feb
  return t.toISOString().slice(0, 10)
}

/** Due dates from `first` every `cycle` months, up to and including `end`. */
export function roundDates(plan: Pick<PmPlan, 'cycle' | 'first'>, end: string) {
  const out: string[] = []
  for (let i = 0, d = plan.first; d <= end && i < 120; i++, d = addMonths(plan.first, plan.cycle * i)) out.push(d)
  return out
}

/** Build or refresh rounds: keeps rounds already prepared/sent, re-plans the future ones. */
export function planRounds(p: Project): PmRound[] {
  if (!p.pmPlan || !p.endWarranty) return p.pmRounds ?? []
  const keep = (p.pmRounds ?? []).filter((r) => r.status !== 'planned')
  const dates = roundDates(p.pmPlan, p.endWarranty)
  return dates.map((due, i) => keep.find((r) => r.due === due) ?? { id: `${p.id}-pm${i + 1}`, no: i + 1, due, status: 'planned' as const })
    .concat(keep.filter((r) => !dates.includes(r.due)))
    .sort((a, b) => a.due.localeCompare(b.due))
    .map((r, i) => ({ ...r, no: i + 1 }))
}

export type RoundState = 'done' | 'late' | 'toSend' | 'prepare' | 'upcoming'
/** What the round needs today. */
export function roundState(r: PmRound, plan: Pick<PmPlan, 'leadDays'>, today: string): RoundState {
  if (r.status === 'sent') return 'done'
  if (r.due < today) return 'late'
  if (r.status === 'ready') return 'toSend'
  if (addDays(r.due, -plan.leadDays) <= today) return 'prepare'
  return 'upcoming'
}
export const STATE_LABEL: Record<RoundState, { label: string; tone: string }> = {
  done: { label: 'ส่งลูกค้าแล้ว', tone: 'win' }, late: { label: 'เลยกำหนด', tone: 'lose' }, toSend: { label: 'รอ MA ส่งอีเมล', tone: 'presale' },
  prepare: { label: 'ทีมพัฒนาเตรียมรายงาน', tone: 'warn' }, upcoming: { label: 'ยังไม่ถึงรอบ', tone: '' },
}

/** Rounds that need someone to act now (prepare, send or late), soonest first. */
export function dueRounds(projects: Project[], today: string) {
  return projects.flatMap((p) => (p.pmPlan ? (p.pmRounds ?? []).map((r) => ({ p, r, state: roundState(r, p.pmPlan!, today) })) : []))
    .filter((x) => x.state !== 'done' && x.state !== 'upcoming')
    .sort((a, b) => a.r.due.localeCompare(b.r.due))
}

export const nextRound = (p: Project, today: string) => (p.pmRounds ?? []).find((r) => r.status !== 'sent' && r.due >= today)

/** Renewal notices to the customer: round 1 at 3 months, round 2 at 1 month before warranty ends. */
export const RENEWAL_NOTICES = [{ days: 90, label: 'รอบที่ 1 (3 เดือนก่อนหมดประกัน)' }, { days: 30, label: 'รอบที่ 2 (1 เดือนก่อนหมดประกัน)' }]

/** Warranty runs `months` from the start date, ending the day before the anniversary. */
export const warrantyEnd = (start: string, months: number) => addDays(addMonths(start, months), -1)

/** MA confirms the hand-over from the PM: the project enters warranty and PM rounds are planned. */
export function acceptIntoWarranty(p: Project, by: string, today: string) {
  if (!p.maHandover) return false
  const months = p.terms?.warrantyMonths ?? 12
  p.maHandover.acceptedAt = today
  p.maHandover.acceptedBy = by
  p.stage = 'warranty'
  p.startWarranty = p.deliveredAt ?? today
  p.endWarranty = warrantyEnd(p.startWarranty, months)
  p.stageSince = today
  if (p.pmPlan) p.pmRounds = planRounds(p)
  return true
}
