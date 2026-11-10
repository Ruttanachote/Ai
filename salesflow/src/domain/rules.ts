// Business rules shared by the web app (to explain why a button is disabled) and the
// server (to enforce them). Pure functions only — no I/O, no Vue, no Graph.
import { HANDOVER_PARTIES, stageOf, type Project, type StageKey } from '../data/model.ts'
import { addWorkingDays, type BusinessCalendar, TH_GOV_2026 } from './calendar.ts'

export interface RuleResult { ok: boolean; errors: string[] }
const result = (errors: string[]): RuleResult => ({ ok: errors.length === 0, errors })

export const PRESALE: StageKey[] = ['opportunity', 'pipeline', 'forecast', 'rebidding']
export const isTender = (p: Pick<Project, 'salesMotion' | 'bid'>) =>
  p.salesMotion ? p.salesMotion === 'tender' : !!p.bid && p.bid.method !== 'เอกชน'

/** Latest approval that is fully approved, not stale and not expired. */
export function validApproval(p: Project, today: string) {
  const a = p.approval
  if (!a || a.status === 'stale' || a.status === 'recalled') return undefined
  if (!a.steps.every((s) => s.status === 'approved')) return undefined
  if (a.validUntil && a.validUntil < today) return undefined
  return a
}

/* ---------------- P0-7 · exit criteria (create, edit and move) ---------------- */

/**
 * Data a project must carry to *be* in `stage`. Checked on create, on edit and on every
 * move, so a deal cannot be created straight into Forecast without an approved quote.
 */
export function requirementsFor(stage: StageKey, p: Project, today: string): string[] {
  const e: string[] = []
  const idx = (k: StageKey) => ['opportunity', 'pipeline', 'forecast', 'rebidding', 'win'].indexOf(k)
  if (!p.name?.trim()) e.push('ต้องมีชื่อโครงการ')
  if (idx(stage) >= idx('pipeline') && idx(stage) >= 0) {
    if (!p.customerAccountId) e.push('ต้องเลือกลูกค้าจากทะเบียนลูกค้า (Account)')
    if (!p.team) e.push('ต้องระบุทีม DT')
    if (!(p.sales ?? []).length) e.push('ต้องมี Sale ที่ทำงานคู่กับ SM อย่างน้อย 1 คน')
  }
  if (idx(stage) >= idx('forecast') && idx(stage) >= 0) {
    if (!validApproval(p, today)) e.push('Cost Sheet และ Quotation ต้อง Approved ครบทุกขั้นและยังไม่หมดอายุ (แท็บ Cost Sheet และใบเสนอราคา)')
    if (!p.expectedClose) e.push('ต้องกำหนด Expected Close')
    // Sales documents at 70%: TOR Final reviewed by the group head, and a Proposal (renewals excluded).
    if (p.type !== 'MA') {
      if (!p.salesDocs?.tor) e.push('ต้องแนบ TOR Final')
      else if (p.torReview?.status !== 'approved') e.push('TOR Final ต้องผ่านการตรวจของหัวหน้ากลุ่มก่อน')
      if (!p.salesDocs?.proposal) e.push('ต้องมี Proposal (สร้างจาก Template ได้)')
    }
  }
  if (stage === 'rebidding' || (idx(stage) >= idx('forecast') && idx(stage) >= 0 && isTender(p))) {
    if (isTender(p) && !p.bid?.method) e.push('ต้องระบุวิธีจัดซื้อจัดจ้าง')
  }
  if (stage === 'rebidding' && isTender(p)) {
    if (!p.bid?.egpNo) e.push('ต้องบันทึกเลขโครงการ e-GP')
    if (!p.bid?.refPrice) e.push('ต้องบันทึกราคากลาง')
  }
  return e
}

export function validateCreate(p: Project, today: string): RuleResult {
  const e = requirementsFor(p.stage, p, today)
  if (!PRESALE.includes(p.stage)) e.push('สร้างโครงการได้เฉพาะสถานะช่วงขาย')
  return result(e)
}

/* ---------------- P0-3 · approved price vs PO / bid ---------------- */

