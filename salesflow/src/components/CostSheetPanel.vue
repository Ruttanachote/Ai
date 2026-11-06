<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from './Icon.vue'
import Dialog from './Dialog.vue'
import type { Project } from '../data/model'
import { baht, person } from '../data/mock'
import { notify, session } from '../store'

// One Excel workbook per project (SharePoint), tabs: Summary · Cost Sheet · Quotation.
// The system reads named ranges after each save and shows the summary here.
const props = defineProps<{ p: Project }>()

const tab = ref<'cost' | 'quote'>('cost')
const sendOpen = ref(false)
const saleOpen = ref(false)
const decideOpen = ref<null | 'approve' | 'reject'>(null)
const note = ref('')

const locked = computed(() => ['opportunity'].includes(props.p.stage))
const base = computed(() => props.p.cost || 6_000_000)
const rev = computed(() => props.p.revenue || base.value * 1.38)

const lines = computed(() => [
  { group: 'ทีมพัฒนา (Man-day)', items: [
    { name: 'Project Manager 1 คน × 120 วัน', amt: base.value * 0.09 },
    { name: 'System Analyst / BA 2 คน × 90 วัน', amt: base.value * 0.11 },
    { name: 'Developer 4 คน × 140 วัน', amt: base.value * 0.24 },
    { name: 'QA / Tester 1 คน × 60 วัน', amt: base.value * 0.04 },
  ] },
  { group: 'Hardware / Software', items: [
    { name: 'Server และ Storage', amt: base.value * 0.2 },
    { name: 'License ฐานข้อมูลและ OS (3 ปี)', amt: base.value * 0.12 },
  ] },
  { group: 'เงินสำรองและค่าบริการอื่น', items: [
    { name: 'เงินกันทำ OT ทีม (5%)', amt: base.value * 0.05 },
    { name: 'ค่าเดินทาง อบรม และจัดประชุม', amt: base.value * 0.06 },
    { name: 'Contingency / ความเสี่ยงโครงการ', amt: base.value * 0.04 },
    { name: 'ค่า Warranty 12 เดือน', amt: base.value * 0.05 },
  ] },
])
const total = computed(() => lines.value.flatMap((g) => g.items).reduce((s, i) => s + i.amt, 0))
const gp = computed(() => rev.value - total.value)
const gpPct = computed(() => (gp.value / rev.value) * 100)

const versions = computed(() =>
  props.p.approval
    ? [
        { v: 'v3', at: props.p.approval.submittedAt, by: 'Ruttanachot K.', status: props.p.approval.steps.some((s) => s.status === 'pending') ? 'รออนุมัติ' : props.p.approval.steps.some((s) => s.status === 'rejected') ? 'ไม่อนุมัติ' : 'อนุมัติแล้ว', note: 'ลด Margin Hardware ตามความเห็นหัวหน้ากลุ่ม' },
        { v: 'v2', at: '28 ต.ค. 69 10:05', by: 'Ruttanachot K.', status: 'ส่งกลับแก้ไข', note: 'Margin Hardware 18% สูงเกินกรอบ' },
        { v: 'v1', at: '20 ต.ค. 69 16:44', by: 'Ruttanachot K.', status: 'ฉบับร่าง', note: 'สร้างจาก Template มาตรฐาน 2569' },
      ]
    : [{ v: 'v1', at: '—', by: person(props.p.sm)?.name ?? '', status: 'ฉบับร่าง', note: 'สร้างจาก Template มาตรฐาน 2569 อัตโนมัติ' }],
)

const pendingStep = computed(() => props.p.approval?.steps.find((s) => s.status === 'pending'))
const canDecide = computed(() => {
  const s = pendingStep.value
  if (!s) return false
  return (session.role === 'head' && s.role.includes('หัวหน้า')) || (session.role === 'exec' && s.role.includes('ผู้บริหาร')) || session.role === 'admin'
})
const approved = computed(() => !!props.p.approval && props.p.approval.steps.every((s) => s.status === 'approved'))
const isOwner = computed(() => session.role === 'sm' || session.role === 'head' || session.role === 'admin')

