import type { Account, Person, Project, Team } from './model'

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
  { id: 'rk', name: 'Ruttanachot K.', initials: 'RK', role: 'sm', team: 'DT4-LC', color: '#B0466E' },
  { id: 'np', name: 'Nattapong P.', initials: 'NP', role: 'sm', team: 'DT4-AI', color: '#3A63C9' },
  { id: 'sw', name: 'Supawadee W.', initials: 'SW', role: 'head', team: 'DT4', color: '#2E8A6E' },
  { id: 'kr', name: 'Kittiya R.', initials: 'KR', role: 'deputy', team: 'DT-EXEC', color: '#7A4FA3' },
  { id: 'tc', name: 'Thanakorn C.', initials: 'TC', role: 'exec', team: 'DT-EXEC', color: '#5B4BB7' },
  { id: 'pj', name: 'Pimchanok J.', initials: 'PJ', role: 'pmo', team: 'DT3-3', color: '#C26A1E' },
  { id: 'op', name: 'Orawan P.', initials: 'OP', role: 'opn', team: 'DT3-2', color: '#2F7D6D' },
  { id: 'ak', name: 'Arthit K.', initials: 'AK', role: 'pm', team: 'DT3-3', color: '#1F7FA8' },
  { id: 'ks', name: 'Kanokwan S.', initials: 'KS', role: 'pm', team: 'DT3-3', color: '#8E4FB5' },
  { id: 'wm', name: 'Wichai M.', initials: 'WM', role: 'ma', team: 'MA', color: '#4C7A2B' },
  { id: 'cc', name: 'Nipa S.', initials: 'NS', role: 'callcenter', team: 'MA', color: '#9C6B1F' },
  { id: 'dl', name: 'Somkiat L.', initials: 'SL', role: 'head', team: 'DT4-LC', color: '#3E5C76' },
  { id: 'dev1', name: 'Phuwadol T.', initials: 'PT', role: 'pm', team: 'DT4-LC', color: '#6B7280' },
  { id: 'dev2', name: 'Jiraporn L.', initials: 'JL', role: 'pm', team: 'DT4-LC', color: '#A15C38' },
  { id: 'dev3', name: 'Somchai R.', initials: 'SR', role: 'pm', team: 'DT4-LC', color: '#3F6E8C' },
  { id: 'dev4', name: 'Ploy N.', initials: 'PN', role: 'pm', team: 'DT4-AI', color: '#9A4060' },
  { id: 'dev5', name: 'Krit V.', initials: 'KV', role: 'pm', team: 'DT4-AI', color: '#53689A' },
]
export const person = (id?: string) => PEOPLE.find((p) => p.id === id)

// DT SBU structure 2026. One Platform starts with DT SBU, then extends to DB.
export const TEAMS: Team[] = [
  { code: 'DT1', name: 'Digital Infrastructure', group: 'DT1', kind: 'sales', target: 120_000_000, formerly: 'BU1 + BU2' },
  { code: 'DT2', name: 'Digital Security', group: 'DT2', kind: 'sales', target: 45_000_000, formerly: 'BU4' },
  { code: 'DT3', name: 'Digital Edge & Services', group: 'DT3', kind: 'sales', target: 60_000_000, formerly: 'BU5 + BU6' },
  { code: 'DT3-2', name: 'OPN — จัดซื้อและการเงินโครงการ', group: 'DT3', kind: 'support' },
  { code: 'DT3-3', name: 'PMO', group: 'DT3', kind: 'support' },
  { code: 'DT4-LC', name: 'Low Code', group: 'DT4', kind: 'sales', target: 40_000_000, formerly: 'BU3' },
  { code: 'DT4-CNA', name: 'CNA (Cloud Native App)', group: 'DT4', kind: 'sales', target: 35_000_000, formerly: 'BU3' },
  { code: 'DT4-IoT', name: 'IoT', group: 'DT4', kind: 'sales', target: 20_000_000, formerly: 'BU5-IoT' },
  { code: 'DT4-AI', name: 'AI', group: 'DT4', kind: 'sales', target: 30_000_000, formerly: 'BU3' },
  { code: 'MA', name: 'ทีม MA และ Call center', group: 'MA', kind: 'support' },
  { code: 'DT-EXEC', name: 'ผู้บริหาร DT', group: 'DT-EXEC', kind: 'exec' },
]
export const GROUP_NAME: Record<string, string> = {
  DT1: 'DT1 Digital Infrastructure', DT2: 'DT2 Digital Security', DT3: 'DT3 Digital Edge & Services', DT4: 'DT4 Digital Innovation', MA: 'ทีม MA', 'DT-EXEC': 'ผู้บริหาร DT',
}
export const SALES_TEAMS = TEAMS.filter((t) => t.kind === 'sales')
export const teamOf = (code?: string) => TEAMS.find((t) => t.code === code)
export const groupOf = (code: string) => teamOf(code)?.group ?? code.split('-')[0]

