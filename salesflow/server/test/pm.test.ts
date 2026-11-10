import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Project } from '../../src/data/model.ts'
import { addMonths, dueRounds, planRounds, roundDates, roundState } from '../../src/domain/pm.ts'

const proj = (o: Partial<Project> = {}): Project => ({
  id: 'p', code: 'C', name: 'P', customer: '', endUser: '', type: 'พัฒนาระบบ', stage: 'warranty', team: 'DT4-LC', revenue: 1, cost: 1, budget: 1,
  sm: 'rk', sales: ['S'], collaborators: [], nextStep: '', cover: '', history: [], startWarranty: '2026-01-31', endWarranty: '2027-01-30', ...o,
})

test('addMonths clamps to month end', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28')
  assert.equal(addMonths('2026-01-31', 3), '2026-04-30')
  assert.equal(addMonths('2026-11-15', 3), '2027-02-15')
})

test('rounds every 1 / 3 / 6 months from the first date until warranty ends', () => {
  assert.equal(roundDates({ cycle: 1, first: '2026-02-15' }, '2027-01-31').length, 12)
  assert.deepEqual(roundDates({ cycle: 3, first: '2026-03-05' }, '2026-12-05'), ['2026-03-05', '2026-06-05', '2026-09-05', '2026-12-05'])
  assert.deepEqual(roundDates({ cycle: 6, first: '2026-05-28' }, '2026-11-28'), ['2026-05-28', '2026-11-28'])
})

test('re-planning keeps rounds already prepared or sent', () => {
  const p = proj({ pmPlan: { cycle: 3, first: '2026-04-30', leadDays: 14, template: 't' } })
  p.pmRounds = planRounds(p)
  p.pmRounds[0].status = 'sent'
  p.pmPlan = { ...p.pmPlan!, cycle: 6 }
  const again = planRounds(p)
  assert.equal(again[0].status, 'sent')
  assert.deepEqual(again.map((r) => r.due), ['2026-04-30', '2026-10-30'])
  assert.deepEqual(again.map((r) => r.no), [1, 2])
})

test('round state: prepare inside lead days, ready → MA sends, late after due, sent = done', () => {
  const plan = { leadDays: 10 }
  assert.equal(roundState({ id: 'a', no: 1, due: '2026-11-15', status: 'planned' }, plan, '2026-11-01'), 'upcoming')
  assert.equal(roundState({ id: 'a', no: 1, due: '2026-11-15', status: 'planned' }, plan, '2026-11-06'), 'prepare')
  assert.equal(roundState({ id: 'a', no: 1, due: '2026-11-15', status: 'ready' }, plan, '2026-11-06'), 'toSend')
  assert.equal(roundState({ id: 'a', no: 1, due: '2026-11-05', status: 'ready' }, plan, '2026-11-06'), 'late')
  assert.equal(roundState({ id: 'a', no: 1, due: '2026-11-05', status: 'sent' }, plan, '2026-11-06'), 'done')
  const p = proj({ pmPlan: { cycle: 1, first: '2026-02-15', leadDays: 10, template: 't' } })
  p.pmRounds = planRounds(p).map((r) => (r.due < '2026-11-01' ? { ...r, status: 'sent' as const } : r))
  assert.deepEqual(dueRounds([p], '2026-11-06').map((x) => [x.r.due, x.state]), [['2026-11-15', 'prepare']])
})
