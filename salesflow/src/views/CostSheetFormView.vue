<script setup lang="ts">
// Cost Sheet as an Excel Online workbook (Microsoft 365), laid out row for row like the company
// file "Cost_Sheet_Template": header → REVENUE (with Payment#1–#5) → COST OF GOODS SOLD (groups 1–7)
// → Gross Profit / Margin → DIRECT & LABOUR COST (8–10) → VARIABLE COST (11–13) → Total Expense /
// Contribution Margin → Internal Transfer Charge → Approved By → Remark. Formulas match the file.
// "Create" copies the template into the project's SharePoint folder; the system reads the named
// range (OnePlatform_CostSheet_…) on save. Approved / pending revisions open read-only.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'
import { COST_GROUPS, REVENUE_TYPES, SECTIONS, costTotals, groupsOf, lineCost, validateCostSheet, type CostSection } from '../domain/salesdocs'
import { DOC_STATUS, type CostGroup, type CostLine, type CostSheet } from '../data/model'
import { account, person, thDate } from '../data/mock'
import { projects, notify } from '../store'
import { blankCostSheet, canSeeCost, isOwner, nextCostRevision, saveCostSheet } from '../docstore'

const props = defineProps<{ id: string; csid: string }>()
const router = useRouter()
const p = computed(() => projects.find((x) => x.id === props.id))
const existing = computed(() => p.value?.costSheets?.find((c) => c.id === props.csid))
const cs = ref<CostSheet | null>(p.value ? (existing.value ? JSON.parse(JSON.stringify(existing.value)) : blankCostSheet(p.value)) : null)
const readonly = computed(() => !p.value || !isOwner(p.value) || (cs.value?.status ?? 'DRAFT') !== 'DRAFT')
const t = computed(() => (cs.value ? costTotals(cs.value) : null))
const tried = ref(false)
const v = computed(() => (cs.value ? validateCostSheet(cs.value) : { errors: {}, warn: {} }))
const err = (k: string) => (tried.value ? (v.value.errors as Record<string, string>)[k] : '')
const fileName = computed(() => (cs.value ? `${cs.value.docNo}_CostSheet_rev${cs.value.revision}.xlsx` : ''))
const saved = ref(!!existing.value)
const money = (x: number) => (x ? x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-')
const pct = (x: number) => `${Math.round(x * 10000) / 100}%`

/* ---------- rows, numbered like the sheet ---------- */
type Row =
  | { k: 'title' | 'subtitle' | 'blank' | 'remark' | 'sign' | 'addRev' | 'pay' | 'revTotal' | 'revVat' }
  | { k: 'hdr'; l: string; val: string; l2?: string; v2?: string }
  | { k: 'section'; l: string } | { k: 'colhdr'; rev?: boolean; pc?: boolean }
  | { k: 'rev'; i: number }
  | { k: 'group'; g: CostGroup; first: number; last: number }
  | { k: 'cost'; i: number; g: CostGroup }
  | { k: 'add'; g: CostGroup }
  | { k: 'total'; l: string; val: string; f: string; strong?: boolean; tone?: string }
const rows = computed<Row[]>(() => {
  const c = cs.value, s = t.value
  if (!c || !s || !p.value) return []
  const out: Row[] = [
    { k: 'title' }, { k: 'subtitle' }, { k: 'blank' },
    { k: 'hdr', l: 'Profit/Cost Center :', val: c.profitCenter ?? p.value.team, l2: 'Date:', v2: thDate(c.preparedAt) },
    { k: 'hdr', l: 'Project Name:', val: p.value.name },
    { k: 'hdr', l: 'Project Reference Number:', val: c.refNo ?? p.value.code, l2: 'Prepared By:', v2: person(c.createdBy)?.name ?? '' },
    { k: 'hdr', l: 'Customer:', val: account(p.value.customerAccountId)?.name ?? p.value.customer },
    { k: 'blank' }, { k: 'section', l: 'REVENUE' }, { k: 'colhdr', rev: true }, { k: 'pay' },
    ...c.revenue.map((_, i) => ({ k: 'rev' as const, i })),
    ...(!readonly.value ? [{ k: 'addRev' as const }] : []),
    { k: 'revTotal' }, { k: 'revVat' }, { k: 'blank' },
  ]
  for (const sec of SECTIONS) {
    out.push({ k: 'section', l: sec.label }, { k: 'colhdr', pc: sec.k === 'transfer' })
    for (const g of groupsOf(sec.k)) {
      const idx = c.costs.map((l, i) => ({ l, i })).filter((x) => x.l.group === g)
      const first = out.length + 2
      out.push({ k: 'group', g, first, last: first + Math.max(0, idx.length - 1) })
      idx.forEach((x) => out.push({ k: 'cost', i: x.i, g }))
      if (!readonly.value) out.push({ k: 'add', g })
    }
    if (sec.k === 'cogs') out.push(
      { k: 'total', l: 'Total Cost of Goods Sold', val: money(s.cogs), f: '=SUM(Hardware, Software, Rental Cost, Outsource, Training Cost, Accessories, Consulting cost)', strong: true },
      { k: 'total', l: 'Gross Profit', val: money(s.gp), f: '=Total Revenue − Total Cost of Goods Sold', tone: s.gp < 0 ? 'neg' : '' },
      { k: 'total', l: 'Margin', val: pct(s.gmPct / 100), f: '=IF(Total Revenue=0,0,Gross Profit/Total Revenue)', tone: v.value.warn.gm ? 'warn' : 'good' },
      { k: 'blank' },
    )
    if (sec.k === 'variable') out.push(
      { k: 'total', l: 'Total Direct & Labour and Variable Cost', val: money(s.directVariable), f: '=SUM(Manday, Logistic, Financial cost, Operational Support Cost, Entertainment, Contingency)', strong: true },
      { k: 'total', l: 'Total Expense', val: money(s.totalExpense), f: '=Total Cost of Goods Sold + Total Direct & Labour and Variable Cost', strong: true },
      { k: 'total', l: 'Contribution Margin', val: money(s.cm), f: '=Total Revenue − Total Expense', strong: true, tone: s.cm < 0 ? 'neg' : 'cm' },
      { k: 'total', l: 'Margin', val: pct(s.cmPct / 100), f: '=IF(Total Revenue=0,0,Contribution Margin/Total Revenue)', strong: true, tone: 'cm' },
      { k: 'blank' },
    )
  }
  out.push({ k: 'blank' }, { k: 'sign' }, { k: 'remark' })
  return out
})
const rowOfRev = (i: number) => rows.value.findIndex((r) => r.k === 'rev' && r.i === i) + 1
const payRow = computed(() => rows.value.findIndex((r) => r.k === 'pay') + 1)
const revTotalRow = computed(() => rows.value.findIndex((r) => r.k === 'revTotal') + 1)
const firstRev = computed(() => rowOfRev(0))
const lastRev = computed(() => rowOfRev((cs.value?.revenue.length ?? 1) - 1))
const L = ['G', 'H', 'I', 'J', 'K']

/* ---------- formula bar ---------- */
const sel = ref<{ ref: string; f: string }>({ ref: 'C5', f: '' })
const pick = (ref: string, f: string | number) => (sel.value = { ref, f: String(f) })
const costFormula = (l: CostLine, row: number) => {
  switch (l.group) {
    case 'training': return `=D${row}*E${row}*3`
    case 'consulting': return `=F${revTotalRow.value}*D${row}/(1+D${row})`
    case 'contingency': return `=F${revTotalRow.value}*D${row}`
    case 'financial': return `=D${row}*E${row}*(Hardware+Software)`
    default: return `=D${row}*E${row}`
  }
}

/* ---------- editing ---------- */
let n = 1
const uid = (x: string) => `${x}${Date.now()}${n++}`
function addRev() { cs.value!.revenue.push({ id: uid('r'), type: 'Software', description: '', qty: 1, unitPrice: 0 }) }
function addCost(g: CostGroup) {
  const d = COST_GROUPS[g]
  cs.value!.costs.push({ id: uid('c'), group: g, description: '', sub: d.subs?.[0], qty: g === 'contingency' ? 0.05 : g === 'consulting' ? 0 : 1, unitPrice: 0 })
}
const isNoPrice = (g: CostGroup) => g === 'consulting' || g === 'contingency'
// Drag a revenue row by its handle to reorder.
const dragFrom = ref<number | null>(null)
function dropAt(k: number) {
  if (dragFrom.value === null || dragFrom.value === k) return
  const list = cs.value!.revenue
  const [row] = list.splice(dragFrom.value, 1)
  list.splice(k, 0, row)
  dragFrom.value = null
}
function save(next: 'stay' | 'quote') {
  tried.value = true
  if (Object.keys(v.value.errors).length) { notify('ยังมีช่องที่ต้องแก้ — ดูข้อความสีแดงในชีต', 'warning'); return }
  cs.value!.source = 'form'
  cs.value!.fileName = fileName.value
  saveCostSheet(p.value!, cs.value!)
  saved.value = true
  notify(`บันทึก ${fileName.value} ใน SharePoint แล้ว (Draft)`)
  if (next === 'quote') router.push(`/projects/${props.id}/quotation/new?cs=${cs.value!.id}`)
  else router.replace(`/projects/${props.id}/cost-sheet/${cs.value!.id}`)
}
function newRev() { const r = nextCostRevision(p.value!, existing.value!); saveCostSheet(p.value!, r); router.push(`/projects/${props.id}/cost-sheet/${r.id}`); cs.value = JSON.parse(JSON.stringify(r)) }
/** Spreadsheet XML copy (opens in Excel). */
function exportXls() {
  const c = cs.value!, s = t.value!
  const cell = (x: string | number) => `<Cell><Data ss:Type="${typeof x === 'number' ? 'Number' : 'String'}">${String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Data></Cell>`
  const row = (cells: (string | number)[]) => `<Row>${cells.map(cell).join('')}</Row>`
  const rowsX = [row(['Stream I.T. Consulting Limited']), row(['Estimated Cost Sheet', `${c.docNo} rev.${c.revision}`]), row(['Project Name:', p.value!.name]), row([]), row(['REVENUE']),
    row(['Item', 'Type', 'Income Description', 'Qty', 'Unit Price', 'Total Amount', ...c.payments.map((x, i) => `Payment#${i + 1} ${pct(x)}`), 'Part No.', 'Note']),
    ...c.revenue.map((l, i) => row([i + 1, l.type, l.description, l.qty, l.unitPrice, l.qty * l.unitPrice, ...c.payments.map((x) => l.qty * l.unitPrice * x), l.partNo ?? '', l.note ?? ''])),
    row(['', 'Total Revenue', '', '', '', s.revenue]), row(['', 'Total Revenue (Include VAT)', '', '', '', s.revenueVat]), row([]),
    ...c.costs.map((l) => row([COST_GROUPS[l.group].no, COST_GROUPS[l.group].label, l.description, l.qty ?? '', l.unitPrice ?? '', lineCost(l, c), '', '', '', '', '', l.partNo ?? l.profitCenter ?? '', l.note ?? ''])),
    row([]), ...[['Total Cost of Goods Sold', s.cogs], ['Gross Profit', s.gp], ['Margin %', s.gmPct], ['Total Direct & Labour and Variable Cost', s.directVariable], ['Total Expense', s.totalExpense], ['Contribution Margin', s.cm], ['Margin %', s.cmPct]].map((r) => row(['', ...r] as (string | number)[]))]
  const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Cost_Sheet_Template"><Table>${rowsX.join('')}</Table></Worksheet></Workbook>`
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([xml], { type: 'application/vnd.ms-excel' }))
  a.download = `${c.docNo}_rev${c.revision}.xls`
  a.click()
}
const signers = computed(() => {
  const a = p.value?.approval
  const mine = !!a && a.costSheetId === cs.value?.id
  const steps = mine ? a!.steps.filter((x) => x.approver) : []
  return [
    { role: 'Prepared By (SM)', who: person(cs.value?.createdBy)?.name ?? '', at: thDate(cs.value?.preparedAt) },
    ...(mine ? steps.map((x) => ({ role: x.role, who: x.status === 'approved' ? x.who : `${x.who} (${x.status === 'pending' ? 'รอพิจารณา' : x.status === 'rejected' ? 'ส่งกลับ' : 'ยังไม่ถึงคิว'})`, at: x.at ?? '' }))
      : [{ role: 'รองผู้บริหาร DT', who: '', at: '' }, { role: 'ผู้บริหาร DT', who: '', at: '' }]),
  ]
})
const secOf = (g: CostGroup): CostSection => COST_GROUPS[g].section
</script>

