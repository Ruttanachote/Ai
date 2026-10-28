# 00 — Blueprint ของเอกสารชุด v1.0 (ข้อตกลงกลางที่ทุกเล่มต้องใช้ตรงกัน)

> เอกสารนี้เป็น "สัญญา" ระหว่างผู้เขียนแต่ละเล่ม รหัสโมดูล รหัสบทบาท ช่วงเลข workflow ตัวเลข sizing เฟส และการตัดสินใจหลักต้องใช้ตามนี้ทุกเล่ม ถ้าเล่มใดจำเป็นต้องเพิ่ม ให้เพิ่มต่อท้ายตามกติกาในหัวข้อนั้น ห้ามเปลี่ยนความหมายของรหัสที่มีอยู่
> สถานะ: v1.0-draft · 28 ต.ค. 2569 · **v1.1:** ใช้คู่กับ [00-fix-decisions-v1.1.md](00-fix-decisions-v1.1.md) (D-01..D-11 มีผลเหนือกว่าเมื่อขัดกัน); แก้เฉพาะรหัสบทบาท (หัวข้อ 5) และหมายเหตุ SLO (หัวข้อ 8) ในรอบรวมเล่ม · ภาษา: ไทย (ศัพท์เทคนิค ชื่อผลิตภัณฑ์ โค้ด เป็นภาษาอังกฤษ)

## 1. แหล่งข้อมูลที่ต้องใช้

| กลุ่ม | ไฟล์ |
|---|---|
| ฐานเดิม v0.9 (อ่านเพื่อดึงเนื้อหาที่ยังใช้ได้ ห้ามคัดลอกข้อผิดพลาดที่ review ชี้ไว้) | `docs/archive/v0.9/system-design.md`, `docs/archive/v0.9/workflows-by-role.md`, `docs/government-relations.md` |
| Research รอบแรก | `research_notes/ออกแบบระบบการศึกษา TNSU ระดับ production/` → `tnsu_profile.md`, `thai_gov_compliance.md`, `external_integrations.md`, `products_architecture.md`, `process_requirements.md`, `government_relations_notes.md` |
| Review 4 ด้าน (ต้องปิดทุกข้อที่เกี่ยวกับเล่มของตน: แก้ / เลื่อนพร้อมเหตุผล / ปฏิเสธพร้อมเหตุผล) | `.../review_functional.md`, `.../review_architecture.md`, `.../review_compliance.md`, `.../review_benchmark.md` |
| Research รอบสอง (v2) | `.../v2/admissions.md`, `.../v2/academic_calendar_operations.md`, `.../v2/student_services.md` |
| ข้อมูล workflow ตั้งต้น | `docs/data/workflows.seed.json` (67 workflow จากหน้า viewer) |

**กฎความน่าเชื่อถือ:** ข้อเท็จจริงที่ research ติด 🟡 หรือ "ต้องตรวจสอบ" ให้เขียนเป็นสมมติฐาน (อ้าง A-xx) หรือติด **[ต้องตรวจสอบ]** ห้ามเขียนเป็นข้อเท็จจริง ข้อเท็จจริงสำคัญใส่ลิงก์แหล่งที่มา (markdown link) จาก notes

## 2. ข้อเท็จจริงหลักที่เปลี่ยนการออกแบบ (จาก research v2)

