# R1 "รับสมัคร" — Traceability matrix

> **สถานะ:** v1.0-draft · 28 ต.ค. 2569 · Release R1 "รับสมัคร" (go-live 1 ก.ย. 2571 = M18; ถ้าเริ่มสัญญาหลัง ต.ค. 2570 ทุก release เลื่อน 12 เดือน — เล่ม 12 §1.3) · ภาษา: ไทย (ศัพท์เทคนิค/โค้ดเป็นภาษาอังกฤษ)
> **ขอบเขต:** FR/NFR → โมดูล → workflow → entity → หน้าจอ → API → test → สมมติฐาน/คำถาม
> **อ่านคู่กับ:** [README](README.md) · [00-blueprint](../00-blueprint.md) · [00-fix-decisions-v1.1](../00-fix-decisions-v1.1.md) (D-03, D-06, D-08) · [02 §2](../02-student-journey.md) · [05](../05-workflows.md) · [06](../06-modules.md) · [08](../08-data.md) · [10](../10-security-compliance.md) · [14](../14-ux-adoption.md) · [r1-requirements](r1-requirements.md) · [r1-test-plan](r1-test-plan.md)

## 1. FR matrix

| FR | Pri | โมดูล | Workflow | Entities | หน้าจอ | API (operationId) | Test | UAT | A/Q |
|---|---|---|---|---|---|---|---|---|---|
| FR-R1-001 | M | ADM ORG | W-69 | AdmissionCycle, AdmissionChannel, AdmissionRound | S-R1-33 | createRound, listRounds, getRound, updateRound | TC-R1-001, TC-R1-002, TC-R1-335 | UAT-R1-01 | A-49, A-85, Q-13 |
| FR-R1-002 | M | ADM CUR | W-69 | SeatQuota, AdmissionPlan, AccreditedIntakeCap, ProgramOffering | S-R1-34 | putSeatMatrix | TC-R1-003, TC-R1-004 | UAT-R1-01 | A-48, Q-22 |
| FR-R1-003 | M | ADM | W-69 W-70 W-71 | EligibilityRuleSet, AdmissionRound | S-R1-33 | putEligibilityRules, testEligibilityRules | TC-R1-005, TC-R1-006, TC-R1-335 | UAT-R1-01 | Q-13 |
| FR-R1-004 | M | ADM | W-69 W-76 | ScoringScheme, Rubric, RubricItem | S-R1-33, S-R1-46 | putScoringScheme, getPublicRound | TC-R1-007, TC-R1-008, TC-R1-009, TC-R1-335 | UAT-R1-01 | A-52, Q-14 |
| FR-R1-005 | M | ADM ORG | W-69 W-117 | AdmissionRound, CalendarEvent | S-R1-33 | putRoundSchedule | TC-R1-010, TC-R1-011 | UAT-R1-01 | A-36, Q-25, Q-96 |
| FR-R1-006 | M | ADM FIN DOC | W-69 W-79 | AdmissionRound, FeeSchedule, DocumentTemplate | S-R1-33 | updateRound | TC-R1-012, TC-R1-013 | UAT-R1-01, UAT-R1-02 | A-57, Q-34 |
| FR-R1-007 | M | ADM DOC IAM | W-69 | AdmissionRound, AdminChangeRequest, GeneratedDocument, SignatureRecord | S-R1-33, S-R1-45 | submitRoundForApproval, decideRoundApproval | TC-R1-014, TC-R1-015, TC-R1-016, TC-R1-340 | UAT-R1-01 | Q-13 |
| FR-R1-008 | M | ADM ENG ORG FIN | W-69 W-36 | AdmissionRound, Announcement, CalendarEvent | S-R1-46, S-R1-56 | publishRound, listPublicRounds | TC-R1-017, TC-R1-018, TC-R1-258 | UAT-R1-01 | — |
| FR-R1-009 | M | ADM ORG | W-72 | SeatQuota, AdmissionRound | S-R1-34, S-R1-45 | proposeCarryOverRound | TC-R1-019, TC-R1-340 | — | A-49 |
| FR-R1-010 | S | ADM ENG DOC | W-69 W-36 | AdmissionRound, Announcement | S-R1-33, S-R1-56 | amendRound | TC-R1-020, TC-R1-259 | — | Q-13 |
| FR-R1-011 | M | IAM ADM | W-41 | UserAccount, IdentityLink, Person | S-R1-02 | getMyApplicantProfile | TC-R1-021, TC-R1-022, TC-R1-316 | UAT-R1-03 | A-71, Q-65 |
| FR-R1-012 | M | REC ADM IAM | W-41 W-74 | Person, PersonIdentifier | S-R1-02, S-R1-03 | updateMyApplicantProfile | TC-R1-023, TC-R1-024, TC-R1-025, TC-R1-316 | UAT-R1-03 | A-56, KPI-20 |
| FR-R1-013 | M | IAM ADM | W-41 W-78 W-80 | IdentityLink, UserAccount | S-R1-02, S-R1-42 | startIdentityVerification, verifyReportingIdentity | TC-R1-026, TC-R1-027, TC-R1-316 | — | A-71, A-119, Q-65 |
| FR-R1-014 | M | REC ADM PRIV | W-41 | Person, ContactPoint, EmergencyContact | S-R1-03 | getMyApplicantProfile, updateMyApplicantProfile | TC-R1-028, TC-R1-029 | UAT-R1-03 | A-17 |
| FR-R1-015 | M | IAM | W-41 | UserAccount, CredentialBinding | S-R1-02 | — | TC-R1-030, TC-R1-031 | — | — |
| FR-R1-016 | S | ADM IAM AUD | W-41 | AssistedSession, Application | S-R1-55 | createAssistedSession | TC-R1-032, TC-R1-033 | UAT-R1-13 | — |
| FR-R1-017 | S | IAM | W-69 W-76 | RoleAssignment | S-R1-45 | — | TC-R1-034, TC-R1-340 | — | — |
| FR-R1-018 | M | IAM ADM | W-139 W-75 | ExternalPerson, RoleAssignment | S-R1-57 | createExternalPerson | TC-R1-035, TC-R1-036 | UAT-R1-05 | — |
| FR-R1-019 | M | ADM | W-41 | AdmissionRound, SeatQuota | S-R1-01, S-R1-46 | listPublicRounds, getPublicRound | TC-R1-037, TC-R1-038, TC-R1-315 | UAT-R1-03 | A-49, A-51 |
| FR-R1-020 | M | ADM | W-41 | Application, ApplicationChoice | S-R1-04, S-R1-05, S-R1-06, S-R1-07, S-R1-09 | createApplication, updateApplication, putApplicationChoices, getApplication, listApplications | TC-R1-039, TC-R1-040, TC-R1-317, TC-R1-318, TC-R1-319, TC-R1-320 | UAT-R1-03 | — |
| FR-R1-021 | M | ADM | W-41 W-70 | Application, EligibilityRuleSet | S-R1-05 | previewEligibility | TC-R1-041, TC-R1-042, TC-R1-318 | UAT-R1-03 | Q-13 |
| FR-R1-022 | S | ADM | W-41 W-70 W-77 | ApplicationDocument, Application | S-R1-05, S-R1-35 | completeDocumentUpload | TC-R1-043, TC-R1-318, TC-R1-336 | — | — |
| FR-R1-023 | M | ADM | W-70 W-42 | Application, AdmissionRound | S-R1-04, S-R1-05 | createApplication, submitApplication | TC-R1-044, TC-R1-317 | — | Q-13 |
| FR-R1-024 | M | ADM | W-71 | Application, SportAchievement | S-R1-06 | addSportAchievement, listSportAchievements | TC-R1-045, TC-R1-046, TC-R1-047 | UAT-R1-03 | Q-14 |
| FR-R1-025 | M | ADM | W-71 | VerificationTask, SportAchievement, Application | S-R1-36 | decideVerificationTask, recordFederationResponse | TC-R1-048, TC-R1-049 | UAT-R1-04 | Q-50 |
| FR-R1-026 | M | ADM FIN | W-72 W-43 W-78 | Application, Offer | S-R1-04, S-R1-17 | createApplication, confirmOffer | TC-R1-050, TC-R1-051, TC-R1-317, TC-R1-326 | UAT-R1-10 | A-53 |
| FR-R1-027 | S | ADM PRIV | W-144 | Application, ApplicationDocument, Consent | S-R1-04, S-R1-25 | createApplication, grantConsent | TC-R1-052, TC-R1-053, TC-R1-328 | UAT-R1-17 | Q-17 |
| FR-R1-028 | M | ADM HLT | W-79 | AccommodationRequest, AccommodationPlan, DisabilityEvidence | S-R1-08, S-R1-41 | createAccommodationRequest, decideAccommodationRequest | TC-R1-054, TC-R1-055, TC-R1-056 | UAT-R1-12 | A-31, Q-18, Q-45 |
| FR-R1-029 | S | ADM DOC FIN | W-80 | QualificationEquivalence, Application, GeneratedDocument | S-R1-04, S-R1-09 | createApplication | TC-R1-057, TC-R1-320 | — | A-30, Q-18, Q-46, Q-108 |
| FR-R1-030 | C | ADM CUR | W-82 | Application, ApplicationDocument | S-R1-04, S-R1-07 | createApplication | TC-R1-058, TC-R1-319 | — | Q-18 |
| FR-R1-031 | C | ADM FIN | W-84 | AdmissionRound, Application | S-R1-04, S-R1-33 | createRound, createApplication | TC-R1-059 | — | A-29, A-55, Q-21 |
| FR-R1-032 | C | ADM ADMIN | W-73 | TcasSyncRecord, FeatureFlag, Application | S-R1-51 | listJobRuns | TC-R1-060, TC-R1-061 | — | A-50, Q-11 |
| FR-R1-033 | M | ADM DOC SVC | W-41 | Application, RequestReceipt, GeneratedDocument | S-R1-09 | submitApplication, getApplicationReceipt | TC-R1-062, TC-R1-063, TC-R1-064, TC-R1-258, TC-R1-320 | UAT-R1-03 | — |
| FR-R1-034 | S | ADM FIN | W-41 W-81 | Application, ApplicationChoice | S-R1-12 | withdrawApplication | TC-R1-065, TC-R1-322 | — | — |
| FR-R1-035 | S | ADM CASE | W-41 W-42 | TestIncident, CaseFile, Application | S-R1-35, S-R1-28 | recordTestIncident | TC-R1-066, TC-R1-331, TC-R1-336 | — | — |
| FR-R1-036 | M | ADM DOC | W-41 W-77 | ApplicationDocument, UploadSession | S-R1-07, S-R1-13 | createUploadSession, completeDocumentUpload, listApplicationDocuments, deleteApplicationDocument | TC-R1-067, TC-R1-068, TC-R1-069, TC-R1-319 | UAT-R1-03 | — |
| FR-R1-037 | M | ADM | W-77 W-41 | ApplicationDocument, AdmissionRound | S-R1-07 | listApplicationDocuments | TC-R1-070 | UAT-R1-04 | — |
| FR-R1-038 | M | ADM | W-77 | VerificationTask, ApplicationDocument | S-R1-35 | listVerificationTasks, decideVerificationTask | TC-R1-071, TC-R1-072, TC-R1-336 | UAT-R1-04 | KPI-19 |
| FR-R1-039 | M | ADM NOTI | W-77 | VerificationTask, DocumentRequest | S-R1-13, S-R1-35 | requestMoreDocuments, completeDocumentUpload | TC-R1-073, TC-R1-074 | UAT-R1-04 | — |
| FR-R1-040 | S | ADM | W-77 | VerificationTask | S-R1-35 | listVerificationTasks, decideVerificationTask | TC-R1-075 | UAT-R1-04 | — |
| FR-R1-041 | M | ADM DOC | W-71 | VerificationTask, SportAchievement, GeneratedDocument | S-R1-36, S-R1-54 | listVerificationTasks, recordFederationResponse, decideVerificationTask | TC-R1-076, TC-R1-077, TC-R1-249 | UAT-R1-04 | Q-50 |
| FR-R1-042 | S | ADM REC | W-77 W-78 | ApplicationDocument, ReportingHandoff | S-R1-42 | listReportingHandoffs | TC-R1-078 | — | — |
| FR-R1-043 | M | ADM ENG DOC NOTI | W-42 W-70 W-71 W-72 | EligibleList, Announcement, GeneratedDocument | S-R1-35, S-R1-46 | publishEligibleList | TC-R1-079, TC-R1-080 | UAT-R1-04 | — |
| FR-R1-044 | M | FIN ADM | W-41 | Invoice, InvoiceLine, PaymentIntent, FeeSchedule | S-R1-10, S-R1-26 | getOrCreateApplicationInvoice, getInvoice, getInvoiceQrImage | TC-R1-081, TC-R1-082, TC-R1-321, TC-R1-329 | UAT-R1-03 | A-58, Q-35 |
| FR-R1-045 | M | FIN | W-41 W-43 | PaymentIntent, Invoice | S-R1-10 | getInvoiceQrImage, getPaymentStatus, getOrCreateApplicationInvoice | TC-R1-083, TC-R1-084, TC-R1-085, TC-R1-252, TC-R1-321 | UAT-R1-03 | Q-114 |
| FR-R1-046 | M | FIN | W-41 W-43 | PaymentCallback, Payment, Invoice, ReconciliationException | S-R1-43 | receiveBankPaymentNotification, listReconciliationExceptions, resolveReconciliationException | TC-R1-086, TC-R1-087, TC-R1-088 | UAT-R1-14 | A-58, Q-35 |
| FR-R1-047 | M | FIN | W-41 W-43 | BankStatementLine, Reconciliation, Payment | S-R1-43 | listReconciliationExceptions | TC-R1-089, TC-R1-090 | UAT-R1-14 | KPI-21, KPI-22 |
| FR-R1-048 | M | FIN DOC | W-41 W-43 | Receipt, GeneratedDocument, SignatureRecord | S-R1-10, S-R1-12 | getReceiptDocument | TC-R1-091, TC-R1-092, TC-R1-321, TC-R1-322 | UAT-R1-03 | A-79 |
| FR-R1-049 | M | FIN ADM SVC | W-81 | FeeWaiverRequest, Waiver, ServiceRequest | S-R1-11, S-R1-44 | createFeeWaiverRequest, decideFeeWaiverRequest | TC-R1-093, TC-R1-094 | UAT-R1-14 | — |
| FR-R1-050 | M | FIN | W-81 | Refund, Payment, Invoice | S-R1-44 | createRefund, approveRefund | TC-R1-095, TC-R1-096, TC-R1-259 | UAT-R1-14 | Q-35 |
| FR-R1-051 | M | FIN ADM | W-43 | Invoice, Offer | S-R1-17, S-R1-10, S-R1-26 | confirmOffer, getInvoice, getPaymentStatus | TC-R1-097, TC-R1-098, TC-R1-326, TC-R1-329 | — | A-57, Q-34 |
| FR-R1-052 | C | FIN | W-80 | PaymentCallback, Payment | S-R1-10 | receivePspWebhook | TC-R1-099 | — | Q-108 |
| FR-R1-053 | S | FIN | W-43 | Payment, Receipt, ImportBatch | S-R1-43 | — | TC-R1-100 | UAT-R1-10 | — |
| FR-R1-054 | M | ADM FAC ORG | W-75 W-42 | AdmissionTestSession, TestStation, Facility | S-R1-37 | createTestSession, listTestSessions, putTestStations, publishTestSchedule | TC-R1-101, TC-R1-102, TC-R1-337 | UAT-R1-05 | Q-14 |
| FR-R1-055 | M | ADM FAC | W-75 | Booking, Facility, AdmissionTestSession | S-R1-37 | requestVenueBooking | TC-R1-103, TC-R1-104, TC-R1-337 | UAT-R1-05 | — |
| FR-R1-056 | M | ADM IAM DOC | W-75 W-139 | JudgePanel, JudgeAssignment, GeneratedDocument | S-R1-37 | assignJudges | TC-R1-105, TC-R1-106, TC-R1-337 | UAT-R1-05 | A-52, Q-14 |
| FR-R1-057 | M | ADM | W-75 W-76 | ConflictDeclaration, JudgeAssignment | S-R1-27, S-R1-37 | declareConflicts | TC-R1-107, TC-R1-108, TC-R1-330 | UAT-R1-05 | — |
| FR-R1-058 | M | ADM HLT | W-75 W-42 | TestSlot, AdmissionTestSession, MedicalClearance | S-R1-15, S-R1-37 | allocateSlots, listMyTestSlots, confirmTestSlot | TC-R1-109, TC-R1-110, TC-R1-324 | UAT-R1-05, UAT-R1-12 | — |
| FR-R1-059 | M | ADM DOC NOTI | W-42 W-75 | TestSlot, GeneratedDocument | S-R1-15 | getAdmissionCard | TC-R1-111, TC-R1-112, TC-R1-324 | UAT-R1-05 | — |
| FR-R1-060 | S | ADM FAC HLT | W-75 W-153 | VenueEmergencyPlan, AdmissionTestSession | S-R1-37 | publishTestSchedule | TC-R1-113 | UAT-R1-05 | — |
| FR-R1-061 | S | FAC ADM | W-153 W-42 | HeatReading, AdmissionTestSession, TestSlot | S-R1-32 | recordHeatReading | TC-R1-114 | UAT-R1-06 | Q-99 |
| FR-R1-062 | S | ADM | W-42 W-80 | TestSlot | S-R1-15, S-R1-37 | allocateSlots | TC-R1-115, TC-R1-324 | — | A-119, Q-75 |
| FR-R1-063 | S | ADM ORG DOC | W-42 W-72 | AdmissionTestSession, TestSlot, Room | S-R1-37 | createTestSession, allocateSlots | TC-R1-116 | — | — |
| FR-R1-064 | M | HLT ADM PRIV | W-42 W-71 | HealthSubject, ScreeningResult, MedicalClearance | S-R1-14 | submitHealthScreening, getMyClearanceStatus | TC-R1-117, TC-R1-118, TC-R1-119, TC-R1-323 | UAT-R1-03 | Q-23, Q-103 |
| FR-R1-065 | M | HLT ADM | W-42 W-71 | MedicalClearance, TestSlot | S-R1-14, S-R1-15, S-R1-28 | getMyClearanceStatus, getClearanceRoster | TC-R1-120, TC-R1-121, TC-R1-323, TC-R1-331 | UAT-R1-06 | — |
| FR-R1-066 | M | HLT ADM | W-42 W-71 W-85 | ScreeningResult, TestIncident, TestSlot | S-R1-32 | recordPretestCheck, recordTestIncident | TC-R1-122, TC-R1-123 | UAT-R1-06 | — |
| FR-R1-067 | M | HLT ADM NOTI | W-85 W-39 W-152 | InjuryRecord, TestIncident | S-R1-32, S-R1-28 | recordTestIncident | TC-R1-124, TC-R1-125, TC-R1-331 | UAT-R1-06 | Q-103 |
| FR-R1-068 | M | HLT PRIV | W-42 | HealthSubject, MedicalClearance, ScreeningResult | — | — | TC-R1-126, TC-R1-127 | — | A-118 |
| FR-R1-069 | M | ADM IAM | W-76 | JudgeDevice, JudgeAssignment, AdmissionTestSession | S-R1-27 | listMyJudgeSessions, downloadOfflinePack | TC-R1-128, TC-R1-129, TC-R1-130, TC-R1-247, TC-R1-248, TC-R1-330 | UAT-R1-06 | — |
| FR-R1-070 | M | ADM | W-42 W-76 | CheckIn, TestSlot | S-R1-28 | syncJudgeBatch | TC-R1-131, TC-R1-132 | UAT-R1-06 | — |
| FR-R1-071 | M | ADM | W-76 | JudgeScore, TestStation | S-R1-29 | syncJudgeBatch | TC-R1-133, TC-R1-134, TC-R1-332 | UAT-R1-06 | — |
| FR-R1-072 | M | ADM AUD | W-76 | JudgeScore, RubricItem | S-R1-29, S-R1-31 | syncJudgeBatch, reopenScore | TC-R1-135, TC-R1-136, TC-R1-332, TC-R1-334 | UAT-R1-06 | — |
| FR-R1-073 | M | ADM | W-76 | JudgeScore, ScoreSyncConflict, JudgeDevice | S-R1-30 | syncJudgeBatch, listSyncConflicts, resolveSyncConflict | TC-R1-137, TC-R1-138, TC-R1-139, TC-R1-333 | UAT-R1-06 | — |
| FR-R1-074 | M | ADM | W-76 | ModerationFlag, ScoreModeration | S-R1-31 | listModerationFlags, recordModeration | TC-R1-140, TC-R1-141, TC-R1-247, TC-R1-334 | UAT-R1-06 | A-52, Q-14 |
| FR-R1-075 | M | ADM | W-76 | CompositeScore, ScoringScheme | S-R1-31, S-R1-38 | confirmSessionResults | TC-R1-142, TC-R1-334, TC-R1-338 | UAT-R1-06 | A-52 |
| FR-R1-076 | M | ADM AUD | W-76 W-42 | ScoreLock, CompositeScore | S-R1-31 | confirmSessionResults | TC-R1-143, TC-R1-144 | UAT-R1-06 | — |
| FR-R1-077 | S | ADM | W-76 | ImportBatch, JudgeScore | S-R1-58 | importPaperScores, approvePaperImport | TC-R1-145, TC-R1-146 | UAT-R1-06 | — |
| FR-R1-078 | C | ADM | W-75 | JudgeAssignment | S-R1-37 | requestStandardExport | TC-R1-147 | — | — |
| FR-R1-079 | M | ADM | W-76 W-42 W-70 W-71 W-72 | CompositeScore, RankList, ReserveListEntry | S-R1-38 | computeRankList, getRankList | TC-R1-148, TC-R1-149, TC-R1-253, TC-R1-338 | UAT-R1-07 | — |
| FR-R1-080 | M | ADM | W-42 W-74 | RankList, ReserveListEntry, Application | S-R1-38 | computeRankList | TC-R1-150, TC-R1-338 | UAT-R1-07 | — |
| FR-R1-081 | M | ADM AUD | W-42 W-70 W-71 W-72 W-18 | RankList, ResultOverride | S-R1-38, S-R1-45 | decideRankListApproval, createResultOverride, approveResultOverride | TC-R1-151, TC-R1-152, TC-R1-253 | UAT-R1-07 | — |
| FR-R1-082 | M | ADM ENG DOC NOTI | W-42 W-70 W-71 W-72 | ResultPublication, Announcement, GeneratedDocument | S-R1-38, S-R1-46 | publishResults | TC-R1-153, TC-R1-262 | UAT-R1-07 | A-53 |
| FR-R1-083 | M | ADM ADMIN | W-42 | ResultPublication | S-R1-47 | getPublicResultShard | TC-R1-154, TC-R1-155, TC-R1-341 | UAT-R1-07 | A-34 |
| FR-R1-084 | M | ADM | W-42 W-18 | CompositeScore, JudgeScore | S-R1-16 | getMyResults | TC-R1-156, TC-R1-157, TC-R1-325 | UAT-R1-07 | — |
| FR-R1-085 | M | ENG DOC ADM | W-42 W-36 | Announcement, GeneratedDocument | S-R1-46, S-R1-56 | publishResults, publishEligibleList | TC-R1-158 | UAT-R1-07 | Q-69 |
| FR-R1-086 | M | ADM NOTI | W-74 W-43 | Offer | S-R1-17 | listMyOffers | TC-R1-159, TC-R1-263, TC-R1-326 | UAT-R1-08 | A-93 |
| FR-R1-087 | M | ADM | W-74 W-43 | Offer | S-R1-17 | listMyOffers, confirmOffer, declineOffer | TC-R1-160, TC-R1-161 | UAT-R1-08 | — |
| FR-R1-088 | M | ADM | W-74 W-43 | Offer, ConfirmationLock | S-R1-17 | confirmOffer | TC-R1-162, TC-R1-163, TC-R1-254 | UAT-R1-08 | A-51, Q-12 |
| FR-R1-089 | M | ADM FIN | W-43 W-74 | Offer, Invoice, Payment | S-R1-17, S-R1-10 | confirmOffer, getPaymentStatus | TC-R1-164, TC-R1-165 | UAT-R1-08 | — |
| FR-R1-090 | M | ADM FIN | W-74 | Offer, ServiceRequest | S-R1-17 | waiveConfirmedSeat | TC-R1-166, TC-R1-167 | UAT-R1-08 | A-51, Q-12 |
| FR-R1-091 | M | ADM ORG | W-74 | Offer, ReserveListEntry, SeatQuota, AppealHold | S-R1-39 | getClearingDashboard | TC-R1-168, TC-R1-169, TC-R1-170, TC-R1-260, TC-R1-339 | UAT-R1-08 | A-110, Q-95 |
| FR-R1-092 | M | ADM | W-72 W-74 | Offer, Application | S-R1-01, S-R1-04 | createApplication | TC-R1-171, TC-R1-315 | UAT-R1-08 | A-51, Q-12 |
| FR-R1-093 | M | ADM | W-74 | Offer | S-R1-39, S-R1-35 | getApplication, getClearingDashboard | TC-R1-172, TC-R1-251, TC-R1-254, TC-R1-339 | UAT-R1-08 | — |
| FR-R1-094 | M | ADM ORG | W-74 | GateOverride, Offer | S-R1-39, S-R1-45 | extendOfferDeadline, approveDeadlineExtension | TC-R1-173, TC-R1-174, TC-R1-339 | UAT-R1-08 | — |
| FR-R1-095 | M | ADM NOTI | W-163 | Offer, Reconfirmation | S-R1-18, S-R1-39 | reconfirmOffer, getReconfirmationRiskDashboard | TC-R1-175, TC-R1-176, TC-R1-177, TC-R1-261 | UAT-R1-11 | A-110, Q-95 |
| FR-R1-096 | M | ADM | W-78 W-74 | Offer, NoShowNotice | S-R1-39, S-R1-17 | recordNoShowNotice | TC-R1-178, TC-R1-179 | UAT-R1-11 | — |
| FR-R1-097 | S | ADM | W-74 | LegacyConfirmationFile, Offer | S-R1-39 | importLegacyConfirmations | TC-R1-180, TC-R1-181 | UAT-R1-18 | A-51, Q-12, Q-60 |
| FR-R1-098 | M | ADM ANA | W-74 | SeatQuota, Offer | S-R1-39 | getClearingDashboard | TC-R1-182, TC-R1-251 | UAT-R1-08 | KPI-01, KPI-02 |
| FR-R1-099 | M | CASE ADM | W-18 | CaseFile, Appeal, RequestReceipt | S-R1-19 | fileAdmissionAppeal, getAppeal | TC-R1-183, TC-R1-184 | UAT-R1-09 | Q-19, Q-96 |
| FR-R1-100 | M | ADM CASE ORG | W-18 W-74 | AppealHold, GateOverride, Offer | S-R1-40, S-R1-39 | fileAdmissionAppeal, getClearingDashboard | TC-R1-185, TC-R1-186, TC-R1-260 | UAT-R1-09 | Q-96 |
| FR-R1-101 | M | CASE ADM | W-18 | Appeal, CaseDecision, ScoreRecheck | S-R1-40, S-R1-45 | listAppeals, recordAppealRecheck, decideAppeal, approveAppealDecision | TC-R1-187, TC-R1-188 | UAT-R1-09 | Q-19, Q-96 |
| FR-R1-102 | M | ADM CASE CUR | W-18 W-74 | AppealHold, SeatQuota, AccreditedIntakeCap, Offer | S-R1-40 | decideAppeal, approveAppealDecision | TC-R1-189, TC-R1-190, TC-R1-191, TC-R1-260 | UAT-R1-09 | A-48, Q-96 |
| FR-R1-103 | M | CASE DOC NOTI | W-18 W-19 | CaseDecision, GeneratedDocument | S-R1-19 | getAppeal | TC-R1-192 | UAT-R1-09 | Q-19 |
| FR-R1-104 | M | CASE RPT | W-19 | CaseFile, RequestReceipt | S-R1-20 | createComplaint, getComplaintByTrackingCode | TC-R1-193, TC-R1-194, TC-R1-250, TC-R1-256 | UAT-R1-15 | — |
| FR-R1-105 | M | ADM | W-85 | TestIncident, RetestRequest, TestSlot | S-R1-21, S-R1-37 | requestRetest, decideRetest | TC-R1-195, TC-R1-196 | — | — |
| FR-R1-106 | S | CASE ADM | W-79 W-18 | Appeal, AccommodationPlan | S-R1-19, S-R1-41 | fileAdmissionAppeal | TC-R1-197 | UAT-R1-12 | Q-18 |
| FR-R1-107 | M | PRIV REC IAM | W-41 W-127 | GuardianInvitation, GuardianRelation | S-R1-03, S-R1-24 | createGuardianInvitation | TC-R1-198, TC-R1-199, TC-R1-327 | UAT-R1-03 | A-17, A-26 |
| FR-R1-108 | M | REC PRIV IAM | W-127 W-41 | GuardianRelation, GuardianInvitation, IdentityLink | S-R1-24, S-R1-26 | acceptGuardianInvitation, listMyWards | TC-R1-200, TC-R1-201, TC-R1-202, TC-R1-327, TC-R1-329 | UAT-R1-03, UAT-R1-13 | A-26 |
| FR-R1-109 | M | PRIV ADM HLT | W-41 W-42 | ConsentPolicyRule, Consent, GuardianConsent, PrivacyNotice, ConsentRequest | S-R1-23, S-R1-25, S-R1-14 | listConsentRequests, grantConsent, withdrawConsent, listMyConsents | TC-R1-203, TC-R1-204, TC-R1-205, TC-R1-255, TC-R1-323, TC-R1-328 | UAT-R1-03 | A-17, Q-103 |
| FR-R1-110 | M | REC PRIV ADM FIN | W-41 W-74 | GuardianRelation, Application, Offer, Invoice | S-R1-26 | listMyWards, getWardAdmissionSummary | TC-R1-206, TC-R1-207, TC-R1-208 | UAT-R1-03, UAT-R1-13 | A-26 |
| FR-R1-111 | M | NOTI PRIV ADM | W-74 W-163 W-43 | Message, GuardianRelation | S-R1-26, S-R1-22 | listMyNotifications | TC-R1-209 | UAT-R1-08 | — |
| FR-R1-112 | S | PRIV | W-41 W-42 | GuardianConsent, ConsentRequest | S-R1-25, S-R1-55 | recordAssistedGuardianApproval | TC-R1-210, TC-R1-328 | UAT-R1-13 | — |
| FR-R1-113 | S | PRIV IAM | W-127 | Consent, GuardianRelation | S-R1-23 | listConsentRequests | TC-R1-211 | — | — |
| FR-R1-114 | M | ADM REC | W-78 W-43 | ReportingHandoff, Offer, Person | S-R1-42 | listReportingHandoffs | TC-R1-212, TC-R1-213, TC-R1-257 | UAT-R1-10 | — |
| FR-R1-115 | M | ADM REC | W-78 | ReportingHandoff, StandardExport | S-R1-42 | exportReportingHandoffs, listReportingHandoffs | TC-R1-214, TC-R1-215 | UAT-R1-10 | A-69, Q-67 |
| FR-R1-116 | S | ADM SVC | W-78 | ReportingHandoff, Appointment | S-R1-17, S-R1-42 | chooseReportingMode | TC-R1-216 | UAT-R1-10 | — |
| FR-R1-117 | M | ADM IAM | W-78 | ReportingHandoff, IdentityLink, Offer | S-R1-42 | verifyReportingIdentity | TC-R1-217 | UAT-R1-10 | A-71 |
| FR-R1-118 | S | ADM REC | W-78 W-148 | ReportingHandoff | S-R1-42 | listReportingHandoffs | TC-R1-218 | UAT-R1-10 | A-110 |
| FR-R1-119 | M | RPT | W-136 | OitItem | S-R1-53 | listOitItems, updateOitItem | TC-R1-219 | UAT-R1-15 | A-47, Q-71, KPI-13 |
| FR-R1-120 | M | RPT ADM CASE | W-136 W-19 | OitItem, OitSnapshot | S-R1-53, S-R1-48 | listOitItems, createOitSnapshot | TC-R1-220 | UAT-R1-15 | A-47 |
| FR-R1-121 | M | RPT DOC | W-136 | OitItem, OitSnapshot | S-R1-53, S-R1-48 | approveOitPublication, createOitSnapshot, listOitItemsPublic | TC-R1-221 | UAT-R1-15 | A-47 |
| FR-R1-122 | S | RPT SVC CASE | W-136 | OitItem | S-R1-53 | listOitItems | TC-R1-222 | UAT-R1-15 | KPI-15 |
| FR-R1-123 | M | ADMIN ORG FIN PRIV DOC | W-69 W-81 | AdminChangeRequest | S-R1-50 | createChangeRequest, decideChangeRequest | TC-R1-223, TC-R1-224 | UAT-R1-02 | — |
| FR-R1-124 | M | ADMIN ORG | W-69 | OrgUnit, OrgSetting, ReleaseRing | S-R1-50 | createChangeRequest | TC-R1-225 | UAT-R1-02 | A-85, Q-59 |
| FR-R1-125 | M | ADMIN | W-74 | JobRun, IntegrationRun | S-R1-51 | listJobRuns, retryJobRun | TC-R1-226, TC-R1-227 | UAT-R1-16 | — |
| FR-R1-126 | M | ADMIN AUD | W-125 | BreakGlassSession, AuditEvent | S-R1-52 | requestBreakGlass, approveBreakGlass | TC-R1-228, TC-R1-229 | UAT-R1-16 | — |
| FR-R1-127 | M | ADMIN | W-124 | JitGrant | S-R1-52 | — | TC-R1-230 | UAT-R1-16 | — |
| FR-R1-128 | M | AUD | W-76 W-74 W-18 | AuditEvent | S-R1-50 | — | TC-R1-231, TC-R1-232 | — | — |
| FR-R1-129 | M | DOC | W-69 W-42 W-41 | DocumentTemplate, GeneratedDocument | S-R1-50 | createChangeRequest | TC-R1-233 | UAT-R1-01 | — |
| FR-R1-130 | M | ADMIN | W-41 W-74 | WaitingRoomPolicy | S-R1-47, S-R1-49 | getStatus | TC-R1-234, TC-R1-235, TC-R1-341 | UAT-R1-07 | A-34 |
| FR-R1-131 | S | ADMIN ORG | W-69 | ReleaseRing, CalendarEvent | S-R1-51 | — | TC-R1-236 | UAT-R1-16 | — |
| FR-R1-132 | S | ADM DOC ANA | W-75 W-78 | StandardExport | S-R1-37, S-R1-42 | requestStandardExport | TC-R1-237 | — | A-115 |
| FR-R1-133 | M | NOTI ADM | W-41 W-42 W-43 W-74 W-77 W-18 W-163 | NotificationRule, MessageTemplate, Message | S-R1-22 | listMyNotifications | TC-R1-238 | — | A-80 |
| FR-R1-134 | M | NOTI | W-74 W-43 | Message, Delivery, ChannelPreference | S-R1-22 | updateNotificationPreferences | TC-R1-239, TC-R1-240, TC-R1-263 | — | A-80, A-93 |
| FR-R1-135 | M | NOTI PRIV | W-42 W-74 | Message, MessageTemplate | S-R1-22 | — | TC-R1-241 | — | A-18 |
| FR-R1-136 | M | NOTI | W-41 | InboxItem, ChannelPreference | S-R1-22 | listMyNotifications, acknowledgeNotification, updateNotificationPreferences | TC-R1-242 | — | — |
| FR-R1-137 | M | NOTI PRIV | W-41 | ChannelBinding, Consent | S-R1-22 | bindLineAccount, unbindLineAccount | TC-R1-243 | — | — |
| FR-R1-138 | M | ENG NOTI DOC | W-36 W-69 W-42 | Announcement, AudienceSegment, RecipientSnapshot | S-R1-56 | createAnnouncement, approveAnnouncement | TC-R1-244, TC-R1-245 | UAT-R1-01 | — |
| FR-R1-139 | S | NOTI ADM | W-42 | Message | S-R1-38, S-R1-56 | publishResults | TC-R1-246, TC-R1-262 | UAT-R1-07 | — |

