# Stream SalesFlow — วิเคราะห์ระบบบริหารโครงการขาย ส่งมอบ และ MA

เอกสารนี้สรุปการออกแบบระบบจากความต้องการ: ติดตามโครงการซื้อขาย เช่าซื้อ พัฒนาระบบ และ MA
ของแต่ละทีม DT ตั้งแต่โอกาสขายแรกจนถึงการต่อสัญญา MA พร้อมส่วนที่**เสนอเพิ่ม**สำหรับ PM และ MA

---

## 1. ภาพรวมเส้นทางโครงการ (Lifecycle)

```
ช่วงขาย (SM)                          ผลการขาย        หลังขาย (PMO / PM / MA)
Opportunity → Pipeline → Forecast → Rebidding → Close Win → Handover → In Delivery → Warranty → Ended
 10–20%       40–50%      70–80%     70–80%        │                                    │
                                        └→ Close Lose (หัวหน้ากลุ่มเปิดกลับเป็น Pipeline ได้)
                                                   └→ Cancelled (Close Win ถึง In Delivery · หัวหน้ากลุ่มเท่านั้น)
                                                                     Ended + ลูกค้าต่อ → โครงการ Type MA ใหม่ (parentId = โครงการเดิม)
```

### กฎการเปลี่ยนสถานะ (บังคับที่ Server ด้วย ไม่ใช่แค่ซ่อนปุ่ม)

| จาก | ไปได้ | ใครทำได้ | เงื่อนไข |
|---|---|---|---|
| Opportunity | Pipeline, Close Lose | SM เจ้าของ, หัวหน้ากลุ่ม | — |
| Pipeline | Forecast, Rebidding, Close Lose | SM, หัวหน้ากลุ่ม | ไปต่อได้เมื่อใบเสนอราคาได้รับอนุมัติแล้ว |
| Forecast | Rebidding, Close Win, Close Lose | SM, หัวหน้ากลุ่ม | Close Win ต้องมีไฟล์ใน Official PO หรือ Contract |
| Rebidding | Close Win, Close Lose | SM, หัวหน้ากลุ่ม | เหมือนข้างบน |
| Close Lose | Pipeline | หัวหน้ากลุ่ม / ผู้บริหาร | ต้องใส่เหตุผล |
| Close Win | Handover, Cancelled | PMO (Handover), หัวหน้ากลุ่ม (Cancelled) | Cancelled ต้องใส่เหตุผล |
| Handover | In Delivery, Cancelled | PM / PMO, หัวหน้ากลุ่ม | Checklist ครบ และมี PM |
| In Delivery | Warranty, Cancelled | PM, หัวหน้ากลุ่ม | มีใบตรวจรับ (Document Inspection) |
| Warranty | Ended | MA, หัวหน้ากลุ่ม | ถึงวันหมดประกัน |

โค้ดอ้างอิง: `src/data/model.ts` → `allowedMoves()`

---

## 2. Module แยกตามตำแหน่ง

| Module | SM | หัวหน้ากลุ่ม | ผู้บริหาร | PMO | PM | MA | Admin |
|---|---|---|---|---|---|---|---|
| ภาพรวมยอดขาย | ของตัวเอง | ทีม | ทุกทีม | | | | ✓ |
| Pipeline board | ของตัวเอง | ✓ | ✓ | | | | ✓ |
| ทะเบียนโครงการ | ของตัวเอง | ✓ | ✓ | ✓ | ที่ตัวเองเป็น PM | ระยะประกัน | ✓ |
| ลงทะเบียนโครงการ | ✓ | ✓ | | | | | ✓ |
| รออนุมัติราคา | | ✓ | ✓ | | | | ✓ |
| Portfolio โครงการ | | ✓ | ✓ | ✓ | ของตัวเอง | | ✓ |
| Workload ทีม | | ✓ | | ✓ | ✓ | | ✓ |
| ประกันและ MA | ของตัวเอง | ✓ | ✓ | ✓ | | ✓ | ✓ |
| สิทธิ์และการตั้งค่า | | | | | | | ✓ |