1. **การรับนักศึกษา ป.ตรี ของ มกช. ดำเนินการแยกรายวิทยาเขต และไม่ได้ใช้ TCAS เป็นช่องทางหลัก** (พบหลักฐานการร่วม TCAS เพียงหน้าเก่าปี 2566) ช่องทางที่พบ: **ประเภทโควตา** (เรียนดี / นักกีฬา) เปิดราว ต.ค.–พ.ย. และ **ประเภททั่วไป** หลายรอบ (ได้ถึง 5–6 รอบ) ราว ก.พ.–มิ.ย. แต่ละรอบ: ประกาศผู้มีสิทธิ์สอบ → สอบข้อเขียน/สัมภาษณ์/สอบทักษะ → ประกาศผล → รายงานตัวและชำระเงิน ระบบต้องรองรับ **รอบที่แต่ละวิทยาเขตตั้งเอง** + **clearing ภายในข้ามวิทยาเขต** และมี **TCAS adapter เป็นทางเลือก** (A-xx)
2. **พิธีพระราชทานปริญญาบัตรรวมทุกวิทยาเขตครั้งเดียว** (ปีการศึกษา 2567 รับเมื่อ 22 มิ.ย. 2569) ห่างจากการจบประมาณ 1 ปี
3. **แต่ละวิทยาเขตมีงานทะเบียนของตนเอง** ค่าธรรมเนียม ผู้ลงนาม และกำหนดเวลาต่างกัน → ทุกอย่างเป็น configuration ราย OrgUnit
4. **กีฬาพลศึกษาเกมส์ (ภายใน มกช.) ราว ก.ย.** ชนกับช่วงสอบภาค 1 ได้ → ต้องมี blackout ปฏิทินและการยื่นลา/สอบชดเชยแบบยกคณะนักกีฬา
5. **วงจร กยศ.:** Pre-Approve พ.ค.–ก.ค., ยื่นกู้ DSL ก.ค.–ก.ย., ยืนยันภาค 1 ภายใน 31 ต.ค., ภาค 2 ภายใน 28 ก.พ.; ผู้กู้ต่อเนื่องต้องมีจิตอาสา ≥ 36 ชม./ปี
6. **ITA:** OIT เปิด 2 มี.ค.–30 มิ.ย. (แก้ข้อสมมติเดิมที่ว่าเสร็จ เม.ย.)
7. **ปีการศึกษาโรงเรียนกีฬา:** ภาค 1 ประมาณ 16 พ.ค.–30 ก.ย., ภาค 2 ประมาณ 1 พ.ย.–31 มี.ค.
8. **ค่าปรับลงทะเบียนช้ามี 2 แบบ** (รายวัน / เหมาครั้งเดียว), การลาพัก/รักษาสภาพมีค่าธรรมเนียมและคำร้องสมบูรณ์เมื่อชำระแล้ว (payment gate)

## 3. ชุดเอกสารใหม่และผู้รับผิดชอบ

