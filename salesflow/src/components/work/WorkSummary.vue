<script setup lang="ts">
import { computed } from 'vue'
import Avatar from '../Avatar.vue'
import WorkTypeIcon from './WorkTypeIcon.vue'
import { person, thDate, daysUntil, TODAY_ISO } from '../../data/mock'
import { PRIORITIES, WORK_STATUS, WORK_TYPES, type Priority, type Project, type Task, type WorkStatus, type WorkType } from '../../data/model'
import Icon from '../Icon.vue'
import PriorityIcon from './PriorityIcon.vue'
import { keyOf, typeOf } from '../../domain/work'
import { addDays } from '../../domain/calendar'

// One screen the PM can read before a customer call: status split, what is due this week,
// who is loaded, and what changed recently.
const props = defineProps<{ p: Project; list: Task[] }>()
const emit = defineEmits<{ open: [t: Task] }>()
const work = computed(() => props.list.filter((t) => typeOf(t) !== 'epic'))
const byStatus = computed(() => (Object.keys(WORK_STATUS) as WorkStatus[]).map((k) => ({ k, n: work.value.filter((t) => t.status === k).length })))
const total = computed(() => work.value.length || 1)
const weekEnd = addDays(TODAY_ISO, 7)
const dueSoon = computed(() => work.value.filter((t) => t.status !== 'done' && t.due && t.due <= weekEnd).sort((a, b) => a.due.localeCompare(b.due)))
const people = computed(() => {
  const m = new Map<string, { open: number; hours: number }>()
  work.value.filter((t) => t.status !== 'done').forEach((t) => {
    const r = m.get(t.assignee || '') ?? { open: 0, hours: 0 }
    r.open++; r.hours += Math.max(0, t.hours - t.spent)
    m.set(t.assignee || '', r)
  })
  return [...m.entries()].sort((a, b) => b[1].hours - a[1].hours)
})
const maxHours = computed(() => Math.max(1, ...people.value.map((x) => x[1].hours)))
const types = computed(() => (Object.keys(WORK_TYPES) as WorkType[]).map((k) => ({ k, n: props.list.filter((t) => typeOf(t) === k).length })).filter((x) => x.n))
const weekAgo = addDays(TODAY_ISO, -7)
const cards = computed(() => [
  { label: 'เสร็จ', n: work.value.filter((t) => t.status === 'done' && (t.updated ?? '') >= weekAgo).length, note: 'ใน 7 วันที่ผ่านมา', icon: 'check' },
  { label: 'อัปเดต', n: props.list.filter((t) => (t.updated ?? '') >= weekAgo).length, note: 'ใน 7 วันที่ผ่านมา', icon: 'refresh' },
  { label: 'สร้างใหม่', n: props.list.filter((t) => (t.created ?? '') >= weekAgo).length, note: 'ใน 7 วันที่ผ่านมา', icon: 'plus' },
  { label: 'ครบกำหนด', n: work.value.filter((t) => t.status !== 'done' && t.due && t.due >= TODAY_ISO && t.due <= weekEnd).length, note: 'ใน 7 วันข้างหน้า', icon: 'clock' },
])
// Donut: one arc per status, drawn on a circle of circumference 100 so dash values are percentages.
const arcs = computed(() => {
  let off = 25
  return byStatus.value.filter((s) => s.n).map((s) => {
    const len = (s.n / total.value) * 100
    const a = { k: s.k, dash: `${Math.max(0, len - 0.6)} ${100 - Math.max(0, len - 0.6)}`, off }
    off -= len
    return a
  })
})
const prio = computed(() => (Object.keys(PRIORITIES) as Priority[]).map((k) => ({ k, n: work.value.filter((t) => (t.priority ?? 'medium') === k).length })))
const prioMax = computed(() => Math.max(1, ...prio.value.map((x) => x.n)))
const activity = computed(() => (props.p.workspace?.activity ?? []).slice(0, 8))
const itemByKey = (k: string) => props.list.find((t) => keyOf(t) === k)
const epics = computed(() => props.list.filter((t) => typeOf(t) === 'epic').map((e) => {
  const kids = props.list.filter((t) => t.parentId === e.id)
  return { e, done: kids.filter((k) => k.status === 'done').length, n: kids.length }
}))
</script>

