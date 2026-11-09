<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import Avatar from '../Avatar.vue'
import WorkTypeIcon from './WorkTypeIcon.vue'
import { person, thDate, TODAY_ISO } from '../../data/mock'
import { PRIORITIES, WORK_STATUS, WORK_TYPES, type Project, type Task, type WorkType } from '../../data/model'
import { keyOf, newItem, record, STATUS_TH, typeOf } from '../../domain/work'
import { session } from '../../store'

// Slide-over detail: edits apply immediately (no save button), Esc closes, focus returns.
const props = defineProps<{ p: Project; item: Task | null; team: string[] }>()
const emit = defineEmits<{ close: []; open: [t: Task] }>()
const panel = ref<HTMLElement>()
let last: Element | null = null

const parent = computed(() => props.p.tasks?.find((t) => t.id === props.item?.parentId))
const children = computed(() => (props.p.tasks ?? []).filter((t) => t.parentId === props.item?.id))
const parents = computed(() => (props.p.tasks ?? []).filter((t) => t.id !== props.item?.id && (typeOf(t) === 'epic' || (props.item && typeOf(props.item) === 'subtask' && typeOf(t) !== 'subtask'))))
const touch = () => { if (props.item) props.item.updated = TODAY_ISO }
const comment = ref('')
const child = ref('')

