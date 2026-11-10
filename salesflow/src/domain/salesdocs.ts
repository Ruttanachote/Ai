// Sales documents (spec: "Project Details & ไฟล์เอกสารการขาย" + "Template: Cost Sheet & Quotation").
// Folder master, upload rules, standard file names, Cost Sheet / Quotation maths and validation.
// Pure functions shared by the web app and the server tests. Money is rounded to 2 decimals.
import type { CostCategory, CostItem, CostSheet, ProjectType, Quotation, StageKey } from '../data/model.ts'

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

/* ---------------- Cost Sheet ---------------- */
export const COST_CATEGORIES: Record<CostCategory, { label: string; formula: string }> = {
  manpower: { label: 'Manpower (Professional Service)', formula: 'Manday × Rate/MD' },
  hardware: { label: 'Hardware', formula: 'จำนวน × ต้นทุน/หน่วย' },
  software: { label: 'Software / License / Subscription', formula: 'จำนวน × ต้นทุน × ระยะเวลา' },
  cloud: { label: 'Cloud / Infrastructure', formula: 'ค่าใช้จ่าย/เดือน × เดือน' },
  subcontract: { label: 'Subcontract / Outsource', formula: 'มูลค่า' },
  ma: { label: 'MA / Warranty', formula: 'เดือน × ต้นทุน/เดือน' },
  other: { label: 'Other (เดินทาง อบรม เอกสาร)', formula: 'มูลค่า' },
}
export const ROLES_MD = ['PM', 'SA', 'BA', 'UX/UI', 'Developer', 'Tester', 'DevOps', 'Engineer']

/** Cost of one row, by its category's formula. */
export function itemCost(i: CostItem): number {
  const n = (v?: number) => Number(v) || 0
  switch (i.category) {
    case 'manpower': return r2(n(i.manday) * n(i.rate))
    case 'hardware': return r2(n(i.qty) * n(i.unitCost))
    case 'software': return r2(n(i.qty) * n(i.unitCost) * (n(i.months) || 1))
    case 'cloud': return r2(n(i.unitCost) * n(i.months))
    case 'ma': return r2(n(i.months) * n(i.unitCost))
    default: return r2(n(i.amount))
  }
}

export interface CostTotals {
  cogs: number; manday: number; revenue: number; gp: number; gmPct: number
  entertainment: number; contingency: number; cm: number; cmPct: number
  byCategory: Record<CostCategory, number>
}
/** Every summary figure is calculated — never typed. */
export function costTotals(cs: Pick<CostSheet, 'items' | 'revenue' | 'entertainment' | 'contingency'>): CostTotals {
  const byCategory = Object.fromEntries(Object.keys(COST_CATEGORIES).map((k) => [k, 0])) as Record<CostCategory, number>
  for (const i of cs.items) byCategory[i.category] = r2(byCategory[i.category] + itemCost(i))
  const cogs = r2(Object.values(byCategory).reduce((a, b) => a + b, 0))
  const manday = cs.items.filter((i) => i.category === 'manpower').reduce((a, i) => a + (Number(i.manday) || 0), 0)
  const revenue = r2(Number(cs.revenue) || 0)
  const gp = r2(revenue - cogs)
  const entertainment = r2(cs.entertainment.mode === 'pct' ? (revenue * cs.entertainment.value) / 100 : cs.entertainment.value)
  const contingency = r2(cs.contingency.mode === 'pct' ? (cogs * cs.contingency.value) / 100 : cs.contingency.value)
  const cm = r2(gp - entertainment - contingency)
  return { cogs, manday, revenue, gp, gmPct: revenue ? r2((gp / revenue) * 100) : 0, entertainment, contingency, cm, cmPct: revenue ? r2((cm / revenue) * 100) : 0, byCategory }
}

/** Field-level problems (shown under each field); `warn` never blocks saving. */
export function validateCostSheet(cs: CostSheet, gmFloor = 25): { errors: Record<string, string>; warn: Record<string, string> } {
  const errors: Record<string, string> = {}
  const warn: Record<string, string> = {}
  if (!cs.items.length) errors.items = 'เพิ่มรายการอย่างน้อย 1 รายการ'
  cs.items.forEach((i, k) => {
    const nums = [i.manday, i.rate, i.qty, i.unitCost, i.months, i.amount].filter((v) => v !== undefined && v !== null)
    if (nums.some((v) => Number(v) < 0 || Number.isNaN(Number(v)))) errors[`item${k}`] = 'กรอกเป็นตัวเลขที่ไม่ติดลบ'
    else if (!i.description.trim() && i.category !== 'manpower') errors[`item${k}`] = 'ระบุรายการ'
  })
  if (!(cs.projectMonths && cs.projectMonths > 0)) errors.projectMonths = 'ระบุระยะเวลาโครงการ (เดือน)'
  if (!(Number(cs.revenue) >= 0)) errors.revenue = 'กรอกเป็นตัวเลขที่ไม่ติดลบ'
  const t = costTotals(cs)
  if (t.revenue < t.cogs && !cs.lossReason?.trim()) errors.lossReason = 'โครงการขาดทุน กรุณาระบุเหตุผล'
  if (t.revenue && t.gmPct < gmFloor) warn.gm = `GP ต่ำกว่าเกณฑ์ ${gmFloor}% — ต้องผ่านการพิจารณาของผู้บริหาร`
  return { errors, warn }
}

