// Quotation template shared by the web print view and the server PDF renderer (P0-4).
// Customer-facing figures only — built from the approved snapshot, never from the Cost Sheet tab.

export interface QuotationData {
  number: string
  issueDate: string
  validDays: number
  customer: { name: string; taxId?: string; address?: string }
  projectName: string
  items: { description: string; qty: number; unit: string; unitPrice: number }[]
  paymentTerms: string
  approvedVersion: string
  snapshotHash: string
  company: { name: string; taxId: string; address: string }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Thai baht text (บาทถ้วน / สตางค์) required on Thai quotations. */
export function bahtText(amount: number): string {
  const digits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน']
  const read = (n: number): string => {
    if (n === 0) return ''
    if (n >= 1_000_000) return read(Math.floor(n / 1_000_000)) + 'ล้าน' + read(n % 1_000_000)
    let out = ''
    const s = String(n)
    for (let i = 0; i < s.length; i++) {
      const d = Number(s[i])
      const pos = s.length - i - 1
      if (d === 0) continue
      if (pos === 0 && d === 1 && s.length > 1) out += 'เอ็ด'
      else if (pos === 1 && d === 2) out += 'ยี่'
      else if (pos === 1 && d === 1) out += ''
      else out += digits[d]
      out += units[pos]
    }
    return out
  }
  const satang = Math.round((amount - Math.floor(amount)) * 100)
  const baht = Math.floor(amount)
  if (baht === 0 && satang === 0) return 'ศูนย์บาทถ้วน'
  return (baht ? read(baht) + 'บาท' : '') + (satang ? read(satang) + 'สตางค์' : 'ถ้วน')
}

export function quotationTotals(items: QuotationData['items']) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const vat = Math.round(subtotal * 0.07 * 100) / 100
  return { subtotal, vat, total: subtotal + vat }
}

export function renderQuotationHtml(q: QuotationData): string {
  const t = quotationTotals(q.items)
  const rows = q.items.map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.description)}</td><td class="r">${i.qty}</td><td>${esc(i.unit)}</td><td class="r">${money(i.unitPrice)}</td><td class="r">${money(i.qty * i.unitPrice)}</td></tr>`).join('')
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${esc(q.number)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600&display=swap" rel="stylesheet">
<style>
@page { size: A4; margin: 18mm 16mm; }
body { font-family: 'Sarabun', 'TH Sarabun New', 'Noto Sans Thai', sans-serif; font-size: 12pt; color: #161b26; }
h1 { font-size: 20pt; margin: 0 0 4mm; } .muted { color: #6b7384; } .r { text-align: right; }
header { display: flex; justify-content: space-between; border-bottom: 2px solid #161b26; padding-bottom: 4mm; margin-bottom: 6mm; }
table { width: 100%; border-collapse: collapse; margin: 6mm 0; } th, td { padding: 2.5mm 2mm; border-bottom: 1px solid #e3e6ec; vertical-align: top; }
th { text-align: left; font-weight: 600; background: #f2f3f6; } .sum td { border: 0; padding: 1.5mm 2mm; } .total td { font-weight: 600; font-size: 13pt; border-top: 2px solid #161b26; }
footer { margin-top: 12mm; font-size: 9pt; color: #6b7384; }
</style></head><body>
<header><div><h1>ใบเสนอราคา</h1><div>${esc(q.company.name)}</div><div class="muted">${esc(q.company.address)} · เลขประจำตัวผู้เสียภาษี ${esc(q.company.taxId)}</div></div>
<div class="r"><div>เลขที่ <b>${esc(q.number)}</b></div><div>วันที่ ${esc(q.issueDate)}</div><div>ยืนราคา ${q.validDays} วัน</div></div></header>
<div><b>ลูกค้า</b> ${esc(q.customer.name)}${q.customer.taxId ? ` · เลขประจำตัวผู้เสียภาษี ${esc(q.customer.taxId)}` : ''}</div>
${q.customer.address ? `<div class="muted">${esc(q.customer.address)}</div>` : ''}
<div><b>โครงการ</b> ${esc(q.projectName)}</div>
<table><thead><tr><th>#</th><th>รายการ</th><th class="r">จำนวน</th><th>หน่วย</th><th class="r">ราคาต่อหน่วย</th><th class="r">จำนวนเงิน</th></tr></thead><tbody>${rows}</tbody>
<tbody class="sum"><tr><td colspan="5" class="r">รวมเป็นเงิน</td><td class="r">${money(t.subtotal)}</td></tr>
<tr><td colspan="5" class="r">ภาษีมูลค่าเพิ่ม 7%</td><td class="r">${money(t.vat)}</td></tr>
<tr class="total"><td colspan="3">(${bahtText(t.total)})</td><td colspan="2" class="r">ราคารวมทั้งสิ้น</td><td class="r">${money(t.total)}</td></tr></tbody></table>
<div><b>เงื่อนไขการชำระเงิน</b> ${esc(q.paymentTerms)}</div>
<footer>อ้างอิงการอนุมัติ ${esc(q.approvedVersion)} · ${esc(q.snapshotHash.slice(0, 12))}</footer>
</body></html>`
}

