"""One Platform user manual → docs/manual/One-Platform-คู่มือการใช้งาน.html (+ PDF via render.cjs).
Run: python3 scripts/manual/build.py && node scripts/manual/render.cjs
Screenshots come from docs/manual/img (captured from the running app)."""
import os
from html import escape

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'docs', 'manual')
VERSION = 'ฉบับที่ 1.0 · 10 พฤศจิกายน 2569'

def img(name, cap):
    return f'<figure><img src="img/{name}.png" alt="{escape(cap)}"><figcaption>{escape(cap)}</figcaption></figure>'

def steps(*items):
    return '<ol class="steps">' + ''.join(f'<li>{i}</li>' for i in items) + '</ol>'

def tip(t, kind='tip'):
    label = {'tip': 'เคล็ดลับ', 'note': 'หมายเหตุ', 'rule': 'กฎของระบบ'}[kind]
    return f'<aside class="{kind}"><b>{label}</b> {t}</aside>'

def table(head, rows):
    return '<table><thead><tr>' + ''.join(f'<th>{h}</th>' for h in head) + '</tr></thead><tbody>' + ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows) + '</tbody></table>'

CH = []  # (id, title, html)

def ch(id_, title, body):
    CH.append((id_, title, body))

# ---------------------------------------------------------------------------------------------
ch('overview', 'ภาพรวมระบบ', f'''
<p>One Platform คือระบบกลางของ DT SBU ที่ดูแลโครงการตั้งแต่ <b>ได้โอกาสขายครั้งแรก</b> จนถึง <b>ต่อสัญญา MA</b> ในที่เดียว
ทุกคนเห็นข้อมูลชุดเดียวกัน แต่แต่ละบทบาทเห็นเฉพาะเมนูและโครงการที่เกี่ยวกับงานของตัวเอง เอกสารทั้งหมดเก็บใน SharePoint ของโครงการ
และการแจ้งเตือนส่งผ่านกระดิ่งในระบบ อีเมล และ Microsoft Teams</p>
<h3>วงจรงานของโครงการ</h3>
<div class="flow">
  <div><b>1 · ก่อนขาย</b><span>SM ลงทะเบียน เก็บ Requirement ทำ Cost Sheet / ใบเสนอราคา / TOR / Proposal</span></div>
  <div><b>2 · อนุมัติ</b><span>หัวหน้ากลุ่มตรวจ TOR · รองผู้บริหาร → ผู้บริหารอนุมัติราคา</span></div>
  <div><b>3 · ประมูล / ปิดการขาย</b><span>Sale ยื่น SM บันทึกผล · Close Win / Close Lose</span></div>
  <div><b>4 · Handover</b><span>PMO มอบหมาย PM · ประชุม 5 ฝ่าย · เงื่อนไขสัญญา</span></div>
  <div><b>5 · ส่งมอบ</b><span>PM และทีมพัฒนาทำงานใน Project Workspace · งวดงาน · ตรวจรับ</span></div>
  <div><b>6 · ประกันและ MA</b><span>ทีม MA รับมอบ · รายงาน Preventive Maintenance · Service Desk · ต่อสัญญา</span></div>
</div>
<h3>สถานะของโครงการ</h3>
{table(['สถานะ', 'ความหมาย', 'ใครย้ายได้'], [
  ['Opportunity (10–20%)', 'มีโอกาสขาย ยังไม่ชัด', 'SM'],
  ['Pipeline (40–50%)', 'ลูกค้าเริ่มเจรจา ต้องมีลูกค้า ทีม และ Sale', 'SM'],
  ['Forecast (70–80%)', 'ตกลงขอบเขตแล้ว ต้องมีราคาที่อนุมัติ + TOR ที่หัวหน้าตรวจผ่าน + Proposal', 'SM'],
  ['Rebidding', 'ประมูลภาครัฐ ต้องมีเลข e-GP และราคากลาง', 'SM'],
  ['Close Win / Close Lose', 'ผลการขาย (แพ้ต้องระบุเหตุผล คู่แข่ง ราคา)', 'SM'],
  ['Handover', 'ส่งต่องานให้ PM', 'PMO / หัวหน้า'],
  ['In Delivery', 'กำลังส่งมอบ', 'PM / PMO'],
  ['Warranty', 'อยู่ในระยะประกัน', 'ทีม MA รับมอบ'],
  ['Ended / Cancelled', 'ปิดโครงการ / ยกเลิก', 'MA / หัวหน้า'],
])}
''')

