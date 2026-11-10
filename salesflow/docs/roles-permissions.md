# Role และสิทธิ์ (ปรับ 10 พ.ย. 2569)

หลักการ: แต่ละบทบาทเห็นเฉพาะเมนูที่ใช้ทำงานจริง เมนูที่ไม่เกี่ยวข้องถูกตัดออก และเข้าผ่านลิงก์ตรงไม่ได้ (ระบบพากลับหน้าแรกของบทบาท)
ทุกบทบาทยังเปิดหน้าโครงการจากลิงก์ได้ ยกเว้นทีมพัฒนาที่ไม่เห็นราคาและต้นทุน

| บทบาท | หน้าแรก | เมนูที่เห็น | ทำอะไรได้ (สรุป) |
|---|---|---|---|
| **SM (Pre-sale)** | Sales Dashboard | My Tasks · Calendar · Project Register · Customer Accounts · Sales Dashboard · Sales Pipeline · Opportunity Registration · Solution Catalog | ลงทะเบียนโอกาสขาย · Requirement / TOR · Cost Sheet และขออนุมัติ (บันทึกประชุมก่อนส่ง) · ย้ายสถานะถึง Close Win · แจ้งทีมพัฒนาและขอ PM · ตั้งรอบ PM ตอนขาย |
| **หัวหน้ากลุ่ม / หัวหน้าทีม Dev** | Sales Dashboard | My Tasks · Approval Requests · Calendar · My Performance · Project Register · Customer Accounts · Sales Dashboard · Sales Pipeline · Solution Catalog · Project Overview · Project Workspace · Resource Workload | ตรวจ TOR Final · ดูยอดกลุ่ม · จัดคนตามคำขอ PM · เปิดโครงการใหม่จากงานที่แพ้ · ยกเลิกหลังชนะ · ดูผลงานทีม |
| **รองผู้บริหาร DT** | Mail Inbox | Executive Dashboard · Project Status Tracker · Mail Inbox · Calendar · Project Register | อนุมัติราคาขั้นแรก · ดูทุกทีมและสถานะโครงการ (ไม่ย้ายสถานะเอง) |
| **ผู้บริหาร DT** | Executive Dashboard | เหมือนรองผู้บริหาร | อนุมัติราคาขั้นสุดท้าย · ดูทุกทีมเทียบเป้า |
| **PMO (DT3-3)** | Project Overview | My Tasks · Calendar · My Performance · Project Register · Project Overview · Project Workspace · Resource Workload | เลือก PM ตามความถนัด · ประชุม Handover · ดูแลความถนัดของ PM · ติดตามทุกโครงการที่ส่งมอบ |
| **OPN (DT3-2)** | Purchase Requisitions | My Tasks · Calendar · Project Register · Purchase Requisitions · Bank Guarantees | อนุมัติเบิกจ่าย · หลักประกัน · วางบิลหลังตรวจรับ |
| **Project Manager** | Project Workspace | My Tasks · Calendar · My Performance · Project Register · Project Overview · Project Workspace · Resource Workload · Purchase Requisitions | วางแผน งวดงาน Risk Stakeholder · ขอคน · อนุมัติ OT ในเงินกัน · ขอซื้อ · ส่งต่อ MA |
| **ทีมพัฒนา** | My Tasks | My Tasks · Calendar · My Performance · Project Workspace | ทำงานบนบอร์ด · บันทึกเวลา/OT · แจ้งลา · เตรียมรายงาน PM (ไม่เห็นราคา) |
| **ทีม MA** | Warranty & Maintenance | My Tasks · Calendar · Project Register · Customer Accounts · Warranty & Maintenance · Service Desk | รับมอบเข้าประกัน · ส่งรายงาน PM จากกล่องกลาง · แจ้งต่อประกัน · ใบเสนอราคาต่อ MA · Ticket |
| **Call center** | Service Desk | My Tasks · Calendar · Service Desk | รับเคสและติดตาม SLA |
| **ผู้ดูแลระบบ** | System Settings | ทุกเมนู | ตั้งค่า ผู้ใช้ สิทธิ์ ทีม · Audit log |

## สิ่งที่ตัดออกในรอบนี้
| บทบาท | ตัดออก | เหตุผล |
|---|---|---|
| SM | Warranty & Maintenance | ช่วงประกันเป็นงานของทีม MA — SM ตั้งรอบ PM ในหน้าโครงการตอนขาย |
| หัวหน้ากลุ่ม | Opportunity Registration · Warranty & Maintenance · Bank Guarantees · ส่ง Cost Sheet ขออนุมัติ · มอบหมาย PM · แก้รอบ PM · แก้ข้อมูลประมูล | SM ลงทะเบียนและทำราคา · PMO เลือก PM · OPN ดูหลักประกัน · MA ดูแลประกัน |
| รองผู้บริหาร / ผู้บริหาร | ย้ายสถานะโครงการ · เปิดโครงการใหม่จากงานที่แพ้ | ผู้บริหารอนุมัติและติดตาม ไม่ลงมือเปลี่ยนสถานะเอง |
| PMO | Customer Accounts · Solution Catalog · Warranty & Maintenance · Bank Guarantees · Executive (Tracker) | ไม่ใช่งานของ PMO |
| Call center | Project Register | ไม่ต้องเห็นมูลค่าโครงการ — ข้อมูลประกันอยู่ใน Ticket แล้ว |
