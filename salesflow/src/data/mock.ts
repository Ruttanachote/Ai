import { PM_TEMPLATES, type Account, type CatalogItem, type Person, type Project, type Task, type Team } from './model'

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
  { id: 'ak', name: 'Arthit K.', initials: 'AK', role: 'pm', team: 'DT3-3', color: '#1F7FA8', pmProfile: { skills: ['software', 'cloud'], onsite: false, note: 'ระบบ Web / Low Code ภาครัฐ', maxProjects: 3 } },
  { id: 'ks', name: 'Kanokwan S.', initials: 'KS', role: 'pm', team: 'DT3-3', color: '#8E4FB5', pmProfile: { skills: ['software', 'ai'], onsite: false, note: 'Mobile App · Scrum · AI/Data', maxProjects: 3 } },
  { id: 'pt', name: 'Prasert T.', initials: 'PT', role: 'pm', team: 'DT3-3', color: '#9A5B1E', pmProfile: { skills: ['hardware', 'network'], onsite: true, note: 'ติดตั้งอุปกรณ์และเครือข่าย ลงพื้นที่ต่างจังหวัดได้บ่อย', maxProjects: 4 } },
  { id: 'wn', name: 'Wanida N.', initials: 'WN', role: 'pm', team: 'DT3-3', color: '#2F7A8C', pmProfile: { skills: ['iot', 'hardware', 'cloud'], onsite: true, note: 'IoT · Smart City · Data Center', maxProjects: 3 } },
  { id: 'wm', name: 'Wichai M.', initials: 'WM', role: 'ma', team: 'MA', color: '#4C7A2B' },
  { id: 'cc', name: 'Nipa S.', initials: 'NS', role: 'callcenter', team: 'MA', color: '#9C6B1F' },
  { id: 'dl', name: 'Somkiat L.', initials: 'SL', role: 'head', team: 'DT4-LC', color: '#3E5C76' },
  { id: 'dev1', name: 'Phuwadol T.', initials: 'PT', role: 'dev', team: 'DT4-LC', color: '#6B7280', position: 'Back-end' },
  { id: 'dev2', name: 'Jiraporn L.', initials: 'JL', role: 'dev', team: 'DT4-LC', color: '#A15C38', position: 'Front-end' },
  { id: 'dev3', name: 'Somchai R.', initials: 'SR', role: 'dev', team: 'DT4-LC', color: '#3F6E8C', position: 'Back-end' },
  { id: 'dev4', name: 'Ploy N.', initials: 'PN', role: 'dev', team: 'DT4-AI', color: '#9A4060', position: 'Front-end' },
  { id: 'dev5', name: 'Krit V.', initials: 'KV', role: 'dev', team: 'DT4-AI', color: '#53689A', position: 'Full-stack' },
  { id: 'qa1', name: 'Nattaya S.', initials: 'NS', role: 'dev', team: 'DT4-LC', color: '#5E7D4F', position: 'QA' },
  { id: 'ba1', name: 'Kanokwan P.', initials: 'KP', role: 'dev', team: 'DT4-AI', color: '#8A6A2E', position: 'BA' },
  { id: 'sa1', name: 'Pornthep W.', initials: 'PW', role: 'dev', team: 'DT4-LC', color: '#2F6F6A', position: 'SA' },
  { id: 'ux1', name: 'Wipada C.', initials: 'WC', role: 'dev', team: 'DT4-LC', color: '#B0567A', position: 'UX/UI' },
  { id: 'ops1', name: 'Tanawat S.', initials: 'TS', role: 'dev', team: 'DT4-LC', color: '#4E5A7A', position: 'DevOps' },
]
export const person = (id?: string) => PEOPLE.find((p) => p.id === id)

