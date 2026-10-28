# TNSU System — เอกสารออกแบบระบบสารสนเทศ มหาวิทยาลัยการกีฬาแห่งชาติ

โฟลเดอร์นี้เก็บเอกสาร **การออกแบบ (design only, ยังไม่มี source code)** ของแพลตฟอร์มบริหารวงจรชีวิตผู้สมัคร นักศึกษา นักกีฬา และนักเรียนโรงเรียนกีฬาของมหาวิทยาลัยการกีฬาแห่งชาติ (มกช./TNSU) ครอบคลุม 17 วิทยาเขตและโรงเรียนกีฬา 13 แห่ง จัดทำเพื่อเตรียมการเสนองาน (pre-bid) โดยไม่มีข้อมูลภายในของ มกช. ข้อเท็จจริงที่ยังไม่ยืนยันจึงเขียนเป็น **สมมติฐาน (A-xx)** หรือ **[ต้องตรวจสอบ]**

**สถานะ:** v1.0-draft (28 ต.ค. 2569) — ต้องยืนยันสมมติฐานใน P0 Discovery ก่อนนำไปทำ TOR หรือข้อเสนอราคา และถ้าใช้ทำ TOR ต้องแปลงเป็น capability spec ที่ไม่ระบุยี่ห้อ

## เริ่มอ่านจากตรงไหน

