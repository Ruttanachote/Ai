// Domain model for Stream SalesFlow — sales → delivery → MA lifecycle.

export type StageKey =
  | 'opportunity' | 'pipeline' | 'forecast' | 'rebidding'
  | 'win' | 'lose'
  | 'handover' | 'delivery' | 'warranty' | 'ended' | 'cancelled'

export type Phase = 'presale' | 'result' | 'postsale'

export interface Stage {
  key: StageKey
  label: string
  th: string
  prob: string
  phase: Phase
  owner: string
  hint: string
  /** Default probability (0–1) used for the weighted pipeline. */
  weight: number
  /** Exit criteria the owner confirms before leaving this stage (Salesforce "Path" style gate). */
  exit: string[]
  /** Days in stage before the deal is flagged as stalled. */
  staleDays?: number
}

export type ForecastCat = 'pipeline' | 'bestcase' | 'commit' | 'closed' | 'omitted'
export const FORECAST_CAT: Record<ForecastCat, string> = {
  pipeline: 'Pipeline', bestcase: 'Best case', commit: 'Commit', closed: 'Closed', omitted: 'ไม่นับ',
}
export const LOSS_REASONS = [
  'ราคาสูงกว่าคู่แข่ง', 'คุณสมบัติไม่ผ่าน TOR', 'ลูกค้าตัดงบ / ยกเลิกโครงการ', 'คู่แข่งได้เปรียบความสัมพันธ์',
  'ยื่นเอกสารไม่ครบ / ไม่ทันเวลา', 'Solution ไม่ตรงความต้องการ', 'ลูกค้าเลื่อนไปปีงบถัดไป', 'อื่น ๆ',
]

export const STAGES: Stage[] = [
  { key: 'opportunity', label: 'Opportunity', th: 'โอกาส', prob: '10–20%', phase: 'presale', owner: 'SM', hint: 'Requirement ลูกค้าตรงกับสินค้าหรือบริการที่เรามี' , weight: 0.15, exit: ['ระบุลูกค้าและ End User', 'ระบุประเภทโครงการและทีม DT', 'มี Budget หรือช่วงงบประมาณของลูกค้า'], staleDays: 45 },
  { key: 'pipeline', label: 'Pipeline', th: 'กำลังเจรจา', prob: '40–50%', phase: 'presale', owner: 'SM', hint: 'มีโอกาสปิดได้ภายในปีนี้ ลูกค้าเริ่มเจรจาแล้ว' , weight: 0.45, exit: ['ใบเสนอราคาได้รับอนุมัติครบทุกขั้น', 'ทราบวิธีจัดซื้อ (e-bidding / เฉพาะเจาะจง / เอกชน)', 'กำหนด Expected Close'], staleDays: 60 },
  { key: 'forecast', label: 'Forecast', th: 'คาดการณ์ปิด', prob: '70–80%', phase: 'presale', owner: 'SM', hint: 'ตกลงกับลูกค้าแล้ว คาดว่าปิดในไตรมาสนี้หรือหน้า' , weight: 0.75, exit: ['ลูกค้ายืนยันขอบเขตและราคา', 'มีร่างสัญญาหรือ PO', 'กำหนดผู้ลงนามฝั่งลูกค้า'], staleDays: 45 },
  { key: 'rebidding', label: 'Rebidding', th: 'ยื่นประมูล', prob: '70–80%', phase: 'presale', owner: 'SM', hint: 'กำลังเตรียมหรือยื่นประมูลแข่งบนเว็บไซต์' , weight: 0.75, exit: ['บันทึกเลขโครงการ e-GP และราคากลาง', 'วางหลักประกันซองแล้ว', 'ยื่นข้อเสนอก่อนกำหนด'], staleDays: 30 },
  { key: 'win', label: 'Close Win', th: 'ชนะงาน', prob: '100%', phase: 'result', owner: 'SM', hint: 'ได้ PO หรือสัญญาแล้ว' , weight: 1, exit: ['อัปโหลด PO หรือสัญญาที่ลงนาม', 'มูลค่า PO ตรงกับใบเสนอราคาที่อนุมัติ', 'วางหลักประกันสัญญาแล้ว (ถ้ามี)'] },
  { key: 'lose', label: 'Close Lose', th: 'ไม่ได้งาน', prob: '0%', phase: 'result', owner: 'หัวหน้ากลุ่ม', hint: 'จบโครงการ หัวหน้ากลุ่มเปิดกลับเป็น Pipeline ได้' , weight: 0, exit: [] },
  { key: 'handover', label: 'Handover', th: 'ส่งต่องาน', prob: '—', phase: 'postsale', owner: 'PMO', hint: 'ประชุมส่งต่องานจาก Pre-sale ให้ PM' , weight: 0, exit: ['Checklist Handover ครบ', 'มอบหมาย PM และทีม DT', 'ยืนยันงวดงานและค่าปรับตามสัญญา'] },
  { key: 'delivery', label: 'In Delivery', th: 'กำลังส่งมอบ', prob: '—', phase: 'postsale', owner: 'PM', hint: 'PM และทีม Dev กำลังพัฒนาและส่งมอบ' , weight: 0, exit: ['ลูกค้าตรวจรับงวดสุดท้าย', 'อัปโหลดใบตรวจรับใน Document Inspection', 'ส่งมอบคู่มือและอบรมแล้ว'] },
  { key: 'warranty', label: 'Warranty', th: 'รับประกัน', prob: '—', phase: 'postsale', owner: 'MA', hint: 'Go-Live แล้ว ทีม MA ดูแล' , weight: 0, exit: ['หมดระยะประกัน', 'ลูกค้าตอบเรื่องต่อ MA แล้ว', 'ขอคืนหลักประกันสัญญา'] },
  { key: 'ended', label: 'Ended', th: 'ปิดโครงการ', prob: '—', phase: 'postsale', owner: 'MA', hint: 'หมดประกัน ถ้าต่อสัญญาเปิดเป็นโครงการ MA ใหม่' , weight: 0, exit: [] },
  { key: 'cancelled', label: 'Cancelled', th: 'ยกเลิก', prob: '—', phase: 'postsale', owner: 'หัวหน้ากลุ่ม', hint: 'ยกเลิกหลังชนะงาน (Close Win ถึง In Delivery)' , weight: 0, exit: [] },
]

