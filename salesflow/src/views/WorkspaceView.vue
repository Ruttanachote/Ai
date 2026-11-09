<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from '../components/Avatar.vue'
import Icon from '../components/Icon.vue'
import TemplatePicker from '../components/work/TemplatePicker.vue'
import WorkSummary from '../components/work/WorkSummary.vue'
import WorkList from '../components/work/WorkList.vue'
import WorkBoard from '../components/work/WorkBoard.vue'
import WorkCalendar from '../components/work/WorkCalendar.vue'
import WorkTimeline from '../components/work/WorkTimeline.vue'
import WorkBacklog from '../components/work/WorkBacklog.vue'
import WorkDocs from '../components/work/WorkDocs.vue'
import WorkForms from '../components/work/WorkForms.vue'
import WorkDrawer from '../components/work/WorkDrawer.vue'
import WorkReports from '../components/work/WorkReports.vue'
import WorkSettings from '../components/work/WorkSettings.vue'
import { canManage as manages } from '../components/work/actions'
import { defaultAutomation, defaultWorkflow } from '../domain/workflow'
import StageBadge from '../components/StageBadge.vue'
import { notify, projects, session } from '../store'
import { TODAY_ISO } from '../data/mock'
import { PRIORITIES, WORK_STATUS, WORK_TYPES, WORKSPACE_TEMPLATES, type MemberRole, type Task, type WorkspaceTemplate } from '../data/model'
import { createWorkspace, emptyFilter, matches, type GroupBy } from '../domain/work'
import { customerName } from '../display'

const props = defineProps<{ id: string }>()
const router = useRouter()
const p = computed(() => projects.find((x) => x.id === props.id))
const canManage = computed(() => !!p.value && manages(p.value))

type View = 'summary' | 'list' | 'board' | 'calendar' | 'timeline' | 'backlog' | 'reports' | 'docs' | 'forms' | 'settings'
const VIEW_LABEL: Record<View, { l: string; icon: string }> = {
  summary: { l: 'สรุป', icon: 'dashboard' }, list: { l: 'รายการ', icon: 'list' }, board: { l: 'บอร์ด', icon: 'board' }, calendar: { l: 'ปฏิทิน', icon: 'clock' },
  timeline: { l: 'Timeline', icon: 'gantt' }, backlog: { l: 'Backlog', icon: 'inbox' }, reports: { l: 'รายงาน', icon: 'chart' }, settings: { l: 'ตั้งค่า', icon: 'settings' }, docs: { l: 'เอกสาร', icon: 'file' }, forms: { l: 'แบบฟอร์ม', icon: 'ticket' },
}
// Template decides the order and which views open first; the rest stay one click away.
const views = computed<View[]>(() => {
  const t = p.value?.workspace?.template ?? 'milestone'
  const first = WORKSPACE_TEMPLATES[t].views as View[]
  const rest = (['summary', 'list', 'board', 'calendar', 'timeline', 'reports', 'docs', 'forms', 'settings'] as View[]).filter((v) => !first.includes(v))
  return [...first, ...rest]
})
const view = ref<View>('summary')
watch(() => p.value?.workspace?.template, (t) => { if (t) view.value = WORKSPACE_TEMPLATES[t].views[0] as View }, { immediate: true })

// Assignable people = workspace members (except viewers); older workspaces fall back to who is on the items.
const team = computed(() => {
  const x = p.value
  if (!x) return []
  if (x.workspace?.members?.length) return x.workspace.members.filter((m) => m.role !== 'viewer').map((m) => m.userId)
  return [...new Set<string>([x.pm, ...x.collaborators, ...(x.tasks ?? []).map((t) => t.assignee)].filter((v): v is string => !!v))]
})

const f = reactive(emptyFilter())
const group = ref<GroupBy>('none')
const filterOpen = ref(false)
const all = computed(() => p.value?.tasks ?? [])
const shown = computed(() => all.value.filter((t) => matches(t, f)))
const active = computed(() => f.types.length + f.statuses.length + f.priorities.length)
const toggle = <T,>(arr: T[], v: T) => { const i = arr.indexOf(v); i >= 0 ? arr.splice(i, 1) : arr.push(v) }
function clear() { Object.assign(f, emptyFilter()) }

