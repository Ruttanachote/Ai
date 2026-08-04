# 01 — วิเคราะห์ฟีเจอร์ MVP

## 1. สิ่งที่ศึกษามา (Competitive landscape, ส.ค. 2026)

| ผลิตภัณฑ์ | จุดยืน | ราคา (โดยประมาณ) |
|---|---|---|
| **ChatCut** | AI agent ตัดต่อผ่านแชท + timeline editor เต็มรูปแบบบนเว็บ | Free (starter credits) / $25 = 100 เครดิต / $100 = 400 เครดิต ต่อเดือน |
| **Descript** | ตัดต่อผ่าน transcript (แก้ข้อความ = แก้วิดีโอ) | Free ~60 นาที / Hobbyist ~$16 / Creator ~$24 ต่อเดือน |
| **Opus Clip** | เครื่องดึงไฮไลต์จากคลิปยาว → คลิปสั้นลง TikTok/Shorts | Free 60 เครดิต / $15 / $29 ต่อเดือน (1 เครดิต = 1 นาทีวิดีโอ) |
| **CapCut** | Editor ทั่วไป + template (ไม่ใช่ agent) | Freemium |

**ช่องว่างที่ ChatCut เจาะ และเราเจาะตาม:** ผู้ใช้อยากได้ "สั่งด้วยภาษาคน" แต่ *ไม่อยาก* เสีย
การควบคุม — เครื่องมือ generative ส่วนใหญ่ให้ผลลัพธ์ตายตัวแก้ไม่ได้ จุดขายคือ
**agent + timeline ที่แก้มือต่อได้เสมอ**

## 2. หลักการเลือกฟีเจอร์ MVP

- ทุกฟีเจอร์ต้องอยู่บน loop เดียว: **พูด → เห็นผลบน timeline → แก้ → render**
- Non-destructive เสมอ (ไฟล์ต้นฉบับไม่ถูกแตะ, timeline เป็นแค่ reference + in/out points)
- ผลของ AI ต้องเป็น **โครงสร้างที่ validate ได้** (EditOperation) ไม่ใช่ให้ AI แตะไฟล์ตรง ๆ

## 3. ฟีเจอร์ MVP (P0 = ต้องมีถึงจะเรียกว่าใช้งานได้)

| # | ฟีเจอร์ | เหตุผล | P |
|---|---|---|---|
| F1 | อัปโหลดวิดีโอ/เสียง + probe metadata | จุดเริ่มของทุก workflow | P0 |
| F2 | ถอดเสียงเป็น transcript ผูก timestamp ระดับคำ | เป็น "ดวงตา" ของ agent — ทุกฟีเจอร์ AI พึ่งสิ่งนี้ | P0 |
| F3 | Timeline engine: clip, trim, split, reorder, delete, undo/redo | แกนของความเป็น editor | P0 |
| F4 | **Chat-to-edit**: คำสั่งภาษาคน → EditOperations ผ่าน Claude | ฟีเจอร์เรือธง | P0 |
| F5 | ตัด filler words / ช่วงเงียบ อัตโนมัติ | use case ยอดฮิตสุด, ทำได้จาก transcript ล้วน ๆ | P0 |
| F6 | Rough cut จากคำสั่ง ("สรุปเหลือ 3 นาที เก็บประเด็น X") | จุดขายหลักของ agent | P0 |
| F7 | Auto captions + burn-in ตอน render | ผู้ชม social ดูแบบปิดเสียงเป็นส่วนใหญ่ | P0 |
| F8 | Render/export MP4 (H.264) ผ่าน ffmpeg + job queue | ปิด loop การใช้งาน | P0 |
| F9 | Text-based editing (ลบประโยคใน transcript = ตัดคลิป) | ต่อยอดจาก F2+F3 ราคาถูก ได้ UX แบบ Descript | P1 |
| F10 | หาไฮไลต์ → เสนอเป็นลิสต์ให้เลือก | ตลาด short-form ใหญ่ (แบบ Opus Clip) | P1 |
| F11 | แปลซับหลายภาษา | ใช้ Claude แปล ต้นทุนต่ำ มูลค่าสูง | P1 |
| F12 | AI music / B-roll / motion graphics gen | แพง ซับซ้อน — รอ post-MVP | P2 |
| F13 | Multi-user / collaboration | รอมี traction ก่อน | P2 |

## 4. นิยาม "เสร็จ" ของ MVP (Definition of Done)

ผู้ใช้หนึ่งคนสามารถ: อัปโหลดคลิปสัมภาษณ์ 20 นาที → พิมพ์ *"ตัดคำว่าเอ่อกับช่วงเงียบออก
แล้วเหลือไฮไลต์ 2 นาที ใส่ซับไทย"* → ตรวจ timeline ปรับ in/out เอง 2–3 จุด →
กด export ได้ MP4 พร้อมซับ ภายใน **ไม่เกิน 10 นาที** โดยไม่ต้องรู้จักคำว่า codec

## 5. Non-goals ของ MVP

- ไม่ทำ mobile app (เว็บ/desktop ก่อน)
- ไม่ทำ video generation (text-to-video) — เราคือ *editor* ไม่ใช่ *generator*
- ไม่ทำ effects/color grading ขั้นสูง
- ไม่ทำ real-time collaboration
