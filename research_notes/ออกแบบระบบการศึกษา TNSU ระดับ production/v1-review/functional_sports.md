# Independent Review v1.0 — Functional / Student-Journey + Sports-Domain Expert

| รายการ | รายละเอียด |
|---|---|
| เอกสารที่ตรวจ | `tnsu-system/docs/` v1.0-draft: อ่านละเอียด 00-blueprint, 02 (หัวข้อ 2–11, 12–14), 03 (ทั้งเล่ม), 05 (กฎร่วม + ทะเบียน + ขั้นตอนของ ~35 workflow สำคัญจาก `data/workflows.json`), 06 (ADM, FIN, SCH, HOU, SAFE, HLT, ATH, FAC, LAB, GRAD, ALU), 04 (role catalogue), 10 (lawful-basis L-05..L-19), 12 (pilot coverage matrix + bridges), 14 (coach view, AM-1..AM-8); skim 01, 07, 08, 13 |
| อ้างอิงเทียบ | review v0.9 `review_functional.md` (G-01..G-28, R-01..R-12, I-01..I-28) |
| มุมมอง | (1) จำลองทั้งปีและทั้งวงจรชีวิตราย persona (2) ผู้เชี่ยวชาญกีฬา: head coach / sports scientist / team physician (3) ตรวจตรรกะการรับเข้า (C-1..C-13, คะแนนสอบทักษะ, อุทธรณ์) และวงรอบภาคเทียบกับปฏิทินเล่ม 03 |
| วันที่ | 28 ต.ค. 2569 · ไม่ได้แก้เอกสารออกแบบ · ข้อกฎหมาย/มาตรฐานที่ผู้ตรวจอ้างจากความรู้เดิมติด [ต้องตรวจสอบ] |

**Severity:** **Critical** = ใช้งานจริงไม่ได้ / เสี่ยงต่อความปลอดภัยผู้เยาว์หรือความรับผิดทางกฎหมายโดยตรง · **High** = งานหลักที่เกิดทุกปีไม่มีที่รองรับหรือมีตรรกะขัดกันจนต้องทำนอกระบบ · **Medium** = exception เป็นครั้งคราว / รองรับบางส่วน · **Low** = ความสะดวก/ความครบถ้วนของเอกสาร

**ภาพรวม:** v1.0 ปิดช่องว่างเชิง "มี/ไม่มี" ของ v0.9 ได้เกือบทั้งหมดจริง (SAFE, CASE, appeals, exit cascade, FIN exceptions, ATT, PRA ratio, sports-school lifecycle, census/RPT, pilot coverage matrix + bridge) ปัญหาที่เหลือเปลี่ยนลักษณะจาก "ขาดโมดูล" เป็น **"กติกาขัดกันเมื่อเวลาจริงมาชนกัน"** (รอบรับเข้าท้าย ๆ vs เปิดภาค, จำแนกสถานภาพหลังลงทะเบียน, อุทธรณ์ vs deadline ยืนยันสิทธิ์) และ **ความสมจริงของ ATH ในมือโค้ช** (ภาระกรอก, การมองเห็นสถานะความพร้อม, ช่องทางสื่อสาร) ซึ่งเป็นตัวตัดสินว่าโค้ชจะใช้หรือไม่

---

## 1. Top-10

| # | ประเด็น | Severity | Gap ID |
|---|---|---|---|
| 1 | **"Late-admit cohort" ไม่มีที่ยืน:** ทั่วไปรอบ 5–6 ประกาศ ≈ 8 มิ.ย. รายงานตัว 9 มิ.ย. แต่ T0 = 7 มิ.ย., due date ≈ 11 มิ.ย., census 10 มิ.ย., J-15 ยกเลิกผู้ไม่ชำระ ≈ 14 มิ.ย., add/drop ปิด 18 มิ.ย. แล้วยังมี reserve cascade 48 ชม. ต่อทอด + no-show grace 7 วัน (C-10) → ผู้ถูกเรียกสำรองเข้าเรียนสัปดาห์ 2–3 โดนค่าปรับลงทะเบียนช้า, ขาดเรียน 6–12% ตั้งแต่วันแรก, พลาด census, ปฐมนิเทศ/PPE/หอ "ก่อนเปิดภาค" เป็นไปไม่ได้ | **High** | F-05, X-05 |
| 2 | **สถานะความพร้อม (availability) ของนักกีฬาอาจถูกซ่อนจากโค้ช:** 10-L-11 ให้แม้แต่ "พร้อม/จำกัด/ไม่พร้อม" ใช้ explicit consent ขณะที่ 06-HLT ส่ง `hlt.AvailabilityChanged` ให้ ATH เป็นค่าเริ่มต้น และ 02-IJ-3/W-39 ให้นักกีฬาเลือก "รายละเอียด หรือ แค่พร้อม/ไม่พร้อม" → ถ้านักกีฬาถอน consent โค้ชไม่รู้ว่าห้ามให้ซ้อม = ความเสี่ยงความปลอดภัย และเป็นเหตุผลอันดับ 1 ที่โค้ชจะไม่ใช้ระบบ | **High** | S-01, X-28 |
| 3 | **Concussion / heat illness / weight-making ไม่มีโปรโตคอล** ทั้งที่ มกช. มีมวยไทย/มวยสากล/ยูโด/เทควันโด รวมผู้เยาว์ และรอบรับเข้าทั่วไป (ก.พ.–มิ.ย.) + การซ้อมอยู่ในฤดูร้อนของไทย: ไม่มี SCAT/Child SCAT baseline, mandatory removal, graded return-to-learn/sport, ไม่มี WBGT/heat policy ใน ADM/ATH/FAC, ไม่มีกติกาชั่งน้ำหนักและห้ามลดน้ำหนักเร่งด่วนก่อนสอบทักษะรุ่นน้ำหนัก | **High** (ผู้เยาว์ใกล้ Critical) | S-02, S-03, F-03 |
| 4 | **ถูกคัดออกจากทีม = ถูกให้ออกจากโรงเรียนกีฬา** (W-92 trigger "นักเรียนถูกคัดออกจากทีม") โดยไม่มีเกณฑ์คัดตัวที่ประกาศ การทบทวน/อุทธรณ์ หรือแผนดูแลการเปลี่ยนผ่าน (welfare transition) ของเด็กอายุ 12–17 ที่อยู่หอประจำ; ในมหาวิทยาลัยก็ไม่มี workflow คัดตัว/ประกาศทีมเลย ทั้งที่ทุนนักกีฬาและ eligibility ผูกกับ squad | **High** | F-06, S-04 |
| 5 | **จำแนกสถานภาพเกิดหลังลงทะเบียนภาคถัดไป** (ลงทะเบียน 18–29 ต.ค., standing 26–29 ต.ค., due ≈ 29 ต.ค.): K-15 แก้เฉพาะ prerequisite แต่ไม่มี re-validation สำหรับ **เพดานหน่วยกิตรอพินิจ** และ **ผู้พ้นสภาพที่ลงทะเบียน/จ่ายเงินแล้ว**; stay-of-effect (W-11/W-17) ไม่ระบุว่าเรียน/สอบ/จ่ายได้หรือไม่ และถ้าแพ้อุทธรณ์กลางภาค ผลการเรียนและเงินคืนเป็นอย่างไร; อุทธรณ์เกรด (W-16) ที่สำเร็จหลัง auto-drop/หลังปิด add-drop ไม่มีทาง re-add | **High** | F-20, F-21, X-19 |
| 6 | **กติกา clearing ขัดกันเอง:** 02-C-3 "confirmed 1 รายการต่อ **cycle** ต่อระดับ" vs 06-ADM "1 ที่ทั่ว มกช. ต่อ **รอบ**/ระดับ"; C-4 option "upgrade" ขัดกับ unique constraint ของ C-3 และ CL-5; C-5 (สละได้ 1 ครั้ง) ไม่นิยามว่าการสละอัตโนมัติ (CL-2) และหมดเวลา (C-8) นับหรือไม่; เวลาคืนที่นั่ง "ทันที" (C-8) vs "ทุกคืน/ภายใน 24 ชม." (W-74) vs "ทุก 5 นาที" (J-04) vs no-show 7 วัน (C-10); และ 06 เพิ่ม `ClearingRun` ข้ามวิทยาเขตแบบ opt-in ที่ไม่มีใน 02 | **High** | X-01..X-04 |
| 7 | **อุทธรณ์ผลคัดเลือกกับ deadline ยืนยันสิทธิ์และเพดานคุรุสภา:** ยื่นได้ ≤ 7 วันทำการหลังประกาศ + SLA 7 วันทำการ แต่ยืนยันสิทธิ์โควตา 7 วัน/รอบท้าย 24 ชม. และ cascade สำรองทำงานทันที → ผู้ชนะอุทธรณ์ต้องได้ "ที่นั่งพิเศษ" (EX-5) ซึ่งชนกับ `AccreditedIntakeCap` ที่เป็น hard stop ของหลักสูตรครู | **High** | X-06 |
| 8 | **ภาระงานโค้ช/อาจารย์ของการลาแข่งไม่ scale:** W-04 ต้องผ่าน coach → advisor → lecturer ทุกวิชา → dean ทุกครั้ง; W-05 ยังให้ lecturer + head อนุมัติสอบชดเชยที่ระบบสร้างจาก W-114 ที่อนุมัติแล้ว (พลศึกษาเกมส์ 3,000–8,000 คน × ~6 วิชา); ผู้เริ่ม/เจ้าของ batch leave ไม่ตรงกัน 4 แบบ (02 BL-1/BL-2, W-114, 14 S-17, 06 vs 05 module) | **High** (adoption) | F-15, X-26, X-30 |
| 9 | **Safeguarding ครอบคลุมเฉพาะผู้เยาว์:** นักศึกษานักกีฬาอายุ 18–25 ที่ถูกโค้ชคุกคาม/ล่วงละเมิด (ปัญหา safe sport ที่พบบ่อยที่สุดในกีฬาไทย) ไปทาง W-19 ร้องเรียนทั่วไป ไม่มี `ContactRestriction` แยกโค้ชออกจาก squad, ไม่มีนโยบายความสัมพันธ์โค้ช–นักกีฬา, ไม่มีสัดส่วน/เพศของผู้ควบคุมในทริปที่มีผู้เยาว์ค้างคืน | **High** | F-26, F-27 |
| 10 | **Pilot ยังมีรอยต่อที่ไม่มีระบบรองรับ:** GRD อยู่ "เดิม" ใน R2 แต่ REC/ASM ย้ายมาใหม่แล้ว → window ขอจบ 7 มิ.ย.–7 ก.ค. 2572 และ pre-audit ของผู้จบภาค 1/2572 ไม่มีระบบใดเห็นข้อมูลปัจจุบัน (GRD ใหม่ live 1 พ.ย.); พลศึกษาเกมส์ ก.ย. 2572 ไม่มี W-30/W-31/W-115 (R3) แต่ต้องใช้เงินยืม/ล้างเงินยืมก่อนปิดปีงบ; PRA ของภาค 1/2572 เริ่ม 16 พ.ค. ก่อนนักศึกษาลงทะเบียน/มีประกันภาค 1 | **Medium–High** | F-10, F-19, F-30 |

