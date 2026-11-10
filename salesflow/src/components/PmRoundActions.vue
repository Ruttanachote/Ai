<script setup lang="ts">
// Actions on one Preventive Maintenance round:
//   dev team (preparer / workspace member)  → fill the report from the template → hand to MA
//   MA team                                  → review → send from the central mailbox, or return
import { computed, reactive, ref } from 'vue'
import Dialog from './Dialog.vue'
import { person, thDate, TODAY_ISO } from '../data/mock'
import { MA_MAILBOX, PM_CYCLES, type PmRound, type Project } from '../data/model'
import { roundState } from '../domain/pm'
import { notify, pushNotices, session } from '../store'

const props = defineProps<{ p: Project; r: PmRound }>()
const state = computed(() => (props.p.pmPlan ? roundState(props.r, props.p.pmPlan, TODAY_ISO) : 'upcoming'))
const isMember = computed(() => !!props.p.workspace?.members?.some((m) => m.userId === session.userId) || props.p.pm === session.userId)
const canPrepare = computed(() => props.r.status !== 'sent' && props.r.status !== 'ready' && (props.p.pmPlan?.preparer === session.userId || isMember.value || session.role === 'admin'))
const canSend = computed(() => props.r.status === 'ready' && ['ma', 'admin'].includes(session.role))

const prep = ref(false)
const f = reactive({ summary: '', findings: '', advice: '', files: [] as string[] })
function openPrep() {
  Object.assign(f, { summary: props.r.summary ?? '', findings: props.r.findings ?? '', advice: props.r.advice ?? '', files: [...(props.r.files ?? [])] })
  prep.value = true
}
function addFiles(e: Event) {
  const list = [...((e.target as HTMLInputElement).files ?? [])].map((x) => x.name)
  f.files = [...new Set([...f.files, ...list])]
  ;(e.target as HTMLInputElement).value = ''
}
function saveDraft() {
  Object.assign(props.r, { ...f, status: 'preparing' })
  prep.value = false
  notify('บันทึกร่างรายงานแล้ว')
}
function handToMa() {
  Object.assign(props.r, { ...f, status: 'ready', preparedBy: session.userId, preparedAt: TODAY_ISO, returned: undefined })
  pushNotices([{ to: 'wm', projectId: props.p.id, text: `รายงาน PM รอบที่ ${props.r.no} · ${props.p.name} พร้อมส่งลูกค้า` }])
  prep.value = false
  notify(`ส่งรายงาน PM รอบที่ ${props.r.no} ให้ทีม MA แล้ว`)
}

const send = ref(false)
const m = reactive({ to: '', subject: '', body: '' })
function openSend() {
  const due = thDate(props.r.due)
  Object.assign(m, {
    to: props.p.pmPlan?.customerEmail ?? '',
    subject: `รายงานการบำรุงรักษาเชิงป้องกัน (Preventive Maintenance) รอบที่ ${props.r.no} — ${props.p.name}`,
    body: `เรียน ${props.p.customer}\n\nทีม MA ขอส่งรายงาน Preventive Maintenance รอบที่ ${props.r.no} (${PM_CYCLES[props.p.pmPlan!.cycle]} · กำหนด ${due}) ตามสัญญา ${props.p.code}\n\nสรุป: ${props.r.summary ?? '-'}\nสิ่งที่พบ: ${props.r.findings || '-'}\nข้อแนะนำ: ${props.r.advice || '-'}\n\nรายละเอียดตามไฟล์แนบ\nทีม Maintenance Support`,
  })
  send.value = true
}
const validEmail = computed(() => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m.to.trim()))
function doSend() {
  Object.assign(props.r, { status: 'sent', sentBy: session.userId, sentAt: TODAY_ISO, sentTo: m.to.trim() })
  if (props.p.pmPlan) props.p.pmPlan.customerEmail = m.to.trim()
  if (props.r.preparedBy) pushNotices([{ to: props.r.preparedBy, projectId: props.p.id, text: `ทีม MA ส่งรายงาน PM รอบที่ ${props.r.no} ถึงลูกค้าแล้ว` }])
  send.value = false
  notify(`ส่งอีเมลจาก ${MA_MAILBOX} ถึง ${m.to.trim()} แล้ว`)
}
const back = ref(false)
const reason = ref('')
function returnIt() {
  Object.assign(props.r, { status: 'preparing', returned: reason.value.trim() })
  if (props.r.preparedBy) pushNotices([{ to: props.r.preparedBy, projectId: props.p.id, text: `ทีม MA ส่งรายงาน PM รอบที่ ${props.r.no} กลับให้แก้: ${reason.value.trim()}` }])
  back.value = false; reason.value = ''
  notify('ส่งกลับให้ทีมพัฒนาแก้ไขแล้ว')
}
</script>

