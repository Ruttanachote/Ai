"""One Platform — System Analysis diagrams → docs/diagrams/one-platform-sa.drawio (+ sa-preview.html).
Run: python3 scripts/diagrams/sa.py [nav.json]

Architecture, module map, data model, state machine, permission matrix, one design page per module
(roles · screens · rules · data · integrations · main flow) and sequences for the newest features.
Content follows src/nav.ts, src/domain/*.ts, src/data/model.ts and server/src as of this commit.
"""
import json
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
from drawio import FONT, Page, free, sequence, write  # noqa: E402

pages: list[Page] = []
ROOT = os.path.join(os.path.dirname(__file__), '..', '..')

LEFT = 'align=left;spacingLeft=10;verticalAlign=top;spacingTop=6;'


def group(pg, title, x, y, w, h, fill='#F7F8FB', stroke='#CDD3DE'):
    """Titled container drawn behind its contents."""
    pg.cells.insert(1, (pg.nid(), title, f'rounded=1;arcSize=3;whiteSpace=wrap;html=1;fillColor={fill};strokeColor={stroke};verticalAlign=top;align=left;spacingLeft=10;spacingTop=4;fontStyle=1;' + FONT,
                        x, y, w, h, 'lane', {'fill': fill, 'stroke': stroke}))
    pg.w, pg.h = max(pg.w, x + w), max(pg.h, y + h)


def card(pg, title, lines, x, y, w, h, kind='box'):
    body = title + ('\n' + '\n'.join('• ' + l for l in lines) if lines else '')
    return pg.add(body, kind, x, y, w, h, style_extra=LEFT)


def chain(pg, steps, x, y, w=170, h=62, gap=26, per_row=7, kind='task'):
    """Main flow as a left-to-right chain that wraps; returns ids."""
    ids = []
    for i, (t, k) in enumerate(steps):
        r, c = divmod(i, per_row)
        cx = x + c * (w + gap) if r % 2 == 0 else x + (per_row - 1 - c) * (w + gap)
        ids.append(pg.add(t, k or kind, cx, y + r * (h + 46), w, h))
    for i in range(len(ids) - 1):
        r1, r2 = i // per_row, (i + 1) // per_row
        if r1 == r2:
            pg.edge(ids[i], ids[i + 1])
        else:
            pg.edge(ids[i], ids[i + 1], '', 'exitX=0.5;exitY=1;entryX=0.5;entryY=0;')
    return ids


# =====================================================================================
# SA-1 Architecture
# =====================================================================================
pg = free('SA-1 สถาปัตยกรรมระบบ', 'SA-1 · สถาปัตยกรรมระบบ (Logical Architecture)',
          'Web app บน Microsoft 365 ของบริษัท · กฎธุรกิจชุดเดียว (src/domain) ใช้ทั้งหน้าเว็บและ API · ข้อมูลหลักใน Database ไฟล์อยู่ใน SharePoint')
group(pg, 'ผู้ใช้ (11 บทบาท)', 30, 90, 230, 600, '#FFFFFF')
for i, t in enumerate(['SM · หัวหน้ากลุ่ม', 'รองผู้บริหาร · ผู้บริหาร DT', 'PMO · PM', 'ทีมพัฒนา (SA BA UX Dev QA)', 'OPN (จัดซื้อ/การเงิน)', 'ทีม MA · Call center', 'ผู้ดูแลระบบ']):
    pg.add(t, 'box', 50, 130 + i * 76, 190, 54)
group(pg, 'Presentation · Browser / มือถือ', 300, 90, 330, 600, '#F5F7FD', '#3457D5')
web = card(pg, 'Web App (Vue 3 + TypeScript)', ['Naive UI · Responsive 320–1920px', 'หน้าจอ 30+ ตามเมนูของบทบาท', 'canSee() ซ่อนเมนู/หน้าที่ไม่มีสิทธิ์', 'ตรวจกฎทันทีด้วย src/domain', 'Export Excel (.xlsx) / PDF ในเครื่อง'], 320, 130, 290, 180, 'sys')
pg.add('src/domain\nกฎธุรกิจชุดเดียวกับ Server\n(stage rules · cost sheet · OKR · calendar access)', 'sub', 320, 340, 290, 90)
pg.add('MSAL (Entra ID SSO)\nได้ App Role → เปิดโมดูลตามตำแหน่ง', 'ext', 320, 460, 290, 70)
pg.add('ดาวน์โหลดไฟล์ผ่านการยืนยันของผู้ใช้\n(xlsx · pdf · เอกสารโครงการ)', 'box', 320, 560, 290, 70)
group(pg, 'Application · API + Worker (Node.js)', 670, 90, 420, 600, '#F5F7FD', '#3457D5')
api = card(pg, 'REST API', ['/api/projects/:id/move → allowedMoves + validateMove', '/api/approvals/:id/approve|reject|recall', '/api/approvals/:id/can-send', '/api/graph/notifications (webhook)', 'ตรวจ Token Entra + Role ทุกคำขอ'], 690, 130, 380, 160, 'sys')
pg.add('Domain rules (ชุดเดียวกับหน้าเว็บ)\n97 ชุดทดสอบอัตโนมัติ', 'sub', 690, 310, 380, 60)
wk = card(pg, 'Worker / Scheduler', ['งานรายวัน dailyJobs(): ใบเสนอราคาใกล้หมดอายุ', 'วันประกาศผล −1 วัน · รอบ PM · ต่อประกัน 90/30 วัน', 'Outbox: อีเมล · Teams · สร้างโฟลเดอร์ (Retry)', 'Weekly report วันศุกร์'], 690, 390, 380, 140, 'sys')
pg.add('PDF Service\nใบเสนอราคา + ลายเซ็นอิเล็กทรอนิกส์', 'sys', 690, 550, 180, 70)
pg.add('Audit log\nทุกการเปลี่ยนแปลง', 'sys', 890, 550, 180, 70)
group(pg, 'Data', 1130, 90, 250, 330, '#FFFFFF')
db = card(pg, 'Database (PostgreSQL)', ['โครงการ · สถานะ · ประวัติ', 'Cost Sheet / Quotation Snapshot', 'Approval + ลายเซ็น', 'งาน · เวลา · OT · การลา', 'ทีม · เป้า · ผู้ใช้'], 1150, 130, 210, 170, 'box')
pg.add('Object storage\n(ไฟล์แนบชั่วคราว / Export)', 'box', 1150, 320, 210, 70)
group(pg, 'Microsoft 365 ของบริษัท', 1130, 450, 250, 400, '#FAF7FE', '#6A3FC4')
m365 = {}
for i, (k, t) in enumerate([('entra', 'Entra ID\nSSO · App Roles'), ('sp', 'SharePoint\nโฟลเดอร์โครงการ · เวอร์ชัน'), ('xl', 'Excel Online\nCost Sheet (OBO)'), ('ol', 'Outlook\nอีเมลอนุมัติ · กล่องกลาง MA'), ('tm', 'Teams\nนัดประชุม · แจ้งเตือน')]):
    m365[k] = pg.add(t, 'ext', 1150, 490 + i * 70, 210, 56)
