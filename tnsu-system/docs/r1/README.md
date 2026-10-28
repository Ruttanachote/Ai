# R1 "รับสมัคร" — Detailed design (ดัชนี)

> **สถานะ:** v1.0-draft · 28 ต.ค. 2569 · Release R1 go-live **1 ก.ย. 2571 (M18)**; ถ้าเริ่มสัญญาหลัง ต.ค. 2570 ทุก release เลื่อน 12 เดือน (เล่ม 12 §1.3) · ภาษา: ไทย (ศัพท์เทคนิค/โค้ดเป็นภาษาอังกฤษ)
> **ฐานที่ผูกพัน:** [00-blueprint](../00-blueprint.md), [00-fix-decisions-v1.1](../00-fix-decisions-v1.1.md) (โดยเฉพาะ D-03 ขอบเขต R1, D-06 clearing แบบยืนยันได้ที่เดียว, D-08, D-09), เล่ม [01](../01-overview.md)–[14](../14-ux-adoption.md) และ [data/workflows.json](../data/workflows.json)
> **ขอบเขต:** รับสมัคร ป.ตรี ปีการศึกษา 2572 ที่วิทยาเขต pilot **ชลบุรี** และ **มหาสารคาม** (A-85, Q-59): รอบโควตา ต.ค.–พ.ย. 2571, รอบทั่วไป 1..n ก.พ.–มิ.ย. 2572, ยืนยันสิทธิ์ซ้ำ พ.ค. 2572

เอกสารชุดนี้แปลงการออกแบบระดับสถาปัตยกรรม (เล่ม 01–14) ให้เป็น **detailed design ของ R1** ที่ทีมพัฒนา ทีม UX และทีมทดสอบใช้ได้โดยตรง รหัสทุกชนิดในชุดนี้สอดคล้องกัน (FR ↔ หน้าจอ ↔ API ↔ entity ↔ test) และอ้างรหัสของเล่มเจ้าของ (W-xx, A-xx, Q-xx, C-x, L-xx, SoD-xx, KPI-xx, J-xx, I-xx) โดยไม่สร้างความหมายใหม่

## ไฟล์

| ไฟล์ | เนื้อหา | จำนวน |
|---|---|---|
| [r1-requirements.md](r1-requirements.md) | ขอบเขต R1, **FR-R1-001..139** แยก 16 กลุ่มความสามารถ (ข้อความ "ระบบต้อง…", ที่มา, priority, บทบาท, เกณฑ์ยอมรับ Given/When/Then ภาษาไทย), **NFR-R1-001..033** ที่วัดได้, ช่องว่าง G-01..G-13 และข้อเสนอถึงเล่มอื่น | FR 139 (Must 108 / Should 26 / Could 5), NFR 33 |
| [r1-traceability.md](r1-traceability.md) | matrix FR/NFR → โมดูล → workflow → entity → หน้าจอ → API → test → UAT → A/Q และ coverage check (workflow ↔ FR, FR ↔ test, หน้าจอ/API/entity ที่ไม่มี FR) | 32/32 workflow มี FR; 139/139 FR มี test |
| [r1-screens.md](r1-screens.md) | screen inventory **S-R1-01..58** (ผู้สมัคร PWA, ผู้ปกครอง LIFF, กรรมการ tablet offline, พยาบาลหน้าสนาม, back-office, การเงิน, ผู้อนุมัติ, หน้าสาธารณะ, ADMIN) พร้อมวัตถุประสงค์ ทางเข้า ฟิลด์ สถานะ 4 แบบ validation ข้อความไทย FR และ KPI — input ของ UI mockup | 58 หน้าจอ (★ 27) |
| [r1-api.yaml](r1-api.yaml) | OpenAPI **3.1.0** ของ API สาธารณะ/back-office ของ R1: OIDC scopes, mTLS callback ธนาคาร, `Idempotency-Key`, ETag/If-Match, RFC 9457 problem+json, cursor pagination, `x-fr` อ้าง FR | 146 operation / 136 path / 196 schema |
| [r1-data-dictionary.md](r1-data-dictionary.md) | dictionary ระดับฟิลด์: ชนิด, null, ข้อจำกัด, ชั้น PII, retention, โมดูลเจ้าของ, กติกา `org_unit_id`, สถานะในเล่ม 08 | 127 entity (R1 ใหม่ 26) |
| [r1-test-plan.md](r1-test-plan.md) | test case **TC-R1-001..341** (ฟังก์ชัน, กรณีผิดปกติ, peak load, ความปลอดภัยรวม RLS scope, accessibility, PDPA/consent, typography, resilience/DR) และ **UAT-R1-01..18** ที่ชลบุรี/มหาสารคาม พร้อม entry/exit ตาม MS-1 | 341 TC + 18 UAT |

## อ่านจากตรงไหน

- **Product owner / งานรับสมัคร pilot:** r1-requirements §1 (ขอบเขต) → §2 กลุ่ม RND, APP, CLR, APL → r1-test-plan §9 (UAT)
- **UX/UI:** r1-screens §0 (กติกากลาง) → §1 (แผนผัง) → หน้าจอ ★
- **Developer / architect:** r1-api.yaml + r1-data-dictionary → FR ที่อ้างใน `x-fr`
- **QA:** r1-test-plan → r1-traceability §3
- **DPO / ความปลอดภัย:** FR กลุ่ม GRD, MED, NFR-R1-011..023, r1-data-dictionary §0 (PII/retention), r1-test-plan §5–7

