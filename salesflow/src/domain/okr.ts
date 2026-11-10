// Monthly OKR report for the sales teams: one Objective (close the year's target) measured by
// four Key Results, per team or per SM, plus what moved this month and what should close next.
// Pure functions — the report page, the Excel file and the PDF are all built from okrReport().
import { stageOf, type Project, type StageKey } from '../data/model.ts'
import { bookedValue, isOpen, isWon, pipelineValue, teamShare, weightedValue } from './metrics.ts'
import { targetStatus, yearElapsed, type TargetStatus } from './executive.ts'

const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
export const monthLabel = (ym: string) => `${TH_MONTH[Number(ym.slice(5, 7)) - 1]} ${Number(ym.slice(0, 4)) + 543}`

/**
 * Dates in project history come as ISO ("2026-10-14"), Thai with a Buddhist year ("15 ต.ค. 69")
 * or Thai with a time and no year ("20 ต.ค. 10:30" — this year). Returns ISO, or '' if unknown.
 */
export function parseDay(s: string | undefined, today: string): string {
  if (!s) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  if (s === 'วันนี้') return today
  const m = s.match(/^(\d{1,2})\s+(\S+?)\s+(\d{2,4})?/)
  if (!m) return ''
  const mon = TH_MONTH.indexOf(m[2])
  if (mon < 0) return ''
  // "20 ต.ค. 10:30" has a time instead of a year → this year.
  const n = m[3] && !s.includes(':') ? Number(m[3]) : 0
  const y = !n ? Number(today.slice(0, 4)) : n < 100 ? n + 2500 - 543 : n > 2400 ? n - 543 : n
  return `${y}-${String(mon + 1).padStart(2, '0')}-${String(Number(m[1])).padStart(2, '0')}`
}

const firstOf = (p: Project, stages: StageKey[]) => p.history.find((h) => stages.includes(h.stage))
/** Day the deal was won: the Close Win history entry, else when it entered its current won stage. */
export function wonDay(p: Project, today: string) {
  if (!isWon(p)) return ''
  const h = firstOf(p, ['win'])
  return parseDay(h?.at, today) || p.startProject || p.stageSince || ''
}
/** Day the opportunity was registered. */
export const openedDay = (p: Project, today: string) => parseDay(p.history[0]?.at, today) || (p.stage === 'opportunity' ? p.stageSince ?? '' : '')
export const lostDay = (p: Project, today: string) => (p.stage === 'lose' ? parseDay([...p.history].reverse().find((h) => h.stage === 'lose')?.at, today) || p.stageSince || '' : '')

/** Key Result goals. Coverage = (weighted pipeline) ÷ (target still to close). */
export const KR_GOALS = { coverage: 1.5, newOppPerMonth: 2, winRate: 0.4 }

export type KrKey = 'booked' | 'coverage' | 'newOpp' | 'winRate'
export interface KeyResult { key: KrKey; label: string; actual: number; goal: number; unit: 'baht' | 'x' | 'count' | 'pct'; score: number; status: 'ok' | 'warn' | 'bad' }
export interface OkrUnit {
  key: string; name: string; sub?: string; target: number
  wonYtd: number; wonMonth: number; pace: number; pct: number; gap: number
  open: number; weighted: number; coverage: number
  newOpp: number; newOppValue: number; won: number; lost: number; winRate: number | null
  monthly: number[]; status: TargetStatus; krs: KeyResult[]
}
export interface UnitDef { key: string; name: string; sub?: string; target: number; heads?: number; share: (p: Project) => number }

const status = (score: number): KeyResult['status'] => (score >= 0.95 ? 'ok' : score >= 0.7 ? 'warn' : 'bad')
const clamp = (n: number) => Math.max(0, Math.min(1, n))

