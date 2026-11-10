<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Avatar from '../Avatar.vue'
import Dialog from '../Dialog.vue'
import { PEOPLE, groupOf, person, thDate, TODAY_ISO } from '../../data/mock'
import { MEMBER_ROLE_DESC, MEMBER_ROLES, WORK_STATUS, type MemberRole, type Project, type WorkStatus } from '../../data/model'
import { defaultAutomation, defaultWorkflow, statusOf, workflowOf } from '../../domain/workflow'
import { notify, pushNotices, session } from '../../store'
import { canManage } from './actions'

// Workspace settings (PM / PMO / Admin): members and their roles, workflow statuses and
// allowed transitions, Definition of Done, automation rules and the estimate unit.
const props = defineProps<{ p: Project }>()
const ws = computed(() => props.p.workspace!)
const manager = computed(() => canManage(props.p))
const sec = ref<'members' | 'workflow' | 'automation' | 'general'>('members')

function ensure() {
  if (!ws.value.workflow) ws.value.workflow = defaultWorkflow(ws.value.template)
  if (!ws.value.members) ws.value.members = props.p.pm ? [{ userId: props.p.pm, role: 'pm' }] : []
  if (!ws.value.automation) ws.value.automation = defaultAutomation(ws.value.workflow)
}
ensure()
const wf = computed(() => workflowOf(props.p))

// Members
const candidates = computed(() => PEOPLE.filter((u) => !ws.value.members!.some((m) => m.userId === u.id)).sort((a, b) => Number(b.team === props.p.team) - Number(a.team === props.p.team)))
// P-03: PM asks the dev team head for people (role, count, period); the head fills it.
const rq = reactive({ open: false, role: 'fe' as MemberRole, count: 1, from: TODAY_ISO, to: TODAY_ISO, note: '' })
const headOf = computed(() => PEOPLE.find((u) => u.role === 'head' && (u.team === props.p.team || groupOf(u.team ?? '') === groupOf(props.p.team)))?.id)
function request() {
  props.p.staffRequests = [{ id: 'sr' + Date.now().toString(36), role: rq.role, count: rq.count, from: rq.from, to: rq.to, note: rq.note.trim() || undefined, status: 'pending', by: session.userId, at: TODAY_ISO }, ...(props.p.staffRequests ?? [])]
  if (headOf.value) pushNotices([{ to: headOf.value, projectId: props.p.id, text: `${props.p.name} ขอ ${MEMBER_ROLES[rq.role]} ${rq.count} คน (${thDate(rq.from)} – ${thDate(rq.to)})` }])
  rq.open = false
  notify(`ส่งคำขอคนถึง ${person(headOf.value)?.name ?? 'หัวหน้าทีม'} แล้ว`)
}
const add = ref({ userId: '', role: 'dev' as MemberRole })
function addMember() {
  if (!add.value.userId) return
  ws.value.members = [...ws.value.members!, { ...add.value }]
  notify(`เพิ่ม ${person(add.value.userId)?.name} เป็น ${MEMBER_ROLES[add.value.role]} แล้ว — แจ้งทาง Teams`)
  add.value = { userId: '', role: 'dev' }
}
const openCount = (id: string) => (props.p.tasks ?? []).filter((t) => t.assignee === id && t.status !== 'done').length
const removing = ref<string | null>(null)
function removeMember(id: string) {
  ws.value.members = ws.value.members!.filter((m) => m.userId !== id)
  removing.value = null
}

