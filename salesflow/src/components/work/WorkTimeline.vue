<script setup lang="ts">
import { computed, ref } from 'vue'
import WorkTypeIcon from './WorkTypeIcon.vue'
import Avatar from '../Avatar.vue'
import { TODAY_ISO } from '../../data/mock'
import { WORK_STATUS, type Project, type Task } from '../../data/model'
import { keyOf, newItem, record, tree, typeOf, addDays } from '../../domain/work'
import { session } from '../../store'
import { canEdit, edited } from './actions'
import { thDate } from '../../data/mock'

// Epics with their children as bars from start to due. Weeks across the top; the red line is today.
const props = defineProps<{ p: Project; list: Task[] }>()
const emit = defineEmits<{ open: [t: Task] }>()
const collapsed = ref(new Set<string>())
const ms = (s: string) => new Date(s + 'T00:00:00Z').getTime()

const scheduled = computed(() => props.list.filter((t) => t.due))
const rows = computed(() => tree(scheduled.value).filter(({ t }) => {
  let p = props.list.find((x) => x.id === t.parentId)
  while (p) { if (collapsed.value.has(p.id)) return false; p = props.list.find((x) => x.id === p!.parentId) }
  return true
}))
const range = computed(() => {
  const dates = scheduled.value.flatMap((t) => [t.start || t.due, t.due]).concat(TODAY_ISO).map(ms)
  const s = new Date(Math.min(...dates)); s.setUTCDate(1)
  const e = new Date(Math.max(...dates)); e.setUTCMonth(e.getUTCMonth() + 1, 1)
  return { s: s.getTime(), e: e.getTime() }
})
const x = (iso: string) => ((ms(iso) - range.value.s) / (range.value.e - range.value.s)) * 100
// Month columns across the top (the project spans months, not days).
const weeks = computed(() => {
  const out: { label: string; left: number; cur: boolean }[] = []
  const d = new Date(range.value.s)
  while (d.getTime() < range.value.e) {
    out.push({ label: d.toLocaleDateString('th-TH', { month: 'long', year: '2-digit' }), left: ((d.getTime() - range.value.s) / (range.value.e - range.value.s)) * 100, cur: d.toISOString().slice(0, 7) === TODAY_ISO.slice(0, 7) })
    d.setUTCMonth(d.getUTCMonth() + 1)
  }
  return out
})
const draft = ref('')
function create() {
  if (!draft.value.trim()) return
  const t = newItem(props.p, { title: draft.value.trim(), start: TODAY_ISO, due: addDays(TODAY_ISO, 7) }, session.userId, TODAY_ISO)
  props.p.tasks = [...(props.p.tasks ?? []), t]
  record(props.p, session.userId, t, 'สร้างงาน', TODAY_ISO)
  draft.value = ''
}
const toggle = (id: string) => { const s = new Set(collapsed.value); s.has(id) ? s.delete(id) : s.add(id); collapsed.value = s }
const hasKids = (t: Task) => props.list.some((c) => c.parentId === t.id)