## 2. NFR matrix

| NFR | หมวด | Test | A/Q |
|---|---|---|---|
| NFR-R1-001 | Performance | TC-R1-264, TC-R1-265 | A-23, A-34 |
| NFR-R1-002 | Performance | TC-R1-266 | — |
| NFR-R1-003 | Performance | TC-R1-267 | — |
| NFR-R1-004 | Performance | TC-R1-268 | — |
| NFR-R1-005 | Performance | TC-R1-269 | — |
| NFR-R1-006 | Performance | TC-R1-270, TC-R1-271 | — |
| NFR-R1-007 | Performance | TC-R1-272, TC-R1-273 | — |
| NFR-R1-008 | Availability | TC-R1-274 | A-103, Q-90 |
| NFR-R1-009 | Availability | TC-R1-275, TC-R1-276 | — |
| NFR-R1-010 | Availability | TC-R1-277, TC-R1-278 | — |
| NFR-R1-011 | Security | TC-R1-250, TC-R1-279, TC-R1-280 | — |
| NFR-R1-012 | Security | TC-R1-247, TC-R1-251, TC-R1-254, TC-R1-281, TC-R1-282, TC-R1-283 | — |
| NFR-R1-013 | Security | TC-R1-284, TC-R1-285 | — |
| NFR-R1-014 | Security | TC-R1-248, TC-R1-286, TC-R1-287 | — |
| NFR-R1-015 | Security | TC-R1-288, TC-R1-289 | — |
| NFR-R1-016 | Security | TC-R1-252, TC-R1-290, TC-R1-291 | — |
| NFR-R1-017 | Security | TC-R1-292 | — |
| NFR-R1-018 | Security | TC-R1-293 | — |
| NFR-R1-019 | PDPA | TC-R1-256, TC-R1-294 | Q-69, Q-103 |
| NFR-R1-020 | PDPA | TC-R1-255, TC-R1-295 | A-17 |
| NFR-R1-021 | PDPA | TC-R1-296 | — |
| NFR-R1-022 | PDPA | TC-R1-257, TC-R1-297 | — |
| NFR-R1-023 | PDPA | TC-R1-298 | A-118 |
| NFR-R1-024 | Accessibility | TC-R1-299, TC-R1-300, TC-R1-301, TC-R1-302, TC-R1-315, TC-R1-316, TC-R1-317, TC-R1-318, TC-R1-319, TC-R1-320, TC-R1-321, TC-R1-322, TC-R1-323, TC-R1-324, TC-R1-325, TC-R1-326, TC-R1-327, TC-R1-328, TC-R1-329, TC-R1-330, TC-R1-331, TC-R1-332, TC-R1-333, TC-R1-334, TC-R1-335, TC-R1-336, TC-R1-337, TC-R1-338, TC-R1-339, TC-R1-340, TC-R1-341 | — |
| NFR-R1-025 | Thai typography | TC-R1-303, TC-R1-304 | — |
| NFR-R1-026 | Usability | TC-R1-305 | — |
| NFR-R1-027 | Usability | TC-R1-306 | A-95 |
| NFR-R1-028 | Usability | TC-R1-307 | — |
| NFR-R1-029 | Audit | TC-R1-253, TC-R1-308, TC-R1-309 | — |
| NFR-R1-030 | Operations | TC-R1-310 | — |
| NFR-R1-031 | Operations | TC-R1-311 | A-121, Q-110 |
| NFR-R1-032 | Interoperability | TC-R1-312, TC-R1-313 | — |
| NFR-R1-033 | Scalability | TC-R1-314 | — |