ch('menu', 'โครงสร้างเมนู', f'''
<p>เมนูด้านซ้ายจัดตามลำดับการทำงาน — เริ่มจาก <b>งานของฉัน</b> ตามด้วย <b>ข้อมูลกลาง</b> แล้วไล่ตามวงจรโครงการ <b>ก่อนขาย → ส่งมอบ → ประกันและ MA</b>
ปิดท้ายด้วยการเงินและผู้ดูแลระบบ แต่ละบทบาทเห็นเฉพาะเมนูที่ใช้</p>
{table(['หมวด', 'เมนู', 'ใช้ทำอะไร'], [
  ['<b>My Work · งานของฉัน</b>', 'My Tasks', 'งานที่ได้รับมอบหมายทุกโครงการ สร้างงาน แจ้งลา Timesheet'],
  ['', 'Approval Requests', 'คำขอที่รอคุณอนุมัติ (ราคา, TOR Final)'],
  ['', 'Calendar', 'ปฏิทินกลาง: วันหยุด การลา ประชุม งวดงาน รอบ PM วันหมดประกัน'],
  ['', 'My Performance', 'ชั่วโมงทำงาน OT และงานที่เสร็จของตัวเอง'],
  ['<b>Projects &amp; Customers · ข้อมูลกลาง</b>', 'Project Register', 'ทะเบียนโครงการทุกสถานะ — จุดเริ่มต้นเปิดดูโครงการใดก็ได้'],
  ['', 'Customer Accounts', 'ทะเบียนลูกค้าและหน่วยงานผู้ใช้'],
  ['<b>Sales · ก่อนขาย</b>', 'Sales Dashboard', 'ยอดขาย เป้า Pipeline และกำหนดการใกล้ถึง'],
  ['', 'Sales Pipeline', 'บอร์ดดีลตามสถานะ ลากเพื่อย้ายสถานะ'],
  ['', 'Opportunity Registration', 'ลงทะเบียนโอกาสขายใหม่'],
  ['', 'Solution Catalog', 'โซลูชันสำเร็จรูปที่ขายซ้ำได้'],
  ['<b>Delivery · ส่งมอบโครงการ</b>', 'Project Overview', 'ภาพรวมทุกโครงการที่กำลังส่งมอบ (สำหรับผู้บริหาร / PMO)'],
  ['', 'Project Workspace', 'พื้นที่ทำงานของ PM และทีม: งาน บอร์ด งวดงาน ความเสี่ยง ผู้ติดต่อ'],
  ['', 'Resource Workload', 'ภาระงานของทีม การลา และคำขอคน'],
  ['<b>After-Sales · ประกันและ MA</b>', 'Warranty &amp; Maintenance', 'รับมอบเข้าประกัน รอบรายงาน PM ต่อสัญญา MA'],
  ['', 'Service Desk', 'Ticket แจ้งปัญหา และ SLA'],
  ['<b>Finance · จัดซื้อและการเงิน</b>', 'Purchase Requisitions', 'คำขอซื้อในงบ Cost Sheet และการอนุมัติเบิกจ่าย'],
  ['', 'Bank Guarantees', 'หลักประกันซองและหลักประกันสัญญา'],
  ['<b>Admin · ผู้ดูแลระบบ</b>', 'System Settings', 'สิทธิ์ ลำดับอนุมัติ ปฏิทิน เวลาทำงาน การแจ้งเตือน Audit log'],
])}
{tip('หน้าโครงการ (เปิดจาก Project Register) คือ “แฟ้มโครงการ” สำหรับทุกฝ่าย ส่วน Project Workspace คือ “โต๊ะทำงาน” ของ PM และทีมพัฒนา — หน้าโครงการมีปุ่มลัดไป Workspace (บอร์ดงาน งวดงาน ความเสี่ยง) เสมอ')}
''')

ch('start', 'เริ่มต้นใช้งาน', f'''
<h3>เข้าสู่ระบบ</h3>
{steps('เปิด One Platform แล้วกด <b>เข้าสู่ระบบด้วย Microsoft</b> ใช้บัญชี Microsoft 365 ของบริษัท',
       'ระบบเปิดเมนูตามตำแหน่งงานของคุณ (กำหนดใน Microsoft Entra ID) และพาไปหน้าแรกของบทบาท')}
{img('01-login', 'หน้าเข้าสู่ระบบ (ต้นแบบมีช่องเลือกบทบาทและบัญชีทีมพัฒนาสำหรับเดโม)')}
{tip('ในต้นแบบ เลือก “บทบาทสำหรับเดโม” ได้ ถ้าเลือกทีมพัฒนาจะมีช่องเลือกบัญชีรายคน (SA, BA, UX/UI, Front-end, Back-end, DevOps, QA) ระบบจริงไม่มีช่องนี้', 'note')}
<h3>แถบด้านบน</h3>
{table(['ส่วน', 'การใช้งาน'], [
  ['ตำแหน่งหน้า', 'บอกว่าอยู่หมวดไหน เมนูอะไร'],
  ['ค้นหา (Ctrl + K)', 'พิมพ์ชื่อเมนู ชื่อโครงการ หรือรหัสงาน เช่น SPP-5 แล้วกด Enter'],
  ['ปุ่มพระจันทร์ / พระอาทิตย์', 'สลับธีมสว่าง / มืด'],
  ['กระดิ่ง', 'การแจ้งเตือน (ตัวเลขแดง = ยังไม่อ่าน) คลิกเพื่อไปหน้าที่เกี่ยวข้อง'],
  ['ชื่อมุมขวา', 'ธีม ออกจากระบบ (ต้นแบบ: สลับบทบาทเดโม)'],
  ['ย่อเมนู (ล่างซ้าย)', 'ย่อแถบเมนูเหลือไอคอน'],
])}
{img('03-search', 'ค้นหาด่วนด้วย Ctrl + K')}
''')

