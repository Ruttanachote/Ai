# PromptCut — AI Video Editing Agent (Rust)

> ตัดต่อวิดีโอด้วยการพิมพ์สั่ง — AI agent อ่าน transcript ของฟุตเทจ แล้วแปลงคำสั่งภาษาคน
> ให้เป็นการแก้ไข timeline จริง (cut / trim / reorder / caption) โดยผู้ใช้ยังควบคุม
> timeline ได้เต็มรูปแบบ ไม่ใช่ AI กล่องดำ

สถานะ: **MVP scaffold** — โครง production-grade พร้อมต่อยอด

## แนวคิดหลัก (จากการศึกษา ChatCut, Descript, Opus Clip)

1. ผู้ใช้อัปโหลดวิดีโอ → ระบบถอดเสียงเป็น transcript ที่ผูกเวลา (word-level timestamps)
2. ผู้ใช้พิมพ์สั่งในแชท เช่น *"ตัดช่วงเงียบกับคำว่า เอ่อ ออก แล้วทำ rough cut 3 นาที"*
3. AI agent (Claude API) แปลงคำสั่ง + transcript → **โครงสร้าง EditOperation ที่ตรวจสอบได้**
4. Engine ฝั่ง Rust apply operations ลง timeline → ผู้ใช้เห็นผลทันที แก้มือต่อได้
5. กด render → ffmpeg ตัดต่อจริงแบบ non-destructive

## โครงสร้าง Workspace

| Crate | หน้าที่ |
|---|---|
| `promptcut-core` | Domain model: Project, Timeline, Track, Clip, Transcript, EditOperation + engine apply/undo |
| `promptcut-ai` | Claude API client + agent แปลงภาษาคนเป็น EditOperation (structured tool use) |
| `promptcut-media` | ffmpeg wrapper: probe, cut, concat, burn captions (สร้าง args แบบ testable) |
| `promptcut-server` | Axum HTTP API: projects, assets, chat-to-edit, render jobs |

Frontend อยู่ที่ [`web/`](web/) — Vue 3 + TypeScript + Vite (layout 3 แผง + timeline
ตาม docs/03-uxui.md, proposal card แบบ Apply/Reject)

## เอกสาร

- [docs/01-mvp-features.md](docs/01-mvp-features.md) — วิเคราะห์ฟีเจอร์ MVP (จากการศึกษาตลาดจริง)
- [docs/02-business-model.md](docs/02-business-model.md) — Business model, pricing, ต้นทุน AI
- [docs/03-uxui.md](docs/03-uxui.md) — UX/UI design, user flows, screen map
- [docs/04-architecture.md](docs/04-architecture.md) — สถาปัตยกรรมระบบ + roadmap ทางเทคนิค

## เริ่มใช้งาน (dev)

```bash
cp .env.example .env          # ใส่ ANTHROPIC_API_KEY
cargo test                    # unit tests ทุก crate
cargo run -p promptcut-server # เปิด API ที่ :8080

cd web && npm install && npm run dev   # เปิด UI ที่ :5173 (proxy /api ให้แล้ว)
```

ต้องมี `ffmpeg` ใน PATH สำหรับงาน media จริง (ส่วนอื่นทดสอบได้โดยไม่ต้องมี)

## ตัวอย่าง API

```bash
curl -s localhost:8080/api/health
curl -s -X POST localhost:8080/api/projects -H 'content-type: application/json' \
  -d '{"name":"my first cut"}'
curl -s -X POST localhost:8080/api/projects/<id>/chat -H 'content-type: application/json' \
  -d '{"message":"ตัดช่วงเงียบออกและเก็บไฮไลต์ 60 วินาที"}'
```
