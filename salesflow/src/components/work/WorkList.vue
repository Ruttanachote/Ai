<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import Avatar from '../Avatar.vue'
import Dialog from '../Dialog.vue'
import WorkTypeIcon from './WorkTypeIcon.vue'
import PriorityIcon from './PriorityIcon.vue'
import { person, thDate, TODAY_ISO } from '../../data/mock'
import { PRIORITIES, WORK_STATUS, WORK_TYPES, type Project, type Task, type WorkStatus } from '../../data/model'
import { groupKey, keyOf, newItem, record, STATUS_TH, tree, typeOf, type GroupBy } from '../../domain/work'
import { session } from '../../store'

// Spreadsheet-style list: hierarchy (epic → story/task → sub-task), inline status and assignee
// edits, grouping, and quick create at the bottom.
const props = defineProps<{ p: Project; list: Task[]; group: GroupBy; team: string[] }>()
const emit = defineEmits<{ open: [t: Task] }>()

const collapsed = ref(new Set<string>())
const selected = ref(new Set<string>())
const rows = computed(() => {
  const t = tree(props.list)
  const hidden = (x: Task): boolean => {
    const parent = props.list.find((y) => y.id === x.parentId)
    return !!parent && (collapsed.value.has(parent.id) || hidden(parent))
  }
  return t.filter((r) => !hidden(r.t))
})
const groups = computed(() => {
  if (props.group === 'none') return [{ k: '', label: '', rows: rows.value }]
  const keys = [...new Set(props.list.map((t) => groupKey(t, props.group)))]
  return keys.map((k) => ({ k, label: groupLabel(k), rows: props.list.filter((t) => groupKey(t, props.group) === k).map((t) => ({ t, depth: 0 })) }))
})
function groupLabel(k: string) {
  switch (props.group) {
    case 'status': return WORK_STATUS[k as WorkStatus].label
    case 'assignee': return person(k)?.name ?? 'ยังไม่มอบหมาย'
    case 'priority': return PRIORITIES[k as keyof typeof PRIORITIES].label
    case 'type': return WORK_TYPES[k as keyof typeof WORK_TYPES].label
    default: return k
  }
}
const hasChildren = (t: Task) => props.list.some((x) => x.parentId === t.id)
const toggle = (t: Task) => { const s = new Set(collapsed.value); s.has(t.id) ? s.delete(t.id) : s.add(t.id); collapsed.value = s }
const touch = (t: Task) => { t.updated = TODAY_ISO }
const onStatus = (t: Task) => { touch(t); record(props.p, session.userId, t, `เปลี่ยนสถานะเป็น ${STATUS_TH[t.status]}`, TODAY_ISO) }
const onAssign = (t: Task) => { touch(t); record(props.p, session.userId, t, t.assignee ? `มอบหมายให้ ${person(t.assignee)?.name}` : 'ยกเลิกการมอบหมาย', TODAY_ISO) }
// Row menu (⋯): open, assign to me, duplicate, delete with confirmation.
const menu = ref<string | null>(null)
// Close on Esc or any click outside the open menu; focus its first item when it opens.
const onDoc = (e: Event) => {
  if (e instanceof KeyboardEvent ? e.key === 'Escape' : !(e.target as HTMLElement).closest?.('.mn')) menu.value = null
}
watch(menu, async (m) => {
  if (m) {
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onDoc)
    await nextTick()
    document.querySelector<HTMLElement>('.pop button')?.focus()
  } else {
    document.removeEventListener('mousedown', onDoc)
    document.removeEventListener('keydown', onDoc)
  }
})
onBeforeUnmount(() => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onDoc) })
const confirmDel = ref<Task | null>(null)
function duplicate(t: Task) {
  const copy: Partial<Task> = { ...t }
  delete copy.id
  delete copy.key
  const c = newItem(props.p, { ...copy, title: t.title + ' (สำเนา)', status: 'todo', spent: 0, comments: [] }, session.userId, TODAY_ISO)
  props.p.tasks = [...(props.p.tasks ?? []), c]
  record(props.p, session.userId, c, 'สร้างงาน (คัดลอก)', TODAY_ISO)
  menu.value = null
}
function remove(t: Task) {
  props.p.tasks = (props.p.tasks ?? []).filter((x) => x.id !== t.id && x.parentId !== t.id)
  confirmDel.value = null
}
const late = (t: Task) => !!t.due && t.status !== 'done' && t.due < TODAY_ISO

