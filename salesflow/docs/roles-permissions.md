# Role และสิทธิ์ (ปรับ 10 พ.ย. 2569)

หลักการ: แต่ละบทบาทเห็นเฉพาะเมนูที่ใช้ทำงานจริง เมนูที่ไม่เกี่ยวข้องถูกตัดออก และเข้าผ่านลิงก์ตรงไม่ได้ (ระบบพากลับหน้าแรกของบทบาท)
ทุกบทบาทยังเปิดหน้าโครงการจากลิงก์ได้ ยกเว้นทีมพัฒนาที่ไม่เห็นราคาและต้นทุน

| บทบาท | หน้าแรก | เมนูที่เห็น | ทำอะไรได้ (สรุป) |
|---|---|---|---|
| **SM (Pre-sale)** | SM Dashboard | SM Dashboard · Project Overview (รายการ · Pipeline · ลงทะเบียนโครงการใหม่) · Solution Catalog · Calendar · Customer Accounts | ตั้งเป้ายอดขายปีของตัวเอง · เห็นเฉพาะโครงการของตัวเอง (ไม่เห็นเป้าและยอดของทีมอื่น) · ลงทะเบียนโครงการใหม่ (เริ่ม Opportunity) · Requirement / TOR · Cost Sheet และขออนุมัติ (บันทึกประชุมก่อนส่ง) · ย้ายสถานะถึง Close Win · แจ้งทีมพัฒนาและขอ PM · ตั้งรอบ PM ตอนขาย |
| **หัวหน้ากลุ่ม / หัวหน้าทีม Dev** | SM Dashboard | SM Dashboard · Project Overview (รายการ · Pipeline) · Solution Catalog · My Tasks · Approval Requests · Calendar · My Performance · Customer Accounts · Delivery Overview · Project Workspace · Resource Workload | ตรวจ TOR Final · ดูยอดกลุ่ม · จัดคนตามคำขอ PM · เปิดโครงการใหม่จากงานที่แพ้ · ยกเลิกหลังชนะ · ดูผลงานทีม |
| **รองผู้บริหาร DT** | Mail Inbox | Executive Dashboard · Project Status Tracker · Mail Inbox · Calendar · Project Overview | อนุมัติราคาขั้นแรก · ดูทุกทีมและสถานะโครงการ (ไม่ย้ายสถานะเอง) |
| **ผู้บริหาร DT** | Executive Dashboard | เหมือนรองผู้บริหาร | อนุมัติราคาขั้นสุดท้าย · ดูทุกทีมเทียบเป้า |
| **PMO (DT3-3)** | Delivery Overview | My Tasks · Calendar · My Performance · Project Overview · Delivery Overview · Project Workspace · Resource Workload | เลือก PM ตามความถนัด · ประชุม Handover · ดูแลความถนัดของ PM · ติดตามทุกโครงการที่ส่งมอบ |
| **OPN (DT3-2)** | Purchase Requisitions | My Tasks · Calendar · Project Overview · Purchase Requisitions · Bank Guarantees | อนุมัติเบิกจ่าย · หลักประกัน · วางบิลหลังตรวจรับ |
| **Project Manager** | Project Workspace | My Tasks · Calendar · My Performance · Project Overview · Delivery Overview · Project Workspace · Resource Workload · Purchase Requisitions | วางแผน งวดงาน Risk Stakeholder · ขอคน · อนุมัติ OT ในเงินกัน · ขอซื้อ · ส่งต่อ MA |
| **ทีมพัฒนา** | My Tasks | My Tasks · Calendar · My Performance · Project Workspace | ทำงานบนบอร์ด · บันทึกเวลา/OT · แจ้งลา · เตรียมรายงาน PM (ไม่เห็นราคา) |
| **ทีม MA** | Warranty & Maintenance | My Tasks · Calendar · Project Overview · Customer Accounts · Warranty & Maintenance · Service Desk | รับมอบเข้าประกัน · ส่งรายงาน PM จากกล่องกลาง · แจ้งต่อประกัน · ใบเสนอราคาต่อ MA · Ticket |
| **Call center** | Service Desk | My Tasks · Calendar · Service Desk | รับเคสและติดตาม SLA |
| **ผู้ดูแลระบบ** | System Settings | ทุกเมนู | ตั้งค่า ผู้ใช้ สิทธิ์ · จัดการทีมและทีมย่อย (เพิ่ม แก้ไข ดูรายละเอียด ประวัติ ปิดใช้งาน) · Audit log |

## สิ่งที่ตัดออกในรอบนี้
| บทบาท | ตัดออก | เหตุผล |
|---|---|---|
| SM | My Tasks · Warranty & Maintenance | SM ไม่มีงานบนบอร์ดพัฒนา (ตัด My Tasks ตามที่ยืนยัน) · ช่วงประกันเป็นงานของทีม MA — SM ตั้งรอบ PM ในหน้าโครงการตอนขาย |
| หัวหน้ากลุ่ม | Opportunity Registration · Warranty & Maintenance · Bank Guarantees · ส่ง Cost Sheet ขออนุมัติ · มอบหมาย PM · แก้รอบ PM · แก้ข้อมูลประมูล | SM ลงทะเบียนและทำราคา · PMO เลือก PM · OPN ดูหลักประกัน · MA ดูแลประกัน |
| รองผู้บริหาร / ผู้บริหาร | ย้ายสถานะโครงการ · เปิดโครงการใหม่จากงานที่แพ้ | ผู้บริหารอนุมัติและติดตาม ไม่ลงมือเปลี่ยนสถานะเอง |
| PMO | Customer Accounts · Solution Catalog · Warranty & Maintenance · Bank Guarantees · Executive (Tracker) | ไม่ใช่งานของ PMO |
| Call center | Project Overview | ไม่ต้องเห็นมูลค่าโครงการ — ข้อมูลประกันอยู่ใน Ticket แล้ว |

## โปรไฟล์และลายเซ็นอิเล็กทรอนิกส์
- ทุก Role มีหน้า **My Profile** (เมนูชื่อมุมขวาบน): ข้อมูลจาก Entra ID · เบอร์โทร · การแจ้งเตือน · เมนูที่ใช้ได้
- **SM, รองผู้บริหาร, ผู้บริหาร DT** (และหัวหน้ากลุ่ม, ทีม MA ที่ส่งใบเสนอราคาต่อ MA) สร้างลายเซ็นได้ ด้วยการลากเซ็นหรือพิมพ์ชื่อ
- ลายเซ็นแนบกับ **Send to Approve** (ผู้ส่ง) และ **Approve** (ผู้อนุมัติ) พร้อมเวลาที่ลงนาม — ต้องติ๊กยืนยันทุกครั้ง · Reject ไม่ต้องเซ็น
- ระบบจริง: เก็บลายเซ็นแบบเข้ารหัส ผูกกับบัญชี Microsoft 365 และบันทึก Hash ของเอกสารที่ลงนามใน Audit log