// Workflow statuses
const used = (id: string) => (props.p.tasks ?? []).filter((t) => statusOf(props.p, t).id === id).length
function addStatus() {
  const id = 's' + Date.now().toString(36)
  const done = wf.value.statuses.findIndex((s) => s.category === 'done')
  const list = [...wf.value.statuses]
  list.splice(done < 0 ? list.length : done, 0, { id, name: 'สถานะใหม่', category: 'review' })
  ws.value.workflow!.statuses = list
  // Allow it from/to every status so nothing gets stuck until the PM narrows it down.
  ws.value.workflow!.transitions.push(...list.filter((s) => s.id !== id).flatMap((s) => [{ from: s.id, to: id }, { from: id, to: s.id }]))
}
function moveStatus(i: number, d: -1 | 1) {
  const l = [...wf.value.statuses]
  const j = i + d
  if (j < 0 || j >= l.length) return
  ;[l[i], l[j]] = [l[j], l[i]]
  ws.value.workflow!.statuses = l
}
function removeStatus(id: string) {
  if (used(id)) return notify('ย้ายงานออกจากสถานะนี้ก่อนลบ')
  ws.value.workflow!.statuses = wf.value.statuses.filter((s) => s.id !== id)
  ws.value.workflow!.transitions = wf.value.transitions.filter((t) => t.from !== id && t.to !== id)
}
const allowed = (from: string, to: string) => wf.value.transitions.some((t) => t.from === from && t.to === to)
function toggleT(from: string, to: string) {
  const w = ws.value.workflow!
  w.transitions = allowed(from, to) ? w.transitions.filter((t) => !(t.from === from && t.to === to)) : [...w.transitions, { from, to }]
}
const rolesOf = (from: string, to: string) => wf.value.transitions.find((t) => t.from === from && t.to === to)?.roles ?? []
function reset() {
  ws.value.workflow = defaultWorkflow(ws.value.template)
  ws.value.automation = defaultAutomation(ws.value.workflow)
  notify('คืนค่า Workflow มาตรฐาน DT แล้ว')
}
const CATS = Object.keys(WORK_STATUS) as WorkStatus[]
</script>

