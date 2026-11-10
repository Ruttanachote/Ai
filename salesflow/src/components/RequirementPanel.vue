<script setup lang="ts">
// Requirement & TOR (pre-sale): Requirement Overview + Process, customer meetings, TOR Final with
// the group head's review, and the Proposal from the template. Shows what Forecast (70%) needs.
import { computed, reactive, ref } from 'vue'
import Dialog from './Dialog.vue'
import { CATALOG, person, thDate, TODAY_ISO, PEOPLE, groupOf } from '../data/mock'
import type { Project } from '../data/model'
import { notify, pushNotices, session } from '../store'

const props = defineProps<{ p: Project }>()
const req = computed(() => props.p.requirement)
const isOwner = computed(() => props.p.sm === session.userId || props.p.collaborators.includes(session.userId) || session.role === 'admin')
const headId = computed(() => PEOPLE.find((u) => u.role === 'head' && (u.team === props.p.team || groupOf(u.team ?? '') === groupOf(props.p.team)))?.id)
const isHead = computed(() => (session.role === 'head' && session.userId === headId.value) || session.role === 'admin')
const catalog = computed(() => CATALOG.find((c) => c.id === props.p.catalogId))

function ensure() { if (!props.p.requirement) props.p.requirement = { overview: '', process: '', meetings: [] } }
const touch = () => { ensure(); props.p.requirement!.updated = TODAY_ISO }

const mt = reactive({ open: false, at: TODAY_ISO, title: '', notes: '' })
function addMeeting() {
  ensure()
  props.p.requirement!.meetings.unshift({ at: mt.at, title: mt.title.trim(), notes: mt.notes.trim() })
  touch(); Object.assign(mt, { open: false, title: '', notes: '' })
  notify('บันทึกการประชุมกับลูกค้าแล้ว')
}

const docs = computed(() => props.p.salesDocs ?? {})
function uploadTor(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  props.p.salesDocs = { ...docs.value, tor: f.name }
  props.p.torReview = undefined
  notify(`แนบ ${f.name} ในโฟลเดอร์ TOR แล้ว — ส่งหัวหน้ากลุ่มตรวจก่อนส่งลูกค้า`)
  ;(e.target as HTMLInputElement).value = ''
}
function sendReview() {
  const v = (props.p.torReview?.version ?? 0) + 1
  props.p.torReview = { status: 'pending', version: v, at: TODAY_ISO }
  if (headId.value) pushNotices([{ to: headId.value, projectId: props.p.id, text: `ขอตรวจ TOR Final v${v} · ${props.p.name} ก่อนส่งลูกค้า` }])
  notify('ส่ง TOR Final ให้หัวหน้ากลุ่มตรวจแล้ว')
}
const decide = ref<null | 'approved' | 'returned'>(null)
const note = ref('')
function doDecide() {
  if (!props.p.torReview || !decide.value) return
  Object.assign(props.p.torReview, { status: decide.value, by: session.userId, decidedAt: TODAY_ISO, note: note.value.trim() || undefined })
  pushNotices([{ to: props.p.sm, projectId: props.p.id, text: `TOR Final ${props.p.name}: ${decide.value === 'approved' ? 'ผ่าน — ส่งลูกค้าได้' : 'ส่งกลับแก้: ' + note.value.trim()}` }])
  notify(decide.value === 'approved' ? 'ผ่าน TOR Final แล้ว' : 'ส่งกลับให้ SM แก้แล้ว')
  decide.value = null; note.value = ''
}
function makeProposal() {
  const name = `Proposal-${props.p.code}-v1.docx`
  props.p.salesDocs = { ...docs.value, proposal: name }
  notify(`สร้าง ${name} จาก ${catalog.value?.proposal ?? 'Template มาตรฐาน DT'} ในโฟลเดอร์ Proposal แล้ว (เปิดแก้ใน Word Online)`)
}
// What Forecast (70%) needs — the same rule the stage move checks.
const checks = computed(() => [
  { t: 'Requirement Overview + Process', ok: !!req.value?.overview && !!req.value?.process },
  { t: 'Cost Sheet + ใบเสนอราคาอนุมัติแล้ว', ok: props.p.approval?.steps.every((s) => s.status === 'approved') ?? false },
  { t: 'TOR Final ผ่านหัวหน้ากลุ่ม', ok: props.p.torReview?.status === 'approved' },
  { t: 'Proposal', ok: !!docs.value.proposal },
])
const STATUS = { pending: ['รอหัวหน้าตรวจ', 'warn'], approved: ['ผ่านแล้ว', 'win'], returned: ['ส่งกลับแก้', 'lose'] } as const
</script>

