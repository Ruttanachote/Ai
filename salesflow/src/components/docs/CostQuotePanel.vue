<script setup lang="ts">
// Cost Sheet & Quotation (Template spec): revisions with 6 statuses, Create / Upload, Send to
// Approve as a pair (slide-over), approval progress "x of 3 steps", approve / reject for the
// approver, cancel for the submitter. Approved documents are locked; any change is a new revision.
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NDrawer, NDrawerContent } from 'naive-ui'
import Icon from '../Icon.vue'
import Dialog from '../Dialog.vue'
import Avatar from '../Avatar.vue'
import { DOC_STATUS, type CostSheet, type Project, type Quotation } from '../../data/model'
import { PEOPLE, TODAY_ISO, baht, person, thDate } from '../../data/mock'
import { APPROVER_OF, canDecideStep, decideApproval, notify, session } from '../../store'
import { APPROVAL_CHAIN } from '../../data/model'
import { costTotals, quoteTotals, extOf, XLSX_MAX_MB } from '../../domain/salesdocs'
import { cancelApproval, canSeeCost, isOwner, log, nextCostRevision, saveCostSheet, sendToApprove, blankCostSheet } from '../../docstore'

const props = defineProps<{ p: Project }>()
const router = useRouter()
const locked = computed(() => props.p.stage === 'opportunity')
const owner = computed(() => isOwner(props.p))
const sheets = computed(() => (props.p.costSheets ?? []).slice().sort((a, b) => b.revision - a.revision))
const quotes = computed(() => (props.p.quotations ?? []).slice().sort((a, b) => b.revision - a.revision))
const csOf = (q: Quotation) => props.p.costSheets?.find((c) => c.id === q.costSheetId)
const editable = (x: { status: string }) => x.status === 'DRAFT'

/* ---------- approval ---------- */
const a = computed(() => props.p.approval)
const done = computed(() => a.value?.steps.filter((s) => s.status === 'approved').length ?? 0)
const pending = computed(() => (a.value?.status === 'pending' ? a.value.steps.find((s) => s.status === 'pending') : undefined))
const canDecide = computed(() => !!pending.value && canDecideStep(pending.value, session.role) && a.value?.submittedBy !== session.userId)
const decideOpen = ref<null | 'approve' | 'reject'>(null)
const note = ref('')
const fix = ref<string[]>([])
function decide() {
  if (!decideOpen.value) return
  decideApproval(props.p, decideOpen.value, note.value, fix.value, 'web')
  notify(decideOpen.value === 'approve' ? 'อนุมัติแล้ว' : 'ส่งกลับให้ SM แก้ไขแล้ว — ต้องสร้าง revision ใหม่')
  decideOpen.value = null; note.value = ''; fix.value = []
}

/* ---------- send to approve (slide-over) ---------- */
const send = reactive({ open: false, cs: '', qt: '', message: '', date: TODAY_ISO, place: 'Teams', attendees: [APPROVER_OF.deputy!, APPROVER_OF.exec!] as string[], summary: '', tried: false })
const draftSheets = computed(() => sheets.value.filter(editable))
const draftQuotes = computed(() => quotes.value.filter((q) => editable(q) && q.costSheetId === send.cs))
const selCs = computed(() => props.p.costSheets?.find((c) => c.id === send.cs))
const selQt = computed(() => props.p.quotations?.find((q) => q.id === send.qt))
const mismatch = computed(() => (selCs.value && selQt.value ? Math.abs(quoteTotals(selQt.value).subtotal - costTotals(selCs.value).revenue) >= 0.01 : false))
const meetPeople = PEOPLE.filter((u) => ['head', 'deputy', 'exec', 'pmo'].includes(u.role))
const sendErr = computed(() => ({
  cs: !selCs.value ? 'เลือก Cost Sheet (Draft)' : '',
  qt: !selQt.value ? 'สร้าง Quotation จาก Cost Sheet นี้ก่อน' : '',
  summary: send.summary.trim().length < 10 ? 'สรุปผลการประชุมอย่างน้อย 10 ตัวอักษร' : '',
  attendees: !send.attendees.length ? 'เลือกผู้เข้าประชุม' : '',
}))
const busy = computed(() => a.value?.status === 'pending')
function openSend() {
  send.cs = draftSheets.value[0]?.id ?? ''
  send.qt = quotes.value.find((q) => editable(q) && q.costSheetId === send.cs)?.id ?? ''
  send.tried = false; send.open = true
}
function pickCs() { send.qt = quotes.value.find((q) => editable(q) && q.costSheetId === send.cs)?.id ?? '' }
function submit() {
  send.tried = true
  if (Object.values(sendErr.value).some(Boolean)) return
  sendToApprove(props.p, selCs.value!, selQt.value!, send.message, { date: send.date, place: send.place, attendees: [...send.attendees], summary: send.summary.trim() })
  send.open = false; send.message = ''; send.summary = ''
}
function cancel() { cancelApproval(props.p); notify('ยกเลิกคำขออนุมัติแล้ว — เอกสารเป็น Cancelled สร้าง revision ใหม่เพื่อส่งอีกครั้ง') }