- บทบาทมาจาก **App Roles ใน Microsoft Entra ID** (claim `roles` ใน token) — ผู้ใช้เลือกเองไม่ได้
- คนหนึ่งมีได้หลายบทบาท (เช่น หัวหน้ากลุ่มที่เป็น SM ด้วย) → UI รวมเมนูของทุกบทบาท
- ข้อมูลกรองตาม **ทีม DT** ด้วย: หัวหน้ากลุ่ม DT4 เห็นเฉพาะ DT4-1, DT4-2

โค้ดอ้างอิง: `src/nav.ts`, `src/router.ts` (route guard)

---

## 3. งานขายและเอกสาร (SM)

### 3.1 ลงทะเบียนโครงการ
กรอกขั้นต่ำแค่ชื่อโครงการ ที่เหลือว่างได้ (แสดงเป็น “รอระบุลูกค้า”) เมื่อบันทึก ระบบจะ:
1. ออกรหัสโครงการ (`OPP-69-xxxx`)
2. สร้างโฟลเดอร์ใน SharePoint ครบชุด (ก่อนขาย / หลังขาย / MA) — โฟลเดอร์ที่ยังไม่ถึงสถานะจะถูกล็อก
3. นับเข้า Pipeline ของ SM และทีม DT

| โฟลเดอร์ | เปิดเมื่อ |
|---|---|
| TOR, Proposal | Opportunity |
| Cost Sheet, Quotation | Pipeline |
| Contract, Official PO | Forecast |
| Handover, Summary Plan Sheet, PR, PO, PA, DO, Document Training/Inspection/Config, PM Report, CM | Close Win |
| Warranty Certificate, SLA Report, หนังสือแจ้งหมดประกัน, MA Quotation, Ticket Log | Warranty |

### 3.2 Cost Sheet + Quotation ในไฟล์เดียว (Excel Online)
- เมื่อเข้า Pipeline ระบบ **คัดลอก Template** (`CostSheet_Quotation_2569.xlsx`) ไปไว้ที่โฟลเดอร์ Cost Sheet ผ่าน Microsoft Graph
- ไฟล์มี 3 แท็บ: **Summary**, **Cost Sheet** (Man-day ทีมพัฒนา, Hardware/Software, เงินกัน OT, ค่าบริการอื่น, Contingency, Warranty), **Quotation**
- ใน Template กำหนด **Named range** เช่น `Total_Revenue`, `Total_COGS`, `GP_Percent`, `OT_Reserve` → ระบบอ่านผ่าน Graph Workbook API หลังบันทึก แล้วแสดงในหน้าโครงการ (ไม่ต้องกรอกซ้ำ)
- SharePoint เก็บ version ของไฟล์อยู่แล้ว ระบบผูก **เลขเวอร์ชันที่ส่งอนุมัติ** (v1, v2, v3) กับ SharePoint version ID ทำให้รู้ว่าผู้บริหารอนุมัติฉบับไหน และล็อกไฟล์ระหว่างรออนุมัติ

### 3.3 ขออนุมัติราคา
1. SM กด “ส่งขออนุมัติ” → ระบบ snapshot ตัวเลข + เวอร์ชันไฟล์
2. ส่งอีเมล **Outlook Actionable Message** ถึงผู้อนุมัติลำดับแรก (กด อนุมัติ / ส่งกลับแก้ไข ได้ในอีเมล หรือในระบบ)
3. ลำดับผู้อนุมัติขึ้นกับ GP และมูลค่า (ตั้งค่าได้ในหน้า Settings) เช่น GP < 25% หรือ > ฿20M ต้องถึง CFO
4. ส่งกลับแก้ไขต้องมีเหตุผล → SM แก้ไฟล์ → ส่งเป็นเวอร์ชันใหม่
5. อนุมัติครบ → Revenue / Cost ในหน้าโครงการอัปเดต และปุ่ม “ส่งใบเสนอราคาให้ Sale” เปิดขึ้น
6. ระบบแปลงแท็บ Quotation เป็น PDF แนบอีเมลถึง Sale (Sale ไม่ต้องใช้ระบบนี้)