<template>
  <div class="ws">
    <nav class="side" aria-label="หมวดการตั้งค่า">
      <button :aria-current="sec === 'members'" @click="sec = 'members'">สมาชิกและสิทธิ์ <span>{{ ws.members?.length }}</span></button>
      <button :aria-current="sec === 'workflow'" @click="sec = 'workflow'">Workflow <span>{{ wf.statuses.length }}</span></button>
      <button :aria-current="sec === 'automation'" @click="sec = 'automation'">Automation <span>{{ ws.automation?.filter((a) => a.on).length }}</span></button>
      <button :aria-current="sec === 'general'" @click="sec = 'general'">ทั่วไป</button>
      <p v-if="!manager" class="small muted ro">ดูได้อย่างเดียว — PM ของโครงการเป็นผู้ตั้งค่า</p>
    </nav>

    <section v-if="sec === 'members'" class="panel">
      <h3>สมาชิกพื้นที่งาน</h3>
      <p class="small muted">สมาชิกเห็นเฉพาะงานของโครงการนี้ ไม่เห็นราคาขายและต้นทุน · ทีมพัฒนา (SA · BA · UX/UI · Front-end · Back-end · DevOps · QA) เข้าใช้งานด้วยบัญชี Microsoft 365 (App Role OnePlatform.Dev) และกำหนดบทบาทในโครงการที่นี่</p>
      <table class="table">
        <thead><tr><th>ชื่อ</th><th>ทีม</th><th>บทบาทในโครงการ</th><th class="r">งานค้าง</th><th /></tr></thead>
        <tbody>
          <tr v-for="m in ws.members" :key="m.userId">
            <td><span class="who"><Avatar :id="m.userId" :size="26" />{{ person(m.userId)?.name }}</span></td>
            <td class="small muted">{{ person(m.userId)?.team }}</td>
            <td><select v-model="m.role" class="input mini" :disabled="!manager || m.userId === p.pm" :aria-label="`บทบาทของ ${person(m.userId)?.name}`"><option v-for="(l, k) in MEMBER_ROLES" :key="k" :value="k">{{ l }}</option></select>
              <p class="small muted rd">{{ MEMBER_ROLE_DESC[m.role] }}</p></td>
            <td class="r num">{{ openCount(m.userId) }}</td>
            <td class="r"><button v-if="manager && m.userId !== p.pm" class="btn sm ghost" @click="removing = m.userId">เอาออก</button></td>
          </tr>
        </tbody>
      </table>
      <div class="rqs">
        <div class="panel-head"><h3>คำขอคนจากหัวหน้าทีม</h3><button v-if="manager" class="btn sm" @click="rq.open = true">+ ขอคน</button></div>
        <ul><li v-for="r in p.staffRequests ?? []" :key="r.id" class="small">
          <span class="chip" :class="r.status === 'filled' ? 'win' : r.status === 'declined' ? 'lose' : 'warn'">{{ r.status === 'filled' ? 'ได้คนแล้ว' : r.status === 'declined' ? 'ไม่อนุมัติ' : 'รอหัวหน้าทีม' }}</span>
          {{ MEMBER_ROLES[r.role] }} × {{ r.count }} · {{ thDate(r.from) }} – {{ thDate(r.to) }}<template v-if="r.filled?.length"> → {{ r.filled.map((x) => person(x)?.name).join(', ') }}</template><template v-if="r.note"> · {{ r.note }}</template></li>
          <li v-if="!(p.staffRequests ?? []).length" class="small muted">ยังไม่มีคำขอ — ขอคนตามบทบาทและช่วงเวลา หัวหน้าทีมเลือกคนจากภาระงานและวันลา</li></ul>
      </div>
      <form v-if="manager" class="addm" @submit.prevent="addMember">
        <select v-model="add.userId" class="input mini" aria-label="เลือกคน"><option value="">เลือกคนในองค์กร…</option><option v-for="u in candidates" :key="u.id" :value="u.id">{{ u.name }} · {{ u.team }}</option></select>
        <select v-model="add.role" class="input mini" aria-label="บทบาท" :title="MEMBER_ROLE_DESC[add.role]"><option v-for="(l, k) in MEMBER_ROLES" :key="k" :value="k">{{ l }}</option></select>
        <button class="btn sm primary" :disabled="!add.userId">เพิ่มสมาชิก</button>
      </form>
    </section>

    <section v-else-if="sec === 'workflow'" class="panel">
      <div class="hd"><div><h3>สถานะของงาน</h3><p class="small muted">ชื่อสถานะแก้ได้ตามทีม — “กลุ่ม” ใช้คำนวณความคืบหน้าและรายงานกลาง</p></div>
        <button v-if="manager" class="btn sm ghost" @click="reset">คืนค่ามาตรฐาน DT</button></div>
      <table class="table">
        <thead><tr><th /><th>ชื่อสถานะ</th><th>กลุ่ม</th><th class="r">จำกัดงาน (WIP)</th><th class="r">งานตอนนี้</th><th /></tr></thead>
        <tbody>
          <tr v-for="(s, i) in wf.statuses" :key="s.id">
            <td class="mv"><button :disabled="!manager || i === 0" aria-label="เลื่อนขึ้น" @click="moveStatus(i, -1)">▲</button><button :disabled="!manager || i === wf.statuses.length - 1" aria-label="เลื่อนลง" @click="moveStatus(i, 1)">▼</button></td>
            <td><input v-model="s.name" class="input mini" :disabled="!manager" :aria-label="`ชื่อสถานะ ${i + 1}`" /></td>
            <td><select v-model="s.category" class="input mini" :disabled="!manager"><option v-for="c in CATS" :key="c" :value="c">{{ WORK_STATUS[c].label }}</option></select></td>
            <td class="r"><input v-model.number="s.wipLimit" type="number" min="0" class="input mini num" :disabled="!manager" placeholder="ไม่จำกัด" /></td>
            <td class="r num">{{ used(s.id) }}</td>
            <td class="r"><button v-if="manager" class="btn sm ghost" :disabled="wf.statuses.length <= 2" @click="removeStatus(s.id)">ลบ</button></td>
          </tr>
        </tbody>
      </table>
      <button v-if="manager" class="btn sm" @click="addStatus">+ เพิ่มสถานะ</button>

      <h3 class="mt">การย้ายสถานะที่อนุญาต</h3>
      <p class="small muted">แถว = จากสถานะ · คอลัมน์ = ไปสถานะ · ไม่ติ๊กเลย = ย้ายได้อิสระ · บางเส้นจำกัดบทบาท (เช่น ไป Done ได้เฉพาะ QA / PM / หัวหน้าทีม)</p>
      <div class="scroll-x">
        <table class="table mx">
          <thead><tr><th>จาก \ ไป</th><th v-for="t in wf.statuses" :key="t.id">{{ t.name }}</th></tr></thead>
          <tbody>
            <tr v-for="f in wf.statuses" :key="f.id">
              <th>{{ f.name }}</th>
              <td v-for="t in wf.statuses" :key="t.id" :class="{ self: f.id === t.id }">
                <template v-if="f.id !== t.id">
                  <input type="checkbox" :checked="allowed(f.id, t.id)" :disabled="!manager" :aria-label="`อนุญาตจาก ${f.name} ไป ${t.name}`" @change="toggleT(f.id, t.id)" />
                  <span v-if="rolesOf(f.id, t.id).length" class="rl">{{ rolesOf(f.id, t.id).map((r) => MEMBER_ROLES[r]).join(', ') }}</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <label class="dod"><input v-model="ws.workflow!.requireAcceptanceForDone" type="checkbox" :disabled="!manager" /> Definition of Done: ต้องติ๊ก Acceptance criteria ครบก่อนย้ายไปสถานะกลุ่ม “เสร็จ”</label>
    </section>

    <section v-else-if="sec === 'automation'" class="panel">
      <h3>Automation</h3>
      <p class="small muted">กฎที่ทำงานเมื่องานเปลี่ยนสถานะ — การแจ้งเตือนส่งในระบบ อีเมล และ Teams</p>
      <ul class="rules">
        <li v-for="a in ws.automation" :key="a.id">
          <label class="sw"><input v-model="a.on" type="checkbox" :disabled="!manager" /><span /></label>
          <div><strong>เมื่อย้ายไป {{ wf.statuses.find((s) => s.id === a.when.toStatus)?.name ?? '—' }}</strong>
            <p class="small muted"><template v-if="a.then.assignRole">มอบหมายให้ {{ MEMBER_ROLES[a.then.assignRole] }} ที่งานน้อยที่สุด · </template>แจ้ง{{ a.then.notify === 'pm' ? ' PM' : a.then.notify === 'reporter' ? 'ผู้แจ้งงาน' : 'ผู้รับผิดชอบ' }}</p></div>
          <select v-model="a.when.toStatus" class="input mini" :disabled="!manager" aria-label="สถานะที่เป็นเงื่อนไข"><option v-for="s in wf.statuses" :key="s.id" :value="s.id">{{ s.name }}</option></select>
        </li>
      </ul>
      <button v-if="manager" class="btn sm" @click="ws.automation = [...(ws.automation ?? []), { id: 'a' + Date.now().toString(36), on: true, label: 'แจ้ง PM', when: { toStatus: wf.statuses[0].id }, then: { notify: 'pm' } }]">+ เพิ่มกฎ “แจ้ง PM”</button>
    </section>

    <section v-else class="panel">
      <h3>ทั่วไป</h3>
      <div class="gen">
        <div class="field"><label for="est">หน่วยประมาณงาน</label>
          <select id="est" v-model="ws.estimate" class="input" :disabled="!manager"><option value="hours">ชั่วโมง (เทียบ Man-day ใน Cost Sheet)</option><option value="points">Story points (Scrum)</option></select></div>
        <div class="field"><label for="rate">อัตรา OT ต่อชั่วโมง (บาท)</label><input id="rate" v-model.number="ws.hourlyRate" type="number" min="0" class="input" :disabled="!manager" placeholder="600" /></div>
        <div class="field"><label>รหัสงาน</label><input class="input" :value="ws.key" disabled /><p class="small muted">เปลี่ยนไม่ได้หลังสร้าง เพื่อให้ลิงก์งานเดิมยังใช้ได้</p></div>
      </div>
    </section>

    <Dialog :open="rq.open" title="ขอคนจากหัวหน้าทีม" @close="rq.open = false">
      <div class="g2">
        <div class="field"><label for="rr">บทบาท</label><select id="rr" v-model="rq.role" class="input"><option v-for="(l, k) in MEMBER_ROLES" :key="k" :value="k">{{ l }}</option></select></div>
        <div class="field"><label for="rc">จำนวน</label><input id="rc" v-model.number="rq.count" type="number" min="1" max="10" class="input" /></div>
        <div class="field"><label for="rf">ตั้งแต่</label><input id="rf" v-model="rq.from" type="date" class="input" /></div>
        <div class="field"><label for="rt">ถึง</label><input id="rt" v-model="rq.to" type="date" class="input" :min="rq.from" /></div>
      </div>
      <div class="field"><label for="rn">รายละเอียดงาน</label><textarea id="rn" v-model="rq.note" class="input" rows="2" /></div>
      <template #foot><button class="btn" @click="rq.open = false">ยกเลิก</button><button class="btn primary" :disabled="!(rq.count > 0) || rq.to < rq.from" @click="request">ส่งคำขอ</button></template>
    </Dialog>
    <Dialog :open="!!removing" :title="`เอา ${person(removing ?? '')?.name ?? ''} ออก`" @close="removing = null">
      <p>{{ person(removing ?? '')?.name }} จะไม่เห็นพื้นที่งานนี้อีก<template v-if="removing && openCount(removing)"> · ยังมีงานค้าง {{ openCount(removing) }} งาน ซึ่งจะยังอยู่ในชื่อเดิมจนกว่าจะมอบหมายใหม่</template></p>
      <template #foot><button class="btn" @click="removing = null">ยกเลิก</button><button class="btn primary" @click="removeMember(removing!)">เอาออก</button></template>
    </Dialog>
  </div>