const draft = ref('')
function create() {
  if (!draft.value.trim()) return
  const t = newItem(props.p, { title: draft.value.trim(), assignee: '' }, session.userId, TODAY_ISO)
  props.p.tasks = [...(props.p.tasks ?? []), t]
  record(props.p, session.userId, t, 'สร้างงาน', TODAY_ISO)
  draft.value = ''
}
const allSel = computed(() => props.list.length > 0 && props.list.every((t) => selected.value.has(t.id)))
const selectAll = () => { selected.value = allSel.value ? new Set() : new Set(props.list.map((t) => t.id)) }
function bulkStatus(s: WorkStatus) {
  props.list.filter((t) => selected.value.has(t.id)).forEach((t) => { t.status = s; touch(t) })
  selected.value = new Set()
}
</script>

<template>
  <div class="wl">
    <div v-if="selected.size" class="bulk" role="status">
      <span>เลือก {{ selected.size }} รายการ</span>
      <button v-for="(s, k) in WORK_STATUS" :key="k" class="btn sm" @click="bulkStatus(k)">ย้ายไป {{ s.label }}</button>
      <button class="btn sm ghost" @click="selected = new Set()">ยกเลิกการเลือก</button>
    </div>
    <div class="scroll-x frame">
      <table class="table grid">
        <thead>
          <tr>
            <th class="ck"><input type="checkbox" :checked="allSel" aria-label="เลือกทั้งหมด" @change="selectAll" /></th>
            <th class="work">งาน</th><th>ผู้รับผิดชอบ</th><th>ผู้แจ้ง</th><th>ความสำคัญ</th><th>สถานะ</th>
            <th>{{ p.workspace?.template === 'scrum' ? 'Sprint' : 'งวดงาน' }}</th><th>กำหนดเสร็จ</th><th class="r">ชม. ใช้/ประมาณ</th><th>สร้าง</th><th>แก้ไขล่าสุด</th><th class="mn"><span class="sr">เมนู</span></th>
          </tr>
        </thead>
        <tbody v-for="g in groups" :key="g.k">
          <tr v-if="g.label" class="gh"><td colspan="13"><strong>{{ g.label }}</strong> <span class="muted">{{ g.rows.length }}</span></td></tr>
          <tr v-for="{ t, depth } in g.rows" :key="t.id" :class="{ sel: selected.has(t.id) }">
            <td class="ck"><input type="checkbox" :checked="selected.has(t.id)" :aria-label="`เลือก ${keyOf(t)}`" @change="selected.has(t.id) ? selected.delete(t.id) : selected.add(t.id); selected = new Set(selected)" /></td>
            <td class="work">
              <span class="wcell" :style="{ paddingLeft: depth * 22 + 'px' }">
                <button v-if="hasChildren(t) && group === 'none'" class="tg" :aria-label="collapsed.has(t.id) ? 'ขยาย' : 'ยุบ'" @click="toggle(t)">{{ collapsed.has(t.id) ? '▸' : '▾' }}</button>
                <span v-else class="tg" />
                <WorkTypeIcon :type="typeOf(t)" />
                <button class="key" @click="emit('open', t)">{{ keyOf(t) }}</button>
                <button class="title" @click="emit('open', t)">{{ t.title }}</button>
                <span v-for="l in t.labels ?? []" :key="l" class="lab">{{ l }}</span>
              </span>
            </td>
            <td>
              <label class="as">
                <Avatar :id="t.assignee || undefined" :label="t.assignee ? undefined : '?'" :size="22" />
                <select v-model="t.assignee" class="bare" :aria-label="`ผู้รับผิดชอบ ${keyOf(t)}`" @change="onAssign(t)">
                  <option value="">ยังไม่มอบหมาย</option>
                  <option v-for="id in team" :key="id" :value="id">{{ person(id)?.name }}</option>
                </select>
              </label>
            </td>
            <td class="small"><span class="as"><Avatar :id="t.reporter" :size="22" />{{ person(t.reporter)?.name ?? '—' }}</span></td>
            <td><PriorityIcon :p="t.priority" label /></td>
            <td>
              <select v-model="t.status" class="st" :class="WORK_STATUS[t.status].tone" :aria-label="`สถานะ ${keyOf(t)}`" @change="onStatus(t)">
                <option v-for="(s, k) in WORK_STATUS" :key="k" :value="k">{{ s.label }}</option>
              </select>
            </td>
            <td class="small">{{ p.workspace?.template === 'scrum' ? (p.workspace.sprints?.find((s) => s.id === t.sprint)?.name ?? 'Backlog') : (t.milestone || '—') }}</td>
            <td class="small" :class="{ bad: late(t) }">{{ t.due ? thDate(t.due) : 'ยังไม่กำหนด' }}</td>
            <td class="r num small" :class="{ bad: t.hours && t.spent > t.hours }">{{ t.hours ? `${t.spent} / ${t.hours}` : '—' }}</td>
            <td class="small muted">{{ thDate(t.created) }}</td>
            <td class="small muted">{{ thDate(t.updated) }}</td>
            <td class="mn">
              <button class="dots" :aria-label="`เมนูของ ${keyOf(t)}`" :aria-expanded="menu === t.id" @click="menu = menu === t.id ? null : t.id">⋯</button>
              <div v-if="menu === t.id" class="pop" role="menu">
                <button role="menuitem" @click="emit('open', t); menu = null">เปิดรายละเอียด</button>
                <button role="menuitem" @click="t.assignee = session.userId; onAssign(t); menu = null">มอบหมายให้ฉัน</button>
                <button role="menuitem" @click="duplicate(t)">คัดลอกงาน</button>
                <button role="menuitem" class="del" @click="confirmDel = t; menu = null">ลบงาน</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <form class="create" @submit.prevent="create">
      <span class="plus">+</span>
      <input v-model="draft" class="bare grow" placeholder="เพิ่มงาน — พิมพ์ชื่อแล้วกด Enter" aria-label="ชื่องานใหม่" />
      <span class="muted small">{{ list.length }} จาก {{ (p.tasks ?? []).length }}</span>
    </form>
    <Dialog :open="!!confirmDel" :title="`ลบ ${confirmDel ? keyOf(confirmDel) : ''}`" @close="confirmDel = null">
      <p>ลบ “{{ confirmDel?.title }}”{{ confirmDel && list.some((x) => x.parentId === confirmDel!.id) ? ' และ Sub-task ทั้งหมด' : '' }} — กู้คืนไม่ได้</p>
      <template #foot><button class="btn" @click="confirmDel = null">ยกเลิก</button><button class="btn primary" @click="remove(confirmDel!)">ลบ {{ confirmDel ? keyOf(confirmDel) : '' }}</button></template>
    </Dialog>
  </div>
