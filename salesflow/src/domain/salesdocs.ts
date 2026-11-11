// Sales documents (spec: "Project Details & ไฟล์เอกสารการขาย" + "Template: Cost Sheet & Quotation").
// Folder master, upload rules, standard file names, Cost Sheet / Quotation maths and validation.
// Pure functions shared by the web app and the server tests. Money is rounded to 2 decimals.
import type { CostGroup, CostLine, CostSheet, ProjectType, Quotation, RevenueType, StageKey } from '../data/model.ts'

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

/* ---------------- Folder master (fixed; admin can tune in master data) ---------------- */
export interface FolderDef {
  code: string; name: string; phase: 'pre' | 'post' | 'other'
  /** Project types that do not use this folder. */
  hideFor?: ProjectType[]
  /** Stage the project moves into that needs this document. */
  requiredFor?: StageKey
  /** Document number is required when uploading. */
  needsDocNo?: boolean
  /** Comes from the Cost Sheet / Quotation module rather than plain upload. */
  module?: 'cost' | 'quote'
  /** Only internal roles may open it (internal cost). */
  restricted?: boolean
}
export const FOLDERS: FolderDef[] = [
  { code: 'cost-sheet', name: 'Cost Sheet', phase: 'pre', module: 'cost', restricted: true, requiredFor: 'forecast' },
  { code: 'quotation', name: 'Quotation', phase: 'pre', module: 'quote', needsDocNo: true, requiredFor: 'forecast' },
  { code: 'tor', name: 'TOR', phase: 'pre', requiredFor: 'forecast', hideFor: ['MA'] },
  { code: 'proposal', name: 'Proposal', phase: 'pre', requiredFor: 'forecast', hideFor: ['MA'] },
  { code: 'contract', name: 'Contract', phase: 'pre', needsDocNo: true, restricted: true, requiredFor: 'win' },
  { code: 'official-po', name: 'Official PO', phase: 'pre', needsDocNo: true, requiredFor: 'win' },
  { code: 'summary-plan', name: 'Summary Plan Sheet', phase: 'post' },
  { code: 'pr', name: 'PR', phase: 'post' },
  { code: 'po', name: 'PO', phase: 'post', needsDocNo: true },
  { code: 'pa', name: 'PA', phase: 'post' },
  { code: 'do', name: 'DO', phase: 'post', requiredFor: 'warranty' },
  { code: 'training', name: 'Document Training', phase: 'post', hideFor: ['MA'] },
  { code: 'inspection', name: 'Document Inspection', phase: 'post', requiredFor: 'warranty' },
  { code: 'config', name: 'Document Config', phase: 'post' },
  { code: 'pm-report', name: 'PM Report', phase: 'post' },
  { code: 'cm', name: 'CM', phase: 'post' },
  { code: 'other', name: 'Other Documents', phase: 'other' },
]
export const folderOf = (code: string) => FOLDERS.find((f) => f.code === code)
export const foldersFor = (type: ProjectType) => FOLDERS.filter((f) => !f.hideFor?.includes(type))

/* ---------------- Upload rules ---------------- */
export const ALLOWED_EXT = ['pdf', 'docx', 'xlsx', 'pptx', 'png', 'jpg', 'jpeg', 'zip']
export const MAX_MB = 50
export const XLSX_MAX_MB = 10
export const extOf = (name: string) => (name.includes('.') ? name.split('.').pop()!.toLowerCase() : '')

/** Reason a file cannot be uploaded, with what to do instead; empty when it is fine. */
export function uploadError(name: string, size: number, folder: string, maxMb = MAX_MB): string {
  const ext = extOf(name)
  const f = folderOf(folder)
  if (f?.module && ext !== 'xlsx' && ext !== 'pdf') return `โฟลเดอร์ ${f.name} รับเฉพาะ .xlsx (หรือ PDF ที่ส่งลูกค้า) — สร้างในระบบได้ด้วยปุ่ม Create`
  if (!ALLOWED_EXT.includes(ext)) return `ไม่รองรับไฟล์ .${ext || '?'} — ใช้ PDF, DOCX, XLSX, PPTX, PNG/JPG หรือ ZIP`
  const limit = f?.module && ext === 'xlsx' ? XLSX_MAX_MB : maxMb
  if (size > limit * 1024 * 1024) return `ไฟล์ใหญ่ ${(size / 1024 / 1024).toFixed(1)} MB เกิน ${limit} MB — บีบอัดหรือแยกไฟล์ก่อนอัปโหลด`
  return ''
}