pg.edge(web, api, 'HTTPS + Token', 'exitX=1;exitY=0.3;entryX=0;entryY=0.3;')
pg.edge(api, db, 'SQL', 'exitX=1;exitY=0.3;entryX=0;entryY=0.3;')
pg.edge(wk, db, '', 'exitX=1;exitY=0.3;entryX=0;entryY=0.8;')
pg.edge(api, m365['xl'], 'Graph API', 'dashed=1;exitX=1;exitY=0.8;entryX=0;entryY=0.5;')
pg.edge(wk, m365['ol'], 'Mail.Send', 'dashed=1;exitX=1;exitY=0.7;entryX=0;entryY=0.5;')
pg.add('ข้อกำหนดไม่ใช่ฟังก์ชัน\n• สิทธิ์ตรวจที่ Server ทุกครั้ง ไม่ใช่แค่ซ่อนปุ่ม\n• Sites.Selected จำกัดเฉพาะไซต์ Stream Projects\n• ข้อมูล M365 อยู่ Asia-Pacific → บันทึกการโอนข้อมูลตาม PDPA\n• สำรองข้อมูลรายวัน · Monitoring + Alert',
       'note', 30, 720, 600, 120)
pages.append(pg)

# =====================================================================================
# SA-2 Module map
# =====================================================================================
MODS = [
    ('M1', 'ฝ่ายขาย (SM)', 'ลงทะเบียน · Pipeline · ลูกค้า · Requirement/TOR · จัดซื้อ/ประมูล · เอกสาร · SM Dashboard', '#3457D5'),
    ('M2', 'Cost Sheet · ใบเสนอราคา · อนุมัติ', 'Excel ตาม Template · Quotation + PDF · อนุมัติ 2 ขั้น · ลายเซ็น', '#3457D5'),
    ('M3', 'Close Win · Handover', 'สัญญา/PO · ขอ PM · PMO เลือก PM · ประชุม 5 ฝ่าย · เงื่อนไขสัญญา', '#0F7F86'),
    ('M4', 'บริหารโครงการ (PM)', 'Workspace · Sprint · งวดงาน · Risk/CR · Stakeholder · Burndown', '#0F7F86'),
    ('M5', 'ทีมพัฒนา', 'My Tasks · Timesheet · OT · การลา · Weekly report · My Performance', '#0F7F86'),
    ('M6', 'จัดซื้อและการเงิน (OPN)', 'PR ในงบ Cost Sheet · หลักประกัน · งบ OT · เงินรับต่องวด', '#0F7F86'),
    ('M7', 'MA · Service Desk', 'ประกัน · รอบ PM · Ticket + SLA · แจ้งต่อสัญญา · ใบเสนอราคา MA', '#0F7F86'),
    ('M8', 'ผู้บริหาร · รายงาน', 'Executive Dashboard · Tracker · Mail Inbox · OKR Report', '#6A3FC4'),
]
pg = free('SA-2 แผนผัง Module', 'SA-2 · แผนผัง Module (Functional Decomposition)',
          'One Platform แบ่ง 8 Module ตามเส้นทางโครงการ + บริการกลางที่ทุก Module ใช้ร่วม · สีน้ำเงิน = ช่วงขาย · เขียว = หลังขาย · ม่วง = ผู้บริหาร')
