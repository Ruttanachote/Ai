<script setup lang="ts">
import { computed, ref } from 'vue'
import Avatar from '../Avatar.vue'
import Dialog from '../Dialog.vue'
import WorkTypeIcon from './WorkTypeIcon.vue'
import { thDate, TODAY_ISO } from '../../data/mock'
import { WORK_STATUS, type Project, type Task } from '../../data/model'
import { byPriority, keyOf, typeOf, addDays } from '../../domain/work'
import { completeSprint, sizeOf, statusOf } from '../../domain/workflow'
import { notify, session } from '../../store'
import { canManage, edited } from './actions'

// Scrum backlog: sprints on top, backlog below. Move items between them; start/complete sprints.
const props = defineProps<{ p: Project; list: Task[] }>()
const emit = defineEmits<{ open: [t: Task] }>()
const sprints = computed(() => props.p.workspace?.sprints ?? [])
const inSprint = (id: string) => props.list.filter((t) => t.sprint === id && typeOf(t) !== 'epic').sort(byPriority)
const backlog = computed(() => props.list.filter((t) => !t.sprint && typeOf(t) !== 'epic' && t.status !== 'done').sort(byPriority))
const unit = computed(() => (props.p.workspace?.estimate === 'points' ? 'pts' : 'ชม.'))
const points = (l: Task[]) => l.reduce((s, t) => s + sizeOf(props.p, t), 0)
const manager = computed(() => canManage(props.p))
// Average completed size of closed sprints — the planning guide for the next one.
const avgVelocity = computed(() => {
  const c = sprints.value.filter((s) => s.state === 'closed' && s.completed !== undefined)
  return c.length ? Math.round(c.reduce((a, s) => a + (s.completed ?? 0), 0) / c.length) : 0
})
const sprintName = (id?: string) => sprints.value.find((s) => s.id === id)?.name ?? 'Backlog'
function moveTo(t: Task, sprint: string) {
  edited(t, 'Sprint', sprintName(t.sprint), sprintName(sprint || undefined))
  t.sprint = sprint || undefined
}
function start(id: string) {
  const s = sprints.value.find((x) => x.id === id)
  if (!s || sprints.value.some((x) => x.state === 'active')) return
  s.state = 'active'
  notify(`เริ่ม ${s.name} แล้ว`)
}
// Complete-sprint dialog: shows done/open and lets the PM choose where open items go.
const closing = ref<string | null>(null)
const dest = ref('')
const closingSprint = computed(() => sprints.value.find((x) => x.id === closing.value))
const closingItems = computed(() => (closing.value ? inSprint(closing.value) : []))
function askComplete(id: string) {
  closing.value = id
  dest.value = sprints.value.find((x) => x.state === 'planned' && x.id !== id)?.id ?? ''
}
function complete() {
  if (!closing.value) return
  const name = closingSprint.value?.name
  const r = completeSprint(props.p, closing.value, dest.value, session.userId, TODAY_ISO)
  notify(`ปิด ${name} — เสร็จ ${r.done} งาน${r.open ? ` · ย้าย ${r.open} งานไป ${sprintName(dest.value || undefined)}` : ''}`)
  closing.value = null
}
function addSprint() {
  const ws = props.p.workspace!
  const last = sprints.value[sprints.value.length - 1]
  const startD = last ? addDays(last.end, 1) : TODAY_ISO
  ws.sprints = [...sprints.value, { id: 's' + (sprints.value.length + 1), name: `${ws.key} Sprint ${sprints.value.length + 1}`, start: startD, end: addDays(startD, 13), state: 'planned' }]
}
</script>