export interface PoCheckInput { contractValue: number; contractCost?: number; tolerancePct: number; gpDropPct: number }
export interface PoCheck { ok: boolean; needsReapproval: boolean; diffPct: number; gpApproved: number; gpContract: number; reasons: string[] }

/**
 * Compare the signed PO/contract value with the approved snapshot. A difference beyond
 * `tolerancePct`, or a GP drop beyond `gpDropPct` percentage points, needs post-award approval.
 */
export function checkContractValue(p: Project, input: PoCheckInput, today: string): PoCheck {
  const a = validApproval(p, today)
  const snap = a?.snapshot ?? { revenue: p.revenue, cost: p.cost }
  const cost = input.contractCost ?? snap.cost
  const gpApproved = snap.revenue ? ((snap.revenue - snap.cost) / snap.revenue) * 100 : 0
  const gpContract = input.contractValue ? ((input.contractValue - cost) / input.contractValue) * 100 : 0
  const diffPct = snap.revenue ? ((input.contractValue - snap.revenue) / snap.revenue) * 100 : 0
  const reasons: string[] = []
  if (!a) reasons.push('ยังไม่มีใบเสนอราคาที่อนุมัติและยังใช้ได้')
  if (Math.abs(diffPct) > input.tolerancePct) reasons.push(`มูลค่าสัญญาต่างจากที่อนุมัติ ${diffPct.toFixed(1)}% (เกณฑ์ ±${input.tolerancePct}%)`)
  if (gpApproved - gpContract > input.gpDropPct) reasons.push(`GP ลดลง ${(gpApproved - gpContract).toFixed(1)} จุด (เกณฑ์ ${input.gpDropPct} จุด)`)
  if (isTender(p) && p.bid?.ourBid && snap.revenue && Math.round(p.bid.ourBid) > Math.round(snap.revenue))
    reasons.push('ราคาที่ยื่น e-GP สูงกว่าราคาที่อนุมัติ')
  const needsReapproval = reasons.length > 0 && !!a
  return { ok: reasons.length === 0, needsReapproval, diffPct, gpApproved, gpContract, reasons }
}

/* ---------------- P0-10 · tender workflow ---------------- */

export function appealWindowEnd(p: Project, cal: BusinessCalendar = TH_GOV_2026) {
  return p.bid?.result ? addWorkingDays(p.bid.result, 7, cal) : undefined
}

export function closeWinRule(p: Project, today: string, hasContractFile: boolean, cal: BusinessCalendar = TH_GOV_2026): RuleResult {
  const e: string[] = []
  if (!hasContractFile) e.push('ต้องอัปโหลด PO หรือสัญญาในโฟลเดอร์ Official PO / Contract')
  if (isTender(p)) {
    if (!p.bid?.egpNo) e.push('ดีลภาครัฐต้องมีเลขโครงการ e-GP')
    if (!p.bid?.result) e.push('ยังไม่มีประกาศผู้ชนะบน e-GP')
    const end = appealWindowEnd(p, cal)
    if (end && today <= end) e.push(`ยังอยู่ในระยะอุทธรณ์ถึง ${end} — ปิด Close Win ได้หลังพ้นระยะ`)
  }
  return result(e)
}

/* ---------------- P0-11 · handover gate ---------------- */

export function handoverGate(p: Project, checklistDone: boolean): RuleResult {
  const e: string[] = []
  if (!checklistDone) e.push('Checklist Handover ยังไม่ครบ')
  if (!p.pm) e.push('ยังไม่ได้มอบหมาย PM')
  const att = p.handover?.attendees ?? []
  const missing = HANDOVER_PARTIES.filter((x) => !att.some((a) => a.party === x.k && a.who && a.attended))
  if (missing.length) e.push('ประชุม Handover ยังขาด: ' + missing.map((x) => x.label).join(', '))
  const t = p.terms
  if (!t) e.push('ยังไม่ได้กรอกเงื่อนไขสัญญา (ค่าปรับ ประกัน SLA)')
  else {
    if (!(t.penaltyRatePerDay > 0)) e.push('ต้องระบุอัตราค่าปรับต่อวัน')
    if (t.penaltyRatePerDay > 0.002) e.push('อัตราค่าปรับเกิน 0.20% ต่อวัน — ตรวจสัญญาอีกครั้ง')
    if (!(t.warrantyMonths > 0)) e.push('ต้องระบุระยะรับประกัน (เดือน)')
  }
  if (isTender(p) && !(p.bonds ?? []).some((b) => b.kind === 'performance'))
    e.push('ดีลภาครัฐต้องบันทึกหลักประกันสัญญา')
  return result(e)
}

