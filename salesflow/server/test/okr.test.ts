import { test } from 'node:test'
import assert from 'node:assert/strict'
import { okrReport, okrUnit, parseDay, smUnit, teamUnit, addMonths, wonDay } from '../../src/domain/okr.ts'
import type { Project } from '../../src/data/model.ts'

const T = '2026-11-06'
const proj = (o: Partial<Project>): Project => ({
  id: 'p', code: 'C', name: 'P', customer: '', endUser: '', type: 'NNS', stage: 'pipeline', team: 'DT4-LC', revenue: 10_000_000, cost: 1, budget: 1,
  sm: 'rk', collaborators: [], sales: ['S'], nextStep: '', cover: '', history: [{ stage: 'opportunity', note: '', at: '2 ก.ย. 69', by: '' }], ...o,
} as Project)

test('parseDay reads ISO, Thai Buddhist year and Thai with a time', () => {
  assert.equal(parseDay('2026-10-14', T), '2026-10-14')
  assert.equal(parseDay('15 ต.ค. 69', T), '2026-10-15')
  assert.equal(parseDay('5 ธ.ค. 68', T), '2025-12-05')
  assert.equal(parseDay('20 ต.ค. 10:30', T), '2026-10-20')
  assert.equal(parseDay('วันนี้', T), T)
  assert.equal(parseDay('??', T), '')
})

test('won value lands in the month it was won; target pace and gap', () => {
  const w = proj({ id: 'w', stage: 'delivery', revenue: 12_000_000, contractValue: 12_000_000, history: [{ stage: 'opportunity', note: '', at: '1 ก.ค. 69', by: '' }, { stage: 'win', note: '', at: '20 ต.ค. 69', by: '' }] })
  assert.equal(wonDay(w, T), '2026-10-20')
  const u = okrUnit(teamUnit({ code: 'DT4-LC', name: 'LC', target: 40_000_000 }), [w], '2026-11', T)
  assert.equal(u.wonYtd, 12_000_000)
  assert.equal(u.monthly[9], 12_000_000)
  assert.equal(u.wonMonth, 0)
  assert.equal(u.gap, 28_000_000)
  assert.equal(u.krs[0].key, 'booked')
})

test('a past month only counts what was won by its end', () => {
  const w = proj({ id: 'w', stage: 'win', revenue: 5_000_000, history: [{ stage: 'win', note: '', at: '30 ต.ค. 69', by: '' }] })
  assert.equal(okrUnit(teamUnit({ code: 'DT4-LC', name: 'LC', target: 10 }), [w], '2026-09', T).wonYtd, 0)
  assert.equal(okrUnit(teamUnit({ code: 'DT4-LC', name: 'LC', target: 10 }), [w], '2026-10', T).wonMonth, 5_000_000)
})

test('revenue split credits each team its share; SM unit counts only own deals', () => {
  const p = proj({ stage: 'win', revenue: 10_000_000, splits: [{ team: 'DT4-LC', pct: 60 }, { team: 'DT4-AI', pct: 40 }], history: [{ stage: 'win', note: '', at: '3 พ.ย. 69', by: '' }] })
  assert.equal(okrUnit(teamUnit({ code: 'DT4-AI', name: 'AI', target: 1 }), [p], '2026-11', T).wonMonth, 4_000_000)
  assert.equal(okrUnit(smUnit('np', 'N', 'DT4-AI', 1), [p], '2026-11', T).wonMonth, 0)
  assert.equal(okrUnit(smUnit('rk', 'R', 'DT4-LC', 1), [p], '2026-11', T).wonMonth, 10_000_000)
})

test('KRs: new opportunities this month, win rate and coverage', () => {
  const fresh = proj({ id: 'n', stage: 'opportunity', budget: 2_000_000, revenue: 0, history: [{ stage: 'opportunity', note: '', at: '2 พ.ย. 69', by: '' }] })
  const lost = proj({ id: 'l', stage: 'lose', loss: { reason: 'ราคาสูงกว่าคู่แข่ง' }, history: [{ stage: 'opportunity', note: '', at: '1 ก.ค. 69', by: '' }, { stage: 'lose', note: '', at: '4 พ.ย. 69', by: '' }] })
  const won = proj({ id: 'w', stage: 'win', history: [{ stage: 'win', note: '', at: '1 ส.ค. 69', by: '' }] })
  const r = okrReport([teamUnit({ code: 'DT4-LC', name: 'LC', target: 40_000_000 })], [fresh, lost, won], '2026-11', T, { key: 'all', name: 'รวม', target: 40_000_000 })
  const u = r.units[0]
  assert.equal(u.newOpp, 1)
  assert.equal(u.winRate, 0.5)
  assert.equal(r.losses[0].reason, 'ราคาสูงกว่าคู่แข่ง')
  assert.deepEqual(r.movements.map((m) => m.kind).sort(), ['lost', 'new'])
  assert.ok(u.coverage > 0)
  assert.equal(r.total.wonYtd, u.wonYtd)
})

test('next close looks three months ahead', () => {
  const a = proj({ id: 'a', expectedClose: '2026-12-20' })
  const b = proj({ id: 'b', expectedClose: '2027-04-01' })
  const r = okrReport([teamUnit({ code: 'DT4-LC', name: 'LC', target: 1 })], [a, b], '2026-11', T, { key: 'all', name: 'รวม', target: 1 })
  assert.deepEqual(r.nextClose.map((x) => x.p.id), ['a'])
  assert.equal(addMonths('2026-11', 3), '2027-02')
})
