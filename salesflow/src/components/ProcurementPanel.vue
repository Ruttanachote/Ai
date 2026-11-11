<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { BidInfo, Bond, Project } from '../data/model'
import Dialog from './Dialog.vue'
import { appealWindowEnd as appealEndOf, isTender } from '../domain/rules'
import { baht, daysUntil, thDate, TODAY, TODAY_ISO } from '../data/mock'
import { appealWindowEnd } from '../domain/rules'
import { bondReturnDue } from '../domain/metrics'
import { notify, session } from '../store'
import { log } from '../docstore'

// Thai public procurement (พ.ร.บ.จัดซื้อจัดจ้างฯ 2560 + ระเบียบกระทรวงการคลัง 2560).
// Figures are defaults — confirm against each TOR / contract.
const props = defineProps<{ p: Project }>()
const b = computed(() => props.p.bid)
const isGov = computed(() => b.value && b.value.method !== 'เอกชน')

// Appeal window: 7 working days after the result is posted on e-GP; signing waits for it.
const appealEnds = computed(() => appealWindowEnd(props.p))
const steps = computed(() => {
  const x = b.value
  if (!x) return []
  return [
    { k: 'ประกาศเชิญชวน', d: x.announce, note: 'ไม่น้อยกว่า 3 วันทำการ (วงเงิน 0.5–100 ล้าน)' },
    { k: 'ยื่นข้อเสนอผ่าน e-GP', d: x.submit, note: 'แนบหลักประกันการเสนอราคา 5%' },
    { k: 'คาดว่าประกาศผล', d: x.resultDue, note: 'ระบบเตือน SM ล่วงหน้า 1 วัน ให้ติดตามผลจาก Sale', edit: true },
    { k: 'ประกาศผู้ชนะ', d: x.result, note: 'คืนหลักประกันซองภายใน 15 วัน (ยกเว้น 3 รายต่ำสุด)' },
    { k: 'สิ้นสุดระยะอุทธรณ์', d: appealEnds.value, note: '7 วันทำการหลังประกาศผล — ยื่นผ่าน e-GP เท่านั้น (แบบ อธ 1)' },
    { k: 'ลงนามสัญญา', d: x.signed, note: 'วางหลักประกันสัญญา 5% ก่อนลงนาม' },
  ]
})
const delta = computed(() => (b.value?.refPrice && b.value.ourBid ? ((b.value.ourBid - b.value.refPrice) / b.value.refPrice) * 100 : null))

// Bonds: performance bond returns 15 days after release from obligations (end of warranty).
const bonds = computed(() =>
  (props.p.bonds ?? []).map((x) => {
    const due = bondReturnDue(props.p, x)
    const left = daysUntil(x.expires)
    return { ...x, due, left, warn: !x.returned && left < 60 }
  }),
)

// Penalty exposure: work delivered as a whole → rate × full contract price per day late (min ฿100/day).
// At 10% of contract value the agency must notify and may terminate (ข้อ 162, 183).
const contract = computed(() => props.p.revenue)
const lateDays = computed(() => {
  const end = props.p.endProject
  if (!end) return 0
  const unfinished = (props.p.milestones ?? []).some((m) => m.progress < 100)
  const projected = unfinished ? Math.max(0, Math.round(-daysUntil(end))) : 0
  // Projection: remaining % of the in-flight milestones pushed past the deadline.
  const behind = (props.p.milestones ?? []).filter((m) => m.progress < 100 && new Date(m.end) < TODAY).length
  return projected + behind * 7
})
const rate = computed(() => props.p.penaltyRate ?? 0.001)
const perDay = computed(() => Math.max(100, contract.value * rate.value))
const exposure = computed(() => perDay.value * lateDays.value)
const cap = computed(() => contract.value * 0.1)
const capDays = computed(() => Math.floor(cap.value / perDay.value))

