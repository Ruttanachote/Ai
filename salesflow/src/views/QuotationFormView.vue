<script setup lang="ts">
// Quotation following the company sheet "Quotation_Template". Item lines mirror the Cost Sheet
// revenue lines (ITEM · PART NO. · Product Description · QTY. · Unit Price · Amount) exactly as the
// sheet's formulas do; the SM fills the customer block, Special Discount and Conditions.
// Total − Special Discount = Subtotal → VAT 7% → Grand Total, then a PDF preview.
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'
import Dialog from '../components/Dialog.vue'
import { DOC_STATUS, type Quotation } from '../data/model'
import { account, baht, person } from '../data/mock'
import { projects, notify } from '../store'
import { costTotals, linesFromCostSheet, paymentText, quoteTotals, validateQuotation } from '../domain/salesdocs'
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
const cust = computed(() => account(p.value?.customerAccountId))
const money = (x: number) => x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
// Lines are not typed here: they come from the Cost Sheet revenue (as in the template).
const outOfSync = computed(() => !!cs.value && JSON.stringify(linesFromCostSheet(cs.value)) !== JSON.stringify(q.value?.items.map(({ description, qty, unitPrice, partNo }) => ({ description, qty, unitPrice, partNo }))))
function pullLines() {
  if (!cs.value || !q.value) return
  q.value.items = linesFromCostSheet(cs.value).map((l, i) => ({ id: `r${Date.now()}${i}`, ...l }))
  q.value.termOfPayment = paymentText(cs.value.payments)
  notify('ดึงรายการรายได้และงวดชำระจาก Cost Sheet แล้ว', 'info')
}
function changeCs(id: string) { if (q.value) { q.value.costSheetId = id; pullLines() } }
function pickContact(id: string) {
  const c = contacts.value.find((x) => x.id === id)
  if (c && q.value) { q.value.contact = c.name; q.value.phone = c.phone; q.value.email = c.email }
}
function save() {
  tried.value = true
  if (Object.keys(v.value.errors).length) { notify('ยังมีช่องที่ต้องแก้ — ดูข้อความใต้ช่อง', 'warning'); return }
  saveQuotation(p.value!, q.value!)
  notify(`บันทึก ${q.value!.docNo} rev.${q.value!.revision} แบบร่างแล้ว`)
  router.push(`/projects/${props.id}?tab=cost`)
}
const pdf = ref(false)
const html = computed(() => (p.value && q.value ? quoteHtml(p.value, q.value) : ''))
const frame = ref<HTMLIFrameElement | null>(null)
</script>