---

## 2. ตรวจการปิด review v0.9 (ปิดจริงหรือแค่อ้างว่าปิด)

| v0.9 | สถานะจริงใน v1.0 | สิ่งที่ยังค้าง |
|---|---|---|
| G-01 roadmap/pilot | **ปิดเกือบหมด** — release ผูกปฏิทิน, coverage matrix (12 §3.1), BR-01..BR-08 | GRD "เดิม" ใน R2 ขณะ REC/ASM ใหม่ (F-10); ATH travel/eligibility ไม่ทันพลศึกษาเกมส์ 2572 (F-30); clearing ข้ามวิทยาเขตใช้ได้แค่ 2 วิทยาเขต pilot ถึงรอบ 2574 (BR-01) — ยอมรับได้แต่ต้องบอกผู้บริหารว่าไม่ลด no-show จริงจนถึง Wave 2 |
| G-02 safeguarding | **ปิด** สำหรับผู้เยาว์ (SAFE, W-22/23/93, StaffClearance gate ใน ATH/PRA/ADM) | ผู้ใหญ่ที่เป็นนักกีฬาไม่อยู่ในขอบเขต (F-26); ratio/เพศผู้ควบคุมทริป (F-27); deselection welfare (F-06) |
| G-03 complaint | **ปิด** (CASE, W-19) | — |
| G-04 appeals | **ปิดเชิงโครงสร้าง** (W-16/17/18, R8 stay-of-effect, compensating action ใน W-133) | ปฏิสัมพันธ์กับเวลา: X-06, X-19, F-21 |
| G-05 exit lifecycle | **ปิดเกือบหมด** (W-10/24/26/133, former_student) | ถอนทุกวิชากลางภาคด้วยเหตุป่วย/บาดเจ็บ (medical withdrawal) ไม่มี (F-23); เสียชีวิต/เหตุร้ายแรงของผู้เยาว์ในหอประจำไม่มีโปรโตคอล (F-08) |
| G-06 disability | **ปิดบางส่วน** (W-79, W-33, EM-6) | `ParaClassification` ที่ v0.9 เสนอไม่มีใน ATH (F-11); เวลา W-79 เป็นไปไม่ได้ (X-12) |
| G-07 health safety | **ปิด** (QS-5/QS-8, MedicalClearance, MedicalAlert, MAR, TT-5) | concussion/heat/weight-making เป็นช่องว่างใหม่ (S-02/S-03); PPE ของปี 1 ตามหลัง gate (F-14) |
| G-08 graduate | **ปิดบางส่วน** (GRAD R3 + BR-05) | แผน ข/สอบประมวลความรู้, ภาระอาจารย์ที่ปรึกษา, เปลี่ยนที่ปรึกษา (F-09) |
| G-09 reporting | **ปิด** (RPT, J-29/J-30, W-35/W-136) | late-admit หลุด census 10 มิ.ย. (F-05) |
| G-10 finance | **ปิด** (FIN entities ครบ) | ทางออกเมื่อ `Deferment(LOAN_PENDING)` แต่ กยศ. ไม่อนุมัติ/นักศึกษาไม่ยื่นจริง (F-25) |
| G-11 attendance | **ปิด** (ATT, J-18/19, W-104) | baseline เวลาเรียนของ late-admit (F-05) |
| G-12 คุรุสภา | **ปิด** (AccreditedIntakeCap, RatioRule) | ชนกับ "ที่นั่งพิเศษ" จากอุทธรณ์ (X-06) |
| G-13 sports school | **ปิด** (W-83/86/87/88/92/93/94) | deselection (F-06), critical incident (F-08) |
| G-14 athlete ops | **ปิดเชิงออกแบบ** (W-30/31/114/115, AthleteAward, TueReminder, HostedEvent) | J-36 ตรวจสิทธิ์ก่อนข้อมูลพร้อม (X-20); selection ไม่มี (S-04) |
| G-15 admissions exceptions | **ปิดเชิงฟีเจอร์** | ตรรกะ clearing ขัดกัน (X-01..X-04) |
| G-16..G-28 | **ปิด** (W-106, W-108/131/132, IntegrityCase, W-135, J-47/W-122, W-140/141, W-139, W-129, GuestStay, `pra.EvaluationFinalized`, W-21 requester type, CouncilResolution) | — |
| R-06 health domain เดียว | **ปิดบางส่วน** | `WellnessEntry` อยู่ใน ATH ไม่ใช่ HLT (X-27) |
| R-09 wellness over-scope | **ปิด** (≤ 2,000 คน เฉพาะทีมที่มีผู้ตอบ flag, AM-2) | KPI "flag ตอบใน 48 ชม. ≥ 90%" สร้างความรับผิดให้โค้ช (S-05) |
| I-06..I-11 event/role | **ปิด** — ตรวจด้วยสคริปต์: ทุก event ที่ถูก consume ใน 06 มีผู้ publish | ชื่อ event ใน 02 ยังเป็นแบบเก่า (`admissions.OfferConfirmed`) แต่ระบุว่าให้ 06 เป็นเจ้าของ — ยอมรับได้ |

---

## 3. การจำลองราย persona (สรุป) และ Gap table

### 3.1 สรุปผลการจำลอง (✓ รองรับ · △ บางส่วน/ขัดกัน · ✗ ไม่มี)

| Persona | ผลรวม | จุดที่สะดุด |
|---|---|---|
| ผู้สมัครโควตาเรียนดี | ✓/△ | ยืนยันแล้วไปยืนยัน TCAS ที่อื่น (F-01), นิยาม C-5 |
| ผู้สมัครโควตานักกีฬา | △ | position/รุ่นน้ำหนัก (F-02), ความปลอดภัยวันทดสอบ (F-03), สมาคมตรวจช้า (F-04), อุทธรณ์ vs deadline (X-06) |
| ผู้สมัครทั่วไปรอบท้าย | ✗ ในทางปฏิบัติ | late-admit cohort (F-05) |
| ผู้สมัคร TCAS (ถ้าเปิด) | ✓ | — |
| นักเรียนโรงเรียนกีฬา + ผู้ปกครอง | ✓/△ | deselection (F-06), เด็ก 11–12 ปีกับชุดทดสอบผู้ใหญ่ (F-07), เหตุร้ายแรง/เด็กหาย (F-08) |
| บัณฑิตศึกษา | △ | F-09, F-10 |
| ผู้พิการ / para-athlete | △ | F-11, X-12 |
| ต่างชาติ | △ | F-13 |
| ปี 1 | △ | F-14, late-admit |
| นักกีฬาทีมชาติ | △ | F-15, F-16, F-17 |
| นักศึกษาฝึกสอน พลศึกษา | △ | F-19 |
| นักศึกษามีปัญหา (รอพินิจ/ลาพัก/คืนสภาพ/เสียชีวิต) | △ | F-20..F-23 |
| อาจารย์ / ที่ปรึกษา | △ | F-15, F-24 |
| หัวหน้าภาค / คณบดี / รองฯ วิทยาเขต / อธิการบดี | ✓ | ปริมาณอนุมัติ (F-15) |
| นายทะเบียน | ✓/△ | F-10, F-20 |
| การเงิน / กยศ. | ✓/△ | F-25, F-30 |
| หอพัก | ✓ | F-08 |
| โค้ช / นักวิทย์ / แพทย์-นักกายภาพ | △ | หัวข้อ 4 (S-01..S-12) |
| Safeguarding lead | ✓/△ | F-06, F-26, F-27 |
| ศิษย์เก่า / นายจ้าง / admin / auditor / DPO | ✓ | F-28, F-29 (Low) |

