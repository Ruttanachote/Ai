# Institutional Profile: Thailand National Sports University (มหาวิทยาลัยการกีฬาแห่งชาติ, มกช./TNSU), as of 2026-10-28

> **Method note (read first):** In this research session, direct page fetching was blocked by the sandbox network policy for every Thai domain tried (tnsu.ac.th, thaipost.net, tci-thaijo.org, matichon.co.th, ratchakitcha.soc.go.th, kaohoon.com, th.wikipedia.org all failed DNS/proxy). So **every finding below comes from search-engine result snippets**, not from reading the full pages. Treat figures as "reported in snippet; verify against the full page" before they go into a TOR. e-GP (gprocurement.go.th) and the Royal Gazette could not be queried directly.

## 1. Legal basis, governance and organisation structure (centralised vs per-campus)

### Takeaway
TNSU is a specialised public university created by the พ.ร.บ.มหาวิทยาลัยการกีฬาแห่งชาติ พ.ศ. 2562 (NLA passed it 7 May 2019). It was converted from the former สถาบันการพลศึกษา (Institute of Physical Education). It sits under the Ministry of Tourism and Sports (MOTS), not under อว. Operationally it is a multi-campus federation: about 17 campuses plus a central office, and each campus runs its own website, admissions announcements, registrar pages and finance reports. This points to substantial per-campus administration under one university council.

