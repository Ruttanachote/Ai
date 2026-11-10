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

export type Role = 'sm' | 'head' | 'deputy' | 'exec' | 'pmo' | 'opn' | 'pm' | 'dev' | 'ma' | 'callcenter' | 'admin'

// Sale is not a platform user — Sale names are kept on each project for reference only.
export const ROLES: Record<Role, { label: string; th: string }> = {
  sm: { label: 'Solution Manager (Pre-sale)', th: 'เก็บ Requirement กับ Sale ประเมิน Man-day ทำ Cost Sheet และใบเสนอราคาตาม TOR' },
  head: { label: 'หัวหน้ากลุ่ม / หัวหน้าทีม Dev', th: 'ดูยอดทั้งกลุ่ม เข้าประชุม Handover เปิดดีลใหม่จากงานที่แพ้ ยกเลิกโครงการ' },
  deputy: { label: 'รองผู้บริหาร DT', th: 'อนุมัติ Cost Sheet และใบเสนอราคาขั้นแรก' },
  exec: { label: 'ผู้บริหาร DT', th: 'อนุมัติขั้นสุดท้าย ดูยอดขายทุกกลุ่ม' },
  pmo: { label: 'PMO (DT3-3)', th: 'จัดประชุม Handover มอบหมาย PM และทีม Dev' },
  opn: { label: 'OPN (DT3-2)', th: 'จัดซื้อและการเงินโครงการ อนุมัติการเบิกจ่ายจัดซื้อ' },
  pm: { label: 'Project Manager', th: 'รับงานหลัง Handover คุมขอบเขต แผน ความเสี่ยง อนุมัติ OT ในวงเงินที่กันไว้' },
  dev: { label: 'ทีมพัฒนา (SA · BA · UX/UI · Dev · DevOps · QA)', th: 'ทำงานบนบอร์ดของโครงการที่เป็นสมาชิก บันทึกเวลา ไม่เห็นราคาและต้นทุน' },
  ma: { label: 'ทีม MA', th: 'ดูแลช่วงรับประกัน ติดต่อลูกค้าเรื่องต่อ MA ออกใบเสนอราคาต่อสัญญาเอง' },
  callcenter: { label: 'Call center (ทีม MA)', th: 'รับเคสลูกค้าผ่าน Helpdesk ช่วงรับประกัน' },
  admin: { label: 'ผู้ดูแลระบบ', th: 'ผู้ใช้ สิทธิ์ ทีม และการเชื่อมต่อ M365' },
}

/** Price approval chain for Cost Sheet + Quotation: deputy executive, then executive. */
export const APPROVAL_CHAIN: { role: Role; label: string }[] = [
  { role: 'deputy', label: 'รองผู้บริหาร DT' },
  { role: 'exec', label: 'ผู้บริหาร DT' },
]

export interface Team {
  code: string
  name: string
  group: string
  /** sales = profit centre with a target; support = OPN, PMO, MA; exec = DT management */
  kind: 'sales' | 'support' | 'exec'
  target?: number
  formerly?: string
}