### 3.2 Gap table

| ID | Persona | Gap | Sev | Proposed fix (เล่ม/หัวข้อ + ข้อความ/workflow ที่ควรเปลี่ยน) |
|---|---|---|---|---|
| F-01 | ผู้สมัครทุกช่องทาง | มกช. ไม่อยู่ใน TCAS (ค่าเริ่มต้น A-50) → ผู้ยืนยันสิทธิ์โควตา ม.ค. ยังยืนยัน TCAS รอบ 1–4 ที่อื่นได้ (มี.ค.–มิ.ย.) โดย มกช. ไม่มีทางรู้; C-12 ใช้ได้เฉพาะเมื่อเปิด adapter | High | 02 §2.8.1 เพิ่ม **C-14 "Pre-term reconfirmation"**: ผู้ยืนยันก่อน 1 พ.ค. ต้องกดยืนยันซ้ำในช่วง [config] ก่อนรายงานตัว ไม่ยืนยัน = สละสิทธิ์ ที่นั่งเข้า cascade; 03 §4 เพิ่ม job J-48 (trigger `ADM_RECONFIRM_WINDOW`); 06 ADM เพิ่มสถานะ `reconfirmed`; dashboard CL-8 แสดง "ความเสี่ยงหลุด TCAS" |
| F-02 | ผู้สมัครโควตานักกีฬา | seat bucket = ชนิดกีฬา × เพศ เท่านั้น; ทีมต้องการตำแหน่ง (GK, setter, libero) และกีฬาต่อสู้รับตามรุ่นน้ำหนัก → การจัดอันดับด้วย composite score เดียวทำให้โค้ช override บ่อยและเกิด W-18 | High | 02 §2.1 ตาราง Seat Bucket เพิ่มมิติ `position_group` / `weight_class` (optional) และ "ความต้องการตามตำแหน่ง" ต้องประกาศใน W-69; 06 ADM `SeatQuota` เพิ่ม sub-bucket; QS-12 จัดอันดับภายใน sub-bucket ก่อน แล้ว spill-over ตามกติกาที่ประกาศ |
| F-03 | ผู้สมัครกีฬาต่อสู้ / ทุกคนที่ทดสอบร่างกาย | ไม่มี heat policy, ไม่มีกติกาชั่งน้ำหนัก, QS-5 ใช้ PAR-Q+ (แบบผู้ใหญ่) กับเด็ก ม.1 | High | 02 §2.5.1 เพิ่ม QS-8a: วัด WBGT ต่อชั่วโมงที่สนาม ระงับ/ปรับสถานีตามเกณฑ์ [ต้องตรวจสอบเกณฑ์ที่ใช้]; ชั่งน้ำหนักวันทดสอบ (ไม่ใช่วันก่อน) + ตรวจภาวะขาดน้ำ ห้ามเปลี่ยนรุ่นหลังสมัคร; QS-5 แยกแบบคัดกรองผู้ใหญ่/เด็ก (เด็กให้แพทย์รับรอง); 03 §6.6 blackout ประเภท `heat` (soft) |
| F-04 | ผู้สมัครโควตานักกีฬา, `admission` | `VerificationTask` กับสมาคม/กกท. ไม่มี SLA ของบุคคลภายนอก; W-71 ใส่ "สมาคมกีฬา" เป็นผู้ทำขั้นตอนแต่ไม่มี role/ExternalPerson | Medium | 05 W-71: เปลี่ยนขั้น "สมาคมกีฬา" เป็น `admission` ส่งหนังสือ/portal-assist และเพิ่มสถานะ `provisionally_eligible` (สอบได้ก่อน ผลประกาศได้เมื่อ verify ครบ หรือ ภายใน deadline มิฉะนั้นตัดสิทธิ์); ใช้ competition master + ผลที่ verified แล้วจาก ATH (W-144) เป็นหลักฐานชั้นหนึ่ง |
| F-05 | ผู้สมัครรอบท้าย / ปี 1 / ทะเบียน / การเงิน | late-admit cohort (ดู Top-1) | High | 02 §2.6 เพิ่มหัวข้อ "Late-admit cohort": (ก) `cascade_cutoff` = T0 + 5 วันทำการ (หลังจากนั้นไม่เรียกสำรอง ยกไปปีหน้า); (ข) ยกเว้น `FinePolicy` สำหรับผู้ matriculate หลัง T0 อัตโนมัติ; (ค) ATT นับฐานเวลาเรียนจาก `matriculated_at`; (ง) J-15 exclusion "matriculated ≥ T0 − 7"; (จ) checklist OB/HB/DM/OR เปลี่ยน "ก่อนเปิดภาค" เป็น "ภายใน 14 วันหลังรายงานตัว"; (ฉ) census: บันทึกในรายงานว่าใครเข้าหลัง 10 มิ.ย.; 03 linter เพิ่ม L-13 `ADM_ROUND.confirm_end ≤ TERM.T0 + cutoff` (error) |
| F-06 | นักเรียนโรงเรียนกีฬา + ผู้ปกครอง, `safeguard` | การคัดออกจากทีมนำไปสู่การย้ายออก (W-92) โดยไม่มีเกณฑ์/ทบทวน/แผนดูแล | High | 05 เพิ่ม **W-148 "ทบทวนสถานะนักกีฬาในโรงเรียนกีฬา (retention review)"**: coach เสนอพร้อมหลักฐานตามเกณฑ์ที่ประกาศต้นปี → sci + homeroom + `safeguard` ให้ความเห็น (สวัสดิภาพ การเรียน) → คณะกรรมการ → ผู้ปกครองรับทราบ + **อุทธรณ์ (CASE)** → แผนเปลี่ยนผ่าน (เปลี่ยนชนิดกีฬา/อยู่ต่อแบบนักเรียนทั่วไปถ้านโยบายมี/ย้ายพร้อมประสานโรงเรียนปลายทาง) ≥ 1 ภาค; W-92 ลบ "ถูกคัดออกจากทีม" ออกจาก trigger ตรง ให้เรียกได้หลัง W-148 ถึงที่สุดเท่านั้น; ห้ามใช้ข้อมูล HLT/จิตวิทยาเป็นเหตุผล (14 AM-6) |
| F-07 | ผู้สมัคร ม.1 | ชุดทดสอบและคะแนนไม่คำนึงถึง maturation/relative-age effect (เด็กเกิดต้นปีได้เปรียบ) | Medium | 02 §2.5.4 เพิ่ม option "age-/maturation-adjusted norms" ต่อเดือนเกิด (ประกาศล่วงหน้า), รายงาน ANA กระจายเดือนเกิดของผู้ผ่านต่อรอบ; ATH `MaturationMeasure` ใช้เพื่อพัฒนา ไม่ใช่ตัดสิทธิ์ |
| F-08 | นักเรียนหอประจำ, ครูหอ, `sschool_dir` | ไม่มีโปรโตคอล critical incident ในหอประจำ: เด็กหาย/หนีออกจากหอ (นอกเหนือ overdue 15 นาที), บาดเจ็บสาหัส, เสียชีวิต (W-26 เป็นของ REC มหาวิทยาลัย) | High | 05 เพิ่ม **W-149 "Critical incident ผู้เยาว์ (หาย/บาดเจ็บสาหัส/เสียชีวิต)"**: dorm → `sschool_dir` + `safeguard` ภายใน 30 นาที → ผู้ปกครอง → ตำรวจ (เด็กหาย ≥ N ชม. [config]) → รายงานต้นสังกัด → serious-case review หลังเหตุ; HOU/SSC consume; ENG ล็อกการสื่อสารสาธารณะ; ใช้ W-133 แบบ compassionate สำหรับ SSC |
| F-09 | นักศึกษา ป.โท/เอก, `gradschool` | ไม่มีแผน ข (สอบประมวลความรู้/IS), เพดานจำนวนนักศึกษาต่ออาจารย์ที่ปรึกษา [ต้องตรวจสอบเกณฑ์มาตรฐานหลักสูตร], การเปลี่ยนอาจารย์ที่ปรึกษา/หัวข้อ | Medium | 06 GRAD เพิ่ม `ComprehensiveExam`, `AdvisorLoadRule` (DMN ตรวจตอน W-95), `AdvisorChangeRequest`; 05 เพิ่ม W-150 "เปลี่ยนอาจารย์ที่ปรึกษา/หัวข้อ" และขยาย W-145 ให้ครอบคลุมสอบประมวลความรู้ |
| F-10 | นักศึกษาปีสุดท้าย pilot, `registrar` | 12 §3.1: GRD "เดิม" ใน R2 แต่ REC/ASM ใหม่ → window ขอจบ 7 มิ.ย.–7 ก.ค. 2572 + pre-audit ไม่มีข้อมูลปัจจุบันในระบบเดิม | Medium–High | 12 §3.1 แถว GRD (R2): "ใหม่บางส่วน: รับคำร้องขอจบ (W-06 ขั้น 1–3) + holistic pre-audit แบบรายงาน; อนุมัติจบบน GRD ตั้งแต่ R3" หรือเพิ่ม BR-09 ส่ง REC/ASM → GRD เดิมรายคืน |
| F-11 | นักกีฬาพาราฯ | `ParaClassification` (class, สถานะ confirmed/review, วันทบทวน) ไม่มีใน ATH แม้ v0.9 G-06 เสนอ; eligibility กีฬาคนพิการแห่งชาติขึ้นกับ class | Medium | 06 §8.1 Entities เพิ่ม `ParaClassification`; W-30 DMN อ่าน class; หลักฐานการแพทย์อยู่ HLT, ATH เก็บเฉพาะ class + วันหมดอายุ |
| F-12 | ผู้สมัครพิการ | ดู X-12 | Medium | 02 DA-2 เปลี่ยนเป็น "≥ 10 วันทำการก่อนวันสอบ" หรือ W-79 ลด SLA อนุมัติเป็น 3 วันทำการ + อนุญาต provisional accommodation วันสอบ |
| F-13 | นักศึกษาต่างชาติ / นักกีฬาต่างชาติผู้เยาว์ | ผู้เยาว์ต่างชาติในโรงเรียนกีฬาต้องมีผู้ปกครองที่อยู่ในประเทศ (local guardian) และต่อวีซ่า; X-INTL เลื่อนไป 2574+ | Low–Medium | 06 REC `GuardianRelation.type` เพิ่ม `LOCAL_GUARDIAN` (มีอำนาจ exeat/รักษาพยาบาลตามที่ผู้ปกครองตามกฎหมายมอบ); FA-9 ใช้กับ SSC ด้วย |
| F-14 | ปี 1 ที่เป็นนักกีฬา / วิชาปฏิบัติ | W-130 gate "ก่อนลงทะเบียนวิชาปฏิบัติ" แต่ PPE ของปี 1 ทำ "สัปดาห์แรก" (HB-2) หลังลงทะเบียน; ทีมเริ่มซ้อม มิ.ย. ก่อน PPE | Medium | 02 HB-2: ใช้ `MedicalClearance(PRE_TEST)` จากวันสอบคัดเลือกเป็น provisional clearance (อายุ ≤ 6 เดือน [config]) จนกว่า PPE เสร็จ ≤ สัปดาห์ 3; ผู้ไม่มี PRE_TEST (รอบที่ไม่ทดสอบร่างกาย) → gate แบบ soft + แบบคัดกรองตนเองก่อนวิชาปฏิบัติ |
| F-15 | นักกีฬา, อาจารย์, คณบดี | ภาระอนุมัติลาแข่ง/สอบชดเชยไม่ scale (Top-8) | High | 05 W-04: competition ใน master ระดับ ≥ ชาติ + roster ที่ `sportshead` รับรอง → **อนุมัติอัตโนมัติ** (dean รับทราบแบบ digest), lecturer เพียง "รับทราบ" + เลือกจาก `MakeupPolicy` ประจำวิชา (ตั้งครั้งเดียวต่อภาคใน มคอ.3) ไม่ต้องเขียนงานชดเชยรายคน; W-05: makeup ที่มาจาก W-04/W-114 ข้าม lecturer/head ไป `registrar` จัดรอบโดยตรง |
| F-16 | นักกีฬาทีมชาติ | สอบนอกสถานที่/ต่างประเทศ (NT-4) "ถ้านโยบายอนุญาต" ไม่มีกติกา time zone, ผู้คุมภายนอก, ความปลอดภัยข้อสอบ | Low | 06 EXM เพิ่ม `RemoteExamArrangement(proctor_external_person, tz, window)`; Q ใน 13 |
| F-17 | นักกีฬา (รวมผู้เยาว์) | ไม่มีกรณี DCAT มาตรวจสารต้องห้ามที่วิทยาเขต: ผู้เยาว์ต้องมีผู้แทน (representative) [ต้องตรวจสอบ ISTI], การขาดเรียน/สอบเพราะ doping control | Low | 06 ATH เพิ่ม `DopingControlNotice` (reference เท่านั้น) → ATT excused อัตโนมัติ; SSC แจ้งผู้ปกครอง/ครูผู้แทน |
| F-18 | นักกีฬา | เงินรางวัลจากภายนอก (กกท./จังหวัด/สมาคม) ไม่ผ่าน มกช. แต่ทุนภายในมีเงื่อนไขห้ามรับซ้ำ/ต้องแจ้ง | Low | SCH `AwardCondition` เพิ่มชนิด "ต้องแจ้งรายได้รางวัลภายนอก" (self-declare) |
| F-19 | นักศึกษาฝึกสอน (PE) | ฝึกตามปฏิทินโรงเรียนเริ่ม 16 พ.ค. แต่ลงทะเบียน/ชำระ/ประกันกลุ่ม (W-107 "ก่อนเปิดภาค" มหาวิทยาลัย 7 มิ.ย.) → ช่องว่างความคุ้มครอง 3 สัปดาห์; StaffClearance ต้องเสร็จก่อน 16 พ.ค. | Medium | 02 PR-4: ลงทะเบียนวิชาฝึกสอนแบบ early registration ใน window แยก (`PRACTICUM_REGISTRATION` ≤ 10 พ.ค.); W-107 roster ประกันวิชาฝึกสอนตั้งต้น = วันเริ่ม `PRACTICUM_PERIOD`; 03 linter L-10 เพิ่มตรวจ StaffClearance valid ณ วันเริ่ม |
| F-20 | ผู้รอพินิจ / ผู้พ้นสภาพ / ทะเบียน | ไม่มี re-validation หลัง standing (Top-5) | High | 03 K-15 ขยาย: J-25 trigger "post-standing re-validation" → (ก) รอพินิจเกินเพดาน → ระงับรายวิชาส่วนเกินให้นักศึกษาเลือกถอนใน 5 วัน; (ข) ผู้มีคำสั่งพ้นสภาพที่ลงทะเบียนแล้ว → สถานะ `ENROLLED_PENDING_APPEAL`; 03 linter L-4 ยกจาก warning เป็น error สำหรับภาค 1→2 |
| F-21 | ผู้อุทธรณ์คำสั่งพ้นสภาพ | stay-of-effect ไม่ระบุสิทธิ์เรียน/สอบ/ชำระ และผลถ้าแพ้ | High | 05 R8/W-17 เพิ่มข้อความ: "ระหว่างอุทธรณ์ เรียนและสอบได้; ค่าธรรมเนียมเรียกเก็บตามปกติ; ถ้ายืนคำสั่ง: ผลการเรียนภาคนั้นถูกบันทึกเป็น W (ไม่นับ) และคืนค่าธรรมเนียมตาม `RefundRule.APPEAL_DISMISSED` [ต้องตรวจสอบข้อบังคับ]; ถ้าชนะ: คงผลการเรียน"; W-16 เพิ่มขั้น "re-add รายวิชาที่ถูก auto-drop โดย registrar override (นอก add/drop)" |
| F-22 | ครอบครัว, ทีม, โค้ช | นักกีฬาเสียชีวิต/บาดเจ็บสาหัสระหว่างกิจกรรมของมหาวิทยาลัย: ไม่มี serious-incident review (สนาม อุปกรณ์ การกำกับของโค้ช), การดูแลเพื่อนร่วมทีม | Medium | 05 W-26 เพิ่มขั้น `sportshead`/`campusvp` เปิด "serious incident review" (CASE) เมื่อเหตุเกิดในกิจกรรมของมหาวิทยาลัย + `affairs` ส่ง postvention ให้ทีม (W-129 แบบกลุ่ม) |
| F-23 | นักศึกษาบาดเจ็บ/ป่วยหนักกลางภาค | ไม่มี medical withdrawal (ถอนทุกวิชาหลังเส้นตาย W โดยไม่ติด F + refund/กยศ.) — W-10 ลาพักออกแบบสำหรับก่อนภาคและมี payment gate | Medium | 05 เพิ่ม W-151 "ถอนรายวิชาทั้งภาคด้วยเหตุทางการแพทย์": student → `medical` (ยืนยันสถานะ ไม่เปิดการวินิจฉัย) → advisor → dean → registrar (W ทุกวิชาย้อนหลัง) → FIN `RefundRule.MEDICAL` → SCH แจ้ง กยศ. |
| F-24 | อาจารย์วิชาปฏิบัติ (ว่ายน้ำ ยิมนาสติก มวย) | การบาดเจ็บในชั่วโมงเรียนบันทึกได้โดย `medical`/`coach` เท่านั้น (W-39); สอบปฏิบัติในสนาม/สระไม่อยู่ในโมเดล EXM (ที่นั่ง) | Medium | 05 W-39 ขั้น first-aid incident: เปลี่ยน `coach` เป็น "ผู้กำกับกิจกรรม (coach/lecturer/dorm)"; 06 EXM เพิ่ม `PracticalExamSession(facility, safety_staff, heat_check)` จอง FAC |
| F-25 | ผู้กู้ กยศ. ใหม่, `loan`, `finance` | `Deferment(LOAN_PENDING)` ตั้งอัตโนมัติจากการ "แจ้งว่าจะกู้" (CF-3) แต่ไม่ระบุวันหมดอายุ/ทางออกเมื่อไม่ได้ยื่น DSL ภายใน 25 ก.ย. หรือไม่อนุมัติ | Medium | 06 FIN `Deferment.expiry` = DSL close + 7 วัน; หมดอายุ → แปลงเป็น `PaymentPlan` เสนออัตโนมัติ → ไม่ตอบ → dunning + hold เอกสาร (ไม่ยกเลิกรายวิชาย้อนหลัง); SCH ส่ง `sch.LoanApplicationNotFiled` |
| F-26 | นักศึกษานักกีฬาอายุ ≥ 18, `safeguard`, `complaint` | ขอบเขต SAFE = ผู้เยาว์; การคุกคาม/ล่วงละเมิดโดยโค้ชต่อนักกีฬาผู้ใหญ่ไม่มี ContactRestriction/ถอดโค้ช | High | 06 §7.5 ขยายวัตถุประสงค์: "safe sport สำหรับนักกีฬาทุกวัย" — CASE หมวด `athlete_welfare` route เข้า SAFE ได้; `ContactRestriction` ใช้กับนักกีฬาผู้ใหญ่ (ถอด `CoachAssignment`, ห้ามข้อความ); 04 เพิ่ม qualifier `athlete_welfare_officer`; นโยบายความสัมพันธ์โค้ช–นักกีฬา (conflict declaration) ใน X-HR |
| F-27 | นักกีฬาผู้เยาว์ในทริป, `coach`, `safeguard` | W-31 ไม่มีกติกาสัดส่วนผู้ควบคุม:เด็ก, ผู้ควบคุมเพศเดียวกันสำหรับการพักค้าง, การจัดห้องพัก | Medium | 05 W-31 ขั้น `system` เพิ่ม DMN `TripSupervisionRule` (ratio, gender-matched, StaffClearance ทุกคน) เป็น gate ก่อน `sportshead` อนุมัติ; TripItinerary เพิ่ม room plan (ซ่อนจากบทบาทที่ไม่จำเป็น) |
| F-28 | ศิษย์เก่าที่เป็นโค้ช/ครู | ใช้ ALU เป็น pool กรรมการภายนอก/ครูพี่เลี้ยงไม่ได้ (ต้องเปิดบัญชีใหม่ W-139 + StaffClearance ใหม่) | Low | W-139 อนุญาต "promote alumni → ExternalPerson" โดยคงตัวตนเดิม |
| F-29 | auditor | ยังไม่มีรายงานสำเร็จรูปสำหรับตรวจ "override ผลคัดเลือก" และ "เงินยืมทริปค้าง" ต่อวิทยาเขต | Low | 06 ANA เพิ่ม audit pack 2 ชุด (W-18/EX-5 overrides; Advance aging) |
| F-30 | `coach`, `finance` (pilot) | พลศึกษาเกมส์ ก.ย. 2572 ใช้ ATH core แต่ W-31/W-115 (R3) ไม่ live → เงินยืม/ล้างเงินยืมต้องทำนอกระบบก่อนปิดปีงบ 30 ก.ย. ขณะที่ FIN ใหม่ live แล้ว (สองทาง) | Medium | 12 §3.1 แถว ATH: ย้าย `TeamTrip` + `Advance`/ล้างเงินยืม (W-31/W-115 ขั้นการเงิน) เข้า R2 หรือระบุ BR-10 "บันทึกเงินยืมทริปใน FIN แบบ manual advance" |