ch('mywork', 'งานของฉัน (ทุกบทบาท)', f'''
<h3>My Tasks</h3>
<p>งานทุกชิ้นที่คุณรับผิดชอบหรือร่วมทำจากทุกโครงการ แบ่งเป็น <b>เลยกำหนด / ครบกำหนดใน 7 วัน / ถัดไป / ยังไม่กำหนดวัน</b>
เปลี่ยนสถานะได้ทันทีจากรายการ คลิกชื่องานเพื่อเปิดรายละเอียด</p>
{img('26-mytasks', 'My Tasks: Timesheet สัปดาห์นี้ งานที่ต้องทำ การลา และการแจ้งเตือน')}
<h3>สร้างงานของตัวเอง</h3>
{steps('กด <b>+ สร้างงาน</b> ที่มุมขวาบนของ My Tasks',
       'เลือกโครงการ ตั้งชื่องาน ประเภท ความสำคัญ วันครบกำหนด (และงวดงานถ้ามี)',
       'กด <b>สร้างงาน</b> — งานถูกมอบหมายให้คุณทันทีและขึ้นในรายการ')}
{img('27-newtask', 'สร้างงานของฉัน')}
{tip('ปุ่ม + สร้างงาน แสดงเมื่อคุณเป็นสมาชิกของพื้นที่งานอย่างน้อย 1 โครงการ ถ้ายังไม่เป็น ให้ PM เพิ่มในแท็บ Settings ของพื้นที่งาน')}
<h3>แจ้งลา</h3>
<p>ใช้แจ้งทีมและ PM ว่าคุณไม่อยู่วันไหน และงานใดได้รับผลกระทบ (ยังต้องยื่นลาในระบบ HR ตามปกติ)</p>
{steps('กด <b>แจ้งลา</b> เลือกวันที่ เต็มวันหรือครึ่งวัน ประเภทการลา',
       'ระบบแสดงงานที่ช่วงเวลาทับวันลา งานที่ครบกำหนดระหว่างลาต้องเลือกวิธี: <b>ทำเสร็จก่อนลา / ขอเลื่อนวันส่ง / ขอให้ PM ส่งต่อ</b>',
       'กด <b>บันทึกการลา</b> — PM ได้รับแจ้งเตือน และ Log การลาบันทึกไว้')}
{img('30-leave', 'แจ้งลาและตรวจผลกระทบกับงาน')}
<h3>Calendar และ My Performance</h3>
{img('32-calendar', 'Calendar: ปฏิทินกลาง กรองตามประเภทเหตุการณ์ได้')}
{img('31-performance', 'My Performance: ชั่วโมงรายวันเทียบ 8 ชม. และงานที่เสร็จตรงเวลา')}
''')

ch('sales', 'ฝ่ายขาย (Solution Manager)', f'''
<h3>1. ลงทะเบียนโอกาสขาย</h3>
{steps('เมนู <b>Opportunity Registration</b>',
       'เลือกแหล่งที่มา: <b>ลูกค้ามีโอกาสจ้าง</b> หรือ <b>ทีมคิด Product เอง</b> (เลือกจาก Solution Catalog ระบบเติมชื่อ ทีม ราคา และ Proposal ตั้งต้นให้)',
       'กรอกลูกค้า ประเภทโครงการ ทีมเจ้าของ งบประมาณ และ Sale ที่ทำงานคู่กัน แล้วบันทึก — ระบบออกรหัสและสร้างโฟลเดอร์ SharePoint')}
{img('05-register', 'ลงทะเบียนแบบ Product-led จาก Solution Catalog')}
<h3>2. หน้าโครงการ</h3>
<p>เปิดจาก <b>Project Register</b> แถบบนแสดงสถานะและปุ่มย้ายสถานะ แถบความคืบหน้าแสดงตำแหน่งในวงจร แท็บด้านล่างแบ่งงานตามช่วง</p>
{img('06-project', 'หน้าโครงการ: สถานะ ปุ่มย้ายสถานะ และแท็บ')}
<h3>3. Requirement และ TOR</h3>
{steps('แท็บ <b>Requirement และ TOR</b> — กรอก Requirement Overview และ Process การใช้งาน บันทึกประชุมกับลูกค้า',
       'แนบ <b>TOR Final</b> แล้วกด <b>ส่งหัวหน้ากลุ่มตรวจ</b> (ส่งลูกค้าได้หลังผ่านเท่านั้น)',
       'กด <b>สร้างจาก Template</b> เพื่อสร้าง Proposal',
       'กล่อง “พร้อมเข้า Forecast” บอกว่ายังขาดอะไร')}
{img('07-requirement', 'Requirement, TOR Final และ Proposal')}
<h3>4. Cost Sheet และขออนุมัติราคา</h3>
{steps('แท็บ <b>Cost Sheet และใบเสนอราคา</b> — เปิด Excel Online (ไฟล์เดียว แยกแท็บ Cost Sheet / Quotation)',
       'กด <b>ส่งขออนุมัติ</b> ระบบล็อกตัวเลขที่ส่ง (Snapshot) และส่งอีเมลถึงรองผู้บริหาร แล้วผู้บริหาร',
       'ถ้าถูกส่งกลับ ระบบบอกว่าต้องแก้เอกสารใด แก้แล้วส่งเป็นเวอร์ชันใหม่',
       'อนุมัติแล้ว ใบเสนอราคาใช้ได้ 60 วัน ระบบเตือนก่อนหมดอายุ 14 วัน')}
{img('08-costsheet', 'Cost Sheet และสถานะการอนุมัติ')}
{tip('ถ้าแก้ไฟล์ Excel หลังส่งขออนุมัติ คำขอจะถูกยกเลิก (Stale) ต้องส่งใหม่ — ผู้บริหารอนุมัติตามตัวเลขที่ถูกล็อกเท่านั้น', 'rule')}
<h3>5. ย้ายสถานะ ประมูล และบันทึกผล</h3>
{steps('กดปุ่มย้ายสถานะบนหน้าโครงการ หรือลากการ์ดใน <b>Sales Pipeline</b> — ระบบแสดงสิ่งที่ยังขาดถ้าไม่ผ่านเงื่อนไข',
       'งานประมูลภาครัฐ: บันทึกเลข e-GP ราคากลาง ราคาที่ยื่น และ <b>วันคาดว่าประกาศผล</b> ในแท็บประมูล (ระบบเตือนล่วงหน้า 1 วัน)',
       'Sale แจ้งผล → SM กด Close Win (แนบประกาศผู้ชนะ + PO/สัญญา) หรือ Close Lose (ระบุเหตุผล คู่แข่ง ราคา)',
       'หลังชนะ กด <b>แจ้งทีมพัฒนา + ขอ PM</b> ในแท็บ Handover')}
{img('04-pipeline', 'Sales Pipeline')}
{img('02-sales-dashboard', 'Sales Dashboard')}
{tip('ดีลภาครัฐปิด Close Win ได้หลังพ้นระยะอุทธรณ์ 7 วันทำการ และถ้ามูลค่าสัญญาต่างจากราคาที่อนุมัติเกิน ±2% หรือกำไรลดเกิน 3 จุด ต้องขออนุมัติหลังได้งาน', 'rule')}
{img('09-catalog', 'Solution Catalog')}
''')

