# UX และการบริหารการเปลี่ยนแปลง (Organisational Change) สำหรับ TNSU Student & Athlete Lifecycle Platform (v2)

> **ขอบเขต:** มุมมองผู้ใช้ (นักศึกษา, นักเรียนโรงเรียนกีฬา, ผู้ปกครอง, เจ้าหน้าที่, โค้ช/นักวิทยาศาสตร์การกีฬา, ผู้บริหาร) และการบริหารการเปลี่ยนแปลงในองค์กรหลายวิทยาเขต ไม่ซ้ำกับ `review_benchmark.md` (feature benchmark) และ `v2/student_services.md` (process ระดับขั้นตอน) ใช้รหัสโมดูลและบทบาทตาม `tnsu-system/docs/00-blueprint.md`
> **วันที่:** 28 ต.ค. 2569 · **ป้ายกำกับ:** ✅ = ยืนยันจากแหล่งที่ค้นได้ในรอบนี้ (มี URL) · 🟡 = จากความรู้ทั่วไป/แหล่งรอง/ยังไม่ได้ตรวจต้นฉบับ ให้ถือเป็นสมมติฐาน **[ต้องตรวจสอบ]**
> **โดเมนที่เข้าไม่ได้ในรอบนี้:** `www.w3.org` (DNS ไม่ resolve ใน session นี้ ทำให้อ่าน W3C Thai Layout Requirements ฉบับเต็มไม่ได้) ส่วนรายงาน ETDA Thailand Internet User Behavior (IUB) 2567–2569 ฉบับทางการค้นไม่พบ (พบแต่ฉบับ 2562/2564/2565 และตัวเลขจากแหล่งรองที่ขัดกันเอง)
> **ข้อจำกัด:** คำบ่นในรีวิวแอปลงทะเบียนของมหาวิทยาลัยไทยค้นด้วย web search ไม่ได้ผล (คำบ่นส่วนใหญ่อยู่ใน X/Pantip/Facebook ซึ่ง search engine ไม่ index) หลักฐานเรื่องระบบล่มวันลงทะเบียนที่พบจึงเป็นกรณีต่างประเทศ

---

## 1. ความคาดหวังของผู้ใช้ชาวไทย (LINE, mobile-first, super-app ภาครัฐ, ผู้ปกครอง)

### Takeaway
ผู้ใช้ไทยเป็น mobile-first และ LINE-first: LINE มีผู้ใช้ราว 56 ล้านคนต่อเดือน (ประมาณ 85% ของผู้ใช้อินเทอร์เน็ต) และคนไทยใช้อินเทอร์เน็ตผ่านมือถือราว 5 ชม./วัน ระบบ มกช. จึงต้องออกแบบโดยถือว่า **หน้าจอหลักคือมือถือ** และ **LINE OA (Messaging API) เป็นช่องทางแจ้งเตือนและช่องทางเข้าระบบ** โดยเฉพาะสำหรับผู้ปกครองและเจ้าหน้าที่ แต่ห้ามพึ่ง LINE Notify เพราะปิดบริการไปแล้วเมื่อ 31 มี.ค. 2568 ส่วนตัวเลข ETDA ปี 2567 ขึ้นไปยังหาฉบับทางการไม่ได้