<template>
  <div class="sum">
    <div class="cards">
      <div v-for="c in cards" :key="c.label" class="kc"><span class="ic"><Icon :name="c.icon" :size="18" /></span><div><strong class="num">{{ c.n }} {{ c.label }}</strong><span class="small muted">{{ c.note }}</span></div></div>
    </div>

    <section class="panel">
      <h3>ภาพรวมสถานะ</h3>
      <div class="donut">
        <svg viewBox="0 0 42 42" role="img" :aria-label="byStatus.map((s) => `${WORK_STATUS[s.k].label} ${s.n}`).join(', ')">
          <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--idle-soft)" stroke-width="5" />
          <circle v-for="a in arcs" :key="a.k" cx="21" cy="21" r="15.915" fill="none" :class="'a-' + a.k" stroke-width="5" :stroke-dasharray="a.dash" :stroke-dashoffset="a.off" />
          <text x="21" y="21" text-anchor="middle" class="dn">{{ work.length }}</text><text x="21" y="26.5" text-anchor="middle" class="dl">งานทั้งหมด</text>
        </svg>
        <ul class="legend"><li v-for="s in byStatus" :key="s.k"><b :class="s.k" />{{ WORK_STATUS[s.k].label }} <span class="num">{{ s.n }}</span></li></ul>
      </div>
    </section>

    <section class="panel">
      <h3>กิจกรรมล่าสุด</h3>
      <ul class="act">
        <li v-for="(a, i) in activity" :key="i">
          <Avatar :id="a.who" :size="26" />
          <div><p class="small"><strong>{{ person(a.who)?.name }}</strong> {{ a.text }} <button class="lnk inline" @click="itemByKey(a.key) && emit('open', itemByKey(a.key)!)">{{ a.key }}: {{ a.title }}</button>
            <span v-if="a.status" class="chip" :class="WORK_STATUS[a.status].tone">{{ WORK_STATUS[a.status].label }}</span></p>
            <p class="small muted">{{ a.at }}</p></div>
        </li>
        <li v-if="!activity.length" class="muted small">ยังไม่มีกิจกรรม</li>
      </ul>
    </section>

    <section class="panel">
      <h3>ความสำคัญของงาน</h3>
      <div class="pchart" role="img" :aria-label="prio.map((x) => `${PRIORITIES[x.k].label} ${x.n}`).join(', ')">
        <div v-for="x in prio" :key="x.k" class="pcol"><span class="num small">{{ x.n }}</span><i :class="x.k" :style="{ height: (x.n / prioMax) * 100 + '%' }" /><PriorityIcon :p="x.k" /><span class="small">{{ PRIORITIES[x.k].label }}</span></div>
      </div>
    </section>

    <section class="panel">
      <h3>ความคืบหน้าราย Epic</h3>
      <div v-for="x in epics" :key="x.e.id" class="ep">
        <button class="lnk" @click="emit('open', x.e)"><WorkTypeIcon type="epic" :size="14" /> {{ x.e.title }}</button>
        <div class="pb"><i :style="{ width: x.n ? (x.done / x.n) * 100 + '%' : '0' }" /></div>
        <span class="small muted num">{{ x.done }}/{{ x.n }}</span>
      </div>
      <p v-if="!epics.length" class="muted small">ยังไม่มี Epic — สร้างจากงวดงานในสัญญาได้</p>
    </section>

    <section class="panel">
      <h3>ครบกำหนดภายใน 7 วัน</h3>
      <ul class="lst">
        <li v-for="t in dueSoon" :key="t.id">
          <WorkTypeIcon :type="typeOf(t)" :size="14" />
          <button class="lnk" @click="emit('open', t)">{{ keyOf(t) }} {{ t.title }}</button>
          <span class="small" :class="{ bad: t.due < TODAY_ISO }">{{ t.due < TODAY_ISO ? `เลย ${-daysUntil(t.due)} วัน` : thDate(t.due) }}</span>
          <Avatar :id="t.assignee || undefined" :label="t.assignee ? undefined : '?'" :size="22" />
        </li>
        <li v-if="!dueSoon.length" class="muted small">ไม่มีงานครบกำหนดสัปดาห์นี้</li>
      </ul>
    </section>

    <section class="panel">
      <h3>ภาระงานคงเหลือรายคน</h3>
      <div v-for="[id, r] in people" :key="id" class="pp">
        <Avatar :id="id || undefined" :label="id ? undefined : '?'" :size="24" />
        <span class="nm small">{{ person(id)?.name ?? 'ยังไม่มอบหมาย' }}</span>
        <div class="pb"><i :style="{ width: (r.hours / maxHours) * 100 + '%' }" /></div>
        <span class="small muted num">{{ r.open }} งาน · {{ r.hours }} ชม.</span>
      </div>
    </section>

    <section class="panel">
      <h3>ประเภทงาน</h3>
      <ul class="types"><li v-for="x in types" :key="x.k"><WorkTypeIcon :type="x.k" :size="14" />{{ WORK_TYPES[x.k].label }}<span class="num">{{ x.n }}</span></li></ul>
    </section>


  </div>