/** {ProjectCode}_{DocType}_v{n}_{YYYYMMDD}.ext — the original name is kept alongside. */
export function standardName(projectCode: string, folderName: string, version: number, dateIso: string, original: string) {
  const type = folderName.replace(/[^A-Za-z0-9]+/g, '')
  return `${projectCode}_${type}_v${version}_${dateIso.replace(/-/g, '')}.${extOf(original) || 'bin'}`
}

/* ---------------- Cost Sheet (company workbook "Cost_Sheet_Template") ---------------- */
export const REVENUE_TYPES: RevenueType[] = ['Hardware', 'Software', 'Imp SVC', 'MA SVC', 'Rental SVC', 'Other']
export const DEFAULT_PAYMENTS = [0.1, 0.4, 0.3, 0.1, 0.1]

export type CostSection = 'cogs' | 'direct' | 'variable' | 'transfer'
export interface GroupDef { no: number | string; label: string; section: CostSection; formula: string; qtyLabel: string; priceLabel: string; subs?: string[] }
/** Groups, numbers, labels and row formulas exactly as in the template (column D × E unless noted). */
export const COST_GROUPS: Record<CostGroup, GroupDef> = {
  hardware: { no: 1, label: 'Hardware', section: 'cogs', formula: '=D×E', qtyLabel: 'Qty', priceLabel: 'Unit Price' },
  software: { no: 2, label: 'Software', section: 'cogs', formula: '=D×E', qtyLabel: 'Qty', priceLabel: 'Unit Price' },
  rental: { no: 3, label: 'Rental Cost', section: 'cogs', formula: '=D×E', qtyLabel: 'Qty', priceLabel: 'Unit Price' },
  outsource: { no: 4, label: 'Outsource', section: 'cogs', formula: '=D×E', qtyLabel: 'Qty', priceLabel: 'Unit Price' },
  training: { no: 5, label: 'Training Cost', section: 'cogs', formula: '=D×E×3', qtyLabel: 'Qty', priceLabel: 'Unit Price' },
  accessories: { no: 6, label: 'Accessories', section: 'cogs', formula: '=D×E', qtyLabel: 'Qty', priceLabel: 'Unit Price' },
  consulting: { no: 7, label: 'Consulting cost', section: 'cogs', formula: '=Total Revenue×Fx÷(1+Fx)', qtyLabel: 'Fx', priceLabel: '—' },
  manday: { no: 8, label: 'Manday / Man month', section: 'direct', formula: '=D×E', qtyLabel: 'Manday', priceLabel: 'Rate' },
  logistic: { no: 9, label: 'Logistic', section: 'direct', formula: '=D×E', qtyLabel: 'Qty', priceLabel: 'Unit Price', subs: ['Air freight'] },
  financial: { no: 10, label: 'Financial cost', section: 'direct', formula: '=D×E×(Hardware+Software)', qtyLabel: 'Rate', priceLabel: 'Period', subs: ['Interest'] },
  operational: { no: 11, label: 'Operational Support Cost', section: 'variable', formula: '=D×E', qtyLabel: 'Qty', priceLabel: 'Unit Price', subs: ['Implementation', 'Transportation cost', 'On-Going support', 'Oversea Training', 'Hotel'] },
  entertainment: { no: 12, label: 'Entertainment', section: 'variable', formula: '=D×E', qtyLabel: 'Qty', priceLabel: 'Unit Price', subs: ['Miscellaneous/Entertainment'] },
  contingency: { no: 13, label: 'Contingency', section: 'variable', formula: '=Total Revenue×D', qtyLabel: '%', priceLabel: '—', subs: ['Contingency (5%)'] },
  intra: { no: '11', label: 'Intra-SBU transfer charge', section: 'transfer', formula: '=D×E', qtyLabel: 'Qty', priceLabel: 'Unit Price', subs: ['Imp SVC'] },
  inter: { no: '12', label: 'Inter-SBU transfer charge', section: 'transfer', formula: '=D×E', qtyLabel: 'Qty', priceLabel: 'Unit Price', subs: ['Imp SVC', 'Prime SM'] },
}
export const SECTIONS: { k: CostSection; label: string }[] = [
  { k: 'cogs', label: 'COST OF GOODS SOLD' }, { k: 'direct', label: 'DIRECT & LABOUR COST' }, { k: 'variable', label: 'VARIABLE COST' }, { k: 'transfer', label: 'Internal Transfer Charge' },
]
export const groupsOf = (sec: CostSection) => (Object.keys(COST_GROUPS) as CostGroup[]).filter((g) => COST_GROUPS[g].section === sec)