## การตัดสินใจออกแบบหลักของ R1 (สรุป)

1. **Clearing แบบ "ยืนยันได้ที่เดียวทั้ง มกช."** (C-3, D-06) บังคับด้วยตารางระดับมหาวิทยาลัย `ConfirmationLock` (unique บน HMAC ของ identifier × cycle × ระดับ) ใน transaction เดียวกับการสละ offer อื่น — ไม่มี `ClearingRun` อัตโนมัติ; เจ้าหน้าที่ต่างวิทยาเขตเห็นเพียง "ยืนยันที่อื่นแล้ว" (C-11); cascade ทุก 5 นาที คืนที่นั่ง ≤ 15 นาที หยุดที่ `cascade_cutoff`, เคารพ `appeal_hold` และ quiet hours (FR-R1-086..098)
2. **อุทธรณ์ผลคัดเลือกแบบเร่งด่วน** ใน CASE พร้อม `appeal_hold` และ hard stop ที่ `AccreditedIntakeCap` (C-15; FR-R1-099..103)
3. **ข้อมูลสุขภาพ/ความพิการอยู่ใน `hlt_vault` เท่านั้น**; ADM เห็นเพียงสถานะ `MedicalClearance(PRE_TEST)` ผ่าน `hlt.MedicalClearanceChanged` และเป็น gate ของการจอง slot/เช็คอิน (FR-R1-064..068)
4. **Dual consent ตาม consent policy (อายุ × กิจกรรม)** ไม่ใช่ dual consent แบบเหมารวม; การคัดเลือกใช้ฐาน PT (L-01) ส่วนข้อมูลสุขภาพในการคัดเลือก (L-36) ใช้ dual consent สำหรับอายุ 10–<20 ปี (FR-R1-107..113)
5. **Judge app offline-first** (IndexedDB เข้ารหัส + PIN, UUIDv7 ฝั่ง client, sync idempotent, conflict queue ไม่ใช้ last-writer-wins, ล็อกคะแนนเมื่อส่ง, moderation ≤ 1 วันทำการ, ล็อก session ด้วย hash, paper fallback 4-eyes) (FR-R1-069..077)
6. **วันประกาศผลเสิร์ฟจาก CDN** (static shard key = HMAC ของเลขผู้สมัคร + วันเกิด) + waiting room; ประกาศได้ภายใน 24 ชม. หลังอนุมัติ (FR-R1-082..083, 130)
7. **R1 ไม่ออกรหัสนักศึกษา** — สร้าง `ReportingHandoff` ให้ REC ใน R2 หรือส่งออกให้ระบบทะเบียนเดิมสำหรับรอบที่รายงานตัวก่อน R2 (FR-R1-114..118, G-03)
8. ใช้ **event ที่มีอยู่แล้วในเล่ม 06 §10.2 เท่านั้น** (ไม่เพิ่ม event ใหม่); entity ใหม่ 26 รายการเสนอเพิ่มในเล่ม 08 (G-13)

## ช่องว่างที่ต้องตัดสินก่อน MS-1a (31 มี.ค. 2571)

| G | เรื่อง | อ้าง |
|---|---|---|
| G-01 | เจ้าของ accommodation ใน R1 (AFF อยู่ R2) | Q-18, Q-45 |
| G-02 | คืนค่าสมัครใน R1 โดยไม่มี payout I-17 | Q-35 |
| G-03 | การออกรหัส/รายงานตัวก่อน R2 go-live | Q-67, 06 §6.1 |
| G-05 | ระดับลายมือชื่อประกาศผลคัดเลือก (S2 ตราหน่วยงาน vs S3 บุคคล) | 10 §7.2 vs 12 §2.1 |
| G-06 | รูปแบบ mask รายชื่อสาธารณะ | Q-69 |
| G-07 | เกณฑ์ WBGT ต้องได้ก่อนรอบทั่วไปฤดูร้อน (ไม่ใช่ "ก่อน R2") | Q-99 |
| G-09 | นโยบายขยาย deadline เมื่อระบบล่ม | Q-12 |

รายการเต็ม (G-01..G-13) และข้อเสนอถึงเล่มอื่นอยู่ใน [r1-requirements §4–5](r1-requirements.md#4-ช่องว่างและประเด็นที่ต้องตัดสิน-g-xx) · จำนวนจุด [ต้องตรวจสอบ] ในชุดนี้ ≈ 150 จุด ทุกจุดอ้าง A-xx/Q-xx หรือเล่มต้นทาง

## การตรวจความถูกต้อง

- `r1-api.yaml` ผ่าน `yaml.safe_load` และ `openapi-spec-validator` (OpenAPI 3.1) — ตรวจซ้ำได้ด้วย:
  `python3 -c "import yaml; from openapi_spec_validator import validate; validate(yaml.safe_load(open('docs/r1/r1-api.yaml')))"`
- ID ในทุกไฟล์มาจากชุดข้อมูลเดียวกัน: เมื่อแก้ FR/หน้าจอ/API/entity/test ให้แก้ r1-traceability และ r1-test-plan ให้ตรงกันในคราวเดียว และคงรหัสเดิม (เพิ่มรหัสใหม่ต่อท้าย ห้ามนำรหัสกลับมาใช้)
