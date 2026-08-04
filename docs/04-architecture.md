# 04 — Architecture

## 1. ภาพรวม

```
 Browser / Desktop (Tauri, ภายหลัง)
        │  HTTPS + WebSocket (สตรีมสถานะ agent/render)
        ▼
 ┌─────────────────────────── promptcut-server (axum) ───────────────────────────┐
 │  REST API: projects / assets / chat / render jobs                             │
 │  AuthN/Z (ภายหลัง), rate limit, credit metering                               │
 └──────┬──────────────────────┬──────────────────────────┬─────────────────────┘
        │                      │                          │
        ▼                      ▼                          ▼
 promptcut-core         promptcut-ai                promptcut-media
 (timeline engine,      (Claude API client,         (ffmpeg: probe, cut,
  EditOperation,         NL → EditOperations         concat, subtitles,
  undo/redo, validate)   via structured tool use)    render jobs)
```

- **core ไม่พึ่ง I/O ใด ๆ** — pure logic ทดสอบง่าย, คอมไพล์เป็น WASM ได้ในอนาคต
- **AI ไม่แตะไฟล์** — ผลลัพธ์จาก Claude เป็น JSON `EditOperation[]` ที่ core validate
  ก่อน apply เสมอ (ผิด schema/เกินขอบเขตเวลา = reject)
- **Media แยกขาด** — สร้าง ffmpeg args เป็น pure function (unit test ได้โดยไม่ต้องมี ffmpeg)
  แล้วค่อย spawn process จริงตอนรัน

## 2. Data model หลัก (promptcut-core)

```
Project ── assets: Vec<MediaAsset>      (ไฟล์ต้นฉบับ + duration + transcript)
        ── timeline: Timeline
             └─ tracks: Vec<Track>      (Video / Audio / Caption)
                  └─ clips: Vec<Clip>   (asset_id + source in/out + ตำแหน่งบน timeline)
        ── history: Vec<AppliedEdit>    (undo/redo + audit ว่า AI ทำอะไร)

Transcript ── segments: Vec<TranscriptSegment>  (text, start, end, speaker, is_filler)

EditOperation (สิ่งที่ agent คืนมา — ตรวจสอบได้ 100%):
  RemoveRanges { ranges }            ตัดช่วงเวลาออกจาก timeline
  KeepOnlyRanges { ranges }          rough cut / highlight
  SplitClip { at }                   แบ่งคลิป
  ReorderClips { track, order }      เรียงใหม่
  SetCaptions { language, segments } วางซับ
```

## 3. Agent loop (promptcut-ai)

1. Server รับข้อความแชท → ประกอบ context: metadata ของโปรเจกต์ + transcript
   (เฉพาะช่วงที่เกี่ยวข้อง เพื่อคุมต้นทุน token)
2. เรียก Anthropic Messages API (model จาก config เช่น `claude-sonnet-5`)
   พร้อม **tool definition `propose_edits`** — บังคับให้คำตอบเป็น JSON ตาม schema
3. Parse → validate กับสถานะ timeline จริง → คืน **proposal** ให้ผู้ใช้ Apply/Reject
4. Apply = core บันทึกลง history (undo ได้) — ไม่มีการแก้ไฟล์จนกว่าจะ render

## 4. Render pipeline (promptcut-media)

1. แปลง Timeline → cut list ต่อ asset
2. ffmpeg: ตัด segment (stream copy เมื่อทำได้ / re-encode เมื่อจำเป็น) → concat → burn captions (ass/srt)
3. งานเข้า job queue (MVP: in-process task + สถานะใน memory; production: แยก worker + object storage)

## 5. เส้นทางสู่ production

| ด้าน | MVP ตอนนี้ | Production ถัดไป |
|---|---|---|
| เก็บข้อมูล | in-memory (RwLock<HashMap>) | Postgres + sqlx, object storage (S3) |
| ถอดเสียง | trait `Transcriber` + mock | whisper.cpp local หรือ API |
| งาน render | tokio task ในโปรเซส | worker แยก + queue (NATS/Redis) |
| Auth/credit | ยังไม่มี | JWT + credit ledger ต่อ operation |
| สังเกตการณ์ | tracing → stdout | OTLP + dashboards, error tracking |
| Frontend | ยังไม่มีใน repo นี้ | Web (TS) หรือ Tauri ใช้ API เดียวกัน |

Trait ทุกจุด I/O (`Transcriber`, `EditAgent`, `MediaEngine`) ถูกออกแบบให้สลับ
implementation ได้โดยไม่แตะ core — เป็นเส้นแบ่งที่ทำให้อัปเกรดทีละส่วนได้จริง

## 6. Security & cost guardrails

- API key อยู่ใน env เท่านั้น (`.env.example` ให้โครง) — ไม่มี secret ใน repo
- ทุก EditOperation ถูก clamp กับ duration จริงของ asset กัน agent ชี้เวลาเกินไฟล์
- จำกัดขนาด context ต่อ agent call + นับ token usage ต่อ command เพื่อผูกกับระบบเครดิต
