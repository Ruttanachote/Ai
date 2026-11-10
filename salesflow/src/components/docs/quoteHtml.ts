// Printable Quotation (company form: red / white / grey). Rendered into an iframe for the PDF
// preview; the server renders the same HTML to PDF in production.
import type { Project, Quotation } from '../../data/model'
import { account, person } from '../../data/mock'
import { bahtText } from '../../domain/quotation'
import { quoteTotals } from '../../domain/salesdocs'

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const m = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const th = (iso: string) => (iso ? new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '—')

export function quoteHtml(p: Project, q: Quotation, contactName: string): string {
  const t = quoteTotals(q)
  const cust = account(p.customerAccountId)
  const lines = q.items.map((i, k) => {
    const [head, ...bullets] = i.description.split('\n')
    return `<tr><td class="c">${k + 1}</td><td><b>${esc(head)}</b>${bullets.filter(Boolean).map((b) => `<div class="b">• ${esc(b.replace(/^[-•]\s*/, ''))}</div>`).join('')}</td><td class="r">${i.qty.toLocaleString('en-US')}</td><td class="c">${esc(i.unit)}</td><td class="r">${m(i.unitPrice)}</td><td class="r">${m(i.qty * i.unitPrice)}</td></tr>`
  }).join('')
  const terms = q.terms.map((x) => `<tr><td class="c">${x.no}</td><td class="r">${x.pct}%</td><td>${esc(x.condition)}</td><td class="r">${m((t.subtotal * x.pct) / 100)}</td></tr>`).join('')
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${esc(q.docNo)} rev.${q.revision}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:14mm}body{font-family:Sarabun,sans-serif;color:#222;font-size:13px;margin:0;padding:24px}
.hd{display:flex;justify-content:space-between;border-bottom:4px solid #E2332B;padding-bottom:10px}.brand{font-size:22px;font-weight:700;color:#E2332B}
.brand small{display:block;color:#666;font-size:12px;font-weight:400}h1{font-size:22px;margin:0;text-align:right}h1 small{display:block;font-size:12px;color:#666;font-weight:400}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0}.box{background:#f4f4f5;border-radius:6px;padding:10px 12px}.box b{display:block;color:#E2332B;font-size:12px;margin-bottom:2px}
table{width:100%;border-collapse:collapse;margin:8px 0}th{background:#3f3f46;color:#fff;font-weight:600;padding:6px;font-size:12px}td{border-bottom:1px solid #e4e4e7;padding:6px;vertical-align:top}
.r{text-align:right}.c{text-align:center}.b{color:#555;padding-left:8px}.tot{width:46%;margin-left:auto}.tot td{border:0;padding:3px 6px}.gt td{background:#E2332B;color:#fff;font-weight:700;font-size:15px}
.words{text-align:right;color:#555;margin:4px 0 12px}h3{font-size:14px;color:#E2332B;margin:14px 0 4px}.sig{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px;text-align:center}.sig div{border-top:1px solid #999;padding-top:6px}
.draft{position:fixed;top:40%;left:20%;font-size:90px;color:rgba(226,51,43,.08);transform:rotate(-25deg);font-weight:700}
</style></head><body>
${q.status !== 'APPROVED' ? `<div class="draft">${q.status === 'PENDING' ? 'รออนุมัติ' : 'DRAFT'}</div>` : ''}
<div class="hd"><div class="brand">Stream I.T. Consulting<small>บริษัท สตรีม ไอที คอนซัลติ้ง จำกัด · เลขประจำตัวผู้เสียภาษี 0105556000000</small></div>
<h1>ใบเสนอราคา<small>${esc(q.docNo)} rev.${q.revision}</small></h1></div>
<div class="meta"><div class="box"><b>ลูกค้า</b>${esc(cust?.name ?? p.customer)}<br>${cust?.taxId ? 'เลขผู้เสียภาษี ' + esc(cust.taxId) + '<br>' : ''}${esc(cust?.province ?? '')}<br>ผู้ติดต่อ: ${esc(contactName || '—')}</div>
<div class="box"><b>รายละเอียด</b>วันที่: ${th(q.issueDate)}<br>ยืนราคาถึง: ${th(q.validUntil)}<br>โครงการ: ${esc(q.projectName)}<br>พนักงานขาย: ${esc(p.sales.join(', ') || '—')}</div></div>
<table><thead><tr><th>ลำดับ</th><th>รายการ / ขอบเขตงาน</th><th>จำนวน</th><th>หน่วย</th><th>ราคา/หน่วย</th><th>จำนวนเงิน</th></tr></thead><tbody>${lines}</tbody></table>
<table class="tot"><tr><td>ราคารวม</td><td class="r">${m(t.gross)}</td></tr><tr><td>ส่วนลดพิเศษ</td><td class="r">${t.discount ? '-' + m(t.discount) : '0.00'}</td></tr>
<tr><td>Subtotal (ก่อน VAT)</td><td class="r">${m(t.subtotal)}</td></tr><tr><td>VAT 7%</td><td class="r">${m(t.vat)}</td></tr><tr class="gt"><td>Grand Total</td><td class="r">${m(t.grand)}</td></tr></table>
<p class="words">(${bahtText(t.grand)})</p>
<h3>ระยะเวลาดำเนินงาน</h3><p>${esc(q.duration)}</p>
<h3>งวดการชำระเงิน</h3><table><thead><tr><th>งวด</th><th>%</th><th>เงื่อนไขส่งมอบ</th><th>จำนวนเงิน (ก่อน VAT)</th></tr></thead><tbody>${terms}</tbody></table>
${q.warranty ? `<h3>การรับประกัน / SLA</h3><p>${esc(q.warranty)}</p>` : ''}${q.exclusions ? `<h3>สิ่งที่ไม่รวมในราคา / สิ่งที่ลูกค้าต้องจัดเตรียม</h3><p>${esc(q.exclusions)}</p>` : ''}${q.remark ? `<h3>หมายเหตุ</h3><p>${esc(q.remark)}</p>` : ''}
<div class="sig"><div>ผู้เสนอราคา<br>${esc(person(p.sm)?.name ?? '')}<br><small>Solution Manager</small></div><div>ผู้อนุมัติ<br>${esc(person('tc')?.name ?? '')}<br><small>ผู้บริหาร DT</small></div></div>
</body></html>`
}
