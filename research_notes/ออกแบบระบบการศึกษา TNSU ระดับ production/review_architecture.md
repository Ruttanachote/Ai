# Architecture Review: TNSU Student & Athlete Lifecycle Platform (system-design.md v0.9)

| รายการ | รายละเอียด |
|---|---|
| เอกสารที่ review | `tnsu-system/docs/system-design.md` (2,772 บรรทัด, v0.9 draft pre-bid, 28 ต.ค. 2569) |
| ผู้ review | Independent principal architect (มุมมอง: architecture, NFR, security, data, operations, delivery realism) |
| วันที่ | 28 ต.ค. 2569 |
| ขอบเขต | อ่านทั้งเอกสาร ไม่แก้ไขไฟล์ออกแบบ อ้างอิงตำแหน่งเป็น `L<บรรทัด>` ของ system-design.md |
| ข้อจำกัด | ไม่ได้ตรวจกับข้อมูลภายใน มกช./GDCC ประเด็น license ของ OSS อ้างจากความรู้ของผู้ review ณ ปี 2025–2026 และติดป้าย **[ต้องตรวจสอบ]** ไว้ |

---

## 0. ข้อสรุปภาพรวม (Verdict)

เอกสารมีคุณภาพสูงกว่าเอกสาร pre-bid ทั่วไปมาก ได้แก่ domain model ที่ลึก (PolicySet ต่อ cohort, AcademicProfile, OrgUnit + RLS, SoD, approval chains, guardian consent, health vault) มี ADR และมี assumptions register ที่ตรวจสอบได้ ปัญหาหลักไม่ได้อยู่ที่ความถูกต้องของ domain แต่อยู่ที่ **ความสมดุลระหว่างความซับซ้อนของ platform กับขีดความสามารถของผู้ดูแลจริง** และ **ความสมจริงของแผนส่งมอบ**

1. **Stack ใหญ่เกินทีม:** นับ runtime component ที่ต้อง operate ได้ราว **45–50 ตัว** (K8s, APISIX, Keycloak, Patroni/PgBouncer/pgBackRest × 3 clusters, Redis, Kafka/Strimzi/MirrorMaker2/Apicurio/Debezium, MinIO, OpenSearch, ClickHouse/Keeper, dbt, Superset, Metabase, OpenMetadata, Vault, HSM, Teleport, Unleash, Argo CD/Rollouts, Velero, Prometheus/Grafana/Loki/Tempo, Kyverno, Falco, service mesh, Wazuh, Dependency-Track, SonarQube, GitLab, registry, ClamAV, Moodle, Zammad ฯลฯ) ขณะที่ทีม IT ของ มกช. มี 5–10 คน (A-25, L175) และเอกสารเองยอมรับใน R-10 (L2604) ว่าต้อง "ลดจำนวน component" ซึ่งยังไม่ได้ลดจริง
2. **ภาระที่ออกแบบไว้สูงเกินจริง แต่ส่วนที่เสี่ยงจริงยังขาด:** ภาระลงทะเบียนที่คาดคือ ~10 command/s เฉลี่ย และ 60/s ช่วง burst (L2250) ซึ่ง PostgreSQL ตัวเดียวรับได้สบาย การใช้ Redis + Kafka + async worker + reconcile job (L1345–1385) ทำให้เกิดปัญหา dual-write ที่ไม่จำเป็น ในทางกลับกัน ยังไม่มี threat model, ยังไม่มีแผนสำรองและกู้คืน key ของ Vault, ยังไม่ได้เลือก reporting/PDF engine สำหรับเอกสารราชการไทย และยังไม่มีแผน parallel run หรือ rollback ของ cutover
3. **Delivery timeline ไม่ตรงกับปฏิทินการศึกษา:** R1.0 Admissions ที่ M9 (ธ.ค. 2570) ช้ากว่ารอบรับสมัครปีการศึกษา 2571 ที่น่าจะเปิดราว ก.ย. 2570 (เทียบกับ L100) ส่วน Wave 2 go-live ที่ M23 (ก.พ. 2572) ตกกลางภาค 2 ขัดกับหลักใน L2545 และ Phase 1 ที่ใส่ 15+ โมดูลไว้ใน 12 เดือนมีโอกาสสำเร็จต่ำ
4. **มีประเด็น license ของ OSS ที่อาจกระทบ TOR:** Teleport Community, HashiCorp Vault/Terraform (BSL), MinIO community, Flowable 7 UI และ Redis 7.4+ ขณะที่ ADR-006 ตัด Redpanda ออกด้วยเหตุผลเรื่อง BSL ซึ่งเป็นการใช้เกณฑ์ไม่สม่ำเสมอ

**คำแนะนำโดยรวม:** คง domain design ไว้ทั้งหมด และปรับสามด้าน ได้แก่ (ก) **ลด platform ลงเป็น "Minimum Operable Stack"** (หัวข้อ 4) ซึ่งตัด component ได้ราว 40% และลดค่า infra/MA ได้ประมาณ 25–35% (ข) เพิ่ม security/ops artefact ที่ยังขาด และ (ค) ปรับ roadmap ให้ตรงกับปฏิทินรับสมัครและปฏิทินภาคการศึกษา โดยลด scope ของ Phase 1

---

## 1. Top-10 Findings (เรียงตามความสำคัญ)

| # | Finding | Severity | ข้อเสนอโดยย่อ | ตำแหน่ง |
|---|---|---|---|---|
| 1 | **ความซับซ้อนของ platform เกินขีดความสามารถในการดูแลของ มกช.** (~45–50 component, 3 PG clusters, 8 environments, 2 UI stacks) ทำให้หลังส่งมอบมีโอกาสสูงที่ระบบจะเสื่อม (patch ไม่ทัน, CVE ค้าง, upgrade ไม่ได้) | **Critical** | ใช้ Minimum Operable Stack (หัวข้อ 4) โดยตั้งเกณฑ์ว่า "ทุก component ต้องมีผู้ดูแลฝั่ง มกช. ที่ระบุชื่อได้ หรือเป็น managed service ของ GDCC/CSP" และเลื่อน Kafka/ClickHouse/OpenSearch/OpenMetadata/Teleport/service mesh/Flutter ออกไปจนกว่าจะมีหลักฐานว่าจำเป็น | L58, L2048–2081, L175, L2604 |
| 2 | **ยังไม่มีแผนสำรองและกู้คืน key ของ Vault/KEK** แผน backup มีเพียง "HSM backup" (L2500) โดยไม่มี Vault storage snapshot, unseal/recovery key escrow หรือ DR ของ Vault แต่เลขบัตรประชาชน (L1860) และข้อมูล health vault ทั้งหมด (L1877, ADR-013) เข้ารหัสด้วย key ใน Vault ถ้า Vault เสีย ข้อมูลจะกู้ไม่ได้ถาวร | **Critical** | เพิ่ม Vault/OpenBao Raft snapshot (รายชั่วโมง, เข้ารหัส, Object Lock, ข้าม site), Shamir/recovery key แบบ M-of-N ถือโดยผู้บริหาร มกช. (ไม่ใช่ vendor), Vault DR replica ที่ site B, ซ้อม "restore Vault จากศูนย์" ปีละ 2 ครั้ง และกำหนดเป็น exit criteria ของ go-live | L1224, L2070, L2396, L2491–2500, L2236 |
| 3 | **ยังไม่มี threat model (STRIDE/attack tree)** สำหรับ asset สำคัญ ได้แก่ เกรด, การเงิน/คืนเงิน, credential/e-Transcript, ข้อมูลผู้เยาว์/สุขภาพ และบัญชีผู้ดูแล ทำให้ control ในหัวข้อ 10.3 ยังเป็น checklist ที่ไม่ได้ผูกกับภัยคุกคามจริง (เช่น DBA แก้เกรดตรงใน DB, refund ไปบัญชีผิด, helpdesk ถูก social engineering ให้ reset MFA) | **High** | ทำ threat model ใน Phase 0 อย่างน้อย 6 asset (ดู SEC-01..SEC-08) และใช้เป็น input ของ ASVS level และ pen test scope โดยทบทวนทุก release ใหญ่ | L2387–2400 |
| 4 | **Registration engine ออกแบบเกินจำเป็นและสร้าง consistency risk:** Redis DECR → Kafka publish → worker INSERT เป็น dual-write ข้าม 3 ระบบ ถ้า publish ล้มเหลวหลัง DECR หรือ cart ที่มีหลาย section ทำ DECR ได้เพียงบางส่วน จะเกิด seat leak หรือ oversell ที่ต้องพึ่ง reconcile ทุก 1 นาที ทั้งที่ภาระจริงเพียง 10–60 cmd/s | **High** | ให้ registration เป็น **synchronous transaction บน PostgreSQL** (`UPDATE seat_pool SET taken = taken+1 WHERE id=? AND taken < cap` + unique constraint) หลัง waiting room ใช้ Redis เพียงเป็น read-cache ของที่นั่งคงเหลือ และตัด Kafka ออกจาก critical path แล้ว load test ยืนยันที่ 300 cmd/s ถ้าไม่ผ่านค่อยเพิ่ม queue | L1345–1385, L2157–2162, L2250–2252, L2290 |
| 5 | **ตารางเวลาของ Roadmap ไม่ตรงกับปฏิทินจริง:** (ก) R1.0 Admissions ที่ M9 = ธ.ค. 2570 แต่รอบโควตาของปีการศึกษา 2571 น่าจะประกาศราว ก.ย. 2570 (เทียบประกาศ 22 ก.ย. 2569 ใน L100) (ข) Wave 2 go-live ที่ M23 = ก.พ. 2572 ตกกลางภาค 2 ขัดกับ L2545 (ค) R1.1 ที่ M15 = มิ.ย. 2571 ตรงกับวันเปิดภาค 1/2571 พอดี จึงไม่มี buffer | **High** | ตรึงวันจากปฏิทินจริงใน Phase 0 แล้วกำหนด MS-1 ≤ M5 (ส.ค. 2570) หรือยอมให้รอบรับสมัครแรกของปี 2571 ใช้ระบบเดิมและเริ่มจากรอบหลัง กำหนด go-live academic core ของ pilot ไม่น้อยกว่า 6–8 สัปดาห์ก่อนวันลงทะเบียน และย้าย Wave 2 ไปขอบภาค (~M27 หรือ ต.ค.–พ.ย.) | L100, L2545–2576, L2583–2585 |
| 6 | **Phase 1 มี scope ใหญ่เกินไป:** ใน 12 เดือนต้องทำ IAM+ThaID, ORG, NOTI, Audit, Consent, Admin console, ADM, CUR, REG, ASM, REC, FIN (QR+e-Receipt+recon), SCH, LMS, W-01..W-11, ATH lite, analytics และ migration ของ 2 วิทยาเขต รวม 15+ bounded contexts พร้อม platform ใหม่ทั้งหมด ด้วย 41 FTE ที่ยังต้องสร้างทีม | **High** | แยก Phase 1 เป็น "R1.0 Admissions+Identity+Finance-lite" และ "R1.1 Records/Registration/Grading/Finance" แล้วเลื่อน ATH lite, analytics, Admin console เต็มรูปแบบ (ใช้ Keycloak admin + GitOps ไปก่อน), PAM/JIT UI และ consent center ขั้นสูงไป Phase 2 กำหนด MVP ตามกระบวนงานที่ต้องมีจริงในภาคแรก | L2550, L2620–2636 |
| 7 | **Migration/cutover ยังไม่มี parallel run และ rollback:** เอกสารมีเพียง "parallel read" (ระบบเดิม read-only, L1952) ซึ่งไม่ใช่ parallel run และไม่มีแผนย้อนกลับเมื่อ go-live ล้มเหลวหลัง freeze ระบบเดิม รวมทั้งไม่ระบุที่เก็บธุรกรรมการเงินย้อนหลังที่ไม่ได้ migrate (L1948) | **High** | (1) **Shadow run 1 ภาค**: คำนวณ GPA/standing/invoice ในระบบใหม่ขนานกับระบบเดิมแล้วเทียบผล (2) กำหนด rollback window และ reverse-delta tooling (3) ใช้ legacy archive แบบ query ได้ (Parquet + read-only UI) พร้อม retention (4) go/no-go scorecard ต่อ wave ที่มีเกณฑ์เชิงตัวเลข | L1921–1952 |
| 8 | **Reporting/document engine สำหรับเอกสารราชการไทยยังไม่ได้เลือกและยังไม่มี NFR:** ปพ.1/ปพ.2 (โรงเรียนกีฬา), transcript กระดาษ, ใบรับรองสถานภาพ, ใบเสร็จ, คำสั่ง/ประกาศ และรายงาน สป.อว. เป็น deliverable ที่ผู้ใช้เห็นมากที่สุด แต่ไม่มี template engine, การรองรับ Thai shaping/line-breaking ใน PDF (สระลอย/วรรณยุกต์ซ้อน, ICU word break), PDF/A-3 + PDF/UA และขั้นตอน versioning ของ template | **High** | เพิ่ม ADR "Document generation" เพื่อเลือก engine ที่ทดสอบภาษาไทยแล้ว (เช่น JasperReports + ฟอนต์ฝัง, Typst, docx-template→PDF, Carbone [ต้องตรวจสอบ]) พร้อม golden-file visual tests ของเอกสารไทย, template registry ราย OrgUnit/ParentAgency และ performance batch | L971, L1211, L2283, L2312, L914 |
| 9 | **ความเสี่ยงด้าน license ของ OSS และใช้เกณฑ์ไม่สม่ำเสมอ:** ตัด Redpanda ด้วยเหตุผล BSL (L2061, L2126) แต่เลือก HashiCorp Vault (BSL ตั้งแต่ 2023) และ Terraform (BSL); Teleport Community Edition จำกัดการใช้ในองค์กรขนาดใหญ่ [ต้องตรวจสอบ]; MinIO community ลดฟีเจอร์และเปลี่ยนรูปแบบการแจกจ่าย [ต้องตรวจสอบ]; Flowable 7 open source ไม่มี UI apps แล้ว (Design/Admin เป็น commercial) [ต้องตรวจสอบ]; Redis 7.4+ ไม่ใช่ OSI license | **High** | ทำ "OSS license register" ใน Phase 0 ให้ฝ่ายกฎหมายตรวจ และเลือกตัวที่เป็น OSI-approved โดยค่าเริ่มต้น ได้แก่ **OpenBao, OpenTofu, Valkey, object storage ของ GDCC หรือ Ceph RGW/Garage** และ PAM ที่ license ชัด ส่วน Flowable ให้ใช้ engine + modeler ที่ไม่ผูก commercial UI หรือเผื่องบ subscription | L1275, L2054, L2061–2064, L2070–2073, L2126, L2166 |
| 10 | **RLS เป็นการป้องกันชั้นเดียวข้ามวิทยาเขต แต่มีช่องโหว่ทางเทคนิคที่ยังไม่ได้ระบุ:** (ก) PgBouncer transaction pooling + `app.org_scope` ต้องใช้ `SET LOCAL`/`set_config(...,true)` มิฉะนั้น scope จะรั่วข้าม request (ข) app role ต้องไม่เป็น table owner/BYPASSRLS (ค) Debezium/CDC, Kafka topics, ClickHouse raw และ Superset **SQL Lab** อยู่นอก RLS ทั้งหมด (ง) หลายตาราง (PERSON, ENROLLMENT, GRADE, INVOICE, PAYMENT, CONSENT) ไม่มี `org_unit_id` ใน ER ทั้งที่ L1841 บอกว่าทุกตารางต้องมี | **High** | ระบุ RLS implementation contract (SET LOCAL, FORCE ROW LEVEL SECURITY, role ไม่มี BYPASSRLS, test แบบ cross-tenant fuzz ใน CI) เพิ่ม `org_unit_id` แบบ denormalised ในตาราง transactional ปิด SQL Lab สำหรับผู้ใช้ทั่วไป ใช้ Kafka ACL/encryption และกำหนดเรื่อง RLS ของ warehouse เป็น requirement แยก | L1841, L1917, L2068, L2104–2106, L1540–1833 |