<template>
  <span class="ra">
    <button v-if="canPrepare && (state === 'prepare' || state === 'late' || r.status === 'preparing')" class="btn sm" :class="{ primary: !canSend }" @click="openPrep">{{ r.status === 'preparing' ? 'แก้รายงาน' : 'เตรียมรายงาน' }}</button>
    <template v-if="canSend">
      <button class="btn sm primary" @click="openSend">ส่งอีเมลถึงลูกค้า</button>
      <button class="btn sm ghost" @click="back = true">ส่งกลับให้แก้</button>
    </template>

    <Dialog :open="prep" :title="`รายงาน PM รอบที่ ${r.no} · ${p.name}`" wide @close="prep = false">
      <p class="small muted">Template: {{ p.pmPlan?.template }} · กำหนดส่งลูกค้า {{ thDate(r.due) }} — ทีมพัฒนารวบรวมข้อมูล แล้วส่งให้ทีม MA เป็นผู้ส่งอีเมล</p>
      <p v-if="r.returned" class="ret">MA ส่งกลับ: {{ r.returned }}</p>
      <div class="field"><label for="ps">สรุปผลการตรวจ</label><textarea id="ps" v-model="f.summary" class="input" rows="3" placeholder="สถานะระบบ การสำรองข้อมูล ประสิทธิภาพ" /></div>
      <div class="field"><label for="pf">สิ่งที่พบ</label><textarea id="pf" v-model="f.findings" class="input" rows="2" placeholder="ปัญหา / ความเสี่ยงที่พบในรอบนี้ (ถ้ามี)" /></div>
      <div class="field"><label for="pa">ข้อแนะนำ</label><textarea id="pa" v-model="f.advice" class="input" rows="2" /></div>
      <div class="field"><label>ไฟล์รายงาน (จาก Template)</label>
        <div class="files"><span v-for="x in f.files" :key="x" class="chip">📎 {{ x }}</span><label class="btn sm">แนบไฟล์<input type="file" multiple hidden @change="addFiles" /></label></div></div>
      <template #foot>
        <button class="btn" @click="saveDraft">บันทึกร่าง</button>
        <button class="btn primary" :disabled="!f.summary.trim() || !f.files.length" @click="handToMa">ส่งให้ทีม MA</button>
      </template>
    </Dialog>

    <Dialog :open="send" title="ส่งรายงาน PM ถึงลูกค้า" wide @close="send = false">
      <div class="mail">
        <p><span class="muted">จาก</span> {{ MA_MAILBOX }} <span class="small muted">(กล่องกลางทีม MA)</span></p>
        <div class="field"><label for="mt">ถึง</label><input id="mt" v-model="m.to" class="input" type="email" /></div>
        <div class="field"><label for="msub">หัวเรื่อง</label><input id="msub" v-model="m.subject" class="input" /></div>
        <div class="field"><label for="mb">ข้อความ</label><textarea id="mb" v-model="m.body" class="input" rows="9" /></div>
        <p class="small"><span class="muted">ไฟล์แนบ:</span> <span v-for="x in r.files ?? []" :key="x" class="chip">📎 {{ x }}</span></p>
        <p class="small muted">เตรียมโดย {{ person(r.preparedBy)?.name ?? '—' }} · {{ thDate(r.preparedAt) }}</p>
      </div>
      <template #foot><button class="btn" @click="send = false">ยกเลิก</button><button class="btn primary" :disabled="!validEmail" @click="doSend">ส่งอีเมล</button></template>
    </Dialog>

    <Dialog :open="back" title="ส่งกลับให้ทีมพัฒนาแก้" @close="back = false">
      <div class="field"><label for="rr">สิ่งที่ต้องแก้</label><textarea id="rr" v-model="reason" class="input" rows="3" /></div>
      <template #foot><button class="btn" @click="back = false">ยกเลิก</button><button class="btn primary" :disabled="!reason.trim()" @click="returnIt">ส่งกลับ</button></template>
    </Dialog>
  </span>
</template>

<style scoped>
.ra { display: inline-flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.files { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.ret { font-size: 14px; color: var(--warn); background: var(--warn-soft); padding: 8px 10px; border-radius: 8px; }
.mail { display: grid; gap: 12px; }
</style>
