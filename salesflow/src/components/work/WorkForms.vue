<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Dialog from '../Dialog.vue'
import WorkTypeIcon from './WorkTypeIcon.vue'
import { person, thDate, TODAY_ISO } from '../../data/mock'
import { PRIORITIES, WORK_TYPES, type FormField, type Project, type WorkForm, type WorkType } from '../../data/model'
import { newItem, record } from '../../domain/work'
import { notify, session } from '../../store'

// Intake forms: customers (UAT issues, change requests) and the team (incidents) submit
// through a form, and every submission becomes a work item with the right type and priority.
const props = defineProps<{ p: Project }>()
const forms = computed(() => props.p.workspace?.forms ?? [])

const TEMPLATES: { k: string; name: string; type: WorkType; priority: WorkForm['priority']; audience: WorkForm['audience']; fields: FormField[] }[] = [
  { k: 'blank', name: 'ฟอร์มเปล่า', type: 'task', priority: 'medium', audience: 'ทีมภายใน', fields: [{ label: 'รายละเอียด', kind: 'long', required: true }] },
  { k: 'uat', name: 'แจ้งปัญหาจาก UAT', type: 'bug', priority: 'high', audience: 'ลูกค้า', fields: [{ label: 'หน้าจอที่พบปัญหา', kind: 'text', required: true }, { label: 'ขั้นตอนที่ทำ', kind: 'long', required: true }] },
  { k: 'cr', name: 'Change request', type: 'story', priority: 'medium', audience: 'ลูกค้า', fields: [{ label: 'สิ่งที่ต้องการเปลี่ยน', kind: 'long', required: true }, { label: 'ต้องการภายในวันที่', kind: 'date' }] },
  { k: 'bug', name: 'Bug report', type: 'bug', priority: 'high', audience: 'ทีมภายใน', fields: [{ label: 'สิ่งที่เกิดขึ้น', kind: 'long', required: true }, { label: 'สิ่งที่ควรเป็น', kind: 'long' }] },
  { k: 'incident', name: 'Incident', type: 'bug', priority: 'highest', audience: 'ทีมภายใน', fields: [{ label: 'ระบบที่เกิดเหตุ', kind: 'text', required: true }, { label: 'ผลกระทบต่อผู้ใช้', kind: 'long', required: true }] },
  { k: 'review', name: 'Technical review', type: 'task', priority: 'medium', audience: 'ทีมภายใน', fields: [{ label: 'สิ่งที่ต้องรีวิว', kind: 'text', required: true }, { label: 'ลิงก์ Pull request / เอกสาร', kind: 'text' }] },
]
const COLORS: Record<string, string> = { uat: '#d9622b', cr: '#2f6fd8', incident: '#c4382f', bug: '#a33c6b', review: '#0f7f86', blank: '#6b7384' }

function createFrom(t: (typeof TEMPLATES)[number]) {
  if (!props.p.workspace) return
  const f: WorkForm = { id: 'f' + Date.now().toString(36), name: t.name, template: t.k, createsType: t.type, priority: t.priority, audience: t.audience, fields: t.fields.map((x) => ({ ...x })), updated: TODAY_ISO, by: session.userId, submissions: 0 }
  props.p.workspace.forms = [f, ...forms.value]
  notify(`สร้างฟอร์ม “${t.name}” แล้ว`)
}

const filling = ref<WorkForm | null>(null)
const subject = ref('')
const answers = reactive<Record<string, string>>({})
function open(f: WorkForm) { filling.value = f; subject.value = ''; Object.keys(answers).forEach((k) => delete answers[k]) }
const missing = computed(() => !subject.value.trim() || (filling.value?.fields ?? []).some((f) => f.required && !answers[f.label]?.trim()))
function submit() {
  const f = filling.value
  if (!f || missing.value) return
  const description = f.fields.map((x) => `${x.label}: ${answers[x.label] ?? '-'}`).join('\n')
  const item = newItem(props.p, { title: subject.value.trim(), type: f.createsType, priority: f.priority, description, labels: [f.name] }, session.userId, TODAY_ISO)
  props.p.tasks = [...(props.p.tasks ?? []), item]
  f.submissions += 1
  record(props.p, session.userId, item, `ส่งฟอร์ม “${f.name}”`, TODAY_ISO)
  notify(`ส่งแล้ว — สร้างงาน ${item.key}`)
  filling.value = null
}
</script>

