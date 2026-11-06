<script setup lang="ts">
import { computed } from 'vue'
import type { Project } from '../data/model'
import { baht, daysUntil, thDate, TODAY } from '../data/mock'
import { addDays } from '../domain/calendar'
import { appealWindowEnd } from '../domain/rules'
import { notify, session } from '../store'

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
    { k: 'ประกาศผู้ชนะ', d: x.result, note: 'คืนหลักประกันซองภายใน 15 วัน (ยกเว้น 3 รายต่ำสุด)' },
    { k: 'สิ้นสุดระยะอุทธรณ์', d: appealEnds.value, note: '7 วันทำการหลังประกาศผล — ยื่นผ่าน e-GP เท่านั้น (แบบ อธ 1)' },
    { k: 'ลงนามสัญญา', d: x.signed, note: 'วางหลักประกันสัญญา 5% ก่อนลงนาม' },
  ]
})
const delta = computed(() => (b.value?.refPrice && b.value.ourBid ? ((b.value.ourBid - b.value.refPrice) / b.value.refPrice) * 100 : null))

// Bonds: performance bond returns 15 days after release from obligations (end of warranty).
const bonds = computed(() =>
  (props.p.bonds ?? []).map((x) => {
    const due = x.kind === 'performance' && props.p.endWarranty ? addDays(props.p.endWarranty, 15) : x.kind === 'bid' && b.value?.result ? addDays(b.value.result, 15) : undefined
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
const canEdit = computed(() => ['sm', 'head', 'pm', 'admin'].includes(session.role))
</script>

<template>
  <div class="proc">
    <section v-if="b" class="panel">
      <div class="panel-head">
        <h2>{{ isGov ? 'การจัดซื้อจัดจ้างภาครัฐ (e-GP)' : 'การซื้อของลูกค้าเอกชน' }}</h2>
        <span class="chip presale">{{ b.method }}</span>
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
          </div>
        </li>
      </ol>
      <p v-if="isGov" class="hint">ผู้ประกอบการ SME (ขนาดย่อม/เล็ก) ชนะได้แม้ราคาสูงกว่ารายต่ำสุดไม่เกิน 10% · สินค้า Made in Thailand ได้แต้มต่อ 5% — บันทึกสถานะของคู่แข่งเมื่อแพ้งาน</p>
      <p v-else class="muted">ลูกค้าเอกชน ไม่มีขั้นตอน e-GP — ติดตามที่ PO และสัญญา</p>
    </section>

    <section class="panel">
      <div class="panel-head"><h2>ทะเบียนหลักประกัน</h2><button v-if="canEdit" class="btn sm" @click="notify('เพิ่มหลักประกัน')">เพิ่มหลักประกัน</button></div>
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
.facts span { font-size: 12.5px; color: var(--muted); }
.facts b { font-size: 17px; }
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
</style>
