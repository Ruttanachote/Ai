# Product and Architecture Landscape for a TNSU Production University Information System

Scope: build vs buy vs hybrid evidence and a reference architecture for Thailand National Sports University (TNSU, 17 campuses, delivered by a vendor). Research date 2026-10-28. Notes are in English; the final deliverable will be in Thai.

Notation: **[verified]** means a search result this session confirmed the item. **[BK, unverified]** means it comes from the researcher's background knowledge and was not re-checked this session. The writer should either hedge [BK] items or drop them.

---

## 1. Commercial SIS/ERP: capabilities, pricing signals, timelines, failures, presence in Thailand/ASEAN

### Takeaway
Tier-1 SIS/ERP suites (Workday Student, PeopleSoft Campus Solutions, Banner) are built around US/UK higher education and have a long record of very expensive, delayed rollouts: USD 100M+ at large US universities, and repeated failures from PeopleSoft in the 2000s through Workday in 2023–2025. I found no evidence of any of them at a Thai university. For a Thai public university with Thai-specific regulations, buying one of them outright is high-risk and poorly fitted.

### Cited Findings
- **Workday cost (Washington University in St. Louis):** the total is projected at about USD 266M, roughly USD 16,000 per student. The project replaced nearly 80 separate student systems [verified] — [The Register, Dec 2025](https://www.theregister.com/2025/12/12/washington_university_workday_costs_revealed/)
- **WashU cost breakdown from the CFO:** USD 81M for Workday HCM/Finance, USD 98.9M for "Student Sunrise" (Workday Student), and USD 56.5M for planning, integration and PowerFAIDS. Ongoing costs are USD 23.8M in FY2026 for support and operations plus a USD 5.7M annual licence. An internal document puts spending at about USD 235M, so the figures conflict [verified] — [Student Life](https://www.studlife.com/news/2025/12/10/breaking-down-workdays-265-million-cost)
- **Other Workday rollouts:** the University of Washington's USD 340M implementation left hundreds of grants stuck in processing. LSU's faculty senate passed a resolution condemning its rollout. Both the University of Ottawa and McGill had pay failures (underpayment, overpayment, non-payment); these were HCM rather than Student, but they show the implementation risk [verified] — [The Register](https://www.theregister.com/2025/12/12/washington_university_workday_costs_revealed/), [LSU senate resolution](https://apa.lsu.edu/senate/files/16-12resolution.pdf), [AGSEM open letter](https://www.agsem.ca/post/open-letter-on-workday-issues), [CBC/Yahoo on uOttawa](https://ca.news.yahoo.com/switch-cloud-based-hr-system-090000895.html)
- **Sacramento City Unified (K-12):** sued Workday and its implementer Sierra-Cedar for about USD 5M, alleging it was steered to a single partner and given boilerplate contracts [verified] — [UpperEdge](https://upperedge.com/it-sourcing/like-taking-candy-from-a-baby-sacramento-schools-claim-workday-took-advantage-of-them-and-file-suit/)
- **PeopleSoft failures:** North Dakota University System (ConnectND) was projected at about USD 35M and reached about USD 49M while still incomplete. The University of Minnesota spent USD 53M, and 37,000 students had financial aid delayed by two months. Cleveland State spent USD 11M against a USD 4.2M estimate and threatened to sue. Cal State's CMS was estimated at USD 400M over nine years and was criticised by the state auditor. Montclair State sued Oracle, claiming about USD 20M in extra cost on a USD 15.75M fixed-fee implementation [verified, historical 2000s–2010s] — [Computerworld](https://www.computerworld.com/article/1648637/peoplesoft-apps-vex-n-d-colleges.html), [Minnesota Daily](https://mndaily.com/187685/uncategorized/peoplesoft-glitches-create-headaches), [Chronicle](https://www.chronicle.com/article/faculty-petition-protests-cal-poly-campuss-plan-to-install-peoplesoft-software/)
- **PeopleSoft success cases also exist:** some colleges finished on schedule and near budget [verified] — [Chronicle](https://www.chronicle.com/article/some-colleges-find-ways-to-install-peoplesoft-software-on-schedule-34900/)
- **Oracle's cloud student product:** Oracle Student Cloud and Student Management are in use at UCSF and Pittsburg State. Michigan State uses PeopleSoft Campus Solutions [verified] — [Pitt State](https://www.pittstate.edu/it/information-technology-services/studentsystem.html), [UCSF](https://one.ucsf.edu/node/181), [MSU](https://tech.msu.edu/about/itprojects/new-student-information-system)
- **Ellucian Banner SaaS:** Ellucian says more than 2,000 institutions use its SaaS platform. Recent international wins are the University of East London (2024) and Universidad del Pacífico in Peru (2024). The search found no Thai Banner customer [verified] — [EDUCAUSE press release](https://www.educause.edu/about/corporate-participation/member-press-releases/university-of-east-london-selects-ellucian-banner-saas-to-support-growth), [Ellucian](https://www.ellucian.com/newsroom/universidad-del-pacifico-supports-its-mission-academic-excellence-and-sustainable-growth)
- **Ellucian's APAC footprint:** a third-party directory says Ellucian has user conferences in Australia and offices in India. The source is not primary [verified as claim only] — [ZoftwareHub](https://zoftwarehub.com/en-ae/products/ellucian/product-details)
- **SAP Student Lifecycle Management (SLcM):** part of SAP Higher Education & Research and offered on S/4HANA Cloud Private Edition. A UK G-Cloud listing sells it in 100-user blocks on 3–5 year contracts. Users include the University of Zurich medical faculty, Baden-Württemberg universities (the selma4us project) and VU Amsterdam [verified] — [SAP](https://www.sap.com/austria/products/erp/student-lifecycle-management-for-sap-s4hana-cloud-private-edition.html), [G-Cloud](https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/293625669385408), [Scheer](https://scheer-group.com/en/customers-partnerships/customers-and-reference-stories/customer-success-story-campus-management), [VU](https://vu.nl/nl/verhalen/herug-high-speed-showcase-student-lifecycle-management)
- **Unit4 Student Management:** Asian customers are scarce in the sources. A 2016 release names the Singapore Institute of Management, and other named users are the University of Modern Sciences in Dubai and Monash/OneSchool in Australia, all from 2015–2017 [verified, dated] — [BusinessWire 2016](https://www.businesswire.com/news/home/20161025006229/en/Unit4-First-to-Deliver-Full-Student-Administration-Capabilities-for-Large-Complex-Higher-Education-Institutions), [Enterprise Times](https://www.enterprisetimes.co.uk/2017/03/17/multinational-christies-educator-finds-unit4-cloud/)
- **[BK, unverified]** Anthology Student (formerly Campus Management CampusNexus) targets US institutions that depend on Title IV financial aid. Workday Student is sold only as multi-tenant SaaS in Workday-run data centres, which can conflict with Thai data-residency and GDCC procurement rules. None of these vendors is known to localise for Thai regulations: Thai GPA rules, สกอ./อว. reporting such as the CHE/MHESI student-data submission, the กยศ. student loan fund, or Buddhist-era (BE) dates.

### Inferences
- Large Tier-1 SaaS student projects consistently cost tens to hundreds of millions of USD and take 3–6+ years. For a Thai public university with a Thai-baht budget, that is out of proportion.
- The failure pattern is consistent across vendors: underestimated cost, too little internal staff and resources, heavy customisation, a single implementation partner, and boilerplate contracts. The TNSU vendor contract should guard against each of these, whatever the platform choice.

### Gaps
- No public pricing for Workday Student, Banner SaaS, Anthology or SLcM was found beyond the WashU disclosure and the SAP 100-user-block structure.
- No confirmed Tier-1 SIS deployment at a Thai university. The searches found none, but that is not proof none exists.
- The Anthology Student roadmap and end-of-life status were not found.

---

## 2. Open source: maturity and fit

### Takeaway
No open-source SIS has proven reliable at multi-campus university scale. Kuali Student, the biggest attempt, was effectively sunset after about USD 40M. Odoo- and Frappe-based education ERPs (OpenEduCat, Frappe Education) suit small institutions or serve as a base to customise. Open-source LMS (Moodle, Open edX) is mature and is already the Thai national norm.

### Cited Findings
- **Kuali Student:** the open-source "next-generation SIS" consortium was sunset as a community project and moved to KualiCo (a commercial company) around 2014; e-Literate describes it as a USD 40M project. The University of Washington deployed only some modules (MyPlan, Curriculum Management) [verified] — [e-Literate](https://eliterate.us/kuali-student-sunsetting-40-million-project-moving-kualico/), [UW report 2015](https://www.washington.edu/uwit/reports/Kuali_Student_Update030415.pdf), [Campus Technology](https://campustechnology.com/Articles/2013/12/12/U-Washington-Deploys-Kuali-Open-Source-Student-Information-System.aspx)
- **OpenEduCat:** built on Odoo, with a community edition under LGPL-3. It claims over 1,000 institutions on one page and 30,000+ on another; the figures are self-reported and inconsistent [verified as vendor claim] — [OpenEduCat](https://openeducat.org/open-source-education-erp/), [FitGap](https://us.fitgap.com/products/openeducat)
- **Thai MOOC runs on Open edX:** it is operated by Thailand Cyber University (TCU) under the Ministry of Higher Education (อว.), launched in 2017, and had 1,534,890 members as of October 2022. 104 universities have developed 589 courses [verified] — [Open edX](https://openedx.org/events/the-open-edx-platform-increasing-access-to-underserved-learners/), [thailand.go.th](https://thailand.go.th/issue-focus-detail/001_06_043)
- **Mahidol's MUx** (mux.mahidol.ac.th) runs on edX [verified] — [SMU mediacast](https://mediacast.smu.edu.sg/media/Professor+Chailerd+PichitpornchaiA+Sharing+of+use+of+Open+Educational+Resources+%28OER%29+and+Massive+Open+Online+Courses+%28MOOC%29+Implementation+in+Thailand/0_hpulvv6y)
- **[BK, unverified]** Moodle (GPL-3) is widely used by Thai universities, often branded as e-learning sites. Canvas LMS has an open-source edition under AGPL-3 (github.com/instructure/canvas-lms), but self-hosting it is operationally heavy. Fedena (Ruby on Rails) is mostly K-12 and its open-source edition is largely abandoned. openSIS is K-12-focused. Frappe Education (an ERPNext module, GPL-3) has a basic feature set: programs, courses, enrolment, fees and assessment. CiviCRM (AGPL) is a mature nonprofit CRM used for donors and alumni at some universities. Keycloak is a CNCF incubating project.

### Inferences
- A realistic open-source role is the LMS (Moodle, or Open edX for MOOC and public courses, which links to Thai MOOC), identity (Keycloak), and possibly alumni CRM (CiviCRM). The core SIS (registration, grading, curriculum) would be custom-built or bought from a Thai vendor, not open source.
- Open edX matches the national Thai MOOC ecosystem, and Moodle is better for credit-bearing course delivery.

### Gaps
- No current maturity data (GitHub activity, release cadence) was gathered for Frappe Education, openSIS, Fedena or CiviCRM. The writer should hedge.
- No evidence was found of Thai universities using OpenEduCat or Frappe Education.

---

## 3. Thai market: what Thai universities use for ทะเบียน (registration)

### Takeaway
Thai universities typically run an in-house or locally developed "REG" system, sometimes from a local vendor. One example: Mahasarakham University's registration app was developed by บริษัท วิชั่น เน็ต จำกัด (Vision Net Co., Ltd.). No Thai university was found that publicly documents a modern SIS architecture.

### Cited Findings
- The MSU Registration System app (Mahasarakham University) lists Vision Net Co., Ltd. as its developer [verified via app listing] — [App Store](https://apps.apple.com/app/id1541990616)
- Thai academic literature about registration systems at Rajabhat and Rajamangala universities is mostly service-quality or satisfaction studies, plus a decision-support system for registration and academic management at Rajanagarindra Rajabhat. None of it describes architecture [verified] — [ThaiJo, Rajanagarindra DSS](https://so06.tci-thaijo.org/index.php/var/article/view/288932), [STOU repository, RMUTSB](https://repository.stou.ac.th/items/60f7129f-e741-4416-bd92-8a8573d9f6bc)
- Naresuan University runs its own online registration system (reg2.nu.ac.th) per its 2025 student manual [verified] — [NU manual](https://www.reg2.nu.ac.th/publish/studentmanual2025_b.pdf)
- Chula's Office of the Registrar website covers registration, records and internal IT. It does not name the system or vendor [verified] — [reg.chula.ac.th](https://www.reg.chula.ac.th/en/reghome/about/vision/)
- Searches for Chula, Mahidol and Kasetsart adopting SAP or Oracle student systems returned only old theses: a 2005 faculty-level student administration system at Chula Engineering and a 1992 Mahidol graduate-school registration system [verified] — [Chula ETD](https://cuir.car.chula.ac.th/handle/123456789/34627), [Mahidol repository](https://repository.li.mahidol.ac.th/handle/123456789/105805)
- TNSU's public site is www.tnsu.ac.th (Chonburi). The search found no public documentation of TNSU's current registration system [verified] — [CU thesis citing TNSU](https://cuir.car.chula.ac.th/bitstream/123456789/79635/1/6084204227.pdf)
- KKU has a research report on an athlete-selection system, which is Thai precedent for digitising athlete recruitment [verified] — [KKU Sports](https://sports.kku.ac.th/wp-content/uploads/2025/05/รายงานผลการวิจัย-เรื่อง-การจัดทำระบบคัดเลือกนักกีฬา.pdf)
- **[BK, unverified]** Many Thai universities and Rajabhat campuses run a shared-pattern "REG" web system on the reg.<univ>.ac.th domain, with URLs like registrar/…asp, built by Vision Net or in-house. Several universities have moved to "Super App" mobile portals (for example CU NEX at Chula and MyKU at Kasetsart). Verify these before citing.

### Inferences
- The Thai market favours locally built systems, because Thai regulatory reporting, the Thai language, กยศ. loans and BE dates are poorly served by global SIS products. This supports a custom-build or hybrid approach with a Thai vendor.
- TNSU's current system and its data-migration source need to be discovered directly from TNSU, since nothing public was found.

### Gaps
- No Thai vendor market-share data. Names of other Thai REG vendors could not be confirmed.
- No public architecture write-up from Chula, Mahidol or KU on SIS modernisation was found.
- Whether a shared system exists across the Rajabhat network is unconfirmed.

---

## 4. Athlete management systems (AMS)

### Takeaway
Smartabase (now Teamworks AMS), Kitman Labs and Catapult are the leading university-grade platforms. They cover wellness questionnaires, injury and EMR records, and training load from wearables, and integrate through vendor APIs. Interoperability runs on proprietary APIs; there is no open data standard.

### Cited Findings
- **Smartabase (Teamworks AMS):** Northwestern built an athletic-training EMR inside Smartabase with injury reporting, rehab plans, and a daily wellness questionnaire in the athlete app that feeds readiness-to-train reports. Users include the University of Texas, Grand Valley State and Miami (Ohio). It centralises data from wearables and third-party systems, including the Datalys NCAA Injury Surveillance Program [verified] — [Smartabase Northwestern](https://smartabase.com/?p=98628), [Smartabase College](https://fc885f03716d.fusionsport.com/smartabase-college-platform), [GVSU](https://gvsulakers.com/news/2024/4/2/general-gvsu-athletics-inks-partnership-with-teamworks.aspx)
- **Australian Institute of Sport:** runs Smartabase as the "Athlete Management System" platform for the national high-performance sector, a national-level precedent relevant to Thailand's sports authority [verified] — [AIS Sports Intel](https://support.sportsintel.ausport.gov.au/hc/en-us/articles/4899177324815-The-Software-Platform)
- **Catapult Connect:** an API that syncs Catapult OpenField wearable GPS/IMU data with the team's own platform, third-party AMS products, or AMS by Catapult. Catapult says importing into third-party AMS is "limited" and "time consuming" [verified] — [Catapult blog](https://www.catapult.com/blog/connect-api-integration-ams), [Catapult AMS API](https://www.catapult.com/blog/ams-catapult-api-integration)
- **Kitman Labs:** a collegiate AMS integrating Catapult, StatSports and Strive. Loughborough University uses it to integrate medical and performance data [verified] — [Kitman collegiate](https://kitmanlabs.com/sports-management-software/collegiate)
- **[BK, unverified]** TeamBuildr focuses on strength and conditioning programming and athlete training logs. Kinduct (acquired by Teamworks in 2022) and AthleteMonitoring (FITSTATS) are lower-cost options covering wellness, ACWR training load and injury. None of these vendors is known to have Thai data residency. The Thai PDPA treats health data as sensitive personal data (Section 26), which requires explicit consent.

### Inferences
- For TNSU, the hybrid pattern fits: build a light in-house athlete module (athlete profile, sport, competition records, scholarship eligibility, academic-athletic link) as part of the SIS, and either integrate a commercial AMS for high-performance squads or build wellness and load forms. The commercial path carries cost, USD pricing and cross-border data issues.
- Medical and injury data falls under PDPA sensitive data. Separate the data store, apply strict RBAC, and keep consent records.

### Gaps
- No public pricing for any AMS was found.
- No evidence of an AMS in use at Thai universities or the Sports Authority of Thailand (กกท.).
- API specifications (auth, rate limits) were not retrieved.

---

## 5. Reference architecture best practice (2026)

### Takeaway
At TNSU's scale (17 campuses, likely tens of thousands of students), a modular monolith with clear domain modules is the most defensible core. Add asynchronous event integration, an OIDC/SAML identity hub (Keycloak), an API gateway, a separate analytics store, and a virtual waiting room plus queue-based enrolment for registration-day peaks. Hosting should consider Thailand's Cloud First/GDCC policy.

### Cited Findings
- **Modular monolith trend:** Shopify is the standard large example. Amazon Prime Video's monitoring team moved one service from microservices back to a monolith and reported about 90% cost reduction, but that was one component, not the whole platform. A claimed "2025 CNCF survey" figure (42% consolidating) appears only in secondary sources and is unverified [verified as secondary] — [Educative on Shopify](https://www.educative.io/newsletter/system-design/shopify), [SoftwareSeni](https://www.softwareseni.com/understanding-modern-software-architecture-from-microservices-consolidation-to-modular-monoliths/), [Noqta (secondary, treat with caution)](https://www.noqta.tn/en/blog/modular-monolith-architecture-microservices-alternative-2026)
- **Registration-day peak pattern:** King's College London rejected scaling hardware "for a single day a year", tried time slots (students ignored them), and adopted a virtual waiting room. Conestoga College held users on a countdown page, then released them FIFO at the portal's capacity and gradually raised the rate. MacEwan University integrated Queue-it with PeopleSoft and reported no more crashes. All of these are vendor case studies [verified, vendor-sourced] — [Queue-it blog](https://queue-it.com/blog/university-registrations-online-queue/), [Queue-it KCL](https://queue-it.com/success-stories/kings-college-london/), [Queue-it Conestoga](https://queue-it.com/success-stories/conestoga-college/), [MacEwan case](https://www.casestudies.com/company/queue-it/case-study/macewan-university-streamlines-20000-student-enrollment-with-queue-it), [Queue-Fair](https://queue-fair.com/education)
- **Brock University (2013):** an example of registration delays requiring remediation [verified] — [Brock News](https://brocku.ca/brock-news/2013/06/registration-delays-being-addressed)
- **Thai Cloud First / GDCC:** GDCC was set up by a 2019 Cabinet resolution and is operated by NT (National Telecom) under the BDE. The Cloud First policy routes state units' cloud and data-centre procurement through the GDCC platform, with enforcement from 1 October 2025 and about THB 10 billion for FY2026. The target is a 30% cost reduction, and 800+ agencies use it. Draft government cloud and data-classification guidelines were issued in 2025 [verified] — [Bangkok Post](https://bangkokpost.com/business/general/2986926/cloud-first-policy-gets-underway-on-oct-1), [Bangkok Post 2](https://www.bangkokpost.com/business/general/2822908/is-the-government-on-cloud-nine-), [Tilleke & Gibbins](https://www.tilleke.com/insights/thailand-releases-draft-guidelines-on-government-cloud-adoption-and-data-classification/11/), [BDE draft PDF](https://www.bde.go.th/assets/portals/1/files/1DraftCloud.pdf)
- **eduroam and ThaiREN:** UniNet (สำนักงานบริหารเทคโนโลยีสารสนเทศเพื่อพัฒนาการศึกษา) is Thailand's eduroam National Roaming Operator, and eduroam launched in Thailand at APAN 33 in February 2012. UniNet published an eduroam joining policy in 2023. eduroam is RADIUS-based, which is distinct from a SAML web-SSO federation. No Thai national SAML/eduGAIN federation was confirmed [verified] — [UniNet eduroam policy](https://www.uni.net.th/wp-content/uploads/2023/05/nayobai-join-eduroam.pdf), [RMUTP eduroam guide](https://noc.rmutp.ac.th/wp-content/uploads/2021/08/How-to-use-Eduroam.pdf), [ThaiREN update (NSRC 2014)](https://www.nsrc.org/workshops/2014/nsrc-tein-ait/raw-attachment/wiki/Agenda/ThaiREN-Update.pdf), [ACOnet comparison](https://www.aco.net/402.html?L=1)
- **[BK, unverified] Engineering defaults for 2026:**
  - **Identity:** Keycloak (OIDC/SAML; it can act as the eduroam RADIUS backend via LDAP/AD, or use FreeRADIUS against the same directory). Add ThaID or national digital ID for applicant verification where policy allows.
  - **Integration:** an API gateway (Kong, APISIX or Envoy) plus event streaming (Kafka or Redpanda, or a lighter option such as NATS or RabbitMQ) using the outbox pattern.
  - **Analytics:** a PostgreSQL OLTP database, with an analytics lakehouse (Apache Iceberg/Delta and Trino, or ClickHouse) fed by CDC (Debezium), and BI in Superset or Metabase.
  - **Platform and observability:** Kubernetes (on GDCC or on-prem with Rancher or OpenShift), and observability with OpenTelemetry, Prometheus/Grafana and Loki/Tempo.
  - **Mobile:** Flutter or React Native for a student super-app, plus a PWA for low-end devices. Flutter is popular in Thailand; React Native allows code sharing with a React web front end.
  - **Registration-day patterns:** pre-registration and cart, a waiting room or token bucket at the edge, async seat allocation through a queue with idempotent commands, seat counters in Redis with atomic decrement plus DB reconciliation, read replicas or caching for the course catalogue, staggered time slots by year or campus, and load testing (k6, Gatling) at about 3–5x the expected peak.

### Inferences
- A modular monolith can still put registration and seat allocation in a separately scalable module or worker, which is the main hotspot. Full microservices across about 10 domains would increase a vendor's operational burden without a clear benefit at this scale.
- TNSU, as a public university, probably counts as a "state unit" under Cloud First/GDCC procurement, but that is unconfirmed. Make the architecture cloud-portable (containers, Kubernetes, no proprietary PaaS lock-in) so it can run on GDCC, a Thai commercial cloud or on-prem.
- A single Keycloak realm across 17 campuses, with campus as an attribute or group rather than separate systems, simplifies SSO, LMS integration and eduroam.

### Gaps
- No primary engineering blog was found on Thai university registration-day scaling, such as how Chula or KU handle peaks.
- Whether autonomous public universities (มหาวิทยาลัยในกำกับ) or TNSU (a public university under Thai law) are bound by GDCC is unconfirmed.
- No Thai SAML federation was confirmed.

---

## 6. AI features in modern student systems and their risks

### Takeaway
Early-warning and dropout-prediction tools are common: EAB Navigate is used at more than 500 schools. They have documented racial bias. The Markup found Black students flagged as high-risk at 2–4x the rate of White students, and race was an explicit model input. Any TNSU early-warning or AI advising feature needs fairness auditing, transparency, human oversight and PDPA compliance.

### Cited Findings
- **The Markup (2021):** Navigate is used at more than 500 schools. Black students received high-risk scores at double to quadruple the rate of White peers, and race was an explicit model variable at nearly all schools examined. Universities did not know how the proprietary models weighted race. Texas A&M dropped risk scores from adviser dashboards and asked EAB for race-free models [verified] — [The Markup](https://themarkup.org/news/2021/03/30/texas-am-drops-race-from-student-risk-algorithm-following-markup-investigation), [AI Incident Database](https://incidentdatabase.ai/cite/99), [MuckRock FOI, UCF](https://www.muckrock.com/foi/orlando-123/eab-risk-score-reports-university-of-central-florida-103287/)
- **[BK, unverified]** LLM advising chatbots risk hallucinating policies, such as wrong graduation requirements, and need retrieval-augmented answers from official regulations (ระเบียบ) with citations and escalation to human advisors. Thailand's PDPA (enforced from 1 June 2022) requires a lawful basis and DPIA-style care when profiling students. Sending student data to a foreign LLM API is a cross-border transfer issue.

### Inferences
- For TNSU, the equivalent risk variables are campus (rural versus Bangkok campuses), province or region, and athlete status. Using them as predictors could steer athlete-students away from demanding programmes, mirroring the Navigate finding. Exclude protected or proxy attributes, audit disparate impact by campus, gender and sport, and show advisors the reasons rather than a bare score.
- A phased approach: rules-based early alerts first (attendance, GPA drop, missing coursework in the LMS), then ML once there are 3+ years of clean data.

### Gaps
- No recent (2024–2026) evaluations of EAB's current models were found.
- No Thai university AI-advising deployments or Thai regulatory guidance specific to AI in education were found this session.