</template>

<style scoped>
.wl { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); overflow: hidden; }
.frame { max-width: 100%; }
.grid { min-width: 1300px; }
.grid th { background: var(--sunken); position: sticky; top: 0; }
.grid td { padding: 8px 12px; }
.ck { width: 36px; }
.ck input { width: 16px; height: 16px; accent-color: var(--ink); }
.work { min-width: 380px; }
.wcell { display: flex; align-items: center; gap: 8px; min-width: 0; }
.tg { width: 16px; flex: none; border: 0; background: none; cursor: pointer; color: var(--muted); padding: 0; font-size: 12px; }
.key { border: 0; background: none; padding: 0; color: var(--action); font: 500 13px var(--font); cursor: pointer; white-space: nowrap; }
.title { border: 0; background: none; padding: 0; color: var(--ink); font: 14px var(--font); cursor: pointer; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.key:hover, .title:hover { text-decoration: underline; }
.lab { font-size: 11px; padding: 1px 6px; border-radius: 4px; background: var(--idle-soft); color: var(--ink-2); white-space: nowrap; }
.as { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.bare { border: 0; background: transparent; font: 13.5px var(--font); color: var(--ink); padding: 2px; cursor: pointer; max-width: 150px; }
.bare:focus { outline: 2px solid var(--focus); border-radius: 4px; }
.st { border: 0; border-radius: 4px; font: 600 12px var(--font); padding: 3px 6px; cursor: pointer; background: var(--idle-soft); color: var(--ink-2); }
.st.presale { background: var(--presale-soft); color: var(--presale); }
.st.warn { background: var(--warn-soft); color: var(--warn); }
.st.win { background: var(--win-soft); color: var(--win); }
.gh td { background: var(--paper); font-size: 13.5px; }
tr.sel td { background: var(--presale-soft); }
.bad { color: var(--lose); }
.create { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-top: 1px solid var(--line); }
.plus { font-size: 18px; color: var(--muted); }
.grow { flex: 1; max-width: none; cursor: text; font-size: 14px; }
.mn { width: 44px; position: relative; }
.dots { border: 0; background: none; font-size: 18px; line-height: 1; padding: 2px 8px; border-radius: 4px; cursor: pointer; color: var(--muted); }
.dots:hover, .dots[aria-expanded='true'] { background: var(--idle-soft); color: var(--ink); }
.pop { position: absolute; right: 44px; top: 4px; z-index: 5; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-sm); box-shadow: var(--shadow-pop); display: grid; min-width: 160px; padding: 4px; }
.pop button { border: 0; background: none; text-align: left; padding: 8px 10px; font: 13.5px var(--font); cursor: pointer; border-radius: 4px; color: var(--ink); }
.pop button:hover { background: var(--sunken); }
.pop .del { color: var(--lose); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.bulk { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 10px 14px; background: var(--ink); color: #fff; font-size: 13.5px; }
.bulk .btn { background: transparent; color: #fff; border-color: rgb(255 255 255 / 0.35); }
</style>
