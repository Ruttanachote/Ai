<script setup lang="ts">
import { computed } from 'vue'
import Avatar from '../Avatar.vue'
import WorkTypeIcon from './WorkTypeIcon.vue'
import PriorityIcon from './PriorityIcon.vue'
import { thDate, TODAY_ISO } from '../../data/mock'
import { WORK_STATUS, type Project, type Task } from '../../data/model'
import { byPriority, keyOf, typeOf, addDays } from '../../domain/work'
import { notify } from '../../store'

// Scrum backlog: sprints on top, backlog below. Move items between them; start/complete sprints.
const props = defineProps<{ p: Project; list: Task[] }>()
const emit = defineEmits<{ open: [t: Task] }>()
const sprints = computed(() => props.p.workspace?.sprints ?? [])
const inSprint = (id: string) => props.list.filter((t) => t.sprint === id && typeOf(t) !== 'epic').sort(byPriority)
const backlog = computed(() => props.list.filter((t) => !t.sprint && typeOf(t) !== 'epic' && t.status !== 'done').sort(byPriority))
const points = (l: Task[]) => l.reduce((s, t) => s + (t.hours || 0), 0)

function moveTo(t: Task, sprint: string) {
  t.sprint = sprint || undefined
  t.updated = TODAY_ISO
}
function start(id: string) {
  const s = sprints.value.find((x) => x.id === id)
  if (!s || sprints.value.some((x) => x.state === 'active')) return
  s.state = 'active'
  notify(`เริ่ม ${s.name} แล้ว`)
}
function complete(id: string) {
  const s = sprints.value.find((x) => x.id === id)
  if (!s) return
  const next = sprints.value.find((x) => x.state === 'planned' && x.id !== id)
  inSprint(id).filter((t) => t.status !== 'done').forEach((t) => moveTo(t, next?.id ?? ''))
  s.state = 'closed'
  notify(`ปิด ${s.name} — งานที่ยังไม่เสร็จย้ายไป${next ? ' ' + next.name : ' Backlog'}`)
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
          <p class="small muted">{{ thDate(s.start) }} – {{ thDate(s.end) }} · {{ inSprint(s.id).length }} งาน · {{ points(inSprint(s.id)) }} ชม.<template v-if="s.goal"> · เป้าหมาย: {{ s.goal }}</template></p></div>
        <button v-if="s.state === 'planned'" class="btn sm" :disabled="sprints.some((x) => x.state === 'active') || !inSprint(s.id).length" @click="start(s.id)">เริ่ม Sprint</button>
        <button v-else class="btn sm primary" @click="complete(s.id)">ปิด Sprint</button>
      </header>
      <ul>
        <li v-for="t in inSprint(s.id)" :key="t.id">
          <WorkTypeIcon :type="typeOf(t)" :size="14" />
          <button class="lnk" @click="emit('open', t)"><span class="key">{{ keyOf(t) }}</span> {{ t.title }}</button>
          <span class="chip" :class="WORK_STATUS[t.status].tone">{{ WORK_STATUS[t.status].label }}</span>
          <PriorityIcon :p="t.priority" />
          <Avatar :id="t.assignee || undefined" :label="t.assignee ? undefined : '?'" :size="22" />
          <button class="btn sm ghost" @click="moveTo(t, '')">ย้ายไป Backlog</button>
        </li>
        <li v-if="!inSprint(s.id).length" class="muted small empty">ย้ายงานจาก Backlog ด้านล่างเข้ามาวางแผน Sprint นี้</li>
      </ul>
    </section>

    <section class="sp">
      <header><div><h3>Backlog</h3><p class="small muted">{{ backlog.length }} งาน · {{ points(backlog) }} ชม. เรียงตามความสำคัญ</p></div><button class="btn sm" @click="addSprint">เพิ่ม Sprint</button></header>
      <ul>
        <li v-for="t in backlog" :key="t.id">
          <WorkTypeIcon :type="typeOf(t)" :size="14" />
          <button class="lnk" @click="emit('open', t)"><span class="key">{{ keyOf(t) }}</span> {{ t.title }}</button>
          <span class="chip" :class="WORK_STATUS[t.status].tone">{{ WORK_STATUS[t.status].label }}</span>
          <PriorityIcon :p="t.priority" />
          <Avatar :id="t.assignee || undefined" :label="t.assignee ? undefined : '?'" :size="22" />
          <select class="input mini" :aria-label="`ย้าย ${keyOf(t)} เข้า Sprint`" @change="moveTo(t, ($event.target as HTMLSelectElement).value)">
            <option value="">ย้ายเข้า Sprint…</option>
            <option v-for="s in sprints.filter((x) => x.state !== 'closed')" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </li>
        <li v-if="!backlog.length" class="muted small empty">Backlog ว่าง</li>
      </ul>
    </section>
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
.input.mini { min-height: 30px; padding: 2px 6px; font-size: 13px; width: auto; }
@media (max-width: 760px) { li { grid-template-columns: auto minmax(0, 1fr) auto; } li > :nth-child(4), li > :nth-child(5) { display: none; } }
</style>
