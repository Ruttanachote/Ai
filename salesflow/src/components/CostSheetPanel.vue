<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from './Icon.vue'
import Dialog from './Dialog.vue'
import type { Project } from '../data/model'
import { baht, person, thDate, TODAY_ISO } from '../data/mock'
import { notify, session, SETTINGS, newApprovalSteps, canDecideStep, APPROVER_OF, decideApproval } from '../store'
import { PEOPLE } from '../data/mock'
import { APPROVAL_CHAIN } from '../data/model'
import { costSheet } from '../domain/metrics'

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

// Same lines the OT reserve and procurement budgets are drawn from.
const lines = computed(() => costSheet(props.p))
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

const a = computed(() => props.p.approval)
const pendingStep = computed(() => (a.value?.status === 'stale' || a.value?.status === 'recalled' ? undefined : a.value?.steps.find((s) => s.status === 'pending')))
// The submitter can never decide on their own request, whatever roles they hold.
const isSubmitter = computed(() => (a.value?.submittedBy ?? props.p.sm) === session.userId)
const canDecide = computed(() => {
  const s = pendingStep.value
  if (!s || isSubmitter.value) return false
  return canDecideStep(s, session.role)
})
const approved = computed(() => !!a.value && a.value.status !== 'stale' && a.value.steps.every((s) => s.status === 'approved'))
const expired = computed(() => approved.value && !!a.value?.validUntil && a.value.validUntil < TODAY_ISO)
const stale = computed(() => a.value?.status === 'stale')

// Simulates the Graph delta/webhook: any save after submit makes the approval stale (server: markStaleIfChanged).
function openExcel() {
  notify('เปิดไฟล์ใน Excel Online (แท็บใหม่)')
  if (a.value && (approved.value || pendingStep.value)) {
    a.value.status = 'stale'
    a.value.eTag = '"{3F2A},' + (Number(a.value.spVersionId ?? '1') + 1) + '"'
  }
}
function recall() {
  if (!a.value) return
  a.value.status = 'recalled'
  a.value.steps.forEach((s) => { if (s.status === 'pending') s.status = 'waiting' })
  notify('ดึงคำขออนุมัติกลับแล้ว แก้ไฟล์แล้วส่งใหม่ได้')
}
// SM owns sales quotations; for MA-type renewals the MA team issues the quotation itself.
const isOwner = computed(() => (props.p.type === 'MA' ? ['ma', 'admin'] : ['sm', 'admin']).includes(session.role))
const canSubmit = computed(() => isOwner.value && (!a.value || ['stale', 'recalled', 'rejected'].includes(a.value.status ?? '') || a.value.steps.some((s) => s.status === 'rejected') || expired.value))

