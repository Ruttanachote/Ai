# การตัดสินใจกลางสำหรับรอบแก้ v1.1 (ผูกพันทุกเล่ม)

> ที่มา: review v1.0 ห้าด้านใน `research_notes/ออกแบบระบบการศึกษา TNSU ระดับ production/v1-review/` (consistency.md, functional_sports.md, architecture_compliance.md, ux_exec_change.md, bid_commercial.md)
> ผู้ใช้สั่ง (28 ต.ค. 2569): **โฟกัสตัวระบบก่อน ยังไม่ทำ Proposal/TOR** → ข้อค้นพบใน bid_commercial.md และเนื้อหาเล่ม 15 **พักไว้** (ไม่แก้ ไม่ลบ) ยกเว้นส่วนที่เป็นตัวระบบล้วน

## D-01 ขอบเขตรอบนี้
- แก้ทุกข้อจาก consistency, functional_sports, architecture_compliance, ux_exec_change ที่เป็นเรื่อง **ระบบ** (ฟังก์ชัน ข้อมูล สถาปัตยกรรม ความปลอดภัย กฎหมายที่ระบบต้องรองรับ การ rollout/ปฏิบัติการ UX)
- ไม่แก้: ราคา/แพ็กเกจประมูล/เงื่อนไขสัญญา/การนำเสนอ business case (เล่ม 15, ส่วน cost ของเล่ม 12 คงไว้ตามเดิม ยกเว้นตัวเลขที่ต้องเปลี่ยนเพราะการแก้ระบบ เช่น HSM ไซต์ที่ 2 — ให้ระบุผลกระทบเป็นหมายเหตุ ไม่ต้องคำนวณราคาใหม่ทั้งเล่ม)
- เล่ม 15: เพิ่มหัวเอกสาร "สถานะ: พักไว้ (parked) ตามคำสั่งผู้ใช้ 28 ต.ค. 2569 — ยังไม่ทำ Proposal/TOR" เท่านั้น

## D-02 วันที่
คงแผนวันที่ตาม blueprint §7 (สัญญาเริ่ม M1 = เม.ย. 2570) แต่ทุกเล่มที่แสดงวันที่ให้แสดงเลขเดือนสัมพัทธ์ (M18, M26 …) คู่กันเสมอ และระบุว่า "ถ้าเริ่มสัญญาหลัง ต.ค. 2570 ทุก release เลื่อน 12 เดือนตามรอบรับสมัคร (เล่ม 12 §1.3)"

## D-03 ขอบเขต R1/R2 (ปิด REL-01..06)
- **R1 รวม (แบบ minimal):** REC (Person master + guardian relation), CUR (program offering + intake cap ของ pilot), DOC (ใบเสร็จ, บัตรประจำตัวผู้สอบ, PDF ประกาศ), ADMIN (4-eyes config, job monitor, break-glass), HLT vault (medical clearance ก่อนสอบทักษะ), FAC (จองสนามสอบทักษะ), RPT (OIT/ITA disclosure ส่วนรับสมัคร) — ทุกอย่างอยู่ในโมดูลเจ้าของ ห้ามไปฝังใน ADM/FIN
- **R2 เพิ่ม:** **GRD แบบ minimal** (ยื่นจบ, pre-audit, clearance) เพื่อไม่ให้ pilot ไม่มีใครรับคำร้องจบช่วง มิ.ย.–ต.ค. 2572; **ATH ส่วน eligibility + team travel (W-30/W-31)** ย้ายเข้า R2 ทันพลศึกษาเกมส์ ก.ย. 2572; FAC เต็ม
- 01 §4.1, 06 release matrix, 12 pilot coverage ต้องตรงกันตามนี้

## D-04 ข้อมูลสุขภาพและกุญแจ (ปิด OWN-01/02, SEC-09, key recovery)
- ชื่อฐานข้อมูล: `hlt_vault` (ทุกเล่ม)
- Wrapped DEK เก็บใน **key store แยก `hlt_keys`** (ตาม 08) ไม่อยู่ใน backup ของ vault; key store มี replication ไปไซต์ B แบบ synchronous/RPO ≈ 0 และ backup ของ key store มีอายุสั้น (≤ 35 วัน) เพื่อให้ crypto-shredding มีผลภายในกรอบที่ประกาศ
- **กุญแจแยกตามประเภทระเบียน (per-person × per-record-class)** เพื่อให้ลบตาม retention แต่ละประเภทได้ (ยา/ผู้เยาว์, wellness, injury ฯลฯ)
- OpenBao ใช้ HSM auto-unseal: **ไซต์ B มี HSM ของตนพร้อม seal key**; Shamir shares เป็น recovery keys (ไม่ใช่ unseal); drill ต้องมีกรณี "HSM สูญหาย"; ระบุ RPO ของ OpenBao ให้สอดคล้องกับ key store
- Backup แบบ Object Lock ระยะยาว: ระบุว่าข้อมูลที่ถูกขอลบจะถูกลบเมื่อ backup หมดอายุ + บันทึก tombstone เพื่อลบซ้ำหลัง restore (restore-then-reapply-erasure)
- ข้อมูล wellness ย้ายไปเก็บใน HLT vault (ATH เก็บเพียงสถานะ/ค่าที่ได้รับอนุญาต)