<template>
  <div v-if="p && cs && t && canSeeCost(p)" class="xl">
    <header class="xbar">
      <router-link :to="`/projects/${p.id}?tab=cost`" class="xback" aria-label="ปิดและกลับไปที่โครงการ"><Icon name="chevron" :size="16" style="transform: rotate(180deg)" /></router-link>
      <span class="xlogo" aria-hidden="true">X</span>
      <div class="xfile">
        <strong>{{ fileName }}</strong>
        <span>SharePoint › Stream Projects › {{ p.code }} › Cost Sheet · {{ readonly ? 'อ่านอย่างเดียว' : saved ? 'บันทึกแล้ว' : 'ยังไม่บันทึก' }}</span>
      </div>
      <span class="chip" :class="DOC_STATUS[cs.status].tone">{{ DOC_STATUS[cs.status].label }}</span>
      <span class="sp" />
      <span class="xuser"><span class="av">{{ person(p.sm)?.initials }}</span> Microsoft 365</span>
    </header>
    <div class="xribbon" role="toolbar" aria-label="คำสั่ง">
      <template v-if="!readonly">
        <button class="rb" @click="save('stay')"><Icon name="check" :size="16" /> บันทึกแบบร่าง</button>
        <button class="rb strong" @click="save('quote')"><Icon name="file" :size="16" /> บันทึกและสร้าง Quotation</button>
        <span class="sep" />
      </template>
      <button v-else-if="isOwner(p) && existing && cs.status !== 'PENDING'" class="rb strong" @click="newRev"><Icon name="plus" :size="16" /> สร้าง revision ใหม่</button>
      <button class="rb" @click="exportXls"><Icon name="excel" :size="16" /> ดาวน์โหลดสำเนา</button>
      <span class="sp" />
      <span class="small muted">Template: Cost_Sheet_Template · Named range OnePlatform_CostSheet_{{ cs.refNo }}</span>
    </div>
    <div v-if="readonly" class="xro" role="status"><Icon name="lock" :size="14" />
      <span v-if="cs.status === 'APPROVED'">ไฟล์นี้อนุมัติแล้ว แก้ไม่ได้ — กด “สร้าง revision ใหม่” เพื่อแก้</span>
      <span v-else-if="cs.status === 'PENDING'">อยู่ระหว่างอนุมัติ — แก้ไม่ได้จนกว่าจะได้ผล</span>
      <span v-else-if="!isOwner(p)">เปิดดูอย่างเดียว</span>
      <span v-else>เอกสารถูก {{ DOC_STATUS[cs.status].label }} — สร้าง revision ใหม่เพื่อแก้แล้วส่งอีกครั้ง</span>
    </div>
    <div v-if="tried && Object.keys(v.errors).length" class="xerr" role="alert"><Icon name="alert" :size="14" /> {{ Object.values(v.errors)[0] }}</div>
    <div class="fbar"><span class="nb">{{ sel.ref }}</span><span class="fx">fx</span><span class="fv">{{ sel.f }}</span></div>

    <div class="sheet" role="grid" aria-label="Cost_Sheet_Template">
      <table>
        <colgroup><col class="rn" /><col style="width: 50px" /><col style="width: 190px" /><col style="width: 250px" /><col style="width: 74px" /><col style="width: 118px" /><col style="width: 122px" /><col v-for="c in L" :key="c" style="width: 104px" /><col style="width: 90px" /><col style="width: 150px" /><col style="width: 32px" /></colgroup>
        <thead><tr><th /><th v-for="c in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', '']" :key="c">{{ c }}</th></tr></thead>
        <tbody>
          <template v-for="(r, ri) in rows" :key="ri">
            <tr v-if="r.k === 'title'"><td class="rh">{{ ri + 1 }}</td><td colspan="14" class="title">Stream I.T. Consulting Limited</td></tr>
            <tr v-else-if="r.k === 'subtitle'"><td class="rh">{{ ri + 1 }}</td><td colspan="9" class="sub">Estimated Cost Sheet · {{ cs.docNo }} rev.{{ cs.revision }}</td><td colspan="5" class="note">ช่องเทาดึงจากโครงการ · ช่องขาวกรอก · ช่องฟ้าเป็นสูตร</td></tr>
            <tr v-else-if="r.k === 'blank'"><td class="rh">{{ ri + 1 }}</td><td colspan="14" /></tr>
            <tr v-else-if="r.k === 'hdr'"><td class="rh">{{ ri + 1 }}</td><td colspan="2" class="lbl">{{ r.l }}</td><td colspan="3" class="ro" @click="pick(`C${ri + 1}`, r.val)">{{ r.val }}</td><td colspan="5" /><td class="lbl r">{{ r.l2 }}</td><td colspan="2" class="ro" :class="{ none: !r.l2 }">{{ r.v2 }}</td><td /></tr>
            <tr v-else-if="r.k === 'section'"><td class="rh">{{ ri + 1 }}</td><td colspan="14" class="sec">{{ r.l }}</td></tr>
            <tr v-else-if="r.k === 'colhdr'" class="hd"><td class="rh">{{ ri + 1 }}</td><td>Item</td><td>Type</td><td>{{ r.rev ? 'Income Description' : 'Expense Description' }}</td><td>{{ r.rev ? 'Qty' : 'Qty/Fx' }}</td><td>Unit Price</td><td>Total Amount</td><td v-for="(c, i) in L" :key="c">Payment#{{ i + 1 }}</td><td>{{ r.pc ? 'Profit Center Code' : 'Part No.' }}</td><td>Note</td><td /></tr>
            <tr v-else-if="r.k === 'pay'" :class="{ bad: err('payments') }">
              <td class="rh">{{ ri + 1 }}</td><td colspan="6" class="note r">สัดส่วนงวดชำระของรายได้ (รวมต้อง 100%) →</td>
              <td v-for="(c, i) in L" :key="c" class="in"><input v-model.number="cs.payments[i]" type="number" min="0" max="1" step="0.05" :aria-label="`Payment#${i + 1} สัดส่วน`" :disabled="readonly" @focus="pick(`${c}${ri + 1}`, cs.payments[i])" /></td>
              <td colspan="3" class="small" :class="t.paymentsPct === 100 ? 'good' : 'neg'">รวม {{ t.paymentsPct }}%</td>
            </tr>
            <tr v-else-if="r.k === 'rev'" :class="{ bad: err(`rev${r.i}`), dragging: dragFrom === r.i }" @dragover.prevent @drop="dropAt(r.i)">
              <td class="rh">{{ ri + 1 }}</td>
              <td class="c"><span v-if="!readonly" class="grip" draggable="true" :aria-label="`ลากเพื่อย้ายรายได้แถว ${r.i + 1}`" @dragstart="dragFrom = r.i">⠿</span> {{ r.i + 1 }}</td>
              <td class="in"><select v-model="cs.revenue[r.i].type" :aria-label="`Type รายได้แถว ${r.i + 1}`" :disabled="readonly"><option v-for="x in REVENUE_TYPES" :key="x">{{ x }}</option></select></td>
              <td class="in"><input v-model="cs.revenue[r.i].description" :aria-label="`Income Description แถว ${r.i + 1}`" placeholder="Income Description" :disabled="readonly" @focus="pick(`C${ri + 1}`, cs.revenue[r.i].description)" /></td>
              <td class="in"><input v-model.number="cs.revenue[r.i].qty" type="number" min="0" :aria-label="`Qty รายได้แถว ${r.i + 1}`" :disabled="readonly" @focus="pick(`D${ri + 1}`, cs.revenue[r.i].qty)" /></td>
              <td class="in"><input v-model.number="cs.revenue[r.i].unitPrice" type="number" min="0" :aria-label="`Unit Price รายได้แถว ${r.i + 1}`" :disabled="readonly" @focus="pick(`E${ri + 1}`, cs.revenue[r.i].unitPrice)" /></td>
              <td class="fm" tabindex="0" @click="pick(`F${ri + 1}`, `=D${ri + 1}*E${ri + 1}`)">{{ money(cs.revenue[r.i].qty * cs.revenue[r.i].unitPrice) }}</td>
              <td v-for="(c, i) in L" :key="c" class="fm" @click="pick(`${c}${ri + 1}`, `=$F${ri + 1}*${c}$${payRow}`)">{{ money(cs.revenue[r.i].qty * cs.revenue[r.i].unitPrice * (cs.payments[i] || 0)) }}</td>
              <td class="in"><input v-model="cs.revenue[r.i].partNo" aria-label="Part No." :disabled="readonly" /></td>
              <td class="in"><input v-model="cs.revenue[r.i].note" aria-label="Note" :disabled="readonly" /></td>
              <td class="c"><button v-if="!readonly" class="del" :aria-label="`ลบรายได้แถว ${r.i + 1}`" @click="cs.revenue.splice(r.i, 1)"><Icon name="x" :size="13" /></button></td>
            </tr>
            <tr v-else-if="r.k === 'addRev'"><td class="rh">{{ ri + 1 }}</td><td /><td colspan="13"><button class="addrow" @click="addRev">+ เพิ่มรายการรายได้</button></td></tr>
            <tr v-else-if="r.k === 'revTotal'" class="tot"><td class="rh">{{ ri + 1 }}</td><td /><td colspan="3" class="lbl">Total Revenue</td><td class="fm" @click="pick(`E${ri + 1}`, `=SUM(E${firstRev}:E${lastRev})`)">{{ money(cs.revenue.reduce((a, l) => a + (Number(l.unitPrice) || 0), 0)) }}</td><td class="fm b" @click="pick(`F${ri + 1}`, `=SUM(F${firstRev}:F${lastRev})`)">{{ money(t.revenue) }}</td><td v-for="(c, i) in L" :key="c" class="fm" @click="pick(`${c}${ri + 1}`, `=SUM(${c}${firstRev}:${c}${lastRev})`)">{{ money(t.byPayment[i] ?? 0) }}</td><td colspan="3" /></tr>
            <tr v-else-if="r.k === 'revVat'"><td class="rh">{{ ri + 1 }}</td><td /><td colspan="4" class="lbl">Total Revenue (Include VAT)</td><td class="fm" @click="pick(`F${ri + 1}`, `=F${ri}*1.07`)">{{ money(t.revenueVat) }}</td><td colspan="8" /></tr>
            <tr v-else-if="r.k === 'group'" class="grp"><td class="rh">{{ ri + 1 }}</td><td class="c">{{ COST_GROUPS[r.g].no }}</td><td colspan="2" class="lbl">{{ COST_GROUPS[r.g].label }}</td><td class="fm" :class="{ blank: r.g !== 'manday' }" @click="r.g === 'manday' && pick(`D${ri + 1}`, `=SUM(D${r.first}:D${r.last})`)">{{ r.g === 'manday' ? t.manday : '' }}</td><td /><td class="fm b" @click="pick(`F${ri + 1}`, `=SUM(F${r.first}:F${r.last})`)">{{ money(t.groups[r.g]) }}</td><td colspan="5" class="fm blank" /><td colspan="3" class="note">{{ COST_GROUPS[r.g].formula }}</td></tr>
            <tr v-else-if="r.k === 'cost'" :class="{ bad: err(`cost${r.i}`), tr: secOf(r.g) === 'transfer' }">
              <td class="rh">{{ ri + 1 }}</td><td />
              <td class="in"><select v-if="COST_GROUPS[r.g].subs" v-model="cs.costs[r.i].sub" :aria-label="`ประเภทย่อย ${COST_GROUPS[r.g].label}`" :disabled="readonly"><option v-for="x in COST_GROUPS[r.g].subs" :key="x">{{ x }}</option></select></td>
              <td class="in"><input v-model="cs.costs[r.i].description" :aria-label="`Expense Description ${COST_GROUPS[r.g].label}`" placeholder="Expense Description" :disabled="readonly" @focus="pick(`C${ri + 1}`, cs.costs[r.i].description)" /></td>
              <td class="in"><input v-model.number="cs.costs[r.i].qty" type="number" min="0" :step="r.g === 'contingency' || r.g === 'financial' || r.g === 'consulting' ? 0.01 : 1" :aria-label="`${COST_GROUPS[r.g].qtyLabel} ${COST_GROUPS[r.g].label}`" :disabled="readonly" @focus="pick(`D${ri + 1}`, cs.costs[r.i].qty ?? 0)" /></td>
              <td class="in"><input v-if="!isNoPrice(r.g)" v-model.number="cs.costs[r.i].unitPrice" type="number" min="0" :aria-label="`${COST_GROUPS[r.g].priceLabel} ${COST_GROUPS[r.g].label}`" :disabled="readonly" @focus="pick(`E${ri + 1}`, cs.costs[r.i].unitPrice ?? 0)" /><span v-else class="na" /></td>
              <td class="fm" tabindex="0" @click="pick(`F${ri + 1}`, costFormula(cs.costs[r.i], ri + 1))" @focus="pick(`F${ri + 1}`, costFormula(cs.costs[r.i], ri + 1))">{{ money(lineCost(cs.costs[r.i], cs)) }}</td>
              <td colspan="5" />
              <td class="in"><input v-if="secOf(r.g) === 'transfer'" v-model="cs.costs[r.i].profitCenter" aria-label="Profit Center Code" :disabled="readonly" /><input v-else v-model="cs.costs[r.i].partNo" aria-label="Part No." :disabled="readonly" /></td>
              <td class="in"><input v-model="cs.costs[r.i].note" aria-label="Note" :disabled="readonly" /></td>
              <td class="c"><button v-if="!readonly" class="del" :aria-label="`ลบแถว ${COST_GROUPS[r.g].label}`" @click="cs.costs.splice(r.i, 1)"><Icon name="x" :size="13" /></button></td>
            </tr>
            <tr v-else-if="r.k === 'add'"><td class="rh">{{ ri + 1 }}</td><td /><td colspan="13"><button class="addrow" @click="addCost(r.g)">+ เพิ่ม {{ COST_GROUPS[r.g].label }}</button></td></tr>
            <tr v-else-if="r.k === 'total'" class="tot" :class="r.tone"><td class="rh">{{ ri + 1 }}</td><td /><td colspan="4" class="lbl">{{ r.l }}</td><td class="fm" :class="{ b: r.strong }" @click="pick(`F${ri + 1}`, r.f)">{{ r.val }}</td><td colspan="5" /><td colspan="3" class="small" :class="r.tone">{{ r.l === 'Margin' && r.tone === 'warn' ? v.warn.gm : '' }}</td></tr>
            <template v-else-if="r.k === 'sign'">
              <tr><td class="rh">{{ ri + 1 }}</td><td colspan="2" class="lbl">Approved By:</td><td v-for="s in signers" :key="s.role" colspan="3" class="sign"><span class="small muted">{{ s.role }}</span><b>{{ s.who || '—' }}</b><span class="small muted">Date: {{ s.at || '—' }}</span></td><td :colspan="Math.max(1, 12 - signers.length * 3)" /></tr>
              <tr v-if="t.revenue < t.totalExpense" :class="{ bad: err('lossReason') }"><td class="rh">·</td><td colspan="2" class="lbl">เหตุผลที่ขาดทุน</td><td colspan="12" class="in"><input v-model="cs.lossReason" aria-label="เหตุผลที่ขาดทุน" :disabled="readonly" /></td></tr>
            </template>
            <tr v-else-if="r.k === 'remark'"><td class="rh">{{ ri + 1 }}</td><td colspan="2" class="lbl">Remark:</td><td colspan="12" class="in"><input v-model="cs.remark" aria-label="Remark" :disabled="readonly" /></td></tr>
          </template>
        </tbody>
      </table>
    </div>
    <footer class="xtabs">
      <span class="tab on">Cost_Sheet_Template</span>
      <router-link v-if="existing" :to="`/projects/${p.id}/quotation/new?cs=${cs.id}`" class="tab">Quotation_Template</router-link>
      <span v-else class="tab off" title="บันทึก Cost Sheet ก่อน">Quotation_Template</span>
      <span class="sp" />
      <span class="small">Revenue {{ money(t.revenue) }} · Margin {{ t.gmPct }}% · CM {{ t.cmPct }}%</span>
    </footer>
  </div>
  <div v-else class="page"><h1>{{ p ? 'ไม่มีสิทธิ์เปิด Cost Sheet' : 'ไม่พบโครงการ' }}</h1><p class="muted">Cost Sheet มีต้นทุนภายใน — เปิดได้เฉพาะ Owner, SM, ผู้อนุมัติ และผู้บริหาร</p><router-link to="/projects">กลับไปทะเบียนโครงการ</router-link></div>