export function okrUnit(def: UnitDef, all: Project[], month: string, today: string): OkrUnit {
  const year = month.slice(0, 4)
  const asOf = month < today.slice(0, 7) ? lastDay(month) : today
  const list = all.filter((p) => def.share(p) > 0)
  const v = (p: Project, f: (p: Project) => number) => f(p) * def.share(p)
  const won = list.filter((p) => isWon(p) && wonDay(p, today).startsWith(year) && wonDay(p, today) <= asOf)
  const monthly = Array.from({ length: 12 }, (_, i) => won.filter((p) => wonDay(p, today).slice(5, 7) === String(i + 1).padStart(2, '0')).reduce((s, p) => s + v(p, bookedValue), 0))
  const wonYtd = won.reduce((s, p) => s + v(p, bookedValue), 0)
  const wonMonth = won.filter((p) => wonDay(p, today).startsWith(month)).reduce((s, p) => s + v(p, bookedValue), 0)
  const open = list.filter(isOpen)
  const weighted = open.reduce((s, p) => s + v(p, weightedValue), 0)
  const gap = Math.max(0, def.target - wonYtd)
  const coverage = gap ? weighted / gap : weighted ? 9.99 : 1
  const fresh = list.filter((p) => openedDay(p, today).startsWith(month))
  const lostYtd = list.filter((p) => lostDay(p, today).startsWith(year))
  const decided = won.length + lostYtd.length
  const winRate = decided ? won.length / decided : null
  const pace = def.target * yearElapsed(asOf)
  const oppGoal = KR_GOALS.newOppPerMonth * (def.heads ?? 1)
  const krs: KeyResult[] = [
    { key: 'booked', label: 'ยอด Close Win สะสม เทียบเป้าตามเวลา', actual: wonYtd, goal: pace, unit: 'baht', score: pace ? clamp(wonYtd / pace) : 1, status: 'ok' },
    { key: 'coverage', label: `Pipeline ถ่วงน้ำหนัก ครอบคลุมยอดที่ยังขาด ≥ ${KR_GOALS.coverage} เท่า`, actual: coverage, goal: KR_GOALS.coverage, unit: 'x', score: clamp(coverage / KR_GOALS.coverage), status: 'ok' },
    { key: 'newOpp', label: `โครงการใหม่ (Opportunity) ในเดือน ≥ ${oppGoal} โครงการ`, actual: fresh.length, goal: oppGoal, unit: 'count', score: clamp(fresh.length / oppGoal), status: 'ok' },
    { key: 'winRate', label: `อัตราชนะ (Win rate) สะสม ≥ ${KR_GOALS.winRate * 100}%`, actual: winRate ?? 0, goal: KR_GOALS.winRate, unit: 'pct', score: winRate === null ? 1 : clamp(winRate / KR_GOALS.winRate), status: 'ok' },
  ]
  krs.forEach((k) => (k.status = status(k.score)))
  return {
    key: def.key, name: def.name, sub: def.sub, target: def.target, wonYtd, wonMonth, pace, pct: def.target ? wonYtd / def.target : 0, gap,
    open: open.reduce((s, p) => s + v(p, pipelineValue), 0), weighted, coverage,
    newOpp: fresh.length, newOppValue: fresh.reduce((s, p) => s + v(p, pipelineValue), 0), won: won.length, lost: lostYtd.length, winRate,
    monthly, status: targetStatus(wonYtd, weighted, def.target, asOf), krs,
  }
}

function lastDay(ym: string) {
  const d = new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0))
  return d.toISOString().slice(0, 10)
}

export interface Movement { p: Project; day: string; kind: 'new' | 'won' | 'lost' | 'stage'; to: StageKey; note: string; value: number }
export interface OkrReport {
  month: string; label: string; asOf: string; units: OkrUnit[]; total: OkrUnit
  movements: Movement[]; nextClose: { p: Project; day: string; value: number; weighted: number }[]
  losses: { reason: string; count: number; value: number }[]; stalled: { p: Project; days: number }[]
  objective: string
}

