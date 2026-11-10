<script setup lang="ts">
// Cost Sheet form (Template spec §3, §5.2): header from the project (read-only), cost rows by
// category with inline edit and drag to reorder, a sticky summary that recalculates as you type,
// and Draft / Save & create Quotation / Export. Approved or pending revisions are read-only.
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
  saveCostSheet(p.value!, cs.value!)
  notify(`บันทึก ${cs.value!.docNo} rev.${cs.value!.revision} แบบร่างแล้ว`)
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
const catTotals = computed(() => (t.value ? (Object.keys(COST_CATEGORIES) as CostCategory[]).filter((k) => t.value!.byCategory[k]).map((k) => ({ k, v: t.value!.byCategory[k] })) : []))
</script>

<template>
  <div v-if="p && cs && canSeeCost(p)" class="page csf">
    <router-link :to="`/projects/${p.id}?tab=cost`" class="back small">‹ {{ p.name }} · Cost Sheet และใบเสนอราคา</router-link>
    <header class="top">
      <div>
        <h1>Cost Sheet <span class="num">{{ cs.docNo }}</span> <span class="rev">rev.{{ cs.revision }}</span></h1>
        <p class="muted">เอกสารภายใน — สรุปต้นทุนและกำไรของโครงการ · ผู้อนุมัติอ่าน</p>
      </div>
      <span class="chip" :class="DOC_STATUS[cs.status].tone">{{ DOC_STATUS[cs.status].label }}</span>
    </header>
    <div v-if="readonly && p" class="ro" role="status">
      <Icon name="lock" :size="16" />
      <span v-if="cs.status === 'APPROVED'">ไฟล์นี้อนุมัติแล้ว แก้ไม่ได้ — กดแก้จะสร้าง revision ใหม่</span>
      <span v-else-if="cs.status === 'PENDING'">อยู่ระหว่างอนุมัติ — แก้ไม่ได้จนกว่าจะได้ผล</span>
      <span v-else-if="!isOwner(p)">เปิดดูอย่างเดียว</span>
      <span v-else>เอกสารถูก {{ DOC_STATUS[cs.status].label }} — สร้าง revision ใหม่เพื่อแก้แล้วส่งอีกครั้ง</span>
      <button v-if="isOwner(p) && existing && cs.status !== 'PENDING'" class="btn sm" @click="newRev">สร้าง revision ใหม่</button>
    </div>

    <div class="layout">
      <div class="body">
        <section class="panel">
          <h2>ข้อมูลโครงการ</h2>
          <dl class="hdr">
            <dt>ชื่อโปรเจกต์</dt><dd>{{ p.name }}</dd>
            <dt>ลูกค้า / End User</dt><dd>{{ account(p.customerAccountId)?.name ?? p.customer }} / {{ account(p.endUserAccountId)?.name ?? p.endUser }}</dd>
            <dt>Profit Center (BU)</dt><dd>{{ p.team }} · {{ teamOf(p.team)?.name }}</dd>
            <dt>Project Type</dt><dd>{{ p.type }}</dd>
            <dt>AE / SM</dt><dd>{{ p.sales.join(', ') || '—' }} / {{ person(p.sm)?.name }}</dd>
            <dt>วันที่จัดทำ</dt><dd>{{ thDate(cs.preparedAt) }}</dd>
          </dl>
          <div class="row2">
            <div class="field" :class="{ bad: err('projectMonths') }"><label for="pm">ระยะเวลาโครงการ (เดือน)</label><input id="pm" v-model.number="cs.projectMonths" type="number" min="1" class="input num" :disabled="readonly" /><span v-if="err('projectMonths')" class="msg">{{ err('projectMonths') }}</span></div>
            <div class="field"><label for="mm">ระยะรับประกัน / MA (เดือน)</label><input id="mm" v-model.number="cs.maMonths" type="number" min="0" class="input num" :disabled="readonly" /></div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head"><h2>รายการต้นทุน</h2><span class="muted small">เลือกหมวดก่อน ระบบเปิดช่องตามหมวด · ลาก ⠿ เพื่อสลับแถว</span></div>
          <div class="scroll-x">
            <table class="table items">
              <thead><tr><th /><th>หมวด</th><th>รายการ / รายละเอียด</th><th class="r">ต้นทุน</th><th>หมายเหตุ / เหตุผล</th><th /></tr></thead>
              <tbody>
                <tr v-for="(i, k) in cs.items" :key="i.id" :class="{ dragging: dragFrom === k }" @dragover.prevent @drop="dropAt(k)">
                  <td class="h"><span v-if="!readonly" class="grip" draggable="true" :aria-label="`ลากเพื่อย้ายแถว ${k + 1}`" @dragstart="dragFrom = k">⠿</span></td>
                  <td><select :value="i.category" class="input mini" :aria-label="`หมวดแถว ${k + 1}`" :disabled="readonly" @change="changeCat(i, ($event.target as HTMLSelectElement).value as CostCategory)"><option v-for="(c, key) in COST_CATEGORIES" :key="key" :value="key">{{ c.label }}</option></select></td>
                  <td>
                    <div class="flds">
                      <input v-model="i.description" class="input mini wide" :placeholder="i.category === 'subcontract' ? 'ผู้รับเหมา / ขอบเขต' : 'รายการ'" :aria-label="`รายการแถว ${k + 1}`" :disabled="readonly" />
                      <template v-if="i.category === 'manpower'">
                        <select v-model="i.role" class="input mini" aria-label="Role" :disabled="readonly"><option v-for="r in ROLES_MD" :key="r">{{ r }}</option></select>
                        <label class="f">Manday<input v-model.number="i.manday" type="number" min="0" class="input mini num" :disabled="readonly" /></label>
                        <label class="f">Rate/MD<input v-model.number="i.rate" type="number" min="0" class="input mini num" :disabled="readonly" /></label>
                      </template>
                      <template v-else-if="i.category === 'hardware'">
                        <label class="f">จำนวน<input v-model.number="i.qty" type="number" min="0" class="input mini num" :disabled="readonly" /></label>
                        <label class="f">ต้นทุน/หน่วย<input v-model.number="i.unitCost" type="number" min="0" class="input mini num" :disabled="readonly" /></label>
                        <label class="f">Vendor<input v-model="i.vendor" class="input mini" :disabled="readonly" /></label>
                      </template>
                      <template v-else-if="i.category === 'software'">
                        <label class="f">จำนวน<input v-model.number="i.qty" type="number" min="0" class="input mini num" :disabled="readonly" /></label>
                        <label class="f">ต้นทุน/หน่วย/เดือน<input v-model.number="i.unitCost" type="number" min="0" class="input mini num" :disabled="readonly" /></label>
                        <label class="f">เดือน<input v-model.number="i.months" type="number" min="0" class="input mini num" :disabled="readonly" /></label>
                      </template>
                      <template v-else-if="i.category === 'cloud' || i.category === 'ma'">
                        <label class="f">{{ i.category === 'ma' ? 'ต้นทุน/เดือน' : 'ค่าใช้จ่าย/เดือน' }}<input v-model.number="i.unitCost" type="number" min="0" class="input mini num" :disabled="readonly" /></label>
                        <label class="f">เดือน<input v-model.number="i.months" type="number" min="0" class="input mini num" :disabled="readonly" /></label>
                      </template>
                      <template v-else>
                        <label class="f">มูลค่า<input v-model.number="i.amount" type="number" min="0" class="input mini num" :disabled="readonly" /></label>
                      </template>
                    </div>
                    <span v-if="err(`item${k}`)" class="msg">{{ err(`item${k}`) }}</span>
                    <span class="formula small muted">{{ COST_CATEGORIES[i.category].formula }}</span>
                  </td>
                  <td class="r num">{{ baht(itemCost(i)) }}</td>
                  <td><input v-model="i.note" class="input mini" placeholder="เช่น ใช้ subscription ที่มีอยู่แล้ว" aria-label="หมายเหตุ" :disabled="readonly" /></td>
                  <td><button v-if="!readonly" class="btn ghost sm" :aria-label="`ลบแถว ${k + 1}`" @click="cs.items.splice(k, 1)"><Icon name="x" :size="14" /></button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <span v-if="err('items')" class="msg">{{ err('items') }}</span>
          <div v-if="!readonly" class="add">
            <button class="btn sm" :aria-expanded="addOpen" @click="addOpen = !addOpen">+ เพิ่มรายการ</button>
            <div v-if="addOpen" class="menu" role="menu"><button v-for="(c, key) in COST_CATEGORIES" :key="key" role="menuitem" class="btn ghost sm" @click="addRow(key)">{{ c.label }}</button></div>
          </div>
        </section>
      </div>

      <aside class="sum panel" aria-live="polite">
        <h2>สรุปต้นทุนและกำไร</h2>
        <p class="small muted">คำนวณอัตโนมัติ — ไม่ต้องพิมพ์เอง</p>
        <ul class="cats"><li v-for="c in catTotals" :key="c.k"><span>{{ COST_CATEGORIES[c.k].label.split(' (')[0] }}</span><b class="num">{{ baht(c.v) }}</b></li></ul>
        <dl v-if="t">
          <dt>COGS (ต้นทุนรวม)</dt><dd class="num">{{ baht(t.cogs) }}</dd>
          <dt>Total Manday</dt><dd class="num">{{ t.manday }}</dd>
          <dt><label for="rv">ราคาขาย (Revenue ก่อน VAT)</label></dt>
          <dd><input id="rv" v-model.number="cs.revenue" type="number" min="0" class="input mini num" :disabled="readonly" /></dd>
          <dt>Gross Profit</dt><dd class="num" :class="t.gp < 0 ? 'bad' : ''">{{ baht(t.gp) }}</dd>
          <dt>Gross Margin %</dt><dd class="num" :class="v.warn.gm ? 'warn' : 'good'">{{ t.gmPct }}%</dd>
          <dt>Entertainment <span class="small">(% ของ Revenue)</span></dt>
          <dd class="mx"><input v-model.number="cs.entertainment.value" type="number" min="0" class="input mini num" aria-label="Entertainment" :disabled="readonly" /><select v-model="cs.entertainment.mode" class="input mini" aria-label="หน่วย Entertainment" :disabled="readonly"><option value="pct">%</option><option value="baht">บาท</option></select></dd>
          <dt>Contingency <span class="small">(% ของ COGS)</span></dt>
          <dd class="mx"><input v-model.number="cs.contingency.value" type="number" min="0" class="input mini num" aria-label="Contingency" :disabled="readonly" /><select v-model="cs.contingency.mode" class="input mini" aria-label="หน่วย Contingency" :disabled="readonly"><option value="pct">%</option><option value="baht">บาท</option></select></dd>
          <dt>Contribution Margin</dt><dd class="num strong">{{ baht(t.cm) }}</dd>
          <dt>Contribution Margin %</dt><dd class="num strong">{{ t.cmPct }}%</dd>
        </dl>
        <p v-if="v.warn.gm" class="warnbox small">{{ v.warn.gm }}</p>
        <div v-if="t && t.revenue < t.cogs" class="field" :class="{ bad: err('lossReason') }"><label for="lr">เหตุผลที่ขาดทุน</label><textarea id="lr" v-model="cs.lossReason" class="input" rows="2" :disabled="readonly" /><span v-if="err('lossReason')" class="msg">{{ err('lossReason') }}</span></div>
        <p class="small muted">Entertainment / Contingency แยกบรรทัด ไม่บวกใน Manday · หลังอนุมัติ ระบบเขียน Revenue · COGS · GP · CM กลับไปที่โครงการ</p>
        <div class="foot">
          <router-link :to="`/projects/${p.id}?tab=cost`" class="btn">ยกเลิก</router-link>
          <button class="btn" @click="exportXls">ส่งออก Excel</button>
          <template v-if="!readonly">
            <button class="btn" @click="save('stay')">บันทึกแบบร่าง</button>
            <button class="btn primary" @click="save('quote')">บันทึกและสร้าง Quotation</button>
          </template>
        </div>
      </aside>
    </div>
  </div>
  <div v-else class="page"><h1>{{ p ? 'ไม่มีสิทธิ์เปิด Cost Sheet' : 'ไม่พบโครงการ' }}</h1><p class="muted">Cost Sheet มีต้นทุนภายใน — เปิดได้เฉพาะ Owner, SM, ผู้อนุมัติ และผู้บริหาร</p><router-link to="/projects">กลับไปทะเบียนโครงการ</router-link></div>