// DT SBU structure 2026. One Platform starts with DT SBU, then extends to DB.
export const TEAMS: Team[] = [
  { code: 'DT1', name: 'Digital Infrastructure', group: 'DT1', kind: 'sales', target: 120_000_000, formerly: 'BU1 + BU2', headcount: 14, load: 0.82 },
  { code: 'DT2', name: 'Digital Security', group: 'DT2', kind: 'sales', target: 45_000_000, formerly: 'BU4', headcount: 8, load: 0.7 },
  { code: 'DT3', name: 'Digital Edge & Services', group: 'DT3', kind: 'sales', target: 60_000_000, formerly: 'BU5 + BU6', headcount: 11, load: 0.95 },
  { code: 'DT3-2', name: 'OPN — จัดซื้อและการเงินโครงการ', group: 'DT3', kind: 'support', head: 'op' },
  { code: 'DT3-3', name: 'PMO', group: 'DT3', kind: 'support', head: 'pj', note: 'มอบหมาย PM และติดตามโครงการที่ส่งมอบ' },
  { code: 'DT4-LC', name: 'Low Code', group: 'DT4', kind: 'sales', target: 40_000_000, formerly: 'BU3', headcount: 9, load: 0.9, head: 'dl', note: 'พัฒนาระบบด้วย Low Code สำหรับภาครัฐและองค์กร' },
  { code: 'DT4-CNA', name: 'CNA (Cloud Native App)', group: 'DT4', kind: 'sales', target: 35_000_000, formerly: 'BU3', headcount: 7, load: 1.08 },
  { code: 'DT4-IoT', name: 'IoT', group: 'DT4', kind: 'sales', target: 20_000_000, formerly: 'BU5-IoT', headcount: 5, load: 0.55 },
  { code: 'DT4-AI', name: 'AI', group: 'DT4', kind: 'sales', target: 30_000_000, formerly: 'BU3', headcount: 6, load: 0.78 },
  { code: 'MA', name: 'ทีม MA และ Call center', group: 'MA', kind: 'support', head: 'wm' },
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
      message: 'ขออนุมัติ Cost Sheet และใบเสนอราคา v3 ปรับ Margin Hardware เหลือ 12% ตามที่คุยในที่ประชุม ราคาเสนอต่ำกว่าราคากลาง ฿800,000',
      preMeeting: { date: '2026-11-04', place: 'Teams', attendees: ['sw', 'kr', 'tc'], summary: 'ทบทวนขอบเขต 4 โมดูล ลด Margin Hardware 18% → 12% และยืนยันทีม DT4-AI รับงาน OCR 30%' },
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
    approval: {
      version: 'v2', submittedAt: '20 ต.ค. 69 10:30', status: 'approved', submittedBy: 'np', validUntil: '2026-12-19',
      snapshot: { revenue: 12_800_000, cost: 8_320_000, gp: 35 }, archivedPath: 'Cost Sheet/Submitted/v2.xlsx',
      message: 'ขออนุมัติราคา Data Lakehouse ลูกค้าเอกชน ยืนยันขอบเขตแล้ว',
      preMeeting: { date: '2026-10-19', place: 'ห้องประชุม 12A', attendees: ['sw', 'kr'], summary: 'ทบทวน Man-day ทีม AI 180 วัน และ License BI 50 users' },
      steps: [
        { who: 'Nattapong P.', whoId: 'np', role: 'SM ส่งขออนุมัติ', status: 'approved', at: '20 ต.ค. 10:30' },
        { who: 'Kittiya R.', whoId: 'kr', role: 'รองผู้บริหาร DT', approver: 'deputy', status: 'approved', channel: 'email_link', at: '20 ต.ค. 15:02' },
        { who: 'Thanakorn C.', whoId: 'tc', role: 'ผู้บริหาร DT', approver: 'exec', status: 'approved', channel: 'web', at: '21 ต.ค. 09:40', note: 'อนุมัติ ให้คุม Man-day ตามแผน' },
      ],
    },
    history: [{ stage: 'forecast', note: 'ลูกค้าตกลงขอบเขตและราคาแล้ว', at: '28 ต.ค. 69', by: 'Nattapong P.' }],
  },
  { customerAccountId: 'a-rubber', salesMotion: 'tender', 
    id: 'p4', code: 'RB-69-0033', name: 'ระบบบริหารงานบุคคล HRMS', customer: 'การยางแห่งภาคใต้', endUser: 'กองบริหารทรัพยากรบุคคล', type: 'ซื้อขาย',
    stage: 'rebidding', team: 'DT4-CNA', revenue: 24_900_000, cost: 18_200_000, budget: 25_000_000, sm: 'rk', sales: ['Sirinya B.'], collaborators: [],
    bidDue: '2026-11-20', nextStep: 'ยื่นซองบน e-GP ก่อน 20 พ.ย. 16:00', cover: PHOTOS.board, stageSince: '2026-11-01',
    bid: { method: 'e-bidding', egpNo: '69109384521', refPrice: 25_000_000, announce: '2026-11-01', submit: '2026-11-20', ourBid: 24_900_000, smeAdvantage: false },
    bonds: [{ kind: 'bid', pct: 5, amount: 1_245_000, form: 'หนังสือค้ำประกันธนาคาร', bank: 'ธนาคารกรุงไทย', issued: '2026-11-12', expires: '2027-03-20' }],
    approval: {
      version: 'v2', submittedAt: '30 ต.ค. 69 11:00', status: 'approved', submittedBy: 'rk', validUntil: '2026-12-29',
      snapshot: { revenue: 24_900_000, cost: 18_200_000, gp: 26.9 }, archivedPath: 'Cost Sheet/Submitted/v2.xlsx',
      message: 'ขออนุมัติราคายื่นประมูล HRMS ต่ำกว่าราคากลาง ฿100,000',
      preMeeting: { date: '2026-10-29', place: 'ห้องประชุม 12A', attendees: ['sw', 'kr', 'tc'], summary: 'ทบทวนคู่แข่ง 3 ราย และยืนยันยื่นที่ ฿24.9M' },
      steps: [
        { who: 'Ruttanachot K.', whoId: 'rk', role: 'SM ส่งขออนุมัติ', status: 'approved', at: '30 ต.ค. 11:00' },
        { who: 'Kittiya R.', whoId: 'kr', role: 'รองผู้บริหาร DT', approver: 'deputy', status: 'approved', channel: 'email_link', at: '30 ต.ค. 16:20' },
        { who: 'Thanakorn C.', whoId: 'tc', role: 'ผู้บริหาร DT', approver: 'exec', status: 'approved', channel: 'email_link', at: '31 ต.ค. 08:55' },
      ],
    },
    history: [{ stage: 'rebidding', note: 'ประกาศ TOR บน e-GP แล้ว', at: '1 พ.ย. 69', by: 'Ruttanachot K.' }],
  },
  { customerAccountId: 'a-mnh', salesMotion: 'tender', 
    id: 'p5', code: 'PIP-69-0110', name: 'Private Cloud เช่าใช้ 36 เดือน', customer: 'โรงพยาบาลเมืองใหม่', endUser: 'ศูนย์เทคโนโลยีสารสนเทศ', type: 'เช่าซื้อ',
    stage: 'pipeline', team: 'DT1', revenue: 31_500_000, cost: 25_100_000, budget: 33_000_000, sm: 'np', sales: ['Kittipat O.'], collaborators: [],
    expectedClose: '2027-02-15', nextStep: 'Demo ระบบ DR ให้ทีม IT ลูกค้า', cover: PHOTOS.office, stageSince: '2026-07-20', bid: { method: 'e-bidding' }, history: [],
    approval: {
      version: 'v1', submittedAt: '6 พ.ย. 69 09:05', status: 'pending', submittedBy: 'np', validUntil: '2027-01-05',
      snapshot: { revenue: 31_500_000, cost: 25_100_000, gp: 20.3 }, archivedPath: 'Cost Sheet/Submitted/v1.xlsx',
      message: 'ขออนุมัติราคา Private Cloud 36 เดือน GP 20.3% ต่ำกว่าเกณฑ์ เนื่องจากราคา Hardware สูงขึ้น ขอพิจารณาเป็นกรณีพิเศษ',
      preMeeting: { date: '2026-11-05', place: 'Teams', attendees: ['kr', 'tc'], summary: 'ชี้แจง GP ต่ำกว่า 25% เพราะค่าเช่า Data Center ขยับ 8% ผู้บริหารให้ลองต่อรอง Vendor ก่อน' },
      steps: [
        { who: 'Nattapong P.', whoId: 'np', role: 'SM ส่งขออนุมัติ', status: 'approved', at: '6 พ.ย. 09:05' },
        { who: 'Kittiya R.', whoId: 'kr', role: 'รองผู้บริหาร DT', approver: 'deputy', status: 'pending' },
        { who: 'Thanakorn C.', whoId: 'tc', role: 'ผู้บริหาร DT', approver: 'exec', status: 'waiting' },
      ],
    },
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
    workspace: { template: 'milestone', key: 'SPP', nextNo: 15, createdAt: '2026-07-01',
      docs: [
        { id: 'd1', title: 'หน้าหลักโครงการ Smart Permit', kind: 'page', owner: 'ak', created: '2026-07-01', updated: '2026-11-02', folder: 'PM Report' },
        { id: 'd2', title: 'บันทึกประชุม Kick-off กับเทศบาล', kind: 'meeting', owner: 'ak', created: '2026-07-01', updated: '2026-07-02', folder: 'PM Report', parentId: 'd1' },
        { id: 'd3', title: 'รายงานความคืบหน้างวดที่ 3', kind: 'report', owner: 'ak', created: '2026-11-01', updated: '2026-11-05', folder: 'PM Report', parentId: 'd1' },
        { id: 'd4', title: 'แผนผังขั้นตอนอนุมัติใบอนุญาต (Whiteboard)', kind: 'whiteboard', owner: 'dev2', created: '2026-08-10', updated: '2026-09-12', folder: 'Document Config' },
        { id: 'd5', title: 'บันทึกประชุม UAT รอบ 1', kind: 'meeting', owner: 'ak', created: '2026-10-28', updated: '2026-10-29', folder: 'Document Inspection', parentId: 'd1' },
      ],
      forms: [
        { id: 'f1', name: 'แจ้งปัญหาจาก UAT', template: 'uat', createsType: 'bug', priority: 'high', audience: 'ลูกค้า', updated: '2026-10-27', by: 'ak', submissions: 7,
          fields: [{ label: 'หน้าจอที่พบปัญหา', kind: 'text', required: true }, { label: 'ขั้นตอนที่ทำ', kind: 'long', required: true }, { label: 'ผลกระทบ', kind: 'select', options: ['ใช้งานไม่ได้', 'ใช้ได้แต่ผิด', 'เล็กน้อย'] }] },
        { id: 'f2', name: 'ขอเปลี่ยนแปลงขอบเขต (Change request)', template: 'cr', createsType: 'story', priority: 'medium', audience: 'ลูกค้า', updated: '2026-10-15', by: 'ak', submissions: 3,
          fields: [{ label: 'สิ่งที่ต้องการเปลี่ยน', kind: 'long', required: true }, { label: 'เหตุผล', kind: 'long' }, { label: 'ต้องการภายในวันที่', kind: 'date' }] },
        { id: 'f3', name: 'แจ้งเหตุขัดข้อง (Incident)', template: 'incident', createsType: 'bug', priority: 'highest', audience: 'ทีมภายใน', updated: '2026-09-30', by: 'ak', submissions: 1,
          fields: [{ label: 'ระบบที่เกิดเหตุ', kind: 'text', required: true }, { label: 'เวลาที่เริ่มเกิด', kind: 'text' }, { label: 'ผลกระทบต่อผู้ใช้', kind: 'long', required: true }] },
      ],
      activity: [
      { who: 'dev3', at: '6 พ.ย. 16:10', day: '2026-11-06', key: 'SPP-5', title: 'เชื่อมต่อระบบชำระเงิน Thai QR', text: 'แสดงความคิดเห็น', status: 'doing' },
      { who: 'ak', at: '6 พ.ย. 11:02', day: '2026-11-06', key: 'SPP-9', title: 'อัปโหลดแบบแปลน PDF เกิน 20MB แล้วหน้าค้าง', text: 'สร้างงาน', status: 'todo' },
      { who: 'dev2', at: '6 พ.ย. 10:24', day: '2026-11-06', key: 'SPP-4', title: 'หน้าจอตรวจสอบเอกสารของเจ้าหน้าที่', text: 'เปลี่ยนสถานะเป็น รอตรวจ', status: 'review' },
      { who: 'ak', at: '5 พ.ย. 17:40', day: '2026-11-05', key: 'SPP-6', title: 'ขอ credentials Thai QR v3 จากธนาคาร', text: 'สร้างงาน', status: 'doing' },
      { who: 'dev2', at: '4 พ.ย. 15:05', day: '2026-11-04', key: 'SPP-8', title: 'Dashboard สถิติคำขอรายเดือน', text: 'เปลี่ยนสถานะเป็น กำลังทำ', status: 'doing' },
      { who: 'dev1', at: '21 ต.ค. 09:30', day: '2026-10-21', key: 'SPP-3', title: 'API ยื่นคำขออนุญาตก่อสร้าง', text: 'เปลี่ยนสถานะเป็น เสร็จ', status: 'done' },
    ] },
    tasks: [
      { id: 'e1', key: 'SPP-1', type: 'epic', title: 'ระบบยื่นคำขออนุญาตก่อสร้างออนไลน์', assignee: 'ak', reporter: 'ak', status: 'doing', priority: 'high', start: '2026-09-01', due: '2026-11-15', hours: 0, spent: 0, milestone: 'Development Sprint 1–4', created: '2026-07-02', updated: '2026-11-05' },
      { id: 'e2', key: 'SPP-2', type: 'epic', title: 'UAT และอบรมผู้ใช้งาน', assignee: 'ak', reporter: 'ak', status: 'todo', priority: 'high', start: '2026-11-10', due: '2026-12-20', hours: 0, spent: 0, milestone: 'UAT & Training', created: '2026-07-02', updated: '2026-11-01' },
      { id: 't1', key: 'SPP-3', type: 'story', parentId: 'e1', title: 'API ยื่นคำขออนุญาตก่อสร้าง', assignee: 'dev1', reporter: 'ak', status: 'done', priority: 'high', start: '2026-09-07', due: '2026-10-20', hours: 40, spent: 44, milestone: 'Development Sprint 1–4', created: '2026-09-01', updated: '2026-10-21', labels: ['backend'], description: 'REST API สำหรับยื่นคำขอ แนบไฟล์แบบแปลน และตรวจสถานะ ใช้มาตรฐาน API กลางของเทศบาล' },
      { id: 't2', key: 'SPP-4', type: 'story', parentId: 'e1', title: 'หน้าจอตรวจสอบเอกสารของเจ้าหน้าที่', assignee: 'dev2', reporter: 'ak', status: 'review', priority: 'medium', start: '2026-10-12', due: '2026-11-08', hours: 32, spent: 30, milestone: 'Development Sprint 1–4', created: '2026-09-01', updated: '2026-11-06', labels: ['frontend'],
        comments: [{ who: 'ak', at: '6 พ.ย. 10:20', text: 'ลูกค้าขอเพิ่มปุ่มส่งกลับให้ประชาชนแก้ไข ใส่ใน CR-03 แล้ว' }] },
      { id: 't3', key: 'SPP-5', type: 'task', parentId: 'e1', title: 'เชื่อมต่อระบบชำระเงิน Thai QR', assignee: 'dev3', reporter: 'ak', status: 'doing', priority: 'highest', start: '2026-10-19', due: '2026-11-04', hours: 24, spent: 31, milestone: 'Development Sprint 1–4', created: '2026-09-15', updated: '2026-11-06', labels: ['integration'],
        comments: [{ who: 'dev3', at: '5 พ.ย. 16:02', text: 'ธนาคารเปลี่ยน endpoint เป็น v3 รอ credentials ใหม่' }] },
      { id: 't3a', key: 'SPP-6', type: 'subtask', parentId: 't3', title: 'ขอ credentials Thai QR v3 จากธนาคาร', assignee: 'ak', reporter: 'dev3', status: 'doing', priority: 'highest', start: '2026-11-05', due: '2026-11-08', hours: 2, spent: 1, milestone: 'Development Sprint 1–4', created: '2026-11-05', updated: '2026-11-06' },
      { id: 't3b', key: 'SPP-7', type: 'subtask', parentId: 't3', title: 'ปรับ callback รับผลการชำระเงิน', assignee: 'dev3', reporter: 'dev3', status: 'todo', priority: 'high', start: '2026-11-09', due: '2026-11-12', hours: 8, spent: 0, milestone: 'Development Sprint 1–4', created: '2026-11-05', updated: '2026-11-05' },
      { id: 't4', key: 'SPP-8', type: 'story', parentId: 'e1', title: 'Dashboard สถิติคำขอรายเดือน', assignee: 'dev2', reporter: 'ak', status: 'doing', priority: 'medium', start: '2026-11-02', due: '2026-11-14', hours: 20, spent: 8, milestone: 'Development Sprint 1–4', created: '2026-09-15', updated: '2026-11-04', labels: ['frontend'] },
      { id: 'b1', key: 'SPP-9', type: 'bug', parentId: 'e1', title: 'อัปโหลดแบบแปลน PDF เกิน 20MB แล้วหน้าค้าง', assignee: 'dev1', reporter: 'ak', status: 'todo', priority: 'high', start: '2026-11-06', due: '2026-11-10', hours: 6, spent: 0, milestone: 'Development Sprint 1–4', created: '2026-11-06', updated: '2026-11-06', labels: ['UAT รอบ 1'] },
      { id: 't5', key: 'SPP-10', type: 'task', parentId: 'e2', title: 'เตรียม Test Case UAT รอบ 2', assignee: 'ak', reporter: 'ak', status: 'todo', priority: 'high', start: '2026-11-09', due: '2026-11-16', hours: 16, spent: 0, milestone: 'UAT & Training', created: '2026-10-20', updated: '2026-10-20' },
      { id: 't6', key: 'SPP-11', type: 'task', parentId: 'e2', title: 'คู่มือผู้ใช้งาน (ประชาชน / เจ้าหน้าที่)', assignee: 'dev1', reporter: 'ak', status: 'todo', priority: 'medium', start: '2026-11-23', due: '2026-12-05', hours: 24, spent: 0, milestone: 'UAT & Training', created: '2026-10-20', updated: '2026-10-20' },
      { id: 't7', key: 'SPP-12', type: 'task', parentId: 'e2', title: 'Security scan และ Pen-test ก่อน Go-Live', assignee: 'dev3', reporter: 'ak', status: 'todo', priority: 'high', start: '2026-12-07', due: '2026-12-15', hours: 16, spent: 0, milestone: 'UAT & Training', created: '2026-10-20', updated: '2026-10-20', labels: ['security'] },
      { id: 'u1', key: 'SPP-14', type: 'task', parentId: 'e2', title: 'จองห้องอบรมและเตรียมเครื่องลูกข่าย', assignee: '', reporter: 'ak', status: 'todo', priority: 'low', due: '', hours: 4, spent: 0, milestone: 'UAT & Training', created: '2026-11-03', updated: '2026-11-03' },
      { id: 't8', key: 'SPP-13', type: 'task', parentId: 'e2', title: 'อบรมเจ้าหน้าที่กองช่าง 2 รอบ', assignee: 'ak', reporter: 'ak', status: 'todo', priority: 'medium', start: '2026-12-14', due: '2026-12-18', hours: 12, spent: 0, milestone: 'UAT & Training', created: '2026-10-20', updated: '2026-10-20' },
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

// ── PM workspace seed: members, workflow, DoD and a Scrum project (p13) ──────────────────
import { defaultAutomation, defaultWorkflow } from '../domain/workflow.ts'
{
  const p6 = PROJECTS.find((p) => p.id === 'p6')!
  const ws = p6.workspace!
  ws.workflow = defaultWorkflow('milestone')
  ws.automation = defaultAutomation(ws.workflow)
  ws.estimate = 'hours'
  ws.hourlyRate = 600
  ws.members = [
    { userId: 'ak', role: 'pm' }, { userId: 'dl', role: 'lead' }, { userId: 'sa1', role: 'sa' }, { userId: 'ux1', role: 'uxui' },
    { userId: 'dev1', role: 'be' }, { userId: 'dev2', role: 'fe' }, { userId: 'dev3', role: 'be' }, { userId: 'ops1', role: 'devops' },
    { userId: 'qa1', role: 'qa' }, { userId: 'pj', role: 'viewer' },
  ]
  const T = (id: string) => p6.tasks!.find((t) => t.id === id)!
  T('t1').history = [{ at: '21 ต.ค. 09:30', day: '2026-10-21', who: 'qa1', field: 'สถานะ', from: 'UAT ลูกค้า', to: 'Done' }]
  T('t1').acceptance = [{ text: 'ยื่นคำขอพร้อมไฟล์แนบได้', done: true }, { text: 'ตรวจสถานะคำขอผ่าน API ได้', done: true }]
  T('t2').statusId = 'review'
  T('t2').acceptance = [{ text: 'เจ้าหน้าที่อนุมัติ / ตีกลับคำขอได้', done: true }, { text: 'ส่งกลับให้ประชาชนแก้ไขพร้อมเหตุผล (CR-03)', done: false }, { text: 'บันทึกประวัติการตรวจทุกครั้ง', done: true }]
  T('t2').history = [{ at: '6 พ.ย. 10:24', day: '2026-11-06', who: 'dev2', field: 'สถานะ', from: 'In Progress', to: 'Code Review' }]
  T('t2').attachments = [{ name: 'mockup-ตรวจเอกสาร-v2.fig', size: '3.2 MB', by: 'dev2', at: '2026-10-14', folder: 'Smart Permit/Work/SPP-4' }]
  T('t3').acceptance = [{ text: 'สร้าง QR ตามยอดค่าธรรมเนียม', done: true }, { text: 'รับ callback และอัปเดตสถานะชำระ', done: false }]
  T('t3').worklogs = [
    { who: 'dev3', day: '2026-11-05', hours: 6, note: 'ปรับ endpoint v3', from: '08:30', to: '15:30' },
    { who: 'dev3', day: '2026-11-04', hours: 8, note: 'ทดสอบ QR กับ Sandbox ธนาคาร', from: '08:30', to: '17:30' },
    { who: 'dev3', day: '2026-11-04', hours: 2, overtime: true, note: 'แก้ Timeout ก่อนส่ง UAT', from: '17:30', to: '19:30', evidence: ['commit-4f2a1c.png'] },
    { who: 'dev3', day: '2026-11-03', hours: 8, note: 'เชื่อม API สร้าง QR', from: '08:30', to: '17:30' },
    { who: 'dev3', day: '2026-11-02', hours: 7, note: 'ออกแบบ callback', from: '09:30', to: '17:30' },
    { who: 'dev3', day: '2026-10-27', hours: 12, overtime: true, note: 'แก้ปัญหาเชื่อมต่อ Thai QR ก่อน UAT รอบ 1' },
  ]
  T('t4').coAssignees = ['dev1']
  T('b1').acceptance = [{ text: 'อัปโหลดไฟล์ 50MB ได้โดยไม่ค้าง', done: false }, { text: 'แสดงแถบความคืบหน้าการอัปโหลด', done: false }]
  T('b1').statusId = 'readyqa'; T('b1').status = 'review'; T('b1').assignee = 'qa1'

  const d = (n: number) => { const x = new Date('2026-11-02T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10) }
  const done = (day: string, who: string) => [{ at: thDate(day), day, who, field: 'สถานะ', from: 'QA', to: 'Done' }]
  type Seed = [string, string, 'story' | 'task' | 'bug' | 'epic' | 'subtask', string, string, number, string, string?, string?]
  // [id, title, type, assignee, statusId, points, sprint, parentId, doneDay]
  const rows: Seed[] = [
    ['m-e1', 'สมัครสมาชิกและยืนยันตัวตน', 'epic', 'ks', 'doing', 0, ''],
    ['m-e2', 'แจ้งเรื่องร้องเรียนพร้อมพิกัด', 'epic', 'ks', 'doing', 0, ''],
    ['m1', 'หน้าลงทะเบียนด้วยเบอร์โทร + OTP', 'story', 'dev4', 'done', 5, 's1', 'm-e1', '2026-10-15'],
    ['m2', 'เชื่อม ThaID สำหรับยืนยันตัวตน', 'story', 'dev5', 'done', 8, 's2', 'm-e1', '2026-10-28'],
    ['m3', 'โปรไฟล์ผู้ใช้และที่อยู่', 'story', 'dev4', 'done', 3, 's3', 'm-e1', '2026-11-03'],
    ['m4', 'ถ่ายรูปและปักหมุดจุดที่พบปัญหา', 'story', 'dev5', 'done', 5, 's3', 'm-e2', '2026-11-05'],
    ['m5', 'ส่งเรื่องเข้าระบบ Back office ของเทศบาล', 'story', 'dev4', 'qa', 8, 's3', 'm-e2'],
    ['m6', 'ติดตามสถานะเรื่องร้องเรียน (Push notification)', 'story', 'dev5', 'review', 5, 's3', 'm-e2'],
    ['m7', 'แผนที่รวมเรื่องร้องเรียนใกล้ฉัน', 'story', 'dev4', 'doing', 3, 's3', 'm-e2'],
    ['m8', 'แอปปิดเองเมื่อถ่ายรูปบน Android 12', 'bug', 'dev5', 'todo', 2, 's3', 'm-e2'],
    ['m9', 'ประเมินความพึงพอใจหลังปิดเรื่อง', 'story', '', 'todo', 3, 's4', 'm-e2'],
    ['m10', 'ข่าวประชาสัมพันธ์จากเทศบาล', 'story', '', 'todo', 5, '', ''],
    ['m11', 'โหมดผู้สูงอายุ (ตัวอักษรใหญ่)', 'story', '', 'todo', 3, '', ''],
    ['m12', 'เขียน User story ระบบนัดหมายออนไลน์', 'task', 'ba1', 'doing', 2, 's3', ''],
  ]
  const wf = defaultWorkflow('scrum')
  let no = 1
  const tasks: Task[] = rows.map(([id, title, type, assignee, statusId, pts, sprint, parentId, dd]) => {
    const st = wf.statuses.find((s) => s.id === statusId)!
    return {
      id, key: `CSA-${no++}`, type, title, assignee, reporter: type === 'task' ? 'ks' : 'ba1', status: st.category, statusId, priority: type === 'bug' ? 'high' : 'medium',
      storyPoints: pts || undefined, sprint: sprint || undefined, parentId: parentId || undefined, hours: pts * 6, spent: st.category === 'done' ? pts * 6 : Math.round(pts * 2),
      due: type === 'epic' ? '2026-12-18' : sprint === 's3' ? '2026-11-13' : '', start: sprint === 's3' ? '2026-11-02' : undefined,
      milestone: ['s1', 's2', 's3'].includes(sprint) || parentId === 'm-e1' || id === 'm-e1' || id === 'm-e2' ? 'Sprint 1–3 · สมัครและแจ้งเรื่อง' : 'Sprint 4–6 · บริการเทศบาล', created: '2026-09-28', updated: dd ?? '2026-11-05',
      history: dd ? done(dd, 'qa1') : undefined,
      acceptance: type === 'story' ? [{ text: 'ผ่านเกณฑ์ตาม User story', done: st.category === 'done' || statusId === 'qa' }, { text: 'ทดสอบบน iOS และ Android', done: st.category === 'done' }] : undefined,
    }
  })
  PROJECTS.push({
    customerAccountId: 'a-dtp', salesMotion: 'direct',
    id: 'p13', code: 'DEL-69-0031', name: 'City Super App (Mobile)', customer: 'เทศบาลนครสมุทรสาคร', endUser: 'กองยุทธศาสตร์และงบประมาณ', type: 'พัฒนาระบบ',
    stage: 'delivery', team: 'DT4-CNA', revenue: 6_800_000, cost: 4_500_000, budget: 7_000_000, sm: 'np', sales: ['Kittipat O.'], pm: 'ks', collaborators: ['dev4', 'dev5'],
    nextStep: 'Sprint 3 — ส่งเรื่องร้องเรียนเข้า Back office', cover: PHOTOS.team, stageSince: '2026-09-25',
    milestones: [
      { name: 'Sprint 1–3 · สมัครและแจ้งเรื่อง', start: '2026-10-05', end: '2026-11-13', progress: 60, payment: 2_720_000, state: 'planned' },
      { name: 'Sprint 4–6 · บริการเทศบาล', start: '2026-11-16', end: '2026-12-25', progress: 0, payment: 2_720_000, state: 'planned' },
      { name: 'Go-Live และส่งต่อ MA', start: '2027-01-04', end: '2027-01-29', progress: 0, payment: 1_360_000, state: 'planned' },
    ],
    workspace: {
      template: 'scrum', key: 'CSA', nextNo: no, createdAt: '2026-09-28', estimate: 'points', hourlyRate: 650, workflow: wf, automation: defaultAutomation(wf),
      members: [{ userId: 'ks', role: 'pm' }, { userId: 'ba1', role: 'ba' }, { userId: 'dev4', role: 'fe' }, { userId: 'dev5', role: 'dev' }, { userId: 'dev3', role: 'devops' }, { userId: 'qa1', role: 'qa' }],
      sprints: [
        { id: 's1', name: 'CSA Sprint 1', start: '2026-10-05', end: '2026-10-16', state: 'closed', committed: 21, completed: 18, goal: 'ลงทะเบียนด้วย OTP' },
        { id: 's2', name: 'CSA Sprint 2', start: '2026-10-19', end: '2026-10-30', state: 'closed', committed: 24, completed: 22, goal: 'ยืนยันตัวตน ThaID' },
        { id: 's3', name: 'CSA Sprint 3', start: d(0), end: d(11), state: 'active', goal: 'แจ้งเรื่องร้องเรียนครบวงจร' },
        { id: 's4', name: 'CSA Sprint 4', start: d(14), end: d(25), state: 'planned' },
      ],
      activity: [
        { who: 'dev5', at: '5 พ.ย. 15:20', day: '2026-11-05', key: 'CSA-6', title: 'ถ่ายรูปและปักหมุดจุดที่พบปัญหา', text: 'เปลี่ยนสถานะเป็น Done', status: 'done' },
        { who: 'dev4', at: '5 พ.ย. 11:02', day: '2026-11-05', key: 'CSA-7', title: 'ส่งเรื่องเข้าระบบ Back office ของเทศบาล', text: 'เปลี่ยนสถานะเป็น QA', status: 'review' },
      ],
    },
    tasks,
    history: [{ stage: 'delivery', note: 'Kick-off Sprint 1', at: '5 ต.ค. 69', by: 'Kanya S.' }],
  })
}

// ── Preventive Maintenance plans (agreed in each proposal) and rounds ─────────────────────
import { planRounds } from '../domain/pm.ts'
{
  const set = (id: string, plan: Project['pmPlan'], sentUpTo: string, extra: (r: NonNullable<Project['pmRounds']>[number]) => void = () => {}) => {
    const p = PROJECTS.find((x) => x.id === id)!
    p.pmPlan = plan
    p.pmRounds = planRounds(p).map((r) => {
      if (r.due <= sentUpTo) Object.assign(r, { status: 'sent', preparedBy: plan!.preparer, preparedAt: r.due, sentBy: 'wm', sentAt: r.due, sentTo: plan!.customerEmail, summary: 'ระบบทำงานปกติ ตรวจ Log และสำรองข้อมูลครบ' })
      extra(r)
      return r
    })
  }
  set('p8', { cycle: 3, first: '2026-03-05', leadDays: 30, preparer: 'dev3', customerEmail: 'it-opd@mnh-hospital.go.th', template: PM_TEMPLATES[0] }, '2026-09-30')
  set('p9', { cycle: 6, first: '2026-05-28', leadDays: 30, preparer: 'dev4', customerEmail: 'noc@eastport.go.th', template: PM_TEMPLATES[1] }, '2026-06-30', (r) => {
    if (r.due === '2026-11-28') Object.assign(r, { status: 'ready', preparedBy: 'dev4', preparedAt: '2026-11-04', summary: 'อุปกรณ์ Core switch 2 ชุด Firmware ล่าสุด · Link utilisation สูงสุด 62%', findings: 'UPS ห้อง Server แบตเตอรี่เสื่อม 1 ลูก', advice: 'เปลี่ยนแบตเตอรี่ UPS ภายในไตรมาสนี้', files: ['PM-NMC-2569-R2.pdf', 'utilisation-ต.ค.-พ.ย.xlsx'] })
  })
  set('p10', { cycle: 1, first: '2026-02-15', leadDays: 10, preparer: 'dev1', customerEmail: 'saraban@sesao9.go.th', template: PM_TEMPLATES[0] }, '2026-10-31')
}

// ── Solution Catalog (product-led deals) ─────────────────────────────────────────────────
export const CATALOG: CatalogItem[] = [
  { id: 'c-saraban', name: 'e-Saraban สารบรรณอิเล็กทรอนิกส์', team: 'DT4-LC', summary: 'รับ–ส่งหนังสือ ลงนามอิเล็กทรอนิกส์ ทะเบียนหนังสือ เชื่อมระบบกลางภาครัฐ', price: 3_900_000, manday: 220, modules: ['ทะเบียนรับ–ส่ง', 'ลงนาม e-Signature', 'สืบค้นเอกสาร', 'รายงาน'], proposal: 'Proposal-eSaraban-template.docx', owner: 'rk' },
  { id: 'c-queue', name: 'Smart Queue จองคิวออนไลน์', team: 'DT4-CNA', summary: 'จองคิวผ่าน LINE / เว็บ แจ้งเตือน SMS ตู้กดบัตรคิว Dashboard ผู้บริหาร', price: 5_400_000, manday: 260, modules: ['จองคิว LINE OA', 'ตู้กดบัตร', 'SMS / แจ้งเตือน', 'Dashboard'], proposal: 'Proposal-SmartQueue-template.docx', owner: 'np' },
  { id: 'c-permit', name: 'e-Permit ใบอนุญาตออนไลน์', team: 'DT4-LC', summary: 'ยื่นคำขอใบอนุญาต ตรวจเอกสาร ชำระเงิน Thai QR ออกใบอนุญาตอิเล็กทรอนิกส์', price: 9_600_000, manday: 480, modules: ['ยื่นคำขอ', 'ตรวจเอกสาร', 'ชำระเงิน Thai QR', 'ใบอนุญาต e-License'], proposal: 'Proposal-ePermit-template.docx', owner: 'rk' },
  { id: 'c-ocr', name: 'AI Document OCR', team: 'DT4-AI', summary: 'อ่านเอกสารภาษาไทยด้วย AI จัดหมวดและดึงข้อมูลเข้าระบบอัตโนมัติ', price: 7_200_000, manday: 300, modules: ['OCR ภาษาไทย', 'จัดหมวดเอกสาร', 'ตรวจทานโดยคน', 'API'], proposal: 'Proposal-AI-OCR-template.docx', owner: 'np' },
]
{
  const link = (pid: string, cid: string) => { const p = PROJECTS.find((x) => x.id === pid); if (p) { p.origin = 'product'; p.catalogId = cid } }
  link('p10', 'c-saraban'); link('p8', 'c-queue'); link('p6', 'c-permit'); link('p7', 'c-ocr'); link('p2', 'c-permit')
  // Sales documents + TOR review on the pre-sale deals that are already past Forecast
  for (const id of ['p3', 'p4']) { const p = PROJECTS.find((x) => x.id === id)!; p.salesDocs = { tor: `TOR-Final-${p.code}-v2.docx`, proposal: `Proposal-${p.code}-v2.docx` }; p.torReview = { status: 'approved', version: 2, at: '2026-10-20', by: 'sw', decidedAt: '2026-10-21' } }
  const p2 = PROJECTS.find((x) => x.id === 'p2')!
  p2.requirement = { overview: 'ระบบ e-Service ยื่นขอใบอนุญาตธุรกิจออนไลน์ 12 ประเภท รองรับผู้ใช้ 30,000 ราย/ปี เชื่อมระบบ DOPA และ e-Payment', process: '1) ผู้ประกอบการยื่นคำขอ + แนบเอกสาร 2) เจ้าหน้าที่ตรวจ / ขอเอกสารเพิ่ม 3) ชำระค่าธรรมเนียม 4) อนุมัติ + ออกใบอนุญาต e-License 5) ต่ออายุ', meetings: [{ at: '2026-09-12', title: 'เก็บ Requirement กองทะเบียนธุรกิจ', notes: 'ต้องการเชื่อม DOPA · ลดเวลาอนุมัติจาก 15 เป็น 3 วัน' }], updated: '2026-10-02' }
  p2.salesDocs = { tor: 'TOR-Final-PIP-69-0098-v1.docx' }
  p2.torReview = { status: 'pending', version: 1, at: '2026-11-05' }
  const p4 = PROJECTS.find((x) => x.id === 'p4')!
  if (p4.bid) p4.bid.resultDue = '2026-11-07'
  // Renewal notices already sent before today
  const n = (id: string, round: 1 | 2, at: string) => { const p = PROJECTS.find((x) => x.id === id)!; p.renewalNotices = [...(p.renewalNotices ?? []), { round, at, to: p.pmPlan?.customerEmail ?? '' }] }
  n('p8', 1, '2026-09-06'); n('p9', 1, '2026-08-30')
}

// ── PM records: deliverables per installment, stakeholders, risks, meetings ─────────────
{
  const p6 = PROJECTS.find((x) => x.id === 'p6')!
  const [m0, m1, m2, m3, m4] = p6.milestones!
  Object.assign(m0, { pct: 10, deliverables: [{ name: 'แผนการดำเนินงาน + รายงาน Requirement', owner: 'ak', status: 'ready' }], finalCheck: { by: 'ak', at: '2026-07-28' }, sentAt: '2026-07-29', acceptance: { doc: 'หนังสือตรวจรับงวด1.pdf', at: '2026-08-08', by: 'ak' } })
  Object.assign(m1, { pct: 20, deliverables: [{ name: 'รายงานออกแบบระบบ (SA)', owner: 'sa1', status: 'ready' }, { name: 'Prototype หน้าจอ (UX/UI)', owner: 'ux1', status: 'ready' }], finalCheck: { by: 'ak', at: '2026-09-14' }, sentAt: '2026-09-15', acceptance: { doc: 'หนังสือตรวจรับงวด2.pdf', at: '2026-09-25', by: 'ak' } })
  Object.assign(m2, { pct: 30, deliverables: [{ name: 'ระบบยื่นคำขอ + ตรวจเอกสาร (ติดตั้งบน Staging)', owner: 'dev1', status: 'review' }, { name: 'รายงานผลทดสอบระบบ', owner: 'qa1', status: 'draft' }, { name: 'คู่มือติดตั้งระบบ', owner: 'ops1', status: 'draft' }] })
  Object.assign(m3, { pct: 20, deliverables: [{ name: 'รายงานผล UAT', owner: 'qa1', status: 'draft' }, { name: 'คู่มือผู้ใช้', owner: 'dev1', status: 'draft' }] })
  Object.assign(m4, { pct: 20, deliverables: [{ name: 'เอกสารส่งมอบระบบ + Source code', owner: 'ak', status: 'draft' }] })
  p6.stakeholders = [
    { id: 'sh1', side: 'customer', name: 'นายวีระ ชัยมงคล', position: 'ผู้อำนวยการกองช่าง', email: 'weera@chiangrai.go.th', phone: '053-711-xxx', focal: true, topics: 'ขั้นตอนอนุมัติใบอนุญาต' },
    { id: 'sh2', side: 'customer', name: 'นางสาวกมลวรรณ ศรีสุข', position: 'นักวิชาการคอมพิวเตอร์', email: 'kamonwan@chiangrai.go.th', topics: 'Server · ระบบชำระเงิน' },
    { id: 'sh3', side: 'us', name: 'Arthit K.', position: 'Project Manager', email: 'arthit@stream.co.th', focal: true },
    { id: 'sh4', side: 'us', name: 'Ruttanachot K.', position: 'Solution Manager', email: 'ruttanachot@stream.co.th' },
  ]
  p6.risks = [
    { id: 'r1', title: 'API ชำระเงินของธนาคารเปลี่ยนเวอร์ชันระหว่างพัฒนา', likelihood: 3, impact: 3, owner: 'dev3', plan: 'นัด Tech call กับธนาคาร 8 พ.ย. · เผื่อเวลาทดสอบ 1 สัปดาห์', status: 'open', at: '2026-11-03' },
    { id: 'r2', title: 'ผู้ใช้งานฝั่งลูกค้าว่างทดสอบ UAT ได้แค่ 2 วัน/สัปดาห์', likelihood: 2, impact: 2, owner: 'ak', plan: 'แบ่ง UAT เป็น 3 รอบย่อย', status: 'watch', at: '2026-10-20' },
    { id: 'r3', title: 'Server ลูกค้าส่งมอบล่าช้า 1 สัปดาห์', likelihood: 1, impact: 2, owner: 'ops1', plan: 'ใช้ Staging ของบริษัทชั่วคราว', status: 'open', at: '2026-10-10' },
  ]
  p6.meetings = [{ id: 'mt1', kind: 'kickoff', title: 'Kick-off Smart Permit Platform', date: '2026-07-01', time: '10:00', attendees: ['sh1', 'sh2', 'ak', 'rk', 'dl'], place: 'ศาลากลาง / Microsoft Teams', sentAt: '2026-06-28', by: 'ak' }]
  const p13 = PROJECTS.find((x) => x.id === 'p13')!
  p13.milestones!.forEach((m, i) => { m.pct = [40, 40, 20][i]; m.deliverables = [{ name: `เอกสารส่งมอบ ${m.name}`, owner: 'ks', status: 'draft' }] })
}
{
  const p6 = PROJECTS.find((x) => x.id === 'p6')!
  p6.staffRequests = [{ id: 'sr1', role: 'qa', count: 1, from: '2026-11-16', to: '2026-12-18', note: 'ช่วย QA ทดสอบ UAT รอบ 2', status: 'pending', by: 'ak', at: '2026-11-05' }]
}
