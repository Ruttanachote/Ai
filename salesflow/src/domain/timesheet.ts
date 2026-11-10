// Working hours and OT: Mon–Fri 08:30–17:30 with a 12:00–13:00 lunch = 8 h/day; Sat, Sun and
// public holidays are days off. Time logged outside working hours (or on a day off) is OT.
import { isWorkday, TH_GOV_2026, type BusinessCalendar } from './calendar.ts'
import { addDays } from './work.ts'

export interface WorkHours { start: string; end: string; lunchStart: string; lunchEnd: string; otFrom: string }
export const DEFAULT_HOURS: WorkHours = { start: '08:30', end: '17:30', lunchStart: '12:00', lunchEnd: '13:00', otFrom: '17:30' }

const min = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }
const overlap = (a1: number, a2: number, b1: number, b2: number) => Math.max(0, Math.min(a2, b2) - Math.max(a1, b1))
const round = (n: number) => Math.round(n * 100) / 100

/** Standard hours in a working day (end − start − lunch). */
export const dayHours = (w: WorkHours = DEFAULT_HOURS) => (min(w.end) - min(w.start) - (min(w.lunchEnd) - min(w.lunchStart))) / 60

/**
 * Split a time range into normal and OT hours.
 *  · day off (weekend / public holiday): everything is OT
 *  · working day: inside start–otFrom (minus lunch) is normal; before start or after otFrom is OT;
 *    lunch break itself counts as neither unless it was worked on a day off.
 * Ranges past midnight are not supported (log the next day separately).
 */
export function splitHours(day: string, from: string, to: string, w: WorkHours = DEFAULT_HOURS, cal: BusinessCalendar = TH_GOV_2026) {
  const a = min(from), b = min(to)
  if (!(b > a)) return { total: 0, normal: 0, ot: 0, dayOff: !isWorkday(day, cal) }
  if (!isWorkday(day, cal)) return { total: round((b - a) / 60), normal: 0, ot: round((b - a) / 60), dayOff: true }
  const lunch = overlap(a, b, min(w.lunchStart), min(w.lunchEnd))
  const normal = overlap(a, b, min(w.start), min(w.otFrom)) - overlap(a, b, Math.max(min(w.start), min(w.lunchStart)), Math.min(min(w.otFrom), min(w.lunchEnd)))
  const ot = (b - a) - lunch - normal
  return { total: round((b - a - lunch) / 60), normal: round(normal / 60), ot: round(Math.max(0, ot) / 60), dayOff: false }
}

/** Mon–Fri of the week containing `day` (ISO, Monday first). */
export function weekOf(day: string) {
  const d = new Date(day + 'T00:00:00Z')
  const monday = addDays(day, -((d.getUTCDay() + 6) % 7))
  return [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(monday, i))
}

/** Per-day summary for one person: logged normal / OT hours and whether a past working day is short. */
export function timesheet(logs: { who: string; day: string; hours: number; overtime?: boolean }[], who: string, days: string[], today: string, w: WorkHours = DEFAULT_HOURS, cal: BusinessCalendar = TH_GOV_2026) {
  const target = dayHours(w)
  return days.map((day) => {
    const mine = logs.filter((l) => l.who === who && l.day === day)
    const normal = round(mine.filter((l) => !l.overtime).reduce((s, l) => s + l.hours, 0))
    const ot = round(mine.filter((l) => l.overtime).reduce((s, l) => s + l.hours, 0))
    const work = isWorkday(day, cal)
    return { day, work, normal, ot, target: work ? target : 0, short: work && day < today && normal < target }
  })
}