---

## 4. มุมผู้เชี่ยวชาญกีฬา (head coach / sports scientist / team physician)

### 4.1 ความสมจริงต่อโมดูล

| ด้าน | ประเมิน | ความเห็น |
|---|---|---|
| Training planning (ATH) | △ | periodization macro/meso/micro เป็น entity เต็ม — โค้ชมหาวิทยาลัยไทยส่วนใหญ่วางแผนในสมุด/Excel/กลุ่ม LINE จะไม่กรอกแผนละเอียดในระบบ ต้องการแค่ **session log** (วัน เวลา ประเภท ความหนัก, ใครมา) ที่สร้างจาก FAC booking ซ้ำ ๆ ได้ในแตะเดียว |
| Load monitoring | △ | sRPE เก็บจากนักกีฬาเอง (ไม่เพิ่มภาระโค้ช) ดี; แต่ **ACWR + "เตือนเสี่ยงบาดเจ็บ"** (TP-D, W-68) มีหลักฐานโต้แย้งมากในวงการ (ปัญหา mathematical coupling/ratio) — การเขียนว่า "เสี่ยงบาดเจ็บ" สร้างความรับผิด ถ้ามีคนบาดเจ็บหลังไม่ตอบ flag (S-05) |
| Testing protocols (LAB) | △ | ออกแบบแบบ lab-centric (จอง แล็บ calibration) แต่การทดสอบส่วนใหญ่เป็น **field test** (sprint gate, CMJ บนแผ่นกระโดด, Yo-Yo, 1RM) ที่ทำเป็นทีม 30 คนในสนามไม่มีสัญญาณ ต้องการ bulk entry offline + norms ต่อชนิดกีฬา/อายุ/เพศ + typical error/SWC เพื่อบอกว่า "เปลี่ยนจริงหรือไม่" |
| Injury management & RTP (HLT) | △ | โครงดี (vault, AvailabilityChanged, RTP stages) แต่ขาด **injury surveillance standard** (นิยาม time-loss, coding OSIICS/Orchard แทน ICD-10 อย่างเดียว, exposure hours จาก session/แข่ง เพื่อคำนวณอัตรา/1000 ชม.), **concussion pathway**, และ RTP เป็น shared decision (แพทย์ + นักกายภาพ + โค้ช + นักกีฬา) ไม่ใช่ clearance ของ `medical` คนเดียว |
| Talent ID | △ / over | PHV/maturation + pathway stage ของเด็กทุกคน + แชร์ กกท. — มีประโยชน์ต่อ feeder (W-144) แต่เสี่ยง labelling เด็กและ relative-age bias; W-112 ระบุ "ห้ามใช้ metric เดียว" ดีแล้ว |
| Competition calendar | ✓ | competition master + blackout + linter ใช้ได้จริง เป็นจุดแข็งที่สุดของชุดเอกสาร |
| Team selection | ✗ | ไม่มี trials/selection criteria/ประกาศทีม/ทบทวน — ทั้งที่ทุนนักกีฬา, eligibility, หอนักกีฬา ผูกกับ squad (S-04) |
| Travel | ✓/△ | TeamTrip/advance/per diem/permission slip ครบ แต่ต้องออก **แบบฟอร์มการเงินราชการ** ที่งานการเงินรับจริง (สัญญายืมเงิน, ใบสำคัญรับเงิน, รายงานการเดินทาง) ไม่เช่นนั้นโค้ชทำซ้ำสองทาง; SLA "ก่อนเดินทาง 5 วัน" ไม่รองรับการเรียกตัวด่วน |
| Nutrition | over | FuellingLog/meal log รายบุคคลจะไม่มีใครกรอก; ที่ต้องการจริงคือ **meal provision ของหอนักกีฬา/โรงเรียน** (งบรายหัว) + referral นักโภชนาการ + **supplement register** (ผลิตภัณฑ์ที่ผ่านการตรวจ batch) |
| Psychology | ✓ | referral + บันทึกลับ + W-129 เหมาะสม |
| Data-entry burden | △ | 14 AM-1..AM-8 ดีมาก (≤ 60 วินาที, นักกีฬาเห็นแนวโน้มตนเอง, เปิดเฉพาะทีมที่มีผู้ตอบ) แต่ 02 TP-B เขียน < 30 วินาที (ไม่ตรงกัน) |
| Wearables | over | adapter เฉพาะยี่ห้อ (Catapult/Polar/Garmin) ใน core — วิทยาเขตส่วนใหญ่ไม่มี GPS vest; ทำ generic CSV mapping + 1 adapter เมื่อมีทีมใช้จริง |
| Athlete privacy | △ | vault + per-person key + นักกีฬาเห็น access log = ระดับดีกว่า AMS เชิงพาณิชย์; แต่การใช้ **explicit consent** กับสถานะความพร้อม (L-11) ในความสัมพันธ์เชิงอำนาจ (นักกีฬาทุน) ทั้ง "ไม่อิสระ" และ "ไม่ปลอดภัย" (S-01) |

