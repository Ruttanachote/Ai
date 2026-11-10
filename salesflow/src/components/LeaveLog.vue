<script setup lang="ts">
// Leave log: who is away, what it touches, and what was decided. The owner can cancel; the PM of
// an affected project approves a new due date or hands the task to a stand-in of the same role.
import { computed, ref } from 'vue'
import Avatar from './Avatar.vue'
import Dialog from './Dialog.vue'
import { person, thDate, TODAY_ISO } from '../data/mock'
import { IMPACT_ACTIONS, LEAVE_TYPES, type Leave, type LeaveImpact } from '../data/model'
import { leaveLength, suggestStandIn, unresolved } from '../domain/leave'
import { logChange } from '../domain/workflow'
import { record } from '../domain/work'
import { leaves, notify, projects, pushNotices, session } from '../store'

const props = defineProps<{ people?: string[]; who?: string; showPast?: boolean }>()
const list = computed(() => leaves
  .filter((l) => (props.who ? l.who === props.who : !props.people || props.people.includes(l.who)))
  .filter((l) => props.showPast || l.to >= TODAY_ISO || l.status === 'cancelled')
  .sort((a, b) => a.from.localeCompare(b.from)))
const proj = (id: string) => projects.find((p) => p.id === id)
const range = (l: Leave) => (l.from === l.to ? thDate(l.from) : `${thDate(l.from)} – ${thDate(l.to)}`) + (l.part === 'am' ? ' (เช้า)' : l.part === 'pm' ? ' (บ่าย)' : '')
const canDecide = (i: LeaveImpact) => ['admin', 'pmo'].includes(session.role) || proj(i.projectId)?.pm === session.userId
const open = ref<string | null>(null)

function approveMove(l: Leave, i: LeaveImpact) {
  const p = proj(i.projectId); const t = p?.tasks?.find((x) => x.id === i.taskId)
  if (!p || !t || !i.newDue) return
  logChange(t, session.userId, 'กำหนดเสร็จ', thDate(t.due), thDate(i.newDue), TODAY_ISO)
  t.due = i.newDue
  record(p, session.userId, t, `เลื่อนวันส่งเพราะ ${person(l.who)?.name} ลา`, TODAY_ISO)
  i.resolved = true
  l.log.push({ at: 'เมื่อสักครู่', who: session.userId, text: `${i.key}: อนุมัติเลื่อนเป็น ${thDate(i.newDue)}` })
  pushNotices([{ to: l.who, projectId: p.id, text: `PM อนุมัติเลื่อน ${i.key} เป็น ${thDate(i.newDue)}` }])
  notify(`เลื่อน ${i.key} เป็น ${thDate(i.newDue)} แล้ว`)
}
const handing = ref<{ l: Leave; i: LeaveImpact; to: string } | null>(null)
function startHand(l: Leave, i: LeaveImpact) {
  const p = proj(i.projectId)
  handing.value = { l, i, to: p ? suggestStandIn(p, l.who, l.from, l.to, leaves)[0]?.userId ?? '' : '' }
}
function hand() {
  const h = handing.value; if (!h || !h.to) return
  const p = proj(h.i.projectId); const t = p?.tasks?.find((x) => x.id === h.i.taskId)
  if (!p || !t) return
  logChange(t, session.userId, 'ผู้รับผิดชอบ', person(t.assignee)?.name, person(h.to)?.name, TODAY_ISO)
  t.assignee = h.to
  record(p, session.userId, t, `ส่งต่อให้ ${person(h.to)?.name} (${person(h.l.who)?.name} ลา)`, TODAY_ISO)
  h.i.resolved = true; h.i.reassignTo = h.to
  h.l.log.push({ at: 'เมื่อสักครู่', who: session.userId, text: `${h.i.key}: ส่งต่อให้ ${person(h.to)?.name}` })
  pushNotices([{ to: h.to, projectId: p.id, text: `คุณได้รับงาน ${h.i.key} ${h.i.title} แทน ${person(h.l.who)?.name} ที่ลา` }, { to: h.l.who, projectId: p.id, text: `${h.i.key} ส่งต่อให้ ${person(h.to)?.name} แล้ว` }])
  notify(`ส่งต่อ ${h.i.key} ให้ ${person(h.to)?.name} แล้ว`)
  handing.value = null
}
const cancelling = ref<Leave | null>(null)
function cancel() {
  const l = cancelling.value; if (!l) return
  l.status = 'cancelled'
  l.log.push({ at: 'เมื่อสักครู่', who: session.userId, text: 'ยกเลิกการลา' })
  notify('ยกเลิกการลาแล้ว')
  cancelling.value = null
}
</script>

