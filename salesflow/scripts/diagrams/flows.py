"""One Platform business flows → docs/diagrams/one-platform-flows.drawio (+ preview.html).
Run: python3 scripts/diagrams/flows.py
Content follows src/domain/rules.ts, src/domain/workflow.ts, src/data/model.ts (allowedMoves)
and docs/module-features.md. Nodes marked tobe=True are planned, not yet in the system.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
from drawio import Page, free, sequence, swimlane, write, legend  # noqa: E402

T = True
pages: list[Page] = []

# =====================================================================================
# L0 — Context diagram
# =====================================================================================
pg = free('L0-1 Context Diagram', 'Level 0 · Context Diagram — One Platform กับผู้ใช้และระบบภายนอก',
          'ผู้ใช้ 11 บทบาท (Sale ไม่ใช้ระบบ ส่งข้อมูลผ่าน SM) · ทำงานบน Microsoft 365 ของบริษัท')
core = pg.add('One Platform\nSales → Delivery → MA', 'system', 640, 380, 300, 150)
L = [('SM (Solution Manager)\nลงทะเบียน · Requirement · ราคา · บันทึกผล', 'ข้อมูลโครงการ · เอกสารขาย · ผลประมูล', 'สถานะอนุมัติ · แจ้งเตือน'),
     ('Sale (นอกระบบ)\nยื่นซอง · แจ้งผลให้ SM', '', ''),
     ('หัวหน้ากลุ่ม DT\nตรวจ TOR · ดูยอดทีม', 'ความเห็น TOR · เป้าทีม', 'Dashboard ทีม'),
     ('รองผู้บริหาร → ผู้บริหาร DT\nอนุมัติ Cost Sheet + Quotation', 'อนุมัติ / ส่งกลับ', 'คำขออนุมัติ + Snapshot ราคา')]
R = [('PMO (DT3-3)\nมอบหมาย PM · Portfolio', 'มอบหมาย PM', 'สถานะทุกโครงการ'),
     ('PM\nวางแผน · งวดงาน · OT · CR', 'แผนงาน · อนุมัติ OT', 'ความคืบหน้า · Burndown'),
     ('ทีม Product\nSA · BA · UX/UI · Dev · QA', 'สถานะงาน · เวลา · OT', 'งานที่ได้รับ · แจ้งเตือน'),
     ('OPN (DT3-2)\nอนุมัติเบิกจ่ายจัดซื้อ', 'อนุมัติ PR', 'คำขอซื้อในงบ Cost Sheet')]
B = [('ทีม MA\nประกัน · PM report · ต่อสัญญา', 'รายงาน PM · ใบเสนอราคา MA', 'วันหมดประกัน · รอบ PM'),
     ('Call center (ทีม MA)\nรับเคส Service Desk', 'Ticket', 'SLA · สถานะเคส'),
     ('ลูกค้า\nรับอีเมล · แบบฟอร์ม UAT/CR', 'แบบฟอร์ม · คำตอบต่อ MA', 'อีเมลแจ้ง · รายงาน')]
for i, (t, to, back) in enumerate(L):
    a = pg.add(t, 'box', 40, 150 + i * 150, 250, 74, style_extra='dashed=1;' if 'นอกระบบ' in t else '')
    if i == 0:
        sm_box = a
    if to:
        pg.edge(a, core, f'→ {to}\n← {back}', 'edgeStyle=none;startArrow=block;startFill=1;')
    else:  # Sale has no account: results reach the system through the SM
        pg.edge(a, sm_box, 'แจ้งผลประมูล (นอกระบบ)', 'edgeStyle=none;dashed=1;')
for i, (t, to, back) in enumerate(R):
    a = pg.add(t, 'box', 1290, 150 + i * 150, 250, 74)
    pg.edge(a, core, f'→ {to}\n← {back}', 'edgeStyle=none;startArrow=block;startFill=1;')
for i, (t, to, back) in enumerate(B):
    a = pg.add(t, 'box', 470 + i * 330, 760, 260, 74)
    pg.edge(a, core, f'→ {to}\n← {back}', 'edgeStyle=none;startArrow=block;startFill=1;')
M = [('Entra ID\nSSO · App Roles OnePlatform.*', 'ตรวจสิทธิ์'), ('SharePoint / OneDrive\nโฟลเดอร์โครงการ · เวอร์ชัน', 'สร้างโฟลเดอร์ · เก็บไฟล์'),
     ('Excel Online\nCost Sheet + Quotation', 'อ่านราคา (OBO)'), ('Outlook\nอีเมลอนุมัติ · แจ้งลูกค้า', 'ส่งอีเมล'), ('Teams\nแจ้งเตือน · นัดประชุม', 'แจ้งเตือน · นัด')]
for i, (t, lab) in enumerate(M):
    a = pg.add(t, 'ext', 400 + i * 175, 120, 160, 70)
    pg.edge(core, a, lab, 'edgeStyle=none;dashed=1;')
pg.cells.append((pg.nid(), 'Microsoft 365 ของบริษัท', 'text;html=1;fontStyle=1;fontColor=#6A3FC4;fontFamily=Prompt;', 400, 92, 300, 20, 'label', {}))
legend(pg, 40, 900)
pages.append(pg)

# =====================================================================================
# L0 — Overall cross-functional process
# =====================================================================================
pages.append(swimlane(
    'L0-2 Process ภาพรวม', 'Level 0 · กระบวนการภาพรวมทั้งระบบ (ขาย → อนุมัติ → ชนะงาน → ส่งมอบ → ประกัน/MA)',
    ['ฝ่ายขาย (SM · Sale)', 'ผู้บริหาร DT', 'PMO / PM', 'ทีม Product', 'OPN', 'ทีม MA · Call center', 'One Platform', 'ลูกค้า'],
    [('s', 0, 0, 'start', 'ได้โอกาสขาย\n/ คิด Solution'),
     ('p1', 0, 1, 'sub', '1.0 ลงทะเบียน\n& เก็บ Requirement'),
     ('p2', 0, 2, 'sub', '2.0 Cost Sheet ·\nQuotation · Proposal'),
     ('p3', 1, 3, 'sub', '3.0 อนุมัติราคา\nรอง → ผู้บริหาร'),
     ('y3', 6, 3, 'sys', 'Snapshot ราคา ·\nอีเมลอนุมัติ · เวอร์ชัน'),
     ('p4', 0, 4, 'sub', '4.0 เสนอราคา / ประมูล\n(Sale ยื่น) & บันทึกผล'),
     ('c4', 7, 4, 'task', 'ลูกค้าประกาศผล\n/ ออก PO'),
     ('d5', 0, 5, 'dec', 'ผลการขาย?'),
     ('lose', 1, 5, 'end', 'Close Lose'),
     ('p5', 2, 6, 'sub', '5.0 Close Win &\nHandover'),
     ('y5', 6, 6, 'sys', 'ตรวจ PO vs ราคาอนุมัติ ·\nHandover gate'),
     ('p6', 2, 7, 'sub', '6.0 วางแผน &\nบริหารโครงการ'),
     ('p7', 3, 7, 'sub', '7.0 พัฒนา · ทดสอบ ·\nบันทึกเวลา / OT'),
     ('p8', 4, 8, 'sub', '8.0 จัดซื้อตาม\nงบ Cost Sheet'),
     ('c8', 7, 8, 'task', 'ตรวจรับงวด\n& ชำระเงิน'),
     ('p9', 5, 9, 'sub', '9.0 ประกัน · PM report ·\nService Desk'),
     ('y9', 6, 9, 'sys', 'แจ้งเตือนต่อประกัน\n90 / 30 วัน'),
     ('d10', 5, 10, 'dec', 'ลูกค้าต่อ MA?'),
     ('p10', 5, 11, 'sub', '10.0 ต่อสัญญา MA\n(วงจรขายใหม่)'),
     ('e', 5, 12, 'end', 'ปิดโครงการ')],
    [('s', 'p1'), ('p1', 'p2'), ('p2', 'p3'), ('p3', 'y3', '', 'dashed=1;'), ('p3', 'p4', 'อนุมัติ', 'exitX=1;exitY=0.5;entryX=0;entryY=0.5;'), ('p4', 'c4', '', 'dashed=1;'), ('p4', 'd5'),
     ('d5', 'lose', 'แพ้'), ('d5', 'p5', 'ชนะ'), ('p5', 'y5', '', 'dashed=1;'), ('p5', 'p6'), ('p6', 'p7', 'มอบหมายงาน'), ('p6', 'p8', 'ขอซื้อ'),
     ('p7', 'c8', 'ส่งมอบงวด'), ('c8', 'p9', 'ส่งมอบครบ'), ('p9', 'y9', '', 'dashed=1;'), ('p9', 'd10'), ('d10', 'p10', 'ต่อ'), ('d10', 'e', 'ไม่ต่อ', 'exitX=0.5;exitY=1;entryX=0.5;entryY=1;')],
    ['เลข 1.0–10.0 คือ Process ระดับ 1 ที่แตกรายละเอียดในหน้า M1–M7', 'เส้นประ = ระบบทำงานอัตโนมัติประกอบขั้นนั้น',
     'Sale ไม่ใช้ระบบ: SM เป็นผู้บันทึกการยื่นและผลประมูลแทน'],
    'แต่ละแถว = ผู้รับผิดชอบ · กล่องเขียว = Process ที่มีรายละเอียดระดับถัดไป'))

# =====================================================================================
# L0 — Project status lifecycle (who may move)
# =====================================================================================
pg = free('L0-3 สถานะโครงการ', 'Level 0 · วงจรสถานะโครงการ และบทบาทที่ย้ายสถานะได้ (allowedMoves)',
          'สถานะเดียวกันใช้ทุกหน้าจอ · ระบบตรวจเงื่อนไขก่อนย้ายทุกครั้ง (requirementsFor · closeWinRule · handoverGate)')
st = {}
row1 = [('opportunity', 'Opportunity\n10–20%'), ('pipeline', 'Pipeline\n40–50%'), ('forecast', 'Forecast\n70–80%'), ('rebidding', 'Rebidding\n(ประมูล)'), ('win', 'Close Win\n100%')]
row2 = [('handover', 'Handover'), ('delivery', 'In Delivery'), ('warranty', 'Warranty'), ('ended', 'Ended')]
for i, (k, t) in enumerate(row1):
    st[k] = pg.add(t, 'state', 60 + i * 260, 120, 170, 64)
for i, (k, t) in enumerate(row2):
    st[k] = pg.add(t, 'state', 320 + i * 260, 330, 170, 64)
st['lose'] = pg.add('Close Lose', 'end', 70, 226, 150, 56)
st['cancelled'] = pg.add('Cancelled', 'end', 590, 470, 150, 56)
pg.edge(st['opportunity'], st['pipeline'], 'SM')
pg.edge(st['pipeline'], st['forecast'], 'SM')
pg.edge(st['forecast'], st['rebidding'], 'SM (ภาครัฐ)')
pg.edge(st['rebidding'], st['win'], 'SM')
pg.edge(st['pipeline'], st['rebidding'], 'SM', 'exitX=0.5;exitY=0;entryX=0.5;entryY=0;')
pg.edge(st['forecast'], st['win'], 'SM (เอกชน)', 'exitX=0.5;exitY=1;entryX=0.5;entryY=1;')
pg.edge(st['win'], st['handover'], 'PMO / หัวหน้า', 'exitX=0.5;exitY=1;entryX=0.5;entryY=0;')
pg.edge(st['handover'], st['delivery'], 'PM / PMO')
pg.edge(st['delivery'], st['warranty'], 'PM')
pg.edge(st['warranty'], st['ended'], 'MA')
pg.edge(st['pipeline'], st['lose'], 'SM: เหตุผล · คู่แข่ง', 'exitX=0;exitY=0.75;entryX=1;entryY=0.3;dashed=1;')
pg.edge(st['lose'], st['pipeline'], 'หัวหน้า: เปิดเป็นโครงการใหม่', 'exitX=1;exitY=0.7;entryX=0.3;entryY=1;dashed=1;')
pg.edge(st['delivery'], st['cancelled'], 'หัวหน้า: ยกเลิก', 'exitX=0.5;exitY=1;entryX=0.5;entryY=0;dashed=1;')
pg.add('ทุกสถานะช่วงขายย้ายไป Close Lose ได้ (SM) · Win / Handover / Delivery ยกเลิกได้โดยหัวหน้ากลุ่ม\nโครงการ MA ที่ต่อสัญญา: ทีม MA เป็นผู้ย้ายสถานะช่วงขายเอง',
       'note', 820, 470, 520, 70)
pg.add('เงื่อนไขหลักก่อนย้าย\n• Pipeline: ลูกค้า (Account) · ทีม DT · Sale ≥ 1\n• Forecast: ใบเสนอราคาอนุมัติครบและไม่หมดอายุ · Expected Close\n• Rebidding (ภาครัฐ): วิธีจัดซื้อ · เลข e-GP · ราคากลาง\n• Win: PO/สัญญา · ประกาศผล e-GP · พ้นอุทธรณ์ 7 วันทำการ\n• Delivery: Handover gate ครบ',
       'note', 60, 580, 640, 140)
legend(pg, 60, 760)
pages.append(pg)

# =====================================================================================
# M1 Sales (SM)
# =====================================================================================
SM_L = ['SM (Solution Manager)', 'หัวหน้ากลุ่ม DT', 'One Platform', 'Microsoft 365', 'Sale / ลูกค้า (นอกระบบ)']
pages.append(swimlane(
    'M1 Sales · L1', 'M1 · Module Sales (SM) — Level 1: ตั้งแต่ได้โอกาสจนรู้ผล', SM_L,
    [('s', 0, 0, 'start', 'ได้โอกาส /\nคิด Solution'),
     ('reg', 0, 1, 'task', 'ลงทะเบียนโครงการ\nลูกค้าจ้าง / Product-led'),
     ('v1', 2, 1, 'sys', 'ตรวจข้อมูลขั้นต่ำ ·\nออกรหัส OPP-ปป-xxxx'),
     ('fold', 3, 1, 'ext', 'SharePoint: สร้างโฟลเดอร์\nตาม Template'),
     ('req', 0, 2, 'task', 'เก็บ Requirement Overview\n· Process การใช้งาน'),
     ('mp', 0, 3, 'task', 'ย้ายเป็น Pipeline'),
     ('v2', 2, 3, 'dec', 'ลูกค้า · ทีม ·\nSale ครบ?'),
     ('cs', 0, 4, 'task', 'ทำ Cost Sheet · Quotation\n· Proposal'),
     ('xl', 3, 4, 'ext', 'Excel Online\n(ไฟล์เดียว คนละแท็บ)'),
     ('ap', 2, 5, 'sub', 'ขออนุมัติราคา\n→ M2'),
     ('ok', 2, 6, 'dec', 'อนุมัติครบ?'),
     ('fix', 0, 5, 'task', 'แก้ตามเหตุผล\nที่ถูกส่งกลับ'),
     ('tor', 0, 7, 'task', 'จัดทำ TOR Final'),
     ('torr', 1, 7, 'task', 'ตรวจ TOR Final\nก่อนส่งลูกค้า', T),
     ('fc', 0, 8, 'task', 'ย้ายเป็น Forecast (70%)'),
     ('v3', 2, 8, 'dec', 'ราคาอนุมัติ & ไม่หมดอายุ\n· Expected Close?'),
     ('td', 0, 9, 'dec', 'ประมูลภาครัฐ?'),
     ('rb', 0, 10, 'task', 'Rebidding: e-GP · ราคากลาง\n· วันประกาศผล'),
     ('sale', 4, 10, 'task', 'Sale ยื่นซอง /\nเสนอราคา'),
     ('res', 4, 11, 'task', 'Sale แจ้งผล'),
     ('rec', 0, 12, 'task', 'SM บันทึกผล'),
     ('rm', 2, 12, 'sys', 'แจ้งเตือนวันประกาศผล', T),
     ('wl', 0, 13, 'dec', 'Win?'),
     ('lose', 1, 13, 'task', 'Close Lose: เหตุผล ·\nคู่แข่ง · ราคาคู่แข่ง'),
     ('el', 1, 14, 'end', 'จบ (Lose)'),
     ('win', 2, 15, 'sub', 'Close Win &\nHandover → M3')],
    [('s', 'reg'), ('reg', 'v1'), ('v1', 'fold', '', 'dashed=1;'), ('v1', 'req', 'บันทึกแล้ว'), ('req', 'mp'), ('mp', 'v2'), ('v2', 'mp', 'ไม่ครบ: แสดงสิ่งที่ขาด', 'exitX=0;exitY=0.5;entryX=0.25;entryY=1;'),
     ('v2', 'cs', 'ครบ'), ('cs', 'xl', '', 'dashed=1;'), ('cs', 'ap'), ('ap', 'ok'), ('ok', 'fix', 'ส่งกลับ'), ('fix', 'cs', 'เวอร์ชันใหม่'), ('ok', 'tor', 'อนุมัติ'),
     ('tor', 'torr', 'ส่งตรวจ'), ('torr', 'fc', 'ผ่าน'), ('fc', 'v3'), ('v3', 'td', 'ผ่าน'), ('td', 'rb', 'ใช่'), ('td', 'sale', 'ไม่ (เอกชน)'), ('rb', 'sale'),
     ('sale', 'res'), ('res', 'rec'), ('rec', 'rm', '', 'dashed=1;'), ('rec', 'wl'), ('wl', 'lose', 'ไม่'), ('lose', 'el'), ('wl', 'win', 'ใช่')],
    ['TOR Final ต้องผ่านหัวหน้ากลุ่มก่อนส่งลูกค้า (SM-4) — ยังไม่มีในระบบ', 'Sale ไม่ใช้ระบบ: SM บันทึกการยื่นและผลแทน (SM-8, SM-9)',
     'ทุกการย้ายสถานะตรวจด้วยกฎเดียวกันทั้งหน้าเว็บและ API (ดู M1 · L2)']))

pages.append(swimlane(
    'M1 Sales · L2', 'M1 · Level 2: ลงทะเบียนและย้ายสถานะช่วงขาย (กฎ requirementsFor)', ['SM', 'One Platform'],
    [('s', 0, 0, 'start', 'เลือกสถานะ\nปลายทาง'),
     ('n', 1, 1, 'dec', 'มีชื่อโครงการ?'),
     ('p', 1, 2, 'dec', 'ปลายทาง ≥\nPipeline?'),
     ('pc', 1, 3, 'dec', 'Account · ทีม DT\n· Sale ≥ 1?'),
     ('f', 1, 4, 'dec', 'ปลายทาง ≥\nForecast?'),
     ('fc', 1, 5, 'dec', 'ใบเสนอราคาอนุมัติ\n& Expected Close?'),
     ('t', 1, 6, 'dec', 'Rebidding\nภาครัฐ?'),
     ('tc', 1, 7, 'dec', 'วิธีจัดซื้อ · เลข e-GP\n· ราคากลาง?'),
     ('save', 1, 8, 'sys', 'บันทึกสถานะ + ประวัติ\n+ แจ้งผู้เกี่ยวข้อง'),
     ('e', 0, 8, 'end', 'สำเร็จ'),
     ('err', 0, 4, 'task', 'ระบบแสดงรายการที่ขาด\nSM เติมข้อมูลแล้วลองใหม่')],
    [('s', 'n'), ('n', 'p', 'มี'), ('p', 'pc', 'ใช่'), ('p', 'save', 'ไม่ (Opportunity)', 'exitX=0.5;exitY=1;entryX=0.5;entryY=1;'), ('pc', 'f', 'ครบ'), ('f', 'fc', 'ใช่'),
     ('f', 't', 'ไม่'), ('fc', 't', 'ครบ'), ('t', 'tc', 'ใช่'), ('t', 'save', 'ไม่', 'exitX=0.5;exitY=0;entryX=0.5;entryY=0;'), ('tc', 'save', 'ครบ'), ('save', 'e'),
     ('n', 'err', 'ไม่', 'exitX=0.5;exitY=0;entryX=0;entryY=0.5;'), ('pc', 'err', 'ไม่ครบ', 'exitX=0.5;exitY=0;entryX=0.25;entryY=1;'),
     ('fc', 'err', 'ไม่ครบ', 'exitX=0.5;exitY=0;entryX=0.75;entryY=1;'), ('tc', 'err', 'ไม่ครบ', 'exitX=0.5;exitY=0;entryX=1;entryY=0.5;'), ('err', 's', '', 'dashed=1;')],
    ['กฎนี้อยู่ใน src/domain/rules.ts ใช้ร่วมกันทั้งหน้าเว็บและ API (API ตอบ 403/422 เมื่อไม่ผ่าน)', 'ทุกสถานะช่วงขายย้ายไป Close Lose ได้ แต่ต้องกรอกเหตุผล คู่แข่ง และราคาคู่แข่ง']))

pages.append(swimlane(
    'M1 Sales · L3', 'M1 · Level 3: ติดตามประมูลภาครัฐ ระยะอุทธรณ์ และการปิด Close Win', ['SM', 'One Platform', 'หัวหน้ากลุ่ม DT'],
    [('s', 0, 0, 'start', 'อยู่สถานะ\nRebidding'),
     ('b', 0, 1, 'task', 'บันทึกวันยื่นซอง ·\nวันประกาศผล · ราคาที่ยื่น'),
     ('c1', 1, 1, 'dec', 'ราคาที่ยื่น ≤\nราคาที่อนุมัติ?'),
     ('w1', 2, 1, 'task', 'ขออนุมัติราคาใหม่\n(กลับ M2)'),
     ('r', 1, 2, 'sys', 'แจ้งเตือน SM\nก่อนวันประกาศผล 1 วัน', T),
     ('res', 0, 3, 'task', 'บันทึกผลประกาศ e-GP\n(วันที่ประกาศ)'),
     ('ap', 1, 4, 'sys', 'คำนวณสิ้นสุดอุทธรณ์ =\nวันประกาศ + 7 วันทำการ'),
     ('c2', 1, 5, 'dec', 'พ้นระยะ\nอุทธรณ์?'),
     ('wait', 0, 5, 'task', 'รอ (ระบบแจ้งเมื่อครบ)'),
     ('po', 0, 6, 'task', 'อัปโหลด PO / สัญญา\nใน Official PO / Contract'),
     ('chk', 1, 7, 'sub', 'ตรวจ PO vs ราคาอนุมัติ\n→ M3 · L3'),
     ('win', 1, 8, 'sys', 'ย้าย Close Win ·\nแจ้ง PMO + หัวหน้า Dev'),
     ('e', 0, 8, 'end', 'ไป Handover')],
    [('s', 'b'), ('b', 'c1'), ('c1', 'w1', 'ไม่'), ('c1', 'r', 'ใช่'), ('r', 'res', '', 'dashed=1;'), ('res', 'ap'), ('ap', 'c2'), ('c2', 'wait', 'ยัง'), ('wait', 'c2', '', 'dashed=1;'),
     ('c2', 'po', 'พ้นแล้ว'), ('po', 'chk'), ('chk', 'win', 'ผ่าน'), ('win', 'e')],
    ['ปฏิทินวันทำการใช้วันหยุดราชการไทย 2569 (ตั้งค่าใน System Settings)', 'ดีลเอกชนข้ามขั้น e-GP และอุทธรณ์ — ตรวจเฉพาะ PO']))

pages.append(sequence(
    'M1 Sales · Sequence', 'M1 · Sequence: SM ลงทะเบียนและย้ายสถานะโครงการ',
    [('sm', 'SM', 'actor'), ('web', 'Web (Vue)', 'sys'), ('api', 'API', 'sys'), ('rule', 'Domain rules', 'sys'), ('db', 'Database', 'sys'), ('sp', 'SharePoint (Graph)', 'ext'), ('tm', 'Teams', 'ext')],
    [('sm', 'web', 'กรอกฟอร์มลงทะเบียน', 'sync'), ('web', 'rule', 'validateCreate() (ตรวจทันทีบนหน้าจอ)', 'sync'), ('rule', 'web', 'ผ่าน / รายการที่ขาด', 'ret'),
     ('web', 'api', 'POST /projects', 'sync'), ('api', 'rule', 'validateCreate() ซ้ำฝั่งเซิร์ฟเวอร์', 'sync'), ('api', 'db', 'บันทึกโครงการ + ประวัติ', 'sync'),
     ('api', 'sp', 'สร้างโฟลเดอร์ตาม Template (outbox)', 'async'), ('api', 'web', '201 โครงการ OPP-69-xxxx', 'ret'),
     ('sm', 'web', 'ย้ายสถานะเป็น Pipeline / Forecast', 'sync'), ('web', 'api', 'POST /projects/:id/move', 'sync'),
     ('api', 'api', 'ตรวจ allowedMoves ตามบทบาท', 'self'), ('api', 'rule', 'validateMove() · requirementsFor()', 'sync'), ('rule', 'api', 'ผ่าน', 'ret'),
     ('api', 'db', 'อัปเดตสถานะ + ประวัติ', 'sync'), ('api', 'tm', 'แจ้งหัวหน้ากลุ่ม (สถานะสำคัญ)', 'async'), ('api', 'web', '200 / 422 พร้อมเหตุผล', 'ret')],
    [('alt [ไม่ผ่านกฎ]  → 422 แสดงสิ่งที่ขาด', 11, 15)]))

# =====================================================================================
# M2 Approval
# =====================================================================================
pages.append(swimlane(
    'M2 Approval · L1', 'M2 · Module อนุมัติราคา — Level 1: Cost Sheet + Quotation (รองผู้บริหาร → ผู้บริหาร DT)',
    ['SM', 'One Platform', 'Microsoft 365', 'รองผู้บริหาร DT', 'ผู้บริหาร DT'],
    [('s', 0, 0, 'start', 'ราคาพร้อม'),
     ('sub', 0, 1, 'task', 'กด “ส่งขออนุมัติ”\nเลือกเวอร์ชัน'),
     ('rd', 1, 1, 'sys', 'อ่านราคา/ต้นทุน/GP\nจาก Excel (OBO)'),
     ('xl', 2, 1, 'ext', 'Excel Online\n(Graph API)'),
     ('snap', 1, 2, 'sys', 'เก็บ Snapshot + Hash\n+ สำเนา Submitted/vN'),
     ('m1', 2, 3, 'ext', 'Outlook: อีเมลพร้อม\nลิงก์อนุมัติ'),
     ('d1', 3, 3, 'dec', 'รองผู้บริหาร\nตัดสินใจ'),
     ('m2', 2, 4, 'ext', 'Outlook: ส่งต่อ\nผู้บริหาร'),
     ('d2', 4, 4, 'dec', 'ผู้บริหาร\nตัดสินใจ'),
     ('okk', 1, 5, 'sys', 'อนุมัติ: ใช้ได้ 60 วัน ·\nสร้าง PDF ใบเสนอราคา'),
     ('rej', 1, 6, 'sys', 'ส่งกลับ: บันทึกเหตุผล\n· เอกสารที่ต้องแก้'),
     ('nt', 0, 5, 'task', 'ได้รับแจ้ง →\nส่งใบเสนอราคาให้ Sale'),
     ('fx', 0, 6, 'task', 'แก้ไข → ส่งเวอร์ชันใหม่'),
     ('e', 0, 7, 'end', 'จบ')],
    [('s', 'sub'), ('sub', 'rd'), ('rd', 'xl', '', 'dashed=1;'), ('rd', 'snap'), ('snap', 'm1'), ('m1', 'd1'), ('d1', 'm2', 'อนุมัติ'), ('m2', 'd2'),
     ('d2', 'okk', 'อนุมัติ'), ('okk', 'nt'), ('nt', 'e'), ('d1', 'rej', 'ส่งกลับ', 'exitX=1;exitY=0.5;entryX=1;entryY=0.5;'), ('d2', 'rej', 'ส่งกลับ', 'exitX=1;exitY=0.5;entryX=1;entryY=0.75;'),
     ('rej', 'fx'), ('fx', 'sub', 'กลับไปส่งใหม่', 'exitX=0.5;exitY=1;entryX=0.5;entryY=1;')],
    ['ผู้อนุมัติกดจากอีเมลได้ทันที (ยืนยันตัวตนด้วยบัญชี M365) หรืออนุมัติใน Approval Requests',
     'ระบุเอกสารที่ต้องแก้ (Cost Sheet / Quotation / Proposal) — To-be', 'ใบเสนอราคาต่อ MA ใช้ลำดับอนุมัติเดียวกัน (ทีม MA เป็นผู้ส่ง)']))

pages.append(swimlane(
    'M2 Approval · L2', 'M2 · Level 2: ตรวจการแก้ไขไฟล์ระหว่างรออนุมัติ (Stale) และหลังอนุมัติ', ['SM', 'One Platform', 'ผู้อนุมัติ'],
    [('s', 0, 0, 'start', 'มีคำขอ\nรออนุมัติ'),
     ('ed', 0, 1, 'task', 'SM แก้ Excel\n(ตั้งใจ/ไม่ตั้งใจ)'),
     ('cmp', 1, 2, 'sys', 'เทียบ eTag / Hash\nกับ Snapshot'),
     ('ch', 1, 3, 'dec', 'ไฟล์เปลี่ยน?'),
     ('st', 1, 4, 'dec', 'สถานะคำขอ'),
     ('stale', 1, 5, 'sys', 'ทำเครื่องหมาย Stale ·\nยกเลิกลิงก์อนุมัติเดิม'),
     ('inv', 1, 6, 'sys', 'ใบเสนอราคาเดิมใช้ไม่ได้\nกับ Forecast / Win'),
     ('ntf', 2, 5, 'task', 'ผู้อนุมัติเห็นว่า\nคำขอถูกยกเลิก'),
     ('re', 0, 6, 'task', 'ส่งขออนุมัติใหม่\n(เวอร์ชันถัดไป)'),
     ('ok', 2, 3, 'task', 'ตัดสินใจตาม Snapshot\n(ตัวเลขที่ถูกส่งจริง)'),
     ('e', 0, 7, 'end', 'จบ')],
    [('s', 'ed'), ('ed', 'cmp'), ('cmp', 'ch'), ('ch', 'ok', 'ไม่เปลี่ยน'), ('ch', 'st', 'เปลี่ยน'), ('st', 'stale', 'รออนุมัติ'), ('st', 'inv', 'อนุมัติแล้ว', 'exitX=0.5;exitY=1;entryX=0.5;entryY=1;'),
     ('stale', 'ntf', '', 'dashed=1;'), ('stale', 're'), ('inv', 're'), ('re', 'e')],
    ['ผู้อนุมัติตัดสินใจบนตัวเลขที่ล็อกไว้ ไม่ใช่ไฟล์ล่าสุด — ป้องกันการแก้ราคาหลังส่ง']))

pages.append(swimlane(
    'M2 Approval · L3', 'M2 · Level 3: อายุใบเสนอราคา (60 วัน) และการแจ้งเตือน', ['One Platform (งานรายวัน)', 'SM'],
    [('s', 0, 0, 'start', 'ทุกวัน 07:00'),
     ('l', 0, 1, 'sys', 'ดึงใบเสนอราคา\nที่อนุมัติแล้ว'),
     ('d', 0, 2, 'dec', 'เหลือกี่วัน\nถึง validUntil?'),
     ('w', 1, 3, 'task', 'แจ้ง SM:\nใกล้หมดอายุ 14 วัน'),
     ('x', 0, 4, 'sys', 'หมดอายุ: ปิดสิทธิ์ใช้กับ\nForecast / Close Win'),
     ('r', 1, 4, 'task', 'ขออนุมัติใหม่ (M2)\nหรือแจ้งลูกค้ายืนราคา'),
     ('e', 1, 5, 'end', 'จบรอบ')],
    [('s', 'l'), ('l', 'd'), ('d', 'w', '≤ 14 วัน'), ('d', 'x', 'หมดแล้ว'), ('d', 'e', '> 14 วัน', 'exitX=0.5;exitY=0;entryX=0.5;entryY=0;'), ('x', 'r', '', 'dashed=1;'), ('w', 'e'), ('x', 'e')],
    ['อายุ 60 วันตั้งค่าได้ใน System Settings → ลำดับการอนุมัติ']))

pages.append(sequence(
    'M2 Approval · Sequence', 'M2 · Sequence: ขออนุมัติราคาผ่านอีเมล Microsoft 365',
    [('sm', 'SM', 'actor'), ('api', 'API', 'sys'), ('xl', 'Excel (Graph)', 'ext'), ('db', 'Database', 'sys'), ('ob', 'Outbox / Mail', 'sys'), ('dep', 'รองผู้บริหาร', 'actor'), ('ex', 'ผู้บริหาร', 'actor')],
    [('sm', 'api', 'POST /approvals (โครงการ, เวอร์ชัน)', 'sync'), ('api', 'xl', 'อ่านช่องราคา (OBO แทน SM)', 'sync'), ('xl', 'api', 'ราคา · ต้นทุน · eTag', 'ret'),
     ('api', 'db', 'Snapshot + Hash + สำเนา Submitted/vN', 'sync'), ('api', 'ob', 'คิวอีเมลถึงรองผู้บริหาร', 'async'), ('api', 'sm', '202 รออนุมัติ', 'ret'),
     ('ob', 'dep', 'อีเมล + ลิงก์อนุมัติ (Retry ได้)', 'async'), ('dep', 'api', 'อนุมัติ (ลงชื่อ M365)', 'sync'), ('api', 'db', 'ตรวจ Hash ยังตรง · บันทึกขั้นที่ 1', 'sync'),
     ('api', 'ob', 'คิวอีเมลถึงผู้บริหาร', 'async'), ('ob', 'ex', 'อีเมล + ลิงก์อนุมัติ', 'async'), ('ex', 'api', 'อนุมัติ / ส่งกลับพร้อมเหตุผล', 'sync'),
     ('api', 'db', 'สถานะ approved · validUntil +60 วัน', 'sync'), ('api', 'api', 'สร้าง PDF ใบเสนอราคา (Playwright)', 'self'), ('api', 'ob', 'แจ้งผลถึง SM', 'async'), ('ob', 'sm', 'อีเมล / Teams: อนุมัติแล้ว', 'async')],
    [('alt [Hash ไม่ตรง] → Stale ยกเลิกคำขอ', 8, 8), ('alt [ส่งกลับ] → แจ้ง SM แก้ไข', 11, 12)]))

# =====================================================================================
# M3 Close Win & Handover
# =====================================================================================
pages.append(swimlane(
    'M3 Handover · L1', 'M3 · Module Close Win & Handover — Level 1', ['SM', 'PMO (DT3-3)', 'PM', 'ผู้เข้าประชุม (MA · OPN · Dev lead)', 'One Platform'],
    [('s', 0, 0, 'start', 'ลูกค้าประกาศ\nผู้ชนะ / ออก PO'),
     ('po', 0, 1, 'task', 'แนบประกาศผู้ชนะ\n+ PO / สัญญา'),
     ('cw', 4, 2, 'sub', 'ตรวจ Close Win\n→ M1 · L3 / M3 · L3'),
     ('rq', 0, 3, 'task', 'แจ้งทีมพัฒนา\n+ ขอ PM'),
     ('n1', 4, 4, 'sys', 'แจ้ง PMO + หัวหน้า Dev\n(Teams / อีเมล)'),
     ('as', 1, 5, 'task', 'มอบหมาย PM\n(ดูภาระงาน)'),
     ('gr', 4, 6, 'sys', 'ให้สิทธิ์ Manage Project\nกับ PM คนนี้'),
     ('mt', 1, 7, 'task', 'จัดประชุม Handover'),
     ('att', 3, 8, 'task', 'เข้าร่วม: SM · PM ·\nMA · OPN · Dev lead'),
     ('tm', 2, 9, 'task', 'กรอกเงื่อนไขสัญญา:\nค่าปรับ · ประกัน · SLA · งวด'),
     ('bd', 0, 9, 'task', 'บันทึกหลักประกันสัญญา\n(ภาครัฐ)'),
     ('gt', 4, 10, 'dec', 'Handover gate\nผ่าน? (M3 · L2)'),
     ('miss', 2, 11, 'task', 'เติมสิ่งที่ขาด'),
     ('dl', 4, 12, 'sys', 'ย้าย In Delivery ·\nเปิดสร้างพื้นที่งาน'),
     ('e', 2, 13, 'end', 'PM เริ่มงาน\n→ M4')],
    [('s', 'po'), ('po', 'cw'), ('cw', 'rq', 'ผ่าน → Close Win'), ('rq', 'n1'), ('n1', 'as'), ('as', 'gr'), ('gr', 'mt'), ('mt', 'att'), ('att', 'tm'), ('att', 'bd'),
     ('tm', 'gt'), ('bd', 'gt'), ('gt', 'miss', 'ไม่ผ่าน'), ('miss', 'gt'), ('gt', 'dl', 'ผ่าน'), ('dl', 'e')],
    ['Requirement บอก “SM หา PM” ส่วนโครงสร้าง 2026 ให้ PMO (DT3-3) มอบหมาย — ใน Flow นี้ SM ขอ และ PMO มอบหมาย (ยืนยันอีกครั้ง)',
     'PM ไม่อยู่ช่วง Pre-sale: เริ่มรับงานที่ Handover', 'ผู้เข้าประชุม 5 ฝ่ายต้องครบจึงผ่าน Gate']))

pages.append(swimlane(
    'M3 Handover · L2', 'M3 · Level 2: Handover gate (handoverGate)', ['PM / PMO', 'One Platform'],
    [('s', 0, 0, 'start', 'กด “เริ่มส่งมอบ”'),
     ('c1', 1, 1, 'dec', 'Checklist\nHandover ครบ?'),
     ('c2', 1, 2, 'dec', 'มอบหมาย\nPM แล้ว?'),
     ('c3', 1, 3, 'dec', 'ผู้เข้าประชุม\n5 ฝ่ายครบ?'),
     ('c4', 1, 4, 'dec', 'ค่าปรับ > 0 และ\n≤ 0.20%/วัน?'),
     ('c5', 1, 5, 'dec', 'ระยะประกัน\n(เดือน) > 0?'),
     ('c6', 1, 6, 'dec', 'ภาครัฐ: มีหลักประกัน\nสัญญา?'),
     ('ok', 1, 7, 'sys', 'ผ่าน → In Delivery'),
     ('er', 0, 4, 'task', 'แสดงรายการที่ขาดทั้งหมด\nในครั้งเดียว'),
     ('e', 0, 7, 'end', 'สร้างพื้นที่งาน')],
    [('s', 'c1'), ('c1', 'c2', 'ครบ'), ('c2', 'c3', 'ใช่'), ('c3', 'c4', 'ครบ'), ('c4', 'c5', 'ใช่'), ('c5', 'c6', 'ใช่'), ('c6', 'ok', 'ใช่ / เอกชน'), ('ok', 'e'),
     ('c1', 'er', 'ไม่', 'exitX=0.5;exitY=0;entryX=0;entryY=0.5;'), ('c3', 'er', 'ไม่', 'exitX=0.5;exitY=0;entryX=0.25;entryY=1;'), ('c6', 'er', 'ไม่', 'exitX=0.5;exitY=0;entryX=1;entryY=0.5;'),
     ('er', 's', '', 'dashed=1;')],
    ['ตรวจทุกข้อพร้อมกันแล้วแสดงรวม (ไม่ต้องลองทีละข้อ)']))

pages.append(swimlane(
    'M3 Handover · L3', 'M3 · Level 3: ตรวจมูลค่า PO / สัญญา เทียบราคาที่อนุมัติ (checkContractValue)', ['SM', 'One Platform', 'รองผู้บริหาร → ผู้บริหาร'],
    [('s', 0, 0, 'start', 'กรอกมูลค่าสัญญา'),
     ('a', 1, 1, 'dec', 'มีใบเสนอราคา\nอนุมัติที่ยังใช้ได้?'),
     ('d', 1, 2, 'dec', 'ต่างจากราคาอนุมัติ\nเกิน ±2%?'),
     ('g', 1, 3, 'dec', 'GP ลดลง\nเกิน 3 จุด?'),
     ('b', 1, 4, 'dec', 'ภาครัฐ: ราคายื่น e-GP\nสูงกว่าที่อนุมัติ?'),
     ('ok', 1, 5, 'sys', 'ผ่าน → Close Win'),
     ('pa', 2, 3, 'task', 'อนุมัติหลังได้งาน\n(Post-award)'),
     ('no', 0, 1, 'task', 'ขออนุมัติราคาก่อน\n(M2)'),
     ('e', 0, 5, 'end', 'Close Win')],
    [('s', 'a'), ('a', 'no', 'ไม่'), ('a', 'd', 'มี'), ('d', 'g', 'ไม่'), ('g', 'b', 'ไม่'), ('b', 'ok', 'ไม่'), ('ok', 'e'),
     ('d', 'pa', 'เกิน'), ('g', 'pa', 'เกิน'), ('b', 'pa', 'ใช่'), ('pa', 'ok', 'อนุมัติ')],
    ['เกณฑ์ ±2% และ GP 3 จุด ตั้งค่าได้ใน System Settings']))

pages.append(sequence(
    'M3 Handover · Sequence', 'M3 · Sequence: Close Win → มอบหมาย PM → Handover',
    [('sm', 'SM', 'actor'), ('api', 'API', 'sys'), ('rule', 'Domain rules', 'sys'), ('db', 'Database', 'sys'), ('tm', 'Teams / Outlook', 'ext'), ('pmo', 'PMO', 'actor'), ('pm', 'PM', 'actor')],
    [('sm', 'api', 'อัปโหลด PO + มูลค่าสัญญา', 'sync'), ('api', 'rule', 'closeWinRule() · checkContractValue()', 'sync'), ('rule', 'api', 'ผ่าน / ต้องอนุมัติหลังได้งาน', 'ret'),
     ('api', 'db', 'สถานะ Close Win + ประวัติ', 'sync'), ('api', 'tm', 'แจ้ง PMO + หัวหน้า Dev: ขอ PM', 'async'), ('tm', 'pmo', 'การแจ้งเตือน', 'async'),
     ('pmo', 'api', 'มอบหมาย PM', 'sync'), ('api', 'db', 'ให้สิทธิ์ Manage Project · สถานะ Handover', 'sync'), ('api', 'tm', 'นัดประชุม Handover 5 ฝ่าย', 'async'),
     ('tm', 'pm', 'คำเชิญประชุม', 'async'), ('pm', 'api', 'บันทึกผู้เข้าประชุม + เงื่อนไขสัญญา', 'sync'), ('api', 'rule', 'handoverGate()', 'sync'),
     ('rule', 'api', 'ผ่าน', 'ret'), ('api', 'db', 'สถานะ In Delivery', 'sync'), ('api', 'pm', 'เปิดสร้างพื้นที่งาน', 'ret')],
    [('alt [ต้อง Post-award] → M2 ก่อน', 2, 2)]))

# =====================================================================================
# M4 Project Management (PM)
# =====================================================================================
pages.append(swimlane(
    'M4 PM · L1', 'M4 · Module Project Management (PM) — Level 1', ['PM', 'ทีม Product', 'ลูกค้า', 'One Platform', 'Microsoft 365'],
    [('s', 0, 0, 'start', 'ได้รับโครงการ\nจาก Handover'),
     ('ws', 0, 1, 'task', 'สร้างพื้นที่งาน: เลือก\nWaterfall / Scrum / Kanban'),
     ('sy', 3, 2, 'sys', 'สร้าง Workflow มาตรฐาน ·\nEpic จากงวดสัญญา'),
     ('tm', 0, 3, 'task', 'ขอทีมจากหัวหน้า ·\nเพิ่มสมาชิกตามบทบาท'),
     ('sh', 0, 4, 'task', 'ทำ Stakeholder Register\n(Focal Point ทั้ง 2 ฝ่าย)', T),
     ('ko', 0, 5, 'task', 'นัด Kick-off'),
     ('inv', 4, 5, 'ext', 'Outlook / Teams:\nส่งนัดประชุม', T),
     ('cu', 2, 6, 'task', 'ลูกค้าเข้า Kick-off\nให้ Requirement'),
     ('pl', 0, 7, 'task', 'วางแผนงวด · Deliverables\n· งาน · Timeline'),
     ('do', 1, 8, 'sub', 'ทำงานตาม Workflow\n→ M5'),
     ('cr', 2, 8, 'sub', 'ลูกค้าขอเปลี่ยนแปลง\n→ M4 · L3 (CR)'),
     ('mo', 0, 9, 'task', 'ติดตาม: Summary ·\nBurndown · Risk'),
     ('ms', 3, 10, 'dec', 'งานในงวด\nเสร็จครบ?'),
     ('fc', 0, 11, 'task', 'Final Check\nเอกสารส่งมอบ', T),
     ('ac', 2, 12, 'task', 'ตรวจรับงวด\nออกหนังสือรับงาน'),
     ('py', 3, 13, 'sys', 'บันทึกงวด: ส่งมอบแล้ว\n→ รับชำระ'),
     ('al', 3, 14, 'dec', 'ครบทุกงวด?'),
     ('ma', 0, 15, 'sub', 'ส่งมอบเข้าประกัน\n→ M7'),
     ('e', 0, 16, 'end', 'จบช่วงส่งมอบ')],
    [('s', 'ws'), ('ws', 'sy'), ('sy', 'tm'), ('tm', 'sh'), ('sh', 'ko'), ('ko', 'inv', '', 'dashed=1;'), ('ko', 'cu'), ('cu', 'pl'), ('pl', 'do', 'มอบหมายงาน'),
     ('cr', 'do', 'Story จาก CR', 'dashed=1;'), ('do', 'mo', 'สถานะงาน'), ('mo', 'ms'), ('ms', 'mo', 'ยัง'), ('ms', 'fc', 'ครบ'), ('fc', 'ac', 'ส่งลูกค้า'), ('ac', 'py'), ('py', 'al'),
     ('al', 'ma', 'ครบ'), ('al', 'mo', 'ยัง: งวดถัดไป', 'exitX=0.5;exitY=1;entryX=0.5;entryY=1;'), ('ma', 'e')],
    ['ความคืบหน้างวดคำนวณจากงานใน Epic ของงวด (syncMilestones)', 'CR ที่มีค่าใช้จ่ายเพิ่มต้องผ่านการอนุมัติราคาหลังได้งาน (M2)',
     'PM อนุมัติ OT ภายในเงินกันของ Cost Sheet (M6 · L2)']))

pages.append(swimlane(
    'M4 PM · L2', 'M4 · Level 2: รอบ Sprint (แบบ Scrum)', ['PM', 'ทีม Product', 'One Platform'],
    [('s', 0, 0, 'start', 'เริ่มรอบ'),
     ('bl', 0, 1, 'task', 'จัดลำดับ Backlog'),
     ('pl', 0, 2, 'task', 'Sprint Planning:\nเลือกงานตามความเร็วเฉลี่ย'),
     ('vel', 2, 2, 'sys', 'แสดงความเร็วเฉลี่ย\n(Velocity) ของ Sprint ก่อน'),
     ('st', 0, 3, 'task', 'เริ่ม Sprint'),
     ('wk', 1, 4, 'task', 'ทำงาน · ย้ายสถานะ\n· บันทึกเวลา'),
     ('bd', 2, 4, 'sys', 'อัปเดต Burndown\nรายวัน'),
     ('end', 2, 5, 'dec', 'ถึงวันสิ้น\nSprint?'),
     ('cl', 0, 6, 'task', 'ปิด Sprint: เลือกปลายทาง\nงานค้าง (Sprint ถัดไป/Backlog)'),
     ('sn', 2, 6, 'sys', 'บันทึกตั้งใจ / เสร็จจริง\n→ Velocity'),
     ('e', 0, 7, 'end', 'รอบถัดไป')],
    [('s', 'bl'), ('bl', 'pl'), ('pl', 'vel', '', 'dashed=1;'), ('pl', 'st'), ('st', 'wk'), ('wk', 'bd', '', 'dashed=1;'), ('bd', 'end'), ('end', 'wk', 'ยัง'),
     ('end', 'cl', 'ถึง'), ('cl', 'sn'), ('sn', 'e')],
    ['แบบ Waterfall ใช้งวดงานแทน Sprint · แบบ Kanban ไม่มีรอบ ใช้ WIP limit']))

pages.append(swimlane(
    'M4 PM · L3', 'M4 · Level 3: Change Request → งาน', ['ลูกค้า', 'PM', 'One Platform', 'รองผู้บริหาร → ผู้บริหาร'],
    [('s', 0, 0, 'start', 'ต้องการเปลี่ยน\nขอบเขต'),
     ('f', 0, 1, 'task', 'กรอกแบบฟอร์ม CR'),
     ('a', 1, 2, 'task', 'ประเมิน Man-day\n· ผลกระทบ Timeline'),
     ('c', 1, 3, 'dec', 'มีค่าใช้จ่าย\nเพิ่ม?'),
     ('q', 3, 4, 'task', 'อนุมัติราคา CR\n(Post-award)'),
     ('cu', 0, 5, 'task', 'ลูกค้ายืนยัน CR'),
     ('w', 2, 6, 'sys', 'สร้าง Story ติดป้าย CR\nลิงก์กลับ CR'),
     ('r', 1, 6, 'task', 'เลื่อนงาน/งวดที่กระทบ'),
     ('e', 1, 7, 'end', 'อยู่ในแผน')],
    [('s', 'f'), ('f', 'a'), ('a', 'c'), ('c', 'q', 'มี'), ('q', 'cu', 'อนุมัติ'), ('c', 'cu', 'ไม่มี (ในขอบเขตเดิม)'), ('cu', 'w'), ('w', 'r'), ('r', 'e')],
    []))

pages.append(sequence(
    'M4 PM · Sequence', 'M4 · Sequence: PM ย้ายงานบนบอร์ด → Workflow engine → Automation → แจ้งเตือน',
    [('pm', 'PM / สมาชิก', 'actor'), ('web', 'Board (Web)', 'sys'), ('eng', 'Workflow engine', 'sys'), ('db', 'Database', 'sys'), ('tm', 'Teams / ระบบแจ้งเตือน', 'ext'), ('qa', 'QA ที่ถูกมอบหมาย', 'actor')],
    [('pm', 'web', 'ลากการ์ดไป Ready for QA', 'sync'), ('web', 'eng', 'canMove(item, to, user)', 'sync'),
     ('eng', 'eng', 'สมาชิก? · เส้นทางอนุญาต? · บทบาท? · WIP? · DoD?', 'self'), ('eng', 'web', 'ผ่าน / เหตุผลที่ย้ายไม่ได้', 'ret'),
     ('web', 'eng', 'moveItem()', 'sync'), ('eng', 'db', 'สถานะใหม่ + ประวัติ (จาก → ถึง)', 'sync'), ('eng', 'eng', 'runAutomation(): หา QA ที่งานน้อยสุด', 'self'),
     ('eng', 'db', 'เปลี่ยนผู้รับผิดชอบ (ผู้ทำ = automation)', 'sync'), ('eng', 'eng', 'syncMilestones(): อัปเดต % งวด', 'self'),
     ('eng', 'tm', 'Notice ถึง QA', 'async'), ('tm', 'qa', 'กระดิ่ง + Teams: “ได้รับงาน”', 'async'), ('web', 'pm', 'การ์ดอยู่คอลัมน์ใหม่', 'ret')],
    [('alt [ไม่ผ่าน] → แสดงเหตุผล งานไม่ย้าย', 3, 3)]))

# =====================================================================================
# M5 Team Product
# =====================================================================================
pages.append(swimlane(
    'M5 Team · L1', 'M5 · Module Team Product (SA · BA · UX/UI · Dev · QA) — Level 1', ['สมาชิกทีม', 'PM', 'One Platform'],
    [('s', 0, 0, 'start', 'เข้าระบบ\n(หน้าแรก My Tasks)'),
     ('my', 0, 1, 'task', 'ดูงานที่ได้รับ: เลยกำหนด\n/ 7 วัน / ถัดไป'),
     ('pk', 0, 2, 'task', 'เลือกงาน → ย้ายเป็น\nIn Progress'),
     ('cm', 2, 2, 'sub', 'ตรวจการย้าย\n→ M5 · L3'),
     ('wk', 0, 3, 'task', 'ทำงาน · แนบไฟล์ ·\nติ๊ก Acceptance criteria'),
     ('lg', 0, 4, 'task', 'บันทึกเวลารายวัน'),
     ('ot', 2, 4, 'dec', 'หลัง 19:30 หรือ\nเกิน 8 ชม.?'),
     ('ev', 0, 5, 'task', 'ระบุ Type OT + ชม.\n+ แนบหลักฐาน', T),
     ('ap', 1, 6, 'sub', 'PM อนุมัติ OT\n→ M6 · L2'),
     ('nx', 0, 7, 'task', 'ย้ายต่อ: Code Review\n→ Ready for QA'),
     ('qa', 0, 8, 'task', 'QA ทดสอบ → Done\n(DoD ครบ)'),
     ('wr', 2, 8, 'sys', 'Weekly report ถึง PM\nทุกวันศุกร์', T),
     ('e', 0, 9, 'end', 'งานเสร็จ')],
    [('s', 'my'), ('my', 'pk'), ('pk', 'cm'), ('cm', 'wk', 'ผ่าน'), ('wk', 'lg'), ('lg', 'ot'), ('ot', 'ev', 'ใช่'), ('ev', 'ap'), ('ot', 'nx', 'ไม่'), ('ap', 'nx', '', 'dashed=1;'),
     ('nx', 'qa'), ('qa', 'wr', '', 'dashed=1;'), ('qa', 'e')],
    ['ตอนนี้ระบบให้ติ๊ก “ทำนอกเวลา” เอง — To-be: ตัดสินจากเวลา 19:30 / 8 ชม. อัตโนมัติ (TP-9)', 'สมาชิกไม่เห็นราคาขายและต้นทุน']))

pages.append(swimlane(
    'M5 Team · L2', 'M5 · Level 2: แจ้งลา → ตรวจผลกระทบงานบน Timeline → บันทึก Log (ไม่เชื่อมระบบ HR)', ['สมาชิกทีม', 'One Platform', 'PM', 'สมาชิกบทบาทเดียวกัน'],
    [('s', 0, 0, 'start', 'จะลา\n(ยื่น HR ตามปกติ)'),
     ('rq', 0, 1, 'task', 'แจ้งลาใน My Tasks:\nวันที่ · เต็ม/ครึ่งวัน · ประเภท'),
     ('cf', 1, 2, 'sys', 'หางานค้างที่ช่วง เริ่ม–ครบกำหนด\nทับวันลา (นับเฉพาะวันทำการ)'),
     ('h', 1, 3, 'dec', 'ครบกำหนด\nระหว่างลา?'),
     ('ch', 0, 4, 'dec', 'เลือกวิธีต่องาน'),
     ('pre', 0, 5, 'task', 'ทำเสร็จก่อนลา'),
     ('pm', 2, 5, 'task', 'อนุมัติเลื่อนวันส่ง หรือ\nส่งต่อ (ระบบแนะนำคน\nบทบาทเดียวกันที่ว่าง)'),
     ('tk', 3, 6, 'task', 'รับงานต่อ\n(ได้รับแจ้งเตือน)'),
     ('cal', 1, 7, 'sys', 'บันทึก Log การลา · แสดงใน\nปฏิทินทีม / Timeline / Calendar'),
     ('e', 0, 8, 'end', 'จบ')],
    [('s', 'rq'), ('rq', 'cf'), ('cf', 'h'), ('h', 'cal', 'ไม่ (กระทบน้อย)'), ('h', 'ch', 'ใช่'), ('ch', 'pre', 'ทำก่อน'), ('ch', 'pm', 'เลื่อน / ส่งต่อ'),
     ('pm', 'tk', 'ส่งต่อ'), ('pm', 'cal', 'เลื่อน'), ('pre', 'cal'), ('tk', 'cal'), ('cal', 'e')],
    ['ไม่ดึงหรือส่งข้อมูลไประบบ HR — ใช้ระบุว่าใครลาวันไหน และกระทบงานใด', 'ทุกการตัดสินใจบันทึกใน Log การลา และประวัติของการ์ดงาน', 'ยกเลิกการลาได้ก่อนวันเริ่ม (บันทึกใน Log)']))

pages.append(swimlane(
    'M5 Team · L3', 'M5 · Level 3: ตรวจการย้ายสถานะงาน (canMove) และ Automation', ['ผู้ใช้', 'Workflow engine'],
    [('s', 0, 0, 'start', 'ย้ายงานไป\nสถานะ X'),
     ('m', 1, 1, 'dec', 'เป็นสมาชิก /\nAdmin?'),
     ('v', 1, 2, 'dec', 'สิทธิ์ดูอย่างเดียว?'),
     ('t', 1, 3, 'dec', 'มีเส้นทาง\nจาก → X?'),
     ('r', 1, 4, 'dec', 'บทบาทตรงตามเส้น?\n(Done: QA/PM/หัวหน้า)'),
     ('w', 1, 5, 'dec', 'คอลัมน์ X\nเกิน WIP?'),
     ('d', 1, 6, 'dec', 'X เป็นกลุ่มเสร็จ: Acceptance\ncriteria ครบ?'),
     ('mv', 1, 7, 'sys', 'บันทึกสถานะ + ประวัติ\n+ Activity'),
     ('au', 1, 8, 'sys', 'Automation: มอบหมาย QA\n/ แจ้งผู้แจ้งงาน'),
     ('sy', 1, 9, 'sys', 'อัปเดต % งวด (Epic)'),
     ('e', 0, 9, 'end', 'ย้ายสำเร็จ'),
     ('x', 0, 4, 'task', 'แสดงเหตุผลที่ย้ายไม่ได้\n(การ์ดอยู่ที่เดิม)')],
    [('s', 'm'), ('m', 'v', 'ใช่'), ('v', 't', 'ไม่'), ('t', 'r', 'มี'), ('r', 'w', 'ตรง'), ('w', 'd', 'ไม่เกิน'), ('d', 'mv', 'ครบ / ไม่ใช่ Done'), ('mv', 'au'), ('au', 'sy'), ('sy', 'e'),
     ('m', 'x', 'ไม่', 'exitX=0.5;exitY=0;entryX=0;entryY=0.5;'), ('t', 'x', 'ไม่มี', 'exitX=0.5;exitY=0;entryX=0.25;entryY=1;'), ('w', 'x', 'เกิน', 'exitX=0.5;exitY=0;entryX=0.75;entryY=1;'),
     ('d', 'x', 'ไม่ครบ', 'exitX=0.5;exitY=0;entryX=1;entryY=0.5;')],
    ['ไฟล์ src/domain/workflow.ts — บอร์ด รายการ หน้ารายละเอียด และ My Tasks ใช้ชุดเดียวกัน', 'Workflow มาตรฐาน: To Do → In Progress → Code Review → Ready for QA → QA → UAT → Done']))

pages.append(sequence(
    'M5 Team · Sequence', 'M5 · Sequence: บันทึกเวลา + OT → PM อนุมัติ',
    [('dv', 'สมาชิกทีม', 'actor'), ('web', 'Web', 'sys'), ('eng', 'Workflow engine', 'sys'), ('db', 'Database', 'sys'), ('tm', 'Teams', 'ext'), ('pm', 'PM', 'actor')],
    [('dv', 'web', 'บันทึก 3 ชม. (เวลา 20:15) + หลักฐาน', 'sync'), ('web', 'eng', 'addWorklog()', 'sync'), ('eng', 'eng', 'หลัง 19:30 → Type OT (To-be: อัตโนมัติ)', 'self'),
     ('eng', 'db', 'Worklog + ชั่วโมงที่ใช้ + ประวัติ', 'sync'), ('eng', 'db', 'คำขอ OT (pending) = ชม. × อัตรา', 'sync'), ('eng', 'tm', 'แจ้ง PM: มีคำขอ OT', 'async'),
     ('tm', 'pm', 'การแจ้งเตือน', 'async'), ('pm', 'web', 'เปิดแท็บ OT', 'sync'), ('web', 'db', 'คำนวณเงินกัน OT คงเหลือ', 'sync'), ('pm', 'web', 'อนุมัติ', 'sync'),
     ('web', 'db', 'OT approved', 'sync'), ('web', 'tm', 'แจ้งผู้ขอ', 'async'), ('tm', 'dv', 'OT อนุมัติแล้ว', 'async')],
    [('alt [เกินเงินกัน] → หัวหน้าทีม Dev → รองผู้บริหาร', 9, 10)]))

# =====================================================================================
# M6 Procurement / OT budget
# =====================================================================================
pages.append(swimlane(
    'M6 จัดซื้อ · L1', 'M6 · Module จัดซื้อและเบิกจ่าย (OPN DT3-2) — Level 1', ['PM', 'One Platform', 'OPN (DT3-2)', 'รองผู้บริหาร DT'],
    [('s', 0, 0, 'start', 'ต้องซื้อของ /\nจ้างช่วง'),
     ('pr', 0, 1, 'task', 'สร้างคำขอซื้อ (PR)\nเลือกรายการใน Cost Sheet'),
     ('bg', 1, 2, 'sys', 'คำนวณงบคงเหลือ\nของรายการนั้น'),
     ('in', 1, 3, 'dec', 'อยู่ในงบ?'),
     ('ov', 3, 4, 'task', 'อนุมัติเกินงบ'),
     ('op', 2, 4, 'task', 'ตรวจเอกสาร · ใบเสนอราคา\nผู้ขาย'),
     ('od', 2, 5, 'dec', 'อนุมัติเบิกจ่าย?'),
     ('bk', 0, 5, 'task', 'แก้ไข / ยกเลิก PR'),
     ('rc', 1, 6, 'sys', 'บันทึกยอดใช้จริง\nหักงบ Cost Sheet'),
     ('e', 0, 6, 'end', 'ได้รับของ /\nบริการ')],
    [('s', 'pr'), ('pr', 'bg'), ('bg', 'in'), ('in', 'op', 'ใช่'), ('in', 'ov', 'เกิน'), ('ov', 'op', 'อนุมัติ'), ('op', 'od'), ('od', 'rc', 'อนุมัติ'), ('od', 'bk', 'ส่งกลับ'), ('rc', 'e')],
    ['OPN อนุมัติการเบิกจ่ายจัดซื้อตามโครงสร้าง 2026 (DT3-2)']))

pages.append(swimlane(
    'M6 จัดซื้อ · L2', 'M6 · Level 2: อนุมัติ OT ในเงินกันของ Cost Sheet', ['สมาชิกทีม', 'One Platform', 'PM', 'หัวหน้าทีม Dev → รองผู้บริหาร'],
    [('s', 0, 0, 'start', 'มีคำขอ OT'),
     ('c', 1, 1, 'sys', 'เงินกัน OT คงเหลือ =\nเงินกัน − อนุมัติแล้ว'),
     ('d', 1, 2, 'dec', 'ยอดคำขอ ≤\nคงเหลือ?'),
     ('pm', 2, 3, 'dec', 'PM อนุมัติ?'),
     ('hd', 3, 3, 'task', 'อนุมัติ OT เกินเงินกัน'),
     ('ok', 1, 4, 'sys', 'OT approved ·\nหักเงินกัน'),
     ('no', 0, 4, 'task', 'แจ้งผู้ขอ: ไม่อนุมัติ\nพร้อมเหตุผล'),
     ('e', 0, 5, 'end', 'จบ')],
    [('s', 'c'), ('c', 'd'), ('d', 'pm', 'ใช่'), ('d', 'hd', 'เกิน'), ('hd', 'ok', 'อนุมัติ'), ('pm', 'ok', 'อนุมัติ'), ('pm', 'no', 'ไม่'), ('ok', 'e'), ('no', 'e')],
    []))

pages.append(sequence(
    'M6 จัดซื้อ · Sequence', 'M6 · Sequence: คำขอซื้อ (PR) ภายในงบ Cost Sheet',
    [('pm', 'PM', 'actor'), ('api', 'API', 'sys'), ('db', 'Database', 'sys'), ('tm', 'Teams / Outlook', 'ext'), ('opn', 'OPN', 'actor'), ('dep', 'รองผู้บริหาร', 'actor')],
    [('pm', 'api', 'POST /procurement (รายการ Cost Sheet, ยอด)', 'sync'), ('api', 'db', 'procurementBudget(): งบคงเหลือ', 'sync'), ('db', 'api', 'คงเหลือ', 'ret'),
     ('api', 'tm', 'แจ้ง OPN', 'async'), ('tm', 'opn', 'คำขอซื้อใหม่', 'async'), ('opn', 'api', 'อนุมัติเบิกจ่าย', 'sync'), ('api', 'db', 'บันทึกยอดใช้จริง', 'sync'),
     ('api', 'tm', 'แจ้ง PM', 'async'), ('tm', 'pm', 'PR อนุมัติแล้ว', 'async')],
    [('alt [เกินงบ] → รองผู้บริหารอนุมัติก่อน', 3, 4)]))

# =====================================================================================
# M7 MA & Service Desk
# =====================================================================================
pages.append(swimlane(
    'M7 MA · L1', 'M7 · Module Maintenance Support (MA) & Service Desk — Level 1', ['PM', 'ทีม MA', 'Call center', 'ลูกค้า', 'One Platform', 'Microsoft 365'],
    [('s', 0, 0, 'start', 'ส่งมอบครบ\nทุกงวด'),
     ('ho', 0, 1, 'task', 'ส่งมอบเข้าประกัน:\nเอกสาร · ผู้ติดต่อ · ระบบ'),
     ('ac', 1, 2, 'task', 'รับมอบ / ยืนยัน', T),
     ('dt', 4, 2, 'sys', 'บันทึกวันเริ่ม · ส่งมอบ ·\nเริ่ม-หมดประกัน'),
     ('pm', 4, 3, 'sys', 'สร้างรอบ PM ตามที่เสนอขาย\n(1 / 3 / 6 เดือน)'),
     ('rp', 1, 4, 'task', 'ทีมพัฒนาเตรียมรายงาน (Template)\n→ ทีม MA ตรวจ'),
     ('ml', 5, 4, 'ext', 'Outlook กล่องกลางทีม MA:\nส่งรายงาน PM ถึงลูกค้า'),
     ('is', 3, 3, 'task', 'ลูกค้าแจ้งปัญหา'),
     ('tk', 2, 5, 'task', 'เปิด Ticket\n(ช่องทาง · ความรุนแรง)'),
     ('sl', 4, 5, 'sys', 'คำนวณ SLA ·\nในประกัน / นอกประกัน'),
     ('fx', 1, 6, 'task', 'แก้ไข · ปิด Ticket'),
     ('nt', 4, 7, 'sys', 'แจ้งเตือนต่อประกัน\n3 เดือน / 1 เดือน'),
     ('ct', 1, 7, 'task', 'ติดต่อลูกค้า\nเรื่องต่อ MA'),
     ('d', 3, 8, 'dec', 'ต่อ MA?'),
     ('q', 1, 9, 'sub', 'ใบเสนอราคา MA\n→ M2 (ทีม MA ส่ง)'),
     ('np', 4, 10, 'sys', 'สร้างโครงการ MA (ชื่อเดิม)\nลิงก์โครงการแม่ · แบ่งรายได้'),
     ('end', 1, 8, 'task', 'ปิดโครงการ (Ended)'),
     ('e', 1, 11, 'end', 'วงจร MA\nปีถัดไป')],
    [('s', 'ho'), ('ho', 'ac'), ('ac', 'dt'), ('dt', 'pm'), ('pm', 'rp', 'ก่อนรอบ X วัน'), ('rp', 'ml'), ('is', 'tk'), ('tk', 'sl'), ('sl', 'fx'), ('nt', 'ct'), ('ct', 'd'),
     ('d', 'q', 'ต่อ'), ('d', 'end', 'ไม่ต่อ'), ('q', 'np', 'ลูกค้าออก PO'), ('np', 'e')],
    ['Requirement MA-5 กำหนดแจ้งลูกค้า 2 รอบ: 3 เดือน และ 1 เดือนก่อนหมดประกัน (ระบบตอนนี้เตือนภายใน 90/60/30 วัน)',
     'รายได้ต่อสัญญา MA แบ่งระหว่าง BU ผู้พัฒนาและทีม MA', 'Call center อยู่ใต้ทีม MA รับเคสช่วงประกัน']))

pages.append(swimlane(
    'M7 MA · L2', 'M7 · Level 2: แจ้งเตือนและต่อสัญญา MA', ['One Platform (งานรายวัน)', 'ทีม MA', 'ลูกค้า', 'รองผู้บริหาร → ผู้บริหาร'],
    [('s', 0, 0, 'start', 'ทุกวัน'),
     ('d', 0, 1, 'dec', 'เหลือกี่วันถึง\nหมดประกัน?'),
     ('n1', 0, 2, 'sys', 'รอบ 1 (90 วัน): อีเมลถาม\nลูกค้า + งานให้ MA', T),
     ('n2', 0, 3, 'sys', 'รอบ 2 (30 วัน): อีเมลย้ำ\n+ แจ้งหัวหน้า', T),
     ('q', 1, 4, 'task', 'ทำใบเสนอราคา MA\n(ค่าเริ่มต้น 12%)'),
     ('ap', 3, 5, 'task', 'อนุมัติราคา'),
     ('sd', 1, 6, 'task', 'ส่งใบเสนอราคาให้ลูกค้า'),
     ('r', 2, 7, 'dec', 'ลูกค้าตอบ?'),
     ('po', 2, 8, 'task', 'ออก PO ต่อ MA'),
     ('np', 0, 9, 'sys', 'สร้างโครงการ MA ปีถัดไป\n(ชื่อเดิม + ปีที่ n)'),
     ('ed', 0, 8, 'sys', 'ครบวัน: ย้าย Ended'),
     ('e', 1, 10, 'end', 'จบ')],
    [('s', 'd'), ('d', 'n1', '= 90'), ('d', 'n2', '= 30'), ('n1', 'q', 'ลูกค้าสนใจ'), ('n2', 'q'), ('q', 'ap'), ('ap', 'sd', 'อนุมัติ'), ('sd', 'r'), ('r', 'po', 'ต่อ'), ('r', 'ed', 'ไม่ต่อ / ไม่ตอบ'),
     ('po', 'np'), ('np', 'e'), ('ed', 'e')],
    ['แจ้งจากกล่องอีเมลกลางทีม MA หรือชื่อผู้ดูแล — ต้องยืนยัน']))

pages.append(swimlane(
    'M7 MA · L3', 'M7 · Level 3: Service Desk Ticket และ SLA', ['ลูกค้า', 'Call center', 'One Platform', 'ทีม MA'],
    [('s', 0, 0, 'start', 'พบปัญหา'),
     ('ch', 0, 1, 'task', 'แจ้งทางโทร / อีเมล /\nLINE / แบบฟอร์ม'),
     ('tk', 1, 2, 'task', 'เปิด Ticket: ระบบ ·\nความรุนแรง · ช่องทาง'),
     ('w', 2, 3, 'dec', 'อยู่ในประกัน /\nมีสัญญา MA?'),
     ('out', 1, 4, 'task', 'แจ้งค่าบริการ /\nเสนอสัญญา MA'),
     ('sla', 2, 4, 'sys', 'ตั้งเวลา SLA ตามความรุนแรง\n(ตอบรับ · แก้ไข)'),
     ('as', 3, 5, 'task', 'รับเคส · แก้ไข'),
     ('pa', 3, 6, 'dec', 'รอลูกค้า?'),
     ('ps', 2, 6, 'sys', 'หยุดนับ SLA ชั่วคราว'),
     ('br', 2, 7, 'dec', 'ใกล้เกิน SLA?'),
     ('es', 3, 8, 'task', 'แจ้งหัวหน้าทีม MA'),
     ('cl', 1, 9, 'task', 'ยืนยันกับลูกค้า · ปิด Ticket'),
     ('e', 0, 10, 'end', 'ปิดเคส')],
    [('s', 'ch'), ('ch', 'tk'), ('tk', 'w'), ('w', 'out', 'ไม่'), ('w', 'sla', 'ใช่'), ('sla', 'as'), ('as', 'pa'), ('pa', 'ps', 'ใช่'), ('ps', 'as', '', 'dashed=1;'), ('pa', 'br', 'ไม่'),
     ('br', 'es', 'ใช่'), ('br', 'cl', 'ไม่'), ('es', 'cl'), ('cl', 'e')],
    []))

pages.append(sequence(
    'M7 MA · Sequence', 'M7 · Sequence: แจ้งเตือนต่อประกันอัตโนมัติ → ใบเสนอราคา MA',
    [('job', 'Scheduler', 'sys'), ('api', 'API', 'sys'), ('db', 'Database', 'sys'), ('ml', 'Outlook', 'ext'), ('cu', 'ลูกค้า', 'actor'), ('ma', 'ทีม MA', 'actor'), ('ex', 'รอง → ผู้บริหาร', 'actor')],
    [('job', 'api', 'รันงานรายวัน', 'sync'), ('api', 'db', 'หาโครงการที่เหลือ 90 / 30 วัน', 'sync'), ('db', 'api', 'รายการ', 'ret'),
     ('api', 'ml', 'อีเมลถามลูกค้า (Template)', 'async'), ('ml', 'cu', 'อีเมลแจ้งใกล้หมดประกัน', 'async'), ('api', 'ma', 'งาน: ติดตามลูกค้า', 'async'),
     ('cu', 'ma', 'สนใจต่อ MA', 'async'), ('ma', 'api', 'สร้างใบเสนอราคา MA', 'sync'), ('api', 'ex', 'ขออนุมัติ (M2)', 'async'), ('ex', 'api', 'อนุมัติ', 'sync'),
     ('api', 'ml', 'ส่งใบเสนอราคา PDF', 'async'), ('ml', 'cu', 'ใบเสนอราคา MA', 'async'), ('cu', 'ma', 'ออก PO', 'async'),
     ('ma', 'api', 'บันทึก PO', 'sync'), ('api', 'db', 'สร้างโครงการ MA (parentId · split รายได้)', 'sync')],
    [('loop [ทุกโครงการที่ถึงรอบ]', 3, 5)]))

# =====================================================================================
# Consistency review page
# =====================================================================================
pg = free('ตรวจสอบความสอดคล้อง', 'ผลตรวจความสอดคล้องของ Flow กับ Requirement และระบบปัจจุบัน', '✓ สอดคล้อง · △ ต้องปรับระบบ · ? ต้องยืนยันกับผู้ใช้')
items = [
    ('✓', 'SM-6/7 อนุมัติราคาผ่านอีเมล M365 · Reject แก้ไขเป็นเวอร์ชันใหม่', 'ระบบมีลำดับรองผู้บริหาร → ผู้บริหาร + Snapshot ตรงกับข้อมูลโครงสร้าง 2026'),
    ('✓', 'SM-8/9 Sale ยื่นและแจ้งผล โดย SM บันทึก', 'Sale ไม่มีบัญชีในระบบ · ฟิลด์ Sale เป็นชื่ออ้างอิง'),
    ('✓', 'PM-1 PM ไม่อยู่ช่วง Pre-sale เริ่มที่ Handover', 'allowedMoves: Handover → Delivery โดย PM/PMO'),
    ('✓', 'PM-5 เลือกวิธีบริหาร', 'มี Template ตามงวดงาน (Waterfall) · Scrum · Kanban'),
    ('△', 'SM-3/4 เอกสารที่ 70% + หัวหน้าตรวจ TOR Final ก่อนส่งลูกค้า', 'ระบบตรวจแค่ใบเสนอราคาอนุมัติ · ต้องเพิ่ม Checklist เอกสาร + ขั้นหัวหน้าตรวจ TOR'),
    ('?', 'SM-11 “SM หา PM” vs โครงสร้าง 2026 “PMO มอบหมาย PM”', 'Flow ใช้: SM แจ้ง/ขอ → PMO มอบหมาย → ระบบให้สิทธิ์ Manage Project'),
    ('△', 'PM-3 Stakeholder / Focal point · นัด Kick-off', 'ยังไม่มีทะเบียนผู้ติดต่อและการส่งนัด Outlook/Teams'),
    ('△', 'PM-8 เอกสารส่งมอบ + Final Check', 'มีงวดงานและสถานะส่งมอบ ยังไม่มี Checklist เอกสารต่องวด'),
    ('△', 'TP-8/9 OT หลัง 19:30 + หลักฐาน · 8 ชม./วัน', 'ตอนนี้ผู้ใช้ติ๊ก OT เอง · ไม่มีแนบหลักฐาน'),
    ('✓', 'TP-10 การลาและส่งต่องาน (ไม่เชื่อม HR)', 'แจ้งลา → ตรวจงานทับวันลา → PM อนุมัติเลื่อน / ส่งต่อ → Log การลา'),
    ('?', 'MA-2 “เปลี่ยนสถานะเป็น MA ชื่อเดิม”', 'ระบบแยก: ช่วงประกันใช้โครงการเดิม (Warranty) · ต่อสัญญาแล้วสร้างโครงการ MA ใหม่ชื่อเดิม ลิงก์โครงการแม่ — ยืนยันว่าตรงความต้องการ'),
    ('✓', 'MA-3/4 รอบ Preventive Maintenance + ส่งอีเมลลูกค้า', 'รอบตามที่เสนอขาย 1/3/6 เดือน → ทีมพัฒนาเตรียมรายงาน → MA ส่งจากกล่องกลาง'),
    ('△', 'MA-5 แจ้งลูกค้า 3 เดือน / 1 เดือน', 'ปรับลำดับแจ้งเตือนเป็นรอบ 1 (90 วัน) / รอบ 2 (30 วัน) แล้ว · ยังต้องทำให้ระบบส่งอีเมลเองตามวัน'),
    ('?', 'เกณฑ์ระบบ: อายุใบเสนอราคา 60 วัน · PO ต่าง ±2% · GP ลด 3 จุด · ค่าปรับ ≤ 0.20%/วัน', 'ค่าเริ่มต้นจากต้นแบบ ปรับได้ใน System Settings — ต้องยืนยันตัวเลขจริงของบริษัท'),
]
for i, (mark, req, note) in enumerate(items):
    y = 80 + i * 62
    color = {'✓': 'start', '△': 'dec', '?': 'ext'}[mark]
    pg.add(mark, color, 30, y, 44, 44)
    pg.add(req, 'box', 90, y - 4, 470, 52)
    pg.add(note, 'note', 580, y - 4, 640, 52)
pages.append(pg)

out = os.path.join(os.path.dirname(__file__), '..', '..', 'docs', 'diagrams')
write(pages, os.path.join(out, 'one-platform-flows.drawio'), os.path.join(out, 'preview.html'))
print(len(pages), 'pages')
