<script setup lang="ts">
// Preventive Maintenance for one project: the plan agreed in the proposal and its rounds.
import { computed, reactive, ref } from 'vue'
import Dialog from './Dialog.vue'
import Avatar from './Avatar.vue'
import PmRoundActions from './PmRoundActions.vue'
import { PEOPLE, person, thDate, TODAY_ISO } from '../data/mock'
import { PM_CYCLES, PM_TEMPLATES, type PmPlan, type Project } from '../data/model'
import { addMonths, planRounds, roundDates, roundState, STATE_LABEL } from '../domain/pm'
import { notify, session } from '../store'

const props = defineProps<{ p: Project }>()
const plan = computed(() => props.p.pmPlan)
const rounds = computed(() => props.p.pmRounds ?? [])
const canEdit = computed(() => ['ma', 'admin', 'head'].includes(session.role) || (session.role === 'sm' && props.p.sm === session.userId && !['warranty', 'ended'].includes(props.p.stage)))
const sent = computed(() => rounds.value.filter((r) => r.status === 'sent').length)
const open = ref<string | null>(null)

const edit = ref(false)
const f = reactive<PmPlan>({ cycle: 3, first: TODAY_ISO, leadDays: 14, template: PM_TEMPLATES[0], preparer: '', customerEmail: '' })
function openEdit() {
  Object.assign(f, plan.value ?? { cycle: 3, first: props.p.startWarranty ? addMonths(props.p.startWarranty, 3) : TODAY_ISO, leadDays: 14, template: PM_TEMPLATES[0], preparer: props.p.workspace?.members?.find((m) => m.role === 'dev' || m.role === 'lead')?.userId ?? '', customerEmail: '' })
  edit.value = true
}
const preview = computed(() => (props.p.endWarranty ? roundDates(f, props.p.endWarranty) : []))
const devs = computed(() => PEOPLE.filter((u) => u.role === 'dev' || u.id === props.p.pm))
function save() {
  props.p.pmPlan = { ...f, preparer: f.preparer || undefined, customerEmail: f.customerEmail?.trim() || undefined }
  props.p.pmRounds = planRounds(props.p)
  edit.value = false
  notify(props.p.endWarranty ? `วางแผน PM ${PM_CYCLES[f.cycle]} · ${props.p.pmRounds.length} รอบ` : 'บันทึกรอบ PM แล้ว — ระบบสร้างรอบเมื่อเริ่มรับประกัน')
}
</script>