// Net cash per milestone for a government customer: VAT 7% added, 1% withholding on pre-VAT.
const cash = computed(() =>
  (props.p.milestones ?? []).filter((m) => m.payment).map((m) => {
    const vat = m.payment! * 0.07
    const wht = isGov.value ? m.payment! * 0.01 : m.payment! * 0.03
    return { ...m, vat, wht, net: m.payment! + vat - wht }
  }),
)
const canEdit = computed(() => ['sm', 'pm', 'pmo', 'opn', 'admin'].includes(session.role))

/* ---------- Procurement data entry (SM): what the stage moves need ---------- */
// Forecast needs the method; Rebidding needs the e-GP number and reference price; Close Win needs
// the winner-announcement date and the 7-working-day appeal window to have passed.
const PRESALE_OR_WIN = ['opportunity', 'pipeline', 'forecast', 'rebidding', 'win']
const canEditBid = computed(() => PRESALE_OR_WIN.includes(props.p.stage) && (props.p.sm === session.userId || props.p.collaborators.includes(session.userId) || session.role === 'admin' || session.role === 'head'))
const METHODS: BidInfo['method'][] = ['e-bidding', 'e-market', 'คัดเลือก', 'เฉพาะเจาะจง', 'เอกชน']
const blank = () => ({ method: (isTender(props.p) ? 'e-bidding' : 'เอกชน') as BidInfo['method'], egpNo: '', refPrice: null as number | null, ourBid: null as number | null, announce: '', submit: '', resultDue: '', result: '', signed: '' })
const form = reactive(blank())
const editing = ref(false)
function fill() { const x = props.p.bid; Object.assign(form, blank(), x ? { ...x, egpNo: x.egpNo ?? '', refPrice: x.refPrice ?? null, ourBid: x.ourBid ?? null, announce: x.announce ?? '', submit: x.submit ?? '', resultDue: x.resultDue ?? '', result: x.result ?? '', signed: x.signed ?? '' } : {}) }
watch(() => props.p.id, fill, { immediate: true })
const need = computed(() => {
  const st = props.p.stage
  const gov = form.method !== 'เอกชน'
  return { method: true, egpNo: gov && ['forecast', 'rebidding', 'win'].includes(st), refPrice: gov && ['forecast', 'rebidding'].includes(st), result: gov && ['rebidding', 'win'].includes(st) }
})
const formAppeal = computed(() => (form.result ? appealEndOf({ ...props.p, bid: { method: form.method, result: form.result } }) : undefined))
function saveBid() {
  const n = (v: number | null) => (v && v > 0 ? v : undefined)
  const s = (v: string) => v.trim() || undefined
  props.p.bid = { ...(props.p.bid ?? {}), method: form.method, egpNo: s(form.egpNo), refPrice: n(form.refPrice), ourBid: n(form.ourBid), announce: s(form.announce), submit: s(form.submit), resultDue: s(form.resultDue), result: s(form.result), signed: s(form.signed) }
  props.p.salesMotion = form.method === 'เอกชน' ? 'direct' : 'tender'
  log(props.p, 'field', `บันทึกข้อมูลจัดซื้อ — ${form.method}${form.egpNo ? ' · e-GP ' + form.egpNo : ''}${form.result ? ' · ประกาศผู้ชนะ ' + form.result : ''}`)
  editing.value = false
  notify('บันทึกข้อมูลการจัดซื้อแล้ว')
}