ch('approve', 'หัวหน้ากลุ่มและผู้บริหาร', f'''
<h3>อนุมัติราคา (รองผู้บริหาร → ผู้บริหาร DT)</h3>
{steps('เปิดจากลิงก์ในอีเมล หรือเมนู <b>Approval Requests</b>',
       'ตรวจราคา ต้นทุน และกำไร แล้วกด <b>อนุมัติ</b> หรือ <b>ส่งกลับแก้ไข</b> (ต้องระบุเหตุผลและเอกสารที่ต้องแก้)')}
{img('10-approvals', 'Approval Requests ของรองผู้บริหาร')}
<h3>ตรวจ TOR Final (หัวหน้ากลุ่ม)</h3>
{steps('เมนู <b>Approval Requests</b> ส่วน “TOR Final รอหัวหน้ากลุ่มตรวจ”',
       'เปิดโครงการ แท็บ Requirement และ TOR แล้วกด <b>ผ่าน</b> หรือ <b>ส่งกลับแก้</b> พร้อมความเห็น')}
{img('11-tor-review', 'คิว TOR Final ของหัวหน้ากลุ่ม')}
<h3>จัดคนให้โครงการ (หัวหน้าทีม Dev)</h3>
{steps('เมนู <b>Resource Workload</b> ส่วน “คำขอคนจาก PM”',
       'กด <b>จัดคน</b> เลือกคนจากรายการ (เรียงจากงานค้างน้อย คนที่ลาช่วงนั้นอยู่ท้าย) ระบบเพิ่มเป็นสมาชิกพื้นที่งานให้')}
{img('25-workload', 'Resource Workload: ภาระงาน คำขอคน และปฏิทินการลาของทีม')}
''')