const openItem = ref<Task | null>(null)
function create(template: WorkspaceTemplate, key: string) {
  if (!p.value) return
  createWorkspace(p.value, template, key, session.userId, TODAY_ISO, (x) => {
    const wf = defaultWorkflow(template)
    x.workspace!.workflow = wf
    x.workspace!.automation = defaultAutomation(wf)
    x.workspace!.members = [...new Set([x.pm ?? session.userId, ...x.collaborators])].map((userId, i) => ({ userId, role: (i === 0 ? 'pm' : 'dev') as MemberRole }))
  })
  notify(`สร้างพื้นที่งาน ${key} แบบ ${WORKSPACE_TEMPLATES[template].label} แล้ว`)
}
function switchTemplate(t: WorkspaceTemplate) {
  if (!p.value?.workspace) return
  p.value.workspace.template = t
  if (t === 'scrum' && !p.value.workspace.sprints) createWorkspace({ ...p.value, workspace: undefined, tasks: [] }, 'scrum', p.value.workspace.key, session.userId, TODAY_ISO)
  notify(`เปลี่ยนเป็นรูปแบบ ${WORKSPACE_TEMPLATES[t].label} — งานเดิมยังอยู่ครบ`)
}
</script>

<template>
  <div v-if="p" class="page wide">
    <router-link to="/work" class="back small">‹ พื้นที่งานโครงการ</router-link>

    <TemplatePicker v-if="!p.workspace && canManage" :p="p" @create="create" @cancel="router.push('/work')" />
    <section v-else-if="!p.workspace" class="panel empty">
      <h2>ยังไม่มีพื้นที่งาน</h2>
      <p class="muted">PM ของโครงการจะเลือกรูปแบบและสร้างพื้นที่งานหลังประชุม Handover</p>
    </section>

    <template v-else>
      <header class="wh">
        <span class="badge">{{ p.workspace.key }}</span>
        <div class="tt">
          <h1>{{ p.name }}</h1>
          <p class="small muted">{{ customerName(p) }} · {{ p.team }} · <StageBadge :stage="p.stage" /> · รูปแบบ {{ WORKSPACE_TEMPLATES[p.workspace.template].label }}</p>
        </div>
        <div class="people"><Avatar v-for="id in team.slice(0, 6)" :key="id" :id="id" :size="28" /></div>
        <select v-if="canManage" class="input mini" :value="p.workspace.template" aria-label="เปลี่ยนรูปแบบ" @change="switchTemplate(($event.target as HTMLSelectElement).value as WorkspaceTemplate)">
          <option v-for="(t, k) in WORKSPACE_TEMPLATES" :key="k" :value="k">รูปแบบ: {{ t.label }}</option>
        </select>
        <router-link v-if="session.role !== 'dev'" :to="`/projects/${p.id}`" class="btn sm">ข้อมูลโครงการ</router-link>
      </header>

      <nav class="tabs vt" role="tablist">
        <button v-for="v in views" :key="v" role="tab" :aria-selected="view === v" @click="view = v"><Icon :name="VIEW_LABEL[v].icon" :size="15" /> {{ VIEW_LABEL[v].l }}</button>
      </nav>

      <div v-if="!['docs', 'forms', 'settings', 'reports'].includes(view)" class="tools">
        <label class="srch"><Icon name="search" :size="16" /><input v-model="f.q" placeholder="ค้นหางาน รหัส หรือ Label" aria-label="ค้นหางาน" /></label>
        <div class="who" role="group" aria-label="กรองตามผู้รับผิดชอบ">
          <button v-for="id in team" :key="id" class="av" :class="{ on: f.assignees.includes(id) }" :aria-pressed="f.assignees.includes(id)" @click="toggle(f.assignees, id)"><Avatar :id="id" :size="28" /></button>
        </div>
        <div class="fwrap">
          <button class="btn sm" :aria-expanded="filterOpen" @click="filterOpen = !filterOpen"><Icon name="list" :size="15" /> ตัวกรอง<span v-if="active" class="cnt">{{ active }}</span></button>
          <div v-if="filterOpen" class="fpop" role="dialog" aria-label="ตัวกรอง">
            <fieldset><legend>ประเภท</legend><label v-for="(t, k) in WORK_TYPES" :key="k"><input type="checkbox" :checked="f.types.includes(k)" @change="toggle(f.types, k)" /> {{ t.label }}</label></fieldset>
            <fieldset><legend>สถานะ</legend><label v-for="(t, k) in WORK_STATUS" :key="k"><input type="checkbox" :checked="f.statuses.includes(k)" @change="toggle(f.statuses, k)" /> {{ t.label }}</label></fieldset>
            <fieldset><legend>ความสำคัญ</legend><label v-for="(t, k) in PRIORITIES" :key="k"><input type="checkbox" :checked="f.priorities.includes(k)" @change="toggle(f.priorities, k)" /> {{ t.label }}</label></fieldset>
            <div class="fa"><button class="btn sm ghost" @click="clear">ล้างทั้งหมด</button><button class="btn sm primary" @click="filterOpen = false">เสร็จ</button></div>
          </div>
        </div>
        <label v-if="view === 'list'" class="grp"><span class="small muted">จัดกลุ่ม</span>
          <select v-model="group" class="input mini" aria-label="จัดกลุ่มตาม">
            <option value="none">ไม่จัดกลุ่ม (ลำดับชั้น)</option><option value="status">สถานะ</option><option value="assignee">ผู้รับผิดชอบ</option>
            <option value="priority">ความสำคัญ</option><option value="type">ประเภท</option><option :value="p.workspace.template === 'scrum' ? 'sprint' : 'milestone'">{{ p.workspace.template === 'scrum' ? 'Sprint' : 'งวดงาน' }}</option>
          </select>
        </label>
        <button class="btn sm ghost" :aria-pressed="f.assignees.length === 1 && f.assignees[0] === session.userId" @click="f.assignees.splice(0, f.assignees.length, session.userId)">งานของฉัน</button>
        <button v-if="f.q || f.assignees.length || active" class="btn sm ghost" @click="clear">ล้างตัวกรอง</button>
        <span class="sp" />
        <span class="small muted">{{ shown.length }} จาก {{ all.length }} งาน</span>
      </div>

      <WorkSummary v-if="view === 'summary'" :p="p" :list="shown" @open="openItem = $event" />
      <WorkList v-else-if="view === 'list'" :p="p" :list="shown" :group="group" :team="team" @open="openItem = $event" />
      <WorkBoard v-else-if="view === 'board'" :p="p" :list="shown" :all="all" @open="openItem = $event" />
      <WorkCalendar v-else-if="view === 'calendar'" :p="p" :list="shown" @open="openItem = $event" />
      <WorkTimeline v-else-if="view === 'timeline'" :p="p" :list="shown" @open="openItem = $event" />
      <WorkBacklog v-else-if="view === 'backlog'" :p="p" :list="shown" @open="openItem = $event" />
      <WorkDocs v-else-if="view === 'docs'" :p="p" />
      <WorkForms v-else-if="view === 'forms'" :p="p" />
      <WorkReports v-else-if="view === 'reports'" :p="p" />
      <WorkSettings v-else-if="view === 'settings'" :p="p" />
    </template>

    <WorkDrawer :p="p" :item="openItem" :team="team" @close="openItem = null" @open="openItem = $event" />
  </div>
  <div v-else class="page"><h1>ไม่พบโครงการ</h1><router-link to="/work">กลับ</router-link></div>