root = pg.add('One Platform\nSales → Delivery → MA', 'system', 640, 80, 300, 90)
for i, (c, n, d, col) in enumerate(MODS):
    x = 40 + (i % 4) * 380
    y = 230 + (i // 4) * 200
    b = pg.add(f'{c} · {n}\n\n{d}', 'box', x, y, 340, 150, style_extra=f'strokeColor={col};strokeWidth=2;' + LEFT)
    pg.edge(root, b, '', 'edgeStyle=none;dashed=1;')
common = pg.add('บริการกลาง (ทุก Module)\nSSO + สิทธิ์ตามบทบาท · ขอบเขตข้อมูล (scope) · แจ้งเตือน (กระดิ่ง/อีเมล/Teams) · งานตามเวลา · Audit log · ปฏิทินกลาง · Profile + ลายเซ็น · ตั้งค่าระบบ (ทีม · ลำดับอนุมัติ · วันหยุด)',
                'sub', 40, 650, 1480, 80)
pg.add('ขอบเขตงานของ SM จบที่ Close Win (M1–M2) → ส่งต่อทีมพัฒนาและ PM (M3–M5) → ทีม MA ดูแลหลังส่งมอบ (M7)', 'note', 40, 760, 900, 50)
pages.append(pg)

# =====================================================================================
# SA-3 Data model
# =====================================================================================
pg = free('SA-3 แบบจำลองข้อมูล', 'SA-3 · แบบจำลองข้อมูลหลัก (Entity Relationship)',
          'ตามโครงสร้างใน src/data/model.ts · PK = id · FK แสดงเป็นเส้น · 1–* = หนึ่งต่อหลาย')
E = {}


def ent(k, name, fields, x, y, w=230, color='#334055'):
    h = 34 + len(fields) * 17
    E[k] = pg.add(name + '\n' + '\n'.join(fields), 'box', x, y, w, h, style_extra=f'strokeColor={color};' + LEFT + 'fontSize=11;')


ent('team', 'Team', ['code · name · group', 'kind: sales/support/exec', 'target (เป้าทีม)', 'headcount · head'], 30, 90)
ent('person', 'User / Person', ['id · name · role', 'team → Team', 'position · pmProfile', 'SignatureRec · Profile'], 30, 260)
ent('acct', 'Account (ลูกค้า)', ['id · name · taxId', 'type: customer/end_user', 'sector · parentId · province'], 30, 560)
ent('proj', 'Project', ['code · name · type (NNS/WT/MA/Rental/MS/SUB)', 'scope · stage (OPP…CXL) · stageSince', 'team · splits[] · sm · pm · sales[]', 'customerAccountId · endUserAccountId', 'budget · revenue · cost · contractValue', 'expectedClose · forecastCat · loss', 'salesMotion · parentId (MA ต่อจาก)'], 330, 90, 330, '#3457D5')
ent('hist', 'StageHistory / Activity', ['stage · note · at · by', 'type: field/file/approval/stage'], 330, 330)
ent('bid', 'BidInfo (จัดซื้อ/ประมูล)', ['method · egpNo · refPrice · ourBid', 'announce · submit · resultDue', 'result (ประกาศผู้ชนะ) · signed'], 330, 440)
ent('bond', 'Bond (หลักประกัน)', ['kind: bid/performance · pct', 'amount · bank · issued · expires', 'returned'], 330, 580)
ent('cs', 'CostSheet', ['docNo · revision · status', 'revenue[]: type·qty·unitPrice', 'costs[]: group 1–13·qty·price', 'payments[5] (รวม 100%)', 'refNo · profitCenter'], 720, 90, 260, '#3457D5')
ent('qt', 'Quotation', ['docNo · revision · status', 'costSheetId → CostSheet', 'items[] · discount · VAT', 'contact · terms · validUntil'], 720, 290, 260, '#3457D5')
ent('appr', 'Approval', ['version · status · validUntil', 'costSheetId · quotationId', 'snapshot{revenue,cost,gp}', 'preMeeting · message', 'steps[]: role·who·status·signature'], 720, 440, 260, '#3457D5')
ent('doc', 'ProjectDocument', ['folder (TOR, Contract, PO…)', 'versions[]: no·stdName·url', 'docNo · amount · deletedAt'], 1030, 90, 240)
ent('ws', 'Workspace', ['template: waterfall/scrum/kanban', 'members[] · sprints[]', 'workflow · automation'], 1030, 240, 240, '#0F7F86')
ent('task', 'Task (Work item)', ['key · type · status · assignee', 'due · estimate · sprint', 'worklogs[] · history[]'], 1030, 370, 240, '#0F7F86')
ent('ms', 'Milestone (งวดงาน)', ['name · start · end · progress', 'payment · deliverables', 'acceptance · invoiced · paid'], 1030, 500, 240, '#0F7F86')
ent('leave', 'Leave', ['who · from · to · part · type', 'impacts[] · status · log'], 1310, 90, 220, '#0F7F86')
ent('ot', 'OT Request', ['who · hours · evidence', 'status · decidedBy'], 1310, 210, 220, '#0F7F86')
ent('pr', 'Purchase Request', ['items · amount · costLine', 'status · OPN decision'], 1310, 310, 220, '#0F7F86')
ent('pmr', 'PM Round (Preventive)', ['no · due · status', 'report · sentAt (MA)'], 1310, 410, 220, '#0F7F86')
ent('tk', 'Ticket (Service Desk)', ['severity · status', 'openedAt · dueAt (SLA)'], 1310, 510, 220, '#0F7F86')
ent('tgt', 'SmTarget', ['who → User', 'amount (เป้าปี) · log'], 30, 430, 230, '#6A3FC4')
for a, b, l in [('team', 'person', '1–*'), ('person', 'proj', 'SM/PM 1–*'), ('acct', 'proj', '1–*'), ('team', 'proj', 'splits'), ('proj', 'hist', '1–*'), ('proj', 'bid', '1–1'), ('proj', 'bond', '1–*'),
                ('proj', 'cs', '1–*'), ('cs', 'qt', '1–*'), ('proj', 'appr', '1–1 ล่าสุด'), ('proj', 'doc', '1–*'), ('proj', 'ws', '1–1'), ('ws', 'task', '1–*'), ('proj', 'ms', '1–*'),
                ('task', 'leave', 'impacts'), ('task', 'ot', ''), ('cs', 'pr', 'งบ'), ('proj', 'pmr', '1–*'), ('proj', 'tk', '1–*'), ('person', 'tgt', '1–1')]:
    pg.edge(E[a], E[b], '', 'edgeStyle=none;endArrow=ERmany;endFill=0;startArrow=ERone;startFill=0;strokeColor=#8A94A6;')
pg.add('ความสัมพันธ์: เส้นทั้งหมดเป็น 1 ต่อหลาย (ฝั่งเส้นแตก = หลาย) ยกเว้น Project–BidInfo, Project–Workspace, User–SmTarget = 1 ต่อ 1 · Approval เก็บฉบับล่าสุดในโครงการ ฉบับเก่าอยู่ใน Activity\nการแบ่งยอดระหว่างทีม (splits) อ้าง Team · Leave.impacts อ้าง Task · Purchase Request ตรวจงบจาก CostSheet',
       'note', 30, 720, 1500, 60)
pages.append(pg)

# =====================================================================================
# SA-4 State machine with codes and guards
# =====================================================================================
pg = free('SA-4 สถานะและเงื่อนไข', 'SA-4 · Statechart สถานะโครงการ (ตัวย่อชุดที่เสนอ) พร้อมเงื่อนไขก่อนย้าย',
          'กฎเดียวกันทั้งหน้าเว็บและ API: allowedMoves (ใครย้าย) · validateMove / requirementsFor / closeWinRule / handoverGate (ต้องมีอะไร) · stageChecklist บอกว่ากรอกที่ไหน')
group(pg, 'ช่วงขาย · Pre-sale (SM ดูแล)', 30, 90, 1020, 250, '#EEF2FD', '#3457D5')
group(pg, 'ผลการขาย', 1080, 90, 220, 520, '#EAF6EF', '#17845A')
group(pg, 'ช่วงหลังขาย · PMO / PM / MA ดูแล', 30, 400, 1020, 210, '#E8F5F5', '#0F7F86')
S = {}
for i, (k, t) in enumerate([('opp', 'OPP\nOpportunity · 10–20%'), ('pl', 'PL\nPipeline · 40–50%'), ('fc', 'FC\nForecast · 70–80%'), ('rb', 'RB\nRebidding · 70–80%')]):
    S[k] = pg.add(t, 'state', 60 + i * 250, 140, 190, 64)
S['cw'] = pg.add('CW\nClose Win · 100%', 'state', 1100, 140, 180, 64, style_extra='strokeColor=#17845A;strokeWidth=2;')
S['cl'] = pg.add('CL\nClose Lose · 0%', 'end', 1150, 290, 135, 60)
for i, (k, t) in enumerate([('ho', 'HO\nHandover (PMO / หัวหน้ากลุ่มย้าย)'), ('dl', 'DL\nIn Delivery'), ('wr', 'WR\nWarranty'), ('end', 'END\nEnded')]):
    S[k] = pg.add(t, 'state', 790 - i * 250, 450, 190, 64)
S['cxl'] = pg.add('CXL\nCancelled', 'end', 1105, 520, 170, 60)
pg.edge(S['opp'], S['pl'], 'SM')
pg.edge(S['pl'], S['fc'], 'SM')
pg.edge(S['fc'], S['rb'], 'SM')
pg.edge(S['rb'], S['cw'], 'SM')
pg.edge(S['pl'], S['rb'], 'SM (งานรัฐ)', 'exitX=0.5;exitY=0;entryX=0.5;entryY=0;')
pg.edge(S['fc'], S['cw'], 'SM (เอกชน)', 'exitX=0.5;exitY=1;entryX=0.25;entryY=1;')
pg.edge(S['cw'], S['ho'], '', 'exitX=0.08;exitY=1;entryX=1;entryY=0.5;')
pg.edge(S['ho'], S['dl'], 'PM / PMO')
pg.edge(S['dl'], S['wr'], 'PM')
pg.edge(S['wr'], S['end'], 'MA')
pg.edge(S['rb'], S['cl'], 'ทุกสถานะช่วงขาย (SM)', 'dashed=1;exitX=0.5;exitY=1;entryX=0;entryY=0.5;')
pg.edge(S['dl'], S['cxl'], 'หัวหน้ากลุ่มอนุมัติ\n(CW · HO · DL)', 'dashed=1;exitX=0.5;exitY=1;entryX=0;entryY=0.5;')
pg.add('SM จบงานที่ CW → แถบสถานะของ SM แสดง "ส่งต่อทีม & PM"', 'note', 60, 260, 420, 50)
G = [('→ PL', 'เลือกลูกค้าจากทะเบียน · ทีม DT · Sale ≥ 1 คน'),
     ('→ FC', 'Cost Sheet + Quotation อนุมัติครบ ไม่หมดอายุ · Expected Close · TOR Final ผ่านหัวหน้ากลุ่ม · Proposal · งานรัฐ: วิธีจัดซื้อ'),
     ('→ RB', 'ทุกข้อของ FC + เลข e-GP + ราคากลาง (แท็บ จัดซื้อ / ประมูล)'),
     ('→ CW', 'สัญญา/PO ในโฟลเดอร์ · มูลค่าสัญญาเทียบที่อนุมัติ (±2%, GP ลด ≤ 3 จุด) · งานรัฐ: e-GP + ประกาศผู้ชนะ + พ้นอุทธรณ์ 7 วันทำการ'),
     ('→ HO', 'ยืนยันเกณฑ์ออกจาก CW (PMO มอบหมาย PM)'),
     ('→ DL', 'PM · ประชุม Handover ครบ 5 ฝ่าย · Checklist · ค่าปรับ 0.01–0.20%/วัน + ระยะประกัน · งานรัฐ: หลักประกันสัญญา'),
     ('→ CL', 'เหตุผลที่แพ้ (บังคับ) · ผู้ชนะ ถ้าแพ้ด้านราคา/ความสัมพันธ์ · เปิดใหม่ = โครงการใหม่ (Win rate ไม่เปลี่ยน)'),
     ('→ CXL', 'เหตุผลการยกเลิก · หัวหน้ากลุ่มเท่านั้น')]
group(pg, 'Guard ก่อนย้ายสถานะ (requirementsFor · closeWinRule · handoverGate)', 30, 640, 1270, 40 + len(G) * 30, '#FFFFFF')
for i, (a, b) in enumerate(G):
    pg.add(a, 'state', 50, 675 + i * 30, 70, 24, style_extra='fontSize=11;')
    pg.cells.append((pg.nid(), b, 'text;html=1;align=left;verticalAlign=middle;' + FONT + 'fontSize=12;', 132, 675 + i * 30, 1150, 24, 'label', {}))
pages.append(pg)

# =====================================================================================
# SA-5 Permission matrix (from src/nav.ts)
# =====================================================================================
nav_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'docs', 'diagrams', 'nav.json')
NAV = json.load(open(nav_path, encoding='utf-8'))
ROLES = [('sm', 'SM'), ('head', 'หัวหน้ากลุ่ม'), ('deputy', 'รองผู้บริหาร'), ('exec', 'ผู้บริหาร'), ('pmo', 'PMO'), ('opn', 'OPN'), ('pm', 'PM'), ('dev', 'Dev'), ('ma', 'MA'), ('callcenter', 'Call center'), ('admin', 'Admin')]
pg = free('SA-5 สิทธิ์ตามบทบาท', 'SA-5 · สิทธิ์เข้าเมนูตามบทบาท (Role × เมนู)',
          'สร้างจาก src/nav.ts · ● = เห็นเมนูและใช้งาน · ข้อมูลในหน้าถูกจำกัดอีกชั้นตาม scope (SM เห็นโครงการตัวเอง · หัวหน้ากลุ่มเห็นกลุ่ม · ผู้บริหาร/Admin เห็นทั้งหมด)')