export const ACCOUNTS: Account[] = [
  { id: 'a-mof', name: 'กระทรวงพาณิชย์ดิจิทัล', sector: 'government', type: 'customer', province: 'กรุงเทพฯ' },
  { id: 'a-dtp', name: 'กรมส่งเสริมการค้าดิจิทัล', taxId: '0994000158761', sector: 'government', type: 'customer', parentId: 'a-mof', province: 'นนทบุรี' },
  { id: 'a-dtp-reg', name: 'กองทะเบียนธุรกิจ', sector: 'government', type: 'end_user', parentId: 'a-dtp' },
  { id: 'a-dtp-fin', name: 'กองคลัง', sector: 'government', type: 'end_user', parentId: 'a-dtp' },
  { id: 'a-slog', name: 'บมจ. สยามโลจิสติกส์', taxId: '0107561000412', sector: 'enterprise', type: 'customer', province: 'สมุทรปราการ' },
  { id: 'a-rubber', name: 'การยางแห่งภาคใต้', taxId: '0994000301145', sector: 'soe', type: 'customer', province: 'สงขลา' },
  { id: 'a-mnh', name: 'โรงพยาบาลเมืองใหม่', taxId: '0994000221093', sector: 'government', type: 'customer', province: 'ชลบุรี' },
  { id: 'a-cri', name: 'เทศบาลนครเชียงราย', taxId: '0994000447123', sector: 'government', type: 'customer', province: 'เชียงราย' },
  { id: 'a-tpd', name: 'บมจ. ไทยประกันพัฒนา', taxId: '0107537000981', sector: 'enterprise', type: 'customer', province: 'กรุงเทพฯ' },
  { id: 'a-port', name: 'การท่าเรือภาคตะวันออก', taxId: '0994000512330', sector: 'soe', type: 'customer', province: 'ชลบุรี' },
  { id: 'a-ed9', name: 'สำนักงานเขตพื้นที่การศึกษา 9', sector: 'government', type: 'customer', province: 'ขอนแก่น' },
  { id: 'a-cbank', name: 'ธนาคารชุมชนพัฒนา', taxId: '0105545000876', sector: 'enterprise', type: 'customer', province: 'กรุงเทพฯ' },
  { id: 'c-cyber', name: 'บจ. ไซเบอร์การ์ด', sector: 'enterprise', type: 'competitor' },
  { id: 'c-gov', name: 'บจ. โกฟเทค โซลูชัน', sector: 'enterprise', type: 'competitor' },
]
export const account = (id?: string) => ACCOUNTS.find((a) => a.id === id)

