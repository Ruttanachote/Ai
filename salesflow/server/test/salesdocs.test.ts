import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { CostSheet, Quotation } from '../../src/data/model.ts'
import { costTotals, foldersFor, linesFromCostSheet, lineCost, quoteTotals, standardName, uploadError, validateCostSheet, validateQuotation } from '../../src/domain/salesdocs.ts'

// The example in Cost_Sheet_Template (ระบบสะสมคะแนนร้านชาไข่มุก).
const example = (o: Partial<CostSheet> = {}): CostSheet => ({
  id: 'c', docNo: 'CS-2026-0001', revision: 1, status: 'DRAFT', source: 'form', preparedAt: '2026-10-26', createdBy: 'rk',
  revenue: [
    { id: 'r1', type: 'Hardware', description: 'ใส่คำอธิบายตัวอย่าง', qty: 1, unitPrice: 80_000_000 },
    { id: 'r2', type: 'Software', description: 'ใส่คำอธิบายตัวอย่าง', qty: 1, unitPrice: 3_200_000 },
  ],
  payments: [0.1, 0.4, 0.3, 0.1, 0.1],
  costs: [
    { id: 'c1', group: 'consulting', description: 'ใส่คำอธิบายตัวอย่าง', qty: 1, unitPrice: 10_000_000 },
    { id: 'c2', group: 'contingency', sub: 'Contingency (5%)', description: '', qty: 0.05 },
  ],
  ...o,
})

test('matches the template example: revenue, payments, COGS, GP, margin, contingency, CM', () => {
  const t = costTotals(example())
  assert.equal(t.revenue, 83_200_000)
  assert.equal(t.revenueVat, 89_024_000)
  assert.deepEqual(t.byPayment, [8_320_000, 33_280_000, 24_960_000, 8_320_000, 8_320_000])
  assert.equal(t.cogs, 41_600_000) // Consulting cost = F18 × D37 / (1 + D37)
  assert.equal(t.gp, 41_600_000)
  assert.equal(t.gmPct, 50)
  assert.equal(t.contingency, 4_160_000) // F18 × 5%
  assert.equal(t.totalExpense, 45_760_000)
  assert.equal(t.cm, 37_440_000)
  assert.equal(t.cmPct, 45)
})

test('row formulas per group: D×E, training ×3, interest on hardware + software', () => {
  const cs = example({ costs: [
    { id: 'h', group: 'hardware', description: 'x', qty: 2, unitPrice: 100 },
    { id: 's', group: 'software', description: 'x', qty: 1, unitPrice: 300 },
    { id: 't', group: 'training', description: 'x', qty: 2, unitPrice: 10 },
    { id: 'f', group: 'financial', sub: 'Interest', description: 'x', qty: 0.05, unitPrice: 2 },
    { id: 'm', group: 'manday', description: 'x', qty: 10, unitPrice: 6500 },
    { id: 'i', group: 'inter', sub: 'Imp SVC', description: 'x', qty: 1, unitPrice: 999 },
  ] })
  assert.equal(lineCost(cs.costs[2], cs), 60)
  assert.equal(lineCost(cs.costs[3], cs), 50) // 0.05 × 2 × (200 + 300)
  const t = costTotals(cs)
  assert.equal(t.cogs, 560)
  assert.equal(t.manday, 10)
  assert.equal(t.directVariable, 50 + 65_000)
  assert.equal(t.transfer, 999) // internal transfer is shown but not in Total Expense
  assert.equal(t.totalExpense, 560 + 65_050)
})

test('validation: payments must total 100%, loss needs a reason, low margin warns', () => {
  assert.ok(validateCostSheet(example({ payments: [0.5, 0.4, 0, 0, 0] })).errors.payments)
  const loss = example({ costs: [{ id: 'x', group: 'outsource', description: 'x', qty: 1, unitPrice: 90_000_000 }] })
  assert.ok(validateCostSheet(loss).errors.lossReason)
  assert.equal(validateCostSheet({ ...loss, lossReason: 'กลยุทธ์' }).errors.lossReason, undefined)
  assert.ok(validateCostSheet(example({ costs: [{ id: 'x', group: 'outsource', description: 'x', qty: 1, unitPrice: 70_000_000 }] })).warn.gm)
})

