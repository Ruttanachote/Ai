<script setup lang="ts">
// Declare leave (not sent to HR): pick days, see which open tasks it overlaps on the timeline,
// decide per task, then the PM of each affected project is notified and every task gets a log line.
import { computed, reactive, watch } from 'vue'
import Dialog from './Dialog.vue'
import { person, thDate, TODAY_ISO } from '../data/mock'
import { IMPACT_ACTIONS, LEAVE_TYPES, type ImpactAction, type Leave, type LeavePart, type LeaveType } from '../data/model'
import { findImpacts, firstDayBack, leaveLength, suggestStandIn } from '../domain/leave'
import { logChange } from '../domain/workflow'
import { leaves, notify, projects, pushNotices, session } from '../store'

const props = defineProps<{ open: boolean; who?: string }>()
const emit = defineEmits<{ close: [] }>()
const f = reactive({ from: TODAY_ISO, to: TODAY_ISO, part: 'full' as LeavePart, type: 'vacation' as LeaveType, note: '' })
const who = computed(() => props.who ?? session.userId)
watch(() => props.open, (o) => { if (o) Object.assign(f, { from: TODAY_ISO, to: TODAY_ISO, part: 'full', type: 'vacation', note: '' }) })
watch(() => f.from, (v) => { if (f.to < v) f.to = v })
watch(() => [f.from, f.to], () => { if (f.from !== f.to) f.part = 'full' })

const impacts = reactive<{ list: ReturnType<typeof findImpacts> }>({ list: [] })
watch(() => [f.from, f.to, who.value, props.open], () => {
  impacts.list = findImpacts(projects, who.value, f.from, f.to, impacts.list).map((i) => ({ ...i, newDue: i.newDue ?? firstDayBack(f.to) }))
}, { immediate: true })
const days = computed(() => leaveLength(f))
const overlapping = computed(() => leaves.filter((l) => l.status === 'active' && l.who === who.value && l.from <= f.to && l.to >= f.from))
const pending = computed(() => impacts.list.filter((i) => i.action === 'pending').length)
const proj = (id: string) => projects.find((p) => p.id === id)
const standIns = (projectId: string) => { const p = proj(projectId); return p ? suggestStandIn(p, who.value, f.from, f.to, leaves) : [] }
const range = (a: string, b: string) => (a === b ? thDate(a) : `${thDate(a)} – ${thDate(b)}`)
const valid = computed(() => f.from && f.to && f.to >= f.from && days.value > 0 && !overlapping.value.length && !pending.value)

function save() {
  if (!valid.value) return
  const r = range(f.from, f.to) + (f.part === 'am' ? ' (ครึ่งเช้า)' : f.part === 'pm' ? ' (ครึ่งบ่าย)' : '')
  const l: Leave = {
    id: 'lv' + Date.now().toString(36), who: who.value, from: f.from, to: f.to, part: f.part, type: f.type, note: f.note.trim() || undefined,
    createdAt: TODAY_ISO, status: 'active', impacts: impacts.list.map((i) => ({ ...i, resolved: i.action === 'before' || i.action === 'none' })),
    log: [{ at: 'เมื่อสักครู่', who: session.userId, text: `แจ้งลา ${r} (${LEAVE_TYPES[f.type]}) · กระทบ ${impacts.list.length} งาน` }],
  }
  const notices: { to: string; text: string; projectId: string }[] = []
  for (const i of l.impacts) {
    const p = proj(i.projectId)
    const t = p?.tasks?.find((x) => x.id === i.taskId)
    if (!p || !t) continue
    const what = i.action === 'move' ? `ขอเลื่อนวันส่งเป็น ${thDate(i.newDue)}` : IMPACT_ACTIONS[i.action]
    logChange(t, session.userId, 'แจ้งลา', undefined, `${person(who.value)?.name} ลา ${r} · ${what}`, TODAY_ISO)
    l.log.push({ at: 'เมื่อสักครู่', who: session.userId, text: `${i.key}: ${what}` })
    if (p.pm && p.pm !== session.userId && (i.action === 'move' || i.action === 'reassign'))
      notices.push({ to: p.pm, projectId: p.id, text: `${person(who.value)?.name} ลา ${r} — ${i.key} ${what}` })
  }
  leaves.unshift(l)
  pushNotices(notices)
  notify(notices.length ? `บันทึกการลาแล้ว · แจ้ง PM ${new Set(notices.map((n) => n.to)).size} คนให้ตัดสินใจ ${notices.length} งาน` : 'บันทึกการลาแล้ว')
  emit('close')
}
const ACTIONS = Object.entries(IMPACT_ACTIONS).filter(([k]) => k !== 'pending') as [ImpactAction, string][]
</script>

