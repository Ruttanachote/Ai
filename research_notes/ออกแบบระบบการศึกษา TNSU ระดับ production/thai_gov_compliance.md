# Thai Government Legal, Regulatory, Standards & Procurement Compliance for a TNSU Production Information System

> Research date: 2026-10-28. Research environment note: WebFetch to Thai gov domains (bict.moe.go.th, www.dga.or.th) and law-firm sites (nishimura.com) FAILED (host not resolvable in sandbox network allowlist). All findings below come from search-result snippets (titles/URLs/summaries); full texts were NOT read. Items marked **[TK]** come from researcher's training knowledge (cutoff mid-2026) and were NOT verified by a source in this session; the report writer should present them as "ต้องตรวจสอบกับราชกิจจานุเบกษา/ต้นฉบับ". The writer must not convert [TK] items into cited facts.

## 1. Procurement (พ.ร.บ.การจัดซื้อจัดจ้างฯ 2560, e-GP, TOR, ราคากลาง, MA, source code, Thai preferences)

### Takeaway
A TNSU system build is procured under พ.ร.บ.การจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 with e-bidding (ประกาศเชิญชวนทั่วไป) as the default method; price references follow the DE ministry's "เกณฑ์ราคากลางและคุณลักษณะพื้นฐานการจัดหาอุปกรณ์และระบบคอมพิวเตอร์" (latest found: ฉบับธันวาคม 2568), and preference rules (MiT ≥60% domestic, SME ≥30% budget, 10% SME price margin) under กฎกระทรวง พ.ศ. 2563 apply. No central man-month software pricing rule was found; universities build ราคากลางการพัฒนาระบบ via committee.

