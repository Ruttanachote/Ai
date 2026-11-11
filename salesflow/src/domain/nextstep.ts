// "What do I still need before the next status?" — the same conditions as requirementsFor()
// (rules.ts), but as a checklist where every item says where to go to fix it.
import { HANDOVER_PARTIES, type Project, type StageKey } from '../data/model.ts'
import { appealWindowEnd, isTender, validApproval } from './rules.ts'

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
    // Same conditions as closeWinRule(): tender deals also need e-GP, the winner announcement and the appeal window.
    if (isTender(p)) {
      add('egp', 'บันทึกเลขโครงการ e-GP', !!p.bid?.egpNo, 'จากประกาศบน e-GP', { kind: 'tab', tab: 'proc' }, 'บันทึกเลข e-GP')
      add('result', 'บันทึกวันประกาศผู้ชนะ', !!p.bid?.result, 'วันที่ e-GP ประกาศว่าเราชนะ', { kind: 'tab', tab: 'proc' }, 'บันทึกผลประกาศ')
      const end = appealWindowEnd(p)
      add('appeal', 'พ้นระยะอุทธรณ์ 7 วันทำการ', !!end && today > end, end ? `ครบกำหนด ${end} — ย้ายได้หลังวันนี้` : 'นับจากวันประกาศผู้ชนะ', { kind: 'tab', tab: 'proc' }, 'ดูกำหนดอุทธรณ์')
    }
    add('contract', 'อัปโหลดสัญญาหรือ PO ที่ลงนาม', has('contract') || has('official-po'), 'โฟลเดอร์ Contract หรือ Official PO', { kind: 'folder', folder: has('contract') ? 'official-po' : 'contract' }, 'อัปโหลดเอกสาร')
  }
  if (to === 'delivery') {
    // Same conditions as handoverGate(): checklist, PM, meeting attendees, contract terms, performance bond.
    const att = p.handover?.attendees ?? []
    const missing = HANDOVER_PARTIES.filter((x) => !att.some((a) => a.party === x.k && a.who && a.attended))
    add('pm', 'มอบหมาย PM', !!p.pm, 'PMO เลือก PM ตามทักษะที่โครงการต้องการ', { kind: 'tab', tab: 'delivery' }, 'เลือก PM')
    add('meeting', 'ประชุม Handover ครบทุกฝ่าย', !missing.length, missing.length ? 'ยังขาด: ' + missing.map((x) => x.label).join(', ') : 'บันทึกผู้เข้าประชุมแล้ว', { kind: 'tab', tab: 'delivery' }, 'บันทึกการประชุม')
    add('checklist', 'Checklist Handover ครบ', !!p.handoverDone, 'ติ๊กทุกข้อในแท็บ Handover', { kind: 'tab', tab: 'delivery' }, 'เปิด Checklist')
    add('terms', 'กรอกเงื่อนไขสัญญา', !!p.terms && p.terms.penaltyRatePerDay > 0 && p.terms.penaltyRatePerDay <= 0.002 && p.terms.warrantyMonths > 0, 'อัตราค่าปรับ (0.01–0.20%/วัน) และระยะรับประกัน', { kind: 'tab', tab: 'delivery' }, 'กรอกเงื่อนไข')
    if (isTender(p)) add('bond', 'บันทึกหลักประกันสัญญา', (p.bonds ?? []).some((b) => b.kind === 'performance'), 'งานภาครัฐต้องวางหลักประกันสัญญา', { kind: 'tab', tab: 'proc' }, 'เพิ่มหลักประกัน')
  }
  return out
}
