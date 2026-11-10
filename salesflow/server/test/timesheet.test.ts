import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dayHours, splitHours, timesheet, weekOf } from '../../src/domain/timesheet.ts'

test('working day is Mon–Fri 08:30–17:30 minus lunch = 8 h', () => {
  assert.equal(dayHours(), 8)
})

test('split normal vs OT on a working day (lunch excluded)', () => {
  assert.deepEqual(splitHours('2026-11-09', '08:30', '17:30'), { total: 8, normal: 8, ot: 0, dayOff: false })
  assert.deepEqual(splitHours('2026-11-09', '13:00', '20:00'), { total: 7, normal: 4.5, ot: 2.5, dayOff: false })
  assert.deepEqual(splitHours('2026-11-09', '07:30', '09:30'), { total: 2, normal: 1, ot: 1, dayOff: false })
  assert.deepEqual(splitHours('2026-11-09', '11:00', '14:00'), { total: 2, normal: 2, ot: 0, dayOff: false })
})

test('weekends and public holidays are all OT; bad ranges log nothing', () => {
  assert.deepEqual(splitHours('2026-11-07', '09:00', '12:00'), { total: 3, normal: 0, ot: 3, dayOff: true }, 'Saturday')
  assert.equal(splitHours('2026-12-07', '09:00', '11:00').dayOff, true, 'substitute holiday')
  assert.equal(splitHours('2026-11-09', '17:00', '16:00').total, 0)
})

test('weekly timesheet flags past working days logged under 8 h', () => {
  const logs = [{ who: 'a', day: '2026-11-02', hours: 8 }, { who: 'a', day: '2026-11-03', hours: 5 }, { who: 'a', day: '2026-11-03', hours: 2, overtime: true }, { who: 'b', day: '2026-11-04', hours: 8 }]
  const w = timesheet(logs, 'a', weekOf('2026-11-04'), '2026-11-05')
  assert.equal(w[0].day, '2026-11-02')
  assert.deepEqual(w.slice(0, 4).map((d) => [d.normal, d.ot, d.short]), [[8, 0, false], [5, 2, true], [0, 0, true], [0, 0, false]])
  assert.equal(w[5].work, false)
})
