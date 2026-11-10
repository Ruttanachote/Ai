import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { CostSheet, Quotation } from '../../src/data/model.ts'
import { costTotals, foldersFor, linesFromCostSheet, quoteTotals, standardName, uploadError, validateCostSheet, validateQuotation } from '../../src/domain/salesdocs.ts'

const cs = (o: Partial<CostSheet> = {}): CostSheet => ({
  id: 'c', docNo: 'CS-2026-0001', revision: 1, status: 'DRAFT', source: 'form', projectMonths: 6, preparedAt: '2026-11-10', createdBy: 'rk',
  items: [
    { id: '1', category: 'manpower', description: 'Dev', role: 'Developer', manday: 100, rate: 5000 },
    { id: '2', category: 'hardware', description: 'Server', qty: 2, unitCost: 100000 },
    { id: '3', category: 'software', description: 'License', qty: 10, unitCost: 1000, months: 12 },
  ],
  revenue: 1_200_000, entertainment: { mode: 'pct', value: 1 }, contingency: { mode: 'baht', value: 20000 }, ...o,
})

test('cost rows follow their category formula and the summary is calculated', () => {
  const t = costTotals(cs())
  assert.equal(t.cogs, 500000 + 200000 + 120000)
  assert.equal(t.manday, 100)
  assert.equal(t.gp, 380000)
  assert.equal(t.gmPct, 31.67)
  assert.equal(t.entertainment, 12000)
  assert.equal(t.cm, 380000 - 12000 - 20000)
})

test('spec example: Revenue 1,000,000 and COGS 700,000 give GP 300,000 and 30%', () => {
  const t = costTotals(cs({ items: [{ id: 'x', category: 'other', description: 'x', amount: 700000 }], revenue: 1_000_000, entertainment: { mode: 'baht', value: 0 }, contingency: { mode: 'baht', value: 0 } }))
  assert.equal(t.gp, 300000)
  assert.equal(t.gmPct, 30)
})

test('a loss-making cost sheet needs a reason; low GM only warns', () => {
  const v = validateCostSheet(cs({ revenue: 500000 }))
  assert.ok(v.errors.lossReason)
  assert.ok(validateCostSheet(cs({ revenue: 500000, lossReason: 'กลยุทธ์เข้าตลาด' })).errors.lossReason === undefined)
  assert.ok(validateCostSheet(cs({ revenue: 900000 })).warn.gm)
  assert.ok(validateCostSheet(cs({ items: [] })).errors.items)
})

const qt = (o: Partial<Quotation> = {}): Quotation => ({
  id: 'q', docNo: 'QT-2026-0001', revision: 1, status: 'DRAFT', costSheetId: 'c', issueDate: '2026-11-10', validUntil: '2026-12-10', contact: 's1', projectName: 'P',
  items: [{ id: 'a', description: 'งานพัฒนา', qty: 1, unit: 'งาน', unitPrice: 1_000_000 }, { id: 'b', description: 'License', qty: 2, unit: 'License', unitPrice: 150_000 }],
  discount: { mode: 'baht', value: 100_000 }, duration: '6 เดือน', terms: [{ no: 1, pct: 30, condition: 'เซ็นสัญญา' }, { no: 2, pct: 70, condition: 'ตรวจรับ' }],
  warranty: '', exclusions: '', remark: '', createdBy: 'rk', createdAt: '2026-11-10', ...o,
})

test('quotation totals: discount, VAT 7%, grand total', () => {
  const t = quoteTotals(qt())
  assert.equal(t.gross, 1_300_000)
  assert.equal(t.subtotal, 1_200_000)
  assert.equal(t.vat, 84_000)
  assert.equal(t.grand, 1_284_000)
})

test('quotation rules: terms = 100%, discount ≤ total, valid-until ≥ issue date, subtotal matches cost sheet', () => {
  assert.ok(validateQuotation(qt({ terms: [{ no: 1, pct: 50, condition: '' }] })).errors.terms)
  assert.ok(validateQuotation(qt({ discount: { mode: 'baht', value: 2_000_000 } })).errors.discount)
  assert.ok(validateQuotation(qt({ validUntil: '2026-11-01' })).errors.validUntil)
  assert.ok(validateQuotation(qt(), 1_100_000).warn.match)
  assert.deepEqual(validateQuotation(qt(), 1_200_000), { errors: {}, warn: {} })
})

test('lines prefilled from a cost sheet add up to its revenue', () => {
  const lines = linesFromCostSheet(cs())
  assert.equal(Math.round(lines.reduce((a, l) => a + l.unitPrice * l.qty, 0) * 100) / 100, 1_200_000)
})

test('upload rules and standard names', () => {
  assert.match(uploadError('setup.exe', 100, 'tor'), /ไม่รองรับ/)
  assert.match(uploadError('big.pdf', 60 * 1024 * 1024, 'tor'), /เกิน 50 MB/)
  assert.equal(uploadError('tor.pdf', 20 * 1024 * 1024, 'tor'), '')
  assert.match(uploadError('cost.xlsx', 11 * 1024 * 1024, 'cost-sheet'), /เกิน 10 MB/)
  assert.equal(standardName('PIP-69-0098', 'Official PO', 2, '2026-11-10', 'scan.PDF'), 'PIP-69-0098_OfficialPO_v2_20261110.pdf')
  assert.ok(!foldersFor('MA').some((f) => f.code === 'training'))
})
