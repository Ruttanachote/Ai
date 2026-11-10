import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Project, Team } from '../../src/data/model.ts'
import { stepIndex, targetStatus, teamStat, trackOf, yearElapsed } from '../../src/domain/executive.ts'

const proj = (o: Partial<Project> = {}): Project => ({
  id: 'p', code: 'C', name: 'P', customer: '', endUser: '', type: 'พัฒนาระบบ', stage: 'pipeline', team: 'DT4-LC', revenue: 10, cost: 5, budget: 10,
  sm: 'rk', sales: ['Sirinya B.'], collaborators: [], nextStep: '', cover: '', history: [], ...o,
})
const T = '2026-11-06'

test('presale steps: propose → bid (with Sale name) → result', () => {
  assert.equal(trackOf(proj({ stage: 'opportunity' }), T).step, 'propose')
  const f = trackOf(proj({ stage: 'forecast' }), T)
  assert.equal(f.step, 'bid')
  assert.equal(f.waitingOn, 'Sirinya B.')
  assert.equal(trackOf(proj({ stage: 'rebidding', bid: { method: 'e-bidding', submit: '2026-11-20' } }), T).step, 'bid')
  const r = trackOf(proj({ stage: 'rebidding', bid: { method: 'e-bidding', submit: '2026-11-01', resultDue: '2026-11-03' } }), T)
  assert.equal(r.step, 'result')
  assert.equal(r.tone, 'warn') // result date passed
})

test('pending price approval shows who it waits on', () => {
  const p = proj({ approval: { version: 'v1', submittedAt: '', status: 'pending', steps: [{ who: 'A', role: 'SM', status: 'approved' }, { who: 'Kittiya R.', role: 'รองผู้บริหาร DT', status: 'pending', approver: 'deputy' }] } })
  const t = trackOf(p, T)
  assert.equal(t.step, 'propose')
  assert.equal(t.waitingOn, 'Kittiya R.')
})

test('award, notify dev team, find PM', () => {
  assert.equal(trackOf(proj({ stage: 'win' }), T).step, 'awarded')
  assert.equal(trackOf(proj({ stage: 'win', devNotified: '2026-11-01' }), T).step, 'staffing')
  assert.equal(trackOf(proj({ stage: 'handover' }), T).waitingOn, 'PMO')
  const lose = trackOf(proj({ stage: 'lose', loss: { reason: 'ราคาสูงกว่าคู่แข่ง' } }), T)
  assert.equal(lose.closed, 'lose')
  assert.equal(stepIndex(lose.step), stepIndex('awarded'))
})

test('delivery: develop, test, deliver; warranty is MA', () => {
  const ms = (progress: number, extra = {}) => [{ name: 'งวด 1', start: '2026-10-01', end: '2026-12-01', progress, ...extra }]
  assert.equal(trackOf(proj({ stage: 'delivery', milestones: ms(40) }), T).step, 'develop')
  assert.equal(trackOf(proj({ stage: 'delivery', milestones: ms(95) }), T).step, 'test')
  assert.equal(trackOf(proj({ stage: 'delivery', milestones: ms(100, { sentAt: '2026-11-02' }) }), T).step, 'deliver')
  assert.equal(trackOf(proj({ stage: 'delivery', milestones: [{ name: 'x', start: '2026-09-01', end: '2026-10-01', progress: 50 }] }), T).tone, 'bad')
  assert.equal(trackOf(proj({ stage: 'warranty' }), T).step, 'ma')
})

test('team target status is pro-rated by the year elapsed', () => {
  const e = yearElapsed(T)
  assert.ok(e > 0.84 && e < 0.86)
  assert.equal(targetStatus(90, 0, 100, T), 'ontrack')
  assert.equal(targetStatus(50, 60, 100, T), 'atrisk')
  assert.equal(targetStatus(50, 10, 100, T), 'behind')
})

test('teamStat counts projects by phase and credits revenue splits', () => {
  const team: Team = { code: 'DT4-AI', name: 'AI', group: 'DT4', kind: 'sales', target: 100 }
  const list = [
    proj({ id: 'a', team: 'DT4-AI', stage: 'delivery', revenue: 40 }),
    proj({ id: 'b', team: 'DT4-LC', stage: 'warranty', revenue: 100, splits: [{ team: 'DT4-LC', pct: 70 }, { team: 'DT4-AI', pct: 30 }] }),
    proj({ id: 'c', team: 'DT4-AI', stage: 'pipeline' }),
  ]
  const s = teamStat(team, list, T, 6, 0.8)
  assert.equal(s.won, 70)
  assert.equal(s.delivery, 1)
  assert.equal(s.ma, 1)
  assert.equal(s.presale, 1)
  assert.equal(s.headcount, 6)
})
