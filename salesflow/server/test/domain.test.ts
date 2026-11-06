import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addWorkingDays, isWorkday } from '../../src/domain/calendar.ts'
import { validateMove, validateCreate, checkContractValue, closeWinRule, handoverGate, reopenAsNew, winRate, appealWindowEnd } from '../../src/domain/rules.ts'
import type { Project } from '../../src/data/model.ts'

const base = (o: Partial<Project> = {}): Project => ({
  id: 'p', code: 'C', name: 'Test', customer: 'X', endUser: 'X', type: 'พัฒนาระบบ', stage: 'pipeline', team: 'DT2',
  revenue: 10_000_000, cost: 7_000_000, budget: 11_000_000, sm: 'rk', sales: ['Sirinya B.'], collaborators: [], nextStep: '', cover: '',
  history: [], customerAccountId: 'a1', expectedClose: '2026-12-20', ...o,
})
const approved = (rev = 10_000_000, cost = 7_000_000, validUntil = '2027-01-31') => ({
  version: 'v1', submittedAt: '', status: 'approved' as const, validUntil, snapshot: { revenue: rev, cost, gp: 30 },
  steps: [{ who: 'a', role: 'หัวหน้า', status: 'approved' as const }],
})

test('working days skip weekends and Thai holidays', () => {
  assert.equal(isWorkday('2026-12-05'), false) // Saturday
  assert.equal(isWorkday('2026-12-07'), false) // substitution holiday
  // Result Fri 4 Dec +7 working days: skips 5–6 (weekend), 7 (holiday), 10 (Constitution Day), 12–13
  assert.equal(addWorkingDays('2026-12-04', 7), '2026-12-17')
})

test('P0-7: cannot create straight into Forecast without an approved quote', () => {
  const r = validateCreate(base({ stage: 'forecast' }), '2026-11-06')
  assert.equal(r.ok, false)
  assert.ok(r.errors.some((e) => e.includes('ใบเสนอราคา')))
  assert.ok(validateCreate(base({ stage: 'opportunity', customerAccountId: undefined }), '2026-11-06').ok)
  // from Pipeline on, a deal needs at least one Sale working with the SM
  assert.ok(validateCreate(base({ stage: 'pipeline', sales: [] }), '2026-11-06').errors.some((e) => e.includes('Sale')))
})

test('P0-7: Pipeline → Forecast needs gate + approval that has not expired', () => {
  const p = base({ approval: approved(10_000_000, 7_000_000, '2026-10-01') })
  const r = validateMove(p, { to: 'forecast', today: '2026-11-06', gateChecked: true })
  assert.ok(r.errors.some((e) => e.includes('ใบเสนอราคา')))
  const ok = validateMove(base({ approval: approved() }), { to: 'forecast', today: '2026-11-06', gateChecked: true })
  assert.deepEqual(ok.errors, [])
  const noGate = validateMove(base({ approval: approved() }), { to: 'forecast', today: '2026-11-06', gateChecked: false })
  assert.equal(noGate.ok, false)
})

test('P0-2: a stale approval is not a valid approval', () => {
  const p = base({ approval: { ...approved(), status: 'stale' } })
  assert.equal(validateMove(p, { to: 'forecast', today: '2026-11-06', gateChecked: true }).ok, false)
})

test('P0-3: PO value beyond tolerance or GP drop needs post-award approval', () => {
  const p = base({ approval: approved() })
  const same = checkContractValue(p, { contractValue: 10_100_000, tolerancePct: 2, gpDropPct: 3 }, '2026-11-06')
  assert.equal(same.ok, true)
  const cut = checkContractValue(p, { contractValue: 9_000_000, tolerancePct: 2, gpDropPct: 3 }, '2026-11-06')
  assert.equal(cut.ok, false)
  assert.equal(cut.needsReapproval, true)
  assert.ok(cut.reasons.some((r) => r.includes('GP')))
  const overBid = checkContractValue(base({ approval: approved(), bid: { method: 'e-bidding', ourBid: 10_500_000 } }), { contractValue: 10_000_000, tolerancePct: 2, gpDropPct: 3 }, '2026-11-06')
  assert.ok(overBid.reasons.some((r) => r.includes('e-GP')))
})

test('P0-10: government Close Win waits for the 7-working-day appeal window', () => {
  const p = base({ stage: 'rebidding', approval: approved(), bid: { method: 'e-bidding', egpNo: '69', refPrice: 1, result: '2026-12-04' } })
  assert.equal(appealWindowEnd(p), '2026-12-17')
  assert.equal(closeWinRule(p, '2026-12-10', true).ok, false)
  assert.equal(closeWinRule(p, '2026-12-18', true).ok, true)
  assert.equal(closeWinRule(base({ bid: { method: 'เอกชน' } }), '2026-11-06', true).ok, true)
  const move = validateMove(p, { to: 'win', today: '2026-12-18', gateChecked: true, hasContractFile: true, contractValue: 10_000_000 })
  assert.deepEqual(move.errors, [])
})

test('P0-8: Close Lose needs a reason (and winner for competitor reasons); reopen creates a new record', () => {
  const p = base({ stage: 'rebidding' })
  assert.equal(validateMove(p, { to: 'lose', today: '2026-11-06', gateChecked: false }).ok, false)
  assert.equal(validateMove(p, { to: 'lose', today: '2026-11-06', gateChecked: false, loss: { code: 'ราคาสูงกว่าคู่แข่ง' } }).ok, false)
  assert.equal(validateMove(p, { to: 'lose', today: '2026-11-06', gateChecked: false, loss: { code: 'ราคาสูงกว่าคู่แข่ง', competitor: 'Y' } }).ok, true)
  const lost = base({ id: 'L', stage: 'lose', loss: { reason: 'x' } })
  assert.equal(validateMove(lost, { to: 'pipeline', today: '2026-11-06', gateChecked: true }).ok, false)
  const all = [lost, base({ id: 'W', stage: 'win' })]
  const before = winRate(all)
  const fresh = reopenAsNew(lost, 'N', 'PIP-1', '2026-11-06', 'SW')
  assert.equal(fresh.reopenedFromId, 'L')
  assert.equal(fresh.stage, 'pipeline')
  assert.equal(winRate([...all, fresh]), before)
})

test('P0-11: handover needs contract terms, PM and (for tenders) a performance bond', () => {
  const p = base({ stage: 'handover', pm: 'ak', bid: { method: 'e-bidding' } })
  assert.equal(handoverGate(p, true).ok, false)
  assert.ok(handoverGate(p, true).errors.some((e) => e.includes('ประชุม Handover ยังขาด')))
  const handover = { attendees: (['sm', 'pm', 'ma', 'opn', 'devlead'] as const).map((party) => ({ party, who: 'x', attended: true })) }
  const ready = { ...p, handover, terms: { penaltyBasis: 'whole_contract' as const, penaltyRatePerDay: 0.001, penaltyMinPerDay: 100, warrantyMonths: 12, whtRate: 0.01 as const },
    bonds: [{ kind: 'performance' as const, pct: 5, amount: 1, form: 'BG', bank: 'B', issued: '2026-01-01', expires: '2027-01-01' }] }
  assert.deepEqual(handoverGate(ready, true).errors, [])
  assert.ok(handoverGate({ ...ready, terms: { ...ready.terms, penaltyRatePerDay: 0.01 } }, true).errors.some((e) => e.includes('0.20%')))
})