| ไฟล์ | เนื้อหา | ผู้เขียน |
|---|---|---|
| `01-overview.md` | บทสรุปผู้บริหาร, บริบท มกช. (มีแหล่งอ้างอิง), ขอบเขต / นอกขอบเขต, หลักการออกแบบ, **Assumptions register (A-01..)**, สารบัญเอกสารชุด | A |
| `02-student-journey.md` | **เส้นทางนักศึกษาทีละขั้น** ทุกช่องทาง: ผู้สมัครทุกประเภท (โควตาเรียนดี, โควตานักกีฬา, ทั่วไปแต่ละรอบ, TCAS ถ้าใช้, โรงเรียนกีฬา ม.1/ม.4, ป.โท/เอก, โอนย้าย/เทียบโอน, ผู้พิการ, ต่างชาติ) → แรกเข้า → ทุกภาค → ระหว่างเรียน → นักกีฬา → กรณีพิเศษ → จบ → รับปริญญา → ศิษย์เก่า; แต่ละขั้น: ผู้ทำ / สิ่งที่ทำ / ระบบช่วยอะไร / เอกสาร / เวลา / workflow ID / โมดูล | B |
| `03-academic-calendar.md` | ปฏิทินงานรายเดือนทั้งปี (มหาวิทยาลัย, การเงิน/สวัสดิการ, กีฬา, โรงเรียนกีฬา, สถาบัน/รายงาน), ช่วงพีค, งานอัตโนมัติตามกำหนด, **calendar-as-configuration** | B |
| `04-roles-permissions.md` | ลำดับชั้นองค์กร (diagram), รหัสบทบาทตามหัวข้อ 5, ขอบเขต (scope), permission matrix (RBAC+ABAC), SoD, การมอบอำนาจ/รักษาราชการแทน, admin roles, break-glass | C |
| `05-workflows.md` + `data/workflows.json` | ทะเบียน workflow ทั้งหมดพร้อมขั้นตอน (ผู้ทำ/สิ่งที่ทำ), SLA, โมดูล, ผลลัพธ์/event; JSON ใช้ schema เดียวกับ `workflows.seed.json` + ฟิลด์ `module`, `trigger`, `output` | C |
| `06-modules.md` | Module catalogue ตามรหัสในหัวข้อ 4: วัตถุประสงค์, ความสามารถ, entities, events, integrations, เฟส, Build/Adopt/Integrate | D |
| `08-data.md` | Domain model (ER diagram), master data, identifiers, data classification (รวมชั้นความลับราชการ), retention, migration จากระบบเดิมรายวิทยาเขต | D |
| `07-architecture.md` | สถาปัตยกรรม (C4), **Minimum Operable Stack**, ADR ใหม่ทั้งชุด, licence policy, key management, NFR/SLO/capacity ที่คำนวณใหม่ | E |
| `11-operations.md` | Environments (5), deployment, DR/backup/ransomware, testing strategy, release & change-freeze ตามปฏิทินการศึกษา, migration cutover/parallel run/rollback, support L0–L3, handover/source code/exit plan | E |
| `09-integrations.md` | Integration catalogue (ระบบภายนอกทุกตัว, สถานะยืนยัน), patterns, ปฏิทินการส่งรายงาน (ย่อจาก government-relations.md และลิงก์ไป), cross-border data flows | F |
| `10-security-compliance.md` | PDPA (lawful-basis matrix, ROPA, DPIA บังคับ, consent ผู้เยาว์, DSR), พ.ร.บ.ข้อมูลข่าวสารฯ 2540, คุ้มครองเด็ก, พ.ร.บ.ไซเบอร์/NCSA, DGA/ETDA (ระดับ e-signature ต่อประเภทเอกสาร, LTV), งานสารบรรณ/หอจดหมายเหตุ, threat model (STRIDE), procurement (brand-neutral spec, COI, licence) | F |
| `12-roadmap-cost-risk.md` | แผนตามปฏิทินจริง (หัวข้อ 7), pilot coverage, ทีมและ FTE, ต้นทุนที่คำนวณใหม่ (แสดงสูตร), ค่าดูแลหลังปีที่ 5, ความเสี่ยง | G |
| `13-open-questions.md` | คำถามที่ต้องยืนยันกับ มกช. รวบรวมจากทุกเล่ม จัดกลุ่ม พร้อมผลกระทบถ้าคำตอบต่าง | A |
| `README.md` (ระดับ `tnsu-system/`) | ดัชนีเอกสารชุดใหม่ + ลิงก์ viewer + archive | A |

ทุกเล่ม: ขึ้นต้นด้วยหัวเรื่อง, สถานะ, "อ่านคู่กับ" (ลิงก์เล่มที่เกี่ยวข้อง), และปิดท้ายด้วย **"ผลการปิด review"** (ตาราง: ข้อจาก review → การจัดการ) ของประเด็นที่เกี่ยวกับเล่มนั้น Mermaid ต้อง parse ได้ (label ภาษาไทยใส่ใน `["..."]`)

## 4. รหัสโมดูล (ใช้ตามนี้ทุกเล่ม)

