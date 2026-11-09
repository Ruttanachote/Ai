<script setup lang="ts">
import { computed, ref } from 'vue'
import Avatar from '../Avatar.vue'
import WorkTypeIcon from './WorkTypeIcon.vue'
import PriorityIcon from './PriorityIcon.vue'
import { thDate, TODAY_ISO } from '../../data/mock'
import type { Project, Task, WorkflowStatus } from '../../data/model'
import { byPriority, keyOf, newItem, record, typeOf } from '../../domain/work'
import { statusOf, workflowOf } from '../../domain/workflow'
import { session } from '../../store'
import { canEdit, check, move } from './actions'

// Columns come from the workspace workflow. While dragging, columns the item may not move to
// are dimmed with the reason; WIP limits and the Definition of Done are enforced by the engine.
const props = defineProps<{ p: Project; list: Task[]; all: Task[] }>()
const emit = defineEmits<{ open: [t: Task] }>()
const cols = computed(() => workflowOf(props.p).statuses)
const dragging = ref<Task | null>(null)
const over = ref<string | null>(null)
const editable = computed(() => canEdit(props.p))

const cards = (s: WorkflowStatus) => props.list.filter((t) => statusOf(props.p, t).id === s.id && typeOf(t) !== 'epic').sort(byPriority)
const count = (s: WorkflowStatus) => props.all.filter((t) => statusOf(props.p, t).id === s.id && typeOf(t) !== 'epic').length
const epicOf = (t: Task) => {
  let p = props.all.find((x) => x.id === t.parentId)
  while (p && typeOf(p) !== 'epic') p = props.all.find((x) => x.id === p!.parentId)
  return p
}
const blocked = (s: WorkflowStatus) => (dragging.value && statusOf(props.p, dragging.value).id !== s.id ? check(props.p, dragging.value, s.id) : { ok: true, reason: '' })
const acc = (t: Task) => (t.acceptance?.length ? `${t.acceptance.filter((a) => a.done).length}/${t.acceptance.length}` : '')

const adding = ref<string | null>(null)
const draft = ref('')
function create(s: WorkflowStatus) {
  if (!draft.value.trim()) { adding.value = null; return }
  const t = newItem(props.p, { title: draft.value.trim(), status: s.category, statusId: s.id }, session.userId, TODAY_ISO)
  props.p.tasks = [...(props.p.tasks ?? []), t]
  record(props.p, session.userId, t, 'สร้างงาน', TODAY_ISO)
  draft.value = ''
}
function drop(s: WorkflowStatus) {
  if (dragging.value) move(props.p, dragging.value, s.id)
  dragging.value = null
  over.value = null
}
function key(e: KeyboardEvent, t: Task) {
  const i = cols.value.findIndex((c) => c.id === statusOf(props.p, t).id)
  if (editable.value && e.key === 'ArrowRight' && i < cols.value.length - 1) { move(props.p, t, cols.value[i + 1].id); e.preventDefault() }
  if (editable.value && e.key === 'ArrowLeft' && i > 0) { move(props.p, t, cols.value[i - 1].id); e.preventDefault() }
  if (e.key === 'Enter') emit('open', t)
}
</script>

<template>
  <div class="board" :style="{ gridTemplateColumns: `repeat(${cols.length}, minmax(220px, 1fr))` }">
    <section v-for="s in cols" :key="s.id" class="col" :class="[s.category, { over: over === s.id && blocked(s).ok, no: !blocked(s).ok }]"
      @dragover.prevent="over = s.id" @dragleave="over === s.id && (over = null)" @drop.prevent="drop(s)">
      <header>
        <h3><i class="dot" />{{ s.name }}</h3>
        <span class="n" :class="{ wip: s.wipLimit && count(s) >= s.wipLimit }" :title="s.wipLimit ? `จำกัด ${s.wipLimit} งาน` : ''">{{ count(s) }}<template v-if="s.wipLimit"> / {{ s.wipLimit }}</template></span>
      </header>
      <p v-if="!blocked(s).ok" class="why">{{ blocked(s).reason }}</p>
      <article v-for="t in cards(s)" :key="t.id" class="card" :class="{ late: !!t.due && t.status !== 'done' && t.due < TODAY_ISO, drag: dragging?.id === t.id }" :draggable="editable" tabindex="0"
        :aria-label="`${keyOf(t)} ${t.title} — ลูกศรซ้ายขวาเพื่อย้ายสถานะ Enter เพื่อเปิด`"
        @dragstart="dragging = t" @dragend="dragging = null; over = null" @click="emit('open', t)" @keydown="key($event, t)">
        <span v-if="epicOf(t)" class="epic">{{ epicOf(t)!.title }}</span>
        <strong>{{ t.title }}</strong>
        <div v-if="t.labels?.length || acc(t) || t.crId" class="tags">
          <span v-if="t.crId" class="cr">{{ t.crId }}</span>
          <span v-for="l in t.labels ?? []" :key="l" class="lab">{{ l }}</span>
          <span v-if="acc(t)" class="acc" :class="{ ok: t.acceptance!.every((a) => a.done) }" title="Acceptance criteria">✓ {{ acc(t) }}</span>
        </div>
        <div class="meta">
          <WorkTypeIcon :type="typeOf(t)" :size="14" />
          <span class="key">{{ keyOf(t) }}</span>
          <PriorityIcon :p="t.priority" />
          <span v-if="p.workspace?.estimate === 'points' && t.storyPoints" class="pts" title="Story points">{{ t.storyPoints }}</span>
          <span class="due small" :class="{ bad: t.due && t.status !== 'done' && t.due < TODAY_ISO }">{{ t.due ? thDate(t.due) : '' }}</span>
          <span class="avs">
            <Avatar v-for="c in t.coAssignees ?? []" :key="c" :id="c" :size="20" />
            <Avatar :id="t.assignee || undefined" :label="t.assignee ? undefined : '?'" :size="22" />
          </span>
        </div>
      </article>
      <p v-if="!cards(s).length && adding !== s.id" class="empty">{{ editable ? 'ลากงานมาวางที่นี่' : 'ไม่มีงาน' }}</p>
      <template v-if="editable">
        <form v-if="adding === s.id" class="quick" @submit.prevent="create(s)">
          <input v-model="draft" class="input" placeholder="ชื่องาน แล้วกด Enter" :aria-label="`งานใหม่ใน ${s.name}`" @keydown.esc="adding = null" @blur="!draft && (adding = null)" />
        </form>
        <button v-else-if="s.category !== 'done'" class="add" :aria-label="`เพิ่มงานใน ${s.name}`" @click="adding = s.id; draft = ''">+ เพิ่มงาน</button>
      </template>
    </section>
  </div>