function submit() {
  sendOpen.value = false
  props.p.approval = {
    version: props.p.approval ? 'v' + (Number(props.p.approval.version.slice(1)) + 1) : 'v1',
    submittedAt: 'วันนี้',
    steps: [
      { who: person(props.p.sm)?.name ?? '', role: 'SM ส่งขออนุมัติ', status: 'approved', at: 'วันนี้' },
      { who: 'Supawadee W.', role: 'หัวหน้ากลุ่ม DT4', status: 'pending' },
      { who: 'Thanakorn C.', role: 'ผู้บริหาร', status: 'waiting' },
    ],
  }
  notify('ส่งอีเมลขออนุมัติถึง Supawadee W. แล้ว')
}
function decide() {
  const steps = props.p.approval!.steps
  const i = steps.findIndex((s) => s.status === 'pending')
  steps[i].status = decideOpen.value === 'approve' ? 'approved' : 'rejected'
  steps[i].at = 'วันนี้'
  steps[i].note = note.value || undefined
  if (decideOpen.value === 'approve' && steps[i + 1]) steps[i + 1].status = 'pending'
  if (decideOpen.value === 'approve' && !steps[i + 1]) {
    props.p.revenue = Math.round(rev.value)
    props.p.cost = Math.round(total.value)
  }
  notify(decideOpen.value === 'approve' ? 'อนุมัติแล้ว ระบบแจ้ง SM ทางอีเมล' : 'ส่งกลับให้ SM แก้ไขแล้ว')
  decideOpen.value = null
  note.value = ''
}
</script>

