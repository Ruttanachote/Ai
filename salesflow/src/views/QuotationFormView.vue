<script setup lang="ts">
// Quotation form (Template spec §4, §5.3): built from a Cost Sheet revision, lines prefilled so the
// subtotal equals the Cost Sheet revenue, price summary with VAT 7% and baht text, payment terms
// that must add up to 100%, and a PDF preview before saving.
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'
import Dialog from '../components/Dialog.vue'
import { DOC_STATUS, type Quotation } from '../data/model'
import { account, baht, person } from '../data/mock'
import { projects, notify } from '../store'
import { QT_UNITS, costTotals, linesFromCostSheet, quoteTotals, validateQuotation } from '../domain/salesdocs'
import { bahtText } from '../domain/quotation'
import { blankQuotation, isOwner, saveQuotation } from '../docstore'
import { quoteHtml } from '../components/docs/quoteHtml'

const props = defineProps<{ id: string; qid: string }>()
const route = useRoute()
const router = useRouter()
const p = computed(() => projects.find((x) => x.id === props.id))
const existing = computed(() => p.value?.quotations?.find((q) => q.id === props.qid))
const sheets = computed(() => (p.value?.costSheets ?? []).filter((c) => c.status !== 'CANCELLED').slice().sort((a, b) => b.revision - a.revision))
const startCs = (route.query.cs as string) || sheets.value[0]?.id
const q = ref<Quotation | null>(p.value ? (existing.value ? JSON.parse(JSON.stringify(existing.value)) : sheets.value.length ? blankQuotation(p.value, sheets.value.find((c) => c.id === startCs) ?? sheets.value[0]) : null) : null)
const cs = computed(() => p.value?.costSheets?.find((c) => c.id === q.value?.costSheetId))
const readonly = computed(() => !p.value || !isOwner(p.value) || (q.value?.status ?? 'DRAFT') !== 'DRAFT')
const t = computed(() => (q.value ? quoteTotals(q.value) : null))
const csRevenue = computed(() => (cs.value ? costTotals(cs.value).revenue : undefined))
const v = computed(() => (q.value ? validateQuotation(q.value, csRevenue.value) : { errors: {}, warn: {} }))
const tried = ref(false)
const err = (k: string) => (tried.value ? (v.value.errors as Record<string, string>)[k] : '')
const contacts = computed(() => (p.value?.stakeholders ?? []).filter((s) => s.side === 'customer'))
const contactName = computed(() => contacts.value.find((c) => c.id === q.value?.contact)?.name ?? q.value?.contact ?? '')
const cust = computed(() => account(p.value?.customerAccountId))

function changeCs(id: string) {
  const c = p.value?.costSheets?.find((x) => x.id === id)
  if (!c || !q.value) return
  q.value.costSheetId = id
  q.value.items = linesFromCostSheet(c).map((l, i) => ({ id: `r${Date.now()}${i}`, ...l }))
  notify('เติมรายการราคาใหม่จาก Cost Sheet ที่เลือกแล้ว', 'info')
}
let n = 1
const addLine = () => q.value!.items.push({ id: `n${Date.now()}${n++}`, description: '', qty: 1, unit: 'งาน', unitPrice: 0 })
const addTerm = () => q.value!.terms.push({ no: q.value!.terms.length + 1, pct: 0, condition: '' })
function delTerm(k: number) { q.value!.terms.splice(k, 1); q.value!.terms.forEach((x, i) => (x.no = i + 1)) }
function save() {
  tried.value = true
  if (Object.keys(v.value.errors).length) { notify('ยังมีช่องที่ต้องแก้ — ดูข้อความใต้ช่อง', 'warning'); return }
  saveQuotation(p.value!, q.value!)
  notify(`บันทึก ${q.value!.docNo} rev.${q.value!.revision} แบบร่างแล้ว`)
  router.push(`/projects/${props.id}?tab=cost`)
}
const pdf = ref(false)
const html = computed(() => (p.value && q.value ? quoteHtml(p.value, q.value, contactName.value) : ''))
const frame = ref<HTMLIFrameElement | null>(null)
</script>