---

## 4. Handover และ PM — สิ่งที่เสนอเพิ่ม

| ฟีเจอร์ | ทำไมต้องมี |
|---|---|
| **Handover checklist** (สัญญา, Cost Sheet baseline, TOR, งวดงาน/ค่าปรับ, ผู้ติดต่อลูกค้า, สิ่งที่สัญญาไว้ระหว่างขาย) | กันข้อมูลหายระหว่าง Pre-sale → PM ซึ่งเป็นจุดที่โครงการมักเริ่มผิด |
| **PMO มอบหมาย PM + ทีม DT** โดยดู Workload ก่อน | ไม่ให้เลือกทีมที่งานล้นอยู่แล้ว |
| **Baseline งบประมาณ** จาก Cost Sheet ที่อนุมัติ | เทียบต้นทุนจริง (ชั่วโมง × rate) กับที่ขายไว้ เห็นเมื่อกำไรเริ่มหาย |
| **Timeline / Gantt ตาม Milestone** พร้อมเส้นวันนี้ | เห็นงวดที่ล่าช้าได้ทันที (กรอบแดง) |
| **งวดชำระเงินผูก Milestone** | ส่งงานงวดไหน → แจ้งบัญชีวางบิล ติดตามเงินเข้า |
| **Task board** (ยังไม่เริ่ม / กำลังทำ / รอตรวจ / เสร็จ) + ชั่วโมงแผน vs ใช้จริง | ติดตามว่าแต่ละคนทำตาม Task ไหม Task เลยกำหนดมีแถบแดง |
| **Timesheet รายสัปดาห์** (กรอกชั่วโมงต่อ Task) | แหล่งข้อมูลของ Workload และต้นทุนจริง |
| **Workload heatmap** คน × สัปดาห์ เทียบ 40 ชม. | เห็นคนที่ถูกจองเกินกำลังก่อนถึงสัปดาห์นั้น |
| **Project health** (Schedule / Effort / Payment) แบบ เขียว-เหลือง-แดง | ผู้บริหารดู Portfolio ได้ในหน้าเดียว |
| **Risk & Issue log** พร้อมแผนรับมือและเจ้าของ | แก้ปัญหาเฉพาะหน้าอย่างมีบันทึก |
| **Change request** (Man-day, ค่าใช้จ่ายเพิ่ม, สถานะอนุมัติลูกค้า) | กัน Scope creep และเปิดขายเพิ่มได้ |
| **Meeting minutes / รายงานประจำสัปดาห์** ลงโฟลเดอร์ PM Report | ส่งลูกค้าและผู้บริหารจากที่เดียว |
| **ปิดโครงการ → Lessons learned** | ใช้ปรับ Template Cost Sheet ให้แม่นขึ้น |

---

## 5. Warranty และ MA — สิ่งที่เสนอเพิ่ม

| ฟีเจอร์ | รายละเอียด |
|---|---|
| **Warranty radar** | แบ่งโครงการเป็น ≤30 วัน / 31–90 วัน / >90 วัน ก่อนหมดประกัน |
| **แจ้งเตือนอัตโนมัติหลายจังหวะ** | 90 วัน (ภายใน: สรุปการใช้งาน) · 60 วัน (SM ทำใบเสนอราคา MA) · **30 วัน ส่งหนังสือแจ้งลูกค้า + สอบถามต่อ MA** · 7 วัน (ติดตาม / แจ้งหัวหน้ากลุ่ม) · 0 วัน (Ended) |
| **หนังสือแจ้งหมดประกันจาก Template** | Word template เติมชื่อโครงการ วันที่ ลูกค้า แนบใบเสนอราคา MA ส่งผ่าน Outlook และเก็บในโฟลเดอร์ |
| **Ticket + SLA** | ระดับ P1/P2/P3/CR, นับเวลาที่เหลือตาม SLA ในสัญญา, ช่องทางรับเรื่อง (อีเมล support → สร้าง Ticket อัตโนมัติ) |
| **รายงาน SLA รายไตรมาส** | ใช้ส่งลูกค้าและเป็นหลักฐานตอนเสนอต่อ MA |
| **ต่อ MA = โครงการใหม่ Type MA ใต้โครงการเดิม** | คัดลอกลูกค้า ทีม ผู้ติดต่อ, เริ่มที่ Opportunity, ผ่านขั้นตอนใบเสนอราคา/อนุมัติแบบเดียวกับงานขาย, ยอดนับเข้าเป้าของ SM |
| **Asset / License register** | วันหมดอายุ License, Hardware warranty ของ Vendor — แจ้งเตือนเหมือนประกันโครงการ |
| **ลูกค้าไม่ต่อ** | บันทึกเหตุผล (ราคา, ย้ายผู้ขาย, ระบบเลิกใช้) เพื่อวิเคราะห์ |

