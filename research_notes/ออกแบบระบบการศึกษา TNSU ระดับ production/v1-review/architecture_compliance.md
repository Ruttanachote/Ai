# Independent Review v1.0 — Architecture / Operations / Security / Compliance

| รายการ | รายละเอียด |
|---|---|
| เอกสารที่ review | `tnsu-system/docs/` v1.0-draft: อ่านละเอียด 00, 07, 08 (§8–11), 09 (§2.9–2.11, §3.6, §7), 10 (§1–9), 11, 12 (§0–8); อ่านผ่าน 01, 06, 02 (เฉพาะจุดที่เกี่ยว) |
| เทียบกับ | `review_architecture.md`, `review_compliance.md` (v0.9) และตารางผลการปิด review ในแต่ละเล่ม (07 §15, 10 §14, 11 §19, 12 §11) |
| ผู้ review | Independent reviewer มุมมอง architecture, operations, security และ compliance (ไม่ได้แก้เอกสารออกแบบ) |
| วันที่ | 28 ต.ค. 2569 |
| ข้อจำกัด | `openbao.org` และ `postgresql.org` resolve ไม่ได้จาก session นี้ จึงใช้ search snippet และเอกสารกระจก (mirror) แทน ข้อที่ไม่ได้ยืนยันติด 🟡 · อ้างตำแหน่งเป็น `เล่ม §หัวข้อ` |

---

## 0. Verdict

v1.0 แก้ปัญหาใหญ่ของ v0.9 ได้จริงหลายข้อ ได้แก่ ตัด Kafka, ClickHouse และ OpenSearch, เปลี่ยน registration เป็น synchronous transaction บน PostgreSQL, ทำ licence allow-list, ลด environment เหลือ 5 ชุด, ผูก roadmap กับปฏิทินจริง, คำนวณต้นทุนใหม่จาก FTE และมี lawful-basis matrix, OIA และ SAFE ตัวเลข capacity เกือบทั้งหมดคำนวณถูก (ตรวจซ้ำในหัวข้อ 3)

อย่างไรก็ตาม ข้อที่ตารางผลการปิด review ระบุว่า "แก้" มี **6 ข้อที่แก้เพียงบางส่วนหรือแก้แล้วเกิดปัญหาใหม่** ได้แก่ key management (Top-2), crypto-shredding (SEC-09), RLS นอก OLTP (Top-10), serial-dependency SLO (NFR-04), on-call (OPS-03) และกำลังคน migration (DATA-04) ปัญหาที่ร้ายแรงที่สุดคือ **โมเดล seal/escrow ของ OpenBao เข้าใจ recovery key ผิด** และ **เล่ม 07 กับ 08 ขัดกันเรื่องที่เก็บ DEK และรูปแบบ replica** ซึ่งถ้า implement ตามเล่มใดเล่มหนึ่งจะเกิด data loss หรือทำให้ crypto-shredding ไม่มีผล

---

## 1. Top-10