---

## 2. Findings Table (ละเอียด)

> Severity: **Critical** = ขัดขวาง go-live หรือเสี่ยงสูญเสียข้อมูลหรือระบบล้มหลังส่งมอบ · **High** = ต้องแก้ก่อน TOR/Phase 1 · **Medium** = ต้องแก้ก่อน rollout · **Low** = ปรับปรุงได้ตามรอบ

### 2.1 Architecture และ right-sizing

| ID | ประเด็น | ทำไมสำคัญ | Sev | ข้อเสนอ (concrete) | ตำแหน่ง |
|---|---|---|---|---|---|
| ARCH-01 | Kafka (Strimzi, KRaft 3 brokers/site, MirrorMaker 2, Apicurio, Debezium) ใช้เป็น event bus หลักที่ภาระเพียงหลักสิบ event/s | Kafka เป็น component ที่ operate ยากที่สุดในชุด (upgrade, partition rebalancing, MM2 offset translation ตอน DR) และทีม มกช. ไม่น่ามีทักษะ ขณะที่ Spring Modulith มี JDBC event publication registry อยู่แล้ว | High | Phase 1–3: ใช้ Spring Modulith event publication registry (PostgreSQL) + in-process listeners + outbox relay แบบ polling ไปยัง adapters/notification ส่วน analytics ใช้ batch ELT รายชั่วโมงจาก read replica พิจารณา Kafka ใหม่เมื่อ event > 500/s ต่อเนื่อง หรือมี consumer ภายนอก ≥ 5 ราย (ใส่เป็นเกณฑ์ใน ADR-006) | L56, L1219, L2061, L2122–2127, L2290 |
| ARCH-02 | ClickHouse + Keeper + dbt + Superset + Metabase + OpenMetadata สำหรับข้อมูลวิชาการ ~200k แถว/ปี และ athlete time-series 2–50M แถว/ปี | ข้อมูลขนาดนี้ PostgreSQL ที่ partition (หรือ TimescaleDB [ต้องตรวจสอบ license TSL ของบาง feature]) รองรับได้ ClickHouse เพิ่ม SQL dialect อีกชุด ต้องทำ row policy ซ้ำ และต้องดูแล Keeper | Medium | ใช้ PostgreSQL analytics instance แยก + dbt + **Superset ตัวเดียว** (ตัด Metabase) และใช้ dbt docs แทน OpenMetadata จนถึง Phase 4 ย้ายไป ClickHouse เมื่อ dashboard p95 > 3 s ที่ข้อมูลจริง | L982, L2067–2069, L2129–2134, L2268 |
| ARCH-03 | OpenSearch ×3 ใช้ทั้ง search, log และ audit ขณะที่ log ใช้ Loki อยู่แล้ว (L2075) | ทำงานซ้ำซ้อน และ cluster ที่เป็น stateful ต้องดูแลเพิ่ม ข้อมูลที่ต้องค้นหามีเพียงหลักแสน record | Medium | ค้นหานักศึกษา/รายวิชาด้วย PostgreSQL FTS + `pg_trgm` + ICU collation, ใช้ Loki สำหรับ log และค้น audit ใน PostgreSQL partition หรือ Wazuh indexer (ถ้ามี SIEM) ตัด OpenSearch ใน Phase 1–3 | L1015, L1004, L1220, L2065 |
| ARCH-04 | Health vault เป็น PostgreSQL cluster แยก (Patroni + standby + DR) "พร้อม TDE" | Community PostgreSQL ไม่มี TDE (มีใน EDB/Percona/Cybertec เท่านั้น) [ต้องตรวจสอบ] การแยก cluster เพิ่มภาระ ops ราว 1/3 โดยที่ field-level encryption ทำหน้าที่ป้องกันหลักอยู่แล้ว | Medium | ใช้ database แยก (หรือ instance แยกบน Patroni ชุดเดียวกัน) + credential/NetworkPolicy แยก + field-level encryption + volume encryption แก้ข้อความ "TDE" ให้ถูกต้อง หรือระบุ distribution ที่มี TDE | L1217, L1877, L2173 |
| ARCH-05 | Mobile: Flutter app + PWA + Next.js portal + back-office เท่ากับมี 3 client surfaces ใน 2 ภาษา (Dart/TS) | ทีม frontend ต้องแบ่งเป็นสองชุด ค่า handover สูง ต้องดูแลการ release ผ่าน app store และ backward compatibility ของ API กับ app version เก่า | Medium | Phase 1–2: Next.js responsive + PWA (offline ด้วย IndexedDB/Service Worker สำหรับกรรมการทดสอบทักษะ/นิเทศ) + LINE OA/LIFF ส่วน Flutter ให้พิจารณาใน Phase 3 (athlete wellness รายวัน/offline หนัก) หลังวัด adoption | L1191, L2058, L2136–2141 |
| ARCH-06 | Service mesh (Linkerd/Cilium mTLS), Argo Rollouts canary, Unleash, Kyverno, Falco, cosign, SLSA L2 ถูกกำหนดทั้งหมดตั้งแต่แรก | ทุกตัวมีเหตุผลรองรับ แต่เมื่อรวมกันแล้วเป็นงาน platform engineering ที่ต้องมีคน 2–3 FTE ตลอดเวลา | Medium | แบ่งเป็น Tier: **Must** (NetworkPolicy default-deny, image scan, signed images, Kyverno baseline) และ **Later** (Falco, mesh mTLS ใช้ Cilium WireGuard แทนถ้า CNI รองรับ, Argo Rollouts) ส่วน feature flag ใช้ OpenFeature + flagd/ไฟล์ config ก่อน | L2076, L2078, L2395–2398, L2482 |
| ARCH-07 | Flowable: embedded + "Flowable Design/Admin UI" + CMMN | Flowable 7 OSS ตัด UI apps (modeler/admin/task) ออกแล้ว [ต้องตรวจสอบ] จึงอาจต้องซื้อ Flowable Enterprise ส่วน CMMN ยังไม่มี use case | High | ระบุใน ADR-012 ว่าจะใช้ modeler ตัวใด (Flowable OSS เวอร์ชันเก่า/bpmn-js + Flowable extension/commercial) พร้อมงบ ตัด CMMN และตั้งกติกา process versioning สำหรับ instance ที่ค้าง | L1209, L1275, L2054, L2164–2168 |
| ARCH-08 | ใช้ 1 deployment สำหรับ 30 OrgUnit ซึ่งทำให้ blast radius ของ release เท่ากับทั้งมหาวิทยาลัย แต่ canary 10% แบ่งตาม traffic (L2482) ไม่ได้แบ่งตาม OrgUnit | bug ใน policy/fee ของวิทยาเขตหนึ่งอาจกระทบทุกแห่งพร้อมกัน และ canary แบบสุ่ม traffic ทำให้ผู้ใช้คนเดียวเห็น 2 version | Medium | ทำ **ring deployment ตาม OrgUnit** ผ่าน feature flag (pilot ring → wave rings) ส่วน code canary ใช้ sticky session ต่อผู้ใช้ และทำ kill-switch ราย module/OrgUnit | L48, L74, L2478–2485 |
| ARCH-09 | API versioning มีเพียง `/api/v{n}` (ADR-017) แต่ไม่มี deprecation policy, ช่วงสนับสนุนของ mobile app version และ forced-upgrade | app บนเครื่องนักศึกษาที่ไม่ได้อัปเดตจะพังเมื่อ API เปลี่ยน event schema มี registry แต่ไม่มีกติกา breaking change | Medium | กำหนด: รองรับ N-1 major ≥ 12 เดือน, header `Sunset`/`Deprecation`, minimum-app-version endpoint, contract tests (Pact) ระหว่าง BFF/app และ AsyncAPI compat check ใน CI | L2033, L2194–2197, L2042 |
| ARCH-10 | Multi-tenancy edge cases ยังไม่ได้ออกแบบ: ย้ายวิทยาเขต (ประวัติเก่าอยู่ใต้ OrgUnit เดิม), ลงเรียนข้ามวิทยาเขต/online section, บุคลากรหลายวิทยาเขต, โปรแกรมบัณฑิตศึกษาระดับมหาวิทยาลัย, PERSON ที่ใช้ร่วม (นักเรียนโรงเรียนกีฬาที่มาเป็นนักศึกษา), ผู้ปกครองที่มีบุตรหลายโรงเรียน | RLS แบบ `org_unit_id = ANY(scope)` จะซ่อนประวัติเดิมจากนายทะเบียนวิทยาเขตใหม่ หรือเปิดกว้างเกินไปถ้าแก้ด้วยการขยาย scope | High | เพิ่มหัวข้อ "Tenancy rules" ที่มี matrix ของ ownership vs visibility (owning_org vs serving_org), กำหนด PERSON ให้เป็น shared + visibility ผ่าน relationship และทำ test case ของ edge case ทั้ง 6 ข้อใน RLS suite | L1497–1511, L1836–1841, L2104 |
| ARCH-11 | Offline และการเชื่อมต่อไม่ดีที่วิทยาเขต/โรงเรียนต่างจังหวัด: มีกล่าวถึง offline เฉพาะ tablet ทดสอบทักษะและนิเทศ (L463, L782) แต่ไม่มี conflict resolution, page-weight budget, resumable upload และ fallback เมื่อ WAN ของวิทยาเขตล่ม | ผู้สมัครอัปโหลดวิดีโอ 200 MB (L2267) ผ่าน 4G ต่างจังหวัดจะล้มเหลวบ่อย และเจ้าหน้าที่ทั้งวิทยาเขตจะทำงานไม่ได้เมื่อ link ล่ม | Medium | กำหนด: JS budget ≤ 200 KB/route, LCP ≤ 2.5 s บน Android ระดับล่าง + 3G profile, **tus resumable upload**, offline sync protocol (client-generated UUIDv7, last-writer + server-side validation, conflict queue), RUM แยกตามวิทยาเขต และ manual fallback procedure (แบบฟอร์มกระดาษ + ช่องทาง import) สำหรับ score entry และ check-in | L198, L463, L782, L2058, L2267, L2281 |