<template>
  <div class="bl">
    <section v-for="s in sprints.filter((x) => x.state !== 'closed')" :key="s.id" class="sp">
      <header>
        <div><h3>{{ s.name }} <span class="chip" :class="s.state === 'active' ? 'presale' : ''">{{ s.state === 'active' ? 'กำลังดำเนินการ' : 'วางแผน' }}</span></h3>
          <p class="small muted">{{ thDate(s.start) }} – {{ thDate(s.end) }} · {{ inSprint(s.id).length }} งาน · {{ points(inSprint(s.id)) }} {{ unit }}<template v-if="s.state === 'planned' && avgVelocity"> (ความเร็วเฉลี่ย {{ avgVelocity }} {{ unit }})</template><template v-if="s.goal"> · เป้าหมาย: {{ s.goal }}</template></p></div>
        <template v-if="manager">
          <button v-if="s.state === 'planned'" class="btn sm" :disabled="sprints.some((x) => x.state === 'active') || !inSprint(s.id).length" @click="start(s.id)">เริ่ม Sprint</button>
          <button v-else class="btn sm primary" @click="askComplete(s.id)">ปิด Sprint</button>
        </template>
      </header>
      <ul>
        <li v-for="t in inSprint(s.id)" :key="t.id">
          <WorkTypeIcon :type="typeOf(t)" :size="14" />
          <button class="lnk" @click="emit('open', t)"><span class="key">{{ keyOf(t) }}</span> {{ t.title }}</button>
          <span class="chip" :class="WORK_STATUS[t.status].tone">{{ statusOf(p, t).name }}</span>
          <span class="pts">{{ sizeOf(p, t) || '—' }}</span>
          <Avatar :id="t.assignee || undefined" :label="t.assignee ? undefined : '?'" :size="22" />
          <button v-if="manager" class="btn sm ghost" @click="moveTo(t, '')">ย้ายไป Backlog</button><span v-else />
        </li>
        <li v-if="!inSprint(s.id).length" class="muted small empty">ย้ายงานจาก Backlog ด้านล่างเข้ามาวางแผน Sprint นี้</li>
      </ul>
    </section>

    <section class="sp">
      <header><div><h3>Backlog</h3><p class="small muted">{{ backlog.length }} งาน · {{ points(backlog) }} {{ unit }} เรียงตามความสำคัญ</p></div><button v-if="manager" class="btn sm" @click="addSprint">เพิ่ม Sprint</button></header>
      <ul>
        <li v-for="t in backlog" :key="t.id">
          <WorkTypeIcon :type="typeOf(t)" :size="14" />
          <button class="lnk" @click="emit('open', t)"><span class="key">{{ keyOf(t) }}</span> {{ t.title }}</button>
          <span class="chip" :class="WORK_STATUS[t.status].tone">{{ statusOf(p, t).name }}</span>
          <span class="pts">{{ sizeOf(p, t) || '—' }}</span>
          <Avatar :id="t.assignee || undefined" :label="t.assignee ? undefined : '?'" :size="22" />
          <select v-if="manager" class="input mini" :aria-label="`ย้าย ${keyOf(t)} เข้า Sprint`" @change="moveTo(t, ($event.target as HTMLSelectElement).value)">
            <option value="">ย้ายเข้า Sprint…</option>
            <option v-for="s in sprints.filter((x) => x.state !== 'closed')" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select><span v-else />
        </li>
        <li v-if="!backlog.length" class="muted small empty">Backlog ว่าง</li>
      </ul>
    </section>

    <section v-if="sprints.some((x) => x.state === 'closed')" class="sp">
      <header><div><h3>Sprint ที่ปิดแล้ว</h3><p class="small muted">ความเร็วเฉลี่ย {{ avgVelocity }} {{ unit }} ต่อ Sprint</p></div></header>
      <ul><li v-for="s in sprints.filter((x) => x.state === 'closed')" :key="s.id" class="cl"><strong>{{ s.name }}</strong><span class="small muted">{{ thDate(s.start) }} – {{ thDate(s.end) }}</span><span class="small">เสร็จ {{ s.completed ?? 0 }} / ตั้งใจ {{ s.committed ?? 0 }} {{ unit }}</span></li></ul>
    </section>

    <Dialog :open="!!closing" :title="`ปิด ${closingSprint?.name ?? ''}`" @close="closing = null">
      <div class="cs">
        <div><b>{{ closingItems.filter((t) => t.status === 'done').length }}</b><span>งานเสร็จ ({{ points(closingItems.filter((t) => t.status === 'done')) }} {{ unit }})</span></div>
        <div><b>{{ closingItems.filter((t) => t.status !== 'done').length }}</b><span>งานยังไม่เสร็จ ({{ points(closingItems.filter((t) => t.status !== 'done')) }} {{ unit }})</span></div>
      </div>
      <div v-if="closingItems.some((t) => t.status !== 'done')" class="field">
        <label for="dst">ย้ายงานที่ยังไม่เสร็จไปที่</label>
        <select id="dst" v-model="dest" class="input">
          <option v-for="x in sprints.filter((y) => y.state === 'planned' && y.id !== closing)" :key="x.id" :value="x.id">{{ x.name }}</option>
          <option value="">Backlog</option>
        </select>
      </div>
      <p class="small muted">ระบบบันทึกยอดตั้งใจ / เสร็จจริงไว้ทำกราฟ Velocity ในแท็บรายงาน</p>
      <template #foot><button class="btn" @click="closing = null">ยกเลิก</button><button class="btn primary" @click="complete">ปิด {{ closingSprint?.name }}</button></template>
    </Dialog>
  </div>
</template>

<style scoped>
.bl { display: grid; gap: 14px; }
.sp { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); }
header { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--line); background: var(--sunken); border-radius: var(--r-md) var(--r-md) 0 0; }
header h3 { display: flex; gap: 8px; align-items: center; }
ul { list-style: none; margin: 0; padding: 4px 8px; }
li { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto auto auto; gap: 10px; align-items: center; padding: 8px; border-bottom: 1px solid var(--line); }
li:last-child { border-bottom: 0; }
li.empty { display: block; text-align: center; padding: 16px; }
.lnk { border: 0; background: none; padding: 0; text-align: left; font: 14px var(--font); color: var(--ink); cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.key { color: var(--action); font-size: 13px; }
.pts { font-size: 12px; font-weight: 600; min-width: 24px; text-align: center; padding: 1px 6px; border-radius: 99px; background: var(--idle-soft); }
li.cl { grid-template-columns: 1fr auto auto; }
.cs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
.cs div { border: 1px solid var(--line); border-radius: var(--r-sm); padding: 12px; display: grid; }
.cs b { font: 600 24px var(--display); }
.cs span { font-size: 12.5px; color: var(--muted); }
.input.mini { min-height: 30px; padding: 2px 6px; font-size: 13px; width: auto; }
@media (max-width: 760px) { li { grid-template-columns: auto minmax(0, 1fr) auto; } li > :nth-child(4), li > :nth-child(5) { display: none; } }
</style>