| กลุ่ม | รหัส | ชื่อ | หมายเหตุ |
|---|---|---|---|
| Platform | IAM | Identity & Access | Keycloak + ThaID |
| | ORG | Organisation, Campus & **Academic Calendar** | เจ้าของปฏิทินเพียงโมดูลเดียว |
| | NOTI | Notification delivery | ส่งทุกช่องทาง |
| | ENG | News, Announcements, Events & Engagement | เจ้าของประกาศเพียงโมดูลเดียว |
| | SVC | Shared Services: digital ID card, **e-Form/e-Petition catalogue** (form builder + SLA), booking & service queue | |
| | CASE | Case Management: appeals, complaints/whistleblowing, คำขอข้อมูลข่าวสารราชการ, PDPA DSR intake | ประตูเดียว |
| | DOC | Documents: e-Saraban integration, **Thai PDF/report engine**, templates (ปพ., transcript, ใบรับรอง), e-signature & LTV | |
| | PRIV | Privacy & Consent Center | |
| | AUD | Audit | |
| | ANA | Analytics & BI | |
| | RPT | **Regulatory Reporting Hub** (snapshot ณ วันตัดยอด, ITA/OIT, อว., KPI) | |
| | ADMIN | Admin Console / Platform Ops | |
| Academic | ADM | Admissions (รอบรายวิทยาเขต, clearing ภายใน, สอบทักษะหลายกรรมการ, TCAS adapter) | |
| | CUR | Curriculum & Course Catalogue (OBE, CHECO export) | |
| | REG | Course Registration & Timetable | |
| | ATT | Attendance (เวลาเรียน 80%, ลา, ลาแข่ง) | ใหม่ |
| | EXM | Examination management (ตารางสอบ, ห้อง/ที่นั่ง, กรรมการคุมสอบ, ทุจริต, สอบชดเชย) | เจ้าของตารางสอบเพียงโมดูลเดียว |
| | ASM | Assessment & Grading | |
| | REC | Student Records, Academic Standing & **Lifecycle status** (ลาพัก/ลาออก/ย้าย/คืนสภาพ/พ้นสภาพ/เสียชีวิต + cascade) | |
| | GRD | Graduation & Credentials (degree audit/planner, e-Transcript, e-Degree, Open Badges 3.0/CLR) | |
| | GRAD | Graduate school (thesis, กรรมการ, สอบ, plagiarism) | |
| | PRA | Teaching practicum & internship/co-op (สัดส่วน 1:3/1:10, เพดานรับ, คุรุสภา) | |
| | SSC | Sports School academic profile (หลักสูตรขั้นพื้นฐาน, ปพ., boarding) | |
| | LMS | LMS integration (Moodle, LTI 1.3) | |
| Student services | FIN | Finance & Billing (ใบแจ้งหนี้, ผ่อนชำระ, วางบิลผู้ให้ทุน, ยกเลิกใบเสร็จ, counter, write-off, payout + WHT, fund code, ปิดปีงบ) | |
| | SCH | Scholarships & Student Loans (กยศ. DSL) | |
| | HOU | Housing/Dormitory (รวม ตม.30, exeat) | |
| | AFF | Student Affairs (กิจกรรม/activity transcript, ชมรม, วินัย, ให้คำปรึกษา, ผ่อนผันทหาร/รด., **disability services**, student jobs) | เจ้าของชั่วโมงกิจกรรมเพียงโมดูลเดียว |
| | SAFE | Safeguarding & Child Protection | ใหม่ |
| | HLT | Health: clinic, medical alerts, medication log (ผู้เยาว์), insurance + **health vault (ที่เก็บข้อมูลสุขภาพแห่งเดียว)** | |
| | ALU | Alumni & Career | |
| Sports | ATH | Athlete Management (training load, wellness แบบ opt-in/ตามทีม, injury & RTP, nutrition, sports psychology, **eligibility engine**, **team travel & per diem**, talent pathway) | |
| | FAC | Sports facilities booking | |
| | LAB | Sports-science lab management (protocol, booking, calibration) | |
| | REV | Revenue services (คอร์สระยะสั้น, ค่ายกีฬา, อบรม/รับรองโค้ช, ticketing, sponsorship) | เฟสหลัง |
| Extended (สัญญาแยก) | X-HR, X-PAY, X-PLAN, X-PROC, X-RES, X-LIB, X-MEET, X-CMS, X-HELP, X-INTL | HR, payroll IF, แผน/งบ, พัสดุ IF, วิจัย+จริยธรรม, ห้องสมุด Koha, e-Meeting, CMS/ITA web, helpdesk, นักศึกษาต่างชาติ | X-HELP และส่วน ITA ของ X-CMS ต้องพร้อมตั้งแต่ pilot (ดูหัวข้อ 7) |

## 5. รหัสบทบาท (ใช้ตามนี้ทุกเล่ม)

