# Stream SalesFlow — ต้นแบบระบบบริหารโครงการขาย ส่งมอบ และ MA

ต้นแบบหน้าจอ (Vue 3 + TypeScript + Vite) พร้อมข้อมูลตัวอย่าง สำหรับติดตามโครงการของทีม DT
ตั้งแต่ Opportunity → Close Win → Delivery → Warranty → ต่อ MA

```bash
cd salesflow
npm install
npm run dev        # http://localhost:5173
npm run build
```

หน้า Login มีช่อง “บทบาทสำหรับเดโม” และแถบบนมีตัวสลับบทบาท เพื่อดูว่าแต่ละตำแหน่งเห็นโมดูลอะไร
(ในระบบจริงบทบาทมาจาก App Roles ของ Microsoft Entra ID)

| บทบาท | หน้าแรก | ลองดู |
|---|---|---|
| Solution Manager | ภาพรวมยอดขาย | `#/projects/p2` → แท็บ Cost Sheet และใบเสนอราคา |
| หัวหน้ากลุ่ม DT | รออนุมัติราคา | SOC as a Service (`#/projects/p11`) → เปิดโครงการใหม่จากดีลที่แพ้ |
| ผู้บริหาร | ภาพรวมยอดขาย | อนุมัติ v3 ของโครงการ e-Service |
| PMO | Portfolio | Handover ของ AI Document OCR (`#/projects/p7`) |
| Project Manager | Portfolio | Smart Permit → แผนงาน Task ความเสี่ยง, Workload ทีม |
| MA / Support | ประกันและ MA | ระบบจองคิว (`#/projects/p8`) → ต่อ MA |
| ผู้ดูแลระบบ | สิทธิ์และการตั้งค่า | ตารางสิทธิ์ ลำดับอนุมัติ Microsoft 365 |

## Server (Microsoft 365 integration)

```bash
npm test                 # 31 tests: กฎธุรกิจ, Graph client, Cost Sheet, อนุมัติ, PDF, outbox, token
npm run typecheck:server
TENANT_ID=… API_AUDIENCE=api://… GRAPH_CLIENT_STATE=… npm run api
```

ต้องใช้ Node 22.18 ขึ้นไป (รัน TypeScript ได้โดยตรง) · สร้าง PDF ต้องมี Playwright + Chromium บนเครื่อง worker
กฎธุรกิจอยู่ที่ `src/domain/` ใช้ร่วมกันทั้งหน้าเว็บและ server · ขั้นตอนตั้งค่า tenant อยู่ที่ `server/infra/README.md`

ภาพประกอบโหลดจาก Unsplash (images.unsplash.com) ถ้าเครือข่ายบล็อก จะแสดงพื้นสีเข้มแทน

เอกสารวิเคราะห์ระบบ: [docs/system-analysis.md](docs/system-analysis.md)