## 3. Coverage check

### 3.1 ทุก workflow ของ R1 มี FR ≥ 1

ชุด workflow ของ R1 = ทุก workflow ที่ `stage = pre` ใน `data/workflows.json` (21 รายการ) + workflow platform ที่ R1 ต้องใช้ตาม D-03 และ 06 §11 (11 รายการ)

| Workflow | stage | โมดูล | ชื่อ | FR | ผล |
|---|---|---|---|---|---|
| W-18 | pre | CASE | ขอทบทวนผลคัดเลือก (แบบเร่งด่วน ให้จบก่อนกำหนดยืนยันสิทธิ์) | FR-R1-081, FR-R1-084, FR-R1-099, FR-R1-100, FR-R1-101, FR-R1-102, FR-R1-103, FR-R1-106, FR-R1-128, FR-R1-133 | ✓ |
| W-41 | pre | ADM | สมัครเรียนออนไลน์ | FR-R1-011, FR-R1-012, FR-R1-013, FR-R1-014, FR-R1-015, FR-R1-016, FR-R1-019, FR-R1-020, FR-R1-021, FR-R1-022, FR-R1-033, FR-R1-034, FR-R1-035, FR-R1-036, FR-R1-037, FR-R1-044, FR-R1-045, FR-R1-046, FR-R1-047, FR-R1-048, FR-R1-107, FR-R1-108, FR-R1-109, FR-R1-110, FR-R1-112, FR-R1-129, FR-R1-130, FR-R1-133, FR-R1-136, FR-R1-137 | ✓ |
| W-42 | pre | ADM | สอบคัดเลือก สอบทักษะกีฬา และสัมภาษณ์ | FR-R1-023, FR-R1-035, FR-R1-043, FR-R1-054, FR-R1-058, FR-R1-059, FR-R1-061, FR-R1-062, FR-R1-063, FR-R1-064, FR-R1-065, FR-R1-066, FR-R1-068, FR-R1-070, FR-R1-076, FR-R1-079, FR-R1-080, FR-R1-081, FR-R1-082, FR-R1-083, FR-R1-084, FR-R1-085, FR-R1-109, FR-R1-112, FR-R1-129, FR-R1-133, FR-R1-135, FR-R1-138, FR-R1-139 | ✓ |
| W-43 | pre | ADM | ยืนยันสิทธิ์และชำระค่าแรกเข้า | FR-R1-026, FR-R1-045, FR-R1-046, FR-R1-047, FR-R1-048, FR-R1-051, FR-R1-053, FR-R1-086, FR-R1-087, FR-R1-088, FR-R1-089, FR-R1-111, FR-R1-114, FR-R1-133, FR-R1-134 | ✓ |
| W-69 | pre | ADM | ตั้งค่าและประกาศรอบรับสมัครรายวิทยาเขต | FR-R1-001, FR-R1-002, FR-R1-003, FR-R1-004, FR-R1-005, FR-R1-006, FR-R1-007, FR-R1-008, FR-R1-010, FR-R1-017, FR-R1-123, FR-R1-124, FR-R1-129, FR-R1-131, FR-R1-138 | ✓ |
| W-70 | pre | ADM | รับสมัครประเภทโควตาเรียนดี | FR-R1-003, FR-R1-021, FR-R1-022, FR-R1-023, FR-R1-043, FR-R1-079, FR-R1-081, FR-R1-082 | ✓ |
| W-71 | pre | ADM | รับสมัครประเภทโควตานักกีฬา | FR-R1-003, FR-R1-024, FR-R1-025, FR-R1-041, FR-R1-043, FR-R1-064, FR-R1-065, FR-R1-066, FR-R1-079, FR-R1-081, FR-R1-082 | ✓ |
| W-72 | pre | ADM | รับสมัครประเภททั่วไปรายรอบ (รอบ 1…n) | FR-R1-009, FR-R1-026, FR-R1-043, FR-R1-063, FR-R1-079, FR-R1-081, FR-R1-082, FR-R1-092 | ✓ |
| W-73 | pre | ADM | TCAS adapter (ทางเลือก) | FR-R1-032 | ✓ |
| W-74 | pre | ADM | Clearing ภายใน มกช. (ยืนยันสิทธิ์ได้ที่เดียว) และเรียกสำรอง | FR-R1-012, FR-R1-080, FR-R1-086, FR-R1-087, FR-R1-088, FR-R1-089, FR-R1-090, FR-R1-091, FR-R1-092, FR-R1-093, FR-R1-094, FR-R1-096, FR-R1-097, FR-R1-098, FR-R1-100, FR-R1-102, FR-R1-110, FR-R1-111, FR-R1-125, FR-R1-128, FR-R1-130, FR-R1-133, FR-R1-134, FR-R1-135 | ✓ |
| W-75 | pre | ADM | จัดตารางสอบทักษะ / สัมภาษณ์ และแต่งตั้งกรรมการ | FR-R1-018, FR-R1-054, FR-R1-055, FR-R1-056, FR-R1-057, FR-R1-058, FR-R1-059, FR-R1-060, FR-R1-078, FR-R1-132 | ✓ |
| W-76 | pre | ADM | ให้คะแนนสอบทักษะหลายกรรมการ และ moderation | FR-R1-004, FR-R1-017, FR-R1-057, FR-R1-069, FR-R1-070, FR-R1-071, FR-R1-072, FR-R1-073, FR-R1-074, FR-R1-075, FR-R1-076, FR-R1-077, FR-R1-079, FR-R1-128 | ✓ |
| W-77 | pre | ADM | ตรวจเอกสารผู้สมัคร | FR-R1-022, FR-R1-036, FR-R1-037, FR-R1-038, FR-R1-039, FR-R1-040, FR-R1-042, FR-R1-133 | ✓ |
| W-78 | pre | ADM | วันรายงานตัว (ออกรหัสนักศึกษา) | FR-R1-013, FR-R1-026, FR-R1-042, FR-R1-096, FR-R1-114, FR-R1-115, FR-R1-116, FR-R1-117, FR-R1-118, FR-R1-132 | ✓ |
| W-79 | pre | ADM | จัด accommodation ในการสอบคัดเลือกสำหรับผู้สมัครพิการ | FR-R1-006, FR-R1-028, FR-R1-106 | ✓ |
| W-80 | pre | ADM | ผู้สมัครต่างชาติ: เทียบวุฒิและเอกสารวีซ่า | FR-R1-013, FR-R1-029, FR-R1-052, FR-R1-062 | ✓ |
| W-81 | pre | FIN | ยกเว้น / คืนค่าสมัคร | FR-R1-034, FR-R1-049, FR-R1-050, FR-R1-123 | ✓ |
| W-82 | pre | ADM | รับโอน / เทียบโอนจาก ปวส. หรือสถาบันอื่น | FR-R1-030 | ✓ |
| W-85 | pre | ADM | เหตุการณ์วันสอบทักษะ (บาดเจ็บ / ขาดสอบ / ขอเลื่อน) | FR-R1-066, FR-R1-067, FR-R1-105 | ✓ |
| W-144 | pre | ADM | นักเรียนโรงเรียนกีฬาสมัครต่อ มกช. (โควตาภายใน) | FR-R1-027 | ✓ |
| W-163 | pre | ADM | ยืนยันสิทธิ์ซ้ำก่อนเปิดภาค (pre-term reconfirmation) สำหรับผู้ยืนยันสิทธิ์รอบต้น | FR-R1-095, FR-R1-111, FR-R1-133 | ✓ |
| W-19 | problem | CASE | ร้องเรียน / แจ้งเบาะแส | FR-R1-103, FR-R1-104, FR-R1-120 | ✓ |
| W-36 | admin | ENG | ประกาศ / ประกาศฉุกเฉิน | FR-R1-008, FR-R1-010, FR-R1-085, FR-R1-138 | ✓ |
| W-39 | sport | HLT | บันทึกการบาดเจ็บ | FR-R1-067 | ✓ |
| W-117 | admin | ORG | ปฏิทินการศึกษา: สร้าง / อนุมัติ / เผยแพร่ | FR-R1-005 | ✓ |
| W-124 | admin | ADMIN | ขอสิทธิ์ privileged แบบ Just-in-Time (PAM) | FR-R1-127 | ✓ |
| W-125 | admin | ADMIN | ใช้บัญชี break-glass ของระบบ | FR-R1-126 | ✓ |
| W-127 | first | REC | ผูกบัญชีผู้ปกครองและยืนยันความสัมพันธ์ (ระดับการยืนยัน 2 ระดับ + ช่องทางเจ้าหน้าที่ช่วย) | FR-R1-107, FR-R1-108, FR-R1-113 | ✓ |
| W-136 | admin | RPT | เผยแพร่ข้อมูล ITA / OIT | FR-R1-119, FR-R1-120, FR-R1-121, FR-R1-122 | ✓ |
| W-139 | admin | IAM | เปิดบัญชีบุคคลภายนอก (กรรมการสอบ อาจารย์พิเศษ ครูพี่เลี้ยง โค้ชสัญญาจ้าง) | FR-R1-018, FR-R1-056 | ✓ |
| W-152 | sport | HLT | สงสัยกระทบกระเทือนสมอง (suspected concussion): ถอดออกทันที → ประเมิน → กลับเรียน → กลับเล่น | FR-R1-067 | ✓ |
| W-153 | sport | FAC | ความร้อน (heat stress): วัด WBGT ปรับกิจกรรม และรับมือ heat illness | FR-R1-060, FR-R1-061 | ✓ |