/* ---------- Bonds ---------- */
const bondOpen = ref(false)
const bond = reactive({ kind: 'bid' as Bond['kind'], pct: 5, amount: null as number | null, form: 'หนังสือค้ำประกันธนาคาร', bank: '', issued: '', expires: '' })
const bondBase = computed(() => (bond.kind === 'bid' ? props.p.bid?.refPrice ?? props.p.budget : props.p.contractValue ?? props.p.revenue) || 0)
function openBond(kind: Bond['kind']) {
  Object.assign(bond, { kind, pct: 5, amount: null, form: 'หนังสือค้ำประกันธนาคาร', bank: '', issued: TODAY_ISO, expires: '' })
  bondOpen.value = true
}
watch(() => [bond.kind, bond.pct], () => { if (bondOpen.value) bond.amount = Math.round(bondBase.value * bond.pct / 100) || null })
const bondErr = computed(() => (!bond.amount || bond.amount <= 0 ? 'ระบุมูลค่า' : !bond.bank.trim() ? 'ระบุธนาคาร / ผู้ออก' : !bond.issued || !bond.expires ? 'ระบุวันที่ออกและวันหมดอายุ' : bond.expires <= bond.issued ? 'วันหมดอายุต้องหลังวันที่ออก' : ''))
const bondTried = ref(false)
function saveBond() {
  bondTried.value = true
  if (bondErr.value) return
  props.p.bonds = [...(props.p.bonds ?? []), { kind: bond.kind, pct: bond.pct, amount: bond.amount!, form: bond.form, bank: bond.bank.trim(), issued: bond.issued, expires: bond.expires }]
  log(props.p, 'field', `บันทึก${bond.kind === 'bid' ? 'หลักประกันการเสนอราคา' : 'หลักประกันสัญญา'} ${baht(bond.amount!)} · ${bond.bank}`)
  bondOpen.value = false; bondTried.value = false
  notify('บันทึกหลักประกันแล้ว')
}
</script>