<template>
  <div class="forms">
    <section class="panel">
      <h2>สร้างฟอร์มใหม่</h2>
      <div class="tpls">
        <button v-for="t in TEMPLATES" :key="t.k" class="btn" :class="{ primary: t.k === 'blank' }" @click="createFrom(t)">{{ t.name }}</button>
      </div>
    </section>

    <h2>ฟอร์มของโครงการ</h2>
    <div class="cards">
      <article v-for="f in forms" :key="f.id" class="card">
        <div class="art" :style="{ background: COLORS[f.template] ?? '#6b7384' }"><div class="sheet"><i /><i /><i class="s" /><i /><i class="s" /></div></div>
        <h3>{{ f.name }}</h3>
        <p class="small muted">แก้ไข {{ thDate(f.updated) }} โดย {{ person(f.by)?.name }} · ส่งแล้ว {{ f.submissions }} ครั้ง</p>
        <div class="ft">
          <span class="t"><WorkTypeIcon :type="f.createsType" :size="14" /> สร้าง {{ WORK_TYPES[f.createsType].label }} · {{ PRIORITIES[f.priority].label }}</span>
          <span class="chip" :class="f.audience === 'ลูกค้า' ? 'presale' : ''">{{ f.audience }}</span>
        </div>
        <button class="btn sm" @click="open(f)">กรอกฟอร์ม</button>
      </article>
    </div>

    <Dialog :open="!!filling" :title="filling?.name ?? ''" @close="filling = null">
      <p class="hint">ส่งแล้วระบบสร้างงานประเภท {{ filling ? WORK_TYPES[filling.createsType].label : '' }} ในพื้นที่งานของ {{ p.workspace?.key }}</p>
      <div class="field"><label for="fs">หัวข้อ</label><input id="fs" v-model="subject" class="input" /></div>
      <div v-for="(x, i) in filling?.fields ?? []" :key="x.label" class="field">
        <label :for="'ff' + i">{{ x.label }}{{ x.required ? '' : ' (ไม่บังคับ)' }}</label>
        <textarea v-if="x.kind === 'long'" :id="'ff' + i" v-model="answers[x.label]" class="input" rows="3" />
        <select v-else-if="x.kind === 'select'" :id="'ff' + i" v-model="answers[x.label]" class="input"><option v-for="o in x.options ?? []" :key="o">{{ o }}</option></select>
        <input v-else :id="'ff' + i" v-model="answers[x.label]" class="input" :type="x.kind === 'date' ? 'date' : 'text'" />
      </div>
      <template #foot><button class="btn" @click="filling = null">ยกเลิก</button><button class="btn primary" :disabled="missing" @click="submit">ส่งฟอร์ม</button></template>
    </Dialog>
  </div>
</template>

<style scoped>
.forms { display: grid; gap: 16px; }
.tpls { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); padding: 14px; display: grid; gap: 8px; }
.art { height: 140px; border-radius: var(--r-sm); display: grid; place-items: center; }
.sheet { width: 46%; height: 78%; background: #fff; border-radius: 6px; padding: 12px; display: grid; gap: 6px; align-content: start; box-shadow: 0 4px 12px -6px rgb(0 0 0 / 0.3); }
.sheet i { height: 6px; border-radius: 3px; background: #dfe2e8; }
.sheet i.s { width: 60%; }
.card h3 { font-size: 15px; }
.ft { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.t { display: inline-flex; gap: 6px; align-items: center; font-size: 13px; color: var(--ink-2); }
.card .btn { justify-self: start; }
</style>
