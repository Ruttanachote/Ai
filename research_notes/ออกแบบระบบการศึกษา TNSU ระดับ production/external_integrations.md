# ระบบภายนอกและแพลตฟอร์มข้อมูลระดับชาติที่ระบบสารสนเทศ มหาวิทยาลัยการกีฬาแห่งชาติ (มกช./TNSU) ต้องเชื่อมต่อ (Integration Catalogue)

> หมายเหตุวิธีการ (ณ 2026-10-28): ใช้การค้นเว็บ 13 ครั้ง และ fetch 4 ครั้ง **โดเมน .th หลายแห่งถูกบล็อกจากเครือข่ายของ session นี้ (DNS ENOTFOUND)**: `www.admission.kmutnb.ac.th`, `assets.mytcas.com`, `www.dga.or.th` ดังนั้นข้อมูลส่วนใหญ่ได้จากสรุปผลการค้น (search snippet) ไม่ใช่การอ่านเอกสารฉบับเต็ม ส่วนที่มาจากความรู้เดิมของผู้วิจัยและยังไม่ยืนยันจากแหล่งในรอบนี้ จะระบุว่า **[ยังไม่ยืนยัน]** และอยู่ในหัวข้อ Inferences/Gaps เท่านั้น
> โดเมนที่ควรขอให้อนุญาต (allowlist) ถ้าจะวิจัยต่อ: mytcas.com, assets.mytcas.com, studentloan.or.th, mhesi.go.th, dga.or.th, etda.or.th, standard.etda.or.th, bora.dopa.go.th, sat.or.th, niets.or.th, obec.go.th, cgd.go.th, thaimooc.org

## 1. รับเข้าศึกษา: TCAS / mytcas (ทปอ.)

### Takeaway
ทปอ. เป็นเจ้าของระบบ TCAS (mytcas.com) ผู้สมัครยืนยันหรือสละสิทธิ์ผ่าน mytcas ในทุกรอบ (รอบ 1–5) ฝั่งมหาวิทยาลัยมีคู่มือสำหรับมหาวิทยาลัย และเคยมี API ตรวจสถานะผู้สมัครด้วยเลขประจำตัวประชาชน โดยยืนยันตัวด้วย secret key ที่มหาวิทยาลัยสร้างเอง (หลักฐานจากคู่มือ TCAS63) แต่หาสเปก API ฉบับปัจจุบัน (TCAS69/70) ไม่พบ

