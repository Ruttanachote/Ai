<script setup lang="ts">
// Contract installments (งวดงาน): deliverables per installment → PM Final Check → send to customer
// → customer acceptance → payment. When every installment is accepted the PM hands over to MA.
import { computed, reactive, ref } from 'vue'
import Avatar from '../Avatar.vue'
import Dialog from '../Dialog.vue'
import { baht, person, thDate, TODAY_ISO } from '../../data/mock'
import type { Deliverable, Milestone, Project } from '../../data/model'
import { typeOf } from '../../domain/work'
import { notify, outbox, pushNotices, session } from '../../store'
import { canManage } from './actions'

const props = defineProps<{ p: Project }>()
const manager = computed(() => canManage(props.p))
const ms = computed(() => props.p.milestones ?? [])
const total = computed(() => props.p.revenue || ms.value.reduce((s, m) => s + (m.payment ?? 0), 0))
const pct = (m: Milestone) => m.pct ?? (total.value ? Math.round(((m.payment ?? 0) / total.value) * 100) : 0)
const items = (m: Milestone) => (props.p.tasks ?? []).filter((t) => t.milestone === m.name && typeOf(t) !== 'epic')
const stage = (m: Milestone) => m.paid ? ['รับชำระแล้ว', 'win'] : m.acceptance ? ['ลูกค้าตรวจรับแล้ว', 'win'] : m.sentAt ? ['ส่งลูกค้าแล้ว รอตรวจรับ', 'presale'] : m.finalCheck ? ['ผ่าน Final Check', 'post'] : ['กำลังทำ', ''] as const
const DSTATUS: Record<Deliverable['status'], string> = { draft: 'ร่าง', review: 'กำลังตรวจ', ready: 'พร้อมส่ง' }

const add = reactive<Record<string, string>>({})
function addDeliverable(m: Milestone) {
  const name = (add[m.name] ?? '').trim()
  if (!name) return
  m.deliverables = [...(m.deliverables ?? []), { name, status: 'draft', owner: session.userId }]
  add[m.name] = ''
}
const allReady = (m: Milestone) => !!m.deliverables?.length && m.deliverables.every((d) => d.status === 'ready')
function finalCheck(m: Milestone) {
  m.finalCheck = { by: session.userId, at: TODAY_ISO }
  notify(`Final Check ${m.name} ผ่าน — พร้อมส่งลูกค้า`)
}
function send(m: Milestone) {
  m.sentAt = TODAY_ISO
  const focal = props.p.stakeholders?.find((s) => s.side === 'customer' && s.focal)
  outbox.unshift({ id: 'm' + Date.now(), at: TODAY_ISO, from: person(props.p.pm)?.name ?? 'PM', to: focal?.email ?? props.p.customer, subject: `ส่งมอบงาน ${m.name} — ${props.p.name}`, kind: 'email' })
  notify(`ส่งเอกสารส่งมอบ ${m.name} ถึง ${focal?.name ?? props.p.customer} แล้ว`)
}
const acc = ref<Milestone | null>(null)
const accDoc = ref('')
function accept() {
  const m = acc.value
  if (!m || !accDoc.value) return
  m.acceptance = { doc: accDoc.value, at: TODAY_ISO, by: session.userId }
  m.state = 'delivered'; m.deliveredAt = TODAY_ISO; m.progress = 100
  pushNotices([{ to: 'op', projectId: props.p.id, text: `${props.p.name}: ลูกค้าตรวจรับ ${m.name} แล้ว — วางบิลงวด ${baht(m.payment ?? 0)}` }])
  notify(`บันทึกตรวจรับ ${m.name} แล้ว — แจ้ง OPN วางบิล`)
  acc.value = null; accDoc.value = ''
}
function onFile(e: Event) { accDoc.value = (e.target as HTMLInputElement).files?.[0]?.name ?? '' }

// P-11: hand over to MA when every installment is accepted.
const allAccepted = computed(() => ms.value.length > 0 && ms.value.every((m) => m.acceptance))
const ho = reactive({ open: false, contact: '', note: '' })
function handover() {
  props.p.maHandover = { at: TODAY_ISO, by: session.userId, contact: ho.contact.trim(), docs: ms.value.flatMap((m) => (m.deliverables ?? []).map((d) => d.name)), note: ho.note.trim() || undefined }
  props.p.deliveredAt = TODAY_ISO
  pushNotices([{ to: 'wm', projectId: props.p.id, text: `${props.p.name}: PM ส่งมอบเข้าประกัน — รอทีม MA รับมอบ` }])
  ho.open = false
  notify('ส่งมอบเข้าประกันแล้ว — รอทีม MA ยืนยันรับมอบ')
}
</script>