</template>

<style scoped>
.board { display: grid; gap: 10px; overflow-x: auto; padding-bottom: 8px; }
.col { background: var(--sunken); border: 1px solid var(--line); border-radius: var(--r-md); padding: 10px; display: flex; flex-direction: column; gap: 8px; min-height: 440px; transition: background var(--t-fast), opacity var(--t-fast); }
.col.over { background: var(--presale-soft); border-color: var(--presale); }
.col.no { opacity: 0.55; }
header { display: flex; justify-content: space-between; align-items: center; padding: 2px 4px 6px; }
header h3 { font-size: 13px; color: var(--ink-2); display: flex; gap: 6px; align-items: center; text-transform: none; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--line-strong); }
.doing .dot { background: var(--presale); }
.review .dot { background: var(--warn); }
.done .dot { background: var(--win); }
.why { font-size: 12px; color: var(--lose); background: var(--lose-soft); border-radius: var(--r-sm); padding: 6px 8px; margin: 0; }
.n { font-size: 12px; color: var(--muted); background: var(--surface); border-radius: 99px; padding: 1px 8px; }
.n.wip { background: var(--lose-soft); color: var(--lose); font-weight: 600; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-sm); padding: 10px 12px; display: grid; gap: 8px; cursor: grab; }
.card:hover { border-color: var(--line-strong); }
.card:focus-visible { outline: 2px solid var(--focus); }
.card.late { border-left: 3px solid var(--lose); }
.card.drag { opacity: 0.4; }
.card strong { font-weight: 500; font-size: 14px; line-height: 1.4; }
.epic { justify-self: start; font-size: 11px; font-weight: 600; color: #6a3fc4; background: #efe9fb; padding: 1px 6px; border-radius: 4px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tags { display: flex; gap: 4px; flex-wrap: wrap; }
.lab, .acc, .cr { font-size: 11px; padding: 1px 6px; border-radius: 4px; background: var(--idle-soft); color: var(--ink-2); }
.cr { background: var(--warn-soft); color: var(--warn); font-weight: 600; }
.acc.ok { background: var(--win-soft); color: var(--win); }
.meta { display: flex; align-items: center; gap: 6px 8px; flex-wrap: wrap; }
.key, .due { white-space: nowrap; }
.key { font-size: 12px; color: var(--muted); }
.pts { font-size: 11px; font-weight: 600; min-width: 20px; text-align: center; padding: 1px 5px; border-radius: 99px; background: var(--idle-soft); }
.due { margin-left: auto; color: var(--muted); }
.avs { display: flex; }
.avs > :not(:first-child) { margin-left: -5px; box-shadow: 0 0 0 2px var(--surface); border-radius: 50%; }
.bad { color: var(--lose) !important; }
.add { border: 0; background: none; text-align: left; padding: 6px 8px; border-radius: var(--r-sm); font: 13px var(--font); color: var(--muted); cursor: pointer; }
.add:hover { background: var(--surface); color: var(--ink); }
.quick .input { min-height: 36px; font-size: 14px; }
.empty { font-size: 12.5px; color: var(--faint); text-align: center; padding: 24px 0; border: 1.5px dashed var(--line-strong); border-radius: var(--r-sm); }
</style>