/* ---------- revisions + upload ---------- */
function newRevision(cs: CostSheet) {
  const n = nextCostRevision(props.p, cs)
  saveCostSheet(props.p, n)
  router.push(`/projects/${props.p.id}/cost-sheet/${n.id}`)
}
const upl = reactive({ open: false, file: null as File | null, err: '', revenue: null as number | null, cogs: null as number | null, tried: false })
function pickXlsx(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] ?? null
  upl.file = f
  upl.err = !f ? '' : extOf(f.name) !== 'xlsx' ? 'Upload รองรับเฉพาะไฟล์ .xlsx' : f.size > XLSX_MAX_MB * 1024 * 1024 ? `รองรับเฉพาะไฟล์ .xlsx ไม่เกิน ${XLSX_MAX_MB} MB` : ''
}
function saveUpload() {
  upl.tried = true
  if (!upl.file || upl.err || !(Number(upl.revenue) >= 0) || !(Number(upl.cogs) >= 0) || upl.revenue === null || upl.cogs === null) return
  const cs = blankCostSheet(props.p)
  cs.source = 'upload'; cs.fileName = upl.file.name
  cs.items = [{ id: 'u1', category: 'other', description: `ต้นทุนรวมจากไฟล์ ${upl.file.name}`, amount: Number(upl.cogs) }]
  cs.revenue = Number(upl.revenue)
  cs.entertainment = { mode: 'baht', value: 0 }; cs.contingency = { mode: 'baht', value: 0 }
  saveCostSheet(props.p, cs)
  log(props.p, 'file', `อัปโหลด Cost Sheet ${upl.file.name} เป็น rev.${cs.revision}`)
  upl.open = false; upl.file = null; upl.revenue = null; upl.cogs = null; upl.tried = false
  notify(`สร้าง Cost Sheet rev.${cs.revision} จากไฟล์แล้ว`)
}
const saleOpen = ref(false)
const approved = computed(() => a.value?.status === 'approved')
const STEP: Record<string, string> = { approved: 'อนุมัติ', rejected: 'ส่งกลับ', pending: 'รอพิจารณา', waiting: 'ยังไม่ถึงคิว' }
</script>