/* ---------------- P0-7/8 · moves ---------------- */

export interface MoveInput {
  to: StageKey
  today: string
  gateChecked: boolean
  reason?: string
  loss?: { code: string; competitor?: string; price?: number }
  hasContractFile?: boolean
  contractValue?: number
  poCheck?: PoCheck
  handoverChecklistDone?: boolean
  cal?: BusinessCalendar
}

export function validateMove(p: Project, m: MoveInput): RuleResult {
  const e: string[] = []
  const exitList = stageOf(p.stage).exit
  const forward = !['lose', 'cancelled'].includes(m.to) && p.stage !== 'lose'
  if (forward && exitList.length && !m.gateChecked) e.push(`ยังไม่ได้ยืนยันเงื่อนไขก่อนออกจาก ${stageOf(p.stage).label}`)
  if (PRESALE.includes(m.to) || m.to === 'win') e.push(...requirementsFor(m.to, p, m.today))
  if (m.to === 'lose') {
    if (!m.loss?.code) e.push('ต้องเลือกเหตุผลที่แพ้')
    if (m.loss && COMPETITOR_REASONS.includes(m.loss.code) && !m.loss.competitor) e.push('เหตุผลนี้ต้องระบุผู้ชนะ')
  }
  if (m.to === 'cancelled' && !m.reason?.trim()) e.push('ต้องใส่เหตุผลการยกเลิก')
  if (m.to === 'win') {
    e.push(...closeWinRule(p, m.today, !!m.hasContractFile, m.cal).errors)
    if (!m.contractValue) e.push('ต้องกรอกมูลค่าตามสัญญา / PO')
    if (m.poCheck && !m.poCheck.ok) e.push('มูลค่าสัญญาไม่ตรงกับที่อนุมัติ — ต้องขออนุมัติหลังได้งานก่อน')
  }
  if (m.to === 'delivery') e.push(...handoverGate(p, !!m.handoverChecklistDone).errors)
  if (p.stage === 'lose' && m.to === 'pipeline') e.push('เปิดดีลที่แพ้แล้วให้ใช้ “เปิดโครงการใหม่จากดีลนี้” เพื่อไม่ให้ Win rate ย้อนหลังเปลี่ยน')
  return result([...new Set(e)])
}

export const COMPETITOR_REASONS = ['ราคาสูงกว่าคู่แข่ง', 'คู่แข่งได้เปรียบความสัมพันธ์']

/* ---------------- P0-8 · reopen as a new project ---------------- */

export function reopenAsNew(lost: Project, newId: string, newCode: string, today: string, by: string): Project {
  return {
    ...lost,
    id: newId,
    code: newCode,
    stage: 'pipeline',
    stageSince: today,
    reopenedFromId: lost.id,
    loss: undefined,
    approval: undefined,
    forecastCat: undefined,
    forecastReason: undefined,
    bonds: [],
    history: [{ stage: 'pipeline', note: `เปิดใหม่จากดีลที่แพ้ ${lost.code}`, at: today, by }],
  }
}

/** Win rate from closed outcomes only — reopened deals are new records, so history never changes. */
export function winRate(projects: Project[]) {
  const won = projects.filter((p) => ['win', 'handover', 'delivery', 'warranty', 'ended', 'cancelled'].includes(p.stage)).length
  const lost = projects.filter((p) => p.stage === 'lose').length
  return won + lost ? won / (won + lost) : 0
}