X0, Y0, CW_, RH, LW = 30, 90, 92, 30, 300
pg.add('เมนู', 'box', X0, Y0, LW, RH + 6, style_extra='fillColor=#3F3F46;fontColor=#FFFFFF;fontStyle=1;')
for j, (_, rl) in enumerate(ROLES):
    pg.add(rl, 'box', X0 + LW + j * CW_, Y0, CW_, RH + 6, style_extra='fillColor=#3F3F46;fontColor=#FFFFFF;fontStyle=1;fontSize=11;')
y = Y0 + RH + 6
seen = set()
for g in NAV:
    pg.add(g['g'], 'box', X0, y, LW + len(ROLES) * CW_, 24, style_extra='fillColor=#EEF0F4;fontStyle=1;align=left;spacingLeft=10;fontSize=11;')
    y += 24
    for it in g['items']:
        key = it['to'] + '|' + it['label']
        roles = set(it['roles'])
        for g2 in NAV:  # same route listed twice (OKR Report for SM and for executives)
            for it2 in g2['items']:
                if it2['to'] == it['to'] and it2 is not it:
                    roles |= set(it2['roles'])
        if key in seen:
            continue
        seen.add(key)
        pg.add(f"{it['label']}  ({it['to']})", 'box', X0, y, LW, RH, style_extra='align=left;spacingLeft=10;fontSize=11;')
        for j, (rk, _) in enumerate(ROLES):
            on = rk in roles
            pg.add('●' if on else '', 'box', X0 + LW + j * CW_, y, CW_, RH, style_extra=('fillColor=#E3F3EC;fontColor=#17845A;' if on else 'fillColor=#FFFFFF;') + 'fontSize=13;')
        y += RH
pg.add('หน้าที่เข้าจากในเมนู: ลงทะเบียนโครงการใหม่ (SM, Admin) · My Profile + ลายเซ็น (ทุกบทบาท; สร้างลายเซ็นได้เฉพาะ SM และผู้บริหาร) · รายละเอียดโครงการ (ตาม scope ของบทบาท)',
       'note', X0, y + 20, LW + len(ROLES) * CW_, 50)
