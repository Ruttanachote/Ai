# Prompt สำหรับคุยต่อในแชตใหม่ (คัดลอกทั้งหมดด้านล่างไปวาง)

---

## บทบาทและเป้าหมาย
คุณคือ Solution Architect / BA ที่ทำงานต่อจากแชตก่อนหน้า ช่วยฉัน **ออกแบบระบบสารสนเทศระดับ production** ให้ **มหาวิทยาลัยการกีฬาแห่งชาติ (มกช. / TNSU)** โดยฉันอยู่ในบทบาท **บริษัทรับจ้าง/ผู้จะยื่นประมูล** แต่ **ตอนนี้ยังไม่ทำ Proposal / TOR — โฟกัสที่ตัวระบบก่อน** ตอบเป็นภาษาไทย (ศัพท์เทคนิคใช้อังกฤษได้) ข้อเท็จจริงที่ยังไม่ยืนยันให้ติด 🟡 หรือ [ต้องตรวจสอบ] เสมอ ห้ามแต่งข้อมูล

## งานแรกในแชตนี้ (ใช้ computer use)
1. เปิดแอป **Claude Design** บนเครื่องฉัน → โปรเจกต์ **Modernist** (Design System) ลิงก์: https://claude.ai/design/p/3446a6fa-0bc7-4215-b9a0-113a366976fc
2. อ่านและคัดลอกค่าจริงออกมาเป็นข้อความ: `theme.json` / Theme → **Parameters**, Foundations → **Color** (สี role + ramp 100–900), **Typography** (ฟอนต์ ขนาด น้ำหนัก line-height), **Spacing & elevation**, **Layout/grid**, **Icons**, และ Components (Buttons & tags, Cards, Dialog, Forms, Navigation, Table) รวม `:root` ใน `styles.css`
3. สรุปเป็น design tokens (สี/ตัวอักษร/ระยะ/มุม/เส้น/elevation) + กฎการใช้ แล้วปรับให้รองรับภาษาไทย (Archivo ไม่มีตัวไทย → จับคู่ฟอนต์ไทย เช่น IBM Plex Sans Thai; line-height เนื้อความไทย ≥ 1.6)
4. ใช้ tokens นี้ทำ **หน้าจอ R1 ระบบรับสมัคร** (ดูหัวข้อ "R1" ด้านล่าง) บน Design canvas หรือ prototype ที่คลิกได้

สิ่งที่รู้แล้วจากภาพหน้าจอ: Modernist = "Swiss-school modernism: a strict grid, **Archivo** everywhere, **square corners**, **strong rules** and **one red accent** on a **near-white ground**" มีไฟล์ styles.css, readme.md, theme.json, foundations/(type, color, layout, icons, image), components/(buttons, forms, cards, navigation, table, dialog), templates (Deck, Landing)
ค่าที่ใช้ชั่วคราวในแชตเก่า (ต้องแทนด้วยค่าจริง): แดง `#E4321B` (ประมาณจากภาพ), Ink `#111418`, Paper `#F4F4F1`, Surface `#FFFFFF`, Graphite `#5C636E`, Rule `#DCDFE3`, สถานะ สำเร็จ `#1B7F4B` เตือน `#A35A00` ผิดพลาด `#B3261E` ไฮไลต์ `#FFE14D`; กริด 12 คอลัมน์ gutter 24 ขอบ 80 (มือถือ 4 คอลัมน์ ขอบ 16); spacing ทวีคูณ 8; มุม 0; ไม่มีเงา; ปุ่มสูง ≥ 44–48 px

## แหล่งงานทั้งหมด (อ่านได้ถ้าเข้า GitHub ได้)
- Repo: **github.com/Ruttanachote/Ai** branch **`claude/research-skills-tools-qkxgum`** โฟลเดอร์ `tnsu-system/`
  - `README.md` (ดัชนี + เส้นทางอ่าน), `docs/00-blueprint.md` (ข้อตกลงกลาง), `docs/00-fix-decisions-v1.1.md` (การตัดสินใจรอบแก้)
  - `docs/01`…`14` เอกสารออกแบบ v1.1 (เล่ม 15 ประมูล = พักไว้), `docs/data/workflows.json` (162 workflow), `docs/government-relations.md`
  - `docs/r1/` สเปกละเอียด R1 (requirements FR/NFR + เกณฑ์ตรวจรับ, traceability, รายการหน้าจอ S-R1-xx, OpenAPI, data dictionary, test plan) — ถ้ายังไม่มีในbranch แปลว่ายังเขียนไม่เสร็จในแชตเก่า
  - `tools/` สคริปต์สร้าง viewer และเล่ม 05/06 จาก JSON
  - Research notes: `research_notes/ออกแบบระบบการศึกษา TNSU ระดับ production/` (รวม v2/ และ v1-review/)