**ผล:** 32/32 workflow มี FR (workflow `pre` ที่ไม่ได้อยู่ในชุด: ไม่มี)

### 3.2 workflow ที่เกี่ยวข้องแต่ไม่อยู่ในชุด R1

| Workflow | ชื่อ | เหตุผล |
|---|---|---|
| W-83 | รับนักเรียนโรงเรียนกีฬา ม.1/ม.4 | ไม่อยู่ใน R1: ช่องทางโรงเรียนกีฬาเปิดที่ SS1-ADM (1 ธ.ค. 2572) / Wave 1 (เล่ม 12 §2.1, 06 §11) — กติกา clearing และโมเดล guardian ของ R1 ออกแบบให้ใช้ซ้ำได้ |
| W-84 | รับสมัคร ป.โท/ป.เอก | อยู่ใน R1 แบบมีเงื่อนไข ("ถ้าผ่าน go/no-go" — เล่ม 12 §2.1) จึงมี FR ระดับ Could (FR-R1-031) |
| W-148 | Fast-track late-admit | workflow ของ REC ใน R2; R1 ทำเพียงติดธง late_admit ใน handoff (FR-R1-118) |
| W-160 | ผู้อุปการะ (CAREGIVER) | workflow ของ REC/SSC; R1 รองรับเพียงความสัมพันธ์ CAREGIVER ที่สิทธิ์จำกัดตอนผูกบัญชี (FR-R1-108) |
| W-28 | ยกเลิกใบเสร็จ | FIN เต็มอยู่ R2; R1 บังคับเพียงกติกา SoD-11 เมื่อจำเป็นต้องยกเลิกใบเสร็จค่าสมัคร (FR-R1-048) |
| W-21 | DSR (PDPA) | DSR execution อยู่ R2 (06 §5.8); R1 รับเรื่องหมวด PDPA ผ่านช่องร้องเรียนและส่งคิว DPO (FR-R1-104) |