---

## 6. การเชื่อมต่อ Microsoft 365 (ปรับปรุงหลังวิเคราะห์เชิงลึก)

| บริการ | ใช้ทำ | วิธีที่ถูกต้อง |
|---|---|---|
| Entra ID | SSO, App Roles | แยก 2 App registration: Web app (delegated + App Roles) และ Worker (certificate, app-only) |
| SharePoint | โฟลเดอร์ต่อโครงการ | `Sites.Selected` จำกัดไซต์ "Stream Projects" · copy เป็น async (202 + poll) · ตรวจไฟล์ถูกแก้ด้วย webhook ที่ drive root + `delta` |
| Excel Online | Cost Sheet + Quotation | **อ่าน Named range ด้วย token ของผู้ใช้ (delegated) ตอนกด Sync/ส่งอนุมัติ** — Workbook API ไม่รองรับ app-only · เก็บ snapshot ตัวเลขลง DB ทุกครั้งที่ส่งอนุมัติ |
| PDF ใบเสนอราคา | ส่ง Sale | **แอปสร้าง PDF เองจาก snapshot ที่อนุมัติ** (`?format=pdf` จำกัด 2 MB และเลือกชีตไม่ได้) |
| Outlook | อีเมลอนุมัติ ส่ง Sale แจ้งลูกค้า | `Mail.Send` จาก `salesflow@` จำกัดด้วย Exchange RBAC for Applications · ช่องทางหลักคือลิงก์เข้าแอป; Actionable Messages (Entra token, `Action.Execute`) เป็นช่องทางเสริมเฟส 2 |
| Teams | นัด Handover แจ้งเตือนทีม | นัดเป็น calendar event `isOnlineMeeting=true` · แจ้งเตือนช่องผ่าน Teams Workflows/bot (Connector ถูกยกเลิกปี 2026 และ `ChannelMessage.Send` app-only ใช้ไม่ได้) |

งาน SLA ต้องรันทุก 1–5 นาที (ไม่ใช่รายชั่วโมง) · ข้อมูล M365 ของไทยอยู่ใน Asia-Pacific geography → บันทึกเป็นการโอนข้อมูลข้ามประเทศตาม PDPA

## 7. โครงสร้างข้อมูลหลัก

```
Project(id, code, name, type[ซื้อขาย|เช่าซื้อ|พัฒนาระบบ|MA], stage, team, customer, endUser,
        budget, revenue, cost, smId, saleName, pmId, parentId, dates…, nextStep)
StageHistory(projectId, from, to, reason, by, at)
DocumentVersion(projectId, folder, spItemId, spVersion, label v1..n)
ApprovalRequest(projectId, version, snapshot{revenue,cost,gp}, status)
ApprovalStep(requestId, order, approverId, status, note, decidedAt)
Milestone(projectId, name, start, end, progress, paymentAmount, invoicedAt, paidAt)
Task(projectId, milestoneId, title, assigneeId, status, due, estHours)
Timesheet(taskId, userId, weekStart, hours)
Risk(projectId, level, description, mitigation, ownerId, status)
ChangeRequest(projectId, title, manDays, cost, status)
Warranty(projectId, start, end, slaPolicy)  ·  Notice(projectId, daysBefore, sentAt, channel)
Ticket(projectId, severity, title, status, openedAt, dueAt, ownerId)
Team(code, name, parentCode, annualTarget)  ·  User(id, entraId, roles[], teamCode)
```

