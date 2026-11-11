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