- หน้า viewer workflow ตามบทบาท: https://claude.ai/artifact/5rVvg7wig2ijZSQtyh6fKJ
- Design canvas R1 (มีแผ่น design system ชั่วคราว): https://claude.ai/artifact/47EVFQHXbCnR6Qrg6KFco6

## ข้อเท็จจริงหลักของ มกช. (จาก research — ส่วนใหญ่มาจาก snippet ค้นหา ต้องยืนยัน)
- ตั้งตาม พ.ร.บ.มหาวิทยาลัยการกีฬาแห่งชาติ พ.ศ. 2562 ยกฐานะจากสถาบันการพลศึกษา สังกัดกระทรวงการท่องเที่ยวและกีฬา (ครม. 14 ก.ค. 2569 เห็นชอบร่างแยก "กระทรวงการกีฬา" — สังกัดต้อง configurable)
- **17 วิทยาเขต** (บริหารค่อนข้างอิสระรายวิทยาเขต: เว็บ รับสมัคร ทะเบียน การเงินของตนเอง) + **โรงเรียนกีฬา 13 แห่ง** (เปิด 11 + ตั้งใหม่ 2; นักเรียนส่วนใหญ่เป็นผู้เยาว์ พักประจำ)
- นักศึกษา ~11,520–12,300 (ออกแบบรองรับ 15,000), นักเรียนโรงเรียนกีฬา ~4,450, บุคลากร ~2,700, ใบสมัคร ~30,000/ปี, บัญชีผู้ปกครอง ~12,500
- งบปี 2569 ~1,853.9 ล้าน, ร่างปี 2570 ลด 7.39%
- **การรับ ป.ตรี ทำรายวิทยาเขต ไม่ได้ใช้ TCAS เป็นหลัก**: โควตา (เรียนดี / นักกีฬา) ~ต.ค.–พ.ย. และประเภททั่วไปหลายรอบ (ถึง 5–6 รอบ) ~ก.พ.–มิ.ย.; ทุกรอบ = ประกาศผู้มีสิทธิ์สอบ → สอบข้อเขียน/สัมภาษณ์/สอบทักษะ → ประกาศผล → รายงานตัว+ชำระเงิน; TCAS เป็น adapter ทางเลือก
- พิธีรับปริญญารวมทุกวิทยาเขตครั้งเดียว ห่างจากจบ ~1 ปี; "พลศึกษาเกมส์" ราว ก.ย. (ชนช่วงสอบภาค 1); วงจร กยศ.; ITA/OIT 2 มี.ค.–30 มิ.ย.; ปีการศึกษาโรงเรียนกีฬา ~16 พ.ค.–31 มี.ค.

