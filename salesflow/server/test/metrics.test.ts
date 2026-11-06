import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Project } from '../../src/data/model.ts'
import {
  pipelineValue, bookedValue, dealValue, weightedValue, teamShare, teamTotals, sum, isOpen, isWon,
  approvalState, pendingStep, bondReturnDue, warrantyBucket, health, progressPct,
} from '../../src/domain/metrics.ts'

const p = (o: Partial<Project>): Project => ({
  id: 'x', code: 'X', name: 'X', customer: '', endUser: '', type: 'พัฒนาระบบ', stage: 'pipeline', team: 'DT4-2',
  revenue: 0, cost: 0, budget: 0, sm: 'rk', sales: [], collaborators: [], nextStep: '', cover: '', history: [], ...o,
})

const book = [
  p({ id: 'a', stage: 'opportunity', budget: 1_000_000 }),
  p({ id: 'b', stage: 'pipeline', revenue: 18_400_000, budget: 19_500_000, splits: [{ team: 'DT4-2', pct: 70 }, { team: 'DT2', pct: 30 }] }),
  p({ id: 'c', stage: 'delivery', revenue: 9_600_000, contractValue: 9_500_000, team: 'DT4-2' }),
  p({ id: 'd', stage: 'warranty', revenue: 5_400_000, team: 'DT4-1' }),
  p({ id: 'e', stage: 'lose', revenue: 11_000_000, team: 'DT5' }),
]

test('one value rule per phase', () => {
  assert.equal(pipelineValue(book[0]), 1_000_000) // budget until a quote exists
  assert.equal(pipelineValue(book[1]), 18_400_000)
  assert.equal(bookedValue(book[2]), 9_500_000) // contract beats quote
  assert.equal(bookedValue(book[3]), 5_400_000)
  assert.equal(dealValue(book[2]), 9_500_000)
  assert.equal(weightedValue(book[1]), 18_400_000 * 0.45)
  assert.equal(weightedValue(book[2]), 0)
})

test('team totals add up to the company total (splits sum to 100%)', () => {
  const teams = ['DT1', 'DT2', 'DT3', 'DT4-1', 'DT4-2', 'DT5']
  const won = teams.reduce((s, t) => s + teamTotals(book, t).won, 0)
  const weighted = teams.reduce((s, t) => s + teamTotals(book, t).weighted, 0)
  assert.equal(Math.round(won), sum(book.filter(isWon), bookedValue))
  assert.equal(Math.round(weighted), Math.round(sum(book.filter(isOpen), weightedValue)))
  assert.equal(teamShare(book[1], 'DT2'), 0.3)
  assert.equal(teamShare(book[2], 'DT2'), 0)
})

test('approval state is the same label everywhere', () => {
  const steps = (a: string, b: string) => [{ who: 'a', role: 'หัวหน้า', status: a as 'approved' }, { who: 'b', role: 'ผู้บริหาร', status: b as 'approved' }]
  const base = { version: 'v1', submittedAt: '' }
  assert.equal(approvalState(p({}), '2026-11-06'), 'none')
  const pending = p({ approval: { ...base, steps: steps('approved', 'pending') } })
  assert.equal(approvalState(pending, '2026-11-06'), 'pending')
  assert.equal(pendingStep(pending, '2026-11-06')?.role, 'ผู้บริหาร')
  // a stale request is not "waiting" even though a step still says pending
  const stale = p({ approval: { ...base, status: 'stale', steps: steps('approved', 'pending') } })
  assert.equal(approvalState(stale, '2026-11-06'), 'stale')
  assert.equal(pendingStep(stale, '2026-11-06'), undefined)
  assert.equal(approvalState(p({ approval: { ...base, validUntil: '2026-10-01', steps: steps('approved', 'approved') } }), '2026-11-06'), 'expired')
  assert.equal(approvalState(p({ approval: { ...base, steps: steps('approved', 'rejected') } }), '2026-11-06'), 'rejected')
})

test('bond return dates and warranty buckets', () => {
  const bond = { kind: 'performance' as const, pct: 5, amount: 1, form: '', bank: '', issued: '', expires: '' }
  assert.equal(bondReturnDue(p({ endWarranty: '2027-01-31' }), bond), '2027-02-15')
  assert.equal(bondReturnDue(p({ bid: { method: 'e-bidding', result: '2026-05-29' } }), { ...bond, kind: 'bid' }), '2026-06-13')
  assert.deepEqual([30, 31, 120, 121].map(warrantyBucket), ['due30', 'due120', 'due120', 'later'])
})

test('delivery health and progress', () => {
  const d = p({ stage: 'delivery', milestones: [
    { name: 'A', start: '2026-07-01', end: '2026-07-31', progress: 100, paid: true, payment: 1 },
    { name: 'B', start: '2026-09-01', end: '2026-11-15', progress: 50 },
  ], tasks: [{ id: 't', title: 't', assignee: 'x', status: 'doing', due: '2026-11-01', hours: 10, spent: 12, milestone: 'B' }] })
  assert.equal(progressPct(d), 75)
  const h = health(d, '2026-11-06')
  assert.equal(h[0].tone, 'warn')
  assert.equal(h[1].tone, 'warn')
  assert.equal(h[2].note, 'รับแล้ว 1/2 งวด')
})