<template>
  <div class="proc">
    <section v-if="canEditBid && (editing || !b)" class="panel bidform">
      <div class="panel-head"><h2>บันทึกข้อมูลการจัดซื้อ</h2><span class="muted small">ช่องที่มี * ต้องกรอกก่อนย้ายสถานะถัดไป</span></div>
      <form class="bf" @submit.prevent="saveBid">
        <div class="field"><label for="bm">วิธีจัดซื้อจัดจ้าง *</label><select id="bm" v-model="form.method" class="input"><option v-for="m in METHODS" :key="m">{{ m }}</option></select><span class="hint">เลือก "เอกชน" ถ้าลูกค้าซื้อผ่าน PO — ไม่มีขั้นตอน e-GP</span></div>
        <template v-if="form.method !== 'เอกชน'">
          <div class="field"><label for="beg">เลขโครงการ e-GP{{ need.egpNo || p.stage === 'pipeline' ? ' *' : '' }}</label><input id="beg" v-model="form.egpNo" class="input num" placeholder="เช่น 69109012345" /><span class="hint">ต้องมีก่อนย้ายไป Rebidding</span></div>
          <div class="field"><label for="brp">ราคากลาง (บาท){{ need.refPrice || p.stage === 'pipeline' ? ' *' : '' }}</label><input id="brp" v-model.number="form.refPrice" class="input num" type="number" min="0" step="1000" /></div>
          <div class="field"><label for="bob">ราคาที่เรายื่น (บาท)</label><input id="bob" v-model.number="form.ourBid" class="input num" type="number" min="0" step="1000" /><span class="hint">ต้องไม่สูงกว่าราคาในใบเสนอราคาที่อนุมัติ</span></div>
          <div class="field"><label for="ban">วันประกาศเชิญชวน</label><input id="ban" v-model="form.announce" class="input" type="date" /></div>
          <div class="field"><label for="bsu">วันยื่นข้อเสนอ</label><input id="bsu" v-model="form.submit" class="input" type="date" /></div>
          <div class="field"><label for="brd">วันที่คาดว่าประกาศผล</label><input id="brd" v-model="form.resultDue" class="input" type="date" /><span class="hint">ระบบเตือน SM ล่วงหน้า 1 วัน</span></div>
          <div class="field"><label for="bre">วันประกาศผู้ชนะ (เราชนะ){{ need.result ? ' *' : '' }}</label><input id="bre" v-model="form.result" class="input" type="date" /><span class="hint">{{ formAppeal ? `พ้นระยะอุทธรณ์ 7 วันทำการ ${thDate(formAppeal)} — ย้ายเป็น Close Win ได้หลังวันนี้` : 'ต้องมีก่อนย้ายเป็น Close Win' }}</span></div>
          <div class="field"><label for="bsi">วันลงนามสัญญา</label><input id="bsi" v-model="form.signed" class="input" type="date" /></div>
        </template>
        <div class="bfoot"><button v-if="b" type="button" class="btn" @click="editing = false; fill()">ยกเลิก</button><button type="submit" class="btn primary">บันทึกข้อมูลจัดซื้อ</button></div>
      </form>
    </section>
    <section v-if="b && !(canEditBid && editing)" class="panel">
      <div class="panel-head">
        <h2>{{ isGov ? 'การจัดซื้อจัดจ้างภาครัฐ (e-GP)' : 'การซื้อของลูกค้าเอกชน' }}</h2>
        <span class="hd"><span class="chip presale">{{ b.method }}</span><button v-if="canEditBid" class="btn sm" @click="fill(); editing = true">แก้ไขข้อมูลจัดซื้อ</button></span>
      </div>
      <div v-if="isGov" class="facts">
        <div><span>เลขโครงการ e-GP</span><b class="num">{{ b.egpNo ?? 'ยังไม่ประกาศ' }}</b></div>
        <div><span>ราคากลาง</span><b class="num">{{ b.refPrice ? baht(b.refPrice) : '—' }}</b></div>
        <div><span>ราคาที่เราเสนอ</span><b class="num">{{ b.ourBid ? baht(b.ourBid) : '—' }}</b></div>
        <div><span>เทียบราคากลาง</span><b class="num" :class="delta !== null && delta > 0 ? 'bad' : ''">{{ delta === null ? '—' : (delta > 0 ? '+' : '') + delta.toFixed(1) + '%' }}</b></div>
      </div>
      <ol v-if="isGov" class="egp">
        <li v-for="s in steps" :key="s.k" :class="{ done: s.d && new Date(s.d) <= TODAY, next: s.d && new Date(s.d) > TODAY }">
          <span class="mk" />
          <div>
            <strong>{{ s.k }}</strong>
            <span class="d num">{{ s.d ? thDate(s.d) : 'ยังไม่กำหนด' }}<em v-if="s.d && daysUntil(s.d) > 0"> · อีก {{ daysUntil(s.d) }} วัน</em></span>
            <p class="small muted">{{ s.note }}</p>
            <input v-if="'edit' in s && canEdit && !b?.result" type="date" class="input rd" :value="b?.resultDue" aria-label="วันที่คาดว่าประกาศผล" @change="b!.resultDue = ($event.target as HTMLInputElement).value; notify('บันทึกวันคาดว่าประกาศผลแล้ว — ระบบจะเตือนล่วงหน้า 1 วัน')" />
          </div>
        </li>
      </ol>
      <p v-if="isGov" class="hint">ผู้ประกอบการ SME (ขนาดย่อม/เล็ก) ชนะได้แม้ราคาสูงกว่ารายต่ำสุดไม่เกิน 10% · สินค้า Made in Thailand ได้แต้มต่อ 5% — บันทึกสถานะของคู่แข่งเมื่อแพ้งาน</p>
      <p v-else class="muted">ลูกค้าเอกชน ไม่มีขั้นตอน e-GP — ติดตามที่ PO และสัญญา</p>
    </section>

    <section class="panel">
      <div class="panel-head"><h2>ทะเบียนหลักประกัน</h2><span v-if="canEdit" class="hd"><button class="btn sm" @click="openBond('bid')">+ หลักประกันซอง</button><button class="btn sm" @click="openBond('performance')">+ หลักประกันสัญญา</button></span></div>
      <table v-if="bonds.length" class="table">
        <thead><tr><th>ประเภท</th><th>รูปแบบ</th><th class="r">มูลค่า</th><th>หมดอายุ</th><th>ครบกำหนดขอคืน</th><th>สถานะ</th></tr></thead>
        <tbody>
          <tr v-for="x in bonds" :key="x.kind">
            <td><strong>{{ x.kind === 'bid' ? 'หลักประกันการเสนอราคา' : 'หลักประกันสัญญา' }}</strong><p class="small muted">{{ x.pct }}% · ออก {{ thDate(x.issued) }}</p></td>
            <td class="small">{{ x.form }}<br />{{ x.bank }}</td>
            <td class="r num">{{ baht(x.amount) }}</td>
            <td class="small" :class="{ bad: x.warn }">{{ thDate(x.expires) }}</td>
            <td class="small">{{ x.due ? thDate(x.due) : 'หลังพ้นข้อผูกพัน' }}</td>
            <td><span class="chip" :class="x.returned ? 'win' : x.warn ? 'lose' : 'warn'">{{ x.returned ? 'คืนแล้ว ' + thDate(x.returned) : x.warn ? 'ใกล้หมดอายุ' : 'ค้ำอยู่' }}</span></td>
          </tr>
        </tbody>
      </table>
      <p v-else class="muted">ยังไม่มีหลักประกัน — งานภาครัฐ e-bidding ต้องวางหลักประกันการเสนอราคา 5% ของวงเงินงบประมาณ</p>
    </section>

    <Dialog :open="bondOpen" :title="bond.kind === 'bid' ? 'เพิ่มหลักประกันการเสนอราคา' : 'เพิ่มหลักประกันสัญญา'" @close="bondOpen = false">
      <div class="two2">
        <div class="field"><label for="bk">ประเภท</label><select id="bk" v-model="bond.kind" class="input"><option value="bid">หลักประกันการเสนอราคา (ซอง)</option><option value="performance">หลักประกันสัญญา</option></select></div>
        <div class="field"><label for="bp">อัตรา (%)</label><input id="bp" v-model.number="bond.pct" class="input num" type="number" min="0" max="100" step="0.5" /></div>
        <div class="field"><label for="ba">มูลค่า (บาท)</label><input id="ba" v-model.number="bond.amount" class="input num" type="number" min="0" step="1000" /><span class="hint">คำนวณจาก{{ bond.kind === 'bid' ? 'ราคากลาง / งบ' : 'มูลค่าสัญญา' }} {{ baht(bondBase) }}</span></div>
        <div class="field"><label for="bfm">รูปแบบ</label><select id="bfm" v-model="bond.form" class="input"><option>หนังสือค้ำประกันธนาคาร</option><option>หนังสือค้ำประกันอิเล็กทรอนิกส์ (e-LG)</option><option>เงินสด</option><option>เช็คธนาคาร</option></select></div>
        <div class="field"><label for="bb">ธนาคาร / ผู้ออก</label><input id="bb" v-model="bond.bank" class="input" placeholder="เช่น ธนาคารกรุงไทย" /></div>
        <div class="field"><label for="bi">วันที่ออก</label><input id="bi" v-model="bond.issued" class="input" type="date" /></div>
        <div class="field"><label for="bx">วันหมดอายุ</label><input id="bx" v-model="bond.expires" class="input" type="date" /></div>
      </div>
      <p v-if="bondTried && bondErr" class="msg" role="alert">{{ bondErr }}</p>
      <template #foot><button class="btn" @click="bondOpen = false">ยกเลิก</button><button class="btn primary" @click="saveBond">บันทึกหลักประกัน</button></template>
    </Dialog>

    <section v-if="p.milestones" class="two">
      <div class="panel">
        <div class="panel-head"><h2>ความเสี่ยงค่าปรับ</h2><span class="muted small">อัตรา {{ (rate * 100).toFixed(2) }}% ต่อวันของราคาเต็มสัญญา</span></div>
        <p class="big num" :class="{ bad: exposure > 0 }">{{ baht(Math.round(exposure)) }}</p>
        <p class="small muted">{{ lateDays ? `คาดว่าส่งมอบช้า ${lateDays} วัน × ${baht(Math.round(perDay))}/วัน` : 'ยังไม่มีงวดที่คาดว่าจะล่าช้า' }}</p>
        <div class="meter" role="img" :aria-label="`ค่าปรับ ${((exposure / cap) * 100).toFixed(0)}% ของเพดาน 10%`">
          <i :style="{ width: Math.min(100, (exposure / cap) * 100) + '%' }" />
        </div>
        <p class="small">เพดาน 10% ของมูลค่าสัญญา = {{ baht(Math.round(cap)) }} (ช้าได้ประมาณ {{ capDays }} วัน) — ถึงเพดานแล้วหน่วยงานต้องแจ้ง และบอกเลิกสัญญาได้</p>
        <p class="hint">วันที่กรรมการตรวจรับใช้ ไม่นับเป็นวันล่าช้า · ขอขยายเวลา/งดค่าปรับต้องแจ้งเป็นหนังสือพร้อมเหตุผล</p>
      </div>
      <div class="panel">
        <div class="panel-head"><h2>เงินรับจริงต่องวด</h2><span class="muted small">{{ isGov ? 'หัก ณ ที่จ่าย 1% (หน่วยงานรัฐ)' : 'หัก ณ ที่จ่าย 3% (ค่าบริการ)' }}</span></div>
        <table class="table">
          <thead><tr><th>งวด</th><th class="r">ก่อน VAT</th><th class="r">หัก ณ ที่จ่าย</th><th class="r">รับสุทธิ</th></tr></thead>
          <tbody>
            <tr v-for="m in cash" :key="m.name"><td class="small">{{ m.name }}</td><td class="r num">{{ baht(m.payment!) }}</td><td class="r num muted">−{{ baht(Math.round(m.wht)) }}</td><td class="r num">{{ baht(Math.round(m.net)) }}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.proc { display: grid; gap: 20px; }
