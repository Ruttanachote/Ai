<script setup lang="ts">
import { computed, ref } from 'vue'
import WorkTypeIcon from './WorkTypeIcon.vue'
import { TODAY_ISO } from '../../data/mock'
import type { Project, Task } from '../../data/model'
import { keyOf, record, typeOf } from '../../domain/work'
import { leaves, session } from '../../store'
import { person } from '../../data/mock'
import { awayOn } from '../../domain/leave'

// Month grid of due dates, plus contract milestone ends so the PM sees deliveries next to tasks.
const props = defineProps<{ p: Project; list: Task[] }>()
const emit = defineEmits<{ open: [t: Task] }>()
const month = ref(TODAY_ISO.slice(0, 7))
const showPanel = ref(true)
const uq = ref('')
const unscheduled = computed(() => props.list.filter((t) => !t.due && typeOf(t) !== 'epic' && (!uq.value || t.title.includes(uq.value))))
const dragId = ref<string | null>(null)
const overDay = ref<string | null>(null)
// Dropping a card on a day sets (or moves) its due date.
function drop(day: string) {
  const t = props.list.find((x) => x.id === dragId.value)
  if (t) {
    t.due = day
    if (!t.start || t.start > day) t.start = day
    t.updated = TODAY_ISO
    record(props.p, session.userId, t, `กำหนดวันครบกำหนดเป็น ${day}`, TODAY_ISO)
  }
  dragId.value = null
  overDay.value = null
}
const iso = (d: Date) => d.toISOString().slice(0, 10)

const days = computed(() => {
  const first = new Date(month.value + '-01T00:00:00Z')
  const start = new Date(first)
  start.setUTCDate(1 - ((first.getUTCDay() + 6) % 7)) // weeks start Monday
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setUTCDate(start.getUTCDate() + i)
    const k = iso(d)
    return {
      k, n: d.getUTCDate(), inMonth: k.startsWith(month.value),
      items: props.list.filter((t) => t.due === k && typeOf(t) !== 'epic'),
      ms: (props.p.milestones ?? []).filter((m) => m.end === k),
      away: (props.p.workspace?.members ?? []).map((m) => awayOn(leaves, m.userId, k)).filter((l): l is NonNullable<typeof l> => !!l),
    }
  })
})
const label = computed(() => new Date(month.value + '-01T00:00:00Z').toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }))
function shift(n: number) {
  const d = new Date(month.value + '-01T00:00:00Z')
  d.setUTCMonth(d.getUTCMonth() + n)
  month.value = iso(d).slice(0, 7)
}
</script>