/* ---------------- Quotation ---------------- */
export const QT_UNITS = ['งาน', 'ชุด', 'License', 'เดือน', 'ปี', 'Manday']
export interface QuoteTotals { gross: number; discount: number; subtotal: number; vat: number; grand: number; termsPct: number }
export function quoteTotals(q: Pick<Quotation, 'items' | 'discount' | 'terms'>): QuoteTotals {
  const gross = r2(q.items.reduce((a, i) => a + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0))
  const discount = r2(q.discount.mode === 'pct' ? (gross * q.discount.value) / 100 : q.discount.value)
  const subtotal = r2(gross - discount)
  const vat = r2(subtotal * 0.07)
  return { gross, discount, subtotal, vat, grand: r2(subtotal + vat), termsPct: q.terms.reduce((a, t) => a + (Number(t.pct) || 0), 0) }
}
export function validateQuotation(q: Quotation, costRevenue?: number): { errors: Record<string, string>; warn: Record<string, string> } {
  const errors: Record<string, string> = {}
  const warn: Record<string, string> = {}
  const t = quoteTotals(q)
  if (!q.items.length) errors.items = 'เพิ่มรายการอย่างน้อย 1 รายการ'
  q.items.forEach((i, k) => {
    if (!i.description.trim()) errors[`item${k}`] = 'ระบุรายการ / ขอบเขตงาน'
    else if (!(Number(i.qty) > 0)) errors[`item${k}`] = 'จำนวนต้องมากกว่า 0'
    else if (!(Number(i.unitPrice) >= 0)) errors[`item${k}`] = 'กรอกเป็นตัวเลขที่ไม่ติดลบ'
  })
  if (t.discount > t.gross) errors.discount = 'ส่วนลดมากกว่าราคารวม'
  if (t.discount < 0) errors.discount = 'กรอกเป็นตัวเลขที่ไม่ติดลบ'
  if (Math.round(t.termsPct * 100) !== 10000) errors.terms = `งวดชำระรวมได้ ${t.termsPct}% ต้องเท่ากับ 100%`
  if (!q.validUntil || q.validUntil < q.issueDate) errors.validUntil = 'วันยืนราคาต้องไม่ก่อนวันที่ออก'
  if (!q.contact) errors.contact = 'เลือกผู้ติดต่อลูกค้า'
  if (costRevenue !== undefined && Math.abs(t.subtotal - costRevenue) >= 0.01) warn.match = `Subtotal ${t.subtotal.toLocaleString('en-US')} ไม่ตรงกับ Revenue ใน Cost Sheet ${costRevenue.toLocaleString('en-US')}`
  return { errors, warn }
}

/** Quotation lines prefilled from a Cost Sheet: one line per used category, priced so the subtotal equals the Cost Sheet revenue. */
export function linesFromCostSheet(cs: CostSheet): { description: string; qty: number; unit: string; unitPrice: number }[] {
  const t = costTotals(cs)
  const used = (Object.keys(t.byCategory) as CostCategory[]).filter((k) => t.byCategory[k] > 0)
  if (!used.length || !t.cogs) return [{ description: 'ค่าดำเนินโครงการ', qty: 1, unit: 'งาน', unitPrice: t.revenue }]
  const lines = used.map((k) => ({ description: COST_CATEGORIES[k].label.split(' (')[0], qty: 1, unit: k === 'manpower' ? 'งาน' : k === 'ma' ? 'ปี' : 'ชุด', unitPrice: Math.round((t.byCategory[k] / t.cogs) * t.revenue) }))
  // Whole baht per line; the last line absorbs the rounding so the subtotal equals the revenue.
  const diff = r2(t.revenue - lines.reduce((a, l) => a + l.unitPrice, 0))
  lines[lines.length - 1].unitPrice = r2(lines[lines.length - 1].unitPrice + diff)
  return lines
}

/** CS-2026-0058 rev.1 / QT-2026-0058 rev.1 */
export const docNo = (kind: 'CS' | 'QT', year: number, seq: number) => `${kind}-${year}-${String(seq).padStart(4, '0')}`
export const addDaysIso = (iso: string, n: number) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