ch('pm', 'PMO และ Project Manager', f'''
<h3>1. Handover</h3>
{steps('PMO เปิดโครงการที่ชนะแล้ว แท็บ <b>Handover</b> เลือก PM แล้วกด <b>มอบหมาย PM และนัดประชุม Handover</b> — PM ได้สิทธิ์ Manage Project และระบบส่งนัด Teams ถึง 5 ฝ่าย (SM · PM · MA · OPN · หัวหน้าทีม Dev)',
       'หลังประชุม ติ๊กผู้เข้าร่วม กรอกเงื่อนไขสัญญา (ค่าปรับ ระยะประกัน SLA) และหลักประกันสัญญา',
       'กด <b>เริ่มส่งมอบ</b> — ระบบตรวจ Handover gate และเปิดให้สร้างพื้นที่งาน')}
{img('12-handover', 'Handover จาก Pre-sale ให้ PM')}
<h3>2. Project Workspace</h3>
<p>เมนู <b>Project Workspace</b> → เลือกโครงการ ครั้งแรกเลือกรูปแบบ <b>ตามงวดงาน (Waterfall) / Scrum / Kanban</b> แท็บในพื้นที่งาน:</p>
{table(['แท็บ', 'ใช้ทำอะไร'], [
  ['Summary', 'ภาพรวมสถานะ กิจกรรมล่าสุด งานใกล้ครบกำหนด ภาระงานรายคน'],
  ['List / Board / Calendar / Timeline', 'จัดการงานแบบตาราง บอร์ด ปฏิทิน และไทม์ไลน์ (ลากเพื่อย้าย/เลื่อนวัน)'],
  ['Backlog (Scrum)', 'วางแผน Sprint เริ่ม/ปิด Sprint'],
  ['Milestones', 'งวดงาน: สิ่งส่งมอบ → Final Check → ส่งลูกค้า → ตรวจรับ → ส่งมอบเข้าประกัน'],
  ['Risks', 'ทะเบียนความเสี่ยง (โอกาส × ผลกระทบ)'],
  ['Stakeholders', 'ผู้ติดต่อทั้ง 2 ฝ่าย (Focal Point) และนัดประชุม'],
  ['Reports', 'Burndown, Velocity, งวดงาน, เวลาและ OT ของทีม'],
  ['Docs / Forms', 'หน้าเอกสาร บันทึกประชุม และแบบฟอร์มให้ลูกค้าแจ้ง UAT / CR'],
  ['Settings', 'สมาชิกและบทบาท Workflow Automation และคำขอคน'],
])}
{img('15-ws-summary', 'Summary ของพื้นที่งาน')}
{img('16-ws-board', 'Board: ลากการ์ดเพื่อย้ายสถานะ (ระบบตรวจกฎ Workflow)')}
{tip('Workflow มาตรฐาน: To Do → In Progress → Code Review → Ready for QA → QA → UAT → Done ย้ายไปข้างหน้าทีละขั้น ย้อนกลับได้ทุกขั้น เข้า Done ได้เฉพาะ QA / PM / หัวหน้าทีม และต้องติ๊ก Acceptance criteria ครบ', 'rule')}
<h3>3. ทีมโครงการ</h3>
{steps('แท็บ <b>Settings</b> → สมาชิกและสิทธิ์ — เพิ่มคนและกำหนดบทบาท (SA, BA, UX/UI, Front-end, Back-end, DevOps, QA ฯลฯ)',
       'ถ้าต้องการคนเพิ่ม กด <b>+ ขอคน</b> ระบุบทบาท จำนวน ช่วงเวลา — หัวหน้าทีมได้รับคำขอ')}
{img('23-ws-settings', 'สมาชิก บทบาท และคำขอคน')}
<h3>4. ผู้ติดต่อและประชุม</h3>
{steps('แท็บ <b>Stakeholders</b> เพิ่มผู้ติดต่อฝั่งลูกค้าและฝั่งเรา ระบุ Focal Point',
       'กดปุ่มประเภทประชุม (Kick-off, ประชุมทีม, เก็บ Requirement, ทบทวนงวดงาน) เลือกผู้เข้าร่วม — ระบบส่งนัด Outlook + Teams และสร้างหน้าบันทึกประชุม')}
{img('21-ws-people', 'Stakeholder Register และประชุม')}
<h3>5. งวดงานและการส่งมอบ</h3>
{steps('แท็บ <b>Milestones</b> เพิ่มสิ่งส่งมอบของแต่ละงวด และเปลี่ยนสถานะ ร่าง → กำลังตรวจ → พร้อมส่ง',
       'เมื่อทุกชิ้นพร้อม กด <b>Final Check</b> แล้ว <b>ส่งลูกค้า</b>',
       'ลูกค้าตรวจรับแล้ว กด <b>บันทึกตรวจรับ</b> แนบหนังสือตรวจรับ — ระบบแจ้ง OPN วางบิล',
       'ตรวจรับครบทุกงวด กด <b>ส่งมอบเข้าประกัน</b> ระบุผู้ติดต่อ — ทีม MA ได้รับงาน')}
{img('19-ws-milestones', 'Milestones: สิ่งส่งมอบ Final Check และตรวจรับ')}
<h3>6. ความเสี่ยง OT และการจัดซื้อ</h3>
{steps('แท็บ <b>Risks</b> บันทึกความเสี่ยง โอกาสเกิด ผลกระทบ เจ้าของ แผนรับมือ (ความเสี่ยงสูงแจ้งหัวหน้ากลุ่มอัตโนมัติ)',
       'อนุมัติ OT: หน้าโครงการ แท็บแผนงาน → OT (ภายในเงินกันของ Cost Sheet; เกินเงินกันต้องหัวหน้าทีม → รองผู้บริหาร)',
       'ขอซื้อ: เมนู <b>Purchase Requisitions</b> เลือกรายการจาก Cost Sheet — OPN อนุมัติเบิกจ่าย',
       'เมื่อมีคนลา: เมนู Resource Workload → บันทึกการลา กด <b>อนุมัติเลื่อน</b> หรือ <b>ส่งต่องาน</b>')}
{img('20-ws-risks', 'Risk Register')}
{img('13-overview', 'Project Overview สำหรับผู้บริหารและ PMO')}
''')

