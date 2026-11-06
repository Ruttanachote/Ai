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
}

export const STAGES: Stage[] = [
  { key: 'opportunity', label: 'Opportunity', th: 'โอกาส', prob: '10–20%', phase: 'presale', owner: 'SM', hint: 'Requirement ลูกค้าตรงกับสินค้าหรือบริการที่เรามี' },
  { key: 'pipeline', label: 'Pipeline', th: 'กำลังเจรจา', prob: '40–50%', phase: 'presale', owner: 'SM', hint: 'มีโอกาสปิดได้ภายในปีนี้ ลูกค้าเริ่มเจรจาแล้ว' },
  { key: 'forecast', label: 'Forecast', th: 'คาดการณ์ปิด', prob: '70–80%', phase: 'presale', owner: 'SM', hint: 'ตกลงกับลูกค้าแล้ว คาดว่าปิดในไตรมาสนี้หรือหน้า' },
  { key: 'rebidding', label: 'Rebidding', th: 'ยื่นประมูล', prob: '70–80%', phase: 'presale', owner: 'SM', hint: 'กำลังเตรียมหรือยื่นประมูลแข่งบนเว็บไซต์' },
  { key: 'win', label: 'Close Win', th: 'ชนะงาน', prob: '100%', phase: 'result', owner: 'SM', hint: 'ได้ PO หรือสัญญาแล้ว' },
  { key: 'lose', label: 'Close Lose', th: 'ไม่ได้งาน', prob: '0%', phase: 'result', owner: 'หัวหน้ากลุ่ม', hint: 'จบโครงการ หัวหน้ากลุ่มเปิดกลับเป็น Pipeline ได้' },
  { key: 'handover', label: 'Handover', th: 'ส่งต่องาน', prob: '—', phase: 'postsale', owner: 'PMO', hint: 'ประชุมส่งต่องานจาก Pre-sale ให้ PM' },
  { key: 'delivery', label: 'In Delivery', th: 'กำลังส่งมอบ', prob: '—', phase: 'postsale', owner: 'PM', hint: 'PM และทีม Dev กำลังพัฒนาและส่งมอบ' },
  { key: 'warranty', label: 'Warranty', th: 'รับประกัน', prob: '—', phase: 'postsale', owner: 'MA', hint: 'Go-Live แล้ว ทีม MA ดูแล' },
  { key: 'ended', label: 'Ended', th: 'ปิดโครงการ', prob: '—', phase: 'postsale', owner: 'MA', hint: 'หมดประกัน ถ้าต่อสัญญาเปิดเป็นโครงการ MA ใหม่' },
  { key: 'cancelled', label: 'Cancelled', th: 'ยกเลิก', prob: '—', phase: 'postsale', owner: 'หัวหน้ากลุ่ม', hint: 'ยกเลิกหลังชนะงาน (Close Win ถึง In Delivery)' },
]

export const stageOf = (k: StageKey) => STAGES.find((s) => s.key === k)!

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

export interface Approval {
  version: string
  submittedAt: string
  steps: { who: string; role: string; status: 'approved' | 'pending' | 'rejected' | 'waiting'; at?: string; note?: string }[]
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

export interface Milestone { name: string; start: string; end: string; progress: number; payment?: number; paid?: boolean }

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
  parentId?: string
  approval?: Approval
  milestones?: Milestone[]
  tasks?: Task[]
  history: { stage: StageKey; note: string; at: string; by: string }[]
}
