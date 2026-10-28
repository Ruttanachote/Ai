# R1 "รับสมัคร" — Data dictionary ระดับฟิลด์

> **สถานะ:** v1.0-draft · 28 ต.ค. 2569 · Release R1 "รับสมัคร" (go-live 1 ก.ย. 2571 = M18; ถ้าเริ่มสัญญาหลัง ต.ค. 2570 ทุก release เลื่อน 12 เดือน — เล่ม 12 §1.3) · ภาษา: ไทย (ศัพท์เทคนิค/โค้ดเป็นภาษาอังกฤษ)
> **ขอบเขต:** entity ทั้งหมดที่ R1 สร้าง/อ่าน/เขียน (เจ้าของตามเล่ม 06; ER ตามเล่ม 08)
> **อ่านคู่กับ:** [README](README.md) · [00-blueprint](../00-blueprint.md) · [00-fix-decisions-v1.1](../00-fix-decisions-v1.1.md) (D-03, D-06, D-08) · [02 §2](../02-student-journey.md) · [05](../05-workflows.md) · [06](../06-modules.md) · [08](../08-data.md) · [10](../10-security-compliance.md) · [14](../14-ux-adoption.md) · [r1-api.yaml](r1-api.yaml)

## 0. ข้อตกลง

| หัวข้อ | กติกา |
|---|---|
| ชนิดข้อมูล | ชนิด PostgreSQL 16; `uuid` = UUIDv7 (PK ทุกตาราง; ตาราง offline ใช้ UUIDv7 ฝั่ง client — 08 §1 ข้อ 6); เวลา `timestamptz` (UTC); วันที่ `date` (ค.ศ.; แสดง พ.ศ. ที่ UI); ปี พ.ศ. ใช้ชื่อคอลัมน์ `_be`; เงิน `numeric(12,2)` บาท; ข้อความสองภาษา `_th`/`_en` |
| คอลัมน์มาตรฐาน | ทุกตารางธุรกรรมมี `created_at`, `created_by`, `updated_at`, `updated_by`, `row_version` (optimistic lock/ETag) — ไม่แสดงซ้ำในแต่ละ entity |
| Null | `N` = NOT NULL, `Y` = nullable |
| PII | `—` ไม่ใช่ข้อมูลส่วนบุคคล · `PD` ข้อมูลส่วนบุคคล (Confidential) · `PD-ID` ตัวระบุตรง (เข้ารหัส + ค้นด้วย HMAC เท่านั้น) · `SPD` ข้อมูลอ่อนไหว ม.26 (อยู่ใน `hlt_vault` เท่านั้น) — ชั้นข้อมูลระดับตารางตาม 08 §7.1 |
| `org_unit_id` | ทุกตารางธุรกรรม `NOT NULL` + `ENABLE/FORCE ROW LEVEL SECURITY`; scope ตั้งผ่าน `sec.begin_scope(token)` (08 §10.1, D-09); ความหมายของคอลัมน์ระบุต่อ entity: **OWN** owning unit, **ISSUER** หน่วยที่ออกเอกสาร/การเงิน, **RECV** หน่วยรับเรื่อง, **CARE** หน่วยให้การดูแล (`hlt_vault`), **UNI** OrgUnit ราก, **NONE** ข้อยกเว้น (Person/บัญชี) |
| Retention | อ้างตาราง 08 §8 (ค่าที่เสนอ ต้องอนุมัติเป็น retention schedule); การลบจริงผ่าน `ErasureJob`/`DisposalBatch`/crypto-shred และเคารพ `LEGAL_HOLD` |
| สถานะ | "08 §x" = มีในเล่ม 08/06 แล้ว · "R1 ใหม่" = เสนอเพิ่มในเล่ม 08 (G-13) |
| ห้าม | เลขประจำตัวใน log/URL/event; ข้อมูลสุขภาพ/ความพิการใน core; JOIN ข้าม schema (logical reference เท่านั้น) |

### 0.1 รหัส retention

| รหัส | ความหมาย |
|---|---|
| APP | ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ] |
| FIN | 10 ปีหลังสิ้นปีงบประมาณ (08 §8) [ต้องตรวจสอบ ระเบียบการเงิน/สตง.] |
| CONSENT | อายุ consent + 10 ปี (08 §8) [ต้องตรวจสอบอายุความ] |
| CASE | ร้องเรียน 10 ปีหลังปิดเรื่อง; อุทธรณ์ผลคัดเลือกตาม retention ของใบสมัคร (ขยายถ้ามีคดี) [ต้องตรวจสอบ] |
| ANN | ประกาศทางการ: ถาวร (ส่งหอจดหมายเหตุ) (08 §8) |
| MSG | เนื้อหาข้อความ 1 ปี, metadata การส่ง 2 ปี (08 §8) |
| AUD | 10 ปี WORM (08 §8) |
| SELMED | `SELECTION_MEDICAL`: ผู้ไม่ได้รับเข้า crypto-shred เมื่อปิดรอบ + ระยะอุทธรณ์; ผู้ได้รับเข้า ส่วนที่จำเป็นย้ายเป็น `CLINICAL` (08 §8, §9.2) |
| INJ | `INJURY_RTP`: ระยะศึกษา + 5 ปี; ผู้ไม่ได้รับเข้า [ต้องตรวจสอบ — เสนอ 5 ปีหลังเหตุ เพื่อการเรียกร้องสิทธิ์] |
| DIS | `DISABILITY`: ผู้ไม่ได้รับเข้า ลบพร้อม SELECTION_MEDICAL; ผู้ได้รับเข้า ส่งต่อ AFF เมื่อยินยอม (W-33) [ต้องตรวจสอบ] |
| CFG | ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ] |
| PERSON | Person master: ถาวรเมื่อเป็นนักศึกษา; ผู้สมัครที่ไม่ได้รับเข้าและไม่มีบทบาทอื่น ลบ/ทำให้ไม่ระบุตัวตนพร้อมใบสมัคร (08 §1, §8) [ต้องตรวจสอบ] |
| OPS | 1 ปี (metadata ปฏิบัติการ) [ต้องตรวจสอบ] |
| OIT | snapshot ที่เป็นสถิติทางการ: ถาวร; อื่น 10 ปี (08 §8) |
| IAM | ตลอดอายุบัญชี + 1 ปีหลังปิด; IdentityLink ของบัญชีที่ลบตาม Person [ต้องตรวจสอบ] |
| TRAFFIC | ≥ 90 วัน online + 1 ปี archive (พ.ร.บ.คอมพิวเตอร์ ม.26) [ต้องตรวจสอบ] |

### 0.2 รหัสกติกา `org_unit_id`

| รหัส | ความหมาย |
|---|---|
| OWN | Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6) |
| UNI | University level — OrgUnit ราก (ใช้ได้เฉพาะ config/ตารางกลาง) (08 §6) |
| CARE | Care/serving unit — หน่วยที่ให้การดูแล (ตารางใน `hlt_vault`) (08 §6) |
| NONE | ไม่มี `org_unit_id` — ข้อยกเว้นตาม 08 §6 (Person/reference); มองเห็นผ่าน `person_in_scope`/relationship |
| ISSUER | Owning unit — หน่วยที่ออกเอกสาร/ใบแจ้งหนี้/ใบเสร็จ (08 §6) |
| RECV | Owning unit — หน่วยที่รับเรื่อง (CASE) (08 §6) |

## 1. ดัชนี entity