### 4.2 สิ่งที่จะทำให้โค้ช "ไม่ใช้" (adoption killers)

1. **ไม่เห็นว่าใครห้ามซ้อม** เว้นแต่นักกีฬายินยอม (S-01) — โค้ชจะกลับไปถามในกลุ่ม LINE และเลิกเปิดระบบ
2. **KPI "ตอบ flag ใน 48 ชม. ≥ 90%" ผูกกับโค้ช** (14 AM-4, หัวข้อ KPI) — ทำให้โค้ชกลายเป็นผู้รับผิดเมื่อมีคนบาดเจ็บ จะปิด wellness ทั้งทีม (S-05)
3. **ห้ามข้อความ 1:1 กับนักกีฬาผู้เยาว์และให้สื่อสารผ่านช่องทางระบบเท่านั้น** (R14, 14 §4.5) — ระบบบังคับนอกแพลตฟอร์มไม่ได้; ถ้าช่องทางในระบบไม่สะดวกเท่า LINE โค้ชจะใช้ LINE ต่อและข้อมูลหลุดไปนอกระบบที่มี audit (S-06)
4. **ต้องกรอกแผนซ้อม periodization และงานชดเชยรายวิชาทุกครั้งที่ลาแข่ง** (S-07, F-15)
5. **กรอกเงินยืมทริปในระบบแล้วยังต้องทำเอกสารกระดาษให้การเงิน** (S-08)
6. **ใช้มือถือส่วนตัวและเน็ตส่วนตัว** โดยไม่มีอุปกรณ์/ค่าข้อมูล — ต้องระบุใน 12 (อุปกรณ์ tablet ต่อทีมสำหรับ field testing/judge app)