const qt = (o: Partial<Quotation> = {}): Quotation => ({
  id: 'q', docNo: 'QT-2026-0001', revision: 7, status: 'DRAFT', costSheetId: 'c', issueDate: '2026-10-26', validUntil: '2026-11-25', contact: 'Witthawat Yapanun', projectName: 'ระบบสะสมคะแนนร้านชาไข่มุก',
  items: linesFromCostSheet(example()).map((l, i) => ({ id: String(i), ...l })), discount: 0,
  termOfPayment: '', termOfDelivery: '', vatIncluded: true, warranty: '', salesPerson: 'Witthawat Yapanun', remark: '', createdBy: 'rk', createdAt: '2026-10-26', ...o,
})

test('quotation lines mirror the cost sheet revenue; totals match the template example', () => {
  const t = quoteTotals(qt())
  assert.equal(qt().items.length, 2)
  assert.equal(t.total, 83_200_000)
  assert.equal(t.subtotal, 83_200_000)
  assert.equal(t.vat, 5_824_000)
  assert.equal(t.grand, 89_024_000)
  assert.deepEqual(validateQuotation(qt(), 83_200_000), { errors: {}, warn: {} })
})

test('quotation rules: discount ≤ total, valid-until ≥ date, contact required, discount flags a mismatch', () => {
  assert.ok(validateQuotation(qt({ discount: 90_000_000 })).errors.discount)
  assert.ok(validateQuotation(qt({ validUntil: '2026-10-01' })).errors.validUntil)
  assert.ok(validateQuotation(qt({ contact: '' })).errors.contact)
  assert.ok(validateQuotation(qt({ discount: 200_000 }), 83_200_000).warn.match)
})

test('upload rules and standard names', () => {
  assert.match(uploadError('setup.exe', 100, 'tor'), /ไม่รองรับ/)
  assert.match(uploadError('big.pdf', 60 * 1024 * 1024, 'tor'), /เกิน 50 MB/)
  assert.equal(uploadError('tor.pdf', 20 * 1024 * 1024, 'tor'), '')
  assert.match(uploadError('cost.xlsx', 11 * 1024 * 1024, 'cost-sheet'), /เกิน 10 MB/)
  assert.equal(standardName('PIP-69-0098', 'Official PO', 2, '2026-11-10', 'scan.PDF'), 'PIP-69-0098_OfficialPO_v2_20261110.pdf')
  assert.ok(!foldersFor('MA').some((f) => f.code === 'training'))
})

import { stageChecklist } from '../../src/domain/nextstep.ts'
import { requirementsFor } from '../../src/domain/rules.ts'
import type { Project } from '../../src/data/model.ts'
test('next-step checklist covers every requirement and points to where to fix it', () => {
  const p = { id: 'p', code: 'C', name: 'P', customer: '', endUser: '', type: 'พัฒนาระบบ', stage: 'pipeline', team: 'DT4-LC', revenue: 1, cost: 1, budget: 1, sm: 'rk', sales: [], collaborators: [], nextStep: '', cover: '', history: [] } as unknown as Project
  const list = stageChecklist(p, 'forecast', '2026-11-10')
  // TOR review is listed as its own step even while TOR itself is still missing.
  assert.equal(list.filter((i) => !i.ok && i.id !== 'torReview').length, requirementsFor('forecast', p, '2026-11-10').length)
  assert.deepEqual(list.find((i) => i.id === 'customer')?.fix, { kind: 'edit', field: 'customer' })
  assert.deepEqual(list.find((i) => i.id === 'approval')?.fix, { kind: 'tab', tab: 'cost' })
})
