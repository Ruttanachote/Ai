# ระบบไฟล์เอกสารการขาย + Cost Sheet & Quotation (ทำในต้นแบบแล้ว)

อ้างอิง 2 spec: **Project Details & ไฟล์เอกสารการขาย** และ **Template: Cost Sheet & Quotation** (10 พ.ย. 2569)
ตำแหน่งในระบบ: Project Overview → เลือกโครงการ → แท็บ **ภาพรวมและเอกสาร** (โฟลเดอร์) / **Cost Sheet และใบเสนอราคา** / **Activity**

## สิ่งที่ทำตาม spec
| หัวข้อ spec | ในต้นแบบ |
|---|---|
| 4.1 โครงสร้างโฟลเดอร์ | ก่อนขาย 6 · หลังขาย 10 · Other · ซ่อนตามประเภทโครงการ (MA ไม่มี TOR / Proposal / Training) · การ์ดแสดงจำนวนไฟล์ วันอัปเดต สถานะ (ว่าง · มีไฟล์ · รออนุมัติ · อนุมัติแล้ว) และ ✱ เอกสารบังคับของสถานะถัดไปที่ยังขาด |
| 4.2 อัปโหลด | ลากวางบนการ์ด / ในโฟลเดอร์ / ปุ่ม Upload · หลายไฟล์ · Progress bar ต่อไฟล์ · ลองใหม่เมื่อการเชื่อมต่อหลุด · ชนิดไฟล์ + 50 MB · ชื่อมาตรฐาน `{ProjectCode}_{DocType}_v{n}_{YYYYMMDD}` เก็บชื่อเดิม · Metadata (เลขที่เอกสารบังคับ Quotation / PO / Contract) |
| 4.3 เวอร์ชัน | อัปทับ = เวอร์ชันใหม่ · ประวัติ ดาวน์โหลด ย้อนกลับ · ป้าย "ล่าสุด" และ "อนุมัติแล้ว" · เวอร์ชันที่อนุมัติล็อก ลบไม่ได้ |
| 4.4 ดู / ดาวน์โหลด | Preview PDF และรูปในเบราว์เซอร์ · ดาวน์โหลดทีละไฟล์ · ดาวน์โหลด Cost Sheet / Contract บันทึก log |
| 4.6 จัดการไฟล์ | เปลี่ยนชื่อ · ย้ายโฟลเดอร์ · ลบแบบ soft delete (ยืนยันด้วยชื่อ) · ถังขยะกู้คืนได้ 30 วัน · ค้นหาทั้งโครงการ · มุมมองการ์ด / รายการ |
| 4.7 Empty state | "ยังไม่มีไฟล์ในโฟลเดอร์นี้" + ปุ่มอัปโหลด + บอกว่าต้องใช้ก่อนสถานะใด |
| 3.2 การเงิน | GP / GP% คำนวณเอง · แสดงที่มา "จาก Cost Sheet rev.N · อนุมัติ …" หรือ "ประมาณการ" · Contribution Margin |
| 3.5 Activity | ทุกการเปลี่ยนแปลง: สถานะ ไฟล์ เอกสาร อนุมัติ (ค่าเดิม → ค่าใหม่) · กรองตามประเภทและผู้ใช้ |
| Template §2 สถานะเอกสาร | Draft → Pending (3 steps) → Approved (ล็อก + อัปเดตโครงการ) / Rejected (สร้าง revision ใหม่) / Cancelled |
| Template §3 Cost Sheet | **สร้างเป็นไฟล์ Excel Online (Microsoft 365) จาก Template** ในโฟลเดอร์ SharePoint ของโครงการ · Header จากโครงการ · 7 หมวดพร้อมสูตรต่อแถว · หมายเหตุต่อแถว · ลากสลับแถว · สรุป COGS / Manday / Revenue / GP / GM% / Entertainment / Contingency / CM / CM% คำนวณอัตโนมัติ (sticky) · ส่งออก Excel |
| Template §4 Quotation | สร้างจาก Cost Sheet · เติมรายการให้ Subtotal = Revenue · หน่วย · ส่วนลด บาท/% · VAT 7% · Grand Total · ตัวอักษรบาทถ้วน · งวดชำระรวม 100% · ประกัน / ไม่รวมในราคา / หมายเหตุ · พรีวิว PDF ตามแบบฟอร์ม (แดง-ขาว-เทา) |
| Template §5.4 Validation | ตัวเลขไม่ติดลบ · อย่างน้อย 1 แถว · ขาดทุนต้องใส่เหตุผล · GM ต่ำกว่าเกณฑ์เตือนเหลือง · งวด = 100% · ส่วนลด ≤ ราคารวม · ยืนราคา ≥ วันที่ออก · ไฟล์ที่อนุมัติแล้วแก้ไม่ได้ · Upload .xlsx ≤ 10 MB — แสดงใต้ช่อง |
| 5.1 Send to Approve | Slide-over เลือก Cost Sheet + Quotation · เห็นลำดับผู้อนุมัติ · หมายเหตุ · บันทึกประชุมก่อนส่ง (บังคับ) · ผู้อนุมัติ Approve / Reject ได้ทั้งในหน้าโครงการและ Mail Inbox |
| 6 สิทธิ์ | Owner / SM: ทุกอย่าง · Collaborator: อัปโหลดเฉพาะหลังขาย ลบไฟล์ตัวเอง · ผู้อื่นดูได้ · Cost Sheet / Contract เปิดได้เฉพาะ Owner, SM, หัวหน้ากลุ่ม, ผู้อนุมัติ, ผู้บริหาร |