// Drag a bar to shift its dates, drag its right edge to change the due date (whole days).
const editable = computed(() => canEdit(props.p))
const drag = ref<{ t: Task; mode: 'move' | 'end'; x0: number; w: number; s0: string; d0: string; delta: number } | null>(null)
const dayMs = 86_400_000
function down(e: PointerEvent, t: Task, mode: 'move' | 'end') {
  if (!editable.value || e.button !== 0) return
  const track = (e.currentTarget as HTMLElement).closest('.track') as HTMLElement
  drag.value = { t, mode, x0: e.clientX, w: track.getBoundingClientRect().width, s0: t.start || t.due, d0: t.due, delta: 0 }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', up, { once: true })
}
function onMove(e: PointerEvent) {
  const d = drag.value
  if (!d) return
  const days = Math.round(((e.clientX - d.x0) / d.w) * ((range.value.e - range.value.s) / dayMs))
  if (days === d.delta) return
  d.delta = days
  if (d.mode === 'move') { d.t.start = addDays(d.s0, days); d.t.due = addDays(d.d0, days) }
  else d.t.due = addDays(d.d0, days) < d.s0 ? d.s0 : addDays(d.d0, days)
}
function up() {
  window.removeEventListener('pointermove', onMove)
  const d = drag.value
  drag.value = null
  if (!d || !d.delta) return
  if (d.mode === 'move') edited(d.t, 'ช่วงเวลา', `${thDate(d.s0)} – ${thDate(d.d0)}`, `${thDate(d.t.start)} – ${thDate(d.t.due)}`)
  else edited(d.t, 'กำหนดเสร็จ', thDate(d.d0), thDate(d.t.due))
  justDragged = true
  setTimeout(() => (justDragged = false), 0)
}
let justDragged = false
const click = (t: Task) => { if (!justDragged) emit('open', t) }
function keyBar(e: KeyboardEvent, t: Task) {
  if (!editable.value || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return
  const n = e.key === 'ArrowRight' ? 1 : -1
  const from = `${thDate(t.start || t.due)} – ${thDate(t.due)}`
  if (e.shiftKey) t.due = addDays(t.due, n)
  else { t.start = addDays(t.start || t.due, n); t.due = addDays(t.due, n) }
  edited(t, 'ช่วงเวลา', from, `${thDate(t.start)} – ${thDate(t.due)}`)
  e.preventDefault()
}
</script>

<template>
  <div class="tl scroll-x">
    <div class="inner" :style="{ minWidth: Math.max(900, weeks.length * 70 + 320) + 'px' }">
      <div class="head"><span class="lc">งาน</span><div class="track wk"><span v-for="w in weeks" :key="w.left" :class="{ cur: w.cur }" :style="{ left: w.left + '%' }">{{ w.label }}</span></div></div>
      <form class="row create" @submit.prevent="create"><div class="lc"><input v-model="draft" class="input mini" placeholder="ต้องทำอะไร? พิมพ์แล้วกด Enter" aria-label="งานใหม่บน Timeline" /></div><div class="track" /></form>
      <div v-for="{ t, depth } in rows" :key="t.id" class="row" :class="{ epic: typeOf(t) === 'epic' }">
        <div class="lc" :style="{ paddingLeft: 8 + depth * 18 + 'px' }">
          <button v-if="hasKids(t)" class="tg" @click="toggle(t.id)">{{ collapsed.has(t.id) ? '▸' : '▾' }}</button><span v-else class="tg" />
          <WorkTypeIcon :type="typeOf(t)" :size="14" />
          <button class="nm" @click="emit('open', t)"><span class="key">{{ keyOf(t) }}</span> {{ t.title }}</button>
        </div>
        <div class="track">
          <span v-for="w in weeks" :key="w.left" class="gl" :style="{ left: w.left + '%' }" />
          <button class="bar" :class="[t.status, { late: t.status !== 'done' && t.due < TODAY_ISO, grab: editable, dragging: drag?.t.id === t.id }]" :style="{ left: x(t.start || t.due) + '%', width: Math.max(1.2, x(t.due) - x(t.start || t.due) + 100 / ((range.e - range.s) / 86_400_000)) + '%' }"
            :title="`${keyOf(t)} · ${WORK_STATUS[t.status].label} · ${thDate(t.start || t.due)} → ${thDate(t.due)}${editable ? ' — ลากเพื่อเลื่อน ลากขอบขวาเพื่อเปลี่ยนกำหนดเสร็จ' : ''}`"
            :aria-label="`${keyOf(t)} ${thDate(t.start || t.due)} ถึง ${thDate(t.due)}${editable ? ' — ลูกศรซ้ายขวาเลื่อนวัน Shift+ลูกศรเปลี่ยนกำหนดเสร็จ' : ''}`"
            @pointerdown="down($event, t, 'move')" @click="click(t)" @keydown="keyBar($event, t)">
            <Avatar v-if="t.assignee && typeOf(t) !== 'epic'" :id="t.assignee" :size="16" />
            <span v-if="editable" class="rz" @pointerdown.stop="down($event, t, 'end')" />
          </button>
          <span v-if="drag?.t.id === t.id" class="tip" :style="{ left: x(t.start || t.due) + '%' }">{{ thDate(t.start || t.due) }} – {{ thDate(t.due) }}</span>
        </div>
      </div>
      <div class="today" :style="{ left: `calc(320px + (100% - 320px) * ${x(TODAY_ISO) / 100})` }"><em>วันนี้</em></div>
    </div>
  </div>
</template>

<style scoped>
.tl { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); }
.inner { position: relative; padding-bottom: 26px; }
.head, .row { display: grid; grid-template-columns: 320px 1fr; align-items: center; }
.head { height: 36px; border-bottom: 1px solid var(--line); background: var(--sunken); font-size: 12px; color: var(--muted); }
.row { min-height: 36px; border-bottom: 1px solid var(--line); }
.row.epic { background: #faf8fe; }
.lc { display: flex; align-items: center; gap: 6px; padding: 0 8px; min-width: 0; font-size: 13.5px; }
.tg { width: 14px; border: 0; background: none; color: var(--muted); cursor: pointer; padding: 0; font-size: 11px; flex: none; }
.nm { border: 0; background: none; text-align: left; font: inherit; color: var(--ink); cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0; }
.epic .nm { font-weight: 600; }
.key { color: var(--muted); font-size: 12px; }
.track { position: relative; height: 100%; min-height: 36px; }
.wk span { position: absolute; top: 10px; padding-left: 8px; white-space: nowrap; font-weight: 500; }
.wk span.cur { color: var(--ink); }
.create .input.mini { min-height: 30px; font-size: 13.5px; width: 100%; }
.gl { position: absolute; top: 0; bottom: 0; border-left: 1px dashed var(--line); }
.bar { position: absolute; top: 9px; height: 18px; border: 0; border-radius: 5px; background: var(--presale); cursor: pointer; display: flex; align-items: center; justify-content: flex-end; padding: 0 2px; }
.bar.grab { cursor: grab; touch-action: none; }
.bar.dragging { cursor: grabbing; opacity: 0.85; }
.rz { position: absolute; right: -3px; top: -2px; bottom: -2px; width: 8px; cursor: ew-resize; border-radius: 3px; }
.bar:hover .rz { background: rgb(0 0 0 / 0.18); }
.tip { position: absolute; top: -2px; transform: translateY(-100%); font-size: 11px; background: var(--ink); color: #fff; padding: 2px 6px; border-radius: 4px; white-space: nowrap; z-index: 3; pointer-events: none; }
.bar.todo { background: var(--line-strong); }
.bar.review { background: var(--warn); }
.bar.done { background: var(--win); }
.bar.late { box-shadow: 0 0 0 2px var(--lose); }
.epic .bar { background: #7b4fd6; height: 12px; top: 12px; border-radius: 3px; }
.today { position: absolute; top: 36px; bottom: 22px; border-left: 2px solid var(--brand); pointer-events: none; }
.today em { position: absolute; bottom: -20px; left: -16px; font-style: normal; font-size: 11px; font-weight: 600; color: var(--brand); background: var(--surface); padding: 0 3px; white-space: nowrap; }
</style>