export const PROJECTS: Project[] = [
  {
    id: 'p1', code: 'OPP-69-0142', name: 'Comtech CT', customer: 'รอระบุลูกค้า', endUser: 'รอระบุลูกค้า', type: 'พัฒนาระบบ',
    stage: 'opportunity', team: 'DT4-LC', revenue: 0, cost: 0, budget: 1_000_000, sm: 'rk', sales: ['Pongsak T.'], collaborators: [],
    nextStep: 'ระบุลูกค้า ประเภทโครงการ Profit Center และนัดเก็บ Requirement', cover: PHOTOS.workshop, stageSince: '2026-10-15',
    history: [{ stage: 'opportunity', note: 'สร้างโครงการ งบประมาณลูกค้า ฿1,000,000', at: '15 ต.ค. 69', by: 'Ruttanachot K.' }],
  },
  { customerAccountId: 'a-dtp', endUserAccountId: 'a-dtp-reg', salesMotion: 'tender', 
    id: 'p2', code: 'PIP-69-0098', name: 'ระบบ e-Service ใบอนุญาตออนไลน์', customer: 'กรมส่งเสริมการค้าดิจิทัล', endUser: 'กองทะเบียนธุรกิจ', type: 'พัฒนาระบบ',
    stage: 'pipeline', team: 'DT4-LC', revenue: 18_400_000, cost: 12_950_000, budget: 19_500_000, sm: 'rk', sales: ['Sirinya B.', 'Pongsak T.'], collaborators: [],
    bidDue: '2026-12-10', expectedClose: '2026-12-28', nextStep: 'รอผู้บริหารอนุมัติใบเสนอราคา v3 ก่อนส่ง Sale', cover: PHOTOS.city, stageSince: '2026-09-30',
    splits: [{ team: 'DT4-LC', pct: 70 }, { team: 'DT4-AI', pct: 30 }],
    bid: { method: 'e-bidding', refPrice: 19_200_000 },
    approval: {
      version: 'v3', submittedAt: '4 พ.ย. 69 14:20', status: 'pending', submittedBy: 'rk', validUntil: '2027-01-03',
      snapshot: { revenue: 18_400_000, cost: 12_950_000, gp: 29.6 }, snapshotHash: '7c1e9a04b2d5f3e8a6c0', spVersionId: '14.0', eTag: '"{3F2A},14"',
      archivedPath: 'Cost Sheet/Submitted/v3.xlsx',
      steps: [
        { who: 'Ruttanachot K.', whoId: 'rk', role: 'SM ส่งขออนุมัติ', status: 'approved', at: '4 พ.ย. 14:20' },
        { who: 'Kittiya R.', whoId: 'kr', role: 'รองผู้บริหาร DT', approver: 'deputy', status: 'approved', channel: 'email_link', at: '5 พ.ย. 09:12', note: 'ปรับ Margin Hardware เหลือ 12% แล้ว ผ่าน' },
        { who: 'Thanakorn C.', whoId: 'tc', role: 'ผู้บริหาร DT', approver: 'exec', status: 'pending' },
      ],
    },
    history: [
      { stage: 'opportunity', note: 'สร้างโครงการ งบประมาณลูกค้า ฿19,500,000', at: '2 ก.ย. 69', by: 'Ruttanachot K.' },
      { stage: 'pipeline', note: 'ลูกค้าเริ่มเจรจา ส่ง TOR ฉบับร่าง', at: '30 ก.ย. 69', by: 'Ruttanachot K.' },
    ],
  },
  { customerAccountId: 'a-slog', salesMotion: 'direct', 
    id: 'p3', code: 'FC-69-0071', name: 'Data Lakehouse และ BI ผู้บริหาร', customer: 'บมจ. สยามโลจิสติกส์', endUser: 'ฝ่ายวางแผนกลยุทธ์', type: 'พัฒนาระบบ',
    stage: 'forecast', team: 'DT4-AI', revenue: 12_800_000, cost: 8_320_000, budget: 13_000_000, sm: 'np', sales: ['Kittipat O.'], collaborators: [],
    expectedClose: '2026-12-15', nextStep: 'รอลูกค้าออก PO ภายในสัปดาห์หน้า', cover: PHOTOS.server, stageSince: '2026-10-28', bid: { method: 'เอกชน' },
    history: [{ stage: 'forecast', note: 'ลูกค้าตกลงขอบเขตและราคาแล้ว', at: '28 ต.ค. 69', by: 'Nattapong P.' }],
  },
  { customerAccountId: 'a-rubber', salesMotion: 'tender', 
    id: 'p4', code: 'RB-69-0033', name: 'ระบบบริหารงานบุคคล HRMS', customer: 'การยางแห่งภาคใต้', endUser: 'กองบริหารทรัพยากรบุคคล', type: 'ซื้อขาย',
    stage: 'rebidding', team: 'DT4-CNA', revenue: 24_900_000, cost: 18_200_000, budget: 25_000_000, sm: 'rk', sales: ['Sirinya B.'], collaborators: [],
    bidDue: '2026-11-20', nextStep: 'ยื่นซองบน e-GP ก่อน 20 พ.ย. 16:00', cover: PHOTOS.board, stageSince: '2026-11-01',
    bid: { method: 'e-bidding', egpNo: '69109384521', refPrice: 25_000_000, announce: '2026-11-01', submit: '2026-11-20', ourBid: 24_900_000, smeAdvantage: false },
    bonds: [{ kind: 'bid', pct: 5, amount: 1_245_000, form: 'หนังสือค้ำประกันธนาคาร', bank: 'ธนาคารกรุงไทย', issued: '2026-11-12', expires: '2027-03-20' }],
    history: [{ stage: 'rebidding', note: 'ประกาศ TOR บน e-GP แล้ว', at: '1 พ.ย. 69', by: 'Ruttanachot K.' }],
  },
  { customerAccountId: 'a-mnh', salesMotion: 'tender', 
    id: 'p5', code: 'PIP-69-0110', name: 'Private Cloud เช่าใช้ 36 เดือน', customer: 'โรงพยาบาลเมืองใหม่', endUser: 'ศูนย์เทคโนโลยีสารสนเทศ', type: 'เช่าซื้อ',
    stage: 'pipeline', team: 'DT1', revenue: 31_500_000, cost: 25_100_000, budget: 33_000_000, sm: 'np', sales: ['Kittipat O.'], collaborators: [],
    expectedClose: '2027-02-15', nextStep: 'Demo ระบบ DR ให้ทีม IT ลูกค้า', cover: PHOTOS.office, stageSince: '2026-07-20', bid: { method: 'e-bidding' }, history: [],
  },
  { customerAccountId: 'a-cri', salesMotion: 'tender', handoverDone: true, terms: { penaltyBasis: 'whole_contract', penaltyRatePerDay: 0.001, penaltyMinPerDay: 100, warrantyMonths: 12, slaTier: 'มาตรฐาน 8x5', whtRate: 0.01 }, 
    id: 'p6', code: 'WIN-69-0021', name: 'Smart Permit Platform', customer: 'เทศบาลนครเชียงราย', endUser: 'กองช่าง', type: 'พัฒนาระบบ',
    stage: 'delivery', team: 'DT4-LC', revenue: 9_600_000, cost: 6_400_000, budget: 9_800_000, sm: 'rk', sales: ['Sirinya B.'], pm: 'ak', collaborators: ['dev1', 'dev2', 'dev3'],
    startProject: '2026-07-01', endProject: '2027-01-31', nextStep: 'UAT รอบ 2 วันที่ 18 พ.ย.', cover: PHOTOS.dev, stageSince: '2026-07-01', penaltyRate: 0.001,
    bid: { method: 'e-bidding', egpNo: '69047712093', refPrice: 9_900_000, announce: '2026-04-20', submit: '2026-05-08', result: '2026-05-29', signed: '2026-06-20', ourBid: 9_600_000 },
    bonds: [
      { kind: 'bid', pct: 5, amount: 480_000, form: 'หนังสือค้ำประกันธนาคาร', bank: 'ธนาคารกสิกรไทย', issued: '2026-05-06', expires: '2026-09-30', returned: '2026-07-02' },
      { kind: 'performance', pct: 5, amount: 480_000, form: 'หนังสือค้ำประกันธนาคาร', bank: 'ธนาคารกสิกรไทย', issued: '2026-06-18', expires: '2028-02-15' },
    ],
    handover: { meetingAt: '2026-06-28', attendees: [{ party: 'sm', who: 'rk', attended: true }, { party: 'pm', who: 'ak', attended: true }, { party: 'ma', who: 'wm', attended: true }, { party: 'opn', who: 'op', attended: true }, { party: 'devlead', who: 'dl', attended: true }] },
    ot: [
      { id: 'ot1', who: 'dev3', week: '27 ต.ค.', hours: 12, amount: 7_200, reason: 'แก้ปัญหาเชื่อมต่อ Thai QR ก่อน UAT รอบ 1', status: 'approved' },
      { id: 'ot2', who: 'dev2', week: '3 พ.ย.', hours: 16, amount: 9_600, reason: 'ปรับหน้าจอตรวจเอกสารตามความเห็นลูกค้า', status: 'approved' },
      { id: 'ot3', who: 'dev1', week: '10 พ.ย.', hours: 20, amount: 12_000, reason: 'เตรียมข้อมูลทดสอบ UAT รอบ 2', status: 'pending' },
    ],
    procurement: [
      { id: 'PR-69-0412', item: 'Server Rack 2U × 2 และ Storage 20TB', vendor: 'บจ. ดาต้าซิสเต็มส์', amount: 1_180_000, budgetLine: 'Server และ Storage', requestedBy: 'ak', at: '2026-08-12', status: 'po_issued' },
      { id: 'PR-69-0587', item: 'License ฐานข้อมูล 3 ปี', vendor: 'บจ. ซอฟต์แวร์ไลเซนส์', amount: 920_000, budgetLine: 'License ฐานข้อมูลและ OS (3 ปี)', requestedBy: 'ak', at: '2026-11-03', status: 'pending' },
      { id: 'PR-69-0590', item: 'SSL Certificate และ WAF 1 ปี', vendor: 'บจ. ไซเบอร์การ์ด', amount: 185_000, budgetLine: 'License ฐานข้อมูลและ OS (3 ปี)', requestedBy: 'ak', at: '2026-11-05', status: 'pending' },
    ],
    milestones: [
      { name: 'Kick-off & Requirement', start: '2026-07-01', end: '2026-07-31', progress: 100, payment: 960_000, paid: true, state: 'paid' },
      { name: 'Design & Prototype', start: '2026-08-01', end: '2026-09-15', progress: 100, payment: 1_920_000, paid: true, state: 'paid' },
      { name: 'Development Sprint 1–4', start: '2026-09-01', end: '2026-11-15', progress: 82, payment: 2_880_000, state: 'planned' },
      { name: 'UAT & Training', start: '2026-11-10', end: '2026-12-20', progress: 25, payment: 1_920_000, state: 'planned' },
      { name: 'Go-Live & Handover MA', start: '2026-12-21', end: '2027-01-31', progress: 0, payment: 1_920_000, state: 'planned' },
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
  { customerAccountId: 'a-tpd', salesMotion: 'direct', 
    id: 'p7', code: 'WIN-69-0034', name: 'AI Document OCR สำหรับงานสารบรรณ', customer: 'บมจ. ไทยประกันพัฒนา', endUser: 'ฝ่ายปฏิบัติการ', type: 'พัฒนาระบบ',
    stage: 'handover', team: 'DT4-AI', revenue: 7_200_000, cost: 4_680_000, budget: 7_500_000, sm: 'np', sales: ['Kittipat O.'], collaborators: [],
    expectedClose: '2026-10-30', nextStep: 'นัดประชุม Handover 10 พ.ย. — รอ PMO เลือก PM และทีม DT', cover: PHOTOS.meeting, stageSince: '2026-10-30',
    history: [{ stage: 'win', note: 'ได้ PO เลขที่ TP-2026-881', at: '30 ต.ค. 69', by: 'Nattapong P.' }],
  },
  { customerAccountId: 'a-mnh', salesMotion: 'tender', 
    id: 'p8', code: 'WIN-68-0112', name: 'ระบบจองคิวผู้ป่วยนอก', customer: 'โรงพยาบาลเมืองใหม่', endUser: 'แผนกผู้ป่วยนอก', type: 'พัฒนาระบบ',
    stage: 'warranty', team: 'DT4-CNA', revenue: 5_400_000, cost: 3_700_000, budget: 5_500_000, sm: 'rk', sales: ['Sirinya B.'], pm: 'ak', collaborators: [],
    startWarranty: '2025-12-05', endWarranty: '2026-12-05', nextStep: 'ส่งหนังสือแจ้งหมดประกัน + เสนอราคา MA ปี 2', cover: PHOTOS.talk,
    history: [{ stage: 'warranty', note: 'Go-Live และเริ่มรับประกัน 12 เดือน', at: '5 ธ.ค. 68', by: 'Arthit K.' }],
  },
  { customerAccountId: 'a-port', salesMotion: 'tender', 
    id: 'p9', code: 'WIN-68-0087', name: 'Network Monitoring Center', customer: 'การท่าเรือภาคตะวันออก', endUser: 'กองเทคโนโลยี', type: 'ซื้อขาย',
    stage: 'warranty', team: 'DT1', revenue: 14_200_000, cost: 11_300_000, budget: 15_000_000, sm: 'np', sales: ['Kittipat O.'], pm: 'ks', collaborators: [],
    startWarranty: '2025-11-28', endWarranty: '2026-11-28', nextStep: 'ลูกค้าตอบรับต่อ MA — รอ PO', cover: PHOTOS.server,
    history: [],
  },
  { customerAccountId: 'a-ed9', salesMotion: 'tender', 
    id: 'p10', code: 'WIN-68-0045', name: 'ระบบสารบรรณอิเล็กทรอนิกส์', customer: 'สำนักงานเขตพื้นที่การศึกษา 9', endUser: 'กลุ่มอำนวยการ', type: 'พัฒนาระบบ',
    stage: 'warranty', team: 'DT4-LC', revenue: 3_900_000, cost: 2_500_000, budget: 4_000_000, sm: 'rk', sales: ['Sirinya B.'], pm: 'ks', collaborators: [],
    startWarranty: '2026-02-01', endWarranty: '2027-01-31', nextStep: 'ปิด Ticket ค้าง 2 รายการ', cover: PHOTOS.desk, history: [],
  },
  { customerAccountId: 'a-cbank', salesMotion: 'direct', 
    id: 'p11', code: 'LOSE-69-0012', name: 'SOC as a Service', customer: 'ธนาคารชุมชนพัฒนา', endUser: 'ฝ่ายความปลอดภัยไซเบอร์', type: 'เช่าซื้อ',
    stage: 'lose', team: 'DT2', revenue: 11_000_000, cost: 8_900_000, budget: 10_000_000, sm: 'np', sales: ['Kittipat O.'], collaborators: [],
    nextStep: 'ราคาสูงกว่าคู่แข่ง 9% — เก็บไว้เสนอรอบงบปี 70', cover: PHOTOS.city, loss: { reason: 'ราคาสูงกว่าคู่แข่ง', competitor: 'บจ. ไซเบอร์การ์ด', price: 10_050_000 }, stageSince: '2026-08-14', history: [],
  },
  { customerAccountId: 'a-dtp', endUserAccountId: 'a-dtp-fin', salesMotion: 'tender', splits: [{ team: 'DT4-LC', pct: 50 }, { team: 'MA', pct: 50 }], 
    id: 'p12', code: 'MA-69-0004', name: 'MA ปีที่ 2 — ระบบบริหารครุภัณฑ์', customer: 'กรมส่งเสริมการค้าดิจิทัล', endUser: 'กองคลัง', type: 'MA',
    stage: 'warranty', team: 'DT4-LC', revenue: 1_200_000, cost: 640_000, budget: 1_200_000, sm: 'wm', sales: ['Sirinya B.'], collaborators: [],
    startWarranty: '2026-04-01', endWarranty: '2027-03-31', parentId: 'p2', nextStep: 'รายงาน SLA ไตรมาส 3', cover: PHOTOS.handshake, history: [],
  },
]

export const TICKETS = [
  { id: 'MA-2311', project: 'p8', title: 'ระบบส่ง SMS แจ้งคิวไม่ออกช่วงเช้า', severity: 'P1', status: 'กำลังแก้ไข', opened: '6 พ.ย. 08:42', sla: '4 ชม.', left: '1 ชม. 18 น.', owner: 'cc', resp: 'ตอบใน 12 น.', used: 68, paused: false, channel: 'Helpdesk' },
  { id: 'MA-2308', project: 'p9', title: 'Dashboard ไม่แสดงสถานะ Switch ชั้น 3', severity: 'P2', status: 'รอลูกค้ายืนยัน', opened: '5 พ.ย. 13:10', sla: '8 ชม.', left: 'หยุดนับ', owner: 'wm', resp: 'ตอบใน 40 น.', used: 55, paused: true, channel: 'โทรศัพท์' },
  { id: 'MA-2301', project: 'p10', title: 'ขอเพิ่มรายงานหนังสือเข้า-ออกรายไตรมาส', severity: 'CR', status: 'ประเมินราคา', opened: '1 พ.ย. 10:05', sla: '—', left: '—', owner: 'wm', resp: 'ตอบใน 2 ชม.', used: 0, paused: false, channel: 'อีเมล' },
  { id: 'MA-2296', project: 'p12', title: 'Export Excel ครุภัณฑ์ช้าเกิน 1 นาที', severity: 'P3', status: 'กำลังแก้ไข', opened: '30 ต.ค. 15:30', sla: '3 วัน', left: 'เกิน 6 ชม.', owner: 'wm', resp: 'ตอบช้า 1 ชม.', used: 108, paused: false, channel: 'Helpdesk' },
]

export const TODAY_ISO = '2026-11-06'
export const TODAY = new Date(TODAY_ISO)
export const daysUntil = (iso?: string) => (iso ? Math.round((new Date(iso).getTime() - TODAY.getTime()) / 86_400_000) : NaN)

export const baht = (n: number) => '฿' + n.toLocaleString('en-US')
export const mb = (n: number) => '฿' + (n / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'M'
export const thDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'

export const daysSince = (iso?: string) => (iso ? Math.round((TODAY.getTime() - new Date(iso).getTime()) / 86_400_000) : NaN)

// Thai public holidays used for working-day counts (e-GP appeal window, SLA business days).
const HOLIDAYS = new Set(['2026-12-05', '2026-12-10', '2026-12-31', '2027-01-01', '2026-10-13', '2026-10-23'])
const iso = (d: Date) => d.toISOString().slice(0, 10)
export function addWorkingDays(from: string, n: number) {
  const d = new Date(from)
  while (n > 0) {
    d.setDate(d.getDate() + 1)
    const wd = d.getDay()
    if (wd !== 0 && wd !== 6 && !HOLIDAYS.has(iso(d))) n--
  }
  return iso(d)
}
export const addDays = (from: string, n: number) => {
  const d = new Date(from)
  d.setDate(d.getDate() + n)
  return iso(d)
}

/** MA contract terms per warranty/MA project — renewal is keyed to the notice deadline, not the end date. */
export const CONTRACTS: Record<string, { noticeDays: number; uplift: number; gov: boolean; health: number; reasons: string[] }> = {
  p8: { noticeDays: 30, uplift: 0.12, gov: false, health: 62, reasons: ['P1 ซ้ำ 2 ครั้งใน 30 วัน', 'ชำระงวดสุดท้ายช้า 21 วัน'] },
  p9: { noticeDays: 60, uplift: 0.15, gov: true, health: 84, reasons: ['SLA ผ่าน 97%', 'ลูกค้าตอบรับต่อ MA'] },
  p10: { noticeDays: 30, uplift: 0.12, gov: true, health: 78, reasons: ['CR ค้างประเมิน 1 รายการ'] },
  p12: { noticeDays: 60, uplift: 0.1, gov: true, health: 55, reasons: ['P3 เกิน SLA', 'ผู้ใช้หลักฝั่งลูกค้าเปลี่ยนคน'] },
}
