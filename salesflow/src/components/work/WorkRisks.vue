<script setup lang="ts">
// Risk register: likelihood × impact = level, owner, response plan, status. A new high risk
// notifies the group head.
import { computed, reactive } from 'vue'
import Avatar from '../Avatar.vue'
import Dialog from '../Dialog.vue'
import { PEOPLE, groupOf, person, thDate, TODAY_ISO } from '../../data/mock'
import { riskLevel, type Project, type Risk } from '../../data/model'
import { notify, pushNotices } from '../../store'
import { canEdit } from './actions'

const props = defineProps<{ p: Project; team: string[] }>()
const editable = computed(() => canEdit(props.p))
const list = computed(() => [...(props.p.risks ?? [])].sort((a, b) => (a.status === 'closed' ? 1 : 0) - (b.status === 'closed' ? 1 : 0) || b.likelihood * b.impact - a.likelihood * a.impact))
const LV = { 1: 'ต่ำ', 2: 'กลาง', 3: 'สูง' } as const
const ST: Record<Risk['status'], string> = { open: 'เปิด', watch: 'เฝ้าระวัง', closed: 'ปิดแล้ว' }
const tone = (r: Risk) => (riskLevel(r) === 'สูง' ? 'lose' : riskLevel(r) === 'กลาง' ? 'warn' : '')
const f = reactive({ open: false, title: '', likelihood: 2 as 1 | 2 | 3, impact: 2 as 1 | 2 | 3, owner: '', plan: '' })
function save() {
  const r: Risk = { id: 'r' + Date.now().toString(36), title: f.title.trim(), likelihood: f.likelihood, impact: f.impact, owner: f.owner || props.p.pm || '', plan: f.plan.trim(), status: 'open', at: TODAY_ISO }
  props.p.risks = [r, ...(props.p.risks ?? [])]
  if (riskLevel(r) === 'สูง') {
    const head = PEOPLE.find((u) => u.role === 'head' && (u.team === props.p.team || groupOf(u.team ?? '') === groupOf(props.p.team)))?.id
    if (head) pushNotices([{ to: head, projectId: props.p.id, text: `ความเสี่ยงสูงใน ${props.p.name}: ${r.title}` }])
  }
  notify(riskLevel(r) === 'สูง' ? 'บันทึกความเสี่ยงสูงแล้ว — แจ้งหัวหน้ากลุ่ม' : 'บันทึกความเสี่ยงแล้ว')
  Object.assign(f, { open: false, title: '', plan: '', owner: '' })
}
</script>

<template>
  <section class="panel rk">
    <div class="panel-head"><div><h2>Risk Register</h2><p class="small muted">ระดับ = โอกาสเกิด × ผลกระทบ · ความเสี่ยงสูงแจ้งหัวหน้ากลุ่มอัตโนมัติ</p></div>
      <button v-if="editable" class="btn sm primary" @click="f.open = true">+ เพิ่มความเสี่ยง</button></div>
    <div class="scroll-x">
      <table class="table">
        <thead><tr><th>ระดับ</th><th>ความเสี่ยง</th><th>โอกาส</th><th>ผลกระทบ</th><th>เจ้าของ</th><th>แผนรับมือ</th><th>สถานะ</th></tr></thead>
        <tbody>
          <tr v-for="r in list" :key="r.id" :class="{ closed: r.status === 'closed' }">
            <td><span class="chip" :class="tone(r)">{{ riskLevel(r) }}</span></td>
            <td><strong>{{ r.title }}</strong><p class="small muted">บันทึก {{ thDate(r.at) }}</p></td>
            <td><select v-model.number="r.likelihood" class="input mini" :disabled="!editable"><option v-for="(l, k) in LV" :key="k" :value="Number(k)">{{ l }}</option></select></td>
            <td><select v-model.number="r.impact" class="input mini" :disabled="!editable"><option v-for="(l, k) in LV" :key="k" :value="Number(k)">{{ l }}</option></select></td>
            <td><span class="who"><Avatar :id="r.owner" :size="22" />{{ person(r.owner)?.name }}</span></td>
            <td class="small">{{ r.plan }}</td>
            <td><select v-model="r.status" class="input mini" :disabled="!editable"><option v-for="(l, k) in ST" :key="k" :value="k">{{ l }}</option></select></td>
          </tr>
          <tr v-if="!list.length"><td colspan="7" class="muted">ยังไม่มีความเสี่ยงที่บันทึก</td></tr>
        </tbody>
      </table>
    </div>
    <Dialog :open="f.open" title="เพิ่มความเสี่ยง" @close="f.open = false">
      <div class="field"><label for="rt">ความเสี่ยง</label><input id="rt" v-model="f.title" class="input" /></div>
      <div class="two">
        <div class="field"><label for="rl">โอกาสเกิด</label><select id="rl" v-model.number="f.likelihood" class="input"><option v-for="(l, k) in LV" :key="k" :value="Number(k)">{{ l }}</option></select></div>
        <div class="field"><label for="ri">ผลกระทบ</label><select id="ri" v-model.number="f.impact" class="input"><option v-for="(l, k) in LV" :key="k" :value="Number(k)">{{ l }}</option></select></div>
      </div>
      <p class="small">ระดับ: <span class="chip" :class="riskLevel(f) === 'สูง' ? 'lose' : riskLevel(f) === 'กลาง' ? 'warn' : ''">{{ riskLevel(f) }}</span></p>
      <div class="field"><label for="ro">เจ้าของ</label><select id="ro" v-model="f.owner" class="input"><option value="">PM</option><option v-for="id in team" :key="id" :value="id">{{ person(id)?.name }}</option></select></div>
      <div class="field"><label for="rp">แผนรับมือ</label><textarea id="rp" v-model="f.plan" class="input" rows="3" /></div>
      <template #foot><button class="btn" @click="f.open = false">ยกเลิก</button><button class="btn primary" :disabled="!f.title.trim() || !f.plan.trim()" @click="save">บันทึก</button></template>
    </Dialog>
  </section>
</template>

<style scoped>
.rk { display: grid; gap: 10px; }
.input.mini { min-height: 30px; padding: 2px 6px; font-size: 13px; width: auto; }
.who { display: inline-flex; gap: 6px; align-items: center; white-space: nowrap; }
tr.closed td { opacity: 0.55; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
</style>