ใช้รหัสจาก `workflows.seed.json` เป็นหลัก: `candidate` (ผู้สมัคร), `student`, `guardian`, `alumni`, `applicant` (บุคคลภายนอก/ประชาชน), `employer`, `lecturer`, `advisor`, `head` (หัวหน้าภาค/ประธานหลักสูตร), `dean`, `campusvp`, `rector`, `council`, `admission`, `registrar`, `proctor`, `finance`, `loan`, `scholar`, `dorm`, `affairs`, `hr`, `planner`, `records`, `pr`, `coach`, `sci`, `sportshead`, `physician`, `nurse`, `physio` (v1.1 แยกจาก `medical` ของ seed ตาม D-08), `safeguard`, `practicum`, `complaint`, `dpo`, `auditor`, `system`
เพิ่มได้ (เล่ม 04 เป็นเจ้าของรายการสุดท้าย): `judge` (กรรมการสอบทักษะ/สัมภาษณ์), `sschool_dir` (ผอ.โรงเรียนกีฬา), `homeroom` (ครูประจำชั้น), `mentor` (ครูพี่เลี้ยง), `supervisor` (อาจารย์นิเทศก์), `gradschool` (บัณฑิตวิทยาลัย/กรรมการวิทยานิพนธ์), `itadmin`, `campus_itadmin`, `security_admin`, `dba_sre`, `helpdesk`, `data_steward` ฯลฯ ถ้าเพิ่มต้องใส่ในเล่ม 04 และใน `data/workflows.json`

## 6. Workflow ID

- W-01..W-68 คงความหมายตาม `workflows.seed.json` (W-63 ว่าง) ปรับขั้นตอนได้ แต่ห้ามเปลี่ยนความหมาย
- workflow ใหม่เริ่มที่ **W-69** ขึ้นไป (เล่ม 05 เป็นเจ้าของ) อย่างน้อยต้องมี: ตั้งค่าและประกาศรอบรับสมัครรายวิทยาเขต, clearing ข้ามวิทยาเขต, ให้คะแนนสอบทักษะหลายกรรมการ + moderation, รับนักเรียนโรงเรียนกีฬา ม.1/ม.4, รับ ป.โท/เอก, โอนย้าย/เทียบโอนจาก ปวส., ผู้สมัครพิการ (accommodation ตอนสอบ), ผู้สมัครต่างชาติ, เสนอ/สอบโครงร่างและสอบป้องกันวิทยานิพนธ์, ส่ง/อนุมัติตารางสอนและเปิดกลุ่มเรียน, ลงทะเบียนล่าช้าพร้อมค่าปรับ, ค่า I ค้าง (ปิด I), ประกันอุบัติเหตุ/เคลม, ยื่นลาแข่งแบบยกคณะ (batch), เดินทางกลับ/ล้างเงินยืม, ปิดปีงบประมาณ, จัดการใบประกาศนียบัตรแทน, ปฏิทินการศึกษา (สร้าง/อนุมัติ/เผยแพร่)
- ทุก workflow ต้องระบุ `module` และ `stage` (รหัส stage ตาม seed: pre, first, term, during, sport, problem, grad, alumni, admin; เพิ่ม `sschool` สำหรับโรงเรียนกีฬา และ `gradstudy` สำหรับบัณฑิตศึกษาได้)

## 7. แผนเฟส (anchor — เล่ม 12 ขยายรายละเอียด ห้ามขัด)

สมมติฐาน: สัญญาเริ่ม **เม.ย. 2570 (M1)**; ปีการศึกษามหาวิทยาลัยเริ่มราว มิ.ย.; โรงเรียนกีฬาเริ่มกลาง พ.ค.; go-live ทำได้เฉพาะรอยต่อภาค

