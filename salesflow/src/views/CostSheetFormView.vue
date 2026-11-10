<script setup lang="ts">
// Cost Sheet as an Excel Online workbook (Microsoft 365). "Create" makes a new workbook from the
// company template in the project's SharePoint folder (Graph: copy template → open in Excel for
// the web); the SM fills the template cells, formulas calculate, and the system reads the named
// ranges on save. In the prototype the grid below stands in for the embedded Excel Online editor.
// Approved or pending revisions open read-only — any change is a new revision.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'
import { COST_CATEGORIES, ROLES_MD, costTotals, itemCost, validateCostSheet } from '../domain/salesdocs'
import { DOC_STATUS, type CostCategory, type CostItem, type CostSheet } from '../data/model'
import { baht, person, thDate, teamOf, account } from '../data/mock'
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

let n = 1
function addRow(cat: CostCategory) {
  const base: CostItem = { id: `n${Date.now()}${n++}`, category: cat, description: '' }
  const seed: Partial<Record<CostCategory, Partial<CostItem>>> = { manpower: { role: 'Developer', manday: 0, rate: 6500 }, hardware: { qty: 1, unitCost: 0 }, software: { qty: 1, unitCost: 0, months: 12 }, cloud: { unitCost: 0, months: 12 }, ma: { months: 12, unitCost: 0 } }
  cs.value!.items.push({ ...base, ...(seed[cat] ?? { amount: 0 }) })
  addOpen.value = false
}
const addOpen = ref(false)
function changeCat(i: CostItem, cat: CostCategory) { Object.assign(i, { category: cat, role: undefined, manday: undefined, rate: undefined, qty: undefined, unitCost: undefined, months: undefined, amount: undefined }); if (cat === 'manpower') Object.assign(i, { role: 'Developer', manday: 0, rate: 6500 }) }
// Drag a row by its handle to reorder.
const dragFrom = ref<number | null>(null)
function dropAt(k: number) {
  if (dragFrom.value === null || dragFrom.value === k) return
  const list = cs.value!.items
  const [row] = list.splice(dragFrom.value, 1)
  list.splice(k, 0, row)
  dragFrom.value = null
}
function save(next: 'stay' | 'quote') {
  tried.value = true
  if (Object.keys(v.value.errors).length) { notify('ยังมีช่องที่ต้องแก้ — ดูข้อความใต้ช่อง', 'warning'); return }
  cs.value!.source = 'form'
  cs.value!.fileName = fileName.value
  saveCostSheet(p.value!, cs.value!)
  saved.value = true
  notify(`บันทึก ${fileName.value} ใน SharePoint แล้ว (Draft)`)
  if (next === 'quote') router.push(`/projects/${props.id}/quotation/new?cs=${cs.value!.id}`)
  else router.replace(`/projects/${props.id}/cost-sheet/${cs.value!.id}`)
}
function newRev() { const r = nextCostRevision(p.value!, existing.value!); saveCostSheet(p.value!, r); router.push(`/projects/${props.id}/cost-sheet/${r.id}`); cs.value = JSON.parse(JSON.stringify(r)) }
/** Spreadsheet XML (opens in Excel) — production exports .xlsx from the company template. */
function exportXls() {
  const c = cs.value!, s = t.value!
  const row = (cells: (string | number)[]) => `<Row>${cells.map((x) => `<Cell><Data ss:Type="${typeof x === 'number' ? 'Number' : 'String'}">${String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Data></Cell>`).join('')}</Row>`
  const rows = [row(['Cost Sheet', `${c.docNo} rev.${c.revision}`]), row(['โครงการ', p.value!.name]), row([]), row(['หมวด', 'รายการ', 'Role', 'Manday', 'Rate', 'จำนวน', 'ต้นทุน/หน่วย', 'เดือน', 'มูลค่า', 'ต้นทุน', 'หมายเหตุ']),
    ...c.items.map((i) => row([COST_CATEGORIES[i.category].label, i.description, i.role ?? '', i.manday ?? '', i.rate ?? '', i.qty ?? '', i.unitCost ?? '', i.months ?? '', i.amount ?? '', itemCost(i), i.note ?? ''])),
    row([]), ...[['COGS', s.cogs], ['Revenue', s.revenue], ['Gross Profit', s.gp], ['GM%', s.gmPct], ['Entertainment', s.entertainment], ['Contingency', s.contingency], ['Contribution Margin', s.cm], ['CM%', s.cmPct]].map((r) => row(r as (string | number)[]))]
  const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Cost Sheet"><Table>${rows.join('')}</Table></Worksheet></Workbook>`
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([xml], { type: 'application/vnd.ms-excel' }))
  a.download = `${c.docNo}_rev${c.revision}.xls`
  a.click()
}
// Formula bar: what the selected cell holds.
const sel = ref<{ ref: string; f: string }>({ ref: 'C3', f: '' })
const pick = (ref: string, f: string | number) => (sel.value = { ref, f: String(f) })
const FIRST = 14
const rowNo = (k: number) => FIRST + k
const lastRow = computed(() => FIRST + Math.max(0, (cs.value?.items.length ?? 1) - 1))
const sumRow = computed(() => lastRow.value + 2)
const formulaOf = (i: CostItem, k: number) => {
  const r = rowNo(k)
  return i.category === 'manpower' ? `=E${r}*F${r}` : i.category === 'hardware' ? `=E${r}*F${r}` : i.category === 'software' ? `=E${r}*F${r}*G${r}` : i.category === 'cloud' || i.category === 'ma' ? `=F${r}*G${r}` : `=H${r}`
}
const fileName = computed(() => (cs.value ? `${cs.value.docNo}_CostSheet_rev${cs.value.revision}.xlsx` : ''))
const saved = ref(!!existing.value)
const catTotals = computed(() => (t.value ? (Object.keys(COST_CATEGORIES) as CostCategory[]).filter((k) => t.value!.byCategory[k]).map((k) => ({ k, v: t.value!.byCategory[k] })) : []))
</script>

