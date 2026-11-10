// One definition for every number shown in more than one place. Views never compute
// project values, stage groups, approval state or due dates themselves.
import { stageOf, type Project, type StageKey, type Bond } from '../data/model.ts'
import { addDays } from './calendar.ts'

export const OPEN: StageKey[] = ['opportunity', 'pipeline', 'forecast', 'rebidding']
export const WON: StageKey[] = ['win', 'handover', 'delivery', 'warranty', 'ended']
export const POST: StageKey[] = ['win', 'handover', 'delivery', 'warranty', 'ended', 'cancelled']
export const isOpen = (p: Project) => OPEN.includes(p.stage)
export const isWon = (p: Project) => WON.includes(p.stage)

/** Value of a deal still being sold: quoted revenue, or the customer's budget before a quote exists. */
export const pipelineValue = (p: Project) => p.revenue || p.budget
/** Value that counts as booked: the signed contract value, else the approved quote. */
export const bookedValue = (p: Project) => p.contractValue ?? p.revenue
/** What the deal is worth right now, whichever phase it is in. */
export const dealValue = (p: Project) => (isWon(p) || p.stage === 'cancelled' ? bookedValue(p) : pipelineValue(p))
export const probability = (p: Project) => p.probability ?? stageOf(p.stage).weight
export const weightedValue = (p: Project) => (isOpen(p) ? pipelineValue(p) * probability(p) : 0)
export const gpPct = (p: Project) => (p.revenue ? ((p.revenue - p.cost) / p.revenue) * 100 : null)

/** Share of a project credited to one DT team, from the revenue split (100% to the owning team if none). */
export function teamShare(p: Project, team: string) {
  const splits = p.splits ?? [{ team: p.team, pct: 100 }]
  return (splits.find((s) => s.team === team)?.pct ?? 0) / 100
}

export function teamTotals(list: Project[], team: string) {
  return {
    won: list.filter(isWon).reduce((s, p) => s + bookedValue(p) * teamShare(p, team), 0),
    weighted: list.filter(isOpen).reduce((s, p) => s + weightedValue(p) * teamShare(p, team), 0),
  }
}

export function sum(list: Project[], f: (p: Project) => number) {
  return list.reduce((s, p) => s + f(p), 0)
}

/* ---------------- approval state (one label everywhere) ---------------- */

export type ApprovalState = 'none' | 'pending' | 'approved' | 'stale' | 'expired' | 'rejected' | 'recalled'
export const APPROVAL_LABEL: Record<ApprovalState, { label: string; tone: '' | 'win' | 'warn' | 'lose' }> = {
  none: { label: 'ยังไม่ส่งอนุมัติ', tone: '' },
  pending: { label: 'รออนุมัติ', tone: 'warn' },
  approved: { label: 'อนุมัติแล้ว', tone: 'win' },
  stale: { label: 'ไฟล์ถูกแก้หลังส่ง', tone: 'warn' },
  expired: { label: 'อนุมัติหมดอายุ', tone: 'lose' },
  rejected: { label: 'ส่งกลับแก้ไข', tone: 'lose' },
  recalled: { label: 'ดึงกลับแล้ว', tone: '' },
}

export function approvalState(p: Project, today: string): ApprovalState {
  const a = p.approval
  if (!a) return 'none'
  if (a.status === 'stale' || a.status === 'recalled') return a.status
  if (a.status === 'rejected' || a.steps.some((s) => s.status === 'rejected')) return 'rejected'
  if (a.steps.some((s) => s.status === 'pending')) return 'pending'
  if (a.steps.every((s) => s.status === 'approved')) return a.validUntil && a.validUntil < today ? 'expired' : 'approved'
  return 'pending'
}

/** The step waiting for a decision, or undefined when nothing is waiting. */
export function pendingStep(p: Project, today: string) {
  return approvalState(p, today) === 'pending' ? p.approval!.steps.find((s) => s.status === 'pending') : undefined
}

/* ---------------- guarantees and renewal dates ---------------- */

/** Bid bond: 15 days after the winner is approved. Contract bond: 15 days after release (end of warranty). */
export function bondReturnDue(p: Project, b: Bond) {
  if (b.kind === 'performance') return p.endWarranty ? addDays(p.endWarranty, 15) : undefined
  return p.bid?.result ? addDays(p.bid.result, 15) : undefined
}

export type WarrantyBucket = 'due30' | 'due120' | 'later'
export const warrantyBucket = (daysLeft: number): WarrantyBucket => (daysLeft <= 30 ? 'due30' : daysLeft <= 120 ? 'due120' : 'later')

/* ---------------- delivery (Delivery Overview, project plan tab, workload) ---------------- */

