// Demo sales documents: Cost Sheet / Quotation revisions that match each project's approval
// record, plus the uploaded files already in the folders.
import type { CostItem, CostSheet, DocStatus, Project, ProjectDocument, Quotation, Stakeholder } from './model'
import { docNo, linesFromCostSheet, standardName, folderOf } from '../domain/salesdocs.ts'

const items = (cogs: number, months: number): CostItem[] => {
  const mp = Math.round(cogs * 0.42), hw = Math.round(cogs * 0.3), sw = Math.round(cogs * 0.12)
  const md = Math.round(mp / 6500)
  const mpReal = md * 6500
  return [
    { id: 'i1', category: 'manpower', description: 'พัฒนาระบบและติดตั้ง', role: 'Developer', manday: Math.round(md * 0.6), rate: 6500 },
    { id: 'i2', category: 'manpower', description: 'วิเคราะห์ระบบ', role: 'SA', manday: md - Math.round(md * 0.6), rate: 6500 },
    { id: 'i3', category: 'hardware', description: 'Server และอุปกรณ์เครือข่าย', qty: 2, unitCost: Math.round(hw / 2), vendor: 'Dell Technologies' },
    { id: 'i4', category: 'software', description: 'License ฐานข้อมูล', qty: 1, unitCost: Math.round(sw / months), months, note: 'ใช้ subscription รายเดือนตามระยะโครงการ' },
    { id: 'i5', category: 'other', description: 'เดินทาง อบรม และเอกสาร', amount: cogs - mpReal - Math.round(hw / 2) * 2 - Math.round(sw / months) * months },
  ]
}

