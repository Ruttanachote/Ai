# รายงานทบทวนอิสระ: การปฏิบัติตามกฎหมาย/มาตรฐานภาครัฐ การจัดซื้อ และความสัมพันธ์กับหน่วยงานรัฐ — ระบบสารสนเทศ มกช. (TNSU)

> **ผู้ทบทวน:** Independent reviewer (มุมมอง Thai public-sector IT compliance, procurement, government relations)
> **วันที่:** 28 ต.ค. 2569 (2026-10-28)
> **เอกสารที่ทบทวน (อ่านครบ):** `tnsu-system/docs/system-design.md` (v0.9), `tnsu-system/docs/government-relations.md` (v0.1), `research_notes/.../thai_gov_compliance.md`, `research_notes/.../external_integrations.md`
> **ขอบเขต:** ทบทวนเท่านั้น ไม่ได้แก้ไขไฟล์ออกแบบ
>
> **ป้ายสถานะหลักฐาน**
> - ✅ = มีแหล่งอ้างอิง (URL ในหัวข้อ 5) ส่วนใหญ่ยืนยันจาก **search snippet** ไม่ได้อ่านตัวบทฉบับเต็ม
> - 🟡 = ความรู้ของผู้ทบทวน/อนุมาน ยังไม่ได้ยืนยันจากแหล่งในรอบนี้ ต้องตรวจกับราชกิจจานุเบกษาหรือหน่วยงานเจ้าของก่อนใส่ใน TOR
>
> **ข้อจำกัด:** โดเมน .go.th/.or.th และ tilleke.com ถูกบล็อกจากเครือข่ายของ session (fetch ได้ `ENOTFOUND`) จึงใช้ได้เพียงผลสรุปของ search engine ถ้าต้องการอ่านฉบับเต็ม ต้องเพิ่ม tilleke.com, pdpc.or.th, oic.go.th, standard.dga.or.th, etda.or.th, ratchakitcha.soc.go.th ใน allowlist ของ session

---

## 1. สรุปผู้บริหาร: ประเด็นสำคัญ 10 อันดับ

| # | ประเด็น | ความรุนแรง | สิ่งที่ต้องเปลี่ยน (สรุป) |
|---|---|---|---|
| 1 | **ไม่มี พ.ร.บ.ข้อมูลข่าวสารของราชการ พ.ศ. 2540 เลย** ทั้งใน design และ government-relations (ค้นแล้วพบ 0 ครั้ง) ทั้งที่ มกช. เป็นหน่วยงานของรัฐ เรื่องนี้ครอบคลุม ม.7 (ลงราชกิจจาฯ), ม.9 (จัดให้ประชาชนตรวจดู/ศูนย์ข้อมูลข่าวสาร), ม.11 (คำขอข้อมูล), ม.14–15 (ข้อยกเว้น), หมวด 3 ข้อมูลข่าวสารส่วนบุคคล และ ม.26 (ส่งหอจดหมายเหตุ) ✅/🟡 | สูง | เพิ่มโมดูล **Official Information Request (OIR)** ที่ใช้ workflow ร่วมกับ DSR (PDPA) และ OIT (ITA) เพิ่ม stakeholder "สำนักงานคณะกรรมการข้อมูลข่าวสารของราชการ (สขร.)" และเพิ่มชั้นความลับทางราชการ (ลับ/ลับมาก/ลับที่สุด) เข้าไปใน data classification |
| 2 | **ไม่มี Regulatory Reporting Hub** แม้ GR ระบุเป็น backlog อันดับ 1 (REG-HUB-01/02, `regulatory_obligation` + scheduler T-30/T-7/T-1 + evidence store) แต่ design มีเพียง ANA "รายงานส่ง สป.อว./ต้นสังกัด" และ job monitor ใน ADMIN | สูง | เพิ่ม bounded context `RPT` (Regulatory Reporting): obligation registry, report catalogue + template version, validation ก่อน export, หลักฐานการส่ง (hash + ผู้ส่ง + ใบตอบรับ) ใน Phase 1 |
| 3 | **การโอนข้อมูลข้ามประเทศขัดกับนโยบายของ design เอง** หัวข้อ 10.1 เขียนว่า "ห้าม SaaS ต่างประเทศสำหรับ PII" แต่ design ใช้ Google/M365 mailbox, LINE OA/LIFF, FCM/APNs, SMS gateway, wearable clouds (Catapult/Polar/Garmin), Turnitin, CDN/WAF และอาจใช้ Queue-it ✅ (ประกาศ cross-border 2566) | สูง | ทำ Transfer Impact Assessment รายผู้ให้บริการ, ใช้มาตรการตาม ม.28/29 (SCC/BCR ตามประกาศ สคส.), ระบุประเทศปลายทางใน privacy notice, จำกัด payload และเพิ่มผู้ให้บริการเหล่านี้เป็น stakeholder/processor ใน GR |
| 4 | **ใบอนุญาต OSS ใน stack ไม่ "open source/ไม่มีค่า license" ตามที่ design อ้าง** Teleport CE ตั้งแต่ v16 เป็น commercial license ที่จำกัดองค์กร ≥100 คน (มกช. มี 2,700 คน), Vault เป็น BSL 1.1 (ผู้ให้สิทธิ์ปัจจุบันคือ IBM), MinIO เป็น AGPL และ upstream หยุดแจก binary (ต.ค. 2568) และถูก archive (2569), Grafana/Loki/Tempo และ Zammad เป็น AGPL, Redis 7.4+ ไม่ใช่ BSD ✅/🟡 | สูง | ใช้ license policy + SBOM gate, เปลี่ยนเป็น OpenBao, Valkey, OpenTofu, Ceph RGW/SeaweedFS หรือ object storage ของ GDCC, JumpServer/Boundary-OSS แทน Teleport และเขียน obligation ของ AGPL ลง TOR |
| 5 | **ความเสี่ยงด้านการจัดซื้อ: เอกสารนี้เขียนโดยผู้เสนอราคา และระบุชื่อผลิตภัณฑ์/ยี่ห้อ** (Keycloak, Flowable, ClickHouse ฯลฯ) ถ้านำไปใช้เป็นฐานของ TOR จะเสี่ยงทั้งการล็อกสเปกและผลประโยชน์ขัดกัน (พ.ร.บ.จัดซื้อฯ 2560 ม.13 และหลักการ ม.8 🟡) R-15 ยอมรับประเด็นนี้แต่ยังไม่มีมาตรการ | สูง | แยกเป็น "capability/standards spec" ที่ไม่ระบุยี่ห้อสำหรับ TOR, แยกผู้ร่าง TOR หรือที่ปรึกษาออกจากผู้พัฒนา, มีหนังสือแสดงความไม่มีส่วนได้เสีย, ใส่ข้อตกลงคุณธรรม (ถ้าเข้าเกณฑ์) และเปิดรับฟังร่าง TOR |
| 6 | **ฐานทางกฎหมายข้อมูลสุขภาพนักกีฬาพึ่ง consent มากเกินไป** ใน sequence 5.8 ถ้าไม่มี consent ระบบจะไม่ยอมให้บันทึกการบาดเจ็บ ซึ่งขัดกับหน้าที่ดูแลความปลอดภัยและกรณีฉุกเฉิน (ม.26(1) ประโยชน์สำคัญต่อชีวิต; ม.26(5) 🟡) อีกทั้ง consent ของนักกีฬาทุนอาจไม่เป็นอิสระเพราะมีความสัมพันธ์เชิงอำนาจ นอกจากนี้ สคส. เปิดรับฟังร่างแนวปฏิบัติเรื่องฐานทางกฎหมาย (7 ก.ค. 2569) และมีร่างแก้ไข PDPA ที่เปลี่ยน consent ให้เป็นฐานหนึ่งในเจ็ดฐาน ✅ | สูง | ทำ lawful-basis matrix ราย purpose: บันทึก incident/การปฐมพยาบาลใช้ ม.26(1)/(5) โดยไม่ block, ใช้ consent เฉพาะการใช้งานเสริม (wellness รายวัน, วิจัย, เผยแพร่) และออกแบบให้เปลี่ยนตามร่างแนวปฏิบัติได้ |
| 7 | **ไม่มีระบบคุ้มครองเด็ก (safeguarding) สำหรับโรงเรียนกีฬาแบบประจำ** มีเพียง leave pass และ safety check-in ยังไม่มีการรับแจ้งเหตุล่วงละเมิด/ทารุณกรรม, ช่องทางส่งต่อเจ้าหน้าที่ตาม พ.ร.บ.คุ้มครองเด็ก 2546 🟡, การควบคุมการสื่อสารส่วนตัวระหว่างโค้ชกับเด็ก, การตรวจประวัติบุคลากร และ DPIA สำหรับผู้เยาว์ | สูง | เพิ่ม Safeguarding case module (แยกสิทธิ์ ปิดลับ มี SLA ส่งต่อ), กติกา "two-adult rule" ในการส่งข้อความ, ลงทะเบียนการตรวจประวัติบุคลากร และ DPIA ผู้เยาว์บังคับก่อน Phase 3 |
| 8 | **ลายมือชื่ออิเล็กทรอนิกส์ยังไม่แยกระดับ และไม่มี long-term validation** สำหรับเอกสารที่ต้องเก็บถาวร (transcript, ปริญญา, คำสั่ง) ตาม พ.ร.บ.ธุรกรรมฯ ม.9/26/28 และ ขมธอ. 23-2563 ✅ รวมถึง PDF/A-3 + PAdES ตาม ขมธอ. 11-2560 ✅ | กลาง–สูง | ทำ signature policy matrix ต่อประเภทเอกสาร, ใช้ PAdES-B-LTA/XAdES-A ร่วมกับ TSA ที่เชื่อถือได้, ประทับเวลาซ้ำก่อนใบรับรองหรืออัลกอริทึมหมดอายุ และนำ "digital preservation" เข้า retention |
| 9 | **TM30 และการแจ้งที่พักคนต่างด้าวภายใน 24 ชม.** (พ.ร.บ.คนเข้าเมือง ม.38 ✅) ถูกวางไว้ใน X-13 Phase 6 (M37–48) แต่หอพักซึ่งเป็นผู้มีหน้าที่แจ้งเริ่มใช้งานใน Phase 2 ส่วน GR 4.9 ผูก TM30 ไว้กับหอพัก | กลาง–สูง | ให้ HOU check-in ของคนต่างด้าวสร้าง task TM30 (portal-assist) ตั้งแต่ Phase 2 และนำ visa/90-day alert ขั้นต่ำมาไว้ใน REC |
| 10 | **ภาระด้านความโปร่งใส/ตรวจสอบมาช้ากว่ารอบ ITA** ทั้ง OIT CMS (X-10 Phase 5), complaint module (ไม่มี), e-Meeting สภา (X-09 Phase 5 ทั้งที่ W-06/W-08 ใช้มติสภาตั้งแต่ Phase 1–2), procurement/e-GP (ระบุว่า "ไม่เชื่อมต่อ") และ KPI hub (Phase 6) | กลาง | ย้าย complaint/integrity module และ OIT data feed มาไว้ใน Phase 1–2, บันทึกมติแบบ manual ใน W-06/W-08 ก่อนมี e-Meeting และให้ X-04 เก็บ e-GP project ID + สถิติ สขร.1 |