</template>

<style scoped>
.sum { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; align-items: start; }
.cards { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.kc { display: flex; gap: 12px; align-items: center; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); padding: 14px 16px; }
.kc > div { display: grid; line-height: 1.35; }
.kc strong { font-size: 16px; font-weight: 600; }
.ic { width: 36px; height: 36px; border-radius: var(--r-sm); background: var(--sunken); display: grid; place-items: center; color: var(--ink-2); flex: none; }
.donut { display: grid; grid-template-columns: 160px 1fr; gap: 16px; align-items: center; }
.donut svg { width: 160px; height: 160px; }
.a-todo { stroke: var(--line-strong); } .a-doing { stroke: var(--presale); } .a-review { stroke: var(--warn); } .a-done { stroke: var(--win); }
.dn { font: 700 8px var(--display); fill: var(--ink); }
.dl { font: 3px var(--font); fill: var(--muted); }
.act { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; max-height: 300px; overflow-y: auto; }
.act li { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: start; }
.lnk.inline { display: inline; color: var(--action); white-space: normal; }
.pchart { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; height: 180px; align-items: end; padding-top: 8px; border-bottom: 1px solid var(--line); }
.pcol { display: grid; justify-items: center; gap: 4px; height: 100%; grid-template-rows: auto 1fr auto auto; }
.pcol i { width: 60%; align-self: end; background: var(--line-strong); border-radius: 4px 4px 0 0; min-height: 2px; }
.pcol i.highest { background: var(--lose); } .pcol i.high { background: #d9622b; } .pcol i.medium { background: var(--warn); } .pcol i.low { background: var(--action); }
.sum .panel { padding: 18px; display: grid; gap: 12px; }
.stack { display: flex; height: 14px; border-radius: 99px; overflow: hidden; background: var(--idle-soft); gap: 2px; }
.stack i, .legend b { background: var(--line-strong); }
.stack .doing, .legend .doing { background: var(--presale); }
.stack .review, .legend .review { background: var(--warn); }
.stack .done, .legend .done { background: var(--win); }
.legend { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr; gap: 8px; font-size: 14px; min-width: 130px; }
.legend li { display: flex; align-items: center; gap: 0; }
.legend b { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; }
.legend .num { margin-left: auto; padding-left: 12px; font-weight: 600; }
.ep, .pp { display: grid; grid-template-columns: minmax(0, 1.4fr) 1fr auto; gap: 10px; align-items: center; }
.pp { grid-template-columns: auto minmax(0, 1fr) 1fr auto; }
.pb { height: 8px; background: var(--idle-soft); border-radius: 99px; overflow: hidden; }
.pb i { display: block; height: 100%; background: var(--post); }
.lnk { border: 0; background: none; padding: 0; text-align: left; font: 13.5px var(--font); color: var(--ink); cursor: pointer; display: inline-flex; gap: 6px; align-items: center; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lnk:hover { text-decoration: underline; }
.lst { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.lst li { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; gap: 8px; align-items: center; }
.nm { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.types { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; font-size: 14px; }
.types li { display: flex; gap: 8px; align-items: center; }
.types .num { margin-left: auto; font-weight: 600; }
.bad { color: var(--lose); }
@media (max-width: 1100px) { .sum { grid-template-columns: 1fr 1fr; } .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 700px) { .sum { grid-template-columns: 1fr; } .donut { grid-template-columns: 1fr; justify-items: center; } }
</style>