### Cited Findings
- ทปอ. เป็นผู้ดูแลและพัฒนาระบบ TCAS ที่ www.mytcas.com ผู้สมัครใช้ My TCAS ยืนยันหรือสละสิทธิ์ทุกรอบ — [Trueplookpanya](https://www.trueplookpanya.com/tcas/article/detail/77150); [Bangkokbiznews](https://www.bangkokbiznews.com/health/education/1064513)
- คู่มือมหาวิทยาลัย TCAS63 (V2, ม.ค. 2563) อธิบาย **API ตรวจสอบสถานะ** โดยค้นด้วยเลขประจำตัวประชาชน และใช้ **secret key ที่มหาวิทยาลัยสร้างเอง** คู่มือเตือนว่าไม่ควรเปลี่ยน secret key หลังเริ่มใช้งาน เพราะจะทำให้การเชื่อม API ของมหาวิทยาลัยใช้งานไม่ได้ คู่มือยังครอบคลุมผลตอบกลับของผู้สมัครที่ยืนยันสิทธิ์ที่มหาวิทยาลัยแล้ว — [TCAS63 University Manual (สำเนาที่ มจพ.)](https://www.admission.kmutnb.ac.th/sites/default/files/2020-02/TCAS63-University_Manual_V2_20-01.pdf) (ข้อมูลจาก search snippet เพราะ fetch ถูกบล็อก)
- มีคู่มือ TCAS66 v5 ที่ assets.mytcas.com — [TCAS66 manual](https://assets.mytcas.com/d/TCAS66-manual-v5-27otc65.pdf) (โดเมนถูกบล็อก อ่านเนื้อหาไม่ได้)

### Inferences
- รูปแบบการเชื่อมต่อน่าจะเป็นแบบผสม: (ก) **เว็บพอร์ทัลสำหรับมหาวิทยาลัย** ใช้อัปโหลดรายละเอียดโครงการ/รายชื่อผู้ผ่านการคัดเลือก และดาวน์โหลดรายชื่อผู้สมัครหรือผู้ยืนยันสิทธิ์ (ไฟล์ Excel/CSV) และ (ข) **API ตรวจสถานะการยืนยันสิทธิ์รายคน** ที่คีย์ด้วยเลขประจำตัวประชาชน 13 หลักและ secret key **[ยังไม่ยืนยันสำหรับรอบปัจจุบัน]**
- ระบบ admission ของ TNSU ควรรองรับนำเข้าไฟล์จาก TCAS และเรียก API สถานะ (secret key เก็บใน vault) และควรมี reconcile job ในช่วงยืนยันหรือสละสิทธิ์
- ต้องตรวจสอบว่า TNSU เข้าร่วม TCAS ทุกรอบหรือไม่ หรือรับตรงเองบางรอบ เช่น โควตานักกีฬา โรงเรียนกีฬา **[ยังไม่ยืนยัน]**

### Gaps
- สเปก API ปัจจุบัน (endpoint, รูปแบบ JSON, rate limit) และ template ไฟล์ CSV ฉบับ TCAS69/70 ไม่พบ เพราะ mytcas ถูกบล็อก ต้องขอคู่มือมหาวิทยาลัยจาก ทปอ. โดยตรง
- เกณฑ์ TCAS กับผู้สมัครที่ไม่มีเลข 13 หลัก (ต่างชาติหรือรหัส G) ยังไม่ทราบ

## 2. กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) – ระบบ DSL

### Takeaway
กยศ. ใช้ระบบ DSL (Digital Student Loan) ซึ่งมีระบบย่อย LOS (Loan Origination System) แทน e-Studentloan เดิมที่สิ้นสุดปีการศึกษา 2563 สถานศึกษาทำงานผ่านเว็บพอร์ทัล แยกบทบาท Super User/Admin/Maker/Checker เพื่อตรวจคุณสมบัติ บันทึกค่าเล่าเรียนจริง และให้ผู้กู้ยืนยันการเบิกเงิน ไม่พบ API สาธารณะสำหรับสถานศึกษา

### Cited Findings
- DSL มีระบบย่อย Loan Origination System (LOS) ใช้แทน e-Studentloan ที่สิ้นสุดปีการศึกษา 2563 — [กยศ. เอกสาร 1._0.pdf](https://www.studentloan.or.th/th/system/files/files/news/1._0.pdf)
- คู่มือสถานศึกษาเริ่มจากเมนู "ตรวจสอบคุณสมบัติด้านรายได้" ในบทบาทผู้ตรวจสอบรายการ — [กยศ. คู่มือการตรวจสอบคุณสมบัติรายได้](https://www.studentloan.or.th/th/system/files/files/news/%E0%B8%84%E0%B8%B9%E0%B9%88%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%95%E0%B8%A3%E0%B8%A7%E0%B8%88%E0%B8%AA%E0%B8%AD%E0%B8%9A%E0%B8%84%E0%B8%B8%E0%B8%93%E0%B8%AA%E0%B8%A1%E0%B8%9A%E0%B8%B1%E0%B8%95%E0%B8%B4%E0%B8%A3%E0%B8%B2%E0%B8%A2%E0%B9%84%E0%B8%94%E0%B9%89.pdf)
- คู่มือบริหารสิทธิ์ของสถานศึกษา: บทบาท Super User, Admin, Maker, Checker — [กยศ. Super User v.1.64](https://www.studentloan.or.th/th/system/files/files/news/Super%20User%20v.1.64.pdf)
- ถ้าสถานศึกษายังไม่บันทึกค่าใช้จ่ายตามจริงของผู้กู้ ผู้กู้จะดำเนินการต่อไม่ได้ หลักสูตรที่ไม่ปรากฏในระบบต้องตรวจตามประกาศลักษณะเงินกู้ — [กยศ. FAQ 1-6-5-65](https://www.studentloan.or.th/th/system/files/files/news/FAQ%201-6-5-65.pdf); [FAQ 7 เม.ย.64](https://www.studentloan.or.th/th/system/files/files/news/FAQ%207%20%E0%B9%80%E0%B8%A1.%E0%B8%A2.64.pdf)
- ตัวอย่างฝั่งมหาวิทยาลัย: มศว. มีคู่มือให้นิสิต "ยืนยันการเบิกเงิน" ใน DSL (ภาคเรียน 2/2567) โดย มศว. ดึงข้อมูลจากระบบทะเบียนของตนเอง (SUPREME2019) — [มศว. คู่มือ DSL](https://studentaffairs.op.swu.ac.th/Portals/25/งานสวัสดิการนิสิต/2_2567คู่มือการใช้งานระบบ%20DSL%20นิสิตยืนยันการเบิ.pdf)
- ผู้กู้ใช้งานผ่านเว็บหรือแอป "กยศ. Connect" และเลือกธนาคารกรุงไทยหรือธนาคารอิสลามฯ ได้ — [ม.อ.ตรัง ประกาศรับสมัคร 68](https://www.psu.ac.th/trang/wp-content/uploads/ประกาศรับสมัคร-รายใหม่68-ลงเวบ.pdf)

### Inferences
- รูปแบบการเชื่อมต่อคือ **web portal (ทำงานด้วยคน, Maker/Checker)** ระบบ TNSU ควร export รายการค่าเล่าเรียนจริงรายคนต่อภาคเรียนเป็นไฟล์ที่ตรงกับ template ของ กยศ. (ถ้ามีการนำเข้าแบบ batch) และนำเข้ารายงานการโอนเงินจาก กยศ./ธนาคาร มาตัดหนี้ค่าเทอม **[ยังไม่ยืนยันว่ามีฟังก์ชันอัปโหลดแบบ batch]**
- ต้องกระทบยอด (reconcile) เงินที่ กยศ. โอนให้สถานศึกษากับใบแจ้งหนี้ของนักศึกษา

### Gaps
- ไม่พบ API หรือรูปแบบไฟล์อย่างเป็นทางการสำหรับสถานศึกษา คู่มือที่พบเป็นของปี 2564–2567 จึงต้องตรวจคู่มือล่าสุดที่ studentloan.or.th
- โรงเรียนกีฬา (ระดับ ม.ปลาย) ของ TNSU อาจเข้าข่ายกู้ กยศ. ลักษณะที่ 1 ระดับ ม.ปลาย ได้ ยังไม่ยืนยัน

## 3. การรายงานข้อมูลอุดมศึกษา (สป.อว.): HEdata, ภาวะการมีงานทำ, CHECO, QA

### Takeaway
CHECO (CHE Curriculum Online) เป็นระบบเว็บที่มหาวิทยาลัยใช้ส่งหลักสูตรที่สภามหาวิทยาลัยอนุมัติแล้ว ให้ สป.อว. พิจารณาความสอดคล้องและออกรหัสหลักสูตร ระบบสำรวจภาวะการมีงานทำของบัณฑิตเป็นระบบกลางของ อว. ที่มหาวิทยาลัยต้องเชื่อมข้อมูลด้วย แต่หาเอกสารเทคนิคของระบบกลางไม่ได้ ส่วน HEdata/QA ยังไม่พบแหล่งยืนยันในรอบนี้

### Cited Findings
- CHECO = "ระบบพิจารณาความสอดคล้องของหลักสูตรระดับอุดมศึกษา (CHE Curriculum Online)" ใช้บันทึกข้อมูลหลักสูตร — [มหิดล (ITA)](https://graduate.mahidol.ac.th/Assets-Center/ITA-MU/pdf/14/014-17.pdf)
- สป.อว. พิจารณาหลักสูตรผ่าน CHECO แล้วออก "รหัสหลักสูตร" (ตัวอย่าง: พิจารณาเมื่อ 5 ต.ค. 2564) — [มจธ. หลักสูตร วศ.บ.](https://ene.kmutt.ac.th/download/ป.ตรี_ปกติ17_สภามจธ.259_วศ.บ.%20(วิศวกรรมไฟฟ้าสื่อสารและอิเล็กทรอนิกส์)-ปป.64.pdf)
- กระบวนการ ม.อ.: คณะนำหลักสูตรเข้า CHECO ภายใน 25 วันหลังสภามหาวิทยาลัยอนุมัติ ส่งต่อให้ระดับมหาวิทยาลัย แล้วมหาวิทยาลัยส่งไปยัง สป.อว. หลักสูตรต้องได้สถานะ "S" ภายในเวลาที่กำหนด — [ม.อ. O10 Education](https://ita.psu.ac.th/pdf/O10-Education.pdf)
- เอกสารมหิดลอ้าง URL เดิม http://202.44.139.46/checo/ (ไม่ใช่ checo.mhesi.go.th) — [มหิดล](https://graduate.mahidol.ac.th/Assets-Center/ITA-MU/pdf/14/014-17.pdf)
- มข. พัฒนาเว็บแอปสำรวจภาวะการมีงานทำ "ให้สอดคล้องกับมาตรฐานของกระทรวง อว." และ "พัฒนาการเชื่อมโยงข้อมูลกับระบบฐานข้อมูลของกระทรวง อว." (รายงาน ม.ค. 2568) — [มข. รายงานวิจัย](https://bucket.kku.ac.th/odt/cmmeig6x7288701pi3nvke9oc.pdf); [RSU journal](https://rilj.rsu.ac.th/journal/75/article/403)
- นิยามบัณฑิตมีงานทำ: มีงานสุจริตที่สร้างรายได้ประจำภายใน 1 ปีหลังสำเร็จการศึกษา — [วารสาร มรภ.นครสวรรค์](https://so06.tci-thaijo.org/index.php/vrurdistjournal/article/download/121131/92428/314418)
- งานวิจัย มข. ปี 2565 ศึกษาปัญหาการบันทึกหลักสูตรใน CHECO — [มข. registrar](https://registrar.kku.ac.th/policy/download/researchkku/research-kku-1.pdf)

### Inferences
- สถานะทางกฎหมาย: TNSU อยู่ภายใต้กระทรวงการท่องเที่ยวและกีฬา (ดูหัวข้อ 4) ไม่ได้สังกัด อว. แต่การออกปริญญาที่ ก.พ./ก.ค.ศ. รับรอง และการใช้ TCAS/กยศ./Digital Transcript ทำให้**ในทางปฏิบัติต้องรายงานหลักสูตรผ่าน CHECO และส่งข้อมูลนักศึกษาหรือผู้สำเร็จการศึกษาเข้าฐานข้อมูลอุดมศึกษาของ อว.** เหมือนสถาบันอื่น **[ยังไม่ยืนยันข้อบังคับทางกฎหมาย ต้องตรวจ พ.ร.บ.มหาวิทยาลัยการกีฬาแห่งชาติ และหนังสือเวียน สป.อว.]**
- ฐานข้อมูลอุดมศึกษา (มักเรียก HEdata/CHE data) ตามความรู้เดิมใช้การ**อัปโหลดไฟล์ตาม template รายภาคการศึกษา** (นักศึกษา, ผู้สำเร็จการศึกษา, บุคลากร, หลักสูตร) อ้างอิงเลข 13 หลักและรหัสหลักสูตร CHECO **[ยังไม่ยืนยัน]**
- ระบบ QA: CHE QA Online เดิม และเกณฑ์ใหม่ภายใต้มาตรฐานการอุดมศึกษา 2565 (มคอ. ถูกแทนด้วยแนวทาง outcome-based) **[ยังไม่ยืนยันในรอบนี้]**

### Gaps
- URL ปัจจุบัน, รูปแบบไฟล์ และรอบส่งข้อมูลของฐานข้อมูลอุดมศึกษาและระบบภาวะการมีงานทำ (เช่น emp.mhesi.go.th) ยังไม่ยืนยัน (mhesi.go.th ไม่ได้ fetch)
- ยังไม่ทราบสถานะระบบ QA ที่ใช้จริงในปี 2569

## 4. ระดับโรงเรียน (โรงเรียนกีฬา): สพฐ. DMC, O-NET, เลข 13 หลัก/รหัส G

### Takeaway
โรงเรียนกีฬาอยู่ในสังกัด มกช. กระทรวงการท่องเที่ยวและกีฬา (ไม่ใช่ สพฐ.) ส่วนนักเรียนที่ไม่มีเลขประจำตัวประชาชนจะได้รหัสนำหน้า "G" ในระบบการศึกษา ไม่พบเอกสารเทคนิคของ DMC ในรอบนี้

### Cited Findings
- โรงเรียนกีฬาอยู่ใน "สังกัดมหาวิทยาลัยการกีฬาแห่งชาติ กระทรวงการท่องเที่ยวและกีฬา" — [TCI (JRA)](https://so06.tci-thaijo.org/index.php/jra/article/view/259531)
- มกช. มีวิทยาเขต 17 แห่ง — [Dailynews](https://www.dailynews.co.th/news/2191849/)
- ครม. (14 ก.ค. 2569) พิจารณาแนวทางแยกภารกิจ "การท่องเที่ยว" กับ "กีฬา" ออกจากกัน ซึ่งอาจกระทบสังกัดของ มกช. — [Bangkokbiznews](https://www.bangkokbiznews.com/business/1243091) (ยังไม่ทราบผลสุดท้าย)
- "รหัส G" เป็นรหัสนำหน้าในระบบการศึกษาสำหรับเด็กที่ไม่มีสถานะทางทะเบียน — [Dailynews](https://www.dailynews.co.th/articles/5922244/); [ThaiPublica](https://thaipublica.org/2023/07/srinaka-8-07-2566/)
- สพฐ. เผยแพร่ชุดข้อมูล "จำนวนนักเรียนที่ไม่มีเลขบัตรประจำตัวประชาชน" บน data.go.th — [data.go.th obec-student-030](https://data.go.th/en/dataset/obec-student-030)
- กรมการปกครองร่วมกับ สพฐ. ทำทะเบียนประวัติและบัตรให้นักเรียนรหัส G (2567, 12 มิ.ย. 2569) — [ThaiPBS](https://www.thaipbs.or.th/news/content/336684); [Matichon](https://www.matichon.co.th/?p=2987436)

### Inferences
- DMC (Data Management Center ของ สพฐ.) ใช้กับโรงเรียนสังกัด สพฐ. เป็นหลัก โรงเรียนกีฬาของ มกช. **อาจไม่ต้องส่ง DMC** แต่มักต้องรายงานข้อมูลนักเรียนรายบุคคลให้ต้นสังกัดและข้อมูลกลางของ ศธ. **[ยังไม่ยืนยัน ต้องถาม มกช./สพฐ.]**
- O-NET (สทศ., niets.or.th): โรงเรียนส่งรายชื่อผู้เข้าสอบผ่านระบบเว็บของ สทศ. และรับผลคะแนน ตั้งแต่ปี 2567 เปลี่ยนเป็นสอบตามความสมัครใจ **[ยังไม่ยืนยันในรอบนี้]**
- เลขประจำตัวประชาชน 13 หลักมี check digit (mod 11) ส่วนรหัส G ต้องรองรับเป็น ID ทางเลือก ไม่ควรบังคับรูปแบบเลข 13 หลักอย่างเดียว **[รูปแบบรหัส G ยังไม่ยืนยัน]**

### Gaps
- ภาระการรายงาน DMC/O-NET ของโรงเรียนกีฬา, URL และ template ไฟล์ ยังไม่พบ

## 5. ยืนยันตัวตน: ThaID, DGA Digital ID, NDID

### Takeaway
ThaID (กรมการปกครอง) เป็น **OpenID Connect provider** มี discovery ที่ `https://imauth.bora.dopa.go.th/.well-known/openid-configuration` scope ที่ใช้มี pid (เลข 13 หลัก), ชื่อไทย/อังกฤษ, ที่อยู่ และ ial หน่วยงานลงทะเบียน callback URL ผ่าน RP Admin ส่วน DGA Digital ID (สพร.) เป็น IdP ของบริการภาครัฐ (ทางรัฐ/Biz Portal) ที่เชื่อมกับ NDID และ DOPA ได้

### Cited Findings
- ETDA มีตัวอย่าง Relying Party (Python/Flask + Authlib) ใช้ discovery `https://imauth.bora.dopa.go.th/.well-known/openid-configuration` และ introspect `https://imauth.bora.dopa.go.th/api/v2/oauth2/introspect/` (Basic auth ด้วย client id/secret) scope ได้แก่ openid, pid, address, gender, birthdate, given_name/family_name/name (ไทย/อังกฤษ), title, ial, smartcard_code, date_of_expiry, date_of_issuance — [ETDA/ThaiD-Python-RP](https://github.com/ETDA/ThaiD-Python-RP)
- ต้องตั้งค่า Client ID, Client Secret, API Key, Callback URL และ Scope และตรวจ ID Token ตามมาตรฐาน OIDC — [ETDA/ThaiD-CSharp-RP](https://github.com/ETDA/ThaiD-CSharp-RP)
- ลงทะเบียน Callback URL กับ DOPA ผ่าน "RP Admin" มี route ตรวจสอบ ยกเลิก และรีเฟรช token — [ETDA/ThaiD-PHP-RP](https://github.com/ETDA/ThaiD-PHP-RP)
- DGA Digital ID เป็น ID Provider ของบริการภาครัฐ เชื่อมกับ NDID และ DOPA ได้ หน่วยงานเป็น Relying Party ใช้ใน Citizen Portal (ทางรัฐ) และ Biz Portal — [DGA Digital ID](https://www.dga.or.th/en/?p=119693); [DGA Citizen Portal](https://www.dga.or.th/en/?p=119820)
- ระบบยืนยันตัวบุคคลกลางของ สพร. เปลี่ยนโดเมนจาก openid.egov.go.th เป็น accounts.egov.go.th (2562) มีคู่มือ Admin OpenID SSO — [OpenID SSO Admin Manual](https://accounts.egov.go.th/Download/OpenID_SSO_AdminManual_1.0_17042019.pdf)
- มีการใช้ปุ่ม "เข้าสู่ระบบผ่าน Digital ID" ผ่าน connect.egov.go.th (ตัวอย่าง อปท.) — [สมุทรปราการ คู่มือ](https://www.samutprakan.go.th/wp-content/uploads/2025/02/คู่มือการใช้งาน-เสียภาษี.pdf)
- NDID เป็นแพลตฟอร์มแลกเปลี่ยนข้อมูลยืนยันตัวตน/KYC (เช่น เปิดบัญชีออนไลน์) DGA และ DOPA เคยเข้าร่วม Sandbox ของ ธปท. — [ETDA Digital ID](https://etda.or.th/getattachment/26c0e345-5b7d-4cac-98ab-5733934e3caf/Digital-ID.aspx)
- กรอบ Digital ID ของรัฐ — [thailand.go.th](https://www.thailand.go.th/guide-book-detail/001_05_005-2)

### Inferences
- แนวทางสำหรับ TNSU: ใช้ ThaID (OIDC Authorization Code) เป็นวิธียืนยันตัวตนระดับสูงตอนสมัครเรียนหรือเปิดบัญชีครั้งแรก แล้ว**ผูก `pid` เข้ากับบัญชีนักศึกษาหรือผู้สมัคร** ใช้ IdP ภายใน (SSO ของมหาวิทยาลัย) สำหรับใช้งานประจำวัน เก็บ pid ตามหลัก PDPA (hash/เข้ารหัส)
- NDID เหมาะกับกรณีทำ KYC ผ่านธนาคาร (เช่น สมัครเรียนออนไลน์) แต่มีค่าใช้จ่ายต่อธุรกรรมและต้องทำสัญญากับ NDID **[ยังไม่ยืนยันเงื่อนไข]**

### Gaps
- เงื่อนไขการขึ้นทะเบียน RP กับกรมการปกครอง (ขอผ่านหนังสือราชการ? ค่าธรรมเนียม?) และ endpoint ปัจจุบันของ DGA Digital ID ยังไม่ยืนยัน (dga.or.th ถูกบล็อก)

## 6. การชำระเงิน: PromptPay/Thai QR, Bill Payment, e-Payment ภาครัฐ, New GFMIS Thai, e-Receipt

### Takeaway
ค่าธรรมเนียมการศึกษาโดยทั่วไปรับผ่าน Cross-bank Bill Payment / Thai QR (Biller ID 15 หลัก = เลขผู้เสียภาษี + suffix, Ref1 บังคับ, Ref2 ไม่บังคับ) กรมบัญชีกลางใช้ New GFMIS Thai ตั้งแต่ 4 เม.ย. 2565 และมีบริการ e-Payment ภาครัฐที่ออก e-Receipt และลงบัญชีอัตโนมัติ สำหรับหน่วยงานที่ไม่มี e-service ของตัวเอง

### Cited Findings
- New GFMIS Thai เริ่ม 4 เม.ย. 2565 ครอบคลุมการเบิกจ่าย รับ จ่าย และนำส่งเงิน และเชื่อมกับระบบอื่นได้มากขึ้น GFMIS เดิมมี 6 ระบบงาน (งบประมาณ, จัดซื้อจัดจ้าง, เบิกจ่าย, รับและนำส่ง, สินทรัพย์ถาวร, บัญชีแยกประเภท) — [มติ/เอกสารรัฐบาล 2565](https://media.thaigov.go.th/uploads/document/142/2022/10/doc/Doc_20221007104527000000.doc); [เอกสาร 2562](https://media.thaigov.go.th/uploads/document/142/2019/12/doc/Doc_20191224095412000000.doc)
- ระบบ e-Payment ภาครัฐ: ประชาชนชำระค่าธรรมเนียมออนไลน์ (รวมบัตรเครดิต/เดบิต) ระบบออก **e-Receipt** เงินเข้าบัญชีคลังและลงบัญชี New GFMIS Thai อัตโนมัติ ใช้สำหรับส่วนราชการที่ไม่มี e-service ของตัวเอง เปิดใช้ 23 หน่วยงาน 730 รายการ — [Thansettakij](https://www.thansettakij.com/business/economy/590663); [The Bangkok Insight](https://www.thebangkokinsight.com/news/stock-finance/finance/1023160/)
- โครงสร้าง bill payment: biller identification, company code, billReference1–3 — [Krungsri Developer – Bill Payment Initiation](https://developers.krungsri.com/APIs/Payment/Bill-Payment-Initiation.html); [Krungsri Bill Payment use case](https://developers.krungsri.com/UseCases/Payment/Bill-Payment.html)
- Biller ID ข้ามธนาคาร 15 ตัวอักษร (เลขผู้เสียภาษี + suffix) Ref1 บังคับ Ref2 ไม่บังคับ (เอกสาร library บุคคลที่สาม ไม่ใช่สเปก ธปท. ทางการ) — [thai-qr-payment.js](https://thai-qr-payment.js.org/guide/barcode/)
- งานวิจัยความพร้อมของบุคลากรมหาวิทยาลัยในการใช้ New GFMIS Thai — [TCI romyoongthong](https://so08.tci-thaijo.org/index.php/romyoongthong/article/view/3880)

### Inferences
- สถาปัตยกรรมที่แนะนำ: ระบบสร้างใบแจ้งหนี้พร้อม Thai QR (EMVCo, tag 30 bill payment) และบาร์โค้ด รับ **payment notification/callback API** จากธนาคารผู้ให้บริการ (KTB, SCB, KBank ฯลฯ ตามสัญญา) และนำเข้า **statement file** (ไฟล์ text รายวัน) เพื่อ reconcile **[สเปก KTB Corporate Online ยังไม่ยืนยัน]**
- ถ้า TNSU เป็นส่วนราชการหรือหน่วยงานในกำกับที่ใช้ GFMIS: ต้อง export รายการรับเงินหรือนำส่งเงินเพื่อบันทึกใน New GFMIS Thai (ผ่าน web online/ไฟล์ตาม template กรมบัญชีกลาง) และพิจารณาว่ารายได้ค่าบำรุงการศึกษาเป็น "เงินรายได้ของมหาวิทยาลัย" (นอกงบประมาณ) หรือไม่ ซึ่งมีผลว่าต้องใช้ e-Payment ของกรมบัญชีกลางหรือไม่ **[ยังไม่ยืนยันสถานะ มกช.]**
- e-Tax Invoice & e-Receipt ของกรมสรรพากร: ใช้กับผู้ประกอบการจด VAT เป็นหลัก ส่วนมหาวิทยาลัยรัฐมักออกใบเสร็จอิเล็กทรอนิกส์ตาม ระเบียบกรมบัญชีกลาง/ข้อบังคับมหาวิทยาลัย **[ยังไม่ยืนยัน]**

### Gaps
- สเปก API ของ KTB Corporate Online / Krungthai NEXT for Business, รูปแบบไฟล์ statement และสถานะ e-Receipt ของ มกช. ไม่พบ (cgd.go.th และ ktb.co.th ไม่ได้ fetch)

## 7. เอกสารทางการศึกษาดิจิทัล: e-Transcript (ETDA/DGA), การตรวจสอบ, ธนาคารหน่วยกิตแห่งชาติ

### Takeaway
มาตรฐานใบแสดงผลการศึกษาอิเล็กทรอนิกส์คือ **ขมธอ. 25-2563** (XML ตามแนวทาง UN/CEFACT รวม XML NDR/CCTS 2.01 และ PESC) โครงการ Digital Transcript (อว. + DGA + ก.พ.ร. + ETDA) มี 98 มหาวิทยาลัยออกเอกสารได้ ณ 31 ก.ค. 2567 ตรวจสอบผ่านบริการของ ETDA (สำหรับเอกสารตั้งแต่ปีการศึกษา 2563) ระบบคลังหน่วยกิตแห่งชาติ (NCBS) ยังไม่มีแหล่งทางการที่ยืนยันได้

### Cited Findings
- มาตรฐานข้อความอิเล็กทรอนิกส์สำหรับใบแสดงผลการศึกษา: ETDA ร่วมกับ ดศ. และมหาวิทยาลัย อ้างอิง ขมธอ. 25-2563 โครงสร้าง XML ตาม UN/CEFACT ผสาน XML Naming and Design Rules for CCTS 2.01 v2.1 และ PESC — [NU Journal (NUJST)](https://www.journal.nu.ac.th/NUJST/article/view/Vol-31-No-3-2023-113-128); [TCI AHSTR](https://ph03.tci-thaijo.org/index.php/ahstr/article/view/1006)
- ขมธอ. 14-2560 การใช้ข้อความ XML แลกเปลี่ยนข้อมูลระหว่างหน่วยงาน — [ETDA ขมธอ.14-2560](https://etda.or.th/getattachment/3559f979-68e0-47e2-ab60-599e7cd1397c/ขมธอ-14-2560-(1).aspx)
- ขมธอ. 24-2563 โครงสร้าง Verifiable Credential/Presentation — [ETDA open data](https://opendata.etda.or.th/en/dataset/dataset_16_24/resource/e69176a8-805f-4112-820e-6b3ea818e3d2)
- ณ 31 ก.ค. 2567 มี 98 มหาวิทยาลัยออกเอกสารการศึกษาดิจิทัลได้ (อว. + DGA + สำนักงาน ก.พ.ร. + ETDA) — [DGA Digital Transcript](https://www.dga.or.th/en/our-services/digital-platform-services/dga-digital-transcript/); [DGA](https://www.dga.or.th/en/?p=119709)
- มจธ.: ตรวจสอบเอกสารดิจิทัลผ่านบริการออนไลน์ของ ETDA ได้เฉพาะผู้สำเร็จการศึกษาตั้งแต่ปีการศึกษา 2563 ส่วนเอกสารก่อนหน้าตรวจผ่านสำนักทะเบียน — [KMUTT verify](https://regis.kmutt.ac.th/web/verify/)
- ตัวอย่างงานมหาวิทยาลัย — [NIDA](https://edserv.nida.ac.th/wp-content/uploads/2024/04/010-09.pdf); [TCI scudru](https://ph01.tci-thaijo.org/index.php/scudru/article/view/252407)
- "คลังหน่วยกิตแห่งชาติ (National Credit Bank System: NCBS)" นำร่องใน 4 มหาวิทยาลัย ส่งเสริม lifelong learning (บทความไม่ระบุวันที่ชัดเจน) — [InfoQuest](https://www.infoquest.co.th/?p=244633); [Prachachat](https://www.prachachat.net/?p=882996)

### Inferences
- ระบบทะเบียนของ TNSU ต้องสร้าง XML ตาม ขมธอ. 25-2563 ลงลายมือชื่อดิจิทัล (XAdES/PAdES ด้วยใบรับรองจาก CA ที่เชื่อถือได้ เช่น TDID/Thailand National Root CA) และแนบเป็น PDF/A-3 พร้อม XML ภายใน แล้วส่งหรือลงทะเบียนเพื่อให้ตรวจสอบได้ **[รายละเอียดลายเซ็นยังไม่ยืนยันจากตัวมาตรฐาน]**
- ควรรองรับ Verifiable Credential (ขมธอ. 24-2563) สำหรับ digital degree/badge ในอนาคต
- คลังหน่วยกิต: ต้องเก็บหน่วยกิตของ non-degree/short course และ Thai MOOC เพื่อเทียบโอนตามประกาศ อว. **[ยังไม่ยืนยันระบบกลางและ API]**

### Gaps
- เนื้อหาเต็ม ขมธอ. 25-2563 (schema, signature profile) และ URL พอร์ทัลตรวจสอบปัจจุบันของ ETDA ไม่ได้อ่าน (etda/dga ถูกบล็อก)
- URL หรือสถานะปัจจุบันของ NCBS ไม่พบ

## 8. การกีฬา: กกท., สมาคมกีฬา, DCAT, กีฬามหาวิทยาลัยแห่งประเทศไทย

### Takeaway
DCAT (สำนักงานควบคุมการใช้สารต้องห้ามทางการกีฬา) อยู่ภายใต้ กกท. และ WADA ประกาศว่าปฏิบัติตาม Code 2021 ครบในปี 2565 การตรวจทางห้องปฏิบัติการทำที่ NDCC มหิดล ส่วนกีฬามหาวิทยาลัยแห่งประเทศไทยมีระเบียบการแข่งขัน 2559 ไม่พบระบบลงทะเบียนนักกีฬาออนไลน์หรือ API ของ กกท. ที่เปิดสาธารณะ

### Cited Findings
- DCAT ขึ้นตรงต่อ กกท. ตามกฎหมาย มีข้อวิจารณ์เรื่องความเป็นอิสระ ปี 2565 WADA ระบุว่า DCAT ปฏิบัติตาม Code 2021 ครบ — [Thansettakij](https://www.thansettakij.com/insights/507312); [Dailynews](https://www.dailynews.co.th/news/2566915/)
- NDCC มหิดลเป็นห้องปฏิบัติการตรวจสารต้องห้าม — [ANDI Mahidol 2024 report](https://andi.mahidol.ac.th/2024-report)
- ระเบียบคณะกรรมการบริหารกีฬามหาวิทยาลัยแห่งประเทศไทย ว่าด้วยการจัดการแข่งขัน พ.ศ. 2559 — [มทร.ล้านนา](https://webs.rmutl.ac.th/assets/upload/files/2024/03/20240321133409_80477.pdf); ตัวอย่างใบสมัครกีฬา — [มสธ.](https://oes.stou.ac.th/stclub/wp-content/uploads/sites/11/2021/05/ใบสมัครกีฬา64.pdf)

### Inferences
- การเชื่อมต่อด้านกีฬาน่าจะเป็น **web portal/ไฟล์** (ส่งรายชื่อนักกีฬาและหลักฐานสถานภาพนักศึกษาให้เจ้าภาพกีฬามหาวิทยาลัยแต่ละปี) ระบบ TNSU ควร export ใบรับรองสถานภาพนักศึกษาหรือผลการเรียน (ใช้คุณสมบัติตามระเบียบ เช่น หน่วยกิตขั้นต่ำ) และเก็บ athlete profile ภายใน (ชนิดกีฬา, สังกัดสมาคม, whereabouts/TUE ใช้ ADAMS ของ WADA) **[ยังไม่ยืนยัน]**
- ทะเบียนนักกีฬาของ กกท. (นักกีฬาทีมชาติ/อาชีพ, สมาคมกีฬา) และ Sport Data ยังไม่พบ API ควรติดต่อเป็นการเฉพาะ (MOU แลกเปลี่ยนข้อมูล)

### Gaps
- ไม่ได้ fetch sat.or.th จึงไม่พบระบบทะเบียนนักกีฬา, API, หรือระบบลงทะเบียนกีฬามหาวิทยาลัยปัจจุบัน

## 9. อื่น ๆ: Thai MOOC, LINE OA / แจ้งเตือนผ่านทางรัฐ, e-Saraban

### Takeaway
e-Saraban ภาครัฐต้องสอดคล้องกับระเบียบสำนักนายกฯ ว่าด้วยงานสารบรรณ (ฉบับที่ 4) พ.ศ. 2564 และ พ.ร.บ. การปฏิบัติราชการทางอิเล็กทรอนิกส์ 2565 มหาวิทยาลัยมักใช้ระบบของตนเอง (เช่น มศว. ใช้ Google login) ไม่พบข้อมูลยืนยันเรื่อง Thai MOOC และการแจ้งเตือนผ่านทางรัฐในรอบนี้

### Cited Findings
- e-Saraban ต้องอยู่ภายใต้ พ.ร.บ.การปฏิบัติราชการทางอิเล็กทรอนิกส์ 2565 และ พ.ร.บ.ธุรกรรมทางอิเล็กทรอนิกส์ 2544 ประกอบด้วยระบบย่อย 3 ระบบ — [มหิดล GDCC Draft (2568)](https://www.tm.mahidol.ac.th/admin-general/wp-content/uploads/sites/61/2025/07/GDCC-Draft.pdf)
- หน่วยงานใช้ e-Saraban ตามระเบียบสำนักนายกฯ ว่าด้วยงานสารบรรณ ฉบับที่ 4 พ.ศ. 2564 — [Thansettakij](https://www.thansettakij.com/technology/531008)
- มศว. ใช้ e-Saraban (คู่มือ ก.ย. 2568) ล็อกอินด้วยบัญชี Google มหาวิทยาลัย เคยพัฒนาบน K2 Five — [มศว. คู่มือ](https://ece.swu.ac.th/Portals/7/Document/Manual/Manual_1.20.pdf); [Nintex/SWU](https://nintex.com/resources/workflow-wonders-swu)

### Inferences
- e-Saraban ของ TNSU ต้องรับส่งหนังสือกับหน่วยงานภายนอก ตามความรู้เดิม DGA มีระบบสารบรรณกลาง/มาตรฐานแลกเปลี่ยนหนังสือ (e-CMS/ระบบกลางรับส่งหนังสือ) **[ยังไม่ยืนยัน]**
- Thai MOOC (thaimooc.org, สป.อว./TCU) ต้องส่งรายวิชาผ่านการพิจารณาของแพลตฟอร์ม และนำเข้าผลการเรียนหรือ certificate เพื่อเทียบโอนหรือคลังหน่วยกิต **[ยังไม่ยืนยัน]**
- LINE OA: ใช้ LINE Messaging API (เชิงพาณิชย์, ค่าบริการตามจำนวนข้อความ) การแจ้งเตือนผ่านแอปทางรัฐต้องเป็นบริการที่ DGA เปิดให้หน่วยงานเชื่อม **[ยังไม่ยืนยัน]**

### Gaps
- ไม่พบเอกสารการเชื่อมต่อ Thai MOOC, ทางรัฐ notification API และมาตรฐาน e-Saraban กลางของ DGA (โดเมนถูกบล็อกหรือค้นไม่พบ)

---
### ตารางสรุป Integration Catalogue (ฉบับร่าง สำหรับผู้เขียนรายงาน)

| ระบบ | เจ้าของ | ข้อมูลแลกเปลี่ยน | ประเภท interface | Authentication | เอกสาร | ข้อจำกัดหรือความไม่แน่นอน |
|---|---|---|---|---|---|---|
| TCAS / mytcas | ทปอ. | ผู้สมัคร, ผลคัดเลือก, ยืนยัน/สละสิทธิ์ | Web portal + ไฟล์ + API สถานะ (TCAS63) | Secret key ของมหาวิทยาลัย | mytcas.com, คู่มือ TCAS63/66 | สเปกปัจจุบันไม่ยืนยัน |
| กยศ. DSL/LOS | กยศ. | คุณสมบัติรายได้, ค่าเล่าเรียนจริง, ยืนยันเบิก, ยอดโอน | Web portal (Maker/Checker) | บัญชีผู้ใช้ตามบทบาท | studentloan.or.th | ไม่พบ API |
| CHECO | สป.อว. | ข้อมูลหลักสูตร → รหัสหลักสูตร | Web portal | บัญชีระดับคณะ/มหาวิทยาลัย | (URL เดิม 202.44.139.46/checo) | URL ปัจจุบันไม่ยืนยัน |
| ฐานข้อมูลอุดมศึกษา / ภาวะการมีงานทำ | สป.อว. | นักศึกษา, ผู้สำเร็จการศึกษา, ภาวะการมีงานทำ | อัปโหลดไฟล์/เว็บ | บัญชีหน่วยงาน | mhesi.go.th | ไม่ยืนยันทั้งหมด |
| ThaID | กรมการปกครอง | pid, ชื่อ, ที่อยู่, ial ฯลฯ | OIDC/OAuth2 | client id/secret + API key, callback ลงทะเบียนใน RP Admin | github.com/ETDA/ThaiD-*-RP | เงื่อนไขขึ้นทะเบียน RP |
| DGA Digital ID | สพร. | ตัวตนผู้ใช้ | OpenID (accounts.egov.go.th / connect.egov.go.th) | RP registration | dga.or.th | โดเมนเปลี่ยนบ่อย |
| NDID | NDID Co. | KYC ผ่าน IdP ธนาคาร | Platform API | สัญญา/ใบรับรอง | ndid.co.th | ค่าใช้จ่ายไม่ยืนยัน |
| Bill Payment / Thai QR | ธนาคาร (KTB ฯลฯ), ธปท. | ใบแจ้งหนี้ Ref1/Ref2, การชำระ | QR/บาร์โค้ด + callback API + statement file | ตามสัญญาธนาคาร | developers ของธนาคาร | สเปก KTB ไม่ยืนยัน |
| e-Payment / New GFMIS Thai | กรมบัญชีกลาง | รับเงิน, e-Receipt, ลงบัญชี | Web/ระบบกลาง | บัญชี GFMIS (token) | cgd.go.th | สถานะ มกช. ต่อ GFMIS ไม่ยืนยัน |
| Digital Transcript | อว./DGA/ETDA/ก.พ.ร. | XML ขมธอ. 25-2563 + ลายเซ็นดิจิทัล | ไฟล์ XML/PDF + พอร์ทัลตรวจสอบ | ใบรับรอง CA | etda.or.th, dga.or.th | ตัวมาตรฐานยังไม่ได้อ่าน |
| คลังหน่วยกิต (NCBS) | อว. | หน่วยกิตสะสม | ไม่ทราบ | ไม่ทราบ | — | ไม่พบแหล่งทางการ |
| DCAT / กกท. / กีฬามหาวิทยาลัย | กกท./ก.ก.ม.ท. | รายชื่อนักกีฬา, สถานภาพ | Portal/ไฟล์ (คาดการณ์) | — | sat.or.th | ไม่พบระบบออนไลน์ |
| DMC / O-NET | สพฐ./สทศ. | ข้อมูลนักเรียนรายบุคคล/สอบ | Web portal | บัญชีโรงเรียน | — | ภาระของโรงเรียนกีฬาไม่ยืนยัน |
| e-Saraban | ภายใน + หน่วยงานภายนอก | หนังสือราชการ | ระบบภายใน/มาตรฐานกลาง | SSO | ระเบียบสารบรรณ 2564 | มาตรฐานกลาง DGA ไม่ยืนยัน |
