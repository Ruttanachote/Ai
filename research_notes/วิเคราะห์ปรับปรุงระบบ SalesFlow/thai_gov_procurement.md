# Thai Government Procurement Rules Affecting Stream SalesFlow (as of Nov 2026)

> Scope: พ.ร.บ.การจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 (the Act), ระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 (the Regulation), กฎกระทรวง and กรมบัญชีกลาง circulars (ว.).
> Framing: gaps against `/home/user/Ai/salesflow/docs/system-analysis.md`. The current design has stages Opportunity → Pipeline → Forecast → Rebidding → Close Win → Handover → In Delivery → Warranty → Ended. Its data model has `Milestone(paymentAmount, invoicedAt, paidAt)`, `Warranty(start, end, slaPolicy)` and a Handover checklist item "งวดงาน/ค่าปรับ". It has **no** entities for procurement method, e-GP project number, bid/appeal dates, guarantees (หลักประกัน), penalties (ค่าปรับ), acceptance committee dates, withholding tax or fiscal-year budget.
> Research limitation: in this session the network blocked fetching gprocurement.go.th, cgd.go.th mirrors, yotathai.com, sites.google.com and university PDFs (DNS refused). Findings come from search-result extracts of the cited pages, not full-text reads. Clause numbers and figures that could not be confirmed are listed under **Gaps**, not as findings. Verify them against ราชกิจจานุเบกษา (Regulation: เล่ม 134 ตอนที่ 24 ก, 24 ก.พ. 2560) before you hard-code any rule.

## 1. Procurement methods, thresholds and the bidding timeline (e-bidding / e-market / คัดเลือก / เฉพาะเจาะจง)

### Takeaway
The working threshold is ฿500,000. At or below it an agency may use วิธีเฉพาะเจาะจง. Above it the default is วิธีประกาศเชิญชวนทั่วไป: e-market for catalogued goods, e-bidding for complex or technical items such as IT systems. **From 1 Oct 2569 (2026)**, วิธีคัดเลือก and วิธีเฉพาะเจาะจง must also run end-to-end on e-GP, and appeals must be filed on e-GP. SalesFlow's single "Rebidding" stage collapses a multi-step, deadline-driven process.