ch('dev', 'ทีมพัฒนา (SA · BA · UX/UI · Dev · DevOps · QA)', f'''
{steps('เปิด <b>My Tasks</b> ทุกเช้า เลือกงาน แล้วเปลี่ยนสถานะเป็น In Progress',
       'คลิกชื่องานเพื่อเปิดรายละเอียด: กรอกรายละเอียด แนบไฟล์ ติ๊ก Acceptance criteria เพิ่ม Sub-task',
       'ทำเสร็จ ย้ายต่อ Code Review → Ready for QA (ระบบมอบหมาย QA ให้อัตโนมัติ) → QA ทดสอบแล้วย้าย Done')}
{img('28-drawer', 'รายละเอียดงาน: สถานะ ผู้รับผิดชอบ Acceptance criteria ไฟล์แนบ')}
<h3>บันทึกเวลาและ OT</h3>
{steps('ในรายละเอียดงาน แท็บ <b>เวลา</b> ใส่วันที่ เวลาเริ่ม และเวลาสิ้นสุด',
       'ระบบแยก <b>เวลาปกติ</b> (จ.–ศ. 08:30–17:30 ไม่นับพัก 12:00–13:00) กับ <b>OT</b> (นอกเวลา เสาร์–อาทิตย์ วันหยุดราชการ) ให้อัตโนมัติ',
       'ถ้ามี OT ต้องระบุว่าทำอะไรและ <b>แนบหลักฐาน</b> แล้วกดบันทึก — ระบบสร้างคำขอ OT ให้ PM อนุมัติ',
       'ดูยอดรายสัปดาห์ที่ Timesheet ในหน้า My Tasks (วันที่บันทึกไม่ครบ 8 ชม. เป็นสีแดง)')}
{img('29-timelog', 'บันทึกเวลา ระบบแยก OT และขอหลักฐาน')}
<h3>รายงาน Preventive Maintenance</h3>
<p>เมื่อถึงรอบ งานขึ้นใน My Tasks ส่วน “รายงาน Preventive Maintenance ที่ต้องเตรียม” กด <b>เตรียมรายงาน</b> กรอกสรุปผลตรวจ สิ่งที่พบ ข้อแนะนำ แนบไฟล์จาก Template แล้วกด <b>ส่งให้ทีม MA</b></p>
''')

ch('ma', 'ทีม MA และ Call center', f'''
<h3>รับมอบเข้าประกัน</h3>
{steps('เมนู <b>Warranty &amp; Maintenance</b> ส่วน “รอรับมอบเข้าประกัน”',
       'ตรวจเอกสารและผู้ติดต่อ แล้วกด <b>รับมอบเข้าประกัน</b> — ระบบคำนวณวันเริ่ม/หมดประกันจากสัญญา และสร้างรอบรายงาน PM')}
{img('35-ma', 'Warranty & Maintenance: วันหมดประกัน รอบ PM และคิวงาน')}
<h3>รอบ Preventive Maintenance</h3>
{steps('รอบ (รายเดือน / 3 เดือน / 6 เดือน) และวันรอบแรกกำหนดตอนเสนอขาย ทีม MA แก้ได้ที่ปุ่ม <b>แก้รอบ PM</b>',
       'ทีมพัฒนาเตรียมรายงานและส่งให้ทีม MA → สถานะ “รอ MA ส่งอีเมล”',
       'กด <b>ส่งอีเมลถึงลูกค้า</b> ตรวจข้อความ (ส่งจากกล่องกลาง ma-support@) แล้วส่ง หรือ <b>ส่งกลับให้แก้</b>')}
{img('36-pm-rounds', 'ตารางรอบ Preventive Maintenance ของโครงการ')}
<h3>ต่อสัญญา MA</h3>
{steps('ระบบส่งอีเมลถึงลูกค้าอัตโนมัติ <b>รอบที่ 1 เมื่อเหลือ 90 วัน</b> และ <b>รอบที่ 2 เมื่อเหลือ 30 วัน</b> (แจ้งหัวหน้าด้วย)',
       'ลูกค้าสนใจ: หน้าโครงการ แท็บประกันและ MA กด <b>ลูกค้าต่อ MA — เปิดโครงการใหม่</b> ทำใบเสนอราคาและขออนุมัติตามขั้นตอนปกติ')}
<h3>Service Desk (Call center)</h3>
<p>เมนู <b>Service Desk</b> เปิด Ticket ระบุระบบ ความรุนแรง และช่องทาง ระบบนับ SLA (หยุดนับเมื่อรอลูกค้า) และเตือนเมื่อใช้เวลาเกิน 80%</p>
{img('37-helpdesk', 'Service Desk และ SLA')}
''')

ch('opn', 'OPN (จัดซื้อและการเงิน)', f'''
{steps('เมนู <b>Purchase Requisitions</b> ตรวจคำขอซื้อจาก PM เทียบงบคงเหลือของรายการใน Cost Sheet แล้วอนุมัติเบิกจ่าย',
       'เมื่อ PM บันทึกตรวจรับงวด ระบบแจ้งให้วางบิลงวดนั้น',
       'เมนู <b>Bank Guarantees</b> ติดตามหลักประกันซองและหลักประกันสัญญา วันคืนหลักประกัน')}
{img('33-procurement', 'Purchase Requisitions')}
{img('34-guarantees', 'Bank Guarantees')}
''')