</template>

<style scoped>
.ws { display: grid; grid-template-columns: 220px 1fr; gap: 16px; align-items: start; }
.side { display: grid; gap: 2px; position: sticky; top: 12px; }
.side button { display: flex; justify-content: space-between; border: 0; background: none; text-align: left; padding: 9px 12px; border-radius: var(--r-sm); font: 14px var(--font); color: var(--ink-2); cursor: pointer; }
.side button span { color: var(--muted); font-size: 12px; }
.side button:hover { background: var(--sunken); }
.side button[aria-current='true'] { background: var(--ink); color: var(--on-ink); }
.side button[aria-current='true'] span { color: rgb(255 255 255 / 0.7); }
.ro { padding: 8px 12px; }
.panel { display: grid; gap: 12px; align-content: start; overflow-x: auto; }
.hd { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
.mt { margin-top: 12px; }
.who { display: inline-flex; gap: 8px; align-items: center; }
.input.mini { min-height: 32px; padding: 2px 8px; font-size: 13.5px; width: auto; }
.num.input { width: 100px; }
.rd { margin-top: 2px; max-width: 320px; }
.rqs ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.addm { display: flex; gap: 8px; flex-wrap: wrap; }
.mv button { border: 0; background: none; cursor: pointer; color: var(--muted); font-size: 10px; padding: 2px 4px; }
.mv button:disabled { opacity: 0.3; cursor: default; }
.mx th, .mx td { text-align: center; font-size: 12.5px; white-space: nowrap; }
.mx tbody th { text-align: left; }
.mx td.self { background: var(--sunken); }
.mx input { accent-color: var(--ink); width: 16px; height: 16px; }
.rl { display: block; font-size: 10.5px; color: var(--warn); }
.dod { display: flex; gap: 8px; align-items: center; font-size: 14px; }
.rules { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.rules li { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; border: 1px solid var(--line); border-radius: var(--r-sm); padding: 10px 12px; }
.sw { position: relative; width: 36px; height: 20px; }
.sw input { opacity: 0; width: 0; height: 0; position: absolute; }
.sw span { position: absolute; inset: 0; background: var(--line-strong); border-radius: 99px; cursor: pointer; transition: background var(--t-fast); }
.sw span::after { content: ''; position: absolute; width: 16px; height: 16px; left: 2px; top: 2px; border-radius: 50%; background: #fff; transition: transform var(--t-fast); }
.sw input:checked + span { background: var(--win); }
.sw input:checked + span::after { transform: translateX(16px); }
.sw input:focus-visible + span { outline: 2px solid var(--focus); }
.gen { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
@media (max-width: 760px) { .ws { grid-template-columns: 1fr; } .side { position: static; grid-auto-flow: column; overflow-x: auto; } }
</style>
