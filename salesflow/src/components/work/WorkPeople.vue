<script setup lang="ts">
// Stakeholder register (both sides, Focal Points) and meetings (Kick-off, team, requirement,
// review) sent as Outlook / Teams invites from the register.
import { computed, reactive } from 'vue'
import Dialog from '../Dialog.vue'
import { person, thDate, TODAY_ISO } from '../../data/mock'
import { MEETING_KINDS, type Meeting, type Project, type Stakeholder } from '../../data/model'
import { notify, outbox, pushNotices, session } from '../../store'
import { canManage } from './actions'

const props = defineProps<{ p: Project; team: string[] }>()
const manager = computed(() => canManage(props.p))
const side = (s: Stakeholder['side']) => (props.p.stakeholders ?? []).filter((x) => x.side === s)

const sf = reactive({ open: false, side: 'customer' as Stakeholder['side'], name: '', position: '', email: '', phone: '', focal: false, topics: '' })
function addPerson() {
  const s: Stakeholder = { id: 'sh' + Date.now().toString(36), side: sf.side, name: sf.name.trim(), position: sf.position.trim(), email: sf.email.trim() || undefined, phone: sf.phone.trim() || undefined, focal: sf.focal, topics: sf.topics.trim() || undefined }
  if (s.focal) (props.p.stakeholders ?? []).filter((x) => x.side === s.side).forEach((x) => (x.focal = false))
  props.p.stakeholders = [...(props.p.stakeholders ?? []), s]
  Object.assign(sf, { open: false, name: '', position: '', email: '', phone: '', focal: false, topics: '' })
}

const mf = reactive({ open: false, kind: 'kickoff' as Meeting['kind'], title: '', date: TODAY_ISO, time: '10:00', place: 'Microsoft Teams', who: [] as string[] })
const invitees = computed(() => [
  ...(props.p.stakeholders ?? []).map((s) => ({ id: s.id, label: `${s.name} · ${s.position}${s.side === 'customer' ? ' (ลูกค้า)' : ''}` })),
  ...props.team.map((id) => ({ id, label: `${person(id)?.name} · ทีมโครงการ` })),
])
function openMeeting(kind: Meeting['kind']) {
  Object.assign(mf, { open: true, kind, title: `${MEETING_KINDS[kind]} ${props.p.name}`, who: kind === 'team' ? [...props.team] : invitees.value.map((x) => x.id) })
}
const nameOf = (id: string) => person(id)?.name ?? props.p.stakeholders?.find((s) => s.id === id)?.name ?? id
function sendInvite() {
  const m: Meeting = { id: 'mt' + Date.now().toString(36), kind: mf.kind, title: mf.title.trim(), date: mf.date, time: mf.time, attendees: [...mf.who], place: mf.place, sentAt: TODAY_ISO, by: session.userId }
  props.p.meetings = [m, ...(props.p.meetings ?? [])]
  outbox.unshift({ id: 'm' + Date.now(), at: TODAY_ISO, from: person(session.userId)?.name ?? 'PM', to: m.attendees.map(nameOf).join(', '), subject: `${m.title} · ${thDate(m.date)} ${m.time} · ${m.place}`, kind: 'email' })
  pushNotices(m.attendees.filter((id) => !!person(id) && id !== session.userId).map((id) => ({ to: id, projectId: props.p.id, text: `นัด ${m.title} ${thDate(m.date)} ${m.time}` })))
  // Meeting minutes page in the workspace docs, ready to fill in.
  if (props.p.workspace) props.p.workspace.docs = [{ id: 'd' + Date.now().toString(36), title: `บันทึกประชุม ${m.title}`, kind: 'meeting', owner: session.userId, created: TODAY_ISO, updated: TODAY_ISO, folder: 'PM Report' }, ...(props.p.workspace.docs ?? [])]
  mf.open = false
  notify(`ส่งนัดประชุมทาง Outlook + Teams ถึง ${m.attendees.length} คน และสร้างหน้าบันทึกประชุมแล้ว`)
}
</script>