/** The whole report for a set of units (teams or SMs) over the projects the viewer may see. */
export function okrReport(defs: UnitDef[], all: Project[], month: string, today: string, total: Omit<UnitDef, 'share'>): OkrReport {
  const units = defs.map((d) => okrUnit(d, all, month, today))
  const totalUnit = okrUnit({ ...total, heads: defs.reduce((s, d) => s + (d.heads ?? 1), 0), share: (p) => defs.reduce((s, d) => s + d.share(p), 0) }, all, month, today)
  const inScope = all.filter((p) => defs.some((d) => d.share(p) > 0))
  const movements: Movement[] = []
  for (const p of inScope) {
    if (openedDay(p, today).startsWith(month)) movements.push({ p, day: openedDay(p, today), kind: 'new', to: 'opportunity', note: 'ลงทะเบียนโครงการใหม่', value: pipelineValue(p) })
    for (const h of p.history.slice(1)) {
      const day = parseDay(h.at, today)
      if (!day.startsWith(month)) continue
      movements.push({ p, day, kind: h.stage === 'win' ? 'won' : h.stage === 'lose' ? 'lost' : 'stage', to: h.stage, note: h.note, value: isWon(p) ? bookedValue(p) : pipelineValue(p) })
    }
    if (p.history.length === 1 && p.history[0].stage !== 'opportunity') {
      const day = parseDay(p.history[0].at, today)
      if (day.startsWith(month)) movements.push({ p, day, kind: p.history[0].stage === 'win' ? 'won' : 'stage', to: p.history[0].stage, note: p.history[0].note, value: isWon(p) ? bookedValue(p) : pipelineValue(p) })
    }
  }
  movements.sort((a, b) => a.day.localeCompare(b.day))
  const horizon = addMonths(month, 3)
  const nextClose = inScope.filter((p) => isOpen(p) && p.expectedClose && p.expectedClose.slice(0, 7) > month && p.expectedClose.slice(0, 7) <= horizon)
    .map((p) => ({ p, day: p.expectedClose!, value: pipelineValue(p), weighted: weightedValue(p) }))
    .sort((a, b) => a.day.localeCompare(b.day))
  const lossMap = new Map<string, { reason: string; count: number; value: number }>()
  for (const p of inScope.filter((x) => lostDay(x, today).startsWith(month.slice(0, 4)))) {
    const r = p.loss?.reason ?? 'ไม่ระบุเหตุผล'
    const e = lossMap.get(r) ?? { reason: r, count: 0, value: 0 }
    e.count++; e.value += pipelineValue(p); lossMap.set(r, e)
  }
  const stalled = inScope.filter((p) => isOpen(p) && p.stageSince).map((p) => ({ p, days: Math.round((Date.parse(today) - Date.parse(p.stageSince!)) / 864e5) }))
    .filter((x) => x.days > (stageOf(x.p.stage).staleDays ?? 999)).sort((a, b) => b.days - a.days)
  return {
    month, label: monthLabel(month), asOf: month < today.slice(0, 7) ? lastDay(month) : today, units, total: totalUnit,
    movements, nextClose, losses: [...lossMap.values()].sort((a, b) => b.value - a.value), stalled,
    objective: `หาโครงการและปิดยอดขายให้ได้ตามเป้า ปี ${Number(month.slice(0, 4)) + 543}`,
  }
}

export function addMonths(ym: string, n: number) {
  const d = new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + n, 1))
  return d.toISOString().slice(0, 7)
}

/** Unit definitions: a sales team gets its revenue-split share, an SM the full value of deals they own. */
export const teamUnit = (t: { code: string; name: string; target?: number; headcount?: number }, sms = 1): UnitDef =>
  ({ key: t.code, name: t.code, sub: t.name, target: t.target ?? 0, heads: sms, share: (p) => teamShare(p, t.code) })
export const smUnit = (id: string, name: string, team: string | undefined, target: number): UnitDef =>
  ({ key: id, name, sub: team, target, heads: 1, share: (p) => (p.sm === id ? 1 : 0) })