pages.append(pg)

# =====================================================================================
# Module design pages
# =====================================================================================
MODULE_DESIGN = [
    ('M1', 'ฝ่ายขาย (SM)', '#3457D5',
     ['SM — เจ้าของโครงการของตัวเอง', 'หัวหน้ากลุ่ม — ทีมในกลุ่ม · ตรวจ TOR · เปิดดีลแพ้เป็นโครงการใหม่', 'Admin — ทุกโครงการ', 'Sale — ไม่ใช้ระบบ (SM บันทึกแทน)'],
     ['/ SM Dashboard (เป้าปีของ SM)', '/projects รายการ + Pipeline board', '/projects/new ลงทะเบียน (เริ่ม OPP)', '/projects/:id ภาพรวม · เอกสาร · Requirement/TOR', '   · จัดซื้อ/ประมูล · Activity', '/accounts ทะเบียนลูกค้า + เพิ่มลูกค้า', '/catalog Solution Catalog', '/calendar (ของตัวเอง)'],
     ['validateCreate · requirementsFor', 'allowedMoves · validateMove', 'stageChecklist (ขั้นถัดไป + ลิงก์ไปแก้)', 'isTender · appealWindowEnd · closeWinRule', 'reopenAsNew (ดีลแพ้)', 'accountErrors (ชื่อ/เลขภาษีซ้ำ)', 'FOLDERS · uploadError · standardName'],
     ['Project · StageHistory · Activity', 'Account · BidInfo', 'ProjectDocument · DocVersion', 'SmTarget'],
     ['SharePoint: โฟลเดอร์ตาม Template', 'Teams: แจ้งหัวหน้ากลุ่ม'],
     [('ลงทะเบียน\nOPP', 'start'), ('ลูกค้า · ทีม · Sale', None), ('PL', 'sys'), ('Cost Sheet + QT\nอนุมัติ (M2)', 'sub'), ('TOR ผ่านหัวหน้า\n+ Proposal', None), ('FC', 'sys'), ('วิธีจัดซื้อ · e-GP\n· ราคากลาง', None),
      ('RB', 'sys'), ('ประกาศผู้ชนะ\n+ พ้นอุทธรณ์', None), ('อัปโหลดสัญญา/PO\n+ มูลค่าสัญญา', None), ('CW', 'sys'), ('แจ้งทีม + ขอ PM\n→ M3', 'end')],
     'แจ้งเตือน: วันประกาศผล −1 วัน · ใบเสนอราคาใกล้หมดอายุ 14 วัน · ดีลค้างเกินเกณฑ์ของสถานะ (OPP 45 · PL 60 · FC 45 · RB 30 วัน)'),
    ('M2', 'Cost Sheet · ใบเสนอราคา · อนุมัติ', '#3457D5',
     ['SM — สร้าง แก้ ส่งขออนุมัติ', 'รองผู้บริหาร — อนุมัติขั้นที่ 1', 'ผู้บริหาร DT — อนุมัติขั้นที่ 2', 'หัวหน้ากลุ่ม — ติดตามคำขอ', 'ทีม MA — ใบเสนอราคาต่อ MA'],
     ['/projects/:id?tab=cost', '/projects/:id/cost-sheet/:id (Excel Online)', '/projects/:id/quotation/:id', '/print/quotation/:id (PDF)', '/inbox Mail Inbox (ผู้บริหาร)', '/approvals Approval Requests', '/profile ลายเซ็นอิเล็กทรอนิกส์'],
     ['lineCost · costTotals (สูตรตาม Template)', 'validateCostSheet: Revenue > 0 · งวด = 100% · ขาดทุนต้องมีเหตุผล', 'quoteTotals · validateQuotation', 'linesFromCostSheet', 'approvalState · validApproval (60 วัน)', 'Send to Approve: บันทึกประชุม + ลายเซ็น', 'Reject ต้องระบุเอกสารที่ต้องแก้'],
     ['CostSheet (revenue · costs · payments)', 'Quotation (items · terms)', 'Approval (snapshot · steps · signature)', 'SignatureRec'],
     ['Excel Online: อ่าน Named range (OBO)', 'Outlook: อีเมลขออนุมัติ', 'PDF: ใบเสนอราคา + ลายเซ็น'],
     [('สร้าง Cost Sheet\nจาก Template', 'start'), ('ตรวจสูตร\nRevenue > 0', 'sys'), ('สร้าง Quotation\nจาก Cost Sheet', None), ('Send to Approve\nประชุม + ลายเซ็น', None), ('รองผู้บริหาร\nอนุมัติ + เซ็น', None),
      ('ผู้บริหาร\nอนุมัติ + เซ็น', None), ('ล็อกเอกสาร\nเขียน Revenue/COGS กลับ', 'sys'), ('PDF ใบเสนอราคา\nส่งให้ Sale', 'end')],
     'Reject → ระบุเอกสารที่ต้องแก้ → revision ใหม่ · ไฟล์ถูกแก้หลังส่ง = Stale · หมดอายุ 60 วัน → ใช้ย้าย FC/CW ไม่ได้'),
    ('M3', 'Close Win · Handover', '#0F7F86',
     ['SM — อัปโหลดสัญญา · แจ้งทีมพัฒนา + ขอ PM', 'PMO — เลือก PM ตามทักษะ · ย้าย HO', 'PM — ประชุม Handover · ย้าย DL', 'MA · OPN · หัวหน้าทีม Dev — เข้าประชุม', 'หัวหน้ากลุ่ม — ยกเลิกโครงการ (CXL)'],
     ['/projects/:id?tab=delivery (Handover)', '/projects/:id?tab=proc (หลักประกัน · ค่าปรับ)', '/delivery Delivery Overview', '/workload ทักษะ PM + ภาระงาน'],
     ['checkContractValue (±2% · GP ลด ≤ 3 จุด)', 'projectNeeds · rankPms (ทักษะ · ลงพื้นที่ · ภาระ)', 'handoverGate', 'stageChecklist(→ DL)', 'allowedMoves (CXL เฉพาะหัวหน้ากลุ่ม)'],
     ['Project.pm · Handover.attendees', 'ContractTerms (ค่าปรับ · ประกัน)', 'Bond (หลักประกันสัญญา)', 'StaffRequest'],
     ['Teams: นัดประชุม Handover', 'Outlook: แจ้ง PMO + หัวหน้า Dev'],
     [('CW', 'start'), ('SM แจ้งทีม\n+ ขอ PM', None), ('PMO เลือก PM\n(แนะนำตามทักษะ)', None), ('HO', 'sys'), ('ประชุม 5 ฝ่าย\nบันทึกผู้เข้าร่วม', None), ('Checklist\n+ เงื่อนไขสัญญา', None), ('หลักประกันสัญญา\n(งานรัฐ)', None), ('DL → M4', 'end')],
     'มูลค่าสัญญาต่างจากที่อนุมัติเกินเกณฑ์ → ขออนุมัติหลังได้งานก่อน Close Win'),
    ('M4', 'บริหารโครงการ (PM)', '#0F7F86',
     ['PM — โครงการที่ดูแล', 'PMO — ทุกโครงการหลังขาย', 'หัวหน้ากลุ่ม — โครงการในกลุ่ม', 'ทีมพัฒนา — สมาชิก Workspace'],
     ['/work Project Workspace (รายการ)', '/work/:id Summary · List · Board · Calendar', '   · Timeline · Backlog · Reports · Settings', '/projects/:id?tab=delivery แผนงาน · OT · Risk/CR', '/delivery · /workload'],
     ['createWorkspace (Waterfall / Scrum / Kanban)', 'defaultWorkflow · canMove · allowedTargets', 'moveItem · runAutomation', 'syncMilestones · progressPct · health', 'burndown · velocity · completeSprint', 'acceptIntoWarranty'],
     ['Workspace · Sprint · Task · Worklog', 'Milestone + Deliverables', 'Risk · ChangeRequest', 'Stakeholder · Meeting'],
     ['Teams/Outlook: Kick-off · ประชุมทีม', 'SharePoint: เอกสารส่งมอบ'],
     [('รับมอบจาก\nHandover', 'start'), ('สร้าง Workspace\nจาก Template', None), ('ขอคน / ทีม', None), ('Kick-off', None), ('Sprint / งวดงาน', None), ('ติดตาม Burndown\nRisk · CR', None),
      ('ส่งมอบงวด\nFinal Check', None), ('ลูกค้าตรวจรับ\nใบตรวจรับ', None), ('WR → M7', 'end')],
     'Automation: ย้ายงานตาม Workflow → อัปเดตความคืบหน้างวด · แจ้งงานเลยกำหนด · Weekly report ทุกวันศุกร์'),
    ('M5', 'ทีมพัฒนา (Team Product)', '#0F7F86',
     ['SA · BA · UX/UI · Front-end · Back-end · DevOps · QA', 'PM — อนุมัติ OT · เลื่อนวันส่ง · ส่งต่องาน', 'หัวหน้าทีม Dev — จัดคน'],
     ['/my-work My Tasks', '/work/:id บอร์ดงาน', '/performance My Performance', '/calendar (ทีมตัวเอง)', '/profile'],
     ['canMove (สิทธิ์ย้ายสถานะงาน)', 'addWorklog · logTimeRange', 'splitHours: OT = นอก 08:30–17:30 / วันหยุด', 'dayHours (8 ชม./วัน)', 'findImpacts · suggestStandIn (การลา)', 'canSeeLeave (ปฏิทิน)'],
     ['Task · Worklog', 'OT Request + หลักฐาน', 'Leave + LeaveImpact', 'Timesheet รายสัปดาห์'],
     ['Teams: แจ้งงานใหม่ · OT'],
     [('งานที่ได้รับ', 'start'), ('ย้ายสถานะงาน', None), ('บันทึกเวลา', None), ('ระบบแยก OT\nอัตโนมัติ', 'sys'), ('แนบหลักฐาน OT', None), ('PM อนุมัติ OT', None),
      ('แจ้งลา', None), ('ตรวจงานชนวันลา', 'sys'), ('ทำก่อน / เลื่อน\n/ ส่งต่อ', 'end')],
     'การลาไม่เชื่อม HR — ใช้ดูผลกระทบงานและเก็บ Log · ปฏิทินเห็นการลาเฉพาะทีมตัวเอง'),
    ('M6', 'จัดซื้อและการเงิน (OPN)', '#0F7F86',
     ['OPN (DT3-2) — อนุมัติ PR · หลักประกัน', 'PM — ขอซื้อ (PR)', 'SM · PMO — บันทึกหลักประกัน', 'ผู้บริหาร — อนุมัติกรณีเกินงบ'],
     ['/procurement Purchase Requisitions', '/guarantees Bank Guarantees', '/projects/:id?tab=proc หลักประกัน · ค่าปรับ'],
     ['procurementBudget (งบจาก Cost Sheet)', 'otBudget (เงินกัน OT)', 'bondReturnDue (ซอง 15 วันหลังประกาศ · สัญญา 15 วันหลังพ้นประกัน)', 'costLines'],
     ['Purchase Request', 'Bond', 'Milestone payment (VAT · หัก ณ ที่จ่าย)', 'OT Request'],
     ['Outlook: แจ้งผลอนุมัติ'],
     [('PM ขอซื้อ (PR)', 'start'), ('ตรวจงบเหลือ\nใน Cost Sheet', 'sys'), ('OPN อนุมัติ', None), ('เกินงบ →\nผู้บริหารอนุมัติ', 'dec'), ('ออก PO\nรับของ', None), ('บันทึก\nหลักประกัน', None), ('แจ้งใกล้หมดอายุ\n/ ครบขอคืน', 'end')],
     'งานรัฐ: หลักประกันซอง 5% ของวงเงิน · หลักประกันสัญญา 5% ก่อนลงนาม · หัก ณ ที่จ่าย 1% (รัฐ) / 3% (บริการ)'),
    ('M7', 'MA · Service Desk', '#0F7F86',
     ['ทีม MA — ประกัน · ส่งรายงาน PM · ต่อสัญญา', 'Call center — รับเคส', 'ทีมพัฒนา — เตรียมรายงานรอบ PM', 'ลูกค้า — รับอีเมลจากกล่องกลาง'],
     ['/ma Warranty & Maintenance', '/helpdesk Service Desk', '/projects/:id?tab=ma ประกันและ MA'],
     ['planRounds · roundState · dueRounds (1/3/6 เดือน)', 'RENEWAL_NOTICES (90 / 30 วัน)', 'warrantyBucket · acceptIntoWarranty', 'dailyJobs (Scheduler)', 'SLA ตามระดับความรุนแรง'],
     ['PmRound', 'Ticket', 'Project (type MA, parentId)'],
     ['Outlook กล่องกลาง MA', 'Teams: แจ้งหัวหน้าเมื่อ SLA เกิน'],
     [('WR เริ่มประกัน', 'start'), ('รอบ PM ตามที่ขาย', 'sys'), ('ทีมพัฒนาเตรียมรายงาน', None), ('MA ส่งลูกค้า', None), ('Ticket → SLA', None), ('แจ้งต่อสัญญา\n90 / 30 วัน', 'sys'),
      ('ใบเสนอราคา MA\n(อนุมัติ M2)', 'sub'), ('โครงการ MA ใหม่\nหรือ END', 'end')],
     'ต่อสัญญา MA = โครงการใหม่ (type MA) ลิงก์โครงการเดิม · ทีม MA ย้ายสถานะช่วงขายของโครงการ MA เอง'),
    ('M8', 'ผู้บริหาร · รายงาน', '#6A3FC4',
     ['รองผู้บริหาร · ผู้บริหาร DT — ทุกทีม', 'หัวหน้ากลุ่ม — OKR ของกลุ่ม', 'SM — OKR ของตัวเอง', 'Admin'],
     ['/exec Executive Dashboard', '/exec/tracker Project Status Tracker', '/inbox Mail Inbox (Approve/Reject + ลายเซ็น)', '/reports/okr OKR Report', '/projects Project Overview'],
     ['teamStat · targetStatus · yearElapsed', 'trackOf (9 ขั้นจากข้อมูลที่มี)', 'okrReport · okrUnit · KR_GOALS', 'parseDay · wonDay (วันที่ชนะ)', 'xlsxBlob (สูตร Excel) · pdfBlob (A4)'],
     ['Team.target · SmTarget', 'Approval', 'Project (ทุกสถานะ)'],
     ['ดาวน์โหลด .xlsx / .pdf (ยืนยันก่อนบันทึก)'],
     [('Dashboard ทีม\nเทียบเป้า', 'start'), ('Tracker\nรอใคร', None), ('Mail Inbox\nอนุมัติ + เซ็น', None), ('OKR Report\nรายเดือน', 'sys'), ('KR1–KR4\nตามทีม / SM', 'sys'), ('Export Excel / PDF', None), ('ประชุม OKR', 'end')],
     'KR: Close Win เทียบเป้าตามเวลา · Pipeline coverage ≥ 1.5 เท่า · Opportunity ใหม่ 2/SM/เดือน · Win rate ≥ 40%'),
    ('C', 'บริการกลาง', '#334055',
     ['ทุกบทบาท', 'Admin — ตั้งค่าระบบ ทีม และลำดับอนุมัติ'],
     ['/login (Entra ID SSO)', '/profile ข้อมูลพนักงาน · การแจ้งเตือน · ลายเซ็น', '/calendar ปฏิทินกลาง', '/settings สิทธิ์ · ลำดับอนุมัติ · วันหยุด · ทีมและทีมย่อย', 'กระดิ่งแจ้งเตือน · Command palette (Ctrl K)'],
     ['canSee (เมนูตามบทบาท)', 'scope (ขอบเขตโครงการตามบทบาท)', 'canSeeLeave · canSeeMeeting', 'validateTeam · diffTeam (ประวัติแก้ทีม)', 'dailyJobs · notify', 'TH_GOV_2026 · addWorkingDays'],
     ['User · Team · TeamChange', 'Settings · Notification · AuditLog', 'SignatureRec · Profile'],
     ['Entra ID App Roles', 'Outlook · Teams'],
     [('Login SSO', 'start'), ('App Role →\nเมนูตามบทบาท', 'sys'), ('scope →\nข้อมูลที่เห็น', 'sys'), ('ทำงานใน Module', None), ('Audit log\n+ แจ้งเตือน', 'sys'), ('งานตามเวลา\nรายวัน', 'end')],
     'ปฏิทิน: SM เห็นของตัวเอง · หัวหน้ากลุ่มเห็นกลุ่ม · PM เห็นทีม PM + สมาชิกโครงการ · อื่น ๆ ทีมตัวเอง · ผู้บริหาร/Admin ทุกคน'),
]
for code, name, col, roles, screens, rules, data, integ, flow, notes in MODULE_DESIGN:
    pg = free(f'{code} Design', f'{code} · {name} — Module Design', 'ผู้ใช้ · หน้าจอ · กฎธุรกิจ · ข้อมูล · การเชื่อมต่อ · Flow หลัก (ตามระบบปัจจุบัน)')
    hh = 40 + max(len(roles), len(screens), len(rules), len(data) + len(integ) + 2) * 22
    card(pg, 'ผู้ใช้และสิทธิ์', roles, 30, 80, 300, hh)
    card(pg, 'หน้าจอ (Route)', screens, 350, 80, 360, hh, 'sys')
    card(pg, 'กฎธุรกิจ (src/domain)', rules, 730, 80, 380, hh, 'sub')
    dh = 40 + len(data) * 22
    card(pg, 'ข้อมูล (Entity)', data, 1130, 80, 300, dh)
    card(pg, 'เชื่อมต่อภายนอก', integ, 1130, 90 + dh, 300, hh - dh - 10, 'ext')
    fy = 80 + hh + 50
    pg.cells.append((pg.nid(), 'Flow หลัก', 'text;html=1;fontStyle=1;fontSize=14;' + FONT, 30, fy - 30, 300, 24, 'label', {}))
    ids = chain(pg, flow, 30, fy, w=185, h=64, gap=22, per_row=7)
    rows = (len(flow) + 6) // 7
    pg.add(notes, 'note', 30, fy + rows * 110 + 10, 1400, 56)
    pages.append(pg)

