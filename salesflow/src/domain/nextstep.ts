// "What do I still need before the next status?" — the same conditions as requirementsFor()
// (rules.ts), but as a checklist where every item says where to go to fix it.
import type { Project, StageKey } from '../data/model.ts'
import { isTender, validApproval } from './rules.ts'

export type Fix =
  | { kind: 'edit'; field: 'customer' | 'team' | 'sales' | 'expectedClose' | 'bidMethod' }
  | { kind: 'tab'; tab: 'req' | 'cost' | 'proc' | 'delivery'; folder?: string }
  | { kind: 'folder'; folder: string }
export interface CheckItem { id: string; label: string; ok: boolean; hint: string; fix: Fix; doLabel: string }

const ORDER: StageKey[] = ['opportunity', 'pipeline', 'forecast', 'rebidding', 'win']
const atLeast = (to: StageKey, k: StageKey) => ORDER.indexOf(to) >= ORDER.indexOf(k) && ORDER.indexOf(to) >= 0

export function stageChecklist(p: Project, to: StageKey, today: string): CheckItem[] {
  const out: CheckItem[] = []
  const add = (id: string, label: string, ok: boolean, hint: string, fix: Fix, doLabel: string) => out.push({ id, label, ok, hint, fix, doLabel })
  if (atLeast(to, 'pipeline')) {
    add('customer', 'เลือกลูกค้าจากทะเบียนลูกค้า', !!p.customerAccountId, 'ลูกค้าและหน่วยงานผู้ใช้ (End User)', { kind: 'edit', field: 'customer' }, 'เลือกลูกค้า')
    add('team', 'ระบุทีม DT (Profit Center)', !!p.team, 'ทีมที่ได้ยอดขาย', { kind: 'edit', field: 'team' }, 'เลือกทีม')
    add('sales', 'ระบุ Sale ที่ทำงานคู่กับ SM', !!p.sales?.length, 'อย่างน้อย 1 คน (Sale ไม่ได้ใช้ระบบ)', { kind: 'edit', field: 'sales' }, 'ใส่ชื่อ Sale')
  }
  if (atLeast(to, 'forecast')) {
    add('approval', 'Cost Sheet + Quotation อนุมัติครบ', !!validApproval(p, today), p.approval?.status === 'pending' ? 'อยู่ระหว่างอนุมัติ' : 'สร้าง Cost Sheet → Quotation → Send to Approve', { kind: 'tab', tab: 'cost' }, p.approval?.status === 'pending' ? 'ดูสถานะอนุมัติ' : 'ไปทำ Cost Sheet')
    add('expected', 'กำหนด Expected Close', !!p.expectedClose, 'วันที่คาดว่าจะปิดการขาย', { kind: 'edit', field: 'expectedClose' }, 'กำหนดวันที่')
    if (p.type !== 'MA') {
      add('tor', 'แนบ TOR Final', !!p.salesDocs?.tor, 'อัปโหลดในแท็บ Requirement และ TOR', { kind: 'tab', tab: 'req' }, 'แนบ TOR')
      add('torReview', 'หัวหน้ากลุ่มตรวจ TOR Final ผ่าน', p.torReview?.status === 'approved', p.torReview?.status === 'pending' ? 'รอหัวหน้ากลุ่มตรวจ' : p.torReview?.status === 'returned' ? 'ถูกส่งกลับ — แก้แล้วส่งตรวจใหม่' : 'กดส่งตรวจหลังแนบ TOR', { kind: 'tab', tab: 'req' }, p.torReview?.status === 'pending' ? 'ดูสถานะ TOR' : 'ส่งตรวจ TOR')
      add('proposal', 'มี Proposal', !!p.salesDocs?.proposal, 'สร้างจาก Template หรืออัปโหลด', { kind: 'tab', tab: 'req' }, 'สร้าง Proposal')
    }
    if (isTender(p)) add('bidMethod', 'ระบุวิธีจัดซื้อจัดจ้าง', !!p.bid?.method, 'e-bidding / เฉพาะเจาะจง / คัดเลือก', { kind: 'tab', tab: 'proc' }, 'ระบุวิธีจัดซื้อ')
  }
  if (to === 'rebidding' && isTender(p)) {
    add('egp', 'บันทึกเลขโครงการ e-GP', !!p.bid?.egpNo, 'จากประกาศบน e-GP', { kind: 'tab', tab: 'proc' }, 'บันทึกเลข e-GP')
    add('refPrice', 'บันทึกราคากลาง', !!p.bid?.refPrice, 'ราคากลางจากประกาศ', { kind: 'tab', tab: 'proc' }, 'บันทึกราคากลาง')
  }
  if (to === 'win') {
    const has = (f: string) => (p.documents ?? []).some((d) => d.folder === f && !d.deletedAt)
    add('contract', 'อัปโหลดสัญญาหรือ PO ที่ลงนาม', has('contract') || has('official-po'), 'โฟลเดอร์ Contract หรือ Official PO', { kind: 'folder', folder: has('contract') ? 'official-po' : 'contract' }, 'อัปโหลดเอกสาร')
  }
  return out
}