<template>
  <Dialog :open="open" title="แจ้งลา" wide @close="emit('close')">
    <p class="small muted">ใช้แจ้งทีมและ PM ว่าคุณไม่อยู่วันไหน และงานใดบน Timeline ได้รับผลกระทบ — ยังต้องยื่นลาในระบบ HR ตามปกติ</p>
    <div class="grid">
      <div class="field"><label for="lf">วันที่เริ่ม</label><input id="lf" v-model="f.from" type="date" class="input" /></div>
      <div class="field"><label for="lt">วันที่สิ้นสุด</label><input id="lt" v-model="f.to" type="date" class="input" :min="f.from" /></div>
      <div class="field"><label for="lp">ช่วงเวลา</label>
        <select id="lp" v-model="f.part" class="input" :disabled="f.from !== f.to"><option value="full">เต็มวัน</option><option value="am">ครึ่งวันเช้า</option><option value="pm">ครึ่งวันบ่าย</option></select></div>
      <div class="field"><label for="ly">ประเภท</label><select id="ly" v-model="f.type" class="input"><option v-for="(l, k) in LEAVE_TYPES" :key="k" :value="k">{{ l }}</option></select></div>
    </div>
    <div class="field"><label for="ln">หมายเหตุ (ไม่บังคับ)</label><input id="ln" v-model="f.note" class="input" placeholder="เช่น ติดต่อได้ทางโทรศัพท์ช่วงเช้า" /></div>
    <p class="sum">รวม <b>{{ days }}</b> วันทำการ <span class="muted">(ไม่นับเสาร์–อาทิตย์และวันหยุดราชการ)</span></p>
    <p v-if="overlapping.length" class="err">มีการแจ้งลาช่วงนี้อยู่แล้ว ({{ range(overlapping[0].from, overlapping[0].to) }}) — ยกเลิกรายการเดิมก่อน</p>

    <section class="imp">
      <h3>งานที่ได้รับผลกระทบ <span class="muted">{{ impacts.list.length }}</span></h3>
      <p v-if="!impacts.list.length" class="small muted">ไม่มีงานที่ค้างอยู่ในช่วงวันลา</p>
      <ul>
        <li v-for="i in impacts.list" :key="i.taskId" :class="{ warn: i.due >= f.from && i.due <= f.to }">
          <div class="t"><b>{{ i.key }}</b> {{ i.title }}<p class="small muted">{{ proj(i.projectId)?.name }} · {{ i.start ? thDate(i.start) + ' – ' : '' }}ครบกำหนด {{ thDate(i.due) }}<template v-if="i.due >= f.from && i.due <= f.to"> · <span class="bad">ครบกำหนดระหว่างลา</span></template></p></div>
          <div class="a">
            <select v-model="i.action" class="input mini" :aria-label="`จัดการ ${i.key}`">
              <option v-if="i.action === 'pending'" value="pending" disabled>เลือกวิธีจัดการ…</option>
              <option v-for="[k, l] in ACTIONS" :key="k" :value="k">{{ l }}</option>
            </select>
            <input v-if="i.action === 'move'" v-model="i.newDue" type="date" class="input mini" :min="f.to" aria-label="วันส่งใหม่ที่ขอ" />
            <span v-if="i.action === 'reassign'" class="small muted">แนะนำ: {{ standIns(i.projectId).slice(0, 2).map((s) => `${person(s.userId)?.name} (${s.open} งาน)`).join(', ') || 'ไม่มีคนบทบาทเดียวกันที่ว่าง' }}</span>
          </div>
        </li>
      </ul>
      <p v-if="pending" class="small bad">เลือกวิธีจัดการงานที่ครบกำหนดระหว่างลาให้ครบก่อน ({{ pending }} งาน)</p>
    </section>
    <template #foot>
      <button class="btn" @click="emit('close')">ยกเลิก</button>
      <button class="btn primary" :disabled="!valid" @click="save">บันทึกการลา</button>
    </template>
  </Dialog>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.sum { font-size: 14px; }
.err, .bad { color: var(--lose); }
.err { font-size: 14px; background: var(--lose-soft); padding: 8px 10px; border-radius: 8px; }
.imp h3 { font-size: 15px; margin-bottom: 8px; display: flex; gap: 8px; }
.imp ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; max-height: 300px; overflow-y: auto; }
.imp li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; font-size: 14px; }
.imp li.warn { border-color: var(--warn); background: var(--warn-soft); }
.a { display: grid; gap: 6px; justify-items: end; max-width: 260px; }
.input.mini { min-height: 32px; padding: 2px 8px; font-size: 14px; width: auto; }
@media (max-width: 640px) { .grid { grid-template-columns: 1fr 1fr; } .imp li { grid-template-columns: 1fr; } .a { justify-items: start; } }
</style>