<template>
  <div v-if="locked" class="panel lockbox">
    <Icon name="lock" :size="22" />
    <div><h3>Cost Sheet และใบเสนอราคาเปิดเมื่อเป็น Pipeline</h3><p class="muted">เปลี่ยนสถานะเป็น Pipeline เมื่อลูกค้าเริ่มเจรจา ระบบจะสร้างไฟล์ Excel จาก Template ให้ทันที</p></div>
  </div>

  <div v-else class="cs">
    <section class="panel book">
      <div class="bookhead">
        <span class="xl"><Icon name="excel" :size="22" /></span>
        <div>
          <h3>{{ p.code }}_CostSheet_Quotation.xlsx</h3>
          <p class="muted small">SharePoint › Stream Projects › {{ p.code }} › Cost Sheet · บันทึกล่าสุด {{ versions[0].at }}</p>
        </div>
        <div class="acts">
          <a class="btn" href="#" @click.prevent="notify('เปิดไฟล์ใน Excel Online (แท็บใหม่)')"><Icon name="excel" /> แก้ไขใน Excel Online</a>
          <button v-if="isOwner && !pendingStep && !approved" class="btn primary" @click="sendOpen = true"><Icon name="mail" /> ส่งขออนุมัติ</button>
          <button v-if="isOwner && approved" class="btn primary" @click="saleOpen = true"><Icon name="mail" /> ส่งใบเสนอราคาให้ Sale</button>
        </div>
      </div>

      <div class="tabs" role="tablist">
        <button role="tab" :aria-selected="tab === 'cost'" @click="tab = 'cost'">แท็บ Cost Sheet</button>
        <button role="tab" :aria-selected="tab === 'quote'" @click="tab = 'quote'">แท็บ Quotation</button>
      </div>

      <div v-if="tab === 'cost'" class="scroll-x">
        <table class="table sheet">
          <tbody>
            <template v-for="g in lines" :key="g.group">
              <tr class="g"><td colspan="2">{{ g.group }}</td></tr>
              <tr v-for="i in g.items" :key="i.name"><td>{{ i.name }}</td><td class="r num">{{ baht(Math.round(i.amt)) }}</td></tr>
            </template>
            <tr class="t"><td>ต้นทุนรวม (COGS)</td><td class="r num">{{ baht(Math.round(total)) }}</td></tr>
          </tbody>
        </table>
      </div>
      <div v-else class="quote">
        <div class="qrow"><span>ลูกค้า</span><b>{{ p.customer }}</b></div>
        <div class="qrow"><span>เลขที่ใบเสนอราคา</span><b>QT-{{ p.code }}-{{ versions[0].v }}</b></div>
        <div class="qrow"><span>ยืนราคา</span><b>60 วัน</b></div>
        <div class="qrow"><span>เงื่อนไขชำระเงิน</span><b>5 งวดตาม Milestone</b></div>
        <div class="qrow"><span>ราคาเสนอ (ไม่รวม VAT)</span><b class="num">{{ baht(Math.round(rev)) }}</b></div>
        <div class="qrow"><span>VAT 7%</span><b class="num">{{ baht(Math.round(rev * 0.07)) }}</b></div>
        <div class="qrow big"><span>ราคารวม</span><b class="num">{{ baht(Math.round(rev * 1.07)) }}</b></div>
      </div>
    </section>

    <aside class="side">
      <section class="panel sum">
        <h3>สรุปจาก Workbook</h3>
        <dl>
          <dt>Revenue</dt><dd class="num">{{ baht(Math.round(rev)) }}</dd>
          <dt>Cost (COGS)</dt><dd class="num">{{ baht(Math.round(total)) }}</dd>
          <dt>Gross Profit</dt><dd class="num" :class="gpPct < 25 ? 'bad' : 'good'">{{ baht(Math.round(gp)) }} · {{ gpPct.toFixed(1) }}%</dd>
          <dt>Budget ลูกค้า</dt><dd class="num">{{ baht(p.budget) }}</dd>
        </dl>
        <p v-if="rev > p.budget" class="chip lose">ราคาเสนอสูงกว่า Budget ลูกค้า</p>
        <p v-else-if="gpPct < 25" class="chip warn">GP ต่ำกว่าเกณฑ์ 25% ต้องผ่านผู้บริหาร</p>
      </section>

      <section class="panel">
        <h3>ลำดับการอนุมัติ</h3>
        <ol v-if="p.approval" class="steps">
          <li v-for="s in p.approval.steps" :key="s.who" :class="s.status">
            <span class="mk" />
            <div>
              <strong>{{ s.role }}</strong>
              <p class="small">{{ s.who }}<template v-if="s.at"> · {{ s.at }}</template></p>
              <p v-if="s.note" class="note small">“{{ s.note }}”</p>
              <p v-if="s.status === 'pending'" class="small wait">รอพิจารณา — ส่งอีเมลแจ้งแล้ว</p>
            </div>
          </li>
        </ol>
        <p v-else class="muted small">ยังไม่ได้ส่งขออนุมัติ เมื่อกรอก Cost Sheet ครบ กด “ส่งขออนุมัติ” ระบบจะส่งอีเมล Outlook พร้อมลิงก์ไฟล์ถึงหัวหน้ากลุ่ม</p>
        <div v-if="canDecide" class="decide">
          <button class="btn primary" @click="decideOpen = 'approve'">อนุมัติ {{ p.approval?.version }}</button>
          <button class="btn danger" @click="decideOpen = 'reject'">ส่งกลับแก้ไข</button>
        </div>
      </section>

      <section class="panel">
        <h3>เวอร์ชันเอกสาร</h3>
        <ul class="vers">
          <li v-for="v in versions" :key="v.v">
            <span class="vtag num">{{ v.v }}</span>
            <div><p class="small"><strong>{{ v.status }}</strong> · {{ v.at }}</p><p class="small muted">{{ v.note }}</p></div>
          </li>
        </ul>
      </section>
    </aside>
  </div>

  <Dialog :open="sendOpen" title="ส่งขออนุมัติราคา" wide @close="sendOpen = false">
    <div class="mail">
      <p><span>ถึง</span> Supawadee W. (หัวหน้ากลุ่ม DT4)</p>
      <p><span>สำเนา</span> Thanakorn C. (ผู้บริหาร) — จะได้รับคำขอหลังหัวหน้ากลุ่มอนุมัติ</p>
      <p><span>เรื่อง</span> [ขออนุมัติราคา] {{ p.code }} {{ p.name }}</p>
      <div class="mbody">
        เรียน คุณ Supawadee<br /><br />
        ขออนุมัติราคาโครงการ {{ p.name }} ลูกค้า {{ p.customer }}<br />
        ราคาเสนอ {{ baht(Math.round(rev)) }} · ต้นทุน {{ baht(Math.round(total)) }} · GP {{ gpPct.toFixed(1) }}%<br /><br />
        ปุ่ม “อนุมัติ” และ “ส่งกลับแก้ไข” อยู่ในอีเมลนี้ (Outlook Actionable Message) หรือเปิดในระบบ
      </div>
    </div>
    <div class="field"><label for="m">ข้อความถึงผู้อนุมัติ (ไม่บังคับ)</label><textarea id="m" class="input" rows="2" /></div>
    <template #foot><button class="btn" @click="sendOpen = false">ยกเลิก</button><button class="btn primary" @click="submit">ส่งขออนุมัติ</button></template>
  </Dialog>

  <Dialog :open="!!decideOpen" :title="decideOpen === 'approve' ? `อนุมัติราคา ${p.approval?.version}` : 'ส่งกลับให้ SM แก้ไข'" @close="decideOpen = null">
    <p>{{ p.name }} · {{ baht(Math.round(rev)) }} · GP {{ gpPct.toFixed(1) }}%</p>
    <div class="field">
      <label for="n">{{ decideOpen === 'approve' ? 'ความเห็น (ไม่บังคับ)' : 'สิ่งที่ต้องแก้ไข' }}</label>
      <textarea id="n" v-model="note" class="input" rows="3" />
      <span v-if="decideOpen === 'reject'" class="hint">SM จะเห็นข้อความนี้ในอีเมลและในประวัติเวอร์ชัน</span>
    </div>
    <template #foot>
      <button class="btn" @click="decideOpen = null">ยกเลิก</button>
      <button class="btn primary" :disabled="decideOpen === 'reject' && !note.trim()" @click="decide">{{ decideOpen === 'approve' ? 'อนุมัติ' : 'ส่งกลับแก้ไข' }}</button>
    </template>
  </Dialog>

  <Dialog :open="saleOpen" title="ส่งใบเสนอราคาให้ Sale" @close="saleOpen = false">
    <p>ระบบแปลงแท็บ Quotation เป็น PDF ({{ p.approval?.version }} ที่อนุมัติแล้ว) แนบในอีเมลถึง <strong>{{ p.sale || 'Sale ที่ดูแลลูกค้า' }}</strong> เพื่อส่งต่อให้ลูกค้าและยื่นประมูล</p>
    <p class="hint">Sale ไม่ต้องเข้าระบบนี้ — รับไฟล์ทางอีเมลเท่านั้น</p>
    <template #foot><button class="btn" @click="saleOpen = false">ยกเลิก</button><button class="btn primary" @click="saleOpen = false; notify('ส่งใบเสนอราคา PDF ให้ Sale แล้ว')">ส่งใบเสนอราคา</button></template>
  </Dialog>
