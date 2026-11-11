# แผนงานพัฒนาและ Go-live One Platform

หน้าแผนพร้อม Gantt: https://claude.ai/artifact/3Vb6Er3VQzpBDDF36JY9GU

สัปดาห์ที่ 1 = จันทร์ 30 พ.ย. 2569 · Sprint ละ 2 สัปดาห์ · ทีม 11 คน (PM, SA, BA, UX/UI 0.5, BE 2, FE 2, Integration M365 1, DevOps 0.5, QA 2)

| Milestone | วันที่ | สัปดาห์ |
|---|---|---|
| Kick-off | 30 พ.ย. 69 | 1 |
| Go-live R1 — ฝ่ายขายและอนุมัติ (SM, หัวหน้ากลุ่ม, ผู้บริหาร) | 19 เม.ย. 70 | 21 |
| Go-live R2 — ส่งมอบ ทีมพัฒนา MA (PMO, PM, Dev, OPN, MA) | 2 ส.ค. 70 | 36 |
| ขยายใช้งาน DB SBU และปิดโครงการ | 24 ก.ย. 70 | 43 |

| Module | สัปดาห์ทำงาน | ช่วง (สัปดาห์) | Man-day | Release |
|---|---|---|---|---|
| F ฐานระบบและสิทธิ์ (Cloud, DB, SSO, RBAC, Audit, แจ้งเตือน, Scheduler) | 3 | 3–6 | 60 | ฐาน |
| M1 ฝ่ายขาย (SM) | 7 | 6–12 | 75 | R1 |
| M2 Cost Sheet ใบเสนอราคา อนุมัติ ลายเซ็น | 7 | 7–13 | 80 | R1 |
| M8 ผู้บริหาร และ OKR Report | 3 | 11–13 | 30 | R1 |
| M3 Close Win และ Handover | 3 | 12–14 | 30 | R2 |
| M4 บริหารโครงการ (PM Workspace) | 8 | 14–22 | 110 | R2 |
| M5 ทีมพัฒนา (Timesheet, OT, ลา, Weekly report) | 6 | 16–22 | 70 | R2 |
| M6 จัดซื้อและการเงิน (OPN) | 3 | 21–23 | 30 | R2 |
| M7 MA และ Service Desk | 6 | 22–27 | 75 | R2 |
| C เชื่อมต่อ M365 และปฏิทินกลาง | 3 | 25–27 | 40 | R2 |
| **รวม** | | 3–27 | **600** | |

| ช่วง | R1 | R2 |
|---|---|---|
| พัฒนา | 8 สัปดาห์ (6–13) | 16 สัปดาห์ (12–27) |
| SIT (Integration, Security ASVS L2, Performance) | 3 (14–16) | 3 (28–30) |
| UAT | 2 (17–18) | 2 (31–32) |
| สำรอง / Regression | — | 1 (33) |
| อบรม ย้ายข้อมูล Cutover | 1 (19) | 2 (34–35) |
| Hypercare | 4 (21–24) | 4 (36–39) |

Critical path: สิทธิ์ Microsoft 365 จาก IT → M2 (Excel Online อ่าน Named range ด้วย token ผู้ใช้) → SIT R1

## แผนใช้ AI ช่วยพัฒนาร่วมกับทีม (ทีมเท่าเดิม 11 คน)

| Milestone | แผนปกติ | ใช้ AI | เร็วขึ้น |
|---|---|---|---|
| Go-live R1 | 19 เม.ย. 70 (สัปดาห์ 21) | 15 มี.ค. 70 (สัปดาห์ 16) | 5 สัปดาห์ |
| Go-live R2 | 2 ส.ค. 70 (สัปดาห์ 36) | 31 พ.ค. 70 (สัปดาห์ 27) | 9 สัปดาห์ |
| ปิดโครงการ | 24 ก.ย. 70 (สัปดาห์ 43) | 16 ก.ค. 70 (สัปดาห์ 33) | 10 สัปดาห์ |
| Man-day งานพัฒนา | 600 | 385 | −36% |

AI ช่วย: เขียน API/Schema และต่อหน้าจอจากต้นแบบ · สร้าง Unit/API/E2E test และ Test data (SIT 3 → 2 สัปดาห์) · Code review รอบแรก · ร่างโค้ด Graph API · คู่มือและสคริปต์ย้ายข้อมูล
คงเดิม: อนุมัติสิทธิ์ Microsoft 365 จาก IT · UAT · อบรม · Hypercare · วันหยุด
เงื่อนไข: AI รุ่นองค์กร ไม่ใส่ข้อมูลลูกค้า/ข้อมูลส่วนบุคคลใน Prompt · คนรีวิวทุก Pull request + CI · วัดผลทุก Sprint ถ้า Sprint ที่ 2 ยังไม่เร็วตามแผน ใช้แผนปกติสำหรับ R2

ไฟล์: `docs/timeline/One_Platform_Timeline.xlsx` (เปรียบเทียบ · Timeline ปกติ · Timeline ใช้ AI · Module · วิธีใช้ AI) · `docs/timeline/One_Platform_Timeline_แผนปกติ.png` · `docs/timeline/One_Platform_Timeline_ใช้AI.png`