# =====================================================================================
# Sequences for the newest features
# =====================================================================================
pages.append(sequence(
    'S1 ส่งอนุมัติ + ลายเซ็น', 'S1 · Sequence: ส่ง Cost Sheet + Quotation ขออนุมัติพร้อมลายเซ็นอิเล็กทรอนิกส์',
    [('sm', 'SM', 'actor'), ('web', 'Web', 'sys'), ('api', 'API', 'sys'), ('db', 'Database', 'sys'), ('mail', 'Outlook', 'ext'), ('dep', 'รองผู้บริหาร', 'actor'), ('ex', 'ผู้บริหาร', 'actor'), ('pdf', 'PDF', 'sys')],
    [('sm', 'web', 'Send to Approve: เลือก CS + QT · บันทึกประชุม', 'sync'), ('web', 'web', 'ยังไม่มีลายเซ็น → วาด/พิมพ์ (บันทึกใน Profile)', 'self'),
     ('sm', 'web', 'ยืนยันการลงนาม', 'sync'), ('web', 'api', 'POST approval (snapshot · signature)', 'sync'), ('api', 'db', 'Approval rev.N + step[0].signature', 'sync'),
     ('api', 'mail', 'อีเมลถึงรองผู้บริหาร', 'async'), ('mail', 'dep', 'ลิงก์ Mail Inbox', 'async'), ('dep', 'api', 'Approve + ลายเซ็น', 'sync'), ('api', 'mail', 'ส่งต่อผู้บริหาร', 'async'),
     ('mail', 'ex', 'ลิงก์ Mail Inbox', 'async'), ('ex', 'api', 'Approve + ลายเซ็น', 'sync'), ('api', 'db', 'ล็อก CS/QT · เขียน Revenue/COGS กลับโครงการ', 'sync'),
     ('api', 'pdf', 'ใบเสนอราคา + ลายเซ็นผู้ส่ง/ผู้อนุมัติ', 'sync'), ('api', 'sm', 'แจ้งผล → ส่ง PDF ให้ Sale', 'async')],
    [('loop [อนุมัติ 2 ขั้น] · ถ้า Reject → ระบุเอกสารที่ต้องแก้ · SM สร้าง revision ใหม่', 7, 10)]))