function addComment() {
  if (!props.item || !comment.value.trim()) return
  props.item.comments = [...(props.item.comments ?? []), { who: session.userId, at: 'วันนี้', text: comment.value.trim() }]
  record(props.p, session.userId, props.item, 'แสดงความคิดเห็น', TODAY_ISO)
  comment.value = ''
  touch()
}
function addChild() {
  if (!props.item || !child.value.trim()) return
  const type: WorkType = typeOf(props.item) === 'epic' ? 'task' : 'subtask'
  props.p.tasks = [...(props.p.tasks ?? []), newItem(props.p, { title: child.value.trim(), type, parentId: props.item.id, milestone: props.item.milestone, sprint: props.item.sprint, due: props.item.due }, session.userId, TODAY_ISO)]
  child.value = ''
}
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') emit('close') }
watch(() => props.item, async (it, old) => {
  if (it && !old) {
    last = document.activeElement
    document.addEventListener('keydown', onKey)
    await nextTick()
    panel.value?.querySelector<HTMLElement>('textarea, input, select, button')?.focus()
  } else if (!it && old) {
    document.removeEventListener('keydown', onKey)
    ;(last as HTMLElement | null)?.focus?.()
  }
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Transition name="dr">
    <div v-if="item" class="back" @mousedown.self="emit('close')">
      <aside ref="panel" class="drawer" role="dialog" aria-modal="true" :aria-label="`${keyOf(item)} ${item.title}`">
        <header>
          <nav class="crumb small">
            <template v-if="parent"><button class="lnk" @click="emit('open', parent)"><WorkTypeIcon :type="typeOf(parent)" :size="12" /> {{ keyOf(parent) }}</button> / </template>
            <WorkTypeIcon :type="typeOf(item)" :size="14" /> <strong>{{ keyOf(item) }}</strong>
          </nav>
          <button class="btn ghost x" aria-label="ปิด" @click="emit('close')">✕</button>
        </header>

        <div class="body">
          <textarea v-model="item.title" class="ttl" rows="2" aria-label="ชื่องาน" @change="touch" />

          <div class="row">
            <select v-model="item.status" class="st" :class="WORK_STATUS[item.status].tone" aria-label="สถานะ" @change="touch(); record(p, session.userId, item, `เปลี่ยนสถานะเป็น ${STATUS_TH[item.status]}`, TODAY_ISO)">
              <option v-for="(s, k) in WORK_STATUS" :key="k" :value="k">{{ s.label }}</option>
            </select>
          </div>

          <dl class="fields">
            <dt>ประเภท</dt>
            <dd><select v-model="item.type" class="input mini" @change="touch"><option v-for="(t, k) in WORK_TYPES" :key="k" :value="k">{{ t.label }}</option></select></dd>
            <dt>ผู้รับผิดชอบ</dt>
            <dd class="as"><Avatar :id="item.assignee || undefined" :label="item.assignee ? undefined : '?'" :size="22" />
              <select v-model="item.assignee" class="input mini" @change="touch"><option value="">ยังไม่มอบหมาย</option><option v-for="id in team" :key="id" :value="id">{{ person(id)?.name }}</option></select>
              <button v-if="item.assignee !== session.userId" class="lnk small" @click="item.assignee = session.userId; touch()">มอบหมายให้ฉัน</button></dd>
            <dt>ผู้แจ้ง</dt><dd class="as"><Avatar :id="item.reporter" :size="22" />{{ person(item.reporter)?.name ?? '—' }}</dd>
            <dt>ความสำคัญ</dt>
            <dd><select v-model="item.priority" class="input mini" @change="touch"><option v-for="(x, k) in PRIORITIES" :key="k" :value="k">{{ x.label }}</option></select></dd>
            <dt>Parent</dt>
            <dd><select v-model="item.parentId" class="input mini" @change="touch"><option :value="undefined">ไม่มี</option><option v-for="t in parents" :key="t.id" :value="t.id">{{ keyOf(t) }} {{ t.title }}</option></select></dd>
            <template v-if="p.workspace?.template === 'scrum'">
              <dt>Sprint</dt>
              <dd><select v-model="item.sprint" class="input mini" @change="touch"><option :value="undefined">Backlog</option><option v-for="s in p.workspace.sprints ?? []" :key="s.id" :value="s.id">{{ s.name }}</option></select></dd>
            </template>
            <template v-else>
              <dt>งวดงาน</dt>
              <dd><select v-model="item.milestone" class="input mini" @change="touch"><option value="">ไม่ระบุ</option><option v-for="m in p.milestones ?? []" :key="m.name" :value="m.name">{{ m.name }}</option></select></dd>
            </template>
            <dt>เริ่ม / กำหนดเสร็จ</dt>
            <dd class="dates"><input v-model="item.start" class="input mini" type="date" aria-label="วันเริ่ม" @change="touch" /><input v-model="item.due" class="input mini" type="date" aria-label="กำหนดเสร็จ" @change="touch" /></dd>
            <dt>ชั่วโมง ใช้ / ประมาณ</dt>
            <dd class="dates"><input v-model.number="item.spent" class="input mini num" type="number" min="0" aria-label="ชั่วโมงที่ใช้" @change="touch" /><input v-model.number="item.hours" class="input mini num" type="number" min="0" aria-label="ชั่วโมงประมาณ" @change="touch" /></dd>
            <dt>Label</dt>
            <dd><span v-for="l in item.labels ?? []" :key="l" class="lab">{{ l }}</span><span v-if="!(item.labels ?? []).length" class="muted small">—</span></dd>
          </dl>

          <div class="field"><label for="wd">รายละเอียด</label><textarea id="wd" v-model="item.description" class="input" rows="4" placeholder="ขอบเขต เกณฑ์ตรวจรับ หรือลิงก์เอกสาร" @change="touch" /></div>

          <section v-if="typeOf(item) !== 'subtask'" class="sub">
            <h4>{{ typeOf(item) === 'epic' ? 'งานใน Epic นี้' : 'Sub-task' }} <span class="muted">{{ children.filter((c) => c.status === 'done').length }}/{{ children.length }}</span></h4>
            <ul>
              <li v-for="c in children" :key="c.id"><WorkTypeIcon :type="typeOf(c)" :size="14" /><button class="lnk" @click="emit('open', c)">{{ keyOf(c) }} {{ c.title }}</button><span class="chip" :class="WORK_STATUS[c.status].tone">{{ WORK_STATUS[c.status].label }}</span><Avatar :id="c.assignee || undefined" :label="c.assignee ? undefined : '?'" :size="20" /></li>
            </ul>
            <form class="add" @submit.prevent="addChild"><input v-model="child" class="input mini" :placeholder="typeOf(item) === 'epic' ? 'เพิ่มงานใน Epic' : 'เพิ่ม Sub-task'" :aria-label="typeOf(item) === 'epic' ? 'เพิ่มงานใน Epic' : 'เพิ่ม Sub-task'" /><button class="btn sm" :disabled="!child.trim()">เพิ่ม</button></form>
          </section>

          <section class="sub">
            <h4>ความคิดเห็น</h4>
            <ul class="cm">
              <li v-for="(c, i) in item.comments ?? []" :key="i"><Avatar :id="c.who" :size="24" /><div><p class="small"><strong>{{ person(c.who)?.name }}</strong> <span class="muted">{{ c.at }}</span></p><p>{{ c.text }}</p></div></li>
            </ul>
            <form class="add" @submit.prevent="addComment"><input v-model="comment" class="input mini" placeholder="เขียนความคิดเห็น" aria-label="ความคิดเห็น" /><button class="btn sm" :disabled="!comment.trim()">ส่ง</button></form>
          </section>

          <p class="small muted foot">สร้าง {{ thDate(item.created) }} · แก้ไขล่าสุด {{ thDate(item.updated) }}</p>
        </div>
      </aside>
    </div>
  </Transition>
</template>

<style scoped>
.back { position: fixed; inset: 0; background: rgb(22 27 38 / 0.3); z-index: 70; display: flex; justify-content: flex-end; }
.drawer { width: min(560px, 100%); height: 100%; background: var(--surface); box-shadow: var(--shadow-pop); display: flex; flex-direction: column; }
header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid var(--line); }
.crumb { display: flex; gap: 6px; align-items: center; }
.x { padding: 0 10px; }
.body { padding: 16px 20px 28px; overflow-y: auto; display: grid; gap: 16px; align-content: start; }
.ttl { width: 100%; border: 1px solid transparent; border-radius: var(--r-sm); font: 600 20px var(--display); color: var(--ink); resize: vertical; padding: 4px 6px; background: none; }
.ttl:hover, .ttl:focus { border-color: var(--line-strong); outline: none; }
.st { border: 0; border-radius: var(--r-sm); font: 600 13px var(--font); padding: 7px 10px; cursor: pointer; background: var(--idle-soft); color: var(--ink-2); }
.st.presale { background: var(--presale-soft); color: var(--presale); }
.st.warn { background: var(--warn-soft); color: var(--warn); }
.st.win { background: var(--win-soft); color: var(--win); }
.fields { display: grid; grid-template-columns: 140px 1fr; gap: 10px 14px; margin: 0; padding: 14px; border: 1px solid var(--line); border-radius: var(--r-md); font-size: 14px; align-items: center; }
.fields dt { color: var(--muted); font-size: 13px; }
.fields dd { margin: 0; min-width: 0; }
.input.mini { min-height: 32px; padding: 3px 8px; font-size: 13.5px; width: auto; max-width: 100%; }
.as { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dates { display: flex; gap: 6px; flex-wrap: wrap; }
.dates .input { width: 140px; }
.lab { font-size: 12px; padding: 2px 7px; border-radius: 4px; background: var(--idle-soft); margin-right: 4px; }
.sub h4 { font-size: 14px; margin-bottom: 8px; display: flex; gap: 8px; }
.sub ul { list-style: none; margin: 0 0 8px; padding: 0; display: grid; gap: 6px; }
.sub li { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; gap: 8px; align-items: center; font-size: 13.5px; }
.cm li { grid-template-columns: auto 1fr; align-items: start; }
.add { display: flex; gap: 6px; }
.add .input { flex: 1; }
.lnk { border: 0; background: none; padding: 0; text-align: left; font: inherit; color: var(--action); cursor: pointer; display: inline-flex; gap: 4px; align-items: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.foot { border-top: 1px solid var(--line); padding-top: 12px; }
.dr-enter-active, .dr-leave-active { transition: opacity var(--t-med) var(--ease); }
.dr-enter-active .drawer, .dr-leave-active .drawer { transition: transform var(--t-med) var(--ease); }
.dr-enter-from, .dr-leave-to { opacity: 0; }
.dr-enter-from .drawer, .dr-leave-to .drawer { transform: translateX(24px); }
@media (max-width: 560px) { .fields { grid-template-columns: 1fr; } }
</style>