<template>
  <div v-if="p && q" class="page qf">
    <router-link :to="`/projects/${p.id}?tab=cost`" class="back small">‹ {{ p.name }} · Cost Sheet และใบเสนอราคา</router-link>
    <header class="top">
      <div><h1>QUOTATION <span class="num">{{ q.docNo }}</span> <span class="rev">[Version Revise] : {{ q.revision }}</span></h1><p class="muted">ตาม Quotation_Template — รายการดึงจากรายได้ใน Cost Sheet · กรอกข้อมูลลูกค้า ส่วนลด และเงื่อนไข</p></div>
      <span class="chip" :class="DOC_STATUS[q.status].tone">{{ DOC_STATUS[q.status].label }}</span>
    </header>
    <p v-if="readonly" class="ro"><Icon name="lock" :size="16" /> {{ q.status === 'APPROVED' ? 'ไฟล์นี้อนุมัติแล้ว แก้ไม่ได้ — สร้าง revision ใหม่จาก Cost Sheet' : q.status === 'PENDING' ? 'อยู่ระหว่างอนุมัติ' : 'เปิดดูอย่างเดียว' }}</p>

    <div class="layout">
      <div class="body">
        <section class="panel">
          <div class="g2">
            <div class="blk">
              <h2>Customer</h2>
              <div v-if="contacts.length && !readonly" class="field"><label for="qpick">เลือกจากผู้ติดต่อของโครงการ</label><select id="qpick" class="input" @change="pickContact(($event.target as HTMLSelectElement).value)"><option value="">— เลือก —</option><option v-for="c in contacts" :key="c.id" :value="c.id">{{ c.name }} · {{ c.position }}</option></select></div>
              <div class="field" :class="{ bad: err('contact') }"><label for="qct">Name</label><input id="qct" v-model="q.contact" class="input" :disabled="readonly" /><span v-if="err('contact')" class="msg">{{ err('contact') }}</span></div>
              <div class="field"><span class="lbl">Company Name</span><p class="ro2">{{ cust?.name ?? p.customer }}</p></div>
              <div class="g2">
                <div class="field"><label for="qph">Phone/Fax</label><input id="qph" v-model="q.phone" class="input" :disabled="readonly" /></div>
                <div class="field"><label for="qem">Email</label><input id="qem" v-model="q.email" type="email" class="input" :disabled="readonly" /></div>
              </div>
            </div>
            <div class="blk">
              <h2>Quotation</h2>
              <div class="field"><span class="lbl">Quotation No.</span><p class="ro2 num">{{ q.docNo }} · [Version Revise] : {{ q.revision }}</p></div>
              <div class="field"><label for="qid">Date</label><input id="qid" v-model="q.issueDate" type="date" class="input" :disabled="readonly" /></div>
              <div class="field"><label for="qpn">Project</label><input id="qpn" v-model="q.projectName" class="input" :disabled="readonly" /></div>
              <div class="field"><label for="qcs">อ้างอิง Cost Sheet</label><select id="qcs" :value="q.costSheetId" class="input" :disabled="readonly" @change="changeCs(($event.target as HTMLSelectElement).value)"><option v-for="c in sheets" :key="c.id" :value="c.id">{{ c.docNo }} rev.{{ c.revision }} · {{ DOC_STATUS[c.status].label }} · Total Revenue {{ baht(costTotals(c).revenue) }}</option></select></div>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head"><h2>รายการ</h2><button v-if="!readonly" class="btn sm" @click="pullLines"><Icon name="refresh" :size="14" /> ดึงรายการจาก Cost Sheet</button></div>
          <p class="small muted">We are pleased to submit you the following quotation and offer to sell or service the product described herein at price, items, and stated as below</p>
          <p v-if="outOfSync && !readonly" class="warnbox small">รายการไม่ตรงกับรายได้ใน Cost Sheet ล่าสุด — กด “ดึงรายการจาก Cost Sheet”</p>
          <div class="scroll-x">
            <table class="table li">
              <thead><tr><th>ITEM</th><th>PART NO.</th><th>Product Description</th><th class="r">QTY.</th><th class="r">Unit Price</th><th class="r">Amount</th></tr></thead>
              <tbody>
                <tr class="proj"><td /><td /><td colspan="4"><b>{{ q.projectName }}</b></td></tr>
                <tr v-for="(i, k) in q.items" :key="i.id"><td>{{ k + 1 }}</td><td>{{ i.partNo }}</td><td>{{ i.description }}</td><td class="r num">{{ i.qty.toLocaleString('en-US') }}</td><td class="r num">{{ money(i.unitPrice) }}</td><td class="r num">{{ money(i.qty * i.unitPrice) }}</td></tr>
              </tbody>
            </table>
          </div>
          <span v-if="err('items')" class="msg">{{ err('items') }}</span>
          <p class="small muted">All price quoted in [Thai Baht] · แก้รายการที่ Cost Sheet (รายได้) แล้วกดดึงรายการ</p>
        </section>

        <section class="panel">
          <h2>Conditions</h2>
          <div class="g2">
            <div class="field" :class="{ bad: err('validUntil') }"><label for="qvu">Price validity (ยืนราคาถึง)</label><input id="qvu" v-model="q.validUntil" type="date" class="input" :disabled="readonly" /><span v-if="err('validUntil')" class="msg">{{ err('validUntil') }}</span></div>
            <div class="field"><label for="qvat">Vat7%</label><select id="qvat" v-model="q.vatIncluded" class="input" :disabled="readonly"><option :value="true">include</option><option :value="false">exclude</option></select></div>
          </div>
          <div class="field"><label for="qtp">Term of payment</label><input id="qtp" v-model="q.termOfPayment" class="input" :disabled="readonly" /><span class="hint">ค่าเริ่มต้นจาก Payment#1–#5 ใน Cost Sheet</span></div>
          <div class="field"><label for="qtd">Term of delivery</label><input id="qtd" v-model="q.termOfDelivery" class="input" :disabled="readonly" /></div>
          <div class="field"><label for="qwr">Warranty</label><input id="qwr" v-model="q.warranty" class="input" :disabled="readonly" /></div>
          <div class="g2">
            <div class="field"><label for="qsp">Sales Person</label><input id="qsp" v-model="q.salesPerson" class="input" :disabled="readonly" /></div>
            <div class="field"><label for="qap">Verify and Approved by</label><input id="qap" v-model="q.approvedBy" class="input" :disabled="readonly" /></div>
          </div>
          <div class="field"><label for="qrm">Remark (ไม่บังคับ)</label><textarea id="qrm" v-model="q.remark" class="input" rows="2" :disabled="readonly" /></div>
          <p class="small muted">ลายเซ็น: Sincerely by (Account Manager) · Verify and Approved by · Accepted by ({{ cust?.name ?? p.customer }}) · ผู้จัดทำ {{ person(p.sm)?.name }}</p>
        </section>
      </div>

      <aside class="sum panel" aria-live="polite">
        <h2>สรุปราคา</h2>
        <dl v-if="t">
          <dt>Total</dt><dd class="num">{{ money(t.total) }}</dd>
          <dt><label for="qdis">Special Discount</label></dt><dd><input id="qdis" v-model.number="q.discount" type="number" min="0" class="input mini num" :disabled="readonly" /></dd>
          <dt>Subtotal</dt><dd class="num strong">{{ money(t.subtotal) }}</dd>
          <dt>Vat 7%</dt><dd class="num">{{ money(t.vat) }}</dd>
          <dt>Grand Total</dt><dd class="num grand">{{ money(t.grand) }}</dd>
        </dl>
        <span v-if="err('discount')" class="msg">{{ err('discount') }}</span>
        <p v-if="t" class="words small">({{ bahtText(t.grand) }})</p>
        <div class="cmp" :class="v.warn.match ? 'warn' : 'ok'">
          <p class="small"><b>เทียบกับ Cost Sheet</b></p>
          <p class="small">Subtotal {{ money(t?.subtotal ?? 0) }} · Total Revenue {{ money(csRevenue ?? 0) }}</p>
          <p class="small">{{ v.warn.match ? 'ไม่ตรงกัน — ถ้าให้ส่วนลด ให้ลดราคาใน Cost Sheet ด้วย' : 'ตรงกัน ✓' }}</p>
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
.rev { color: var(--muted); font-weight: 400; font-size: 16px; }
.ro { display: flex; gap: 10px; align-items: center; padding: 10px 14px; border-radius: var(--r-md); background: var(--warn-soft); color: var(--warn); }
.layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; align-items: start; }
.body { display: grid; gap: 20px; min-width: 0; }
.panel h2 { font-size: 18px; margin: 0 0 12px; }
.g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
.blk { display: grid; gap: 10px; align-content: start; }
.blk h2 { color: var(--brand); }
.lbl { font-size: 13px; font-weight: 500; color: var(--ink-2); }
.ro2 { margin: 0; min-height: 38px; display: flex; align-items: center; padding: 0 12px; background: var(--sunken); border-radius: var(--r-sm); }
.li .proj td { background: var(--sunken); }
.r { text-align: right; white-space: nowrap; }
.panel > .field { margin-bottom: 12px; }
.panel > .g2 { margin-bottom: 12px; }
.warnbox { background: var(--warn-soft); color: var(--warn); padding: 8px 10px; border-radius: var(--r-sm); }
.sum { position: sticky; top: 80px; display: grid; gap: 10px; }
.sum h2 { margin: 0; }
.sum dl { display: grid; grid-template-columns: 1fr auto; gap: 8px 12px; margin: 0; align-items: center; }
.sum dt { color: var(--muted); font-size: 14px; }
.sum dd { margin: 0; text-align: right; }
.sum dd .input { width: 150px; }
.strong { font-weight: 600; }
.grand { font-weight: 700; font-size: 18px; color: var(--brand); }
.words { margin: 0; text-align: right; font-family: var(--desc); color: var(--ink-2); }
.cmp { border-radius: var(--r-md); padding: 10px 12px; }
.cmp p { margin: 0; }
.cmp.ok { background: var(--win-soft); color: var(--win); }
.cmp.warn { background: var(--warn-soft); color: var(--warn); }
.msg { font-size: 12px; color: var(--lose); display: block; }
.bad .input { border-color: var(--lose); }
.foot { display: flex; flex-wrap: wrap; gap: 8px; border-top: 1px solid var(--line); padding-top: 12px; }
.pdf { width: 100%; height: 72vh; border: 1px solid var(--line); border-radius: var(--r-sm); background: #fff; }
@media (max-width: 1100px) { .layout { grid-template-columns: 1fr; } .sum { position: static; } }
@media (max-width: 640px) { .g2 { grid-template-columns: 1fr; } }
</style>