// SM briefs the approvers in a meeting first; the meeting is recorded with the request and shown in Mail Inbox.
const msg = ref('')
const meet = ref({ date: TODAY_ISO, place: 'Teams', attendees: [APPROVER_OF.deputy!, APPROVER_OF.exec!] as string[], summary: '' })
const meetPeople = PEOPLE.filter((u) => ['head', 'deputy', 'exec', 'pmo'].includes(u.role))
const meetOk = computed(() => !!meet.value.date && meet.value.attendees.length > 0 && meet.value.summary.trim().length >= 10)
function submit() {
  if (!meetOk.value) return
  sendOpen.value = false
  const nextV = a.value ? Number(a.value.version.slice(1)) + 1 : 1
  const snap = { revenue: Math.round(rev.value), cost: Math.round(total.value), gp: Math.round(gpPct.value * 10) / 10 }
  const valid = new Date(TODAY_ISO)
  valid.setDate(valid.getDate() + SETTINGS.approvalValidDays)
  props.p.approval = {
    version: 'v' + nextV,
    submittedAt: 'วันนี้',
    status: 'pending',
    submittedBy: session.userId,
    snapshot: snap,
    snapshotHash: [snap.revenue, snap.cost, snap.gp].map((n) => n.toString(16)).join('').slice(0, 20),
    spVersionId: String(14 + nextV),
    eTag: `"{3F2A},${14 + nextV}"`,
    archivedPath: `Cost Sheet/Submitted/v${nextV}.xlsx`,
    validUntil: valid.toISOString().slice(0, 10),
    steps: newApprovalSteps(session.userId, props.p.type === 'MA' ? 'ทีม MA ส่งขออนุมัติ' : 'SM ส่งขออนุมัติ'),
    message: msg.value.trim() || undefined,
    preMeeting: { date: meet.value.date, place: meet.value.place, attendees: [...meet.value.attendees], summary: meet.value.summary.trim() },
  }
  msg.value = ''
  notify(`ส่งอีเมลขออนุมัติ (ลิงก์เข้าระบบ) ถึง ${props.p.approval.steps[1].who} แล้ว`)
}
const FIX_DOCS = ['Cost Sheet', 'ใบเสนอราคา (Quotation)', 'Proposal']
const fix = ref<string[]>([])
function decide() {
  if (!a.value || !canDecide.value || !decideOpen.value) return
  decideApproval(props.p, decideOpen.value, note.value, fix.value, 'web')
  notify(decideOpen.value === 'approve' ? 'อนุมัติแล้ว ระบบแจ้ง SM ทางอีเมล' : 'ส่งกลับให้ SM แก้ไขแล้ว')
  decideOpen.value = null
  note.value = ''
  fix.value = []
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
          <a class="btn" href="#" @click.prevent="openExcel"><Icon name="excel" /> แก้ไขใน Excel Online</a>
          <button v-if="pendingStep && isSubmitter" class="btn" @click="recall">ดึงคำขอกลับ</button>
          <router-link class="btn" :to="`/print/quotation/${p.id}`"><Icon name="file" /> ดูใบเสนอราคา PDF</router-link>
          <button v-if="canSubmit" class="btn primary" @click="sendOpen = true"><Icon name="mail" /> ส่งขออนุมัติ</button>
          <button v-if="isOwner && approved && !stale && !expired" class="btn primary" @click="saleOpen = true"><Icon name="mail" /> ส่งใบเสนอราคาให้ Sale</button>
        </div>
      </div>

      <div v-if="stale" class="stale" role="alert">
        <strong>ไฟล์ถูกแก้หลังอนุมัติ</strong> — มีเวอร์ชันใหม่ใน SharePoint หลังจาก {{ p.approval?.version }} ได้รับอนุมัติ ใบเสนอราคาเดิมถูกระงับการส่ง Sale จนกว่าจะส่งอนุมัติใหม่
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
        <dl v-if="p.approval?.snapshot" class="rec">
          <dt>สถานะ</dt><dd><span class="chip" :class="stale ? 'warn' : approved && !expired ? 'win' : p.approval.status === 'rejected' ? 'lose' : ''">{{ stale ? 'ไฟล์ถูกแก้หลังส่ง' : expired ? 'หมดอายุ' : approved ? 'อนุมัติแล้ว' : p.approval.status === 'recalled' ? 'ดึงกลับแล้ว' : p.approval.status === 'rejected' ? 'ส่งกลับแก้ไข' : 'รอพิจารณา' }}{{ p.approval.postAward ? ' · หลังได้งาน' : '' }}</span><span v-if="p.approval.status === 'rejected' && p.approval.fixDocs?.length" class="small bad"> ต้องแก้: {{ p.approval.fixDocs.join(', ') }}</span></dd>
          <dt>ตัวเลขที่อนุมัติ</dt><dd class="num">{{ baht(p.approval.snapshot.revenue) }} · GP {{ p.approval.snapshot.gp }}%</dd>
          <template v-if="p.approval.snapshot.contractValue"><dt>มูลค่า PO</dt><dd class="num">{{ baht(p.approval.snapshot.contractValue) }}</dd></template>
          <dt>ไฟล์ที่อนุมัติ</dt><dd class="small">{{ p.approval.archivedPath }} · SharePoint v{{ p.approval.spVersionId }}</dd>
          <dt>ใช้ได้ถึง</dt><dd class="small">{{ thDate(p.approval.validUntil) }}</dd>
          <dt>รหัสตรวจสอบ</dt><dd class="small num">{{ p.approval.snapshotHash?.slice(0, 12) }}</dd>
        </dl>
        <p v-if="pendingStep && isSubmitter && session.role === 'admin'" class="hint">คุณเป็นผู้ส่งคำขอนี้ จึงพิจารณาเองไม่ได้</p>
        <ol v-if="p.approval" class="steps">
          <li v-for="s in p.approval.steps" :key="s.who" :class="s.status">
            <span class="mk" />
            <div>
              <strong>{{ s.role }}</strong>
              <p class="small">{{ s.who }}<template v-if="s.at"> · {{ s.at }}</template></p>
              <p v-if="s.note" class="note small">“{{ s.note }}”</p>
              <p v-if="s.status === 'pending'" class="small wait">รอพิจารณา — ครบกำหนด SLA 3 วันทำการ เกินแล้วส่งเตือนซ้ำและแจ้งผู้รับมอบอำนาจแทน</p>
              <p v-if="s.status === 'pending' && s.approver === 'exec'" class="small muted">ผู้รับมอบอำนาจแทนช่วงลา: Kittiya R. (รองผู้บริหาร) (ตั้งค่าใน Settings)</p>
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
      <p><span>ถึง</span> {{ person(APPROVER_OF[APPROVAL_CHAIN[0].role])?.name }} ({{ APPROVAL_CHAIN[0].label }})</p>
      <p><span>ถัดไป</span> {{ person(APPROVER_OF[APPROVAL_CHAIN[1].role])?.name }} ({{ APPROVAL_CHAIN[1].label }}) — ได้รับคำขอหลังขั้นแรกอนุมัติ</p>
      <p><span>เรื่อง</span> [ขออนุมัติราคา] {{ p.code }} {{ p.name }}</p>
      <div class="mbody">
        เรียน คุณ{{ person(APPROVER_OF[APPROVAL_CHAIN[0].role])?.name }}<br /><br />
        ขออนุมัติราคาโครงการ {{ p.name }} ลูกค้า {{ p.customer }}<br />
        ราคาเสนอ {{ baht(Math.round(rev)) }} · ต้นทุน {{ baht(Math.round(total)) }} · GP {{ gpPct.toFixed(1) }}%<br /><br />
        ปุ่ม “อนุมัติ” และ “ส่งกลับแก้ไข” อยู่ในอีเมลนี้ (Outlook Actionable Message) หรือเปิดในระบบ
      </div>
    </div>
    <fieldset class="field meet">
      <legend>บันทึกการประชุมก่อนส่ง <span class="req">จำเป็น</span></legend>
      <p class="hint">SM นัดประชุมชี้แจงผู้อนุมัติก่อนส่งอีเมล ผู้อนุมัติจะเห็นบันทึกนี้ใน Mail Inbox</p>
      <div class="row2">
        <div class="field"><label for="md">วันที่ประชุม</label><input id="md" v-model="meet.date" type="date" class="input" /></div>
        <div class="field"><label for="mp">สถานที่ / ช่องทาง</label><input id="mp" v-model="meet.place" class="input" /></div>
      </div>
      <div class="field">
        <span class="lbl">ผู้เข้าประชุม</span>
        <div class="att"><label v-for="u in meetPeople" :key="u.id"><input v-model="meet.attendees" type="checkbox" :value="u.id" /> {{ u.name }}</label></div>
      </div>
      <div class="field"><label for="ms">สรุปผลการประชุม</label><textarea id="ms" v-model="meet.summary" class="input" rows="2" placeholder="เช่น ปรับ Margin Hardware เหลือ 12%" /></div>
    </fieldset>
    <div class="field"><label for="m">ข้อความถึงผู้อนุมัติ (ไม่บังคับ)</label><textarea id="m" v-model="msg" class="input" rows="2" /></div>
    <template #foot><button class="btn" @click="sendOpen = false">ยกเลิก</button><button class="btn primary" :disabled="!meetOk" @click="submit">ส่งขออนุมัติ</button></template>
  </Dialog>

  <Dialog :open="!!decideOpen" :title="decideOpen === 'approve' ? `อนุมัติราคา ${p.approval?.version}` : 'ส่งกลับให้ SM แก้ไข'" @close="decideOpen = null">
    <p>{{ p.name }} · {{ baht(Math.round(rev)) }} · GP {{ gpPct.toFixed(1) }}%</p>
    <div class="field">
      <label for="n">{{ decideOpen === 'approve' ? 'ความเห็น (ไม่บังคับ)' : 'สิ่งที่ต้องแก้ไข' }}</label>
      <textarea id="n" v-model="note" class="input" rows="3" />
      <span v-if="decideOpen === 'reject'" class="hint">SM จะเห็นข้อความนี้ในอีเมลและในประวัติเวอร์ชัน</span>
    </div>
    <fieldset v-if="decideOpen === 'reject'" class="field fx">
      <legend>เอกสารที่ต้องแก้</legend>
      <label v-for="d in FIX_DOCS" :key="d"><input v-model="fix" type="checkbox" :value="d" /> {{ d }}</label>
    </fieldset>
    <template #foot>
      <button class="btn" @click="decideOpen = null">ยกเลิก</button>
      <button class="btn primary" :disabled="decideOpen === 'reject' && (!note.trim() || !fix.length)" @click="decide">{{ decideOpen === 'approve' ? 'อนุมัติ' : 'ส่งกลับแก้ไข' }}</button>
    </template>
  </Dialog>

  <Dialog :open="saleOpen" title="ส่งใบเสนอราคาให้ Sale" @close="saleOpen = false">
    <p>ระบบแปลงแท็บ Quotation เป็น PDF ({{ p.approval?.version }} ที่อนุมัติแล้ว) แนบในอีเมลถึง <strong>{{ p.sales.length ? p.sales.join(', ') : 'Sale ที่ดูแลลูกค้า' }}</strong> เพื่อส่งต่อให้ลูกค้าและยื่นประมูล</p>
    <p class="hint">Sale ไม่ได้ใช้ One Platform — รับไฟล์ทางอีเมลเท่านั้น</p>
    <template #foot><button class="btn" @click="saleOpen = false">ยกเลิก</button><button class="btn primary" @click="saleOpen = false; notify('ส่งใบเสนอราคา PDF ให้ Sale แล้ว')">ส่งใบเสนอราคา</button></template>
  </Dialog>
</template>

<style scoped>
.lockbox { display: flex; gap: 16px; align-items: flex-start; color: var(--muted); }
.lockbox h3 { color: var(--ink); margin-bottom: 4px; }
.cs { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; align-items: start; }
.bookhead { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }
.xl { width: 42px; height: 42px; border-radius: var(--r-sm); background: #e4f2ea; color: #1d6f42; display: grid; place-items: center; flex: none; }
.bookhead > div:nth-child(2) { flex: 1 1 260px; min-width: 0; }
.bookhead h3 { overflow-wrap: anywhere; }
.acts { display: flex; gap: 8px; flex-wrap: wrap; }
.sheet .g td { background: var(--sunken); font-weight: 600; font-size: 13px; color: var(--ink-2); }
.sheet .t td { font-weight: 700; border-top: 2px solid var(--ink); font-family: var(--display); }
.quote { display: grid; gap: 0; max-width: 520px; }
.qrow { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--line); font-size: 14px; }
.qrow span { color: var(--muted); }
.qrow.big { border-bottom: 0; font-size: 18px; }
.qrow.big b { font-size: 24px; }
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
.rec { display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; margin: 0 0 14px; font-size: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--line); }
.rec dt { color: var(--muted); }
.rec dd { margin: 0; text-align: right; }
.stale { background: var(--warn-soft); color: var(--warn); border-radius: var(--r-md); padding: 12px 14px; font-size: 14px; margin-bottom: 14px; }
.stale strong { color: var(--warn); }
.decide { display: flex; gap: 8px; margin-top: 4px; }
.vers { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.vers li { display: grid; grid-template-columns: 34px 1fr; gap: 10px; }
.vtag { font-size: 12px; font-weight: 600; background: var(--idle-soft); border-radius: 4px; height: 22px; display: grid; place-items: center; }
.mail { border: 1px solid var(--line); border-radius: var(--r-md); padding: 14px 16px; display: grid; gap: 6px; font-size: 14px; }
.mail span { display: inline-block; width: 56px; color: var(--muted); }
.mbody { margin-top: 8px; padding-top: 12px; border-top: 1px solid var(--line); color: var(--ink-2); }
@media (max-width: 1100px) { .cs { grid-template-columns: 1fr; } }
.fx { border: 0; padding: 0; display: flex; gap: 14px; flex-wrap: wrap; }
.fx legend { font-size: 13px; color: var(--ink-2); margin-bottom: 6px; width: 100%; }
.fx label { display: flex; gap: 6px; align-items: center; font-size: 14px; }
.meet { border: 1px solid var(--line); border-radius: var(--r-md); padding: 12px 14px; display: grid; gap: 10px; margin: 12px 0; }
.meet legend { font-weight: 600; padding: 0 6px; }
.meet .req { font-size: 12px; color: var(--warn); font-weight: 500; }
.row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.att { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 14px; }
.lbl { font-size: 13px; color: var(--muted); }
</style>