</template>

<style scoped>
.lockbox { display: flex; gap: 16px; align-items: flex-start; color: var(--muted); }
.lockbox h3 { color: var(--ink); margin-bottom: 4px; }
.cs { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; align-items: start; }
.bookhead { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }
.xl { width: 42px; height: 42px; border-radius: var(--r-sm); background: #e4f2ea; color: #1d6f42; display: grid; place-items: center; flex: none; }
.bookhead > div:nth-child(2) { flex: 1; min-width: 220px; }
.acts { display: flex; gap: 8px; flex-wrap: wrap; }
.sheet .g td { background: var(--sunken); font-weight: 600; font-size: 13px; color: var(--ink-2); }
.sheet .t td { font-weight: 700; border-top: 2px solid var(--ink); font-family: var(--display); }
.quote { display: grid; gap: 0; max-width: 520px; }
.qrow { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--line); font-size: 14px; }
.qrow span { color: var(--muted); }
.qrow.big { border-bottom: 0; font-size: 18px; }
.qrow.big b { font-size: 22px; }
.side { display: grid; gap: 16px; }
.side h3 { margin-bottom: 12px; }
dl { display: grid; grid-template-columns: auto 1fr; gap: 8px 12px; margin: 0 0 12px; font-size: 14px; }
dt { color: var(--muted); }
dd { margin: 0; text-align: right; font-weight: 600; }
dd.good { color: var(--win); } dd.bad { color: var(--lose); }
.steps { list-style: none; margin: 0; padding: 0; display: grid; }
.steps li { display: grid; grid-template-columns: 18px 1fr; gap: 12px; padding-bottom: 14px; position: relative; }
.steps li:not(:last-child)::before { content: ''; position: absolute; left: 8px; top: 18px; bottom: 0; width: 2px; background: var(--line); }
.mk { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--line-strong); background: var(--surface); margin-top: 3px; }
.approved .mk { background: var(--win); border-color: var(--win); }
.pending .mk { border-color: var(--warn); box-shadow: 0 0 0 4px var(--warn-soft); }
.rejected .mk { background: var(--lose); border-color: var(--lose); }
.waiting { color: var(--faint); }
.note { color: var(--ink-2); background: var(--sunken); padding: 6px 10px; border-radius: var(--r-sm); margin-top: 4px; }
.wait { color: var(--warn); }
.decide { display: flex; gap: 8px; margin-top: 4px; }
.vers { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.vers li { display: grid; grid-template-columns: 34px 1fr; gap: 10px; }
.vtag { font-size: 12px; font-weight: 600; background: var(--idle-soft); border-radius: 4px; height: 22px; display: grid; place-items: center; }
.mail { border: 1px solid var(--line); border-radius: var(--r-md); padding: 14px 16px; display: grid; gap: 6px; font-size: 14px; }
.mail span { display: inline-block; width: 56px; color: var(--muted); }
.mbody { margin-top: 8px; padding-top: 12px; border-top: 1px solid var(--line); color: var(--ink-2); }
@media (max-width: 1100px) { .cs { grid-template-columns: 1fr; } }
</style>