pages.append(sequence(
    'S2 ย้ายสถานะ + Checklist', 'S2 · Sequence: ย้ายสถานะพร้อม "ขั้นถัดไป" ที่พาไปจุดที่ต้องกรอก',
    [('u', 'SM / PMO / PM', 'actor'), ('web', 'Web', 'sys'), ('rule', 'src/domain', 'sys'), ('api', 'API', 'sys'), ('db', 'Database', 'sys')],
    [('web', 'rule', 'stageChecklist(project, ปลายทาง)', 'sync'), ('rule', 'web', 'รายการ + จุดแก้ (edit · tab · folder)', 'ret'), ('u', 'web', 'กด "ไปกรอก" ที่รายการที่ขาด', 'sync'),
     ('web', 'web', 'เปิดแท็บ / ฟอร์ม / โฟลเดอร์ที่ต้องแก้', 'self'), ('u', 'web', 'กรอกข้อมูล (เช่น e-GP · ประกาศผล · หลักประกัน)', 'sync'), ('u', 'web', 'กด "ย้ายไป …" + ยืนยันเกณฑ์ออกจากสถานะ', 'sync'),
     ('web', 'rule', 'validateMove (requirementsFor · closeWinRule · handoverGate)', 'sync'), ('web', 'api', 'POST /projects/:id/move', 'sync'), ('api', 'rule', 'allowedMoves(บทบาท) + validateMove ซ้ำ', 'sync'),
     ('api', 'db', 'บันทึกสถานะ · ประวัติ · Activity', 'sync'), ('api', 'web', '200 / 403 / 422 พร้อมเหตุผล', 'ret')],
    [('alt [ไม่ผ่าน] → ปุ่มย้ายถูกปิด + แสดงสิ่งที่ขาด', 6, 6)]))

