<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import KpiStrip from '../components/KpiStrip.vue'
import LeaveDialog from '../components/LeaveDialog.vue'
import LeaveLog from '../components/LeaveLog.vue'
import PmRoundActions from '../components/PmRoundActions.vue'
import { dueRounds, STATE_LABEL } from '../domain/pm'
import WorkTypeIcon from '../components/work/WorkTypeIcon.vue'
import PriorityIcon from '../components/work/PriorityIcon.vue'
import WorkDrawer from '../components/work/WorkDrawer.vue'
import { notifications, projects, session } from '../store'
import { thDate, TODAY_ISO } from '../data/mock'
import { WORK_STATUS, type Project, type Task } from '../data/model'
import { addDays, byPriority, keyOf, typeOf } from '../domain/work'
import { allowedTargets, statusOf } from '../domain/workflow'
import { isAdmin, move } from '../components/work/actions'

// One list of everything assigned to me across projects — what a developer opens every morning.
const mine = computed(() => projects.flatMap((p) => (p.tasks ?? [])
  .filter((t) => typeOf(t) !== 'epic' && (t.assignee === session.userId || (t.coAssignees ?? []).includes(session.userId)))
  .map((t) => ({ p, t }))))
const open = computed(() => mine.value.filter((x) => x.t.status !== 'done'))
const weekEnd = addDays(TODAY_ISO, 7)
const BUCKETS = [
  { k: 'late', l: 'เลยกำหนด', f: (t: Task) => !!t.due && t.due < TODAY_ISO },
  { k: 'week', l: 'ครบกำหนดใน 7 วัน', f: (t: Task) => !!t.due && t.due >= TODAY_ISO && t.due <= weekEnd },
  { k: 'later', l: 'ถัดไป', f: (t: Task) => !!t.due && t.due > weekEnd },
  { k: 'none', l: 'ยังไม่กำหนดวัน', f: (t: Task) => !t.due },
]
const buckets = computed(() => BUCKETS.map((b) => ({ ...b, rows: open.value.filter((x) => b.f(x.t)).sort((a, c) => byPriority(a.t, c.t)) })).filter((b) => b.rows.length))
const doneRecent = computed(() => mine.value.filter((x) => x.t.status === 'done' && (x.t.updated ?? '') >= addDays(TODAY_ISO, -14)))
const weekLogged = computed(() => projects.flatMap((p) => (p.tasks ?? []).flatMap((t) => t.worklogs ?? [])).filter((w) => w.who === session.userId && w.day >= addDays(TODAY_ISO, -6)).reduce((s, w) => s + w.hours, 0))
const otPending = computed(() => projects.flatMap((p) => p.ot ?? []).filter((o) => o.who === session.userId && o.status === 'pending'))
const kpis = computed(() => [
  { label: 'งานที่ต้องทำ', value: String(open.value.length), note: `${new Set(open.value.map((x) => x.p.id)).size} โครงการ` },
  { label: 'เลยกำหนด', value: String(open.value.filter((x) => BUCKETS[0].f(x.t)).length), note: 'แจ้ง PM หากติดปัญหา', tone: open.value.some((x) => BUCKETS[0].f(x.t)) ? ('bad' as const) : ('' as const) },
  { label: 'บันทึกเวลา 7 วัน', value: `${weekLogged.value} ชม.`, note: 'จากแท็บเวลาในแต่ละงาน' },
  { label: 'OT รออนุมัติ', value: String(otPending.value.length), note: otPending.value.length ? `${otPending.value.reduce((s, o) => s + o.hours, 0)} ชม. รอ PM` : 'ไม่มี', tone: otPending.value.length ? ('warn' as const) : ('' as const) },
])
const leaveOpen = ref(false)
// PM reports this person prepares (named preparer, or member of the project's workspace).
const pmToPrepare = computed(() => dueRounds(projects, TODAY_ISO).filter((x) => x.r.status !== 'ready' &&
  (x.p.pmPlan?.preparer === session.userId || (!x.p.pmPlan?.preparer && x.p.workspace?.members?.some((m) => m.userId === session.userId)))))