---

## 8. Roadmap ที่แนะนำ

1. **MVP (6–8 สัปดาห์)** — SSO + Role, ทะเบียนโครงการ + สถานะ, โฟลเดอร์ SharePoint, Cost Sheet Template + อ่าน Named range, ขออนุมัติทางอีเมล, Dashboard ยอดขาย
2. **Delivery** — Handover checklist, Milestone/Gantt, Task, Timesheet, Workload
3. **MA** — Warranty radar, แจ้งเตือน 90/60/30/7, หนังสือแจ้งลูกค้า, Ticket/SLA, ต่อ MA
4. **ต่อยอด** — Teams integration, รายงานต้นทุนจริง vs Baseline, Lessons learned, Power BI

---

## 9. สิ่งที่ปรับในต้นแบบรอบวิเคราะห์เชิงลึก

รายงานเต็ม: [`reports/วิเคราะห์ปรับปรุงระบบ SalesFlow.md`](../../reports/)

| ด้าน | สิ่งที่เพิ่ม |
|---|---|
| Pipeline | โอกาสปิดเป็นตัวเลข + Forecast category (Pipeline / Best case / Commit) · เงื่อนไขก่อนออกจากแต่ละสถานะ (บังคับติ๊กครบ) · นับวันในสถานะ + แจ้งดีลค้างนาน |
| Close Lose | บังคับเลือกเหตุผล ผู้ชนะ ราคาที่ชนะ · Dashboard สรุปเหตุผลที่แพ้ |
| อนุมัติราคา | แจ้งเตือนเมื่อไฟล์ถูกแก้หลังอนุมัติ (ระงับส่ง Sale จนอนุมัติใหม่) · SM ดึงคำขอกลับได้ · SLA ต่อขั้นและผู้รับมอบอำนาจแทน |
| ภาครัฐ | แท็บ “ประมูล หลักประกัน ค่าปรับ”: ไทม์ไลน์ e-GP พร้อมนับวันอุทธรณ์ 7 วันทำการ, ทะเบียนหลักประกันซอง/สัญญา 5% พร้อมวันขอคืน, ค่าปรับสะสมเทียบเพดาน 10%, เงินรับสุทธิหัก ณ ที่จ่าย 1% |
| แบ่งยอด | แบ่งยอดขายระหว่างทีม DT เป็น % (รวม 100%) |
| Delivery | สถานะงวดงาน (ส่งมอบ → ตรวจรับ → วางบิล → รับเงิน) |
| Workload | จองเบื้องต้น (Soft) แยกจากจองแน่นอน (Hard) · ความต้องการคนจาก Pipeline ถ่วงน้ำหนัก |
| MA | นาฬิกา SLA แยกตอบรับ/แก้ไข หยุดนับเมื่อรอลูกค้า เตือน 50/75/100% · แจ้งต่อ MA ตามกำหนดแจ้งในสัญญาและรอบงบภาครัฐ (180/120/90/60/30/7 วัน) · คะแนนสุขภาพลูกค้า |

---

## 10. สถานะ P0 (MVP+) — ทำแล้ว

