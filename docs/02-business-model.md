# 02 — Business Model

## 1. กลุ่มเป้าหมาย (เรียงตามความสำคัญ)

1. **Solo creator / podcaster** — ตัดคลิปสัมภาษณ์, vlog, คลิปสอน; ไม่มีเวลาเรียน Premiere
2. **ทีมการตลาด SME** — ทำคลิปสั้นลง social สม่ำเสมอ ต้นทุน editor แพง
3. **Course creator / สายการศึกษา** — คลิปยาว ต้องการซับ + ตัดให้กระชับจำนวนมาก

Persona หลัก: *"ครีเอเตอร์ที่อัดเก่งแต่ตัดต่อไม่เก่ง"* — มีฟุตเทจค้างเครื่องเยอะ
เพราะขั้นตอนตัดต่อคือคอขวด

## 2. Pricing (อิงโครงสร้างตลาดจริง: ChatCut $25/$100, Opus $15/$29, Descript ~$16/$24)

ใช้โมเดล **subscription + เครดิต** เพราะต้นทุนผันแปรตามปริมาณ (ถอดเสียง, LLM, render)

| แผน | ราคา/เดือน | เครดิต | ได้อะไร |
|---|---|---|---|
| Free | 0 | 30 | watermark, 720p, จำกัด 10 นาที/โปรเจกต์ — ไว้ให้ลองจน "ว้าว" |
| Creator | $19 | 150 | ไม่มี watermark, 1080p, ซับทุกภาษา |
| Studio | $79 | 700 | 4K, priority render, API access |

นิยามเครดิต (ยึดหลัก 1 เครดิต ≈ วิดีโอต้นทาง 1 นาทีที่ผ่าน pipeline เต็ม):
ถอดเสียง 1 เครดิต/นาที · agent command 1 เครดิต/ครั้ง · render 1080p 1 เครดิต/นาทีผลลัพธ์

ตั้ง Creator ที่ $19 = ใต้ ChatCut ($25) และใต้ Descript Creator ($24) แต่เหนือ Opus
Starter ($15) ซึ่งทำได้อย่างเดียว — เราขาย "editor เต็มตัว + agent" ในราคากลาง

## 3. ต้นทุนผันแปรโดยประมาณ (ต่อวิดีโอต้นทาง 1 ชม.)

| รายการ | ประมาณการ |
|---|---|
| ถอดเสียง (Whisper-class, self-host หรือ API) | $0.2–0.4 |
| Claude API ต่อ agent command (ส่ง transcript ช่วงที่เกี่ยว + คืน operations) | $0.05–0.3 ขึ้นกับความยาว context |
| Render (CPU ffmpeg บน worker) | $0.1–0.3 |
| Storage/egress | $0.05–0.15/เดือน |

จุดคุมต้นทุนสำคัญ: **อย่าส่ง transcript ทั้งไฟล์เข้า LLM ทุกครั้ง** — ใช้ retrieval
เลือกช่วงที่เกี่ยวข้อง + prompt caching ของ Anthropic จะลดต้นทุนได้หลายเท่า

## 4. ทำไม Rust ถึงเป็นข้อได้เปรียบทางธุรกิจ

- งาน media/timeline เป็น CPU-bound — Rust ทำให้ต้นทุน server ต่อผู้ใช้ต่ำกว่า Node/Python อย่างมีนัย
- Core engine เดียว reuse ได้ 3 ช่องทาง: server (axum), desktop (Tauri), และ WASM ใน browser
  → เปิดทาง desktop app แบบ local-first (จุดขาย privacy) โดยไม่เขียนใหม่
- ความถูกต้องของ timeline (ไม่มี frame หลุด/เพี้ยน) พิสูจน์ได้ด้วย type system + tests

## 5. Go-to-market แบบ MVP

1. ปล่อยฟรีให้ community ครีเอเตอร์ไทยก่อน (จุดต่าง: ซับไทย + คำสั่งภาษาไทยแม่น)
2. คลิป demo "ตัดคลิป 20 นาทีเหลือ 2 นาทีด้วยประโยคเดียว" เป็น content การตลาดในตัว
3. Product Hunt + ชุมชน podcaster เมื่อ P1 ครบ

## 6. ความเสี่ยงหลัก

| ความเสี่ยง | การรับมือ |
|---|---|
| คู่แข่งใหญ่ (CapCut/Descript) เพิ่มฟีเจอร์ agent | โฟกัส niche ภาษาไทย/ราคา/local-first ที่รายใหญ่ไม่ลงมาเล่นเร็ว |
| ต้นทุน LLM บานถ้าผู้ใช้สั่งรัว | เครดิตต่อ command + context ตัดเฉพาะช่วงที่เกี่ยว |
| งาน media pipeline ซับซ้อนกว่าที่คิด | MVP ยึด ffmpeg ที่พิสูจน์แล้ว ไม่เขียน codec เอง |
