// Printable Quotation laid out like the company sheet "Quotation_Template": QUOTATION title,
// Customer block, Quotation No. / Date / Version Revise / Project, item table (ITEM · PART NO. ·
// Product Description · QTY. · Unit Price · Amount), Total / Special Discount / Subtotal / VAT 7% /
// Grand Total, Conditions and the three signature boxes. Rendered into an iframe for the preview;
// the server renders the same HTML to PDF in production.
import type { Project, Quotation } from '../../data/model'
import { account } from '../../data/mock'
import { bahtText } from '../../domain/quotation'
import { quoteTotals } from '../../domain/salesdocs'

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const m = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const th = (iso: string) => (iso ? new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '—')

export function quoteHtml(p: Project, q: Quotation): string {
  const t = quoteTotals(q)
  const cust = account(p.customerAccountId)?.name ?? p.customer
  const lines = q.items.map((i, k) => `<tr><td class="c">${k + 1}</td><td>${esc(i.partNo ?? '')}</td><td>${esc(i.description)}</td><td class="r">${i.qty.toLocaleString('en-US')}</td><td class="r">${m(i.unitPrice)}</td><td class="r">${m(i.qty * i.unitPrice)}</td></tr>`).join('')
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${esc(q.docNo)} rev.${q.revision}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:14mm}body{font-family:Sarabun,sans-serif;color:#222;font-size:13px;margin:0;padding:24px}
h1{margin:0 0 10px;font-size:26px;letter-spacing:.08em;color:#E2332B;border-bottom:4px solid #E2332B;padding-bottom:6px}
.top{display:grid;grid-template-columns:1.2fr 1fr;gap:16px}.box{background:#f4f4f5;border-radius:6px;padding:10px 12px;line-height:1.7}.box b.h{display:block;color:#E2332B}
.intro{margin:14px 0 8px;color:#444}table{width:100%;border-collapse:collapse}th{background:#3f3f46;color:#fff;font-weight:600;padding:6px;font-size:12px}
td{border-bottom:1px solid #e4e4e7;padding:6px;vertical-align:top}.r{text-align:right}.c{text-align:center}.proj td{font-weight:700;background:#fafafa}
.tot{width:48%;margin-left:auto;margin-top:6px}.tot td{border:0;padding:3px 6px}.gt td{background:#E2332B;color:#fff;font-weight:700;font-size:15px}
.words{text-align:right;color:#555;margin:4px 0 2px}.cur{color:#555;margin:2px 0 10px}h3{font-size:14px;color:#E2332B;margin:12px 0 4px}
.cond td{border:0;padding:2px 6px}.cond td:first-child{width:150px;font-weight:600}.thanks{margin:14px 0 0}
.sig{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:46px;text-align:center}.sig div{border-top:1px solid #999;padding-top:6px;line-height:1.5}.sig small{color:#666}
.draft{position:fixed;top:40%;left:18%;font-size:90px;color:rgba(226,51,43,.08);transform:rotate(-25deg);font-weight:700}
</style></head><body>
${q.status !== 'APPROVED' ? `<div class="draft">${q.status === 'PENDING' ? 'รออนุมัติ' : 'DRAFT'}</div>` : ''}
<h1>QUOTATION</h1>
<div class="top"><div class="box"><b class="h">Customer</b>Name: ${esc(q.contact ?? '—')}<br>Company Name: ${esc(cust)}<br>Phone/Fax: ${esc(q.phone ?? '—')}<br>Email: ${esc(q.email ?? '—')}</div>
<div class="box">Quotation No.: ${esc(q.docNo)}<br>Date: ${th(q.issueDate)}<br>[Version Revise] : ${q.revision}<br>Project : ${esc(q.projectName)}</div></div>
<p class="intro">We are pleased to submit you the following quotation and offer to sell or service the product described herein at price, items, and stated as below</p>
<table><thead><tr><th>ITEM</th><th>PART NO.</th><th>Product Description</th><th>QTY.</th><th>Unit Price</th><th>Amount</th></tr></thead>
<tbody><tr class="proj"><td></td><td></td><td colspan="4">${esc(q.projectName)}</td></tr>${lines}</tbody></table>
<table class="tot"><tr><td>Total</td><td class="r">${m(t.total)}</td></tr><tr><td>Special Discount</td><td class="r">${m(t.discount)}</td></tr>
<tr><td>Subtotal</td><td class="r">${m(t.subtotal)}</td></tr><tr><td>Vat 7%</td><td class="r">${m(t.vat)}</td></tr><tr class="gt"><td>Grand Total</td><td class="r">${m(t.grand)}</td></tr></table>
<p class="words">(${bahtText(t.grand)})</p><p class="cur">All price quoted in [Thai Baht]</p>
<h3>Conditions</h3><table class="cond">
<tr><td>Price validity</td><td>ยืนราคาถึง ${th(q.validUntil)}</td></tr><tr><td>Term of payment</td><td>${esc(q.termOfPayment)}</td></tr>
<tr><td>Term of delivery</td><td>${esc(q.termOfDelivery)}</td></tr><tr><td>Vat7%</td><td>${q.vatIncluded ? 'include' : 'exclude'}</td></tr>
<tr><td>Warranty</td><td>${esc(q.warranty)}</td></tr><tr><td>Sales Person</td><td>${esc(q.salesPerson)}</td></tr>${q.remark ? `<tr><td>Remark</td><td>${esc(q.remark)}</td></tr>` : ''}</table>
<p class="thanks">Thank you for your business.</p>
<div class="sig"><div>Sincerely by<br><b>${esc(q.salesPerson.split(',')[0] || '—')}</b><br><small>Account Manager<br>Stream I.T. Consulting Limited</small></div>
<div>Verify and Approved by<br><b>${esc((q.approvedBy ?? '').split(' (')[0] || '—')}</b><br><small>${esc((q.approvedBy ?? '').match(/\((.+)\)/)?.[1] ?? '')}<br>Stream I.T. Consulting Limited</small></div>
<div>Accepted by<br><b>(Name Printed)</b><br><small>(Title)<br>${esc(cust)}</small></div></div>
</body></html>`
}