## D-05 สิ่งที่โค้ชเห็น (ปิดข้อขัดแย้ง 10-L-11 vs W-39)
โค้ช **เห็นสถานะความพร้อม (พร้อม / จำกัด / ไม่พร้อม) และข้อจำกัดการฝึกเสมอ โดยไม่ต้องขอ consent** (ฐาน: หน้าที่ดูแลความปลอดภัยของผู้เรียน/สัญญา — ระบุฐานใน lawful-basis matrix) ส่วนรายละเอียดการวินิจฉัย/การรักษาต้องได้ consent; KPI "ตอบ wellness flag ใน 48 ชม." เปลี่ยนเป็นเป้าหมายการดูแล ไม่ใช่ตัวชี้วัดความรับผิดรายบุคคล

## D-06 ลดความซับซ้อน (ปิด over-engineering)
ตัดหรือเลื่อนไปสัญญาแยก: periodization model เต็มรูป, ACWR แบบ "injury risk alert" (เหลือเป็นข้อมูลแนวโน้มภาระฝึกเท่านั้น), meal/fuelling log รายมื้อ, vendor-specific wearable adapters (เหลือ CSV/มาตรฐานกลาง), LAB LIMS-lite (เลื่อนจาก R3), hosted-event accreditation, z-score normalisation ข้ามชุดกรรมการ, maturation tracking ทุกคน (เหลือเฉพาะ talent pathway), ClearingRun ข้ามวิทยาเขตแบบอัตโนมัติก่อนมีนโยบาย (R1 ใช้ clearing แบบ "ยืนยันสิทธิ์ได้ที่เดียวทั้ง มกช." ตรวจซ้ำตอนยืนยัน)
นับ component ใหม่ให้ครบ (รวม etcd ของ Patroni, จำนวน PostgreSQL cluster, Valkey Sentinel, FreeRADIUS, waiting-room plugin) และระบุจำนวนจริง

## D-07 Rollout และการปฏิบัติการ
- **Wave 2 แยกเป็น 2a (มิ.ย. 2574) และ 2b (พ.ย. 2574)** โรงเรียนกีฬาที่เหลือแบ่งเป็นสองชุดตามปีการศึกษา (พ.ค. 2574 / พ.ค. 2575 ถ้าจำเป็น — เล่ม 12 เสนอ) ระบุผลต่อ handover เป็นหมายเหตุ
- R3 go-live 1 พ.ย. ต้องไม่อยู่ใน freeze: ปรับ freeze rule หรือเลื่อน R3 เป็นสัปดาห์ที่ 2 ของ พ.ย. พร้อมเหตุผล
- เพิ่ม **helpdesk L1 staffing model** (ประมาณการปริมาณ ticket ต่อช่วงพีค, ผู้รับผิดชอบ LINE OA กลาง, ชั่วโมงบริการ)
- Kubernetes upgrade ≥ 3 ครั้ง/ปี; on-call ขั้นต่ำและผลต่อ MA เป็นหมายเหตุ
- Parallel run: ไม่ write-back เข้าระบบเดิม ใช้ **shadow comparison** (ระบบใหม่เป็นหลัก ระบบเดิม read-only + รายงานเทียบ) เว้นแต่วิทยาเขตมี API