<template>
  <div v-if="p && q" class="page qf">
    <router-link :to="`/projects/${p.id}?tab=cost`" class="back small">‹ {{ p.name }} · Cost Sheet และใบเสนอราคา</router-link>
    <header class="top">
      <div><h1>Quotation <span class="num">{{ q.docNo }}</span> <span class="rev">rev.{{ q.revision }}</span></h1><p class="muted">ใบเสนอราคาที่ส่งลูกค้า — ราคาสุทธิก่อน VAT ต้องตรงกับ Revenue ใน Cost Sheet</p></div>
      <span class="chip" :class="DOC_STATUS[q.status].tone">{{ DOC_STATUS[q.status].label }}</span>
    </header>
    <p v-if="readonly" class="ro"><Icon name="lock" :size="16" /> {{ q.status === 'APPROVED' ? 'ไฟล์นี้อนุมัติแล้ว แก้ไม่ได้ — สร้าง revision ใหม่จาก Cost Sheet' : q.status === 'PENDING' ? 'อยู่ระหว่างอนุมัติ' : 'เปิดดูอย่างเดียว' }}</p>

    <div class="layout">
      <div class="body">
        <section class="panel">
          <h2>ข้อมูลใบเสนอราคา</h2>
          <div class="g2">
            <div class="field"><label for="qcs">อ้างอิง Cost Sheet</label><select id="qcs" :value="q.costSheetId" class="input" :disabled="readonly" @change="changeCs(($event.target as HTMLSelectElement).value)"><option v-for="c in sheets" :key="c.id" :value="c.id">{{ c.docNo }} rev.{{ c.revision }} · {{ DOC_STATUS[c.status].label }} · Revenue {{ baht(costTotals(c).revenue) }}</option></select></div>
            <div class="field"><label for="qpn">ชื่อโครงการ</label><input id="qpn" v-model="q.projectName" class="input" :disabled="readonly" /></div>
            <div class="field"><label for="qid">วันที่ออก</label><input id="qid" v-model="q.issueDate" type="date" class="input" :disabled="readonly" /></div>
            <div class="field" :class="{ bad: err('validUntil') }"><label for="qvu">ยืนราคาถึง</label><input id="qvu" v-model="q.validUntil" type="date" class="input" :disabled="readonly" /><span v-if="err('validUntil')" class="msg">{{ err('validUntil') }}</span><span v-else class="hint">ค่าเริ่มต้น 30 วันจากวันที่ออก</span></div>
            <div class="field" :class="{ bad: err('contact') }">
              <label for="qct">ผู้ติดต่อลูกค้า</label>
              <select v-if="contacts.length" id="qct" v-model="q.contact" class="input" :disabled="readonly"><option :value="undefined" disabled>เลือกผู้ติดต่อ</option><option v-for="c in contacts" :key="c.id" :value="c.id">{{ c.name }} · {{ c.position }}{{ c.email ? ' · ' + c.email : '' }}</option></select>
              <input v-else id="qct" v-model="q.contact" class="input" placeholder="ชื่อ อีเมล โทร" :disabled="readonly" />
              <span v-if="err('contact')" class="msg">{{ err('contact') }}</span>
            </div>
            <div class="field"><span class="lbl">บริษัทลูกค้า</span><p class="ro2">{{ cust?.name ?? p.customer }}<span class="small muted">{{ cust?.taxId ? ' · เลขผู้เสียภาษี ' + cust.taxId : '' }}{{ cust?.province ? ' · ' + cust.province : '' }}</span></p></div>
            <div class="field"><span class="lbl">พนักงานขาย (AE)</span><p class="ro2">{{ p.sales.join(', ') || '—' }}</p></div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head"><h2>รายการราคา (Scope of Work)</h2><span class="small muted">บรรทัดแรกเป็นหัวข้อ บรรทัดถัดไปเป็นรายการย่อย</span></div>
          <div class="scroll-x">
            <table class="table li">
              <thead><tr><th>#</th><th>รายการ / ขอบเขตงาน</th><th class="r">จำนวน</th><th>หน่วย</th><th class="r">ราคา/หน่วย</th><th class="r">จำนวนเงิน</th><th /></tr></thead>
              <tbody>
                <tr v-for="(i, k) in q.items" :key="i.id">
                  <td>{{ k + 1 }}</td>
                  <td><textarea v-model="i.description" class="input mini" rows="2" :aria-label="`รายการ ${k + 1}`" :disabled="readonly" /><span v-if="err(`item${k}`)" class="msg">{{ err(`item${k}`) }}</span></td>
                  <td><input v-model.number="i.qty" type="number" min="0" class="input mini num w80" aria-label="จำนวน" :disabled="readonly" /></td>
                  <td><select v-model="i.unit" class="input mini" aria-label="หน่วย" :disabled="readonly"><option v-for="u in QT_UNITS" :key="u">{{ u }}</option></select></td>
                  <td><input v-model.number="i.unitPrice" type="number" min="0" step="0.01" class="input mini num w140" aria-label="ราคาต่อหน่วย" :disabled="readonly" /></td>
                  <td class="r num">{{ baht(Math.round((i.qty || 0) * (i.unitPrice || 0) * 100) / 100) }}</td>
                  <td><button v-if="!readonly" class="btn ghost sm" :aria-label="`ลบรายการ ${k + 1}`" @click="q.items.splice(k, 1)"><Icon name="x" :size="14" /></button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <span v-if="err('items')" class="msg">{{ err('items') }}</span>
          <button v-if="!readonly" class="btn sm add" @click="addLine">+ เพิ่มรายการ</button>
        </section>

        <section class="panel">
          <h2>เงื่อนไข</h2>
          <div class="field"><label for="qdu">ระยะเวลาดำเนินงาน</label><input id="qdu" v-model="q.duration" class="input" :disabled="readonly" /></div>
          <div class="field" :class="{ bad: err('terms') }">
            <span class="lbl">งวดการชำระเงิน</span>
            <table class="table terms"><thead><tr><th>งวด</th><th class="r">%</th><th>เงื่อนไขส่งมอบ</th><th class="r">จำนวนเงิน</th><th /></tr></thead>
              <tbody><tr v-for="(x, k) in q.terms" :key="k"><td>{{ x.no }}</td><td><input v-model.number="x.pct" type="number" min="0" max="100" class="input mini num w80" :aria-label="`เปอร์เซ็นต์งวด ${x.no}`" :disabled="readonly" /></td><td><input v-model="x.condition" class="input mini" :aria-label="`เงื่อนไขงวด ${x.no}`" :disabled="readonly" /></td><td class="r num">{{ baht(((t?.subtotal ?? 0) * (x.pct || 0)) / 100) }}</td><td><button v-if="!readonly" class="btn ghost sm" :aria-label="`ลบงวด ${x.no}`" @click="delTerm(k)"><Icon name="x" :size="14" /></button></td></tr></tbody>
              <tfoot><tr><td>รวม</td><td class="r num" :class="t?.termsPct === 100 ? 'good' : 'bad'">{{ t?.termsPct }}%</td><td colspan="3" /></tr></tfoot>
            </table>
            <span v-if="err('terms')" class="msg">{{ err('terms') }}</span>
            <button v-if="!readonly" class="btn sm add" @click="addTerm">+ เพิ่มงวด</button>
          </div>
          <div class="field"><label for="qwr">ระยะรับประกัน / SLA</label><input id="qwr" v-model="q.warranty" class="input" :disabled="readonly" /></div>
          <div class="field"><label for="qex">สิ่งที่ไม่รวมในราคา และสิ่งที่ลูกค้าต้องจัดเตรียม</label><textarea id="qex" v-model="q.exclusions" class="input" rows="2" :disabled="readonly" /></div>
          <div class="field"><label for="qrm">หมายเหตุอื่น</label><textarea id="qrm" v-model="q.remark" class="input" rows="2" :disabled="readonly" /></div>
          <p class="small muted">ผู้เสนอราคา: {{ person(p.sm)?.name }} (Solution Manager) · ผู้อนุมัติ: รองผู้บริหาร → ผู้บริหาร DT</p>
        </section>
      </div>

      <aside class="sum panel" aria-live="polite">
        <h2>สรุปราคา</h2>
        <dl v-if="t">
          <dt>ราคารวม (ราคาเต็ม)</dt><dd class="num">{{ baht(t.gross) }}</dd>
          <dt>ส่วนลดพิเศษ</dt>
          <dd class="mx"><input v-model.number="q.discount.value" type="number" min="0" class="input mini num" aria-label="ส่วนลด" :disabled="readonly" /><select v-model="q.discount.mode" class="input mini" aria-label="หน่วยส่วนลด" :disabled="readonly"><option value="baht">บาท</option><option value="pct">%</option></select></dd>
          <dt>Subtotal (ก่อน VAT)</dt><dd class="num strong">{{ baht(t.subtotal) }}</dd>
          <dt>VAT 7%</dt><dd class="num">{{ baht(t.vat) }}</dd>
          <dt>Grand Total</dt><dd class="num grand">{{ baht(t.grand) }}</dd>
        </dl>
        <span v-if="err('discount')" class="msg">{{ err('discount') }}</span>
        <p v-if="t" class="words small">({{ bahtText(t.grand) }})</p>
        <div class="cmp" :class="v.warn.match ? 'warn' : 'ok'">
          <p class="small"><b>เทียบกับ Cost Sheet</b></p>
          <p class="small">Subtotal {{ baht(t?.subtotal ?? 0) }} · Revenue {{ baht(csRevenue ?? 0) }}</p>
          <p class="small">{{ v.warn.match ? 'ไม่ตรงกัน — ปรับราคาหรือแก้ Revenue ใน Cost Sheet' : 'ตรงกัน ✓' }}</p>
        </div>
        <div class="foot">
          <router-link :to="`/projects/${p.id}?tab=cost`" class="btn">ยกเลิก</router-link>
          <button class="btn" @click="pdf = true"><Icon name="file" :size="14" /> พรีวิว PDF</button>
          <button v-if="!readonly" class="btn primary" @click="save">บันทึกแบบร่าง</button>
        </div>
      </aside>
    </div>

    <Dialog :open="pdf" :title="`พรีวิว ${q.docNo} rev.${q.revision}`" wide @close="pdf = false">
      <iframe ref="frame" class="pdf" :srcdoc="html" title="พรีวิวใบเสนอราคา" />
      <template #foot><button class="btn" @click="pdf = false">ปิด</button><button class="btn primary" @click="frame?.contentWindow?.print()">พิมพ์ / บันทึกเป็น PDF</button></template>
    </Dialog>
  </div>
  <div v-else class="page"><h1>{{ p ? 'ต้องมี Cost Sheet ก่อน' : 'ไม่พบโครงการ' }}</h1><p class="muted">Quotation สร้างจาก Cost Sheet ของโครงการเดียวกัน</p><router-link v-if="p" :to="`/projects/${p.id}/cost-sheet/new`" class="btn primary">+ Create Cost Sheet</router-link></div>