</template>

<style scoped>
.back { display: inline-block; margin-bottom: 12px; color: var(--muted); }
.top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.top h1 { margin: 0; font-size: 26px; }
.rev { color: var(--muted); font-weight: 400; }
.top p { margin: 4px 0 0; }
.ro { display: flex; gap: 10px; align-items: center; padding: 10px 14px; border-radius: var(--r-md); background: var(--warn-soft); color: var(--warn); margin-bottom: 16px; flex-wrap: wrap; }
.layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; align-items: start; }
.body { display: grid; gap: 20px; min-width: 0; }
.panel h2 { font-size: 18px; margin: 0 0 12px; }
.hdr { display: grid; grid-template-columns: 160px 1fr; gap: 6px 16px; margin: 0 0 14px; }
.hdr dt { color: var(--muted); }
.hdr dd { margin: 0; }
.row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.items td { vertical-align: top; }
.items .mini { min-height: 34px; font-size: 14px; }
.items td:nth-child(2) select { min-width: 190px; }
.flds { display: flex; flex-wrap: wrap; gap: 6px; align-items: flex-end; }
.flds .wide { flex: 1 1 200px; }
.f { display: grid; gap: 2px; font-size: 12px; color: var(--muted); }
.f .input { width: 120px; }
.formula { display: block; margin-top: 4px; }
.h { width: 24px; }
.grip { cursor: grab; color: var(--muted); font-size: 18px; user-select: none; }
.dragging { opacity: 0.5; }
.r { text-align: right; white-space: nowrap; }
.add { position: relative; margin-top: 10px; }
.menu { position: absolute; z-index: 5; top: 40px; left: 0; display: grid; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); box-shadow: var(--shadow-pop); padding: 6px; min-width: 260px; }
.menu .btn { justify-content: flex-start; }
.sum { position: sticky; top: 80px; display: grid; gap: 10px; }
.sum h2 { margin: 0; }
.sum p { margin: 0; }
.cats { list-style: none; margin: 0; padding: 0 0 8px; border-bottom: 1px solid var(--line); display: grid; gap: 2px; font-size: 13px; }
.cats li { display: flex; justify-content: space-between; gap: 8px; color: var(--ink-2); }
.sum dl { display: grid; grid-template-columns: 1fr auto; gap: 8px 12px; margin: 0; align-items: center; }
.sum dt { color: var(--muted); font-size: 14px; }
.sum dd { margin: 0; text-align: right; }
.sum dd .input { width: 140px; }
.mx { display: flex; gap: 4px; justify-content: flex-end; }
.mx .input { width: 86px !important; }
.strong { font-weight: 600; font-size: 16px; }
.good { color: var(--win); } .warn { color: var(--warn); } .bad { color: var(--lose); }
.warnbox { background: var(--warn-soft); color: var(--warn); padding: 8px 10px; border-radius: var(--r-sm); }
.msg { font-size: 12px; color: var(--lose); display: block; }
.bad .input { border-color: var(--lose); }
.foot { display: flex; flex-wrap: wrap; gap: 8px; border-top: 1px solid var(--line); padding-top: 12px; }
@media (max-width: 1100px) { .layout { grid-template-columns: 1fr; } .sum { position: static; } }
@media (max-width: 560px) { .hdr { grid-template-columns: 1fr; } .row2 { grid-template-columns: 1fr; } }
</style>