export function progressPct(p: Project) {
  const ms = p.milestones ?? []
  return ms.length ? Math.round(ms.reduce((s, m) => s + m.progress, 0) / ms.length) : 0
}
export const lateTasks = (p: Project, today: string) => (p.tasks ?? []).filter((t) => t.status !== 'done' && !!t.due && t.due < today)
export function effort(p: Project) {
  const ts = p.tasks ?? []
  return { plan: ts.reduce((s, t) => s + t.hours, 0), spent: ts.reduce((s, t) => s + t.spent, 0) }
}
export const paidAmount = (p: Project) => (p.milestones ?? []).filter((m) => m.paid).reduce((s, m) => s + (m.payment ?? 0), 0)

export type Health = { k: 'Schedule' | 'Effort' | 'Payment'; tone: 'ok' | 'warn' | 'bad'; note: string }
/** RAG used on the Delivery Overview cards and the project plan tab. */
export function health(p: Project, today: string): Health[] {
  const ms = p.milestones ?? []
  const behind = ms.some((m) => m.progress < 100 && m.end < today)
  const late = lateTasks(p, today).length
  const startedPlan = (p.tasks ?? []).filter((t) => t.status === 'done' || t.spent > 0).reduce((s, t) => s + t.hours, 0)
  const over = effort(p).spent > startedPlan
  return [
    { k: 'Schedule', tone: behind ? 'bad' : late ? 'warn' : 'ok', note: behind ? 'งวดงานเลยกำหนด' : late ? `${late} task เลยกำหนด` : 'ตามแผน' },
    { k: 'Effort', tone: over ? 'warn' : 'ok', note: over ? 'ชั่วโมงเกินแผน' : 'อยู่ในแผน' },
    { k: 'Payment', tone: 'ok', note: `รับแล้ว ${ms.filter((m) => m.paid).length}/${ms.length} งวด` },
  ]
}

/* ---------------- Cost Sheet lines (Cost Sheet tab, OT reserve, procurement budget) ---------------- */

export type CostKind = 'manday' | 'procure' | 'ot' | 'other'
export interface CostLine { name: string; amt: number; kind: CostKind }
export interface CostGroup { group: string; items: CostLine[] }

/**
 * Cost Sheet structure read from the workbook (named ranges in production). Man-day lines are
 * estimated by the SM from the TOR; Hardware/Software lines are the budget OPN approves PRs
 * against; the OT line is the reserve the PM may approve within.
 */
export function costSheet(p: Project): CostGroup[] {
  const base = p.cost || 6_000_000
  return [
    { group: 'ทีมพัฒนา (Man-day ตาม TOR)', items: [
      { name: 'Project Manager 1 คน × 120 วัน', amt: base * 0.09, kind: 'manday' },
      { name: 'System Analyst / BA 2 คน × 90 วัน', amt: base * 0.11, kind: 'manday' },
      { name: 'Developer 4 คน × 140 วัน', amt: base * 0.24, kind: 'manday' },
      { name: 'QA / Tester 1 คน × 60 วัน', amt: base * 0.04, kind: 'manday' },
    ] },
    { group: 'Hardware / Software (จัดซื้อผ่าน OPN)', items: [
      { name: 'Server และ Storage', amt: base * 0.2, kind: 'procure' },
      { name: 'License ฐานข้อมูลและ OS (3 ปี)', amt: base * 0.12, kind: 'procure' },
    ] },
    { group: 'เงินสำรองและค่าบริการอื่น', items: [
      { name: 'เงินกันทำ OT ทีม (5%)', amt: base * 0.05, kind: 'ot' },
      { name: 'ค่าเดินทาง อบรม และจัดประชุม', amt: base * 0.06, kind: 'other' },
      { name: 'Contingency / ความเสี่ยงโครงการ', amt: base * 0.04, kind: 'other' },
      { name: 'ค่า Warranty 12 เดือน', amt: base * 0.05, kind: 'other' },
    ] },
  ]
}
export const costLines = (p: Project) => costSheet(p).flatMap((g) => g.items)

/** OT: reserve from the Cost Sheet, approved and pending requests, what is left for the PM to approve. */
export function otBudget(p: Project) {
  const reserve = Math.round(costLines(p).filter((l) => l.kind === 'ot').reduce((s, l) => s + l.amt, 0))
  const approved = (p.ot ?? []).filter((o) => o.status === 'approved').reduce((s, o) => s + o.amount, 0)
  const pending = (p.ot ?? []).filter((o) => o.status === 'pending').reduce((s, o) => s + o.amount, 0)
  return { reserve, approved, pending, left: reserve - approved }
}

/** Procurement: each Hardware/Software line's budget against PRs approved or turned into POs. */
export function procurementBudget(p: Project) {
  return costLines(p).filter((l) => l.kind === 'procure').map((l) => {
    const prs = (p.procurement ?? []).filter((r) => r.budgetLine === l.name)
    const committed = prs.filter((r) => r.status === 'approved' || r.status === 'po_issued').reduce((s, r) => s + r.amount, 0)
    const pending = prs.filter((r) => r.status === 'pending').reduce((s, r) => s + r.amount, 0)
    return { line: l.name, budget: Math.round(l.amt), committed, pending, left: Math.round(l.amt) - committed }
  })
}