| Release | เวลา | ขอบเขต | ใช้ที่ไหน |
|---|---|---|---|
| P0 Discovery | เม.ย.–มิ.ย. 2570 | ยืนยันสมมติฐาน, data profiling ระบบเดิมทุกวิทยาเขต, เลือก pilot | — |
| R1 "รับสมัคร" | **ก.ย. 2571** (ทันรอบโควตา ต.ค. 2571 ของปีการศึกษา 2572) | IAM, ORG+ปฏิทิน, NOTI, ENG, SVC (บางส่วน), CASE (ร้องเรียน/อุทธรณ์ผลคัดเลือก), ADM, FIN (ค่าสมัคร/ค่ายืนยันสิทธิ์), PRIV, AUD, X-HELP, ITA disclosure (X-CMS ส่วน OIT) | 2 วิทยาเขต pilot รับสมัครบนระบบใหม่; นักศึกษาปัจจุบันยังอยู่ระบบเดิม |
| R2 "เปิดภาค" | **พ.ค. 2572** (ก่อนภาค 1/2572) | แรกเข้า (onboarding), REC, CUR, REG, ATT, EXM, ASM, FIN เต็ม, SCH/กยศ., HOU (+ตม.30), AFF, HLT (พื้นฐาน), ATH core, RPT core, DOC (เอกสารมาตรฐาน), CASE เต็ม, SAFE (โครงสร้าง) | pilot: นักศึกษาใหม่ 2572 + ย้ายนักศึกษาปัจจุบันที่รอยต่อปีการศึกษา พร้อม parallel run 1 ภาค |
| R3 "ครบวงจร pilot" | **พ.ย. 2572** (ภาค 2/2572) | GRD, PRA, GRAD, ALU, FAC, ATH เต็ม (eligibility, travel), LMS | pilot ครบวงจร |
| Wave 1 | มิ.ย. 2573 (ภาค 1/2573) | +5 วิทยาเขต; **โรงเรียนกีฬานำร่อง 1 แห่ง** (SSC+SAFE+HOU เต็ม) เริ่ม พ.ค. 2573 | 7 วิทยาเขต + 1 โรงเรียน |
| Wave 2 | มิ.ย. 2574 | วิทยาเขตที่เหลือ 10 แห่ง + โรงเรียนกีฬาที่เหลือ (พ.ค. 2574) | ทั้งหมด |
| สัญญาแยก | 2574+ | Extended modules (X-*), REV, LAB ขั้นสูง, Flutter app, AI (early warning/chatbot) | — |

## 8. Sizing และเป้าหมาย (ค่าตั้งต้น ปรับได้)

- นักศึกษามหาวิทยาลัย 12,300 (ออกแบบรองรับ 15,000), นักเรียนโรงเรียนกีฬา 4,450, บุคลากร 2,700, ผู้สมัครต่อปี 30,000 ใบสมัคร (สมมติฐาน), ผู้ปกครองผู้เยาว์ ~8,000
- เป้า SLO: ทั้งระบบ **99.9% รายเดือน**; ช่วงวิกฤต (ลงทะเบียน, วันครบกำหนดชำระ, ประกาศผล) เส้นทางลงทะเบียนที่ลด serial dependency แล้ว **99.95%** — *หมายเหตุ v1.1:* เล่ม 07 คำนวณ dependency ต่ออนุกรมครบแล้วได้ ≈ 99.94% จึง**เสนอเป้าภายในช่วงวิกฤต 99.94%** (ADR-027) รอการยอมรับใน **Q-90** (สมมติฐาน A-103); SLA สัญญา 99.9% ไม่เปลี่ยน
- RPO ≤ 5 นาที / RTO ≤ 4 ชม. (ศูนย์ข้อมูลล่ม); กรณีถูกยึดทั้ง platform (ransomware) RTO 48–72 ชม. จาก immutable backup
- ช่วงพีค 4 ช่วง: พ.ค.–มิ.ย., ต.ค.–พ.ย., ก.พ.–มี.ค., มิ.ย. (รับปริญญา/ตัดยอด 10 มิ.ย./ปิด OIT)

## 9. การตัดสินใจหลัก (บันทึกเป็น ADR ในเล่ม 07 และสะท้อนในทุกเล่ม)