const n = (v?: number) => Number(v) || 0
export const revenueTotal = (cs: Pick<CostSheet, 'revenue'>) => r2(cs.revenue.reduce((a, l) => a + n(l.qty) * n(l.unitPrice), 0))
/** One cost row, by its group's formula in the template. */
export function lineCost(l: CostLine, cs: Pick<CostSheet, 'revenue' | 'costs'>): number {
  const rev = revenueTotal(cs)
  switch (l.group) {
    case 'training': return r2(n(l.qty) * n(l.unitPrice) * 3)
    case 'consulting': return n(l.qty) ? r2((rev * n(l.qty)) / (1 + n(l.qty))) : 0
    case 'contingency': return r2(rev * n(l.qty))
    case 'financial': {
      const hwsw = cs.costs.filter((c) => c.group === 'hardware' || c.group === 'software').reduce((a, c) => a + n(c.qty) * n(c.unitPrice), 0)
      return r2(n(l.qty) * n(l.unitPrice) * hwsw)
    }
    default: return r2(n(l.qty) * n(l.unitPrice))
  }
}
export interface CostTotals {
  revenue: number; revenueVat: number; byPayment: number[]
  groups: Record<CostGroup, number>
  cogs: number; gp: number; gmPct: number
  directVariable: number; totalExpense: number; cm: number; cmPct: number
  manday: number; entertainment: number; contingency: number; transfer: number; paymentsPct: number
}
/** Every summary row is a formula in the template — never typed. */
export function costTotals(cs: Pick<CostSheet, 'revenue' | 'costs' | 'payments'>): CostTotals {
  const revenue = revenueTotal(cs)
  const groups = Object.fromEntries(Object.keys(COST_GROUPS).map((k) => [k, 0])) as Record<CostGroup, number>
  for (const l of cs.costs) groups[l.group] = r2(groups[l.group] + lineCost(l, cs))
  const sumOf = (sec: CostSection) => r2(groupsOf(sec).reduce((a, g) => a + groups[g], 0))
  const cogs = sumOf('cogs')
  const gp = r2(revenue - cogs)
  const directVariable = r2(sumOf('direct') + sumOf('variable'))
  const totalExpense = r2(cogs + directVariable)
  const cm = r2(revenue - totalExpense)
  return {
    revenue, revenueVat: r2(revenue * 1.07),
    byPayment: cs.payments.map((p) => r2(cs.revenue.reduce((a, l) => a + n(l.qty) * n(l.unitPrice) * p, 0))),
    groups, cogs, gp, gmPct: revenue ? r2((gp / revenue) * 100) : 0,
    directVariable, totalExpense, cm, cmPct: revenue ? r2((cm / revenue) * 100) : 0,
    manday: cs.costs.filter((l) => l.group === 'manday').reduce((a, l) => a + n(l.qty), 0),
    entertainment: groups.entertainment, contingency: groups.contingency, transfer: sumOf('transfer'),
    paymentsPct: r2(cs.payments.reduce((a, p) => a + p, 0) * 100),
  }
}