### 4.3 Sports gap table

| ID | Persona | Gap | Sev | Proposed fix |
|---|---|---|---|---|
| S-01 | coach, medical, นักกีฬา | availability ต้องใช้ consent (10 L-11) ขัดกับ 06 HLT ที่ส่งเป็นค่าเริ่มต้น | High | 10 L-11 แยกเป็น 2 แถว: (ก) **"fitness-to-participate status"** = FULL / MODIFIED (+ รายการข้อจำกัดเชิงกิจกรรม เช่น "ห้ามปะทะ", "ห้ามกระโดด") / UNAVAILABLE ส่งให้ coach ของ squad เสมอ ฐาน = ความปลอดภัยในการจัดกิจกรรม [ต้องตรวจสอบฐานตาม PDPA ม.26 กับที่ปรึกษากฎหมาย] หรือถ้าต้องใช้ consent ให้เป็น **เงื่อนไขการเป็นสมาชิก squad** พร้อมทางเลือกไม่เสียทุนการศึกษา; (ข) การวินิจฉัย/รายละเอียด = EC; 02 IJ-3, W-39 ขั้น student/coach แก้ข้อความให้ตรง |
| S-02 | นักกีฬากีฬาต่อสู้/ปะทะ (รวมผู้เยาว์), medical, coach | ไม่มี concussion pathway | High | 06 HLT เพิ่ม `ConcussionEpisode`, `ScatBaseline` (SCAT6/Child SCAT6 หรือเครื่องมือที่ทีมแพทย์เลือก [ต้องตรวจสอบ]); 05 เพิ่ม W-152 "Suspected concussion": ผู้กำกับกิจกรรม **ถอดออกทันที** (ปุ่มเดียว, ไม่ต้องเป็นแพทย์) → `medical` ประเมิน → graded return-to-learn (ATT/EXM excused) → return-to-sport ทีละขั้น → clearance แพทย์; ATH บล็อก squad selection/competition entry จนกว่า clear; baseline ปีละครั้งใน W-130 สำหรับชนิดกีฬาเสี่ยง |
| S-03 | ทุกทีม, ผู้สมัครวันสอบ, อาจารย์วิชาปฏิบัติ | ไม่มี heat policy / emergency action plan ต่อสนาม | High | 06 FAC เพิ่ม `VenueEmergencyPlan` (AED ที่ใกล้สุด, จุดรับรถพยาบาล, ผู้รับผิดชอบ) แสดงใน booking; `HeatReading` (WBGT) บันทึก/นำเข้าจากเครื่องวัด → กติกาปรับกิจกรรม (soft gate) สำหรับ ATH session, ADM station, วิชาปฏิบัติ; 03 blackout `heat` |
| S-04 | coach, sportshead, นักกีฬา | ไม่มีการคัดเลือกทีม (selection) และการทบทวน | High | 06 ATH เพิ่ม `SelectionPolicy` (เกณฑ์ประกาศล่วงหน้า), `SelectionDecision` (เหตุผล, ผู้ตัดสิน ≥ 2, COI); 05 W-153 "ประกาศทีม/คัดตัว + ทบทวน" (ทบทวนภายใน 3 วันทำการผ่าน CASE ก่อนส่ง W-30); ห้ามใช้ข้อมูล HLT/psych เป็นเหตุผล (14 AM-6); เชื่อม F-06 สำหรับโรงเรียนกีฬา |
| S-05 | coach, sci | flag SLA เป็นความรับผิดของโค้ช + ACWR เขียนว่า "เสี่ยงบาดเจ็บ" | High (adoption) | 14 AM-4: flag ไปที่ `sci`/S&C ก่อน (coach เห็นเป็นข้อมูล); KPI วัดระดับ "ระบบ/ทีม" ไม่ใช่รายบุคคล; 02 TP-D + W-68 เปลี่ยนข้อความเป็น "load spike / ค่าต่างจากปกติของบุคคล (individual baseline)" ไม่ใช้คำว่าเสี่ยงบาดเจ็บ; ACWR เป็น option ใน ANA ไม่ใช่ trigger |
| S-06 | coach, safeguard | กติกาข้อความ 1:1 กับผู้เยาว์บังคับได้เฉพาะในระบบ | Medium | 14 §4.5 เขียนเป็น **policy + tooling** ไม่ใช่ technical guarantee: ระบบมี team channel ที่ง่ายเท่า LINE (รูป, voice, read receipt) + ผู้ปกครอง/homeroom อัตโนมัติ; นโยบายใน SAFE ว่าช่องทางนอกระบบต้องมีผู้ใหญ่ 2 คนในกลุ่ม; ไม่สัญญาว่าระบบ "ห้าม" ได้ |
| S-07 | coach | ภาระกรอกแผนซ้อม | Medium | 06 ATH: `TrainingPlan` เป็น optional; บังคับขั้นต่ำเพียง `TrainingSession` (สร้างจาก FAC recurring booking) + attendance ฝึก (ใช้เป็น exposure และ safeguarding) + sRPE ที่นักกีฬากรอกเอง |
| S-08 | coach, finance | แบบฟอร์มการเงินราชการของทริป | Medium | 06 DOC/FIN: template สัญญายืมเงิน, ใบสำคัญรับเงิน (นักกีฬารับ per diem), รายงานการเดินทาง ตามระเบียบที่ มกช. ใช้ [ต้องตรวจสอบ] ออกจาก `TeamTrip` อัตโนมัติ; W-31 SLA เพิ่มเส้นทาง "เรียกตัวด่วน < 5 วัน" อนุมัติภายหลัง |
| S-09 | sci | field testing ไม่ใช่ lab | Medium | 06 LAB/ATH: `FieldTestSession` (squad, protocol version, offline bulk grid), norms ต่อชนิดกีฬา/อายุ/เพศ, typical error/SWC ต่อ protocol; LAB เหลือ calibration/อุปกรณ์ที่มีจริง |
| S-10 | medical, physio | role `medical` รวมแพทย์/พยาบาล/นักกายภาพ ไม่แยกอำนาจตามวิชาชีพและใบอนุญาต | Medium | 04 §3.1 `medical` เพิ่ม qualifier `physician`, `nurse`, `physio`, `athletic_trainer`, `first_aider` + `ProfessionalLicence(expiry)` (ผ่าน X-HR); RtpClearance/MedicalClearance ออกได้เฉพาะ `physician` (หรือตามนโยบาย), MAR ตามที่ผู้สั่งยากำหนด |
| S-11 | medical, sci, วิจัย | injury surveillance ไม่ได้มาตรฐาน | Medium | 06 HLT `Injury` เพิ่ม `time_loss_days`, `mechanism`, `osiics_code` [ต้องตรวจสอบระบบ coding ที่ทีมแพทย์ใช้], `activity_context`; ATH ส่ง exposure (session/competition minutes) ให้ ANA คำนวณ incidence/1000 ชม. (de-identified) |
| S-12 | นักกีฬาหญิง, medical | ไม่มีการคัดกรอง low energy availability/RED-S ใน PPE; ไม่ควรเก็บข้อมูลรอบเดือนใน ATH | Low–Medium | W-130 แบบคัดกรองเพิ่มหัวข้อ LEA/RED-S (ผลอยู่ HLT); ระบุใน 06 ATH ว่า **ไม่เก็บ** ข้อมูลรอบเดือน; ถ้าทีมแพทย์ต้องการ ให้เป็น opt-in ใน HLT เท่านั้น |
| S-13 | combat-sport athletes (minors) | การลดน้ำหนักเร่งด่วนก่อนแข่ง/ชั่งน้ำหนัก | Medium | ATH `WeightManagementPlan` ภายใต้นักโภชนาการ; flag เมื่อน้ำหนักลด > X% ในสัปดาห์แข่ง [config, ต้องตรวจสอบเกณฑ์]; ผู้เยาว์แจ้งผู้ปกครอง |

### 4.4 Over-engineering (เสนอลด/เลื่อน)