ch('admin', 'ผู้ดูแลระบบ', f'''
{table(['แท็บใน System Settings', 'ใช้ทำอะไร'], [
  ['สิทธิ์ตามบทบาท', 'ตารางสิทธิ์ของแต่ละบทบาท'],
  ['ลำดับการอนุมัติ', 'ผู้อนุมัติ เกณฑ์ ±% มูลค่าสัญญา อายุใบเสนอราคา'],
  ['ปฏิทินวันทำการ', 'วันหยุดราชการ เวลาทำงาน พักกลางวัน เวลาเริ่มนับ OT'],
  ['ช่องทางแจ้งเตือน', 'เปิด/ปิดอีเมลและ Teams'],
  ['งานอัตโนมัติ · Outbox', 'กฎแจ้งเตือนรายวัน ประวัติการรัน ข้อความที่ส่ง Weekly report'],
  ['Audit log', 'ใครเปลี่ยนอะไรเมื่อไร ค้นหาได้'],
  ['ทีม DT และเป้า · Microsoft 365', 'โครงสร้างทีม เป้ายอดขาย และการเชื่อมต่อ M365'],
])}
{img('39-jobs', 'งานอัตโนมัติรายวันและ Outbox')}
{img('40-audit', 'Audit log')}
''')

ch('appendix', 'ภาคผนวก', f'''
<h3>บทบาทและหน้าแรก</h3>
{table(['บทบาท', 'หน้าแรก', 'งานหลัก'], [
  ['Solution Manager', 'Sales Dashboard', 'ลงทะเบียน Requirement ราคา ขออนุมัติ บันทึกผล'],
  ['หัวหน้ากลุ่ม / หัวหน้าทีม Dev', 'Sales Dashboard', 'ตรวจ TOR จัดคน ดูยอดทีม ยกเลิก/เปิดโครงการใหม่'],
  ['รองผู้บริหาร / ผู้บริหาร DT', 'Approval Requests / Dashboard', 'อนุมัติราคา อนุมัติเกินงบ'],
  ['PMO (DT3-3)', 'Project Overview', 'มอบหมาย PM Handover ติดตามทุกโครงการ'],
  ['OPN (DT3-2)', 'Purchase Requisitions', 'อนุมัติเบิกจ่าย หลักประกัน วางบิล'],
  ['Project Manager', 'Project Workspace', 'วางแผน งวดงาน ทีม ความเสี่ยง OT'],
  ['ทีมพัฒนา', 'My Tasks', 'ทำงาน บันทึกเวลา แจ้งลา รายงาน PM'],
  ['ทีม MA', 'Warranty & Maintenance', 'รับมอบ รายงาน PM ต่อสัญญา'],
  ['Call center', 'Service Desk', 'รับเรื่องและติดตาม SLA'],
  ['ผู้ดูแลระบบ', 'System Settings', 'ตั้งค่าระบบ'],
])}
<h3>คำถามที่พบบ่อย</h3>
<dl class="faq">
  <dt>ย้ายสถานะไม่ได้</dt><dd>ระบบจะแสดงรายการสิ่งที่ยังขาด เช่น ยังไม่มีใบเสนอราคาที่อนุมัติ หรือ TOR ยังไม่ผ่านหัวหน้า เติมให้ครบแล้วลองใหม่</dd>
  <dt>ลากงานบนบอร์ดแล้วไม่ย้าย</dt><dd>Workflow ไม่อนุญาตข้ามขั้น หรือคอลัมน์ปลายทางเต็ม (WIP) หรือ Acceptance criteria ยังไม่ครบ — ข้อความเตือนจะบอกเหตุผล</dd>
  <dt>ไม่เห็นปุ่มสร้างงาน</dt><dd>ยังไม่ได้เป็นสมาชิกพื้นที่งาน หรือมีสิทธิ์ดูอย่างเดียว ติดต่อ PM ของโครงการ</dd>
  <dt>ไม่เห็นราคาและต้นทุน</dt><dd>ทีมพัฒนาไม่เห็นข้อมูลราคาตามนโยบาย</dd>
  <dt>หาโครงการไม่เจอ</dt><dd>กด Ctrl + K แล้วพิมพ์ชื่อหรือรหัส หรือเปิด Project Register แล้วค้นหา</dd>
</dl>
''')

