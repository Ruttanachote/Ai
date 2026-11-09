<script setup lang="ts">
import { ref } from 'vue'
import Avatar from '../Avatar.vue'
import WorkTypeIcon from './WorkTypeIcon.vue'
import PriorityIcon from './PriorityIcon.vue'
import { thDate, TODAY_ISO } from '../../data/mock'
import { WORK_STATUS, type Project, type Task, type WorkStatus } from '../../data/model'
import { session } from '../../store'
import { byPriority, keyOf, newItem, record, STATUS_TH, typeOf } from '../../domain/work'

// Status columns with drag-and-drop (and keyboard arrows on each card). Epics are shown as a
// label on their children instead of as cards — they are containers, not work.
const props = defineProps<{ p: Project; list: Task[]; all: Task[]; wipLimit?: number }>()
const emit = defineEmits<{ open: [t: Task] }>()
const COLS = Object.keys(WORK_STATUS) as WorkStatus[]
const dragging = ref<string | null>(null)
const over = ref<WorkStatus | null>(null)

const cards = (s: WorkStatus) => props.list.filter((t) => t.status === s && typeOf(t) !== 'epic').sort(byPriority)
const epicOf = (t: Task) => {
  let p = props.all.find((x) => x.id === t.parentId)
  while (p && typeOf(p) !== 'epic') p = props.all.find((x) => x.id === p!.parentId)
  return p
}
function move(t: Task, s: WorkStatus) {
  if (t.status === s) return
  t.status = s
  t.updated = TODAY_ISO
  record(props.p, session.userId, t, `เปลี่ยนสถานะเป็น ${STATUS_TH[s]}`, TODAY_ISO)
}
// Quick create at the bottom of a column — the new item starts in that column's status.
const adding = ref<WorkStatus | null>(null)
const draft = ref('')
function create(s: WorkStatus) {
  if (!draft.value.trim()) { adding.value = null; return }
  const t = newItem(props.p, { title: draft.value.trim(), status: s }, session.userId, TODAY_ISO)
  props.p.tasks = [...(props.p.tasks ?? []), t]
  record(props.p, session.userId, t, 'สร้างงาน', TODAY_ISO)
  draft.value = ''
}
function drop(s: WorkStatus) {
  const t = props.list.find((x) => x.id === dragging.value)
  if (t) move(t, s)
  dragging.value = null
  over.value = null
}
function key(e: KeyboardEvent, t: Task) {
  const i = COLS.indexOf(t.status)
  if (e.key === 'ArrowRight' && i < COLS.length - 1) { move(t, COLS[i + 1]); e.preventDefault() }
  if (e.key === 'ArrowLeft' && i > 0) { move(t, COLS[i - 1]); e.preventDefault() }
  if (e.key === 'Enter') emit('open', t)
}
</script>

<template>
  <div class="board">
    <section v-for="s in COLS" :key="s" class="col" :class="{ over: over === s }" @dragover.prevent="over = s" @dragleave="over === s && (over = null)" @drop.prevent="drop(s)">
      <header>
        <h3>{{ WORK_STATUS[s].label }}</h3>
        <span class="n" :class="{ wip: wipLimit && s === 'doing' && cards(s).length > wipLimit }">{{ cards(s).length }}<template v-if="wipLimit && s === 'doing'"> / {{ wipLimit }}</template></span>
      </header>
      <article v-for="t in cards(s)" :key="t.id" class="card" :class="{ late: !!t.due && t.status !== 'done' && t.due < TODAY_ISO, drag: dragging === t.id }" draggable="true" tabindex="0"
        :aria-label="`${keyOf(t)} ${t.title} — ลูกศรซ้ายขวาเพื่อย้ายสถานะ Enter เพื่อเปิด`"
        @dragstart="dragging = t.id" @dragend="dragging = null; over = null" @click="emit('open', t)" @keydown="key($event, t)">
        <span v-if="epicOf(t)" class="epic">{{ epicOf(t)!.title }}</span>
        <strong>{{ t.title }}</strong>
        <div class="meta">
          <WorkTypeIcon :type="typeOf(t)" :size="14" />
          <span class="key">{{ keyOf(t) }}</span>
          <PriorityIcon :p="t.priority" />
          <span class="due small" :class="{ bad: t.due && t.status !== 'done' && t.due < TODAY_ISO }">{{ t.due ? thDate(t.due) : 'ยังไม่กำหนดวัน' }}</span>
          <Avatar :id="t.assignee || undefined" :label="t.assignee ? undefined : '?'" :size="22" />
        </div>
      </article>
      <p v-if="!cards(s).length && adding !== s" class="empty">ลากงานมาวางที่นี่</p>
      <form v-if="adding === s" class="quick" @submit.prevent="create(s)">
        <input v-model="draft" class="input" placeholder="ชื่องาน แล้วกด Enter" :aria-label="`งานใหม่ใน ${WORK_STATUS[s].label}`" @keydown.esc="adding = null" @blur="!draft && (adding = null)" />
      </form>
      <button v-else class="add" :aria-label="`เพิ่มงานใน ${WORK_STATUS[s].label}`" @click="adding = s; draft = ''">+ เพิ่มงาน</button>
    </section>
  </div>
</template>

<style scoped>
.board { display: grid; grid-template-columns: repeat(4, minmax(240px, 1fr)); gap: 12px; overflow-x: auto; padding-bottom: 8px; }
.col { background: var(--sunken); border: 1px solid var(--line); border-radius: var(--r-md); padding: 10px; display: flex; flex-direction: column; gap: 8px; min-height: 420px; transition: background var(--t-fast); }
.col.over { background: var(--presale-soft); border-color: var(--presale); }
header { display: flex; justify-content: space-between; align-items: center; padding: 2px 4px 6px; }
header h3 { font-size: 13.5px; color: var(--ink-2); }
.n { font-size: 12px; color: var(--muted); background: var(--surface); border-radius: 99px; padding: 1px 8px; }
.n.wip { background: var(--lose-soft); color: var(--lose); font-weight: 600; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-sm); padding: 10px 12px; display: grid; gap: 8px; cursor: grab; }
.card:hover { border-color: var(--line-strong); }
.card.late { border-left: 3px solid var(--lose); }
.card.drag { opacity: 0.4; }
.card strong { font-weight: 500; font-size: 14px; line-height: 1.4; }
.epic { justify-self: start; font-size: 11px; font-weight: 600; color: #6a3fc4; background: #efe9fb; padding: 1px 6px; border-radius: 4px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta { display: flex; align-items: center; gap: 8px; }
.key { font-size: 12px; color: var(--muted); }
.due { margin-left: auto; color: var(--muted); }
.bad { color: var(--lose) !important; }
.add { border: 0; background: none; text-align: left; padding: 6px 8px; border-radius: var(--r-sm); font: 13px var(--font); color: var(--muted); cursor: pointer; }
.add:hover { background: var(--surface); color: var(--ink); }
.quick .input { min-height: 36px; font-size: 14px; }
.empty { font-size: 12.5px; color: var(--faint); text-align: center; padding: 24px 0; border: 1.5px dashed var(--line-strong); border-radius: var(--r-sm); }
</style>