let seq = 51
function sheet(p: Project, rev: number, status: DocStatus, revenue: number, cogs: number, by: string, at: string, months = 6): CostSheet {
  return {
    id: `cs-${p.id}-${rev}`, docNo: docNo('CS', 2026, seq), revision: rev, status, source: 'form', projectMonths: months, maMonths: 12,
    preparedAt: at, createdBy: by, items: items(cogs, months), revenue,
    entertainment: { mode: 'pct', value: 0.5 }, contingency: { mode: 'pct', value: 2 },
    approvedAt: status === 'APPROVED' ? at : undefined,
  }
}
function quote(p: Project, cs: CostSheet, contact?: string): Quotation {
  const until = new Date(cs.preparedAt + 'T00:00:00Z'); until.setUTCDate(until.getUTCDate() + 60)
  return {
    id: `qt-${p.id}-${cs.revision}`, docNo: cs.docNo.replace('CS', 'QT'), revision: cs.revision, status: cs.status, costSheetId: cs.id,
    issueDate: cs.preparedAt, validUntil: until.toISOString().slice(0, 10), contact, projectName: p.name,
    items: linesFromCostSheet(cs).map((l, i) => ({ id: `ql${i}`, ...l })), discount: { mode: 'baht', value: 0 },
    duration: `${cs.projectMonths} เดือนนับจากวันลงนามสัญญา`,
    terms: [{ no: 1, pct: 30, condition: 'ส่งมอบแผนงานและ Requirement' }, { no: 2, pct: 40, condition: 'ติดตั้งและทดสอบระบบ' }, { no: 3, pct: 30, condition: 'ตรวจรับงานงวดสุดท้าย' }],
    warranty: 'รับประกัน 12 เดือนนับจากวันตรวจรับ · SLA มาตรฐาน 8x5', exclusions: 'ไม่รวมค่าเช่าพื้นที่ Data Center และอุปกรณ์ปลายทางของผู้ใช้', remark: '',
    createdBy: cs.createdBy, createdAt: cs.preparedAt, approvedAt: cs.approvedAt,
  }
}
function file(p: Project, folder: string, title: string, original: string, at: string, by: string, extra: Partial<ProjectDocument> = {}, versions = 1): ProjectDocument {
  const f = folderOf(folder)!
  return {
    id: `d-${p.id}-${folder}-${title.length}-${versions}`, folder, title, createdBy: by, ...extra,
    versions: Array.from({ length: versions }, (_, i) => ({ no: i + 1, fileName: original, stdName: standardName(p.code, f.name, i + 1, at, original), size: 1_800_000 + i * 240_000, mime: original.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream', at, by })),
  }
}
const contactOf = (p: Project) => p.stakeholders?.find((s: Stakeholder) => s.side === 'customer')?.id

/** Cost Sheet revision numbers per project follow the approval record (rev.N). */
export function seedDocs(projects: Project[]) {
  for (const p of projects) {
    p.documents ??= []
    p.activities ??= []
    const a = p.approval
    if (a && p.type !== 'MA') {
      const n = Number(a.version.replace(/\D/g, '')) || 1
      const status: DocStatus = a.status === 'approved' ? 'APPROVED' : a.status === 'rejected' ? 'REJECTED' : a.status === 'recalled' ? 'CANCELLED' : 'PENDING'
      const snap = a.snapshot ?? { revenue: p.revenue, cost: p.cost, gp: 0 }
      const at = p.history.at(-1)?.at && /\d{4}-/.test(p.history.at(-1)!.at) ? p.history.at(-1)!.at : '2026-11-04'
      const sheets: CostSheet[] = []
      for (let r = 1; r < n; r++) sheets.push({ ...sheet(p, r, 'REJECTED', Math.round(snap.revenue * (1 + (n - r) * 0.04)), snap.cost, p.sm, '2026-10-' + String(18 + r * 4).padStart(2, '0')) })
      sheets.push(sheet(p, n, status, snap.revenue, snap.cost, a.submittedBy ?? p.sm, at))
      seq++
      p.costSheets = sheets
      p.quotations = sheets.map((cs) => quote(p, cs, contactOf(p)))
      a.version = `rev.${n}`
      a.archivedPath = `${sheets.at(-1)!.docNo} rev.${n}`
      a.costSheetId = sheets.at(-1)!.id
      a.quotationId = p.quotations.at(-1)!.id
      p.documents.push(file(p, 'quotation', 'ใบเสนอราคา (PDF ที่ส่งลูกค้า)', `Quotation_${p.code}.pdf`, at, p.sm, { docNo: p.quotations.at(-1)!.docNo }))
      if (status === 'APPROVED') p.financeSource = { costSheetId: sheets.at(-1)!.id, label: `จาก Cost Sheet rev.${n} · อนุมัติแล้ว` }
    }
    if (p.salesDocs?.tor) p.documents.push(file(p, 'tor', 'TOR Final', p.salesDocs.tor, '2026-10-20', p.sm, {}, 2))
    if (p.salesDocs?.proposal) p.documents.push(file(p, 'proposal', 'Proposal', p.salesDocs.proposal, '2026-10-21', p.sm))
    if (['win', 'handover', 'delivery', 'warranty', 'ended'].includes(p.stage)) {
      p.documents.push(file(p, 'contract', 'สัญญาจ้าง', `Contract_${p.code}.pdf`, '2026-06-20', p.sm, { docNo: `สญ.${p.code.slice(-4)}/2569`, amount: p.contractValue ?? p.revenue }))
      p.documents.push(file(p, 'official-po', 'ใบสั่งจ้าง', `PO_${p.code}.pdf`, '2026-06-22', p.sm, { docNo: `PO-${p.code.slice(-4)}`, amount: p.contractValue ?? p.revenue }))
    }
    if (['delivery', 'warranty', 'ended'].includes(p.stage)) {
      p.documents.push(file(p, 'summary-plan', 'Summary Plan Sheet', 'Summary-Plan.xlsx', '2026-07-01', p.pm ?? p.sm))
      p.documents.push(file(p, 'pr', 'ใบขอซื้อ Server', 'PR-Server.pdf', '2026-07-10', p.pm ?? p.sm))
    }
    if (['warranty', 'ended'].includes(p.stage)) {
      p.documents.push(file(p, 'do', 'ใบส่งมอบงาน', 'DO.pdf', p.startWarranty ?? '2026-01-01', p.pm ?? p.sm, { docNo: `DO-${p.code.slice(-4)}` }))
      p.documents.push(file(p, 'inspection', 'ใบตรวจรับงานงวดสุดท้าย', 'Inspection.pdf', p.startWarranty ?? '2026-01-01', p.pm ?? p.sm))
    }
    p.activities.push(...p.history.map((h, i) => ({ id: `ah${i}`, at: h.at, who: h.by, type: 'stage' as const, text: `สถานะ ${h.stage}: ${h.note}` })))
  }
}