<template>
  <div class="ms">
    <section v-for="m in ms" :key="m.name" class="panel">
      <header>
        <div><h3>{{ m.name }}</h3><p class="small muted">{{ thDate(m.start) }} – {{ thDate(m.end) }} · {{ pct(m) }}% ของสัญญา · {{ baht(m.payment ?? 0) }} · งาน {{ items(m).filter((t) => t.status === 'done').length }}/{{ items(m).length }}</p></div>
        <span class="chip" :class="stage(m)[1]">{{ stage(m)[0] }}</span>
      </header>
      <div class="bar"><i :style="{ width: m.progress + '%' }" /></div>
      <h4>เอกสาร / สิ่งส่งมอบ</h4>
      <ul class="dl">
        <li v-for="(d, i) in m.deliverables ?? []" :key="i">
          <span>📄 {{ d.name }}</span>
          <Avatar :id="d.owner" :size="20" />
          <select v-model="d.status" class="input mini" :disabled="!manager || !!m.finalCheck" :aria-label="`สถานะ ${d.name}`"><option v-for="(l, k) in DSTATUS" :key="k" :value="k">{{ l }}</option></select>
        </li>
        <li v-if="!(m.deliverables ?? []).length" class="muted small">ยังไม่ได้ระบุสิ่งส่งมอบของงวดนี้</li>
      </ul>
      <form v-if="manager && !m.finalCheck" class="add" @submit.prevent="addDeliverable(m)"><input v-model="add[m.name]" class="input mini" placeholder="เพิ่มสิ่งส่งมอบ เช่น คู่มือผู้ใช้, รายงานผลทดสอบ UAT" /><button class="btn sm">เพิ่ม</button></form>
      <footer>
        <span class="small muted">
          <template v-if="m.finalCheck">Final Check โดย {{ person(m.finalCheck.by)?.name }} {{ thDate(m.finalCheck.at) }}</template>
          <template v-if="m.sentAt"> · ส่งลูกค้า {{ thDate(m.sentAt) }}</template>
          <template v-if="m.acceptance"> · ตรวจรับ {{ thDate(m.acceptance.at) }} ({{ m.acceptance.doc }})</template>
        </span>
        <template v-if="manager">
          <button v-if="!m.finalCheck" class="btn sm" :disabled="!allReady(m)" :title="allReady(m) ? '' : 'สิ่งส่งมอบทุกชิ้นต้องเป็น “พร้อมส่ง”'" @click="finalCheck(m)">Final Check</button>
          <button v-else-if="!m.sentAt" class="btn sm primary" @click="send(m)">ส่งลูกค้า</button>
          <button v-else-if="!m.acceptance" class="btn sm primary" @click="acc = m">บันทึกตรวจรับ</button>
        </template>
      </footer>
    </section>
    <p v-if="!ms.length" class="muted">โครงการนี้ไม่มีงวดงานในสัญญา</p>

    <section v-if="ms.length" class="panel ho">
      <div><h3>ส่งมอบเข้าประกัน (ทีม MA)</h3>
        <p class="small muted" v-if="p.maHandover">ส่งเมื่อ {{ thDate(p.maHandover.at) }} · {{ p.maHandover.acceptedAt ? 'ทีม MA รับมอบแล้ว ' + thDate(p.maHandover.acceptedAt) : 'รอทีม MA ยืนยันรับมอบ' }}</p>
        <p class="small muted" v-else>ทำได้เมื่อลูกค้าตรวจรับครบทุกงวด ({{ ms.filter((m) => m.acceptance).length }}/{{ ms.length }})</p></div>
      <button v-if="manager && !p.maHandover" class="btn primary" :disabled="!allAccepted" @click="ho.open = true">ส่งมอบเข้าประกัน</button>
    </section>

    <Dialog :open="!!acc" :title="`บันทึกตรวจรับ ${acc?.name ?? ''}`" @close="acc = null">
      <p class="small muted">แนบหนังสือตรวจรับงาน / ใบตรวจรับพัสดุจากลูกค้า ระบบจะแจ้ง OPN ให้วางบิลงวดนี้</p>
      <label class="btn sm">แนบหนังสือตรวจรับ<input type="file" hidden @change="onFile" /></label>
      <p v-if="accDoc" class="small">📎 {{ accDoc }}</p>
      <template #foot><button class="btn" @click="acc = null">ยกเลิก</button><button class="btn primary" :disabled="!accDoc" @click="accept">บันทึกตรวจรับ</button></template>
    </Dialog>
    <Dialog :open="ho.open" title="ส่งมอบเข้าประกันให้ทีม MA" @close="ho.open = false">
      <p class="small muted">ส่งเอกสารส่งมอบทุกงวด ผู้ติดต่อฝั่งลูกค้า และระบบที่ต้องดูแล ทีม MA ยืนยันรับมอบแล้วโครงการจะเข้าสู่ระยะประกัน</p>
      <div class="field"><label for="hc">ผู้ติดต่อฝั่งลูกค้าสำหรับงานประกัน</label><input id="hc" v-model="ho.contact" class="input" :placeholder="p.stakeholders?.find((s) => s.side === 'customer' && s.focal)?.name ?? 'ชื่อ · อีเมล · โทร'" /></div>
      <div class="field"><label for="hn">หมายเหตุถึงทีม MA</label><textarea id="hn" v-model="ho.note" class="input" rows="3" placeholder="เช่น Server อยู่ที่ไหน รหัสผ่านส่งแยก ข้อจำกัดที่ทราบ" /></div>
      <template #foot><button class="btn" @click="ho.open = false">ยกเลิก</button><button class="btn primary" :disabled="!ho.contact.trim()" @click="handover">ส่งมอบเข้าประกัน</button></template>
    </Dialog>
  </div>
</template>

<style scoped>
.ms { display: grid; gap: 14px; }
.ms .panel { display: grid; gap: 10px; }
header, footer { display: flex; justify-content: space-between; gap: 10px; align-items: center; flex-wrap: wrap; }
.bar { height: 6px; border-radius: 99px; background: var(--idle-soft); overflow: hidden; }
.bar i { display: block; height: 100%; background: var(--win); }
h4 { font-size: 13.5px; color: var(--ink-2); }
.dl { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.dl li { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 10px; align-items: center; font-size: 14px; }
.input.mini { min-height: 30px; padding: 2px 8px; font-size: 13px; width: auto; }
.add { display: flex; gap: 6px; }
.add .input { flex: 1; }
.ho { grid-template-columns: 1fr auto; align-items: center; }
</style>