<template>
  <section class="panel pm">
    <div class="panel-head">
      <div><h2>Preventive Maintenance</h2>
        <p v-if="plan" class="small muted">{{ PM_CYCLES[plan.cycle] }} · เริ่ม {{ thDate(plan.first) }} · เตรียมล่วงหน้า {{ plan.leadDays }} วัน · {{ plan.template }}</p>
        <p v-else class="small muted">ยังไม่กำหนดรอบ — ระบุตามที่เสนอขาย (รายเดือน / 3 เดือน / 6 เดือน)</p></div>
      <button v-if="canEdit" class="btn sm" @click="openEdit">{{ plan ? 'แก้รอบ PM' : 'กำหนดรอบ PM' }}</button>
    </div>
    <template v-if="plan">
      <div class="meta small">
        <span>ผู้เตรียมรายงาน: <Avatar v-if="plan.preparer" :id="plan.preparer" :size="20" /> {{ person(plan.preparer)?.name ?? 'สมาชิกทีมพัฒนา' }}</span>
        <span>ส่งถึง: {{ plan.customerEmail ?? 'ยังไม่ระบุอีเมลลูกค้า' }}</span>
        <span>ส่งแล้ว {{ sent }} / {{ rounds.length }} รอบ</span>
      </div>
      <p v-if="!p.endWarranty" class="small muted">ระบบสร้างรอบอัตโนมัติเมื่อโครงการเริ่มรับประกัน</p>
      <table v-else class="table">
        <thead><tr><th>รอบ</th><th>กำหนดส่ง</th><th>สถานะ</th><th>เตรียมโดย</th><th>ส่งลูกค้า</th><th /></tr></thead>
        <tbody>
          <template v-for="r in rounds" :key="r.id">
            <tr>
              <td class="num">{{ r.no }}</td>
              <td>{{ thDate(r.due) }}</td>
              <td><span class="chip" :class="STATE_LABEL[roundState(r, plan, TODAY_ISO)].tone">{{ STATE_LABEL[roundState(r, plan, TODAY_ISO)].label }}</span><span v-if="r.returned" class="chip warn">ถูกส่งกลับ</span></td>
              <td class="small">{{ r.preparedBy ? person(r.preparedBy)?.name + ' · ' + thDate(r.preparedAt) : '—' }}</td>
              <td class="small">{{ r.sentAt ? thDate(r.sentAt) : '—' }}</td>
              <td class="r"><PmRoundActions :p="p" :r="r" /><button v-if="r.summary" class="btn sm ghost" @click="open = open === r.id ? null : r.id">{{ open === r.id ? 'ซ่อน' : 'ดูรายงาน' }}</button></td>
            </tr>
            <tr v-if="open === r.id" class="det"><td colspan="6">
              <p><b>สรุป:</b> {{ r.summary }}</p><p v-if="r.findings"><b>สิ่งที่พบ:</b> {{ r.findings }}</p><p v-if="r.advice"><b>ข้อแนะนำ:</b> {{ r.advice }}</p>
              <p class="small muted"><span v-for="x in r.files ?? []" :key="x">📎 {{ x }} </span><template v-if="r.sentTo"> · ส่งถึง {{ r.sentTo }}</template></p>
            </td></tr>
          </template>
        </tbody>
      </table>
    </template>

    <Dialog :open="edit" title="รอบ Preventive Maintenance (ตามที่เสนอขาย)" wide @close="edit = false">
      <div class="grid">
        <div class="field"><label for="pc">รอบ</label><select id="pc" v-model.number="f.cycle" class="input"><option v-for="(l, k) in PM_CYCLES" :key="k" :value="Number(k)">{{ l }}</option></select></div>
        <div class="field"><label for="pfst">วันที่รอบแรก</label><input id="pfst" v-model="f.first" type="date" class="input" /></div>
        <div class="field"><label for="pl">ให้ทีมพัฒนาเตรียมก่อน (วัน)</label><input id="pl" v-model.number="f.leadDays" type="number" min="1" max="60" class="input" /></div>
      </div>
      <div class="grid">
        <div class="field"><label for="pt">Template รายงาน</label><select id="pt" v-model="f.template" class="input"><option v-for="t in PM_TEMPLATES" :key="t">{{ t }}</option></select></div>
        <div class="field"><label for="pp">ผู้เตรียมรายงาน (ทีมพัฒนา)</label><select id="pp" v-model="f.preparer" class="input"><option value="">สมาชิกทีมพัฒนาคนใดก็ได้</option><option v-for="u in devs" :key="u.id" :value="u.id">{{ u.name }} · {{ u.team }}</option></select></div>
        <div class="field"><label for="pe">อีเมลลูกค้าที่รับรายงาน</label><input id="pe" v-model="f.customerEmail" type="email" class="input" placeholder="it@customer.go.th" /></div>
      </div>
      <p v-if="preview.length" class="small">รอบที่จะเกิดถึงหมดประกัน ({{ preview.length }} รอบ): <span class="muted">{{ preview.map((d) => thDate(d)).join(' · ') }}</span></p>
      <p v-else class="small muted">ยังไม่มีวันหมดประกัน — บันทึกรอบไว้ก่อน ระบบจะสร้างรายการรอบเมื่อเริ่มรับประกัน</p>
      <p class="small muted">รอบที่ส่งไปแล้วจะไม่ถูกเปลี่ยน · อีเมลถึงลูกค้าส่งจากกล่องกลางทีม MA</p>
      <template #foot><button class="btn" @click="edit = false">ยกเลิก</button><button class="btn primary" :disabled="!f.first" @click="save">บันทึก</button></template>
    </Dialog>
  </section>
</template>

<style scoped>
.pm { display: grid; gap: 10px; margin-bottom: 16px; }
.meta { display: flex; flex-wrap: wrap; gap: 6px 20px; align-items: center; color: var(--ink-2); }
.meta span { display: inline-flex; gap: 6px; align-items: center; }
.det td { background: var(--sunken); font-size: 14px; }
.det p { margin: 2px 0; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
@media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
</style>