<template>
  <div class="ll">
    <p v-if="!list.length" class="muted small empty">ยังไม่มีการแจ้งลา</p>
    <article v-for="l in list" :key="l.id" class="lv" :class="{ off: l.status === 'cancelled' }">
      <header>
        <Avatar :id="l.who" :size="30" />
        <div class="who"><strong>{{ person(l.who)?.name }}</strong><span class="small muted">{{ LEAVE_TYPES[l.type] }} · {{ leaveLength(l) }} วันทำการ<template v-if="l.note"> · {{ l.note }}</template></span></div>
        <span class="rng">{{ range(l) }}</span>
        <span v-if="l.status === 'cancelled'" class="chip">ยกเลิกแล้ว</span>
        <span v-else-if="unresolved(l).length" class="chip warn">รอ PM {{ unresolved(l).length }} งาน</span>
        <span v-else-if="l.impacts.length" class="chip win">จัดการครบ</span>
        <span v-else class="chip">ไม่กระทบงาน</span>
        <button class="btn sm ghost" :aria-expanded="open === l.id" @click="open = open === l.id ? null : l.id">{{ open === l.id ? 'ซ่อน' : 'รายละเอียด' }}</button>
      </header>
      <div v-if="open === l.id" class="body">
        <ul v-if="l.impacts.length" class="imp">
          <li v-for="i in l.impacts" :key="i.taskId">
            <div><b>{{ i.key }}</b> {{ i.title }}<p class="small muted">{{ proj(i.projectId)?.name }} · ครบกำหนด {{ thDate(i.due) }}</p></div>
            <span class="chip" :class="i.resolved ? 'win' : i.action === 'pending' ? 'lose' : 'warn'">{{ IMPACT_ACTIONS[i.action] }}{{ i.action === 'move' && i.newDue ? ' → ' + thDate(i.newDue) : '' }}{{ i.reassignTo ? ' → ' + person(i.reassignTo)?.name : '' }}</span>
            <span class="acts">
              <template v-if="!i.resolved && l.status === 'active' && canDecide(i)">
                <button v-if="i.action === 'move'" class="btn sm primary" @click="approveMove(l, i)">อนุมัติเลื่อน</button>
                <button v-if="i.action === 'move' || i.action === 'reassign' || i.action === 'pending'" class="btn sm" @click="startHand(l, i)">ส่งต่องาน</button>
              </template>
            </span>
          </li>
        </ul>
        <ol class="log">
          <li v-for="(g, k) in l.log" :key="k"><span class="small muted">{{ g.at }}</span> {{ person(g.who)?.name }} — {{ g.text }}</li>
        </ol>
        <button v-if="l.status === 'active' && (l.who === session.userId || session.role === 'admin') && l.from >= TODAY_ISO" class="btn sm ghost danger" @click="cancelling = l">ยกเลิกการลา</button>
      </div>
    </article>

    <Dialog :open="!!handing" :title="`ส่งต่อ ${handing?.i.key ?? ''}`" @close="handing = null">
      <p class="small muted">แนะนำคนบทบาทเดียวกันในโครงการที่ไม่ลาช่วงนี้ เรียงจากงานค้างน้อยไปมาก</p>
      <div class="field"><label for="st">ผู้รับงานแทน</label>
        <select id="st" v-model="handing!.to" class="input">
          <option value="" disabled>เลือกคน…</option>
          <option v-for="s in (handing && proj(handing.i.projectId) ? suggestStandIn(proj(handing.i.projectId)!, handing.l.who, handing.l.from, handing.l.to, leaves) : [])" :key="s.userId" :value="s.userId">{{ person(s.userId)?.name }} · งานค้าง {{ s.open }}</option>
        </select></div>
      <template #foot><button class="btn" @click="handing = null">ยกเลิก</button><button class="btn primary" :disabled="!handing?.to" @click="hand">ส่งต่องาน</button></template>
    </Dialog>
    <Dialog :open="!!cancelling" title="ยกเลิกการลา" @close="cancelling = null">
      <p>ยกเลิกการลา {{ cancelling ? range(cancelling) : '' }} — การตัดสินใจเรื่องงานที่ทำไปแล้วจะไม่ถูกย้อนกลับ</p>
      <template #foot><button class="btn" @click="cancelling = null">ไม่ยกเลิก</button><button class="btn primary" @click="cancel">ยกเลิกการลา</button></template>
    </Dialog>
  </div>
</template>

<style scoped>
.ll { display: grid; gap: 8px; }
.empty { padding: 8px 0; }
.lv { border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
.lv.off { opacity: 0.6; }
header { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto auto; gap: 10px; align-items: center; padding: 10px 12px; }
.who { display: grid; min-width: 0; }
.who span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rng { font-size: 14px; font-weight: 500; white-space: nowrap; }
.body { border-top: 1px solid var(--line); padding: 10px 12px; display: grid; gap: 10px; }
.imp { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.imp li { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 10px; align-items: center; font-size: 14px; }
.acts { display: flex; gap: 6px; }
.log { margin: 0; padding-left: 18px; display: grid; gap: 2px; font-size: 13px; }
@media (max-width: 640px) { header { grid-template-columns: auto 1fr auto; } .rng { grid-column: 2; } .imp li { grid-template-columns: 1fr; } }
</style>