| ID | เรื่อง | ทำที่ไหน | ตรวจด้วย |
|---|---|---|---|
| P0-1 | อ่าน Cost Sheet ด้วย delegated token + fallback ดาวน์โหลดแล้ว parse ไม่เขียนเซลล์ ตรวจชื่อ range และ Template version | `server/src/graph/costsheet.ts`, `xlsx.ts` | test: session แบบ non-persistent, error ระบุชื่อ range, fallback เมื่อ `accessConflict` |
| P0-2 | อนุมัติผูกกับ SharePoint version/eTag, snapshot hash, สำเนา `Submitted/vN`, stale เมื่อไฟล์ถูกแก้, หมดอายุ, ดึงกลับ, ผู้รับมอบอำนาจ, ผู้ส่ง ≠ ผู้อนุมัติ | `server/src/approval/approval.ts`, `CostSheetPanel.vue` | test + หน้าจอ: แก้ไฟล์หลังอนุมัติแล้วปุ่ม “ส่งใบเสนอราคาให้ Sale” หายไป |
| P0-3 | Close Win กรอกมูลค่าสัญญา เทียบกับที่อนุมัติ (±% และ GP ลดได้กี่จุด ตั้งค่าได้) และราคาที่ยื่น e-GP → ขออนุมัติหลังได้งาน | `src/domain/rules.ts` `checkContractValue` | test + dialog Close Win |
| P0-4 | ใบเสนอราคา PDF จาก snapshot (template เดียวกันทั้งเว็บและ server) มีจำนวนเงินตัวอักษรภาษาไทย ไม่มีข้อมูลต้นทุน | `src/domain/quotation.ts`, `server/src/pdf/quotation.ts`, หน้า `/print/quotation/:id` | test สร้าง PDF จริงด้วย Chromium |
| P0-5 | อนุมัติผ่านหน้าในระบบเป็นหลัก อีเมลมีลิงก์เข้าระบบ, นัด Handover เป็น calendar event มีลิงก์ Teams, แจ้งช่องทีมผ่าน Teams Workflows | `server/src/mail/outbox.ts`, `teams/handover.ts`, Settings → ช่องทางแจ้งเตือน | test |
| P0-6 | แยก 2 app registration, `Sites.Selected`, `Mail.Send` จำกัดด้วย Exchange RBAC, outbox, Graph client ที่ retry ตาม `Retry-After` · ส่งคำขอทีละรายการต่อ workbook · ≤4 ต่อ mailbox, ตรวจ token และ App Roles, OBO | `server/src/graph/client.ts`, `auth/auth.ts`, `server/infra/` | test (ลายเซ็น, audience, tenant, หมดอายุ, ไม่มีบทบาท) |
| P0-7 | Probability ตัวเลข, Forecast category ปรับเองต้องมีเหตุผล, ตรวจเงื่อนไขทั้งตอนสร้าง แก้ และย้าย | `validateCreate`, `validateMove` | test: สร้างเป็น Forecast โดยไม่มีใบเสนอราคาที่อนุมัติไม่ได้ |
| P0-8 | Close Lose บังคับเหตุผล (และผู้ชนะเมื่อแพ้คู่แข่ง) · “เปิดโครงการใหม่จากดีลนี้” แทนเปิดกลับ (`reopenedFromId`) | `reopenAsNew`, `winRate` | test: Win rate ย้อนหลังไม่เปลี่ยน |
| P0-9 | ทะเบียนลูกค้า (เลขผู้เสียภาษี, ประเภท, หน่วยงานแม่) + หน้า Account 360 · ฟอร์มลงทะเบียนเลือกลูกค้าจากทะเบียน | `AccountsView`, `AccountDetailView` | หน้าจอ |
| P0-10 | ขั้นตอนประมูล e-GP, ปฏิทินวันทำการไทย (Admin เพิ่มวันหยุดได้), Close Win ดีลรัฐต้องพ้นระยะอุทธรณ์ 7 วันทำการ | `src/domain/calendar.ts`, `closeWinRule` | test |
| P0-11 | เงื่อนไขสัญญา (ฐานค่าปรับ อัตรา ขั้นต่ำ ประกัน SLA หัก ณ ที่จ่าย) + หลักประกันสัญญาเป็นเงื่อนไขของ Handover · หน้าหลักประกันรวมทุกโครงการ | `handoverGate`, `DeliveryPanel`, `GuaranteesView` | test + หน้าจอ |

ข้อที่ยังต้องทำกับ tenant จริง: รันสคริปต์ใน `server/infra`, ทดสอบ webhook กับสิทธิ์ `Sites.Selected`, ต่อฐานข้อมูลจริงแทน in-memory store
สถานะ **Rebidding** ยังคงไว้ตามที่ผู้ใช้กำหนด (รายงานเสนอให้ย้ายไปเป็น `salesMotion='tender'` — ระบบเพิ่ม `salesMotion` แล้วแต่ไม่ได้ลบสถานะ)