pages.append(sequence(
    'S3 OKR Report', 'S3 · Sequence: สรุปรายงาน OKR ประจำเดือน และ Export Excel / PDF',
    [('u', 'SM / หัวหน้า / ผู้บริหาร', 'actor'), ('web', 'OKR Report', 'sys'), ('okr', 'okrReport()', 'sys'), ('xl', 'xlsx writer', 'sys'), ('pdf', 'Canvas → PDF', 'sys'), ('dl', 'ดาวน์โหลด', 'ext')],
    [('u', 'web', 'เลือกเดือน · ตามทีม / ตาม SM', 'sync'), ('web', 'okr', 'หน่วยตามบทบาท + โครงการใน scope', 'sync'), ('okr', 'web', 'KR1–KR4 · รายเดือน · ความเคลื่อนไหว · คาดปิด 3 เดือน', 'ret'),
     ('u', 'web', 'Export Excel', 'sync'), ('web', 'xl', '5 ชีต พร้อมสูตร', 'sync'), ('web', 'dl', 'ขอบันทึก .xlsx (ผู้ใช้ยืนยัน)', 'async'),
     ('u', 'web', 'Export PDF', 'sync'), ('web', 'pdf', 'วาดหน้า A4 (ภาษาไทยถูกต้อง)', 'sync'), ('pdf', 'web', 'ภาพตัวอย่างทุกหน้า', 'ret'), ('u', 'web', 'ดาวน์โหลด PDF', 'sync'), ('web', 'dl', 'ขอบันทึก .pdf', 'async')]))

pages.append(sequence(
    'S4 ปฏิทินตามสิทธิ์', 'S4 · Sequence: ปฏิทินกลางกรองตามบทบาทและทีม',
    [('u', 'ผู้ใช้', 'actor'), ('web', 'Calendar', 'sys'), ('acc', 'calendarAccess', 'sys'), ('sc', 'scope', 'sys')],
    [('u', 'web', 'เปิด Calendar', 'sync'), ('web', 'acc', 'canSeeLeave(ผู้ใช้, บทบาท, เจ้าของการลา)', 'sync'), ('acc', 'web', 'ตัวเอง · ทีม · กลุ่ม (หัวหน้า) · ทุกคน (ผู้บริหาร)', 'ret'),
     ('web', 'sc', 'โครงการตามบทบาท', 'sync'), ('web', 'acc', 'canSeeMeeting (เข้าร่วม / เจ้าของโครงการ / ผู้กำกับ)', 'sync'),
     ('web', 'web', 'ประกาศผลประมูล · ใบเสนอราคาหมดอายุ: เฉพาะ SM และ PM', 'self'), ('web', 'u', 'ปฏิทิน + บอกขอบเขตที่เห็น', 'ret')]))

pages.append(sequence(
    'S5 งานตามเวลา', 'S5 · Sequence: งานตามเวลารายวัน และการแจ้งเตือน',
    [('cron', 'Scheduler 07:00', 'sys'), ('job', 'dailyJobs()', 'sys'), ('db', 'Database', 'sys'), ('ob', 'Outbox', 'sys'), ('mail', 'Outlook / Teams', 'ext'), ('u', 'ผู้เกี่ยวข้อง', 'actor')],
    [('cron', 'job', 'เริ่มงานรายวัน', 'sync'), ('job', 'db', 'โครงการ · ใบเสนอราคา · รอบ PM · ประกัน · หลักประกัน', 'sync'),
     ('job', 'job', 'ใกล้หมดอายุ 14 วัน · ประกาศผลพรุ่งนี้ · รอบ PM ถึงกำหนด · ประกัน 90/30 วัน · ดีลค้าง', 'self'),
     ('job', 'ob', 'สร้างข้อความ (กันส่งซ้ำ)', 'sync'), ('ob', 'mail', 'ส่ง + Retry', 'async'), ('mail', 'u', 'อีเมล / Teams / กระดิ่ง', 'async'), ('ob', 'db', 'บันทึกผลการส่ง', 'sync')]))

out = os.path.join(ROOT, 'docs', 'diagrams', 'one-platform-sa.drawio')
write(pages, out, os.path.join(ROOT, 'docs', 'diagrams', 'sa-preview.html'))
print(len(pages), 'pages →', out)