<template>
  <div v-if="!canSeeCost(p)" class="panel lockbox"><Icon name="lock" :size="22" /><div><h3>Cost Sheet มีต้นทุนภายใน</h3><p class="muted">เปิดได้เฉพาะ Owner, SM, ผู้อนุมัติ และผู้บริหาร</p></div></div>
  <div v-else-if="locked" class="panel lockbox"><Icon name="lock" :size="22" /><div><h3>Cost Sheet และ Quotation เปิดเมื่อเป็น Pipeline</h3><p class="muted">เปลี่ยนสถานะเป็น Pipeline เมื่อลูกค้าเริ่มเจรจา แล้วสร้าง Cost Sheet จาก Template ได้ทันที</p></div></div>
  <div v-else class="cq">
    <div class="main">
      <section class="panel">
        <div class="panel-head">
          <h2><Icon name="excel" :size="18" /> Cost Sheet</h2>
          <div v-if="owner" class="acts">
            <button class="btn sm" @click="upl.open = true"><Icon name="upload" :size="14" /> Upload .xlsx</button>
            <router-link :to="`/projects/${p.id}/cost-sheet/new`" class="btn primary sm">+ Create</router-link>
          </div>
        </div>
        <div class="cards">
          <article v-for="cs in sheets" :key="cs.id" class="card">
            <header><strong>{{ cs.docNo }} <span class="rev">rev.{{ cs.revision }}</span></strong><span class="chip" :class="DOC_STATUS[cs.status].tone">{{ DOC_STATUS[cs.status].label }}</span></header>
            <p class="small muted">{{ person(cs.createdBy)?.name }} · {{ thDate(cs.preparedAt) }}{{ cs.source === 'upload' ? ' · อัปโหลด ' + cs.fileName : '' }}</p>
            <dl><dt>Revenue</dt><dd class="num">{{ baht(costTotals(cs).revenue) }}</dd><dt>COGS</dt><dd class="num">{{ baht(costTotals(cs).cogs) }}</dd><dt>GM%</dt><dd class="num" :class="costTotals(cs).gmPct < 25 ? 'bad' : 'good'">{{ costTotals(cs).gmPct }}%</dd><dt>CM%</dt><dd class="num">{{ costTotals(cs).cmPct }}%</dd></dl>
            <footer>
              <router-link :to="`/projects/${p.id}/cost-sheet/${cs.id}`" class="btn sm">{{ editable(cs) && owner ? 'แก้ไข' : 'เปิดดู' }}</router-link>
              <router-link v-if="owner && cs.status !== 'CANCELLED'" :to="`/projects/${p.id}/quotation/new?cs=${cs.id}`" class="btn sm">สร้าง Quotation</router-link>
              <button v-if="owner && !editable(cs) && cs.status !== 'PENDING'" class="btn ghost sm" @click="newRevision(cs)">สร้าง revision ใหม่</button>
            </footer>
          </article>
          <div v-if="!sheets.length" class="empty"><p><strong>ยังไม่มี Cost Sheet</strong></p><p class="small muted">สร้างจาก Template ในระบบ (แนะนำ) หรืออัปโหลดไฟล์ .xlsx · ต้องอนุมัติก่อนเปลี่ยนเป็น Forecast</p><router-link v-if="owner" :to="`/projects/${p.id}/cost-sheet/new`" class="btn primary sm">+ Create Cost Sheet</router-link></div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2><Icon name="file" :size="18" /> Quotation</h2>
          <router-link v-if="owner && sheets.length" :to="`/projects/${p.id}/quotation/new?cs=${sheets[0].id}`" class="btn primary sm">+ Create</router-link>
        </div>
        <div class="cards">
          <article v-for="q in quotes" :key="q.id" class="card">
            <header><strong>{{ q.docNo }} <span class="rev">rev.{{ q.revision }}</span></strong><span class="chip" :class="DOC_STATUS[q.status].tone">{{ DOC_STATUS[q.status].label }}</span></header>
            <p class="small muted">อ้างอิง {{ csOf(q)?.docNo }} rev.{{ csOf(q)?.revision }} · ยืนราคาถึง {{ thDate(q.validUntil) }}</p>
            <dl><dt>Subtotal</dt><dd class="num">{{ baht(quoteTotals(q).subtotal) }}</dd><dt>Grand Total</dt><dd class="num">{{ baht(quoteTotals(q).grand) }}</dd></dl>
            <p v-if="csOf(q) && Math.abs(quoteTotals(q).subtotal - costTotals(csOf(q)!).revenue) >= 0.01" class="warnbox small">Subtotal ไม่ตรงกับ Revenue ใน Cost Sheet</p>
            <footer><router-link :to="`/projects/${p.id}/quotation/${q.id}`" class="btn sm">{{ editable(q) && owner ? 'แก้ไข' : 'เปิดดู / PDF' }}</router-link></footer>
          </article>
          <div v-if="!quotes.length" class="empty"><p><strong>ยังไม่มี Quotation</strong></p><p class="small muted">สร้างจาก Cost Sheet — ระบบเติมรายการและราคาให้ตรงกับ Revenue</p></div>
        </div>
      </section>
    </div>

    <aside class="side">
      <section class="panel">
        <h3>การอนุมัติ</h3>
        <template v-if="a">
          <p class="prog"><b>{{ done }} of {{ a.steps.length }}</b> steps completed<span class="chip" :class="approved ? 'win' : a.status === 'rejected' ? 'lose' : a.status === 'recalled' ? '' : 'warn'">{{ approved ? 'Approved' : a.status === 'rejected' ? 'Rejected' : a.status === 'recalled' ? 'Cancelled' : 'Pending' }}</span></p>
          <p class="small muted">{{ a.archivedPath ?? a.version }} · ส่ง {{ a.submittedAt }}</p>
          <ol class="steps">
            <li v-for="s in a.steps" :key="s.role" :class="s.status"><span class="dot" /><div><strong>{{ s.role }}</strong><p class="small">{{ s.who }}<template v-if="s.at"> · {{ s.at }}</template> · {{ s.approver ? STEP[s.status] : 'ส่งคำขอ' }}</p><p v-if="s.note" class="note small">“{{ s.note }}”</p></div></li>
          </ol>
          <div class="sa">
            <template v-if="canDecide"><button class="btn danger sm" @click="decideOpen = 'reject'">Reject</button><button class="btn primary sm" @click="decideOpen = 'approve'">Approve</button></template>
            <button v-if="busy && a.submittedBy === session.userId" class="btn sm" @click="cancel">ยกเลิกคำขอ</button>
            <button v-if="owner && approved" class="btn sm" @click="saleOpen = true"><Icon name="mail" :size="14" /> ส่ง Quotation PDF ให้ Sale</button>
          </div>
        </template>
        <p v-else class="small muted">ยังไม่ได้ส่งขออนุมัติ</p>
        <button v-if="owner && !busy" class="btn primary block" :disabled="!draftSheets.length" @click="openSend"><Icon name="mail" :size="16" /> Send to Approve</button>
        <p v-if="owner && !busy && !draftSheets.length" class="hint">ต้องมี Cost Sheet สถานะ Draft — ถ้าถูก Reject หรือ Cancel ให้สร้าง revision ใหม่</p>
        <p class="hint">ส่ง Cost Sheet + Quotation คู่กัน · รองผู้บริหาร → ผู้บริหาร · อนุมัติครบแล้วล็อกเอกสารและอัปเดต Revenue / COGS / GP / CM ของโครงการ · ต้องอนุมัติก่อนเปลี่ยนเป็น Forecast</p>
      </section>
    </aside>
  </div>

  <!-- Send to Approve slide-over -->
  <NDrawer v-model:show="send.open" :width="520" placement="right">
    <NDrawerContent title="Send to Approve" closable>
      <div class="sf">
        <div class="field" :class="{ bad: send.tried && sendErr.cs }">
          <label for="scs">Cost Sheet</label>
          <select id="scs" v-model="send.cs" class="input" @change="pickCs"><option v-for="c in draftSheets" :key="c.id" :value="c.id">{{ c.docNo }} rev.{{ c.revision }} · {{ baht(costTotals(c).revenue) }} · GM {{ costTotals(c).gmPct }}%</option></select>
          <span v-if="send.tried && sendErr.cs" class="msg">{{ sendErr.cs }}</span>
        </div>
        <div class="field" :class="{ bad: send.tried && sendErr.qt }">
          <label for="sqt">Quotation</label>
          <select id="sqt" v-model="send.qt" class="input"><option v-for="q in draftQuotes" :key="q.id" :value="q.id">{{ q.docNo }} rev.{{ q.revision }} · Subtotal {{ baht(quoteTotals(q).subtotal) }}</option></select>
          <span v-if="send.tried && sendErr.qt" class="msg">{{ sendErr.qt }} <router-link v-if="send.cs" :to="`/projects/${p.id}/quotation/new?cs=${send.cs}`">สร้าง Quotation</router-link></span>
          <span v-else-if="mismatch" class="warnmsg">Subtotal ของ Quotation ไม่ตรงกับ Revenue ใน Cost Sheet</span>
        </div>
        <div class="chain"><p class="small"><b>ลำดับผู้อนุมัติ</b></p><p v-for="(c, i) in APPROVAL_CHAIN" :key="c.role" class="small"><Avatar :id="APPROVER_OF[c.role]" :size="22" /> {{ i + 1 }}. {{ person(APPROVER_OF[c.role])?.name }} ({{ c.label }})</p></div>
        <fieldset class="field meet">
          <legend>บันทึกการประชุมก่อนส่ง <span class="req">จำเป็น</span></legend>
          <div class="row2">
            <div class="field"><label for="smd">วันที่ประชุม</label><input id="smd" v-model="send.date" type="date" class="input" /></div>
            <div class="field"><label for="smp">สถานที่ / ช่องทาง</label><input id="smp" v-model="send.place" class="input" /></div>
          </div>
          <div class="field" :class="{ bad: send.tried && sendErr.attendees }"><span class="lbl">ผู้เข้าประชุม</span><div class="att"><label v-for="u in meetPeople" :key="u.id"><input v-model="send.attendees" type="checkbox" :value="u.id" /> {{ u.name }}</label></div><span v-if="send.tried && sendErr.attendees" class="msg">{{ sendErr.attendees }}</span></div>
          <div class="field" :class="{ bad: send.tried && sendErr.summary }"><label for="sms">สรุปผลการประชุม</label><textarea id="sms" v-model="send.summary" class="input" rows="2" /><span v-if="send.tried && sendErr.summary" class="msg">{{ sendErr.summary }}</span></div>
        </fieldset>
        <div class="field"><label for="smsg">หมายเหตุถึงผู้อนุมัติ (ไม่บังคับ)</label><textarea id="smsg" v-model="send.message" class="input" rows="2" /></div>
        <div class="sfoot"><button class="btn" @click="send.open = false">ยกเลิก</button><button class="btn primary" @click="submit">ส่งขออนุมัติ</button></div>
      </div>
    </NDrawerContent>
  </NDrawer>

  <Dialog :open="!!decideOpen" :title="decideOpen === 'approve' ? `Approve ${a?.version}` : 'Reject · ส่งกลับให้ SM แก้ไข'" @close="decideOpen = null">
    <div class="field"><label for="dn2">{{ decideOpen === 'approve' ? 'Note (ไม่บังคับ)' : 'เหตุผล (บังคับ)' }}</label><textarea id="dn2" v-model="note" class="input" rows="3" /></div>
    <fieldset v-if="decideOpen === 'reject'" class="field fx"><legend>เอกสารที่ต้องแก้</legend><label v-for="d in ['Cost Sheet', 'Quotation']" :key="d"><input v-model="fix" type="checkbox" :value="d" /> {{ d }}</label></fieldset>
    <template #foot><button class="btn" @click="decideOpen = null">ยกเลิก</button><button class="btn" :class="decideOpen === 'approve' ? 'primary' : 'danger'" :disabled="decideOpen === 'reject' && (!note.trim() || !fix.length)" @click="decide">{{ decideOpen === 'approve' ? 'Approve' : 'Reject' }}</button></template>
  </Dialog>

  <Dialog :open="upl.open" title="Upload Cost Sheet (.xlsx)" @close="upl.open = false">
    <div class="sf">
      <div class="field" :class="{ bad: upl.err || (upl.tried && !upl.file) }"><label for="ux">ไฟล์ .xlsx (ไม่เกิน {{ XLSX_MAX_MB }} MB)</label><input id="ux" type="file" accept=".xlsx" class="input" @change="pickXlsx" /><span v-if="upl.err" class="msg">{{ upl.err }}</span><span v-else-if="upl.tried && !upl.file" class="msg">เลือกไฟล์</span></div>
      <div class="row2">
        <div class="field" :class="{ bad: upl.tried && upl.revenue === null }"><label for="urv">Revenue ก่อน VAT</label><input id="urv" v-model.number="upl.revenue" type="number" min="0" class="input num" /><span class="hint">ระบบจริงอ่านจาก Named range ในไฟล์</span></div>
        <div class="field" :class="{ bad: upl.tried && upl.cogs === null }"><label for="ucg">COGS</label><input id="ucg" v-model.number="upl.cogs" type="number" min="0" class="input num" /></div>
      </div>
    </div>
    <template #foot><button class="btn" @click="upl.open = false">ยกเลิก</button><button class="btn primary" @click="saveUpload">อัปโหลดเป็น revision ใหม่</button></template>
  </Dialog>

  <Dialog :open="saleOpen" title="ส่ง Quotation ให้ Sale" @close="saleOpen = false">
    <p>ระบบแนบ PDF ของ Quotation ที่อนุมัติแล้วในอีเมลถึง <strong>{{ p.sales.join(', ') || 'Sale ที่ดูแลลูกค้า' }}</strong> เพื่อส่งต่อลูกค้าและยื่นประมูล</p>
    <p class="hint">Sale ไม่ได้ใช้ One Platform — รับไฟล์ทางอีเมลเท่านั้น</p>
    <template #foot><button class="btn" @click="saleOpen = false">ยกเลิก</button><button class="btn primary" @click="saleOpen = false; log(p, 'document', 'ส่ง Quotation PDF ให้ Sale'); notify('ส่ง Quotation PDF ให้ Sale แล้ว')">ส่ง</button></template>
  </Dialog>