| # | สิ่งที่เกิน | ตำแหน่ง | เหตุผล | ข้อเสนอ |
|---|---|---|---|---|
| O-1 | Periodization macro/meso/micro เป็นโมเดลเต็ม | 06 ATH Training | โค้ชไม่กรอก; ไม่มี consumer ที่ต้องใช้ระดับ macro/meso | เหลือ `TrainingSession` + template; แผนเป็นไฟล์แนบ |
| O-2 | ACWR + การเตือน "เสี่ยงบาดเจ็บ" | 02 TP-D, 05 W-68, 06 ATH | หลักฐานวิทยาศาสตร์โต้แย้ง + ความรับผิด | descriptive load trend + individual baseline; ACWR เป็นรายงานทางเลือก |
| O-3 | `FuellingLog`/meal log รายบุคคล | 06 ATH Nutrition | adoption ต่ำ, ข้อมูลไม่แม่น | meal provision ระดับทีม/หอ + supplement register + referral |
| O-4 | Vendor adapters Catapult/Polar/Garmin ใน core | 06 ATH | วิทยาเขตส่วนใหญ่ไม่มีอุปกรณ์; เพิ่มภาระ DPIA/cross-border | generic CSV mapping; adapter เฉพาะเมื่อมีผู้ใช้จริง (contract option) |
| O-5 | LAB LIMS-lite (instrument qualification, external client order) ใน R3 | 06 LAB | มีแล็บจริงไม่กี่วิทยาเขต | R3 เหลือ protocol + field test + calibration log; external client ไป REV |
| O-6 | `HostedEvent`/accreditation ใน ATH | 06 ATH | event management เป็นอีกโดเมน (ticket, draw, results) | ใช้ partner/สเปรดชีตนำเข้า; คงเฉพาะ roster ของ มกช. |
| O-7 | z-score normalisation ข้ามกลุ่มกรรมการ | 02 §2.5.5 ข้อ 5 | n ต่อกลุ่มเล็ก (หลักสิบ) ไม่เสถียร, อธิบายผู้สมัครยาก, เสี่ยงข้อพิพาท | ปิดโดยค่าเริ่มต้น; ใช้ panel เดียวต่อ sub-bucket แทน |
| O-8 | "Blind judging" ในสอบทักษะ | 02 QS-9 | ผู้สมัครกีฬามักเป็นที่รู้จัก; ตาบอดได้แค่ชื่อบนจอ แต่ขัดกับการประกาศ COI รายบุคคล | ตัดคำอ้าง blind; ใช้ COI อัตโนมัติจากข้อมูลสโมสร/โรงเรียน/โค้ชที่ผู้สมัครกรอก + multi-judge + วิดีโอ |
| O-9 | Talent pathway + MaturationMeasure สำหรับนักเรียนทุกคน + แชร์ กกท. | 06 ATH, W-112 | ภาระวัดผล + ความเสี่ยง labelling เด็ก | เริ่มจาก ม.4–ม.6 และนักกีฬาระดับชาติ; ผลเป็นแผนพัฒนา ไม่เป็น gate |
| O-10 | `ClearingRun` ข้ามวิทยาเขตแบบ opt-in | 06 ADM | นโยบายยังไม่ยืนยัน (Q-12), BR-01 ใช้ได้แค่ 2 วิทยาเขตถึง 2574 | เลื่อนไป Wave 2; R1 ทำเฉพาะ uniqueness + reserve cascade |

---

## 5. ความขัดแย้ง / เวลาที่เป็นไปไม่ได้ (admissions + per-term cycle vs เล่ม 03)