# ---------------------------------------------------------------------------------------------
toc = ''.join(f'<li><a href="#{i}"><span>{n + 1}. {escape(t)}</span></a></li>' for n, (i, t, _) in enumerate(CH))
body = ''.join(f'<section class="chapter" id="{i}"><h2><span class="no">{n + 1}</span>{escape(t)}</h2>{h}</section>' for n, (i, t, h) in enumerate(CH))
html = f'''<!doctype html><html lang="th"><head><meta charset="utf-8"><title>One Platform — คู่มือการใช้งาน</title>
<link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700&family=Sarabun:wght@400;500;600&display=swap" rel="stylesheet">
<style>
@page {{ size: A4; margin: 18mm 16mm 18mm 16mm; }}
* {{ box-sizing: border-box; }}
body {{ font-family: 'Sarabun', sans-serif; font-size: 11pt; line-height: 1.65; color: #141a26; margin: 0; }}
h1, h2, h3, th, .flow b, .cover * {{ font-family: 'Prompt', sans-serif; }}
.cover {{ height: 255mm; display: flex; flex-direction: column; justify-content: space-between; padding: 30mm 6mm 10mm; page-break-after: always; }}
.cover .brand {{ display: flex; align-items: center; gap: 10px; font-size: 16pt; font-weight: 600; }}
.cover .brand i {{ width: 0; height: 0; border-left: 12px solid #e2332b; border-top: 9px solid transparent; border-bottom: 9px solid transparent; }}
.cover h1 {{ font-size: 34pt; line-height: 1.2; margin: 0 0 8mm; }}
.cover h1 span {{ display: block; color: #3457d5; font-size: 20pt; font-weight: 500; margin-top: 4mm; }}
.cover p {{ color: #667085; font-size: 12pt; margin: 0; }}
.cover .meta {{ border-top: 2px solid #141a26; padding-top: 4mm; display: flex; justify-content: space-between; color: #3a4356; font-size: 10pt; }}
.toc {{ page-break-after: always; }}
.toc h2 {{ font-size: 20pt; margin: 0 0 8mm; }}
.toc ol {{ list-style: none; padding: 0; margin: 0; font-family: 'Prompt'; font-size: 13pt; }}
.toc li {{ border-bottom: 1px solid #e4e7ee; padding: 3mm 0; }}
.toc a {{ color: #141a26; text-decoration: none; }}
.chapter {{ page-break-before: always; }}
.chapter:first-of-type {{ page-break-before: auto; }}
h2 {{ font-size: 19pt; margin: 0 0 5mm; display: flex; align-items: center; gap: 4mm; }}
h2 .no {{ display: inline-grid; place-items: center; width: 11mm; height: 11mm; border-radius: 3mm; background: #3457d5; color: #fff; font-size: 14pt; }}
h3 {{ font-size: 13pt; margin: 7mm 0 2.5mm; color: #213c9e; page-break-after: avoid; }}
p {{ margin: 0 0 3mm; }}
figure {{ margin: 3mm 0 5mm; page-break-inside: avoid; }}
figure img {{ width: 100%; border: 1px solid #cdd3de; border-radius: 2mm; display: block; }}
figcaption {{ font-size: 9pt; color: #667085; margin-top: 1.5mm; }}
table {{ width: 100%; border-collapse: collapse; margin: 2mm 0 5mm; font-size: 10pt; page-break-inside: auto; }}
th {{ text-align: left; background: #ebeffc; color: #213c9e; font-weight: 500; padding: 2mm 2.5mm; }}
td {{ padding: 2mm 2.5mm; border-bottom: 1px solid #e4e7ee; vertical-align: top; }}
tr {{ page-break-inside: avoid; }}
.steps {{ margin: 0 0 4mm; padding-left: 6mm; }}
.steps li {{ margin-bottom: 1.5mm; }}
aside {{ border-left: 1.2mm solid #3457d5; background: #f3f5f9; padding: 2.5mm 4mm; margin: 2mm 0 5mm; font-size: 10pt; border-radius: 0 2mm 2mm 0; page-break-inside: avoid; }}
aside.rule {{ border-color: #a86a08; background: #fbf1dc; }}
aside.note {{ border-color: #667085; }}
aside b {{ font-family: 'Prompt'; margin-right: 2mm; }}
.flow {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; margin: 2mm 0 5mm; }}
.flow div {{ border: 1px solid #cdd3de; border-radius: 2mm; padding: 3mm; display: grid; gap: 1mm; font-size: 9.5pt; }}
.flow b {{ color: #3457d5; font-size: 11pt; }}
.faq dt {{ font-family: 'Prompt'; font-weight: 500; margin-top: 3mm; }}
.faq dd {{ margin: 0 0 0 4mm; color: #3a4356; }}
</style></head><body>
<div class="cover">
  <div class="brand"><i></i>One Platform</div>
  <div><h1>คู่มือการใช้งาน<span>ระบบบริหารงานขาย ส่งมอบโครงการ และ MA</span></h1>
    <p>สำหรับ DT SBU — Solution Manager, ผู้บริหาร, PMO, PM, ทีมพัฒนา, OPN, ทีม MA และ Call center</p></div>
  <div class="meta"><span>{VERSION}</span><span>ภาพหน้าจอจากต้นแบบ — ข้อมูลเป็นข้อมูลตัวอย่าง</span></div>
</div>
<div class="toc"><h2>สารบัญ</h2><ol>{toc}</ol></div>
{body}
</body></html>'''
os.makedirs(ROOT, exist_ok=True)
open(os.path.join(ROOT, 'One-Platform-คู่มือการใช้งาน.html'), 'w', encoding='utf-8').write(html)
print('chapters', len(CH))