<template>
  <div class="rq">
    <section class="panel">
      <div class="panel-head"><h2>Requirement</h2><span class="small muted">{{ req?.updated ? 'แก้ไขล่าสุด ' + thDate(req.updated) : 'ยังไม่บันทึก' }}<template v-if="catalog"> · Product-led จาก {{ catalog.name }}</template></span></div>
      <div class="field"><label for="ro">Requirement Overview (ภาพรวมระบบที่ต้องการ)</label>
        <textarea id="ro" :value="req?.overview" class="input" rows="4" :disabled="!isOwner" @change="ensure(); p.requirement!.overview = ($event.target as HTMLTextAreaElement).value; touch()" /></div>
      <div class="field"><label for="rp">Process การใช้งาน</label>
        <textarea id="rp" :value="req?.process" class="input" rows="4" :disabled="!isOwner" @change="ensure(); p.requirement!.process = ($event.target as HTMLTextAreaElement).value; touch()" /></div>
      <div class="panel-head mt"><h3>ประชุมกับลูกค้า</h3><button v-if="isOwner" class="btn sm" @click="mt.open = true">+ บันทึกประชุม</button></div>
      <ul class="mts"><li v-for="(m, i) in req?.meetings ?? []" :key="i"><b>{{ thDate(m.at) }}</b> · {{ m.title }}<p class="small muted">{{ m.notes }}</p></li>
        <li v-if="!(req?.meetings ?? []).length" class="small muted">ยังไม่มีบันทึกประชุม</li></ul>
    </section>

    <aside class="side">
      <section class="panel">
        <h3>TOR Final</h3>
        <p class="small">{{ docs.tor ? '📄 ' + docs.tor : 'ยังไม่แนบ' }}</p>
        <p v-if="p.torReview" class="small"><span class="chip" :class="STATUS[p.torReview.status][1]">{{ STATUS[p.torReview.status][0] }}</span>
          v{{ p.torReview.version }} · ส่ง {{ thDate(p.torReview.at) }}<template v-if="p.torReview.by"> · {{ person(p.torReview.by)?.name }} {{ thDate(p.torReview.decidedAt) }}</template></p>
        <p v-if="p.torReview?.note" class="note small">“{{ p.torReview.note }}”</p>
        <div class="acts">
          <label v-if="isOwner" class="btn sm">แนบ TOR Final<input type="file" hidden @change="uploadTor" /></label>
          <button v-if="isOwner && docs.tor && p.torReview?.status !== 'pending' && p.torReview?.status !== 'approved'" class="btn sm primary" @click="sendReview">ส่งหัวหน้ากลุ่มตรวจ</button>
          <template v-if="isHead && p.torReview?.status === 'pending'">
            <button class="btn sm primary" @click="decide = 'approved'">ผ่าน</button><button class="btn sm" @click="decide = 'returned'">ส่งกลับแก้</button>
          </template>
        </div>
        <p class="small muted">ผู้ตรวจ: {{ person(headId)?.name ?? 'หัวหน้ากลุ่ม' }} — ส่ง TOR ให้ลูกค้าได้หลังผ่านเท่านั้น</p>
      </section>
      <section class="panel">
        <h3>Proposal</h3>
        <p class="small">{{ docs.proposal ? '📄 ' + docs.proposal : 'ยังไม่มี' }}</p>
        <button v-if="isOwner && !docs.proposal" class="btn sm" @click="makeProposal">สร้างจาก Template</button>
      </section>
      <section class="panel">
        <h3>พร้อมเข้า Forecast (70%)</h3>
        <ul class="ck"><li v-for="c in checks" :key="c.t" :class="{ ok: c.ok }">{{ c.ok ? '✓' : '○' }} {{ c.t }}</li></ul>
      </section>
    </aside>

    <Dialog :open="mt.open" title="บันทึกประชุมกับลูกค้า" @close="mt.open = false">
      <div class="field"><label for="ma">วันที่</label><input id="ma" v-model="mt.at" type="date" class="input" /></div>
      <div class="field"><label for="mtt">หัวข้อ</label><input id="mtt" v-model="mt.title" class="input" /></div>
      <div class="field"><label for="mn">สรุป</label><textarea id="mn" v-model="mt.notes" class="input" rows="3" /></div>
      <template #foot><button class="btn" @click="mt.open = false">ยกเลิก</button><button class="btn primary" :disabled="!mt.title.trim()" @click="addMeeting">บันทึก</button></template>
    </Dialog>
    <Dialog :open="!!decide" :title="decide === 'approved' ? 'ผ่าน TOR Final' : 'ส่ง TOR Final กลับแก้'" @close="decide = null">
      <div class="field"><label for="tn">ความเห็น{{ decide === 'returned' ? ' (จำเป็น)' : '' }}</label><textarea id="tn" v-model="note" class="input" rows="3" /></div>
      <template #foot><button class="btn" @click="decide = null">ยกเลิก</button><button class="btn primary" :disabled="decide === 'returned' && !note.trim()" @click="doDecide">{{ decide === 'approved' ? 'ผ่าน' : 'ส่งกลับ' }}</button></template>
    </Dialog>
  </div>
</template>

<style scoped>
.rq { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 16px; align-items: start; }
.rq > .panel { display: grid; gap: 12px; }
.side { display: grid; gap: 12px; }
.side .panel { display: grid; gap: 8px; }
.mt { margin-top: 8px; }
.mts { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; font-size: 14px; }
.acts { display: flex; gap: 6px; flex-wrap: wrap; }
.note { color: var(--ink-2); font-style: italic; }
.ck { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; font-size: 14px; color: var(--muted); }
.ck li.ok { color: var(--win); }
@media (max-width: 1000px) { .rq { grid-template-columns: 1fr; } }
</style>