### 2.2 Capacity, SLO, RPO/RTO

| ID | ประเด็น | ทำไมสำคัญ | Sev | ข้อเสนอ | ตำแหน่ง |
|---|---|---|---|---|---|
| NFR-01 | ตัวเลขใน 9.3 คำนวณถูกต้องทางเลขคณิต (ตรวจซ้ำในหัวข้อ 3) แต่ **headroom ซ้อนกันหลายชั้น** (N 15,000 vs 12,300 = 1.22× → ×1.3 multi-tab → active 6,000 vs 3,200 = 1.9× → cmd 300 vs 60 = 5×) จึงมี headroom สะสม ~25× เทียบค่าเฉลี่ย และใช้ worst case "เปิดพร้อมกัน 17 วิทยาเขต" ทั้งที่ ADR-011 เสนอ staggered window | ทำให้ sizing (16 nodes peak, 20 reg pods, Kafka 48 partitions) และค่า infra สูงเกินจำเป็น | Medium | ตั้ง staggered window ราย OrgUnit/ชั้นปีเป็น **ค่าเริ่มต้นทางนโยบาย** (ไม่ใช่ option) แล้ว sizing ที่ 2× ของ peak จาก log จริง (Q-28) ร่วมกับ load test 5× ส่วน Kafka 48 partitions ให้ตัด (ดู ARCH-01) | L63, L161, L2241–2268, L2290 |
| NFR-02 | ภาระที่ยังไม่ได้นับ: (ก) **polling สถานะ command** (L1383) ถ้าผู้ใช้ active 3,200 คน poll ทุก 2 s จะได้ +1,600 RPS เกินสมมติฐาน "1 req/4 s" (ข) **วันประกาศเกรด** ที่ push ถึงทุกคนพร้อมกันจะทำให้ผู้ใช้เปิดแอปพร้อมกัน (self-inflicted thundering herd โดยเฉพาะ P0 ที่ต้องส่ง 25,000 คนใน 60 s) (ค) deadline ส่งเกรดของอาจารย์ (ง) bot/script แย่งที่นั่ง | load จริงอาจเกินที่ออกแบบในจุดที่ไม่มี waiting room คุม | Medium | ใช้ SSE/long-poll ที่ backoff ≥ 5 s, ทยอย push เป็น batch (เช่น 2,000/นาที) สำหรับเรื่องที่ไม่ใช่ P0, pre-warm cache ของหน้าเกรด, ทำ load test scenario "grade release" และ "admission result", กำหนด per-user command quota + device binding + bot detection ใน waiting room | L1065, L1073, L1383, L2249–2255 |
| NFR-03 | **ความเป็นธรรมของคิวสำหรับผู้ใช้ต่างจังหวัด:** waiting room เรียงตามเวลามาถึง ผู้ที่อยู่ใกล้ edge/เครือข่ายเร็วจะได้เปรียบ | ประเด็นความเป็นธรรมนี้อาจกลายเป็นเรื่องร้องเรียนของวิทยาเขตภูมิภาค | Low | ทำ **pre-queue randomisation** (ทุกคนที่เข้ามาก่อนเวลาเปิดได้ลำดับสุ่ม) และเปิดเผยกติกาคิว | L1358–1361, L2160 |
| NFR-04 | SLO 99.95% สำหรับ portal ในช่วงวิกฤต (≤ 5 นาที/7 วัน ตรวจแล้วถูกต้อง: 10,080 × 0.0005 = 5.04 นาที) ไม่สอดคล้องกับ dependency chain ที่ต่อแบบ serial (WAF → APISIX → core → PG → Redis และ Keycloak ตอน login) ซึ่งถ้าแต่ละตัวอยู่ที่ 99.95% จะได้รวม ≈ 99.80% Patroni failover 1 ครั้ง (≤ 2 นาที) ใช้ budget ไปครึ่งหนึ่ง และ DR failover 1 ครั้ง (≤ 1 ชม.) เกิน budget ราว 12 เท่า | สัญญา MA จะมีค่าปรับที่ vendor ไม่สามารถทำได้จริง หรือ vendor จะตั้งราคาเผื่อความเสี่ยงไว้สูง | High | กำหนด SLO **ราย user journey** (login, ดูเกรด, ลงทะเบียน, ชำระเงิน) วัดจาก synthetic ภายนอก ตั้งช่วงวิกฤตที่ 99.9% พร้อม error-budget policy (freeze + postmortem) และแยก SLA เชิงสัญญาออกจาก SLO ภายใน ส่วน payment callback ใช้ "bank retry + statement reconcile" แทนการสัญญา 99.95% | L2213–2225, L2537 |
| NFR-05 | RTO ransomware ≤ 4 ชม. (L2235) นับเฉพาะการ restore DB แต่กรณีที่ platform ถูกยึด (K8s/Vault/Keycloak/GitLab ถูก compromise) ต้อง rebuild ใน clean room และทำ forensic ซึ่งตามประสบการณ์ใช้เวลา 24–72 ชม. | ผู้บริหารจะเข้าใจผิดว่ากู้ได้ใน 4 ชม. | Medium | แยกเป็น 2 scenario: "logical corruption" (RTO 4 ชม.) และ "platform compromise" (RTO 48–72 ชม. + ขั้นตอนบริการขั้นต่ำ เช่น หน้าประกาศสถิต, ขยาย deadline) ซ้อม rebuild-from-IaC ใน DR site ปีละครั้ง | L2235, L2333 |
| NFR-06 | DR async RPO ≤ 5 นาที (L2234) กับ **gapless receipt numbering** (L1866) และ e-Receipt ที่ส่งให้นักศึกษาแล้ว: เมื่อ failover ข้อมูลช่วง ≤ 5 นาทีหายไป แต่ PDF ใบเสร็จ/คำยืนยันลงทะเบียนอยู่ในมือผู้ใช้แล้ว ทำให้เลขซ้ำหรือมีช่องว่าง | กรณีนี้เป็นประเด็นที่ สตง. ตรวจพบได้ และสร้างความสับสนเรื่องสิทธิ์ที่นั่ง | Medium | runbook หลัง failover: (1) จองช่วงเลขใหม่ (เช่น prefix/epoch ใหม่) ห้ามใช้เลขซ้ำ (2) reconcile จาก statement ธนาคาร + outbox ที่ mirror แล้ว (3) ตรวจเอกสารที่ออกในช่วง RPO window จาก log ของ NOTI/e-mail หรือพิจารณา sync replication ข้าม site สำหรับ schema `fin` ถ้า latency < 5 ms | L1866, L2234, L1407–1409 |
| NFR-07 | GDCC feasibility: ADR ต้องการ managed K8s, multi-zone, Object Lock, HSM, GSLB และ 2 site แต่ยังไม่ทราบว่า GDCC มีอะไร (R-11) ถ้า GDCC ให้เพียง VM ทีมต้องรัน RKE2 + storage + LB เองทั้งหมด | ภาระ ops และ RTO/RPO ทั้งหมดอาจเป็นไปไม่ได้ | High | ทำ GDCC technical spike ใน M1–M2 (สร้าง cluster จริง, ทดสอบ Object Lock, latency ข้าม site, HSM/PKCS#11, egress ไป ThaID/ธนาคาร) และเขียน decision tree: managed K8s → K8s บน VM (vendor managed service 5 ปี) → Thai CSP ใส่ผลไว้ใน MS-0 | L163, L2150–2155, L2233, L2605 |

### 2.3 Security

| ID | ประเด็น | ทำไมสำคัญ | Sev | ข้อเสนอ | ตำแหน่ง |
|---|---|---|---|---|---|
| SEC-01 | **Grade tampering:** มี SoD/4-eyes ระดับ workflow แต่ DBA/SRE ที่ได้ JIT ยังแก้ตาราง `asm.grade` ได้โดยตรง (ข้อห้ามของ DBA ครอบคลุมเฉพาะตาราง sensitive, L646) นอกจากนี้ไม่มี integrity check ระหว่างเกรดที่อนุมัติกับเกรดใน transcript และ audit อยู่ระดับ application (bypass ได้ด้วย SQL) | เกรดเป็น asset ที่มีแรงจูงใจทุจริตสูงสุด (ทุน กยศ. พ้นสภาพ เกียรตินิยม) | High | (1) **pgaudit + trigger** บนตาราง grade/standing/invoice ที่เขียนไปยัง WORM แยกจาก app (2) เก็บ **signed GradeSubmission snapshot** (hash ของชุดเกรดที่อนุมัติ ลงนามโดย signing service) และ job รายคืนเทียบ hash กับข้อมูลปัจจุบัน แล้วแจ้งเตือนเมื่อไม่ตรง (3) DBA JIT สำหรับ schema `asm/rec/fin` ต้องเป็น read-only เป็นค่าเริ่มต้น ส่วน write ต้องเป็น data-fix request แบบ 4-eyes (4) e-Transcript ลงนามจาก snapshot ไม่ใช่จาก live query | L471–472, L609–610, L646, L1004, L2199–2202 |
| SEC-02 | **Payment/refund fraud:** callback, mTLS, idempotency และ 3-way recon ทำได้ดี แต่ยังขาด: การคืนเงินไปบัญชีที่ไม่ใช่ของผู้จ่าย, fee waiver ที่ไม่มี SoD (SoD-01..09 ไม่ครอบคลุม Waiver), QR ปลอมใน phishing, ยอดชำระไม่ตรงกับ invoice (partial/over) และการแก้ Biller ID/บัญชีรับเงิน | การเงินคือ asset ที่ สตง. ตรวจ และ insider fraud แบบ refund/waiver เกิดบ่อยในหน่วยงานรัฐ | High | เพิ่ม SoD-10 (ผู้ให้ waiver ≠ ผู้อนุมัติ, มีเพดานวงเงิน), refund ไปบัญชีที่ผ่านการยืนยันชื่อบัญชี (account-name inquiry) ตรงกับนักศึกษาหรือผู้ปกครองที่ผูกไว้ หรือกลับไปช่องทางเดิม, cooling period เมื่อเปลี่ยนบัญชีรับเงินคืน, QR แสดงชื่อ biller ที่ verify ได้ + ให้ความรู้ผู้ใช้, กติกา partial/over-payment และ anomaly rule (refund สูงผิดปกติ/ถี่) | L582, L607–617, L848, L1403–1417 |
| SEC-03 | **Account takeover ของนักศึกษา/ผู้ปกครอง:** MFA บังคับเฉพาะบุคลากร (L758) ส่วนนักศึกษาไม่ระบุว่าใช้วิธี login แบบใด, Helpdesk L1 reset MFA ได้ (L648, L2525) ซึ่งเปิดช่อง social engineering และการผูก guardian ที่ใช้การตรวจเอกสารยังไม่มีขั้นตอนป้องกันการปลอมตัวเป็นผู้ปกครอง | บัญชีนักศึกษาใช้ลงทะเบียนเรียน ถอนวิชา ขอคืนเงิน และเปลี่ยนบัญชีรับเงินได้ ส่วนบัญชีผู้ปกครองปลอมทำให้คนนอกเข้าถึงข้อมูลเด็กได้ | High | นักศึกษาใช้ passkey/WebAuthn หรือ OTP สำหรับ action เสี่ยง (step-up: ถอน, คืนเงิน, เปลี่ยนบัญชี/อีเมล), แจ้งเตือนทุกช่องทางเมื่อเปลี่ยน credential, MFA reset ต้องยืนยันด้วย ThaID หรือมาแสดงตัวพร้อมบัตร (บันทึกเหตุผล + 2nd approver), guardian linking ต้องผ่าน 2 ช่องทาง (เอกสาร + ยืนยันจากโรงเรียน) และมี cooling period | L421–422, L648, L758, L2146, L2392 |
| SEC-04 | **Minors' safeguarding:** PDPA ผู้เยาว์ทำไว้ดี แต่ยังไม่มีมาตรการป้องกันการสื่อสารแบบ 1:1 ระหว่างผู้ใหญ่ (โค้ช/ครู/บุคลากร) กับนักเรียนผู้เยาว์ (grooming risk) และไม่มีนโยบาย LINE/ภาพถ่ายในหอพัก | โรงเรียนกีฬาแบบประจำมีความเสี่ยงด้าน child safeguarding สูง | Medium | กำหนดว่าไม่มี private DM ระหว่างผู้ใหญ่กับผู้เยาว์ในแพลตฟอร์ม (ข้อความต้อง cc ผู้ปกครองหรือครูประจำชั้น/อยู่ในกลุ่ม), มี audit + report-abuse button, และระบบไม่ส่งข้อมูลส่วนบุคคลของผู้เยาว์ไปยัง LINE | L201–202, L1081–1087, L1466 |
| SEC-05 | **Insider/bulk exfiltration:** Superset ระบุ "SQL Lab" เป็นจุดเด่น (L2068) ซึ่งเปิดให้ query ข้อมูลดิบนอก RLS และ export ได้, รายงาน CSV/PDF ไม่มี watermark และไม่มี export quota ส่วน UEBA ถูกกล่าวถึงแต่ยังไม่มี use case | การรั่วไหลจาก insider เป็นสาเหตุหลักของ PDPA breach ในหน่วยงานรัฐ | High | ปิด SQL Lab (เปิดเฉพาะ data team ผ่าน JIT), export ข้อมูลบุคคล > N แถวต้องมี purpose + อนุมัติ + watermark (ชื่อผู้ดึง/เวลา) และกำหนด UEBA rules ขั้นต่ำ 10 ข้อ (bulk read, off-hours, ข้ามวิทยาเขต, อ่าน vault ไม่มี care relationship ฯลฯ) | L1917–1918, L2068, L2399 |
| SEC-06 | **SIEM/SOC:** ระบุ Wazuh/OpenSearch Security Analytics แต่ไม่มีผู้เฝ้าระวัง 24×7 และไม่มี detection use cases, log source list หรือ MTTD/MTTR target ขณะที่ helpdesk ทำงานเวลาราชการ (A-29) | ถ้าไม่มีคนดู alert ก็ไม่มีความหมาย และภาระตาม พ.ร.บ.ไซเบอร์/ประมวลแนวทาง สกมช. ต้องตรวจจับและรายงานเหตุได้ | High | ใช้ **MSSP/SOC ของ GDCC หรือผู้ให้บริการไทย** ใน TOR (24×7, MTTD ≤ 15 นาทีสำหรับ critical), ส่ง log ตาม list ขั้นต่ำ (WAF, Keycloak, K8s audit, PG audit, Vault audit, PAM, app audit) และทำ detection-as-code พร้อม test | L645, L1008, L2399, L2513 |
| SEC-07 | **Incident response vs PDPA 72 ชม./NCSA:** runbook ดี แต่ยังขาด (ก) ข้อผูกพันให้ processor (vendor/GDCC) แจ้ง มกช. "โดยไม่ชักช้า" เช่น ≤ 24 ชม. (ข) กรอบเวลาแจ้ง สกมช./หน่วยงานกำกับ [ต้องตรวจสอบ] (ค) ช่องทางและแบบฟอร์มสื่อสารกับผู้ปกครองของผู้เยาว์ (ง) การซ้อม breach drill ที่มีกำหนดการ | นาฬิกา 72 ชม. เริ่มนับเมื่อ controller ทราบ ถ้า vendor แจ้งช้าก็ทำให้ มกช. ผิดเวลา | Medium | เพิ่ม clause ใน DPA (vendor → มกช. ≤ 24 ชม. + ข้อมูลขั้นต่ำ), RACI ของ IC/DPO/ผู้บริหาร/ประชาสัมพันธ์, template แจ้ง สคส./เจ้าของข้อมูล/ผู้ปกครองที่เตรียมไว้ล่วงหน้า และ tabletop breach drill ปีละ 2 ครั้ง (ครั้งหนึ่งต้องเป็นกรณีข้อมูลผู้เยาว์) | L2513, L2518, L2356 |
| SEC-08 | **Backup immutability/ransomware:** มี Object Lock แต่ยังไม่ระบุ compliance mode vs governance mode, ไม่แยก credential/tenant ของ backup และไม่มี offline/air-gapped copy (3-2-1-1-0) ส่วน backup ไม่ครอบคลุม **GitLab (source + CI), container registry, Vault, Argo CD config, Terraform state** | ถ้า admin credential ของ object storage ถูกยึด backup แบบ governance mode ลบได้ และถ้า Git/registry หาย จะ rebuild จาก IaC ไม่ได้ | High | Object Lock แบบ **compliance mode** ใน account/tenant แยก, สำเนา offline รายเดือน (tape/disk ที่ มกช. ถือ), ขยายตาราง 11.4 ให้ครอบคลุม GitLab, registry (Harbor), Vault snapshot, TF state, Keycloak realm และกำหนด "0 error" restore verification อัตโนมัติ | L2491–2500, L2489 |
| SEC-09 | **Crypto-shredding กับ backup 7 ปี:** DEK ต่อบุคคลที่ห่อแล้ว (wrapped) เก็บใน DB ซึ่งอยู่ใน backup รายปี 7 ปี (L1898) ทำให้การ "crypto-shred" ใน prod ไม่ได้ลบข้อมูลจริงจนกว่า backup หมดอายุ | ขัดกับ retention "ระยะศึกษา + 5 ปี" และคำขอลบตาม PDPA | Medium | เก็บ DEK ใน key store แยก (Vault transit/KV ที่มี retention สั้นกว่า backup DB) หรือเขียนใน ROPA ให้ชัดว่า backup คือ "beyond use" และหมดอายุตามรอบ พร้อมขั้นตอนไม่ restore รายการที่ shred แล้ว (tombstone list) | L1877, L1891–1898, L2173 |
| SEC-10 | **HMAC เลขบัตร 13 หลัก:** keyspace ราว 10¹² ทำให้ brute force ได้ถ้า HMAC key รั่ว ซึ่ง key ถูกใช้ทั้งใน Keycloak และ DB | pid HMAC ไม่ได้ปกป้องอะไรถ้า key อยู่ใน config ของหลายระบบ | Low | เก็บ HMAC key ใน HSM/Vault transit (ไม่ export), แยก key ต่อ context (Keycloak vs core) และ rotate แบบมี versioned lookup | L1543, L1860, L2146 |
| SEC-11 | **Signing key/HSM governance:** ยังไม่ระบุว่าใครเป็นเจ้าของใบรับรอง (นิติบุคคล มกช. หรือรายบุคคลของนายทะเบียน/อธิการบดี), ใครอนุมัติ batch signing และงบ HSM ทั้ง 2 site | e-Transcript/คำสั่งที่ลงนามผิดคน เป็นปัญหาทางกฎหมาย | Medium | ADR "Signing model" ที่กำหนด org seal vs personal signature ต่อประเภทเอกสาร, dual control ของ batch signing, HSM ทั้ง 2 site (หรือ Cloud HSM ในไทย) และ timestamp authority | L178, L837, L1274, L2376 |
| SEC-12 | **Cross-border ที่ยังซ่อนอยู่:** หลักใน L2351 ห้าม SaaS ต่างประเทศสำหรับ PII แต่ออกแบบให้ใช้ Google Workspace/M365 (mailbox นักศึกษา), FCM/APNs, LINE และ SMTP/SMS ภายนอก | อีเมลนักศึกษาที่อยู่บน M365/Google เป็นการโอนข้อมูลข้ามประเทศ | Medium | ทำ cross-border assessment ราย processor ใน ROPA, จำกัด payload ของ push/LINE ให้ไม่มี PII (ทำแล้วบางส่วน L960) และระบุใน TOR ว่า mailbox ต้องใช้ region/สัญญาที่สอดคล้อง | L762, L960, L2351 |
| SEC-13 | **Zero trust/staff access:** back-office ของเจ้าหน้าที่เปิดสู่ internet ด้วย MFA (ยอมรับได้) แต่ไม่มี session/device posture, session lifetime ของเจ้าหน้าที่ที่ถือข้อมูล confidential และ IP anomaly | เจ้าหน้าที่ใช้เครื่องสาธารณะในวิทยาเขต | Low | session ผูก device, re-auth ทุก 8 ชม., step-up เมื่อ export, แจ้งเตือน login จาก ASN ต่างประเทศ | L2146, L2392 |
| SEC-14 | **PAM ด้วย Teleport Community** มีข้อจำกัด license สำหรับองค์กรขนาดใหญ่ [ต้องตรวจสอบ] และเพิ่ม component ที่ critical | อาจผิดเงื่อนไข license ในงานภาครัฐ | Medium | ประเมินทางเลือก: PAM ของ GDCC/MSSP, JumpServer (GPL), Teleport Enterprise (มีงบ) หรือ bastion + Keycloak OIDC + K8s audit + session recording ของ `kubectl`/psql proxy | L1024, L2071, L2201 |

### 2.4 Data

| ID | ประเด็น | ทำไมสำคัญ | Sev | ข้อเสนอ | ตำแหน่ง |
|---|---|---|---|---|---|
| DATA-01 | **Audit "ทุก read ของ confidential"** (L1004) ขัดกับ 6.4 ที่ระบุว่า audit เฉพาะ "การอ่านแบบรายการ (bulk)" (L1876) ถ้า log ทุก read ของเกรดจะมี volume สูงมาก (นักศึกษาเปิดดูเกรดตัวเอง) | กระทบ storage, performance และความสามารถในการค้นหา | Medium | นิยามระดับ audit: sensitive = ทุก read, confidential = read ของคนอื่น (ไม่ใช่ own) + bulk, own-read = sampling/aggregate | L1004, L1876 |
| DATA-02 | **CDC ส่งทุก schema เข้า Kafka/ClickHouse** (L985, L1904) ขัดกับหลัก "event ไม่บรรจุข้อมูล sensitive" (L2042) เพราะ confidential PII (ที่อยู่, ผู้ปกครอง, กยศ.) จะอยู่ใน Kafka topics, ClickHouse raw และ Parquet ใน S3 ซึ่งไม่มี RLS | เพิ่ม attack surface และสำเนาข้อมูล PII ที่ไม่มีใครเป็นเจ้าของ | Medium | ทำ column allow-list ที่ CDC (ส่งเฉพาะคอลัมน์ที่ analytics ใช้), ทำ pseudonymise ตั้งแต่ ingestion, เข้ารหัส topics/Parquet และกำหนด retention ของ raw layer (ถ้าใช้ ARCH-02 ปัญหานี้จะลดลงมาก) | L985, L1904–1912, L2042 |
| DATA-03 | **Legacy data archival:** ไม่ migrate ธุรกรรมการเงินย้อนหลัง (เก็บเป็น "archive อ่านอย่างเดียว", L1948) และระบบเดิม read-only 1 ภาคแล้ว archive (L1952) แต่ไม่ได้ระบุรูปแบบ, ที่เก็บ, สิทธิ์ และวิธีตอบคำขอ สตง./DSR จากข้อมูล archive | ข้อมูล ≥ 10 ปีจาก 17+13 แหล่ง ต้องค้นได้ตาม retention (การเงิน 10 ปี, ทะเบียนถาวร) | Medium | Legacy Archive Service: landing zone แบบ immutable (Parquet + manifest/checksum) + read-only viewer + ค้นหาด้วย person_id/HMAC + RLS ตาม OrgUnit + DSR coverage และกำหนด decommission certificate ราย legacy system | L1930, L1948, L1952 |
| DATA-04 | **Migration tooling:** ระบุ Great Expectations/dbt tests แต่ยังไม่มี tooling สำหรับ curriculum equivalence mapping, workflow แก้ข้อมูลโดยนายทะเบียน (data-fix queue UI) และ dress rehearsal ที่จับเวลา cutover ≤ 48 ชม. สำหรับ 5–6 วิทยาเขตต่อ wave | migration คือความเสี่ยงอันดับ 1 (R-01) แต่ยังไม่มี effort/ทีม/tool ที่ชัด | High | กำหนด migration factory: canonical schema + mapping registry (version), self-service DQ dashboard ต่อวิทยาเขต, data-fix UI แบบ 4-eyes, rehearsal ≥ 3 รอบที่วัด elapsed time, reconciliation report ที่นายทะเบียนลงนาม และงบ data engineer ≥ 4–6 FTE ช่วง wave (ปัจจุบัน 3–4) | L1921–1952, L2631 |
| DATA-05 | **Bitemporal/temporal ครอบคลุมกว้าง** ("ตารางสำคัญเป็น effective-dated/bitemporal", L1838; "temporal tables" L826) แต่ PostgreSQL ไม่มี system-versioned temporal table ในตัว | ทำเองทุกตารางเพิ่มความซับซ้อนของ query/ORM มาก | Low | จำกัด bitemporal ไว้ที่ PolicySet, FeeSchedule, OrgSetting, ParentAgency และ StudentStatus ส่วนตารางอื่นใช้ audit/history table (trigger หรือ Hibernate Envers) | L826, L1838 |
| DATA-06 | **Reference/master data ไทย** (จังหวัด/อำเภอ/ตำบล/รหัสไปรษณีย์, โรงเรียนเดิม, คำนำหน้า/ยศ) ยังไม่ระบุแหล่งข้อมูล ความถี่ในการอัปเดต และเจ้าของ | ตำบลมีการเปลี่ยนแปลง และรหัสโรงเรียนเดิมจำเป็นสำหรับ TCAS/สป.อว. | Low | กำหนดแหล่ง (กรมการปกครอง/ไปรษณีย์ไทย/สพฐ. data.go.th), versioned dataset + mapping ของรหัสเก่า และ data steward | L1017, L1854, L2309 |
| DATA-07 | **Test data ใน non-prod:** UAT/staging ใช้ "masked copy" ของข้อมูลจริงที่มีผู้เยาว์ (L2412, L2415) | masking ที่ไม่ดีพอถือเป็น processing/breach ตาม PDPA และ vendor เข้าถึง staging ได้ง่ายกว่า prod | Medium | ค่าเริ่มต้นเป็น **synthetic generator** (ชื่อไทย, เลข 13 หลักที่ check digit ถูก, เกรดที่สมจริง) ส่วน masked copy ใช้เฉพาะ migration rehearsal ใน enclave ที่มี control เท่า prod | L2410–2416 |

### 2.5 Operations, FinOps, handover

| ID | ประเด็น | ทำไมสำคัญ | Sev | ข้อเสนอ | ตำแหน่ง |
|---|---|---|---|---|---|
| OPS-01 | **มี 8 environments** (dev, sit, uat, perf, training, staging, prod, dr) | ค่า infra non-prod และงานดูแล config drift สูง | Medium | ลดเหลือ 5: dev (ephemeral), test (sit + uat + training เป็น namespace), staging (ใช้เป็น perf ชั่วคราวเมื่อ scale), prod, dr | L2406–2417 |
| OPS-02 | **Steady-state TCO หลังปีที่ 5 ไม่ได้แสดง:** MA 15–20% ของค่าพัฒนาสะสม (~140–200 ล้าน) = 21–40 ล้าน/ปี + infra 6–12 ล้าน + subscriptions 1–3 ล้าน ≈ **28–55 ล้าน/ปีตลอดไป** (~1.6–3.2% ของงบ 2570) ซึ่งยังไม่รวมค่า SOC/MSSP, HSM และค่าธรรมเนียมธนาคาร/SMS/LINE | ผู้บริหารต้องเห็นภาระผูกพันระยะยาว โดยเฉพาะเมื่องบลดลง (R-08) | Medium | เพิ่มตาราง TCO ปีที่ 6–10, แยก run cost ต่อ component (ผลของ Minimum Operable Stack) และใส่ FinOps KPI (THB/ผู้เรียน/ปี, ค่า non-prod ≤ 30% ของ prod) | L2640–2653, L1024 |
| OPS-03 | **On-call 24×7 กับทีมจริง:** SEV-1 response 15 นาที 24×7, SEV-2 24×7 ในช่วงวิกฤต (L2533–2534) แต่ helpdesk ทำงานเวลาราชการ (A-29) และทีม มกช. มี 5–10 คน | ต้องมี on-call rotation ≥ 6–8 คนต่อ tier ไม่เช่นนั้นจะ burn out หรือไม่มีคนรับเหตุ | Medium | กำหนดใน TOR ว่า vendor/MSP ถือ on-call L2/L3 24×7 ตลอดสัญญา MA, มี hypercare ช่วงวิกฤต, runbook automation และ escalation matrix ที่มีชื่อ ส่วน มกช. ถือ L1 + business decision | L179, L2511–2537 |
| OPS-04 | **Release cadence และ change freeze:** release ทุก 2 สัปดาห์ (L2331) ร่วมกับ freeze อัตโนมัติจากปฏิทินของ 17 วิทยาเขต + 13 โรงเรียน + ปีงบประมาณ (L2488) ถ้าปฏิทินต่างกัน union ของ freeze อาจครอบคลุม 30–40% ของปี | release จะกองรวมกัน และ big-bang deploy หลัง freeze เสี่ยงมากขึ้น | Medium | ทำ freeze **ราย OrgUnit ring** (ใช้ ARCH-08) และ freeze ทั่วระบบเฉพาะช่วงที่ทุกแห่งวิกฤตพร้อมกัน ส่วน mobile app ให้ส่ง store review ก่อน freeze ≥ 10 วัน | L2225, L2331, L2488 |
| OPS-05 | **Exit plan/escrow:** หลักการดี (P10, R-05, L2385) แต่ไม่มี exit plan ที่ปฏิบัติได้: ระยะ transition assistance, รูปแบบการส่งออกข้อมูล, เกณฑ์ knowledge transfer และการทดสอบว่าบุคคลที่สามรับช่วงได้จริง | การผูกขาด vendor มักเกิดจากความรู้ที่ไม่ได้อยู่ในเอกสาร ไม่ใช่จาก source code | Medium | เพิ่ม: (1) **Independent rebuild test** ก่อนรับมอบแต่ละ phase (บุคคลที่สามหรือทีม มกช. สร้าง env จาก repo ตาม L2333 โดย vendor ไม่ช่วย) (2) transition assistance ≥ 6 เดือนในสัญญา (3) data export ทั้งระบบเป็น open format (4) KT metrics (จำนวนคน มกช. ที่ทำ runbook X ได้เอง) | L82, L2333, L2385, L2599 |
| OPS-06 | **Training/change management:** มี FTE trainer และงบ แต่ไม่มีแผน (train-the-trainer, campus champions, เนื้อหาตาม persona, LMS course, วัด adoption) ทั้งที่เป็นความเสี่ยงอันดับ 2 | ผู้ใช้ 30 OrgUnit ที่คุ้นกับระบบเดิม | Low | Change & training plan ต่อ wave: champion 2 คน/OrgUnit, sandbox (training ns), micro-learning ไทย, KPI adoption (เช่น % คำร้องออนไลน์) | L2596, L2633, L2649 |
| OPS-07 | **Moodle ops ownership** ยังไม่ชัด ("หรือใช้ instance เดิมของ มกช.", L2192) | Moodle เป็นระบบหนักอีกตัวหนึ่ง (DB, cron, file storage, upgrade ปีละ 2 ครั้ง) | Low | ระบุใน TOR ว่าใครดูแล Moodle และ SLA และพิจารณาใช้ instance เดิมของ มกช./MOOC ระดับชาติ | L2189–2192 |

### 2.6 Delivery, testing, quality

| ID | ประเด็น | ทำไมสำคัญ | Sev | ข้อเสนอ | ตำแหน่ง |
|---|---|---|---|---|---|
| DEL-01 | **Phase 3 โรงเรียนกีฬา:** ปีการศึกษาขั้นพื้นฐานเริ่มกลาง พ.ค. Phase 3 เริ่ม M22 (ม.ค. 2572) จึงมีเวลาเพียง ~4 เดือนก่อน พ.ค. 2572 (M26) ส่วน wave ที่ 2 ของโรงเรียนจะตก พ.ค. 2573 (M38) ซึ่งหลัง Phase 3 จบ (M33) | exit criteria "ปีการศึกษาใหม่เริ่มบนระบบ" ทำได้ไม่ครบใน M22–M33 | Medium | วางนำร่องโรงเรียนกีฬาสุพรรณบุรีที่ พ.ค. 2572 (ลด scope ให้เหลือ SSC + guardian + leave pass) และเลื่อนโรงเรียนอื่นไป พ.ค. 2573 หรือเริ่ม Phase 3 เร็วขึ้นเป็น M18 | L2552, L2571, L2587 |
| DEL-02 | **ENG และ Helpdesk ต้องมีที่ pilot แต่ไม่อยู่ใน Phase 1:** 4.27 ระบุว่า news/announcement/emergency ต้องมีใน Phase 1 (L1055) และ X-11 Helpdesk "ต้องมีตั้งแต่ rollout" แต่ใส่ไว้ Phase 2 (L1047, L2551) ทั้งที่ R1.0 (L2550) ไม่มีทั้งสองอย่าง | pilot ที่ไม่มี helpdesk และช่องทางประกาศเหตุฉุกเฉินมีความเสี่ยงด้านการให้บริการ | Medium | ใส่ Zammad + ENG lite (announcement + notification center + P0) ใน R1.0 | L1047, L1055, L2550–2551 |
| DEL-03 | **Testing strategy ยังเป็นรายการเครื่องมือ (L2079, L2327)** ไม่มี test pyramid ต่อโมดูล, test data management, test สำหรับ partner ที่ไม่มี sandbox (TCAS/กยศ./GFMIS/สป.อว. ใช้ไฟล์ จึงต้องมี golden files), device lab Android ระดับล่าง, migration test, DR test เป็น gate, UAT sign-off criteria รายวิทยาเขต และ exploratory/usability test | คุณภาพ go-live ขึ้นกับ test ที่เจาะจง domain ไทย | High | ทำ Test Strategy doc ที่มี: (1) pyramid + coverage ต่อ layer (2) **RLS cross-tenant test suite** (3) PolicySet golden cases ต่อข้อบังคับ (4) file-contract tests ด้วย golden files ของหน่วยงานรัฐ (5) performance scenarios (registration, grade release, admission result, P0 fan-out) (6) security: ASVS checklist, DAST, pen test ราย wave (7) a11y: axe + manual ภาษาไทย + PDF/UA (8) UAT exit: 0 Sev-1/2 + ผ่าน 95% ของ business scenarios + นายทะเบียน/การเงินลงนาม (9) DR/restore เป็น release gate รายไตรมาส | L2079, L2297, L2322–2333, L2550 |
| DEL-04 | **Quality gate coverage ≥ 80%** (L2327) วัดได้แต่ไม่ได้บอกคุณภาพของ test | อาจได้ test ที่ไม่ assert อะไรเลย | Low | เพิ่ม mutation testing (PIT) ใน domain modules สำคัญ (GPA, fee, standing) และนับ defect escape rate | L2327 |
| DEL-05 | **Pen test/chaos/game day:** pen test รายปี + ก่อนแต่ละ wave ดีแล้ว แต่ chaos/game day ถูกกล่าวถึงเพียงใน R-03 (L2597) และ DR drill ทุก 6 เดือน ไม่มี scope ที่ชัด | ระบบ async (Kafka/Redis) ต้องทดสอบ failure mode | Low | Game day ก่อนทุกช่วงลงทะเบียน: ฆ่า Redis/PG primary/Keycloak node ระหว่าง load test, ทดสอบ waiting room fallback และ manual override | L2507, L2597 |
| DEL-06 | **Procurement realism:** ผู้จัดทำเอกสารคือ vendor ผู้เสนอราคา (L9) และ R-15 ยอมรับความเสี่ยงที่ผู้จัดทำ TOR อาจถูกห้ามเสนอราคา ส่วน design ระดับนี้อาจทำให้ TOR ผูกกับ stack เฉพาะ (เช่น ระบุ Flowable/APISIX ทำให้ถูกมองว่า lock spec) | อาจทำให้เกิดข้อร้องเรียนในการจัดซื้อ | Medium | ใน TOR ให้ระบุ **capability/NFR + open standards** (BPMN 2.0, OIDC, S3 API, OpenAPI) แทนชื่อผลิตภัณฑ์ และเก็บรายชื่อ stack ไว้เป็น "reference architecture" | L9, L2609 |

### 2.7 AI governance, accessibility, observability

| ID | ประเด็น | ทำไมสำคัญ | Sev | ข้อเสนอ | ตำแหน่ง |
|---|---|---|---|---|---|
| AI-01 | ADR-015 ดีในเรื่อง early warning แต่ **chatbot RAG** (L0 support, L2524) ยังไม่มี governance: model ใด/host ที่ใด, การเก็บ chat log ที่มี PII, prompt injection, การตอบผิดเรื่องข้อบังคับ (hallucination) ที่ผู้ใช้อาจนำไปใช้ตัดสินใจ, eval set ภาษาไทย และ AI register ตามแนว ETDA AI Governance [ต้องตรวจสอบ] | chatbot ตอบผิดเรื่องเกณฑ์พ้นสภาพ/การถอน ทำให้นักศึกษาเสียสิทธิ์ | Medium | AI policy: เริ่มจาก retrieval-only (แสดงข้อความต้นฉบับ + citation), ห้ามตอบเรื่องสถานภาพรายบุคคล, eval set ≥ 200 คำถามไทยก่อนเปิด, chat log ไม่เก็บ PII เกิน 30 วัน, human handoff และ AI register/DPIA ต่อฟีเจอร์ | L2183–2187, L2524, L2553 |
| AI-02 | ACWR/readiness ใช้ตัดสินใจเรื่องนักกีฬาผู้เยาว์ (L892, L630) | metric มีข้อโต้แย้งทางวิทยาศาสตร์ และอาจถูกใช้ตัดตัวนักกีฬา | Low | แสดงเป็น decision support พร้อมคำอธิบาย ไม่ใช่ automated decision และให้ sports science lead รับรอง | L630, L892 |
| A11Y-01 | WCAG 2.1 AA มีครบ แต่ยังไม่ครอบคลุม Flutter (Semantics), เอกสาร PDF (PDF/UA สำหรับ transcript/ประกาศ) และ WCAG 2.2 (focus appearance, target size) | ประกาศทางการเป็น PDF เป็นส่วนใหญ่ | Low | ตั้งเป้า WCAG 2.2 AA สำหรับงานใหม่, PDF/UA สำหรับเอกสารสาธารณะ และใส่ Flutter a11y tests | L2294–2299, L1061 |
| OBS-01 | Observability ดี (OTel, SLO, burn-rate, synthetic) แต่ขาด **RUM** (real-user monitoring) แยกตามวิทยาเขต/ผู้ให้บริการเครือข่าย และไม่ได้ระบุผู้เฝ้า dashboard นอกเวลา | ปัญหาที่ผู้ใช้ต่างจังหวัดเจอจะไม่ปรากฏใน synthetic ที่รันจาก DC | Low | เพิ่ม RUM (Grafana Faro/OTel web) + dashboard แยกตาม OrgUnit และผูก alert เข้ากับ on-call ใน OPS-03 | L2314–2320 |

---

## 3. ตรวจซ้ำการคำนวณ Capacity และ SLO (Recompute)

| รายการ | ในเอกสาร | ตรวจซ้ำ | ความเห็น |
|---|---|---|---|
| ผู้เข้า 15 นาทีแรก | 15,000 × 40% = 6,000 | ✓ | N = 15,000 เผื่อจาก 12,300 แล้ว 1.22× |
| อัตราปล่อยคิว | 6,000/15 = 400/นาที | ✓ (6.7 คน/s) | — |
| Active พร้อมกัน | 400 × 8 = 3,200 | ✓ | เป้า 6,000 = 1.9× ไม่ใช่ "4–5×" ตามที่ L63 สรุป |
| API RPS | 3,200/4 = 800; 6,000/4 = 1,500; เป้า 3,000 | ✓ | ยังไม่รวม polling สถานะ (NFR-02) ถ้า poll ทุก 2 s จะได้ +1,600 RPS |
| Registration cmd | 6,000 × 1.5/900 = 10/s, burst ×6 = 60/s; เป้า 300 | ✓ | **PostgreSQL ตัวเดียวทำได้** (300 tx/s × ~13 rows = 3,900 rows/s ซึ่งอยู่ในวิสัยของ PG 16 vCPU/NVMe) จึงไม่จำเป็นต้องใช้ Kafka |
| DB rows | 300 × 13 = 3,900/s | ✓ | — |
| Notifications | 15,000 × 2/7,200 s ≈ 4.2/s | ✓ | แต่ P0 25,000 ใน 60 s ≈ 417/s (L1073) **เกินเป้า 200 msg/s** (L2254) ต้องปรับเป้า NOTI หรือ SLA ของ P0 |
| ประกาศผลสอบเข้า | 25,000/1,800 s ≈ 14/s | ✓ | CDN + pre-computed ถูกต้อง |
| SLO ช่วงวิกฤต | 99.95% × 7 วัน ≈ 5.04 นาที | ✓ | serial dependency 4 ตัว × 99.95% ≈ 99.80% จึงไม่ถึงเป้า (NFR-04) |
| SLO รายเดือน | 99.9% = 43.8 นาที | ✓ | — |
| ต้นทุน: คน-เดือน | "~1,150" | ผลรวมที่แสดง 33+490+440+120+108 = **1,191** | ต่างกัน 41 คน-เดือน (~5–7 ล้าน) และการหัก P3 ที่ซ้อนกับ P2 ออก 120 คน-เดือน (L2636) **ไม่ถูกต้อง** หากทีม P3 เป็นคนเพิ่ม (FTE ไม่ได้ซ้อนกัน มีเพียงช่วงเวลาที่ซ้อน) ต้นทุนจริงอาจสูงขึ้น 120 คน-เดือน ≈ 14–20 ล้าน |
| ต้นทุนรวม 5 ปี | 207–343 ล้าน | ผลรวมของแถวในตาราง ✓ | ถ้าแก้ 2 ข้อข้างบน ช่วงจะเป็น ≈ 226–370 ล้าน |
| Infra 6–12 ล้าน/ปี | — | ประเมินคร่าว: prod ~300 vCPU + DR ~150 + non-prod ~200 ≈ 650 vCPU × ~1,000–1,500 THB/vCPU-เดือน ≈ 8–12 ล้าน/ปี | อยู่ในช่วงที่ระบุ ถ้าใช้ Minimum Operable Stack + 5 env จะลดเหลือ ~400 vCPU (−35%) |

---

## 4. สิ่งที่ควรตัด/ลด/เลื่อน ("เหลือ") และ Minimum Operable Stack

| Component/สิ่งที่ออกแบบไว้ | การใช้งานในเอกสาร | ข้อเสนอ | เกณฑ์ที่จะนำกลับมา | ผลที่ได้ |
|---|---|---|---|---|
| Kafka + Strimzi + MirrorMaker 2 + Apicurio | event bus, CDC, reg-commands | **เลื่อน** ไปใช้ Spring Modulith JDBC event registry + outbox relay | > 500 event/s ต่อเนื่อง หรือมี consumer ภายนอก ≥ 5 ราย | ลด 4 component และขั้นตอน DR ของ MM2 |
| Debezium CDC | analytics feed, outbox router | **เลื่อน** ไปใช้ batch ELT รายชั่วโมงจาก read replica | ต้องการ freshness < 15 นาทีที่มีผู้ใช้จริง | ลด 1 component |
| ClickHouse + Keeper | warehouse | **แทนที่** ด้วย PostgreSQL analytics instance (+ partition) | dashboard p95 > 3 s ที่ข้อมูลจริง | ลด 2 component และ SQL dialect 1 ชุด |
| OpenSearch ×3 | search/log/audit | **ตัด** ใช้ PG FTS/pg_trgm + Loki | ค้นหาเอกสาร full-text จำนวนมาก (Phase 5 repository) | ลด stateful cluster 1 ชุด |
| Metabase (นอกจาก Superset) | self-service BI | **ตัด** | — | ลด 1 |
| OpenMetadata | catalogue/lineage/ROPA | **เลื่อน** ใช้ dbt docs + ROPA ใน PRIV | Phase 4 หรือเมื่อ GD Catalog บังคับใช้ | ลด 1 |
| Registration Engine เป็น deployable แยก + Redis seat counters + Kafka queue | peak registration | **ลดรูป**: module เดียวกัน, deployment profile แยกได้, transaction PG แบบ synchronous, Redis ใช้เป็น cache | load test 300 cmd/s ไม่ผ่าน | ไม่มี dual-write และตัด reconcile job |
| Health vault cluster แยก (Patroni ชุดที่ 2 + DR) | sensitive data | **ลดรูป** เป็น DB แยก/instance แยก + field encryption | GDCC/ผู้ตรวจกำหนดให้แยก physical | ลด HA cluster 1 ชุด |
| Service mesh (Linkerd) | mTLS ภายใน | **เลื่อน** (ใช้ Cilium/WireGuard ถ้ามี) | ผล threat model ชี้ว่ามี lateral movement risk สูง | ลด 1 |
| Teleport | PAM | **ประเมิน license/แทนที่** (ดู SEC-14) | — | — |
| Argo Rollouts canary | progressive delivery | **เลื่อน** ใช้ rolling + OrgUnit rings | ทีม SRE ≥ 3 คนประจำ | ลด 1 |
| Unleash + OpenFeature | feature flags | **ลดรูป** เป็น flagd/config ใน Git | flags > 100 หรือต้องทำ % rollout | ลด 1 |
| Falco | runtime security | **เลื่อน** ให้ MSSP/SOC เป็นเจ้าของ | มี SOC 24×7 | ลด 1 |
| Flutter app | mobile | **เลื่อน** ไป Phase 3 ใช้ PWA + LINE LIFF ก่อน | PWA push/offline ไม่พอสำหรับ wellness รายวัน | ลด 1 stack ภาษา |
| 8 environments | — | **ลด** เหลือ 5 (OPS-01) | — | ลด non-prod ~30–40% |
| CMMN ใน Flowable | — | **ตัด** | มี case management จริง | — |
| Phase 5–6 (Koha, CMS, Research, Clinic, International ฯลฯ) | ส่วนขยาย | **แยกเป็นโครงการ/สัญญาต่างหาก** ไม่รวมใน design baseline ของ core | หลัง core เสถียร ≥ 1 ปี | ลด scope creep (R-13) |
| ML early warning, chatbot, VC wallet | AI/innovation | **เลื่อน** จนกว่าจะมีข้อมูล ≥ 3 ปีและผ่าน AI-01 | — | — |
| Face check-in biometric (กล่าวถึงใน L1877) | check-in | **ไม่ทำ** ใช้ QR/geofence | — | ลดภาระ PDPA ม.26 |

**Minimum Operable Stack (เสนอสำหรับ Phase 1–3):** Kubernetes (managed หรือ vendor-managed) · APISIX หรือ ingress + waiting room (Valkey) · Keycloak · Core modular monolith (Spring Modulith, profiles web/worker/scheduler/registration) · Flowable engine · PostgreSQL/Patroni (core + vault DB + Keycloak DB) + PgBouncer + pgBackRest · Valkey · object storage ของ GDCC (หรือ Ceph RGW) + Object Lock · OpenBao + HSM · Prometheus/Grafana/Loki/Tempo · Argo CD · GitLab + Harbor · Trivy/Dependency-Track/Kyverno baseline · ClamAV · Superset + dbt บน PostgreSQL analytics · Zammad · Moodle (ถ้าต้องดูแลเอง) รวมราว **25–28 component** จากเดิม ~45–50

---

## 5. Missing-items checklist (ตามที่ได้รับมอบหมายให้ตรวจ)

| หัวข้อ | สถานะในเอกสาร | อ้างอิง | Finding |
|---|---|---|---|
| API versioning strategy | บางส่วน (`/api/v{n}`) | L2196 | ARCH-09 |
| Multi-tenancy edge cases | ขาด | L2104 | ARCH-10 |
| Offline/poor connectivity, mobile offline | บางส่วน | L463, L2139 | ARCH-11 |
| File/virus scanning | มี (ClamAV) แต่ไม่มี resumable upload/ไม่มีจุด quarantine | L1016, L2394 | ARCH-11 |
| Search | มี (เกินจำเป็น) | L1015 | ARCH-03 |
| Reporting engine/เอกสารราชการไทย (ปพ., ใบรับรอง), PDF | ขาดการเลือก engine | L971, L914 | Top-8 |
| Buddhist calendar/Thai formats | มีครบ | L2306–2312 | — |
| Thai address/ID master data | บางส่วน | L1017, L1860 | DATA-06 |
| Document templates | บางส่วน (ราย OrgUnit + ParentAgency) | L771, L971 | Top-8 |
| Caching | บางส่วน (Redis, CDN) ไม่มี HTTP caching/invalidation policy | L1218, L1364 | NFR-02 |
| Rate limiting | มี | L1199, L2033 | NFR-02 (bot) |
| Secrets management | มี | L2041, L2070 | — |
| Key management/HSM | มีแต่ไม่มี backup/escrow ของ Vault | L2500 | Top-2, SEC-11 |
| SBOM/supply chain | มี | L2329, L2398 | — |
| Penetration testing | มี | L2369 | DEL-05 |
| DR drills | มี | L2506 | NFR-05 |
| Chaos testing | กล่าวถึงเพียงสั้นๆ | L2597 | DEL-05 |
| Data archival | บางส่วน | L1912, L1948 | DATA-03 |
| Legacy migration tooling + parallel run | บางส่วน ไม่มี parallel run | L1921–1952 | Top-7, DATA-04 |
| Cutover plan | บางส่วน ไม่มี rollback | L1950–1951 | Top-7 |
| Training/change management | บางส่วน | L2596, L2633 | OPS-06 |
| Documentation/handover | มี | L2330, L2333 | OPS-05 |
| Source code ownership/escrow | มี (หลักการ) | L2385 | OPS-05 |
| Exit plan | ขาดรายละเอียด | L82, L2599 | OPS-05 |
| FinOps/cost of running | บางส่วน (dashboard) ไม่มี TCO หลังปีที่ 5 | L1024, L2640 | OPS-02 |
| Capacity sanity check | ถูกทางเลขคณิต แต่ headroom ซ้อนกัน | L2239–2270 | NFR-01, หัวข้อ 3 |
| SLO math | ถูกทางเลขคณิต แต่ไม่สอดคล้องกับ dependency | L2213 | NFR-04 |
| RPO/RTO feasibility on GDCC | ยังไม่ตรวจ | L2227–2237 | NFR-05/06/07 |
| Threat model STRIDE | ขาด | — | Top-3 |
| Zero trust | บางส่วน | L2395–2397 | SEC-13 |
| Admin PAM | มี (license risk) | L2071, L2199 | SEC-14 |
| Exam/grade tampering | บางส่วน (workflow-level) | L609–610 | SEC-01 |
| Payment fraud | บางส่วน | L1403–1417 | SEC-02 |
| Account takeover | บางส่วน | L2392 | SEC-03 |
| Minors' data | ดี (PDPA) ขาด safeguarding | L2349 | SEC-04 |
| Insider threat | บางส่วน | L2399 | SEC-05 |
| SIEM/SOC | ไม่มีผู้ปฏิบัติการ | L2399 | SEC-06 |
| Incident response vs PDPA 72h/NCSA | ดี ขาด processor clause | L2518 | SEC-07 |
| Backup immutability/ransomware | บางส่วน | L2495 | SEC-08 |
| AI governance | ดีสำหรับ early warning, ขาดสำหรับ chatbot | L2183 | AI-01 |
| Accessibility | ดี | L2294 | A11Y-01 |
| Observability | ดี | L2314 | OBS-01 |
| Testing strategy/quality gates/environments/release cadence | รายการเครื่องมือ + gate บางส่วน | L2079, L2322–2333, L2406, L2488 | DEL-03/04, OPS-01/04 |

---

## 6. Internal inconsistencies (ความไม่สอดคล้องภายในเอกสาร)

| # | ความไม่สอดคล้อง | ตำแหน่ง | ข้อเสนอแก้ |
|---|---|---|---|
| IC-01 | ตัด Redpanda ด้วยเหตุผล BSL แต่เลือก HashiCorp Vault/Terraform (BSL) และ Teleport Community (license จำกัด) [ต้องตรวจสอบ] | L2061, L2126 vs L2070–2073 | ใช้เกณฑ์ license เดียวกันทั้งเอกสาร (OpenBao/OpenTofu) |
| IC-02 | Health vault "TDE" แต่ community PostgreSQL ไม่มี TDE | L1217 vs L2062 | แก้ข้อความ หรือระบุ distribution |
| IC-03 | "Flowable Design/Admin UI" ถูกเขียนเหมือนเป็น OSS แต่ Flowable 7 OSS ไม่มี UI [ต้องตรวจสอบ] | L1275, L2166 vs L2054 | ระบุ edition/งบ |
| IC-04 | "Event ไม่บรรจุข้อมูล sensitive" แต่ CDC ส่งทุก schema (ยกเว้น vault) เข้า Kafka/ClickHouse | L2042 vs L985, L1904 | DATA-02 |
| IC-05 | P5 "Boring technology", R-10 "ลดจำนวน component" ขัดกับ stack ~45–50 component | L77, L2604 vs L2048–2081 | หัวข้อ 4 |
| IC-06 | หลัก "go-live ตรงขอบภาค" ขัดกับ Wave 2 go-live M23 (ก.พ. 2572 กลางภาค 2) | L2545 vs L2551, L2585 | ย้าย wave |
| IC-07 | R1.0 Admissions ที่ M9 (ธ.ค. 2570) แต่ประกาศรับสมัครรอบแรกของปีถัดไปออกราว ก.ย. (ตัวอย่าง 22 ก.ย. 2569) | L100 vs L2550, L2583 | Top-5 |
| IC-08 | คน-เดือน "~1,150" ไม่เท่ากับผลรวมที่แสดง (1,191) และการหัก P3 ที่ซ้อนกับ P2 ไม่ถูกต้องตามหลัก FTE | L2636, L2644 | หัวข้อ 3 |
| IC-09 | ADR-002 ระบุทีมผู้รับจ้าง 25–40 คน แต่ตาราง P1 มี ~41 FTE | L2096 vs L2634 | ปรับให้ตรง |
| IC-10 | role code ใน 4.1 (`guardian`, `campus_admin`, `university_admin`, `executive`, `auditor`) ไม่ตรงกับ catalogue 3A (`guardian_minor`/`parent_adult_student`, `campus_it_admin`, `platform_admin`/`super_admin`, `executive_viewer`, `internal_auditor`/`auditor_ro`) | L764 vs L370–430, L637–655 | ใช้ 3A เป็น single source |
| IC-11 | Break-glass "2-person approval" (L594) ขัดกับ W-14 ที่ให้ medical_officer lead **หรือ** DPO อนุมัติคนเดียว และเข้าก่อนตรวจภายหลังได้ | L594 vs L484 | กำหนดให้ชัด (ฉุกเฉิน = self-activate + 2-person review ≤ 24 ชม.) |
| IC-12 | Audit "ทุก read ของ confidential" vs "audit การอ่านแบบรายการ (bulk)" | L1004 vs L1876 | DATA-01 |
| IC-13 | ชื่อ event `athlete.ResultRecorded` vs `athlete.CompetitionResultRecorded` | L894 vs L1060, L1071 | ใช้ชื่อเดียว (AsyncAPI) |
| IC-14 | `org.AcademicCalendarPublished` ถูก subscribe แต่ไม่อยู่ใน ORG Pub list และ Term/Calendar มี REG เป็น system of record | L1071 vs L773, L1850 | ใช้ `registration.AcademicCalendarPublished` หรือย้าย ownership |
| IC-15 | ทุก tenant-scoped table มี `org_unit_id` แต่ ER ของ ENROLLMENT/GRADE/INVOICE/PAYMENT/CONSENT/GUARDIAN_RELATION ไม่มี | L1841 vs L1641–1750 | ARCH-10/Top-10 |
| IC-16 | W-01 approval chain ใน 4.6 (อาจารย์ → ประธานหลักสูตร → คณะกรรมการประจำคณะ) ไม่ตรงกับตาราง W-01 (หัวหน้าภาค/ประธานหลักสูตร → คณบดี/กรรมการ → นายทะเบียนเผยแพร่) | L815 vs L471 | อ้าง W-01 |
| IC-17 | ENG ต้องมีที่ pilot (Phase 1) และ Helpdesk "ต้องมีตั้งแต่ rollout" แต่ไม่อยู่ใน R1.0/R1.1 | L1055, L1047 vs L2550 | DEL-02 |
| IC-18 | NOTI burst เป้า 200 msg/s แต่ P0 ต้องส่ง ~25,000 ข้อความใน 60 s (~417 msg/s ต่อช่องทาง) | L2254 vs L1073 | ปรับเป้าหรือ SLA |
| IC-19 | สรุปผู้บริหารระบุ headroom "4–5 เท่า" สำหรับทุกตัวชี้วัด แต่ active users มี headroom เพียง 1.9× | L63 vs L2248 | แก้ถ้อยคำ |
| IC-20 | HPA ของ registration ระบุ 4–40 pods แต่ sizing ระบุ 2/2 → 20/12 ส่วน core web ระบุ 3–12 vs 4 → 12 | L1270–1271 vs L2262–2263 | ใช้ค่าเดียว |
| IC-21 | DR RTO ช่วงวิกฤต ≤ 1 ชม. (L2234) แต่ 11.5 ระบุเพียง "เป้า ≤ 2 ชม." | L2234 vs L2505 | ใส่ทั้งสองค่าใน runbook |
| IC-22 | หลัก "ห้าม SaaS ต่างประเทศสำหรับ PII" ขัดกับการใช้ Google/M365 mailbox, FCM/APNs, LINE | L2351 vs L762, L960 | SEC-12 |
| IC-23 | ADR-001 และ stack ระบุ "Superset/Metabase" สองตัว ขณะที่ส่วนอื่นอ้าง Superset เท่านั้น | L2090, L2068 vs L982, L1228 | เลือกตัวเดียว |
| IC-24 | ลำดับ A-36 อยู่ก่อน A-35 (เล็กน้อย) | L185–186 | เรียงใหม่ |
| IC-25 | Container A1 แสดงรายการโมดูลไม่ครบ (ไม่มี IAM-provisioning, ORG, ENG, NOTI-in-core, AUD, ANA, ADMIN ทั้งที่ ADMIN เป็นแอปแยกตาม L1029) | L1206 vs L1029, L1053 | ปรับ C4 L2 ให้ตรงกับ 4.x |

---

## 7. คำถามที่ควรเพิ่มใน Phase 0 (นอกเหนือจาก Q-01..Q-30)

1. GDCC ให้บริการอะไรได้จริง (managed K8s, multi-zone, Object Lock compliance mode, HSM, GSLB, latency ข้าม site, SOC) และมีค่าใช้จ่ายหรือไม่ (NFR-07)
2. วันประกาศรับสมัคร/ลงทะเบียน/ประกาศเกรด **จริง** ราย OrgUnit ของปีการศึกษา 2570–2572 เพื่อตรึง roadmap (Top-5)
3. มกช. ยอมรับนโยบาย staggered registration window เป็นค่าเริ่มต้นหรือไม่ (NFR-01)
4. ใครเป็นผู้ถือ recovery key ของ Vault/HSM และใบรับรองลงนาม (นิติบุคคล หรือรายบุคคล) (Top-2, SEC-11)
5. ทีม มกช. ที่จะรับช่วงมีกี่คน มีทักษะอะไร และงบ MA/MSP ระยะยาวเป็นเท่าใด เพื่อใช้กำหนดจำนวน component สูงสุดที่ยอมรับได้ (Top-1, OPS-02)
6. ฝ่ายกฎหมายรับ license ประเภท BSL/SSPL/AGPL/source-available ในงานภาครัฐได้หรือไม่ (Top-9)
7. รูปแบบเอกสาร ปพ./transcript/ใบรับรองที่ใช้จริง พร้อมตัวอย่างไฟล์ เพื่อใช้เป็น golden files (Top-8)