</template>

<style scoped>
.back { display: inline-block; margin-bottom: 12px; color: var(--muted); }
.top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.top h1 { margin: 0; font-size: 26px; }
.top p { margin: 4px 0 0; }
.rev { color: var(--muted); font-weight: 400; }
.ro { display: flex; gap: 10px; align-items: center; padding: 10px 14px; border-radius: var(--r-md); background: var(--warn-soft); color: var(--warn); }
.layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; align-items: start; }
.body { display: grid; gap: 20px; min-width: 0; }
.panel h2 { font-size: 18px; margin: 0 0 12px; }
.g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
.lbl { font-size: 13px; font-weight: 500; color: var(--ink-2); }
.ro2 { margin: 0; min-height: 38px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.li td, .terms td { vertical-align: top; }
.li textarea { min-width: 220px; }
.mini { min-height: 34px; font-size: 14px; }
.w80 { width: 72px; } .w140 { width: 124px; }
.r { text-align: right; white-space: nowrap; }
.add { margin-top: 8px; }
.panel > .field { margin-bottom: 12px; }
.sum { position: sticky; top: 80px; display: grid; gap: 10px; }
.sum h2 { margin: 0; }
.sum dl { display: grid; grid-template-columns: 1fr auto; gap: 8px 12px; margin: 0; align-items: center; }
.sum dt { color: var(--muted); font-size: 14px; }
.sum dd { margin: 0; text-align: right; }
.mx { display: flex; gap: 4px; justify-content: flex-end; }
.mx .input { width: 90px; }
.strong { font-weight: 600; }
.grand { font-weight: 700; font-size: 18px; color: var(--brand); }
.words { margin: 0; text-align: right; font-family: var(--desc); color: var(--ink-2); }
.cmp { border-radius: var(--r-md); padding: 10px 12px; }
.cmp p { margin: 0; }
.cmp.ok { background: var(--win-soft); color: var(--win); }
.cmp.warn { background: var(--warn-soft); color: var(--warn); }
.good { color: var(--win); } .bad { color: var(--lose); }
.msg { font-size: 12px; color: var(--lose); display: block; }
.bad .input { border-color: var(--lose); }
.foot { display: flex; flex-wrap: wrap; gap: 8px; border-top: 1px solid var(--line); padding-top: 12px; }
.pdf { width: 100%; height: 72vh; border: 1px solid var(--line); border-radius: var(--r-sm); background: #fff; }
@media (max-width: 1100px) { .layout { grid-template-columns: 1fr; } .sum { position: static; } }
@media (max-width: 640px) { .g2 { grid-template-columns: 1fr; } }
</style>