<template>
  <div v-if="p && cs && canSeeCost(p)" class="xl">
    <!-- Excel for the web chrome -->
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
        <div class="add">
          <button class="rb" :aria-expanded="addOpen" @click="addOpen = !addOpen"><Icon name="plus" :size="16" /> แทรกแถวต้นทุน</button>
          <div v-if="addOpen" class="menu" role="menu"><button v-for="(c, key) in COST_CATEGORIES" :key="key" role="menuitem" class="mi" @click="addRow(key)">{{ c.label }}</button></div>
        </div>
        <span class="sep" />
        <button class="rb" @click="save('stay')"><Icon name="check" :size="16" /> บันทึกแบบร่าง</button>
        <button class="rb strong" @click="save('quote')"><Icon name="file" :size="16" /> บันทึกและสร้าง Quotation</button>
        <span class="sep" />
      </template>
      <button v-else-if="isOwner(p) && existing && cs.status !== 'PENDING'" class="rb strong" @click="newRev"><Icon name="plus" :size="16" /> สร้าง revision ใหม่</button>
      <button class="rb" @click="exportXls"><Icon name="excel" :size="16" /> ดาวน์โหลดสำเนา</button>
      <span class="sp" />
      <span class="small muted">Template: Cost Sheet มาตรฐาน DT 2569</span>
    </div>
    <div v-if="readonly" class="xro" role="status"><Icon name="lock" :size="14" />
      <span v-if="cs.status === 'APPROVED'">ไฟล์นี้อนุมัติแล้ว แก้ไม่ได้ — กด “สร้าง revision ใหม่” เพื่อแก้</span>
      <span v-else-if="cs.status === 'PENDING'">อยู่ระหว่างอนุมัติ — แก้ไม่ได้จนกว่าจะได้ผล</span>
      <span v-else-if="!isOwner(p)">เปิดดูอย่างเดียว</span>
      <span v-else>เอกสารถูก {{ DOC_STATUS[cs.status].label }} — สร้าง revision ใหม่เพื่อแก้แล้วส่งอีกครั้ง</span>
    </div>
    <div class="fbar"><span class="nb">{{ sel.ref }}</span><span class="fx">fx</span><span class="fv">{{ sel.f }}</span></div>

    <div class="sheet" role="grid" aria-label="Cost Sheet">
      <table>
        <colgroup><col class="rn" /><col style="width: 34px" /><col style="width: 170px" /><col style="width: 200px" /><col style="width: 118px" /><col style="width: 88px" /><col style="width: 108px" /><col style="width: 58px" /><col style="width: 100px" /><col style="width: 118px" /><col style="width: 170px" /><col style="width: 34px" /></colgroup>
        <thead><tr><th /><th v-for="c in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', '']" :key="c">{{ c }}</th></tr></thead>
        <tbody>
          <tr><td class="rh">1</td><td colspan="11" class="title">COST SHEET · {{ cs.docNo }} rev.{{ cs.revision }}</td></tr>
          <tr><td class="rh">2</td><td colspan="11" class="note">เอกสารภายใน — ช่องสีเทาดึงจากโครงการอัตโนมัติ · ช่องสีขาวกรอกเอง · ช่องสีฟ้าเป็นสูตร</td></tr>
          <tr v-for="(h, k) in [['ชื่อโปรเจกต์', p.name], ['ลูกค้า / End User', `${account(p.customerAccountId)?.name ?? p.customer} / ${account(p.endUserAccountId)?.name ?? p.endUser}`], ['Profit Center (BU)', `${p.team} · ${teamOf(p.team)?.name ?? ''}`], ['Project Type', p.type], ['AE / SM (ผู้จัดทำ)', `${p.sales.join(', ') || '—'} / ${person(p.sm)?.name}`], ['วันที่จัดทำ', thDate(cs.preparedAt)]]" :key="h[0]">
            <td class="rh">{{ k + 3 }}</td><td /><td class="lbl">{{ h[0] }}</td><td colspan="4" class="ro" @click="pick(`C${k + 3}`, h[1])">{{ h[1] }}</td><td colspan="5" />
          </tr>
          <tr :class="{ bad: err('projectMonths') }"><td class="rh">9</td><td /><td class="lbl">ระยะเวลาโครงการ (เดือน)</td><td class="in"><input v-model.number="cs.projectMonths" type="number" min="1" aria-label="ระยะเวลาโครงการ (เดือน)" :disabled="readonly" @focus="pick('C9', cs.projectMonths ?? '')" /></td><td colspan="8" class="msg">{{ err('projectMonths') }}</td></tr>
          <tr><td class="rh">10</td><td /><td class="lbl">ระยะรับประกัน / MA (เดือน)</td><td class="in"><input v-model.number="cs.maMonths" type="number" min="0" aria-label="ระยะรับประกัน / MA (เดือน)" :disabled="readonly" @focus="pick('C10', cs.maMonths ?? '')" /></td><td colspan="8" /></tr>
          <tr><td class="rh">11</td><td colspan="11" /></tr>
          <tr class="hd"><td class="rh">12</td><td>#</td><td>หมวด</td><td>รายการ / ขอบเขต</td><td>Role / Vendor</td><td>Manday / จำนวน</td><td>Rate / ต้นทุนต่อหน่วย</td><td>เดือน</td><td>มูลค่า</td><td>ต้นทุน</td><td>หมายเหตุ / เหตุผล</td><td /></tr>
          <tr><td class="rh">13</td><td colspan="11" class="note">ลาก ⠿ เพื่อสลับแถว · ต้นทุนคำนวณตามสูตรของหมวด</td></tr>
          <tr v-for="(i, k) in cs.items" :key="i.id" :class="{ dragging: dragFrom === k, bad: err(`item${k}`) }" @dragover.prevent @drop="dropAt(k)">
            <td class="rh">{{ rowNo(k) }}</td>
            <td class="c"><span v-if="!readonly" class="grip" draggable="true" :aria-label="`ลากเพื่อย้ายแถว ${k + 1}`" @dragstart="dragFrom = k">⠿</span><span v-else>{{ k + 1 }}</span></td>
            <td class="in"><select :value="i.category" :aria-label="`หมวดแถว ${k + 1}`" :disabled="readonly" @change="changeCat(i, ($event.target as HTMLSelectElement).value as CostCategory)" @focus="pick(`B${rowNo(k)}`, COST_CATEGORIES[i.category].label)"><option v-for="(c, key) in COST_CATEGORIES" :key="key" :value="key">{{ c.label }}</option></select></td>
            <td class="in"><input v-model="i.description" :aria-label="`รายการแถว ${k + 1}`" :placeholder="i.category === 'subcontract' ? 'ผู้รับเหมา / ขอบเขต' : 'รายการ'" :disabled="readonly" @focus="pick(`C${rowNo(k)}`, i.description)" /></td>
            <td class="in">
              <select v-if="i.category === 'manpower'" v-model="i.role" aria-label="Role" :disabled="readonly" @focus="pick(`D${rowNo(k)}`, i.role ?? '')"><option v-for="r in ROLES_MD" :key="r">{{ r }}</option></select>
              <input v-else-if="i.category === 'hardware'" v-model="i.vendor" aria-label="Vendor" placeholder="Vendor" :disabled="readonly" />
              <span v-else class="na" />
            </td>
            <td class="in">
              <input v-if="i.category === 'manpower'" v-model.number="i.manday" type="number" min="0" :aria-label="`Manday แถว ${k + 1}`" :disabled="readonly" @focus="pick(`E${rowNo(k)}`, i.manday ?? 0)" />
              <input v-else-if="i.category === 'hardware' || i.category === 'software'" v-model.number="i.qty" type="number" min="0" :aria-label="`จำนวนแถว ${k + 1}`" :disabled="readonly" @focus="pick(`E${rowNo(k)}`, i.qty ?? 0)" />
              <span v-else class="na" />
            </td>
            <td class="in">
              <input v-if="i.category === 'manpower'" v-model.number="i.rate" type="number" min="0" :aria-label="`Rate แถว ${k + 1}`" :disabled="readonly" @focus="pick(`F${rowNo(k)}`, i.rate ?? 0)" />
              <input v-else-if="['hardware', 'software', 'cloud', 'ma'].includes(i.category)" v-model.number="i.unitCost" type="number" min="0" :aria-label="`ต้นทุนต่อหน่วยแถว ${k + 1}`" :disabled="readonly" @focus="pick(`F${rowNo(k)}`, i.unitCost ?? 0)" />
              <span v-else class="na" />
            </td>
            <td class="in">
              <input v-if="['software', 'cloud', 'ma'].includes(i.category)" v-model.number="i.months" type="number" min="0" :aria-label="`เดือนแถว ${k + 1}`" :disabled="readonly" @focus="pick(`G${rowNo(k)}`, i.months ?? 0)" />
              <span v-else class="na" />
            </td>
            <td class="in">
              <input v-if="['subcontract', 'other'].includes(i.category)" v-model.number="i.amount" type="number" min="0" :aria-label="`มูลค่าแถว ${k + 1}`" :disabled="readonly" @focus="pick(`H${rowNo(k)}`, i.amount ?? 0)" />
              <span v-else class="na" />
            </td>
            <td class="fm num" tabindex="0" @click="pick(`I${rowNo(k)}`, formulaOf(i, k))" @focus="pick(`I${rowNo(k)}`, formulaOf(i, k))">{{ baht(itemCost(i)) }}</td>
            <td class="in"><input v-model="i.note" aria-label="หมายเหตุ" placeholder="เช่น ใช้ subscription ที่มีอยู่แล้ว" :disabled="readonly" @focus="pick(`J${rowNo(k)}`, i.note ?? '')" /></td>
            <td class="c"><button v-if="!readonly" class="del" :aria-label="`ลบแถว ${k + 1}`" @click="cs.items.splice(k, 1)"><Icon name="x" :size="13" /></button></td>
          </tr>
          <tr v-if="err('items') || cs.items.some((_, k) => err(`item${k}`))"><td class="rh">·</td><td colspan="11" class="msg">{{ err('items') || cs.items.map((_, k) => err(`item${k}`)).find(Boolean) }}</td></tr>
          <tr><td class="rh">{{ lastRow + 1 }}</td><td colspan="11" /></tr>
          <tr v-for="c in catTotals" :key="c.k" class="cat"><td class="rh">·</td><td colspan="7" /><td class="lbl r">รวม {{ COST_CATEGORIES[c.k].label.split(' (')[0] }}</td><td class="fm num" @click="pick('', `=SUMIF(B${FIRST}:B${lastRow},&quot;${COST_CATEGORIES[c.k].label.split(' (')[0]}&quot;,I${FIRST}:I${lastRow})`)">{{ baht(c.v) }}</td><td colspan="2" /></tr>
          <template v-if="t">
            <tr class="sum"><td class="rh">{{ sumRow }}</td><td colspan="7" /><td class="lbl r">COGS (ต้นทุนรวม)</td><td class="fm num b" @click="pick(`I${sumRow}`, `=SUM(I${FIRST}:I${lastRow})`)">{{ baht(t.cogs) }}</td><td colspan="2" /></tr>
            <tr class="sum"><td class="rh">{{ sumRow + 1 }}</td><td colspan="7" /><td class="lbl r">Total Manday</td><td class="fm num" @click="pick(`I${sumRow + 1}`, `=SUMIF(B${FIRST}:B${lastRow},&quot;Manpower&quot;,E${FIRST}:E${lastRow})`)">{{ t.manday }}</td><td colspan="2" /></tr>
            <tr class="sum"><td class="rh">{{ sumRow + 2 }}</td><td colspan="7" /><td class="lbl r">ราคาขาย (Revenue ก่อน VAT)</td><td class="in"><input id="rv" v-model.number="cs.revenue" type="number" min="0" class="num" aria-label="ราคาขาย (Revenue ก่อน VAT)" :disabled="readonly" @focus="pick(`I${sumRow + 2}`, cs.revenue)" /></td><td colspan="2" class="small muted">กรอก หรือดึงจาก Quotation หลังหักส่วนลด</td></tr>
            <tr class="sum"><td class="rh">{{ sumRow + 3 }}</td><td colspan="7" /><td class="lbl r">Gross Profit</td><td class="fm num" :class="{ neg: t.gp < 0 }" @click="pick(`I${sumRow + 3}`, `=I${sumRow + 2}-I${sumRow}`)">{{ baht(t.gp) }}</td><td colspan="2" /></tr>
            <tr class="sum"><td class="rh">{{ sumRow + 4 }}</td><td colspan="7" /><td class="lbl r">Gross Margin %</td><td class="fm num" :class="v.warn.gm ? 'warn' : 'good'" @click="pick(`I${sumRow + 4}`, `=I${sumRow + 3}/I${sumRow + 2}*100`)">{{ t.gmPct }}%</td><td colspan="2" class="small" :class="{ warn: v.warn.gm }">{{ v.warn.gm }}</td></tr>
            <tr class="sum"><td class="rh">{{ sumRow + 5 }}</td><td colspan="6" /><td class="in"><select v-model="cs.entertainment.mode" aria-label="หน่วย Entertainment" :disabled="readonly"><option value="pct">% Rev</option><option value="baht">บาท</option></select></td><td class="lbl r">Entertainment</td><td class="in"><input v-model.number="cs.entertainment.value" type="number" min="0" class="num" aria-label="Entertainment" :disabled="readonly" @focus="pick(`I${sumRow + 5}`, cs.entertainment.mode === 'pct' ? `=I${sumRow + 2}*${cs.entertainment.value}%` : cs.entertainment.value)" /></td><td class="small muted" colspan="2">= {{ baht(t.entertainment) }}</td></tr>
            <tr class="sum"><td class="rh">{{ sumRow + 6 }}</td><td colspan="6" /><td class="in"><select v-model="cs.contingency.mode" aria-label="หน่วย Contingency" :disabled="readonly"><option value="pct">% COGS</option><option value="baht">บาท</option></select></td><td class="lbl r">Contingency</td><td class="in"><input v-model.number="cs.contingency.value" type="number" min="0" class="num" aria-label="Contingency" :disabled="readonly" @focus="pick(`I${sumRow + 6}`, cs.contingency.mode === 'pct' ? `=I${sumRow}*${cs.contingency.value}%` : cs.contingency.value)" /></td><td class="small muted" colspan="2">= {{ baht(t.contingency) }} · แยกบรรทัด ไม่บวกใน Manday</td></tr>
            <tr class="sum tot"><td class="rh">{{ sumRow + 7 }}</td><td colspan="7" /><td class="lbl r">Contribution Margin</td><td class="fm num b" @click="pick(`I${sumRow + 7}`, `=I${sumRow + 3}-I${sumRow + 5}-I${sumRow + 6}`)">{{ baht(t.cm) }}</td><td colspan="2" /></tr>
            <tr class="sum tot"><td class="rh">{{ sumRow + 8 }}</td><td colspan="7" /><td class="lbl r">Contribution Margin %</td><td class="fm num b" @click="pick(`I${sumRow + 8}`, `=I${sumRow + 7}/I${sumRow + 2}*100`)">{{ t.cmPct }}%</td><td colspan="2" /></tr>
            <tr v-if="t.revenue < t.cogs" :class="{ bad: err('lossReason') }"><td class="rh">{{ sumRow + 9 }}</td><td colspan="2" /><td class="lbl">เหตุผลที่ขาดทุน</td><td colspan="6" class="in"><input v-model="cs.lossReason" aria-label="เหตุผลที่ขาดทุน" :disabled="readonly" /></td><td colspan="2" class="msg">{{ err('lossReason') }}</td></tr>
          </template>
        </tbody>
      </table>
    </div>
    <footer class="xtabs">
      <span class="tab on">Cost Sheet</span>
      <router-link v-if="existing" :to="`/projects/${p.id}/quotation/new?cs=${cs.id}`" class="tab">Quotation</router-link>
      <span class="tab off" title="ระบบอ่าน Named range จากชีตนี้ตอนบันทึก">Summary (Named ranges)</span>
      <span class="sp" />
      <span class="small">COGS {{ baht(t?.cogs ?? 0) }} · GM {{ t?.gmPct }}% · CM {{ t?.cmPct }}%</span>
    </footer>
  </div>
  <div v-else class="page"><h1>{{ p ? 'ไม่มีสิทธิ์เปิด Cost Sheet' : 'ไม่พบโครงการ' }}</h1><p class="muted">Cost Sheet มีต้นทุนภายใน — เปิดได้เฉพาะ Owner, SM, ผู้อนุมัติ และผู้บริหาร</p><router-link to="/projects">กลับไปทะเบียนโครงการ</router-link></div>
