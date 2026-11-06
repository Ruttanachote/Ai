# ตั้งค่า Microsoft 365 สำหรับ SalesFlow (P0-6 least privilege)

ทำครั้งเดียวต่อ tenant โดย Global Admin / Exchange Admin / SharePoint Admin
ตรวจทุกขั้นกับเอกสาร Microsoft ล่าสุดก่อนรันจริง — คำสั่งด้านล่างยังไม่ได้รันกับ tenant จริง

## 1. App registrations (แยก 2 ตัว)

| | **SalesFlow Web** | **SalesFlow Worker** |
|---|---|---|
| ใช้ทำ | SPA + API: SSO, App Roles, OBO ไป Graph แทนผู้ใช้ | งานเบื้องหลัง: SharePoint, ส่งอีเมล, delta/webhook |
| Credential | Certificate (สำหรับ OBO client assertion) | Certificate เท่านั้น — ไม่ใช้ client secret |
| Graph (Delegated) | `User.Read`, `Files.ReadWrite` (อ่าน Workbook ของ SM), `Calendars.ReadWrite` (นัด Handover ในนามของ PMO) | — |
| Graph (Application) | — | `Sites.Selected`, `Mail.Send` (จำกัดด้วย RBAC ข้อ 3) |
| App Roles | `SalesFlow.SM`, `.Head`, `.Exec`, `.PMO`, `.PM`, `.MA`, `.Admin` | — |
| Expose an API | `api://<web-client-id>/access_as_user` | — |

ห้ามให้ permission แบบ `*.All` กับ Worker (เช่น `Sites.ReadWrite.All`, `Mail.Send` ที่ไม่ได้จำกัดขอบเขต)

App Roles: assign ให้ผู้ใช้หรือกลุ่มใน Enterprise applications → SalesFlow Web → Users and groups
(การ assign ด้วยกลุ่มต้องใช้ Entra ID P1/P2 และไม่รองรับ nested group)

## 2. SharePoint: Sites.Selected บนไซต์ "Stream Projects" ไซต์เดียว

ดู `grant-sites-selected.ps1` — การ grant ต้องใช้ตัวตนที่มี `Sites.FullControl.All` ชั่วคราว (admin)
ตั้ง role เป็น `write` ไม่ใช่ `fullcontrol`

## 3. Exchange: Mail.Send ได้เฉพาะ salesflow@

ดู `exchange-rbac-mailsend.ps1` — ใช้ **RBAC for Applications** (มาแทน Application Access Policy)
อย่า grant `Mail.Send` แบบ tenant-wide ใน Entra; ให้ assign role "Application Mail.Send" ผ่าน Exchange
พร้อม management scope ที่มีแค่ mailbox `salesflow@` แล้วตรวจด้วย `Test-ServicePrincipalAuthorization`

## 4. Teams

- นัดประชุม Handover: Web app สร้าง calendar event (`isOnlineMeeting=true`) ด้วย delegated token ของ PMO → ไม่ต้องตั้ง Application Access Policy ของ Teams
- แจ้งเตือนช่องทีม DT: ใน Teams แต่ละช่อง สร้าง Workflow "Post to a channel when a webhook request is received" แล้วนำ URL ไปใส่ใน Settings → ช่องทางแจ้งเตือน
  (Office 365 Connectors / Incoming Webhook ถูกยกเลิกในปี 2026 และ `ChannelMessage.Send` แบบ app-only ใช้ได้เฉพาะงาน migration)

## 5. Graph change notifications

- subscription บน drive root ของไซต์ (`/drives/{id}/root`), changeType `updated`, `clientState` = ค่า `GRAPH_CLIENT_STATE`
- อายุสูงสุดประมาณ 30 วัน (42,300 นาที) → worker ต่ออายุทุก 7 วัน และรัน `delta` ทุก 15 นาทีเผื่อ webhook หลุด
- ยังต้องทดสอบว่า webhook ทำงานกับ token ที่มีแค่ `Sites.Selected` (ยังไม่ยืนยัน — ดูหัวข้อสุดท้ายของรายงาน)

## ตัวแปรสภาพแวดล้อมของ API

| ตัวแปร | ตัวอย่าง |
|---|---|
| `TENANT_ID` | `00000000-0000-0000-0000-000000000000` |
| `API_AUDIENCE` | `api://<web-client-id>` |
| `GRAPH_CLIENT_STATE` | ค่าสุ่มยาว ≥ 32 ตัวอักษร (เก็บใน secret store) |
| `PO_TOLERANCE_PCT` | `2` — มูลค่า PO ต่างจากที่อนุมัติได้ไม่เกิน ±2% |
| `GP_DROP_PCT` | `3` — GP ลดลงได้ไม่เกิน 3 จุด |
