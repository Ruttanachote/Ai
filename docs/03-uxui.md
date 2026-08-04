# 03 — UX/UI Design

## 1. หลักการออกแบบ

1. **แชทคือพวงมาลัย, timeline คือความจริง** — ทุกอย่างที่ AI ทำต้องปรากฏบน timeline
   ให้ผู้ใช้เห็น แก้ และ undo ได้เสมอ (บทเรียนจาก ChatCut: "ไม่ใช่ AI กล่องดำ")
2. **Preview ก่อน apply** — คำสั่ง agent คืนผลเป็น "ข้อเสนอ" (proposed operations)
   ผู้ใช้กด Apply/Reject; สร้างความไว้ใจตั้งแต่ครั้งแรกที่ใช้
3. **ศัพท์คนธรรมดา** — ไม่มีคำว่า codec/bitrate ใน happy path; ซ่อนไว้ใน Advanced
4. **ทุก action ของ AI ต้อง explain ตัวเอง** — เช่น "ตัด 14 ช่วง รวม 3:42 เพราะเป็นช่วงเงียบ >1.5s"

## 2. Layout หลัก (Editor — จอเดียวจบ)

```
┌────────────────────────────────────────────────────────────────┐
│ ⬅ Projects   ชื่อโปรเจกต์        เครดิต: 128   [Export ▾]     │
├──────────────┬─────────────────────────────┬───────────────────┤
│              │                             │                   │
│  💬 Chat     │      🎬 Preview player      │  📝 Transcript    │
│  (agent)     │                             │  (คลิกคำ = seek,  │
│              │                             │   ลบประโยค = ตัด) │
│  [proposal   │                             │                   │
│   cards:     │                             │                   │
│   Apply/     │                             │                   │
│   Reject]    │                             │                   │
├──────────────┴─────────────────────────────┴───────────────────┤
│  🎞 Timeline: track วิดีโอ / เสียง / caption                     │
│  [clip][clip][clip]   ← drag, trim, split, right-click menu    │
│  ▶ playhead ผูกกับ transcript และ preview                       │
└────────────────────────────────────────────────────────────────┘
```

สามแผงซิงก์กันเสมอ: คลิกคำใน transcript → playhead เลื่อน → clip ที่เกี่ยว highlight

## 3. User flows หลัก

### Flow A — First cut (สำคัญสุด: time-to-wow < 5 นาที)
1. สร้างโปรเจกต์ → ลากไฟล์วิดีโอลง (progress: อัปโหลด → ถอดเสียง)
2. ระหว่างรอ แสดง transcript ทยอยขึ้น (perceived speed)
3. Chat แนะนำ prompt สำเร็จรูป 3 ปุ่ม: "ตัดช่วงเงียบ/คำฟุ่มเฟือย", "ทำไฮไลต์ 60 วิ", "ใส่ซับ"
4. ผู้ใช้กดหรือพิมพ์เอง → agent คืน proposal card → Apply → timeline อัปเดต
5. กด Export → ได้ MP4

### Flow B — Text-based editing
เลือกประโยคใน transcript → ปุ่ม "ตัดออก" → clip ถูก split/ลบบน timeline ทันที (undo ได้)

### Flow C — Review งานของ agent
Proposal card แสดง: สรุปสิ่งที่จะทำ, จำนวนช่วงที่ตัด, ความยาวก่อน/หลัง, ปุ่มดูรายช่วง
(กดแล้ว jump ไปดูใน preview ทีละช่วง) → Apply ทั้งหมด หรือเลือกบางช่วง

## 4. Screen map ของ MVP

| หน้า | เนื้อหา |
|---|---|
| Projects list | การ์ดโปรเจกต์ + ปุ่ม New + โควตาเครดิต |
| Editor | ตาม layout ข้อ 2 (หน้าเดียว ครอบ 90% ของเวลาใช้งาน) |
| Export modal | preset: Social 9:16 / YouTube 16:9 / Original + toggle burn-in captions |
| Settings | API usage, billing, ภาษาซับเริ่มต้น |

## 5. สถานะที่ต้องออกแบบให้ดี (มักถูกลืม)

- **กำลังถอดเสียง**: แสดง % + ให้เล่นวิดีโอดูก่อนได้
- **Agent กำลังคิด**: สตรีมข้อความอธิบายเป็นขั้น ("กำลังหาช่วงเงียบ… เจอ 14 ช่วง")
- **คำสั่งกำกวม**: agent ถามกลับใน chat ("เก็บไฮไลต์กี่นาทีดี?") แทนการเดา
- **Render queue**: ปิดแท็บได้ เสร็จแล้วแจ้งเตือน/อีเมล
- **Error**: ffmpeg ล้ม → บอกภาษาคน + ปุ่ม retry, ไม่โชว์ stderr ใส่หน้าผู้ใช้

## 6. Accessibility & i18n

- UI สองภาษา ไทย/อังกฤษ ตั้งแต่แรก (สตริงแยกไฟล์ locale)
- ทุกปุ่มมี keyboard shortcut มาตรฐาน editor (space=play, S=split, Cmd+Z=undo)
- Caption editor ตรวจ contrast ratio ของสีซับอัตโนมัติ