### Cited Findings
- The National Legislative Assembly approved the TNSU bill at its final session on 7 May 2019. Amendments to มาตรา 19(2), 21(3) and 93 aligned it with the new MHESI ministry — [Naewna](https://www.naewna.com/politic/412187)
- Cabinet approved the draft act in principle in December 2016. The option chosen was to upgrade the 17-campus Institute of Physical Education rather than create a new body — [Matichon](https://www.matichon.co.th/sport/news_395168); cabinet document [thaigov 13.12.59](https://media.thaigov.go.th/uploads/document/74/2016/12/docx/13.12.59.docx)
- Section 8 of the 2019 Act defines TNSU's mission as a specialised sports institution — [JSSD article](https://so07.tci-thaijo.org/index.php/JSSD/article/download/9380/6270/87936)
- Council of State opinion เรื่องเสร็จที่ 33/2563 covers transitional provisions (มาตรา 80). It concerns council chair and member positions carried over from the former institute's council — [OCS](https://comment.ocs.go.th/main/download/dlf/pdf/0033_2563_%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A1%E0%B9%80%E0%B8%AB%E0%B9%87%E0%B8%99%E0%B8%89%E0%B8%9A%E0%B8%B1%E0%B8%9A%E0%B9%80%E0%B8%95%E0%B9%87%E0%B8%A1)
- Rector (อธิการบดี): ผศ.วีรศักดิ์ วิศาลาภรณ์. Thai Wikipedia names him with a 2568 reference, and a snippet from the Phetchabun campus site mentions him in 2569. Wikipedia also lists "ประธานคณะบุคคลฯ: พล.ต.อ.สุนทร ซ้ายขวัญ", which suggests the council may be run by an interim คณะบุคคล rather than a fully constituted สภามหาวิทยาลัย. This needs verification — [th.wikipedia](https://th.wikipedia.org/wiki/%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A5%E0%B8%B1%E0%B8%A2%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%81%E0%B8%B5%E0%B8%AC%E0%B8%B2%E0%B9%81%E0%B8%AB%E0%B9%88%E0%B8%87%E0%B8%8A%E0%B8%B2%E0%B8%95%E0%B8%B4); [TNSU Phetchabun](https://www.tnsupnb.ac.th/)
- MOTS's structure page lists TNSU as a MOTS agency, alongside กรมพลศึกษา and การกีฬาแห่งประเทศไทย. The page is dated around 2557, so it predates university status — [MOTS](https://www.mots.go.th/News-view.php?nid=5617)
- A Thai Post article (undated in the snippet, COVID-era) says the system has 31 units: 18 university units (regional campuses, a central unit at Chonburi, and the Bangkok campus) and 13 sports schools — [Thai Post](https://www.thaipost.net/main/detail/89013)
- Each campus has its own domain, e.g. tnsubkk.ac.th, tnsucbi.ac.th, tnsumk.ac.th, tnsupnb.ac.th, tnsusti.ac.th, tnsuspb.ac.th, tnsussk.ac.th, tnsuskn.ac.th, tnsulpg.ac.th, tnsucmi.ac.th, tnsuatg.ac.th, web.tnsuudn.ac.th. They publish their own admissions notices, finance reports (e.g. Bangkok's "รายงานเงินคงเหลือประจำวัน ปีงบประมาณ 2569") and action plans (Sisaket's "แผนปฏิบัติราชการ วิทยาเขตศรีสะเกษ") — [Bangkok](https://www.tnsubkk.ac.th/), [Bangkok finance report](https://www.tnsubkk.ac.th/%E0%B8%A3%E0%B8%B2%E0%B8%A2%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B9%80%E0%B8%87%E0%B8%B4%E0%B8%99%E0%B8%84%E0%B8%87%E0%B9%80%E0%B8%AB%E0%B8%A5%E0%B8%B7%E0%B8%AD%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%88%E0%B8%B3/), [Sisaket](https://tnsussk.ac.th/)

### Inferences
- The legacy of 17 semi-autonomous former PE colleges (วิทยาลัยพลศึกษา) shows in per-campus web, registrar, budget and admissions operations. A production system must be multi-tenant (campus as tenant) with university-level consolidation and reporting.
- "Central unit at Chonburi" in the Thai Post snippet is ambiguous. It may mean the office of the president or the Chonburi campus as main campus; Wikipedia's list gives the main location as Chonburi. Verify where สำนักงานอธิการบดี actually sits.

### Gaps
- Royal Gazette citation (เล่ม/ตอน/หน้า, effective date) of the 2019 Act and any กฎกระทรวง/ประกาศ establishing campuses and faculties: not retrieved, because ratchakitcha was blocked.
- Whether a permanent สภามหาวิทยาลัย has been constituted by 2026, or whether an interim คณะบุคคล still governs.
- Official org chart (สำนักงานอธิการบดี, สำนักวิชาการ/ทะเบียน, สำนักดิจิทัล/IT centre).

## 2. Campus list (วิทยาเขต) and sports schools (โรงเรียนกีฬา) as of 2026

### Takeaway
The commonly cited figure is 17 campuses. The 16 names below are confirmed by the Chonburi campus site menu, and Krabi is the likely 17th, attested in older and secondary sources only. The sports-school system is 13 schools: 11 operating plus 2 "โครงการจัดตั้ง" (in establishment), per Eduzones (Nov 2025) and Thai Wikipedia. Province lists differ between sources.

### Cited Findings
- **Chonburi campus site's campus menu (16):** Bangkok, Chonburi, Chaiyaphum, Chumphon, Chiang Mai, Trang, Phetchabun, Mahasarakham, Yala, Lampang, Sisaket, Samut Sakhon, Sukhothai, Suphanburi, Ang Thong, Udon Thani. Chonburi is described as the main campus at 111 หมู่ 1 ถ.สุขุมวิท อ.เมืองชลบุรี — [TNSU Chonburi (EN)](https://www.tnsucbi.ac.th/en/)
- **Krabi:** listed as a campus on an old 2015 "17 วิทยาเขต" page and on a fan-maintained logo wiki, but absent from the Chonburi menu in the snippet — [ipearts 17 campuses](http://www.ipearts.com/index.php/2015-12-09-15-59-47/9-uncategorised/121-17); [Logos wiki](https://logos.fandom.com/wiki/Thailand_National_Sports_University). **Status of Krabi in 2026 is unconfirmed.**
- Eduzones (6 Nov 2025) article "รวม 17 วิทยาเขตทั่วไทย" groups the campuses by region. In the snippet, Chiang Mai has three faculties (ศึกษาศาสตร์, วิทยาศาสตร์การกีฬาและสุขภาพ, ศิลปศาสตร์) — [Eduzones](https://www.eduzones.com/2025/11/06/new-2s/); also [LINE Today](https://today.line.me/th/v3/article/Zao3a6e)
- The Mahasarakham campus site has a page of campuses and schools — [TNSU Mahasarakham](https://www.tnsumk.ac.th/web/index.php/tnsu-campus)
- **Conflicting figure:** the main site tnsu.ac.th/th shows stat counters that the snippet rendered as "วิทยาเขต 13 โรงเรียนกีฬา 28", plus unlabelled numbers 12,264 and 4,447. The labels look scrambled and could not be verified — [TNSU home](https://www.tnsu.ac.th/th/)
- **Sports schools:** "รวมโรงเรียนกีฬา ทั้งหมด 13 โรงเรียน: 11 โรงเรียนกีฬา และโครงการจัดตั้งโรงเรียนกีฬาอีก 2 โรงเรียน". Named provinces in the snippets include Lampang, Chonburi, Suphanburi and Khon Kaen (Khon Kaen offers 7 sports) — [Eduzones 25 Nov 2025](https://www.eduzones.com/2025/11/25/sports-school/); [LINE Today](https://today.line.me/th/v3/article/DRXYLXm)
- Thai Wikipedia says 13 schools under TNSU, spread across all regions (e.g. North: Chiang Mai, Nakhon Sawan, Lampang) — [th.wikipedia กีฬาโรงเรียนกีฬาแห่งประเทศไทย](https://th.wikipedia.org/wiki/%E0%B8%81%E0%B8%B5%E0%B8%AC%E0%B8%B2%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99%E0%B8%81%E0%B8%B5%E0%B8%AC%E0%B8%B2%E0%B9%81%E0%B8%AB%E0%B9%88%E0%B8%87%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B9%80%E0%B8%97%E0%B8%A8%E0%B9%84%E0%B8%97%E0%B8%A2)
- A Pantip thread about the 13 schools mentions Korat, Ubon, Nakhon Si Thammarat and Yala — [Pantip](https://pantip.com/topic/37946091)
- Confirmed individual schools: โรงเรียนกีฬาจังหวัดยะลา (2568 admissions notice says "สังกัดมหาวิทยาลัยการกีฬาแห่งชาติ") — [yalasportsschool.ac.th](https://yalasportsschool.ac.th/); โรงเรียนกีฬาจังหวัดนครศรีธรรมราช — [nrtss.ac.th](https://www.nrtss.ac.th/content/history); โรงเรียนกีฬาจังหวัดสุพรรณบุรี (ต.รั้วใหญ่ อ.เมือง) publishes an annual "สารสนเทศ ปีการศึกษา 2568" (uploaded 2026-05) — [spbss.ac.th PDF](https://www.spbss.ac.th/wp-content/uploads/2026/05/%E0%B8%AA%E0%B8%B2%E0%B8%A3%E0%B8%AA%E0%B8%99%E0%B9%80%E0%B8%97%E0%B8%A8-%E0%B8%9B%E0%B8%B5%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%A8%E0%B8%B6%E0%B8%81%E0%B8%A9%E0%B8%B2-2568.pdf); [Longdo map](https://map.longdo.com/main/p/A00070585)

### Inferences
- Compiling the snippets, the probable province set for the sports schools is Chiang Mai, Lampang, Nakhon Sawan, Khon Kaen, Ubon Ratchathani, Nakhon Ratchasima, Chonburi, Suphanburi, Trang, Nakhon Si Thammarat and Yala (11). The two schools in establishment are unidentified. **This list is inferred and needs confirmation.**
- Sports-school students are secondary-level (ม.1–ม.6, typically ages 12–18), so most are minors. The information system must handle parental/guardian consent and PDPA child-data rules (มาตรา 20, under-20 consent rules), dormitory/boarding data, and a basic-education curriculum and grading model (หลักสูตรแกนกลางขั้นพื้นฐาน), which differs from the higher-education credit system.

### Gaps
- An authoritative 2026 list of 13 schools with provinces, and confirmation that Krabi is or is not the 17th campus.
- Student counts per sports school (the Suphanburi สารสนเทศ 2568 PDF likely has them but could not be opened).

## 3. Faculties and degree programs

### Takeaway
There are three faculties, replicated across campuses: คณะศึกษาศาสตร์, คณะศิลปศาสตร์ and คณะวิทยาศาสตร์การกีฬาและสุขภาพ. Bachelor programs run at all campuses. Master's and doctoral programs are offered at selected campuses, e.g. Chonburi admitted master's and doctoral students for 2569. No separate บัณฑิตวิทยาลัย was confirmed in snippets.

### Cited Findings
- The Chonburi campus 2569 graduate admissions cover both master's and doctoral levels. Master's examples: คณะศิลปศาสตร์ บธ.ม. การจัดการการกีฬา การท่องเที่ยวและนันทนาการ (intake 15); คณะศึกษาศาสตร์ ศษ.ม. พลศึกษาและกีฬา (intake 15) — [Eduzones 7 Nov 2025](https://www.eduzones.com/2025/11/07/tnsu-8/)
- The Chiang Mai campus has the 3 faculties: ศึกษาศาสตร์, วิทยาศาสตร์การกีฬาและสุขภาพ, ศิลปศาสตร์ — [Eduzones](https://www.eduzones.com/2025/11/06/new-2s/)
- The Udon Thani campus offers ศษ.ม. พลศึกษาและกีฬา — [MHESI gotouni Udon Thani](https://gotouni.mhesi.go.th/universitygetcurr/MjIwMTc=); program listings also exist for Yala — [gotouni Yala](https://gotouni.mhesi.go.th/universitygetcurr/MjIwMTA=)
- Program list pages: Bangkok [หลักสูตรเปิดสอน](https://www.tnsubkk.ac.th/about/course/); Mahasarakham [หลักสูตรปริญญาตรี](https://www.tnsumk.ac.th/web/index.php/academics/undergraduate)
- The faculty of sports science and health offers วท.บ. วิทยาศาสตร์การกีฬาและการออกกำลังกาย (snippet) — see the Eduzones graduate article above.

### Inferences
- Typical bachelor programs, inferred from the legacy institute and needing verification against curriculum lists: ศษ.บ. พลศึกษา / สุขศึกษาและพลศึกษา / ภาษาอังกฤษ…; ศศ.บ./บธ.บ. การจัดการการกีฬา, ธุรกิจการกีฬา, การท่องเที่ยวและนันทนาการ, นิเทศศาสตร์การกีฬา; วท.บ. วิทยาศาสตร์การกีฬา, ผู้ฝึกสอนกีฬา, วิทยาศาสตร์สุขภาพ. The curriculum model is the same faculty and program replicated at multiple campuses, so the system needs a curriculum master at university level with campus offerings.

### Gaps
- The complete list of doctoral programs (the snippet was truncated) and which campuses host them.
- Whether a central graduate school exists.

## 4. Student and staff numbers

### Takeaway
The only university-wide figures found are on Thai Wikipedia: 11,520 students and 2,693 total personnel (both 2566). A research paper cites 554 academic staff. The main site shows unlabelled counters of 12,264 and 4,447. No per-campus 2568/2569 statistics were retrievable.

### Cited Findings
- Students 11,520 (2566); total personnel 2,693 (2566) — [th.wikipedia](https://th.wikipedia.org/wiki/%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A5%E0%B8%B1%E0%B8%A2%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%81%E0%B8%B5%E0%B8%AC%E0%B8%B2%E0%B9%81%E0%B8%AB%E0%B9%88%E0%B8%87%E0%B8%8A%E0%B8%B2%E0%B8%95%E0%B8%B4)
- Population of 554 academic staff in a TNSU research study (year unclear) — [JRKSA](https://so02.tci-thaijo.org/index.php/JRKSA/article/view/275552)
- Unlabelled stats 12,264 and 4,447 on the TNSU homepage (possibly university students and sports-school students, unverified) — [TNSU home](https://www.tnsu.ac.th/th/)
- Suphanburi campus has a page "ข้อมูลนักศึกษา ปีการศึกษา ๒๕๖๘" (contents not retrieved) — [tnsuspb](http://www.tnsuspb.ac.th/web/menu-info/%E0%B8%82%E0%B9%89%E0%B8%AD%E0%B8%A1%E0%B8%B9%E0%B8%A5%E0%B8%99%E0%B8%B1%E0%B8%81%E0%B8%A8%E0%B8%B6%E0%B8%81%E0%B8%A9%E0%B8%B2.html)
- The Mahasarakham registrar uses 11-digit student IDs as usernames — [tnsumk enroll guide](https://www.tnsumk.ac.th/reg/index.php/enroll-guide)

### Inferences
- Sizing for design: roughly 11,500–12,300 higher-education students, about 2,700 staff (about 550 of them academic), plus sports-school students possibly around 4,400 if that counter refers to them. That gives roughly 20,000 total users including staff. Annual bachelor intake would be roughly a quarter of enrolment (about 3,000), but this is not sourced.

### Gaps
- Per-campus student and staff counts, annual intake, and the graduate share. MHESI statistics (info.mhesi.go.th) and TNSU annual reports could not be fetched.

## 5. Admissions practices

### Takeaway
TNSU recruits through campus-level announcements, including a "ประเภทโควตา" (quota) round. Bangkok's 2570 quota notice is dated 22 Sep 2026. Admission involves sport-skill and fitness tests. TNSU participation in myTCAS could not be confirmed from snippets.

### Cited Findings
- "ประกาศมหาวิทยาลัยการกีฬาแห่งชาติ วิทยาเขตกรุงเทพ เรื่อง การรับสมัครและคัดเลือกหรือสอบคัดเลือก… ระดับปริญญาตรี ปีการศึกษา 2570 (ประเภทโควตา)", dated 22 Sep 2026 — [tnsubkk notice](https://www.tnsubkk.ac.th/%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%81%E0%B8%B2%E0%B8%A8%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A5%E0%B8%B1%E0%B8%A2%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%81-97/)
- The Mahasarakham campus runs its own online "ระบบรับสมัครนักศึกษา" — [tnsumk admission](https://www.tnsumk.ac.th/web/index.php/academics/admission)
- The central TCAS70 Admission round is 7–11 May 2027 via mytcas.com (general schedule, not TNSU-specific) — [mytcas](https://www.mytcas.com/)

### Inferences
- An admissions module must support per-campus rounds (quota, direct), sport-skill test scheduling and scoring by sport type, and sport-achievement evidence (portfolio), and possibly a TCAS data exchange.

### Gaps
- TNSU's TCAS round participation, skill-test criteria, and seats per program. Not found in snippets.

## 6. Current IT systems and procurement

### Takeaway
Registration appears to be per-campus. Mahasarakham hosts its registrar at tnsumk.ac.th/reg, with an "E-education" student service and online enrolment. No vendor was identified, and reg.tnsu.ac.th did not surface in search. Campus-built MIS exist (e.g. a Phetchabun planning and budget MIS). LMS strategy is the subject of a 2024 SWU dissertation. No TNSU IT procurement, TOR or ราคากลาง was found in search, and e-GP was not reachable.

### Cited Findings
- Mahasarakham: students log in to "E-education" from the สารสนเทศ menu with an 11-digit ID. Online registration is open only in set windows, with late fines and leave/status-maintenance rules — [enroll guide](https://www.tnsumk.ac.th/reg/index.php/enroll-guide); [registration conditions](https://tnsumk.ac.th/reg/index.php/services/registrar-know/registration-conditions)
- The phrase "ระบบบริการการศึกษา" and the "E-education" naming resemble common Thai university REG packages, but no vendor is named. Not confirmed.
- Phetchabun campus planning and budget MIS: evaluated by 30 users, efficiency mean 4.84 ("มากที่สุด") — [JMSR](https://so02.tci-thaijo.org/index.php/jmsr/article/view/254853)
- Dissertation "อนาคตภาพระบบการจัดการเรียนรู้ของมหาวิทยาลัยการกีฬาแห่งชาติ" (หฤษนันท์ จันทร์ทอง, SWU, 2567) covers 2568–2577, using EEF, futures wheel, SWOT and modified Delphi with 27 participants — [SWU IR](https://ir.swu.ac.th/entities/publication/60deeaa7-8600-4f1a-a054-3947ca7acd99/full); [PDF](https://ir-ithesis.swu.ac.th/bitstreams/8a1c105e-c93b-4761-8967-dfa8d52ab02d/download)
- The Bangkok campus site has a "ระบบสารบรรณกลาง" (e-document) link and posts e-bidding notices, e.g. renovation of the education faculty building. No software procurement was seen — [tnsubkk](https://www.tnsubkk.ac.th/)
- TNSU runs a ThaiJO journal (editor changed 1 Oct 2025) — [TNSU Journal](https://he02.tci-thaijo.org/index.php/TNSUJournal/announcement/view/1926)

### Inferences
- Probable current state: fragmented per-campus registrar, admission and website systems with limited central integration. A new system would involve data migration from many campus instances.

### Gaps
- REG vendor, LMS platform (Moodle/Google Classroom/MS Teams?), ERP/finance system, any central IT unit, and e-GP procurement records with budgets. All unverified because gprocurement.go.th and tnsu.ac.th were blocked.

## 7. Budget, strategic/digital plans, and the 2026 ministry split

### Takeaway
TNSU's FY2569 budget is about ฿1,853.9M. The FY2570 draft is ฿1,716.84M, down ฿137.05M (−7.39%). A university development plan for 2566–2570 exists, revised for FY2570. On 14 Jul 2026 the cabinet approved a draft act to restructure ministries: sports becomes a stand-alone "กระทรวงการกีฬา" and tourism merges with culture. The act still needs to pass both houses, with completion expected late 2569 or early 2570. TNSU would most likely move to the new Ministry of Sports, but no snippet stated this explicitly.

### Cited Findings
- FY2569 budget ฿1,853,889,600 — [th.wikipedia (via search)](https://th.wikipedia.org/wiki/%E0%B8%AA%E0%B8%96%E0%B8%B2%E0%B8%9A%E0%B8%B1%E0%B8%99%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%9E%E0%B8%A5%E0%B8%A8%E0%B8%B6%E0%B8%81%E0%B8%A9%E0%B8%B2)
- FY2570 allocation ฿1,716.8420M, down ฿137.0476M (−7.39%) from FY2569. This is from Senate budget committee reporting, so it is a draft — [Bangkok Today](https://bangkok-today.com/%E0%B8%81%E0%B8%A1%E0%B8%98-%E0%B8%A7%E0%B8%B4%E0%B8%AA%E0%B8%B2%E0%B8%A1%E0%B8%B1%E0%B8%8D%E0%B8%87%E0%B8%9A%E0%B8%AF%E0%B8%9B%E0%B8%B5-70-%E0%B8%AA%E0%B8%A7-%E0%B8%8A%E0%B8%B5%E0%B9%89%E0%B8%97/); [ชาติทุกกระแส](https://www.chadthukkrasae.com/2026/07/blog-post_25.html)
- MOTS draft FY2570 total ฿15,061.61M (−9.11% vs 2569). National Sports Development Fund revenue FY2569 (Oct 2025–May 2026) was ฿2,864M, down from about ฿4,000M — [Spacebar](https://spacebar.th/business/unveiling-treasures-two-new-ministries-separating-tourism-sports-pushing-culture-who-get-biggest-budget); [Thansettakij](https://www.thansettakij.com/business/tourism/663942)
- "แผนพัฒนามหาวิทยาลัยการกีฬาแห่งชาติ พ.ศ. 2566–2570 (ฉบับปรับปรุง ปีงบประมาณ พ.ศ. 2570)" is posted on the Sisaket campus site — [tnsussk](https://tnsussk.ac.th/)
- A Jan 2026 JMND article covers TNSU's sports-excellence strategy — [JMND](https://so03.tci-thaijo.org/index.php/JMND/article/view/295712/192649)
- Cabinet, 14 Jul 2026: approved ร่าง พ.ร.บ.ปรับปรุงกระทรวง ทบวง กรม (ฉบับที่ ..). Sports becomes "กระทรวงการกีฬา", and tourism merges with culture into "กระทรวงวัฒนธรรมและการท่องเที่ยว". The current MOTS permanent secretary becomes the sports ministry's permanent secretary. Proposed by Minister สุรศักดิ์ พันธ์เจริญวรกุล. The draft must pass three House readings and then the Senate, with completion expected early 2570 — [Thai Post](https://www.thaipost.net/general-news/1032294/); [Kaohoon](https://www.kaohoon.com/news/general/846264); [Bangkokbiznews](https://www.bangkokbiznews.com/business/1243091); [Prachachat](https://www.prachachat.net/politics/news-2024282); [Thairath](https://www.thairath.co.th/news/politic/2946195)

### Inferences
- Implications for the system design: the parent-ministry name and codes in budget, e-GP and GFMIS integrations, document templates and reporting lines may change in 2027, so make these configurable. Budget pressure (−7.39%) favours phased procurement.

### Gaps
- Whether the draft act explicitly lists TNSU under the new Ministry of Sports, and its legislative status as of Oct 2026.
- TNSU digital plan (แผนพัฒนาดิจิทัล) content. Not found.
