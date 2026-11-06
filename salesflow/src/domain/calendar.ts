// Thai business calendar — used for e-GP appeal windows, approval SLAs and ticket SLAs.
// Holidays are maintained by Admin each year (Settings → ปฏิทินวันทำการ).

export interface BusinessCalendar {
  id: string
  /** 0 = Sunday … 6 = Saturday */
  workdays: number[]
  holidays: string[]
}

export const TH_GOV_2026: BusinessCalendar = {
  id: 'th-gov',
  workdays: [1, 2, 3, 4, 5],
  holidays: [
    '2026-01-01', '2026-01-02', '2026-03-03', '2026-04-06', '2026-04-13', '2026-04-14', '2026-04-15',
    '2026-05-01', '2026-05-04', '2026-06-01', '2026-06-03', '2026-07-28', '2026-07-29', '2026-08-12',
    '2026-10-13', '2026-10-23', '2026-12-07', '2026-12-10', '2026-12-31',
    '2027-01-01', '2027-02-22', '2027-04-06', '2027-04-13', '2027-04-14', '2027-04-15',
  ],
}

const iso = (d: Date) => d.toISOString().slice(0, 10)
const utc = (s: string) => new Date(s.slice(0, 10) + 'T00:00:00Z')

export function isWorkday(day: string, cal: BusinessCalendar = TH_GOV_2026) {
  const d = utc(day)
  return cal.workdays.includes(d.getUTCDay()) && !cal.holidays.includes(iso(d))
}

/** The date `n` working days after `from` (the start day itself is not counted). */
export function addWorkingDays(from: string, n: number, cal: BusinessCalendar = TH_GOV_2026) {
  const d = utc(from)
  let left = n
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1)
    if (isWorkday(iso(d), cal)) left--
  }
  return iso(d)
}

export function addDays(from: string, n: number) {
  const d = utc(from)
  d.setUTCDate(d.getUTCDate() + n)
  return iso(d)
}
