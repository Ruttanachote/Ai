# promptcut-web

Frontend ของ PromptCut — Vue 3 + TypeScript + Vite ตาม UX ใน `docs/03-uxui.md`:
แชทสั่งตัดฝั่งซ้าย, preview กลาง, transcript ขวา, timeline ด้านล่าง
ทุกคำสั่ง AI กลับมาเป็น proposal ให้กด Apply/Reject ก่อนเสมอ

## รัน dev

```bash
# terminal 1 — backend
cargo run -p promptcut-server

# terminal 2 — frontend (proxy /api ไปที่ :8080 ให้อัตโนมัติ)
cd web && npm install && npm run dev
```

เปิด http://localhost:5173 → สร้างโปรเจกต์ → กด "โหลดคลิปตัวอย่าง" →
ลองพิมพ์ "ตัดช่วงเงียบและคำฟุ่มเฟือยออก"

## โครงสร้าง

- `src/api.ts` — typed client คุยกับ promptcut-server
- `src/types.ts` — mirror ของ JSON จากฝั่ง Rust
- `src/views/` — ProjectsView (รายการโปรเจกต์), EditorView (จอตัดต่อหลัก)
- `src/components/` — ChatPanel, ProposalCard, TranscriptPanel, TimelineBar

## Build

```bash
npm run build   # vue-tsc typecheck + vite build → dist/
```