| Entity | โมดูลเจ้าของ | ที่เก็บ / ตาราง | ชั้นข้อมูล | org_unit_id | Retention | สถานะ | FR |
|---|---|---|---|---|---|---|---|
| [AdmissionCycle](#admissioncycle) | ADM | core / `adm.admission_cycle` | Internal | UNI | CFG | 08 §2.2 | FR-R1-001 |
| [AdmissionChannel](#admissionchannel) | ADM | core / `adm.admission_channel` | Internal | UNI | CFG | 08 §2.2 | FR-R1-001 |
| [AdmissionRound](#admissionround) | ADM | core / `adm.admission_round` | Public (เมื่อเผยแพร่) | OWN | CFG | 08 §2.2 | FR-R1-001, FR-R1-003, FR-R1-005, FR-R1-006, FR-R1-007, FR-R1-008 … |
| [AdmissionPlan](#admissionplan) | ADM | core / `adm.admission_plan` | Internal | OWN | CFG | 08 §2.2 | FR-R1-002 |
| [SeatQuota](#seatquota) | ADM | core / `adm.seat_quota` | Public (จำนวนที่นั่ง) | OWN | CFG | 08 §2.2 | FR-R1-002, FR-R1-009, FR-R1-019, FR-R1-091, FR-R1-098, FR-R1-102 |
| [EligibilityRuleSet](#eligibilityruleset) | ADM | core / `adm.eligibility_rule_set` | Public (เมื่อเผยแพร่) | OWN | CFG | R1 ใหม่ (รายละเอียดของ 'Eligibility rules' ใน 02 §2.1) | FR-R1-003, FR-R1-021 |
| [ScoringScheme](#scoringscheme) | ADM | core / `adm.scoring_scheme` | Public (เมื่อเผยแพร่) | OWN | CFG | 08 §2.2 | FR-R1-004, FR-R1-075 |
| [Rubric](#rubric) | ADM | core / `adm.rubric` | Public (เมื่อเผยแพร่) | OWN | CFG | 08 §2.2 | FR-R1-004 |
| [RubricItem](#rubricitem) | ADM | core / `adm.rubric_item` | Public (เมื่อเผยแพร่) | OWN | CFG | 08 §2.2 | FR-R1-004, FR-R1-072 |
| [Application](#application) | ADM | core / `adm.application` | Confidential | OWN | APP | 08 §2.2 | FR-R1-016, FR-R1-020, FR-R1-021, FR-R1-022, FR-R1-023, FR-R1-024 … |
| [ApplicationChoice](#applicationchoice) | ADM | core / `adm.application_choice` | Confidential | OWN | APP | 08 §2.2 | FR-R1-020, FR-R1-034 |
| [ApplicationDocument](#applicationdocument) | ADM | core + object storage / `adm.application_document` | Confidential | OWN | APP | 08 §2.2 | FR-R1-022, FR-R1-027, FR-R1-030, FR-R1-036, FR-R1-037, FR-R1-038 … |
| [UploadSession](#uploadsession) | ADM | core / `adm.upload_session` | Internal | OWN | OPS | R1 ใหม่ | FR-R1-036 |
| [DocumentRequest](#documentrequest) | ADM | core / `adm.document_request` | Confidential | OWN | APP | R1 ใหม่ (W-77) | FR-R1-039 |
| [VerificationTask](#verificationtask) | ADM | core / `adm.verification_task` | Confidential | OWN | APP | 08 §2.2 | FR-R1-025, FR-R1-038, FR-R1-039, FR-R1-040, FR-R1-041 |
| [SportAchievement](#sportachievement) | ADM | core / `adm.sport_achievement` | Confidential | OWN | APP | 08 §2.2 (ผูก PERSON) | FR-R1-024, FR-R1-025, FR-R1-041 |
| [EligibleList](#eligiblelist) | ADM | core / `adm.eligible_list` | Public (ฉบับ mask) | OWN | APP | R1 ใหม่ (W-42 ขั้น 1) | FR-R1-043 |
| [AccommodationRequest](#accommodationrequest) | ADM | core / `adm.accommodation_request` | Confidential (ไม่มีการวินิจฉัย) | OWN | APP | R1 ใหม่ (02 DA-2; 06 adm.AccommodationRequested) | FR-R1-028 |
| [AccommodationPlan](#accommodationplan) | ADM (interim; เจ้าของถาวร AFF — gap G-01) | core / `adm.accommodation_plan` | Confidential | OWN | APP | 06 AFF (aff.AccommodationGranted) — R1 interim ใน ADM | FR-R1-028, FR-R1-106 |
| [QualificationEquivalence](#qualificationequivalence) | ADM | core / `adm.qualification_equivalence` | Confidential | OWN | APP | 08 §2.2 | FR-R1-029 |
| [TcasSyncRecord](#tcassyncrecord) | ADM | core / `adm.tcas_sync_record` | Confidential | OWN | APP | 08 §2.2 | FR-R1-032 |
| [AdmissionTestSession](#admissiontestsession) | ADM | core / `adm.admission_test_session` | Internal | OWN | APP | 08 §2.2 | FR-R1-054, FR-R1-055, FR-R1-058, FR-R1-060, FR-R1-061, FR-R1-063 … |
| [TestStation](#teststation) | ADM | core / `adm.test_station` | Internal | OWN | APP | 08 §2.2 | FR-R1-054, FR-R1-071 |
| [TestSlot](#testslot) | ADM | core / `adm.test_slot` | Confidential | OWN | APP | R1 ใหม่ (slot ที่ 02 QS-7 อ้าง) | FR-R1-058, FR-R1-059, FR-R1-061, FR-R1-062, FR-R1-063, FR-R1-065 … |
| [CheckIn](#checkin) | ADM | core / `adm.check_in` | Confidential | OWN | APP | R1 ใหม่ (W-76 ขั้น 1) | FR-R1-070 |
| [JudgePanel](#judgepanel) | ADM | core / `adm.judge_panel` | Internal | OWN | APP | 08 §2.2 | FR-R1-056 |
| [JudgeAssignment](#judgeassignment) | ADM | core / `adm.judge_assignment` | Internal | OWN | APP | 08 §2.2 | FR-R1-056, FR-R1-057, FR-R1-069, FR-R1-078 |
| [ConflictDeclaration](#conflictdeclaration) | ADM | core / `adm.conflict_declaration` | Confidential | OWN | APP | 08 §2.2 | FR-R1-057 |
| [JudgeScore](#judgescore) | ADM | core / `adm.judge_score` | Confidential | OWN | APP | 08 §2.2 | FR-R1-071, FR-R1-072, FR-R1-073, FR-R1-077, FR-R1-084 |
| [ScoreSyncConflict](#scoresyncconflict) | ADM | core / `adm.score_sync_conflict` | Confidential | OWN | APP | R1 ใหม่ | FR-R1-073 |
| [JudgeDevice](#judgedevice) | ADM (ทะเบียนร่วม IAM/MDM) | core / `adm.judge_device` | Internal | OWN | OPS | R1 ใหม่ (07 §11.8) | FR-R1-069, FR-R1-073 |
| [ModerationFlag](#moderationflag) | ADM | core / `adm.moderation_flag` | Confidential | OWN | APP | R1 ใหม่ (W-76 ขั้น 3) | FR-R1-074 |
| [ScoreModeration](#scoremoderation) | ADM | core / `adm.score_moderation` | Confidential | OWN | APP | 08 §2.2 | FR-R1-074 |
| [ScoreLock](#scorelock) | ADM | core / `adm.score_lock` | Confidential | OWN | APP | R1 ใหม่ (SoD-14 / SEC-01) | FR-R1-076 |
| [CompositeScore](#compositescore) | ADM | core / `adm.composite_score` | Confidential | OWN | APP | 08 §2.2 | FR-R1-075, FR-R1-076, FR-R1-079, FR-R1-084 |
| [RankList](#ranklist) | ADM | core / `adm.rank_list` | Confidential | OWN | APP | 08 §2.2 | FR-R1-079, FR-R1-080, FR-R1-081 |
| [ReserveListEntry](#reservelistentry) | ADM | core / `adm.reserve_list_entry` | Confidential | OWN | APP | 08 §2.2 | FR-R1-079, FR-R1-080, FR-R1-091 |
| [ResultOverride](#resultoverride) | ADM | core / `adm.result_override` | Confidential | OWN | APP | R1 ใหม่ (SoD-14) | FR-R1-081 |
| [ResultPublication](#resultpublication) | ADM | core + CDN / `adm.result_publication` | Confidential (shard = PD แบบจำกัด) | OWN | APP | R1 ใหม่ | FR-R1-082, FR-R1-083 |
| [Offer](#offer) | ADM | core / `adm.offer` | Confidential | OWN | APP | 08 §2.2 | FR-R1-026, FR-R1-051, FR-R1-086, FR-R1-087, FR-R1-088, FR-R1-089 … |
| [ConfirmationLock](#confirmationlock) | ADM | core / `adm.confirmation_lock` | Confidential | UNI | APP | R1 ใหม่ (บังคับ C-3 ข้ามวิทยาเขต แทน ClearingRun ที่เลื่อน — D-06) | FR-R1-088 |
| [Reconfirmation](#reconfirmation) | ADM | core / `adm.reconfirmation` | Confidential | OWN | APP | R1 ใหม่ (W-163) | FR-R1-095 |
| [NoShowNotice](#noshownotice) | ADM | core / `adm.no_show_notice` | Confidential | OWN | APP | R1 ใหม่ (C-10) | FR-R1-096 |
| [AppealHold](#appealhold) | ADM | core / `adm.appeal_hold` | Confidential | OWN | APP | R1 ใหม่ (C-15) — เสนอเพิ่มใน 08 | FR-R1-091, FR-R1-100, FR-R1-102 |
| [TestIncident](#testincident) | ADM | core / `adm.test_incident` | Confidential (ไม่มีการวินิจฉัย) | OWN | APP | 08 §2.2 | FR-R1-035, FR-R1-066, FR-R1-067, FR-R1-105 |
| [RetestRequest](#retestrequest) | ADM | core / `adm.retest_request` | Confidential | OWN | APP | R1 ใหม่ (W-85) | FR-R1-105 |
| [ReportingHandoff](#reportinghandoff) | ADM | core / `adm.reporting_handoff` | Confidential | OWN | APP | R1 ใหม่ — เสนอเพิ่มใน 08 (สะพาน W-78 ก่อน REC เต็ม) | FR-R1-042, FR-R1-114, FR-R1-115, FR-R1-116, FR-R1-117, FR-R1-118 |
| [LegacyConfirmationFile](#legacyconfirmationfile) | ADM | core / `adm.legacy_confirmation_file` | Confidential | OWN | APP | R1 ใหม่ (BR-01) | FR-R1-097 |
| [AssistedSession](#assistedsession) | ADM (ร่วม IAM) | core / `adm.assisted_session` | Confidential | OWN | AUD | R1 ใหม่ (D-08) | FR-R1-016 |
| [StandardExport](#standardexport) | ANA/DOC (ใช้โดย ADM) | core / `ana.standard_export_run` | Confidential | OWN | AUD | 06 ANA StandardExportDefinition | FR-R1-115, FR-R1-132 |
| [OrgUnit](#orgunit) | ORG | core / `org.org_unit` | Public | NONE | CFG | 08 §2.1 | FR-R1-124 |
| [OrgSetting](#orgsetting) | ORG | core / `org.org_setting` | Internal | OWN | CFG | 08 §2.1 (effective-dated) | FR-R1-124 |
| [CalendarEvent](#calendarevent) | ORG | core / `org.calendar_event` | Public | OWN | CFG | 08 §2.1 | FR-R1-005, FR-R1-008, FR-R1-131 |
| [GateOverride](#gateoverride) | ORG | core / `org.gate_override` | Confidential | OWN | APP | 03 §(GateOverride) | FR-R1-094, FR-R1-100 |
| [Room](#room) | ORG | core / `org.room` | Internal | OWN | CFG | 08 §2.1 | FR-R1-063 |
| [ProgramOffering](#programoffering) | CUR | core / `cur.program_offering` | Public | OWN | CFG | 06 §6.2 (R1 ขั้นต่ำ) | FR-R1-002 |
| [AccreditedIntakeCap](#accreditedintakecap) | CUR | core / `cur.accredited_intake_cap` | Public | OWN | CFG | 06 §6.2 | FR-R1-002, FR-R1-102 |
| [UserAccount](#useraccount) | IAM | Keycloak + core mirror / `iam.user_account` | Confidential | NONE | IAM | 08 §2.1 | FR-R1-011, FR-R1-013, FR-R1-015 |
| [IdentityLink](#identitylink) | IAM | Keycloak + core / `iam.identity_link` | Confidential | NONE | IAM | 08 §2.1 | FR-R1-011, FR-R1-013, FR-R1-108, FR-R1-117 |
| [CredentialBinding](#credentialbinding) | IAM | Keycloak / `(Keycloak)` | Confidential | NONE | IAM | 06 §5.1 | FR-R1-015 |
| [RoleAssignment](#roleassignment) | IAM | core / `iam.role_assignment` | Internal | OWN | IAM | 08 §2.1 | FR-R1-017, FR-R1-018 |
| [ExternalPerson](#externalperson) | IAM | core / `iam.external_person` | Confidential | OWN | IAM | 08 §2.1 | FR-R1-018 |
| [Person](#person) | REC | core / `rec.person` | Confidential | NONE | PERSON | 08 §2.1 (R1 ขั้นต่ำ) | FR-R1-011, FR-R1-012, FR-R1-014, FR-R1-114 |
| [PersonIdentifier](#personidentifier) | REC | core / `rec.person_identifier` | Confidential | NONE | PERSON | 08 §2.1, §5 | FR-R1-012 |
| [ContactPoint](#contactpoint) | REC | core / `rec.contact_point` | Confidential | NONE | PERSON | 08 §2.1 | FR-R1-014 |
| [EmergencyContact](#emergencycontact) | REC | core / `rec.emergency_contact` | Confidential | NONE | PERSON | 08 §2.1 | FR-R1-014 |
| [GuardianRelation](#guardianrelation) | REC | core / `rec.guardian_relation` | Confidential | OWN | PERSON | 08 §2.1 (โมเดลเดียว) | FR-R1-107, FR-R1-108, FR-R1-110, FR-R1-111, FR-R1-113 |
| [GuardianInvitation](#guardianinvitation) | REC | core / `rec.guardian_invitation` | Confidential | OWN | APP | R1 ใหม่ | FR-R1-107, FR-R1-108 |
| [PrivacyNotice](#privacynotice) | PRIV | core / `priv.privacy_notice` | Public | UNI | CONSENT | 06 §5.8 | FR-R1-109 |
| [ConsentPolicyRule](#consentpolicyrule) | PRIV | core / `priv.consent_policy_rule` | Internal | UNI | CFG | 06 §5.8; 10 §2.4 | FR-R1-109 |
| [ConsentRequest](#consentrequest) | PRIV | core / `priv.consent_request` | Confidential | OWN | CONSENT | R1 ใหม่ | FR-R1-109, FR-R1-112 |
| [Consent](#consent) | PRIV | core / `priv.consent` | Confidential | OWN | CONSENT | 08 §2.11 | FR-R1-027, FR-R1-109, FR-R1-113, FR-R1-137 |
| [GuardianConsent](#guardianconsent) | PRIV | core / `priv.guardian_consent` | Confidential | OWN | CONSENT | 06 §5.8 | FR-R1-109, FR-R1-112 |
| [FeeSchedule](#feeschedule) | FIN | core / `fin.fee_schedule` | Internal | OWN | FIN | 06 §7.1 (effective-dated) | FR-R1-006, FR-R1-044 |
| [Invoice](#invoice) | FIN | core / `fin.invoice` | Confidential | ISSUER | FIN | 08 §2.6 | FR-R1-044, FR-R1-045, FR-R1-046, FR-R1-050, FR-R1-051, FR-R1-089 … |
| [InvoiceLine](#invoiceline) | FIN | core / `fin.invoice_line` | Confidential | ISSUER | FIN | 06 §7.1 | FR-R1-044 |
| [PaymentIntent](#paymentintent) | FIN | core / `fin.payment_intent` | Confidential | ISSUER | FIN | 06 §7.1 | FR-R1-044, FR-R1-045 |
| [PaymentCallback](#paymentcallback) | FIN | core / `fin.payment_callback` | Confidential | ISSUER | FIN | 09 §4.1 (inbox) | FR-R1-046, FR-R1-052 |
| [Payment](#payment) | FIN | core / `fin.payment` | Confidential | ISSUER | FIN | 08 §2.6 | FR-R1-046, FR-R1-047, FR-R1-050, FR-R1-052, FR-R1-053, FR-R1-089 |
| [BankStatementLine](#bankstatementline) | FIN | core / `fin.bank_statement_line` | Confidential | ISSUER | FIN | 06 §7.1 | FR-R1-047 |
| [Reconciliation](#reconciliation) | FIN | core / `fin.reconciliation` | Internal | ISSUER | FIN | 06 §7.1 | FR-R1-047 |
| [ReconciliationException](#reconciliationexception) | FIN | core / `fin.reconciliation_exception` | Confidential | ISSUER | FIN | R1 ใหม่ (09 §3.3 exception queue) | FR-R1-046 |
| [Receipt](#receipt) | FIN | core / `fin.receipt` | Confidential | ISSUER | FIN | 08 §2.6 | FR-R1-048, FR-R1-053 |
| [FeeWaiverRequest](#feewaiverrequest) | ADM/FIN | core / `adm.fee_waiver_request` | Confidential | OWN | FIN | 08 §2.2 | FR-R1-049 |
| [Waiver](#waiver) | FIN | core / `fin.waiver` | Confidential | ISSUER | FIN | 06 §7.1 | FR-R1-049 |
| [Refund](#refund) | FIN | core / `fin.refund` | Confidential | ISSUER | FIN | 06 §7.1 | FR-R1-050 |
| [ImportBatch](#importbatch) | ADM/FIN | core / `adm.import_batch / fin.import_batch` | Confidential | OWN | APP | R1 ใหม่ (paper fallback) | FR-R1-053, FR-R1-077 |
| [DocumentTemplate](#documenttemplate) | DOC | core / `doc.document_template` | Internal | OWN | CFG | 06 §5.7 | FR-R1-006, FR-R1-129 |
| [GeneratedDocument](#generateddocument) | DOC | core + object storage / `doc.generated_document` | ตามเนื้อหา | ISSUER | ANN | 08 §2.11 | FR-R1-007, FR-R1-029, FR-R1-033, FR-R1-041, FR-R1-043, FR-R1-048 … |
| [SignatureRecord](#signaturerecord) | DOC | core / `doc.signature_record` | Internal | ISSUER | ANN | 06 §5.7 | FR-R1-007, FR-R1-048 |
| [RequestReceipt](#requestreceipt) | SVC/CASE | core / `svc.request_receipt` | Confidential | RECV | APP | 08 §5 (เลขรับ) | FR-R1-033, FR-R1-099, FR-R1-104 |
| [ServiceRequest](#servicerequest) | SVC | core / `svc.service_request` | Confidential | OWN | APP | 06 §5.5 | FR-R1-049, FR-R1-090 |
| [Appointment](#appointment) | SVC | core / `svc.appointment` | Confidential | OWN | APP | 06 §5.5 (booking R1) | FR-R1-116 |
| [Announcement](#announcement) | ENG | core / `eng.announcement` | Public | ISSUER | ANN | 06 §5.4 | FR-R1-008, FR-R1-010, FR-R1-043, FR-R1-082, FR-R1-085, FR-R1-138 |
| [AudienceSegment](#audiencesegment) | ENG | core / `eng.audience_segment` | Internal | OWN | MSG | 06 §5.4 | FR-R1-138 |
| [RecipientSnapshot](#recipientsnapshot) | ENG | core / `eng.recipient_snapshot` | Confidential | OWN | MSG | 06 §5.4 | FR-R1-138 |
| [NotificationRule](#notificationrule) | NOTI | core / `noti.notification_rule` | Internal | UNI | CFG | 06 §5.3 | FR-R1-133 |
| [MessageTemplate](#messagetemplate) | NOTI | core / `noti.message_template` | Internal | OWN | CFG | 06 §5.3 | FR-R1-133, FR-R1-135 |
| [Message](#message) | NOTI | core / `noti.message` | Confidential | OWN | MSG | 06 §5.3 | FR-R1-111, FR-R1-133, FR-R1-134, FR-R1-135, FR-R1-139 |
| [Delivery](#delivery) | NOTI | core / `noti.delivery` | Confidential | OWN | MSG | 06 §5.3 | FR-R1-134 |
| [InboxItem](#inboxitem) | NOTI | core / `noti.inbox_item` | Confidential | OWN | MSG | 06 §5.3 | FR-R1-136 |
| [ChannelPreference](#channelpreference) | NOTI | core / `noti.channel_preference` | Confidential | NONE | IAM | 06 §5.3 | FR-R1-134, FR-R1-136 |
| [ChannelBinding](#channelbinding) | NOTI | core / `noti.channel_binding` | Confidential | NONE | IAM | 08 §5 | FR-R1-137 |
| [CaseFile](#casefile) | CASE | core / `case.case_file` | Confidential (+ ชั้นความลับตาม DOC) | RECV | CASE | 08 §2.10 | FR-R1-035, FR-R1-099, FR-R1-104 |
| [Appeal](#appeal) | CASE | core / `case.appeal` | Confidential | RECV | CASE | 08 §2.10 | FR-R1-099, FR-R1-101, FR-R1-106 |
| [ScoreRecheck](#scorerecheck) | CASE/ADM | core / `adm.score_recheck` | Confidential | OWN | CASE | R1 ใหม่ (W-18 ขั้น 4) | FR-R1-101 |
| [CaseDecision](#casedecision) | CASE | core / `case.case_decision` | Confidential | RECV | CASE | 06 §5.6 | FR-R1-101, FR-R1-103 |
| [HealthSubject](#healthsubject) | HLT | hlt_vault / `hlt.health_subject` | Sensitive | CARE | SELMED | 08 §2.9 | FR-R1-064, FR-R1-068 |
| [ScreeningResult](#screeningresult) | HLT | hlt_vault / `hlt.screening_result` | Sensitive | CARE | SELMED | 08 §2.9 | FR-R1-064, FR-R1-066, FR-R1-068 |
| [MedicalClearance](#medicalclearance) | HLT | hlt_vault / `hlt.medical_clearance` | Sensitive (สถานะส่งออกได้) | CARE | SELMED | 06 §7.6 | FR-R1-058, FR-R1-064, FR-R1-065, FR-R1-068 |
| [InjuryRecord](#injuryrecord) | HLT | hlt_vault / `hlt.injury` | Sensitive | CARE | INJ | 06 §7.6 (Injury) | FR-R1-067 |
| [DisabilityEvidence](#disabilityevidence) | HLT | hlt_vault / `hlt.disability_evidence` | Sensitive | CARE | DIS | 06 §7.6 (R2) — ใช้ขั้นต่ำใน R1 (gap G-01) | FR-R1-028 |
| [Facility](#facility) | FAC | core / `fac.facility` | Internal | OWN | CFG | 06 §8.2 | FR-R1-054, FR-R1-055 |
| [Booking](#booking) | FAC | core / `fac.booking` | Internal | OWN | OPS | 06 §8.2 | FR-R1-055 |
| [VenueEmergencyPlan](#venueemergencyplan) | FAC | core / `fac.venue_emergency_plan` | Internal | OWN | CFG | W-153 (FAC) | FR-R1-060 |
| [HeatReading](#heatreading) | FAC | core / `fac.heat_reading` | Internal | OWN | OPS | W-153 | FR-R1-061 |
| [OitItem](#oititem) | RPT | core / `rpt.oit_item` | Public (เมื่อเผยแพร่) | OWN | OIT | 06 §5.11 | FR-R1-119, FR-R1-120, FR-R1-121, FR-R1-122 |
| [OitSnapshot](#oitsnapshot) | RPT | object storage WORM / `rpt.oit_snapshot` | Public | OWN | OIT | 06 §5.11 | FR-R1-120, FR-R1-121 |
| [AdminChangeRequest](#adminchangerequest) | ADMIN | core / `admin.change_request` | Internal | OWN | CFG | 06 §5.12 | FR-R1-007, FR-R1-123 |
| [FeatureFlag](#featureflag) | ADMIN | Git/config / `admin.feature_flag` | Internal | OWN | CFG | 06 §5.12 | FR-R1-032 |
| [ReleaseRing](#releasering) | ADMIN | core / `admin.release_ring` | Internal | UNI | CFG | 06 §5.12; ADR-025 | FR-R1-124, FR-R1-131 |
| [JobRun](#jobrun) | ADMIN | core / `admin.job_run` | Internal | OWN | OPS | 06 §5.12 | FR-R1-125 |
| [IntegrationRun](#integrationrun) | ADMIN | core / `admin.integration_run` | Internal | OWN | OPS | 06 §5.12 | FR-R1-125 |
| [BreakGlassSession](#breakglasssession) | ADMIN | core + WORM / `admin.break_glass_session` | Internal | UNI | AUD | 06 §5.12 | FR-R1-126 |
| [JitGrant](#jitgrant) | ADMIN | PAM / `admin.jit_grant` | Internal | UNI | AUD | 06 §5.12 | FR-R1-127 |
| [WaitingRoomPolicy](#waitingroompolicy) | ADMIN | gateway config / `(APISIX/Valkey config)` | Internal | UNI | CFG | ADR-028 | FR-R1-130 |
| [AuditEvent](#auditevent) | AUD | core partition + WORM / `aud.audit_event` | Confidential | OWN | AUD | 08 §2.11 | FR-R1-126, FR-R1-128 |

## 2. รายละเอียดระดับฟิลด์

### AdmissionCycle

รอบปีการศึกษาที่เข้า × ระดับ (เช่น ป.ตรี เข้าปีการศึกษา 2572)

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.admission_cycle` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** UNI — University level — OrgUnit ราก (ใช้ได้เฉพาะ config/ตารางกลาง) (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-001

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `academic_year_be` | int | N | 2500–2700 | — | ปีการศึกษาที่เข้า (พ.ศ.) |
| `level` | text | N | enum: BACHELOR, GRADUATE, BASIC_ED | — |  |
| `policy_set_ref` | uuid | Y | logical ref REC PolicySet | — | ผูกตอน R2 |
| `status` | text | N | enum: PLANNING, OPEN, CLOSED | — |  |

### AdmissionChannel

รายการช่องทางที่ส่วนกลางกำหนด วิทยาเขตเลือกใช้

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.admission_channel` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** UNI — University level — OrgUnit ราก (ใช้ได้เฉพาะ config/ตารางกลาง) (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-001

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `code` | text | N | unique; enum: QUOTA_ACADEMIC, QUOTA_ATHLETE, GENERAL, SPORTS_SCHOOL_INTERNAL, TRANSFER, GRADUATE, INTERNATIONAL, TCAS_R1..R4 | — |  |
| `name_th` | text | N |  | — |  |
| `name_en` | text | N |  | — |  |
| `enabled_in_r1` | boolean | N | default true | — | TRANSFER/GRADUATE/TCAS = feature flag |

### AdmissionRound

รอบรับสมัครที่วิทยาเขตตั้งเอง

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.admission_round` · **ชั้นข้อมูล:** Public (เมื่อเผยแพร่)
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-001, FR-R1-003, FR-R1-005, FR-R1-006, FR-R1-007, FR-R1-008, FR-R1-009, FR-R1-010, FR-R1-019, FR-R1-023, FR-R1-031, FR-R1-037

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `cycle_id` | uuid | N | FK admission_cycle | — |  |
| `channel_id` | uuid | N | FK admission_channel | — |  |
| `round_no` | int | N | ≥ 1; unique (org_unit_id, cycle_id, channel_id, round_no) | — | ทั่วไปรอบ 1..n |
| `name_th` | text | N |  | — |  |
| `name_en` | text | Y |  | — |  |
| `status` | text | N | enum: DRAFT, SUBMITTED, APPROVED, PUBLISHED, OPEN, CLOSED, CANCELLED | — |  |
| `cloned_from_id` | uuid | Y | FK admission_round | — |  |
| `eligibility_ruleset_id` | uuid | Y | FK eligibility_rule_set (เวอร์ชัน) | — |  |
| `scoring_scheme_id` | uuid | Y | FK scoring_scheme | — |  |
| `application_fee_item_ref` | uuid | Y | logical ref FIN FeeItem | — |  |
| `confirmation_fee_item_ref` | uuid | Y | logical ref FIN FeeItem | — |  |
| `max_choices_per_campus` | smallint | N | 1–10; default 3 (C-2) | — |  |
| `confirm_window_hours` | int | N | > 0 (C-6) | — |  |
| `cascade_offer_hours` | int | N | default 48; รอบท้าย 24 (C-9) | — |  |
| `appeal_window_workdays` | smallint | N | default 3; ยืนยัน ≤ 72 ชม. → 1 | — |  |
| `reconfirm_enabled` | boolean | N | default true (C-14) | — |  |
| `requires_identity_verified_to_confirm` | boolean | N | default false | — |  |
| `inherent_requirements_th` | text | Y | บังคับก่อนส่งอนุมัติ (DA-1) | — |  |
| `announcement_id` | uuid | Y | logical ref ENG Announcement | — |  |
| `tcas_enabled` | boolean | N | default false (A-50) | — | อ้าง FeatureFlag |
| `published_at` | timestamptz | Y |  | — |  |

### AdmissionPlan

แผนรับที่กองแผนอนุมัติ (ที่นั่งต่อหลักสูตร × วิทยาเขต × cycle)

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.admission_plan` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-002

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `cycle_id` | uuid | N | FK admission_cycle | — |  |
| `program_offering_id` | uuid | N | logical ref CUR | — |  |
| `planned_seats` | int | N | ≥ 0 | — |  |
| `approved_by` | uuid | N | person_id ผู้อนุมัติ | PD |  |
| `approved_at` | timestamptz | N |  | — |  |

### SeatQuota

ที่นั่งต่อรอบ × program offering × (ชนิดกีฬา × เพศ × sub-bucket)

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.seat_quota` · **ชั้นข้อมูล:** Public (จำนวนที่นั่ง)
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-002, FR-R1-009, FR-R1-019, FR-R1-091, FR-R1-098, FR-R1-102

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `round_id` | uuid | N | FK admission_round | — |  |
| `program_offering_id` | uuid | N | logical ref CUR | — |  |
| `study_mode` | text | N | enum: REGULAR, SPECIAL | — |  |
| `sport_code` | text | Y | ref ชนิดกีฬา (reference data) | — |  |
| `gender` | text | Y | enum: M, F, ANY | — |  |
| `parent_quota_id` | uuid | Y | FK seat_quota (sub-bucket) | — |  |
| `sub_bucket_type` | text | Y | enum: POSITION_GROUP, WEIGHT_CLASS | — |  |
| `sub_bucket_value` | text | Y |  | — |  |
| `seats` | int | N | ≥ 0; Σ ≤ AdmissionPlan และ ≤ AccreditedIntakeCap (hard stop) | — |  |
| `spill_over_rule` | text | Y | enum: TO_PARENT_RANK, NONE | — |  |
| `carried_over_from_round_id` | uuid | Y | FK admission_round | — | J-06 |

### EligibilityRuleSet

DMN เกณฑ์คุณสมบัติของรอบแบบมีเวอร์ชัน

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.eligibility_rule_set` · **ชั้นข้อมูล:** Public (เมื่อเผยแพร่)
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ (รายละเอียดของ 'Eligibility rules' ใน 02 §2.1) · **FR:** FR-R1-003, FR-R1-021

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `round_id` | uuid | N | FK admission_round | — |  |
| `version` | int | N | unique (round_id, version) | — |  |
| `dmn_xml` | text | N | DMN 1.3 ผ่าน validation | — |  |
| `test_run_ref` | uuid | Y | ผลทดสอบล่าสุด | — |  |
| `status` | text | N | enum: DRAFT, PUBLISHED, SUPERSEDED | — |  |

### ScoringScheme

องค์ประกอบคะแนน น้ำหนัก วิธีรวม tie-break

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.scoring_scheme` · **ชั้นข้อมูล:** Public (เมื่อเผยแพร่)
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-004, FR-R1-075

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `round_id` | uuid | N | FK; 1:1 | — |  |
| `components` | jsonb | N | [{code, weight}] Σweight = 100 | — |  |
| `aggregation` | text | N | enum: MEAN, TRIMMED_MEAN (≥5 judges), MEDIAN | — |  |
| `variance_threshold_pct` | numeric(5,2) | N | default 20.00 [ต้องตรวจสอบ] | — |  |
| `tie_break_order` | jsonb | N | ลำดับเกณฑ์ | — |  |
| `cross_panel_method` | text | Y | null = ไม่ normalisation (D-06) | — |  |
| `version` | int | N |  | — |  |

### Rubric

rubric ต่อ station/ชนิดกีฬา (clone ข้ามวิทยาเขตได้)

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.rubric` · **ชั้นข้อมูล:** Public (เมื่อเผยแพร่)
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-004

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `scoring_scheme_id` | uuid | N | FK | — |  |
| `station_type` | text | N | enum: OBJECTIVE, SUBJECTIVE | — |  |
| `sport_code` | text | Y |  | — |  |
| `name_th` | text | N |  | — |  |
| `max_score` | numeric(6,2) | N | > 0 | — |  |
| `safety_review_by` | uuid | Y | physician (ชนิดกีฬาใหม่) | PD | 02 §2.5.3 |

### RubricItem

หัวข้อให้คะแนน/รายการวัด

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.rubric_item` · **ชั้นข้อมูล:** Public (เมื่อเผยแพร่)
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-004, FR-R1-072

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `rubric_id` | uuid | N | FK | — |  |
| `seq` | smallint | N |  | — |  |
| `label_th` | text | N |  | — |  |
| `min_score` | numeric(6,2) | N |  | — |  |
| `max_score` | numeric(6,2) | N | > min | — |  |
| `unit` | text | Y | s, m, count (OBJECTIVE) | — |  |
| `trials` | smallint | Y | ≥ 1 (OBJECTIVE) | — |  |
| `plausible_min` | numeric | Y | validation | — |  |
| `plausible_max` | numeric | Y |  | — |  |
| `norm_table_ref` | uuid | Y | ตารางเกณฑ์เพศ/อายุ | — |  |

### Application

ใบสมัคร 1 ใบต่อผู้สมัครต่อรอบ

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.application` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-016, FR-R1-020, FR-R1-021, FR-R1-022, FR-R1-023, FR-R1-024, FR-R1-025, FR-R1-026, FR-R1-027, FR-R1-029, FR-R1-030, FR-R1-031, FR-R1-032, FR-R1-033, FR-R1-034, FR-R1-035, FR-R1-080, FR-R1-092, FR-R1-110

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | วิทยาเขตที่เปิดรอบ; RLS | — |  |
| `person_id` | uuid | N | logical ref REC Person | PD |  |
| `round_id` | uuid | N | FK admission_round; unique (person_id, round_id) | — |  |
| `application_no` | text | N | unique; `{cycle}{campus}{channel}{running}` | PD | Ref1 ค่าสมัคร |
| `status` | text | N | enum: draft, submitted, paid, verified, eligible, provisionally_eligible, ineligible, tested, scored, passed, reserve, failed, withdrawn, suspended | — | สถานะ offer อยู่ใน Offer |
| `is_minor` | boolean | N | คำนวณ ณ วันยื่น | PD |  |
| `gpax` | numeric(3,2) | Y | 0.00–4.00 | PD |  |
| `gpax_semesters` | smallint | Y |  | PD |  |
| `gpax_ocr` | numeric(3,2) | Y |  | PD | FR-R1-022 |
| `study_plan` | text | Y |  | PD |  |
| `previous_school_code` | text | Y | ref reference data โรงเรียน | PD |  |
| `sport_profile` | jsonb | Y | สโมสร สมาคม โค้ช ปีที่เล่น (ใช้ COI) | PD |  |
| `weight_class` | text | Y | ล็อกหลัง submitted | PD | ข้อมูลร่างกาย (L-36) — เก็บเฉพาะรุ่นที่สมัคร |
| `eligibility_ruleset_version` | int | Y |  | — |  |
| `guardian_consent_ref` | uuid | Y | logical ref PRIV | — |  |
| `submitted_at` | timestamptz | Y |  | — |  |
| `assisted_session_id` | uuid | Y | FK assisted_session | — |  |
| `tcas_external_ref` | text | Y |  | PD | ถ้า adapter เปิด |

### ApplicationChoice

อันดับ (campus × program × sport) ในใบสมัคร

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.application_choice` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-020, FR-R1-034

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `application_id` | uuid | N | FK | — |  |
| `seat_quota_id` | uuid | N | FK | — |  |
| `rank_pref` | smallint | N | 1..max_choices | — |  |
| `eligibility_result` | text | Y | enum: PASS, FAIL, PENDING | PD |  |
| `eligibility_reasons` | jsonb | Y | ข้อความ TH/EN | PD |  |
| `status` | text | N | enum เดียวกับ Application + withdrawn | — |  |

### ApplicationDocument

เอกสารแนบของใบสมัคร (ไม่รวมเอกสารสุขภาพ/ความพิการ ซึ่งอยู่ใน hlt_vault)

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core + object storage · **ตาราง:** `adm.application_document` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-022, FR-R1-027, FR-R1-030, FR-R1-036, FR-R1-037, FR-R1-038, FR-R1-042

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `application_id` | uuid | N | FK | — |  |
| `doc_type` | text | N | enum ตาม checklist | — |  |
| `object_key` | text | N | bucket clean (random key) | PD |  |
| `sha256` | char(64) | N | index สำหรับตรวจซ้ำ | — |  |
| `mime_type` | text | N | allow-list | — |  |
| `size_bytes` | bigint | N | ≤ 10 MB (วิดีโอ ≤ 200 MB) | — |  |
| `scan_status` | text | N | enum: PENDING, CLEAN, REJECTED | — |  |
| `verification_status` | text | N | enum: PENDING, VERIFIED, REJECTED, MORE_REQUESTED | — |  |

### UploadSession

session ของ multipart upload (presigned) ใช้ resume

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.upload_session` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** OPS — 1 ปี (metadata ปฏิบัติการ) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ · **FR:** FR-R1-036

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `application_id` | uuid | N | FK | — |  |
| `upload_id` | text | N | S3 multipart id | — |  |
| `declared_type` | text | N |  | — |  |
| `declared_size` | bigint | N |  | — |  |
| `expires_at` | timestamptz | N | ≤ 24 ชม. | — |  |

### DocumentRequest

คำขอเอกสารเพิ่มพร้อม deadline

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.document_request` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ (W-77) · **FR:** FR-R1-039

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `application_id` | uuid | N | FK | — |  |
| `items` | jsonb | N | รายการ + เหตุผลที่ผู้สมัครเห็น | PD |  |
| `deadline` | timestamptz | N |  | — |  |
| `status` | text | N | enum: OPEN, FULFILLED, EXPIRED | — |  |
| `requested_by` | uuid | N |  | PD |  |

### VerificationTask

งานตรวจเอกสาร/ผลงาน (ผู้ตรวจคนที่ 1/2, สมาคม)

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.verification_task` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-025, FR-R1-038, FR-R1-039, FR-R1-040, FR-R1-041

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `subject_type` | text | N | enum: DOCUMENT, SPORT_ACHIEVEMENT, APPLICATION | — |  |
| `subject_id` | uuid | N |  | — |  |
| `stage` | text | N | enum: FIRST, SECOND, FEDERATION | — |  |
| `assignee_id` | uuid | Y |  | PD |  |
| `decision` | text | Y | enum: VERIFIED, REJECTED, MORE_REQUESTED, CONFIRMED_BY_FEDERATION, NOT_CONFIRMED | — |  |
| `reason_th` | text | Y | บังคับเมื่อ reject/ขอเพิ่ม | PD |  |
| `flags` | jsonb | Y | GPAX_MISMATCH, DUP_HASH, … | — |  |
| `sla_due_at` | timestamptz | N | ≤ 3 วันทำการ | — |  |
| `decided_at` | timestamptz | Y |  | — |  |

### SportAchievement

ผลงานกีฬาที่ผู้สมัครแจ้ง

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.sport_achievement` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 (ผูก PERSON) · **FR:** FR-R1-024, FR-R1-025, FR-R1-041

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `person_id` | uuid | N |  | PD |  |
| `application_id` | uuid | N | FK | — |  |
| `competition_ref` | text | Y | competition master | — |  |
| `competition_name` | text | N |  | PD |  |
| `level` | text | N | enum: L1..L5 (ระบบคำนวณ) | PD |  |
| `placing` | text | Y |  | PD |  |
| `event_date` | date | N |  | PD |  |
| `evidence_document_id` | uuid | N | FK application_document | — |  |
| `counted` | boolean | N | false ถ้านอกช่วงวันที่ | — |  |
| `verification_status` | text | N | enum: PENDING, VERIFIED, NOT_CONFIRMED | — |  |

### EligibleList

ประกาศผู้มีสิทธิ์สอบของรอบ

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.eligible_list` · **ชั้นข้อมูล:** Public (ฉบับ mask)
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ (W-42 ขั้น 1) · **FR:** FR-R1-043

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `round_id` | uuid | N | FK | — |  |
| `announcement_id` | uuid | Y | ENG | — |  |
| `document_id` | uuid | Y | DOC GeneratedDocument (PDF mask) | — |  |
| `counts` | jsonb | N | eligible/ineligible | — |  |
| `published_at` | timestamptz | Y |  | — |  |

### AccommodationRequest

คำขอ accommodation (เฉพาะประเภทที่ขอ; หลักฐานอยู่ใน hlt_vault)

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.accommodation_request` · **ชั้นข้อมูล:** Confidential (ไม่มีการวินิจฉัย)
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ (02 DA-2; 06 adm.AccommodationRequested) · **FR:** FR-R1-028

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `application_id` | uuid | N | FK | — |  |
| `need_categories` | text[] | N | EXTRA_TIME, LARGE_PRINT, BRAILLE, READER, SCRIBE, SIGN_LANGUAGE, GROUND_FLOOR, ADAPTED_SKILL_TEST, PARA_GROUPING | PD | ไม่ใช่การวินิจฉัย |
| `evidence_ref` | uuid | Y | logical ref HLT DisabilityEvidence | — |  |
| `submitted_at` | timestamptz | N |  | — |  |
| `provisional` | boolean | N | true ถ้ายื่น < 10 วันทำการก่อนสอบ | — |  |
| `status` | text | N | enum: SUBMITTED, APPROVED, REJECTED, PROVISIONAL | — |  |
| `forward_to_studies_consent` | boolean | Y | ยินยอมส่งต่อหลังรายงานตัว (DA-6) | PD |  |

### AccommodationPlan

แผนการปรับที่อนุมัติ (รายการปรับเท่านั้น) ที่ส่งให้ slot/กรรมการ

- **โมดูลเจ้าของ:** ADM (interim; เจ้าของถาวร AFF — gap G-01) · **ที่เก็บ:** core · **ตาราง:** `adm.accommodation_plan` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 AFF (aff.AccommodationGranted) — R1 interim ใน ADM · **FR:** FR-R1-028, FR-R1-106

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `request_id` | uuid | N | FK accommodation_request | — |  |
| `items` | jsonb | N | [{type: EXTRA_TIME, value: 50%}, …] | PD |  |
| `approved_by` | uuid | N | dss | PD |  |
| `head_assessment` | text | Y | ยังวัดสมรรถนะหลักได้ | PD |  |
| `valid_for_round_id` | uuid | N |  | — |  |

### QualificationEquivalence

งานเทียบวุฒิผู้สมัครต่างชาติ

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.qualification_equivalence` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-029

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `application_id` | uuid | N | FK | — |  |
| `country` | char(3) | N | ISO 3166 alpha-3 | PD |  |
| `qualification` | text | N |  | PD |  |
| `equivalence_doc_id` | uuid | Y |  | — |  |
| `result` | text | Y | enum: EQUIVALENT, NOT_EQUIVALENT, PENDING | PD |  |

### TcasSyncRecord

รายการแลกเปลี่ยนกับ myTCAS (adapter ปิดโดยค่าเริ่มต้น)

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.tcas_sync_record` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-032

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `application_id` | uuid | Y |  | — |  |
| `batch_id` | uuid | N |  | — |  |
| `direction` | text | N | IN, OUT | — |  |
| `external_status` | text | Y | สถานะ myTCAS | PD |  |
| `file_hash` | char(64) | Y | unique กันนำเข้าซ้ำ | — |  |

### AdmissionTestSession

session สอบทักษะ/สัมภาษณ์/ข้อเขียนของการคัดเลือก

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.admission_test_session` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-054, FR-R1-055, FR-R1-058, FR-R1-060, FR-R1-061, FR-R1-063, FR-R1-069

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `round_id` | uuid | N | FK | — |  |
| `kind` | text | N | enum: SKILL, INTERVIEW, WRITTEN, ONLINE_INTERVIEW | — |  |
| `sport_code` | text | Y |  | — |  |
| `gender` | text | Y |  | — |  |
| `starts_at` | timestamptz | N |  | — |  |
| `ends_at` | timestamptz | N | > starts_at | — |  |
| `facility_booking_ref` | uuid | Y | logical ref FAC Booking | — |  |
| `room_ref` | uuid | Y | ORG Room | — |  |
| `venue_emergency_plan_ref` | uuid | Y | FAC; บังคับสำหรับ SKILL | — |  |
| `medical_staff` | jsonb | Y | nurse/physician ที่ประจำ | PD |  |
| `status` | text | N | enum: PLANNED, PUBLISHED, IN_PROGRESS, LOCKED | — |  |
| `lock_hash` | char(64) | Y | SHA-256 ของชุดผล (ScoreLock) | — |  |

### TestStation

สถานีทดสอบใน session

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.test_station` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-054, FR-R1-071

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `session_id` | uuid | N | FK | — |  |
| `rubric_id` | uuid | N | FK | — |  |
| `station_type` | text | N | OBJECTIVE, SUBJECTIVE | — |  |
| `capacity_per_hour` | int | N | > 0 | — |  |
| `changeover_min` | int | N | ≥ 0 | — |  |
| `outdoor` | boolean | N | ใช้ WBGT gate | — |  |
| `suspended_reason` | text | Y | HEAT, WEATHER, EQUIPMENT | — |  |

### TestSlot

slot ของผู้สอบใน session

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.test_slot` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ (slot ที่ 02 QS-7 อ้าง) · **FR:** FR-R1-058, FR-R1-059, FR-R1-061, FR-R1-062, FR-R1-063, FR-R1-065, FR-R1-066, FR-R1-070, FR-R1-105

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `session_id` | uuid | N | FK | — |  |
| `application_choice_id` | uuid | N | FK | — |  |
| `starts_at` | timestamptz | N |  | — |  |
| `duration_min` | int | N | ปรับตาม accommodation | — |  |
| `status` | text | N | enum: ALLOCATED, CONFIRMED, CHECKED_IN, NO_SHOW, DEFERRED, COMPLETED | — |  |
| `qr_token_hash` | char(64) | N | token ลงนาม; ไม่มี PII | — |  |
| `accommodation_flags` | text[] | Y | รายการปรับเท่านั้น | PD |  |
| `video_link` | text | Y | สัมภาษณ์ออนไลน์ | PD |  |

### CheckIn

การเช็คอินผู้สอบ (offline sync)

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.check_in` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ (W-76 ขั้น 1) · **FR:** FR-R1-070

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 สร้างฝั่ง client | — | idempotent |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `slot_id` | uuid | N | FK test_slot | — |  |
| `station_id` | uuid | Y |  | — |  |
| `checked_in_at` | timestamptz | N |  | — |  |
| `device_id` | uuid | N | FK judge_device | — |  |
| `method` | text | N | QR, MANUAL_ID | — |  |

### JudgePanel

ชุดกรรมการต่อ station

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.judge_panel` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-056

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `station_id` | uuid | N | FK | — |  |
| `min_judges` | smallint | N | default 3 | — |  |
| `chair_assignment_id` | uuid | Y |  | — |  |

### JudgeAssignment

การแต่งตั้งกรรมการรายคนต่อ panel (สร้าง relationship judge-of-session สำหรับ RLS)

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.judge_assignment` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-056, FR-R1-057, FR-R1-069, FR-R1-078

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `panel_id` | uuid | N | FK | — |  |
| `person_id` | uuid | N | staff หรือ ExternalPerson | PD |  |
| `role` | text | N | JUDGE, CHAIR, MEASURER, CHECKER | — |  |
| `appointment_document_id` | uuid | Y | คำสั่งแต่งตั้ง (DOC) | — |  |
| `valid_to` | timestamptz | N | สิ้นสุด session + ระยะอุทธรณ์ | — |  |

### ConflictDeclaration

การประกาศ/ตรวจพบ COI

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.conflict_declaration` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-057

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `judge_assignment_id` | uuid | N | FK | — |  |
| `applicant_person_id` | uuid | N |  | PD |  |
| `relation` | text | N | COACH, SCHOOL, RELATIVE, OTHER | PD |  |
| `source` | text | N | DECLARED, AUTO_DETECTED | — |  |
| `recused` | boolean | N |  | — |  |

### JudgeScore

คะแนน/ผลวัดรายกรรมการ × ผู้สอบ × rubric item

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.judge_score` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-071, FR-R1-072, FR-R1-073, FR-R1-077, FR-R1-084

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 ฝั่ง client | — | idempotent sync |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `judge_assignment_id` | uuid | N | FK | — |  |
| `application_choice_id` | uuid | N | FK | — |  |
| `rubric_item_id` | uuid | N | FK | — |  |
| `trial_no` | smallint | Y | OBJECTIVE | — |  |
| `raw_value` | numeric | N | ภายใน plausible range | PD |  |
| `score` | numeric(6,2) | Y | หลังแปลงตามตาราง | PD |  |
| `captured_at` | timestamptz | N |  | — |  |
| `locked_at` | timestamptz | Y | ตั้งเมื่อส่ง | — |  |
| `device_id` | uuid | N |  | — |  |
| `source` | text | N | TABLET, PAPER_IMPORT | — |  |
| `reopened_reason` | text | Y |  | PD |  |
| _(table constraint)_ | | | unique (judge_assignment_id, application_choice_id, rubric_item_id, trial_no) | | ซ้ำ → conflict queue |

### ScoreSyncConflict

รายการขัดแย้งจากการ sync หลายเครื่อง

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.score_sync_conflict` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ · **FR:** FR-R1-073

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `score_key` | text | N | คีย์ธรรมชาติของ JudgeScore | — |  |
| `values` | jsonb | N | ค่าจากแต่ละเครื่อง | PD |  |
| `resolved_value` | numeric | Y |  | PD |  |
| `resolved_by` | uuid | Y | ประธาน | PD |  |
| `reason` | text | Y | บังคับเมื่อ resolve | PD |  |

### JudgeDevice

tablet ที่ลงทะเบียนสำหรับ offline scoring

- **โมดูลเจ้าของ:** ADM (ทะเบียนร่วม IAM/MDM) · **ที่เก็บ:** core · **ตาราง:** `adm.judge_device` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** OPS — 1 ปี (metadata ปฏิบัติการ) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ (07 §11.8) · **FR:** FR-R1-069, FR-R1-073

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `mdm_device_id` | text | N | unique | — |  |
| `status` | text | N | ACTIVE, REVOKED | — |  |
| `revoked_at` | timestamptz | Y |  | — |  |
| `last_sync_at` | timestamptz | Y |  | — |  |

### ModerationFlag

flag ความต่างของคะแนนกรรมการ

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.moderation_flag` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ (W-76 ขั้น 3) · **FR:** FR-R1-074

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `station_id` | uuid | N |  | — |  |
| `application_choice_id` | uuid | N |  | — |  |
| `range_pct` | numeric(5,2) | N |  | PD |  |
| `raised_at` | timestamptz | N |  | — |  |
| `due_at` | timestamptz | N | ≤ 1 วันทำการ | — |  |
| `status` | text | N | OPEN, RESOLVED | — |  |

### ScoreModeration

ผล moderation โดยประธาน

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.score_moderation` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-074

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `flag_id` | uuid | N | FK moderation_flag | — |  |
| `action` | text | N | RESCORED, KEPT | — |  |
| `reason_th` | text | N |  | PD |  |
| `moderated_by` | uuid | N |  | PD |  |

### ScoreLock

บันทึกการล็อกผล session พร้อม hash (ใช้ใน integrity job)

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.score_lock` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ (SoD-14 / SEC-01) · **FR:** FR-R1-076

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `session_id` | uuid | N | FK; unique (session_id, version) | — |  |
| `version` | int | N |  | — |  |
| `hash` | char(64) | N | SHA-256 | — |  |
| `confirmed_by` | uuid | N | head | PD |  |
| `confirmed_at` | timestamptz | N |  | — |  |

### CompositeScore

คะแนนรวมต่ออันดับ (choice)

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.composite_score` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-075, FR-R1-076, FR-R1-079, FR-R1-084

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `application_choice_id` | uuid | N | FK; 1:1 | — |  |
| `components` | jsonb | N | ค่าต่อองค์ประกอบ | PD |  |
| `total` | numeric(7,3) | N |  | PD |  |
| `scheme_version` | int | N |  | — |  |
| `input_hash` | char(64) | N |  | — |  |

### RankList

อันดับต่อ seat quota

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.rank_list` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-079, FR-R1-080, FR-R1-081

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `round_id` | uuid | N | FK | — |  |
| `version` | int | N |  | — |  |
| `status` | text | N | COMPUTED, CHAIR_CONFIRMED, DEAN_ENDORSED, APPROVED, PUBLISHED | — |  |
| `entries` | jsonb | N | [{choice_id, rank, result, tie_break_used}] | PD |  |
| `hash` | char(64) | N |  | — |  |

### ReserveListEntry

ลำดับสำรองสำหรับ cascade

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.reserve_list_entry` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-079, FR-R1-080, FR-R1-091

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `seat_quota_id` | uuid | N |  | — |  |
| `application_choice_id` | uuid | N |  | — |  |
| `reserve_rank` | int | N | unique (seat_quota_id, reserve_rank) | PD |  |
| `status` | text | N | WAITING, OFFERED, SKIPPED, EXHAUSTED | — |  |

### ResultOverride

การแก้ผล/คะแนนหลังล็อก (2 คน)

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.result_override` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ (SoD-14) · **FR:** FR-R1-081

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `rank_list_id` | uuid | N |  | — |  |
| `application_choice_id` | uuid | N |  | — |  |
| `change` | jsonb | N | before/after | PD |  |
| `reason_th` | text | N |  | PD |  |
| `proposed_by` | uuid | N |  | PD |  |
| `approved_by` | uuid | Y | ≠ proposed_by | PD |  |
| `appeal_id` | uuid | Y | CASE | — |  |

### ResultPublication

การประกาศผลและ shard บน CDN

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core + CDN · **ตาราง:** `adm.result_publication` · **ชั้นข้อมูล:** Confidential (shard = PD แบบจำกัด)
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ · **FR:** FR-R1-082, FR-R1-083

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `round_id` | uuid | N |  | — |  |
| `rank_list_version` | int | N |  | — |  |
| `announcement_id` | uuid | Y |  | — |  |
| `shard_manifest_key` | text | N |  | — | key ของ shard = HMAC(application_no + birth_date) |
| `published_at` | timestamptz | N |  | — |  |
| `hold_until` | timestamptz | N | +10 นาที | — |  |

### Offer

ข้อเสนอที่นั่ง

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.offer` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-026, FR-R1-051, FR-R1-086, FR-R1-087, FR-R1-088, FR-R1-089, FR-R1-090, FR-R1-091, FR-R1-092, FR-R1-093, FR-R1-094, FR-R1-095, FR-R1-096, FR-R1-097, FR-R1-098, FR-R1-100, FR-R1-102, FR-R1-110, FR-R1-114, FR-R1-117

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `offer_id` | uuid | N | PK | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `application_choice_id` | uuid | N | FK | — |  |
| `program_offering_id` | uuid | N |  | — |  |
| `status` | text | N | made, confirmed, reconfirmed, reported, declined, expired, released, waived, no_show | — |  |
| `confirm_deadline` | timestamptz | N | ไม่นับ quiet hours (C-6) | — |  |
| `from_reserve` | boolean | N |  | — |  |
| `confirmed_at` | timestamptz | Y |  | — |  |
| `waive_reason` | text | Y | DECLINED, LAPSED, CONFIRMED_ELSEWHERE, NOT_RECONFIRMED, NO_SHOW, WAIVED_AFTER_CONFIRM | — |  |
| `counts_toward_c5` | boolean | N | true เฉพาะสละหลังยืนยัน | — |  |
| `invoice_ref` | uuid | Y | FIN | — |  |
| `reporting_mode` | text | Y | ONLINE, COUNTER | — |  |

### ConfirmationLock

ตารางระดับมหาวิทยาลัยที่บังคับ ≤ 1 สิทธิ์ต่อคนต่อ cycle ต่อระดับ ด้วย unique constraint (เห็นได้เฉพาะ service ADM; เจ้าหน้าที่เห็นเพียงธงตาม C-11)

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.confirmation_lock` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** UNI — University level — OrgUnit ราก (ใช้ได้เฉพาะ config/ตารางกลาง) (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ (บังคับ C-3 ข้ามวิทยาเขต แทน ClearingRun ที่เลื่อน — D-06) · **FR:** FR-R1-088

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | OrgUnit ราก (university) | — |  |
| `person_hmac` | char(64) | N | HMAC ของ identifier (core context) | PD | ไม่ใช่เลขบัตร |
| `cycle_id` | uuid | N |  | — |  |
| `level` | text | N |  | — |  |
| `offer_id` | uuid | N | FK offer | — |  |
| _(table constraint)_ | | | UNIQUE (person_hmac, cycle_id, level) | | ลบแถวเมื่อสละ/หมดเวลา |

### Reconfirmation

การยืนยันซ้ำก่อนเปิดภาค

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.reconfirmation` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ (W-163) · **FR:** FR-R1-095

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `offer_id` | uuid | N |  | — |  |
| `window_end` | timestamptz | N |  | — |  |
| `reminders_sent` | smallint | N | 0–2 | — |  |
| `call_task_status` | text | Y | PENDING, CALLED, UNREACHABLE | PD |  |
| `result` | text | Y | RECONFIRMED, WAIVED | — |  |

### NoShowNotice

การแจ้งเหตุไม่มารายงานตัว

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.no_show_notice` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ (C-10) · **FR:** FR-R1-096

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `offer_id` | uuid | N |  | — |  |
| `filed_at` | timestamptz | N | ≤ 7 วัน | — |  |
| `reason_th` | text | N |  | PD |  |
| `decision` | text | Y | ACCEPTED, REJECTED | — |  |

### AppealHold

การกันที่นั่งสุดท้ายของ sub-bucket ระหว่างอุทธรณ์

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.appeal_hold` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ (C-15) — เสนอเพิ่มใน 08 · **FR:** FR-R1-091, FR-R1-100, FR-R1-102

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `seat_quota_id` | uuid | N | unique ต่อ appeal ที่ active | — |  |
| `appeal_id` | uuid | N | CASE | — |  |
| `placed_at` | timestamptz | N |  | — |  |
| `released_at` | timestamptz | Y |  | — |  |
| `release_outcome` | text | Y | USED_BY_WINNER, TO_CASCADE | — |  |

### TestIncident

เหตุการณ์วันสอบ (ขาดสอบ, เลื่อนด้วยเหตุสุขภาพ, บาดเจ็บ, อุปกรณ์ขัดข้อง, ทุจริต)

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.test_incident` · **ชั้นข้อมูล:** Confidential (ไม่มีการวินิจฉัย)
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-035, FR-R1-066, FR-R1-067, FR-R1-105

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `slot_id` | uuid | Y |  | — |  |
| `application_id` | uuid | N |  | — |  |
| `type` | text | N | NO_SHOW, HEALTH_DEFERRAL, INJURY, EQUIPMENT, MISCONDUCT, WEATHER | PD | ไม่มีรายละเอียดทางการแพทย์ |
| `health_record_ref` | uuid | Y | logical ref hlt_vault (InjuryRecord) | — |  |
| `case_ref` | uuid | Y | CASE (ทุจริต) | — |  |
| `recorded_by` | uuid | N |  | PD |  |

### RetestRequest

คำขอสอบใหม่/เลื่อน

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.retest_request` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ (W-85) · **FR:** FR-R1-105

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `incident_id` | uuid | Y |  | — |  |
| `application_id` | uuid | N |  | — |  |
| `filed_at` | timestamptz | N | ≤ 48 ชม. | — |  |
| `decision` | text | Y | APPROVED, REJECTED | — |  |
| `new_slot_id` | uuid | Y |  | — |  |

### ReportingHandoff

ข้อมูลส่งต่อผู้ยืนยันสิทธิ์ให้ REC (R2) หรือระบบทะเบียนเดิม

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.reporting_handoff` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ — เสนอเพิ่มใน 08 (สะพาน W-78 ก่อน REC เต็ม) · **FR:** FR-R1-042, FR-R1-114, FR-R1-115, FR-R1-116, FR-R1-117, FR-R1-118

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `offer_id` | uuid | N | unique | — |  |
| `person_id` | uuid | N |  | PD |  |
| `program_offering_id` | uuid | N |  | — |  |
| `documents` | jsonb | N | [{doc_type, sha256, verified_by}] | PD |  |
| `identity_assurance` | text | N | THAID, OTP_ONLY, IN_PERSON, … | PD |  |
| `accommodation_plan_ref` | uuid | Y | เฉพาะเมื่อยินยอม | — |  |
| `late_admit` | boolean | N |  | — |  |
| `status` | text | N | READY, REPORTED, EXPORTED_TO_LEGACY, CONSUMED_BY_REC, NO_SHOW | — |  |
| `exported_at` | timestamptz | Y |  | — |  |

### LegacyConfirmationFile

ไฟล์รายชื่อผู้ยืนยันสิทธิ์จากวิทยาเขตที่ยังใช้ระบบเดิม

- **โมดูลเจ้าของ:** ADM · **ที่เก็บ:** core · **ตาราง:** `adm.legacy_confirmation_file` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ (BR-01) · **FR:** FR-R1-097

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `source_org_unit_id` | uuid | N |  | — |  |
| `file_hash` | char(64) | N | unique | — |  |
| `row_count` | int | N |  | — |  |
| `matches` | int | N |  | — |  |

### AssistedSession

session ที่เจ้าหน้าที่ทำแทนผู้สมัคร/ผู้ปกครอง

- **โมดูลเจ้าของ:** ADM (ร่วม IAM) · **ที่เก็บ:** core · **ตาราง:** `adm.assisted_session` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** AUD — 10 ปี WORM (08 §8)
- **สถานะในเล่ม 08:** R1 ใหม่ (D-08) · **FR:** FR-R1-016

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `staff_id` | uuid | N |  | PD |  |
| `subject_person_id` | uuid | N |  | PD |  |
| `otp_verified_at` | timestamptz | Y |  | — |  |
| `expires_at` | timestamptz | N | ≤ 30 นาที | — |  |

### StandardExport

การดึง export มาตรฐาน/ad-hoc

- **โมดูลเจ้าของ:** ANA/DOC (ใช้โดย ADM) · **ที่เก็บ:** core · **ตาราง:** `ana.standard_export_run` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** AUD — 10 ปี WORM (08 §8)
- **สถานะในเล่ม 08:** 06 ANA StandardExportDefinition · **FR:** FR-R1-115, FR-R1-132

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `definition_code` | text | N |  | — |  |
| `requested_by` | uuid | N |  | PD |  |
| `purpose` | text | Y | บังคับ ad-hoc | — |  |
| `row_count` | int | N |  | — |  |
| `watermark` | text | N |  | PD |  |
| `file_hash` | char(64) | N |  | — |  |

### OrgUnit

หน่วยงานในลำดับชั้น (ตารางนี้คือที่มาของ org_unit_id)

- **โมดูลเจ้าของ:** ORG · **ที่เก็บ:** core · **ตาราง:** `org.org_unit` · **ชั้นข้อมูล:** Public
- **`org_unit_id`:** NONE — ไม่มี `org_unit_id` — ข้อยกเว้นตาม 08 §6 (Person/reference); มองเห็นผ่าน `person_in_scope`/relationship
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.1 · **FR:** FR-R1-124

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `org_unit_id` | uuid | N | PK | — |  |
| `parent_id` | uuid | Y | FK | — |  |
| `type` | text | N | UNIVERSITY, HQ, CAMPUS, SPORTS_SCHOOL, GRAD_SCHOOL, FACULTY, DEPT, PROGRAM_OFFICE | — |  |
| `code` | text | N | unique | — |  |
| `path` | ltree | N |  | — |  |
| `name_th` | text | N |  | — |  |
| `name_en` | text | N |  | — |  |
| `go_live_r1` | boolean | N | release ring | — |  |

### OrgSetting

ค่าตั้งราย OrgUnit (สืบทอด/override) เช่น ผู้ลงนาม scheme เลข

- **โมดูลเจ้าของ:** ORG · **ที่เก็บ:** core · **ตาราง:** `org.org_setting` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.1 (effective-dated) · **FR:** FR-R1-124

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `key` | text | N |  | — |  |
| `value` | jsonb | N |  | — |  |
| `valid_from` | date | N |  | — |  |
| `valid_to` | date | Y |  | — |  |
| `change_request_id` | uuid | Y | 4-eyes | — |  |

### CalendarEvent

milestone ของรอบ (ADM_*) เป็น window

- **โมดูลเจ้าของ:** ORG · **ที่เก็บ:** core · **ตาราง:** `org.calendar_event` · **ชั้นข้อมูล:** Public
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.1 · **FR:** FR-R1-005, FR-R1-008, FR-R1-131

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `calendar_id` | uuid | N |  | — |  |
| `type` | text | N | ADM_ROUND_APPLY, ADM_RESULT_PUBLISH, ADM_APPEAL_WINDOW, ADM_CONFIRM, ADM_REPORTING, ADM_RECONFIRM_WINDOW, ADM_CASCADE_CUTOFF, … | — |  |
| `subject_ref` | uuid | Y | round_id | — |  |
| `start_at` | timestamptz | N |  | — |  |
| `end_at` | timestamptz | Y |  | — |  |
| `notify` | boolean | N |  | — |  |
| `linter_results` | jsonb | Y |  | — |  |

### GateOverride

ข้อยกเว้นรายบุคคล/กลุ่มของ window (ขยาย deadline offer, appeal)

- **โมดูลเจ้าของ:** ORG · **ที่เก็บ:** core · **ตาราง:** `org.gate_override` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 03 §(GateOverride) · **FR:** FR-R1-094, FR-R1-100

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `subject_person_id` | uuid | N |  | PD |  |
| `gate` | text | N | ADM_CONFIRM, … | — |  |
| `new_close` | timestamptz | N |  | — |  |
| `reason` | text | N |  | PD |  |
| `requested_by` | uuid | N |  | PD |  |
| `approved_by` | uuid | Y | ≠ requested_by | PD |  |
| `expires_on` | timestamptz | N |  | — |  |

### Room

ห้อง/อาคาร (ใช้เป็นห้องสอบข้อเขียน/สัมภาษณ์)

- **โมดูลเจ้าของ:** ORG · **ที่เก็บ:** core · **ตาราง:** `org.room` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.1 · **FR:** FR-R1-063

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `building_id` | uuid | N |  | — |  |
| `code` | text | N |  | — |  |
| `capacity` | int | N |  | — |  |
| `accessible` | boolean | N | ทางลาด/ชั้นล่าง | — |  |

### ProgramOffering

หลักสูตร × วิทยาเขต × study mode ที่รับสมัคร

- **โมดูลเจ้าของ:** CUR · **ที่เก็บ:** core · **ตาราง:** `cur.program_offering` · **ชั้นข้อมูล:** Public
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §6.2 (R1 ขั้นต่ำ) · **FR:** FR-R1-002

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `program_id` | uuid | N |  | — |  |
| `study_mode` | text | N | REGULAR, SPECIAL | — |  |
| `checo_code` | text | Y | [ต้องตรวจสอบรูปแบบ] | — |  |
| `name_th` | text | N |  | — |  |
| `status` | text | N | OPEN, CLOSED | — |  |

### AccreditedIntakeCap

เพดานรับที่คุรุสภาอนุญาตต่อปี

- **โมดูลเจ้าของ:** CUR · **ที่เก็บ:** core · **ตาราง:** `cur.accredited_intake_cap` · **ชั้นข้อมูล:** Public
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §6.2 · **FR:** FR-R1-002, FR-R1-102

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `program_offering_id` | uuid | N |  | — |  |
| `academic_year_be` | int | N |  | — |  |
| `cap` | int | N | ≥ 0 | — |  |
| `source_ref` | text | N | หนังสือคุรุสภา | — |  |

### UserAccount

บัญชีผู้ใช้

- **โมดูลเจ้าของ:** IAM · **ที่เก็บ:** Keycloak + core mirror · **ตาราง:** `iam.user_account` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** NONE — ไม่มี `org_unit_id` — ข้อยกเว้นตาม 08 §6 (Person/reference); มองเห็นผ่าน `person_in_scope`/relationship
- **Retention:** IAM — ตลอดอายุบัญชี + 1 ปีหลังปิด; IdentityLink ของบัญชีที่ลบตาม Person [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.1 · **FR:** FR-R1-011, FR-R1-013, FR-R1-015

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `account_id` | uuid | N | PK | — |  |
| `person_id` | uuid | N |  | PD |  |
| `type` | text | N | APPLICANT, GUARDIAN, STAFF, EXTERNAL | — |  |
| `status` | text | N | ACTIVE, SUSPENDED, CLOSED | — |  |
| `identity_assurance` | text | N | THAID, OTP_ONLY, DOCUMENT_REVIEW, VIDEO_CALL, IN_PERSON | PD |  |

### IdentityLink

การผูกบัญชีกับ IdP (ThaID/อีเมล)

- **โมดูลเจ้าของ:** IAM · **ที่เก็บ:** Keycloak + core · **ตาราง:** `iam.identity_link` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** NONE — ไม่มี `org_unit_id` — ข้อยกเว้นตาม 08 §6 (Person/reference); มองเห็นผ่าน `person_in_scope`/relationship
- **Retention:** IAM — ตลอดอายุบัญชี + 1 ปีหลังปิด; IdentityLink ของบัญชีที่ลบตาม Person [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.1 · **FR:** FR-R1-011, FR-R1-013, FR-R1-108, FR-R1-117

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `account_id` | uuid | N |  | — |  |
| `provider` | text | N | THAID, EMAIL_OTP, PHONE_OTP, PASSKEY | — |  |
| `subject_hmac` | char(64) | N | HMAC ของ pid/subject | PD |  |
| `ial` | text | Y |  | PD |  |
| `linked_at` | timestamptz | N |  | — |  |

### CredentialBinding

passkey/TOTP ของผู้ใช้ (เก็บใน Keycloak)

- **โมดูลเจ้าของ:** IAM · **ที่เก็บ:** Keycloak · **ตาราง:** `(Keycloak)` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** NONE — ไม่มี `org_unit_id` — ข้อยกเว้นตาม 08 §6 (Person/reference); มองเห็นผ่าน `person_in_scope`/relationship
- **Retention:** IAM — ตลอดอายุบัญชี + 1 ปีหลังปิด; IdentityLink ของบัญชีที่ลบตาม Person [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §5.1 · **FR:** FR-R1-015

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `account_id` | uuid | N |  | — |  |
| `type` | text | N | WEBAUTHN, TOTP | — |  |
| `created_at` | timestamptz | N |  | — |  |

### RoleAssignment

บทบาทตามเล่ม 04 พร้อม scope

- **โมดูลเจ้าของ:** IAM · **ที่เก็บ:** core · **ตาราง:** `iam.role_assignment` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** IAM — ตลอดอายุบัญชี + 1 ปีหลังปิด; IdentityLink ของบัญชีที่ลบตาม Person [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.1 · **FR:** FR-R1-017, FR-R1-018

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `person_id` | uuid | N |  | PD |  |
| `role_code` | text | N | ตาม 04 | — |  |
| `qualifier` | text | Y | เช่น head.selection_chair | — |  |
| `scope_type` | text | N |  | — |  |
| `valid_from` | date | N |  | — |  |
| `valid_to` | date | Y |  | — |  |

### ExternalPerson

บุคคลภายนอกแบบมีผู้รับรอง (กรรมการ)

- **โมดูลเจ้าของ:** IAM · **ที่เก็บ:** core · **ตาราง:** `iam.external_person` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** IAM — ตลอดอายุบัญชี + 1 ปีหลังปิด; IdentityLink ของบัญชีที่ลบตาม Person [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.1 · **FR:** FR-R1-018

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `person_id` | uuid | N |  | PD |  |
| `sponsor_id` | uuid | N |  | PD |  |
| `valid_to` | date | N |  | — |  |
| `agreement_accepted_at` | timestamptz | Y |  | — |  |
| `staff_clearance_ref` | uuid | Y | SAFE (ถ้าทำงานกับผู้เยาว์) | — |  |

### Person

Person master (ADM สร้างผ่าน API ของ REC)

- **โมดูลเจ้าของ:** REC · **ที่เก็บ:** core · **ตาราง:** `rec.person` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** NONE — ไม่มี `org_unit_id` — ข้อยกเว้นตาม 08 §6 (Person/reference); มองเห็นผ่าน `person_in_scope`/relationship
- **Retention:** PERSON — Person master: ถาวรเมื่อเป็นนักศึกษา; ผู้สมัครที่ไม่ได้รับเข้าและไม่มีบทบาทอื่น ลบ/ทำให้ไม่ระบุตัวตนพร้อมใบสมัคร (08 §1, §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.1 (R1 ขั้นต่ำ) · **FR:** FR-R1-011, FR-R1-012, FR-R1-014, FR-R1-114

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `person_id` | uuid | N | PK | — |  |
| `name_th` | text | N |  | PD |  |
| `name_en` | text | Y |  | PD |  |
| `birth_date` | date | N |  | PD |  |
| `sex` | text | Y |  | PD |  |
| `nationality` | char(2) | Y | ISO 3166 | PD |  |
| `deceased_flag` | boolean | N | default false | PD |  |

### PersonIdentifier

เลขประจำตัว (เข้ารหัส + HMAC)

- **โมดูลเจ้าของ:** REC · **ที่เก็บ:** core · **ตาราง:** `rec.person_identifier` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** NONE — ไม่มี `org_unit_id` — ข้อยกเว้นตาม 08 §6 (Person/reference); มองเห็นผ่าน `person_in_scope`/relationship
- **Retention:** PERSON — Person master: ถาวรเมื่อเป็นนักศึกษา; ผู้สมัครที่ไม่ได้รับเข้าและไม่มีบทบาทอื่น ลบ/ทำให้ไม่ระบุตัวตนพร้อมใบสมัคร (08 §1, §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.1, §5 · **FR:** FR-R1-012

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `person_id` | uuid | N |  | PD |  |
| `id_type` | text | N | NATIONAL_ID, G_CODE, PASSPORT, ALIEN_ID, TCAS_ID | — |  |
| `value_enc` | bytea | N | envelope encryption | PD-ID |  |
| `value_hmac` | char(64) | N | unique (id_type, value_hmac) | PD | ค้นหาด้วยค่านี้เท่านั้น |
| `issuing_country` | char(3) | Y |  | PD |  |
| `valid_to` | date | Y |  | PD |  |
| `superseded_by` | uuid | Y |  | — |  |

### ContactPoint

ช่องทางติดต่อ

- **โมดูลเจ้าของ:** REC · **ที่เก็บ:** core · **ตาราง:** `rec.contact_point` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** NONE — ไม่มี `org_unit_id` — ข้อยกเว้นตาม 08 §6 (Person/reference); มองเห็นผ่าน `person_in_scope`/relationship
- **Retention:** PERSON — Person master: ถาวรเมื่อเป็นนักศึกษา; ผู้สมัครที่ไม่ได้รับเข้าและไม่มีบทบาทอื่น ลบ/ทำให้ไม่ระบุตัวตนพร้อมใบสมัคร (08 §1, §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.1 · **FR:** FR-R1-014

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `person_id` | uuid | N |  | PD |  |
| `type` | text | N | EMAIL, MOBILE, ADDRESS | — |  |
| `value` | text | N |  | PD |  |
| `verified_at` | timestamptz | Y |  | — |  |

### EmergencyContact

ผู้ติดต่อฉุกเฉิน

- **โมดูลเจ้าของ:** REC · **ที่เก็บ:** core · **ตาราง:** `rec.emergency_contact` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** NONE — ไม่มี `org_unit_id` — ข้อยกเว้นตาม 08 §6 (Person/reference); มองเห็นผ่าน `person_in_scope`/relationship
- **Retention:** PERSON — Person master: ถาวรเมื่อเป็นนักศึกษา; ผู้สมัครที่ไม่ได้รับเข้าและไม่มีบทบาทอื่น ลบ/ทำให้ไม่ระบุตัวตนพร้อมใบสมัคร (08 §1, §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.1 · **FR:** FR-R1-014

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `person_id` | uuid | N |  | PD |  |
| `name` | text | N |  | PD |  |
| `relation` | text | N |  | PD |  |
| `phone` | text | N |  | PD |  |

### GuardianRelation

ความสัมพันธ์ผู้ปกครอง–ผู้สมัคร

- **โมดูลเจ้าของ:** REC · **ที่เก็บ:** core · **ตาราง:** `rec.guardian_relation` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** PERSON — Person master: ถาวรเมื่อเป็นนักศึกษา; ผู้สมัครที่ไม่ได้รับเข้าและไม่มีบทบาทอื่น ลบ/ทำให้ไม่ระบุตัวตนพร้อมใบสมัคร (08 §1, §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.1 (โมเดลเดียว) · **FR:** FR-R1-107, FR-R1-108, FR-R1-110, FR-R1-111, FR-R1-113

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | OrgUnit ของใบสมัครที่ผูก (R1) [ต้องตรวจสอบ] | — |  |
| `guardian_person_id` | uuid | N |  | PD |  |
| `ward_person_id` | uuid | N |  | PD |  |
| `relation_type` | text | N | FATHER, MOTHER, LEGAL_GUARDIAN, CAREGIVER | PD |  |
| `legal_authority` | boolean | N |  | PD |  |
| `binding_method` | text | N | PROVISIONAL_OTP, THAID, ASSISTED_IN_PERSON | — |  |
| `verification_level` | smallint | N | 0 (provisional), 1, 2 | — |  |
| `valid_from` | date | N |  | — |  |
| `valid_to` | date | Y |  | — |  |

### GuardianInvitation

คำเชิญผู้ปกครอง

- **โมดูลเจ้าของ:** REC · **ที่เก็บ:** core · **ตาราง:** `rec.guardian_invitation` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ · **FR:** FR-R1-107, FR-R1-108

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `ward_person_id` | uuid | N |  | PD |  |
| `declared_relation` | text | N |  | PD |  |
| `declared_guardian_id_hmac` | char(64) | Y |  | PD |  |
| `channel` | text | N | SMS, LINE, EMAIL | — |  |
| `token_hash` | char(64) | N |  | — |  |
| `expires_at` | timestamptz | N | ≤ 7 วัน | — |  |
| `attempts` | smallint | N | ≤ 5 | — |  |
| `status` | text | N | SENT, ACCEPTED, EXPIRED, REJECTED | — |  |

### PrivacyNotice

ประกาศความเป็นส่วนตัวมีเวอร์ชัน

- **โมดูลเจ้าของ:** PRIV · **ที่เก็บ:** core · **ตาราง:** `priv.privacy_notice` · **ชั้นข้อมูล:** Public
- **`org_unit_id`:** UNI — University level — OrgUnit ราก (ใช้ได้เฉพาะ config/ตารางกลาง) (08 §6)
- **Retention:** CONSENT — อายุ consent + 10 ปี (08 §8) [ต้องตรวจสอบอายุความ]
- **สถานะในเล่ม 08:** 06 §5.8 · **FR:** FR-R1-109

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `purpose_codes` | text[] | N |  | — |  |
| `version` | text | N |  | — |  |
| `body_th` | text | N |  | — |  |
| `body_en` | text | Y |  | — |  |
| `effective_from` | date | N |  | — |  |

### ConsentPolicyRule

กติกาอายุ × กิจกรรม → ผู้ต้องให้ความยินยอม

- **โมดูลเจ้าของ:** PRIV · **ที่เก็บ:** core · **ตาราง:** `priv.consent_policy_rule` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** UNI — University level — OrgUnit ราก (ใช้ได้เฉพาะ config/ตารางกลาง) (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §5.8; 10 §2.4 · **FR:** FR-R1-109

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `purpose_code` | text | N |  | — |  |
| `age_min` | smallint | N |  | — |  |
| `age_max` | smallint | Y |  | — |  |
| `required_parties` | text[] | N | SELF, GUARDIAN | — |  |
| `version` | int | N |  | — |  |

### ConsentRequest

คำขอความยินยอมที่รอฝ่ายต่าง ๆ

- **โมดูลเจ้าของ:** PRIV · **ที่เก็บ:** core · **ตาราง:** `priv.consent_request` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CONSENT — อายุ consent + 10 ปี (08 §8) [ต้องตรวจสอบอายุความ]
- **สถานะในเล่ม 08:** R1 ใหม่ · **FR:** FR-R1-109, FR-R1-112

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `subject_person_id` | uuid | N |  | PD |  |
| `purpose_code` | text | N |  | — |  |
| `required_parties` | text[] | N |  | — |  |
| `status` | text | N | PENDING, COMPLETE, DECLINED, EXPIRED | — |  |
| `context_ref` | uuid | Y | application_id/slot | — |  |

### Consent

หลักฐานความยินยอม

- **โมดูลเจ้าของ:** PRIV · **ที่เก็บ:** core · **ตาราง:** `priv.consent` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CONSENT — อายุ consent + 10 ปี (08 §8) [ต้องตรวจสอบอายุความ]
- **สถานะในเล่ม 08:** 08 §2.11 · **FR:** FR-R1-027, FR-R1-109, FR-R1-113, FR-R1-137

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `consent_id` | uuid | N | PK | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `person_id` | uuid | N |  | PD |  |
| `purpose_code` | text | N |  | — |  |
| `notice_version` | text | N |  | — |  |
| `state` | text | N | GRANTED, WITHDRAWN, EXPIRED | — |  |
| `given_by` | text | N | SELF, GUARDIAN, ASSISTED_OTP, ASSISTED_CALL | — |  |
| `granted_at` | timestamptz | N |  | — |  |
| `withdrawn_at` | timestamptz | Y |  | — |  |
| `evidence` | jsonb | N | ช่องทาง, IP, ผู้บันทึก (assisted) | PD |  |

### GuardianConsent

ความยินยอมที่ผู้ปกครองให้ (ผูก GuardianRelation)

- **โมดูลเจ้าของ:** PRIV · **ที่เก็บ:** core · **ตาราง:** `priv.guardian_consent` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CONSENT — อายุ consent + 10 ปี (08 §8) [ต้องตรวจสอบอายุความ]
- **สถานะในเล่ม 08:** 06 §5.8 · **FR:** FR-R1-109, FR-R1-112

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `consent_id` | uuid | N | FK consent | — |  |
| `guardian_relation_id` | uuid | N |  | — |  |
| `guardian_person_id` | uuid | N |  | PD |  |
| `decision` | text | N | GRANTED, DECLINED | — |  |

### FeeSchedule

อัตราค่าสมัคร/ค่ายืนยันสิทธิ์ราย OrgUnit (4-eyes)

- **โมดูลเจ้าของ:** FIN · **ที่เก็บ:** core · **ตาราง:** `fin.fee_schedule` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** FIN — 10 ปีหลังสิ้นปีงบประมาณ (08 §8) [ต้องตรวจสอบ ระเบียบการเงิน/สตง.]
- **สถานะในเล่ม 08:** 06 §7.1 (effective-dated) · **FR:** FR-R1-006, FR-R1-044

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `item_code` | text | N | APPLICATION_FEE, CONFIRMATION_FEE, … | — |  |
| `amount_thb` | numeric(12,2) | N | ≥ 0 | — |  |
| `valid_from` | date | N |  | — |  |
| `valid_to` | date | Y |  | — |  |
| `change_request_id` | uuid | N |  | — |  |

### Invoice

ใบแจ้งหนี้

- **โมดูลเจ้าของ:** FIN · **ที่เก็บ:** core · **ตาราง:** `fin.invoice` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** ISSUER — Owning unit — หน่วยที่ออกเอกสาร/ใบแจ้งหนี้/ใบเสร็จ (08 §6)
- **Retention:** FIN — 10 ปีหลังสิ้นปีงบประมาณ (08 §8) [ต้องตรวจสอบ ระเบียบการเงิน/สตง.]
- **สถานะในเล่ม 08:** 08 §2.6 · **FR:** FR-R1-044, FR-R1-045, FR-R1-046, FR-R1-050, FR-R1-051, FR-R1-089, FR-R1-110

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `invoice_id` | uuid | N | PK | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `party_account_id` | uuid | N |  | PD |  |
| `invoice_no` | text | N | `{OrgCode}-{FY}-{running}` unique | PD |  |
| `fiscal_year_be` | int | N |  | — |  |
| `academic_year_be` | int | N |  | — |  |
| `amount_thb` | numeric(12,2) | N |  | PD |  |
| `ref1` | text | N |  | PD |  |
| `ref2` | text | N |  | — |  |
| `due_at` | timestamptz | N |  | — |  |
| `subject_ref` | uuid | N | application_id/offer_id | — | idempotency (subject, item) |
| `status` | text | N | OPEN, PAID, PARTIAL, CANCELLED, EXPIRED | — |  |

### InvoiceLine

รายการในใบแจ้งหนี้

- **โมดูลเจ้าของ:** FIN · **ที่เก็บ:** core · **ตาราง:** `fin.invoice_line` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** ISSUER — Owning unit — หน่วยที่ออกเอกสาร/ใบแจ้งหนี้/ใบเสร็จ (08 §6)
- **Retention:** FIN — 10 ปีหลังสิ้นปีงบประมาณ (08 §8) [ต้องตรวจสอบ ระเบียบการเงิน/สตง.]
- **สถานะในเล่ม 08:** 06 §7.1 · **FR:** FR-R1-044

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `invoice_id` | uuid | N |  | — |  |
| `item_code` | text | N |  | — |  |
| `amount_thb` | numeric(12,2) | N |  | PD |  |
| `fund_code` | text | Y |  | — |  |

### PaymentIntent

QR ที่สร้างให้ใบแจ้งหนี้

- **โมดูลเจ้าของ:** FIN · **ที่เก็บ:** core · **ตาราง:** `fin.payment_intent` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** ISSUER — Owning unit — หน่วยที่ออกเอกสาร/ใบแจ้งหนี้/ใบเสร็จ (08 §6)
- **Retention:** FIN — 10 ปีหลังสิ้นปีงบประมาณ (08 §8) [ต้องตรวจสอบ ระเบียบการเงิน/สตง.]
- **สถานะในเล่ม 08:** 06 §7.1 · **FR:** FR-R1-044, FR-R1-045

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `invoice_id` | uuid | N |  | — |  |
| `biller_id` | text | N | 15 หลัก | — |  |
| `qr_payload` | text | N | EMVCo tag 30 | PD |  |
| `expires_at` | timestamptz | N |  | — |  |
| `share_token_hash` | char(64) | Y | ลิงก์ชำระแทน | — |  |

### PaymentCallback

inbox ของ callback ธนาคาร/PSP

- **โมดูลเจ้าของ:** FIN · **ที่เก็บ:** core · **ตาราง:** `fin.payment_callback` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** ISSUER — Owning unit — หน่วยที่ออกเอกสาร/ใบแจ้งหนี้/ใบเสร็จ (08 §6)
- **Retention:** FIN — 10 ปีหลังสิ้นปีงบประมาณ (08 §8) [ต้องตรวจสอบ ระเบียบการเงิน/สตง.]
- **สถานะในเล่ม 08:** 09 §4.1 (inbox) · **FR:** FR-R1-046, FR-R1-052

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `partner` | text | N |  | — |  |
| `external_ref` | text | N | UNIQUE (partner, external_ref) | — |  |
| `payload` | jsonb | N |  | PD |  |
| `signature_valid` | boolean | N |  | — |  |
| `received_at` | timestamptz | N |  | — |  |
| `processed_at` | timestamptz | Y |  | — |  |

### Payment

รายการรับเงิน

- **โมดูลเจ้าของ:** FIN · **ที่เก็บ:** core · **ตาราง:** `fin.payment` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** ISSUER — Owning unit — หน่วยที่ออกเอกสาร/ใบแจ้งหนี้/ใบเสร็จ (08 §6)
- **Retention:** FIN — 10 ปีหลังสิ้นปีงบประมาณ (08 §8) [ต้องตรวจสอบ ระเบียบการเงิน/สตง.]
- **สถานะในเล่ม 08:** 08 §2.6 · **FR:** FR-R1-046, FR-R1-047, FR-R1-050, FR-R1-052, FR-R1-053, FR-R1-089

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `payment_id` | uuid | N | PK | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `bank_txn_ref` | text | N | unique | — |  |
| `channel` | text | N | QR, BILLPAY, COUNTER, CARD | — |  |
| `amount_thb` | numeric(12,2) | N |  | PD |  |
| `paid_at` | timestamptz | N |  | — |  |
| `source` | text | N | CALLBACK, STATEMENT, PAPER_IMPORT | — |  |

### BankStatementLine

บรรทัด statement รายวัน

- **โมดูลเจ้าของ:** FIN · **ที่เก็บ:** core · **ตาราง:** `fin.bank_statement_line` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** ISSUER — Owning unit — หน่วยที่ออกเอกสาร/ใบแจ้งหนี้/ใบเสร็จ (08 §6)
- **Retention:** FIN — 10 ปีหลังสิ้นปีงบประมาณ (08 §8) [ต้องตรวจสอบ ระเบียบการเงิน/สตง.]
- **สถานะในเล่ม 08:** 06 §7.1 · **FR:** FR-R1-047

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `statement_date` | date | N |  | — |  |
| `bank_txn_ref` | text | N |  | — |  |
| `amount_thb` | numeric(12,2) | N |  | PD |  |
| `ref1` | text | Y |  | PD |  |
| `file_hash` | char(64) | N |  | — |  |

### Reconciliation

ผลจับคู่ invoice–callback–statement

- **โมดูลเจ้าของ:** FIN · **ที่เก็บ:** core · **ตาราง:** `fin.reconciliation` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** ISSUER — Owning unit — หน่วยที่ออกเอกสาร/ใบแจ้งหนี้/ใบเสร็จ (08 §6)
- **Retention:** FIN — 10 ปีหลังสิ้นปีงบประมาณ (08 §8) [ต้องตรวจสอบ ระเบียบการเงิน/สตง.]
- **สถานะในเล่ม 08:** 06 §7.1 · **FR:** FR-R1-047

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `run_date` | date | N |  | — |  |
| `matched` | int | N |  | — |  |
| `unmatched` | int | N |  | — |  |
| `auto_match_pct` | numeric(5,2) | N |  | — | KPI-21 |

### ReconciliationException

รายการไม่ตรงที่ต้องแก้

- **โมดูลเจ้าของ:** FIN · **ที่เก็บ:** core · **ตาราง:** `fin.reconciliation_exception` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** ISSUER — Owning unit — หน่วยที่ออกเอกสาร/ใบแจ้งหนี้/ใบเสร็จ (08 §6)
- **Retention:** FIN — 10 ปีหลังสิ้นปีงบประมาณ (08 §8) [ต้องตรวจสอบ ระเบียบการเงิน/สตง.]
- **สถานะในเล่ม 08:** R1 ใหม่ (09 §3.3 exception queue) · **FR:** FR-R1-046

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `type` | text | N | UNDERPAID, OVERPAID, DUPLICATE, AFTER_CANCEL, AFTER_EXPIRY, STATEMENT_ONLY | — |  |
| `payment_id` | uuid | Y |  | — |  |
| `invoice_id` | uuid | Y |  | — |  |
| `sla_due_at` | timestamptz | N | 2 วันทำการ | — |  |
| `resolution` | text | Y |  | PD |  |

### Receipt

ใบเสร็จอิเล็กทรอนิกส์

- **โมดูลเจ้าของ:** FIN · **ที่เก็บ:** core · **ตาราง:** `fin.receipt` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** ISSUER — Owning unit — หน่วยที่ออกเอกสาร/ใบแจ้งหนี้/ใบเสร็จ (08 §6)
- **Retention:** FIN — 10 ปีหลังสิ้นปีงบประมาณ (08 §8) [ต้องตรวจสอบ ระเบียบการเงิน/สตง.]
- **สถานะในเล่ม 08:** 08 §2.6 · **FR:** FR-R1-048, FR-R1-053

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `receipt_id` | uuid | N | PK | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `receipt_no` | text | N | gapless ต่อ OrgUnit × ปีงบ | PD |  |
| `fiscal_year_be` | int | N |  | — |  |
| `payment_id` | uuid | N |  | — |  |
| `document_id` | uuid | N | DOC | — |  |
| `status` | text | N | issued, voided | — |  |
| `replaces_receipt_id` | uuid | Y |  | — |  |

### FeeWaiverRequest

คำขอยกเว้นค่าสมัคร

- **โมดูลเจ้าของ:** ADM/FIN · **ที่เก็บ:** core · **ตาราง:** `adm.fee_waiver_request` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** FIN — 10 ปีหลังสิ้นปีงบประมาณ (08 §8) [ต้องตรวจสอบ ระเบียบการเงิน/สตง.]
- **สถานะในเล่ม 08:** 08 §2.2 · **FR:** FR-R1-049

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `application_id` | uuid | N |  | — |  |
| `reason_code` | text | N |  | PD |  |
| `evidence_document_ids` | uuid[] | N |  | — |  |
| `checked_by` | uuid | Y | admission | PD |  |
| `decided_by` | uuid | Y | finance ≠ checked_by | PD |  |
| `decision` | text | Y | APPROVED, REJECTED | — |  |
| `service_request_id` | uuid | Y | SVC | — |  |

### Waiver

การยกเว้นที่มีผลต่อใบแจ้งหนี้

- **โมดูลเจ้าของ:** FIN · **ที่เก็บ:** core · **ตาราง:** `fin.waiver` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** ISSUER — Owning unit — หน่วยที่ออกเอกสาร/ใบแจ้งหนี้/ใบเสร็จ (08 §6)
- **Retention:** FIN — 10 ปีหลังสิ้นปีงบประมาณ (08 §8) [ต้องตรวจสอบ ระเบียบการเงิน/สตง.]
- **สถานะในเล่ม 08:** 06 §7.1 · **FR:** FR-R1-049

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `invoice_id` | uuid | N |  | — |  |
| `amount_thb` | numeric(12,2) | N |  | PD |  |
| `approved_by` | uuid | N |  | PD |  |
| `limit_thb` | numeric(12,2) | N | วงเงินผู้อนุมัติ | — |  |

### Refund

คืนเงิน

- **โมดูลเจ้าของ:** FIN · **ที่เก็บ:** core · **ตาราง:** `fin.refund` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** ISSUER — Owning unit — หน่วยที่ออกเอกสาร/ใบแจ้งหนี้/ใบเสร็จ (08 §6)
- **Retention:** FIN — 10 ปีหลังสิ้นปีงบประมาณ (08 §8) [ต้องตรวจสอบ ระเบียบการเงิน/สตง.]
- **สถานะในเล่ม 08:** 06 §7.1 · **FR:** FR-R1-050

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `payment_id` | uuid | N |  | — |  |
| `reason` | text | N | ROUND_CANCELLED, DUPLICATE, WAIVER_AFTER_PAYMENT, PROGRAM_NOT_OPENED | — |  |
| `amount_thb` | numeric(12,2) | N |  | PD |  |
| `destination` | text | N | ORIGINAL_CHANNEL, VERIFIED_ACCOUNT | PD |  |
| `prepared_by` | uuid | N |  | PD |  |
| `approved_by` | uuid | Y | ≠ prepared_by | PD |  |
| `status` | text | N | REQUESTED, APPROVED, PAID, REJECTED | — |  |

### ImportBatch

การนำเข้าไฟล์แบบ dry-run + 4-eyes

- **โมดูลเจ้าของ:** ADM/FIN · **ที่เก็บ:** core · **ตาราง:** `adm.import_batch / fin.import_batch` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ (paper fallback) · **FR:** FR-R1-053, FR-R1-077

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `kind` | text | N | PAPER_SCORES, PAPER_RECEIPTS | — |  |
| `file_hash` | char(64) | N | unique | — |  |
| `dry_run_report` | jsonb | N |  | PD |  |
| `imported_by` | uuid | N |  | PD |  |
| `approved_by` | uuid | Y | ≠ imported_by | PD |  |

### DocumentTemplate

แม่แบบเอกสาร (effective-dated, maker-checker)

- **โมดูลเจ้าของ:** DOC · **ที่เก็บ:** core · **ตาราง:** `doc.document_template` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §5.7 · **FR:** FR-R1-006, FR-R1-129

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `code` | text | N | ADM_ANNOUNCEMENT, ADM_ELIGIBLE_LIST, ADM_RESULT_LIST, ADM_CARD, ADM_RECEIPT_NOTICE, FIN_RECEIPT, ADM_JUDGE_ORDER, ADM_FED_LETTER, ADM_APPEAL_DECISION, ADM_ACCEPTANCE_LETTER | — |  |
| `version` | int | N |  | — |  |
| `signature_level` | text | N | S1, S2, S3 | — |  |
| `golden_file_hash` | char(64) | Y |  | — |  |
| `valid_from` | date | N |  | — |  |

### GeneratedDocument

เอกสาร PDF/A ที่สร้าง (retention ตามประเภท: ประกาศถาวร, ใบเสร็จตาม FIN, บัตรผู้สอบตาม APP)

- **โมดูลเจ้าของ:** DOC · **ที่เก็บ:** core + object storage · **ตาราง:** `doc.generated_document` · **ชั้นข้อมูล:** ตามเนื้อหา
- **`org_unit_id`:** ISSUER — Owning unit — หน่วยที่ออกเอกสาร/ใบแจ้งหนี้/ใบเสร็จ (08 §6)
- **Retention:** ANN — ประกาศทางการ: ถาวร (ส่งหอจดหมายเหตุ) (08 §8)
- **สถานะในเล่ม 08:** 08 §2.11 · **FR:** FR-R1-007, FR-R1-029, FR-R1-033, FR-R1-041, FR-R1-043, FR-R1-048, FR-R1-056, FR-R1-059, FR-R1-082, FR-R1-085, FR-R1-103, FR-R1-129

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `document_id` | uuid | N | PK | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `template_version_id` | uuid | N |  | — |  |
| `sha256` | char(64) | N |  | — |  |
| `pdfa_level` | text | N | PDF/A-2u/3 | — |  |
| `signature_level` | text | N |  | — |  |
| `retention_class` | text | N |  | — |  |
| `valid_until` | date | Y |  | — |  |

### SignatureRecord

บันทึกการลงนาม/ประทับตรา

- **โมดูลเจ้าของ:** DOC · **ที่เก็บ:** core · **ตาราง:** `doc.signature_record` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** ISSUER — Owning unit — หน่วยที่ออกเอกสาร/ใบแจ้งหนี้/ใบเสร็จ (08 §6)
- **Retention:** ANN — ประกาศทางการ: ถาวร (ส่งหอจดหมายเหตุ) (08 §8)
- **สถานะในเล่ม 08:** 06 §5.7 · **FR:** FR-R1-007, FR-R1-048

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `document_id` | uuid | N |  | — |  |
| `signer_type` | text | N | ORG_SEAL, PERSONAL | — |  |
| `signer_person_id` | uuid | Y |  | PD |  |
| `pades_level` | text | N | B-T, B-LT, B-LTA | — |  |
| `tsa_token_ref` | text | Y |  | — |  |

### RequestReceipt

ใบรับอิเล็กทรอนิกส์ (ใบสมัคร คำขอ อุทธรณ์ ร้องเรียน)

- **โมดูลเจ้าของ:** SVC/CASE · **ที่เก็บ:** core · **ตาราง:** `svc.request_receipt` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** RECV — Owning unit — หน่วยที่รับเรื่อง (CASE) (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §5 (เลขรับ) · **FR:** FR-R1-033, FR-R1-099, FR-R1-104

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `receipt_no` | text | N | `{type}-{OrgCode}-{พ.ศ.}-{running}` unique | — |  |
| `subject_type` | text | N |  | — |  |
| `subject_id` | uuid | N |  | — |  |
| `issued_at` | timestamptz | N |  | — |  |
| `document_id` | uuid | N | PAdES-B-T | — |  |

### ServiceRequest

instance ของ e-Form (ขอยกเว้นค่าสมัคร, สละสิทธิ์)

- **โมดูลเจ้าของ:** SVC · **ที่เก็บ:** core · **ตาราง:** `svc.service_request` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §5.5 · **FR:** FR-R1-049, FR-R1-090

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `form_code` | text | N |  | — |  |
| `requester_person_id` | uuid | N |  | PD |  |
| `payload` | jsonb | N |  | PD |  |
| `status` | text | N |  | — |  |
| `sla_due_at` | timestamptz | Y |  | — |  |

### Appointment

นัดรายงานตัวที่จุดบริการ

- **โมดูลเจ้าของ:** SVC · **ที่เก็บ:** core · **ตาราง:** `svc.appointment` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** APP — ผู้ไม่ได้รับเข้า: 2 ปีหลังปิดรอบ (ขยายเมื่อมีอุทธรณ์/คดี) แล้วลบ/ทำให้ไม่ระบุตัวตน; ผู้ได้รับเข้า: ส่วนที่จำเป็นรวมเข้าแฟ้มนักศึกษา เอกสารประกอบ 5 ปีหลังพ้นสภาพ/จบ (08 §8) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §5.5 (booking R1) · **FR:** FR-R1-116

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `service_point_id` | uuid | N |  | — |  |
| `person_id` | uuid | N |  | PD |  |
| `starts_at` | timestamptz | N |  | — |  |
| `status` | text | N | BOOKED, ATTENDED, NO_SHOW, CANCELLED | — |  |

### Announcement

ประกาศทางการ (ห่วงโซ่ฉบับแก้ไข)

- **โมดูลเจ้าของ:** ENG · **ที่เก็บ:** core · **ตาราง:** `eng.announcement` · **ชั้นข้อมูล:** Public
- **`org_unit_id`:** ISSUER — Owning unit — หน่วยที่ออกเอกสาร/ใบแจ้งหนี้/ใบเสร็จ (08 §6)
- **Retention:** ANN — ประกาศทางการ: ถาวร (ส่งหอจดหมายเหตุ) (08 §8)
- **สถานะในเล่ม 08:** 06 §5.4 · **FR:** FR-R1-008, FR-R1-010, FR-R1-043, FR-R1-082, FR-R1-085, FR-R1-138

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `no` | text | N |  | — |  |
| `year_be` | int | N |  | — |  |
| `type` | text | N | ADM_ROUND, ADM_ELIGIBLE, ADM_RESULT, GENERAL, EMERGENCY | — |  |
| `priority` | text | N | P0, P1, P2 | — |  |
| `supersedes_id` | uuid | Y |  | — |  |
| `document_id` | uuid | Y |  | — |  |
| `oit_category` | text | Y |  | — |  |
| `approved_by` | uuid[] | N | P0 ≥ 2 | PD |  |
| `dlp_passed` | boolean | N |  | — |  |

### AudienceSegment

นิยามกลุ่มผู้รับ (เช่น ผู้สมัครรอบ X, ผู้สอบ session Y)

- **โมดูลเจ้าของ:** ENG · **ที่เก็บ:** core · **ตาราง:** `eng.audience_segment` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** MSG — เนื้อหาข้อความ 1 ปี, metadata การส่ง 2 ปี (08 §8)
- **สถานะในเล่ม 08:** 06 §5.4 · **FR:** FR-R1-138

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `definition` | jsonb | N |  | — |  |
| `estimated_count` | int | Y |  | — |  |

### RecipientSnapshot

หลักฐานรายชื่อผู้รับ ณ เวลาส่ง

- **โมดูลเจ้าของ:** ENG · **ที่เก็บ:** core · **ตาราง:** `eng.recipient_snapshot` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** MSG — เนื้อหาข้อความ 1 ปี, metadata การส่ง 2 ปี (08 §8)
- **สถานะในเล่ม 08:** 06 §5.4 · **FR:** FR-R1-138

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `announcement_id` | uuid | N |  | — |  |
| `recipient_count` | int | N |  | — |  |
| `recipients_ref` | text | N | object (เข้ารหัส) | PD |  |

### NotificationRule

event → template → ผู้รับ

- **โมดูลเจ้าของ:** NOTI · **ที่เก็บ:** core · **ตาราง:** `noti.notification_rule` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** UNI — University level — OrgUnit ราก (ใช้ได้เฉพาะ config/ตารางกลาง) (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §5.3 · **FR:** FR-R1-133

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `event_name` | text | N | ต้องอยู่ใน 06 §10.2 | — |  |
| `template_code` | text | N |  | — |  |
| `priority` | text | N |  | — |  |
| `include_guardian` | boolean | N |  | — |  |

### MessageTemplate

แม่แบบข้อความ TH/EN ราย OrgUnit

- **โมดูลเจ้าของ:** NOTI · **ที่เก็บ:** core · **ตาราง:** `noti.message_template` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §5.3 · **FR:** FR-R1-133, FR-R1-135

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `code` | text | N |  | — |  |
| `version` | int | N |  | — |  |
| `channel` | text | N | INAPP, PUSH, LINE, EMAIL, SMS | — |  |
| `body_th` | text | N | ไม่มี PII ในช่องทางภายนอก (lint) | — |  |
| `body_en` | text | Y |  | — |  |

### Message

ข้อความต่อผู้รับ

- **โมดูลเจ้าของ:** NOTI · **ที่เก็บ:** core · **ตาราง:** `noti.message` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** MSG — เนื้อหาข้อความ 1 ปี, metadata การส่ง 2 ปี (08 §8)
- **สถานะในเล่ม 08:** 06 §5.3 · **FR:** FR-R1-111, FR-R1-133, FR-R1-134, FR-R1-135, FR-R1-139

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `recipient_person_id` | uuid | N |  | PD |  |
| `template_version_id` | uuid | N |  | — |  |
| `priority` | text | N |  | — |  |
| `release_at` | timestamptz | N | quiet hours/hold window | — |  |
| `acknowledged_at` | timestamptz | Y |  | — |  |

### Delivery

ผลส่งต่อช่องทาง

- **โมดูลเจ้าของ:** NOTI · **ที่เก็บ:** core · **ตาราง:** `noti.delivery` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** MSG — เนื้อหาข้อความ 1 ปี, metadata การส่ง 2 ปี (08 §8)
- **สถานะในเล่ม 08:** 06 §5.3 · **FR:** FR-R1-134

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `message_id` | uuid | N |  | — |  |
| `channel` | text | N |  | — |  |
| `status` | text | N | SENT, FAILED, CLICKED | — |  |
| `provider_ref` | text | Y |  | — |  |

### InboxItem

ข้อความในกล่องแอป

- **โมดูลเจ้าของ:** NOTI · **ที่เก็บ:** core · **ตาราง:** `noti.inbox_item` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** MSG — เนื้อหาข้อความ 1 ปี, metadata การส่ง 2 ปี (08 §8)
- **สถานะในเล่ม 08:** 06 §5.3 · **FR:** FR-R1-136

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `message_id` | uuid | N |  | — |  |
| `person_id` | uuid | N |  | PD |  |
| `read_at` | timestamptz | Y |  | — |  |

### ChannelPreference

การตั้งค่าช่องทางต่อหมวด

- **โมดูลเจ้าของ:** NOTI · **ที่เก็บ:** core · **ตาราง:** `noti.channel_preference` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** NONE — ไม่มี `org_unit_id` — ข้อยกเว้นตาม 08 §6 (Person/reference); มองเห็นผ่าน `person_in_scope`/relationship
- **Retention:** IAM — ตลอดอายุบัญชี + 1 ปีหลังปิด; IdentityLink ของบัญชีที่ลบตาม Person [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §5.3 · **FR:** FR-R1-134, FR-R1-136

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `person_id` | uuid | N |  | PD |  |
| `category` | text | N |  | — |  |
| `channels` | text[] | N | หมวดบังคับ ≥ 1 | — |  |

### ChannelBinding

LINE userId / push subscription

- **โมดูลเจ้าของ:** NOTI · **ที่เก็บ:** core · **ตาราง:** `noti.channel_binding` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** NONE — ไม่มี `org_unit_id` — ข้อยกเว้นตาม 08 §6 (Person/reference); มองเห็นผ่าน `person_in_scope`/relationship
- **Retention:** IAM — ตลอดอายุบัญชี + 1 ปีหลังปิด; IdentityLink ของบัญชีที่ลบตาม Person [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §5 · **FR:** FR-R1-137

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `person_id` | uuid | N |  | PD |  |
| `channel` | text | N | LINE, WEBPUSH | — |  |
| `external_id_enc` | bytea | N |  | PD | ลบเมื่อยกเลิกผูก |
| `consent_id` | uuid | Y | L-26 | — |  |

### CaseFile

แฟ้มเรื่อง (อุทธรณ์/ร้องเรียน)

- **โมดูลเจ้าของ:** CASE · **ที่เก็บ:** core · **ตาราง:** `case.case_file` · **ชั้นข้อมูล:** Confidential (+ ชั้นความลับตาม DOC)
- **`org_unit_id`:** RECV — Owning unit — หน่วยที่รับเรื่อง (CASE) (08 §6)
- **Retention:** CASE — ร้องเรียน 10 ปีหลังปิดเรื่อง; อุทธรณ์ผลคัดเลือกตาม retention ของใบสมัคร (ขยายถ้ามีคดี) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.10 · **FR:** FR-R1-035, FR-R1-099, FR-R1-104

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `case_id` | uuid | N | PK | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `case_type` | text | N | APPEAL, COMPLAINT, WHISTLEBLOW | — |  |
| `category` | text | N |  | — |  |
| `channel` | text | N | PORTAL, COUNTER, EMAIL | — |  |
| `anonymous_token_hash` | char(64) | Y |  | — |  |
| `receipt_no` | text | N |  | — |  |
| `secrecy_level` | text | N | NORMAL, LAB, LAB_MAK | — |  |
| `excluded_person_ids` | uuid[] | Y | ผู้ถูกร้อง/สายบังคับบัญชา | PD |  |

### Appeal

อุทธรณ์ (subject_type = ADMISSION / ACCOMMODATION)

- **โมดูลเจ้าของ:** CASE · **ที่เก็บ:** core · **ตาราง:** `case.appeal` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** RECV — Owning unit — หน่วยที่รับเรื่อง (CASE) (08 §6)
- **Retention:** CASE — ร้องเรียน 10 ปีหลังปิดเรื่อง; อุทธรณ์ผลคัดเลือกตาม retention ของใบสมัคร (ขยายถ้ามีคดี) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 08 §2.10 · **FR:** FR-R1-099, FR-R1-101, FR-R1-106

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `appeal_id` | uuid | N | PK | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `case_id` | uuid | N |  | — |  |
| `subject_type` | text | N | ADMISSION, … | — |  |
| `subject_id` | uuid | N | application_choice_id | — |  |
| `grounds` | text | N |  | PD |  |
| `filed_at` | timestamptz | N |  | — |  |
| `deadline` | timestamptz | N | SLA ตัดสิน | — |  |
| `stay_of_effect` | boolean | N |  | — |  |
| `expedited` | boolean | N | true สำหรับ W-18 | — |  |

### ScoreRecheck

ผลตรวจซ้ำการบันทึกและการคำนวณโดยกรรมการชุดเดิม

- **โมดูลเจ้าของ:** CASE/ADM · **ที่เก็บ:** core · **ตาราง:** `adm.score_recheck` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CASE — ร้องเรียน 10 ปีหลังปิดเรื่อง; อุทธรณ์ผลคัดเลือกตาม retention ของใบสมัคร (ขยายถ้ามีคดี) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** R1 ใหม่ (W-18 ขั้น 4) · **FR:** FR-R1-101

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `appeal_id` | uuid | N |  | — |  |
| `findings` | jsonb | N |  | PD |  |
| `proposed_override_id` | uuid | Y |  | — |  |
| `recorded_by` | uuid | N |  | PD |  |

### CaseDecision

คำตัดสิน

- **โมดูลเจ้าของ:** CASE · **ที่เก็บ:** core · **ตาราง:** `case.case_decision` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** RECV — Owning unit — หน่วยที่รับเรื่อง (CASE) (08 §6)
- **Retention:** CASE — ร้องเรียน 10 ปีหลังปิดเรื่อง; อุทธรณ์ผลคัดเลือกตาม retention ของใบสมัคร (ขยายถ้ามีคดี) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §5.6 · **FR:** FR-R1-101, FR-R1-103

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `case_id` | uuid | N |  | — |  |
| `outcome` | text | N | UPHELD, AMENDED, REJECTED_OUT_OF_TIME | — |  |
| `reasons_th` | text | N |  | PD |  |
| `decided_by` | uuid | N |  | PD |  |
| `approved_by` | uuid | Y | campusvp เมื่อเปลี่ยนผล | PD |  |
| `served_at` | timestamptz | Y |  | — |  |
| `document_id` | uuid | Y |  | — |  |

### HealthSubject

subject แบบ pseudonymous

- **โมดูลเจ้าของ:** HLT · **ที่เก็บ:** hlt_vault · **ตาราง:** `hlt.health_subject` · **ชั้นข้อมูล:** Sensitive
- **`org_unit_id`:** CARE — Care/serving unit — หน่วยที่ให้การดูแล (ตารางใน `hlt_vault`) (08 §6)
- **Retention:** SELMED — `SELECTION_MEDICAL`: ผู้ไม่ได้รับเข้า crypto-shred เมื่อปิดรอบ + ระยะอุทธรณ์; ผู้ได้รับเข้า ส่วนที่จำเป็นย้ายเป็น `CLINICAL` (08 §8, §9.2)
- **สถานะในเล่ม 08:** 08 §2.9 · **FR:** FR-R1-064, FR-R1-068

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `subject_id` | uuid | N | PK | — |  |
| `person_token` | char(64) | N | HMAC(vault_key, person_id) | PD |  |
| `org_unit_id` | uuid | N | care unit; RLS | — |  |
| `shredded_at` | timestamptz | Y |  | — |  |

### ScreeningResult

แบบคัดกรองก่อนออกกำลังกาย/คัดกรองหน้าสนาม (record class SELECTION_MEDICAL)

- **โมดูลเจ้าของ:** HLT · **ที่เก็บ:** hlt_vault · **ตาราง:** `hlt.screening_result` · **ชั้นข้อมูล:** Sensitive
- **`org_unit_id`:** CARE — Care/serving unit — หน่วยที่ให้การดูแล (ตารางใน `hlt_vault`) (08 §6)
- **Retention:** SELMED — `SELECTION_MEDICAL`: ผู้ไม่ได้รับเข้า crypto-shred เมื่อปิดรอบ + ระยะอุทธรณ์; ผู้ได้รับเข้า ส่วนที่จำเป็นย้ายเป็น `CLINICAL` (08 §8, §9.2)
- **สถานะในเล่ม 08:** 08 §2.9 · **FR:** FR-R1-064, FR-R1-066, FR-R1-068

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | care unit | — |  |
| `subject_id` | uuid | N |  | — |  |
| `record_class` | text | N | SELECTION_MEDICAL | — |  |
| `kind` | text | N | SELF_PARQ, CHILD_FORM, PRE_TEST_VITALS | — |  |
| `answers_enc` | bytea | N | DEK (subject × class) | SPD |  |
| `certificate_object_key` | text | Y | เข้ารหัส | SPD |  |
| `certificate_issued_on` | date | Y |  | SPD |  |
| `physician_licence_no_enc` | bytea | Y |  | PD |  |
| `outcome` | text | N | PASS, NEEDS_SPECIALIST, FAIL | SPD |  |
| `recorded_by` | uuid | N |  | PD |  |

### MedicalClearance

clearance PRE_TEST (ส่งออกเฉพาะ status/valid_to)

- **โมดูลเจ้าของ:** HLT · **ที่เก็บ:** hlt_vault · **ตาราง:** `hlt.medical_clearance` · **ชั้นข้อมูล:** Sensitive (สถานะส่งออกได้)
- **`org_unit_id`:** CARE — Care/serving unit — หน่วยที่ให้การดูแล (ตารางใน `hlt_vault`) (08 §6)
- **Retention:** SELMED — `SELECTION_MEDICAL`: ผู้ไม่ได้รับเข้า crypto-shred เมื่อปิดรอบ + ระยะอุทธรณ์; ผู้ได้รับเข้า ส่วนที่จำเป็นย้ายเป็น `CLINICAL` (08 §8, §9.2)
- **สถานะในเล่ม 08:** 06 §7.6 · **FR:** FR-R1-058, FR-R1-064, FR-R1-065, FR-R1-068

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | care unit | — |  |
| `subject_id` | uuid | N |  | — |  |
| `type` | text | N | PRE_TEST | — |  |
| `status` | text | N | CLEARED, CLEARED_WITH_CONDITIONS, NOT_CLEARED, PENDING | PD | ส่งออกได้ |
| `conditions_enc` | bytea | Y |  | SPD |  |
| `valid_to` | date | Y |  | PD |  |
| `issued_by` | uuid | N | nurse/physician | PD |  |

### InjuryRecord

บันทึกบาดเจ็บวันสอบ (record class INJURY_RTP)

- **โมดูลเจ้าของ:** HLT · **ที่เก็บ:** hlt_vault · **ตาราง:** `hlt.injury` · **ชั้นข้อมูล:** Sensitive
- **`org_unit_id`:** CARE — Care/serving unit — หน่วยที่ให้การดูแล (ตารางใน `hlt_vault`) (08 §6)
- **Retention:** INJ — `INJURY_RTP`: ระยะศึกษา + 5 ปี; ผู้ไม่ได้รับเข้า [ต้องตรวจสอบ — เสนอ 5 ปีหลังเหตุ เพื่อการเรียกร้องสิทธิ์]
- **สถานะในเล่ม 08:** 06 §7.6 (Injury) · **FR:** FR-R1-067

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | care unit | — |  |
| `subject_id` | uuid | N |  | — |  |
| `occurred_at` | timestamptz | N |  | SPD |  |
| `details_enc` | bytea | N |  | SPD |  |
| `suspected_concussion` | boolean | N |  | SPD |  |
| `lawful_basis` | text | N | S26_5A_MEDICAL, VITAL_INTEREST_EMERGENCY | — |  |
| `guardian_call_log` | jsonb | Y | เวลาโทร/ผล (ผู้เยาว์) | PD |  |
| `severity_band` | text | N | ส่งออกได้ | PD |  |

### DisabilityEvidence

หลักฐานความพิการประกอบ accommodation (record class DISABILITY)

- **โมดูลเจ้าของ:** HLT · **ที่เก็บ:** hlt_vault · **ตาราง:** `hlt.disability_evidence` · **ชั้นข้อมูล:** Sensitive
- **`org_unit_id`:** CARE — Care/serving unit — หน่วยที่ให้การดูแล (ตารางใน `hlt_vault`) (08 §6)
- **Retention:** DIS — `DISABILITY`: ผู้ไม่ได้รับเข้า ลบพร้อม SELECTION_MEDICAL; ผู้ได้รับเข้า ส่งต่อ AFF เมื่อยินยอม (W-33) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §7.6 (R2) — ใช้ขั้นต่ำใน R1 (gap G-01) · **FR:** FR-R1-028

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | care unit | — |  |
| `subject_id` | uuid | N |  | — |  |
| `document_object_key` | text | N | เข้ารหัส | SPD |  |
| `reviewed_by` | uuid | Y | dss | PD |  |

### Facility

ทะเบียนสนาม (อ้าง Room/Building ของ ORG)

- **โมดูลเจ้าของ:** FAC · **ที่เก็บ:** core · **ตาราง:** `fac.facility` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §8.2 · **FR:** FR-R1-054, FR-R1-055

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `room_id` | uuid | Y |  | — |  |
| `type` | text | N |  | — |  |
| `capacity` | int | N |  | — |  |
| `outdoor` | boolean | N |  | — |  |
| `accessible` | boolean | N |  | — |  |

### Booking

การจองสนามสำหรับสอบทักษะ

- **โมดูลเจ้าของ:** FAC · **ที่เก็บ:** core · **ตาราง:** `fac.booking` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** OPS — 1 ปี (metadata ปฏิบัติการ) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §8.2 · **FR:** FR-R1-055

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `facility_id` | uuid | N |  | — |  |
| `slot` | tstzrange | N | EXCLUDE ชน (ตาม priority) | — |  |
| `requester_module` | text | N | ADM | — |  |
| `subject_ref` | uuid | N | session_id | — |  |
| `status` | text | N | REQUESTED, CONFIRMED, CANCELLED, CONFLICT | — |  |

### VenueEmergencyPlan

แผนฉุกเฉินต่อสนาม

- **โมดูลเจ้าของ:** FAC · **ที่เก็บ:** core · **ตาราง:** `fac.venue_emergency_plan` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** W-153 (FAC) · **FR:** FR-R1-060

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `facility_id` | uuid | N |  | — |  |
| `aed_location` | text | N |  | — |  |
| `ambulance_point` | text | N |  | — |  |
| `responsible_person_id` | uuid | N |  | PD |  |
| `cooling_equipment` | boolean | N |  | — |  |

### HeatReading

ค่า WBGT

- **โมดูลเจ้าของ:** FAC · **ที่เก็บ:** core · **ตาราง:** `fac.heat_reading` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** OPS — 1 ปี (metadata ปฏิบัติการ) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** W-153 · **FR:** FR-R1-061

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `facility_id` | uuid | N |  | — |  |
| `measured_at` | timestamptz | N |  | — |  |
| `wbgt_c` | numeric(4,1) | N |  | — |  |
| `level` | text | N | NORMAL, ADJUST, STOP [เกณฑ์ ต้องตรวจสอบ Q-99] | — |  |
| `recorded_by` | uuid | N |  | PD |  |

### OitItem

ข้อ OIT ต่อปีงบ

- **โมดูลเจ้าของ:** RPT · **ที่เก็บ:** core · **ตาราง:** `rpt.oit_item` · **ชั้นข้อมูล:** Public (เมื่อเผยแพร่)
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** OIT — snapshot ที่เป็นสถิติทางการ: ถาวร; อื่น 10 ปี (08 §8)
- **สถานะในเล่ม 08:** 06 §5.11 · **FR:** FR-R1-119, FR-R1-120, FR-R1-121, FR-R1-122

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `fiscal_year_be` | int | N |  | — |  |
| `code` | text | N |  | — |  |
| `owner_person_id` | uuid | N |  | PD |  |
| `due_at` | date | N | ≤ 30 มิ.ย. | — |  |
| `status` | text | N | OPEN, READY, APPROVED, PUBLISHED | — |  |
| `approved_by` | uuid | Y | rector/ผู้ได้รับมอบอำนาจ | PD |  |

### OitSnapshot

snapshot ข้อมูลที่เผยแพร่

- **โมดูลเจ้าของ:** RPT · **ที่เก็บ:** object storage WORM · **ตาราง:** `rpt.oit_snapshot` · **ชั้นข้อมูล:** Public
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** OIT — snapshot ที่เป็นสถิติทางการ: ถาวร; อื่น 10 ปี (08 §8)
- **สถานะในเล่ม 08:** 06 §5.11 · **FR:** FR-R1-120, FR-R1-121

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `oit_item_id` | uuid | N |  | — |  |
| `object_key` | text | N | Object Lock | — |  |
| `sha256` | char(64) | N |  | — |  |
| `published_at` | timestamptz | N |  | — |  |

### AdminChangeRequest

คำขอเปลี่ยน config แบบ 4-eyes

- **โมดูลเจ้าของ:** ADMIN · **ที่เก็บ:** core · **ตาราง:** `admin.change_request` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §5.12 · **FR:** FR-R1-007, FR-R1-123

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `type` | text | N | FEE_SCHEDULE, BILLER, NOTICE, CONSENT_POLICY, ROLE_CATALOGUE, RETENTION, SIGNATURE_POLICY, TEMPLATE, FEATURE_FLAG, ROUND_AMENDMENT | — |  |
| `diff` | jsonb | N |  | — |  |
| `effective_from` | timestamptz | N |  | — |  |
| `maker_id` | uuid | N |  | PD |  |
| `checker_id` | uuid | Y | ≠ maker_id | PD |  |
| `state` | text | N | PENDING, APPROVED, REJECTED | — |  |

### FeatureFlag

flag (เช่น TCAS ต่อ OrgUnit × program × round)

- **โมดูลเจ้าของ:** ADMIN · **ที่เก็บ:** Git/config · **ตาราง:** `admin.feature_flag` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §5.12 · **FR:** FR-R1-032

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `key` | text | N |  | — |  |
| `scope` | jsonb | N |  | — |  |
| `enabled` | boolean | N |  | — |  |

### ReleaseRing

ring ของ OrgUnit สำหรับ go-live/freeze

- **โมดูลเจ้าของ:** ADMIN · **ที่เก็บ:** core · **ตาราง:** `admin.release_ring` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** UNI — University level — OrgUnit ราก (ใช้ได้เฉพาะ config/ตารางกลาง) (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §5.12; ADR-025 · **FR:** FR-R1-124, FR-R1-131

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `ring` | text | N | PILOT, WAVE1, … | — |  |
| `org_unit_ids` | uuid[] | N |  | — |  |
| `freeze_windows` | jsonb | Y | จากปฏิทิน | — |  |

### JobRun

ประวัติการรัน job

- **โมดูลเจ้าของ:** ADMIN · **ที่เก็บ:** core · **ตาราง:** `admin.job_run` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** OPS — 1 ปี (metadata ปฏิบัติการ) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §5.12 · **FR:** FR-R1-125

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `job_code` | text | N | J-03, J-04, … | — |  |
| `started_at` | timestamptz | N |  | — |  |
| `ended_at` | timestamptz | Y |  | — |  |
| `status` | text | N | OK, FAILED | — |  |
| `metrics` | jsonb | Y | ไม่มี PII | — |  |

### IntegrationRun

สถานะ integration

- **โมดูลเจ้าของ:** ADMIN · **ที่เก็บ:** core · **ตาราง:** `admin.integration_run` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** OPS — 1 ปี (metadata ปฏิบัติการ) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** 06 §5.12 · **FR:** FR-R1-125

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `integration_code` | text | N | I-01, I-15, I-16, … | — |  |
| `status` | text | N |  | — |  |
| `dlq_count` | int | N |  | — |  |

### BreakGlassSession

การใช้บัญชี break-glass

- **โมดูลเจ้าของ:** ADMIN · **ที่เก็บ:** core + WORM · **ตาราง:** `admin.break_glass_session` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** UNI — University level — OrgUnit ราก (ใช้ได้เฉพาะ config/ตารางกลาง) (08 §6)
- **Retention:** AUD — 10 ปี WORM (08 §8)
- **สถานะในเล่ม 08:** 06 §5.12 · **FR:** FR-R1-126

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `requested_by` | uuid | N |  | PD |  |
| `approver_1` | uuid | Y |  | PD |  |
| `approver_2` | uuid | Y | ≠ approver_1 | PD |  |
| `started_at` | timestamptz | Y |  | — |  |
| `review_due_at` | timestamptz | Y | +24 ชม. | — |  |

### JitGrant

สิทธิ์ privileged ชั่วคราว

- **โมดูลเจ้าของ:** ADMIN · **ที่เก็บ:** PAM · **ตาราง:** `admin.jit_grant` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** UNI — University level — OrgUnit ราก (ใช้ได้เฉพาะ config/ตารางกลาง) (08 §6)
- **Retention:** AUD — 10 ปี WORM (08 §8)
- **สถานะในเล่ม 08:** 06 §5.12 · **FR:** FR-R1-127

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `grantee_id` | uuid | N |  | PD |  |
| `ticket_ref` | text | N |  | — |  |
| `scope` | text | N |  | — |  |
| `expires_at` | timestamptz | N | ≤ 8 ชม. | — |  |
| `approved_by` | uuid | N | ≠ grantee | PD |  |

### WaitingRoomPolicy

เกณฑ์เปิด waiting room ต่อ route

- **โมดูลเจ้าของ:** ADMIN · **ที่เก็บ:** gateway config · **ตาราง:** `(APISIX/Valkey config)` · **ชั้นข้อมูล:** Internal
- **`org_unit_id`:** UNI — University level — OrgUnit ราก (ใช้ได้เฉพาะ config/ตารางกลาง) (08 §6)
- **Retention:** CFG — ตลอดอายุการใช้งาน + ประวัติทุกเวอร์ชัน (config ที่มีผลทางกฎหมาย/การเงินเก็บตาม FIN) [ต้องตรวจสอบ]
- **สถานะในเล่ม 08:** ADR-028 · **FR:** FR-R1-130

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `route` | text | N |  | — |  |
| `threshold_active_users` | int | N |  | — |  |
| `release_rate_per_min` | int | N | 100–1,000 | — |  |
| `extended_timeout_for_accommodation` | boolean | N |  | — |  |

### AuditEvent

เหตุการณ์ audit (append-only, hash chain)

- **โมดูลเจ้าของ:** AUD · **ที่เก็บ:** core partition + WORM · **ตาราง:** `aud.audit_event` · **ชั้นข้อมูล:** Confidential
- **`org_unit_id`:** OWN — Owning unit — วิทยาเขตที่เปิดรอบ/เป็นเจ้าของ record (08 §6)
- **Retention:** AUD — 10 ปี WORM (08 §8)
- **สถานะในเล่ม 08:** 08 §2.11 · **FR:** FR-R1-126, FR-R1-128

| ฟิลด์ | ชนิด | Null | ข้อจำกัด | PII | หมายเหตุ |
|---|---|---|---|---|---|
| `id` | uuid | N | PK, UUIDv7 | — |  |
| `org_unit_id` | uuid | N | FK ORG_UNIT; RLS | — |  |
| `actor_id` | uuid | N |  | PD |  |
| `on_behalf_of` | uuid | Y |  | PD |  |
| `active_role` | text | N | role × OrgUnit | — |  |
| `action` | text | N |  | — |  |
| `resource` | text | N |  | — |  |
| `purpose` | text | Y |  | — |  |
| `decision` | text | N | ALLOW, DENY | — |  |
| `ip` | inet | N |  | PD |  |
| `trace_id` | text | N |  | — |  |
| `prev_hash` | char(64) | N |  | — |  |