1. **Build** แกนวงจรชีวิตนักศึกษา + **Adopt** open source สำหรับงานทั่วไป (Keycloak, Moodle, Flowable engine, Superset, Koha) ภายใต้ **licence allow-list (OSI) + SBOM** ตอนตรวจรับ
2. **Modular monolith** (Java 21 + Spring Boot 3 + Spring Modulith) + **transactional outbox + PostgreSQL-backed event publication/job queue**; **Kafka/Debezium เลื่อน** (เป็นทางเลือกเมื่อโหลดจริงต้องการ)
3. **Minimum Operable Stack** สำหรับทีม IT มกช. 5–10 คน: PostgreSQL 16 (Patroni HA) + PgBouncer (`SET LOCAL` สำหรับ RLS), **Valkey** (แทน Redis), **OpenBao** (แทน Vault) พร้อม **KEK escrow แบบ Shamir + สำรอง offline + ซ้อมกู้รายไตรมาส**, S3-compatible storage ของผู้ให้บริการ cloud หรือ Ceph RGW/SeaweedFS (แทน MinIO), **OpenTofu** (แทน Terraform), Argo CD, APISIX (gateway/WAF), Keycloak, Flowable, analytics = **PostgreSQL replica + dbt + Superset** (ClickHouse/OpenSearch เป็นทางเลือกภายหลัง), observability = OpenTelemetry + Prometheus + Grafana/Loki (AGPL ใช้ภายในโดยไม่แก้ไข ต้องผ่าน legal review), environments **5 ชุด**; เลื่อน service mesh, Argo Rollouts, Unleash, Falco, OpenMetadata
4. **Registration engine** = transaction แบบ synchronous บน PostgreSQL หลัง **virtual waiting room** (token ใน Valkey ที่ gateway); queue เป็น fallback
5. **Multi-campus** = OrgUnit + Row-Level Security; ทุกตารางธุรกรรมมี `org_unit_id`; CDC/replica/BI ต้องบังคับ scope ด้วย (view/role ต่อ OrgUnit, ปิด SQL Lab สำหรับผู้ใช้ทั่วไป)
6. **กฎวิชาการเป็น PolicySet แบบมีเวอร์ชันต่อรุ่น** (DMN) ทั้ง profile มหาวิทยาลัยและโรงเรียนกีฬา
7. **Frontend:** React + Next.js แบบ **PWA** + **LINE LIFF** ก่อน; Flutter เลื่อนไปสัญญาแยก
8. **Thai PDF engine** ที่ทำ text shaping ภาษาไทยถูกต้อง (HarfBuzz-based) + PDF/A + PAdES; ระดับลายมือชื่ออิเล็กทรอนิกส์กำหนดต่อประเภทเอกสาร
9. **ข้อมูลสุขภาพ** = health vault ฐานข้อมูลแยก (ไม่ใช่ cluster แยก) พร้อม per-person key; บันทึกการบาดเจ็บฉุกเฉินใช้ฐาน **ประโยชน์สำคัญต่อชีวิต/หน้าที่ตามกฎหมาย** ไม่รอ consent; consent ใช้สำหรับเปิดเผยต่อโค้ช/ทีม
10. **Cross-border:** ทุกบริการต่างประเทศ (LINE, FCM/APNs, M365/Google, Turnitin, CDN) อยู่ใน **cross-border transfer register** พร้อมฐานกฎหมาย, DPA และการลดข้อมูล (ส่งเฉพาะหัวข้อ + ลิงก์)
11. **Procurement:** เอกสารนี้เป็น design ของผู้เสนองาน ถ้าใช้ทำ TOR ต้องแปลงเป็น **brand-neutral capability spec** และแยกผู้ร่าง TOR (ประเด็น COI)
12. **AI** (early warning, chatbot) เลื่อน; เมื่อทำต้องมี human-in-the-loop และ fairness review (ห้ามใช้วิทยาเขต/ภูมิภาค/สถานะนักกีฬาเป็นตัวทำนายโดยไม่ผ่านการทบทวน)

## 10. สิ่งที่ต้องแก้จาก v0.9 (ทุกเล่มตรวจในส่วนของตน)

- ตัวเลขต้นทุน: คำนวณใหม่จากตาราง FTE และแสดงสูตร (v0.9 รวมผิด)
- break-glass ต้องอนุมัติ 2 คน (ไม่ใช่ 1)
- PostgreSQL community ไม่มี TDE → ใช้ disk/volume encryption + column-level encryption สำหรับข้อมูลอ่อนไหว
- ชื่อ event ต้องตรงกันระหว่างผู้ publish และผู้ subscribe (เล่ม 06 เป็นเจ้าของรายการ event)
- "สคช." → "สำนักงาน ป.ป.ช." (ITA)
- Cloud First: ยังไม่ยืนยันว่าบังคับ มกช. → เป็นสมมติฐาน
- ห้ามมีโมดูลเจ้าของซ้ำ: ปฏิทิน=ORG, ประกาศ=ENG, ตารางสอบ=EXM, ชั่วโมงกิจกรรม=AFF, ข้อมูลสุขภาพ=HLT, ผู้ปกครอง=โมเดลเดียวใน REC/PRIV
- "delegation" แยกคำ: **การรักษาราชการแทน (acting)** กับ **การมอบอำนาจลงนาม (delegated authority)**