### Cited Findings
- ✅ LINE รายงานผู้ใช้ราว **56 ล้าน MAU ในไทย** (ปลายปี 2025) และ OA conversations ราว 12 พันล้านครั้ง ตัวเลขนี้มาจากการเปิดเผยของ LINE เอง ไม่ได้ผ่านการตรวจสอบจากบุคคลที่สาม — [Relevant Audience](https://www.relevantaudience.com/digital-marketing-en/line-thailand-business-solutions-2026/); [Yes Press](https://yespress.io/line-company-thailand)
- ✅ สัดส่วน LINE ต่อผู้ใช้อินเทอร์เน็ตไทยมีหลายตัวเลข เช่น 82.6% และ 85.4% (DataReportal Digital 2025) เพราะใช้ตัวหารต่างกัน — [Relevant Audience](https://www.relevantaudience.com/digital-marketing-en/line-thailand-business-solutions-2026/)
- ✅ **LINE Notify ยุติบริการ 31 มี.ค. 2025** (ประกาศ 7 ต.ค. 2024) API ทั้งหมดหยุดทำงานตั้งแต่ 1 เม.ย. 2025 และ LINE แนะนำให้ใช้ Messaging API แทน — [LINE Developers news (end-of-life)](https://developers.line.biz/en/news/tags/end-of-life); [Soracom changelog](https://changelog.soracom.io/soracom-lagoon-3-and-soracom-flux-changes-due-to-line-notify-discontinuation-48L0He)
- ✅ Telenor/GWI 2024: ผู้ใช้อินเทอร์เน็ตไทยใช้ผ่านมือถือเฉลี่ย**เกือบ 5 ชม./วัน** สูงกว่าค่าเฉลี่ย SEA (4:35) — [Telenor x GWI Thailand 2024](https://www.telenorasia.com/wp-content/uploads/2025/01/Telenor-x-GWI-Thailand-Report.pdf)
- ✅ แหล่งรองปี 2024 ให้ตัวเลขเวลาออนไลน์ต่อวันไม่ตรงกัน: 7.58 ชม. (มือถือ 5.2 ชม., คอม/แท็บเล็ต 2.56 ชม.) เทียบกับ "9 ชม. 20 นาที" ที่อ้างว่ามาจากรายงานกระทรวงดีอี — [Affiliate Dragons](https://affdragons.com/thailands-digital-report-for-2024/); [ACU Pay](https://acuthai.com/take-a-look-at-thais-online-behaviors-from-digital-stat-insight-2024/) (ขัดกันเอง ไม่ควรอ้างตัวเลขเดียว)
- ✅ ETDA IUB 2564: Gen Z ใช้อินเทอร์เน็ตมากที่สุด เฉลี่ย **12 ชม. 5 นาที/วัน** (กลุ่มตัวอย่าง 44,545 คน) — [The Thaiger](https://thethaiger.com/th/news/506709/)
- ✅ ETDA IUB 2565: คนไทยเฉลี่ย 7 ชม. 4 นาที/วัน Gen Y มากที่สุด (8 ชม. 55 นาที) และ Gen Z ลดลงเพราะเลิกเรียนออนไลน์หลัง COVID — [Bangkok Post](https://www.bangkokpost.com/business/2375580/survey-healthcare-ranks-as-top-online-activity); [The Nation](https://www.nationthailand.com/in-focus/national/40019312); ชุดข้อมูลเปิด [ETDA opendata IUB 2565](https://opendata.etda.or.th/en/dataset/iub_01_65)
- ✅ ครัวเรือนที่เข้าถึงอินเทอร์เน็ตในไทยเพิ่มเป็น 21.7 ล้านครัวเรือนในปี 2024 — [The Nation](https://www.nationthailand.com/business/tech/40042752)
- ✅ ปี 2024 มีคนไทยราว 10.3% ที่ไม่ใช้อินเทอร์เน็ต (Statista; ตัวเลขละเอียดอยู่หลัง paywall) — [Statista](https://www.statista.com/statistics/1294337/thailand-reasons-for-not-using-the-internet)
- ✅ แอป "ทางรัฐ" ใช้ตรวจสิทธิกลุ่มใหญ่ เช่น ผู้สูงอายุ 3,043,492 คนตรวจสิทธิผ่านแอปตั้งแต่ 22 ม.ค. 2568 และ สปสช. ใช้แอปเป็นช่องทางยืนยันตัวตนสิทธิบัตรทอง (แสดงว่าคนไทยทุกวัยคุ้นกับการยืนยันตัวตนผ่าน super-app ภาครัฐ) — [ฐานเศรษฐกิจ](https://www.thansettakij.com/economy/617432); [กรุงเทพธุรกิจ](https://www.bangkokbiznews.com/health/public-health/1159746)
- ✅ DGA ยืนยันว่าแอปทางรัฐมี war room ร่วมกับ สกมช. 24 ชม. และ ISO 27001 — [InfoQuest](https://www.infoquest.co.th/?p=418620)
- 🟡 "เป๋าตัง" (Krungthai) มีผู้ใช้หลายสิบล้านคนจากโครงการคนละครึ่ง/เงินดิจิทัล จึงเป็น reference pattern ของการยืนยันตัวตน + wallet ที่คนไทยคุ้นเคย (ไม่ได้ค้นตัวเลขรอบนี้) **[ต้องตรวจสอบ]**
- 🟡 รีวิวแอปลงทะเบียนเรียนของมหาวิทยาลัยไทย: ค้นแล้วไม่พบรีวิวที่ index ได้ พบเพียงหน้า App Store ของ RU REGIS (รามคำแหง) ซึ่งบอกเพียงว่ามีฟีเจอร์ค้นวิชา/คำนวณค่าลงทะเบียน — [App Store RU REGIS](https://apps.apple.com/us/app/id1453633675)
- ✅ กรณีต่างประเทศ (ใช้เป็นบทเรียนเรื่องโหลดวันลงทะเบียน): BU (MyBU) ล่มวันลงทะเบียน นักศึกษาปี 4 บ่น, Berkeley College of Music ต้องเลื่อนลงทะเบียนหลัง server crash, CU Boulder มีปัญหา server ช่วงลงทะเบียน 21 ส.ค. 2023, Colgate portal ขาดการเชื่อมต่อช่วงลงทะเบียนปี 1 — [Daily Free Press](https://dailyfreepress.com/04/17/23/204029/bu-rising-seniors-voice-concerns-about-mybu-after-registration-system-crashes/); [Berkeley Beacon](https://berkeleybeacon.com/college-delays-registration-following-server-crash/); [CU Boulder Registrar](https://www.colorado.edu/registrar/2023/08/22/class-registration-system-server-issue-821-resolved); [Colgate Maroon-News](https://thecolgatemaroonnews.com/56335/news/colgate-portal-loses-connectivity-during-first-year-registration-causing-setbacks/)
- ✅ ผู้ปกครองนักเรียนประจำ: `student_services.md` §7 มี interaction matrix (ลา/กลับบ้าน, เยี่ยม, เหตุฉุกเฉิน, ผลการเรียน) และสรุปว่าผู้ปกครองต้องใช้ LINE/SMS fallback — ดู [student_services.md](./student_services.md) (ไม่ทำซ้ำในที่นี้)

### Inferences
- **LINE = ช่องทางแจ้งเตือนและ deep link ไม่ใช่ที่ทำธุรกรรม** ให้ส่ง push/LINE message ที่มีลิงก์ LIFF/deep link เข้าแอปหรือ PWA ส่วนธุรกรรม (ชำระเงิน, ยื่นคำร้อง) ทำในระบบหลักเพื่อให้มี audit trail ทั้งนี้ต้องเลิกออกแบบด้วย LINE Notify (เลิกให้บริการแล้ว) และใช้ LINE OA Messaging API ซึ่งมีค่าข้อความตามแพ็กเกจ จึงต้องตั้ง budget และ quota ต่อวิทยาเขต
- **ผู้ปกครองนักเรียนโรงเรียนกีฬา** (ชนบท, อายุหลากหลาย, หลายคนไม่ติดตั้งแอปมหาวิทยาลัย) → ช่องทางหลักคือ LINE OA + SMS fallback + เบอร์โทรเจ้าหน้าที่หอ ไม่ควรบังคับดาวน์โหลดแอป ส่วนการยืนยันตัวตนผู้ปกครองให้ผูกบัญชี LINE กับเลขบัตรประชาชนและ OTP หรือ ThaiD (ดูเล่ม IAM)
- **ไม่มีหลักฐานไทยเรื่องระบบล่มวันลงทะเบียนในรอบนี้** แต่รูปแบบความล้มเหลวเป็นสากล (traffic spike ตอนเปิดระบบ) จึงต้องมี waiting room/queue, การทยอยเปิดตามชั้นปี (staggered windows) และหน้าสถานะระบบ
- ตัวเลข "ชั่วโมงออนไลน์ต่อวัน" ไม่ควรใช้เป็น requirement เพราะแหล่งขัดกัน ให้ใช้ข้อสรุปเชิงคุณภาพ (mobile เป็นหลัก, LINE ครอบคลุมเกือบทุกคน) แทน

### Gaps
- รายงาน ETDA IUB 2567/2568/2569 ฉบับทางการ (ค้นไม่พบ ต้องดาวน์โหลดจาก etda.or.th โดยตรง)
- จำนวนผู้ใช้แอปทางรัฐและเป๋าตังล่าสุด (ไม่พบตัวเลขที่เชื่อถือได้)
- รีวิว App Store/Play Store ของแอปมหาวิทยาลัยไทย (CU NEX, We Mahidol, REG ราชภัฏ) ซึ่งต้องดึงด้วย App Store/Play scraper ไม่ใช่ web search
- พฤติกรรมดิจิทัลของผู้ปกครองชนบท (อุปกรณ์, data plan) — ไม่พบงานวิจัยเฉพาะ

---

## 2. UX patterns สำหรับ SIS (registration, degree audit, notification, petition, accessibility, low-bandwidth, Thai typography, พ.ศ., bilingual)

### Takeaway
patterns ที่ต้องมีคือ ตะกร้าลงทะเบียน + waitlist + conflict detection ก่อนยืนยัน, degree audit แบบ progress/checklist, การแจ้งเตือนที่ผู้ใช้ควบคุมได้และไม่ส่งซ้ำข้ามช่องทาง, การติดตามคำร้องแบบ timeline และ WCAG 2.2 AA สำหรับไทย มีกฎมาตรฐานหลายข้อ ได้แก่ line-height อย่างน้อยราว 1.5–1.6 สำหรับอักษรไทย, ตัดคำด้วย dictionary (`Intl.Segmenter`/ICU), แสดงปี พ.ศ. แต่เก็บค่าเป็น ISO และฟอนต์ที่รองรับวรรณยุกต์ซ้อน อย่างไรก็ตาม ทั้งหน่วยงานรัฐไทยและเว็บไซต์มหาวิทยาลัยไทยส่วนใหญ่ยังไม่ผ่านเกณฑ์ accessibility

### Cited Findings
**Accessibility**
- ✅ ไทยรับ WCAG 2.0 ฉบับภาษาไทยเป็นมาตรฐานผลิตภัณฑ์อุตสาหกรรม (มอก. 2565-2555) — [Mahidol repository: Accessibility evaluation of Thai government websites](https://repository.li.mahidol.ac.th/handle/123456789/92474)
- ✅ เว็บไซต์กระทรวงที่ทดสอบ**ไม่ผ่าน WCAG 2.0 ทั้งหมด** และมีรายงานว่าเว็บไซต์รัฐผ่านเกณฑ์สำหรับคนพิการเพียงราวครึ่งเดียว — [Mahidol repository](https://repository.li.mahidol.ac.th/items/7f33e5b1-ee9d-4227-881b-97f39f296fbf/full); [OpenGov Asia](https://opengovasia.com/?p=104784)
- ✅ ปี 2025 สสส. และภาคีผลักดันคู่มือ **TWCAG 2025** (Thailand Web Content Accessibility Guidelines) สำหรับอบรมนักพัฒนา และร่วมกับ สวทช. ตรวจ accessibility เว็บไซต์สาธารณะ — [Accesstive compliance hub](https://accesstive.com/compliance-hub/thailand-ict-policy/); [thailand.go.th](https://thailand.go.th/event-detail/digital-access-drive-for-disabled-people-2-2); สวทช. ร่วมแปลเอกสาร W3C — [W3C translators list (NSTDA)](https://lists.w3.org/Archives/Public/w3c-translators/2025JulSep/0011.html)
- ✅ มีเครื่องมือประเมิน web accessibility ภาษาไทยสำหรับคนพิการและผู้สูงอายุ (งานวิจัย ThaiJO) — [ThaiJO MSJ](https://so03.tci-thaijo.org/index.php/msj/article/view/231809); งานศึกษาเว็บไซต์มหาวิทยาลัยไทย — [Slideshare: Web accessibility on Thai HE websites](https://www.slideshare.net/slideshow/web-accessibility-on-thai-higher-education-websites/39911300)
- 🟡 WCAG 2.2 (W3C Recommendation ต.ค. 2023) เพิ่มเกณฑ์ที่สำคัญต่อ SIS มือถือ ได้แก่ 2.5.8 Target Size (Minimum) 24×24 CSS px, 2.4.11 Focus Not Obscured, 3.3.7 Redundant Entry (ไม่ให้กรอกซ้ำในขั้นตอนเดียวกัน), 3.3.8 Accessible Authentication (ไม่บังคับ cognitive test เช่นจำรหัส/ไขปริศนา) และ 3.2.6 Consistent Help (อ่านต้นฉบับไม่ได้ เพราะ w3.org ถูกบล็อก) **[ต้องตรวจสอบ]**
- 🟡 Screen reader ที่ใช้ภาษาไทยได้คือ NVDA (มี Thai TTS/ตัดคำ), TalkBack และ VoiceOver แต่ไม่พบแหล่งที่ระบุว่าหน่วยงานรัฐไทยทดสอบกับ screen reader ตัวใด — ผลค้นไม่พบเรื่อง NVDA โดยตรง **[ต้องตรวจสอบ]**

**Thai typography**
- ✅ สระประสมไทยประกอบด้วย glyph ได้ถึง 4 ตัว (+ วรรณยุกต์) ล้อมพยัญชนะได้ 3 ด้าน และมีเฉพาะสระบน/ล่างที่เป็น combining mark — W3C Thai Layout Requirements (จาก snippet; อ่านฉบับเต็มไม่ได้) — [W3C thai-lreq](https://www.w3.org/TR/2024/DNOTE-thai-lreq-20240630); [W3C sealreq Thai](https://w3c.github.io/sealreq/thai/)
- ✅ การทดสอบอักษรสูง (รวมไทย) พบว่าที่ `line-height: 1.1` มีการตัด (clipping) ทุกสคริปต์ และ**ตั้งขั้นต่ำ 1.6 แก้ปัญหาได้** และฟอนต์เป็นตัวแปรหลัก (Noto Sans ตัด descender ละตินที่ 1.1) — เป็นการทดสอบไม่เป็นทางการ — [SuttaCentral discourse](https://discourse.suttacentral.net/t/testing-for-line-height-with-tall-scripts/6196)
- ✅ ฟอนต์ไทยต้องปรับ vertical metrics เพื่อรองรับสระและวรรณยุกต์ (ตัวอย่าง Pattaya) — [RightFont Pattaya](https://rightfontapp.com/family/pattaya); ตำแหน่งวรรณยุกต์ที่ดีควรอยู่ระดับเดียวกับสระบน และบางฟอนต์มี precomposed glyph — [Unicode mailing list](https://unicode.org/mail-arch/unicode-ml/Archives-Old/UML024/1148.html)
- ✅ Noto Sans Thai ดาวน์โหลดได้ฟรีจาก Google Fonts — [Fontpad Noto Looped](https://www.fontpad.co.uk/customfonts/noto-sans-looped/)
- 🟡 ฟอนต์ที่เหมาะกับ UI ราชการ/มหาวิทยาลัย: **TH Sarabun New** (ฟอนต์แห่งชาติ บังคับในหนังสือราชการตามมติ ครม. 2553 แต่ x-height เล็ก ไม่เหมาะกับจอ ต้องใช้ขนาดใหญ่กว่า Latin ราว 1.3–1.4 เท่า), **Sarabun** (Google Fonts, ปรับ metrics แล้ว), **Noto Sans Thai** (มีหัว/ไม่มีหัว "Looped"), **IBM Plex Sans Thai** (เข้าชุดกับ IBM Plex Sans) — ไม่ได้ตรวจต้นฉบับรอบนี้ **[ต้องตรวจสอบ]**
- 🟡 ภาษาไทยไม่มีช่องว่างระหว่างคำ ทำให้ browser ต้องตัดบรรทัดด้วย dictionary (Chrome/Firefox/Safari ใช้ ICU) ส่วนใน JS ใช้ `Intl.Segmenter('th', {granularity:'word'})` ได้ และควรเลี่ยง `text-align: justify` กับข้อความไทยยาว เพราะ justification ไทยกระจายช่องไฟไม่สวย; Flutter ใช้ ICU ตัดคำไทยเช่นกันแต่ต้องทดสอบ ellipsis/overflow — **[ต้องตรวจสอบ]** (อ่าน W3C ไม่ได้)

**Registration / degree audit / petition / notifications**
- ✅ Benchmark ที่มีอยู่แล้ว: degree planner (Stellic), early alert (EAB Navigate), e-Petition catalogue ไทย — [review_benchmark.md](../review_benchmark.md) §2.1–2.2 (ไม่ทำซ้ำ)
- ✅ สาเหตุหลักของ notification fatigue คือ ความถี่ ความไม่ตรงประเด็น และเวลาที่ส่ง รวมถึงการส่งเรื่องเดียวกันซ้ำหลายช่องทาง (email+SMS+push) และควรให้ผู้ใช้ตั้งค่าเองได้ (แหล่ง vendor ไม่ใช่งานวิจัย) — [FlareLane](https://blog.flarelane.com/how-to-manage-user-fatigue-when-sending-push-notifications); [SuprSend](https://www.suprsend.com/post/alert-fatigue); [Appbot 2026](https://appbot.co/blog/app-push-notifications-2026-best-practices/)
- ✅ คำว่า "too many notifications"/"feels like spam" ในรีวิวแอปมักเป็นสัญญาณเตือนหลายสัปดาห์ก่อนผู้ใช้ปิดแจ้งเตือน — [Appbot](https://appbot.co/blog/app-push-notifications-2026-best-practices/)
- 🟡 Pattern ลงทะเบียนที่ SIS สากลใช้ (Ellucian Banner/Colleague SS, PeopleSoft Campus Solutions, Workday Student): **plan/cart → validate → submit**, ตรวจ prerequisite/time conflict/credit limit/hold ก่อนกด submit, waitlist อัตโนมัติพร้อม notification + เวลาตอบรับจำกัด, "swap" (ถอนวิชา A เมื่อได้ B เท่านั้น) — จากความรู้ทั่วไป **[ต้องตรวจสอบ]**
- ✅ Onboarding ควรเป็น checklist ที่ติดตามได้ (progress bar) — [student_services.md](./student_services.md) §1

### Inferences
**UX principles & patterns (ข้อเสนอสำหรับ มกช.)**

| # | หลักการ | Pattern ที่ใช้ | เหตุผล/แหล่ง |
|---|---|---|---|
| P1 | **Mobile-first, thumb-first** | ออกแบบที่ 360×640 ก่อน, bottom nav, target ≥ 44 px (เกิน WCAG 2.2 24 px) | ใช้มือถือราว 5 ชม./วัน ✅ Telenor; WCAG 2.2 🟡 |
| P2 | **LINE เป็นประตู ไม่ใช่ห้อง** | แจ้งเตือนผ่าน LINE OA + deep link/LIFF เข้าระบบ แต่ธุรกรรมทำในระบบหลัก | LINE 56M ✅; LINE Notify ปิดแล้ว ✅ |
| P3 | **ตรวจก่อนยืนยัน (validate-before-commit)** | ตะกร้าลงทะเบียน: ตรวจ conflict/prereq/credit/hold/สิทธิ์นักกีฬาแบบ real-time พร้อมเหตุผลเป็นภาษาไทยชัดเจนและปุ่ม "ยื่นคำร้องขอยกเว้น" ในจุดเดียวกัน | 🟡 pattern SIS สากล |
| P4 | **วันพีคต้องมีความเป็นธรรมและโปร่งใส** | virtual waiting room แสดงลำดับคิว, staggered windows ตามชั้นปี/วิทยาเขต, ตะกร้าที่บันทึกไว้ก่อนเปิดระบบ (pre-load cart) และหน้า status page | กรณีล่มต่างประเทศ ✅ |
| P5 | **ความคืบหน้าที่เห็นภาพ** | degree audit แบบ progress ring ต่อหมวด + รายการ "ยังขาด" + what-if; สำหรับนักกีฬาแสดง "เส้นทางจบตามแผนภาคเบา" | benchmark ✅ |
| P6 | **คำร้องแบบติดตามพัสดุ** | timeline (ยื่น → อาจารย์ที่ปรึกษา → คณบดี → ทะเบียน), ระบุชื่อตำแหน่งผู้ถือเรื่องและ SLA ที่เหลือ, แจ้งเตือนเฉพาะตอนสถานะเปลี่ยน | student_services ✅ |
| P7 | **แจ้งเตือนน้อยแต่ตรง** | จัดเป็น 3 ระดับ (critical: ไม่ปิดได้ เช่น เหตุฉุกเฉิน, ค้างชำระ / action-required / info: รวมเป็น digest รายวัน), ห้ามส่งเรื่องเดียวซ้ำหลายช่องทาง (send-once + fallback เมื่ออ่านไม่ได้), quiet hours 21:00–07:00 ยกเว้น critical, เพดานต่อสัปดาห์ต่อคน | fatigue ✅ (vendor) |
| P8 | **Accessible by default (WCAG 2.2 AA + TWCAG)** | design tokens ที่ contrast ≥ 4.5:1, focus ที่มองเห็น, label ไทยที่ screen reader อ่านได้, ไม่ใช้ CAPTCHA แบบรูปภาพ, ทดสอบด้วย NVDA+TalkBack+VoiceOver ภาษาไทยทุก release | รัฐไทยไม่ผ่านเกณฑ์ ✅; TWCAG 2025 ✅ |
| P9 | **Thai typography rules** | body ≥ 16 px (ไทยอ่านยากกว่า Latin ขนาดเท่ากัน), `line-height` ≥ 1.6 สำหรับไทย, ไม่ justify, ไม่ใช้ italic กับไทย (ใช้ bold/สีแทน), ฟอนต์ UI = Noto Sans Thai หรือ IBM Plex Sans Thai (มีชุด Latin เข้ากัน) ส่วนเอกสาร PDF ราชการใช้ TH Sarabun New ตามระเบียบ | SuttaCentral ✅; ฟอนต์ 🟡 |
| P10 | **ตัดคำและค้นหาภาษาไทย** | ตัดบรรทัดด้วย ICU/`Intl.Segmenter`, ค้นหาด้วย tokenizer ไทย (เช่น ICU tokenizer ของ OpenSearch/PostgreSQL + PyThaiNLP สำหรับ batch), ค้นชื่อได้ทั้งไทย/อังกฤษ/สะกดผิดเล็กน้อย | 🟡 |
| P11 | **วันที่และปี** | เก็บเป็น ISO-8601 (ค.ศ., UTC+7), แสดง พ.ศ. ในภาษาไทย ("28 ต.ค. 2569") และ ค.ศ. ในภาษาอังกฤษ, ปีการศึกษาแสดงเป็น พ.ศ. ("ภาค 1/2569"), ใส่ตัวเลขอารบิกเป็นค่า default (เลขไทยเฉพาะเอกสารราชการที่ต้องใช้) | 🟡 (พ.ศ. = ค.ศ.+543) |
| P12 | **Bilingual ที่แยก content กับ UI** | i18n key สำหรับ UI, ฟิลด์ข้อมูลหลักมี `name_th`/`name_en` (ชื่อวิชา ชื่อบุคคล), ภาษาเริ่มต้นตามบทบาท (ไทยสำหรับทุกคน, อังกฤษสำหรับนักศึกษาต่างชาติ), ห้ามแปลด้วยเครื่องสำหรับเอกสารทางการ | 🟡 |
| P13 | **Low-bandwidth/offline** | PWA + service worker cache ข้อมูลอ่านอย่างเดียว (ตารางเรียน, บัตรนักศึกษา, ตารางสอบ, ตารางฝึก), offline queue สำหรับ attendance/wellness/เช็คชื่อหอ แล้ว sync ภายหลัง, หน้าแรก ≤ 200 KB, รูปเป็น WebP, ไม่โหลด video อัตโนมัติ | วิทยาเขต/โรงเรียนชนบท; 10% ไม่ใช้เน็ต ✅ |
| P14 | **ผู้เยาว์และผู้ปกครองต้องมีความปลอดภัย** | UI ของนักเรียนโรงเรียนกีฬาซ่อนฟีเจอร์ที่ไม่จำเป็น และผู้ปกครองเห็นเฉพาะข้อมูลที่บุตรอยู่ในความดูแล (ตาม PDPA) | tnsu_profile ✅ |

### Gaps
- เนื้อหาฉบับเต็มของ W3C Thai Layout Requirements (line height, justification, emphasis) — w3.org ถูกบล็อก ต้องเปิด domain แล้วตรวจอีกครั้ง
- ข้อความเกณฑ์ WCAG 2.2 จากต้นฉบับ และ TWCAG 2025 ฉบับเต็ม (ยังไม่ได้ดาวน์โหลด)
- usability study ของ SIS ไทย (registration UX) — ไม่พบงานวิจัยที่ index ได้
- ผลทดสอบ screen reader ภาษาไทยกับ Flutter/PWA — ไม่พบ

---

## 3. Staff / back-office UX และการต่อต้านระบบใหม่ของเจ้าหน้าที่รัฐไทย

### Takeaway
หน่วยงานรัฐไทยใช้ดิจิทัลแค่ในงานธุรการ ยังไม่ถึงระดับกลยุทธ์ อุปสรรคหลักคือ โครงสร้างราชการ วัฒนธรรมแบบลำดับชั้น งบประมาณ และขาดบุคลากรที่เข้าใจเทคโนโลยี ปัจจัยความสำเร็จคือ ผู้นำสนับสนุน เป้าหมายดิจิทัลชัดเจน และการพัฒนาทักษะ ดังนั้น back-office ของ มกช. ต้องทำให้งานของเจ้าหน้าที่ **เร็วกว่าเดิมตั้งแต่วันแรก** (bulk, keyboard, Excel) และต้องลงทุนเรื่องการฝึกอบรมแบบ train-the-trainer และ campus champions

### Cited Findings
- ✅ HRM ภาครัฐไทยใช้ดิจิทัลแค่ระดับธุรการ ปัจจัยความสำเร็จคือ digital leadership การพัฒนาทักษะ และ data governance ส่วนอุปสรรคหลักคือ โครงสร้างราชการ วัฒนธรรมลำดับชั้น และงบประมาณ — [ThaiJO JSSK](https://so17.tci-thaijo.org/index.php/JSSK/article/view/1713)
- ✅ ความสำเร็จของ digital transformation ในหน่วยงานรัฐไทย (งานวิจัยแบบสัมภาษณ์): การสนับสนุนจากผู้บริหาร เป้าหมายและกลยุทธ์ดิจิทัลที่ชัดเจน และการบริหารการเปลี่ยนแปลง — [STOU/ThaiJO](https://so04.tci-thaijo.org/index.php/stou-sms-pr/article/view/240133)
- ✅ การต่อต้านการเปลี่ยนแปลงและการขาดบุคลากรที่เข้าใจเทคโนโลยีเป็นอุปสรรคต่อ digital governance ของไทย (บทความแสดงความเห็น) — [Bangkok Post opinion](https://www.bangkokpost.com/opinion/opinion/2435952/the-challenge-of-digital-governance)
- ✅ ภาครัฐไทยยังติดวัฒนธรรมองค์กรที่แข็งตัวและข้อจำกัดด้านบุคลากร และควรปรับให้ปรับตัวได้ — [ThaiJO PNU](https://so05.tci-thaijo.org/index.php/pnuhuso/article/view/281094)
- ✅ ราชการอาเซียนเน้น agility และการพัฒนาทักษะดิจิทัลของข้าราชการ — [The ASEAN Magazine](https://theaseanmagazine.asean.org/article/digital-transformation-and-the-civil-service-agility-in-action/)
- ✅ งานศึกษา (Mahidol CM, 2025) เรื่องความพร้อมและการต่อต้านของผู้ใช้หลัง implement ระบบในไทย (ภาคเอกชน) — [Mahidol CM thematic paper](https://archive.cm.mahidol.ac.th/bitstream/123456789/5857/1/TP%20MM.001%202025.pdf)
- 🟡 เหตุผลที่เจ้าหน้าที่รัฐไทยมักต่อต้านระบบใหม่ (จากประสบการณ์ทั่วไป ไม่พบงานวิจัยที่ยืนยันเป็นรายข้อ): (1) ต้องทำ "คู่ขนาน" ทั้งกระดาษและระบบเพราะผู้ตรวจสอบ/สตง. ยังขอเอกสารลงนาม (2) กลัวรับผิดเมื่อระบบผิด (ความรับผิดทางละเมิด/วินัย) (3) ระบบช้ากว่า Excel ที่ทำอยู่ (4) ขาดคนช่วยเมื่อติดปัญหา (5) ระบบเก่าหลายตัวเคยถูกทิ้งหลังหมดสัญญาผู้รับจ้าง (6) ลูกจ้าง/พนักงานราชการสัญญาจ้างหมุนเวียนสูง **[ต้องตรวจสอบ]**
- 🟡 ระบบ Saraban/e-document ภาครัฐ (พ.ร.ฎ. การบริหารงานและการให้บริการภาครัฐผ่านระบบดิจิทัล พ.ศ. 2565) กำหนดให้หน่วยงานรับ-ส่งเอกสารดิจิทัลได้ ช่วยลดข้ออ้างเรื่อง "ต้องมีกระดาษ" — ดู `thai_gov_compliance.md` **[ต้องตรวจสอบ]**

### Inferences
**ความต้องการ power-user (ทะเบียน การเงิน กยศ. หอพัก):**
- **Work queue/inbox** ต่อบทบาทและวิทยาเขต ที่ filter/sort/assign ได้ แสดง SLA countdown และเลือกหลายรายการแล้วอนุมัติ/ส่งกลับพร้อมกันได้ (bulk action พร้อม preview และ undo ภายในเวลาที่กำหนด)
- **Keyboard-first:** shortcut สำหรับ next/approve/reject, ค้นหาแบบ command palette (รหัสนักศึกษา/ชื่อ/เลขบัตร), ตารางที่ปรับคอลัมน์ได้และจำ view ไว้
- **Excel ไป-กลับ:** export ทุกตาราง (xlsx ที่มีหัวคอลัมน์ไทยและวันที่ พ.ศ.) และ import แบบ template พร้อม validation รายแถว + dry-run + รายงานข้อผิดพลาดก่อน commit (ใช้กับ: ผลการเรียน, ค่าธรรมเนียมรายวิทยาเขต, รายชื่อนักกีฬา, รายชื่อผู้กู้) เพราะ Excel เป็นเครื่องมือหลักของเจ้าหน้าที่อยู่แล้ว การบังคับให้เลิกใช้จะสร้างการต่อต้าน
- **ลดงานคู่ขนาน:** ระบบออกเอกสารที่ลงนามอิเล็กทรอนิกส์และส่งเข้าระบบสารบรรณได้ เพื่อลดการพิมพ์ซ้ำ
- **Audit ที่ปกป้องเจ้าหน้าที่:** แสดงว่า "ใครอนุมัติตามกฎใด" ช่วยลดความกลัวรับผิด
- **Delegation/รักษาราชการแทน** ในหน้าเดียว (ดูเล่ม 04)

**ยุทธศาสตร์การฝึกอบรมที่น่าจะได้ผล (🟡 ข้อเสนอ ไม่มีหลักฐานไทยเฉพาะ):**
- **Train-the-trainer:** ส่วนกลางฝึก "key user" 2–3 คนต่องาน (ทะเบียน, การเงิน, กิจการนักศึกษา, หอ, กีฬา) ต่อวิทยาเขต รวม ~150–250 คน แล้วให้ key user ไปสอนต่อ
- **Campus champion network:** 1 champion ต่อวิทยาเขต/โรงเรียน มีเวลางานกันไว้ (เช่น 20%) และได้รับการยอมรับ (นับเป็นผลงาน/ภาระงาน)
- **Job aids:** คู่มือ 1 หน้าต่องาน (ภาษาไทย ภาพหน้าจอ), วิดีโอสั้น ≤ 2 นาที, in-app guided tour/tooltip และ sandbox ที่มีข้อมูลตัวอย่าง
- **LINE OpenChat/กลุ่มสนับสนุน** ต่อบทบาท (ทะเบียน 17 วิทยาเขต, การเงิน ฯลฯ) มี champion คอยตอบ และส่งต่อเรื่องที่ตอบไม่ได้เป็น ticket ใน Helpdesk เพื่อให้ปัญหาไม่หายไปในแชต ทั้งนี้ห้ามส่งข้อมูลส่วนบุคคลนักศึกษาในกลุ่มแชต
- **ฝึกตามจังหวะงานจริง:** อบรมทะเบียน 2–4 สัปดาห์ก่อนเปิดลงทะเบียน และอบรม กยศ. ก่อนรอบยืนยัน (ไม่อบรมครั้งเดียวต้นโครงการ)

### Gaps
- งานวิจัยเชิงประจักษ์เรื่องเหตุผลการต่อต้านระบบสารสนเทศของบุคลากรมหาวิทยาลัยรัฐไทยโดยเฉพาะ — ไม่พบใน search รอบนี้
- หลักฐานประสิทธิผลของ LINE support group ต่อ adoption — ไม่พบ
- ข้อมูลความสามารถดิจิทัลของบุคลากร มกช. รายวิทยาเขต (ต้องสำรวจ baseline เอง)

---

## 4. การเปลี่ยนแปลงองค์กรในสถาบันรัฐหลายวิทยาเขต (centralise, governance, ADKAR/Kotter, data roles, engagement, adoption metrics)

### Takeaway
หลักฐานจากการรวมระบบหลายวิทยาเขตในต่างประเทศ (ส่วนใหญ่เป็น vendor case study) ชี้ว่าต้องมี **business-process reengineering workshop ร่วมทุกวิทยาเขต**, ผู้อำนวยความสะดวกที่เป็นกลาง และการเคารพอัตลักษณ์ของแต่ละวิทยาเขต รูปแบบ governance ที่เหมาะกับ มกช. คือ **"มาตรฐานกลาง + configuration รายวิทยาเขต"** (สอดคล้องกับ blueprint ที่ให้ทุกอย่างเป็น configuration ราย OrgUnit) ส่วนงานที่ใช้ ADKAR กับข้าราชการไทยโดยตรง ค้นไม่พบ

### Cited Findings
- ✅ Southern University & A&M College System (5 วิทยาเขต) รวม Banner หลาย instance เป็น application เดียว มี common course catalogue ให้ย้ายข้ามวิทยาเขตได้ และจัด workshop สร้าง shared business process ร่วมกันทั้ง 5 วิทยาเขต (vendor case study) — [SIGCorp case](https://www.sigcorp.com/case-studies/consolidated-banner-erp-systems-into-a-single-shared-application/); [SIGCorp SU United](https://www.sigcorp.com/case-studies/uniting-campuses-empowering-students-su-systems-banner-united-revolution/); [PDF](https://www.sigcorp.com/wp-content/uploads/dlm_uploads/2020/07/Southern_University_Case_Study_1.pdf)
- ✅ Green Mountain Higher Education Consortium: shared services ต้องสมดุลระหว่างอัตลักษณ์/วัฒนธรรมของแต่ละสถาบันกับเป้าหมายร่วม จึงใช้ facilitator ภายนอกและให้ stakeholder ทุกแห่งร่วมสร้าง shared vision — [CampusWorks case study](https://www.campusworksinc.com/assets/uploads/Case_Study___Green_Mountain_Higher_Education_Consortium_FINAL.pdf)
- ✅ EDUCAUSE research bulletin (2005) ศึกษา drivers/issues/practices ของ ERP ในสถาบันหลายวิทยาเขต (CSU, Indiana, Purdue, Minnesota) — อ่านได้แค่ abstract — [EDUCAUSE Library](https://library.educause.edu/resources/2005/2/enterprisewide-system-implementations-at-multicampus-institutions)
- ✅ ERP Today: การรวมระบบหลังควบรวมมหาวิทยาลัยมักใช้เวลา 3–5 ปี และมักต้องให้สถาบันหนึ่งทิ้งกระบวนการเดิม (ตัวเลขต้นทุนแฝง "200%" ที่บทความอ้าง ตรวจสอบไม่ได้ ไม่ควรใช้) — [ERP Today](https://erp.today/when-universities-merge-legacy-erp-systems-dont-the-higher-education-consolidation-conundrum)
- ✅ มกช. มี 17 วิทยาเขตที่มีเว็บไซต์ งานทะเบียน งบประมาณ และการรับสมัครของตนเอง (มรดกจากวิทยาลัยพลศึกษาเดิม) — [tnsu_profile.md](../tnsu_profile.md) §1; ค่าธรรมเนียม ผู้ลงนาม กำหนดเวลา ต่างกันรายวิทยาเขต — `00-blueprint.md` §2 ข้อ 3
- ✅ อุปสรรคภาครัฐไทย: วัฒนธรรมลำดับชั้น โครงสร้างราชการ งบประมาณ; ปัจจัยสำเร็จ: digital leadership, data governance — [ThaiJO JSSK](https://so17.tci-thaijo.org/index.php/JSSK/article/view/1713)
- 🟡 ADKAR (Prosci: Awareness, Desire, Knowledge, Ability, Reinforcement) วัดความพร้อมรายบุคคล ส่วน Kotter 8 steps (urgency → guiding coalition → vision → communicate → empower → short-term wins → consolidate → anchor in culture) ใช้วางลำดับในระดับองค์กร — จากความรู้ทั่วไป ไม่พบงานที่ใช้ทั้งสองกับข้าราชการไทยใน search รอบนี้ **[ต้องตรวจสอบ]**
- 🟡 แนวทาง data governance ภาครัฐไทย (สพร./DGA Data Governance Framework) กำหนดบทบาท Data Governance Council, Data Owner, Data Steward (business/technical) — ดู `thai_gov_compliance.md` **[ต้องตรวจสอบ]**

### Inferences
**Governance model ที่เสนอ: "Federated — central standard, campus configuration"**

| ระดับ | สิ่งที่กำหนดที่ส่วนกลาง (ไม่ต่อรอง) | สิ่งที่วิทยาเขตตั้งค่าเอง |
|---|---|---|
| ข้อมูล | master data (รหัสนักศึกษา, หลักสูตร, รายวิชา, รหัสกีฬา), data dictionary, classification, PDPA | ไม่มี (วิทยาเขตเป็น data steward ของข้อมูลตนเท่านั้น) |
| กระบวนการ | workflow แม่แบบ (ลงทะเบียน, คำร้อง, จบ), SoD, audit | ผู้อนุมัติ ลำดับขั้น SLA ผู้ลงนาม ค่าธรรมเนียม ปฏิทินรอง รอบรับสมัคร |
| UX | design system, ภาษา, accessibility | โลโก้/ชื่อวิทยาเขต ข่าว/ประกาศ ข้อความแนะนำ |
| รายงาน | KPI นิยามเดียวกัน (ดู §6) | dashboard เพิ่มเติมของวิทยาเขต |

- **Design Authority** (ส่วนกลาง + ตัวแทนวิทยาเขตแบบหมุนเวียน 4–5 แห่ง + โรงเรียนกีฬา 1–2 แห่ง) อนุมัติ change request ที่กระทบมาตรฐานกลาง และกำหนดว่าคำขอใดเป็น "configuration" หรือ "customisation" (customisation ต้องอนุมัติ)
- **Data roles:** Data Owner = ผู้บริหารระดับรองอธิการบดีต่อโดเมน (ทะเบียน การเงิน กีฬา สุขภาพ); Data Steward = หัวหน้างานทะเบียน/การเงินรายวิทยาเขต (รับผิดชอบคุณภาพข้อมูลวิทยาเขต); Technical Steward = ทีม IT กลาง; DPO ตาม PDPA โดยเชื่อมกับรหัสบทบาท `records`, `dpo`, `registrar`, `finance` (blueprint §5) — เพื่อให้นำไปใช้จริง ควรมี **data quality scorecard รายวิทยาเขต** ที่ผู้บริหารเห็น ซึ่งทำให้บทบาท steward มีความหมาย
- **ความเสี่ยงเฉพาะ มกช.:** วิทยาเขตที่มีระบบของตนอยู่แล้ว (หรือผู้รับจ้างท้องถิ่น) อาจมองว่าเสีย autonomy วิธีลดความเสี่ยงคือให้วิทยาเขตต้นแบบเป็น pilot และร่วมออกแบบ (co-design) ให้วิทยาเขตเห็นว่า "ค่าตั้งค่าของเรา" ยังอยู่ และย้ายข้อมูลย้อนหลังให้ครบเพื่อไม่ต้องเปิดระบบเก่าคู่กัน

### Gaps
- กรณีศึกษาการรวมระบบทะเบียนของมหาวิทยาลัยไทยหลายวิทยาเขต (เช่น ม.ราชมงคล, มหาวิทยาลัยการกีฬาเอง, PSU 5 วิทยาเขต) — ไม่พบในรอบนี้
- งานวิจัย ADKAR/Kotter ในภาครัฐไทย — ไม่พบ
- รายงานประเมินหลังโครงการ (post-implementation review) อิสระของการรวมระบบหลายวิทยาเขต — มีแต่ vendor case

---

## 5. มุมมองผู้ใช้ด้านกีฬา (โค้ช, นักวิทยาศาสตร์การกีฬา, นักศึกษา-นักกีฬา, dual career)

### Takeaway
อุปสรรคใหญ่ที่สุดของ athlete monitoring คือ **buy-in ของนักกีฬา** และการที่นักกีฬา**ไม่ได้รับ feedback** จากข้อมูลที่กรอก (มีเพียงครึ่งหนึ่งที่รู้สึกว่าได้ feedback พอ) แบบสอบถามจึงต้องสั้น กรอกเร็ว และมีคนดำเนินการต่อจากข้อมูลจริง ส่วนนักศึกษา-นักกีฬาต้องการ **ความยืดหยุ่นทางวิชาการ (ตารางสอบ, ออนไลน์, แผนเรียนช้า) และ tutor/counselling** ซึ่งตรงกับ EU Guidelines on Dual Careers

### Cited Findings
- ✅ Saw et al. (JSSM 2015; สัมภาษณ์ 30 คน นักกีฬา/โค้ช/staff ในสถาบันกีฬาระดับชาติ): ปัจจัยที่กระทบการใช้ athlete self-report measure แบ่งเป็น (1) ตัว measure (เข้าถึงง่าย เวลาที่ต้องกรอก) และ (2) สภาพแวดล้อมทางสังคม (buy-in, การตอกย้ำ/reinforcement) โดย measure ที่ดีต้อง "ได้ข้อมูลคุณภาพด้วยภาระต่อนักกีฬาและ staff น้อยที่สุด" — [JSSM 14-137](https://www.jssm.org/jssm-14-137.xml-abst); [PMC4306765](https://pmc.ncbi.nlm.nih.gov/articles/PMC4306765)
- ✅ Stellenbosch University (นักกีฬา high-performance 156 คน): **50%** เห็นว่าได้ feedback จากข้อมูลที่กรอกเพียงพอ, **46%** เห็นว่า S&C ดำเนินการต่อเมื่อคะแนนเปลี่ยนอย่างมีนัยสำคัญ แต่ **97%** ตอบตามจริง — [LIDA record](https://lida.sport-iat.de/ta/Record/4074336?lng=en)
- ✅ ผู้ปฏิบัติงานมองว่า athlete buy-in เป็นอุปสรรคหลักของโปรแกรม monitoring และเครื่องมือที่นิยมคือแบบที่ใช้ง่าย ไม่รุกล้ำ และราคาถูก — [SCU thesis](https://researchportal.scu.edu.au/esploro/outputs/doctoral/Training-load-monitoring-to-manage-overtraining/991013035385602368)
- ✅ มุมมองนักกีฬามักถูกมองข้าม ถ้านักกีฬาไม่เข้าใจจุดประสงค์หรือไม่เห็นคุณค่า ก็อาจเลิกมีส่วนร่วม — [BCU "What do athletes really think"](https://www.open-access.bcu.ac.uk/16197/1/What_do_Athlete_s_Really_Think.pdf)
- ✅ งาน 2025 (เบลเยียม) สัมภาษณ์ 25 stakeholder (นักกีฬา 6, โค้ช 14, ผู้จัดการ 5) เรื่องประโยชน์และความท้าทายของเทคโนโลยี monitoring — อ่านเนื้อหาเต็มไม่ได้ — [SAGE](https://journals.sagepub.com/doi/10.1177/17479541241312015)
- ✅ Scoping review มุมมองนักศึกษา-นักกีฬาต่อ dual career: อุปสรรคที่พบซ้ำคือ **ขาดหลักสูตรที่ยืดหยุ่น**, ความช่วยเหลือทางการเงินไม่พอ และเข้าถึงสถานที่ฝึกใกล้ที่เรียนได้ยาก — [PMC12170630](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12170630/)
- ✅ สำรวจนักศึกษา-นักกีฬายุโรป 221 คน: ต้องการ**ความยืดหยุ่นและการเรียนออนไลน์**ในระดับวิชาการ และการสนับสนุนด้านกีฬา — [Frontiers 2025](https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2025.1507951/pdf); [IRIS uniroma4](https://iris.uniroma4.it/handle/20.500.14244/5763)
- ✅ EU Guidelines on Dual Careers แนะนำให้มหาวิทยาลัยมีหลักสูตรและ**ตารางสอบที่ยืดหยุ่น**, blended/distance learning, tutorship/counselling และรับรองหน่วยกิตจากทักษะด้านกีฬา แต่การนำไปใช้ในยุโรปยังไม่สม่ำเสมอและไม่มีมาตรฐานขั้นต่ำ — [PMC12170630](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12170630/); [PMC9710783](https://pmc.ncbi.nlm.nih.gov/articles/PMC9710783/)
- ✅ ตัวอย่างนโยบายสถาบัน: SETU (ไอร์แลนด์) Student-Athlete Support Policy v2.0 (16 มิ.ย. 2026) กำหนด "academic flexibility" และให้นักกีฬาต่อรอง**จังหวะการเรียน (pacing)** ตามภารกิจกีฬาได้ — [SETU policy v2.0](https://www.setu.ie/Craft/assets/policies/Student-Athlete-Support-Policy-V2.0-16-June-2026.pdf)
- ✅ (บริบท มกช.) กีฬาพลศึกษาเกมส์ราว ก.ย. ชนกับช่วงสอบ ต้องมี blackout และการลา/สอบชดเชยแบบยกคณะ — `00-blueprint.md` §2 ข้อ 4
- 🟡 ข้อกังวลของโค้ชที่พบบ่อยในวงการ: ต้องกรอกข้อมูลซ้ำ (ระบบ AMS + Excel + LINE กลุ่มทีม), เครื่องมือไม่เข้ากับ wearable ที่ใช้อยู่, กลัวถูกประเมินจากข้อมูล และนักกีฬากังวลว่าข้อมูลสุขภาพ/จิตใจจะถูกใช้คัดตัวออก **[ต้องตรวจสอบ]** (ไม่พบงานสำรวจโค้ชไทยโดยเฉพาะ)

### Inferences
- **Wellness questionnaire ต้องจบใน ≤ 60 วินาที** (5–7 ข้อ, slider/emoji, ใช้ออฟไลน์ได้, เตือนครั้งเดียวตามเวลาที่ทีมตั้ง) และหลังกรอกต้องแสดง **feedback ทันที** (กราฟแนวโน้ม 7/28 วันของตัวเอง) เพื่อแก้ปัญหา "กรอกแล้วไม่ได้อะไร"
- **ปิดวงจรการดำเนินการ:** เมื่อค่าตกเกณฑ์ ระบบสร้าง flag ให้โค้ช/S&C พร้อมช่อง "ดำเนินการแล้ว" แล้ววัด % flag ที่มีการตอบสนองเป็น KPI ของทีม ไม่ใช่วัดแค่อัตราการกรอก
- **ไม่ให้กรอกซ้ำ:** import จาก wearable/อุปกรณ์ทดสอบ (CSV/API), ส่วน attendance การฝึกและ `CompetitionLeave` ใช้ข้อมูลชุดเดียวกันส่งไปยกเว้นขาดเรียน/ขอสอบชดเชยอัตโนมัติ (ATH → REG/EXM)
- **ความไว้วางใจ/ความเป็นส่วนตัว:** แยกชั้นข้อมูล (performance ที่โค้ชเห็น / สุขภาพที่แพทย์-นักกายภาพเห็น / จิตวิทยาที่นักจิตวิทยาเห็นเท่านั้น) นักกีฬาเห็นว่าใครดูข้อมูลตน (access log ที่ผู้ใช้เห็นเอง) และผู้เยาว์ต้องได้รับความยินยอมจากผู้ปกครอง
- **สิ่งที่นักศึกษา-นักกีฬาต้องการเห็นในแอป:** ปฏิทินรวม (เรียน + สอบ + ฝึก + แข่ง) ที่บอก conflict ล่วงหน้า, ยื่นลาแข่งครั้งเดียวแล้วแจ้งอาจารย์ทุกวิชาอัตโนมัติ, สถานะสิทธิ์ลงแข่ง (eligibility), แผนเรียนแบบภาคเบาในปีแข่ง และนัด tutor/academic support
- **โค้ชโรงเรียนกีฬา** ดูแลผู้เยาว์ ฟีเจอร์ต้องเชื่อมกับ safeguarding (ดู benchmark #4) เช่น ไม่ให้โค้ชส่งข้อความส่วนตัวถึงนักเรียนนอกช่องทางที่มีบันทึก

### Gaps
- งานสำรวจโค้ช/นักวิทยาศาสตร์การกีฬาไทย (กกท., มกช.) เรื่องการใช้ AMS — ไม่พบ
- ข้อมูลว่าโค้ช มกช. ใช้เครื่องมืออะไรอยู่ (Excel, LINE, แอปเฉพาะชนิดกีฬา) — ต้อง discovery interview
- นโยบาย dual career ของไทย (กกท./กรมพลศึกษา) — ไม่ได้ค้นรอบนี้

---

## 6. มุมมองผู้บริหาร (dashboard / KPI / decision support)

### Takeaway
ผู้บริหาร มกช. ต้องการ KPI ที่ **นิยามเหมือนกันทุกวิทยาเขต** และ**เปรียบเทียบข้ามวิทยาเขตได้** ครอบคลุม 3 ส่วน คือ วิชาการ (รับเข้า, คงอยู่, จบ, มีงานทำ), การเงิน/ทรัพยากร (FTES, ต้นทุนต่อหัว) และพันธกิจเฉพาะ (ผลงานกีฬา, ITA) ส่วนตัวชี้วัดทางการของ มกช. ค้นไม่พบในรอบนี้ catalogue ด้านล่างจึงเป็นข้อเสนอ ต้องเทียบกับแผนยุทธศาสตร์ มกช. และตัวชี้วัด สป.อว./สงป. ก่อนใช้

### Cited Findings
- ✅ ITA: OIT เปิด 2 มี.ค.–30 มิ.ย. — `00-blueprint.md` §2 ข้อ 6; ตัวอย่างผลคะแนน ITA มหาวิทยาลัยรัฐ เช่น ราชภัฏพระนครศรีอยุธยา 91.90 คะแนน (ปีงบ 2566, ระดับ "ผ่าน") — [ARU ITA 2567](https://www.aru.ac.th/ita2567/itadata2567/data2567/034-01-elevation-plan.pdf)
- ✅ ผู้บริหารส่วนกลางของระบบหลายวิทยาเขตมักขาด visibility แบบ real-time ของ enrolment/budget/outcomes ในแต่ละวิทยาเขต (แหล่ง vendor) — [Academia ERP blog](https://www.academiaerp.com/blog/how-global-erp-solutions-simplify-multi-campus-institution-management/)
- ✅ การค้นตัวชี้วัดแผนยุทธศาสตร์/ภาวะการมีงานทำ/ITA ของ มกช. โดยตรง: **ไม่พบ** (พบแต่ของมหาวิทยาลัยอื่น) — [ตัวอย่าง TSU](https://umdc.tsu.ac.th/upload/files/1743309801_bbd0415ba68fe403e15d.pdf)
- 🟡 ตัวชี้วัดที่ใช้ทั่วไปในอุดมศึกษาไทย: ภาวะการมีงานทำของบัณฑิตภายใน 1 ปี (ระบบสำรวจของ สป.อว.), FTES (นักศึกษาเต็มเวลาเทียบเท่า) สำหรับคำนวณภาระงานและงบประมาณ, ร้อยละสำเร็จการศึกษาตามเวลา, ความพึงพอใจผู้ใช้บัณฑิต, คะแนน ITA, ผลประกันคุณภาพ (AUN-QA/EdPEx), รายได้จากบริการวิชาการ **[ต้องตรวจสอบ]**

### Inferences
**Executive KPI catalogue (ข้อเสนอ; ทุกตัวมี drill-down วิทยาเขต → คณะ → หลักสูตร และกรองนักกีฬา/ไม่ใช่นักกีฬาได้)**

| กลุ่ม | KPI | นิยามเบื้องต้น | ความถี่ | แหล่ง/โมดูล | ผู้ใช้หลัก |
|---|---|---|---|---|---|
| รับเข้า | ผู้สมัคร / ผ่านคัด / รายงานตัว / yield ต่อรอบ | รายงานตัวจริง ÷ ผ่านคัด ต่อรอบ/ประเภท (โควตา/ทั่วไป) | รายวันช่วงรับสมัคร | ADM | `rector`, `campusvp` |
| รับเข้า | อัตราเติมเต็มแผนรับ | รายงานตัว ÷ แผนรับ | ต่อรอบ | ADM, ORG | `planner` |
| คงอยู่ | first-year retention | ยังมีสถานภาพเมื่อเปิดปี 2 ÷ cohort | รายปี | REG | `dean` |
| คงอยู่ | นักศึกษาเสี่ยง (early alert) และ % ที่ได้รับการดูแล | flag เปิด/ปิด, เวลาตอบสนอง | รายสัปดาห์ | ANA/AFF | `advisor`, `dean` |
| จบ | graduation rate ตามเวลา (4 ปี) และ 6 ปี | จบภายใน n ปี ÷ cohort แยกนักกีฬา | รายปี | GRD | `rector`, `council` |
| จบ | ภาวะการมีงานทำ/ศึกษาต่อ ภายใน 1 ปี (รวมเป็นครู/โค้ช/งานกีฬา) | ตามแบบสำรวจ สป.อว. **[ต้องตรวจสอบ]** | รายปี | GRD/ALU | `council` |
| การเงิน | FTES และ FTES ต่ออาจารย์ | สูตร สป.อว. **[ต้องตรวจสอบ]** | รายภาค | REG + HR | `planner` |
| การเงิน | ค่าใช้จ่ายต่อหัว FTES, รายได้ค่าธรรมเนียม, ค้างชำระ | — | รายเดือน | FIN | `finance`, `rector` |
| การเงิน | กยศ.: ผู้กู้ / ยืนยันทันกำหนด 31 ต.ค. / 28 ก.พ. | — | รายวันช่วง deadline | LOAN | `loan` |
| กีฬา | เหรียญ/ผลงานระดับชาติ-นานาชาติ, นักกีฬาทีมชาติ, นักกีฬาที่สถานภาพวิชาการเสี่ยง | — | รายรายการแข่ง | ATH | `sportshead` |
| กีฬา | academic eligibility ก่อนแข่ง (% ผ่าน) | — | ก่อนแต่ละรายการ | ATH+REG | `sportshead`, `coach` |
| โรงเรียนกีฬา | อัตราคงอยู่, ผลสัมฤทธิ์, เหตุการณ์ safeguarding (จำนวนเท่านั้น), การเลื่อนเข้า มกช. | — | รายภาค | SSC | `rector` |
| ธรรมาภิบาล | ITA/OIT ความพร้อมข้อมูล, เรื่องร้องเรียนและ SLA | — | รายเดือน (มี.ค.–มิ.ย. รายสัปดาห์) | ENG/complaint | `auditor` |
| บริการ | SLA คำร้อง, ความพึงพอใจบริการ, adoption (§7) | — | รายเดือน | Workflow | `campusvp` |
| ข้อมูล | data quality score รายวิทยาเขต | ครบถ้วน/ถูกต้อง/ทันเวลา | รายเดือน | Data platform | `records` |

- **ความต้องการ decision support:** what-if แผนรับ (ถ้าเปิดรอบ 6 จะได้เท่าไร), forecast รายได้ค่าธรรมเนียม, เปรียบเทียบวิทยาเขต (benchmark ภายใน) ที่ระวังไม่ให้กลายเป็น "ตารางประจาน" และควรใส่บริบท (ขนาด วิทยาเขต ชนบท) และ export เป็นรายงานที่ใช้ในการประชุมสภาได้ทันที (PDF/PowerPoint ภาษาไทย ปี พ.ศ.)
- **UX ผู้บริหาร:** หน้าแรกบนมือถือ 5–7 KPI tile + แนวโน้ม + สีสถานะ ส่วนรายละเอียดเปิดบนแท็บเล็ต/คอมพิวเตอร์ และส่งสรุปรายสัปดาห์ทาง LINE OA (ตัวเลขรวม ไม่มีข้อมูลรายบุคคล)

### Gaps
- ตัวชี้วัดแผนยุทธศาสตร์ มกช. และคะแนน ITA ของ มกช. — ค้นไม่พบ ต้องขอจากกองแผน
- สูตร FTES และนิยามภาวะการมีงานทำของ สป.อว. ฉบับปัจจุบัน — ไม่ได้ตรวจรอบนี้

---

## 7. สังเคราะห์: personas, ความเสี่ยงการยอมรับ, แผนบริหารการเปลี่ยนแปลง, ผลต่อการออกแบบรายโมดูล

### Takeaway
ระบบนี้จะสำเร็จหรือล้มเหลวจาก 3 เรื่อง: (1) วันลงทะเบียนวันแรกที่ระบบต้องไม่ล่ม (2) เจ้าหน้าที่ทะเบียน/การเงิน 17 วิทยาเขตต้องรู้สึกว่าระบบเร็วกว่า Excel และ (3) โค้ชและนักกีฬาต้องได้ประโยชน์จากข้อมูลที่กรอก แผนการเปลี่ยนแปลงจึงควรใช้ Kotter วางลำดับระดับองค์กร และ ADKAR วัดความพร้อมรายกลุ่ม ทั้งนี้ต้องทำ pilot ก่อนแล้วจึงขยาย (wave rollout)

### Cited Findings
- ✅ หลักฐานที่ใช้ในส่วนนี้มาจาก §1–§6 ข้างต้น: LINE 56M — [Relevant Audience](https://www.relevantaudience.com/digital-marketing-en/line-thailand-business-solutions-2026/); buy-in/feedback ของนักกีฬา — [LIDA Stellenbosch](https://lida.sport-iat.de/ta/Record/4074336?lng=en); อุปสรรคภาครัฐไทย — [ThaiJO JSSK](https://so17.tci-thaijo.org/index.php/JSSK/article/view/1713); shared process workshop หลายวิทยาเขต — [SIGCorp](https://www.sigcorp.com/case-studies/consolidated-banner-erp-systems-into-a-single-shared-application/); ระบบลงทะเบียนล่ม — [Daily Free Press](https://dailyfreepress.com/04/17/23/204029/bu-rising-seniors-voice-concerns-about-mybu-after-registration-system-crashes/)

### Inferences

#### 7.1 Persona insights table

| Persona (รหัสบทบาท) | บริบท/ทักษะดิจิทัล | เป้าหมายหลัก | Pain points ที่คาด | ช่องทางหลัก | ข้อกำหนดการออกแบบ |
|---|---|---|---|---|---|
| นักศึกษา ป.ตรี ทั่วไป/ครูพลศึกษา (`student`) | Gen Z, มือถือเป็นหลัก, LINE ทุกคน ✅ | ลงทะเบียนได้ จบตามแผน ฝึกสอนราบรื่น | ระบบล่มวันลงทะเบียน, ไม่รู้สถานะคำร้อง, ต้องเดินไปเคาน์เตอร์ | แอป/PWA + LINE OA | P3–P7, P13 |
| นักศึกษา-นักกีฬา (`student` + athlete flag) | ตารางแน่น เดินทางบ่อย สัญญาณไม่ดีตอนแข่ง | เรียนจบควบคู่กับการแข่ง | ตารางชน, ลาแข่งต้องขอทุกวิชา, สอบชดเชย ✅ | แอป (offline) | ปฏิทินรวม, ลาครั้งเดียว, eligibility, offline |
| นักเรียนโรงเรียนกีฬา ม.1–6 (`student` sschool) | ผู้เยาว์ อยู่หอ อาจจำกัดการใช้มือถือ | ตาราง/การบ้าน/ผลการเรียน | ข้อจำกัดอุปกรณ์ | แอปแบบจำกัดฟีเจอร์/เว็บในห้องคอมพิวเตอร์ | UI แบบง่าย ปลอดภัย ไม่มีแชตส่วนตัวกับผู้ใหญ่ |
| ผู้ปกครอง (`guardian`) | อายุหลากหลาย ชนบท ใช้ LINE ได้แต่ไม่ติดตั้งแอปใหม่ 🟡 | รู้ว่าลูกปลอดภัย, ค่าใช้จ่าย, ผลการเรียน | ข้อมูลกระจาย, ภาษาราชการเข้าใจยาก | LINE OA + SMS + โทร | ไม่บังคับแอป, ภาษาง่าย, ตัวอักษรใหญ่ |
| ผู้สมัคร (`candidate`) | ม.6 ทั่วประเทศ ใช้มือถือ | สมัคร/สอบ/ประกาศผล | หลายรอบหลายวิทยาเขตสับสน ✅ blueprint | เว็บมือถือ + LINE | สมัครครั้งเดียวเลือกหลายวิทยาเขต, ตัวติดตามสถานะ |
| อาจารย์/ที่ปรึกษา (`lecturer`, `advisor`) | ทักษะหลากหลาย ภาระงานสูง | ส่งเกรด อนุมัติคำร้อง ดูแลนักศึกษาเสี่ยง | ต้องเข้าหลายระบบ | เว็บ + แจ้งเตือน digest | อนุมัติบนมือถือได้ 1 แตะ, digest รายวัน |
| เจ้าหน้าที่ทะเบียน/การเงิน/กยศ./หอ (`registrar`, `finance`, `loan`, `dorm`) | Excel เก่ง ต้านระบบใหม่ถ้าช้ากว่า 🟡 | ทำงานพีคให้ทัน ไม่ผิดพลาด | งานคู่ขนานกระดาษ, ไม่มีคนช่วย | เว็บเดสก์ท็อป | queue, bulk, keyboard, Excel import/export, audit |
| โค้ช (`coach`) | ภาคสนาม ใช้มือถือ/LINE กลุ่มทีม | นักกีฬาพร้อมแข่ง | กรอกซ้ำ, ข้อมูลไม่ได้ใช้ ✅ | แอปมือถือ (offline) | กรอกครั้งเดียว, flag ที่ต้องตอบ, roster |
| นักวิทยาศาสตร์การกีฬา/แพทย์ (`sci`, `medical`) | ใช้ wearable/ไฟล์ทดสอบ | ข้อมูลครบถูกต้อง | import ยาก, privacy | เว็บ | import CSV/API, health vault, consent |
| ผู้บริหาร (`rector`, `campusvp`, `dean`, `council`) | ใช้มือถือ/แท็บเล็ต เวลาน้อย | ตัดสินใจจากข้อมูลเดียวกัน | ตัวเลขแต่ละวิทยาเขตไม่ตรงกัน | dashboard + LINE digest | KPI นิยามเดียว, drill-down, export รายงานสภา |
| IT วิทยาเขต | คนน้อย ทักษะต่างกัน | ระบบเสถียร, ลด ticket | ถูกโยนปัญหา | console + Helpdesk | runbook, status page, self-service reset |

#### 7.2 ความเสี่ยงการยอมรับของเจ้าหน้าที่ และมาตรการ

| # | ความเสี่ยง | สัญญาณเตือน | มาตรการ |
|---|---|---|---|
| R1 | ทำงานคู่ขนาน (กระดาษ + ระบบ) ไม่ยอมเลิก | ยังมีแบบฟอร์มกระดาษหลังเปิดระบบ 3 เดือน | ประกาศวันเลิกกระดาษ (sunset date) โดยผู้บริหาร, เอกสารอิเล็กทรอนิกส์ที่ลงนามได้, ยืนยันกับผู้ตรวจสอบภายในล่วงหน้า |
| R2 | ระบบช้ากว่า Excel | เวลาทำรายการ/คนสูงกว่า baseline | ทำ time-on-task baseline ก่อน go-live, bulk + import, ออกแบบร่วมกับ key user |
| R3 | กลัวรับผิด | ส่งเรื่องขึ้นไปตัดสินใจหมด | กฎ (DMN) ที่ผู้บริหารอนุมัติ, audit แสดงเหตุผล, หนังสือมอบอำนาจในระบบ |
| R4 | วิทยาเขตรู้สึกเสีย autonomy | ขอ customisation จำนวนมาก, ไม่ร่วมประชุม | Design Authority ที่มีตัวแทนวิทยาเขต, configuration ราย OrgUnit, pilot campus เป็นผู้นำเสนอ |
| R5 | ผู้รับผิดชอบลาออก/หมุนเวียน | key user ลาออก | อย่างน้อย 2 key user/งาน/วิทยาเขต, e-learning onboarding สำหรับคนใหม่ |
| R6 | ไม่มีคนช่วยตอนติดปัญหา | ticket ค้าง, ข้อความใน LINE กลุ่มไม่มีคนตอบ | hypercare 6–8 สัปดาห์หลังเปิด, champion + Helpdesk SLA, LINE กลุ่มที่เชื่อมกับ ticket |
| R7 | ข้อมูลย้ายมาไม่ครบ ต้องเปิดระบบเก่า | ยังมี login เข้าระบบเก่า | data migration rehearsal 2 รอบ, ตรวจรับข้อมูลโดย data steward |
| R8 | โค้ชไม่ใช้ ATH | อัตรากรอก wellness < 60% หลัง 4 สัปดาห์ 🟡 | ลดข้อคำถาม, feedback ให้นักกีฬา, ผูกกับรายชื่อส่งแข่ง/สิทธิ์เบี้ยเลี้ยง |
| R9 | ล่มในวันพีค | error rate/latency | load test ที่ 3–5× พีคจริง, waiting room, staggered window, war room วันลงทะเบียน |
| R10 | อาจารย์ไม่อนุมัติคำร้องตามเวลา | SLA breach | digest + อนุมัติบนมือถือ + escalation อัตโนมัติไปหัวหน้าภาค |

#### 7.3 โครงร่างแผนบริหารการเปลี่ยนแปลง (Kotter ระดับองค์กร × ADKAR ระดับบุคคล) 🟡

| เฟส | ช่วง (สัมพัทธ์) | กิจกรรมหลัก | Kotter | ADKAR | ผลลัพธ์ |
|---|---|---|---|---|---|
| 0. Mobilise | M-6 ถึง M0 | ตั้ง Steering (อธิการบดี/รองฯ), Design Authority, change lead, สำรวจ baseline (ทักษะดิจิทัล, เวลาทำงาน, ความพึงพอใจ) ทุกวิทยาเขต, stakeholder map | 1–2 | — | กรณีความจำเป็น ("ทำไมต้องเปลี่ยน") ตัวเลขจริงของ มกช. |
| 1. Co-design | M0–M4 | process workshop ร่วม 17 วิทยาเขต + โรงเรียนกีฬา, เลือก key user/champion, usability test กับนักศึกษา/ผู้ปกครอง/โค้ช | 3–4 | Awareness, Desire | process มาตรฐาน + configuration list, champion network |
| 2. Pilot | M4–M10 | 1–2 วิทยาเขต + 1 โรงเรียนกีฬา, train-the-trainer, sandbox, วัด adoption, เก็บ quick wins (เช่น คำร้องออนไลน์ บัตรนักศึกษาดิจิทัล) | 5–6 | Knowledge, Ability | หลักฐาน "เร็วขึ้นจริง", เรื่องเล่าความสำเร็จ |
| 3. Wave rollout | M10–M24 | 3–4 wave ตามภูมิภาค ไม่ go-live ช่วงลงทะเบียน/รับปริญญา/OIT, hypercare ต่อ wave, ประกาศ sunset ระบบเก่า | 7 | Ability | ทุกวิทยาเขตใช้ระบบเดียว |
| 4. Sustain | M24+ | ผูก KPI การใช้งานกับคำรับรองการปฏิบัติราชการ/ITA, ยกย่อง champion, feedback loop รายภาค, ปรับ process ต่อเนื่อง | 8 | Reinforcement | เลิกกระดาษ/ระบบเก่า, data quality ดีขึ้น |

**Stakeholder engagement (ย่อ):** สภามหาวิทยาลัย/อธิการบดี (sponsor; รายงานรายไตรมาส) · รองอธิการบดีวิทยาเขต (ผู้นำการเปลี่ยนแปลงในพื้นที่; ประชุมรายเดือน) · คณบดี/หัวหน้างาน (data owner/steward; workshop) · เจ้าหน้าที่ทะเบียน การเงิน กยศ. หอ (key user; co-design + อบรม) · อาจารย์ (ผู้ใช้ไม่บ่อย; digest + คู่มือสั้น) · โค้ช/นักวิทยาศาสตร์การกีฬา (co-design ATH) · นักศึกษา/สโมสรนักศึกษา (usability panel, ทูตดิจิทัล) · ผู้ปกครองโรงเรียนกีฬา (ประชุมผู้ปกครอง + LINE OA) · IT วิทยาเขต (technical champion) · หน่วยภายนอก (สป.อว., กยศ., กรมบัญชีกลาง, สตง./ผู้ตรวจสอบภายใน: แจ้งล่วงหน้าเรื่องเอกสารอิเล็กทรอนิกส์)

**Communications plan (ย่อ):**

| ผู้รับ | สาร | ช่องทาง | ความถี่ | ผู้ส่ง |
|---|---|---|---|---|
| บุคลากรทั้งหมด | ทำไมต้องเปลี่ยน + timeline + "อะไรเปลี่ยนสำหรับคุณ" | หนังสือเวียน + วิดีโออธิการบดี + LINE OA บุคลากร | เปิดโครงการ + ทุก milestone | อธิการบดี |
| key user/champion | รายละเอียดงาน, release note, ปัญหาที่พบบ่อย | LINE OpenChat + ประชุมออนไลน์ | รายสัปดาห์ช่วง pilot/rollout | change lead |
| นักศึกษา | วันเปิด/วิธีใช้/ช่วยเหลือที่ไหน | แอป, LINE OA, IG/TikTok สโมสร, ปฐมนิเทศ | ก่อนเปิดลงทะเบียน 2 สัปดาห์ + วันจริง | งานทะเบียน |
| ผู้ปกครอง | วิธีผูก LINE, ข้อมูลที่จะได้รับ, ความเป็นส่วนตัว | ประชุมผู้ปกครอง, จดหมาย, LINE OA | ต้นปีการศึกษา | ผอ.โรงเรียนกีฬา |
| ผู้บริหาร | adoption dashboard, ความเสี่ยง | รายงาน steering | รายเดือน | PMO |
| ทุกคน (วันพีค) | สถานะระบบ, คิว | status page + LINE OA | real-time | war room |

**การฝึกอบรม:** ตามบทบาท (role-based curriculum) → ฝึก key user ก่อน go-live 6–8 สัปดาห์ → key user สอนต่อในวิทยาเขต 2–4 สัปดาห์ก่อน → job aid 1 หน้า + วิดีโอสั้น + in-app tour → sandbox ถาวร → อบรมทบทวนก่อนช่วงพีคทุกภาค → e-learning สำหรับพนักงานใหม่ (รับรองผลเป็นชั่วโมงพัฒนาบุคลากร)

**ตัวชี้วัด adoption (🟡 ค่าเป้าหมายเป็นข้อเสนอ ต้องตั้งจาก baseline):**
- การใช้งาน: % นักศึกษาที่ลงทะเบียนผ่านระบบด้วยตัวเอง (เป้า ≥ 95%), % คำร้องที่ยื่นออนไลน์ (≥ 90% ใน 2 ภาค), % ผู้ปกครองโรงเรียนกีฬาที่ผูก LINE (≥ 80%), wellness completion (≥ 70%) และ % flag ที่โค้ชตอบสนอง
- ประสิทธิภาพ: เวลาเฉลี่ยต่อคำร้อง (ลดลง ≥ 50%), % คำร้องที่ทัน SLA, time-on-task ของเจ้าหน้าที่เทียบ baseline
- คุณภาพ/ความพึงพอใจ: SUS ≥ 70 ต่อบทบาท, CSAT หลังทำธุรกรรม, ticket ต่อ 1,000 ผู้ใช้ และหัวข้อที่พบบ่อย
- การเลิกระบบเก่า: จำนวน login ระบบเก่า/ฟอร์มกระดาษ → 0 ภายในวัน sunset
- ADKAR pulse survey ต่อกลุ่ม (คะแนน 1–5 ต่อองค์ประกอบ) ก่อน pilot, ก่อน go-live และ 3 เดือนหลัง go-live
- ความเสถียรวันพีค: p95 latency, error rate และเวลารอคิวใน waiting room

#### 7.4 ผลต่อการออกแบบรายโมดูล (รหัสตาม blueprint §4)

| โมดูล | ผลต่อการออกแบบจาก UX/change research |
|---|---|
| ORG (calendar) | blackout ช่วงพีค/กีฬา ใช้ร่วมกับแผน go-live (ห้าม deploy ใหญ่ในช่วงพีค), configuration ราย OrgUnit ที่วิทยาเขตแก้เองได้ |
| ENG (ประกาศ) | notification hub กลาง: ระดับความสำคัญ, quiet hours, digest, send-once ข้ามช่องทาง, LINE OA Messaging API (ไม่ใช้ LINE Notify), budget ข้อความต่อวิทยาเขต |
| ADM | สมัครครั้งเดียวหลายวิทยาเขต/หลายรอบ, status tracker, waiting room ช่วงประกาศผล |
| REG | cart + validate-before-commit, waitlist + swap, staggered windows, load-tested, ลาแข่งครั้งเดียวแล้วยกเว้นขาดเรียนอัตโนมัติ |
| EXM | สอบชดเชยแบบยกคณะนักกีฬา, แจ้ง conflict กับปฏิทินกีฬา |
| GRD | degree audit แบบ progress, what-if, academic plan ภาคเบาสำหรับนักกีฬา |
| REC (คำร้อง/เอกสาร) | timeline คำร้องแบบติดตามพัสดุ, queue/bulk สำหรับเจ้าหน้าที่, e-signature ลดกระดาษ |
| FIN / LOAN | Excel import/export ที่ validate รายแถว, dashboard deadline กยศ., ข้อความค้างชำระที่ไม่ตำหนิผู้รับ |
| AFF / HOU (หอ) | เช็คชื่อหอแบบ offline, แจ้งผู้ปกครองผ่าน LINE, ช่องทาง safeguarding |
| ATH | wellness ≤ 60 วินาที + feedback ทันที, import wearable, flag-action loop, ชั้นสิทธิ์ข้อมูล performance/health/psych, access log ที่นักกีฬาเห็น |
| SSC (โรงเรียนกีฬา) | UI แบบจำกัดสำหรับผู้เยาว์, ผู้ปกครองผ่าน LINE, consent ผู้ปกครอง |
| ANA (analytics) | KPI catalogue นิยามเดียว, drill-down, adoption dashboard, data quality scorecard |
| ทุกโมดูล (design system) | WCAG 2.2 AA/TWCAG, Thai typography tokens (font, line-height ≥ 1.6), พ.ศ./ค.ศ. formatter กลาง, i18n th/en, PWA offline shell, telemetry เพื่อวัด adoption |

### Gaps
- ค่าเป้าหมาย adoption ทั้งหมดเป็นข้อเสนอ ต้องตั้งจาก baseline survey ของ มกช. จริง
- ไม่มีข้อมูลการใช้ระบบเดิมของแต่ละวิทยาเขต (ผู้ขาย/ระบบที่ใช้, ความพึงพอใจ) — ต้อง discovery
- ต้องเปิดการเข้าถึง `www.w3.org` เพื่อตรวจ WCAG 2.2 และ Thai Layout Requirements ฉบับเต็ม
