import type { Person, Project } from './model'

// Unsplash footage — loaded by the viewer's browser; components fall back to a tone if blocked.
export const img = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`

export const PHOTOS = {
  login: 'photo-1497366216548-37526070297c',
  meeting: 'photo-1552664730-d307ca884978',
  team: 'photo-1522071820081-009f0129c71c',
  dev: 'photo-1551434678-e076c223a692',
  workshop: 'photo-1531482615713-2afd69097998',
  city: 'photo-1486406146926-c627a92ad1ab',
  office: 'photo-1497215728101-856f4ea42174',
  server: 'photo-1558494949-ef010cbdcc31',
  desk: 'photo-1504384308090-c894fdcc538d',
  talk: 'photo-1556761175-b413da4baf72',
  board: 'photo-1517245386807-bb43f82c33c4',
  handshake: 'photo-1600880292203-757bb62b4baf',
}

export const PEOPLE: Person[] = [
  { id: 'rk', name: 'Ruttanachot K.', initials: 'RK', role: 'sm', team: 'DT4-2', color: '#B0466E' },
  { id: 'np', name: 'Nattapong P.', initials: 'NP', role: 'sm', team: 'DT2', color: '#3A63C9' },
  { id: 'sw', name: 'Supawadee W.', initials: 'SW', role: 'head', team: 'DT4', color: '#2E8A6E' },
  { id: 'tc', name: 'Thanakorn C.', initials: 'TC', role: 'exec', color: '#5B4BB7' },
  { id: 'pj', name: 'Pimchanok J.', initials: 'PJ', role: 'pmo', color: '#C26A1E' },
  { id: 'ak', name: 'Arthit K.', initials: 'AK', role: 'pm', team: 'DT4-2', color: '#1F7FA8' },
  { id: 'ks', name: 'Kanokwan S.', initials: 'KS', role: 'pm', team: 'DT2', color: '#8E4FB5' },
  { id: 'wm', name: 'Wichai M.', initials: 'WM', role: 'ma', color: '#4C7A2B' },
  { id: 'dev1', name: 'Phuwadol T.', initials: 'PT', role: 'pm', team: 'DT4-2', color: '#6B7280' },
  { id: 'dev2', name: 'Jiraporn L.', initials: 'JL', role: 'pm', team: 'DT4-2', color: '#A15C38' },
  { id: 'dev3', name: 'Somchai R.', initials: 'SR', role: 'pm', team: 'DT4-2', color: '#3F6E8C' },
  { id: 'dev4', name: 'Ploy N.', initials: 'PN', role: 'pm', team: 'DT2', color: '#9A4060' },
  { id: 'dev5', name: 'Krit V.', initials: 'KV', role: 'pm', team: 'DT2', color: '#53689A' },
]
export const person = (id?: string) => PEOPLE.find((p) => p.id === id)

export const TEAMS = [
  { code: 'DT1', name: 'Enterprise Apps', target: 60_000_000 },
  { code: 'DT2', name: 'Data & AI', target: 45_000_000 },
  { code: 'DT3', name: 'Infra & Cloud', target: 80_000_000 },
  { code: 'DT4-1', name: 'Gov Digital — Portal', target: 35_000_000 },
  { code: 'DT4-2', name: 'Gov Digital — Platform', target: 40_000_000 },
  { code: 'DT5', name: 'Cyber Security', target: 30_000_000 },
]

export const PROJECTS: Project[] = [
  {
    id: 'p1', code: 'OPP-69-0142', name: 'Comtech CT', customer: 'รอระบุลูกค้า', endUser: 'รอระบุลูกค้า', type: 'พัฒนาระบบ',
    stage: 'opportunity', team: 'DT4-2', revenue: 0, cost: 0, budget: 1_000_000, sm: 'rk', sale: '', collaborators: [],
    nextStep: 'ระบุลูกค้า ประเภทโครงการ Profit Center และนัดเก็บ Requirement', cover: PHOTOS.workshop,
    history: [{ stage: 'opportunity', note: 'สร้างโครงการ งบประมาณลูกค้า ฿1,000,000', at: '15 ต.ค. 69', by: 'Ruttanachot K.' }],
  },
  {
    id: 'p2', code: 'PIP-69-0098', name: 'ระบบ e-Service ใบอนุญาตออนไลน์', customer: 'กรมส่งเสริมการค้าดิจิทัล', endUser: 'กองทะเบียนธุรกิจ', type: 'พัฒนาระบบ',
    stage: 'pipeline', team: 'DT4-2', revenue: 18_400_000, cost: 12_950_000, budget: 19_500_000, sm: 'rk', sale: 'Sirinya B.', collaborators: ['ak'],
    bidDue: '2026-12-10', expectedClose: '2026-12-28', nextStep: 'รอผู้บริหารอนุมัติใบเสนอราคา v3 ก่อนส่ง Sale', cover: PHOTOS.city,
    approval: {
      version: 'v3', submittedAt: '4 พ.ย. 69 14:20',
      steps: [
        { who: 'Ruttanachot K.', role: 'SM ส่งขออนุมัติ', status: 'approved', at: '4 พ.ย. 14:20' },
        { who: 'Supawadee W.', role: 'หัวหน้ากลุ่ม DT4', status: 'approved', at: '5 พ.ย. 09:12', note: 'ปรับ Margin Hardware เหลือ 12% แล้ว ผ่าน' },
        { who: 'Thanakorn C.', role: 'ผู้บริหาร', status: 'pending' },
      ],
    },
    history: [
      { stage: 'opportunity', note: 'สร้างโครงการ งบประมาณลูกค้า ฿19,500,000', at: '2 ก.ย. 69', by: 'Ruttanachot K.' },
      { stage: 'pipeline', note: 'ลูกค้าเริ่มเจรจา ส่ง TOR ฉบับร่าง', at: '30 ก.ย. 69', by: 'Ruttanachot K.' },
    ],
  },
  {
    id: 'p3', code: 'FC-69-0071', name: 'Data Lakehouse และ BI ผู้บริหาร', customer: 'บมจ. สยามโลจิสติกส์', endUser: 'ฝ่ายวางแผนกลยุทธ์', type: 'พัฒนาระบบ',
    stage: 'forecast', team: 'DT2', revenue: 12_800_000, cost: 8_320_000, budget: 13_000_000, sm: 'np', sale: 'Kittipat O.', collaborators: ['ks'],
    expectedClose: '2026-12-15', nextStep: 'รอลูกค้าออก PO ภายในสัปดาห์หน้า', cover: PHOTOS.server,
    history: [{ stage: 'forecast', note: 'ลูกค้าตกลงขอบเขตและราคาแล้ว', at: '28 ต.ค. 69', by: 'Nattapong P.' }],
  },
  {
    id: 'p4', code: 'RB-69-0033', name: 'ระบบบริหารงานบุคคล HRMS', customer: 'การยางแห่งภาคใต้', endUser: 'กองบริหารทรัพยากรบุคคล', type: 'ซื้อขาย',
    stage: 'rebidding', team: 'DT1', revenue: 24_900_000, cost: 18_200_000, budget: 25_000_000, sm: 'rk', sale: 'Sirinya B.', collaborators: [],
    bidDue: '2026-11-20', nextStep: 'ยื่นซองบน e-GP ก่อน 20 พ.ย. 16:00', cover: PHOTOS.board,
    history: [{ stage: 'rebidding', note: 'ประกาศ TOR บน e-GP แล้ว', at: '1 พ.ย. 69', by: 'Ruttanachot K.' }],
  },
  {
    id: 'p5', code: 'PIP-69-0110', name: 'Private Cloud เช่าใช้ 36 เดือน', customer: 'โรงพยาบาลเมืองใหม่', endUser: 'ศูนย์เทคโนโลยีสารสนเทศ', type: 'เช่าซื้อ',
    stage: 'pipeline', team: 'DT3', revenue: 31_500_000, cost: 25_100_000, budget: 33_000_000, sm: 'np', sale: 'Kittipat O.', collaborators: [],
    expectedClose: '2027-02-15', nextStep: 'Demo ระบบ DR ให้ทีม IT ลูกค้า', cover: PHOTOS.office, history: [],
  },
  {
    id: 'p6', code: 'WIN-69-0021', name: 'Smart Permit Platform', customer: 'เทศบาลนครเชียงราย', endUser: 'กองช่าง', type: 'พัฒนาระบบ',
    stage: 'delivery', team: 'DT4-2', revenue: 9_600_000, cost: 6_400_000, budget: 9_800_000, sm: 'rk', sale: 'Sirinya B.', pm: 'ak', collaborators: ['dev1', 'dev2', 'dev3'],
    startProject: '2026-07-01', endProject: '2027-01-31', nextStep: 'UAT รอบ 2 วันที่ 18 พ.ย.', cover: PHOTOS.dev,
    milestones: [
      { name: 'Kick-off & Requirement', start: '2026-07-01', end: '2026-07-31', progress: 100, payment: 960_000, paid: true },
      { name: 'Design & Prototype', start: '2026-08-01', end: '2026-09-15', progress: 100, payment: 1_920_000, paid: true },
      { name: 'Development Sprint 1–4', start: '2026-09-01', end: '2026-11-15', progress: 82, payment: 2_880_000 },
      { name: 'UAT & Training', start: '2026-11-10', end: '2026-12-20', progress: 25, payment: 1_920_000 },
      { name: 'Go-Live & Handover MA', start: '2026-12-21', end: '2027-01-31', progress: 0, payment: 1_920_000 },
    ],
    tasks: [
      { id: 't1', title: 'API ยื่นคำขออนุญาตก่อสร้าง', assignee: 'dev1', status: 'done', due: '2026-10-20', hours: 40, spent: 44, milestone: 'Development Sprint 1–4' },
      { id: 't2', title: 'หน้าจอตรวจสอบเอกสารของเจ้าหน้าที่', assignee: 'dev2', status: 'review', due: '2026-11-08', hours: 32, spent: 30, milestone: 'Development Sprint 1–4' },
      { id: 't3', title: 'เชื่อมต่อระบบชำระเงิน Thai QR', assignee: 'dev3', status: 'doing', due: '2026-11-04', hours: 24, spent: 31, milestone: 'Development Sprint 1–4' },
      { id: 't4', title: 'Dashboard สถิติคำขอรายเดือน', assignee: 'dev2', status: 'doing', due: '2026-11-14', hours: 20, spent: 8, milestone: 'Development Sprint 1–4' },
      { id: 't5', title: 'เตรียม Test Case UAT รอบ 2', assignee: 'ak', status: 'todo', due: '2026-11-16', hours: 16, spent: 0, milestone: 'UAT & Training' },
      { id: 't6', title: 'คู่มือผู้ใช้งาน (ประชาชน / เจ้าหน้าที่)', assignee: 'dev1', status: 'todo', due: '2026-12-05', hours: 24, spent: 0, milestone: 'UAT & Training' },
      { id: 't7', title: 'Security scan และ Pen-test ก่อน Go-Live', assignee: 'dev3', status: 'todo', due: '2026-12-15', hours: 16, spent: 0, milestone: 'UAT & Training' },
    ],
    history: [
      { stage: 'win', note: 'ได้รับสัญญาเลขที่ 45/2569', at: '20 มิ.ย. 69', by: 'Ruttanachot K.' },
      { stage: 'handover', note: 'ประชุม Handover มอบหมาย PM Arthit K.', at: '28 มิ.ย. 69', by: 'Pimchanok J.' },
      { stage: 'delivery', note: 'Kick-off กับลูกค้า', at: '1 ก.ค. 69', by: 'Arthit K.' },
    ],
  },
  {
    id: 'p7', code: 'WIN-69-0034', name: 'AI Document OCR สำหรับงานสารบรรณ', customer: 'บมจ. ไทยประกันพัฒนา', endUser: 'ฝ่ายปฏิบัติการ', type: 'พัฒนาระบบ',
    stage: 'handover', team: 'DT2', revenue: 7_200_000, cost: 4_680_000, budget: 7_500_000, sm: 'np', sale: 'Kittipat O.', collaborators: [],
    expectedClose: '2026-10-30', nextStep: 'นัดประชุม Handover 10 พ.ย. — รอ PMO เลือก PM และทีม DT', cover: PHOTOS.meeting,
    history: [{ stage: 'win', note: 'ได้ PO เลขที่ TP-2026-881', at: '30 ต.ค. 69', by: 'Nattapong P.' }],
  },
  {
    id: 'p8', code: 'WIN-68-0112', name: 'ระบบจองคิวผู้ป่วยนอก', customer: 'โรงพยาบาลเมืองใหม่', endUser: 'แผนกผู้ป่วยนอก', type: 'พัฒนาระบบ',
    stage: 'warranty', team: 'DT4-1', revenue: 5_400_000, cost: 3_700_000, budget: 5_500_000, sm: 'rk', sale: 'Sirinya B.', pm: 'ak', collaborators: [],
    startWarranty: '2025-12-05', endWarranty: '2026-12-05', nextStep: 'ส่งหนังสือแจ้งหมดประกัน + เสนอราคา MA ปี 2', cover: PHOTOS.talk,
    history: [{ stage: 'warranty', note: 'Go-Live และเริ่มรับประกัน 12 เดือน', at: '5 ธ.ค. 68', by: 'Arthit K.' }],
  },
  {
    id: 'p9', code: 'WIN-68-0087', name: 'Network Monitoring Center', customer: 'การท่าเรือภาคตะวันออก', endUser: 'กองเทคโนโลยี', type: 'ซื้อขาย',
    stage: 'warranty', team: 'DT3', revenue: 14_200_000, cost: 11_300_000, budget: 15_000_000, sm: 'np', sale: 'Kittipat O.', pm: 'ks', collaborators: [],
    startWarranty: '2025-11-28', endWarranty: '2026-11-28', nextStep: 'ลูกค้าตอบรับต่อ MA — รอ PO', cover: PHOTOS.server,
    history: [],
  },
  {
    id: 'p10', code: 'WIN-68-0045', name: 'ระบบสารบรรณอิเล็กทรอนิกส์', customer: 'สำนักงานเขตพื้นที่การศึกษา 9', endUser: 'กลุ่มอำนวยการ', type: 'พัฒนาระบบ',
    stage: 'warranty', team: 'DT1', revenue: 3_900_000, cost: 2_500_000, budget: 4_000_000, sm: 'rk', sale: 'Sirinya B.', pm: 'ks', collaborators: [],
    startWarranty: '2026-02-01', endWarranty: '2027-01-31', nextStep: 'ปิด Ticket ค้าง 2 รายการ', cover: PHOTOS.desk, history: [],
  },
  {
    id: 'p11', code: 'LOSE-69-0012', name: 'SOC as a Service', customer: 'ธนาคารชุมชนพัฒนา', endUser: 'ฝ่ายความปลอดภัยไซเบอร์', type: 'เช่าซื้อ',
    stage: 'lose', team: 'DT5', revenue: 11_000_000, cost: 8_900_000, budget: 10_000_000, sm: 'np', sale: 'Kittipat O.', collaborators: [],
    nextStep: 'ราคาสูงกว่าคู่แข่ง 9% — เก็บไว้เสนอรอบงบปี 70', cover: PHOTOS.city, history: [],
  },
  {
    id: 'p12', code: 'MA-69-0004', name: 'MA ปีที่ 2 — ระบบบริหารครุภัณฑ์', customer: 'กรมส่งเสริมการค้าดิจิทัล', endUser: 'กองคลัง', type: 'MA',
    stage: 'warranty', team: 'DT4-2', revenue: 1_200_000, cost: 640_000, budget: 1_200_000, sm: 'rk', sale: 'Sirinya B.', collaborators: [],
    startWarranty: '2026-04-01', endWarranty: '2027-03-31', parentId: 'p2', nextStep: 'รายงาน SLA ไตรมาส 3', cover: PHOTOS.handshake, history: [],
  },
]

export const TICKETS = [
  { id: 'MA-2311', project: 'p8', title: 'ระบบส่ง SMS แจ้งคิวไม่ออกช่วงเช้า', severity: 'P1', status: 'กำลังแก้ไข', opened: '6 พ.ย. 08:42', sla: '4 ชม.', left: '1 ชม. 18 น.', owner: 'wm' },
  { id: 'MA-2308', project: 'p9', title: 'Dashboard ไม่แสดงสถานะ Switch ชั้น 3', severity: 'P2', status: 'รอลูกค้ายืนยัน', opened: '5 พ.ย. 13:10', sla: '8 ชม.', left: 'ตามเป้า', owner: 'wm' },
  { id: 'MA-2301', project: 'p10', title: 'ขอเพิ่มรายงานหนังสือเข้า-ออกรายไตรมาส', severity: 'CR', status: 'ประเมินราคา', opened: '1 พ.ย. 10:05', sla: '—', left: '—', owner: 'wm' },
  { id: 'MA-2296', project: 'p12', title: 'Export Excel ครุภัณฑ์ช้าเกิน 1 นาที', severity: 'P3', status: 'กำลังแก้ไข', opened: '30 ต.ค. 15:30', sla: '3 วัน', left: 'เกิน 6 ชม.', owner: 'wm' },
]

export const TODAY = new Date('2026-11-06')
export const daysUntil = (iso?: string) => (iso ? Math.round((new Date(iso).getTime() - TODAY.getTime()) / 86_400_000) : NaN)

export const baht = (n: number) => '฿' + n.toLocaleString('en-US')
export const mb = (n: number) => '฿' + (n / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'M'
export const thDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'
