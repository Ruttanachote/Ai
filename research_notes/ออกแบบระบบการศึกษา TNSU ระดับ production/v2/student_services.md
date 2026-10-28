# Student-facing service processes ระดับขั้นตอน (step-level) สำหรับ TNSU SIS + Mobile App (v2)

> ขอบเขต: กระบวนการบริการนักศึกษาระดับ "ขั้นตอน" (actor / action / documents / fees / SLA / system support) ของมหาวิทยาลัยรัฐไทย เทียบกับ มหาวิทยาลัยการกีฬาแห่งชาติ (มกช./TNSU) และโรงเรียนกีฬา (นักเรียนประจำ ผู้เยาว์)
> ไม่ซ้ำกับ `process_requirements.md` (กฎวิชาการ, FR ระดับ domain) และ `review_benchmark.md` (feature benchmark) เอกสารนี้ลงลึกที่ step-level และ catalogue คำร้อง
>
> **สัญลักษณ์**: ✅ = มีแหล่งอ้างอิง (URL) · 🟡 = ยังไม่ยืนยัน (แนวปฏิบัติทั่วไป/ความรู้เดิม/การอนุมาน ต้องตรวจกับ มกช. ก่อนใช้จริง)
>
> **ข้อจำกัดของ session (สำคัญ)**: WebFetch ถูกปิดกั้นสำหรับโดเมน `.ac.th` และ `.go.th` ทั้งหมดที่ลอง (DNS ENOTFOUND ใน sandbox): `freshmen-api.pn.psu.ac.th`, `op.mahidol.ac.th`, `regis.dusit.ac.th`, `www.reg.chula.ac.th`, `ratchakitcha.soc.go.th` ข้อเท็จจริง ✅ ทั้งหมดในเอกสารนี้จึงมาจาก **search-result snippets** (ไม่ได้อ่านเอกสารเต็ม) ควรเปิด URL ยืนยันอีกครั้งก่อนนำตัวเลข (ค่าธรรมเนียม/SLA) ไปตั้งค่าในระบบ ต้องเพิ่มโดเมนเหล่านี้ใน network allowlist หากต้องการ fetch เต็ม
>
> แหล่งเฉพาะ TNSU ที่พบ: เว็บงานทะเบียนและประมวลผล วิทยาเขตมหาสารคาม (`tnsumk.ac.th/reg`) และวิทยาเขตสกลนคร (`tnsuskn.ac.th/reg`) — มกช. มีหลายวิทยาเขต แต่ละวิทยาเขตมีงานทะเบียนของตนเอง ⇒ ระบบต้องรองรับ multi-campus configuration ของค่าธรรมเนียม/ผู้อนุมัติ

---

## 1. New student onboarding (รายงานตัว/มอบตัว, ตรวจวุฒิ, รหัส/บัตร, IT accounts, สุขภาพ, ประกัน, ปฐมนิเทศ)

### Takeaway
มหาวิทยาลัยไทยย้ายการรายงานตัวไปเป็นลำดับ online wizard: login ด้วยเลขบัตรประชาชน → ตรวจรหัสนักศึกษา → บันทึกข้อมูลพื้นฐาน → upload เอกสาร → ชำระค่าธรรมเนียม → แบบสอบถาม → กด "ยืนยันรายงานตัว"; ผู้ไม่รายงานตัวตามกำหนดต้องแจ้งเหตุเป็นลายลักษณ์อักษร (PSU: ภายใน 7 วัน) มิฉะนั้นถือสละสิทธิ์ บัตรนักศึกษามักเป็นบัตรร่วมธนาคาร (ต้อง consent ส่งข้อมูลให้ธนาคาร) และประกันอุบัติเหตุจัดให้นักศึกษาทุกคน