---

## 2. ตาราง mapping ข้ามเอกสาร (Cross-document mapping)

### 2.1 ภาระ/ความสัมพันธ์ใน government-relations.md ที่ยัง map ไม่ครบใน system-design.md

สถานะ: **ครบ** = มีโมดูล/รายงาน/integration รองรับ · **บางส่วน** = มีแต่ไม่ครบหรือมาช้า · **ไม่มี** = ไม่พบใน design

| GR อ้างอิง | ภาระ / ความต้องการ | ใน design | สถานะ | ข้อเสนอ |
|---|---|---|---|---|
| §7 REG-HUB-01/02, §5 | Regulatory obligation registry + scheduler + evidence store + report catalogue/validation | ไม่มีโมดูล มีเพียง ANA "รายงานส่ง สป.อว." + ADMIN job monitor | **ไม่มี** | เพิ่ม context `RPT` (ประเด็น #2) |
| §4.1, §6 ORG-01 | `external_code(scheme…)` ต่อ OrgUnit (GFMIS_AGENCY, BUDGET_CODE, EGP_DEPT, MHESI_INST, OBEC_SCHOOL, KSP_INST, SARABAN_PREFIX) แบบ effective-dated | `ParentAgency(codes)` ระดับมหาวิทยาลัย + GFMIS mapping ใน config | บางส่วน | เพิ่ม entity `ExternalCode(org_unit, scheme, code, valid_from/to)` ระดับวิทยาเขต/โรงเรียน |
| §6 | "Ministry change runbook" เป็น acceptance criterion ของ TOR | R-04 พูดถึง config แต่ไม่มี acceptance test | บางส่วน | เพิ่มเป็น test case ใน 12.2 MS-0/MS-2 |
| §4.1 | Policy & regulation register (อ้าง ราชกิจจาฯ เล่ม/ตอน/หน้า) | PolicySet อ้างเลขข้อบังคับ แต่ไม่มีทะเบียนกฎหมาย | บางส่วน | เพิ่ม `RegulationRegister` (ใช้ร่วม OIA ม.7) |
| §3.1, §4.1 | Council e-Meeting เชื่อมมติสภากับ workflow | X-09 อยู่ใน Phase 5 แต่ W-06/W-08 ต้องใช้ตั้งแต่ Phase 1–2 | บางส่วน (ช้า) | ใน Phase 1 ให้บันทึกเลขที่/วันที่มติ + แนบรายงานการประชุมแบบ manual |
| §3.3, §4.3 TCH-01 | คุรุสภา: เพดานจำนวนรับต่อหลักสูตร (hard stop), อัตราส่วนครูพี่เลี้ยง 1:3 และอาจารย์นิเทศ 1:10, ฝึกสอนตั้งแต่ปี 1 | PRA/3A.4 ไม่มีการตรวจ ratio หรือ cap; ADM ไม่มี enrolment cap ตามคุรุสภา | **ไม่มี** | ใส่ ratio/cap เป็น DMN rule ใน PRA + `ProgramSeat.ksp_cap` ใน ADM (ค่าเป็น config 🟡) |
| §3.7, §4.3 | ติดตามใบอนุญาตครูของครูโรงเรียนกีฬา (เตือนล่วงหน้า 6 เดือน), ใบอนุญาตโค้ช/ผู้ตัดสิน | X-01 (Phase 5) กล่าวถึงใบอนุญาตโค้ชเท่านั้น | บางส่วน | `ProfessionalLicence` ใน HR adapter ตั้งแต่ Phase 3 (ก่อนโรงเรียนกีฬา go-live) |
| §3.3, §3.4 | สมศ. (ขั้นพื้นฐานรอบห้า + อุดมศึกษา): SAR, evidence repository | ไม่พบ "สมศ" ใน design | **ไม่มี** | เพิ่ม QA evidence store ใน ANA (แยก profile BASIC_ED/HIGHER_ED) |
| §3.4, §4.4 | ก.พ.ร. (คำรับรอง/KPI, PMQA 4.0, DG Readiness), KPI hub | X-03 Phase 6; ANA dashboard | บางส่วน (ช้า) | ย้าย KPI model (indicator→owner→source→target→actual) มาไว้ใน ANA Phase 4 |
| §3.4, §4.4 GOV-01 | Complaint & integrity module (รวมช่องทางไม่ระบุตัวตน, SLA, สถิติรายไตรมาส สำหรับ ITA/ป.ป.ท./ผู้ตรวจการแผ่นดิน) | ANA กล่าวถึงเพียง "สถิติข้อร้องเรียน" และไม่มี complaint entity | **ไม่มี** | เพิ่ม `CMP` module (Phase 1–2) + legal hold |
| §3.4 | OIT publishing พร้อม snapshot รายปี | X-10 (Phase 5) + ANA mart | บางส่วน (ช้า) | สร้าง OIT data export/snapshot ใน ANA Phase 2 โดยยังไม่ต้องมี CMS |
| §3.5, §4.5 | e-GP project ID, บก.01/บก.05, สถิติจัดซื้อรายเดือน (OIT, สขร.1) | 1.4 ระบุว่า "e-GP ไม่เชื่อมต่อ"; X-04 อยู่ใน Phase 6 | บางส่วน | อย่างน้อยเก็บ e-GP ref + ข้อมูลสรุปสำหรับ OIT ใน X-04 และพิจารณาเลื่อนเฟส |
| §3.5, §4.5 | ภาษี ภ.ง.ด.1/3/53, 50 ทวิ, e-Donation, VAT/e-Tax Invoice สำหรับรายได้เชิงพาณิชย์ (เช่าสนาม) | FIN มีค่าบริการภายนอก + e-Donation [ต้องตรวจสอบ] แต่ไม่มี WHT/VAT | **ไม่มี** (WHT/VAT) | เพิ่ม tax code ใน FeeItem/FAC charges และ WHT สำหรับการจ่ายเงินให้นักศึกษา/วิทยากร |
| §3.5, §4.5 | ประกันสังคม, กบข./PVD, `employment_scheme` | out-of-scope (X-02) | บางส่วน | ยอมรับได้ แต่ต้องรองรับ StudentJob (ดู C-15) |
| §3.5 | ราชพัสดุ (เลขทะเบียน ทร.) | X-04 Phase 6 | บางส่วน | เพิ่ม attribute ใน `Facility`/`Building` |
| §3.6, §4.6 | Sponsor billing (กยศ./กองทุนกีฬา/กสศ./ทุนภายใน) แยกจากนักศึกษา | FIN มี waiver/ทุน แต่ไม่มี third-party payer account | บางส่วน | เพิ่ม `SponsorAccount` + split invoice |
| §3.6 | กสศ. | ไม่พบ | **ไม่มี** | เพิ่มเป็นประเภทแหล่งทุนใน SCH |
| §3.11, §4.11 | กองทุนพัฒนาการกีฬาแห่งชาติ: ใบรับรองเกรด, รายงานผลโครงการ (output/outcome) | SCH ทั่วไป ไม่มี grant reporting | บางส่วน | เพิ่ม `ExternalGrant` + รายงานตามแบบ |
| §3.6 | กรมการจัดหางาน: work permit อาจารย์/โค้ชต่างชาติ | ไม่พบ | **ไม่มี** | ฟิลด์ใบอนุญาตทำงาน + วันหมดอายุใน HR adapter (Phase 5) |
| §3.8 | DG Readiness evidence, NCSA ประเมินตนเองรายปี | ไม่มีหลักฐานแบบรวมศูนย์ | บางส่วน | เก็บใน evidence store ของ `RPT` |
| §3.8 | สสช. / สกศ. (statistical export) | ไม่มี | **ไม่มี** (ต่ำ) | ใช้ report catalogue |
| §3.9 | ทะเบียนราษฎร (linkage ผ่าน MOU) | REC เขียนว่า "กรมการปกครอง (ไม่มี)" | **ไม่มี** | ทางเลือกใน Phase 2+ สำหรับตรวจสถานะบุคคล/ผู้ปกครอง ผ่าน GDX/ศูนย์เชื่อมโยง 🟡 |
| §3.9, §4.9 | TM30 จากหอพัก, visa expiry, 90-day alert | X-13 Phase 6 | บางส่วน (ช้า) | ประเด็น #9 |
| §3.9 | กระทรวงการต่างประเทศ (legalisation) | ไม่มี | **ไม่มี** (ต่ำ) | สถานะคำขอใน GRD |
| §3.9, §4.9 | รด.: สถานะเพื่อคำนวณสิทธิผ่อนผัน + ชนตารางแข่ง | AFF กล่าวถึง "นักศึกษาวิชาทหาร (รด.)" เพียงชื่อ | บางส่วน | `RotcEnrollment` + constraint ใน ATH/REG |
| §3.11 | MOU registry (สมาคม/มหาวิทยาลัยต่างประเทศ), ตรวจหลักฐานผลงานกีฬากับสมาคม | PRA มี MOU ของโรงเรียนฝึก; ADM มี SportAchievement แต่ไม่มี verification | บางส่วน | `PartnerAgreement` ร่วม (MOU/DSA/DPA) + สถานะการตรวจหลักฐาน |
| §3.11 | สถาบัน/ศูนย์วิทยาศาสตร์การกีฬา: data-sharing agreements | ไม่มี | **ไม่มี** | DSA template + บันทึกใน PRIV |
| §3.11 | แผนพัฒนาการกีฬาแห่งชาติ ฉบับที่ 7 → KPI | X-03 Phase 6 | บางส่วน | รวมใน KPI hub |
| §3.12 | NRIIS, สกสว./PMU, EC/IRB, ThaiJO | X-05 Phase 6 | บางส่วน | ต้องมี ethics gate ก่อนใช้ข้อมูล ATH เพื่อวิจัย (Phase 3) ดู C-22 |
| §3.13, §4.13 | บัญชีขอทำลาย/ส่งมอบเอกสารให้กรมศิลปากร | 6.5 กล่าวถึง; DOC มี RetentionClass แต่ไม่มี disposal workflow | บางส่วน | `DisposalBatch` workflow (คณะกรรมการทำลาย → บัญชี → หอจดหมายเหตุ) |
| §3.14 | ThaiLIS (ส่งวิทยานิพนธ์) | X-06/X-08 ใช้ DSpace แต่ไม่กล่าวถึง ThaiLIS | บางส่วน | export adapter |
| §3.4 | EIT: รายชื่อผู้มีส่วนได้เสียภายนอก | ไม่มี | **ไม่มี** (ต่ำ) | export จาก ALU/FAC/PRA contacts (ต้องมีฐาน PDPA) |
| §5 | ปฏิทินรายงาน + แจ้งเตือน T-30/T-7/T-1 + dashboard ต่อวิทยาเขต | ไม่มี | **ไม่มี** | อยู่ใน `RPT` |
| §1.2 (design) | stakeholder "สคช./ป.ป.ช. (ITA)" | — | ไม่สอดคล้อง | ควรเป็น "สำนักงาน ป.ป.ช." (สคช. เป็นอีกหน่วยงาน) |

**ส่วนที่ map ครบแล้ว (ตัวอย่าง):** ThaID, TCAS, กยศ. DSL, CHECO, ฐานข้อมูลอุดมศึกษา, ภาวะการมีงานทำ, Digital Transcript, ธนาคาร/Thai QR, GFMIS, e-Payment, คุรุสภา (รายชื่อผู้สำเร็จ), O-NET/สพฐ., ก.ก.ม.ท., DCAT (ไม่เก็บ whereabouts), ผ่อนผันทหาร/สัสดี, eduroam, Moodle, GD Catalog, NCSA/ThaiCERT, PDPC breach, e-Saraban, พิธีพระราชทานปริญญาบัตร, ผู้ปกครองผู้เยาว์, ประกันอุบัติเหตุ

### 2.2 Integration ใน design ที่ไม่มี stakeholder entry ใน government-relations.md

| Design ref | ระบบ/ผู้ให้บริการ | ทำไมต้องมีใน GR | ข้อเสนอ |
|---|---|---|---|
| I-19, 4.1 | Google Workspace / Microsoft 365 | เป็นผู้ประมวลผล (processor) ต่างประเทศสำหรับอีเมลนักศึกษา/บุคลากร: ต้องมี DPA, cross-border, ITA/Cloud First | เพิ่มหมวด "ผู้ให้บริการดิจิทัลภาคเอกชน/ผู้ประมวลผล" |
| I-24 | LINE (LY Corp) Messaging API/LIFF | ผูก LINE userId กับนักศึกษา/ผู้ปกครองผู้เยาว์ ซึ่งเป็นข้อมูลส่วนบุคคล; ข้อมูลอาจอยู่นอกประเทศ 🟡 | เหมือนข้างบน + TIA |
| I-25 | FCM/APNs, SMS gateway, SMTP relay | device token และเบอร์โทร | เหมือนข้างบน |
| I-23 | Catapult, Polar, Garmin (vendor cloud) | ข้อมูลสุขภาพ/biometric ของนักกีฬา (รวมผู้เยาว์) ไหลผ่าน cloud ต่างประเทศ | ต้องมี DPA + TIA + DPIA; ต้องให้ ATH ดึงข้อมูลโดยไม่ทำให้นักกีฬาผูกบัญชีส่วนตัวเองโดยไม่มีการแจ้ง |
| I-32 | อักขราวิสุทธิ์ / Turnitin | Turnitin เก็บเนื้อหาวิทยานิพนธ์ในต่างประเทศ (IP + PII) | DPA + ตัวเลือก "no repository" 🟡 |
| A-28, 4.8, 4.20 | CA ผู้ออกใบรับรอง / TSA / ผู้ให้บริการ HSM (เช่น CA ภายใต้ NRCA) | trust anchor ของ e-Transcript และคำสั่ง | เพิ่ม stakeholder "CA/TSA ที่อยู่ใต้ NRCA (ETDA)" |
| 10.3, ADR-011 | CDN/WAF/DDoS provider, Queue-it (ทางเลือก) | IP/คุกกี้ผ่านผู้ให้บริการต่างประเทศ | ระบุใน ROPA/TIA |
| 8.1 | ผู้ให้สิทธิ์ซอฟต์แวร์ (IBM/HashiCorp, Teleport, MinIO, Redis Ltd., Grafana Labs) | ภาระด้าน license และการจัดซื้อ | เพิ่มทะเบียน license ในภาคผนวกจัดซื้อ |
| ADR-015 | ผู้ให้บริการ LLM/chatbot | cross-border, ร่างแนวปฏิบัติ AI ของ สคส. ร่วมกับ UNICEF (2569) ✅ | ระบุเป็นประเด็นต้องตัดสินใจ |
| I-21, I-17, I-20 | ILS, Moodle, HR (ภายใน) | ระบบภายใน | ไม่จำเป็น |

---

## 3. ตารางช่องว่างด้าน compliance (Compliance gaps)

ความรุนแรง: **สูง** = ผิดกฎหมาย/ถูกตรวจพบได้ หรือทำให้การจัดซื้อเสียหาย · **กลาง** = ต้องแก้ก่อน go-live ของเฟสที่เกี่ยวข้อง · **ต่ำ** = ปรับปรุง

### 3.1 ข้อมูลข่าวสารของราชการ, ITA และความโปร่งใส

| ID | ช่องว่าง | ฐานทางกฎหมาย/มาตรฐาน | ความรุนแรง | การเปลี่ยนแปลงในการออกแบบ |
|---|---|---|---|---|
| C-01 | ไม่มีกระบวนการคำขอข้อมูลข่าวสารของราชการ, ศูนย์ข้อมูลข่าวสาร และการเผยแพร่ตาม ม.7/ม.9 | พ.ร.บ.ข้อมูลข่าวสารของราชการ 2540 ม.7, 9, 11 ✅ (snippet ยืนยัน ม.7/9 และศูนย์ข้อมูลข่าวสาร; ยังไม่ยืนยันนิยาม ม.4 ว่าครอบคลุม มกช. 🟡 แต่ มกช. เป็นหน่วยงานของรัฐตาม พ.ร.บ. มกช.) | สูง | โมดูล OIR: รับคำขอ (ออนไลน์/ระบุตัวด้วย ThaID), กำหนดเวลาตอบ, ตรวจข้อยกเว้น ม.14/15, บันทึกคำสั่งและเหตุผล, ช่องทางอุทธรณ์ต่อคณะกรรมการวินิจฉัยฯ, หน้า "ศูนย์ข้อมูลข่าวสารออนไลน์" (ม.9) ที่ดึงข้อมูลเดียวกับ OIT |
| C-02 | ข้อมูลข่าวสารส่วนบุคคลตามหมวด 3 (ม.23–25) ซ้อนกับ PDPA เช่น นักศึกษาขอดูคะแนน/กระดาษคำตอบ ซึ่งคณะกรรมการวินิจฉัยฯ เคยวินิจฉัยว่าเป็นทั้งข้อมูลราชการและข้อมูลส่วนบุคคล ✅ | พ.ร.บ.ข้อมูลข่าวสารฯ ม.15, 24, 25 ✅; PDPA ม.3 (ความสัมพันธ์กับกฎหมายเฉพาะ) 🟡 | กลาง | รวม DSR (PDPA) กับ OIR หมวด 3 เป็น "Information Rights Desk" เดียว แต่ให้ legal basis selector ระบุว่าเป็นคำขอตามกฎหมายใด; ASM เก็บกระดาษคำตอบ/ใบคะแนนตาม retention เพื่อตอบคำขอได้ |
| C-03 | Data classification มี 4 ชั้น (Public/Internal/Confidential/Sensitive) แต่ไม่มี "ชั้นความลับของทางราชการ" | ระเบียบว่าด้วยการรักษาความลับของทางราชการ พ.ศ. 2544 🟡; ระเบียบสารบรรณ (ชั้นความลับ/ความเร็ว) ✅ (GR §4.13) | กลาง | เพิ่ม attribute `official_secrecy (ปกติ/ลับ/ลับมาก/ลับที่สุด)` แยกจาก privacy class และให้ DOC/e-Saraban เป็นเจ้าของ (เช่น ข้อสอบในคลังข้อสอบ X-07 = ลับ) |
| C-04 | OIT/ITA มาช้า (X-10 Phase 5) และไม่มี complaint module | ITA (IIT/EIT/OIT 30/30/40; OIT เผยแพร่บนเว็บไซต์) ✅; มติ ครม. ให้หน่วยงานรัฐเข้าร่วม ITA ✅ | กลาง | ทำ ITA/OIT data feed + `CMP` complaint module (รวมเรื่องร้องเรียนการทุจริต, anonymous, คุ้มครองผู้แจ้ง) ใน Phase 1–2; snapshot รายปีเป็น WORM |
| C-05 | ข้อบังคับ/ประกาศมหาวิทยาลัยที่ต้องลงราชกิจจาฯ ยังไม่มีทะเบียนกลาง | พ.ร.บ.ข้อมูลข่าวสารฯ ม.7 ✅ (หลักการ) | ต่ำ–กลาง | `RegulationRegister` เชื่อมกับ PolicySet และหน้า OIT |

### 3.2 PDPA

| ID | ช่องว่าง | ฐาน | ความรุนแรง | การเปลี่ยนแปลง |
|---|---|---|---|---|
| C-06 | Lawful basis ของข้อมูลสุขภาพพึ่ง consent (5.8 block การบันทึก incident) และ consent ของนักกีฬาทุนอาจไม่อิสระ | PDPA ม.19, 24, 26 🟡 (เลขมาตราตาม [TK] ในบันทึกวิจัย); ร่างแนวปฏิบัติฐานทางกฎหมายของ สคส. 7 ก.ค. 2569 (กระบวนการคัดเลือก 5 ขั้น ครอบคลุม public task) ✅; ร่างแก้ไข PDPA (รับฟัง 16 ก.ค.–15 ส.ค. 2569) จะทำให้ consent เป็นหนึ่งใน 7 ฐานที่เท่าเทียมกัน และเพิ่มนิยาม "หน่วยงานของรัฐ" ✅ | สูง | (1) Lawful-basis matrix ราย purpose ใน PRIV ซึ่งต้องผ่าน DPO + นิติกรอนุมัติ (2) Incident/first-aid/RTP ใช้ ม.26(1) หรือฐานตามหน้าที่ดูแลความปลอดภัยโดยไม่ block แต่ยังแจ้ง notice (3) consent ใช้เฉพาะ wellness รายวัน, wearables, วิจัย, การเผยแพร่ภาพ/ข่าว (4) ทำให้ LawfulBasis เป็นตาราง config ที่ map ใหม่ได้เมื่อแนวปฏิบัติหรือกฎหมายแก้ไขมีผล |
| C-07 | Dual consent กับผู้เยาว์ทุกคนอายุ >10 ถึง <20 อาจเข้มเกินและไม่ตรงกับแนวปฏิบัติ | แนวปฏิบัติ consent ของ สคส. (7 ก.ย. 2565) แยกเกณฑ์ <10 กับ 10–20 ปี โดยสรุปของสำนักงานกฎหมายระบุว่ากลุ่ม 10–20 โดยทั่วไปไม่ต้องได้ความยินยอมของผู้ปกครองสำหรับกิจการที่ผู้เยาว์ทำเองได้ ✅ (snippet); ป.พ.พ. ม.22–24 🟡 | กลาง | ทำ consent policy เป็นตาราง (อายุ × ประเภทกิจกรรม): ข้อมูลอ่อนไหว/การเผยแพร่/ค้างคืน = dual; กิจกรรมทั่วไป = ผู้เยาว์ให้เอง; ให้นิติกรยืนยัน และอย่าใช้ consent กับข้อมูลทะเบียนหลัก |
| C-08 | DPIA มีเพียง "register" ยังไม่มีรายการบังคับและ phase gate | PDPA ม.37(1) ✅; แนวโน้มที่ผู้ควบคุมต้องรับผิดต่อ vendor ✅ | สูง | DPIA บังคับก่อน go-live ของ: health vault/injury, wellness รายวัน (systematic monitoring ของนักกีฬาประมาณ 5,000 คน + ผู้เยาว์ทั้งหมด), face/biometric check-in, GPS/geofence (นิเทศ/กิจกรรม), early-warning/ML, wearables, LINE binding, guardian portal, CCTV/QR หอพัก เป็น exit criterion ของแต่ละ Phase |
| C-09 | ROPA เน้น controller แต่ยังไม่มีการแยก joint/independent controller และ data sharing กับหน่วยงานภายนอก | PDPA ม.39, 40 🟡 | กลาง | `DataSharingAgreement` (controller-to-controller) สำหรับ กยศ., TCAS, สป.อว., กกท./สมาคม, คุรุสภา, สัสดี, ประกัน; `ProcessorAgreement` สำหรับ vendor/SaaS; ROPA ฝั่ง processor ของผู้รับจ้างเป็น deliverable |
| C-10 | Cross-border ขัดกับนโยบายของตัวเอง (ประเด็น #3) | PDPA ม.28–29 + ประกาศ cross-border (ธ.ค. 2566 มีผล มี.ค. 2567) ✅ | สูง | ทะเบียนการโอนข้ามประเทศ: ปลายทาง, ฐาน (adequacy/SCC/BCR/consent), TIA; จำกัด payload ของ push/LINE (มีอยู่แล้วสำหรับ sensitive แต่ควรขยายไปถึง confidential); ให้ทางเลือก in-country (อีเมลที่ host เอง/GDCC) สำหรับโรงเรียนกีฬา (ผู้เยาว์) |
| C-11 | DSR ของหน่วยงานรัฐ: สิทธิคัดค้าน/ลบมีข้อจำกัดเมื่อใช้ฐาน public task/legal obligation และต้องชนกับหน้าที่เก็บถาวร | PDPA ม.32–33 🟡; ระเบียบสารบรรณ/จดหมายเหตุ ✅ | กลาง | DSR engine ตรวจ `RetentionClass` + `LawfulBasis` ก่อนลบ/ระงับ และออกหนังสือปฏิเสธพร้อมเหตุผล; crypto-shredding ห้ามใช้กับข้อมูลที่อยู่ในประเภทเก็บถาวร |
| C-12 | Breach: แจ้ง สคส. 72 ชม. มีแล้ว แต่ยังขาดการแจ้งผู้ปกครองตามระดับความเสี่ยง (มีเพียงใน runbook), การแจ้ง สกมช. (กรอบเวลาตามประกาศลักษณะภัยคุกคาม 🟡) และการแจ้งหน่วยงานต้นสังกัด | PDPA ม.37(4) ✅ (72 ชม.); พ.ร.บ.ไซเบอร์ ม.57–58 🟡 | กลาง | BreachIncident มี decision table ว่าต้องแจ้ง สคส./สกมช./ต้นสังกัด/เจ้าของข้อมูล/ผู้ปกครอง และเก็บหลักฐานเวลา |
| C-13 | DPO: มีบทบาทแล้ว แต่ยังไม่กำหนดความเป็นอิสระ/รายงานตรงผู้บริหารสูงสุด และ DPO ของผู้รับจ้าง | PDPA ม.41–42 ✅/🟡; ร่างแนวปฏิบัติ DPO (ก.ค. 2569) ✅ | ต่ำ | ระบุใน RACI + TOR |
| C-14 | การใช้ข้อมูลเด็กกับ AI/early warning ในโรงเรียนกีฬา | สคส. + UNICEF เร่งทำแนวปฏิบัติคุ้มครองข้อมูลเด็กในยุค AI (7 พ.ค. 2569 ยังเป็นร่าง) ✅ | กลาง | ADR-015 ให้ตัด profile BASIC_ED ออกจาก ML จนกว่าแนวปฏิบัติจะออก และทำ DPIA เฉพาะ |

### 3.3 ไซเบอร์, รัฐบาลดิจิทัล, ETDA

| ID | ช่องว่าง | ฐาน | ความรุนแรง | การเปลี่ยนแปลง |
|---|---|---|---|---|
| C-15 | ยังไม่ระบุว่าใครเป็น "หน่วยงานควบคุมหรือกำกับดูแล" ของ มกช. ตาม พ.ร.บ.ไซเบอร์ และ deliverable ตาม ม.44 (นโยบาย/แผน/ประมวลแนวทางของหน่วยงาน) | ประมวลแนวทางปฏิบัติ สกมช. 2564 ✅ | กลาง | Phase 0 deliverable: cybersecurity policy & plan ของ มกช. (ไม่ใช่เฉพาะระบบนี้), contact registry ของหน่วยงานกำกับ (ซึ่งจะเปลี่ยนเมื่อแยกกระทรวง) |
| C-16 | Website Security Standard 2568 ถูกผูกไว้กับ CMS ใน Phase 5 แต่ portal/admission เปิดสาธารณะตั้งแต่ M9 | มาตรฐานความปลอดภัยเว็บไซต์ภาครัฐ 2568 ✅ (GR S41, attribution ไม่แน่ชัด) | กลาง | ใช้เป็น gate ของทุกหน้าที่เปิดสาธารณะตั้งแต่ R1.0 |
| C-17 | พ.ร.ฎ.วิธีการแบบปลอดภัยในการทำธุรกรรมทางอิเล็กทรอนิกส์ 2553 (ระดับพื้นฐาน/กลาง/เคร่งครัด) ยังไม่ map กับระบบ | 🟡 | กลาง | ประเมินระดับความเสี่ยงต่อธุรกรรม (เช่น การเงิน/ใบรับรอง = กลางขึ้นไป) และ map กับ control ใน 10.3 |
| C-18 | Data governance อ้างเพียง ม.7(2) ยังไม่อ้างกรอบธรรมาภิบาลข้อมูลภาครัฐฉบับปรับปรุง (v2.0, มรด. 6:2566 ตามร่างที่พบ) | DGF v2 ✅ (draft v0.17); พ.ร.บ.รัฐบาลดิจิทัล 2562 ✅ | กลาง | Data Governance charter (คณะกรรมการ, data owner/steward ซึ่งมีอยู่แล้วใน 3A.9), data quality KPI, metadata ตาม มรด. 4-1/4-2:2565 🟡, open data inventory, ประเมินระดับธรรมาภิบาลข้อมูล |
| C-19 | Open data: ยังไม่มีรายการชุดข้อมูลเปิดและ license (data.go.th) | DGA/GD Catalog ✅ (ร่าง) | ต่ำ | dataset list ขั้นต่ำ (หลักสูตร, สถิติรับเข้า/สำเร็จแบบ aggregate, สถิติ ITA), license (เช่น Open Data Common 🟡), k-anonymity |
| C-20 | ลายมือชื่ออิเล็กทรอนิกส์ไม่แยกระดับ ไม่มี LTV/re-timestamp และไม่มี policy การแปลงเอกสารกระดาษเดิมเป็นดิจิทัล (legacy transcript) | พ.ร.บ.ธุรกรรมฯ ม.9, 10, 26, 28 🟡; ขมธอ. 23-2563 (แนวทางลายมือชื่อ) ✅; ขมธอ. 11-2560 (PDF/A-3 + PAdES) ✅; ETDA จัดสัมมนาเรื่อง long-term digital signature 2567 ✅; ประกาศ ETDA เรื่องการแปลงเอกสารเป็นข้อมูลอิเล็กทรอนิกส์ 🟡 | กลาง–สูง | Signature policy matrix: approval ภายใน (W-01..) = ม.9 + audit; คำสั่ง/ประกาศ/e-Receipt = ม.26; transcript/ปริญญา = ม.28 (ใบรับรองจาก CA ภายใต้ NRCA) + TSA; ใช้ PAdES-B-LTA/XAdES-A; job re-timestamp; ทะเบียน algorithm sunset; workflow digitisation สำหรับเอกสารเก่าที่ migrate |
| C-21 | e-Service Act 2565: ยังไม่มีการออก "ใบรับ" (acknowledgement of receipt) ของคำร้องอิเล็กทรอนิกส์ และการประกาศช่องทางอิเล็กทรอนิกส์ | พ.ร.บ.การปฏิบัติราชการทางอิเล็กทรอนิกส์ 2565 ✅ (อ้างผ่านร่างแนวปฏิบัติ DGA) | ต่ำ–กลาง | Petition/OIR/Complaint ออกใบรับที่มีเลขรับ + timestamp; ประกาศช่องทางใน OIT |
| C-22 | ใช้ข้อมูล ATH เพื่อวิจัยตั้งแต่ Phase 3 แต่ ethics module อยู่ใน Phase 6 | มาตรฐานจริยธรรมการวิจัยในมนุษย์ ✅ (GR §3.12) | กลาง | ห้าม export ATH เพื่อวิจัยจนกว่าจะมี EC approval ref (ช่องกรอกแบบ manual ใน Phase 3) |

### 3.4 เอกสาร, สารบรรณ, จดหมายเหตุ, ภาษา/การเข้าถึง

| ID | ช่องว่าง | ฐาน | ความรุนแรง | การเปลี่ยนแปลง |
|---|---|---|---|---|
| C-23 | ไม่มี workflow บัญชีขอทำลาย/คณะกรรมการทำลาย/การส่งมอบให้หอจดหมายเหตุ และไม่มีรูปแบบส่งมอบเอกสารดิจิทัล | พ.ร.บ.จดหมายเหตุแห่งชาติ 2556 ใช้กับหน่วยงานรัฐทุกแห่ง ✅ (RG เล่ม 130 ตอน 23 ก); ระเบียบสารบรรณ ข้อ 57–58, 66–67 🟡; ระยะ 25 ปี 🟡 | กลาง | `DisposalBatch` + export แบบ archival package (PDF/A + XML metadata + checksum, OAIS-style SIP 🟡) |
| C-24 | e-Saraban integration มีเพียง adapter และเลขหนังสือ แต่ยังไม่มี prefix แบบ effective-dated ต่อวิทยาเขต (GR §6) | ระเบียบสารบรรณ ฉบับที่ 4 2564 ✅ | ต่ำ | ใช้ `ExternalCode(SARABAN_PREFIX)` |
| C-25 | Accessibility: WCAG 2.1 AA ดีแล้ว แต่ยังไม่ผูกกับมาตรฐานเว็บไซต์ภาครัฐของ DGA และไม่มี accessibility statement | NSTDA: 52% ของเว็บหน่วยงานรัฐไม่ผ่าน ✅ | ต่ำ | เพิ่ม accessibility statement + ช่องทางแจ้งปัญหา และพิจารณา WCAG 2.2 AA 🟡 |
| C-26 | ภาษาไทย/พ.ศ. ทำได้ดี แต่ต้องกำหนดว่า XML ตาม ขมธอ. 25 ใช้ปี ค.ศ./ISO และ PDF แสดง พ.ศ. เพื่อไม่ให้ verifier สับสน | ขมธอ. 25-2563 ✅ (มาตรฐาน), รายละเอียด field 🟡 | ต่ำ | ระบุใน credential spec |

### 3.5 การจัดซื้อจัดจ้าง (พ.ร.บ. 2560) และผลต่อการออกแบบ

| ID | ช่องว่าง | ฐาน | ความรุนแรง | การเปลี่ยนแปลง |
|---|---|---|---|---|
| C-27 | ผู้เสนอราคาเป็นผู้ร่าง design และ stack ระบุยี่ห้อ (ประเด็น #5) | พ.ร.บ.จัดซื้อฯ ม.8, 13 🟡; ระเบียบ กค. ข้อ 21 (รายละเอียดคุณลักษณะ) 🟡; การวิจารณ์ TOR/ข้อตกลงคุณธรรมปี 2569 ✅ (Naewna) | สูง | แยกเอกสารเป็น (ก) capability spec ไม่ระบุยี่ห้อ ใช้มาตรฐานเปิด (OIDC, LTI 1.3, OpenAPI, BPMN/DMN, S3 API, ขมธอ.) (ข) design ของผู้รับจ้างเป็น deliverable หลังได้สัญญา; ทำ COI declaration, ประชาพิจารณ์ร่าง TOR, ข้อตกลงคุณธรรม (ถ้าเข้าเกณฑ์วงเงิน 🟡) |
| C-28 | License OSS ไม่ถูกต้องตามที่อ้าง (ประเด็น #4) | Teleport CE commercial license ตั้งแต่ v16 (จำกัด <100 คน, <USD 10M) ✅; Vault BSL 1.1 (ส.ค. 2566) และ OpenBao fork ใน Linux Foundation ✅; MinIO AGPLv3 + หยุดแจก binary ต.ค. 2568 + archive 2569 ✅; Grafana/Loki/Tempo AGPL 🟡; Redis 7.4+ RSAL/SSPL 🟡; Zammad AGPL 🟡 | สูง | License allow-list ใน TOR (Apache/MIT/BSD/MPL/EPL/LGPL; GPL/AGPL ได้ภายใต้เงื่อนไขที่ระบุ; ห้าม BSL/SSPL/commercial-CE ใน core), SBOM + license scan เป็น acceptance gate, ทะเบียน obligations (เช่น AGPL ต้องเปิด source ของส่วนที่แก้ไขเมื่อให้บริการผ่านเครือข่าย) |
| C-29 | กรรมสิทธิ์ IP/source code และ escrow ยังเป็น "norm (ไม่มีแหล่งยืนยัน)" | ระเบียบ/แบบสัญญากลาง 🟡 | กลาง | สัญญาต้องโอนลิขสิทธิ์ source, schema, IaC, เอกสาร และ test ให้ มกช.; ส่วนประกอบเดิมของผู้รับจ้าง (pre-existing IP) ต้องได้ license ถาวรไม่จำกัดผู้ใช้; ส่งมอบรายเดือนเข้า repo ของ มกช. (มีใน R-05) |
| C-30 | บัญชีนวัตกรรมไทย/ซอฟต์แวร์ไทย ยังเป็น [ต้องตรวจสอบ] | ครม. 26 พ.ค. 2569: โอนการตรวจคุณสมบัติให้ สนช. แทน สวทช. มีผล 1 ต.ค. 2569; ครม. ปรับเกณฑ์ขึ้นทะเบียนใหม่ (ข่าว 14 ต.ค. 2569) ✅; MiT/SME กฎกระทรวง 2563 ✅ | กลาง | ประเมินว่าโมดูลใดจัดหาจากบัญชีนวัตกรรม (เฉพาะเจาะจง) ได้ภายใต้เกณฑ์ใหม่ และผลต่อการแข่งขัน/ราคากลาง; ระบุสัดส่วนทีมในประเทศเพื่อ MiT/SME |
| C-31 | ราคากลางใช้อัตราสมมติ (A-30) ยังไม่มีฐานอ้างอิง; ยังไม่มีการขออนุมัติโครงการดิจิทัลขนาดใหญ่ | เกณฑ์ราคากลาง ICT ธ.ค. 2568 ✅ (ไม่ครอบคลุมงานพัฒนา: อนุมาน); การพิจารณาโครงการดิจิทัลของต้นสังกัด/DE/DGA 🟡 | กลาง | อ้างหลักเกณฑ์ราคากลางงานจ้างที่ปรึกษา/คุณวุฒิ (กค.) หรือราคาตลาด 3 แหล่ง; เตรียมแบบเสนอโครงการตามต้นสังกัดใหม่ (กระทรวงการกีฬา) |
| C-32 | Warranty/MA: "MA หลังรับประกัน ปีที่ 3–5" ยังไม่กำหนดระยะรับประกันความชำรุดบกพร่อง; สัญญาหลายปีต้องใช้งบผูกพันข้ามปี | ระเบียบ กค. (ค่าปรับ ข้อ 162, หลักประกัน 167–168) 🟡; พ.ร.บ.วิธีการงบประมาณ 2561 (งบผูกพัน) 🟡 | กลาง | รับประกัน ≥ 1–2 ปีต่อ release ที่ตรวจรับ, SLA และค่าปรับแยกจาก MA, MA เป็นสัญญารายปีหรืองบผูกพันที่อนุมัติแล้ว, เกณฑ์ตรวจรับรายงวดผูกกับ deliverable ที่ทดสอบได้ |
| C-33 | Cloud First/GDCC ถูกเขียนใน ADR-010 ว่า "บังคับตั้งแต่ 1 ต.ค. 2568" ขณะที่บันทึกวิจัยบอกว่ายังไม่ยืนยันการผูกพัน มกช. | Bangkok Post ✅ (นโยบาย); การผูกพัน 🟡 | ต่ำ | แก้ถ้อยคำเป็น "นโยบาย; การผูกพัน มกช. ต้องตรวจสอบ" และแยกงบ cloud ออกจากค่าพัฒนา |

### 3.6 การตรวจสอบ/ต่อต้านการทุจริต (สตง., ป.ป.ช.)

| ID | ช่องว่าง | ฐาน | ความรุนแรง | การเปลี่ยนแปลง |
|---|---|---|---|---|
| C-34 | ยังไม่มี workflow การยกเลิก/แก้ใบเสร็จ (void) ที่เก็บต้นฉบับ และยังไม่มี approval chain ของการยกเว้น/ลดค่าธรรมเนียม (waiver) ซึ่งเป็นจุดเสี่ยงทุจริต | ระเบียบการเงินการคลังภาครัฐ 🟡; มีกรณีร้องเรียน สตง. เรื่องงบ มกช. ✅ | กลาง | W-16 Waiver approval (วงเงินตามอำนาจ + SoD), W-17 Receipt void (ห้ามลบ ออกเลขใหม่ อ้างฉบับเดิม); รายงาน exception รายเดือนให้ผู้ตรวจสอบภายใน |
| C-35 | การคัดเลือกโควตานักกีฬา/ทุนเป็นจุดเสี่ยง: มี COI (SoD-08) แต่ไม่มี score lock, การประกาศเกณฑ์ก่อนรับสมัคร, การบันทึก override และการอุทธรณ์ | หลักความโปร่งใส ITA ✅ | กลาง | เผยแพร่ rubric ก่อนเปิดรอบ; score lock หลังกรรมการยืนยัน; override ต้องมีเหตุผล + ผู้อนุมัติ; รายงานสถิติผลคัดเลือกแบบ aggregate ใน OIT |
| C-36 | Auditor export: ต้องส่งข้อมูลให้ สตง. ในรูปแบบที่เครื่องมือตรวจสอบใช้ได้ (CSV + hash + data dictionary) | 🟡 | ต่ำ | Audit export package ใน ADMIN |
| C-37 | บัญชีธนาคารปลายทางของการคืนเงิน/จ่ายทุนต้องตรวจว่าเป็นของผู้มีสิทธิ์ | หลักควบคุมภายใน 🟡 | กลาง | PromptPay/ชื่อบัญชีต้องตรงกับชื่อนักศึกษา (หรือผู้ปกครองที่มีอำนาจ) และการเปลี่ยนบัญชีต้อง step-up ด้วย ThaID |

### 3.7 แรงงาน, ทหาร, คนเข้าเมือง, คุ้มครองเด็ก, สุขภาพ

| ID | ช่องว่าง | ฐาน | ความรุนแรง | การเปลี่ยนแปลง |
|---|---|---|---|---|
| C-38 | `StudentJob` (นักศึกษาทำงานระหว่างเรียน 48.7% ที่เชียงใหม่) ไม่มีการจ่ายค่าตอบแทน ภาษี ประกันสังคม หรือการคุ้มครองแรงงานเด็ก (นักเรียนโรงเรียนกีฬาเป็นผู้เยาว์) | กฎหมายแรงงานใช้กับนักศึกษาที่ทำงานเช่นแรงงานทั่วไป ✅ (งานวิจัย มรภ.จันทรเกษม); ประกันสังคม ม.4 ข้อยกเว้น ✅ (ยังไม่ยืนยันว่าใช้กับกรณีนี้); พ.ร.บ.คุ้มครองแรงงาน (ลูกจ้างเด็ก: อายุขั้นต่ำ, แจ้งพนักงานตรวจแรงงาน, ห้ามทำงาน 22:00–06:00) 🟡 | กลาง | `StudentJob` ต้องมี: ประเภท (จ้างงาน/ทุนแลกงาน), ชั่วโมงสะสม, ค่าตอบแทน → WHT (50 ทวิ) → payroll IF (X-02), rule ห้ามจ้างผู้เยาว์นอกเวลาที่กฎหมายกำหนด, ห้ามนักศึกษาต่างชาติ (Non-ED) ทำงานโดยไม่มีใบอนุญาต 🟡 |
| C-39 | ผ่อนผันทหาร ครอบคลุมดีแล้ว แต่ยังไม่มี rule แจ้งสัสดีเมื่อพ้นสภาพภายในกำหนด และการตรวจสัญชาติ/รหัส G | กฎกระทรวง 2549 ✅ (ตาม GR S53/S54); ระยะเวลาแจ้ง 🟡 | ต่ำ | event `records.StudentStatusChanged` → task แจ้งสัสดี + เอกสาร e-Saraban |
| C-40 | TM30 (24 ชม.), TM47 (90 วัน), การรายงานสถานภาพนักศึกษาวีซ่า Non-ED ต่อ สตม. | พ.ร.บ.คนเข้าเมือง ม.38 (แจ้งภายใน 24 ชม.) ✅; 90 วัน ✅ (GR S55); รายงานสถานภาพ Non-ED 🟡 | กลาง–สูง | ประเด็น #9 + `ForeignStudentCompliance` (visa, ที่พัก, 90 วัน, การพ้นสภาพ → แจ้ง สตม. 🟡) ใน Phase 2 |
| C-41 | Safeguarding เด็กในโรงเรียนกีฬาประจำ (ประเด็น #7) | พ.ร.บ.คุ้มครองเด็ก 2546 (ม.27 ห้ามเผยแพร่ข้อมูลเด็กในทางเสียหาย ✅ ตามบันทึก [TK]; หน้าที่แจ้งเหตุ/ส่งต่อ 🟡) | สูง | Safeguarding module: รับแจ้ง (รวม anonymous), ผู้รับผิดชอบที่แต่งตั้ง, ปิดลับ (sensitive), SLA ส่งต่อพนักงานเจ้าหน้าที่/สายด่วน 1300 🟡, แยกผู้ถูกกล่าวหาออกจากการเห็นข้อมูล; NOTI ห้ามส่งข้อความส่วนตัว 1:1 จากบุคลากรถึงผู้เยาว์โดยไม่ cc ผู้ปกครอง/ครูหอ; ทะเบียนการตรวจประวัติอาชญากรรมของโค้ช/ครูหอ; ซ่อนตำแหน่งหอพัก/ตารางรายบุคคลของเด็กจากบทบาทที่ไม่จำเป็น |
| C-42 | เวชระเบียนห้องพยาบาล/แพทย์: retention 5 ปีเป็นค่าเดาและยังไม่อ้างกฎหมายสุขภาพ | พ.ร.บ.สุขภาพแห่งชาติ 2550 ม.7 (ความลับข้อมูลสุขภาพ) 🟡; พ.ร.บ.สถานพยาบาล (ถ้าห้องพยาบาลจดทะเบียน) 🟡 | ต่ำ–กลาง | ยืนยันสถานะห้องพยาบาลใน Phase 0 และผูก retention ตามกฎหมายที่ใช้ |
| C-43 | Anti-doping: ไม่เก็บ whereabouts ดีแล้ว แต่ยังไม่อ้างมาตรฐานความเป็นส่วนตัวของ WADA สำหรับ TUE/ผลตรวจ (ถ้าเก็บ) | WADA ISPPPI 🟡; DCAT ✅ | ต่ำ | ถ้าเก็บ TUE ให้เก็บใน vault และ retention ตาม WADA |

---

## 4. ข้อสังเกตเพิ่มเติมเรื่องความสอดคล้องภายใน

1. **10.1 ขัดกับ 4.1/4.19/I-19/I-24/I-23:** เขียนว่า "ห้าม SaaS ต่างประเทศสำหรับ PII" แต่ยังใช้ Google/M365, LINE, FCM และ vendor cloud ควรเปลี่ยนเป็น "อนุญาตเฉพาะเมื่อผ่าน TIA + DPA + ระบุใน notice" หรือย้ายไปใช้ทางเลือกในประเทศ
2. **ADR-010:** เขียนว่า Cloud First "บังคับตั้งแต่ 1 ต.ค. 2568" เหมือนเป็นข้อเท็จจริงที่ผูกพัน มกช. ซึ่งเกินกว่าหลักฐาน
3. **8.1:** ระบุ Vault ว่าเป็นตัวเลือกหลัก (OpenBao เป็นตัวรอง), Teleport "Community" และ MinIO โดยไม่มีหมายเหตุเรื่อง license ขณะที่ Redpanda/Camunda/Elasticsearch ถูกระบุว่ามีปัญหา license ซึ่งเป็นมาตรฐานที่ไม่เท่ากัน
4. **1.4:** ระบุ e-GP ว่า "ไม่เชื่อมต่อ" แต่ GR §4.5 คาดหวังทะเบียนโครงการที่มี e-GP ID และสถิติ OIT
5. **3A.3/4.22:** ใช้นโยบาย dual consent สำหรับอายุ 10–20 ปีโดยไม่แยกตามประเภทกิจกรรม (ดู C-07)
6. **GR ไม่มีหมวดผู้ให้บริการภาคเอกชน (processor)** ซึ่งจำเป็นต่อ ROPA และ cross-border
7. **GR §1 และ design ไม่มี สขร./คณะกรรมการวินิจฉัยการเปิดเผยข้อมูลข่าวสาร** เป็น stakeholder
8. **Phase alignment:** ภาระที่มีรอบตามกฎหมาย (ITA ทุกปี, TM30 ต่อเหตุ, มติสภา, complaint) ไม่ควรอยู่ใน Phase 5–6

---

## 5. แหล่งอ้างอิง (Sources)

**ที่ค้นในรอบทบทวนนี้ (search snippet; ไม่ได้อ่านฉบับเต็มเพราะโดเมนถูกบล็อก)**
- พ.ร.บ.ข้อมูลข่าวสารของราชการ ม.7/9, ศูนย์ข้อมูลข่าวสาร: [infocenter.oic.go.th (1)](https://infocenter.oic.go.th/upload/cms/1777529416_9289.pdf) · [royalrain.go.th](https://royalrain.go.th/UploadFile/04412825640510.pdf) · [NIA คู่มือศูนย์ข้อมูลข่าวสาร](https://www.nia.go.th/media/pub_documents/2025/04/%E0%B8%84%E0%B8%A1%E0%B8%AD%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B9%83%E0%B8%8A%E0%B8%9A%E0%B8%A3%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%A8%E0%B8%99%E0%B8%A2%E0%B8%82%E0%B8%AD%E0%B8%A1%E0%B8%A5%E0%B8%82%E0%B8%B2%E0%B8%A7%E0%B8%AA%E0%B8%B2%E0%B8%A3%E0%B8%82%E0%B8%AD%E0%B8%87%E0%B8%A3%E0%B8%B2%E0%B8%8A%E0%B8%81%E0%B8%B2%E0%B8%A3.pdf)
- คำวินิจฉัย: กระดาษคำตอบ/คะแนนสอบ (ม.15, ม.24): [Chula CUIR Ek-it ch5](https://cuir.car.chula.ac.th/bitstream/123456789/72262/6/Ek-it_th_ch5_p.pdf) · [legardy – คณะกรรมการวินิจฉัย ม.35–39](https://legardy.com/thai-law/official-information-act-intro/official-information-act-appeals-board-section-35-39)
- ร่างแนวปฏิบัติ PDPC ฐานทางกฎหมาย/การตลาด/ROPA/DPO (7 ก.ค. 2569): [Tilleke](https://www.tilleke.com/insights/thailand-releases-new-draft-pdpa-guidance-on-lawful-bases-and-marketing/)
- ร่างแก้ไข PDPA (นิยามหน่วยงานของรัฐ, 7 ฐาน, รับฟัง 16 ก.ค.–15 ส.ค. 2569): [Mondaq/Tilleke](https://www.mondaq.com/data-protection/1826470/thailand-proposes-significant-amendments-to-the-personal-data-protection-act) · [Tilleke](https://www.tilleke.com/insights/thailand-proposes-significant-amendments-to-the-personal-data-protection-act/)
- แนวปฏิบัติ consent/ผู้เยาว์ (7 ก.ย. 2565): [Tilleke](https://www.tilleke.com/insights/thailand-issues-guidelines-on-pdpa-consent-and-notification-requirements) · [AustCham mirror](https://www.austchamthailand.com/thailand-issues-guidelines-on-pdpa-consent-and-notification-requirements)
- PDPC + UNICEF แนวปฏิบัติข้อมูลเด็กยุค AI (7 พ.ค. 2569): [Thairath EN](https://en.thairath.co.th/news/governmentpolicy/2931149) · [Thai Post](https://www.thaipost.net/economy-news/992076/) · [Thai PBS Verify](https://www.thaipbs.or.th/verify/news/content/12322)
- กรอบธรรมาภิบาลข้อมูลภาครัฐ v2 (มรด. 6:2566 ร่าง): [DGF Review v0.17](https://standard.dga.or.th/wp-content/uploads/2023/10/Final_DGF-Review-v0.17_NoTrack-Change.pdf) · [นโยบาย DG สมุทรปราการ 2569](https://www.samutprakan.go.th/wp-content/uploads/2026/05/นโยบาย-Data-Governance.pdf)
- ขมธอ. 23-2563 แนวทางลายมือชื่ออิเล็กทรอนิกส์: [ETDA open data](https://opendata.etda.or.th/en/dataset/dataset_16_23/resource/ebb987be-cd7c-4600-8ed1-cda9c2e6fb47) · [สำเนา KMUTT](https://cc.kmutt.ac.th/Files/Rule_KDDI/7.ข้อเสนอแนะมาตรฐานฯ%20ว่าด้วยแนวทางการลงลายมือชื่ออิเล็กทรอนิกส์(Electronic%20Signature%20Guideline)%20โดย%20ETDA.pdf) · [ETDA long-term signature seminar](https://etda.or.th/getattachment/newsevents/pr-news/news-standard/สมมนาเผยแพรความร-หวขอ-ลายมอชอดจทล-ครงท-1-การยกระดบ/ETDA-d-Signature-seminar-1v-2-7.pdf.aspx?lang=th-TH) · [ขมธอ. 11-2560](https://etda.or.th/getattachment/22a6682d-f1b0-4182-87a1-1021a5d8460f/ขมธอ-11-2560.aspx)
- พ.ร.บ.จดหมายเหตุแห่งชาติ 2556 ใช้กับหน่วยงานรัฐทุกแห่ง: [TCI JRA](https://so06.tci-thaijo.org/index.php/jra/article/view/258100) · [KKU JISKKU](https://so03.tci-thaijo.org/index.php/jiskku/article/view/66933) · [iLaw](https://www.ilaw.or.th/?p=16685)
- ITA/OIT: [Chula ภาคผนวก O27 2568](https://transparency.chula.ac.th/storage/files/ภาคผนวก_o27_2568.pdf) · [ม.พะเยา](https://connect.spss.up.ac.th:443/storage/uploads/content_doc/files/th/6d42749a65337bd51adb6c6220e64b44.pdf)
- TM30 / ม.38 พ.ร.บ.คนเข้าเมือง (24 ชม.): [legardy Q&A](https://legardy.com/free-qna/7454) · [Thai Post](https://www.thaipost.net/main/detail/45992) · [Dailynews](https://www.dailynews.co.th/news/5845484/)
- แรงงานนักศึกษา/ประกันสังคม ม.4: [TCI crujournal](https://li01.tci-thaijo.org/index.php/crujournal/article/view/60010) · [กฤษฎีกา 0367/2554](https://comment.ocs.go.th/main/download/dlf/pdf/0367_2554)
- บัญชีนวัตกรรมไทย (สนช. แทน สวทช. 1 ต.ค. 2569; เกณฑ์ใหม่): [Thairath](https://www.thairath.co.th/news/politic/2935432) · [InfoQuest](https://www.infoquest.co.th/?p=596094) · [Thai Post](https://www.thaipost.net/general-news/1088467/)
- Teleport CE license: [Teleport blog](https://goteleport.com/blog/teleport-community-license) · [GitHub discussion #39158](https://github.com/gravitational/teleport/discussions/39158) · [Teleport FAQ](https://goteleport.com/docs/ver/19.x/faq/)
- Vault BSL / OpenBao: [The Register](https://www.theregister.com/2023/12/08/hashicorp_openbao_fork/) · [TechTarget](https://www.techtarget.com/it-infrastructure/news/366563095/IBM-engineers-hatch-Linux-Foundation-HashiCorp-Vault-fork) · [The New Stack](https://thenewstack.io/meet-openbao-an-open-source-fork-of-hashicorp-vault/)
- MinIO AGPL / สถานะ upstream: [Wikipedia MinIO](https://en.wikipedia.org/wiki/MinIO) · [dev.to](https://dev.to/rosgluk/minio-ce-in-2026-retired-upstream-source-only-and-what-to-use-1k02) · [vonng blog](https://blog.vonng.com/en/db/minio-is-dead/)

**จากบันทึกวิจัยและเอกสารเดิม (ใช้อ้างอิงต่อ):** ประกาศ cross-border / DPO / การลบ 2567 ([HSF Kramer](https://www.hsfkramer.com/notes/data/2025-posts/pdpa-fines-and-firsts-a-6-year-timeline-of-thailands-data-privacy-enforcement), [Nishimura](https://www.nishimura.com/en/knowledge/publications/personal-data-protection-update-recent-developments-sub-regulations-guidelines-and-official-plan-under-the-thai-pdpa)) · breach 72 ชม. ([Multilaw](https://multilaw.com/Multilaw/Data_Protection_Laws_Guide/DataProtection_Guide_Thailand.aspx)) · ประมวลแนวทาง สกมช. 2564 ([MUIT](https://muit.mahidol.ac.th/downloads/act-policy/17176753.pdf)) · มสพร. ม 2/2566 ([standard.dga](https://standard.dga.or.th/wp-content/uploads/2023/06/มสพร10-4-2566.pdf)) · ร่าง มรด. data classification 2569 ([standard.dga](https://standard.dga.or.th/wp-content/uploads/2026/01/ร่าง-มรด.-X-256X-ว่าด้วยหลักเกณฑ์การจัดระดับชั้นข้อมูลภาครัฐ-ฉบับ-CDV-v0.3.pdf)) · ระเบียบสารบรรณ ฉบับที่ 4 ([Chula](https://www.arch.chula.ac.th/arch-cu/files/formcontentepost/ระเบียบงานสารบรรณ%20ฉบับที่%204%20พ.ศ.%202564.pdf)) · กฎกระทรวง MiT/SME 2563 ([thaigov](https://media.thaigov.go.th/uploads/document/142/2020/12/doc/Doc_20201223095136000000.doc)) · ราคากลาง ICT 2568 ([yotathai](https://yotathai.com/yotanews/rakaklang-computer68)) · TOR/ข้อตกลงคุณธรรม 2569 ([Naewna](https://www.naewna.com/local/943675)) · Cloud First ([Bangkok Post](https://bangkokpost.com/business/general/2986926/cloud-first-policy-gets-underway-on-oct-1)) · Digital Transcript ([DGA](https://www.dga.or.th/en/our-services/digital-platform-services/dga-digital-transcript/)) · accessibility ([NSTDA](https://www.nstda.or.th/nac/2024/wp-content/uploads/2024/04/เสวนาการขับเคลื่อนให้เว็บไซต์ไทยเข้าถึงโดยสะดวกถ้วนหน้า-โดย-ดร.อุรัชฎา-เกตุพรหม.pdf)) · ร้องเรียน สตง. ([Thai Post](https://www.thaipost.net/main/detail/68098)) · 90 วัน ([KKU](https://iad.kku.ac.th/file/ir_form/90_days_and_48_hrs_report.pdf))

**รายการที่ยังเป็น 🟡 และควรตรวจก่อนใส่ TOR:** นิยาม "หน่วยงานของรัฐ" ใน พ.ร.บ.ข้อมูลข่าวสารฯ ม.4 กับฐานะของ มกช.; เลขมาตรา PDPA ทั้งหมด; ระเบียบรักษาความลับของทางราชการ 2544; พ.ร.ฎ.วิธีการแบบปลอดภัย 2553; หน้าที่แจ้งเหตุตาม พ.ร.บ.คุ้มครองเด็ก; ข้อยกเว้นประกันสังคมสำหรับลูกจ้างหน่วยงานรัฐ/นักศึกษา; เกณฑ์วงเงินของข้อตกลงคุณธรรม; ระยะ 25 ปีในการส่งมอบหอจดหมายเหตุ; license ของ Grafana/Loki/Tempo/Redis/Zammad ในเวอร์ชันที่จะใช้จริง; เกณฑ์ ITA ปีงบ 2570