</template>

<style scoped>
.xl { display: flex; flex-direction: column; height: calc(100vh - 60px); background: #fff; color: #1f1f1f; }
.xbar { display: flex; align-items: center; gap: 12px; background: #107c41; color: #fff; padding: 8px 16px; }
.xback { color: #fff; display: inline-flex; padding: 6px; border-radius: 4px; }
.xback:hover { background: rgb(255 255 255 / 0.15); }
.xlogo { width: 26px; height: 26px; border-radius: 4px; background: #fff; color: #107c41; font-weight: 700; display: grid; place-items: center; font-size: 15px; }
.xfile { display: grid; line-height: 1.3; min-width: 0; }
.xfile strong { font-weight: 600; font-size: 14px; }
.xfile span { font-size: 12px; opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sp { flex: 1; }
.xuser { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; }
.av { width: 26px; height: 26px; border-radius: 50%; background: #0b5a2f; display: grid; place-items: center; font-size: 12px; font-weight: 600; }
.xribbon { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border-bottom: 1px solid #e1dfdd; background: #f8f8f8; flex-wrap: wrap; }
.rb { display: inline-flex; align-items: center; gap: 6px; border: 1px solid transparent; background: none; border-radius: 4px; padding: 6px 10px; font: 14px var(--font); color: #1f1f1f; cursor: pointer; min-height: 34px; }
.rb:hover { background: #e9e9e9; }
.rb.strong { background: #107c41; color: #fff; }
.rb.strong:hover { background: #0e6b38; }
.sep { width: 1px; height: 22px; background: #d2d0ce; margin: 0 4px; }
.xro { display: flex; gap: 8px; align-items: center; padding: 6px 16px; background: #fff4ce; color: #6b5300; font-size: 13px; }
.xerr { display: flex; gap: 8px; align-items: center; padding: 6px 16px; background: #fde7e9; color: #a4262c; font-size: 13px; }
.fbar { display: flex; align-items: center; border-bottom: 1px solid #e1dfdd; font-size: 13px; min-height: 30px; }
.nb { width: 80px; padding: 0 10px; border-right: 1px solid #e1dfdd; font-weight: 600; }
.fx { padding: 0 10px; color: #605e5c; font-style: italic; border-right: 1px solid #e1dfdd; }
.fv { padding: 0 10px; font-family: Consolas, monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sheet { flex: 1; overflow: auto; }
table { border-collapse: collapse; table-layout: fixed; font-size: 13px; width: 1660px; }
col.rn { width: 44px; }
thead th { position: sticky; top: 0; z-index: 2; background: #f3f2f1; color: #605e5c; font-weight: 400; border: 1px solid #e1dfdd; height: 22px; text-align: center; }
td { border: 1px solid #ececec; height: 28px; padding: 0 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
td.rh { position: sticky; left: 0; z-index: 1; background: #f3f2f1; color: #605e5c; text-align: center; padding: 0; border-color: #e1dfdd; }
.title { font-size: 17px; font-weight: 700; color: #c4382f; height: 34px; }
.sub { font-size: 15px; font-weight: 600; }
.note { color: #605e5c; font-size: 12px; }
.sec { background: #3f3f46; color: #fff; font-weight: 700; letter-spacing: 0.02em; }
.lbl { color: #323130; font-weight: 600; }
.r { text-align: right; }
.c { text-align: center; }
td.ro { background: #f3f2f1; }
td.ro.none { background: none; }
td.in { padding: 0; }
td.in input, td.in select { width: 100%; height: 27px; border: 0; padding: 0 6px; font: inherit; background: transparent; color: inherit; }
td.in input:focus, td.in select:focus { outline: 2px solid #107c41; outline-offset: -2px; background: #fff; }
td.in input:disabled, td.in select:disabled { color: #323130; opacity: 1; }
td.in input[type='number'] { text-align: right; }
.na { display: block; height: 27px; background: repeating-linear-gradient(135deg, #fafafa, #fafafa 4px, #f2f2f2 4px, #f2f2f2 8px); }
td.fm { background: #eef6fc; text-align: right; cursor: cell; font-variant-numeric: tabular-nums; }
td.fm.blank { background: #f6fafd; }
td.fm:focus { outline: 2px solid #107c41; outline-offset: -2px; }
.hd td { background: #e9e9e9; font-weight: 600; font-size: 12px; text-align: center; }
.hd td.rh { font-weight: 400; }
.grp td { background: #fafafa; }
.grp td.fm { background: #e3eff9; }
.b { font-weight: 700; }
.tot td.lbl { background: #f3f2f1; }
.tot.cm td.fm, .tot.cm td.lbl { background: #dff1e6; }
.good { color: #107c41; } .warn, .tot.warn td.fm { color: #9a6700; } .neg, .tot.neg td.fm { color: #c4382f; }
.bad td.in { box-shadow: inset 0 0 0 1px #c4382f; }
.tr td { color: #605e5c; }
.grip { cursor: grab; color: #8a8886; user-select: none; }
.dragging { opacity: 0.5; }
.del { border: 0; background: none; color: #8a8886; cursor: pointer; padding: 3px; border-radius: 4px; }
.del:hover { background: #fde7e9; color: #c4382f; }
.addrow { border: 0; background: none; color: #107c41; font: 13px var(--font); cursor: pointer; padding: 2px 4px; }
.addrow:hover { text-decoration: underline; }
td.sign { height: 56px; vertical-align: top; padding-top: 4px; white-space: normal; }
td.sign b, td.sign span { display: block; }
.xtabs { display: flex; align-items: center; gap: 2px; border-top: 1px solid #e1dfdd; background: #f3f2f1; padding: 0 12px; min-height: 34px; font-size: 13px; }
.tab { padding: 6px 14px; color: #323130; }
.tab.on { background: #fff; color: #107c41; font-weight: 600; border-bottom: 2px solid #107c41; }
.tab.off { color: #8a8886; }
a.tab:hover { background: #e9e9e9; text-decoration: none; }
@media (max-width: 640px) { .xfile span, .xuser, .xribbon .small { display: none; } .xbar { padding: 8px; } .xfile strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } }
.xl { min-width: 0; max-width: 100%; overflow: hidden; }
</style>