### 3.3 ทุก FR มี test ≥ 1

**ผล:** 139/139 FR มี test case (ขาด: ไม่มี); จำนวน TC ต่อ FR: ต่ำสุด 1 สูงสุด 6 เฉลี่ย 2.5

**NFR:** 33/33 มี test case (ขาด: ไม่มี)

### 3.4 หน้าจอ API และ entity

- หน้าจอที่ไม่มี FR: ไม่มี (58 หน้าจอ)
- operation ใน r1-api.yaml ที่ไม่มี FR อ้าง: ไม่มี (146 operation)
- entity ในพจนานุกรมที่ไม่มี FR อ้าง: ไม่มี (127 entity)

### 3.5 ความครอบคลุมตามโมดูล R1 (D-03)

| โมดูล | FR |
|---|---|
| ADM | 106 (FR-R1-001, FR-R1-002, FR-R1-003, FR-R1-004, FR-R1-005, FR-R1-006, FR-R1-007, FR-R1-008 …) |
| IAM | 14 (FR-R1-007, FR-R1-011, FR-R1-012, FR-R1-013, FR-R1-015, FR-R1-016, FR-R1-017, FR-R1-018 …) |
| ORG | 12 (FR-R1-001, FR-R1-005, FR-R1-008, FR-R1-009, FR-R1-054, FR-R1-063, FR-R1-091, FR-R1-094 …) |
| NOTI | 16 (FR-R1-039, FR-R1-043, FR-R1-059, FR-R1-067, FR-R1-082, FR-R1-086, FR-R1-095, FR-R1-103 …) |
| ENG | 6 (FR-R1-008, FR-R1-010, FR-R1-043, FR-R1-082, FR-R1-085, FR-R1-138) |
| SVC | 4 (FR-R1-033, FR-R1-049, FR-R1-116, FR-R1-122) |
| CASE | 10 (FR-R1-035, FR-R1-099, FR-R1-100, FR-R1-101, FR-R1-102, FR-R1-103, FR-R1-104, FR-R1-106 …) |
| DOC | 20 (FR-R1-006, FR-R1-007, FR-R1-010, FR-R1-029, FR-R1-033, FR-R1-036, FR-R1-041, FR-R1-043 …) |
| PRIV | 14 (FR-R1-014, FR-R1-027, FR-R1-064, FR-R1-068, FR-R1-107, FR-R1-108, FR-R1-109, FR-R1-110 …) |
| AUD | 6 (FR-R1-016, FR-R1-072, FR-R1-076, FR-R1-081, FR-R1-126, FR-R1-128) |
| FIN | 20 (FR-R1-006, FR-R1-008, FR-R1-026, FR-R1-029, FR-R1-031, FR-R1-034, FR-R1-044, FR-R1-045 …) |
| REC | 9 (FR-R1-012, FR-R1-014, FR-R1-042, FR-R1-107, FR-R1-108, FR-R1-110, FR-R1-114, FR-R1-115 …) |
| CUR | 3 (FR-R1-002, FR-R1-030, FR-R1-102) |
| HLT | 9 (FR-R1-028, FR-R1-058, FR-R1-060, FR-R1-064, FR-R1-065, FR-R1-066, FR-R1-067, FR-R1-068 …) |
| FAC | 4 (FR-R1-054, FR-R1-055, FR-R1-060, FR-R1-061) |
| ADMIN | 9 (FR-R1-032, FR-R1-083, FR-R1-123, FR-R1-124, FR-R1-125, FR-R1-126, FR-R1-127, FR-R1-130 …) |
| RPT | 5 (FR-R1-104, FR-R1-119, FR-R1-120, FR-R1-121, FR-R1-122) |