## สถาปัตยกรรมและการตัดสินใจหลัก (v1.1)
- **Build** แกน student lifecycle + **Adopt** open source (Keycloak, Moodle, Flowable, Superset, Koha) ใต้ licence allow-list (OSI) + SBOM
- **Modular monolith** Java 21 + Spring Boot 3 + Spring Modulith, transactional outbox + PostgreSQL job queue (Kafka เลื่อน)
- PostgreSQL 16 (Patroni + etcd) + PgBouncer sidecar, **RLS ต่อ OrgUnit/วิทยาเขต** (scope ผ่าน signed token + SECURITY DEFINER), Valkey, OpenBao (HSM auto-unseal ทั้งสองไซต์, Shamir เป็น recovery key), S3-compatible storage, OpenTofu, Argo CD, APISIX, analytics = PG replica + dbt + Superset
- Frontend: React + Next.js **PWA** + **LINE LIFF** ก่อน (LINE Notify เลิกแล้ว → ใช้ LINE OA Messaging API บัญชีกลาง), Flutter เลื่อนไปสัญญาแยก
- Thai PDF engine + PDF/A + PAdES; batch transcript ใช้ e-seal ขององค์กร; TSA = ETDA e-Timestamping + สำรอง; trust anchor NRCA
- ข้อมูลสุขภาพ: `hlt_vault` + `hlt_keys` (กุญแจต่อคน × ประเภทระเบียน, crypto-shredding)
- โค้ชเห็นสถานะ "พร้อม/จำกัด/ไม่พร้อม" เสมอ (ไม่ต้อง consent); รายละเอียดการรักษาต้อง consent; บันทึกบาดเจ็บใช้ PDPA ม.26(5)(ก) [ต้องตรวจสอบ]
- ทะเบียนลงทะเบียนเรียน: synchronous PG transaction หลัง virtual waiting room + idempotency key
- องค์ประกอบระบบ 32 ตัว, ~344 vCPU; SLO 99.9%/เดือน, ช่วงวิกฤตเสนอ 99.94% (รอ Q-90); RPO ≤ 5 นาที, RTO ≤ 4 ชม., ransomware 48–72 ชม.
- AI (early warning/chatbot) เลื่อน; ตัด over-engineering: periodization, ACWR alert, meal log, wearable adapters, LAB (ย้ายสัญญาแยก)

## ตัวเลขชุดเอกสาร v1.1
45 โมดูล (35 core + 10 ขยาย), 212 event, 361 entity, **162 workflow** (W-01..W-163, W-63 ว่าง), 69 บทบาท (แพทย์/พยาบาล/นักกายภาพแยกกัน), สมมติฐาน A-01..A-124, คำถามถึง มกช. Q-01..Q-114, ADR 31, ความเสี่ยง RK 25, KPI-01..47

## แผน release (สมมติสัญญาเริ่ม เม.ย. 2570 = M1; ถ้าเริ่มหลัง ต.ค. 2570 ทุกอย่างเลื่อน 12 เดือน)
- P0 Discovery เม.ย.–มิ.ย. 2570
- **R1 รับสมัคร 1 ก.ย. 2571 (M18)** ทันรอบโควตา ต.ค. 2571 — ADM, IAM+ThaID, ORG+ปฏิทิน, NOTI, ENG, SVC, CASE, PRIV, AUD, FIN (ค่าสมัคร/ยืนยันสิทธิ์), REC (Person+ผู้ปกครอง), CUR (offering+เพดานรับ), DOC (ใบเสร็จ/บัตรผู้สอบ), HLT (คัดกรองก่อนสอบทักษะ), FAC (จองสนามสอบ), ADMIN, RPT/OIT, Helpdesk
- R2 เปิดภาค 1 พ.ค. 2572 (M26) — ทะเบียน/เกรด/การเงิน/กยศ./หอพัก/กิจการ/ATH eligibility+travel/GRD ยื่นจบ
- R3 1 พ.ย. 2572 (M32); Wave 1 1 มิ.ย. 2573; Wave 2a มิ.ย. 2574 / 2b พ.ย. 2574; โรงเรียนกีฬานำร่อง (สุพรรณบุรี) 16 พ.ค. 2573
- Pilot: **วิทยาเขตชลบุรี + มหาสารคาม**
- ต้นทุน (ยังไม่ใช้ประมูล): 5 ปี ~248–403 ล้านบาท (ไม่รวม VAT), ค่าดูแลหลังปี 5 ~21–44 ล้าน/ปี