</template>

<style scoped>
.xl { display: flex; flex-direction: column; height: calc(100vh - 60px); background: #fff; color: #1f1f1f; font-family: 'Segoe UI', var(--font); }
.xbar { display: flex; align-items: center; gap: 12px; background: #107c41; color: #fff; padding: 8px 16px; }
.xback { color: #fff; display: inline-flex; padding: 6px; border-radius: 4px; }
.xback:hover { background: rgb(255 255 255 / 0.15); }
.xlogo { width: 26px; height: 26px; border-radius: 4px; background: #fff; color: #107c41; font-weight: 700; display: grid; place-items: center; font-size: 15px; }
.xfile { display: grid; line-height: 1.3; min-width: 0; }
.xfile strong { font-weight: 600; font-size: 14px; }
.xfile span { font-size: 12px; opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sp { flex: 1; }
.xuser { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; }
.av { width: 26px; height: 26px; border-radius: 50%; background: #0b5a2f; display: grid; place-items: center; font-size: 11px; font-weight: 600; }
.xribbon { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border-bottom: 1px solid #e1dfdd; background: #f8f8f8; flex-wrap: wrap; }
.rb { display: inline-flex; align-items: center; gap: 6px; border: 1px solid transparent; background: none; border-radius: 4px; padding: 6px 10px; font: 14px var(--font); color: #1f1f1f; cursor: pointer; min-height: 34px; }
.rb:hover { background: #e9e9e9; }
.rb.strong { background: #107c41; color: #fff; }
.rb.strong:hover { background: #0e6b38; }
.sep { width: 1px; height: 22px; background: #d2d0ce; margin: 0 4px; }
.add { position: relative; }
.menu { position: absolute; z-index: 10; top: 38px; left: 0; display: grid; background: #fff; border: 1px solid #d2d0ce; border-radius: 6px; box-shadow: var(--shadow-pop); padding: 4px; min-width: 260px; }
.mi { text-align: left; border: 0; background: none; padding: 8px 10px; font: 14px var(--font); border-radius: 4px; cursor: pointer; }
.mi:hover { background: #f0f6f2; }
.xro { display: flex; gap: 8px; align-items: center; padding: 6px 16px; background: #fff4ce; color: #6b5300; font-size: 13px; }
.fbar { display: flex; align-items: center; border-bottom: 1px solid #e1dfdd; font-size: 13px; min-height: 30px; }
.nb { width: 80px; padding: 0 10px; border-right: 1px solid #e1dfdd; font-weight: 600; }
.fx { padding: 0 10px; color: #605e5c; font-style: italic; border-right: 1px solid #e1dfdd; }
.fv { padding: 0 10px; font-family: Consolas, monospace; color: #1f1f1f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sheet { flex: 1; overflow: auto; background: #fff; }
table { border-collapse: collapse; table-layout: fixed; font-size: 13px; width: 1242px; }
col.rn { width: 44px; }
thead th { position: sticky; top: 0; z-index: 2; background: #f3f2f1; color: #605e5c; font-weight: 400; border: 1px solid #e1dfdd; height: 22px; text-align: center; }
td { border: 1px solid #e8e8e8; height: 30px; padding: 0 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
td.rh { position: sticky; left: 0; z-index: 1; background: #f3f2f1; color: #605e5c; text-align: center; padding: 0; border-color: #e1dfdd; }
.title { font-size: 18px; font-weight: 700; color: #107c41; height: 40px; }
.note { color: #605e5c; font-size: 12px; }
.lbl { color: #323130; font-weight: 600; }
.r { text-align: right; }
.c { text-align: center; }
td.ro { background: #f3f2f1; color: #323130; cursor: default; }
td.in { padding: 0; background: #fff; }
td.in input, td.in select { width: 100%; height: 29px; border: 0; padding: 0 6px; font: inherit; background: transparent; color: inherit; }
td.in input:focus, td.in select:focus { outline: 2px solid #107c41; outline-offset: -2px; background: #fff; }
td.in input:disabled, td.in select:disabled { color: #323130; opacity: 1; }
td.in input[type='number'], td.in input.num { text-align: right; }
.na { display: block; height: 29px; background: repeating-linear-gradient(135deg, #fafafa, #fafafa 4px, #f2f2f2 4px, #f2f2f2 8px); }
td.fm { background: #eef6fc; text-align: right; cursor: cell; }
td.fm:focus { outline: 2px solid #107c41; outline-offset: -2px; }
.hd td { background: #107c41; color: #fff; font-weight: 600; font-size: 12px; }
.hd td.rh { background: #f3f2f1; color: #605e5c; font-weight: 400; }
.b { font-weight: 700; }
.tot td.lbl, .tot td.fm { background: #dff1e6; }
.good { color: #107c41; } .warn { color: #9a6700; } .neg { color: #c4382f; }
.bad td.in { box-shadow: inset 0 0 0 1px #c4382f; }
.msg { color: #c4382f; font-size: 12px; }
.grip { cursor: grab; color: #8a8886; font-size: 16px; user-select: none; }
.dragging { opacity: 0.5; }
.del { border: 0; background: none; color: #8a8886; cursor: pointer; padding: 4px; border-radius: 4px; }
.del:hover { background: #fde7e9; color: #c4382f; }
.xtabs { display: flex; align-items: center; gap: 2px; border-top: 1px solid #e1dfdd; background: #f3f2f1; padding: 0 12px; min-height: 34px; font-size: 13px; }
.tab { padding: 6px 14px; color: #323130; border-radius: 0 0 4px 4px; }
.tab.on { background: #fff; color: #107c41; font-weight: 600; border-bottom: 2px solid #107c41; }
.tab.off { color: #8a8886; }
a.tab:hover { background: #e9e9e9; text-decoration: none; }
@media (max-width: 640px) { .xfile span, .xuser { display: none; } .xbar { padding: 8px; } }
</style>