### Cited Findings
- Contracts ≤ ฿500,000 may use วิธีเฉพาะเจาะจง. Contracts > ฿500,000 must use วิธีประกาศเชิญชวนทั่วไป (e-bidding) — [PSU finance guide](https://www.psu.ac.th/surat/finance/p/mm3.pdf); the legal basis cited for เฉพาะเจาะจง with any single supplier is มาตรา 56 วรรคหนึ่ง (2)(ข) — [ThaiPublica](https://thaipublica.org/2021/08/adjust-gprocurement-help-sme/)
- The method is chosen from the **วงเงินงบประมาณ (budget amount)**, not from ราคากลาง — [yotathai 19-1-68](https://www.yotathai.com/passadu/19-1-68-1)
- e-bidding applies to purchases > ฿500,000 of complex or technical items that are not in e-Catalog. Catalogued items go through e-market — [กรมควบคุมโรค/PCD KM doc 2018](https://epo16.pcd.go.th/files/com_km/2018-05/20180524_mswezqvv.pdf)
- Announcement period under the latest amendment found: for ฿500,000 – ฿100,000,000, the ประกาศเชิญชวน and documents are published for **≥ 3 working days**. For ฿500,000 – ฿10,000,000, holding a public hearing on the draft TOR (รับฟังความคิดเห็นร่าง TOR) is at the discretion of the head of the agency — [yotathai 19-1-68](https://www.yotathai.com/passadu/19-1-68-1). Older manuals use different band boundaries (for example ฿5M), so do not use them — same source / [PCD 2018](https://epo16.pcd.go.th/files/com_km/2018-05/20180524_mswezqvv.pdf)
- e-bidding flow on e-GP: publish the annual procurement plan (ประกาศแผน) → prepare documents in e-GP → draft TOR/announcement published for public comment (เผยแพร่/วิจารณ์) → ประกาศเชิญชวน → bidders submit **once only** through e-GP → committee considers → หัวหน้าเจ้าหน้าที่ announces the winner on e-GP → appeal window → contract signing — [MFA e-bidding workflow](https://image.mfa.go.th/mfa/0/GH2PYnujXi/migrate_directory/information-20200429-164426-518819.pdf); [UP Medsci e-bidding steps](https://www.medsci.up.ac.th/V4/medsci_doc/Contact_Procedure/E-Bidding_Step.pdf); [BSRU e-GP regulations deck](https://pasadu.bsru.ac.th/wp-content/uploads/2017/e-GPBook/regulations_27-28_June_2018.pdf)
- **Appeal (อุทธรณ์):** a bidder files within **7 working days** of the result being announced on e-GP. Where there are ≥ 2 bidders, the agency must wait out the 7-working-day appeal period before signing — [Thansettakij](https://www.thansettakij.com/economy/669263); [MFA workflow](https://image.mfa.go.th/mfa/0/GH2PYnujXi/migrate_directory/information-20200429-164426-518819.pdf)
- **2569 change (new):** กรมบัญชีกลาง requires bid submission and appeals to go **through e-GP only, starting 1 Oct 2569**. The appeal deadline is 16:30 on the last day — [Thansettakij](https://www.thansettakij.com/economy/669263); [Siam Business News](https://siambusinessnews.com/94085)
- Circular **ว 714 (16 ก.ย. 2569)** says that from 1 Oct 2569 วิธีคัดเลือก and วิธีเฉพาะเจาะจง must be done on e-GP through every step, from invitation to evaluation. Exceptions are ราชการลับ, consulting (จ้างที่ปรึกษา), and design/supervision of construction — [yotathai ว714](https://yotathai.com/news/ว714-แนวทางปฏิบัติยื่นข้อเสนอวิธีคัดเลือกและเฉพาะเจาะจงผ่านe-gp)
- Circular **ว 753 (30 ก.ย. 2569)** sets e-appeal forms **อธ 1** (appellant) and **อธ 2** (agency report) and cancels ว 300 — [yotathai ว753](https://www.yotathai.com/news/ว753-ประเด็นที่2-แบบ-อธ2-หน่วยงานของรัฐ-รายงานความเห็นอุทธรณ์)
- Circular **ว 515 (16 ก.ค. 2569)** gives guidance on paying for e-bidding documents (ค่าเอกสาร) — [yotathai ว515](https://yotathai.com/news/ว515-ลว16กค69-แนวทางชำระค่าเอกสารe-bidding-lbx9) (title only seen)

### Inferences
- Gap: "Rebidding" should become a bidding sub-workflow with dated events. Suggested fields:
  - `procurementMethod` (e-bidding | e-market | คัดเลือก | เฉพาะเจาะจง | MOU/หน่วยงานรัฐ)
  - `budgetAmount` (วงเงินงบประมาณ) and `referencePrice` (ราคากลาง)
  - `egpProjectNo`
  - TOR hearing open/close dates
  - ประกาศเชิญชวน date
  - document purchase/download date
  - bid submission deadline
  - our bid price
  - winner announcement date
  - appeal deadline (+7 working days; needs a working-day calendar with Thai public holidays)
  - appeal filed (อธ 1)
  - contract signing date
- Stage rule idea: Close Win should require `egpResult = winner` and `appealWindowEnd < today` (or "no appeal") as well as a PO/contract file. Signing inside the appeal window is not allowed when there are ≥ 2 bidders.
- `budgetAmount` ≤ ฿500k is a good predictor of a เฉพาะเจาะจง deal, which usually means a shorter cycle and higher win probability. The forecast % could vary by method rather than by stage only.
- Because all methods must use e-GP from Oct 2026, a "submitted on e-GP" checkbox and a receipt upload apply to every gov deal, not only e-bidding.

### Gaps
- I could not read the exact current text of กฎกระทรวง กำหนดวงเงินฯ, or of Regulation ข้อ 45 and onward (announcement durations by band, such as ≥ 5/10/20 working days in the original 2560 text). Only the "≥ 3 working days for ฿0.5–100M" figure is sourced, and from a secondary site.
- I found no source on e-market timelines (e.g., ≥ 3 working days) or on how long the committee has to evaluate.
- No verified source gives the rule that ราคากลาง must be published under มาตรา 4/ ป.ป.ช. (ตาราง บก.01–07; IT systems use the ICT-specific table). Treat it as a known practice that still needs a citation.

## 2. e-GP: what bidders do, documents, ราคากลาง, price submission

### Takeaway
Bidders register on e-GP, download or buy the documents, submit one electronic offer (technical documents plus price), and receive the result and appeal through e-GP. The bid is submitted only once, so revision tracking happens before submission.

### Cited Findings
- Bidders submit the price through e-GP and may do so **only once** — [UP Medsci e-bidding steps](https://www.medsci.up.ac.th/V4/medsci_doc/Contact_Procedure/E-Bidding_Step.pdf)
- From 1 Oct 2569 submission and evaluation for e-bidding, คัดเลือก and เฉพาะเจาะจง all happen on e-GP — [Thansettakij](https://www.thansettakij.com/economy/669263); [yotathai ว714](https://yotathai.com/news/ว714-แนวทางปฏิบัติยื่นข้อเสนอวิธีคัดเลือกและเฉพาะเจาะจงผ่านe-gp)
- The winner is announced on e-GP by หัวหน้าเจ้าหน้าที่ — [MFA workflow](https://image.mfa.go.th/mfa/0/GH2PYnujXi/migrate_directory/information-20200429-164426-518819.pdf)

### Inferences
- Gap: the system has Quotation approval but no **"bid package" checklist**. Typical items to verify per TOR: company affidavit, VAT registration (ภ.พ.20), ผลงาน references, product specs/catalog, authorization letters, bid bond, and the e-GP price form.
- Lock the approved Cost Sheet version to the **submitted bid price**, because the bid can be submitted only once.
- Add `referencePrice` (ราคากลาง) and compute bid/ราคากลาง %. Post-mortems of Close Lose should capture the winner and the winning price, which are public on e-GP.

### Gaps
- No source fetched for the exact e-GP bidder document list or the e-GP vendor registration rules. Fetching gprocurement.go.th was blocked.
- No source fetched for ราคากลาง publication rules (ICT reference-price table, ป.ป.ช. publication). Unverified.

## 3. Guarantees: หลักประกันการเสนอราคา (bid bond) and หลักประกันสัญญา (performance bond), return timing, retention

### Takeaway
Bid and contract guarantees are **5%**: of the budget amount (bid) or of the contract price (contract), under Regulation ข้อ 168. A state agency counterparty is exempt (ข้อ 169). Bid bonds are returned within 15 days of the head of the agency approving the winner report; the lowest 3 bidders get theirs back only after contract signing. Contract guarantees are returned within 15 days after the contractor is released from obligations, which in practice means after the warranty period ends.

### Cited Findings
- ข้อ 168: the bid guarantee and the contract guarantee are **5% of the วงเงินงบประมาณ or the price of the goods/works** in that procurement — [BCNB summary of the Act/Regulation](https://bcnb.ac.th/bcnb/uploads/documents/wg2/20180419_102318_121_0.pdf)
- ข้อ 169: no guarantee is required when the bidder or counterparty is a state agency — [BCNB](https://bcnb.ac.th/bcnb/uploads/documents/wg2/20180419_102318_121_0.pdf)
- The **old** rule (ระเบียบสำนักนายกฯ 2535 ข้อ 142) was 5%–10%. Do not use it; the 2560 Regulation uses ข้อ 167–170 — [search summary of 2535 vs 2560 sources: DOEB contract-management deck](https://www.doeb.go.th/ias/data/4contract-management070359.pdf)
- Accepted forms (2560) include cash, a bank-drawn cheque, a bank guarantee, a guarantee from a finance/securities company licensed by BOT to do guarantee business, and government bonds — [sites.google rbcgd2560 หลักประกัน](https://sites.google.com/site/rbcgd2560/hmwd-5-kar-tha-sayya-laea-hlak-prakan/swn-thi-2-hlak-prakan); [getdocform bank-guarantee forms](https://www.getdocform.com/guarantee-guarantee-contract/)
- Return of **bid** guarantee: within **15 days** after the head of the agency approves the winner-selection report. For the **lowest ≤ 3 bidders**, it is returned only once the contract is signed or the bidder is released — [RMUTL bid-bond return guideline (Apr 2026)](https://e-cms.rmutl.ac.th/assets/upload/files/2026/04/20260401132208_62342.pdf); [sites.google rbcgd2560](https://sites.google.com/site/rbcgd2560/hmwd-5-kar-tha-sayya-laea-hlak-prakan/swn-thi-2-hlak-prakan)
- Return of **contract** guarantee: promptly, and **no later than 15 days** after the counterparty is released from contract obligations, i.e., after the warranty period ends and the inspection is complete (ข้อ 170) — [yotathai w327](https://www.yotathai.com/passadu/w327); [KMITL contract-guarantee return manual, rev. May 2569](https://www.procure.kmitl.ac.th/wp-content/uploads/2026/05/%E0%B8%84%E0%B8%B9%E0%B9%88%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B8%84%E0%B8%B7%E0%B8%99%E0%B8%AB%E0%B8%A5%E0%B8%B1%E0%B8%81%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%81%E0%B8%B1%E0%B8%99-rev.5.5.69.pdf); [SKRU manual](https://mgt.skru.ac.th/admin/file/202310190928258003.pdf)
- When a contract is terminated and the guarantee is a bank guarantee, the agency notifies the bank within **60 days** of default and the bank must pay within **15 days** (ว 755) — [yotathai ว755](https://www.yotathai.com/news/ว755-ประเด็นที่2-หลักประกันสัญญา-แจ้งธนาคาร-60วัน-15วัน-ผู้ทิ้งงาน)

### Inferences
- Gap: SalesFlow has no **Guarantee register**. Suggested entity: `Guarantee(projectId, type[bid|contract|advance|retention], form[BG|cash|cheque|bond], issuerBank, amount, issueDate, expiryDate, returnDueDate, returnedAt)`. A BG ties up the SI's bank credit line, so finance needs alerts for expiry and for overdue returns: warranty end + 15 days → chase the agency.
- Auto-calculation: bid bond = 5% × `budgetAmount`; performance bond = 5% × contract value.
- `Warranty.end` drives both the MA renewal and the performance-bond release, so the 30/7/0-day notices could also generate "request return of หลักประกันสัญญา".

### Gaps
- Retention (เงินประกันผลงาน, a per-installment retention as an alternative to the performance bond) and its usual % (often quoted as 10% of each installment payment) — not found in sources this session.
- I could not confirm the exact verbatim clause numbers 167/170 or any 2564–2569 amendments to the accepted guarantee forms (for example e-Guarantee / e-LG). e-LG adoption is known in practice but unsourced here.

## 4. ค่าปรับ (liquidated damages), the 10% termination threshold, extension and waiver (ขยายเวลา / งดลดค่าปรับ)

### Takeaway
Under Regulation ข้อ 162 the daily penalty is a **fixed rate between 0.01% and 0.20% per day of the value of undelivered goods/works**. For a job that needs the whole result at once (ผลสำเร็จของงานทั้งหมดพร้อมกัน, typical of a system-development contract), it is a **fixed 0.01%–0.10% per day of the total contract price, minimum ฿100/day**. When accumulated penalties are about to exceed **10% of the contract value**, the agency must notify the contractor (ข้อ 183, ว 83). If the contractor accepts the penalty unconditionally, the agency may continue; otherwise it terminates promptly.

### Cited Findings
- ข้อ 162: for งานจ้างที่ต้องการผลสำเร็จของงานทั้งหมดพร้อมกัน, the daily penalty is a fixed amount of **0.01%–0.10% of the contract price, not less than ฿100/day**. In other purchase/hire cases it is a fixed **0.01%–0.20% per day of the price of goods not yet delivered**. Consulting has separate rules — [ALRO legal article](https://alro.go.th/uploads/org/central_admin/download/article/article_20200617153135.pdf); [DOAE procurement KM (2024)](https://finance.doae.go.th/wp-content/uploads/2024/08/%E0%B8%AD%E0%B8%87%E0%B8%84%E0%B9%8C%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A1%E0%B8%A3%E0%B8%B9%E0%B9%89-%E0%B9%80%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87-%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%88%E0%B8%B1%E0%B8%94%E0%B8%8B%E0%B8%B7%E0%B9%89%E0%B8%AD%E0%B8%88%E0%B8%B1%E0%B8%94%E0%B8%88%E0%B9%89%E0%B8%B2%E0%B8%87.pdf); [QSDS Q&A](https://qsds.go.th/newaudit/wp-content/uploads/sites/70/2021/06/789.pdf)
- The legal basis for penalties is the Act's มาตรา 102. Extension, waiver or reduction (ขยายเวลา/งดหรือลดค่าปรับ) is at the discretion of the authorized official under มาตรา 102 — [OBEC audit deck ม.100–105](http://audit.obec.go.th/images/docs/Informations/20-8-64-5.pdf); [OIC: การงดหรือลดค่าปรับ หรือการขยายเวลา](https://infocenter.oic.go.th/FILEWEB/CABINFOCENTER30/DRAWER087/GENERAL/DATA0000/00000061.PDF)
- 10% threshold: **ว 83 (กค (กวจ) 0405.2/ว 83, 22 ก.พ. 2562)** explains ข้อ 183. When the penalty will exceed 10% of the contract value, the agency must first notify the contractor in writing. If the contractor agrees in time to pay the penalty without conditions, the head of the agency may allow the contract to continue. If the contractor attaches conditions or does not reply, the agency terminates promptly — [yotathai ว83](https://yotathai.com/news/ว83-ค่าปรับเกินร้อยละ10-แจ้งคู่สัญญา-ผ่อนปรนหรือบอกเลิกสัญญา-ระเบียบข้อ183); [DDC contract-admin manual](https://ddc.moph.go.th/uploads/publish/1422720231018040712.pdf)
- When computing penalty days, subtract the time the acceptance committee took to inspect — [Dong Luang inspection deck](https://www.dongluang.go.th/index/add_file/MqcOyK9Tue51742.pdf); [OBEC](http://audit.obec.go.th/images/docs/Informations/20-8-64-5.pdf)
- Agency practice example: the excise department's guide sends the penalty notice within **7 working days** after the delivery due date — [Excise internal audit 2564](https://www.excise.go.th/cs/groups/public/documents/document/dwnt/ndm0/~edisp/uatucm434526.pdf)
- ข้อ 162 vs 163: ข้อ 162 penalties are in the standard construction contract, and a "0% penalty" relief measure applied (ว 693). Non-standard contracts set penalties case by case — [yotathai 162-163](https://www.yotathai.com/passadu/162-163)
- **Recent change:** circular **ว 727** (reported dated 22 Sep 2569) cancels ว 877 and exempts **individual service hires (จ้างเหมาบริการบุคคลธรรมดา)** from the penalty and contract-guarantee clauses. It does **not** apply to company contracts — [yotathai ว727](https://www.yotathai.com/news/%E0%B8%A7727-%E0%B8%8B%E0%B9%89%E0%B8%AD%E0%B8%A1%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A1%E0%B9%80%E0%B8%82%E0%B9%89%E0%B8%B2%E0%B9%83%E0%B8%88%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%88%E0%B9%89%E0%B8%B2%E0%B8%87%E0%B9%80%E0%B8%AB%E0%B8%A1%E0%B8%B2%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B8%81%E0%B8%B2%E0%B8%A3-%E0%B8%9A%E0%B8%B8%E0%B8%84%E0%B8%84%E0%B8%A5%E0%B8%98%E0%B8%A3%E0%B8%A3%E0%B8%A1%E0%B8%94%E0%B8%B2-%E0%B8%A2%E0%B8%81%E0%B9%80%E0%B8%A5%E0%B8%B4%E0%B8%81-%E0%B8%A7877)

### Inferences
- Gap: "งวดงาน/ค่าปรับ" is only a Handover checklist line. Make it data:
  - `Contract.penaltyBasis` (whole-contract | undelivered-value)
  - `penaltyRatePerDay` (0.01–0.20%, from the contract)
  - `penaltyMinPerDay` (฿100)
  - `Milestone.dueDate` / `deliveredAt` / `acceptedAt`
- Live **Penalty exposure** = days late (excluding committee inspection days) × rate × base. Show a health flag when exposure reaches 50% and 80% of the **10% termination threshold**. At 10% it should alert the Group Head and record the agency's ข้อ 183 letter and our reply.
- For system-development contracts (whole result at once), penalties accrue on the **full contract price** even if most milestones are delivered. One late final milestone is very costly, which favors Gantt alerts on the last milestone.
- Add an `ExtensionRequest` log (reason under มาตรา 102 such as an agency-caused delay, force majeure or reasons not attributable to the contractor; date requested; days granted; days waived). This links to the existing Risk & Issue log and Change Request.

### Gaps
- I could not verify the verbatim ข้อ 182 requirement that the contractor notify the agency in writing **within 15 days** after the cause of delay ends in order to claim an extension or waiver. It is commonly cited but not confirmed here.
- No 2567–2569 amendment to the ข้อ 162 rates was found. COVID-era and later 0%-penalty relief measures (ว 693, etc.) apply mainly to construction; their status for IT contracts in 2026 is unverified.
- I found no IT-specific penalty guidance, for example for software licences delivered with hardware.

## 5. Acceptance (การตรวจรับพัสดุ), payment after acceptance, advance payment

### Takeaway
A คณะกรรมการตรวจรับพัสดุ inspects at the user's site or the place stated in the contract (ข้อ 175). Acceptance is the trigger for payment and for the start of the warranty. Advance payment to private contractors is prohibited unless the head of the agency approves it under specific conditions.

### Cited Findings
- ข้อ 175: the acceptance committee for goods/hire inspects at the user's premises or the place stated in the contract. Inspecting elsewhere requires the head of the agency's approval. ข้อ 176 covers construction. ข้อ 179–180 also govern committee duties — [DDC manual](https://ddc.moph.go.th/uploads/publish/1422720231018040712.pdf); [DCCE contract & inspection manual (Oct 2025)](https://www.dcce.go.th/wp-content/uploads/2025/10/%E0%B8%84%E0%B8%B9%E0%B9%88%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B8%AB%E0%B8%B2%E0%B8%A3%E0%B8%AA%E0%B8%B1%E0%B8%8D%E0%B8%8D%E0%B8%B2%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%95%E0%B8%A3%E0%B8%A7%E0%B8%88%E0%B8%A3%E0%B8%B1%E0%B8%9A%E0%B8%9E%E0%B8%B1%E0%B8%AA%E0%B8%94%E0%B8%B8.pdf); [MOC inspection KM](https://km.moc.go.th/th/file/get/file/20240909d41d8cd98f00b204e9800998ecf8427e104906.pdf)
- Advance payment (เงินล่วงหน้า): paying a contractor in advance is **not permitted unless the head of the agency deems it necessary**. When buying or hiring from another **state agency**, the advance may be up to **50%** of the price — [sites.google rbcgd2560 การจ่ายเงินล่วงหน้า](https://sites.google.com/site/rbcgd2560/kar-cay-ngein-lwng-hna)
- Budget-disbursement pressure: กรมบัญชีกลาง asks budget units to speed up commitments and disbursements and to report monthly by the 5th of the following month (FY2567 guidance) — [InfoQuest](https://www.infoquest.co.th/?p=388136); [InfoQuest](https://www.infoquest.co.th/?p=395076)

### Inferences
- Gap: `Milestone` has `invoicedAt` and `paidAt` but not `deliveredAt` (ส่งมอบ/ใบส่งมอบงาน), `inspectionCommitteeMeetingAt`, `acceptedAt` (ใบตรวจรับ) or `rejectedReason`. Penalty days and the payment SLA both depend on these dates.
- The "In Delivery → Warranty" rule (needs Document Inspection) is correct, but warranty start should be computed from the **final** acceptance date. Retain per-milestone acceptance for payments.
- Track `advancePayment` (% , amount, advance guarantee, recovery per installment) as an optional contract term.

### Gaps
- I could not verify the commonly cited rules: the committee starts inspecting within **3 working days** of delivery and completes it as soon as possible (ข้อ 175(4)), and the agency pays within **5 working days / 30 days** after acceptance. One search extract said municipal units must request disbursement **within 5 working days of acceptance** via GFMIS, but I could not pin it to a specific URL, so it is not cited.
- I could not verify the advance-payment cap for private contractors (commonly cited as **≤ 15%** with a guarantee for the full advance, ข้อ 201). The search did not confirm it.
- No source on GFMIS payment lead time (e-Payment into the vendor account). This matters for cash-flow forecasting.

## 6. Warranty (ความรับผิดชอบต่อความชำรุดบกพร่อง) and MA contracting / fiscal-year timing

### Takeaway
The warranty period is set in the TOR or contract and ends the counterparty's obligations, which releases the performance bond within 15 days. Thai government fiscal years run **1 Oct – 30 Sep**. FY2570 (Oct 2569 – Sep 2570) totals about ฿3.788 trillion and targeted enactment by 1 Oct 2569. MA renewals for gov customers must be budgeted a year ahead and contracted after the budget act takes effect.

### Cited Findings
- The contract guarantee is returned within 15 days after the warranty ends and the contractor is released — [yotathai w327](https://www.yotathai.com/passadu/w327)
- FY2570 budget framework is about **฿3.788 trillion** (+0.2% vs FY2569), with a deficit of about ฿788bn. The cabinet approved a revised calendar (11 Apr 2569) targeting enactment by Sep 2569 so the budget is effective **1 Oct 2569** — [Thansettakij](https://www.thansettakij.com/economy/656379); [Thansettakij](https://www.thansettakij.com/economy/656951)
- FY2570 calendar: agencies submitted budget requests by **1 May 2569**, the cabinet approved details on **2 Jun 2569**, then three readings in parliament. Officials expected at most a ½–1 month delay — [InfoQuest](https://www.infoquest.co.th/2026/586746); [Thansettakij](https://www.thansettakij.com/economy/653999); [Daily News](https://www.dailynews.co.th/news/5957825/)

### Inferences
- Gap: SalesFlow forecasts by stage %, not by **customer budget status**. For gov deals add:
  - `fiscalYear` (ปีงบประมาณ)
  - `budgetSource` (งบประมาณประจำปี / งบกลาง / เงินรายได้ / งบผูกพันข้ามปี)
  - `budgetStatus` (in request → in budget bill → enacted → allocated)
- For MA renewal, the 90/60/30-day warranty notices are too late for gov customers whose budget request for the next FY closes around **May**. Add a fiscal-year-aware alert: if warranty/MA ends in FY N+1, propose the MA quotation before the agency's budget request deadline (about Jan–Apr of FY N).
- Expect bidding peaks after budget enactment (Oct–Dec) and disbursement pressure before 30 Sep. Also expect a possible gap if the warranty ends before the new MA contract can be signed; this could be modeled as an "MA bridging" risk.
- Multi-year MA (งบผูกพันข้ามปีงบประมาณ) needs per-year installment schedules.

### Gaps
- I found no source for typical warranty lengths for gov IT (hardware/software). In practice it is set in the TOR, often 1–3 years for hardware and 1 year for software, but this is unsourced. I also found no source for the Regulation's minimum warranty clause.
- I did not confirm whether the FY2570 budget act actually took effect on 1 Oct 2569 (sources are pre-enactment news).
- No source for ICT-specific MA rules, such as the DGA/กระทรวง DE ICT reference prices or MA rates as a % of system price.

## 7. Joint venture/consortium, subcontracting, Thai-first / SME / Made-in-Thailand preferences

### Takeaway
Under กฎกระทรวง (ฉบับที่ 2) พ.ศ. 2563 and the related ว. circulars, registered SMEs (Micro/Small for the price margin) get a **≤ 10% price preference** in e-bidding and price-based วิธีคัดเลือก. MIT-certified goods get a **5%** preference, and SME + MIT up to **15%**. Non-construction hires must use **≥ 60%** domestic (MIT) materials by value, and construction **≥ 90%**.

### Cited Findings
- กฎกระทรวง ฉบับที่ 2 พ.ศ. 2563: agencies may accept an SME's price up to **10% higher** than the lowest other bid. It applies to e-bidding and to วิธีคัดเลือก that use price as the criterion — [Post Today](https://www.posttoday.com/business/674634); [ThaiPublica 2021](https://thaipublica.org/2021/08/adjust-gprocurement-help-sme/)
- Goods with the **Made in Thailand (MIT)** mark from สภาอุตสาหกรรม count as พัสดุส่งเสริมการผลิตภายในประเทศ (Regulation หมวด 7/1). Construction must use **≥ 90%** MIT/domestic materials by value or quantity, and non-construction hires **≥ 60%**. A non-SME bidder offering MIT goods gets a **5%** preference, and an SME offering MIT up to **15%** — [Prachachat](https://www.prachachat.net/economy/news-649875); [OIC doc 2025](https://infocenter.oic.go.th/upload/cms/1743579199_2158.pdf)
- The SME 10% margin is limited to **Micro and Small** SMEs, with cumulative annual (calendar-year) contract-value caps. CGD found SMEs exceeding the revenue criteria — [Prachachat](https://www.prachachat.net/economy/news-649875); [Thai gov cabinet doc 2022](https://media.thaigov.go.th/uploads/document/142/2022/02/doc/Doc_20220202090840000000.doc)

### Inferences
- Gap: add `CompetitorBid` (competitor, price, SME/MIT flag) to Close Lose analysis. Losing to an SME priced within 10% above ours is structural, not a pricing failure.
- If the SI itself is not SME-registered, partnering with an SME, or proposing MIT-certified hardware where it exists, changes win probability. The Cost Sheet could flag the share of MIT/local content for the ≥ 60% rule on hire contracts.
- Add `Project.consortium[]` (JV/กิจการร่วมค้า partners and shares) and `Subcontract[]` (subcontractor, scope, value, agency approval date).

### Gaps
- I found no sourced text on **joint ventures** (กิจการร่วมค้า: TOR acceptance, use of a partner's ผลงาน, liability) or on **subcontracting** (ห้ามจ้างช่วงเว้นแต่ได้รับอนุญาต, typical contract clause and penalty). The standard contract forms (แบบสัญญาซื้อขายและจ้างระบบคอมพิวเตอร์) were not retrievable.
- I could not confirm the "employment 30%" or other local-content rules mentioned in the brief.
- 2569 SME registration (thaismegp.com) thresholds were not verified.

## 8. ภาษีหัก ณ ที่จ่าย 1% on government payments; stamp duty on contracts

### Takeaway
Government agencies (องค์การของรัฐ) withhold **1%** income tax on payments to companies under a purchase or hire order of **≥ ฿10,000**. Net receipts per milestone are therefore 99% of the invoice amount excluding VAT (VAT treatment unverified). Stamp-duty rules could not be sourced in this session.

### Cited Findings
- Revenue Department ruling: a ส่วนราชการ is an องค์การของรัฐ and must withhold tax at **1%** on purchase/hire orders (ใบสั่งซื้อ/สั่งจ้าง) of **≥ ฿10,000**. Orders below ฿10,000 are exempt — [Revenue Department rulings (rd.go.th)](https://rd.go.th/65193.html) *(seen via search-result extract; I could not confirm which of the rd.go.th ruling pages carries the quoted text)*
- For contrast, private payers withhold 3% on hire of work (ค่าจ้างทำของ) under ท.ป.4/2528 ข้อ 8 — [rd.go.th](https://rd.go.th/22904.html); [Krungsri guide](https://www.krungsri.com/th/krungsri-the-coach/taxes/tax-knowledge/how-withholding-tax-related-with-revenue)

### Inferences
- Gap: the `Milestone` payment fields should carry `invoiceAmount`, `vat`, `whtRate` (1% gov / 3% private), `penaltyDeducted` and `netReceived`, plus a reminder to collect the 50 ทวิ certificate. Otherwise reconciling "Payment" health against bank receipts will fail.
- Penalties are usually deducted from the installment payment, so `netReceived` ≠ invoice. The system should show the reason.

### Gaps
- I found no source on whether the 1% is computed on the pre-VAT amount, or on state enterprises (which may follow 3% as juristic persons rather than the 1% government rule). Verify with an accountant.
- **Stamp duty (อากรแสตมป์):** I found no sourced figures. Commonly understood but unverified here: hire-of-work contracts (จ้างทำของ, ลักษณะแห่งตราสาร 4) are dutiable at ฿1 per ฿1,000. Pure sale contracts are not dutiable. Electronic contracts pay through e-Stamp Duty. Who bears the duty is set by the contract (usually the contractor).