<template>
  <div class="pp">
    <section class="panel">
      <div class="panel-head"><div><h2>Stakeholder Register</h2><p class="small muted">ผู้ประสานงานหลัก (Focal Point) ของแต่ละฝ่าย ใช้เป็นรายชื่อเชิญประชุมและผู้รับเอกสารส่งมอบ</p></div>
        <button v-if="manager" class="btn sm primary" @click="sf.open = true">+ เพิ่มผู้ติดต่อ</button></div>
      <div class="sides">
        <div v-for="s in (['customer', 'us'] as const)" :key="s">
          <h3>{{ s === 'customer' ? 'ฝ่ายผู้ว่าจ้าง (ลูกค้า)' : 'ฝ่ายผู้รับจ้าง (เรา)' }}</h3>
          <ul class="sh">
            <li v-for="x in side(s)" :key="x.id"><div><strong>{{ x.name }}</strong> <span v-if="x.focal" class="chip presale">Focal Point</span><p class="small muted">{{ x.position }}<template v-if="x.topics"> · {{ x.topics }}</template></p></div>
              <span class="small">{{ x.email }}<br />{{ x.phone }}</span></li>
            <li v-if="!side(s).length" class="small muted">ยังไม่มีรายชื่อ</li>
          </ul>
        </div>
      </div>
    </section>
    <section class="panel">
      <div class="panel-head"><div><h2>ประชุม</h2><p class="small muted">ส่งนัดผ่าน Outlook พร้อมลิงก์ Teams และสร้างหน้าบันทึกประชุมในเอกสารโครงการ</p></div>
        <span v-if="manager" class="acts"><button v-for="(l, k) in MEETING_KINDS" :key="k" class="btn sm" @click="openMeeting(k)">{{ l }}</button></span></div>
      <table class="table">
        <thead><tr><th>ประเภท</th><th>หัวข้อ</th><th>วันเวลา</th><th>สถานที่</th><th class="r">ผู้เข้าร่วม</th></tr></thead>
        <tbody><tr v-for="m in p.meetings ?? []" :key="m.id"><td><span class="chip">{{ MEETING_KINDS[m.kind] }}</span></td><td>{{ m.title }}</td><td>{{ thDate(m.date) }} {{ m.time }}</td><td class="small">{{ m.place }}</td><td class="r num" :title="m.attendees.map(nameOf).join(', ')">{{ m.attendees.length }}</td></tr>
          <tr v-if="!(p.meetings ?? []).length"><td colspan="5" class="muted">ยังไม่มีการนัดประชุม</td></tr></tbody>
      </table>
    </section>

    <Dialog :open="sf.open" title="เพิ่มผู้ติดต่อ" @close="sf.open = false">
      <div class="two">
        <div class="field"><label for="ss">ฝ่าย</label><select id="ss" v-model="sf.side" class="input"><option value="customer">ผู้ว่าจ้าง (ลูกค้า)</option><option value="us">ผู้รับจ้าง (เรา)</option></select></div>
        <div class="field"><label for="sp">ตำแหน่ง / บทบาท</label><input id="sp" v-model="sf.position" class="input" /></div>
      </div>
      <div class="field"><label for="sn">ชื่อ</label><input id="sn" v-model="sf.name" class="input" /></div>
      <div class="two">
        <div class="field"><label for="se">อีเมล</label><input id="se" v-model="sf.email" type="email" class="input" /></div>
        <div class="field"><label for="st">โทร</label><input id="st" v-model="sf.phone" class="input" /></div>
      </div>
      <div class="field"><label for="sx">ให้ข้อมูล Requirement เรื่อง</label><input id="sx" v-model="sf.topics" class="input" /></div>
      <label class="ck"><input v-model="sf.focal" type="checkbox" /> เป็น Focal Point (ผู้ประสานงานหลัก) ของฝ่ายนี้</label>
      <template #foot><button class="btn" @click="sf.open = false">ยกเลิก</button><button class="btn primary" :disabled="!sf.name.trim() || !sf.position.trim()" @click="addPerson">บันทึก</button></template>
    </Dialog>
    <Dialog :open="mf.open" :title="`นัด${MEETING_KINDS[mf.kind]}`" wide @close="mf.open = false">
      <div class="field"><label for="mt">หัวข้อ</label><input id="mt" v-model="mf.title" class="input" /></div>
      <div class="three">
        <div class="field"><label for="md">วันที่</label><input id="md" v-model="mf.date" type="date" class="input" /></div>
        <div class="field"><label for="mtm">เวลา</label><input id="mtm" v-model="mf.time" type="time" class="input" /></div>
        <div class="field"><label for="mp">สถานที่</label><input id="mp" v-model="mf.place" class="input" /></div>
      </div>
      <fieldset class="field inv"><legend>ผู้เข้าร่วม ({{ mf.who.length }})</legend>
        <label v-for="x in invitees" :key="x.id"><input v-model="mf.who" type="checkbox" :value="x.id" /> {{ x.label }}</label></fieldset>
      <template #foot><button class="btn" @click="mf.open = false">ยกเลิก</button><button class="btn primary" :disabled="!mf.title.trim() || !mf.who.length" @click="sendInvite">ส่งนัดประชุม</button></template>
    </Dialog>
  </div>
</template>

<style scoped>
.pp { display: grid; gap: 14px; }
.pp .panel { display: grid; gap: 10px; }
.sides { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.sides h3 { font-size: 14px; margin-bottom: 6px; }
.sh { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.sh li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 10px; font-size: 14px; }
.acts { display: flex; gap: 6px; flex-wrap: wrap; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.three { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 12px; }
.inv { border: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; max-height: 220px; overflow-y: auto; }
.inv legend { font-size: 13px; color: var(--ink-2); margin-bottom: 6px; }
.inv label, .ck { display: flex; gap: 6px; align-items: center; font-size: 13.5px; }
@media (max-width: 760px) { .sides, .two, .three, .inv { grid-template-columns: 1fr; } }
</style>
