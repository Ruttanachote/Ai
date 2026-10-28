# มุมมองการประกวดราคา (Bid/Competitive) และ Business Case: ระบบสารสนเทศมหาวิทยาลัย มกช. (TNSU)

> วันที่วิจัย: 28 ต.ค. 2569 · ผู้วิจัย: research subagent (bid/business-case) · ภาษา: ไทย (ศัพท์เทคนิคเป็นภาษาอังกฤษ)
> **สัญลักษณ์:** ✅ = มีแหล่งอ้างอิง (URL) ยืนยัน (ส่วนใหญ่เป็น **search snippet** ไม่ได้อ่านฉบับเต็ม) · 🟡 = ข้อสันนิษฐาน การอนุมาน หรือความรู้ทั่วไปที่ไม่ได้ยืนยันในรอบนี้ ต้องตรวจสอบก่อนใช้ใน proposal
> **ข้อจำกัดเรื่องวิธีการ (อ่านก่อน):** การ fetch โดยตรงล้มเหลว (DNS/proxy ENOTFOUND) ทุกโดเมนที่ลองในรอบนี้ ได้แก่ `www.stou.ac.th`, `eprocurement.swu.ac.th`, `lanna.co.th`, `eng.kku.ac.th`, `www.onep.go.th` และรอบก่อนหน้ารายงานว่า `gprocurement.go.th` และ `tnsu.ac.th` ก็ล้มเหลวเช่นกัน ข้อเท็จจริงทุกข้อด้านล่างจึงมาจาก search snippet ถ้าจะ fetch ต้องเพิ่มโดเมนเหล่านี้ใน network allowlist ของ session ก่อน **e-GP ค้นโดยตรงไม่ได้ จึงยังไม่มีมูลค่าสัญญาผู้ชนะ (winner/contract value) ของระบบ REG/SIS มหาวิทยาลัยไทยรายการใดยืนยันได้**
> ไม่ซ้ำกับ: `products_architecture.md` (build/buy/hybrid, failure ของ Tier-1 SaaS), `thai_gov_compliance.md` (พ.ร.บ.จัดซื้อฯ 2560, MiT/SME margin, ข้อ 45/162/167, ราคากลาง DE ธ.ค. 2568, PDPA), `tnsu_profile.md` (งบ FY2569/2570, โครงสร้างวิทยาเขต)

---

## 1. ตลาดระบบสารสนเทศมหาวิทยาลัยไทย: ผู้เล่น สัญญาที่เป็นแบบอย่าง โครงสร้างสัญญา

### Takeaway
ตลาด REG/SIS ของมหาวิทยาลัยรัฐไทยกระจายตัวมาก มี 3 รูปแบบหลัก คือ (1) **พัฒนาเองโดยสำนักวิทยบริการฯ/ศูนย์คอมพิวเตอร์** ซึ่งพบมากในราชภัฏและราชมงคล (2) **บริษัทไทยขนาดเล็ก-กลางที่ทำ REG เฉพาะทาง** เช่น Vision Net (มมส.) และซัม ซิสเท็ม (มรภ.กาญจนบุรี) (3) **SI/ERP รายใหญ่** สำหรับ ERP แบบ back-office เช่น Lannacom (มข.) และ SAP (มหิดล) ยังไม่พบมูลค่าสัญญา REG ที่ยืนยันได้จาก e-GP ไม่มี vendor รายใดครองตลาด REG ที่มี "หลายวิทยาเขต + โรงเรียนกีฬา + athlete" ซึ่งตรงกับโจทย์ มกช.

### ตารางคู่แข่ง (Competitor landscape)