/** Field-level problems (shown in the sheet); `warn` never blocks saving. */
export function validateCostSheet(cs: CostSheet, gmFloor = 25): { errors: Record<string, string>; warn: Record<string, string> } {
  const errors: Record<string, string> = {}
  const warn: Record<string, string> = {}
  const neg = (v?: number) => v !== undefined && v !== null && (Number(v) < 0 || Number.isNaN(Number(v)))
  if (!cs.revenue.length) errors.revenue = 'เพิ่มรายการรายได้อย่างน้อย 1 รายการ'
  cs.revenue.forEach((l, k) => {
    if (neg(l.qty) || neg(l.unitPrice)) errors[`rev${k}`] = 'กรอกเป็นตัวเลขที่ไม่ติดลบ'
    else if (!l.description.trim()) errors[`rev${k}`] = 'ระบุ Income Description'
  })
  cs.costs.forEach((l, k) => { if (neg(l.qty) || neg(l.unitPrice)) errors[`cost${k}`] = 'กรอกเป็นตัวเลขที่ไม่ติดลบ' })
  if (cs.payments.some((p) => p < 0)) errors.payments = 'กรอกเป็นตัวเลขที่ไม่ติดลบ'
  const t = costTotals(cs)
  if (Math.round(t.paymentsPct * 100) !== 10000) errors.payments = `Payment#1–#5 รวมได้ ${t.paymentsPct}% ต้องเท่ากับ 100%`
  // A sheet with no revenue cannot become a quotation — catch it here, not on the quotation page.
  if (!errors.revenue && t.revenue <= 0) errors.revenue = 'Revenue รวมเป็น 0 — กรอก Qty และ Unit Price ของรายการรายได้'
  if (t.revenue < t.totalExpense && !cs.lossReason?.trim()) errors.lossReason = 'โครงการขาดทุน กรุณาระบุเหตุผล'
  if (t.revenue && t.gmPct < gmFloor) warn.gm = `Margin ต่ำกว่าเกณฑ์ ${gmFloor}% — ต้องผ่านการพิจารณาของผู้บริหาร`
  return { errors, warn }
}

/* ---------------- Quotation (company workbook "Quotation_Template") ---------------- */
export const QT_UNITS = ['งาน', 'ชุด', 'License', 'เดือน', 'ปี', 'Manday']
export interface QuoteTotals { total: number; discount: number; subtotal: number; vat: number; grand: number }
/** Total = Σ amount · Subtotal = Total − Special Discount · VAT 7% · Grand Total. */
export function quoteTotals(q: Pick<Quotation, 'items' | 'discount'>): QuoteTotals {
  const total = r2(q.items.reduce((a, i) => a + n(i.qty) * n(i.unitPrice), 0))
  const discount = r2(n(q.discount))
  const subtotal = r2(total - discount)
  const vat = r2(subtotal * 0.07)
  return { total, discount, subtotal, vat, grand: r2(subtotal + vat) }
}
export function validateQuotation(q: Quotation, costRevenue?: number): { errors: Record<string, string>; warn: Record<string, string> } {
  const errors: Record<string, string> = {}
  const warn: Record<string, string> = {}
  const t = quoteTotals(q)
  if (!q.items.length) errors.items = 'ไม่มีรายการ — เพิ่มรายได้ใน Cost Sheet ก่อน'
  if (t.discount < 0) errors.discount = 'กรอกเป็นตัวเลขที่ไม่ติดลบ'
  else if (t.discount > t.total) errors.discount = 'ส่วนลดมากกว่าราคารวม'
  if (!q.validUntil || q.validUntil < q.issueDate) errors.validUntil = 'วันยืนราคาต้องไม่ก่อนวันที่ออก'
  if (!q.contact?.trim()) errors.contact = 'ระบุผู้ติดต่อลูกค้า'
  if (costRevenue !== undefined && Math.abs(t.subtotal - costRevenue) >= 0.01) warn.match = `Subtotal ${t.subtotal.toLocaleString('en-US')} ไม่ตรงกับ Total Revenue ใน Cost Sheet ${costRevenue.toLocaleString('en-US')} — ถ้าให้ส่วนลด ให้ปรับราคาใน Cost Sheet ด้วย`
  return { errors, warn }
}
/** Quotation lines are the Cost Sheet revenue lines (Description, Part No., Qty, Unit Price, Amount). */
export function linesFromCostSheet(cs: CostSheet): { description: string; qty: number; unitPrice: number; partNo?: string }[] {
  return cs.revenue.filter((l) => l.description.trim() && n(l.qty) * n(l.unitPrice) > 0).map((l) => ({ description: l.description, qty: l.qty, unitPrice: l.unitPrice, partNo: l.partNo }))
}
export const paymentText = (payments: number[]) => payments.map((p, i) => `งวดที่ ${i + 1} ${Math.round(p * 1000) / 10}%`).filter((_, i) => payments[i] > 0).join(' · ')

/** CS-2026-0058 rev.1 / QT-2026-0058 rev.1 */
export const docNo = (kind: 'CS' | 'QT', year: number, seq: number) => `${kind}-${year}-${String(seq).padStart(4, '0')}`
export const addDaysIso = (iso: string, n: number) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
