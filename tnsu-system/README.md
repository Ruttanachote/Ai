# TNSU System — เอกสารออกแบบระบบสารสนเทศ มหาวิทยาลัยการกีฬาแห่งชาติ

โฟลเดอร์นี้เก็บเอกสาร **การออกแบบ (design only, ยังไม่มี source code)** ของแพลตฟอร์มบริหารวงจรชีวิตนักศึกษาและนักกีฬาของมหาวิทยาลัยการกีฬาแห่งชาติ (มกช./TNSU) ครอบคลุม 17 วิทยาเขตและโรงเรียนกีฬา 13 แห่ง จัดทำเพื่อเตรียมการเสนองาน (pre-bid) โดยไม่มีข้อมูลภายในของ มกช. ดังนั้นทุกข้อเท็จจริงที่ยังไม่ยืนยันถูกระบุเป็น **สมมติฐาน** หรือ **[ต้องตรวจสอบ]**

## เอกสาร

| ไฟล์ | เนื้อหา |
|---|---|
| [docs/system-design.md](docs/system-design.md) | **System Design Document** (ภาษาไทย): บทสรุปผู้บริหาร, ขอบเขต, ตารางสมมติฐาน, personas/journeys, บทบาท/ลำดับชั้น/approval chains/permission matrix, module catalogue (bounded contexts + ส่วนขยายมหาวิทยาลัย), C4 + sequence diagrams (Mermaid), data architecture, integration catalogue, tech stack + ADR-001…019, NFR (SLO/RPO/RTO/peak capacity), security & PDPA compliance mapping, deployment/operations, roadmap + risks, ทีมและประมาณการต้นทุน, คำถามเปิดสำหรับ Discovery |
| [docs/government-relations.md](docs/government-relations.md) | เอกสารคู่กัน: ความสัมพันธ์ของ มกช. กับหน่วยงานรัฐและองค์กรภายนอก |

## ข้อมูลวิจัยต้นทาง

บันทึกการวิจัยที่ใช้เป็นแหล่งอ้างอิงอยู่ที่ [../research_notes/ออกแบบระบบการศึกษา TNSU ระดับ production/](<../research_notes/ออกแบบระบบการศึกษา TNSU ระดับ production/>)

- `tnsu_profile.md` — ข้อมูลองค์กร วิทยาเขต โรงเรียนกีฬา นักศึกษา งบประมาณ และการแยกกระทรวง
- `thai_gov_compliance.md` — การจัดซื้อจัดจ้าง, PDPA, ไซเบอร์, มาตรฐาน DGA/ETDA, Cloud First, งานสารบรรณ
- `external_integrations.md` — ThaID, TCAS, กยศ. DSL, CHECO, e-Transcript, การชำระเงิน/GFMIS, DCAT, e-Saraban
- `products_architecture.md` — SIS เชิงพาณิชย์และ open source, ตลาดไทย, AMS, สถาปัตยกรรมอ้างอิง, ความเสี่ยงของ AI
- `process_requirements.md` — กฎวิชาการ, การสำเร็จการศึกษา/คุรุสภา, การเงิน, หอพัก, กิจการนักศึกษา, กีฬา, QA/ITA, personas

## สถานะ

ร่าง v0.9 (28 ต.ค. 2569) — ต้องยืนยันสมมติฐานใน Phase 0 Discovery ก่อนนำไปจัดทำ TOR หรือข้อเสนอราคา
