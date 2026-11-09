<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import Avatar from '../Avatar.vue'
import WorkTypeIcon from './WorkTypeIcon.vue'
import { person, thDate, TODAY_ISO } from '../../data/mock'
import { PRIORITIES, WORK_STATUS, WORK_TYPES, type Project, type Task, type WorkType } from '../../data/model'
import { keyOf, newItem, record, typeOf } from '../../domain/work'
import { addWorklog, allowedTargets, statusOf, workflowOf } from '../../domain/workflow'
import { notify, session } from '../../store'
import { canEdit, edited, isAdmin, move } from './actions'

// Slide-over detail: edits apply immediately (no save button), Esc closes, focus returns.
const props = defineProps<{ p: Project; item: Task | null; team: string[] }>()
const emit = defineEmits<{ close: []; open: [t: Task] }>()
const panel = ref<HTMLElement>()
let last: Element | null = null

const parent = computed(() => props.p.tasks?.find((t) => t.id === props.item?.parentId))
const children = computed(() => (props.p.tasks ?? []).filter((t) => t.parentId === props.item?.id))
const parents = computed(() => (props.p.tasks ?? []).filter((t) => t.id !== props.item?.id && (typeOf(t) === 'epic' || (props.item && typeOf(props.item) === 'subtask' && typeOf(t) !== 'subtask'))))
const touch = () => { if (props.item) props.item.updated = TODAY_ISO }
const tab = ref<'detail' | 'history' | 'time'>('detail')
const editable = computed(() => canEdit(props.p))
const targets = computed(() => (props.item ? allowedTargets(props.p, props.item, session.userId, isAdmin()) : []))
const blockedTargets = computed(() => (props.item ? workflowOf(props.p).statuses.filter((s) => !targets.value.includes(s)) : []))
function setStatus(e: Event) {
  const el = e.target as HTMLSelectElement
  if (props.item && !move(props.p, props.item, el.value)) el.value = statusOf(props.p, props.item).id
}
// Snapshot the value on focus so the history shows from → to for any field.
let before: unknown
const snap = (v: unknown) => { before = Array.isArray(v) ? [...v] : v }
const NAME = (id?: string) => (id ? person(id)?.name ?? id : '')
function changed(field: string, to: unknown, fmt: (v: any) => string = (v) => String(v ?? '')) {
  if (!props.item) return
  edited(props.item, field, fmt(before), fmt(to))
  if (field === 'ผู้รับผิดชอบ') record(props.p, session.userId, props.item, to ? `มอบหมายให้ ${NAME(String(to))}` : 'ยกเลิกการมอบหมาย', TODAY_ISO)
  touch()
}
const label = ref('')
function addLabel() {
  if (!props.item || !label.value.trim()) return
  const l = label.value.trim()
  if (!(props.item.labels ?? []).includes(l)) { props.item.labels = [...(props.item.labels ?? []), l]; edited(props.item, 'Label', undefined, l) }
  label.value = ''
}
function dropLabel(l: string) { if (!props.item) return; props.item.labels = (props.item.labels ?? []).filter((x) => x !== l); edited(props.item, 'Label', l, undefined) }
const crit = ref('')
function addCrit() {
  if (!props.item || !crit.value.trim()) return
  props.item.acceptance = [...(props.item.acceptance ?? []), { text: crit.value.trim(), done: false }]
  crit.value = ''
}
function tick(i: number) {
  const a = props.item?.acceptance?.[i]
  if (!a || !props.item) return
  a.done = !a.done
  edited(props.item, 'Acceptance', undefined, `${a.done ? '✓' : '✗'} ${a.text}`)
}
const fileInput = ref<HTMLInputElement>()
function attach(e: Event) {
  const files = [...((e.target as HTMLInputElement).files ?? [])]
  if (!props.item || !files.length) return
  const folder = `${props.p.name}/Work/${keyOf(props.item)}`
  props.item.attachments = [...(props.item.attachments ?? []), ...files.map((f) => ({ name: f.name, size: f.size > 1e6 ? `${(f.size / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1e3))} KB`, by: session.userId, at: TODAY_ISO, folder }))]
  files.forEach((f) => edited(props.item!, 'ไฟล์แนบ', undefined, f.name))
  notify(`อัปโหลด ${files.length} ไฟล์ไปที่ SharePoint › ${folder}`)
  ;(e.target as HTMLInputElement).value = ''
}
const coOptions = computed(() => props.team.filter((id) => id !== props.item?.assignee && !(props.item?.coAssignees ?? []).includes(id)))
function addCo(e: Event) {
  const el = e.target as HTMLSelectElement
  if (!props.item || !el.value) return
  props.item.coAssignees = [...(props.item.coAssignees ?? []), el.value]
  edited(props.item, 'ผู้ร่วมทำ', undefined, NAME(el.value))
  el.value = ''
}
function dropCo(id: string) { if (!props.item) return; props.item.coAssignees = (props.item.coAssignees ?? []).filter((x) => x !== id); edited(props.item, 'ผู้ร่วมทำ', NAME(id), undefined) }
const wl = ref({ day: TODAY_ISO, hours: 1, ot: false, note: '' })
function logTime() {
  if (!props.item) return
  addWorklog(props.p, props.item, session.userId, wl.value.day, wl.value.hours, wl.value.ot, wl.value.note, TODAY_ISO)
  notify(wl.value.ot ? `บันทึก ${wl.value.hours} ชม. และส่งคำขอ OT ให้ PM อนุมัติแล้ว` : `บันทึก ${wl.value.hours} ชม. แล้ว`)
  wl.value = { day: TODAY_ISO, hours: 1, ot: false, note: '' }
}
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
  if (it && !old) { last = document.activeElement; document.addEventListener('keydown', onKey) }
  if (!it && old) { document.removeEventListener('keydown', onKey); (last as HTMLElement | null)?.focus?.(); return }
  if (!it || it === old) return
  tab.value = 'detail'
  await nextTick()
  if (!old) panel.value?.querySelector<HTMLElement>('textarea, input, select, button')?.focus({ preventScroll: true })
  // Always open at the top (the title), also when jumping to a parent or child item.
  requestAnimationFrame(() => panel.value?.querySelector('.body')?.scrollTo(0, 0))
}, { immediate: true })
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
            <select class="st" :class="WORK_STATUS[item.status].tone" :value="statusOf(p, item).id" aria-label="สถานะ" :disabled="!editable" @change="setStatus">
              <option v-for="s in targets" :key="s.id" :value="s.id">{{ s.name }}</option>
              <optgroup v-if="blockedTargets.length" label="ย้ายไม่ได้ตาม Workflow"><option v-for="s in blockedTargets" :key="s.id" :value="s.id" disabled>{{ s.name }}</option></optgroup>
            </select>
            <span v-if="item.crId" class="crb">จาก {{ item.crId }}</span>
            <span class="sp" />
            <nav class="dtabs" role="tablist">
              <button role="tab" :aria-selected="tab === 'detail'" @click="tab = 'detail'">รายละเอียด</button>
              <button role="tab" :aria-selected="tab === 'time'" @click="tab = 'time'">เวลา <span class="muted">{{ item.spent }}</span></button>
              <button role="tab" :aria-selected="tab === 'history'" @click="tab = 'history'">ประวัติ <span class="muted">{{ item.history?.length ?? 0 }}</span></button>
            </nav>
          </div>

          <template v-if="tab === 'detail'">

          <dl class="fields">
            <dt>ประเภท</dt>
            <dd><select v-model="item.type" class="input mini" @change="touch"><option v-for="(t, k) in WORK_TYPES" :key="k" :value="k">{{ t.label }}</option></select></dd>
            <dt>ผู้รับผิดชอบ</dt>
            <dd class="as"><Avatar :id="item.assignee || undefined" :label="item.assignee ? undefined : '?'" :size="22" />
              <select v-model="item.assignee" class="input mini" :disabled="!editable" @focus="snap(item.assignee)" @change="changed('ผู้รับผิดชอบ', item.assignee, NAME)"><option value="">ยังไม่มอบหมาย</option><option v-for="id in team" :key="id" :value="id">{{ person(id)?.name }}</option></select>
              <button v-if="editable && item.assignee !== session.userId" class="lnk small" @click="snap(item.assignee); item.assignee = session.userId; changed('ผู้รับผิดชอบ', item.assignee, NAME)">มอบหมายให้ฉัน</button></dd>
            <dt>ผู้ร่วมทำ</dt>
            <dd class="as"><span v-for="c in item.coAssignees ?? []" :key="c" class="pill"><Avatar :id="c" :size="18" />{{ NAME(c) }}<button v-if="editable" :aria-label="`เอา ${NAME(c)} ออก`" @click="dropCo(c)">✕</button></span>
              <select v-if="editable && coOptions.length" class="input mini" aria-label="เพิ่มผู้ร่วมทำ" @change="addCo"><option value="">+ เพิ่ม</option><option v-for="id in coOptions" :key="id" :value="id">{{ NAME(id) }}</option></select></dd>
            <dt>ผู้แจ้ง</dt><dd class="as"><Avatar :id="item.reporter" :size="22" />{{ person(item.reporter)?.name ?? '—' }}</dd>
            <dt>ความสำคัญ</dt>
            <dd><select v-model="item.priority" class="input mini" @focus="snap(item.priority)" @change="changed('ความสำคัญ', item.priority, (v) => PRIORITIES[v as keyof typeof PRIORITIES]?.label ?? '')"><option v-for="(x, k) in PRIORITIES" :key="k" :value="k">{{ x.label }}</option></select></dd>
            <dt>Parent</dt>
            <dd><select v-model="item.parentId" class="input mini" @change="touch"><option :value="undefined">ไม่มี</option><option v-for="t in parents" :key="t.id" :value="t.id">{{ keyOf(t) }} {{ t.title }}</option></select></dd>
            <template v-if="p.workspace?.template === 'scrum'">
              <dt>Sprint</dt>
              <dd><select v-model="item.sprint" class="input mini" @focus="snap(item.sprint)" @change="changed('Sprint', item.sprint, (v) => p.workspace?.sprints?.find((x) => x.id === v)?.name ?? 'Backlog')"><option :value="undefined">Backlog</option><option v-for="s in p.workspace.sprints ?? []" :key="s.id" :value="s.id">{{ s.name }}</option></select></dd>
            </template>
            <template v-else>
              <dt>งวดงาน</dt>
              <dd><select v-model="item.milestone" class="input mini" @focus="snap(item.milestone)" @change="changed('งวดงาน', item.milestone)"><option value="">ไม่ระบุ</option><option v-for="m in p.milestones ?? []" :key="m.name" :value="m.name">{{ m.name }}</option></select></dd>
            </template>
            <dt>เริ่ม / กำหนดเสร็จ</dt>
            <dd class="dates"><input v-model="item.start" class="input mini" type="date" aria-label="วันเริ่ม" @focus="snap(item.start)" @change="changed('วันเริ่ม', item.start, thDate)" /><input v-model="item.due" class="input mini" type="date" aria-label="กำหนดเสร็จ" @focus="snap(item.due)" @change="changed('กำหนดเสร็จ', item.due, thDate)" /></dd>
            <template v-if="p.workspace?.estimate === 'points'">
              <dt>Story points</dt>
              <dd><select v-model.number="item.storyPoints" class="input mini" @focus="snap(item.storyPoints)" @change="changed('Story points', item.storyPoints)"><option :value="undefined">—</option><option v-for="n in [1, 2, 3, 5, 8, 13, 21]" :key="n" :value="n">{{ n }}</option></select></dd>
            </template>
            <dt>ชั่วโมง ประมาณ</dt>
            <dd class="dates"><input v-model.number="item.hours" class="input mini num" type="number" min="0" aria-label="ชั่วโมงประมาณ" @focus="snap(item.hours)" @change="changed('ชั่วโมงประมาณ', item.hours)" /><span class="small muted">ใช้ไป {{ item.spent }} ชม. (บันทึกในแท็บเวลา)</span></dd>
            <dt>Label</dt>
            <dd class="as"><span v-for="l in item.labels ?? []" :key="l" class="pill">{{ l }}<button v-if="editable" :aria-label="`ลบ Label ${l}`" @click="dropLabel(l)">✕</button></span>
              <form v-if="editable" class="lf" @submit.prevent="addLabel"><input v-model="label" class="input mini" placeholder="+ Label" aria-label="เพิ่ม Label" list="lbls" /></form>
              <datalist id="lbls"><option v-for="l in [...new Set((p.tasks ?? []).flatMap((x) => x.labels ?? []))]" :key="l" :value="l" /></datalist></dd>
          </dl>

          <div class="field"><label for="wd">รายละเอียด</label><textarea id="wd" v-model="item.description" class="input" rows="4" placeholder="ขอบเขต เกณฑ์ตรวจรับ หรือลิงก์เอกสาร" @change="touch" /></div>

          <section v-if="typeOf(item) !== 'epic'" class="sub">
            <h4>Acceptance criteria <span class="muted">{{ (item.acceptance ?? []).filter((a) => a.done).length }}/{{ (item.acceptance ?? []).length }}</span>
              <span v-if="workflowOf(p).requireAcceptanceForDone" class="small muted">· ต้องครบก่อนย้ายไป Done</span></h4>
            <ul class="ac">
              <li v-for="(a, i) in item.acceptance ?? []" :key="i"><label><input type="checkbox" :checked="a.done" :disabled="!editable" @change="tick(i)" /> <span :class="{ dn: a.done }">{{ a.text }}</span></label></li>
            </ul>
            <form v-if="editable" class="add" @submit.prevent="addCrit"><input v-model="crit" class="input mini" placeholder="เพิ่มเกณฑ์ตรวจรับ" aria-label="เพิ่ม Acceptance criteria" /><button class="btn sm" :disabled="!crit.trim()">เพิ่ม</button></form>
          </section>

          <section class="sub">
            <h4>ไฟล์แนบ <span class="muted">{{ (item.attachments ?? []).length }}</span></h4>
            <ul>
              <li v-for="(f, i) in item.attachments ?? []" :key="i" class="fl"><span class="fi">📎</span><span class="fn">{{ f.name }}</span><span class="small muted">{{ f.size }}</span><span class="small muted">{{ NAME(f.by) }} · {{ thDate(f.at) }}</span></li>
            </ul>
            <p class="small muted">เก็บใน SharePoint › {{ p.name }}/Work/{{ keyOf(item) }}</p>
            <template v-if="editable"><input ref="fileInput" type="file" multiple hidden @change="attach" /><button class="btn sm" @click="fileInput?.click()">แนบไฟล์</button></template>
          </section>

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

          </template>

          <section v-else-if="tab === 'time'" class="sub">
            <div class="tsum"><div><b>{{ item.spent }}</b><span>ชม. ที่ใช้</span></div><div><b>{{ item.hours || '—' }}</b><span>ชม. ประมาณ</span></div>
              <div><b :class="{ bad: item.hours && item.spent > item.hours }">{{ item.hours ? Math.max(0, item.hours - item.spent) : '—' }}</b><span>คงเหลือ</span></div></div>
            <form v-if="editable" class="wl" @submit.prevent="logTime">
              <label>วันที่<input v-model="wl.day" type="date" class="input mini" /></label>
              <label>ชั่วโมง<input v-model.number="wl.hours" type="number" min="0.5" step="0.5" class="input mini num" /></label>
              <label class="grow">ทำอะไร<input v-model="wl.note" class="input mini" placeholder="เช่น แก้ callback ตาม v3" /></label>
              <label class="ck"><input v-model="wl.ot" type="checkbox" /> ทำนอกเวลา (ขอ OT)</label>
              <button class="btn sm primary" :disabled="!(wl.hours > 0)">บันทึกเวลา</button>
            </form>
            <p v-if="wl.ot" class="small muted">ระบบจะสร้างคำขอ OT ให้ PM อนุมัติในเงินกัน OT ของ Cost Sheet (อัตรา ฿{{ (p.workspace?.hourlyRate ?? 600).toLocaleString() }}/ชม.)</p>
            <ul class="logs">
              <li v-for="(w, i) in item.worklogs ?? []" :key="i"><Avatar :id="w.who" :size="22" /><span>{{ NAME(w.who) }}</span><span class="small muted">{{ thDate(w.day) }}</span><b class="num">{{ w.hours }} ชม.</b><span v-if="w.overtime" class="chip warn">OT</span><span class="small muted nt">{{ w.note }}</span></li>
              <li v-if="!(item.worklogs ?? []).length" class="muted small">ยังไม่มีการบันทึกเวลา</li>
            </ul>
          </section>

          <section v-else class="sub">
            <ol class="hist">
              <li v-for="(h, i) in item.history ?? []" :key="i">
                <Avatar :id="h.who === 'automation' ? undefined : h.who" :label="h.who === 'automation' ? '⚙' : undefined" :size="22" />
                <div><p class="small"><strong>{{ h.who === 'automation' ? 'Automation' : NAME(h.who) }}</strong> เปลี่ยน <b>{{ h.field }}</b> <span class="muted">· {{ h.at }} {{ thDate(h.day) }}</span></p>
                  <p class="chg"><s v-if="h.from">{{ h.from }}</s><span v-if="h.from && h.to"> → </span><span v-if="h.to">{{ h.to }}</span></p></div>
              </li>
              <li v-if="!(item.history ?? []).length" class="muted small">ยังไม่มีการเปลี่ยนแปลง — ทุกการแก้ไขสถานะ ผู้รับผิดชอบ วันที่ และ Sprint จะบันทึกที่นี่</li>
            </ol>
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
.ttl { width: 100%; border: 1px solid transparent; border-radius: var(--r-sm); font: 600 20px/1.4 var(--display); color: var(--ink); resize: vertical; padding: 4px 6px; background: none; min-height: 2.2em; height: auto; field-sizing: content; overflow: hidden; }
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
.row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sp { flex: 1; }
.crb { font-size: 12px; font-weight: 600; color: var(--warn); background: var(--warn-soft); padding: 3px 8px; border-radius: 4px; }
.dtabs { display: flex; gap: 2px; background: var(--sunken); border-radius: var(--r-sm); padding: 2px; }
.dtabs button { border: 0; background: none; padding: 5px 10px; border-radius: 4px; font: 13px var(--font); cursor: pointer; color: var(--ink-2); }
.dtabs button[aria-selected='true'] { background: var(--surface); color: var(--ink); font-weight: 600; box-shadow: 0 1px 2px rgb(0 0 0 / 0.08); }
.pill { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; padding: 2px 4px 2px 7px; border-radius: 99px; background: var(--idle-soft); }
.pill button { border: 0; background: none; cursor: pointer; color: var(--muted); font-size: 10px; padding: 0 3px; }
.lf .input { width: 110px; }
.ac li { display: block; }
.ac label { display: flex; gap: 8px; align-items: flex-start; font-size: 13.5px; cursor: pointer; }
.ac input { margin-top: 3px; accent-color: var(--win); }
.dn { text-decoration: line-through; color: var(--muted); }
.sub li.fl { grid-template-columns: auto minmax(0, 1fr) auto auto; }
.fn { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tsum { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
.tsum div { border: 1px solid var(--line); border-radius: var(--r-sm); padding: 10px; display: grid; }
.tsum b { font: 600 20px var(--display); }
.tsum span { font-size: 12px; color: var(--muted); }
.wl { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-end; padding: 12px; background: var(--sunken); border-radius: var(--r-sm); }
.wl label { display: grid; gap: 4px; font-size: 12px; color: var(--muted); }
.wl .grow { flex: 1; min-width: 160px; }
.wl .grow .input { width: 100%; }
.wl .num { width: 80px; }
.wl .ck { display: flex; gap: 6px; align-items: center; color: var(--ink); font-size: 13px; padding-bottom: 6px; }
.logs { margin-top: 12px !important; }
.logs li { grid-template-columns: auto auto auto auto auto minmax(0, 1fr) !important; }
.nt { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hist { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.hist li { display: grid; grid-template-columns: auto 1fr; gap: 10px; }
.chg { font-size: 13.5px; }
.chg s { color: var(--muted); }
.bad { color: var(--lose); }
.foot { border-top: 1px solid var(--line); padding-top: 12px; }
.dr-enter-active, .dr-leave-active { transition: opacity var(--t-med) var(--ease); }
.dr-enter-active .drawer, .dr-leave-active .drawer { transition: transform var(--t-med) var(--ease); }
.dr-enter-from, .dr-leave-to { opacity: 0; }
.dr-enter-from .drawer, .dr-leave-to .drawer { transform: translateX(24px); }
@media (max-width: 560px) { .fields { grid-template-columns: 1fr; } }
</style>