| กลุ่ม | ผู้เล่น | หลักฐาน | จุดแข็ง (ต่อ bid มกช.) | จุดอ่อน | สถานะ |
|---|---|---|---|---|---|
| Vendor REG เฉพาะทาง | **บริษัท วิชั่น เน็ต จำกัด (VISIONET CO., LTD., จดทะเบียน 2544)** | ผู้ให้บริการแอป "MSU Registration System" ของ ม.มหาสารคาม | มี REG ที่ใช้งานจริงในมหาวิทยาลัยรัฐ และมี mobile app | ไม่พบลูกค้ารายอื่นใน snippet และไม่มีประสบการณ์กีฬา/โรงเรียนที่พบ | ✅ [App Store](https://apps.apple.com/app/id1541990616), [Creden](https://data.creden.co/company/general/0105544018846) |
| Vendor MIS ราชภัฏ | **บริษัท ซัม ซิสเท็ม จำกัด** | ชื่อปรากฏในคู่มือ "ชุดระบบสารสนเทศเพื่อการบริหารมหาวิทยาลัย" ของ มรภ.กาญจนบุรี (reg2.kru.ac.th) ครอบคลุมตารางเรียน ตารางสอน และตารางสอบ | มีชุดระบบครบวงจรสำหรับราชภัฏ | ขนาดบริษัทและลูกค้าอื่นยังไม่ยืนยัน (ค้นซ้ำแล้วไม่พบ) | ✅ [KRU manual](https://reg2.kru.ac.th/file_manual/3.%E0%B8%A3%E0%B8%B0%E0%B8%9A%E0%B8%9A%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%95%E0%B8%B2%E0%B8%A3%E0%B8%B2%E0%B8%87%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99%20%E0%B8%95%E0%B8%B2%E0%B8%A3%E0%B8%B2%E0%B8%87%E0%B8%AA%E0%B8%AD%E0%B8%99%20%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%95%E0%B8%B2%E0%B8%A3%E0%B8%B2%E0%B8%87%E0%B8%AA%E0%B8%AD%E0%B8%9A_%E0%B8%84%E0%B8%93%E0%B8%B0.pdf) |
| SI / ERP รายใหญ่ | **Lanna Com Co., Ltd. (ลานนาคอม)** | ลงนามกับ ม.ขอนแก่น เมื่อ 22 มี.ค. 2566 ขอบเขต EPM (แผน/งบ) + ERP (จัดซื้อ การเงิน บัญชี ทรัพย์สิน) + HCM + **ระบบการศึกษา** | มีผลงานระดับมหาวิทยาลัยใหญ่และ integration ข้ามโดเมน | ราคาสูง และเน้น ERP (ผูกกับ platform) | ✅ [KKU eng news](https://eng.kku.ac.th/16171), [KKU ERP](https://eng.kku.ac.th/?p=18610), [Khonkaenlink](https://www.khonkaenlink.info/read/823226/) (มูลค่าสัญญา: ไม่พบ) |
| ERP platform | **SAP** (มหิดล MUERP: บัญชี การเงิน งบประมาณ พัสดุ HR) | หน้า MUIT | ครบด้าน back-office | ไม่ใช่ SIS และ TCO สูง | ✅ [MUERP](https://muit.mahidol.ac.th/muerp/) |
| ERP platform | **Oracle** (มสธ. ระบบทะเบียนพัฒนาด้วย Oracle ใช้ตั้งแต่ 2554 และจ้างปรับปรุงต่อเนื่อง) | TOR มสธ. | ฐานติดตั้งเดิมเหนียวแน่น | Legacy และต้องจ้างปรับปรุงเป็นงวด | ✅ (snippet) [STOU 7917](https://www.stou.ac.th/website/Tender2/UploadedFile/7917.pdf), [STOU 2362](https://www.stou.ac.th/website/Tender2/UploadedFile/2362.pdf) |
| In-house | **สำนักวิทยบริการฯ มรภ.เพชรบูรณ์** (PCRU MIS v2020: ทะเบียนและวัดผล) | คู่มือ/หน้าเว็บ | ต้นทุนต่ำและเข้าใจงาน | ขาดคน สเกลไม่ได้ และพึ่งพาตัวบุคคล | ✅ [PCRU ARIT](https://arit.pcru.ac.th/2022/view/miscenter), [PCRU userguide](https://www.pmis.pcru.ac.th/mis/webservice/v2020/assets/userguid_v2020.pdf) |
| In-house | **มทร.ล้านนา**: REG กลางพัฒนาเองตั้งแต่ 2557 ใช้ร่วมกัน **6 เขตพื้นที่** | หน้า dev team | **เป็นแบบอย่าง multi-campus ใกล้เคียง มกช. ที่สุด** | ไม่ใช่คู่แข่งเชิงพาณิชย์ แต่เป็นทางเลือกแบบ "ขอใช้ระบบ" | ✅ [dev.rmutl.ac.th](https://dev.rmutl.ac.th/) |
| SI / infra | TORQUE IT (ลูกค้า มทร.รัตนโกสินทร์ และ มรภ.วไลยอลงกรณ์) | หน้า client | infra/cloud/security | ไม่ทำ SIS | ✅ [TORQUE IT](https://www.torqueit.co.th/our-clients/educational/) |
| ใน มกช. เอง | งานทะเบียนรายวิทยาเขต (เช่น tnsumk.ac.th/reg "E-education") และ MIS แผน/งบ ที่วิทยาเขตเพชรบูรณ์พัฒนาเอง | tnsu_profile.md | เป็นผู้ใช้เดิมที่มีความผูกพันกับระบบ | กระจัดกระจาย | ✅ [JMSR](https://so02.tci-thaijo.org/index.php/jmsr/article/view/254853) (vendor ปัจจุบัน: ไม่พบ) |
| Global SaaS | Workday Student / Ellucian / Anthology | products_architecture.md | แบรนด์ | ไม่ localize ไทย, data residency, และ TCO 4.2–14M USD เฉพาะ implementation (Workday) | ✅ [VendorBenchmark](https://vendorbenchmark.com/guides/higher-education-software-pricing-benchmark) (ไม่ทราบวิธีวิจัย) |
| 🟡 ผู้เล่นที่น่าจะเข้ามาแข่ง (ไม่ได้ยืนยันในรอบนี้) | SI ภาครัฐรายใหญ่ (เช่น กลุ่มที่รับงาน ERP ภาครัฐ), software house ที่ทำระบบให้ราชภัฏ/ราชมงคล, consortium ระหว่าง SI กับ vendor REG | ความรู้ทั่วไป | — | — | 🟡 |

### ตารางสัญญาที่เป็นแบบอย่าง (Procurement precedents)

| หน่วยงาน | งาน | มูลค่า/ราคากลาง | ระยะเวลา / โครงสร้าง | แหล่ง |
|---|---|---|---|---|
| ม.ขอนแก่น | ERP + EPM + HCM + ระบบการศึกษา (Lannacom) | **ไม่พบตัวเลข** | ลงนาม 22 มี.ค. 2566 | ✅ [KKU](https://eng.kku.ac.th/16171) |
| มสธ. | จ้างพัฒนา/ปรับปรุงโปรแกรมระบบสารสนเทศงานทะเบียนและงานบริการการศึกษา (ระบบเดิมเป็น Oracle ตั้งแต่ 2554) | ไม่พบใน snippet | **6 เดือน (เม.ย.–30 ก.ย. 2567)** แบบจ้างปรับปรุงทีละรอบปีงบ | ✅ [STOU 7917](https://www.stou.ac.th/website/Tender2/UploadedFile/7917.pdf) |
| มสธ. | ระบบบริการข้อมูลนักศึกษาบน mobile | ไม่พบ | — | ✅ [STOU 2362](https://www.stou.ac.th/website/Tender2/UploadedFile/2362.pdf) |
| มสธ. | ระบบสารสนเทศบัญชี การเงิน พัสดุ งบประมาณ (ERP) | ไม่พบ | — | ✅ [STOU 9679](https://www.stou.ac.th/website/Tender2/UploadedFile/9679.pdf) |
| มสธ. (TOR อีกฉบับ) | คุณสมบัติผลงาน: **ผลงานเสร็จภายใน 3 ปีย้อนหลัง มูลค่า ≥ 5,000,000 บาท** | — | — | ✅ (snippet) [STOU search set](https://www.stou.ac.th/website/Tender2/UploadedFile/8591.pdf) (snippet ไม่ระบุชัดว่าเป็นไฟล์ใดในชุด) |
| มศว | ราคากลางพัฒนาระบบ (แยกค่า Hardware / Software / ค่าพัฒนาระบบ) **อ้างหลักเกณฑ์ราคากลางการพัฒนาระบบคอมพิวเตอร์ของสำนักเลขาธิการคณะรัฐมนตรี** | ตัวอย่างรอบก่อน: 2,200,000 บาท | — | ✅ [SWU C_4418](https://eprocurement.swu.ac.th/upload_cost/C_4418.pdf), [SWU doc-13](https://pcmc.swu.ac.th/epro/uploadfiles/doc-13.pdf) |
| ม.อ. ตรัง | e-bidding "ระบบประมวลผลคอมพิวเตอร์สนับสนุนการศึกษา" (งานซื้อ) | **ราคากลาง 5,000,000 บาท** | — | ✅ [PSU Trang](https://www.psu.ac.th/trang/wp-content/uploads/ร่างเอกสารประกวดราคา-1.pdf) |
| ก.ล.ต. | จ้าง Programmer outsource 4 คน 2 ปี | **8,217,600 บาท (รวม VAT) = 85,600 บาท/คน/เดือน** | Time & material | ✅ [SEC](https://www.sec.or.th/TH/Template3/Procurement_estimate_none/2562/estimate-programmer-170462.pdf) |
| ธนาคารออมสิน | พัฒนาระบบ Online Financial Literacy | **PM base 127,850 บาท/เดือน × multiplier 2.475** (วิธีแบบงานที่ปรึกษา) | คิดเป็นวัน | ✅ [GSB](https://www.gsb.or.th/media/2023/09/ราคากลาง-OFL.pdf) |
| สผ. (ONEP) | งานจ้างที่ปรึกษา 2568 อ้างหนังสือ PDMO 22 ส.ค. 2567 | ค่าบุคลากร ~3.34M จากงบ 4.54M (~74%) | — | ✅ [ONEP](https://www.onep.go.th/wp-content/uploads/2025/11/procurement-price-202511031601.pdf) |
| กฟภ. (อ้างอิงขนาด ERP ภาครัฐ ไม่ใช่มหาวิทยาลัย) | ERP: ผู้ชนะ PIS | **2,938.22M บาท** (ประกาศ 3 มี.ค. 2568) | e-bidding | ✅ (snippet) [Matichon](https://www.matichon.co.th/economy/news_5099696) |

### Cited Findings (เพิ่มเติม)
- มสธ. ระบุว่าระบบทะเบียนพัฒนาด้วยเทคโนโลยี Oracle และเปิดใช้ตั้งแต่ 2554 ครอบคลุมโครงสร้างหลักสูตร ตารางสอบ และการลงทะเบียน แล้วจ้างปรับปรุงต่อเป็นรอบ — [STOU 7917](https://www.stou.ac.th/website/Tender2/UploadedFile/7917.pdf)
- มทร.ล้านนาพัฒนา REG กลางเองตั้งแต่ 2557 และใช้ร่วมกัน 6 เขตพื้นที่ — [dev.rmutl.ac.th](https://dev.rmutl.ac.th/)
- ปัญหาที่ผู้ใช้ REG รายงาน: ลงทะเบียนยากเมื่อผู้ใช้เข้าพร้อมกัน บางวิชาจองไม่ได้ และกู้ระบบหลังล่มได้ช้า (งานวิจัยที่อยู่บน msu2c.msu.ac.th) — [MSU abstract](https://msu2c.msu.ac.th/assets/pdf/Researchs/abstract3.pdf); งานสำรวจ Mahidol ให้คะแนน stability "ปานกลาง" — [Mahidol repo](https://repository.li.mahidol.ac.th/handle/123456789/72053), [SKY System study](https://so02.tci-thaijo.org/index.php/sahasart/article/view/244212)
- ทปอ. ปฏิเสธว่าระบบ TCAS 2562 ไม่ได้ล่ม และระบุว่าปัญหามาจากข้อมูลผู้สมัคร ประเด็นนี้แสดงว่าความน่าเชื่อถือช่วง peak เป็นประเด็นสาธารณะที่อ่อนไหว — [ThaiPBS](https://www.thaipbs.or.th/news/content/276068)
- ม.อ. ใช้ E-doc ใน 5 วิทยาเขตเพื่อลดกระดาษและเวลา แต่เอกสารวาระที่ประชุมปี 2568 บันทึก "ปัญหาการใช้งานไม่ตรงวัตถุประสงค์" (adoption risk) — [PSU HR](https://hr.psu.ac.th/file%202568/pdf/7.วาระ%20การเสนอเอกสารทางระบบ%20Edoc.pdf)
- ความล้มเหลวของ ERP ต่างประเทศที่ใช้อ้างได้: Birmingham City Council ย้าย SAP→Oracle ค่าใช้จ่ายถึง £144M และยังใช้งานไม่ได้ (ม.ค. 2026); UCLA ยุติข้อพิพาท Oracle ERP ด้วยเครดิต $3.1M และลดบิล $1.31M (ต.ค. 2026) — [The Register Birmingham](https://www.theregister.com/software/2026/01/29/birmingham-oracle-erp-fiasco-now-144m-and-still-not-working/4238750), [The Register UCLA](https://www.theregister.com/saas/2026/10/12/ucla-settles-oracle-erp-dispute-with-31m-in-credits-and-131m-wiped-off-the-bill/5302520)

### Inferences
- 🟡 โครงสร้างสัญญาที่พบบ่อย (จากรูปแบบ มสธ. และ มศว): สัญญาพัฒนารายปีงบ 6–12 เดือน แบ่งงวดตาม deliverable (เช่น งวด 1 = แผนงาน/SRS, งวด 2 = ออกแบบ, งวด 3 = พัฒนาและทดสอบ, งวดสุดท้าย = ติดตั้ง อบรม และตรวจรับ) ตามด้วยรับประกัน ≥1 ปีและสัญญา MA แยกรายปี ข้อนี้สอดคล้องกับ `thai_gov_compliance.md` แต่**ยังไม่ได้อ่าน TOR ฉบับเต็ม**
- 🟡 งบประมาณภาครัฐผูกกับปีงบประมาณ ทำให้ระบบใหญ่ถูกแตกเป็นหลายสัญญาหลายปี ผู้ชนะเฟส 1 จึงได้เปรียบมาก (incumbency) ในเฟสถัดไป
- 🟡 การขาด vendor ที่ครองตลาดเป็นโอกาส แต่ incumbent รายวิทยาเขต (ระบบเดิมของแต่ละวิทยาเขต) และทีม IT ภายในที่อาจต่อต้านเป็นคู่แข่ง "เชิงการเมือง" ที่สำคัญกว่า vendor ภายนอก

### Gaps
- ยังไม่มีมูลค่าสัญญาผู้ชนะ REG/SIS/ERP มหาวิทยาลัยไทยปี 2563–2569 ที่ยืนยันได้แม้แต่รายการเดียว (e-GP ค้นไม่ได้ และ snippet ไม่แสดงตัวเลข) ต้องค้นที่ `gprocurement.go.th` → "ค้นหาประกาศจัดซื้อจัดจ้าง" ด้วยคำว่า "ระบบทะเบียน", "ระบบบริการการศึกษา", "ERP" กรองหน่วยงานกลุ่มมหาวิทยาลัย หรือใช้ข้อมูลเปิด ACT Ai (actai.co)
- ไม่พบรายชื่อ vendor REG ที่ทำให้ราชภัฏหลายแห่ง (เช่นที่ใช้ร่วมกัน) และไม่พบส่วนแบ่งตลาด
- ไม่พบกรณีล้มเหลวของ REG ในมหาวิทยาลัยไทยที่เป็นข่าวระดับชาติ (มีแค่งานวิจัยความพึงพอใจ)

---

## 2. มกช.: การจัดซื้อด้าน IT ในอดีต vendor ปัจจุบัน และแผนดิจิทัล

### Takeaway
ค้นแล้ว**ไม่พบประกาศผู้ชนะ จ้างพัฒนาระบบสารสนเทศ ของ มกช.** ใน search snippet และ e-GP/tnsu.ac.th เข้าไม่ได้ ข้อมูลที่มีคือระบบที่วิทยาเขตพัฒนาเอง (MIS แผน/งบ เพชรบูรณ์) และงานทะเบียนรายวิทยาเขต (E-education ที่มหาสารคาม) งบปี 2570 ถูกตัด −7.39% และกระทรวงอาจแยกเป็นกระทรวงการกีฬา (ดู `tnsu_profile.md`)

### Cited Findings
- ค้นคำ "มหาวิทยาลัยการกีฬาแห่งชาติ จ้างพัฒนาระบบสารสนเทศ ประกาศผู้ชนะ" ได้เพียงงานวิจัย MIS แผนและงบประมาณ วิทยาเขตเพชรบูรณ์ (ผู้ใช้ 30 คน, ประสิทธิภาพเฉลี่ย 4.84) — [JMSR](https://so02.tci-thaijo.org/index.php/jmsr/article/view/254853)
- งบ FY2569 ≈ 1,853.9M และร่าง FY2570 1,716.84M (−7.39%) — อ้างตาม `tnsu_profile.md` ([Bangkok Today](https://bangkok-today.com/%E0%B8%81%E0%B8%A1%E0%B8%98-%E0%B8%A7%E0%B8%B4%E0%B8%AA%E0%B8%B2%E0%B8%A1%E0%B8%B1%E0%B8%8D%E0%B8%87%E0%B8%9A%E0%B8%AF%E0%B8%9B%E0%B8%B5-70-%E0%B8%AA%E0%B8%A7-%E0%B8%8A%E0%B8%B5%E0%B9%89%E0%B8%97/))

### Inferences
- 🟡 ถ้าตั้งสมมติฐานงบ IT ระบบหลัก 0.5–1.5% ของงบรวม (ยังไม่มีแหล่ง) จะได้ราว 9–28M บาท/ปี ตัวเลขนี้ใช้ตั้งกรอบ "ความสามารถจ่าย" เท่านั้น ต้องหาตัวเลขจริงจากเอกสารงบประมาณ (ขาวคาดแดง) ฉบับที่ 3 ส่วน มกช. รายการงบลงทุน "ครุภัณฑ์คอมพิวเตอร์/จ้างพัฒนาระบบ"
- 🟡 รอยต่อเปลี่ยนกระทรวง (2569/2570) อาจทำให้งบลงทุนใหม่ชะลอ วิธีที่ปลอดภัยกว่าคือเสนอเฟสแรกขนาดเล็กที่อยู่ในวงเงินอำนาจอนุมัติ และใช้งบเงินรายได้ของมหาวิทยาลัยร่วมด้วย

### Gaps
- ไม่ทราบ vendor ปัจจุบันของแต่ละวิทยาเขต (REG, การเงิน, LMS), แผนดิจิทัล มกช. (ฉบับ 2566–2570) ส่วน IT, งบ "ครุภัณฑ์คอมพิวเตอร์" รายปี และ e-GP ย้อนหลัง ต้องค้นใน e-GP โดยระบุหน่วยงาน "มหาวิทยาลัยการกีฬาแห่งชาติ" และชื่อแต่ละวิทยาเขต และขอดูแผนจัดซื้อจัดจ้างประจำปี (ต้องประกาศตาม ม.11)

---

## 3. ราคาอ้างอิง (Pricing benchmarks)

### Takeaway
ไม่มี "ราคากลางค่า man-month นักพัฒนา" กลางของภาครัฐที่ใช้ได้ทั่วประเทศ หน่วยงานจึงใช้ 2 วิธี คือ (ก) **วิธีแบบงานที่ปรึกษา** = เงินเดือนฐาน × multiplier (ตัวอย่าง GSB 2.475) ตามหลักเกณฑ์ราคากลางการจ้างที่ปรึกษาของ **PDMO (ศูนย์ข้อมูลที่ปรึกษา สบน.) ฉบับ ส.ค. 2567 ใช้ตั้งแต่ปีงบ 2569** (มีฉบับ มี.ค. 2569 ใหม่กว่า) และ (ข) คณะกรรมการกำหนดราคากลางของหน่วยงานใช้ราคาสืบจากตลาด ส่วนเกณฑ์ราคากลางคอมพิวเตอร์ของ DE ครอบคลุม hardware/packaged software

### ตาราง Pricing benchmark

| รายการ | ค่า | ประเภท | แหล่ง |
|---|---|---|---|
| Programmer outsource (ก.ล.ต. 2562) | 85,600 บาท/คน/เดือน (รวม VAT) | สัญญาจ้างจริง | ✅ [SEC](https://www.sec.or.th/TH/Template3/Procurement_estimate_none/2562/estimate-programmer-170462.pdf) |
| Project Manager (GSB 2566) | ฐาน 127,850 × 2.475 ≈ **316,429 บาท/คน-เดือน** (billing rate) | ราคากลาง | ✅ [GSB](https://www.gsb.or.th/media/2023/09/ราคากลาง-OFL.pdf) |
| หลักเกณฑ์ PDMO ราคากลางที่ปรึกษา (ส.ค. 2567 → ใช้ FY2569, ฉบับใหม่ มี.ค. 2569) | ตารางอัตรารายระดับ: **ยังไม่ได้อ่าน** | ระเบียบ | ✅ [bict.moe](https://bict.moe.go.th/wp-content/uploads/2024/12/หลักเกณฑ์การจ้างที่ปรึกษา-ฉบับใหม่.pdf), [ThaiGov circular](https://media.thaigov.go.th/uploads/document/142/2024/08/pdf/Doc_20240828144658000000.pdf), [PDMO](https://pdmo.go.th/en/press-conference/3694) |
| สัดส่วนค่าบุคลากรในงานที่ปรึกษา (ONEP 2568) | ~74% ของราคากลาง | ราคากลาง | ✅ [ONEP](https://www.onep.go.th/wp-content/uploads/2025/11/procurement-price-202511031601.pdf) |
| เงินเดือนตลาด Developer ไทย 2025 | Junior 25–45k, Mid 45–85k, Senior 85–150k, Lead/Architect 120–200k+ บาท/เดือน | vendor guide | ✅ [SecondTalent](https://www.secondtalent.com/developer-rate-card/thailand/) (วันที่ไม่ชัด) |
| SA/PM ตลาด | SA-Programmer 40–60k; SA (PM) 50–55k บาท/เดือน | job ads | ✅ [RGF](https://www.rgf-hragent.asia/en/thailand/system-analyst-programmer-JO-180305-148525), [JobThai](https://jobthai.com/th/job/1665876) |
| SIS ต่อหัว (สากล, ประมาณการ) | 5k–15k นศ.: **$30–50/นศ./ปี** (license) | vendor guide ไม่มีแหล่งข้อมูล | ✅ [Monetizely](https://www.getmonetizely.com/articles/how-are-higher-education-student-information-systems-sis-priced-a-university-procurement-guide) |
| Software รวมต่อหัว (สากล) | $480–1,840/นศ./ปี; SIS = 18–28% ของ software spend | benchmark ไม่ทราบวิธี | ✅ [VendorBenchmark](https://vendorbenchmark.com/guides/higher-education-software-pricing-benchmark) |
| เกณฑ์ราคากลาง DE คอมพิวเตอร์ | ฉบับ ธ.ค. 2568 (hardware/software) | ระเบียบ | ดู `thai_gov_compliance.md` |

### Inferences: แบบจำลองราคา (🟡 ทั้งหมด ใช้เป็นกรอบ ต้องเทียบตาราง PDMO จริง)
- **Billing rate ที่สมเหตุผลสำหรับราคากลาง (บาท/คน-เดือน):** PM 180–320k · Solution Architect 180–280k · SA/BA 120–180k · Senior Dev 120–180k · Dev 70–120k · QA/Tester 60–90k · UX 80–130k · DevSecOps 120–180k (multiplier ราว 2.0–2.5 × เงินเดือนตลาด ตามตรรกะเดียวกับ GSB)
- **ขนาดงาน (ตัวอย่างเพื่อ sanity check):** SIS core + admissions + finance link + portal + sports school + athlete ราว 250–400 คน-เดือน × blended 110–140k ≈ **28–56M บาท** สำหรับการพัฒนา 18–24 เดือน (ยังไม่รวม hardware/cloud/license) และ MA ปีละ 15–20% ของค่าพัฒนา
- **ต่อหัวนักศึกษา:** ถ้าค่าระบบ 5 ปี (TCO) ≈ 60–80M บาท สำหรับ ~12k นศ. + นร.กีฬา ⇒ ~1,000–1,350 บาท/นศ./ปี (≈ $28–38) อยู่ในกรอบ $30–50 ของต่างประเทศ ตัวเลขนี้ใช้เป็นข้อโต้แย้ง "คุ้มค่า" ใน proposal ได้
- ระวัง: ถ้าเสนอสูงกว่าราคากลางจะถูกตัดสิทธิ์ ราคากลางที่ คกก. ตั้งน่าจะต่ำกว่าตัวเลขข้างต้นถ้าใช้ฐานเงินเดือนราชการ

### Gaps
- ตารางค่าตอบแทนรายระดับของ PDMO ฉบับ 2567/มี.ค. 2569 (ต้อง fetch `consultant.pdmo.go.th/index.php?mod=mediumprice`)
- "หลักเกณฑ์ราคากลางการพัฒนาระบบคอมพิวเตอร์ของ สลค." ที่ มศว อ้าง (ปี/อัตรา) ยังไม่ได้อ่าน
- ไม่พบ salary guide ปี 2025–2026 จาก Robert Walters/Adecco สำหรับ SA/PM ไทย

---

## 4. Win themes, เกณฑ์ประเมิน และคุณสมบัติที่ TOR มักกำหนด

### Takeaway
การให้คะแนนแบบ "เกณฑ์ราคาประกอบเกณฑ์อื่น" (Price Performance) ในมหาวิทยาลัยมีสัดส่วนราคาต่อคุณภาพตั้งแต่ **40:60 ถึง 80:20** (ตัวอย่างงานครุภัณฑ์ มศว/ม.อ.) งานซอฟต์แวร์ซับซ้อนควรผลักดันให้ TOR ให้น้ำหนักเทคนิคสูง (เช่น ราคา 30–40%) คุณสมบัติที่พบจริงคือ **ผลงานภายใน 3 ปี มูลค่า ≥ 5M บาท** ส่วนข้อกำหนด CMMI/ISO 27001/ISO 29110 ร่วมกันในงานมหาวิทยาลัย**ยังไม่พบหลักฐาน**

### Cited Findings
- ตัวอย่างน้ำหนัก: ราคา 40 / คุณภาพ 60 (เทคนิค 50 + บริการหลังการขาย 10), ราคา 60 / อื่น 40, ราคา 75 / 25, และ 80 / 20 — [PSU Pharm Lab 2566](https://www.pharmacy.psu.ac.th/images/Price_Performance2_Lab_2566.1pdf.pdf), [Hood 2566](https://www.pharmacy.psu.ac.th/images/Price_Performance_Hood_2566.pdf), [Lab 2565](https://www.pharmacy.psu.ac.th/images/Price_Performace_Lab_2565_ครงท_2_23-11-64-KP.pdf), [SWU A_2293](https://eprocurement.swu.ac.th/upload_att/A_2293.pdf)
- คุณสมบัติผลงาน: เสร็จภายใน 3 ปีย้อนหลัง มูลค่า ≥ 5,000,000 บาท (TOR มสธ.) — [STOU](https://www.stou.ac.th/website/Tender2/UploadedFile/8591.pdf)
- SME margin ≤10%, MiT ≤5% (ดู `thai_gov_compliance.md`) — [Thaigov 2020](https://media.thaigov.go.th/uploads/document/142/2020/12/doc/Doc_20201223095136000000.doc)
- ความเจ็บปวดของผู้ใช้ REG: peak load และการกู้ระบบช้า — [MSU abstract](https://msu2c.msu.ac.th/assets/pdf/Researchs/abstract3.pdf); การใช้ e-doc ไม่ตรงวัตถุประสงค์ — [PSU](https://hr.psu.ac.th/file%202568/pdf/7.วาระ%20การเสนอเอกสารทางระบบ%20Edoc.pdf)

### Win themes (ผูกกับหลักฐาน)
1. **"ระบบเดียว 17 วิทยาเขต + โรงเรียนกีฬา แต่กติกาแต่ละวิทยาเขตยังเป็นของตัวเอง"** (multi-tenant + config ราย OrgUnit) อ้างแบบอย่าง มทร.ล้านนา 6 เขตพื้นที่ ([dev.rmutl](https://dev.rmutl.ac.th/)) และข้อเท็จจริงใน blueprint §2 (รับสมัครแยกวิทยาเขต)
2. **"ลงทะเบียนวันพีคไม่ล่ม"** มี load test เป็น deliverable ในงวดงาน, virtual waiting room และ SLA กู้ระบบ (RTO) ตอบ pain point ที่งานวิจัย REG ไทยชี้ไว้
3. **"Athlete-first"** ใช้ blackout ปฏิทินกีฬา ลา/สอบชดเชยยกทีม และเชื่อมผลงานกีฬากับทุน ไม่มี vendor REG ไทยรายใดที่พบในรอบนี้มีฟังก์ชันนี้ (🟡 ต้องยืนยันด้วยการสำรวจคู่แข่ง)
4. **"Compliance-ready ตั้งแต่วันแรก"** ได้แก่ PDPA (ข้อมูลสุขภาพนักกีฬาเป็น sensitive data), กยศ., ITA/OIT, รายงาน อว. และ ThaiD ลดความเสี่ยงของผู้บริหาร
5. **"Phased, budget-safe"** แบ่งเฟสตามปีงบให้รองรับงบ −7.39% และการเปลี่ยนกระทรวง โดย ministry/codes เป็น configuration
6. **"No lock-in"** ส่งมอบ source code, เอกสาร และ escrow ถ่ายทอดความรู้ให้ทีม IT มกช. ซึ่งลดแรงต้านจากทีม in-house ได้ด้วย
7. **"Adoption ไม่ใช่แค่ติดตั้ง"** มี change management และ champion รายวิทยาเขต ตอบบทเรียน e-doc ของ ม.อ.

### Inferences (🟡)
- คุณสมบัติที่ TOR น่าจะขอ: นิติบุคคล + e-GP, ผลงานหน่วยงานรัฐ ≥ 30–50% ของวงเงินภายใน 3–5 ปี, ISO/IEC 27001 (ของบริษัทหรือ DC), บุคลากรหลักพร้อม CV (PM ที่มี PMP, SA, DBA, Security), และอาจขอ CMMI-DEV ML3 หรือ ISO/IEC 29110 ในงานใหญ่ ทั้งหมดนี้เป็น industry norm ที่ยังไม่ยืนยันใน TOR มหาวิทยาลัย
- Consortium pattern: SI รายใหญ่ (ผลงานมูลค่าสูงและหลักประกัน) + software house ไทยเฉพาะทาง REG/sports + พันธมิตร cloud/DC ที่ได้ ISO 27001 ระวังการยื่นแบบ "กิจการร่วมค้า" ซึ่งต้องมีสัญญาร่วมค้าและผู้นำที่ถือผลงาน
- ถ้า มกช. จ้างที่ปรึกษาเขียน TOR ก่อน (pre-TOR consulting) ผู้รับจ้างที่ปรึกษามักถูกห้ามยื่นงานพัฒนา (conflict of interest) ต้องเลือกบทบาทให้ชัด

### Gaps
- ยังไม่มี TOR งานพัฒนา REG/SIS ฉบับเต็มที่แสดงน้ำหนักคะแนนจริง
- ยังไม่ยืนยันข้อกำหนด CMMI/ISO ในงานมหาวิทยาลัยไทย

---

## 5. Business case สำหรับ มกช.

### Takeaway
ไม่พบตัวเลขการประหยัดเป็นบาท/ปีจาก digital transformation ของมหาวิทยาลัยไทยที่เผยแพร่ หลักฐานที่ใช้ได้เป็นร้อยละจากองค์กรอื่น (e-document ลดต้นทุนเอกสาร ~4%, ลดเวลา ~43%, ลดความผิดพลาด ~54% จากกรณีบริษัทโลจิสติกส์) Business case จึงต้องเป็น **แบบจำลองพารามิเตอร์** ที่ใช้ baseline จริงของ มกช. (วัดในช่วง discovery) และนำเสนอแบบ "คุณค่าสาธารณะ + KPI" ตามกรอบรัฐ (ITA/OIT, ก.พ.ร., ความคุ้มค่า ม.8 พ.ร.บ.จัดซื้อฯ) มากกว่า ROI เชิงกำไร

### Cited Findings
- e-document/อิเล็กทรอนิกส์: ลดต้นทุนเอกสาร ~4%, ลดเวลา ~43%, ลดความผิดพลาด ~54% (บริษัทโลจิสติกส์ ไม่ใช่มหาวิทยาลัย) — [CUIR](https://cuir.car.chula.ac.th/dspace/handle/123456789/80647?mode=full)
- งานวิจัยระบบคำร้องออนไลน์ e-Form บัณฑิตวิทยาลัย มมส. (กลุ่มตัวอย่าง 492 คน) ไม่พบตัวเลขผลลัพธ์ใน snippet — [EDUCLoei](https://so03.tci-thaijo.org/index.php/EDUCLoei/article/view/277221/version/51147)
- ITA: OIT เปิด 2 มี.ค.–30 มิ.ย. (blueprint §2)

### แบบจำลอง Business case (🟡 สูตรและสมมติฐาน ต้องแทนค่าด้วย baseline จริง)

ตัวแปรร่วม: N_stu = 12,000 (นศ.), N_sch = นร.โรงเรียนกีฬา (ต้องตรวจ), C_hr = ต้นทุนบุคลากรต่อชั่วโมง ≈ 250 บาท (สมมติจากเงินเดือน+สวัสดิการ ~35–40k/เดือน ÷ 160 ชม.), 17 วิทยาเขต

| # | Benefit line | สูตร | สมมติฐานตั้งต้น (🟡) | ตัวอย่างผล/ปี |
|---|---|---|---|---|
| B1 | ชั่วโมงงานทะเบียน (เพิ่ม-ถอน, ตรวจเงื่อนไข, ออกเอกสาร) | N_stu × r_req × t_saved × C_hr | ปีละ 6 คำร้อง/นศ., ประหยัด 15 นาที/คำร้อง | 12,000×6×0.25×250 = **4.5M** |
| B2 | รับสมัครหลายรอบหลายวิทยาเขต (ตรวจเอกสาร ประกาศผล รายงานตัว) | N_app × t_saved × C_hr | ผู้สมัคร 20,000/ปี (ต้องตรวจ) ประหยัด 20 นาที/ราย | 20,000×0.33×250 = **1.67M** |
| B3 | กระทบยอดการชำระเงิน (Bill Payment/QR ผูก ref) | N_txn × t_saved × C_hr + ลดความผิดพลาด | 2 txn/นศ./ภาค × 2 ภาค, ประหยัด 10 นาที/txn | 48,000×0.167×250 = **2.0M** |
| B4 | กระดาษ/พิมพ์/ไปรษณีย์ (ใบคำร้อง ทรานสคริปต์ ใบเสร็จ) | N_doc × c_doc | 20 แผ่น/นศ./ปี × 1.5 บาท + ไปรษณีย์ | ~0.4–0.6M |
| B5 | ลด dropout (retention ผ่าน early-warning) | ΔR × N_stu × รายได้ค่าธรรมเนียม/นศ./ปี (+เงินอุดหนุนรายหัว) | ΔR = 0.5 จุด%, ค่าธรรมเนียม ~15k/ปี | 60×15,000 = **0.9M** + ผลทางสังคม |
| B6 | รายได้หลักสูตรกีฬาสาธารณะ/ค่ายกีฬา/อบรมโค้ช (portal ขายออนไลน์) | N_extra × price × margin | ผู้เข้าร่วมเพิ่ม 2,000 คน/ปี × 1,500 บาท × 40% | **1.2M** |
| B7 | รายงาน/ITA/QA เร็วขึ้น (รวบรวม 17 วิทยาเขต) | N_reports × t_saved × C_hr | 40 รายงาน/ปี × 17 วข. × ประหยัด 8 ชม. | 5,440×250 = **1.36M** |
| B8 | ลดการรวม/บำรุงระบบซ้ำซ้อนรายวิทยาเขต (decommission) | Σ ค่า MA/hosting ระบบเดิม | ต้องสำรวจ: สมมติ 17 × 100k | **1.7M** |
| B9 | หลีกเลี่ยงความเสี่ยง (PDPA breach, ระบบล่มช่วงลงทะเบียน) | P(event) × impact | ค่าปรับ PDPA สูงสุด 5M (sensitive) × P 5% | 0.25M (expected) |
| **รวม (illustrative)** | | | | **~14–15M บาท/ปี** (ส่วนใหญ่เป็น capacity release ไม่ใช่เงินสด) |

- **ต้นทุน (🟡):** CAPEX 28–56M (ข้อ 3) + cloud/infra 2–4M/ปี + MA 15–20% ของ CAPEX/ปี
- **ตัวชี้วัดทางการเงิน:** NPV 5 ปี = Σ_{t=1..5} (B_t − O_t)/(1+r)^t − CAPEX, r ≈ 3% (สมมติอัตราคิดลดภาครัฐ); payback ≈ CAPEX ÷ (B − O) ⇒ ราว 3–5 ปีในกรณีกลาง ข้อสำคัญคือ **B1–B3 และ B7 เป็นเวลาที่ปลดปล่อยไปทำงานบริการ ไม่ใช่เงินที่คืนงบ** ต้องเขียนให้ชัดเพื่อความน่าเชื่อถือต่อ สงป./กรรมการ
- **การนำเสนอต่อหน่วยงานรัฐ:** (1) ผูกกับยุทธศาสตร์มหาวิทยาลัยและแผนรัฐบาลดิจิทัล (2) KPI ที่วัดได้ เช่น % บริการออนไลน์ end-to-end, เวลาเฉลี่ยอนุมัติคำร้อง, ความพึงพอใจ นศ., uptime ช่วงลงทะเบียน, คะแนน ITA/OIT ด้านการเปิดเผยข้อมูล, เวลาส่งรายงาน อว. (3) คุณค่าสาธารณะ ได้แก่ ความเท่าเทียมของนักศึกษาต่างจังหวัด/นักกีฬาที่ไม่ต้องเดินทาง ความโปร่งใส และข้อมูลกีฬาสำหรับนโยบายชาติ (4) ใช้ baseline-measurement ในเฟส discovery เป็น deliverable เพื่อยืนยันตัวเลขแทนการกล่าวอ้าง

### Gaps
- ไม่มี benchmark บาท/ปีของการ digitize งานทะเบียนในมหาวิทยาลัยไทย
- ไม่มีข้อมูลจำนวนผู้สมัคร อัตรา dropout ค่าธรรมเนียมเฉลี่ย หรือรายได้หลักสูตรกีฬาสาธารณะของ มกช.
- ยังไม่ยืนยันอัตราคิดลดที่ สงป./สศช. ใช้

---

## 6. ความเสี่ยงของผู้ยื่นข้อเสนอ (Bidder risks)

| ความเสี่ยง | ผลกระทบ | การรับมือ | ระดับหลักฐาน |
|---|---|---|---|
| ราคากลางต่ำกว่าต้นทุนจริง (คกก. ใช้ฐานเงินเดือนราชการ) | ขาดทุนหรือเสนอไม่ได้ | ให้ข้อมูลราคาตลาดในช่วงรับฟังร่าง TOR (ข้อ 45) และอ้างวิธี PDMO multiplier | 🟡 (GSB/SEC ✅ เป็นตัวอย่าง) |
| งบ −7.39% และการเปลี่ยนกระทรวงทำให้โครงการเลื่อนหรือถูกหั่น | pipeline ไม่แน่นอน | เสนอ phased + option และใช้งบเงินรายได้ร่วม | ✅ (tnsu_profile) |
| Scope creep จากความต่างของ 17 วิทยาเขต | งานเกินสัญญา | configuration-first, change control, ระบุ "ขอบเขตปรับแต่งต่อวิทยาเขต" ใน TOR | 🟡 |
| ค่าปรับรายวัน 0.01–0.20% (ข้อ 162) และหลักประกัน 5% | กระแสเงินสด | milestone ย่อย, ขอให้ตรวจรับรายงวดเร็ว | thai_gov_compliance.md (🟡 ตัวเลขต้องตรวจ) |
| ตรวจรับล่าช้าหรือคณะกรรมการตรวจรับเปลี่ยนตัว | จ่ายเงินช้า | เกณฑ์ตรวจรับที่วัดได้ (UAT script) ในภาคผนวกสัญญา | 🟡 |
| แรงต้านจาก IT in-house และผู้ใช้ระบบเดิม (adoption) | ระบบไม่ถูกใช้ | champion รายวิทยาเขต และ transfer source code/ความรู้ | ✅ (PSU e-doc) |
| Peak load วันลงทะเบียน/ประกาศผล | ชื่อเสียงสาธารณะ | load test เป็น deliverable และ waiting room | ✅ (MSU/Mahidol studies) |
| PDPA ข้อมูลสุขภาพนักกีฬา (processor liability) | ปรับทางปกครอง ≤5M และชื่อเสียง | DPA, ISO 27001, pentest ประจำปี | ✅ (thai_gov_compliance.md) |
| SME/MiT margin ทำให้คู่แข่ง SME ชนะแม้ราคาสูงกว่า ≤10% | แพ้ราคา | จับคู่กับ SME หรือขึ้นทะเบียน ThaiSME-GP | ✅ |
| Incumbent lock-in ในเฟสต่อไป (สำหรับผู้แพ้) / ข้อกล่าวหาล็อกสเปก (สำหรับผู้ชนะ) | อุทธรณ์ 7 วัน, ITA | ใช้ open standard และ interface spec สาธารณะ | 🟡 |
| ต้นทุน MA ถูกกดในปีหลัง (MA รายปีต้องผ่านงบใหม่) | margin หาย | ราคา MA ระบุในสัญญาหลักเป็น option ล่วงหน้า | 🟡 |

---

### หมายเหตุโดเมนที่เข้าถึงไม่ได้ (fetch failed, ENOTFOUND)
`www.stou.ac.th`, `eprocurement.swu.ac.th`, `lanna.co.th`, `eng.kku.ac.th`, `www.onep.go.th` (รอบนี้) และ `gprocurement.go.th`, `tnsu.ac.th` (รอบก่อน) ถ้าต้องการตัวเลขมูลค่าสัญญาจริงและตารางอัตรา PDMO ต้องเพิ่มโดเมนเหล่านี้และ `consultant.pdmo.go.th` ใน network allowlist ของ session