## จุดที่ 2 spec ไม่ตรงกัน — ใช้ตาม Template (ใหม่กว่า)
- **Gating:** Project Details spec บอก Opportunity → Pipeline ต้องมี Cost Sheet + Quotation อนุมัติ แต่ Template บอกโฟลเดอร์เปิดที่ Pipeline และ **Pipeline → Forecast** ต้องอนุมัติ ระบบใช้แบบ Template
- **3 steps:** ระบบนับขั้น SM ส่ง + รองผู้บริหาร + ผู้บริหาร = 3 ขั้น ตรงกับ "0 of 3 / 3 of 3 steps" ใน Approval mailbox

## ยังไม่ทำ (Phase 2 ตาม spec หรือต้องมีระบบจริง)
ZIP ทั้งโฟลเดอร์ / ชุดยื่นซอง · Preview ไฟล์ Office (ต้องแปลงฝั่ง server) · คอมเมนต์ต่อไฟล์ + @mention · ลิงก์แชร์ภายใน · อ่าน Named range จากไฟล์ .xlsx ที่อัปโหลด · เทียบหมวดต้นทุนกับไฟล์ Cost Sheet ตัวจริงของบริษัท (spec ขอไฟล์ .xlsx จริง 1 ไฟล์)

## ปรับตามไฟล์จริง `Cost_Sheet_template_example.xlsx` (10 พ.ย. 2569)
ระบบเปลี่ยนโครงสร้างให้ตรงกับไฟล์ของบริษัททุกแถว (ทดสอบด้วยตัวเลขตัวอย่างในไฟล์ ได้ผลตรงทุกค่า)

### ชีต Cost_Sheet_Template
| ส่วน | ช่องที่กรอก | สูตร (ตามไฟล์) |
|---|---|---|
| Header | Profit/Cost Center · Project Name · Project Reference Number · Customer · Date · Prepared By | ดึงจากโครงการ |
| REVENUE | Type (Hardware / Software / Imp SVC / MA SVC / Rental SVC / Other) · Income Description · Qty · Unit Price · Part No. · Note · สัดส่วน Payment#1–#5 (แถว 11) | Total = D×E · Payment#n = $F×n$11 · Total Revenue = SUM · Include VAT = ×1.07 |
| COST OF GOODS SOLD | 1 Hardware · 2 Software · 3 Rental Cost · 4 Outsource · 5 Training Cost · 6 Accessories · 7 Consulting cost | D×E · Training = D×E×3 · Consulting = Total Revenue × Fx ÷ (1+Fx) |
| สรุป COGS | — | Total COGS = SUM(1–7) · Gross Profit = Revenue − COGS · Margin = IF(Revenue=0,0,GP/Revenue) |
| DIRECT & LABOUR | 8 Manday / Man month · 9 Logistic (Air freight) · 10 Financial cost (Interest) | D×E · Interest = D×E×(Hardware+Software) · Manday รวมในคอลัมน์ D |
| VARIABLE | 11 Operational Support (Implementation · Transportation · On-Going support · Oversea Training · Hotel) · 12 Entertainment · 13 Contingency (5%) | D×E · Contingency = Total Revenue × D |
| สรุป | — | Total Direct & Labour and Variable = SUM(8–13) · Total Expense = COGS + ข้างต้น · Contribution Margin = Revenue − Total Expense · Margin |
| Internal Transfer Charge | Intra-SBU / Inter-SBU (Imp SVC, Prime SM) · Profit Center Code | D×E — แสดงไว้ ไม่รวมใน Total Expense (ตามไฟล์) |
| Approved By · Remark | ลายเซ็นตามลำดับอนุมัติ · หมายเหตุ | — |

### ชีต Quotation_Template
- **ส่วนหัว:** Customer (Name, Company Name, Phone/Fax, Email) · Quotation No. · Date · [Version Revise] · Project
- **รายการ:** ITEM · PART NO. · Product Description · QTY. · Unit Price · Amount — **ดึงจากรายได้ใน Cost Sheet** (ไฟล์ใช้สูตรอ้าง Cost_Sheet_Template!C/D/E/F/L)
- **สรุปราคา:** Total → Special Discount → Subtotal → Vat 7% → Grand Total
- **Conditions:** Price validity · Term of payment (ค่าเริ่มต้นจาก Payment#1–#5) · Term of delivery · Vat7% include · Warranty · Sales Person
- **ลายเซ็น:** Sincerely by (Account Manager) · Verify and Approved by · Accepted by (ลูกค้า)

### จุดในไฟล์ที่ควรยืนยัน
1. **Training Cost:** สูตรคูณ 3 (`=D33*E33*3`) ตั้งใจให้คูณ 3 ทุกครั้งใช่ไหม
2. **Consulting cost:** สูตร `=F18*D37/(1+D37)` คิดจาก Total Revenue ไม่ได้ใช้ Unit Price ในช่อง E (ในตัวอย่าง Fx = 1 จึงเป็น 50% ของรายได้)
3. **คอลัมน์ Payment#1–#5 ของต้นทุน:** ในไฟล์มีแค่ผลรวมระดับกลุ่ม ไม่มีสูตรในรายการย่อย ระบบจึงแบ่งงวดเฉพาะรายได้
4. **ลำดับผู้อนุมัติในไฟล์:** BD Executive / Manager · DC-SM VP · DC-PS VP · EVP / SEVP ต่างจากระบบตอนนี้ที่ใช้ 2 ขั้น (รองผู้บริหาร DT → ผู้บริหาร DT)
5. **ช่อง Total Revenue คอลัมน์ E:** ไฟล์รวม Unit Price (`=SUM(E12:E17)`) ระบบแสดงตามไฟล์ แต่ค่านี้ไม่ได้ใช้คำนวณ