## R1 ระบบรับสมัคร — สิ่งที่ต้องออกแบบหน้าจอ
ช่องทาง: โควตาเรียนดี, โควตานักกีฬา (ระดับผลงาน, สอบทักษะรายชนิดกีฬา, ทดสอบสมรรถภาพ, ให้คะแนนหลายกรรมการ + moderation, คัดกรองสุขภาพ, ผู้ปกครองยินยอมถ้า < 20 ปี), ประเภททั่วไปรอบ 1..N, โควตาภายในจากโรงเรียนกีฬา (W-144), TCAS adapter (ปิดเป็นค่าเริ่มต้น)
กติกา clearing: ยืนยันสิทธิ์ได้ 1 ที่ต่อคนต่อรอบทั้ง มกช. ตรวจตอนยืนยัน (กฎ C-1..C-15 ในเล่ม 02 §2.8.1)
workflow หลัก: W-69 ตั้งค่า/ประกาศรอบรายวิทยาเขต, W-41 สมัครออนไลน์, W-42 สอบ/สอบทักษะ/สัมภาษณ์, W-76 moderation, W-43 ยืนยันสิทธิ์+ชำระ, W-74 clearing, W-18 อุทธรณ์ผลคัดเลือก (ต้องจบก่อนกำหนดยืนยัน), W-148 ผู้สมัครรอบท้าย fast-track, W-163 ยืนยันก่อนเปิดภาค, W-44 รายงานตัว
หน้าจอหลัก (ดู `docs/r1/r1-screens.md` ถ้ามี): ผู้สมัคร (PWA มือถือ: สมัครสมาชิกด้วย ThaID, เลือกรอบ/วิทยาเขต/สาขา/ชนิดกีฬา, อัปโหลดเอกสาร, ชำระ Thai QR + บันทึก QR, สถานะใบสมัคร, บัตรประจำตัวผู้สอบ, ผลสอบ, ยืนยันสิทธิ์, อุทธรณ์), ผู้ปกครอง (ยืนยันความยินยอม), เจ้าหน้าที่รับสมัคร (ตั้งค่ารอบ 4-eyes, ตรวจเอกสาร, จัดตารางสอบ/สนาม, ประกาศผล), กรรมการสอบทักษะ (แท็บเล็ตออฟไลน์ได้), การเงิน (กระทบยอด), ผู้อนุมัติ, หน้าประกาศสาธารณะ
กฎ UX: mobile-first, ภาษาไทย/อังกฤษ, วันที่ พ.ศ., WCAG 2.1 AA (เป้า 2.2 AA), ปุ่ม ≥ 44 px, หน้า "สมัครสำเร็จหรือไม่" หลังเน็ตหลุด, ไม่ใส่ข้อมูลอ่อนไหวใน LINE/SMS

## ประเด็นที่ยังค้าง / ข้อจำกัด
- ข้อเท็จจริงจำนวนมากยังไม่ยืนยันจากต้นฉบับ (แชตเก่าเข้าเว็บ .go.th/.ac.th ไม่ได้): 🟡 ~841 จุด, [ต้องตรวจสอบ] ~236 จุด
- ไม่มีข้อมูลภายใน มกช. (ระเบียบจริง ค่าเทอม จำนวนรายวิทยาเขต ระบบเดิม) → 124 สมมติฐาน 114 คำถาม
- ยังไม่มีผู้ใช้จริง/นักกฎหมายตรวจ; ตัวเลข capacity ยังไม่ทดสอบโหลด
- ระดับ detailed design ที่ยังต้องทำต่อ: requirement+เกณฑ์ตรวจรับ+traceability (R1 กำลังทำ), mockup, API spec, data dictionary ระดับฟิลด์, แบบฟอร์มราชการ (ปพ./transcript/ใบรับรอง), DMN กฎวิชาการ, BPMN, test case, migration mapping (ต้องได้ข้อมูลระบบเดิม)
- งานประมูล (เล่ม 15) พักไว้: เคยวิเคราะห์ว่าราคาเต็มสูงกว่าตลาดระบบทะเบียนไทยมาก ผู้ตรวจเสนอสัญญาแรกเล็ก "C0 รับสมัคร+ITA" ~25–38 ล้าน — ยังไม่ได้ตัดสินใจ

## ขอให้ทำตามลำดับ
1. ใช้ computer use ดึงค่า Modernist จริง (หัวข้อ "งานแรก") แล้วสรุปเป็น tokens ภาษาไทยได้
2. ทำหน้าจอ R1 ตามรายการด้านบนด้วย Modernist (เริ่มจาก flow ผู้สมัครโควตานักกีฬาบนมือถือ → หน้าเจ้าหน้าที่ → แท็บเล็ตกรรมการ)
3. แจ้งฉันว่าค่าไหนต่างจากค่าชั่วคราวในแชตเก่า เพื่อให้แก้แคนวาสเดิมด้วย