## 4. การพึ่งพาสมมติฐาน/คำถาม → FR

| A/Q/KPI | FR/NFR |
|---|---|
| A-17 | FR-R1-014, FR-R1-107, FR-R1-109, NFR-R1-020 |
| A-18 | FR-R1-135 |
| A-23 | NFR-R1-001 |
| A-26 | FR-R1-107, FR-R1-108, FR-R1-110 |
| A-29 | FR-R1-031 |
| A-30 | FR-R1-029 |
| A-31 | FR-R1-028 |
| A-34 | FR-R1-083, FR-R1-130, NFR-R1-001 |
| A-36 | FR-R1-005 |
| A-47 | FR-R1-119, FR-R1-120, FR-R1-121 |
| A-48 | FR-R1-002, FR-R1-102 |
| A-49 | FR-R1-001, FR-R1-009, FR-R1-019 |
| A-50 | FR-R1-032 |
| A-51 | FR-R1-019, FR-R1-088, FR-R1-090, FR-R1-092, FR-R1-097 |
| A-52 | FR-R1-004, FR-R1-056, FR-R1-074, FR-R1-075 |
| A-53 | FR-R1-026, FR-R1-082 |
| A-55 | FR-R1-031 |
| A-56 | FR-R1-012 |
| A-57 | FR-R1-006, FR-R1-051 |
| A-58 | FR-R1-044, FR-R1-046 |
| A-69 | FR-R1-115 |
| A-71 | FR-R1-011, FR-R1-013, FR-R1-117 |
| A-79 | FR-R1-048 |
| A-80 | FR-R1-133, FR-R1-134 |
| A-85 | FR-R1-001, FR-R1-124 |
| A-93 | FR-R1-086, FR-R1-134 |
| A-95 | NFR-R1-027 |
| A-103 | NFR-R1-008 |
| A-110 | FR-R1-091, FR-R1-095, FR-R1-118 |
| A-115 | FR-R1-132 |
| A-118 | FR-R1-068, NFR-R1-023 |
| A-119 | FR-R1-013, FR-R1-062 |
| A-121 | NFR-R1-031 |
| KPI-01 | FR-R1-098 |
| KPI-02 | FR-R1-098 |
| KPI-13 | FR-R1-119 |
| KPI-15 | FR-R1-122 |
| KPI-19 | FR-R1-038 |
| KPI-20 | FR-R1-012 |
| KPI-21 | FR-R1-047 |
| KPI-22 | FR-R1-047 |
| Q-11 | FR-R1-032 |
| Q-12 | FR-R1-088, FR-R1-090, FR-R1-092, FR-R1-097 |
| Q-13 | FR-R1-001, FR-R1-003, FR-R1-007, FR-R1-010, FR-R1-021, FR-R1-023 |
| Q-14 | FR-R1-004, FR-R1-024, FR-R1-054, FR-R1-056, FR-R1-074 |
| Q-17 | FR-R1-027 |
| Q-18 | FR-R1-028, FR-R1-029, FR-R1-030, FR-R1-106 |
| Q-19 | FR-R1-099, FR-R1-101, FR-R1-103 |
| Q-21 | FR-R1-031 |
| Q-22 | FR-R1-002 |
| Q-23 | FR-R1-064 |
| Q-25 | FR-R1-005 |
| Q-34 | FR-R1-006, FR-R1-051 |
| Q-35 | FR-R1-044, FR-R1-046, FR-R1-050 |
| Q-45 | FR-R1-028 |
| Q-46 | FR-R1-029 |
| Q-50 | FR-R1-025, FR-R1-041 |
| Q-59 | FR-R1-124 |
| Q-60 | FR-R1-097 |
| Q-65 | FR-R1-011, FR-R1-013 |
| Q-67 | FR-R1-115 |
| Q-69 | FR-R1-085, NFR-R1-019 |
| Q-71 | FR-R1-119 |
| Q-75 | FR-R1-062 |
| Q-90 | NFR-R1-008 |
| Q-95 | FR-R1-091, FR-R1-095 |
| Q-96 | FR-R1-005, FR-R1-099, FR-R1-100, FR-R1-101, FR-R1-102 |
| Q-99 | FR-R1-061 |
| Q-103 | FR-R1-064, FR-R1-067, FR-R1-109, NFR-R1-019 |
| Q-108 | FR-R1-029, FR-R1-052 |
| Q-110 | NFR-R1-031 |
| Q-114 | FR-R1-045 |

## 5. ช่องว่าง (G-xx) → FR

| G | FR |
|---|---|
| G-01 | FR-R1-028, FR-R1-106 |
| G-02 | FR-R1-050 |
| G-03 | FR-R1-115 |
| G-04 | FR-R1-027 |
| G-05 | FR-R1-007, FR-R1-082 |
| G-06 | FR-R1-043, FR-R1-085 |
| G-07 | FR-R1-061 |
| G-08 | FR-R1-064 |
| G-09 | FR-R1-083, FR-R1-094 |
| G-10 | FR-R1-108 |
| G-11 | FR-R1-060, FR-R1-066, FR-R1-067 |
| G-12 | FR-R1-008, FR-R1-044 |
| G-13 | หลาย FR |