| # | ประเด็น | ความรุนแรง | สรุปการแก้ |
|---|---|---|---|
| 1 | **Recovery key ของ OpenBao ถูกออกแบบให้ใช้แทน unseal ได้ (07 §12 diagram "REC → SEAL", 08 §9.2 "KEK ใช้ Shamir unseal", 08 §11 "root = OpenBao unseal แบบ Shamir")** ในโหมด auto-unseal ด้วย HSM นั้น recovery key **ถอดรหัส root key ไม่ได้** และใช้เพื่อ authorization เท่านั้น ถ้า HSM หรือ key ใน HSM หาย snapshot ทุกชุดก็กู้ไม่ได้ ✅ (Vault docs; OpenBao fork จาก Vault 1.14) | **Critical** | (ก) ระบุ seal model เดียวทั้งชุดเอกสาร (ข) HSM ต้องมีที่ site B ด้วย พร้อมกุญแจ seal ที่ clone หรือ backup ด้วยกลไกของผู้ผลิต HSM และซ้อมกู้ (ค) escrow ของ transit KEK เป็นทางกู้จริงเพียงทางเดียวถ้า HSM หาย จึงต้องซ้อมกรณี "HSM สูญหาย" ไม่ใช่เฉพาะ "OpenBao สูญหาย" (ง) ตรวจว่า OpenBao ≥ 2.2 มี PKCS#11 seal และจะย้ายเป็น external plugin ตั้งแต่ v2.7 |
| 2 | **07 กับ 08 ขัดกันเรื่องที่เก็บ wrapped DEK:** 07 ADR-011/§12 เก็บใน `health_vault` (backup 13 เดือน + tombstone ตอน restore) ส่วน 08 §9.2 เก็บใน key store แยก (OpenBao KV v2 หรือ `hlt_keys`) ถ้าเลือก OpenBao KV แล้ว DEK จะมี RPO เท่ากับ Raft snapshot รายชั่วโมง ขณะที่ DB มี RPO ≤ 5 นาที แถวที่สร้างภายในชั่วโมงก่อน failover จะถอดรหัสไม่ได้ และ snapshot offline รายไตรมาสเก็บ 1 ปี (11 §6) ทำให้ DEK ที่ shred แล้วกู้กลับได้ | **High** | เก็บ wrapped DEK ใน DB `hlt_keys` ที่ replicate ไปพร้อม Patroni (RPO เดียวกับ vault) และกำหนด retention ของ `hlt_keys` ทั้ง backup และ offline ให้สั้นกว่า vault, เก็บ tombstone list **นอก** DB ที่ถูก restore (WORM), แก้ชื่อ DB ให้เป็นชื่อเดียว (`health_vault` vs `hlt_vault`) |
| 3 | **Crypto-shredding ทำได้ละเอียดเพียงระดับบุคคล แต่ retention ต่างกันตามประเภทข้อมูล** (08 §8: บันทึกการให้ยาเก็บจนอายุ 25 ปี, wellness raw 3 ปี, บาดเจ็บเก็บระยะศึกษา + 5 ปี) DEK เดียวต่อคนจึง shred ข้อมูลประเภทหนึ่งโดยไม่ลบประเภทอื่นไม่ได้ นอกจากนี้ PII ใน core (DEK ต่อโดเมน) และ backup รายปีที่เก็บ 7 ปีแบบ Object Lock compliance mode ลบตาม DSR ไม่ได้ | High | ใช้ DEK ต่อ (บุคคล × retention class), เขียนใน ROPA/privacy notice ว่า backup อยู่ในสถานะ "beyond use" และหมดอายุตามรอบ, ทบทวนว่า backup รายปี 7 ปีจำเป็นหรือไม่ เพราะ archive ตามกฎหมายแยกอยู่แล้ว (11 §6 "Backup ไม่ใช่ archive") ถ้าลดเหลือ 13 เดือนทั้งระบบจะปิดปัญหานี้ได้มาก |
| 4 | **RLS นอก OLTP ยังไม่ปิดจริงและสองเล่มขัดกัน:** 07 ADR-017 ใช้ **logical replication แบบ column list** ไป `pg-analytics` ส่วน 08 §10.3 ใช้ **physical read replica + view allow-list** สำหรับ ELT ทั้งสองแบบมีช่องโหว่ คือ view ทำงานด้วยสิทธิ์ของเจ้าของ view จึงข้าม RLS ของผู้เรียก เว้นแต่ตั้ง `security_invoker`, logical replication เข้าตารางที่เปิด RLS ต้องให้ subscription owner มี BYPASSRLS หรือเป็นเจ้าของตาราง ✅ (PG15+ commit) และ Superset `impersonate_user` สำหรับ PostgreSQL ยังไม่ยืนยัน 🟡 | High | เลือกแบบเดียว (แนะนำ logical replication + column list + row filter), ระบุ role ของ ELT/subscription ที่มี BYPASSRLS อย่างชัดแจ้ง + audit, view ทุกตัวต้องเป็น `security_invoker=true`, Superset ใช้ RLS filter ของ Superset (ไม่หวัง DB impersonation) และมี CI ตรวจว่า dataset ทุกตัวมี filter, เกณฑ์ export ให้เป็นค่าเดียว (07 = 500 แถว, 08 = 100 แถว) |
| 5 | **RLS ที่อิง GUC (`app.org_scope`) ไม่กัน SQL injection:** app role เรียก `set_config('app.org_scope', …)` เองได้ ผู้โจมตีที่ฉีด SQL ได้จึงขยาย scope ได้ ทำให้ "defence-in-depth" ไม่เป็นชั้นป้องกันอิสระตามที่ AP-05 อ้าง ยังไม่มีใน threat model | High | ตั้ง scope ผ่านฟังก์ชัน `SECURITY DEFINER` ที่ตรวจ HMAC/ลายเซ็นของ scope token ที่ core สร้าง (หรือใช้ `SET ROLE` ต่อ OrgUnit), ห้าม dynamic SQL, เพิ่ม test ว่า `set_config` จาก app role ถูกปฏิเสธ, เพิ่มใน STRIDE (E) |
| 6 | **Serial chain ของ SLO 99.95% ไม่ได้นับ PgBouncer และ cloud LB/DNS** (07 §10.7) ทั้งที่ทั้งสองอยู่บน path จริง ถ้ารวมเป็น 6 ตัวจะได้ 99.93% (≈ 7.1 นาที/7 วัน ไม่ใช่ 5.0) นอกจากนี้ OpenBao เป็น dependency ของทุก journey ที่ต้องถอดรหัส PII หรือค้นด้วย HMAC แต่ไม่อยู่ใน SLO/game day | Medium–High | นับ PgBouncer (≥ 2 instance + health check) และ LB เข้า chain หรือแสดงว่าอยู่ใน failure domain ของ APISIX, เพิ่ม OpenBao ใน game day (ฆ่า leader/ทั้ง cluster) และ cache DEK ที่ unwrap แล้วในหน่วยความจำแบบมีอายุ |
| 7 | **Stack ยังเกินทีมจริง และนับต่ำกว่าความจริง:** "28" ไม่นับ **Patroni DCS** (etcd/Consul/K8s API ซึ่งไม่ถูกกล่าวถึงเลยทั้งชุด), Valkey Sentinel, PostgreSQL 3 cluster (core/analytics/apps) ที่นับเป็นแถวเดียว, FreeRADIUS (eduroam I-46), cert-manager/ingress/CNI และ **APISIX waiting-room plugin ที่ต้องเขียนเอง (Lua)** จำนวนจริงจึงราว 33–36 ตัว ขณะที่ skill matrix ของทีม มกช. (12 §5.4) มี bus factor = 1 ใน Keycloak, security (OpenBao/Kyverno/DT/ClamAV/PAM/SBOM), observability และ data/BI | High | นับใหม่อย่างตรงไปตรงมา, ตัด Tempo (Should), ใช้ DBaaS/KMS/HSM ที่ GDCC มี (ถ้ามี) เพื่อลดภาระ, ย้าย waiting room ไปเป็น signed-token ใน core/Next.js (ภาษาเดียวกับทีม) แทน Lua plugin, กำหนด **คู่ผู้ดูแล (primary/secondary)** ต่อ component ใน 07 §5.3 และวัด bus factor ≥ 2 เป็น KT metric |
| 8 | **Migration/parallel run รายวิทยาเขตยังไม่สมจริงสำหรับ Wave 2:** BR-03 (reverse-delta เขียนกลับระบบเดิม แล้วให้ระบบเดิมคำนวณ GPA/ใบแจ้งหนี้ใหม่) ต้องอาศัยความร่วมมือและ API ของผู้ขายระบบเดิมแต่ละ product แต่งบ 6.3 ครอบคลุมเฉพาะการ "ดึง" ข้อมูล, Wave 2 = 10 วิทยาเขต + 12 โรงเรียน go-live ภายใน 2 สัปดาห์ (16 พ.ค./1 มิ.ย. 2574) ด้วย rehearsal 3 รอบต่อวิทยาเขต (≥ 30 รอบใน ~12 สัปดาห์) ขณะที่ data engineer มีเพียง 4 FTE ใน T5 (review DATA-04 เสนอ 4–6) และ parallel run จบ ธ.ค. 2574 เหลือ 3 เดือนก่อนส่งมอบ มี.ค. 2575 | High | ตรวจใน P0 ว่าระบบเดิมแต่ละ product รับ reverse-delta ได้หรือไม่ ถ้าไม่ได้ให้ใช้ **shadow calculation ในระบบใหม่** (นำกฎเดิมมาเป็น PolicySet แล้วเทียบกับ snapshot ของเดิม) แทนการเขียนกลับ, แบ่ง Wave 2 เป็น 2a (มิ.ย. 2574) และ 2b (พ.ย. 2574, ต้นภาค 2) หรือเลื่อนโรงเรียนที่เหลือ, เพิ่ม data engineer เป็น 6 FTE ใน T5 และเลื่อน MS-H หรือเพิ่ม warranty |
| 9 | **ลายมือชื่อ S3 "รายบุคคล" แบบ batch ขัดกับหลัก sole control:** transcript 3,000 ฉบับลงนามด้วยใบรับรองส่วนบุคคลของนายทะเบียนที่อยู่ใน HSM ของสถาบัน (10 §7.2, 07 ADR-010) เป็นจุดที่เงื่อนไขลายมือชื่อที่เชื่อถือได้ (ม.26 🟡) อาจไม่ผ่าน เพราะผู้ลงนามไม่ได้ควบคุมกุญแจขณะลงนามแต่ละฉบับ นอกจากนี้เส้นทางการลงนามไม่ตรงกันในแต่ละเล่ม (07: core → PKCS#11 → HSM; 10 §7.3: "HSM ที่ OpenBao เข้าถึงผ่าน PKCS#11"; 08 §11: HSM แยกจาก OpenBao) | Medium–High | ใช้ **ตราประทับนิติบุคคล (S2 e-seal) ของ มกช.** สำหรับ transcript batch และระบุชื่อ/ตำแหน่งนายทะเบียนในเนื้อเอกสาร หรือใช้ remote signing ที่ผู้ลงนามอนุมัติ batch ด้วย 2FA (SCAL2-style) ให้นิติกรและ ETDA ยืนยันใน P0, ใช้เส้นทาง signing แบบเดียว (core → PKCS#11 → HSM; OpenBao ไม่อยู่ใน path) |
| 10 | **ทะเบียน cross-border และ lawful-basis matrix ยังไม่ครบ:** ทะเบียน (09 §7) ขาดบริการ video call สำหรับสัมภาษณ์ออนไลน์และ identity proofing (02 FA-5, 09 §3.1), payment gateway บัตร/โอนต่างประเทศ (02 FA-3), CAPTCHA และ breached-password API (10 T-04), Web Push endpoint ของ Mozilla/Microsoft และ SOC/MSSP ที่อาจใช้ SIEM บน cloud ต่างประเทศ ส่วน matrix (10 §2.2) **ไม่มีกิจกรรมของบุคลากร** (ข้อมูลอาจารย์ 2,700 คน, UEBA ซึ่งเป็นการ monitor พนักงาน), ใช้ L-10 ฐาน **VI** กับการบันทึกบาดเจ็บทั่วไปซึ่งใช้ได้เฉพาะกรณีเจ้าของข้อมูลให้ความยินยอมไม่ได้ และไม่มีข้อมูลสุขภาพ/สมรรถภาพในการคัดเลือกนักกีฬาและโรงเรียนกีฬา (L-01) | Medium–High | เพิ่ม X-11..X-16, เพิ่ม L-34 (ข้อมูลบุคลากร: CT/PT/LO) และ L-35 (UEBA/monitoring: PT/LI + notice + DPIA), แก้ L-10 เป็น ม.26(5)(ก) (เวชกรรมป้องกัน/การวินิจฉัย/การรักษาโดยผู้ประกอบวิชาชีพที่มีหน้าที่รักษาความลับ 🟡) สำหรับบันทึกโดย `medical` ส่วน VI ใช้เฉพาะเหตุฉุกเฉิน และโค้ชบันทึกได้เพียง incident ที่ไม่มีการวินิจฉัย, เพิ่มฐานสำหรับการตรวจร่างกาย/ใบรับรองแพทย์ตอนคัดเลือก |

---

## 2. Findings table

ระดับ: Critical / High / Medium / Low

### 2.1 Architecture และ right-sizing

| ID | file:section | issue | severity | concrete fix |
|---|---|---|---|---|
| A-01 | 07 §5.3, 11 §2 | Patroni ต้องใช้ DCS (etcd/Consul/ZooKeeper/K8s API) แต่ไม่มีระบุทั้งชุดเอกสาร ถ้าใช้ K8s API เป็น DCS PostgreSQL ที่อยู่บน "VM/node pool แยก" จะผูก HA ของ DB กับ control plane ของ K8s | High | เขียน ADR ย่อยเรื่อง DCS: etcd 3 nodes บน data zone (นับเป็น component) หรือ K8s DCS พร้อมผลวิเคราะห์ failure mode เมื่อ control plane ล่ม และใส่ใน game day |
| A-02 | 07 §5.3 | นับ "PostgreSQL 16 + Patroni (core, analytics, apps)" เป็นแถวเดียว แต่ 11 §2.1 มี 3 cluster ที่แต่ละ cluster ต้องมี backup stanza, upgrade และ monitoring ของตัวเอง | Medium | นับเป็น 3 workload หรือรวม apps DB (Moodle/Zammad/Superset meta) ไว้ใน analytics cluster เพื่อลดเหลือ 2 cluster |
| A-03 | 07 ADR-004/016 | Waiting room เป็น **custom APISIX plugin** (Lua) เก็บคิวใน Valkey เป็น bespoke code ภาษาที่ทีม มกช. และ vendor Java ไม่ถนัด อยู่บน critical path วันพีค และเป็นสาเหตุให้ Valkey ต้องมี fallback mode | Medium | ใช้ signed admission token (JWT) ที่ออกโดย core/Next.js edge + หน้าคิว static, APISIX ตรวจเพียงลายเซ็นด้วย plugin มาตรฐาน (jwt-auth) ลดโค้ด Lua เหลือศูนย์ |
| A-04 | 12 §5.4, 07 §5.3 | Bus factor = 1: Keycloak/IAM (1 คน), security (1 คนดูแล OpenBao, Kyverno, Dependency-Track, ClamAV, PAM, SBOM), observability (1), data/BI (1); ปัญหา "one-person knowledge" ของ OpenBao/Patroni เกิดขึ้นจริงในช่วง R1–R2 ที่ทีม มกช. ทำงานนี้เพียง 3–4 FTE | High | กำหนด primary/secondary ต่อ component, ซ้อม runbook แบบสลับคน, ทำ KT metric "≥ 2 คนต่อ runbook วิกฤต" (OpenBao unseal/restore, Patroni failover/PITR, Keycloak upgrade) เป็นเงื่อนไข MS-W1 |
| A-05 | 12 §5.4, 6.4(e) | เพิ่มอัตรา IT +3 "ก่อน R2 (เม.ย. 2572)" ซึ่งเป็น 1 เดือนก่อน go-live 1 พ.ค. 2572 จึงไม่มีเวลา KT/shadow; อัตรา 35,000–50,000 บาท/เดือนต่ำกว่าตลาดของทักษะ K8s/PG/security 🟡 | Medium | สรรหาภายใน Y2 (ก่อน MS-2 ≥ 9 เดือน), ตั้งงบเงินเพิ่มพิเศษหรือใช้ MSP แบบ named engineer สำหรับทักษะที่จ้างไม่ได้ |
| A-06 | 07 ADR-012, §12 | OpenBao OSS ไม่มี cross-cluster DR replication (เป็นฟีเจอร์ Enterprise ของ Vault) 🟡 site B จึงต้องกู้จาก snapshot รายชั่วโมง ทำให้ transit key version หรือ secret ที่สร้างใน 1 ชม. ล่าสุดหาย แต่ 07 §10.8 แสดง "OpenBao node ล้ม RPO 0" เท่านั้น | High | ระบุ RPO ของ OpenBao ข้าม site = รอบ snapshot (ลดเป็น 15 นาที), ห้าม rotate KEK หรือสร้าง key ใหม่โดยไม่ snapshot ทันที, ใช้ `hlt_keys` ใน PG (ดู Top-2) |
| A-07 | 07 ADR-005 ข้อ 4 | PgBouncer transaction mode กับ JDBC server-side prepared statement (`prepareThreshold`) ไม่ได้ระบุ; query ที่อยู่นอก `@Transactional` จะไม่มี scope และคืน 0 แถว (fail-closed แต่เป็น bug ที่หาได้ยาก) | Medium | กำหนด PgBouncer ≥ 1.21 พร้อม `max_prepared_statements` หรือ `prepareThreshold=0`, ใช้ ArchUnit rule บังคับว่า repository ทุกตัวต้องเรียกใน transaction |
| A-08 | 07 ADR-005, 08 §10.1 ข้อ 4 | `rel_visible()` แบบ `SECURITY DEFINER` ถูกเรียกต่อแถวใน policy ทำให้ query รายงาน/รายการใหญ่ช้าและ planner ประเมินได้ยาก | Medium | แยก policy เป็น `org_unit_id = ANY(...)` (index ได้) กับ relationship ผ่าน `EXISTS` ที่ index ได้, วัด p95 ใน load test (เกณฑ์ ADR-005 +20%) |
| A-09 | 07 §6 (WeasyPrint) | ใส่ ZWSP (U+200B) เพื่อช่วยตัดคำ แต่ ZWSP จะติดไปกับข้อความที่ copy/extract, ค่าใน XML ขมธอ. 25 และลำดับการอ่านของ PDF/UA; Pango มีประวัติ regression ของการตัดบรรทัดไทย ✅ | Medium | ใส่ ZWSP เฉพาะชั้น render (ไม่ใส่ใน data/XML), ทดสอบ text extraction ใน golden test, pin เวอร์ชัน Pango/HarfBuzz/ฟอนต์ใน image และใส่ไว้ใน bake-off P0 |
| A-10 | 07 ADR-007, §6 | bpmn-js/dmn-js licence บังคับให้คง watermark ของ bpmn.io ✅ ซึ่งยอมรับได้ใน ADMIN แต่ต้องไม่ตัดออกตอน customise | Low | ระบุใน DoD ของ ADMIN ว่าห้ามซ่อน watermark; ทะเบียนข้อยกเว้นใส่ข้อความ licence |
| A-11 | 07 §6 (OpenBao row) | "ฟีเจอร์ auto-unseal/PKCS#11 … [ต้องตรวจสอบ]": PKCS#11 seal มีตั้งแต่ OpenBao 2.2 ✅ แต่ต้องใช้ HSM-enabled build (cgo) และตั้งแต่ v2.7 จะเป็น external plugin ✅ | Low | ระบุเวอร์ชันขั้นต่ำและวิธีจัดหา build/plugin (checksum, SBOM) |
| A-12 | 07 §10.4 | ระบุว่า login 37.5/s "เกินเป้า 20/s" แต่ Keycloak 3 pods × 2 vCPU ตามคู่มือ sizing (1 vCPU ≈ 15 password login/s, Argon2) ✅ รับได้ราว 90/s ก่อนหัก headroom และผู้ใช้ส่วนใหญ่ login ผ่าน ThaID broker (ไม่มีการ hash) | Low | ปรับเป้า Keycloak เป็น 40/s พร้อม headroom; การทยอยแจ้งเกรดยังทำได้ แต่ไม่จำเป็นต้องอ้างข้อจำกัดของ Keycloak |

### 2.2 Capacity, SLO, RPO/RTO

| ID | file:section | issue | severity | concrete fix |
|---|---|---|---|---|
| N-01 | 07 §10.7 | Chain 4 ตัวไม่นับ PgBouncer และ LB (Top-6) | Medium–High | ดูหัวข้อ 3.3 |
| N-02 | 07 §10.3 | Hot-row สมมติ lock 5 ms แต่ lock อยู่จนถึง COMMIT ซึ่งรอ **synchronous standby** (RTT + fsync) และ transaction มี 15 row writes; ถ้า lock จริง 15–25 ms ที่ 300 cmd/s utilisation จะเป็น 90–150% (ดู 3.2) | Medium | วัด lock hold จริงใน spike P0, เตรียม seat-pool bucketing ไว้ตั้งแต่แรก (ไม่ต้องรอ), พิจารณา `synchronous_commit = remote_write` สำหรับ schema `reg` หรือย้าย UPDATE seat ไปท้ายสุดของ transaction |
| N-03 | 07 §10.3 vs 11 §2.1 | PgBouncer: 07 ใช้ 12 pods × 20 = 240 client conn แต่ sizing ช่วง peak มี core 10 + reg 6 + worker 4 = 20 pods → 400 client conn | Low | ใช้ตัวเลขเดียว, ตั้ง `default_pool_size` ต่อ DB/role และ `reserve_pool` สำหรับ worker |
| N-04 | 07 §10.8, 11 §7.2 | Object storage replicate แบบ async: หลัง failover อาจมี record ใน DB ที่ชี้ไปยัง PDF ลงนาม/ไฟล์ที่ยังไม่ถึง site B (หรือกลับกัน) runbook ไม่ครอบคลุม | Medium | เพิ่มขั้นตอน "DB ↔ object reconciliation" (ตรวจ hash ที่ DB อ้างกับ object ที่มีจริง แล้วสร้างใหม่จาก snapshot), เก็บเอกสารลงนามแบบ write-both หรือ replicate ก่อน commit สถานะ "issued" |
| N-05 | 07 §10.8 | Site B มี PG async standby เพียงตัวเดียว หลัง failover จึงไม่มี HA และ health_vault + keycloak + core อยู่บน node เดียว | Medium | ระบุ "degraded mode" และขั้นตอนสร้าง standby ใหม่ภายใน X ชม., ใน DR drill ต้องวัดเวลานี้ด้วย |
| N-06 | 07 §10.7, 11 §10.2 | Synthetic probe ทุก 1 นาทีไม่ละเอียดพอสำหรับ budget 5 นาที/7 วัน (1 probe fail = 1 นาที = 20% ของ budget) | Low | ใช้ SLI จาก request-based (APISIX log) เป็นหลัก ส่วน synthetic ใช้เป็นสัญญาณ |
| N-07 | 07 §10.2 | ตัวเลข admissions ใช้สมมติฐานที่ยังไม่ยืนยัน (40% ใน 21 วัน) แต่สรุป "ไม่ใช่ตัวกำหนด capacity แม้ผิด 3×" ถูกต้อง (ตรวจแล้ว) | Info | — |

### 2.3 Security / threat model

| ID | file:section | issue | severity | concrete fix |
|---|---|---|---|---|
| S-01 | 07 §13, 10 §9 | ไม่มี STRIDE สำหรับ **CI/CD และ GitOps**: ใครก็ตามที่ merge env repo ได้ก็ deploy prod ได้ (review 1 คน), runner secrets, Argo CD admin | High | branch protection + 2 reviewers สำหรับ env repo, signed commits, Argo CD SSO + RBAC แยก prod, runner prod แยกและไม่มี secret ถาวร (OIDC → OpenBao) |
| S-02 | 07 ADR-005 | SQLi → `set_config` ขยาย scope (Top-5) | High | ดู Top-5 |
| S-03 | 09 I-44, 10 T-04 | **SMS pumping / OTP toll fraud**: SMS OTP สำรองสามารถถูกใช้ยิง SMS จำนวนมากให้เสียเงินได้ | Medium | rate limit ต่อเบอร์/IP/prefix ประเทศ, ส่ง SMS เฉพาะเบอร์ไทยโดยค่าเริ่มต้น, งบ alert รายวัน |
| S-04 | 07 ADR-004 | **Seat hoarding/transfer**: ลงทะเบียนกักที่แล้วถอนในเวลานัดให้เพื่อนที่รออยู่ (เกิดจริงในหลายมหาวิทยาลัย) | Medium | ที่นั่งที่ถอนเข้า waitlist อัตโนมัติ (ไม่คืนเข้า pool ทันที), ถอนช่วง window มี cool-down, UEBA rule |
| S-05 | 07 §11.8, 10 T-07 | Judge tablet offline: IndexedDB "เข้ารหัสด้วยกุญแจ session" แต่ไม่ระบุว่ากุญแจเก็บที่ใด กรณีเครื่องหาย/ถูกขโมยก่อน sync | Medium | ใช้ WebCrypto non-extractable key + PIN ของกรรมการ, MDM/kiosk mode สำหรับ tablet ของ มกช., remote revoke ผ่าน device list |
| S-06 | 07 §10.2, ADR-010 | ผลรับสมัครแบบ static shard บน CDN ไม่มี auth: ถ้า key ของ shard เดาได้ (เลขผู้สมัคร) จะถูก scrape ทั้งรายชื่อ | Medium | ใช้ key = HMAC(เลขผู้สมัคร + วันเกิด), ไม่มีชื่อเต็ม/เลขบัตร, ประกาศรายชื่อทางการแยกเป็น PDF ตามระเบียบ |
| S-07 | 10 §9 | ไม่มีภัย **vendor insider** โดยตรง (ทีม vendor 28–39 คนที่มี JIT ใน prod และเข้าถึง migration enclave) | Medium | background check ของทีม vendor ที่เข้าถึง prod/enclave, JIT ≤ 8 ชม. + ผู้อนุมัติฝั่ง มกช., session recording ตรวจสุ่มรายเดือน |
| S-08 | 10 T-01 vs 07 ADR-023/§11.10 | กลไก integrity ของเกรดมี 2 แบบที่ไม่ได้บอกว่าใช้ร่วมกันอย่างไร (hash chain append-only ต่อ section + root hash รายวันที่ประทับเวลา vs GradeSubmission snapshot ลงนาม + nightly compare) และ DBA: "read-only + data-fix 4-eyes" vs "ไม่มี DML + break-glass 2 คน" | Low | กำหนดเป็นโมเดลเดียว (แนะนำ snapshot ลงนาม + hash chain เป็น evidence) และนิยามช่องทาง data-fix เดียว |
| S-09 | 07 §11.2 vs 10 T-04 | 07 ไม่ใช้ CAPTCHA แต่ 10 ใช้ "CAPTCHA แบบปรับตามความเสี่ยง" (มักเป็น SaaS ต่างประเทศ) | Low | ใช้ proof-of-work/self-hosted (เช่น ALTCHA 🟡) หรือ step-up OTP แทน |

### 2.4 Key escrow, health vault, crypto-shredding และ backup

| ID | file:section | issue | severity | concrete fix |
|---|---|---|---|---|
| K-01 | 07 §12, 08 §9.2/§11, 11 §8 | Recovery key ≠ unseal (Top-1) | Critical | ดู Top-1 |
| K-02 | 07 §12 vs 08 §9.2 | "transit KEK non-exportable" แต่ escrow ต้องใช้ transit backup ที่เปิด `allow_plaintext_backup` ซึ่งได้ key material แบบ plaintext (base64) ออกมาจาก OpenBao แล้วค่อยเข้ารหัสด้วย escrow public key ภายนอก 🟡 (พฤติกรรมของ Vault transit) | High | ระบุว่าเป็น export ที่ควบคุมใน key ceremony บนเครื่อง air-gapped, ไม่มีขั้นตอนอัตโนมัติ, และ HMAC key ที่ถูก escrow ต้องไม่ถูกเรียกว่า non-exportable |
| K-03 | 07 ADR-011 vs 08 §9.2 | ที่เก็บ DEK ขัดกัน (Top-2) | High | ดู Top-2 |
| K-04 | 08 §8, §9.2 | Retention ต่างกันแต่ DEK เดียวต่อคน (Top-3) | High | DEK ต่อ (person × retention class) |
| K-05 | 11 §6 | Offline รายไตรมาสเก็บ 1 ปีรวม OpenBao snapshot และ health_vault; core backup รายปี 7 ปีแบบ compliance mode ทำให้ "ลบตาม DSR" ไม่มีผลกับ backup จนครบ 7 ปี | Medium | ตาราง retention ต่อชุดข้อมูลใน offline copy, privacy notice ระบุ backup beyond-use, พิจารณาลด backup รายปี |
| K-06 | 08 §8 | เวชระเบียน: ถ้าห้องพยาบาลเป็นสถานพยาบาลตาม พ.ร.บ.สถานพยาบาล จะมีหน้าที่เก็บเวชระเบียนตามระยะที่กำหนด 🟡 ซึ่งอาจยาวกว่า "ระยะศึกษา + 5 ปี" และห้าม crypto-shred ก่อนครบ | Medium | ปิดคำถามนี้ใน P0 ก่อน R2 (HLT) และกำหนด retention class แยก "clinical record" |
| K-07 | 07 ADR-012, 12 §6.3 | HSM ต้องมี 2 sites + signing + seal แต่ค่าใช้จ่าย "ใบรับรอง/CA/HSM 0.3–0.8 ล้าน/ปี" ต่ำเกินจริงสำหรับ HSM 2 sites 🟡 | Medium | แยกแถว HSM (appliance หรือ Cloud HSM ในไทย) และ CA/TSA; ประเมินใหม่ใน GDCC spike |
| K-08 | 11 §8 | ผู้ถือ share เป็นผู้บริหาร 5 ตำแหน่ง กำหนดเวลาประกอบ quorum ≤ 4 ชม. ซึ่งเป็นเส้นทางวิกฤตของ ransomware RTO และ DR นอกเวลาราชการ | Medium | ถ้า seal ผูก HSM ทั้ง 2 sites จะไม่ต้องใช้ share ในการ unseal (ใช้เฉพาะ escrow); เพิ่มผู้แทนสำรองต่อ share และซ้อมนอกเวลาราชการ 1 ครั้ง/ปี |

### 2.5 Compliance (PDPA, OIA, child protection, signatures, licence)

| ID | file:section | issue | severity | concrete fix |
|---|---|---|---|---|
| C-01 | 10 §2.2 | ไม่มีกิจกรรมของบุคลากร (Top-10) | Medium–High | เพิ่ม L-34/L-35 + DPIA monitoring พนักงาน |
| C-02 | 10 §2.2 L-10 | VI ใช้ได้เมื่อเจ้าของข้อมูล "ให้ความยินยอมไม่ได้" เท่านั้น การบันทึกบาดเจ็บทั่วไปควรใช้ ม.26(5)(ก) 🟡 + PT | Medium | แก้ตาม Top-10 |
| C-03 | 10 §2.2 L-01 | การคัดเลือกนักกีฬา/โรงเรียนกีฬามีใบรับรองแพทย์ ข้อมูลร่างกาย และผลทดสอบสมรรถภาพ (ข้อมูลสุขภาพ) แต่ L-01 กล่าวถึงเพียงความพิการ | Medium | เพิ่มฐาน ม.26 (EC ของผู้สมัคร/dual consent สำหรับผู้เยาว์ หรือข้อยกเว้นที่นิติกรรับรอง) และเก็บใน vault หรือลบเมื่อปิดรอบ |
| C-04 | 09 §7 | Cross-border register ขาด video call, payment gateway ต่างประเทศ, CAPTCHA/breached-password API, Web Push ของ Mozilla/Microsoft, SOC/SIEM ต่างประเทศ และการส่ง transcript/verification ให้ผู้รับต่างประเทศ (WES, นายจ้าง) | Medium | เพิ่ม X-11 video conferencing, X-12 international payment, X-13 bot/credential-check services, X-14 browser push services, X-15 MSSP/SIEM, X-16 ผู้รับ credential ต่างประเทศ (ฐาน: คำขอของเจ้าของข้อมูล/สัญญา) |
| C-05 | 10 §7.2 | Batch S3 กับ sole control (Top-9) | Medium–High | ดู Top-9 |
| C-06 | 10 §7.1, 07 ADR-010 | ความสมจริงของ PAdES-LTV ในไทย: **ETDA ให้บริการ e-Timestamping** ✅ และ NRCA อยู่ใน Adobe AATL ตั้งแต่ 2019 (G3 = document signing) ✅ จึงทำได้จริง แต่ยังไม่ได้ระบุ TSA ที่เลือก, SLA ของ TSA (CA/TSA ล่มอยู่ใน STRIDE D แต่ไม่มี fallback), และการตั้ง trust anchor ของ NRCA G3 ใน EU DSS (ซึ่งไม่มี EU Trusted List สำหรับไทย) | Medium | ระบุ TSA หลัก + สำรอง, คิวลงนามแบบ retry เมื่อ TSA ล่ม (ไม่ block การออกใบเสร็จ: ออก B-B แล้วเติม timestamp ภายหลัง), กำหนด trusted certificate source = NRCA G3 ใน DSS, ทดสอบ green check ใน Acrobat/Foxit ใน P0 |
| C-07 | 10 §3.2 | อ้าง "ม.23–25 ✅ (ผ่าน review)" แหล่งที่อ้างคือ review เอง (circular) | Low | เปลี่ยนเป็น 🟡 หรือใส่ลิงก์ตัวบท |
| C-08 | 10 §2.4 | อายุบรรลุนิติภาวะ 20 ปีติด 🟡 แต่เป็นหลักกฎหมายที่ชัด (ป.พ.พ. ม.19–20) | Info | เปลี่ยนเป็น ✅ พร้อมลิงก์ตัวบท |
| C-09 | 10 §4 | ข้ออ้างเรื่องคุ้มครองเด็ก (ม.29 ✅ snippet, ม.27 🟡, ร่าง พ.ร.บ. ฉบับใหม่ ✅/🟡) **ติดป้ายถูกต้อง**; SAFE design สมเหตุสมผล | Info | — |
| C-10 | 10 §3 | OIA: ถือว่าใช้บังคับ (กรณีเข้มที่สุด) และติด 🟡 ที่ ม.4 กับกรอบ 15 วัน **ถูกต้อง** | Info | — |
| C-11 | 07 §6 | Licence ที่ตรวจในรอบนี้: Flowable 7 OSS ไม่มี UI ✅ (ตรงกับเอกสาร), bpmn-js ต้องคง watermark ✅, Grafana/Loki/Tempo AGPL-3.0 ✅ (เอกสารตรวจแล้ว), EU DSS LGPL-2.1 ✅ (เอกสารตรวจแล้ว), OpenBao PKCS#11 ✅ (ดู A-11); Keycloak Apache-2.0 และ APISIX Apache-2.0 (ASF) ถูกต้องตามความรู้ผู้ review 🟡 | Info | AGPL obligation: ใช้ภายในโดยไม่แก้ไขไม่ต้องเปิด source; **ถ้าแก้ Grafana/Loki แล้วให้ผู้ใช้ภายนอก (เช่น RUM dashboard ให้วิทยาเขต) ใช้ผ่านเครือข่าย ต้องเสนอ source ของส่วนที่แก้** (AGPL §13) → ห้าม fork; ใส่ใน DoD |

### 2.6 Operations, release, testing, exit, cost

| ID | file:section | issue | severity | concrete fix |
|---|---|---|---|---|
| O-01 | 11 §5.1 | Platform upgrade "ปีละ 1–2 ครั้ง" แต่ Kubernetes ออก ~3 minor/ปี, patch support ~1 ปี ✅ และต้องขึ้นทีละ minor ตาม skew policy ✅ ถ้า self-managed (RKE2) จะหลุด support ภายใน 1 ปี | Medium | กำหนด K8s minor upgrade ทุก 4 เดือน (ใช้ทั้ง 3 หน้าต่าง: เม.ย., ส.ค., ธ.ค.) หรือใช้ managed K8s ที่ผู้ให้บริการ upgrade ให้ |
| O-02 | 11 §5.2, 12 §2.4 | ในปีที่มี go-live (2572–2574) union ของ freeze ต่อ ring เกินเป้า 30% (ดู 3.5) และ R3 go-live 1 พ.ย. ตกอยู่ใน FZ-ADM/FZ-REG2/FZ-GRADE/FZ-LOAN ขัดกับกติกา "ไม่มี go-live ต.ค.–กลาง พ.ย." ที่เล่ม 12 เขียนเองแล้วยกเว้นไว้ | Medium | ยอมรับเป้า ≤ 40% ในปีที่มี go-live หรือย่อ FZ-GL ให้เป็นราย ring (ไม่ใช่ทั้งระบบ); R3 ให้ go/no-go ก่อน 1 ต.ค. (ก่อน FZ-FY) |
| O-03 | 11 §15, 12 §5.5/6.5 | On-call ≥ 6 คนต่อ tier × 2 tiers (L2, L3) = ≥ 12 คน แต่ MA กรณีต่ำ = 8 FTE | Medium | ระบุว่า MSP ใช้ pool ร่วมกับลูกค้าอื่น (ต้องมี named engineer ≥ 3 คนที่รู้ระบบ) หรือปรับ MA ต่ำสุดเป็น 10–12 FTE (≈ +2.4–4.3 ล้านบาท/ปี) |
| O-04 | 11 §13.4, 12 §3.2 BR-03 | Reverse-delta ไปยังระบบเดิมที่หลากหลาย (Top-8) | High | shadow calculation ในระบบใหม่ + snapshot ของเดิม |
| O-05 | 12 §2.1, §5.2 | Wave 2 รวม 22 OrgUnit ใน 2 สัปดาห์, parallel run จบห่างจากการส่งมอบเพียง 3 เดือน (Top-8) | High | แบ่ง Wave 2 / เพิ่ม data engineer / ขยาย warranty |
| O-06 | 11 §4.1 | Testing strategy ดีขึ้นมาก แต่ยังขาด: game day ของ OpenBao/HSM, test PgBouncer prepared statements, contract test ของ bridge กับระบบเดิม, DB↔object reconciliation หลัง failover, test text-extraction ของ PDF ไทย; PIT mutation ≥ 70% บนโมดูลใหญ่ใน CI ทุก PR จะช้า | Medium | เพิ่มรายการเหล่านี้; รัน PIT แบบ incremental/nightly |
| O-07 | 11 §18 | Exit plan: data export มีคอลัมน์ที่เข้ารหัสและไฟล์ใน vault (ciphertext) ซึ่งผู้รับช่วงใช้ไม่ได้ถ้าไม่มีกุญแจ; seal ผูกกับ HSM ของผู้ให้บริการ cloud → การย้าย GDCC ↔ CSP ต้องทำ seal migration และออกใบรับรองลงนามใหม่ | Medium | เพิ่มขั้นตอน "key handover/seal migration" และ "export แบบถอดรหัสใน enclave" ใน exit plan และซ้อมใน export test รายปี |
| O-08 | 12 §6.5 | Run cost ไม่รวม HSM 2 sites, ค่าใบรับรองรายบุคคล (ถ้าใช้ S3), ค่า TSA ต่อ timestamp 🟡, งบ MSP ที่สอดคล้องกับ rotation | Medium | เพิ่มแถว (ประมาณ 1–3 ล้านบาท/ปี 🟡) ทำให้ช่วงเป็นราว 22–47 ล้านบาท/ปี |
| O-09 | 12 §6.3 | Infra 1,000–1,500 บาท/vCPU-เดือน (CA-06) ไม่ได้แยก RAM (PG 128 GB, Valkey 8 GB) และ NVMe; storage/WAF/CDN 0.2–0.8 ล้าน/ปีน่าจะต่ำ ถ้าใช้ WAF/DDoS managed 🟡 | Low–Medium | ขอใบเสนอราคาจริงจาก GDCC/CSP ใน P0 แยก compute/RAM/storage/WAF |
| O-10 | 11 §6 | Restore verification "รายวัน" สำหรับ DB ขนาด 150–300 GB + ทุก stanza อาจกินทรัพยากร non-prod เกินงบ 30% | Low | รายวันสำหรับ WAL/diff ล่าสุดแบบสุ่มตาราง, full restore รายสัปดาห์ |

### 2.7 Over-engineered / under-specified (สรุป)

| ประเภท | รายการ |
|---|---|
| **Over-engineered** | Per-person DEK + crypto-shred สำหรับ HLT ทั้งหมด (ถ้าแก้ Top-3 แล้วยังต้องการ ok แต่ควรพิจารณา DEK ต่อ retention class แทนต่อคน); integrity เกรดสองกลไก (S-08); custom waiting-room Lua plugin (A-03); Tempo; HMAC แยก 3 context (core/IAM/migration) — 2 context พอ; PAdES-B-LTA + re-timestamp สำหรับคำสั่ง/ประกาศทุกฉบับ (ใช้ B-LTA เฉพาะเอกสารถาวรจริง) |
| **Under-specified** | Patroni DCS (A-01); OpenBao cross-site DR (A-06); seal model และ HSM site B (Top-1); reverse-delta กับระบบเดิม (O-04); PgBouncer/JDBC (A-07); DB↔object reconciliation (N-04); signing path (Top-9); เลือก logical vs physical replica (Top-4); TSA ที่เลือกและ fallback (C-06) |

---

## 3. Recomputations

### 3.1 Registration peak (07 §10.3) — ตรวจซ้ำ

| ตัวชี้วัด | เอกสาร | คำนวณซ้ำ | ผล |
|---|---|---|---|
| Queue poll | 19,500 ÷ 20 = 975 RPS | 975 | ✅ (ใช้นักศึกษาทั้ง 15,000 ในคิว ขณะที่แถวบนใช้ 6,000 — ขัดกันเล็กน้อยแต่ conservative) |
| Release rate | 6,000 ÷ 15 = 400/นาที | 400 | ✅ |
| Active | 400 × 8 = 3,200 | 3,200 | ✅ |
| Origin | 800 + 160 + 64 "≈ 1,050" | **1,024** | ✅ (ปัดขึ้น; design 2,100 ยังครอบคลุม) |
| Command | 6,000 × 1.5 ÷ 900 = 10/s × 6 = 60 | 60 | ✅ |
| Row writes | 60/120/300 × 15 | 900 / 1,800 / 4,500 | ✅ |
| Staggered A | 3,750 → 1,500/15 นาที → 100/นาที → 800 active → ~260 RPS; burst 15/s | ✅ | ✅ (headroom 2,100/260 ≈ 8×) |

### 3.2 Hot-row sensitivity (N-02)

Utilisation = cmd/s × 20% × lock-hold

| lock hold | 60 cmd/s | 120 cmd/s | 300 cmd/s |
|---|---|---|---|
| 5 ms (เอกสาร) | 6% | 12% | 30% |
| 10 ms | 12% | 24% | 60% |
| 15 ms | 18% | 36% | **90%** |
| 25 ms | 30% | 60% | **150% (อิ่มตัว)** |

ข้อสรุป: ที่โหลดออกแบบ 120 cmd/s ยังรับได้ แต่ "ยืนยัน 300 cmd/s" จะไม่ผ่านถ้า lock hold รวม sync-commit ≥ 15 ms จึงควรเตรียม bucketing ไว้ตั้งแต่ต้น

### 3.3 SLO serial chain (N-01)

- เอกสาร: 0.9999³ × 0.9998 = **0.99950** (5.0 นาที/7 วัน) ✅ คณิตศาสตร์ถูก
- รวม PgBouncer และ cloud LB ที่ 99.99%: 0.9999⁵ × 0.9998 = **0.99930** → 10,080 × 0.0007 = **7.05 นาที/7 วัน** (ไม่ถึง 99.95%)
- รายเดือน 0.99975⁴ = 0.99900 ✅; ถ้า 6 ตัวต้องให้แต่ละตัว ≈ 99.983%
- Login journey: Keycloak + ThaID (ภายนอก) ไม่นับ ThaID downtime ✅ สมเหตุสมผล

### 3.4 Grade release และ P0 (07 §10.4–10.5)

- 15,000 × 60% × 25% ÷ 60 = 37.5 session/s ✅; 37.5 × 120 × 6 ÷ 120 = 225 RPS ✅
- แบบประเมิน 9,000 × 6 ÷ 900 = 60 form/s ✅
- P0: 15,000 + 4,450 + 8,000 + 2,700 = 30,150 ✅; 21,105 + 18,090 + 9,000 = 48,195 ✅; ÷ 60 = 803/s ✅; LINE 18,090 ÷ 500 = 36.2 → 37 req ✅; Web Push 352 req/s ✅; SMS 90 s ✅
- Keycloak: 3 × 2 vCPU × 15 login/s/vCPU ≈ 90/s ✅ (Keycloak sizing) → 37.5/s ไม่ใช่คอขวด (A-12)

### 3.5 Freeze union (O-02) — ประมาณการต่อ ring pilot ปี 2572

FZ-GL (15 เม.ย.–กลาง มิ.ย. ≈ 60 วัน, รวม FZ-REG1 ที่ซ้อน) + FZ-FY 13 + FZ-ADM (1 ต.ค.–15 พ.ย. 46 วัน + ±2 วันทำการ × ~6 รอบประกาศ ≈ 24 วัน) + FZ-REG2 (ซ้อนกับ FZ-ADM บางส่วน, +~5) + FZ-GRADE ~10 + FZ-LOAN ~5 + FZ-RPT ~10 + R3 FZ-GL (15 ต.ค.–กลาง ธ.ค., ส่วนที่ไม่ซ้อน ~30) ≈ **155–165 วัน ≈ 43–45% ของปี** (ส่วนใหญ่เป็นแบบรายโมดูล แต่ FZ-GL เป็นทั้งระบบ) → เกินเป้า 30% ในปีที่มี go-live

### 3.6 FTE/ต้นทุน (12 §5–6) — ตรวจซ้ำ

- คน-เดือน: 33 + 480 + 312 + 207 + 206.5 + 336 + 112.5 = **1,687** ✅; รายบทบาท backend 414 ✅
- (b) ต้นทุนอื่น Y1 ต่ำ 1.0 + 0.3 + 0.1 + 0.3 = 1.70 ✅; Y3 สูง 6.0 + 2.0 + 1.5 + 0.8 + 3.0 + 2.2 + 1.2 + 1.0 + 0.9 = 18.6 ✅
- รวม 5 ปี: 220.70 × 1.10 + 5.46 = 248.23 ✅; 343.92 × 1.15 + 7.80 = 403.31 ✅
- Run cost: ต่ำ 20.9 / สูง 43.7 ✅ ทางคณิตศาสตร์ แต่ขาดรายการใน O-03, O-08 → ปรับเป็นประมาณ **22–48 ล้านบาท/ปี** 🟡
- vCPU: Site A 96 + 24 + 48 + 24 = 192 ✅, peak 256 ✅; Site B 48 + 16 + 16 + 8 = 88 ✅; รวม 336 ✅; ผลรวม pod ช่วง peak ≈ 95 vCPU < app nodes 160 ✅

---

## 4. ตรวจการปิด review v0.9 (สถานะจริง)

| ข้อ v0.9 | เอกสารอ้างว่า | สถานะจริงจาก review นี้ | เหตุผล |
|---|---|---|---|
| Top-1 Stack ใหญ่เกิน | แก้ (28) | **แก้บางส่วน** | ลดลงจริงมาก แต่นับต่ำ (A-01..A-03) และ bus factor 1 (A-04) |
| Top-2 Key escrow | แก้ | **แก้บางส่วน / มีข้อผิดพลาดใหม่** | recovery key ≠ unseal, HSM site B, OpenBao DR (Top-1, A-06) |
| Top-4 Registration engine | แก้ | **แก้** | invariant อยู่ใน DB; มีข้อสังเกต hot row (N-02) |
| Top-7 Parallel run/rollback | แก้ | **แก้บางส่วน** | reverse-delta ไม่สมจริงกับระบบเดิมที่หลากหลาย (O-04) |
| Top-8 Thai PDF engine | แก้ | **แก้** (bake-off ใน P0) | ข้อสังเกต ZWSP (A-09) |
| Top-9 Licence | แก้ | **แก้** | ตรวจซ้ำแล้วถูก (C-11) |
| Top-10 RLS | แก้ | **แก้บางส่วน** | OLTP ดี; replica/view/Superset ขัดกันและมีช่องโหว่ (Top-4), SQLi/GUC (Top-5) |
| NFR-01..03 | แก้ | **แก้** | คำนวณถูก |
| NFR-04 SLO chain | แก้ | **แก้บางส่วน** | ไม่นับ PgBouncer/LB (N-01) |
| NFR-05/06 | แก้ | **แก้** | + เพิ่ม DB↔object (N-04) |
| SEC-01 Grade tampering | แก้ | **แก้** | สองกลไกควรรวม (S-08) |
| SEC-06/07 SOC, breach | แก้ | **แก้** | — |
| SEC-08 Backup immutability | แก้ | **แก้** | — |
| SEC-09 Crypto-shredding | แก้ | **ยังไม่ปิด** | 07 vs 08 ขัดกัน, retention ต่อคน, offline copies (Top-2/3, K-05) |
| SEC-11 Signing governance | แก้ | **แก้บางส่วน** | sole control ของ batch S3 และ signing path (Top-9) |
| SEC-12 / Compliance #3 Cross-border | แก้ | **แก้บางส่วน** | ทะเบียนมีแล้วแต่ขาดหลายบริการ (C-04) |
| OPS-03 On-call | แก้ | **แก้บางส่วน** | rotation vs MA FTE (O-03) |
| OPS-04 Freeze | แก้ | **แก้บางส่วน** | ปีที่มี go-live เกิน 30% (O-02) และ K8s upgrade cadence (O-01) |
| OPS-05 Exit | แก้ | **แก้บางส่วน** | กุญแจ/seal migration ไม่อยู่ใน exit plan (O-07) |
| DATA-04 Migration FTE | แก้ | **แก้บางส่วน** | data engineer 3–4 FTE ต่ำกว่าที่เสนอ 4–6 ในช่วง wave (O-05) |
| Compliance #1 OIA | แก้ | **แก้** | ติดป้ายถูกต้อง (C-10) |
| Compliance #6 Health lawful basis | แก้ | **แก้บางส่วน** | ไม่ block แล้ว แต่เลือกฐาน VI ผิดเงื่อนไข (C-02) |
| Compliance #7 Safeguarding | แก้ | **แก้** | (C-09) |
| Compliance #8 e-signature/LTV | แก้ | **แก้บางส่วน** | policy matrix มีแล้ว; TSA/trust anchor/sole control ยังเปิด (C-05, C-06) |

---

## 5. Sources

| สถานะ | แหล่ง | ใช้ยืนยัน |
|---|---|---|
| ✅ | [HashiCorp Vault — Seal/Unseal concepts](https://developer.hashicorp.com/vault/docs/concepts/seal) (search snippet: "recovery keys cannot decrypt the root key … purely an authorization mechanism"; "If the key is permanently deleted, the Vault cluster cannot be recovered, even from backups") | Top-1, K-01 |
| ✅ | [HashiCorp forum — recovery from autounseal](https://discuss.hashicorp.com/t/vault-recovery-from-autounseal/71978) | Top-1 |
| ✅ | [OpenBao 2.2.0 release notes](https://openbao.org/community/release-notes/2-2-0/) · [OpenBao PKCS#11 seal docs](https://openbao.org/docs/configuration/seal/pkcs11/) · [Securosys OpenBao auto-unseal](https://docs.securosys.com/openbao/auto-unseal/overview) (search snippet; ไซต์ openbao.org fetch ไม่ได้จาก session) | A-11, PKCS#11 seal ตั้งแต่ 2.2, external plugin ตั้งแต่ 2.7 |
| ✅ | [bpmn-js LICENSE](https://github.com/bpmn-io/bpmn-js/blob/develop/LICENSE) (อ่านตรง: watermark "MUST NOT be removed or changed" และ "must stay fully visible") | A-10, C-11 |
| ✅ | [PostgreSQL commit a2ab9c0 (mirror)](https://forger.sitiv.fr/open-dsi/postgres/commit/a2ab9c0) · [pgsql-hackers discussion](https://postgresql.org/message-id/29f21c274dc01e71a9bdc06ebc4e18ab83601089.camel%40j-davis.com) · [PG17 logical replication security (Crunchy mirror)](https://access.crunchydata.com/documentation/postgresql17/17.1/logical-replication-security.html) | Top-4 (subscription owner + RLS) |
| ✅ | [Keycloak — Concepts for sizing CPU and memory](https://www.keycloak.org/high-availability/single-cluster/concepts-memory-and-cpu-sizing) | A-12, 3.4 |
| ✅ | [Kubernetes releases](https://kubernetes.io/releases/_print) · [Version skew policy](https://kubernetes.io/releases/version-skew-policy%20%20) | O-01 |
| ✅ | [ETDA e-Timestamping service](https://www.etda.or.th/en/Our-Service/Digital-Trusted-services-Infrastructure/TEDA/e-Timestamping.aspx) · [คู่มือบริการ TEDA e-Timestamping](https://etda.or.th/getattachment/2ed37fe4-fa72-4126-8f57-221f3a25c6f6/คมอบรการ-TEDA-e-Timestamping.aspx) | C-06 (มี TSA ในประเทศ; ยังไม่ยืนยันว่าเป็น RFC 3161 🟡) |
| ✅ | [ETDA Thailand PKI D-Day / NRCA](https://www.etda.or.th/th/Thailand-PKI-D-Day-EN.aspx) · [NRCA ใน Foxit](https://www.etda.or.th/th/pr-news/nrca_Foxit_en.aspx) · [ETDA CP v3 (G3 document signing)](https://www.etda.or.th/getattachment/7bc5f9f6-4cf5-4580-874c-60aeac01347b/cpv3.pdf.aspx) · [Adobe AATL](https://helpx.adobe.com/acrobat/kb/approved-trust-list1.html) | C-06 (NRCA อยู่ใน AATL ตั้งแต่ 2019; sub-CA ปัจจุบัน 🟡) |
| ✅ | [Pango issue #413 — Thai line break broken after Unicode 11](https://gitlab.gnome.org/GNOME/pango/issues/413) · [Pango issue #776](https://gitlab.gnome.org/GNOME/pango/-/issues/776) | A-09 |
| ✅ | [PwC — Thailand data protection overview](https://legal.pwc.de/content/im-fokus/thailand-global-data-protection-law-overview.pdf) (snippet: ฐานข้อมูลอ่อนไหวด้านเวชกรรมป้องกัน/อาชีวเวชกรรม/สาธารณสุข) | C-02 (ถ้อยคำ ม.26(5)(ก) ฉบับเต็ม 🟡) |
| 🟡 | OpenBao ไม่มี cross-cluster DR replication ใน OSS (เป็นฟีเจอร์ Enterprise ของ Vault) — ความรู้ผู้ review | A-06 |
| 🟡 | Vault/OpenBao transit backup ต้องเปิด `allow_plaintext_backup` และได้ key material แบบ plaintext — ความรู้ผู้ review | K-02 |
| 🟡 | Superset `impersonate_user` ไม่ครอบคลุม PostgreSQL — ค้นแล้วไม่พบเอกสารยืนยัน | Top-4 |
| 🟡 | ม.26 พ.ร.บ.ธุรกรรมฯ (sole control ของลายมือชื่อที่เชื่อถือได้) — ความรู้ผู้ review ต้องให้นิติกร/ETDA ยืนยัน | Top-9 |
| 🟡 | หน้าที่เก็บเวชระเบียนตาม พ.ร.บ.สถานพยาบาล — ความรู้ผู้ review | K-06 |
| 🟡 | ราคา HSM/Cloud HSM, TSA, WAF ในไทย และตลาดเงินเดือน DevOps/SRE | K-07, O-08, O-09, A-05 |
| 🟡 | Keycloak Apache-2.0, APISIX Apache-2.0 (ASF) — ความรู้ผู้ review (ไม่ได้ fetch LICENSE รอบนี้) | C-11 |