- **ผู้บริหาร:** [01-overview.md](docs/01-overview.md) หัวข้อ 1 (บทสรุปผู้บริหาร) แล้วต่อด้วย [12-roadmap-cost-risk.md](docs/12-roadmap-cost-risk.md)
- **เจ้าของกระบวนงาน (ทะเบียน การเงิน กิจการนักศึกษา กีฬา):** [02-student-journey.md](docs/02-student-journey.md), [03-academic-calendar.md](docs/03-academic-calendar.md), [05-workflows.md](docs/05-workflows.md) หรือดู [viewer workflow ตามบทบาท](https://claude.ai/artifact/5rVvg7wig2ijZSQtyh6fKJ)
- **ทีม IT / สถาปนิก:** [00-blueprint.md](docs/00-blueprint.md), [06-modules.md](docs/06-modules.md), [07-architecture.md](docs/07-architecture.md), [08-data.md](docs/08-data.md), [11-operations.md](docs/11-operations.md)
- **DPO / ฝ่ายกฎหมาย / พัสดุ:** [10-security-compliance.md](docs/10-security-compliance.md), [09-integrations.md](docs/09-integrations.md), [government-relations.md](docs/government-relations.md)
- **ทีม P0 Discovery:** [13-open-questions.md](docs/13-open-questions.md) คู่กับทะเบียนสมมติฐานใน [01-overview.md](docs/01-overview.md) หัวข้อ 7

## เอกสารชุด v1.0

| ไฟล์ | เนื้อหา |
|---|---|
| [docs/00-blueprint.md](docs/00-blueprint.md) | ข้อตกลงกลางที่ทุกเล่มต้องใช้ตรงกัน: แหล่งข้อมูล, รหัสโมดูล, รหัสบทบาท, workflow ID, แผนเฟส, sizing, การตัดสินใจหลัก |
| [docs/01-overview.md](docs/01-overview.md) | บทสรุปผู้บริหาร, บริบท มกช. (มีแหล่งอ้างอิง), ผู้มีส่วนได้ส่วนเสีย, ขอบเขต/นอกขอบเขต, หลักการออกแบบ, **ทะเบียนสมมติฐาน A-01..A-90** (+ pointer ไป CA-01..CA-15 ของเล่ม 12), สารบัญเอกสารชุด |
| [docs/02-student-journey.md](docs/02-student-journey.md) | เส้นทางนักศึกษาทีละขั้นทุกช่องทาง (โควตา, ทั่วไป, TCAS ถ้าใช้, โรงเรียนกีฬา ม.1/ม.4, บัณฑิตศึกษา, โอนย้าย, ผู้พิการ, ต่างชาติ) จนถึงรับปริญญาและศิษย์เก่า |
| [docs/03-academic-calendar.md](docs/03-academic-calendar.md) | ปฏิทินงานรายเดือนทั้งปี ช่วงพีค งานอัตโนมัติตามกำหนด และ calendar-as-configuration |
| [docs/04-roles-permissions.md](docs/04-roles-permissions.md) | ลำดับชั้นองค์กร, บทบาท, scope, permission matrix (RBAC+ABAC), SoD, การรักษาราชการแทน/การมอบอำนาจลงนาม, admin roles, break-glass |
| [docs/05-workflows.md](docs/05-workflows.md) | ทะเบียน workflow ทั้งหมดพร้อมขั้นตอน SLA โมดูล และผลลัพธ์ |
| [docs/data/workflows.json](docs/data/workflows.json) | ข้อมูล workflow แบบ machine-readable (ตั้งต้นจาก [docs/data/workflows.seed.json](docs/data/workflows.seed.json) 67 รายการ) |
| [docs/06-modules.md](docs/06-modules.md) | Module catalogue: วัตถุประสงค์, ความสามารถ, entities, events, integrations, เฟส, Build/Adopt/Integrate |
| [docs/07-architecture.md](docs/07-architecture.md) | สถาปัตยกรรม C4, Minimum Operable Stack, ADR, licence policy, key management, NFR/SLO/capacity |
| [docs/08-data.md](docs/08-data.md) | Domain model, master data, identifiers, data classification, retention, migration จากระบบเดิมรายวิทยาเขต |
| [docs/09-integrations.md](docs/09-integrations.md) | ระบบภายนอกทุกตัวพร้อมสถานะยืนยัน, integration patterns, ปฏิทินการส่งรายงาน, cross-border data flows |
| [docs/10-security-compliance.md](docs/10-security-compliance.md) | PDPA, พ.ร.บ.ข้อมูลข่าวสารของราชการ 2540, คุ้มครองเด็ก, ไซเบอร์, DGA/ETDA, สารบรรณ/จดหมายเหตุ, threat model, procurement |
| [docs/11-operations.md](docs/11-operations.md) | Environments, deployment, DR/backup/ransomware, testing, release & change freeze, cutover, support L0–L3, handover/exit plan |
| [docs/12-roadmap-cost-risk.md](docs/12-roadmap-cost-risk.md) | แผนตามปฏิทินการศึกษาจริง, pilot coverage, ทีมและ FTE, ต้นทุนพร้อมสูตร, ค่าดูแลหลังปีที่ 5, ความเสี่ยง |
| [docs/13-open-questions.md](docs/13-open-questions.md) | คำถาม 77 ข้อที่ต้องยืนยันกับ มกช. จัดกลุ่ม พร้อมสมมติฐานที่ผูกและผลกระทบถ้าคำตอบต่าง |

## ภาคผนวกและสื่อประกอบ

| รายการ | เนื้อหา |
|---|---|
| [docs/government-relations.md](docs/government-relations.md) | ภาคผนวก: แผนที่ความสัมพันธ์ของ มกช. กับหน่วยงานรัฐและองค์กรภายนอก (~85 หน่วยงาน), ปฏิทินรายงาน, ผลกระทบจากการแยกกระทรวง (v0.1) |
| [Viewer: Workflow ตามบทบาท](https://claude.ai/artifact/5rVvg7wig2ijZSQtyh6fKJ) | หน้าเว็บแบบโต้ตอบสำหรับดู workflow แยกตามบทบาทและช่วงชีวิตนักศึกษา (ไฟล์ต้นฉบับ [docs/workflows-by-role.html](docs/workflows-by-role.html)) |
| [docs/archive/v0.9/](docs/archive/v0.9/) | ร่าง v0.9 (`system-design.md`, `workflows-by-role.md`) เก็บไว้อ้างอิง ห้ามใช้เป็นฉบับปัจจุบัน |

## ข้อมูลวิจัยต้นทาง

บันทึกวิจัยอยู่ที่ [../research_notes/ออกแบบระบบการศึกษา TNSU ระดับ production/](<../research_notes/ออกแบบระบบการศึกษา TNSU ระดับ production/>) ส่วนใหญ่ได้จาก search-engine snippet จึงควรเปิดแหล่งฉบับเต็มก่อนอ้างใน TOR

| กลุ่ม | ไฟล์ |
|---|---|
| Research รอบแรก | `tnsu_profile.md` (องค์กร วิทยาเขต งบประมาณ), `thai_gov_compliance.md` (จัดซื้อ PDPA ไซเบอร์ DGA/ETDA), `external_integrations.md` (TCAS กยศ. อว. ThaID ธนาคาร e-Transcript), `products_architecture.md` (SIS/AMS/สถาปัตยกรรมอ้างอิง), `process_requirements.md` (กฎวิชาการ การเงิน กีฬา QA), `government_relations_notes.md` |
| Review อิสระ 4 ด้านของ v0.9 | `review_functional.md`, `review_architecture.md`, `review_compliance.md`, `review_benchmark.md` |
| Research รอบสอง (v2) | `v2/admissions.md`, `v2/academic_calendar_operations.md`, `v2/student_services.md` |

## ประวัติเวอร์ชัน

| เวอร์ชัน | วันที่ | สาระ |
|---|---|---|
| v0.9 | 28 ต.ค. 2569 | ร่างแรกเป็นเอกสารเดียว (archive) |
| v1.0-draft | 28 ต.ค. 2569 | แยกเป็น 13 เล่มตาม blueprint, ปิดประเด็นจาก review 4 ด้าน, ปรับตาม research v2 (รับสมัครรายวิทยาเขต, ปฏิทินจริง, บริการนักศึกษา), Minimum Operable Stack, แผนส่งมอบผูกปฏิทินการศึกษา |