/** Which stage transitions each role may perform (enforced server-side as well). */
export function allowedMoves(stage: StageKey, role: Role, type?: ProjectType): StageKey[] {
  const lead = role === 'head' || role === 'deputy' || role === 'exec' || role === 'admin'
  // MA-type renewals are sold by the MA team, so MA moves them through the sales stages.
  const sm = role === 'sm' || lead || (type === 'MA' && role === 'ma')
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

/** position: job title inside the dev team (SA, BA, UX/UI, Front-end, Back-end, Full-stack, DevOps, QA). */
export interface Person { id: string; name: string; initials: string; role: Role; team?: string; color: string; position?: string }

export interface ApprovalSnapshot { revenue: number; cost: number; gp: number; contractValue?: number }

export interface Approval {
  version: string
  submittedAt: string
  /** `approver` says which role decides this step (the submit step has none). */
  steps: { who: string; role: string; status: 'approved' | 'pending' | 'rejected' | 'waiting'; at?: string; note?: string; whoId?: string; approver?: Role; onBehalfOf?: string; channel?: 'web' | 'email_link' }[]
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
  /** Documents the approver asked to fix when sending it back. */
  fixDocs?: string[]
}

export type HandoverParty = 'sm' | 'pm' | 'ma' | 'opn' | 'devlead'
export const HANDOVER_PARTIES: { k: HandoverParty; label: string }[] = [
  { k: 'sm', label: 'SM (Pre-sale)' }, { k: 'pm', label: 'Project Manager' }, { k: 'ma', label: 'ทีม MA' },
  { k: 'opn', label: 'OPN (DT3-2)' }, { k: 'devlead', label: 'หัวหน้าทีม Dev' },
]
export interface HandoverAttendee { party: HandoverParty; who: string; attended: boolean }

/** OT reserve comes from the Cost Sheet line "เงินกันทำ OT"; PM approves within it. */
export interface OtRequest { id: string; who: string; week: string; hours: number; amount: number; reason: string; status: 'pending' | 'approved' | 'rejected' }

/** PR raised against the Cost Sheet's Hardware/Software budget; OPN (DT3-2) approves disbursement. */
export interface ProcurementRequest { id: string; item: string; vendor: string; amount: number; budgetLine: string; requestedBy: string; at: string; status: 'pending' | 'approved' | 'rejected' | 'po_issued'; note?: string }

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

export type WorkType = 'epic' | 'story' | 'task' | 'subtask' | 'bug'
export type Priority = 'highest' | 'high' | 'medium' | 'low' | 'lowest'
export type WorkStatus = 'todo' | 'doing' | 'review' | 'done'

export const WORK_TYPES: Record<WorkType, { label: string; color: string }> = {
  epic: { label: 'Epic', color: '#7b4fd6' },
  story: { label: 'Story', color: '#2e8a55' },
  task: { label: 'Task', color: '#2f6fd8' },
  subtask: { label: 'Sub-task', color: '#4d7ea8' },
  bug: { label: 'Bug', color: '#c4382f' },
}
export const PRIORITIES: Record<Priority, { label: string; rank: number }> = {
  highest: { label: 'สูงสุด', rank: 0 }, high: { label: 'สูง', rank: 1 }, medium: { label: 'ปานกลาง', rank: 2 }, low: { label: 'ต่ำ', rank: 3 }, lowest: { label: 'ต่ำสุด', rank: 4 },
}
/** Status categories (the fixed meaning behind custom workflow statuses). */
export const WORK_STATUS: Record<WorkStatus, { label: string; tone: string }> = {
  todo: { label: 'ยังไม่เริ่ม', tone: '' }, doing: { label: 'กำลังทำ', tone: 'presale' }, review: { label: 'รอตรวจ', tone: 'warn' }, done: { label: 'เสร็จ', tone: 'win' },
}

/** A work item in the PM workspace (list, board, calendar, timeline all read the same items). */
export interface Task {
  id: string
  title: string
  assignee: string
  status: WorkStatus
  /** '' = not scheduled yet (shown in the calendar's unscheduled panel). */
  due: string
  hours: number
  spent: number
  milestone: string
  key?: string
  type?: WorkType
  priority?: Priority
  reporter?: string
  parentId?: string
  sprint?: string
  start?: string
  created?: string
  updated?: string
  description?: string
  labels?: string[]
  comments?: { who: string; at: string; text: string }[]
  /** Custom workflow status id; `status` keeps the category so every metric still works. */
  statusId?: string
  storyPoints?: number
  coAssignees?: string[]
  acceptance?: { text: string; done: boolean }[]
  attachments?: { name: string; size: string; by: string; at: string; folder: string }[]
  history?: { at: string; day: string; who: string; field: string; from?: string; to?: string }[]
  worklogs?: { who: string; day: string; hours: number; overtime?: boolean; note?: string; from?: string; to?: string; evidence?: string[] }[]
  crId?: string
}

export type WorkspaceTemplate = 'kanban' | 'milestone' | 'scrum'
export const WORKSPACE_TEMPLATES: Record<WorkspaceTemplate, { label: string; th: string; views: string[] }> = {
  kanban: { label: 'Kanban', th: 'งานไหลต่อเนื่อง ดูบอร์ดและจำกัดงานที่กำลังทำ เหมาะกับงาน MA หรือทีมที่รับงานย่อยตลอด', views: ['summary', 'board', 'list', 'calendar'] },
  milestone: { label: 'ตามงวดงาน', th: 'แผนตามงวดงานในสัญญา มีรายการ ปฏิทิน และ Timeline เหมาะกับโครงการรัฐที่ส่งมอบเป็นงวด', views: ['summary', 'list', 'board', 'calendar', 'timeline'] },
  scrum: { label: 'Scrum', th: 'วางแผนเป็น Sprint 2 สัปดาห์ จัดลำดับ Backlog และติดตามความเร็วทีม เหมาะกับงานพัฒนาที่ขอบเขตปรับได้', views: ['summary', 'backlog', 'board', 'list', 'timeline'] },
}
export interface Sprint { id: string; name: string; start: string; end: string; goal?: string; state: 'planned' | 'active' | 'closed'; committed?: number; completed?: number }

/** Workflow per workspace. Each status maps to a category so dashboards keep one meaning of "done". */
export interface WorkflowStatus { id: string; name: string; category: WorkStatus; wipLimit?: number }
/** No transitions listed = any move allowed. `roles` limits who may make the move. */
export interface Transition { from: string; to: string; roles?: MemberRole[] }
export interface Workflow { statuses: WorkflowStatus[]; transitions: Transition[]; requireAcceptanceForDone: boolean }
export type MemberRole = 'pm' | 'lead' | 'sa' | 'ba' | 'uxui' | 'fe' | 'be' | 'dev' | 'devops' | 'qa' | 'viewer'
export const MEMBER_ROLES: Record<MemberRole, string> = {
  pm: 'PM', lead: 'หัวหน้าทีม Dev', sa: 'SA', ba: 'BA', uxui: 'UX/UI', fe: 'Front-end', be: 'Back-end', dev: 'Developer (Full-stack)', devops: 'DevOps', qa: 'QA', viewer: 'ดูอย่างเดียว',
}
/** What each workspace role is responsible for (shown in Settings → สมาชิก). */
export const MEMBER_ROLE_DESC: Record<MemberRole, string> = {
  pm: 'วางแผน ขอบเขต งวดงาน ประสานลูกค้า อนุมัติ OT',
  lead: 'จัดสรรคน ตรวจงาน อนุมัติย้ายงานเข้า Done',
  sa: 'ออกแบบโครงสร้างระบบทั้งหมด รวม Security ของ Server',
  ba: 'เก็บ Requirement วิเคราะห์ร่วม SA และ Assign งานให้ทีม',
  uxui: 'ออกแบบ Flow และประสบการณ์ใช้งานให้ใช้ได้จริง',
  fe: 'พัฒนาหน้าจอตามที่ UX/UI ออกแบบ',
  be: 'พัฒนาข้อมูล การเก็บ/ส่งข้อมูล และ API',
  dev: 'พัฒนาทั้ง Front-end และ Back-end',
  devops: 'ทดสอบ นำระบบขึ้น Server และประเมิน Performance',
  qa: 'ทดสอบตาม Process Flow ให้ถูกต้อง ไม่มี Bug · ย้ายงานเข้า Done',
  viewer: 'ดูความคืบหน้า ไม่แก้ไขงาน',
}
export interface WorkspaceMember { userId: string; role: MemberRole }
export interface AutomationRule { id: string; on: boolean; label: string; when: { toStatus: string }; then: { assignRole?: MemberRole; notify?: 'assignee' | 'pm' | 'reporter' } }
export interface WorkActivity { who: string; at: string; day: string; key: string; title: string; text: string; status?: WorkStatus }
export interface WorkDoc { id: string; title: string; kind: 'page' | 'meeting' | 'report' | 'whiteboard'; owner: string; created: string; updated: string; folder: string; parentId?: string }
export interface FormField { label: string; kind: 'text' | 'long' | 'select' | 'date'; options?: string[]; required?: boolean }
export interface WorkForm { id: string; name: string; template: string; createsType: WorkType; priority: Priority; fields: FormField[]; updated: string; by: string; submissions: number; audience: 'ลูกค้า' | 'ทีมภายใน' }
export interface Workspace { template: WorkspaceTemplate; key: string; nextNo: number; sprints?: Sprint[]; createdAt: string; activity?: WorkActivity[]; docs?: WorkDoc[]; forms?: WorkForm[]
  members?: WorkspaceMember[]; workflow?: Workflow; automation?: AutomationRule[]; estimate?: 'points' | 'hours'; hourlyRate?: number }

export type MilestoneState = 'planned' | 'delivered' | 'inspected' | 'invoiced' | 'paid'
export interface Deliverable { name: string; owner?: string; status: 'draft' | 'review' | 'ready' }
export interface Milestone {
  name: string; start: string; end: string; progress: number; payment?: number; paid?: boolean; state?: MilestoneState; deliveredAt?: string
  /** % of contract value for this installment (งวด). */
  pct?: number
  deliverables?: Deliverable[]
  finalCheck?: { by: string; at: string }
  sentAt?: string
  acceptance?: { doc: string; at: string; by: string }
}

/** Thai e-GP procurement sub-workflow (พ.ร.บ.จัดซื้อจัดจ้างฯ 2560). */
export interface BidInfo {
  method: 'e-bidding' | 'e-market' | 'คัดเลือก' | 'เฉพาะเจาะจง' | 'เอกชน'
  egpNo?: string
  refPrice?: number
  announce?: string
  submit?: string
  /** Expected result announcement date — SM is reminded the day before. */
  resultDue?: string
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
  /** Handover meeting: SM, PM, MA, OPN and the Dev team lead must all attend. */
  handover?: { meetingAt?: string; attendees: HandoverAttendee[] }
  /** Sale(s) working this deal with the SM — at least one. Reference only; Sale does not log in. */
  sales: string[]
  ot?: OtRequest[]
  procurement?: ProcurementRequest[]
  parentId?: string
  approval?: Approval
  milestones?: Milestone[]
  tasks?: Task[]
  /** PM workspace — created by the PM after Handover by choosing a template. */
  workspace?: Workspace
  history: { stage: StageKey; note: string; at: string; by: string }[]
  /** Preventive Maintenance cycle agreed in the proposal, and the rounds generated from it. */
  pmPlan?: PmPlan
  pmRounds?: PmRound[]
  /** Where the deal came from; product-led deals start from a Solution Catalog item. */
  origin?: 'customer' | 'product'
  catalogId?: string
  /** Requirement workspace (SM, pre-sale). */
  requirement?: { overview: string; process: string; meetings: { at: string; title: string; notes: string }[]; updated?: string }
  /** Sales documents checklist required at Forecast (70%). */
  salesDocs?: { tor?: string; proposal?: string }
  torReview?: { status: 'pending' | 'approved' | 'returned'; version: number; at: string; by?: string; note?: string; decidedAt?: string }
  stakeholders?: Stakeholder[]
  meetings?: Meeting[]
  risks?: Risk[]
  staffRequests?: StaffRequest[]
  /** PM hands the project to MA; MA confirms → Warranty. */
  maHandover?: { at: string; by: string; contact: string; docs: string[]; note?: string; acceptedAt?: string; acceptedBy?: string }
  deliveredAt?: string
  renewalNotices?: { round: 1 | 2; at: string; to: string }[]
  devNotified?: string
}

/* ---------------- Leave declaration (not synced with HR — a log of who is away and what it touches) ---------------- */
export type LeaveType = 'vacation' | 'personal' | 'sick' | 'other'
export const LEAVE_TYPES: Record<LeaveType, string> = { vacation: 'ลาพักร้อน', personal: 'ลากิจ', sick: 'ลาป่วย', other: 'อื่น ๆ' }
export type LeavePart = 'full' | 'am' | 'pm'
/** What the person (or PM) decided for one affected task. */
export type ImpactAction = 'pending' | 'before' | 'move' | 'reassign' | 'none'
export const IMPACT_ACTIONS: Record<ImpactAction, string> = { pending: 'ยังไม่เลือก', before: 'ทำเสร็จก่อนลา', move: 'ขอเลื่อนวันส่ง', reassign: 'ขอให้ PM ส่งต่อ', none: 'ไม่กระทบ (ทำได้ทัน)' }
export interface LeaveImpact { projectId: string; taskId: string; key: string; title: string; start?: string; due: string; action: ImpactAction; newDue?: string; reassignTo?: string; resolved?: boolean }
export interface Leave {
  id: string; who: string; from: string; to: string; part: LeavePart; type: LeaveType; note?: string
  createdAt: string; status: 'active' | 'cancelled'; impacts: LeaveImpact[]
  log: { at: string; who: string; text: string }[]
}

/* ---------------- Preventive Maintenance (PM report) rounds ---------------- */
/** Agreed at sales time: every 1, 3 or 6 months from the first round date. */
export interface PmPlan { cycle: 1 | 3 | 6; first: string; leadDays: number; preparer?: string; customerEmail?: string; template: string }
export type PmRoundStatus = 'planned' | 'preparing' | 'ready' | 'sent'
export interface PmRound {
  id: string; no: number; due: string; status: PmRoundStatus
  summary?: string; findings?: string; advice?: string; files?: string[]
  preparedBy?: string; preparedAt?: string; sentBy?: string; sentAt?: string; sentTo?: string; returned?: string
}
export const PM_CYCLES: Record<1 | 3 | 6, string> = { 1: 'รายเดือน', 3: 'ราย 3 เดือน', 6: 'ราย 6 เดือน' }
export const PM_TEMPLATES = ['รายงาน PM ระบบซอฟต์แวร์ (มาตรฐาน DT)', 'รายงาน PM ระบบเครือข่าย / Infrastructure', 'รายงาน PM อุปกรณ์ IoT']
export const MA_MAILBOX = 'ma-support@stream.co.th'

export interface Stakeholder { id: string; side: 'customer' | 'us'; name: string; position: string; email?: string; phone?: string; focal?: boolean; topics?: string }
export interface Meeting { id: string; kind: 'kickoff' | 'team' | 'requirement' | 'handover' | 'review'; title: string; date: string; time: string; attendees: string[]; place: string; sentAt: string; by: string }
export const MEETING_KINDS: Record<Meeting['kind'], string> = { kickoff: 'Kick-off', team: 'ประชุมทีม', requirement: 'เก็บ Requirement', handover: 'Handover', review: 'ทบทวนงวดงาน' }
export interface Risk { id: string; title: string; likelihood: 1 | 2 | 3; impact: 1 | 2 | 3; owner: string; plan: string; status: 'open' | 'watch' | 'closed'; at: string }
export const riskLevel = (r: Pick<Risk, 'likelihood' | 'impact'>) => { const v = r.likelihood * r.impact; return v >= 6 ? 'สูง' : v >= 3 ? 'กลาง' : 'ต่ำ' }
export interface StaffRequest { id: string; role: MemberRole; count: number; from: string; to: string; note?: string; status: 'pending' | 'filled' | 'declined'; by: string; at: string; filled?: string[]; decidedBy?: string }
/** Reusable solutions the teams sell again (Product-led deals start here). */
export interface CatalogItem { id: string; name: string; team: string; summary: string; price: number; manday: number; modules: string[]; proposal: string; owner: string }
export interface OutboxMail { id: string; at: string; from: string; to: string; subject: string; kind: 'email' | 'teams'; ref?: string }
export interface WeeklyReport { id: string; week: string; projectId: string; pm: string; done: number; open: number; late: number; hours: number; ot: number; at: string }