### Cited Findings
- คู่มือนักศึกษาใหม่ PSU วิทยาเขตปัตตานี 2568 เรียงขั้นตอนรายงานตัว: ตรวจสอบรหัสนักศึกษา → 3.1 บันทึกข้อมูลพื้นฐาน → 3.2 อัปโหลดเอกสาร → 3.3 ชำระค่าธรรมเนียมการศึกษา → 3.4 กรอกแบบสอบถาม ✅ — [PSU Pattani freshmen 2568](https://freshmen-api.pn.psu.ac.th/uploads/2568_04994f7a04.pdf)
- PSU ปัตตานี 2569: รหัสผ่านเริ่มต้น = เลขบัตรประชาชน 13 หลัก และมีเมนู "รายงานตัวออนไลน์" ให้กดยืนยันหลังทำขั้นตอนอื่นครบ ✅ — [PSU Pattani freshmen](https://freshmen-api.pn.psu.ac.th/uploads/1773981761092-qdx6isroleb.pdf)
- PSU: หากไม่สามารถรายงานตัวได้ตามกำหนด ต้องแจ้งเหตุผลเป็นลายลักษณ์อักษรภายใน 7 วัน มิฉะนั้นถือว่าสละสิทธิ์ ✅ — [PSU Trang 2567](https://www.psu.ac.th/trang/wp-content/uploads/2567_รายงานตัวนักศึกษา.pdf)
- บัตรนักศึกษาร่วมธนาคาร: นักศึกษาใหม่กรอกรายละเอียด แนบรูปถ่ายถูกระเบียบ และยินยอมเปิดเผยข้อมูลแก่ธนาคาร; หากบัตรหายต้องแจ้งความ + ขอใบรับรองสถานภาพนักศึกษาก่อนไปยื่นธนาคาร ✅ — [CRA บัตรนักศึกษา](https://psmd.cra.ac.th/?page_id=16644)
- เกณฑ์รูปถ่ายบัตร: ถ่ายไว้ไม่เกิน 6 เดือน ไฟล์ .jpg เท่านั้น (SPU ชลบุรี มีหน้า upload รูปทำบัตร) ✅ — [SPU Chonburi studentcard](https://www.chonburi.spu.ac.th/studentcard/index.php)
- KMUTT แจ้งการตรวจร่างกายนักศึกษาใหม่ (ป.โท/เอก) พร้อมนักศึกษาใหม่ปีการศึกษา 1/2569 ✅ — [KMUTT New Students](https://regis.kmutt.ac.th/web/new-students/)
- CMU จัดประกันภัยอุบัติเหตุแก่นักศึกษาทุกคน (กองพัฒนานักศึกษา) ✅ — [CMU accident insurance](https://web.sdd.oou.cmu.ac.th/service/accident); UTCC มีประกาศการเบิกค่ารักษาจากอุบัติเหตุประจำปีการศึกษา 2569 ✅ — [UTCC](https://www.utcc.ac.th/utcc-student-accident-insurance-claim-2026/)
- TNSU มหาสารคาม มีหน้า "การตรวจสอบวุฒิการศึกษา" ในงานทะเบียน (แสดงว่ามีขั้นตรวจวุฒิ) ✅ — [TNSU MK check-degree](https://www.tnsumk.ac.th/reg/index.php/services/registrar-services-2/check-degree)

#### Process table: New student onboarding (target TNSU)

| # | Actor | Action | Documents / data | Fee | SLA / timing | System support | Status |
|---|---|---|---|---|---|---|---|
| 1 | ฝ่ายรับเข้า (ADM) | ประกาศรายชื่อผู้ผ่านคัดเลือก (TCAS/โควตานักกีฬา) + import เข้า SIS, gen รหัสนักศึกษา | ข้อมูลผู้สมัคร | – | ตามปฏิทิน TCAS | Batch import, ID generator ตาม pattern วิทยาเขต/คณะ/ปี | 🟡 |
| 2 | ผู้ผ่านคัดเลือก | Login (เลขบัตร ปชช. 13 หลัก → บังคับเปลี่ยนรหัส) ตรวจรหัสนักศึกษา | – | – | ช่วงรายงานตัว | Onboarding wizard, ThaID login (option) | ✅ (PSU) |
| 3 | นักศึกษา | บันทึกข้อมูลพื้นฐาน: ที่อยู่, ผู้ปกครอง, สุขภาพ/โรคประจำตัว, กรุ๊ปเลือด, ประวัติกีฬา/ชนิดกีฬา/สังกัดสมาคม | – | – | – | Profile form + PDPA consent แยกวัตถุประสงค์ (health = sensitive data) | ✅ (PSU) / 🟡 กีฬา |
| 4 | นักศึกษา | Upload เอกสาร: บัตร ปชช., ทะเบียนบ้าน, ปพ.1 / ใบรับรองจบ ม.6, รูปถ่าย, ใบเปลี่ยนชื่อ (ถ้ามี), ใบรับรองแพทย์, หนังสือรับรองผลงานกีฬา (โควตา) | scan PDF/JPG | – | – | Document upload + OCR/checklist, รูปตามเกณฑ์ (≤6 เดือน .jpg) | ✅ (PSU, SPU) |
| 5 | นักศึกษา | ชำระค่าธรรมเนียมแรกเข้า + ค่าเทอม (หรือแนบสิทธิ์ กยศ./ทุน) | ใบแจ้งหนี้ | ตามประกาศ มกช. | ภายในกำหนด | Thai QR (PromptPay bill payment) + auto-reconcile | ✅ (PSU) |
| 6 | นักศึกษา | ตอบแบบสอบถาม (ภูมิหลัง/รายได้ครอบครัว/ความต้องการพิเศษ/สุขภาพจิตคัดกรอง) | – | – | – | Survey engine | ✅ (PSU) |
| 7 | นักศึกษา | กด "ยืนยันรายงานตัว" → สถานะ = รายงานตัวแล้ว; ไม่รายงานตัว → แจ้งเหตุใน 7 วัน หรือสละสิทธิ์ | คำร้องแจ้งเหตุ | – | 7 วัน (PSU) | Status machine + deadline job + notification | ✅ (PSU) |
| 8 | งานทะเบียน | ตรวจวุฒิ ม.6: ส่งหนังสือตรวจสอบไปโรงเรียนเดิม / ตรวจกับฐานข้อมูล สพฐ. (หาก integrate) ภายในภาคแรก; ผลไม่ผ่าน → พ้นสภาพ | หนังสือราชการ + สำเนา ปพ.1 | – | 🟡 ภายใน 1 ภาค | Bulk verification letter generator + tracking ผลตอบกลับ | ✅ (มีหน้า check-degree) / 🟡 ขั้นตอน |
| 9 | งานทะเบียน + ธนาคาร | ออกบัตรนักศึกษา physical (บัตรร่วม ATM/debit) — ต้องมี consent ส่งข้อมูลให้ธนาคาร | รูป + ข้อมูล | 🟡 ฟรี/ธนาคารออก | 🟡 2–4 สัปดาห์ | Export file ให้ธนาคาร, tracking สถานะบัตร | ✅ (CRA) |
| 10 | ระบบ | ออก Digital student card ใน app (รูป, รหัส, สถานะลงทะเบียนภาคปัจจุบัน, QR/dynamic token สำหรับเข้าห้องสมุด/หอ/สนาม) | – | – | ทันทีหลังยืนยันรายงานตัว | Mobile wallet card (Apple/Google Wallet option), revoke เมื่อพ้นสภาพ | 🟡 |
| 11 | ศูนย์ IT | Provision accounts: SSO/AD, e-mail (M365 หรือ Google Workspace for Education), Wi-Fi (eduroam/802.1X), LMS (Moodle/Google Classroom), library | – | – | 🟡 ภายใน 24 ชม. หลัง step 7 | Identity provisioning (SCIM) event-driven `StudentEnrolled` | 🟡 |
| 12 | หน่วยพยาบาล/โรงพยาบาลคู่สัญญา | ตรวจสุขภาพนักศึกษาใหม่ (สำคัญสำหรับนักกีฬา: pre-participation screening, ECG) | ใบรับรองแพทย์ | 🟡 รวมในค่าธรรมเนียม | ช่วงก่อนเปิดภาค | Appointment booking + health record (restricted) | ✅ (KMUTT มีตรวจร่างกาย) / 🟡 นักกีฬา |
| 13 | กองพัฒนานักศึกษา | ขึ้นทะเบียนประกันอุบัติเหตุกลุ่ม (ทุกคน) ส่งรายชื่อให้บริษัทประกัน | รายชื่อ | 🟡 รวมในค่าธรรมเนียม | ก่อนเปิดภาค | Export roster → insurer; แสดงกรมธรรม์ใน app | ✅ (CMU) |
| 14 | กองพัฒนานักศึกษา/คณะ | ปฐมนิเทศ (on-site + online), พบอาจารย์ที่ปรึกษา, กิจกรรมรับน้อง/สานสัมพันธ์ (ต้องเป็นไปตามประกาศ อว. ห้ามว้าก/ใช้ความรุนแรง 🟡) | – | – | สัปดาห์ก่อนเปิดภาค | Event registration + QR check-in → activity transcript | 🟡 |
| 15 | นักศึกษา | สมัครหอพัก (ดู §4), ผ่อนผันทหาร (ดู §5), เปิด กยศ. (ดู process_requirements §3) | – | – | – | Cross-link ใน onboarding checklist | 🟡 |

### Inferences
- Onboarding ควรเป็น **checklist ที่ track ได้** (progress bar) ไม่ใช่ form เดียว: แต่ละ step มี owner ต่างกัน (นักศึกษา, ทะเบียน, IT, การเงิน, หน่วยพยาบาล) และ deadline ต่างกัน
- สำหรับนักกีฬาโควตา ต้องเพิ่ม step ตรวจหนังสือรับรองผลงานกีฬา (สมาคม/กกท.) ก่อนยืนยันสิทธิ์
- นักศึกษาใหม่บางส่วนอายุ < 18 ปี (เข้าเรียนเร็ว) ⇒ ต้องมี guardian consent flow แม้ในระดับอุดมศึกษา

### Gaps
- ไม่พบเอกสารรายงานตัวของ TNSU โดยตรง (วิทยาเขตใดก็ตาม); ค่าธรรมเนียมแรกเข้าของ มกช. ไม่พบ
- ไม่พบแหล่งยืนยันรูปแบบ provisioning M365/Google และ Wi-Fi ของมหาวิทยาลัยไทย (search ไม่คืนผล)
- ไม่พบ SLA ออกบัตรนักศึกษาร่วมธนาคาร

---

## 2. Registrar e-petitions catalogue (คำร้อง)

### Takeaway
มหาวิทยาลัยไทยมีคำร้องทะเบียนประมาณ 20–40 ประเภท ผู้อนุมัติมาตรฐานคือ อาจารย์ที่ปรึกษา → (อาจารย์ผู้สอน ถ้าเกี่ยวกับรายวิชา) → หัวหน้าภาค/ประธานหลักสูตร → คณบดี → งานทะเบียน; หลายคำร้อง "สมบูรณ์เมื่อชำระเงินแล้ว" (ลาพัก/รักษาสภาพ) และมี deadline นับจากวันเปิดภาค (เช่น SUT ลงเกิน/ต่ำกว่าเกณฑ์ภายใน 10 วัน) ตารางรวมอยู่ใน §9

### Cited Findings
- KU: ขอลงทะเบียนเกิน 22 หน่วยกิต (ไม่เกิน 25) ภาคปกติ ได้เฉพาะนิสิตเทอมสุดท้ายที่คาดว่าจะจบ ต้องผ่าน อาจารย์ที่ปรึกษา → หัวหน้าภาควิชา → คณบดี; ฤดูร้อนเกิน 7 หน่วยกิต ✅ — [AskMe KU](https://askme.ku.th/support/solutions/articles/60000710500)
- SUT: คำร้องลงทะเบียนต่ำ/เกินหน่วยกิต (ท.16) ยื่นภายใน 10 วันนับจากเปิดภาค ✅ — [SUT step form](http://sutgateway.sut.ac.th/ces/stepform2/11_T_E.pdf); SUT มีระบบคำร้อง online ให้อาจารย์ผู้สอนและอาจารย์ที่ปรึกษาอนุมัติ รวมลงทะเบียนเพิ่มกรณีกลุ่มเต็ม และถอนรายวิชา (W) ✅ — [SUT online petition (student)](https://sutgateway.sut.ac.th/ces/2944/), [SUT approval (advisor)](https://sutgateway.sut.ac.th/ces/2886/)
- NPRU มีระบบคำร้องออนไลน์ 8 คำร้อง รวม ขอเรียนร่วม, เปิดหมู่เรียนพิเศษ, แจ้งสอบซ้อน ✅ — [NPRU e-request](https://academic.npru.ac.th/en/request/)
- KPRU: "05 - ขอเปิดรายวิชาเรียน | Online" ✅ — [KPRU forms](https://reg.kpru.ac.th/th/base_form.asp)
- YRU: แบบฟอร์มคำร้องรวม ลงทะเบียนเกิน 22 หน่วยกิต, เทียบโอนผลการเรียน (นอกระบบ), ขอย้ายสถานศึกษา ✅ — [YRU forms](https://acdservice.yru.ac.th/page/27)
- ค่ารักษาสภาพ (ต่อภาค): KMUTT ป.ตรี 800 บาท / ป.โท-เอก 1,600 บาท; คำร้องสมบูรณ์เมื่อชำระเงินแล้ว ✅ — [KMUTT ลาพัก](https://regis.kmutt.ac.th/pstudent/Maintain2-58.pdf); RU บัณฑิตวิทยาลัย 2,500 บาท ✅ — [RU](https://vl.ru.ac.th/index.php/student-service-2/guideline/preservation-resign); STOU 500 บาท ✅ — [STOU](https://www.stou.ac.th/offices/ore/rere/goto/page50); CMU บัณฑิต 5,000 บาท/ภาค และผ่าน อาจารย์ที่ปรึกษา → ภาค/สำนักวิชา → บัณฑิตวิทยาลัย ✅ — [CMU](https://www.reg.cmu.ac.th/webreg/reg-files/reg-absent-G.pdf)
- CU: ลาพักได้ครั้งละไม่เกิน 2 ภาคการศึกษาติดต่อกัน ต้องการต่อให้ยื่นใหม่ ✅ — [CU reg onleave](https://www.reg.chula.ac.th/th/student/studenthandbook/onleave/)
- MBU: การอนุมัติลาพัก/รักษาสภาพ/คืนสภาพ สมบูรณ์เมื่อชำระค่าธรรมเนียมที่เกี่ยวข้อง ✅ — [MBU](https://www.mbu.ac.th/uncategorized/post-10360/); WU แบบฟอร์มลาพัก/รักษาสภาพ ระบุที่อยู่ระหว่างลาพักและหลักฐานชำระเงิน ✅ — [WU tn_6](https://ces.wu.ac.th/registrar/form/tn_6.pdf)
- เปลี่ยนชื่อ-สกุล: Mahidol Science ใช้ ใบคำร้อง + หลักฐานการเปลี่ยนชื่อ + หลักฐานชำระค่าธรรมเนียม ยื่นที่ภาควิชา/งานการศึกษา ใช้เวลา ~2–3 สัปดาห์กว่าข้อมูลจะเปลี่ยนในระบบ ✅ — [MU SCED SIPOC](https://science.mahidol.ac.th/sced/wp-content/uploads/2026/02/SCED-5-05-SIPOC.pdf); STOU ใช้ใบตัวอย่างลายมือชื่อ + สำเนาใบสำคัญการสมรส/หนังสือเปลี่ยนชื่อ ✅ — [STOU OGS](https://ogs.stou.ac.th/wp-content/uploads/2025/08/324c5d8082bc7e92d90e87b9fdb25580.pdf)
- ผ่อนผัน/แบ่งชำระ: KMUTT SIT รับคำร้องผ่อนผันออนไลน์สำหรับผู้มีปัญหาการเงิน ต้องชำระภายในวันที่กำหนดหลังอนุมัติ ✅ — [KMUTT SIT 2567](https://www.sit.kmutt.ac.th/wp-content/uploads/2024/05/20240513-1-2567.pdf); RSU แบ่งชำระมีเงื่อนไข: ไม่ใช่ปี 1 เทอม 1, GPAX ขั้นต่ำ, สัญชาติไทย ✅ — [RSU](https://registrar.rsu.ac.th/doc/MAN_UF-RSU67-REG-03.นักศึกษา-คำร้องแบ่งชำระค่าลงทะเบี.pdf)
- TNSU มหาสารคาม: คำร้องขอสำเร็จการศึกษา ยื่นภายใน 30 วันหลังเปิดภาคสุดท้าย, GPAX ≥ 2.00, ความประพฤติดี (ตรวจโดยฝ่ายกิจการนักศึกษา) ✅ — [TNSU MK request-graduation](https://www.tnsumk.ac.th/reg/index.php/services/registrar-services/request-graduation)

### Inferences
- คำร้องแบ่งเป็น 4 กลุ่ม workflow pattern: (A) **รายวิชา** (ผู้สอน+ที่ปรึกษา), (B) **สถานภาพ** (ที่ปรึกษา→คณบดี→ทะเบียน + payment gate), (C) **การเงิน** (ที่ปรึกษา→คณบดี→กองคลัง), (D) **เอกสาร** (ทะเบียนอย่างเดียว + payment gate) ⇒ ใช้ approval-chain template 4 แบบครอบคลุมเกือบทั้งหมด
- "Payment gate" (คำร้องไม่สมบูรณ์จนกว่าจ่าย) และ "deadline relative to term start" เป็น attribute ที่ต้องมีใน form definition

### Gaps
- ไม่พบรายการคำร้องของ TNSU ส่วนกลาง/วิทยาเขตกรุงเทพ และอัตราค่าธรรมเนียมคำร้องของ มกช. (นอกจากใบรับรอง 50 บาท)
- ไม่พบแหล่งเรื่องคำร้องขอ I / ย้ายสาขา / คืนเงินค่าลงทะเบียน (search ไม่คืนผล) — ใน §9 ระบุเป็น 🟡

---

## 3. Documents & credentials (transcript, ใบรับรอง, e-Transcript, verification)

### Takeaway
ค่าธรรมเนียมเอกสารทั่วไปอยู่ที่ 50 บาท/ฉบับ (นักศึกษาปัจจุบัน) – 100 บาท (ศิษย์เก่า) ใบแทน/ใบแปลปริญญา 100–600 บาท; e-Transcript เป็น PDF ลงลายมือชื่อดิจิทัลที่ผู้รับตรวจได้เองด้วย Adobe Reader; ชำระด้วย Thai QR ทุกแห่ง TNSU MK: ใบรับรอง 50 บาท อายุ 60 วัน ผ่านผู้ช่วยอธิการบดีฝ่ายวิชาการ + รองอธิการบดีประจำวิทยาเขต

### Cited Findings
- TNSU MK: ยื่นคำร้องที่งานทะเบียนและประมวลผล → ผู้ช่วยอธิการบดีฝ่ายวิชาการ → รองอธิการบดีประจำวิทยาเขต; ใบรับรองมีอายุ 60 วันนับแต่วันออก; ฉบับละ 50 บาท ✅ — [TNSU MK certificate](https://tnsumk.ac.th/reg/index.php/services/registrar-services/certificate-thai)
- TNSU MK: สำเร็จการศึกษาสมบูรณ์เมื่อสภามหาวิทยาลัยอนุมัติปริญญา; transcript ออกหลังคณะกรรมการรับรองบัญชีผู้สำเร็จ; ใบรับรองคุณวุฒิออกหลังสภาฯ อนุมัติ ✅ — [TNSU MK important-document](https://www.tnsumk.ac.th/reg/index.php/services/registrar-services/important-document); มีหน้า "ขอเอกสารสำคัญทางการศึกษา" ✅ — [TNSU MK request-documents](https://www.tnsumk.ac.th/reg/index.php/request-documents); เวลาทำการ จ.–ศ. 08:30–16:30 ✅ — [TNSU MK reg](https://www.tnsumk.ac.th/reg/)
- Mahidol: เอกสารทั่วไป (transcript, หนังสือรับรองคุณวุฒิ, หนังสือรับรองการเป็นนักศึกษา) 50 บาท/ฉบับ; ใบแปลปริญญา/ใบแทนปริญญา 100 บาท; SLA เอกสารทั่วไป ≤ 9 วันทำการ, ใบแทนปริญญา ~1 เดือน ✅ (snippet) — [Mahidol OSS manual](https://op.mahidol.ac.th/ea/wp-content/uploads/) (URL ยาว ดูผลค้นหา "กระบวนการออกเอกสารสำคัญทางการศึกษา oss.pdf"); Mahidol OSS: ชำระโดยสแกน QR แล้ว upload ผ่าน link ใน e-mail สรุปค่าธรรมเนียม ✅ — [MUAA One Stop Service](https://muaa.mahidol.ac.th/onestopservice/)
- RU: transcript ผู้สำเร็จ 100 บาท / ผู้กำลังศึกษา 50 บาท ชำระด้วย QR เท่านั้น ✅ — [RU transcript](http://www.regis.ru.ac.th/index.php/11-graduation_request/37-transcript-download)
- KU: ใบแทนปริญญาบัตร 500 บาท/ฉบับ, ใบแปลปริญญา (EN→TH) 600 บาท, ชำระผ่าน QR; KU มี "เอกสารสำคัญทางการศึกษาแบบ Online" ✅ — [KU onlinedoc](https://registrar.ku.ac.th/onlinedoc)
- RBRU e-Transcript: PDF แนบ Certificate ของ Digital Signature ป้องกันการแก้ไข; ผู้รับตรวจ signature ได้ด้วยซอฟต์แวร์พื้นฐาน (Adobe Acrobat Reader) โดยไม่ต้องติดต่อมหาวิทยาลัย ✅ — [RBRU E-Transcript](https://e-transcript.rbru.ac.th/)
- SWU: e-Transcript สำหรับศิษย์เก่า ป.ตรี ที่จบตั้งแต่ปีการศึกษา 2563 และสมัครศิษย์เก่าสัมพันธ์แล้ว ดาวน์โหลดผ่านระบบ Supreme ชำระ QR ✅ — [SWU certificate](https://edservices.op.swu.ac.th/certificate)
- SSRU: Digital Transcript ฉบับสมบูรณ์ TH/EN ฟรี; ฉบับไม่สมบูรณ์สำหรับผู้ไม่มีสภาพนักศึกษา 100 บาท (snippet ระบุแหล่งไม่ชัด — ต้องตรวจ) 🟡/✅ — [SSRU digital transcript manual](https://ranong.ssru.ac.th/useruploads/files/20220924/18319f4f9bf924695db28defabb2bd5fb054f1f0.pdf)
- Digital Transcript ทำให้ไม่ต้องเดินทางไปขอที่ฝ่ายทะเบียน (บทความ 2565) ✅ — [ฐานเศรษฐกิจ](https://www.thansettakij.com/economy/513015)
- RMUTT มีคู่มือขั้นตอนการขอและการรับเอกสาร ✅ — [RMUTT SSC](https://oreg.rmutt.ac.th/SSC/?p=85)

#### Process table: ขอเอกสารทางการศึกษา

| # | Actor | Action | Documents | Fee | SLA | System support | Status |
|---|---|---|---|---|---|---|---|
| 1 | นักศึกษา/ศิษย์เก่า | เลือกประเภทเอกสาร, ภาษา (TH/EN), จำนวน, รูปแบบ (paper / digital PDF), วิธีรับ (counter / ไปรษณีย์ EMS / download) | – (ศิษย์เก่า: ยืนยันตัวตน ThaID/บัตร ปชช.) | 50 บาท (TNSU MK ใบรับรอง) ; transcript 50–100 | – | e-Document request portal (ศิษย์เก่าต้อง login ได้ด้วย) | ✅ |
| 2 | ระบบ | ตรวจ hold: หนี้ค้าง, ยังไม่เคลียร์ห้องสมุด/หอพัก → block | – | – | ทันที | Hold/obligation service | 🟡 (CityU ใช้หลักนี้ แต่ไม่ใช่ไทย) |
| 3 | นักศึกษา | ชำระด้วย Thai QR (+ค่าส่ง EMS ถ้าเลือก) | – | ตามประเภท | – | Payment gateway + auto-confirm (ลด step upload slip แบบ Mahidol) | ✅ |
| 4 | งานทะเบียน | Generate เอกสาร → ผู้มีอำนาจลงนาม (TNSU MK: ผช.อธิการฯ วิชาการ → รองอธิการฯ วิทยาเขต) | template | – | Mahidol ≤ 9 วันทำการ; 🟡 เป้าหมาย digital ≤ 1 วันทำการ | Doc generation + e-Signature (PAdES, CA ที่ ETDA รับรอง) + QR verify | ✅ |
| 5 | ระบบ | ส่ง notification พร้อม link download / tracking EMS | – | – | – | Notify + EMS tracking no. | 🟡 |
| 6 | ผู้รับเอกสาร (นายจ้าง/สถาบันอื่น) | ตรวจสอบความถูกต้อง: เปิด PDF ตรวจ signature หรือสแกน QR → verify page | – | ฟรี | ทันที | Public verification endpoint (hash + doc id), รองรับ revoke | ✅ (RBRU) |

ประเภทเอกสาร (catalogue ที่ระบบควรรองรับ — 🟡 รวบรวมจากแนวปฏิบัติทั่วไป ยกเว้นที่มี ✅ ข้างบน): Transcript ฉบับไม่สมบูรณ์ (ระหว่างศึกษา) TH/EN · Transcript ฉบับสมบูรณ์ (จบแล้ว) TH/EN · หนังสือรับรองการเป็นนักศึกษา TH/EN (ใช้ผ่อนผันทหาร/วีซ่า/ทุน) · หนังสือรับรองความประพฤติ · หนังสือรับรองคาดว่าจะสำเร็จการศึกษา · หนังสือรับรองสำเร็จการศึกษา/คุณวุฒิ (หลังสภาฯ อนุมัติ) · หนังสือรับรองค่าใช้จ่าย (ลดหย่อน/เบิกต้นสังกัด) · หนังสือรับรองลำดับที่/GPA · ใบแทนปริญญาบัตร · ใบแปลปริญญาบัตร · หนังสือรับรองการขอตัวไปแข่งขัน (เฉพาะนักกีฬา, 🟡) · Activity transcript (§5)

### Inferences
- TNSU ใช้ "อายุใบรับรอง 60 วัน" ⇒ digital document ควรมี `valid_until` และ verify page แสดงว่าหมดอายุ
- ค่าเอกสาร digital ควรต่ำกว่า paper (SSRU ให้ฉบับสมบูรณ์ digital ฟรี) เพื่อลดภาระ counter

### Gaps
- ไม่พบค่าธรรมเนียม transcript / ใบแทนปริญญาของ มกช.
- ไม่ได้ยืนยันว่า มกช. มี e-Transcript แล้วหรือไม่

---

## 4. Dormitory lifecycle (หอพัก มหาวิทยาลัย + หอนอนโรงเรียนกีฬา)

### Takeaway
หอพักมหาวิทยาลัยไทยมีวงจร: สมัคร/จอง online (แยกปี 1 vs ปี 2+) → จัดสรร → ชำระค่าหอ+ค่าประกันของเสียหาย → เข้าพัก → แจ้งซ่อม online/QR → บิลค่าไฟรายเดือนต่อห้อง → สละสิทธิ์/ย้ายออก (คืนประกันหักความเสียหาย) โรงเรียนประจำ (ผู้เยาว์) เพิ่ม: เอกสารยินยอมผู้ปกครองกำหนดสิทธิ์กลับบ้าน, บันทึกคำขอในระบบ → รับบัตรอนุญาตจากครูหอ → คืนบัตรตามเวลา, เวลาเยี่ยมจำกัด และรายงานพฤติกรรมให้ผู้ปกครองรายเดือน

### Cited Findings
- KKU: ระบบจองหอพักออนไลน์ / พิมพ์ใบแจ้งหนี้ค่าหอพัก; ใบสมัครแยก นักศึกษาใหม่ vs ปี 2 ขึ้นไป; มีใบคำร้องสละสิทธิ์การเข้าพัก ✅ — [KKU dorm booking](https://dorm-booking.kku.ac.th/content/2), [KKU dorm](https://dorm.kku.ac.th/)
- KKU I-SERVICE: แจ้งซ่อมออนไลน์, จองหอ, พิมพ์ใบจ่ายค่าหอ, แจ้งรับพัสดุ ✅ — [KKU dorm](https://dorm.kku.ac.th/)
- UDRU: แจ้งปัญหาผ่าน QR Code และติดตามสถานะได้ (แอร์, ประตู/หน้าต่าง, น้ำ/ไฟ) ✅ — [UDRU งานหอพัก](https://sdd.udru.ac.th/student-serviced/?cat=5)
- YRU คู่มือหอพัก: ค่าประกันของเสียหาย 1,000 บาท/คน ทุกประเภท; ค่าไฟรายเดือนต่อห้อง 5 บาท/หน่วย; นักศึกษารับผิดชอบค่าซ่อมจากการกระทำของตน (ปีเอกสารไม่ทราบ) ✅ — [YRU dorm manual](https://stddev.yru.ac.th/th/file/013_dormirtory.pdf)
- SUT มีหน้าแบบฟอร์มต่าง ๆ ของหอพัก ✅ — [SUT dorm forms](https://dorm.sut.ac.th/index.php?Itemid=79&id=70&option=com_content&view=article); Mahidol มีหน้าแสดงรูปแบบห้อง อัตรา และกฎระเบียบ ✅ — [MU dorm](https://op.mahidol.ac.th/sa/en/mahidoldorm/)
- MWIT (โรงเรียนประจำ): กลับบ้านตามปฏิทินโรงเรียน; กลับเองหรือผู้ปกครองรับตามที่ผู้ปกครองระบุใน **เอกสารแสดงความยินยอมการออกนอกบริเวณ**; นักเรียนบันทึกคำขอในระบบ → รับบัตรอนุญาตออกนอกบริเวณจากครูหอพัก → คืนบัตรภายในเวลาที่กำหนด; ห้ามเปลี่ยนเตียง/ตู้โดยไม่ได้รับอนุญาต ✅ — [MWIT dorm rules 2565](https://www.mwit.ac.th/html/mwitDoc/CG/regulations/stu-rule_65.pdf)
- โรงเรียนประจำอื่น: กลับบ้านได้ทุกสัปดาห์ แจ้งความประสงค์ไว้กับหอ และต้องแจ้งครูผู้ดูแลเป็นลายลักษณ์อักษรทุกครั้ง; บางแห่งไม่อนุญาตเยี่ยม/รับออกในวันเปิดเรียน; เวลาเยี่ยม ส.–อา./นักขัตฤกษ์ 09:00–17:00; โรงเรียนกำหนดตารางรับ-ส่งต่อภาคเรียน; หอแห่งหนึ่งรายงานพฤติกรรม + การขออนุญาตออกให้ผู้ปกครองทุกเดือน ✅ (snippet รวมหลายแหล่ง) — [Thewphaingarm Boarding Guidelines](https://www.thewphaingarm.com/boardingguidelines), [KKD family policy](https://www.kkdfamily.com/policy/), [NSWSSK แนวปฏิบัติขออนุญาตออก](http://www.nswssk.ac.th/index.php/khxmul-laea-sarsnthes/fay-kickar-nakreiyn/naewthang-ptibati-tam-rabeiyb-rongreiyn/naew-ptibati-ni-kar-khx-xnuyat-xxk-nxk-rongreiyn), [SWRY แผนภูมิหอพักนักเรียนประจำ](http://www.swry.ac.th/_files_school/21100226/data/21100226_1_20130603-143203.pdf)

#### Process table: Dormitory lifecycle

| # | Phase | Actor | Action | Docs / data | Fee | SLA | System support | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | Application | นักศึกษา (ปี 1 ผ่าน onboarding / ปี 2+ รอบจอง) | สมัคร/จอง online, เลือกประเภทห้อง, ความต้องการพิเศษ (disability, นักกีฬาชนิดกีฬา/เวลาซ้อม) | ใบสมัคร | – | รอบตามปฏิทิน | Booking with quota per gender/ปี/นักกีฬา | ✅ (KKU) |
| 2 | Allocation | งานหอพัก | จัดสรร (priority: ปี 1, ภูมิลำเนาไกล, นักกีฬาทีมชาติ, รายได้น้อย 🟡), ประกาศผล | – | – | 🟡 ก่อนเปิดภาค 2 สัปดาห์ | Allocation engine + manual override + waitlist | 🟡 |
| 3 | Contract/Payment | นักศึกษา (ผู้เยาว์: ผู้ปกครองลงนาม) | ยอมรับระเบียบ/สัญญา (e-sign), ชำระค่าหอ + ค่าประกัน | สัญญา | ค่าประกัน 1,000 บาท (YRU) | ภายในกำหนด ไม่ชำระ = สละสิทธิ์ | e-contract + Thai QR invoice | ✅ (YRU fee, KKU invoice) |
| 4 | Check-in | เจ้าหน้าที่หอ | ส่งมอบกุญแจ/คีย์การ์ด, ตรวจสภาพห้อง + ภาพถ่าย (inventory), จดมิเตอร์เริ่มต้น | check-in form | – | วันเข้าพัก | Mobile check-in + photo inventory | 🟡 |
| 5 | Living: repairs | นักศึกษา → ช่าง | แจ้งซ่อมผ่าน app/QR ประจำห้อง, ติดตามสถานะ, ประเมินความพึงพอใจ | ภาพ | ฟรี (เสียหายจากผู้พัก = เรียกเก็บ) | 🟡 ด่วน 24 ชม./ปกติ 3 วันทำการ | Ticketing + SLA timer | ✅ (KKU, UDRU) |
| 6 | Living: utilities | งานหอ → นักศึกษา | จดมิเตอร์ไฟ/น้ำ รายเดือนต่อห้อง → แบ่งต่อคน → ออกบิล | – | 5 บาท/หน่วย (YRU) | รายเดือน | Meter reading (OCR/smart meter) + billing + dunning | ✅ |
| 7 | Living: parcel | ห้องพัสดุ | รับพัสดุ แจ้งเจ้าของ | – | – | – | Parcel notify | ✅ (KKU) |
| 8 | Rules/discipline | ครูหอ/อาจารย์หอ | บันทึกการฝ่าฝืน (กลับเกินเวลา, พาบุคคลภายนอก, เปลี่ยนเตียง) → ตัดคะแนน → ตักเตือน/แจ้งผู้ปกครอง/ส่งกรรมการวินัย | incident | ค่าปรับ 🟡 | – | Incident log + point system | ✅ (MWIT rules) / 🟡 points |
| 9 | Leave/exeat (ผู้เยาว์) | นักเรียน → ผู้ปกครอง → ครูหอ | บันทึกคำขอ → ผู้ปกครอง approve (ตาม consent ที่ระบุไว้: กลับเอง/มารับ) → ครูหอออกบัตร/QR อนุญาต → ตรวจออก-เข้า → คืนบัตรตามเวลา; เกินเวลา → alert | consent form ต่อปี | – | ต้องกลับก่อนเวลาที่กำหนด | LeavePass + guardian e-approval + overdue alert (มีใน design เดิม) | ✅ (MWIT) |
| 10 | Visitor log | ป้อม/ครูหอ | ลงทะเบียนผู้มาเยี่ยม (บัตร ปชช.), ตรวจกับรายชื่อผู้ได้รับอนุญาตที่ผู้ปกครองกำหนด, เวลาเยี่ยม ส.–อา. 09:00–17:00 | บัตร ปชช. | – | – | Visitor register + authorised pickup list + photo | ✅ (snippet) |
| 11 | Reporting | หอ → ผู้ปกครอง | รายงานพฤติกรรม + ประวัติออกนอกรายเดือน | – | – | รายเดือน | Parent app monthly digest | ✅ (snippet) |
| 12 | Check-out | นักศึกษา + เจ้าหน้าที่ | ยื่นคำร้องย้ายออก/สละสิทธิ์ → ตรวจห้องเทียบ inventory → หักค่าเสียหาย → คืนประกัน → clearance flag สำหรับจบการศึกษา | คำร้องสละสิทธิ์ | หักค่าเสียหาย | 🟡 คืนเงิน 30 วัน | Clearance hold → graduation (§6) | ✅ (KKU สละสิทธิ์) / 🟡 |

### Inferences
- Exeat ของโรงเรียนกีฬาควรอิง "standing consent" ต่อปีจากผู้ปกครอง (แบบ MWIT) + per-trip approval เฉพาะกรณีนอกปฏิทิน เพื่อลดภาระผู้ปกครอง
- หอนักกีฬาควรผูกกับตารางซ้อม/เก็บตัว (ไม่อยู่หอ = ไม่ต้องลงชื่อเข้า curfew) — 🟡

### Gaps
- ไม่พบระเบียบหอพัก/อัตราค่าหอของ มกช. และโรงเรียนกีฬาโดยตรง
- ไม่พบระบบตัดคะแนนความประพฤติหอพักมหาวิทยาลัยไทยในผลค้นหา

---

## 5. Student affairs (กิจกรรม, ชมรม, สโมสร, วินัย, ให้คำปรึกษา, สุขภาพ, ประกัน, คนพิการ, ทุน/จ้างงาน, อาชีพ, ผ่อนผันทหาร/รด.)

### Takeaway
งานที่มีขั้นตอนชัดเจนและใช้ระบบหนักที่สุดคือ (1) ผ่อนผันทหาร (ยื่นครั้งเดียว ผ่อนผันถึงจบ แต่ต้องไปแสดงตนตาม สด.35 ทุกปี), (2) ชั่วโมงจิตอาสา กยศ. ≥ 36 ชม./ปีการศึกษาสำหรับผู้กู้รายเก่า, (3) เบิกประกันอุบัติเหตุ (สำรองจ่าย เก็บใบเสร็จ) ระบบต้องมี activity ledger ที่ใช้ได้ทั้ง activity transcript และเกณฑ์ กยศ.

### Cited Findings
- ผ่อนผันทหาร เอกสาร: สำเนา สด.9 หน้า-หลัง 2 ฉบับ, สำเนาหมายเรียก สด.35 หน้า-หลัง 2 ฉบับ, สำเนาบัตร ปชช./ทะเบียนบ้าน, หนังสือรับรองการเป็นนักศึกษาฉบับจริง TH 1 ฉบับ; บางแห่งขอ transcript สำหรับภาคพิเศษ ✅ — [SWU MilitaryServicePostponement](https://studentaffairs.op.swu.ac.th/MilitaryServicePostponement), [RMUTL 2569](https://e-cms.rmutl.ac.th/assets/upload/files/2025/07/20250704142936_65303.pdf), [RMUTT](https://sd.rmutt.ac.th/?page_id=1647)
- ช่วงยื่น: ติดต่อก่อนตรวจเลือก 3–4 เดือน หรือ ธ.ค.–ม.ค. และตรวจผลได้ มี.ค. (แหล่งหนึ่ง); อีกแหล่ง ก.ย.–พ.ย. ทุกปี ✅ (แหล่งขัดกัน ต้องยึดประกาศปีปัจจุบัน) — [Chula Arts](https://www.arts.chula.ac.th/student_affairs/?page_id=790), [RMUTL Chiang Rai](https://chiangrai.rmutl.ac.th/page/Soldier?lang=th), [BRU 2569](https://www.bru.ac.th/postponement-military-2569/)
- ยื่นครั้งเดียว ผ่อนผันได้จนสำเร็จการศึกษา แต่ต้องไปแสดงตนตาม สด.35 ทุกปี; ไม่แสดงตน = หลีกเลี่ยงขัดขืน โทษจำคุกไม่เกิน 3 ปี; สิทธิ์สิ้นสุดเมื่อพ้นสภาพ/จบ/อายุเกิน 26 ปี ✅ — [NU sa](https://www.sa.nu.ac.th/?page_id=20672), [PSRU](https://sas.psru.ac.th/index.php/student-services/military-waiver-service/), [Western](https://www.western.ac.th/pages/student-services-bachelor-s-degree-interdisciplinary-college-request-for-a-waiver-of-military-service)
- กยศ.: ผู้กู้รายเก่าที่เลื่อนชั้นต้องทำกิจกรรมเพื่อสังคม ≥ 36 ชม./ปีการศึกษา + ผ่านหลักสูตรภาคบังคับด้านทักษะการเงิน; ผู้กู้รายใหม่ไม่กำหนดชั่วโมง; กิจกรรมต้องไม่เป็นส่วนหนึ่งของผลการเรียน ✅ — [กยศ.](https://www.studentloan.or.th/th/highlight/1604025515), [SU KSU](https://dsa.su.ac.th/ksu/?p=9860), [PSRU](https://sas.psru.ac.th/index.php/psruloan/psruloan-volunteer/)
- นับชั่วโมงตามเกียรติบัตร; บางแห่งกำหนด 3–18 ชม./รหัสโครงการ และไม่เกิน 6 ชม./วัน; บางแห่งบันทึกผ่านระบบ SCMS ให้อาจารย์ที่ปรึกษาอนุมัติ ✅ — [SDU guidance 2569](https://guidance.dusit.ac.th/WEB/2026/04/11056), [SPU volunteer](https://www.spu.ac.th/volunteer/), [KMUTNB](https://sa.op.kmutnb.ac.th/jit-ar-sa/)
- ประกันอุบัติเหตุ: CMU จัดให้ทุกคน; UTCC มีประกาศเบิกค่ารักษาจากอุบัติเหตุปี 2569 (แนวทาง: สำรองจ่ายบางกรณี เก็บใบเสร็จ) ✅ — [CMU](https://web.sdd.oou.cmu.ac.th/service/accident), [UTCC](https://www.utcc.ac.th/utcc-student-accident-insurance-claim-2026/), [PCRU](https://dsd.pcru.ac.th/dsd2018/การประกันอุบัติเหตุ/)
- TNSU MK: ความประพฤติเป็นเงื่อนไขขอจบ ตรวจโดยฝ่ายกิจการนักศึกษา ✅ — [TNSU MK](https://www.tnsumk.ac.th/reg/index.php/services/registrar-services/request-graduation)

#### Process tables (สรุปต่อบริการ)

| บริการ | ขั้นตอนหลัก (actor → action) | เอกสาร | ค่าธรรมเนียม | SLA/รอบ | System support | Status |
|---|---|---|---|---|---|---|
| ผ่อนผันทหาร | นศ.ชาย อายุ 20 รับ สด.35 ที่ภูมิลำเนา → ยื่นคำร้อง online + upload → กองพัฒนานศ. ตรวจ → รวบรวมบัญชีรายชื่อส่งสัสดี/กระทรวงกลาโหม → ประกาศผล → เตือนไปแสดงตนทุกปี | สด.9, สด.35 (2 ชุด), บัตร ปชช., ทะเบียนบ้าน, หนังสือรับรองนักศึกษา | 🟡 ฟรี (ค่าหนังสือรับรอง 50) | รอบปีละครั้ง (ธ.ค.–ม.ค. หรือ ก.ย.–พ.ย. ตามประกาศ) | eligibility check (เพศ/อายุจากวันเกิด) + annual reminder + auto ออกหนังสือรับรอง | ✅ |
| นักศึกษาวิชาทหาร (รด.) | สมัคร/รายงานตัวตามประกาศ นรด. → ฝึก → ขอรับรองผล | 🟡 | 🟡 | ปีละครั้ง | ลิงก์ข้อมูล, reminder | 🟡 (NU มีหน้า รด. แต่ไม่ได้ดึงรายละเอียด) |
| กิจกรรม / activity transcript | ผู้จัด (สโมสร/ชมรม/คณะ) เสนอโครงการ → อนุมัติ (อ.ที่ปรึกษาชมรม → กองพัฒนาฯ) → เปิดลงทะเบียน → QR check-in/out → ผู้จัดยืนยัน → บันทึกชั่วโมง/หมวด → ออก activity transcript | โครงการ, รายชื่อ | – | real-time | Activity ledger (หมวด: บังคับ/เลือก/จิตอาสา กยศ.), เกียรติบัตร auto | ✅ (กยศ. rules) / 🟡 QR |
| จิตอาสา กยศ. | นศ. เข้าร่วม → ได้เกียรติบัตร → (บางแห่ง อ.ที่ปรึกษาอนุมัติ) → สรุป ≥36 ชม. → ใช้ยื่นกู้ปีถัดไป | เกียรติบัตร, แบบบันทึก | – | ก่อนยื่นกู้ | flag "ไม่ครบ 36 ชม." + export ให้ DSL กยศ. | ✅ |
| ชมรม / สโมสรนักศึกษา | สมัครสมาชิก → เลือกตั้งนายกสโมสร/สภานักศึกษา (e-voting) → ขออนุมัติงบโครงการ → เคลียร์งบ | – | – | ปีละครั้ง (เลือกตั้ง) | Club registry, e-voting, budget request | 🟡 |
| วินัยนักศึกษา | รับเรื่อง (อาจารย์/รปภ./หอ) → สอบข้อเท็จจริง → กรรมการวินัย → ลงโทษ (ว่ากล่าว/ทัณฑ์บน/ตัดคะแนน/พักการเรียน/พ้นสภาพ) → อุทธรณ์ → ผลต่อ "ความประพฤติ" ตอนขอจบ | บันทึกเหตุ | – | 🟡 | Case mgmt (restricted access) → hold | ✅ (ความประพฤติเป็นเงื่อนไขจบ TNSU) / 🟡 ขั้นตอน |
| ให้คำปรึกษา / สุขภาพจิต | นัดหมาย app (anonymous ได้) → นักจิตวิทยา → ส่งต่อ รพ./1323 | – | ฟรี | 🟡 นัดภายใน 3 วัน, วิกฤติทันที | Booking + crisis button + confidential notes | 🟡 |
| ห้องพยาบาล / sports medicine | walk-in/นัด → บันทึกการรักษา → ส่งต่อ → ลาป่วยอัตโนมัติ (ใบรับรองแพทย์) | – | ฟรี | – | Clinic EMR-lite (แยกจาก athlete medical) | 🟡 |
| เบิกประกันอุบัติเหตุ | เกิดเหตุ → รักษา (รพ.คู่สัญญาไม่ต้องสำรอง / อื่นสำรองจ่าย) → ยื่นใบเสร็จ + ใบรับรองแพทย์ + แบบเคลม → กองพัฒนาฯ ส่งบริษัท → โอนเงิน | ใบเสร็จฉบับจริง, ใบรับรองแพทย์, สำเนาบัตร, บัญชีธนาคาร | – | 🟡 ยื่นภายใน 30–90 วัน; โอน 15 วันทำการ | Claim form + upload + status | ✅ (CMU/UTCC มีบริการ) / 🟡 รายละเอียด |
| บริการนักศึกษาพิการ (DSS) | ลงทะเบียนพร้อมเอกสารรับรองความพิการ → แผนการช่วยเหลือรายบุคคล (เวลาสอบเพิ่ม, ผู้ช่วย) → แจ้งอาจารย์ผู้สอน → ขอเงินอุดหนุน สป.อว. 🟡 | บัตรคนพิการ/ใบรับรองแพทย์ | – | ต้นภาค | Accommodation flags ส่งไป exam scheduling | 🟡 |
| ทุนการศึกษา | ประกาศทุน → สมัคร online + เอกสารรายได้ → คณะกรรมการคัดเลือก/สัมภาษณ์ → ประกาศ → ทำสัญญา → เบิกจ่าย → รายงานผลการเรียน/ชั่วโมงตอบแทน | หนังสือรับรองรายได้, transcript | – | รอบละภาค | Scholarship module + eligibility rules (GPAX, ผลงานกีฬา) | 🟡 |
| จ้างงานนักศึกษา (part-time) | หน่วยงานเปิดตำแหน่ง → นศ.สมัคร → บันทึกชั่วโมง → หน่วยงานรับรอง → เบิกค่าตอบแทนรายเดือน | timesheet | – | รายเดือน | Timesheet + payroll export | 🟡 |
| Career services | ปฐมนิเทศก่อนจบ, job fair, resume, ฝึกงาน | – | – | – | Job board, alumni link | 🟡 |

### Inferences
- Activity ledger เดียวต้อง tag ได้หลาย purpose (graduation requirement, กยศ. 36 ชม., ทุน) และ enforce กฎ "≤ 6 ชม./วัน", "ไม่เป็นส่วนหนึ่งของผลการเรียน"
- ผ่อนผันทหารควรขับด้วย date-of-birth: ระบบรู้ล่วงหน้าว่าใครจะอายุ 20 ในปีถัดไป ⇒ ส่ง reminder ล่วงหน้า (นักกีฬาเก็บตัวต่างประเทศเสี่ยงพลาด)

### Gaps
- ไม่พบขั้นตอน รด. ฉบับเต็ม, บริการคนพิการ, ทุน/จ้างงานนักศึกษาของมหาวิทยาลัยไทยในผลค้นหานี้ (เป็น 🟡)
- ไม่พบระบบ QR check-in กิจกรรมของมหาวิทยาลัยไทยที่ยืนยันได้

---

## 6. Graduation logistics

### Takeaway
ลำดับ: ยื่นคำร้องขอสำเร็จการศึกษา (TNSU: ภายใน 30 วันหลังเปิดภาคสุดท้าย) → degree audit + ความประพฤติ → คณะกรรมการรับรองบัญชี → สภามหาวิทยาลัยอนุมัติ → ออก transcript/ใบรับรองคุณวุฒิ → ขึ้นทะเบียนบัณฑิต + แจ้งความประสงค์รับพระราชทาน (หรือไม่รับ) → จองชุดครุย → ถ่ายภาพหมู่ (วันซ้อมใหญ่) → ซ้อมย่อย/ซ้อมใหญ่ (ตั้งแถวตามรหัสบัณฑิต) → พิธี → รับปริญญาบัตร

### Cited Findings
- TNSU MK: คำร้องขอจบภายใน 30 วันหลังเปิดภาคสุดท้าย, GPAX ≥ 2.00, ความประพฤติดี ✅ — [TNSU MK request-graduation](https://www.tnsumk.ac.th/reg/index.php/services/registrar-services/request-graduation)
- TNSU MK: สภามหาวิทยาลัยอนุมัติ → จบสมบูรณ์; transcript หลังกรรมการรับรองบัญชี; ใบรับรองคุณวุฒิหลังสภาฯ ✅ — [TNSU MK important-document](https://www.tnsumk.ac.th/reg/index.php/services/registrar-services/important-document)
- PSRU: บัณฑิตทุกคนต้องลงทะเบียนผ่านระบบลงทะเบียนบัณฑิต รวมถึงผู้ไม่ประสงค์เข้ารับ ✅ — [PCRU กำหนดการซ้อม 2567](https://www.pcru.ac.th/pcrunews/view/show_news/775) (snippet ระบุ PSRU/PCRU ไม่ชัด — 🟡 ชื่อสถาบัน)
- BSRU: ผู้สำเร็จทุกคนต้องขึ้นทะเบียนบัณฑิต (บส.9) ก่อนแจ้งความประสงค์รับพระราชทาน ✅ — [BSRU](https://mis4.bsru.ac.th/registrar/Download/file_download/bsrugraduate.pdf)
- TU คู่มือ 2567: ป.ตรี แต่งชุดนักศึกษาวันซ้อม ใส่รองเท้าเหมือนวันจริง; สวมครุยพร้อมแถบสีคณะ ✅ — [TU announce10](https://tu.ac.th/app/uploads/2025/12/announce10.pdf)
- CRRU 2569: บัณฑิตที่ต้องการแต่งกายตามเพศสภาพ ดาวน์โหลดแบบฟอร์ม แนบสำเนาบัตร ปชช. ยื่นด้วยตนเองวันซ้อมวันแรกเท่านั้น ✅ — [CRRU graduate](https://rgr.crru.ac.th/graduate_crru/graduate_crru)
- PNRU: ตั้งแถวตามรหัสบัณฑิต ✅ — [PNRU ตารางซ้อม](https://std-aff.pnru.ac.th/files/002/1723721602751.pdf?_t=1723721602); KPRU: ถ่ายภาพหมู่แยกคณะ/โปรแกรม สวมครุย (คู่มือ 2555) ✅ — [KPRU handbook](https://std.kpru.ac.th/kpnnews/prnews/file/graduation_handbook%202555-2556.pdf)
- ซ้อมย่อย: ดูวีดิทัศน์ขั้นตอน ซ้อมเดิน ซ้อมรับ ญาติปกติเข้าไม่ได้ (บทความทั่วไป, ไม่ใช่ทางการ) ✅ — [mind56](https://www.mind56.com/3106)
- แบบสอบถามภาวะการมีงานทำของ สป.อว.: ผู้ตอบคือผู้สำเร็จการศึกษา และตอบภายหลังสำเร็จการศึกษา 1 ปี (ตาม definition ของชุดข้อมูล) ✅ — [MHESI Open Data](https://data.mhesi.go.th/dataset/univ_exp_11_03); มหาวิทยาลัยมีแบบสอบถามของตนเอง (Mahidol, MSU, TNI) ✅ — [Mahidol smartedu](https://smartedu.mahidol.ac.th/employment/start/classic.cshtml), [MSU 2567](https://survey.msu.ac.th/แบบสอบถาม-THEnglish%20มมส.67.pdf)

#### Process table: Graduation

| # | Actor | Action | Docs | Fee | SLA / timing | System support | Status |
|---|---|---|---|---|---|---|---|
| 1 | นักศึกษา | ยื่นคำร้องขอสำเร็จการศึกษา | – | 🟡 ค่าขึ้นทะเบียนบัณฑิต (ไม่พบอัตรา มกช.) | ≤ 30 วันหลังเปิดภาคสุดท้าย | e-petition + degree audit preview | ✅ |
| 2 | ระบบ/ทะเบียน/อ.ที่ปรึกษา | Degree audit (หน่วยกิต, GPAX ≥ 2.00, รายวิชาบังคับ, กิจกรรม, ภาษาอังกฤษ ถ้ามี) | – | – | หลังประกาศเกรดภาคสุดท้าย | Audit engine | ✅ GPAX |
| 3 | กองพัฒนานศ./หอ/ห้องสมุด/การเงิน/กยศ. | Clearance: ความประพฤติ, หนี้, หนังสือค้าง, หอพัก, ยืนยันข้อมูล กยศ. | – | – | – | Clearance checklist (multi-office sign-off) | ✅ ความประพฤติ / 🟡 อื่น |
| 4 | คณะ → กรรมการรับรองบัญชี → สภาวิชาการ → สภามหาวิทยาลัย | เสนอ/อนุมัติรายชื่อ บันทึกเลขมติ+วันที่ | บัญชีรายชื่อ | – | ตามรอบประชุมสภา (รายเดือน 🟡) | Batch approval + minute ref | ✅ |
| 5 | ทะเบียน | ออก transcript ฉบับสมบูรณ์ + ใบรับรองคุณวุฒิ (digital) | – | §3 | หลังสภาฯ | e-Doc + verify | ✅ |
| 6 | บัณฑิต | ขึ้นทะเบียนบัณฑิต + แจ้งความประสงค์รับ/ไม่รับพระราชทาน, ยืนยันชื่อสะกด TH/EN บนปริญญาบัตร, คำขอแต่งกายตามเพศสภาพ | สำเนาบัตร (กรณีเพศสภาพ) | 🟡 | ตามประกาศ | Graduand registration | ✅ (BSRU, CRRU) |
| 7 | บัณฑิต | ตอบแบบสอบถามภาวะการมีงานทำ (หลายแห่งบังคับก่อนลงทะเบียนบัณฑิต — 🟡 ไม่ยืนยัน) | – | – | – | Survey (export รูปแบบ สป.อว.) | 🟡 |
| 8 | บัณฑิต | จอง/เช่า/ซื้อชุดครุย (ร้านคู่สัญญา), ขนาด | – | 🟡 | – | link vendor / order | 🟡 |
| 9 | กองพัฒนาฯ/ผู้รับจ้างถ่ายภาพ | ถ่ายภาพหมู่ตามคณะ/สาขา + ภาพเดี่ยว | – | 🟡 | วันซ้อมใหญ่ | Schedule + seat/row assignment | ✅ |
| 10 | บัณฑิต | ซ้อมย่อย/ซ้อมใหญ่ — รายงานตัว QR, ตั้งแถวตามรหัสบัณฑิต | บัตรบัณฑิต | – | 1–3 วันก่อนพิธี | QR attendance, ลำดับที่นั่ง, ไม่ซ้อม = ไม่มีสิทธิ์เข้าพิธี 🟡 | ✅ ตั้งแถว |
| 11 | บัณฑิต | พิธีพระราชทานปริญญาบัตร | – | – | – | Live seat lookup, ประกาศ | 🟡 |
| 12 | ทะเบียน | มอบปริญญาบัตร (ผู้ไม่เข้าพิธี: มารับเอง/มอบฉันทะ/EMS) | ใบมอบฉันทะ | 🟡 ค่า EMS | 🟡 | Pickup/delivery tracking | 🟡 |

### Inferences
- "ไม่ประสงค์รับพระราชทาน" ต้องเป็น state ชัดเจน เพราะยังต้องลงทะเบียน (PSRU/BSRU) และเปลี่ยนเส้นทางรับปริญญาบัตร (step 12)
- นักกีฬาที่ติดแข่งช่วงซ้อม/พิธี ต้องมี flow ขอเลื่อน/ไม่เข้ารับ — 🟡

### Gaps
- ไม่พบค่าขึ้นทะเบียนบัณฑิต/ค่าครุย/ภาพถ่ายของ มกช.
- ยืนยันไม่ได้ว่าการตอบแบบสอบถามภาวะการมีงานทำเป็นเงื่อนไขก่อนลงทะเบียนบัณฑิต (สป.อว. definition ระบุตอบหลังจบ 1 ปี — ขัดกับความเชื่อทั่วไป ต้องตรวจ)

---

## 7. Parent/guardian interactions (มหาวิทยาลัย + โรงเรียนประจำ)

### Takeaway
ในระดับอุดมศึกษา ผู้ปกครองมีบทบาทจำกัด (ข้อมูลรายงานตัว, ลงนามสัญญาหอ/ทุน/กยศ. กรณีผู้เยาว์, ปฐมนิเทศผู้ปกครอง 🟡) และต้องผ่าน PDPA consent ของนักศึกษาที่บรรลุนิติภาวะ; ในโรงเรียนประจำ ผู้ปกครองเป็น actor หลัก: เอกสารยินยอมการออกนอกบริเวณ, รับ-ส่งตามตาราง, เยี่ยมตามเวลา, รับรายงานพฤติกรรม/การออกนอกรายเดือน

### Cited Findings
- MWIT: ผู้ปกครองระบุรูปแบบกลับบ้าน (กลับเอง/มารับ) ใน "เอกสารแสดงความยินยอมการออกนอกบริเวณโรงเรียน" ✅ — [MWIT](https://www.mwit.ac.th/html/mwitDoc/CG/regulations/stu-rule_65.pdf)
- โรงเรียนประจำ: ตารางรับ-ส่งต่อภาคเรียน, เยี่ยม ส.–อา./นักขัตฤกษ์ 09:00–17:00, รายงานพฤติกรรม/การออกนอกบริเวณแก่ผู้ปกครองทุกเดือน, ห้ามเยี่ยม/รับออกในวันเปิดเรียนยกเว้นจำเป็น ✅ — [Thewphaingarm](https://www.thewphaingarm.com/boardingguidelines), [KKD](https://www.kkdfamily.com/policy/)
- Samsenwit มีแนวปฏิบัติช่วงกิจกรรมกีฬาภายในสำหรับนักเรียน ผู้ปกครอง ศิษย์เก่า (ผู้ปกครองเข้า-ออกโรงเรียน) ✅ — [Samsenwit 2567](https://www.samsenwit.ac.th/wp-content/uploads/2024/11/2567-แนวปฏิบัติช่วงกิจกรรมกีฬาภายใน-นักเรียน-ผู้ปกครอง-ศิษย์เก่า.pdf)

#### Interaction matrix

| Interaction | มหาวิทยาลัย (TNSU) | โรงเรียนกีฬา (ผู้เยาว์) | System support | Status |
|---|---|---|---|---|
| ข้อมูลผู้ปกครอง/ผู้ติดต่อฉุกเฉิน | กรอกตอนรายงานตัว | ตอนมอบตัว + ยืนยันทุกปี | Guardian profile, หลายคน, ลำดับติดต่อ | ✅ (PSU บันทึกข้อมูลพื้นฐาน) |
| สิทธิ์ดูข้อมูลบุตร | ต้องได้ consent จากนศ. (≥20 ปี บรรลุนิติภาวะ) | ผู้ปกครองโดยชอบธรรม | Delegated access + consent toggle | 🟡 (หลัก PDPA) |
| ประชุมผู้ปกครอง | ปฐมนิเทศผู้ปกครองปี 1 🟡 | ภาคเรียนละครั้ง 🟡 | Event + RSVP + online stream | 🟡 |
| รายงานผลการเรียน/พฤติกรรม | เกรด (ถ้า consent) | รายเดือน (พฤติกรรม + การออก) / ผลการเรียนรายภาค | Monthly digest push | ✅ (boarding) |
| ชำระเงิน | ค่าเทอม/หอ ผ่าน Thai QR (ใครจ่ายก็ได้) | ค่าบำรุง, ค่าอาหาร, pocket money | Shareable payment link | 🟡 |
| อนุญาต (permissions) | ลงนามสัญญาหอ/ทุน กรณีนศ. < 20 | exeat, ไปแข่ง/เก็บตัว, ทัศนศึกษา, รักษาพยาบาล, ใช้ภาพ (media consent) | e-consent (standing + per-event) | ✅ (MWIT) / 🟡 |
| รับ-ส่ง / เยี่ยม | – | ตารางรับ-ส่ง, รายชื่อผู้รับแทน, เวลาเยี่ยม | Pickup authorisation + visitor log | ✅ |
| แจ้งเหตุฉุกเฉิน/เจ็บป่วย/ละเมิดวินัย | กรณีร้ายแรง | ทุกกรณี | Push + SMS fallback + call log | 🟡 |

### Inferences
- ระบบต้องแยก "guardian" (ผู้เยาว์ — สิทธิ์ตามกฎหมาย) กับ "parent observer" (นศ.ผู้ใหญ่ — สิทธิ์ตาม consent ที่เพิกถอนได้)

### Gaps
- ไม่พบเอกสารของโรงเรียนกีฬา (กรมพลศึกษา/มกช.) เรื่องการประชุมผู้ปกครองหรือแบบฟอร์มยินยอม

---

## 8. Teaching practicum (ฝึกประสบการณ์วิชาชีพครู — นักศึกษาครูพลศึกษา)

### Takeaway
คุรุสภากำหนดให้ผ่านการปฏิบัติการสอนในสถานศึกษาตามหลักสูตรปริญญาทางการศึกษาไม่น้อยกว่า 1 ปี และผ่านเกณฑ์ประเมิน (ประกาศคณะกรรมการคุรุสภา 2563); สำหรับหลักสูตร 4 ปี มีการฝึกระหว่างเรียนแบ่ง 2 ภาค โดยสอนวิชาเอก ≥ 4 ชม./สัปดาห์ × ≥ 15 สัปดาห์ (≥ 120 ชม./ภาค) คณะต่าง ๆ ใช้ triad: นักศึกษา–ครูพี่เลี้ยง–อาจารย์นิเทศก์, นิเทศ ≥ 3 ครั้ง/ภาค, ส่งแผนการจัดการเรียนรู้ล่วงหน้า 1 สัปดาห์, ประเมินโดยอาจารย์นิเทศก์+ครูพี่เลี้ยง+ผู้บริหารสถานศึกษา

### Cited Findings
- ประกาศคณะกรรมการคุรุสภา 2563 (มาตรฐานประสบการณ์วิชาชีพ): ผ่านการปฏิบัติการสอนในสถานศึกษาตามหลักสูตรปริญญาทางการศึกษา ≥ 1 ปี และผ่านเกณฑ์ประเมิน ✅ — [ราชกิจจานุเบกษา 2563](https://www.ratchakitcha.soc.go.th/DATA/PDF/2563/E/109/T_0010.PDF)
- ฝึกปฏิบัติวิชาชีพระหว่างเรียนแบ่ง 2 ภาคการศึกษา (หน่วยกิตรวม); ชั่วโมงสอนวิชาเอก ≥ 4 ชม./สัปดาห์ ≥ 15 สัปดาห์ รวม ≥ 120 ชม./ภาค ✅ (snippet; แหล่งระบุไม่ชัดว่ามาจากประกาศฉบับใด) — [ประกาศคุรุสภา รับรองปริญญา หลักสูตร 4 ปี](https://ratchakitcha.soc.go.th/documents/17134471.pdf), [NPRU ประกาศคุรุสภา](https://academic.npru.ac.th/prakard/prakarddata/sapawichacheep/3.pdf)
- SKRU: การฝึก 4 ขั้นตอน; ส่งแผนการจัดการเรียนรู้ให้อาจารย์นิเทศก์และครูพี่เลี้ยงก่อนสอนทุกครั้ง ล่วงหน้า 1 สัปดาห์ ✅ — [SKRU คู่มือ 4 ปี](https://edu.skru.ac.th/internal-department/file/experience/07-63.pdf)
- นิเทศไม่น้อยกว่า 3 ครั้ง/ภาค ใช้แบบประเมิน 3 ด้าน ✅ (snippet ระบุ มรภ.เชียงใหม่ แต่ URL ไม่ตรง) — [SSRU คู่มือฝึกประสบการณ์](https://edu.ssru.ac.th/useruploads/files/20250819/ad7ad1de7fbc062114e47aa75618fb6bc296220e.pdf)
- RMUTP: แบบประเมิน 3 ด้าน = การจัดการเรียนรู้ / ความสัมพันธ์กับชุมชนและผู้ปกครอง / การปฏิบัติหน้าที่ครูและจรรยาบรรณ; ผู้ประเมิน = อาจารย์นิเทศก์, ครูพี่เลี้ยง, ผู้บริหารสถานศึกษา, ตัวแทนคณะกรรมการสถานศึกษา; สิ้นสุดการฝึกส่งสรุปรายงานประเมิน ✅ — [RMUTP คู่มือนักศึกษา](https://teched.rmutp.ac.th/new/wp-content/uploads/2021/10/manual_ns_62.pdf), [RMUTP คู่มืออาจารย์นิเทศก์](https://teched.rmutp.ac.th/new/wp-content/uploads/2021/10/เล่มคู่มือฝึกสอนอ.นิเทศก์62.pdf)
- UP: ฝึกประสบการณ์ 1–2 = สังเกตและมีส่วนร่วมงานในหน้าที่ครู; ปัญหาต้องแจ้งครูนิเทศก์/อาจารย์นิเทศก์ทันที ✅ — [UP คู่มือฝึกสอน](https://www.se.up.ac.th/se/FileUpload/คู่มือฝึกสอน%205%20ปี%2011-2-65_637817362887184761.pdf)
- มีคู่มือปฏิบัติการสอนของ NRRU 2567 และ SU ✅ — [NRRU](https://edu.nrru.ac.th/edxp/images/2567/101403/manuguidestxp-v2567.pdf), [SU](https://educ.su.ac.th/wp-content/uploads/2024/10/คู่มือฝึกประสบการณ์วิชาชีพครู-474522-474523.pdf); งานวิจัย SWU พัฒนาหลักสูตรอบรมอาจารย์นิเทศก์ (สาขาสุขศึกษา/พลศึกษา) ✅ — [SWU thesis](https://thesis.swu.ac.th/swudis/Hea_Phy_Ed/Charoonsak_B.pdf)

#### Process table: Practicum lifecycle

| # | Actor | Action | Docs | Fee | SLA / timing | System support | Status |
|---|---|---|---|---|---|---|---|
| 1 | ศูนย์ฝึกประสบการณ์ (คณะศึกษาศาสตร์/ครุศาสตร์) | ตรวจคุณสมบัติ (ผ่านรายวิชาบังคับก่อน, GPAX, ฝึก 1–2 สังเกต/มีส่วนร่วม) | – | – | ภาคก่อนฝึก | Eligibility rule | ✅ (UP) / 🟡 GPAX |
| 2 | ศูนย์ฯ + สถานศึกษา (สพฐ./อปท./โรงเรียนกีฬา) | สำรวจ quota, MOU, นักศึกษาเลือกโรงเรียน → จับคู่ (placement) + กำหนดครูพี่เลี้ยง (ต้องสอนพลศึกษา) | หนังสือขอความอนุเคราะห์ | 🟡 | 1 ภาคก่อน | Placement matching + หนังสือราชการ auto | 🟡 |
| 3 | ศูนย์ฯ | ปฐมนิเทศก่อนฝึก, แต่งตั้งอาจารย์นิเทศก์ | คำสั่ง | – | ก่อนฝึก | Assignment | ✅ (คู่มือ) |
| 4 | นักศึกษา | รายงานตัวโรงเรียน, บันทึกเวลาปฏิบัติงานรายวัน (check-in geofence 🟡), ภาระสอนวิชาเอก ≥ 4 ชม./สัปดาห์ | บันทึกลงเวลา | – | ≥ 15 สัปดาห์/ภาค | Daily log + hours counter (≥120 ชม./ภาค) | ✅ ชม. |
| 5 | นักศึกษา → ครูพี่เลี้ยง/อาจารย์นิเทศก์ | ส่งแผนการจัดการเรียนรู้ก่อนสอน ≥ 1 สัปดาห์ → feedback/อนุมัติ | แผนฯ | – | ล่วงหน้า 1 สัปดาห์ | Lesson plan submission + comment | ✅ |
| 6 | อาจารย์นิเทศก์ | นิเทศ ≥ 3 ครั้ง/ภาค (onsite/online), สังเกตการสอน, บันทึกนิเทศ | แบบบันทึกนิเทศ | 🟡 ค่าเดินทางนิเทศ (เบิก) | ≥3 ครั้ง/ภาค | Visit scheduling + route + mileage claim + mobile evaluation form (offline) | ✅ |
| 7 | ครูพี่เลี้ยง/ผู้บริหาร | ประเมิน 3 ด้าน (การจัดการเรียนรู้, ความสัมพันธ์ชุมชน/ผู้ปกครอง, หน้าที่ครู/จรรยาบรรณ) | แบบประเมิน | ค่าตอบแทนครูพี่เลี้ยง 🟡 | กลาง/ปลายภาค | External user accounts (ครูพี่เลี้ยงไม่มีบัญชีมหาวิทยาลัย) + e-sign | ✅ |
| 8 | นักศึกษา | งานประกอบ: วิจัยในชั้นเรียน, portfolio, สัมมนาหลังฝึก | – | – | ปลายภาค | e-Portfolio | 🟡 |
| 9 | ศูนย์ฯ/คณะ | รวมคะแนน → เกรดรายวิชาปฏิบัติการสอน → ส่งทะเบียน | – | – | ปลายภาค | Grade integration | ✅ (สรุปรายงาน) |
| 10 | คณะ/ทะเบียน | จบ → ส่งรายชื่อให้คุรุสภา (หลักสูตรที่รับรอง) → บัณฑิตยื่นขอ license (ดู process_requirements §2) | รายชื่อ | ค่าธรรมเนียมคุรุสภา (ผู้ยื่น) | หลังสภาฯ อนุมัติ | Export | ✅ (process_requirements) |

### Inferences
- นักศึกษาครูพลศึกษาที่เป็นนักกีฬาจะชนกับการเก็บตัว/แข่งขัน ⇒ ต้องมี rule "ชั่วโมงขาดฝึก" และการฝึกชดเชย ไม่ใช่ใช้ competition leave ปกติ 🟡
- ครูพี่เลี้ยงและผู้บริหารโรงเรียนเป็น external actor ⇒ ต้องมี lightweight login (magic link/ThaID) และ mobile form

### Gaps
- เกณฑ์หน่วยกิตปฏิบัติการสอนหลักสูตร 4 ปีของคุรุสภาฉบับปัจจุบัน และคุณสมบัติครูพี่เลี้ยง/อัตราส่วน ไม่ได้อ่านเอกสารเต็ม (ratchakitcha ถูกบล็อก)
- ไม่พบคู่มือฝึกประสบการณ์ของ คณะศึกษาศาสตร์ มกช. โดยตรง

---

## 9. Consolidated e-petition catalogue + notifications

### Takeaway
Catalogue ด้านล่าง (≈ 40 รายการ) ใช้เป็น seed สำหรับ form builder; ✅ เฉพาะแถวที่มีแหล่ง ที่เหลือเป็น 🟡 ตามแนวปฏิบัติทั่วไปของมหาวิทยาลัยไทย — ค่าธรรมเนียม/SLA ต้องให้ มกช. ยืนยันก่อน go-live

### Cited Findings
(แหล่งของแต่ละแถวอ้างใน §2, §3, §5, §6 ข้างต้น)

#### e-Petition catalogue

ตัวย่อผู้อนุมัติ: AD = อาจารย์ที่ปรึกษา, INS = อาจารย์ผู้สอน, HD = หัวหน้าภาค/ประธานหลักสูตร, DN = คณบดี, REG = งานทะเบียน, FIN = กองคลัง/การเงิน, SA = กองพัฒนานักศึกษา, VP = รองอธิการบดี(วิทยาเขต), ATH = ผู้ประสานงานนักกีฬา, GD = ผู้ปกครอง

| # | คำร้อง | ผู้ยื่น | Approvers | Fee | SLA / deadline | Documents | Status |
|---|---|---|---|---|---|---|---|
| **A. รายวิชา/ลงทะเบียน** |||||||
| 1 | ลงทะเบียนเพิ่ม กรณีกลุ่มเต็ม | นศ. | INS → AD → REG | – | ช่วง add/drop | – | ✅ SUT |
| 2 | ถอนรายวิชา (W) | นศ. | AD (→ INS) → REG | – | ก่อนกำหนด W | – | ✅ SUT |
| 3 | ลงทะเบียนเกินหน่วยกิต (>22 ภาคปกติ / >7 ฤดูร้อน) | นศ. | AD → HD → DN → REG | – | ≤10 วันหลังเปิดภาค (SUT) | แผนการเรียน | ✅ KU, SUT |
| 4 | ลงทะเบียนต่ำกว่าเกณฑ์ | นศ. | AD → HD → DN → REG | – | ≤10 วันหลังเปิดภาค | เหตุผล (นักกีฬา: หนังสือเก็บตัว) | ✅ SUT |
| 5 | ขอเปิดรายวิชา / เปิดหมู่เรียนพิเศษ | นศ. (กลุ่ม) | INS → HD → DN → REG | 🟡 ค่าเปิดพิเศษ | ก่อนลงทะเบียน | รายชื่อผู้เรียน | ✅ KPRU, NPRU |
| 6 | ขอเรียนร่วม / เรียนข้ามคณะ/วิทยาเขต | นศ. | AD → HD(ต้นทาง) → HD(ปลายทาง) → REG | – | ช่วงลงทะเบียน | – | ✅ NPRU |
| 7 | แจ้งสอบซ้อน | นศ. | REG (→ INS) | – | ก่อนสอบ | ตารางสอบ | ✅ NPRU |
| 8 | ขอสอบชดเชย/เลื่อนสอบ (ลาป่วย/แข่งขัน) | นศ. | INS → HD (→ ATH) | – | 🟡 ≤ 3 วันทำการหลังสอบ | ใบรับรองแพทย์ / หนังสือขอตัว | 🟡 |
| 9 | ขอรับ I (ไม่สมบูรณ์) | นศ. | INS → HD → DN | – | 🟡 ก่อนส่งเกรด | หลักฐาน | 🟡 |
| 10 | ขอแก้ I / แก้ไขเกรด (อาจารย์ยื่น) | INS | HD → DN → REG | – | 🟡 ภายในภาคถัดไป | แบบแก้เกรด | 🟡 |
| 11 | ขอเทียบโอนผลการเรียน / โอนหน่วยกิต (credit bank) | นศ. | AD → HD → กรรมการเทียบโอน → DN → REG | 🟡 ต่อหน่วยกิต | 🟡 ภาคแรก | transcript เดิม, คำอธิบายรายวิชา | ✅ YRU (ประเภท) |
| 12 | ขอยกเว้น/เรียนแทนรายวิชา | นศ. | AD → HD → DN | – | 🟡 | – | 🟡 |
| 13 | ลาป่วย/ลากิจ (รายวิชา) | นศ. (ผู้เยาว์: GD) | INS (→ AD) | – | ≤ 🟡 3 วันหลังกลับ | ใบรับรองแพทย์ | 🟡 |
| 14 | ลาไปแข่งขัน/เก็บตัว (ไม่นับขาด) | นศ.นักกีฬา | ATH → INS ทุกวิชา → DN | – | ก่อนเดินทาง | หนังสือสมาคม/กกท./ต้นสังกัด | 🟡 (มีใน design เดิม) |
| **B. สถานภาพ** |||||||
| 15 | ลาพักการศึกษา | นศ. (GD ลงนามถ้าผู้เยาว์) | AD → DN → REG → payment gate | ค่ารักษาสภาพ/ภาค (ป.ตรี KMUTT 800 บาท) | ครั้งละ ≤ 2 ภาค (CU) | เหตุผล, หลักฐาน, ที่อยู่ระหว่างลา | ✅ |
| 16 | รักษาสภาพนักศึกษา | นศ. | AD → REG → payment gate | 500–2,500 บาท/ภาค (ตามแห่ง) | ภายในช่วงลงทะเบียน | หลักฐานชำระ | ✅ |
| 17 | ขอคืนสภาพนักศึกษา | อดีตนศ. | AD → DN → VP/อธิการฯ → REG | 🟡 ค่าคืนสภาพ + ค่ารักษาสภาพย้อนหลัง | 🟡 ภายในปีการศึกษา | – | ✅ MBU (ประเภท) |
| 18 | ลาออก | นศ. (GD) | AD → DN → REG + clearance | – | 🟡 | clearance หนี้/หอ/ห้องสมุด | ✅ RU (ประเภท) |
| 19 | ย้ายสาขา/ย้ายคณะ | นศ. | AD → HD(ต้นทาง) → HD(ปลายทาง) → DN ทั้ง 2 → REG | 🟡 | 🟡 ก่อนเปิดภาค | transcript | 🟡 |
| 20 | ย้ายสถานศึกษา/ย้ายวิทยาเขต | นศ. | AD → DN → VP(ต้นทาง/ปลายทาง) → REG | 🟡 | 🟡 | – | ✅ YRU (ประเภท) |
| 21 | ขอสำเร็จการศึกษา | นศ. | REG audit → SA (ความประพฤติ) → DN → กรรมการ → สภาฯ | 🟡 | ≤ 30 วันหลังเปิดภาคสุดท้าย (TNSU) | – | ✅ TNSU |
| 22 | ขอขยายเวลาการศึกษา (เกินระยะเวลาสูงสุด) | นศ. | AD → DN → สภาวิชาการ | 🟡 | 🟡 | – | 🟡 |
| **C. การเงิน** |||||||
| 23 | ขอผ่อนผัน/แบ่งชำระค่าธรรมเนียม | นศ./ผู้ปกครอง | AD → DN → FIN | – | ก่อนวันครบกำหนด; ชำระตามวันที่อนุมัติ | เอกสารรายได้ | ✅ KMUTT SIT, RSU |
| 24 | ขอคืนเงินค่าลงทะเบียน/ค่าธรรมเนียม (ถอนภายในกำหนด, ชำระซ้ำ, ปิดวิชา) | นศ. | REG → FIN | – | 🟡 30 วัน | บัญชีธนาคาร, หลักฐานชำระ | 🟡 |
| 25 | ขอยกเว้น/ลดค่าธรรมเนียม (ทุน/นักกีฬาทีมชาติ) | นศ. | ATH/SA → DN → FIN | – | 🟡 | หนังสือรับรอง | 🟡 |
| 26 | ขอคืนเงินประกันหอพัก | นศ. | งานหอ → FIN | – | 🟡 | ใบตรวจห้อง | 🟡 |
| **D. ข้อมูลส่วนบุคคล** |||||||
| 27 | เปลี่ยนชื่อ-สกุล/คำนำหน้า | นศ. | REG | 🟡 (MU มีค่าธรรมเนียม) | ~2–3 สัปดาห์ (MU) | หนังสือเปลี่ยนชื่อ/ใบสมรส, ตัวอย่างลายมือชื่อ | ✅ MU, STOU |
| 28 | แก้ไขข้อมูลส่วนตัว (วันเกิด, เลขบัตร, ที่อยู่ ฯลฯ) | นศ. | REG (ที่อยู่: self-service ไม่ต้องอนุมัติ) | – | 🟡 3 วันทำการ | หลักฐานราชการ | 🟡 |
| 29 | ทำบัตรนักศึกษาใหม่ (หาย/ชำรุด) | นศ. | REG → ธนาคาร | 🟡 | 🟡 | ใบแจ้งความ, ใบรับรองสถานภาพ | ✅ CRA |
| **E. เอกสาร** |||||||
| 30 | ขอหนังสือรับรอง (เป็นนักศึกษา/ความประพฤติ/คาดว่าจะจบ/ค่าใช้จ่าย) | นศ. | REG → ผช.อธิการฯ วิชาการ → VP | 50 บาท (TNSU MK) | Mahidol ≤ 9 วันทำการ; อายุ 60 วัน (TNSU) | – | ✅ |
| 31 | ขอ Transcript (ไม่สมบูรณ์/สมบูรณ์, TH/EN, paper/digital) | นศ./ศิษย์เก่า | REG | 50 (นศ.) / 100 (ศิษย์เก่า) — RU | ≤ 9 วันทำการ (MU) | – | ✅ |
| 32 | ขอหนังสือรับรองคุณวุฒิ/สำเร็จการศึกษา | บัณฑิต | REG | 50 บาท (MU) | หลังสภาฯ อนุมัติ | – | ✅ |
| 33 | ขอใบแทนปริญญาบัตร | บัณฑิต | REG → อธิการบดี | 100 (MU) – 500 (KU) | ~1 เดือน (MU) | ใบแจ้งความ/ฉบับชำรุด | ✅ |
| 34 | ขอใบแปลปริญญาบัตร | บัณฑิต | REG | 100 (MU) – 600 (KU) | 🟡 | – | ✅ |
| 35 | ขอตรวจสอบวุฒิ (หน่วยงานภายนอกยื่น) | หน่วยงานภายนอก | REG | 🟡 | 🟡 | หนังสือราชการ, ยินยอมเจ้าของข้อมูล | ✅ TNSU MK (มีบริการ) |
| **F. กิจการนักศึกษา** |||||||
| 36 | ขอผ่อนผันทหาร | นศ.ชาย | SA → สัสดี | – | ตามประกาศรายปี | สด.9, สด.35, บัตร, ทะเบียนบ้าน, หนังสือรับรอง | ✅ |
| 37 | ขอเบิกประกันอุบัติเหตุ | นศ. | SA → บริษัทประกัน | – | 🟡 | ใบเสร็จ, ใบรับรองแพทย์ | ✅ CMU/UTCC (บริการ) |
| 38 | ขอเทียบ/บันทึกชั่วโมงกิจกรรม (กิจกรรมภายนอก) | นศ. | AD → SA | – | 🟡 | เกียรติบัตร | ✅ (กยศ. rule) |
| 39 | ขออนุมัติโครงการ/ใช้สถานที่ (ชมรม) | ประธานชมรม | อ.ที่ปรึกษาชมรม → SA | – | 🟡 ≥ 2 สัปดาห์ก่อนจัด | โครงการ, งบ | 🟡 |
| 40 | ขอแต่งกายตามเพศสภาพ (เรียน/สอบ/รับปริญญา) | นศ. | DN / SA | – | ก่อนวันซ้อม (CRRU) | สำเนาบัตร | ✅ CRRU (รับปริญญา) |
| **G. หอพัก / โรงเรียนกีฬา** |||||||
| 41 | สมัคร/สละสิทธิ์หอพัก | นศ. | งานหอ | ค่าประกัน 1,000 (YRU) | ตามรอบ | ใบสมัคร | ✅ KKU |
| 42 | ขอออกนอกหอ/กลับบ้าน (exeat) | นักเรียน | GD → ครูหอ | – | ก่อนออก | consent ประจำปี | ✅ MWIT |
| 43 | ขออนุญาตไปแข่งขัน/ทัศนศึกษา (ผู้เยาว์) | โค้ช/ครู | GD consent → ผอ. | – | ก่อนเดินทาง | หนังสือเชิญ | 🟡 |

#### Notifications the system must send (push + in-app + e-mail; SMS/LINE fallback สำหรับผู้ปกครอง/เหตุฉุกเฉิน)

| กลุ่ม | Trigger | ผู้รับ | Channel | Status แหล่ง |
|---|---|---|---|---|
| Onboarding | เปิดรายงานตัว, ใกล้ deadline (T-3, T-1), ไม่ได้รายงานตัว (เริ่มนับ 7 วันแจ้งเหตุ) | ผู้ผ่านคัดเลือก | push/e-mail/SMS | ✅ PSU (7 วัน) |
| Onboarding | เอกสาร upload ไม่ผ่าน/ขอเพิ่ม, ผลตรวจวุฒิ ม.6 ไม่ผ่าน | นศ. | push | 🟡 |
| Onboarding | Account IT พร้อมใช้ (e-mail/Wi-Fi/LMS), บัตรนักศึกษาพร้อมรับ, digital card active | นศ. | push/e-mail | 🟡 |
| Petition | ยื่นสำเร็จ (เลขคำร้อง), รออนุมัติขั้นถัดไป, อนุมัติ/ไม่อนุมัติ (เหตุผล), ขอเอกสารเพิ่ม, **payment gate: ต้องชำระเพื่อให้คำร้องสมบูรณ์**, เกิน SLA (escalation) | นศ. / ผู้อนุมัติ | push + e-mail | ✅ (payment gate KMUTT/MBU) |
| Petition | ผู้อนุมัติ: มีคำร้องรอ (digest รายวัน), ใกล้เกิน SLA | AD/INS/DN/REG | e-mail + push | ✅ SUT (approval online) / 🟡 digest |
| Registration | deadline ลงเกิน/ต่ำกว่าเกณฑ์ (10 วันหลังเปิดภาค), ช่วง add/drop/W ใกล้ปิด | นศ. | push | ✅ SUT |
| Finance | ใบแจ้งหนี้ออก, ใกล้ครบกำหนด, ชำระสำเร็จ (ใบเสร็จ e-Receipt), ผ่อนผันอนุมัติ + วันชำระใหม่, ค้างชำระ → hold | นศ./ผู้ปกครอง (ถ้า consent) | push/e-mail | ✅ KMUTT SIT |
| Documents | เอกสารพร้อม download/พร้อมรับ, EMS tracking, ใบรับรองใกล้หมดอายุ (60 วัน) | นศ./ศิษย์เก่า | e-mail/push | ✅ TNSU 60 วัน |
| Status | ลาพักใกล้ครบ (ต้องลงทะเบียน/ต่อ), ไม่ลงทะเบียน+ไม่รักษาสภาพ → เสี่ยงพ้นสภาพ | นศ./AD | push/e-mail | ✅ CU (≤2 ภาค) / 🟡 |
| Military | อายุจะครบ 20 ปี (ล่วงหน้า 1 ปี), เปิดรอบยื่นผ่อนผัน, ผลผ่อนผัน, เตือนไปแสดงตน สด.35 ทุกปี | นศ.ชาย | push/e-mail | ✅ |
| Activity / กยศ. | ลงทะเบียนกิจกรรมสำเร็จ, check-in ยืนยัน, ชั่วโมงสะสม, **ชั่วโมงจิตอาสา < 36 ก่อนรอบยื่นกู้** | นศ. | push | ✅ กยศ. |
| Dorm | ผลจัดสรร, ชำระค่าหอ/ประกัน, บิลค่าไฟรายเดือน, สถานะแจ้งซ่อม (รับเรื่อง/กำลังซ่อม/เสร็จ), พัสดุมาถึง, ละเมิดระเบียบ/ตัดคะแนน | นศ. (ผู้ปกครองกรณีผู้เยาว์/ร้ายแรง) | push | ✅ KKU, UDRU, YRU |
| Boarding (minors) | คำขอ exeat รออนุมัติ, อนุมัติแล้ว, นักเรียน **ออก**/**กลับเข้า**หอ, **เกินเวลากลับ (overdue)**, ผู้มาเยี่ยม/ผู้รับแทนมาถึง, รายงานพฤติกรรมรายเดือน, เจ็บป่วย/อุบัติเหตุ | ผู้ปกครอง + ครูหอ | push + SMS fallback | ✅ MWIT, boarding schools |
| Health / insurance | นัดตรวจสุขภาพ, ผลเคลมประกัน, ใบรับรองแพทย์ส่งเป็นลาป่วยอัตโนมัติ | นศ. | push | 🟡 |
| Graduation | เปิดยื่นขอจบ (≤30 วัน), ผล degree audit/clearance ขาดอะไร, สภาฯ อนุมัติแล้ว, เปิดลงทะเบียนบัณฑิต, แบบสอบถามภาวะการมีงานทำ, ตารางถ่ายภาพ/ซ้อมย่อย/ซ้อมใหญ่ + ลำดับแถว, ปริญญาบัตรพร้อมรับ/จัดส่ง | นศ./บัณฑิต | push/e-mail | ✅ TNSU, BSRU, PNRU |
| Practicum | ผล placement, กำหนดนิเทศ (อาจารย์นิเทศก์ + ครูพี่เลี้ยง + นศ.), แผนการสอนต้องส่ง (T-7 วันก่อนสอน), แบบประเมินรอครูพี่เลี้ยง/ผู้บริหารกรอก, ชั่วโมงสะสมต่ำกว่าเป้า (120 ชม./ภาค), นิเทศครบ 3 ครั้งหรือยัง | นศ./อ.นิเทศก์/ครูพี่เลี้ยง | push/e-mail/magic-link | ✅ |
| Emergency/safety | ภัยพิบัติ/ปิดมหาวิทยาลัย, เหตุฉุกเฉินในหอ | ทุกคนในพื้นที่ + ผู้ปกครอง (ผู้เยาว์) | push + SMS | 🟡 |

### Inferences
- รายการ 43 คำร้องลดเหลือ approval-chain template ~6 แบบ (A รายวิชา, B สถานภาพ+payment gate, C การเงิน, D ข้อมูล, E เอกสาร, F/G กิจการ/หอ-ผู้ปกครอง) ⇒ form builder ควรให้เลือก template + override ต่อวิทยาเขต (TNSU MK ใช้ ผช.อธิการฯ + รองอธิการฯ วิทยาเขต เป็นผู้ลงนาม)
- Notification ทุกตัวควรมี event type ที่ชัดเจนเพื่อใช้วัด SLA/ITA

### Gaps
- ค่าธรรมเนียมและ SLA ส่วนใหญ่ของ มกช. ไม่พบ (มีเพียงใบรับรอง 50 บาท/60 วัน และคำร้องขอจบ 30 วัน จากวิทยาเขตมหาสารคาม)
- โดเมนที่ fetch ไม่ได้ (ต้องเพิ่มใน allowlist เพื่อยืนยันตัวเลข): `*.ac.th` (เช่น `freshmen-api.pn.psu.ac.th`, `op.mahidol.ac.th`, `regis.dusit.ac.th`, `www.reg.chula.ac.th`, `tnsumk.ac.th`) และ `ratchakitcha.soc.go.th`