## D-08 ช่องว่างฟังก์ชันที่ต้องเพิ่ม (workflow ใหม่เริ่ม W-148)
ผู้สมัครรอบท้าย (fast-track onboarding + ยกเว้นค่าปรับ + census), ปรับปรุงกฎ clearing ให้เป็นชุดเดียว (เล่ม 02 เป็นเจ้าของ, 06 อ้างอิง), อุทธรณ์ผลคัดเลือกแบบเร่งด่วนที่จบก่อนกำหนดยืนยันสิทธิ์ และห้ามเกินเพดานคุรุสภา, คำนวณสถานภาพ (โปร/พ้นสภาพ) ก่อนเปิดลงทะเบียนภาคถัดไป + สิทธิ์ระหว่างอุทธรณ์, การอนุมัติลาแข่งตามระดับ (ลาแบบยกคณะ: อนุมัติครั้งเดียวที่ระดับคณะ, สอบชดเชยสร้างอัตโนมัติไม่ต้องอนุมัติซ้ำ; เจ้าของ = ATH), การคัดเลือกตัวนักกีฬา/ตัดออกจากทีม (เกณฑ์ประกาศล่วงหน้า, ทบทวน, อุทธรณ์, แผนดูแลนักเรียนที่ต้องออกจากโรงเรียนกีฬา), protocol concussion / heat illness / weight-cutting, safeguarding สำหรับผู้ใหญ่ (โค้ช–นักกีฬา) และอัตราผู้ดูแลในทริปค้างคืนของผู้เยาว์, ฝึกสอนเริ่ม 16 พ.ค. (สถานะ/ประกันก่อนลงทะเบียน), ParaClassification ใน ATH, แผน ข สอบประมวลความรู้ + ภาระอาจารย์ที่ปรึกษา + เปลี่ยนอาจารย์ที่ปรึกษา (GRAD), ผู้ปกครองประเภทปู่ย่าตายาย/ผู้อุปการะ + ช่องทางสมัครแบบมีเจ้าหน้าที่ช่วย, role switcher, หน้า "ลงทะเบียนสำเร็จหรือไม่" หลังสัญญาณหลุด, Thai QR บนเครื่องเดียวกับแอปธนาคาร (บันทึกรูป QR/deeplink), standard exports ต่อบทบาทที่อนุมัติไว้ล่วงหน้า, นโยบายกลุ่ม LINE ส่วนตัวของโค้ช/อาจารย์ + ช่องทีมในระบบ
แยกบทบาท `medical` เป็น `physician`, `nurse`, `physio` (เล่ม 04 + workflows.json)

## D-09 PDPA / กฎหมาย
เพิ่มบุคลากร (2,700 คน + UEBA) ใน lawful-basis matrix; injury routine ใช้ ม.26(5)(ก) [ต้องตรวจสอบถ้อยคำ] ไม่ใช่ vital interest (vital interest เฉพาะเมื่อขอ consent ไม่ได้); ฐานสำหรับข้อมูลสุขภาพ/สมรรถภาพในการคัดเลือก; cross-border register เพิ่ม video call, international card payment, CAPTCHA, breached-password service, Mozilla/Microsoft push, SOC/SIEM ต่างประเทศ (ถ้ามี); การลงนามแบบ batch: ใช้ **ตราประทับอิเล็กทรอนิกส์ของหน่วยงาน (organisational seal)** สำหรับ transcript/ใบรับรองจำนวนมาก และลายมือชื่อบุคคลเฉพาะเอกสารที่กฎหมายกำหนด, เลือก TSA (ETDA e-Timestamping เป็นหลัก) + trust anchor (NRCA) + fallback; RLS: scope ต้องตั้งผ่าน security-definer function ที่ตรวจ JWT/claim ไม่ใช่ `set_config` ตรงจาก app role + เพิ่มใน threat model; analytics: ใช้ physical replica + views แบบ `security_invoker` (เลิก logical replication เข้าตาราง RLS)

## D-10 KPI และผู้บริหาร
สร้าง **KPI dictionary แหล่งเดียวในเล่ม 14** (รหัส `KPI-01..`) นิยามชัด (วันตัดยอด, การนับย้ายวิทยาเขต, clearing) ระบุตาราง fact/entity ที่ใช้คำนวณ (เพิ่ม entity ที่ขาดในเล่ม 08) เล่มอื่นอ้างรหัสเท่านั้น; แก้รหัส K-xx ที่ชนกับเล่ม 03; governance: Design Authority มีอำนาจตามคำสั่งมหาวิทยาลัย + เส้นทาง escalation + กระบวนการยุติข้อพิพาท data ownership + workstream ปรับระเบียบวิทยาเขตให้เป็นมาตรฐาน; ระบุข้อจำกัด KPI ย้อนหลัง (migrate เฉพาะนักศึกษาปัจจุบัน → อัตราคงอยู่/สำเร็จย้อนหลังต้องมีหมายเหตุ หรือ migrate cohort history แบบสรุป)

## D-11 ทะเบียน ID
- A-91..A-102 และ Q-78..Q-89 (จากเล่ม 14/15) ย้ายเข้าทะเบียนเล่ม 01/13 (รายการของเล่ม 15 ติดป้าย "parked — ประมูล")
- ID ใหม่รอบนี้: สมมติฐาน A-103+, คำถาม Q-90+, workflow W-148+, ADR-026+, RK-23+
- 05 ต้องตรงกับ workflows.json (จำนวน, ตาราง, รายละเอียดขั้นตอน) — สร้างใหม่จาก JSON