export const stageOf = (k: StageKey) => STAGES.find((s) => s.key === k)!
export const probOf = (p: { stage: StageKey; probability?: number }) => p.probability ?? stageOf(p.stage).weight
export const catOf = (p: { stage: StageKey; forecastCat?: ForecastCat }): ForecastCat =>
  p.forecastCat ?? (p.stage === 'opportunity' ? 'pipeline' : p.stage === 'pipeline' ? 'bestcase' : ['forecast', 'rebidding'].includes(p.stage) ? 'commit' : p.stage === 'lose' || p.stage === 'cancelled' ? 'omitted' : 'closed')

/** Main happy path used by the stage rail. Lose / Cancelled are side exits. */
export const RAIL: StageKey[] = ['opportunity', 'pipeline', 'forecast', 'rebidding', 'win', 'handover', 'delivery', 'warranty', 'ended']

export type Role = 'sm' | 'head' | 'exec' | 'pmo' | 'pm' | 'ma' | 'admin'

export const ROLES: Record<Role, { label: string; th: string }> = {
  sm: { label: 'Solution Manager', th: 'หาโครงการ ทำ Cost Sheet และใบเสนอราคา' },
  head: { label: 'หัวหน้ากลุ่ม DT', th: 'อนุมัติราคา เปิด Close Lose กลับ ยกเลิกโครงการ' },
  exec: { label: 'ผู้บริหาร', th: 'อนุมัติขั้นสุดท้าย ดูยอดขายทุกทีม' },
  pmo: { label: 'PMO', th: 'Handover จัดสรร PM และทีม DT' },
  pm: { label: 'Project Manager', th: 'วางแผน ติดตามงาน ส่งมอบ' },
  ma: { label: 'MA / Support', th: 'ดูแลประกัน แจ้งต่อ MA รับเรื่องปัญหา' },
  admin: { label: 'ผู้ดูแลระบบ', th: 'ผู้ใช้ สิทธิ์ ทีม และการเชื่อมต่อ M365' },
}

/** Which stage transitions each role may perform (enforced server-side as well). */
export function allowedMoves(stage: StageKey, role: Role): StageKey[] {
  const lead = role === 'head' || role === 'exec' || role === 'admin'
  const sm = role === 'sm' || lead
  switch (stage) {
    case 'opportunity': return sm ? ['pipeline', 'lose'] : []
    case 'pipeline': return sm ? ['forecast', 'rebidding', 'lose'] : []
    case 'forecast': return sm ? ['rebidding', 'win', 'lose'] : []
    case 'rebidding': return sm ? ['win', 'lose'] : []
    case 'lose': return lead ? ['pipeline'] : []
    case 'win': return [...(role === 'pmo' || lead ? ['handover' as const] : []), ...(lead ? ['cancelled' as const] : [])]
    case 'handover': return [...(role === 'pm' || role === 'pmo' || lead ? ['delivery' as const] : []), ...(lead ? ['cancelled' as const] : [])]
    case 'delivery': return [...(role === 'pm' || lead ? ['warranty' as const] : []), ...(lead ? ['cancelled' as const] : [])]
    case 'warranty': return role === 'ma' || lead ? ['ended'] : []
    default: return []
  }
}