### Cited Findings
- The law's default is ประกาศเชิญชวนทั่วไป (e-Bidding) for transparency/competition; exceptions (e.g. ประกาศเชิญชวนแล้วไม่ได้ผล, เร่งด่วน, ราชการลับ) allow other methods (summary in PSU training doc, not statute text) — [yotathai](https://www.yotathai.com/passadu/19-1-68-1); [PSU Dent โครงสร้างการจัดซื้อ](https://www.dent.psu.ac.th/unit/pasadu/wp-content/uploads/2021/08/โครงสร้างการจัดซื้อและบริหารพัสดุ.pdf)
- "เกณฑ์ราคากลางและคุณลักษณะพื้นฐานการจัดหาอุปกรณ์และระบบคอมพิวเตอร์ ฉบับเดือนธันวาคม 2568" is circulated (download via yotathai); issuer not confirmed from snippet (historically กระทรวงดีอี) — [yotathai rakaklang-computer68](https://yotathai.com/yotanews/rakaklang-computer68)
- 2566 edition rules: replacement of computer systems/equipment requires ≥5 years of prior use; price reference order — use sources (2) or (3) first per agency benefit, only use (4)–(6) when (1)–(3) unavailable — [Mahidol TM TH-2566](https://www.tm.mahidol.ac.th/it-new/sites/default/files/TH-2566.pdf); earlier: [TH-2564](https://www.tm.mahidol.ac.th/it-new/sites/default/files/TH-2564.pdf)
- Government computer-system procurement covers จัดซื้อ, จ้าง, จ้างที่ปรึกษา, จ้างออกแบบและควบคุมงาน; projects >100 million baht have a separate approval form/criteria (MOE BICT แนวทางปฏิบัติการจัดหาระบบคอมพิวเตอร์ 2569; เอกสารหมายเลข 4 แบบฟอร์มโครงการวงเงินเกิน 100M) — [MOE doc 1 (2569)](https://bict.moe.go.th/wp-content/uploads/2024/11/เอกสารหมายเลข-1-แนวทางปฏิบัติการจัดหาระบบคอมพิวเตอร์-2569.pdf); [MOE doc 4](https://bict.moe.go.th/wp-content/uploads/2024/11/เอกสารหมายเลข-4-แบบฟอร์มโครงการที่มีวงเงินเกินกว่า100M-2567v2.pdf) (fetch blocked; snippet only)
- Universities use form "แบบ บก.05" for จ้างพัฒนาระบบคอมพิวเตอร์ in ราคากลาง disclosure; sample price structures split ค่า Hardware / ค่า Software / ค่าพัฒนาระบบ; example SWU project ราคากลางการพัฒนาระบบ 2,200,000 บาท set by คณะกรรมการกำหนดราคากลางและขอบเขตการดำเนินงาน (TOR) — [SWU doc-13](https://pcmc.swu.ac.th/epro/uploadfiles/doc-13.pdf); [SWU C_4418](https://eprocurement.swu.ac.th/upload_cost/C_4418.pdf); [SWU C_6163](https://eprocurement.swu.ac.th/upload_cost/C_6163.pdf); [yotathai e-GP ราคากลาง](https://www.yotathai.com/yotanews/e-gp-rakaklang)
- กฎกระทรวง (ฉบับที่ 2) พ.ศ. 2563 effective 8 Dec 2563: agencies must procure domestically-made goods ≥60% (Made in Thailand/MiT); spend ≥30% of procurement budget with SMEs registered by สสว.; in e-bidding/selection, SMEs (Micro/Small) get ≤10% price margin over lowest non-SME; MiT offers (≥60% value) get ≤5% margin; an OIC doc (newer) mentions ≤15% margin for Micro/Small SMEs offering MiT goods — [Thaigov doc 2020](https://media.thaigov.go.th/uploads/document/142/2020/12/doc/Doc_20201223095136000000.doc); [Thaigov doc 2022](https://media.thaigov.go.th/uploads/document/142/2022/02/doc/Doc_20220202090840000000.doc); [OIC PDF](https://infocenter.oic.go.th/upload/cms/1743579199_2158.pdf); [Prachachat](https://www.prachachat.net/finance/news-631389)
- Example university system TOR (STOU registration system: 15 sub-systems, contractor develops/modifies per university request) as structural model — [STOU TOR 6437](https://www.stou.ac.th/website/Tender2/UploadedFile/6437.pdf); website TOR model [Mahidol IPSR](https://ipsr.mahidol.ac.th/wp-content/uploads/2022/02/file-1766.pdf); TOR template [PSU Dent](https://www.dent.psu.ac.th/unit/pasadu/wp-content/uploads/2021/04/ขอบเขตของงาน-TOR-จ้างทั่วไป.docx)
- 2026 controversy on e-bidding TORs (timing windows, ข้อตกลงคุณธรรม/Integrity Pact) shows TOR integrity clauses are scrutinised (opinion of critic, not a ruling) — [Naewna](https://www.naewna.com/local/943675)

### Inferences
- [TK] Key Act sections to cite in bid: ม.8 (หลักการ คุ้มค่า โปร่งใส มีประสิทธิภาพ ตรวจสอบได้), ม.55 (วิธีซื้อหรือจ้าง: ประกาศเชิญชวนทั่วไป/คัดเลือก/เฉพาะเจาะจง), ม.56 (เงื่อนไขใช้วิธีคัดเลือก/เฉพาะเจาะจง), ม.65 (สาระสำคัญประกาศ), ม.93 (สัญญา), ม.97 (แก้ไขสัญญา), ม.100–101 (ค่าปรับ), ม.109 (ผู้ทิ้งงาน). ระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างฯ พ.ศ. 2560: ข้อ 21 (TOR/รายละเอียดคุณลักษณะ), ข้อ 45 (เผยแพร่ร่าง TOR/ประชาพิจารณ์ ≥3 วันทำการ สำหรับ e-bidding วงเงิน >500,000 บาท), ข้อ 162 (ค่าปรับรายวัน 0.01%–0.20% ของราคางานจ้าง), ข้อ 167–168 (หลักประกันสัญญา ร้อยละ 5), ข้อ 175 (ตรวจรับ). Verify numbers before use.
- [TK] e-GP (www.gprocurement.go.th): agency announces แผน → ร่าง TOR/ราคากลาง (บก.01/บก.05 forms) → ประกาศเชิญชวน → ผู้ยื่นข้อเสนอยื่นเอกสาร+ราคา e-bidding → พิจารณา (เกณฑ์ราคา หรือ Price-Performance) → ประกาศผู้ชนะ → อุทธรณ์ 7 วันทำการ → ลงนามสัญญา (ทำสัญญาตามแบบที่ คกก.นโยบายกำหนด; ระบบ e-GP รองรับ e-contract). Vendors must register in e-GP and (since ~2565/2566) be in the SME registry ThaiSME-GP if claiming SME margin.
- [TK] Cloud/software-as-service: กรมบัญชีกลาง letter ว 120? (unverified number) allows cloud services to be procured as service with pay-per-use; no confirmed circular found — treat as gap.
- [TK] บัญชีนวัตกรรมไทย (สำนักงบประมาณ/NIA, ม.56(2)(ฉ)) allows เฉพาะเจาะจง for listed Thai innovation software; agencies have quota ≥30% (ร้อยละ 30 ของวงเงินงบลงทุน) per prior cabinet rule — unverified this session; snippet search found nothing on บัญชีนวัตกรรมไทย.
- Warranty/MA norm: TOR commonly demands ≥1 year warranty after final acceptance plus MA SLA; source code + documentation ownership to agency; this is industry norm but NOT confirmed by found sources.
- Price references for DE edition 2568 should be checked for "ค่าจ้างพัฒนาระบบ" absence — DE criteria historically cover hardware and packaged software, not custom development; custom dev typically priced by committee via man-day/man-month × rates (sometimes using สำนักงบประมาณ/consulting rates, ระเบียบกระทรวงการคลัง หลักเกณฑ์ราคากลางงานจ้างที่ปรึกษา).

### Gaps
- No official circular found on man-month pricing for software development, nor on cloud-service procurement (cgd.go.th not reached).
- Full DE ราคากลาง 2568 content (software line items, cloud) not read.
- บัญชีนวัตกรรมไทย current rules (2568–2569) not found.
- Source code escrow norms in Thai gov: no source found.
- Whether TNSU uses ระเบียบกระทรวงการคลัง directly or its own university procurement regulation — not confirmed (see Q5).

## 2. Data protection (PDPA 2562 and PDPC sub-regulations)

### Takeaway
PDPA fully in force (since 1 June 2565 [TK]); sub-regulations relevant to the system: breach notification (Dec 2565/2022), DPO criteria (2566, effective Dec 2023), cross-border transfer (Dec 2023, effective Mar 2024), erasure/destruction/de-identification (2567). Public agencies must appoint a DPO (ม.41). Athlete health/biometric/disability data are sensitive data (ม.26) needing explicit consent or a legal basis; minors need guardian consent. Enforcement is rising (first administrative fine 7M THB; 2026 trend: controllers liable for vendor/processor weak security).

### Cited Findings
- Breach notification to PDPC within 72 hours of awareness where feasible, unless unlikely to create risk; notify data subjects when high risk — [Multilaw guide](https://multilaw.com/Multilaw/Data_Protection_Laws_Guide/DataProtection_Guide_Thailand.aspx); [PwC overview](https://legal.pwc.de/content/im-fokus/thailand-global-data-protection-law-overview.pdf)
- Timeline: breach-notification sub-regulation Dec 2022; DPO sub-regulation issued Sept 2023, effective Dec 2023 (large-scale monitoring as core activity); cross-border transfer criteria Dec 2023, effective Mar 2024 (adequacy, BCRs, SCCs) — [HSF Kramer 6-year timeline (2025)](https://www.hsfkramer.com/notes/data/2025-posts/pdpa-fines-and-firsts-a-6-year-timeline-of-thailands-data-privacy-enforcement); [Mondaq mirror](https://www.mondaq.com/privacy-protection/1678146/pdpa-fines-firsts-a-6-year-timeline-of-thailands-data-privacy-enforcement)
- 2022 draft SCC notification required filing clauses with PDPC (draft stage; final may differ) — [Tilleke](https://www.tilleke.com/insights/thailand-opens-public-hearing-period-on-measures-for-cross-border-transfer-of-personal-data/17/)
- DPO required (ม.41) for: public agencies (หน่วยงานรัฐ), large-scale regular monitoring, core activity on ม.26 sensitive data; 2566 PDPC notification clarifies criteria; one source says >100,000 records as core activity triggers DPO (verify) — [PriceSanond DPO update](https://www.pricesanond.com/blog/law-update-new-personal-data-protection-regulation-data-protection-officer-dpo.php); [Thai Airways PDPA14](https://www.thaiairways.com/content/dam/thaiairways/pdf/good-corporate-governance/communication-to-enhance-good-corporate-governance-compliance/personal-data-protection-section/PDPA14.pdf)
- Breach due to inadequate security = breach of ม.37(1) — [Thansettakij](https://www.thansettakij.com/general-news/512640)
- Notification on criteria for erasure, destruction or de-identification พ.ศ. 2567; first PDPC administrative fine 7 million baht (private entity, breach); 2026 enforcement trend holds controllers liable for vendors'/processors' weak security; PDPC action plan 2568–2571 — [Nishimura update](https://www.nishimura.com/en/knowledge/publications/personal-data-protection-update-recent-developments-sub-regulations-guidelines-and-official-plan-under-the-thai-pdpa) (fetch blocked; via search summary); [Tilleke](https://www.tilleke.com/insights/thailand-establishes-personal-data-protection-commission/?page=18)
- Aug 2026 commentary: "law strong, enforcement weak" after recent leaks — [Post Today](https://www.posttoday.com/general-news/746486)
- Govt PDPA guideline for agencies (ม.3–4 scope/exemptions) — [DIP PDPA Guideline v1](https://ipthailand.go.th/images/26881/PDPA_Guideline_v_1.pdf); [LDD training](https://orgweb.ldd.go.th/sources/img/part_lesson/FILES_2666_664189d154e41.pdf)

### Inferences
- [TK] Minors (ม.20): ผู้เยาว์ = under 20 (Civil Code, unless married). If minor ≤10 years → consent from ผู้ใช้อำนาจปกครอง only; minor >10 → minor's own consent valid only for acts a minor may do alone (Civil Code ม.22–24); otherwise guardian consent also needed. For sports-school students (mostly 12–18), design dual consent (student + parent) flows and age computation from birthdate.
- [TK] ม.26 sensitive data incl. health, disability, biometric, religion, criminal record, genetic; requires explicit consent unless exception (e.g. ม.26(5) legal duty, ม.24/26 public task). Athlete medical/doping/fitness data and face-scan attendance need explicit consent + DPIA-equivalent + encryption + strict RBAC.
- [TK] ม.24(4)/(5): a public university can rely on public task/legal duty for core student records, so consent is not the basis for registration data — consent only for optional/sensitive uses.
- [TK] ม.28–29 cross-border: hosting outside Thailand (e.g. foreign SaaS) needs adequacy or safeguards per 2566 notifications; combined with Cloud First (Q4) → prefer Thai-region hosting.
- [TK] ม.37(4) breach 72h; ม.39 ROPA; ม.40 processor duties → vendor must sign DPA (Data Processing Agreement) as processor; ม.82–90 penalties (admin fine up to 5M THB for sensitive-data violations; criminal up to 1 year / 1M THB).
- Vendor contract must include processor obligations because 2026 trend makes controllers liable for vendor security.

### Gaps
- Exact Thai titles and Royal Gazette dates of each PDPC notification not verified (pdpc.or.th, ratchakitcha not reached).
- No PDPC sub-regulations issued in 2569 (2026) were found; cannot confirm whether new ones exist (e.g. on minors, sensitive data guidelines).
- Exact DPO threshold (100,000) needs confirmation.

## 3. Cybersecurity (พ.ร.บ.การรักษาความมั่นคงปลอดภัยไซเบอร์ 2562, NCSA standards, CII status, ISO 27001)

### Takeaway
All หน่วยงานของรัฐ (incl. public universities) must follow NCSA's 2564 ประมวลแนวทางปฏิบัติและกรอบมาตรฐาน (minimum requirements) under ม.44; CII designation is sector-based via the 2564 notification — universities are generally not named CII sectors (inference), so TNSU is bound as a หน่วยงานของรัฐ, not CII. A กกซ. standard on characteristics/security of information systems or CII (approved 18 Dec 2566; effective 18 Jan 2568 per secondary source) exists.

### Cited Findings
- ประกาศคณะกรรมการการรักษาความมั่นคงปลอดภัยไซเบอร์แห่งชาติ เรื่อง ประมวลแนวทางปฏิบัติและกรอบมาตรฐานด้านการรักษาความมั่นคงปลอดภัยไซเบอร์สำหรับหน่วยงานของรัฐและหน่วยงานโครงสร้างพื้นฐานสำคัญทางสารสนเทศ พ.ศ. 2564 — minimum requirements per the Act — [Mahidol MUIT copy](https://muit.mahidol.ac.th/downloads/act-policy/17176753.pdf)
- ประกาศ กกม. เรื่อง หลักเกณฑ์ลักษณะหน่วยงานที่มีภารกิจหรือให้บริการเป็นโครงสร้างพื้นฐานสำคัญทางสารสนเทศ และการมอบหมายการควบคุมและกำกับดูแล พ.ศ. 2564 — [Mahidol MUIT copy](https://muit.mahidol.ac.th/downloads/act-policy/17175488.pdf)
- Standards for defining characteristics and cybersecurity for information systems or CII B.E. 2566 (2023): approved 18 Dec 2023 (2566), effective 18 Jan 2025 (2568) — [Digital Policy Alert](https://digitalpolicyalert.org/change/11176-standards-for-defining-characteristics-and-cybersecurity-for-information-systems-or-critical-infrastructures-be-2566-2023) (secondary)
- NCSA to act under ม.44 to issue code of practice for govt and CII bodies — [OpenGov Asia 2022](https://opengovasia.com/2022/02/02/thailand-proposes-additional-regulations-to-boost-cybersecurity/)

### Inferences
- [TK] CII sectors under ม.49: ความมั่นคงของรัฐ, บริการภาครัฐที่สำคัญ, การเงินการธนาคาร, ICT/โทรคมนาคม, ขนส่ง/โลจิสติกส์, พลังงาน/สาธารณูปโภค, สาธารณสุข, อื่นๆ ตามประกาศ. Education is not a CII sector → TNSU likely not CII (unless NCSA designates). Still, ม.13/ม.44 code applies to all หน่วยงานของรัฐ: policy/plan, risk assessment, incident response, report incidents to NCSA (ThaiCERT) and หน่วยงานควบคุมหรือกำกับดูแล (likely กระทรวงการท่องเที่ยวและกีฬา or อว.).
- [TK] Practical TOR expectations: ISO/IEC 27001:2022 certified vendor or hosting DC, OWASP ASVS/Top 10 testing, annual penetration test & vulnerability assessment, NCSA "Website Security Standard" (มาตรฐานการรักษาความมั่นคงปลอดภัยเว็บไซต์ สำหรับหน่วยงานรัฐ; NCSA 2565/2566 guide), log retention ≥90 days under พ.ร.บ.คอมพิวเตอร์ 2550 ม.26 (amended 2560) — computer traffic data retention.
- Map design to NIST CSF (Identify/Protect/Detect/Respond/Recover), which NCSA code is based on.

### Gaps
- Could not confirm 2567–2569 NCSA updates (ncsa.or.th not reached); no NCSA website-security standard document retrieved.
- Whether กระทรวงการท่องเที่ยวและกีฬา/อว. is TNSU's designated regulator under the Act not confirmed.

## 4. Digital government (DGA Act 2562, DGA standards, e-Service Act 2565, ETDA ขมธอ., e-Transcript, GDCC/Cloud First, data localisation, accessibility)

### Takeaway
พ.ร.บ.การบริหารงานและการให้บริการภาครัฐผ่านระบบดิจิทัล 2562 (in force 23 May 2562) mandates data governance (ม.7(2)) and interoperability; DGA issues มสพร. standards (e.g. ม 2/2566 data interconnection/exchange); พ.ร.บ.การปฏิบัติราชการทางอิเล็กทรอนิกส์ 2565 requires agency e-services to be interoperable. For transcripts, ETDA ขมธอ. 25-2563 (Digital Transcript XML, UN/CEFACT + PESC) is the national standard, used by 98 universities (31 Jul 2024) via DGA/อว./ETDA. Cloud First via GDCC is policy; accessibility based on WCAG.

### Cited Findings
- DGA Act 2562 in force 23 May 2562; ม.7(2) Digital Government Development Committee prepares ธรรมาภิบาลข้อมูลภาครัฐ — [DOP doc](https://www.dop.go.th/download/knowledge/th1662368470-1743_0.pdf); [DGA PDF](https://www.dga.or.th/wp-content/uploads/2024/03/4.pdf)
- ประกาศ สพร. ที่ ม 2/2566 มาตรฐานการเชื่อมโยงและแลกเปลี่ยนข้อมูลภาครัฐ ด้านการเชื่อมโยงข้อมูล; issued per committee resolution 2/2565 (29 Sep 2565) — [standard.dga.or.th มสพร10-4-2566](https://standard.dga.or.th/wp-content/uploads/2023/06/มสพร10-4-2566.pdf)
- Draft standards: มสพร. X-2566 Government Data Catalog (public hearing); ร่าง มรด. X-256X หลักเกณฑ์การจัดระดับชั้นข้อมูลภาครัฐ (CDV v0.3, Jan 2026, not final) — [GD Catalog hearing](https://standard.dga.or.th/wp-content/uploads/2023/07/Final_เอกสารนำเสนองานประชาพิจารณ์-GD-Catalog.pdf); [ร่าง มรด. data classification 2026](https://standard.dga.or.th/wp-content/uploads/2026/01/ร่าง-มรด.-X-256X-ว่าด้วยหลักเกณฑ์การจัดระดับชั้นข้อมูลภาครัฐ-ฉบับ-CDV-v0.3.pdf)
- Agencies adopt data-governance policies (e.g. MOE OPS 2567, PDMO 2569) — [MOE OPS](https://ops.moe.go.th/wp-content/uploads/2024/06/ประกาศ-สป.-เรื่องแนวนโยบายและแนวปฏิบัติธร.pdf); [PDMO 2569](https://www.pdmo.go.th/pdmomedia/documents/2026/Mar/%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%81%E0%B8%B2%E0%B8%A8%E0%B8%99%E0%B9%82%E0%B8%A2%E0%B8%9A%E0%B8%B2%E0%B8%A2%E0%B8%98%E0%B8%A3%E0%B8%A3%E0%B8%A1%E0%B8%B2%E0%B8%A0%E0%B8%B4%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%82%E0%B9%89%E0%B8%AD%E0%B8%A1%E0%B8%B9%E0%B8%A5%20%E0%B8%AA%E0%B8%9A%E0%B8%99%202569.pdf)
- พ.ร.บ.การปฏิบัติราชการทางอิเล็กทรอนิกส์ พ.ศ. 2565 requires state e-methods for public services to be consistent and interconnectable (cited in DGA draft guideline v.02, Nov 2565, marked "ห้ามใช้เป็นมาตรฐาน") — [DGA draft v.02](https://standard.dga.or.th/wp-content/uploads/2022/10/ร่างแนวปฏิบัติการดำเนินงานทั่วไป_v.02.pdf)
- Website accessibility: national "accessible website" assessment uses WCAG; seminar 2567 reported 52% of agency websites not meeting accessibility standard (A–D grading) — [NSTDA NAC2024 seminar](https://www.nstda.or.th/nac/2024/wp-content/uploads/2024/04/เสวนาการขับเคลื่อนให้เว็บไซต์ไทยเข้าถึงโดยสะดวกถ้วนหน้า-โดย-ดร.อุรัชฎา-เกตุพรหม.pdf); [second talk](https://www.nstda.or.th/nac/2024/wp-content/uploads/2024/04/เสวนาการขับเคลื่อนให้เว็บไซต์ไทยเข้าถึงโดยสะดวกถ้วนหน้า-โดย-คุณรัตนา-จรูญศักดิ์สิทธิ์.pdf)
- ขมธอ. 25-2563 Digital Transcript: XML per UN/CEFACT (XML NDR for CCTS 2.01 v2.1) and PESC; developed by ETDA + DE + universities; as of 31 Jul 2024, 98 universities issue digital academic documents (อว. + DGA + OPDC + ETDA) — [DGA Digital Transcript](https://www.dga.or.th/en/our-services/digital-platform-services/dga-digital-transcript/); [DGA project page](https://www.dga.or.th/en/?p=119709); [TCI article](https://ph03.tci-thaijo.org/index.php/ahstr/article/view/1006)
- ขมธอ. 11-2560: electronic certificates (หนังสือรับรองอิเล็กทรอนิกส์) v1.0 — [ETDA PDF](https://etda.or.th/getattachment/22a6682d-f1b0-4182-87a1-1021a5d8460f/ขมธอ-11-2560.aspx)
- Verification of university digital docs via ETDA online service (KMUTT example) — [KMUTT verify](https://regis.kmutt.ac.th/web/verify/)
- Cloud First policy: agencies procure/develop cloud & DC through GDCC (~30% cost reduction target); cabinet 7 May 2562 approved DE to set up GDCC operated by NT; DGA 2025 focus group on CSP/national cloud centralized procurement — [Bangkok Post](https://bangkokpost.com/business/general/2986926/cloud-first-policy-gets-underway-on-oct-1); [BDE draft](https://www.bde.go.th/assets/portals/1/files/1DraftCloud.pdf); [GDCC presentation](https://www.dmr.go.th/wp-content/uploads/2023/09/GDCC-Presentation.pdf); [DGA CSP focus group Dec 2025](https://standard.dga.or.th/wp-content/uploads/2025/12/Final_Focus-group-CSP-v1.0.pdf)

### Inferences
- [TK] Other relevant DGA standards to reference in TOR (verify numbers at standard.dga.or.th): มสพร. 5-2565 (Digital ID for government services / ระบบ Digital ID ภาครัฐ, linking to ThaID/DOPA), มสพร. 6-2565 data governance framework (ธรรมาภิบาลข้อมูลภาครัฐ), มสพร. on open data (data.go.th, CKAN catalog), government website standard (มาตรฐานเว็บไซต์ภาครัฐ version 2.0 by DGA, incl. accessibility), API standard (Government API / RESTful + OpenAPI). TOR should require integration with ThaID/Digital ID, export to Government Data Catalog, and WCAG 2.1 AA (มอก. 2546? — Thai accessibility standard number unverified).
- [TK] พ.ร.บ.ธุรกรรมทางอิเล็กทรอนิกส์ 2544 (amended 2562): ม.9/ม.26 reliable e-signature; ม.10 integrity/original; ม.12/1 timestamping. Digital transcripts must be signed with PAdES/XAdES + CA (e.g. TDID/INET/Thai Digital ID CA) + timestamp; ETDA ขมธอ. 14/15 (CA, timestamp) and ขมธอ. 23-2563 (e-sign guideline) [TK].
- Data localisation: no general Thai law mandates in-country storage; the effective localisation driver is Cloud First/GDCC policy + PDPA cross-border rules + DGA data classification (draft 2026).

### Gaps
- Official list and numbers of in-force มสพร./มรด. standards (website, Digital ID, open data, API) not retrieved.
- Thai accessibility standard (มอก.) number not confirmed.
- Whether Cloud First is mandatory for autonomous/public universities or only for ส่วนราชการ not confirmed.

## 5. Records retention for student records & TNSU legal status

### Takeaway
Retention follows ระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. 2526 as amended (ฉบับที่ 2 2548, ฉบับที่ 3 2560, ฉบับที่ 4 2564 — RG vol.138 ตอนพิเศษ 113 ง, 25 May 2564, which formalises electronic records). Specific periods for student registers not verified. TNSU was established by พ.ร.บ.มหาวิทยาลัยการกีฬาแห่งชาติ พ.ศ. 2562 by upgrading 17 campuses of สถาบันการพลศึกษา.

### Cited Findings
- งานสารบรรณ regulations: 2526, 2548 (No.2), 2560 (No.3), 2564 (No.4); No.4 published RG 25 May 2564 vol.138 special part 113 ง p.1; effective next day, some clauses after 90 days — [Chula Arch copy](https://www.arch.chula.ac.th/arch-cu/files/formcontentepost/ระเบียบงานสารบรรณ%20ฉบับที่%204%20พ.ศ.%202564.pdf); [MOE manual](https://psdg.moe.go.th/wp-content/uploads/2023/06/คู่มืองานสารบรรณ-กพร.สป.pdf); [PSU doc 2567](https://dtc.pn.psu.ac.th/files/doc/doc2567.pdf)
- e-saraban guidance (TINT) — [TINT manual](https://web65.tint.or.th/interesting_download/%E0%B8%84%E0%B8%B9%E0%B9%88%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%A3%E0%B8%B1%E0%B8%9A%E0%B8%AB%E0%B8%99%E0%B8%B1%E0%B8%87%E0%B8%AA%E0%B8%B7%E0%B8%AD%E0%B8%A0%E0%B8%B2%E0%B8%A2%E0%B8%99%E0%B8%AD%E0%B8%81%E0%B8%94%E0%B9%89%E0%B8%A7%E0%B8%A2%E0%B8%A3%E0%B8%B0%E0%B8%9A%E0%B8%9A%E0%B8%AA%E0%B8%B2%E0%B8%A3%E0%B8%9A%E0%B8%A3%E0%B8%A3%E0%B8%93%E0%B8%AD%E0%B8%B4%E0%B9%80%E0%B8%A5%E0%B9%87%E0%B8%81%E0%B8%97%E0%B8%A3%E0%B8%AD%E0%B8%99%E0%B8%B4%E0%B8%81%E0%B8%AA%E0%B9%8C.pdf)
- TNSU Act: cabinet chose upgrading 17 campuses of สถาบันการพลศึกษา; สนช. approved 7 May 2562 with amendments to ม.19(2), 21(3), 93 for อว. restructuring; Krisdika opinion on transitional ม.80 — [Matichon](https://www.matichon.co.th/sport/news_395168); [Naewna](https://www.naewna.com/politic/412187); [Krisdika opinion 0033/2563](https://comment.ocs.go.th/main/download/dlf/pdf/0033_2563_%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A1%E0%B9%80%E0%B8%AB%E0%B9%87%E0%B8%99%E0%B8%89%E0%B8%9A%E0%B8%B1%E0%B8%9A%E0%B9%80%E0%B8%95%E0%B9%87%E0%B8%A1)

### Inferences
- [TK] งานสารบรรณ ข้อ 57: normal retention ≥10 years; documents of historical value / to be kept permanently (e.g. student registers, graduation records) not destroyed; destruction requires หอจดหมายเหตุแห่งชาติ (กรมศิลปากร) review; agencies send ≥25-year-old records to National Archives (ข้อ 58). Also พ.ร.บ.จดหมายเหตุแห่งชาติ พ.ศ. 2556. Design: transcripts/graduation/registration master data = permanent; operational logs per PDPA minimisation + computer-traffic 90 days.
- [TK] TNSU is a juristic person and ส่วนราชการ (มหาวิทยาลัยในกำกับ? — NOT confirmed) under the Ministry of Tourism and Sports; sports schools (โรงเรียนกีฬา) transferred to TNSU — status matters for whether ระเบียบกระทรวงการคลัง or a university-specific procurement rule applies (likely the 2560 Act applies to all หน่วยงานของรัฐ incl. universities regardless).
- Sports schools with minors also implicate พ.ร.บ.คุ้มครองเด็ก 2546 (ม.27: no publishing information identifying a child in a harmful way) [TK] — relevant to athlete profile publication features.

### Gaps
- Retention schedule annex not read; student-record-specific periods unverified.
- TNSU's exact legal status (ส่วนราชการ vs autonomous) and governance of sports schools not confirmed.
- No source checked on อว./OHEC requirements for registration systems (e.g. CHE QA data submission) — outside scope of searches done.