.facts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
.facts div { background: var(--sunken); border-radius: var(--r-md); padding: 12px 14px; display: grid; }
.facts span { font-size: 13px; color: var(--muted); }
.facts b { font-size: 18px; }
.egp { list-style: none; margin: 0 0 16px; padding: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0; }
.egp li { position: relative; padding: 0 12px 0 0; display: grid; gap: 8px; }
.egp li::before { content: ''; position: absolute; top: 8px; left: 18px; right: 0; height: 2px; background: var(--line); }
.egp li:last-child::before { display: none; }
.egp li.done::before { background: var(--ink); }
.egp .mk { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--line-strong); background: var(--surface); position: relative; z-index: 1; }
.egp .done .mk { background: var(--ink); border-color: var(--ink); }
.egp .next .mk { border-color: var(--brand); }
.egp strong { font-weight: 600; font-size: 14px; display: block; }
.egp .d { font-size: 13px; }
.egp em { font-style: normal; color: var(--brand); }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.big { font-size: 34px; font-weight: 700; line-height: 1.1; }
.meter { height: 10px; background: var(--idle-soft); border-radius: 99px; overflow: hidden; margin: 14px 0 8px; position: relative; }
.meter i { display: block; height: 100%; background: var(--lose); }
.bad { color: var(--lose); }
.hint { margin-top: 8px; }
@media (max-width: 1100px) { .two { grid-template-columns: 1fr; } .egp { grid-template-columns: 1fr; gap: 14px; } .egp li::before { display: none; } .facts { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.bf { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px 16px; }
.bfoot { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 8px; }
.hd { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.two2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.msg { color: var(--lose); font-size: 13px; margin: 8px 0 0; }
@media (max-width: 560px) { .two2 { grid-template-columns: 1fr; } }
.rd { width: auto; min-height: 32px; padding: 2px 8px; font-size: 14px; margin-top: 4px; }
</style>