| ID | ประเภท | รายละเอียด | ตำแหน่ง | ข้อเสนอ |
|---|---|---|---|---|
| X-01 | Clearing scope | C-3 "confirmed 1 รายการต่อ **cycle** ต่อระดับ" vs 06 ADM "1 ที่ทั่ว มกช. ต่อ **รอบ**/ระดับ" — ต่อรอบหมายความว่ายืนยันโควตาแล้วยืนยันทั่วไปได้อีก ขัด C-13 | 02 §2.8.1; 06 §6.1 | 06 แก้เป็น "ต่อ cycle ต่อระดับ" |
| X-02 | Clearing | C-4 option "upgrade" (ถือสิทธิ์เดิมระหว่างสมัครใหม่) ขัดกับ unique constraint C-3 และ CL-5 (สละ offer อื่นใน transaction เดียว) | 02 C-3, C-4, CL-5 | ถ้าเปิด upgrade ต้องมีสถานะ `confirmed_conditional` แยก และ unique constraint ครอบ (`confirmed` ∪ `confirmed_conditional`) ≤ 2 |
| X-03 | Clearing | C-5 "สละได้ 1 ครั้ง" ไม่นิยามว่าการสละอัตโนมัติ (CL-2) และหมดเวลา (C-8) นับหรือไม่ — ตัวอย่าง "เอ" บ่งว่าไม่นับ แต่ CL-7 นับ | 02 C-5, CL-2, CL-7, ตัวอย่าง | ระบุ: นับเฉพาะ "สละหลัง confirmed" (CL-7) |
| X-04 | Timing | การคืนที่นั่ง: C-8 "ทันที", ตัวอย่าง "ภายในไม่กี่นาที", J-04 "ทุก 5 นาที", W-74 SLA "ประมวลผลทุกคืน; คืนที่นั่งภายใน 24 ชม.", C-10 no-show รอ 7 วัน | 02 §2.8; 03 J-04, J-07; 05 W-74 | เลือกหนึ่ง: release ≤ 15 นาทีหลังหมดเวลา (J-04) — แก้ W-74 SLA; no-show ใช้ C-10 แต่ cap ด้วย `cascade_cutoff` (F-05) |
| X-05 | Admission vs term | ทั่วไปรอบ 5–6 (ประกาศ ≈ 8 มิ.ย., รายงานตัว 9 มิ.ย.) + cascade 48 ชม. + TCAS รอบ 4 ถึง 15 มิ.ย. อยู่หลัง T0 7 มิ.ย., census 10 มิ.ย., due 11 มิ.ย., J-15 14 มิ.ย.; OB/DM/OR/HB เขียนว่า "ก่อนเปิดภาค" | 02 §2.6, §3; 03 มิ.ย. 2570, J-13..J-15, J-29 | F-05 |
| X-06 | Appeal vs offer | W-18/EX-4 ยื่น ≤ 7 วันทำการ + SLA 7 วันทำการ > ระยะยืนยันโควตา 7 วัน / รอบท้าย 24 ชม.; EX-5 เพิ่มที่นั่งพิเศษ (campusvp) ขัด `AccreditedIntakeCap` hard stop | 02 EX-4/EX-5, C-6; 06 ADM | (ก) seat ของผู้ยื่นอุทธรณ์ที่อยู่ในลำดับใกล้เส้นตัด → `appeal_hold` 1 ที่ต่อ sub-bucket จนตัดสิน; (ข) รอบที่ยืนยัน ≤ 72 ชม. → SLA อุทธรณ์ 2 วันทำการ; (ค) EX-5 ห้ามเกิน cap ของคุรุสภา (ใช้ waitlist ปีถัดไป/ช่องทางอื่น) |
| X-07 | Judging | QS-9 blind vs 2.5.5 ข้อ 2 COI รายผู้สมัคร | 02 | O-8 |
| X-08 | Scoring | 2.5.5 ข้อ 3 trimmed mean ต้อง ≥ 5 กรรมการ แต่ค่าเริ่มต้น ≥ 3/สถานี; moderation "พิสัย > 20%" และ normalisation ใช้กับรายการวัดเชิงวัตถุ (เวลา/ระยะ) ไม่ได้ | 02 QS-9, 2.5.4, 2.5.5 | แยก `station_type`: OBJECTIVE (1 การวัด, n trials, best-of, เครื่องจับเวลา) ไม่ผ่าน aggregate/moderation; SUBJECTIVE (rubric) ใช้กติกา 2.5.5 |
| X-09 | Moderation SLA | 02 QS-10 "วันเดียวกัน" vs W-76 "moderation ≤ 3 วันทำการ" | 02, 05 | ระบุ: flag วันเดียวกัน, ปิด moderation ≤ 1 วันทำการก่อนรวมคะแนน QS-12 |
| X-10 | Round approval | CM-1 "ก่อนเปิดรับ ≥ 2–4 สัปดาห์" vs W-69 "อนุมัติ ≥ 30 วันก่อนเปิดรับ"; ผู้เริ่ม W-69 = กองแผน vs CM-1 = งานรับสมัคร | 02 CM-1; 05 W-69 | ใช้ "อนุมัติ ≥ 30 วัน, เผยแพร่ ≥ 7 วัน" และผู้เริ่ม = `admission` (กองแผนอนุมัติแผนรับ `AdmissionPlan` แยก) |
| X-11 | Medical cert | QS-5 "ใบรับรองแพทย์อายุไม่เกิน 30 วัน" นับ ณ วันจอง slot ไม่ใช่วันทดสอบ | 02 QS-5 | นับ ณ วันทดสอบ |
| X-12 | Accommodation | DA-2 ยื่น ≥ 7 วัน (ปฏิทิน) ก่อนสอบ + DA-3 ≤ 5 วันทำการ แต่ W-79 ต้องอนุมัติ ≥ 5 วันทำการก่อนสอบ → เป็นไปไม่ได้ | 02 DA-2/3; 05 W-79 | F-12 |
| X-13 | TCAS leakage | C-12 ทำงานเฉพาะเมื่อเปิด adapter แต่ค่าเริ่มต้นปิด (A-50) | 02 C-12; 01 A-50 | F-01 |
| X-14 | Quota timeline | ประกาศผลโควตา "ก่อน 19 ธ.ค." + อุทธรณ์ 7+7 วันทำการ คร่อมวันหยุดปีใหม่ → ตัดสินหลังเปิด clearing 5–12 ม.ค. ได้ | 03 ธ.ค.–ม.ค.; 02 EX-4 | ล็อก clearing ของ sub-bucket ที่มีอุทธรณ์ค้าง หรือเลื่อนเปิด clearing ≥ 15 วันทำการหลังประกาศ |
| X-15 | Skill-test resources | สอบทักษะโควตา ต้น–กลาง ธ.ค. = สัปดาห์ 6–7 ภาค 2 (มีการสอน) + โค้ช (กรรมการ) เตรียมทีมกีฬาแห่งชาติ 19 ธ.ค.; K-9 ยอมรับแต่ linter ไม่มีกฎ | 03 K-9, L-9 | linter L-14: `ADM_SKILL_TEST` ไม่ทับ `CompetitionEvent` ระดับชาติ − 14 วัน สำหรับ judge ที่อยู่ใน delegation (warning) |
| X-16 | Sports school | SS-9 clearing ระหว่างโรงเรียนกีฬา "cycle แยก" แต่ ม.3 → ม.4 แบบ "ต่อเนื่อง" สร้างใบสมัครภายในอัตโนมัติ = มี confirmed อัตโนมัติชนกับการสมัครโรงเรียนกีฬาอื่น | 02 §2.9 | ใบสมัครต่อเนื่องเป็น `offered` (ไม่ใช่ `confirmed`) ให้ผู้ปกครองยืนยันใน clearing ปกติ |
| X-17 | Graduate | GS-1 ไม่เปิดหลักสูตรถ้าผู้ผ่านน้อย → "คืนเงินอัตโนมัติ" แต่ไม่มีการเสนอย้ายไปภาคพิเศษ/รอบถัดไป/วิทยาเขตอื่น | 02 GS-1 | เพิ่มทางเลือก transfer offer ก่อนคืนเงิน |
| X-18 | Term: payment | 02 §4.1 batch ยกเลิกผู้ไม่ชำระ "T0" vs 03 J-15 "payment.due + grace ≈ 14 มิ.ย." (T0 + 1 สัปดาห์) | 02 §4.1; 03 J-15 | ใช้ J-15 และแก้ 02 §4.1 |
| X-19 | Term: standing | ลงทะเบียนภาค 2 (18–29 ต.ค.) ก่อน standing (26–29 ต.ค.); ไม่มี re-validation เพดานหน่วยกิตรอพินิจ/ผู้พ้นสภาพ; อุทธรณ์เกรด (พ.ย.) หลัง auto-drop และหลังปิด add/drop 12 พ.ย. | 03 K-15, ต.ค.–พ.ย.; 02 §4.1, §7 | F-20, F-21 |
| X-20 | Eligibility timing | J-36 ตรวจสิทธิ์กีฬามหาวิทยาลัยรอบคัดเลือก (8–13 พ.ย.) ณ 27 ก.ย. แต่เกณฑ์ใช้การลงทะเบียนภาค 2 (18–29 ต.ค.) และเกรดภาค 1 (26–29 ต.ค.) ซึ่งยังไม่มี; การตรวจจริงต้องอยู่ 30 ต.ค.–5 พ.ย. ทับ add/drop (K-4) | 03 J-36, K-4; 02 EL-1 | J-36 เป็น 2 รอบ: pre-check T−6 สัปดาห์ (ข้อมูลภาคปัจจุบัน, ติดป้าย "ชั่วคราว") + **final check หลัง `asm.GradesPublished` และ `reg.TermRegistrationClosed`**; เปิด GateOverride ลงทะเบียนภาค 2 ล่วงหน้าให้ squad ที่จะแข่ง |
| X-21 | Summer → term 1 | ลงทะเบียนภาค 1 (24 พ.ค.–6 มิ.ย.) ทับสอบ/ส่งเกรดฤดูร้อน (ภาคฤดูร้อนจบ ≈ 26 พ.ค.) แต่ K-15 ครอบเฉพาะภาค 1 → 2 | 03 gantt, K-15, L-4 | K-15/L-4 ใช้กับทุกรอยต่อภาค รวมฤดูร้อน → ภาค 1 |
| X-22 | Practicum | `PRACTICUM_PERIOD` เริ่ม 16 พ.ค. ก่อนลงทะเบียน/ประกันภาค 1 | 03 K-11; 02 PR-4; 05 W-107 | F-19 |
| X-23 | Pilot GRD | 02 GD-2 window ขอจบ T0→T0+30 ต้องใช้ GRD แต่ 12 §3.1 GRD "เดิม" ใน R2 ขณะ REC/ASM ใหม่ | 02 §8; 12 §3.1 | F-10 |
| X-24 | Workflow count | 05 §1 "142 workflow (W-01..W-143)" แต่ `workflows.json` มี 146 (รวม W-144..W-147); 02 §12.1 ยังเรียก W-144..W-147 ว่า "เสนอ ยังไม่อยู่ในทะเบียน"; W-146 SLA 5 วันทำการ (02) vs 10 วันทำการ (JSON) | 02 §12; 05 §1; JSON | ซิงก์ตัวเลขและสถานะ; ใช้ JSON เป็นหลัก |
| X-25 | Wellness time | 02 TP-B "< 30 วินาที" vs 14 AM-1/A-96 "≤ 60 วินาที" | 02, 14 | ใช้ ≤ 60 วินาที |
| X-26 | Batch-leave ownership/actor | เจ้าของ: 06 ATH ("ลาแข่งแบบยกคณะ") vs 05 W-04/W-114 module = ATT vs 03 J-35 = ATH; ผู้เริ่ม: 02 BL-1 sportshead สร้าง event + BL-2 **coach** ส่ง roster vs W-114 **sportshead** สร้าง roster vs 14 S-17 "coach ยื่น" | 02, 03, 05, 06, 14 | กำหนด: ATH เป็นเจ้าของ `CompetitionLeaveBatch`; ATT เป็นผู้บริโภค; coach ส่ง roster ต่อชนิดกีฬา → sportshead รวม/ยื่น |
| X-27 | Health single-owner | `WellnessEntry` (อารมณ์ การนอน ความปวด) อยู่ใน ATH และ 10 L-12 ระบุ module ATH ขณะที่ blueprint ข้อ 4/9.9 ให้ HLT เป็นที่เก็บข้อมูลสุขภาพแห่งเดียว และ 02 TP-B บอกว่าอยู่ใน vault | 06 §8.1; 10 L-12; 02 TP-B | ตัดสิน: wellness ที่มีความปวด/อารมณ์ = ข้อมูลสุขภาพ → เก็บใน HLT vault, ATH เก็บเพียง readiness score ที่คำนวณแล้ว |
| X-28 | Availability basis | 10 L-11 (EC) vs 06 HLT (ส่งเป็นค่าเริ่มต้น) vs 02 IJ-3/W-39 | 10, 06, 02, 05 | S-01 |
| X-29 | W-39 actor | first-aid incident โดย `coach` เท่านั้น; อาจารย์วิชาปฏิบัติ/ครูหอ/กรรมการสอบทักษะเป็นผู้อยู่หน้างานบ่อยกว่า | 05 W-39 | F-24 |
| X-30 | Duplicate approval | W-05 ให้ lecturer → head อนุมัติสอบชดเชยแม้ระบบสร้างจาก W-114/W-04 ที่ dean อนุมัติแล้ว (02 BL-7 บอกว่า registrar จัดเลย) | 05 W-05; 02 BL-7 | F-15 |

---

## 6. ลำดับที่แนะนำก่อนใช้เป็น TOR

1. **ตัดสินนโยบาย 4 ข้อแล้วแก้ทุกเล่มให้ตรงกัน:** clearing (X-01..X-04, F-01), late-admit cutoff (F-05), availability basis (S-01/X-28), stay-of-effect + post-standing re-validation (F-20/F-21)
2. **เพิ่ม workflow ด้านความปลอดภัยนักกีฬา/ผู้เยาว์:** W-148 retention review (F-06), W-149 critical incident ผู้เยาว์ (F-08), W-152 concussion (S-02), heat/EAP ใน FAC (S-03), selection + ทบทวน (S-04), safe sport ผู้ใหญ่ใน SAFE (F-26)
3. **ลดภาระโค้ช/อาจารย์ก่อน R2:** auto-approve ลาแข่งระดับชาติ + MakeupPolicy ต่อวิชา (F-15), flag ไป sci ก่อน (S-05), session log แทน periodization (S-07/O-1), แบบฟอร์มการเงินทริป (S-08)
4. **ลด scope** ตาม O-1..O-10 เพื่อนำ effort ไปใส่ข้อ 2
5. **ซิงก์เลข workflow/SLA/ผู้เริ่ม** (X-09, X-10, X-24..X-26, X-30) ให้ JSON เป็น single source