const notes = computed(() => notifications.filter((n) => n.to === session.userId).slice(0, 6))

const openItem = ref<{ p: Project; t: Task } | null>(null)
function setStatus(p: Project, t: Task, e: Event) {
  const el = e.target as HTMLSelectElement
  if (!move(p, t, el.value)) el.value = statusOf(p, t).id
}
const team = (p: Project) => (p.workspace?.members ?? []).filter((m) => m.role !== 'viewer').map((m) => m.userId)
</script>

<template>
  <div class="page">
    <PageHeader module="General" title="My Tasks" scope="ทุกโครงการที่คุณได้รับมอบหมาย" subtitle="เรียงตามกำหนดเสร็จและความสำคัญ — เปลี่ยนสถานะได้ที่นี่ หรือเปิดงานเพื่อบันทึกเวลา">
      <button class="btn" @click="leaveOpen = true">แจ้งลา</button>
    </PageHeader>
    <KpiStrip :items="kpis" />

    <div class="cols">
      <div class="lists">
        <section v-for="b in buckets" :key="b.k" class="panel flush">
          <h3 :class="b.k">{{ b.l }} <span class="muted">{{ b.rows.length }}</span></h3>
          <ul>
            <li v-for="{ p, t } in b.rows" :key="t.id">
              <WorkTypeIcon :type="typeOf(t)" :size="15" />
              <button class="ttl" @click="openItem = { p, t }"><span class="key">{{ keyOf(t) }}</span> {{ t.title }}<small>{{ p.name }}</small></button>
              <PriorityIcon :p="t.priority" />
              <select class="st" :class="WORK_STATUS[t.status].tone" :value="statusOf(p, t).id" :aria-label="`สถานะ ${keyOf(t)}`" @change="setStatus(p, t, $event)">
                <option v-for="s in allowedTargets(p, t, session.userId, isAdmin())" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
              <span class="due small" :class="{ bad: b.k === 'late' }">{{ t.due ? thDate(t.due) : '—' }}</span>
              <router-link :to="`/work/${p.id}`" class="btn sm ghost">บอร์ด</router-link>
            </li>
          </ul>
        </section>
        <section v-if="pmToPrepare.length" class="panel flush">
          <h3>รายงาน Preventive Maintenance ที่ต้องเตรียม <span class="muted">{{ pmToPrepare.length }}</span></h3>
          <ul><li v-for="x in pmToPrepare" :key="x.r.id" class="pmr">
            <span class="chip" :class="STATE_LABEL[x.state].tone">{{ STATE_LABEL[x.state].label }}</span>
            <span class="ttl">รอบที่ {{ x.r.no }} · {{ x.p.name }}<small>ส่งให้ทีม MA ก่อน {{ thDate(x.r.due) }} · {{ x.p.pmPlan?.template }}</small></span>
            <PmRoundActions :p="x.p" :r="x.r" />
          </li></ul>
        </section>
        <section v-if="!open.length" class="panel empty">
          <h3>ไม่มีงานค้าง</h3>
          <p class="muted">งานที่ PM มอบหมายจะขึ้นที่นี่ทันที พร้อมแจ้งเตือนทาง Teams</p>
          <router-link to="/work" class="btn sm">Open Project Workspace</router-link>
        </section>
        <section v-if="doneRecent.length" class="panel flush">
          <h3>เสร็จใน 14 วัน <span class="muted">{{ doneRecent.length }}</span></h3>
          <ul><li v-for="{ p, t } in doneRecent" :key="t.id" class="dn"><WorkTypeIcon :type="typeOf(t)" :size="15" /><button class="ttl" @click="openItem = { p, t }"><span class="key">{{ keyOf(t) }}</span> {{ t.title }}<small>{{ p.name }}</small></button><span class="small muted">{{ thDate(t.updated) }}</span></li></ul>
        </section>
      </div>

      <aside class="panel">
        <h3>การลาของฉัน</h3>
        <LeaveLog :who="session.userId" class="mt-s" />
        <h3 class="mt">แจ้งเตือนล่าสุด</h3>
        <ul class="nt">
          <li v-for="n in notes" :key="n.id" :class="{ new: !n.read }"><router-link :to="n.link" @click="n.read = true">{{ n.text }}</router-link><small>{{ n.at }}</small></li>
          <li v-if="!notes.length" class="muted small">ไม่มีการแจ้งเตือน</li>
        </ul>
        <h3 class="mt">OT ของฉัน</h3>
        <ul class="nt">
          <li v-for="o in projects.flatMap((p) => (p.ot ?? []).filter((x) => x.who === session.userId).map((x) => ({ ...x, pn: p.name })))" :key="o.id">
            <span>{{ o.hours }} ชม. · {{ o.reason }}</span><small>{{ o.pn }} · <b :class="o.status">{{ o.status === 'pending' ? 'รอ PM อนุมัติ' : o.status === 'approved' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ' }}</b></small>
          </li>
        </ul>
      </aside>
    </div>

    <LeaveDialog :open="leaveOpen" @close="leaveOpen = false" />
    <WorkDrawer v-if="openItem" :p="openItem.p" :item="openItem.t" :team="team(openItem.p)" @close="openItem = null" @open="openItem = openItem && { p: openItem.p, t: $event }" />
  </div>
</template>

<style scoped>
.cols { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 16px; align-items: start; }
.lists { display: grid; gap: 14px; }
.flush { padding: 0; overflow: hidden; }
.flush h3 { padding: 12px 16px; border-bottom: 1px solid var(--line); background: var(--sunken); font-size: 14px; display: flex; gap: 8px; }
h3.late { color: var(--lose); }
ul { list-style: none; margin: 0; padding: 0; }
.flush li { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto 90px auto; gap: 10px; align-items: center; padding: 9px 16px; border-bottom: 1px solid var(--line); }
.flush li:last-child { border-bottom: 0; }
.flush li.dn { grid-template-columns: auto minmax(0, 1fr) auto; }
.ttl { border: 0; background: none; padding: 0; text-align: left; font: 14px var(--font); color: var(--ink); cursor: pointer; display: grid; min-width: 0; }
.ttl small { color: var(--muted); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ttl:hover { color: var(--action); }
.key { color: var(--action); font-size: 13px; margin-right: 4px; }
.st { border: 0; border-radius: 4px; font: 600 12px var(--font); padding: 4px 6px; cursor: pointer; background: var(--idle-soft); color: var(--ink-2); }
.st.presale { background: var(--presale-soft); color: var(--presale); }
.st.warn { background: var(--warn-soft); color: var(--warn); }
.st.win { background: var(--win-soft); color: var(--win); }
.due { color: var(--muted); text-align: right; }
.bad { color: var(--lose); }
.empty { display: grid; gap: 8px; justify-items: start; }
.nt { display: grid; gap: 10px; margin-top: 8px; }
.nt li { display: grid; gap: 2px; font-size: 13.5px; padding-left: 12px; position: relative; }
.nt li.new::before { content: ''; position: absolute; left: 0; top: 7px; width: 6px; height: 6px; border-radius: 50%; background: var(--brand); }
.nt small { color: var(--muted); font-size: 12px; }
.nt b.pending { color: var(--warn); }
.nt b.approved { color: var(--win); }
.mt { margin-top: 18px; }
.mt-s { margin-top: 8px; }
@media (max-width: 1000px) { .cols { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .flush li { grid-template-columns: auto minmax(0, 1fr) auto; } .flush li > :nth-child(3), .flush li > :nth-child(5), .flush li > :nth-child(6) { display: none; } }
.flush li.pmr { grid-template-columns: auto minmax(0, 1fr) auto; }
</style>