export type ProjectType = 'ซื้อขาย' | 'เช่าซื้อ' | 'พัฒนาระบบ' | 'MA'

export interface Person { id: string; name: string; initials: string; role: Role; team?: string; color: string }

export interface ApprovalSnapshot { revenue: number; cost: number; gp: number; contractValue?: number }

export interface Approval {
  version: string
  submittedAt: string
  steps: { who: string; role: string; status: 'approved' | 'pending' | 'rejected' | 'waiting'; at?: string; note?: string; whoId?: string; onBehalfOf?: string; channel?: 'web' | 'email_link' }[]
  /** stale = workbook changed after approval; recalled = SM pulled it back. */
  status?: 'pending' | 'approved' | 'rejected' | 'recalled' | 'stale'
  submittedBy?: string
  /** Figures read from the workbook's named ranges at submit time — what the approvers saw. */
  snapshot?: ApprovalSnapshot
  snapshotHash?: string
  /** SharePoint driveItem version + eTag captured at submit; any newer version makes the approval stale. */
  spVersionId?: string
  eTag?: string
  /** Read-only record copy: Cost Sheet/Submitted/vN.xlsx (retention label retainAsRecord). */
  archivedPath?: string
  validUntil?: string
  /** Post-award approval raised because the PO differs from the approved quote (P0-3). */
  postAward?: boolean
}

export type Sector = 'government' | 'soe' | 'enterprise' | 'other'
export interface Account {
  id: string
  name: string
  taxId?: string
  sector: Sector
  type: 'customer' | 'end_user' | 'partner' | 'competitor'
  parentId?: string
  province?: string
}

export interface ContractTerms {
  penaltyBasis: 'whole_contract' | 'undelivered_value'
  penaltyRatePerDay: number
  penaltyMinPerDay: number
  warrantyMonths: number
  slaTier?: string
  advancePct?: number
  whtRate: 0.01 | 0.03
}

export interface Task {
  id: string
  title: string
  assignee: string
  status: 'todo' | 'doing' | 'review' | 'done'
  due: string
  hours: number
  spent: number
  milestone: string
}

export type MilestoneState = 'planned' | 'delivered' | 'inspected' | 'invoiced' | 'paid'
export interface Milestone { name: string; start: string; end: string; progress: number; payment?: number; paid?: boolean; state?: MilestoneState; deliveredAt?: string }

/** Thai e-GP procurement sub-workflow (พ.ร.บ.จัดซื้อจัดจ้างฯ 2560). */
export interface BidInfo {
  method: 'e-bidding' | 'e-market' | 'คัดเลือก' | 'เฉพาะเจาะจง' | 'เอกชน'
  egpNo?: string
  refPrice?: number
  announce?: string
  submit?: string
  result?: string
  signed?: string
  ourBid?: number
  smeAdvantage?: boolean
}
export interface Bond { kind: 'bid' | 'performance'; pct: number; amount: number; form: string; bank: string; issued: string; expires: string; returned?: string }

export interface Project {
  id: string
  code: string
  name: string
  customer: string
  endUser: string
  type: ProjectType
  stage: StageKey
  team: string
  revenue: number
  cost: number
  budget: number
  sm: string
  sale: string
  pm?: string
  collaborators: string[]
  bidDue?: string
  expectedClose?: string
  startProject?: string
  endProject?: string
  startWarranty?: string
  endWarranty?: string
  nextStep: string
  cover: string
  /** Probability override (0–1); falls back to the stage weight. */
  probability?: number
  forecastCat?: ForecastCat
  /** ISO date the project entered its current stage — drives aging / stalled alerts. */
  stageSince?: string
  /** Revenue credit split between DT teams (must total 100%). */
  splits?: { team: string; pct: number }[]
  loss?: { reason: string; competitor?: string; price?: number }
  bid?: BidInfo
  bonds?: Bond[]
  penaltyRate?: number
  customerAccountId?: string
  endUserAccountId?: string
  salesMotion?: 'direct' | 'tender'
  /** Reason the SM/head overrode the default forecast category. */
  forecastReason?: string
  contractValue?: number
  reopenedFromId?: string
  terms?: ContractTerms
  handoverDone?: boolean
  parentId?: string
  approval?: Approval
  milestones?: Milestone[]
  tasks?: Task[]
  history: { stage: StageKey; note: string; at: string; by: string }[]
}