</template>

<style scoped>
.lockbox { display: flex; gap: 14px; align-items: center; }
.lockbox h3 { margin: 0; }
.cq { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; align-items: start; }
.main { display: grid; gap: 20px; }
.panel-head h2 { display: flex; gap: 8px; align-items: center; font-size: 18px; }
.acts { display: flex; gap: 8px; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
.card { border: 1px solid var(--line); border-radius: var(--r-md); padding: 14px; display: grid; gap: 8px; align-content: start; }
.card header { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
.card p { margin: 0; }
.rev { font-weight: 400; color: var(--muted); }
.card dl { display: grid; grid-template-columns: auto 1fr; gap: 2px 12px; margin: 0; font-size: 14px; }
.card dt { color: var(--muted); }
.card dd { margin: 0; text-align: right; }
.card footer { display: flex; gap: 6px; flex-wrap: wrap; }
.good { color: var(--win); } .bad { color: var(--lose); }
.warnbox { background: var(--warn-soft); color: var(--warn); padding: 6px 10px; border-radius: var(--r-sm); }
.empty { grid-column: 1 / -1; display: grid; justify-items: center; gap: 6px; padding: 24px; text-align: center; border: 1px dashed var(--line-strong); border-radius: var(--r-md); }
.empty p { margin: 0; }
.side h3 { margin: 0 0 8px; }
.prog { display: flex; gap: 8px; align-items: center; justify-content: space-between; margin: 0; }
.steps { list-style: none; margin: 12px 0; padding: 0; display: grid; gap: 10px; }
.steps li { display: grid; grid-template-columns: 12px 1fr; gap: 10px; }
.steps p { margin: 0; }
.dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 6px; background: var(--line-strong); }
.approved .dot { background: var(--win); } .pending .dot { background: var(--warn); } .rejected .dot { background: var(--lose); }
.note { background: var(--sunken); padding: 4px 8px; border-radius: var(--r-sm); margin-top: 4px !important; }
.sa { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.block { width: 100%; }
.sf { display: grid; gap: 14px; }
.chain { border: 1px solid var(--line); border-radius: var(--r-md); padding: 10px 12px; display: grid; gap: 6px; }
.chain p { margin: 0; display: flex; gap: 8px; align-items: center; }
.meet { border: 1px solid var(--line); border-radius: var(--r-md); padding: 12px; display: grid; gap: 10px; margin: 0; }
.meet legend { font-weight: 600; padding: 0 6px; }
.req { font-size: 12px; color: var(--warn); font-weight: 500; }
.row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.att { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 14px; }
.lbl { font-size: 13px; color: var(--muted); }
.msg { font-size: 12px; color: var(--lose); }
.warnmsg { font-size: 12px; color: var(--warn); }
.bad .input { border-color: var(--lose); }
.fx { border: 0; padding: 0; display: grid; gap: 6px; margin-top: 12px; }
.sfoot { display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--line); padding-top: 12px; }
@media (max-width: 1100px) { .cq { grid-template-columns: 1fr; } }
@media (max-width: 560px) { .row2 { grid-template-columns: 1fr; } }
</style>