<template>
  <div class="cal">
    <header>
      <button class="btn sm" aria-label="เดือนก่อน" @click="shift(-1)">‹</button>
      <h3>{{ label }}</h3>
      <button class="btn sm" aria-label="เดือนถัดไป" @click="shift(1)">›</button>
      <button class="btn sm ghost" @click="month = TODAY_ISO.slice(0, 7)">วันนี้</button>
      <span class="sp" />
      <button class="btn sm" :aria-pressed="showPanel" @click="showPanel = !showPanel">งานที่ยังไม่กำหนดวัน ({{ unscheduled.length }})</button>
    </header>
    <div class="wrap" :class="{ withPanel: showPanel }">
    <div class="scroll-x">
      <div class="grid">
        <span v-for="d in ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.']" :key="d" class="dow">{{ d }}</span>
        <div v-for="d in days" :key="d.k" class="day" :class="{ out: !d.inMonth, today: d.k === TODAY_ISO, over: overDay === d.k }"
          @dragover.prevent="overDay = d.k" @dragleave="overDay === d.k && (overDay = null)" @drop.prevent="drop(d.k)">
          <span class="n">{{ d.n }}</span>
          <span v-for="m in d.ms" :key="m.name" class="ms" :title="m.name">งวด: {{ m.name }}</span>
          <span v-for="l in d.away" :key="l.id" class="lv" :title="`${person(l.who)?.name} ลา`">ลา: {{ person(l.who)?.name }}{{ l.part === 'full' ? '' : l.part === 'am' ? ' (เช้า)' : ' (บ่าย)' }}</span>
          <button v-for="t in d.items.slice(0, 3)" :key="t.id" class="it" draggable="true" @dragstart="dragId = t.id" :class="{ done: t.status === 'done', late: t.status !== 'done' && t.due < TODAY_ISO }" @click="emit('open', t)">
            <WorkTypeIcon :type="typeOf(t)" :size="12" /><span>{{ keyOf(t) }} {{ t.title }}</span>
          </button>
          <span v-if="d.items.length > 3" class="more">+{{ d.items.length - 3 }} งาน</span>
        </div>
      </div>
    </div>
    <aside v-if="showPanel" class="panelU">
      <header class="ph"><h3>งานที่ยังไม่กำหนดวัน</h3><button class="btn ghost sm" aria-label="ปิด" @click="showPanel = false">✕</button></header>
      <p class="small muted">ลากงานไปวางบนวันในปฏิทินเพื่อกำหนดวันครบกำหนด</p>
      <input v-model="uq" class="input mini" placeholder="ค้นหางาน" aria-label="ค้นหางานที่ยังไม่กำหนดวัน" />
      <div class="ulist">
        <article v-for="t in unscheduled" :key="t.id" class="uc" draggable="true" tabindex="0" @dragstart="dragId = t.id" @dragend="dragId = null" @click="emit('open', t)" @keydown.enter="emit('open', t)">
          <strong class="small">{{ t.title }}</strong>
          <span class="small row"><WorkTypeIcon :type="typeOf(t)" :size="12" /> {{ keyOf(t) }}</span>
        </article>
        <p v-if="!unscheduled.length" class="small muted">ทุกงานมีวันครบกำหนดแล้ว</p>
      </div>
    </aside>
    </div>
  </div>
</template>

<style scoped>
.cal { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); padding: 14px; }
header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
header h3 { min-width: 160px; text-align: center; }
.sp { flex: 1; }
.wrap { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
.wrap.withPanel { grid-template-columns: minmax(0, 1fr) 260px; }
.day.over { background: var(--presale-soft); }
.panelU { border: 1px solid var(--line); border-radius: var(--r-md); padding: 12px; display: grid; gap: 10px; align-content: start; background: var(--sunken); }
.ph { display: flex; justify-content: space-between; align-items: center; margin: 0; }
.input.mini { min-height: 32px; font-size: 13.5px; }
.ulist { display: grid; gap: 8px; }
.uc { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-sm); padding: 8px 10px; display: grid; gap: 4px; cursor: grab; }
.uc .row { display: flex; gap: 6px; align-items: center; color: var(--muted); }
@media (max-width: 1000px) { .wrap.withPanel { grid-template-columns: 1fr; } }
.grid { display: grid; grid-template-columns: repeat(7, minmax(120px, 1fr)); border-top: 1px solid var(--line); border-left: 1px solid var(--line); min-width: 840px; }
.dow { padding: 6px 8px; font-size: 12px; color: var(--muted); border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); background: var(--sunken); }
.day { min-height: 108px; padding: 6px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.day.out { background: var(--sunken); }
.day.out .n { color: var(--faint); }
.day.today .n { background: var(--brand); color: #fff; border-radius: 99px; padding: 0 7px; }
.n { font-size: 12px; font-weight: 600; align-self: flex-start; }
.it { display: flex; gap: 5px; align-items: center; border: 0; text-align: left; font: 12px var(--font); padding: 3px 5px; border-radius: 4px; background: var(--presale-soft); color: var(--ink); cursor: pointer; min-width: 0; }
.it span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.it.done { background: var(--win-soft); text-decoration: line-through; color: var(--muted); }
.it.late { background: var(--lose-soft); }
.ms { font-size: 11px; font-weight: 600; color: var(--post); background: var(--post-soft); padding: 2px 5px; border-radius: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.more { font-size: 11px; color: var(--muted); }
.lv { display: block; font-size: 11px; padding: 1px 6px; border-radius: 4px; background: var(--lose-soft); color: var(--lose); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