</template>

<style scoped>
.wide { max-width: none; }
.back { color: var(--muted); display: inline-block; margin-bottom: 10px; }
.empty { display: grid; gap: 6px; }
.wh { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 8px; }
.badge { width: 44px; height: 44px; border-radius: var(--r-sm); background: var(--ink); color: #fff; display: grid; place-items: center; font: 700 12px var(--display); letter-spacing: 0.04em; }
.tt { flex: 1; min-width: 240px; }
.tt h1 { font-size: 24px; }
.tt p { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.people { display: flex; }
.people > :not(:first-child) { margin-left: -6px; box-shadow: 0 0 0 2px var(--paper); }
.input.mini { min-height: 34px; padding: 2px 8px; font-size: 13.5px; width: auto; }
.vt { margin-bottom: 14px; }
.vt button { display: inline-flex; gap: 6px; align-items: center; }
.tools { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 14px; }
.srch { display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 10px; border: 1px solid var(--line-strong); border-radius: var(--r-sm); background: var(--surface); color: var(--muted); }
.srch:focus-within { border-color: var(--focus); }
.srch input { border: 0; outline: 0; font: 14px var(--font); width: 210px; background: none; }
.who { display: flex; }
.av { border: 0; background: none; padding: 0; border-radius: 50%; cursor: pointer; margin-left: -4px; box-shadow: 0 0 0 2px var(--paper); }
.av:first-child { margin-left: 0; }
.av.on { box-shadow: 0 0 0 2px var(--action); z-index: 1; }
.fwrap { position: relative; }
.cnt { background: var(--action); color: #fff; border-radius: 99px; font-size: 11px; padding: 0 6px; }
.fpop { position: absolute; top: 40px; left: 0; z-index: 20; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); box-shadow: var(--shadow-pop); padding: 14px; display: grid; grid-template-columns: repeat(3, auto); gap: 18px; min-width: 460px; }
.fpop fieldset { border: 0; padding: 0; margin: 0; display: grid; gap: 6px; }
.fpop legend { font-size: 12.5px; color: var(--muted); margin-bottom: 4px; }
.fpop label { display: flex; gap: 6px; align-items: center; font-size: 13.5px; white-space: nowrap; }
.fpop input { accent-color: var(--ink); }
.fa { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 6px; }
.grp { display: flex; gap: 6px; align-items: center; }
.sp { flex: 1; }
@media (max-width: 700px) { .fpop { grid-template-columns: 1fr; min-width: 0; width: calc(100vw - 32px); } .srch input { width: 140px; } }
</style>
