<script setup lang="ts">
import { computed, ref } from 'vue'
import Avatar from '../components/Avatar.vue'
import PageHeader from '../components/PageHeader.vue'
import KpiStrip from '../components/KpiStrip.vue'
import { PEOPLE, person } from '../data/mock'
import { projects, session } from '../store'
import { stageOf } from '../data/model'
import { isOpen, probability } from '../domain/metrics'
import LeaveLog from '../components/LeaveLog.vue'
import LeaveDialog from '../components/LeaveDialog.vue'
import { awayOn } from '../domain/leave'
import { isWorkday } from '../domain/calendar'
import { addDays } from '../domain/work'
import { leaves, notify, pushNotices } from '../store'
import { MEMBER_ROLES, type Project, type StaffRequest } from '../data/model'
import Dialog from '../components/Dialog.vue'
import { groupOf } from '../data/mock'
import { thDate, TODAY_ISO } from '../data/mock'

// Planned hours per person per week (capacity 40h), keyed by project id so names, stages and
// soft/hard booking always follow the project record. Production source: plans + timesheets.
const WEEKS = ['3 พ.ย.', '10 พ.ย.', '17 พ.ย.', '24 พ.ย.', '1 ธ.ค.', '8 ธ.ค.', '15 ธ.ค.', '22 ธ.ค.']
const ALLOC: Record<string, { projectId: string; hrs: number[] }[]> = {
  ak: [{ projectId: 'p6', hrs: [24, 28, 30, 26, 20, 20, 16, 12] }, { projectId: 'p8', hrs: [6, 4, 4, 4, 4, 4, 4, 2] }],
  dev1: [{ projectId: 'p6', hrs: [36, 32, 28, 24, 30, 30, 20, 8] }],
  dev2: [{ projectId: 'p6', hrs: [40, 40, 36, 30, 24, 16, 8, 0] }, { projectId: 'p2', hrs: [8, 8, 0, 0, 0, 0, 0, 0] }],
  dev3: [{ projectId: 'p6', hrs: [30, 30, 24, 24, 28, 32, 24, 8] }, { projectId: 'p8', hrs: [10, 6, 4, 4, 4, 4, 4, 4] }],
  ks: [{ projectId: 'p9', hrs: [8, 8, 6, 6, 4, 4, 4, 4] }, { projectId: 'p7', hrs: [4, 12, 20, 24, 24, 24, 24, 16] }],
  dev4: [{ projectId: 'p7', hrs: [0, 8, 32, 40, 40, 40, 36, 24] }],
  dev5: [{ projectId: 'p3', hrs: [24, 24, 16, 8, 0, 0, 0, 0] }, { projectId: 'p7', hrs: [0, 0, 16, 32, 40, 40, 40, 32] }],
}
const project = (id: string) => projects.find((p) => p.id === id)
/** Soft booking until the project has a PM assigned in delivery; presale work is always soft. */
const isSoft = (id: string) => {
  const p = project(id)
  return !p || isOpen(p) || p.stage === 'win' || p.stage === 'handover'
}

const teamsWithPeople = [...new Set(PEOPLE.filter((p) => ALLOC[p.id]).map((p) => p.team!))]
const myTeam = person(session.userId)?.team
const team = ref(teamsWithPeople.find((t) => t === myTeam || t.startsWith((myTeam ?? '') + '-')) ?? teamsWithPeople[0])

const members = computed(() =>
  PEOPLE.filter((p) => p.team === team.value && ALLOC[p.id]).map((p) => {
    const rows = ALLOC[p.id].map((r) => ({ ...r, name: project(r.projectId)?.name ?? r.projectId, stage: project(r.projectId)?.stage, soft: isSoft(r.projectId) }))
    const total = WEEKS.map((_, i) => rows.filter((r) => !r.soft).reduce((s, r) => s + r.hrs[i], 0))
    const soft = WEEKS.map((_, i) => rows.filter((r) => r.soft).reduce((s, r) => s + r.hrs[i], 0))
    return { p, rows, total, soft, avg: Math.round(total.reduce((a, b) => a + b, 0) / WEEKS.length) }
  }),
)
const tone = (h: number) => (h > 40 ? 'over' : h >= 32 ? 'full' : h >= 16 ? 'mid' : h > 0 ? 'low' : 'free')
const open = ref<string | null>(null)

// Team leave calendar: the next 20 working days for everyone in the selected team.
const teamPeople = computed(() => PEOPLE.filter((p) => p.team === team.value).map((p) => p.id))
const calDays = computed(() => {
  const out: string[] = []
  for (let d = TODAY_ISO; out.length < 20; d = addDays(d, 1)) if (isWorkday(d)) out.push(d)
  return out
})
const away = (id: string, d: string) => awayOn(leaves, id, d)
const leaveOpen = ref(false)

// P-03: staff requests from PMs for this team head's group.
const canFill = computed(() => ['head', 'admin', 'pmo'].includes(session.role))
const requests = computed(() => projects.flatMap((p) => (p.staffRequests ?? []).filter((r) => r.status === 'pending' && (session.role !== 'head' || groupOf(p.team) === groupOf(person(session.userId)?.team ?? ''))).map((r) => ({ p, r }))))
const filling = ref<{ p: Project; r: StaffRequest; pick: string[] } | null>(null)
const busy = (id: string, r: StaffRequest) => projects.reduce((s, p) => s + (p.tasks ?? []).filter((t) => t.assignee === id && t.status !== 'done').length, 0) + (leaves.some((l) => l.status === 'active' && l.who === id && l.from <= r.to && l.to >= r.from) ? 100 : 0)
const candidates = computed(() => (filling.value ? PEOPLE.filter((u) => u.role === 'dev' && groupOf(u.team ?? '') === groupOf(filling.value!.p.team)).sort((a, b) => busy(a.id, filling.value!.r) - busy(b.id, filling.value!.r)) : []))
function fill() {
  const f = filling.value
  if (!f || !f.pick.length) return
  f.r.status = 'filled'; f.r.filled = [...f.pick]; f.r.decidedBy = session.userId
  const ws = f.p.workspace
  if (ws) ws.members = [...(ws.members ?? []), ...f.pick.filter((id) => !ws.members?.some((m) => m.userId === id)).map((userId) => ({ userId, role: f.r.role }))]
  pushNotices([{ to: f.r.by, projectId: f.p.id, text: `ได้ ${f.pick.map((x) => person(x)?.name).join(', ')} เป็น ${MEMBER_ROLES[f.r.role]} ใน ${f.p.name}` },
    ...f.pick.map((id) => ({ to: id, projectId: f.p.id, text: `คุณเข้าร่วม ${f.p.name} เป็น ${MEMBER_ROLES[f.r.role]}` }))])
  notify('จัดคนให้โครงการแล้ว — เพิ่มเป็นสมาชิกพื้นที่งานอัตโนมัติ')
  filling.value = null
}
function decline(r: StaffRequest) { r.status = 'declined'; r.decidedBy = session.userId; pushNotices([{ to: r.by, projectId: '', text: 'หัวหน้าทีมไม่อนุมัติคำขอคน — ติดต่อหัวหน้าทีมเพื่อปรับช่วงเวลา' }]) }

// Demand from the pipeline: man-days from the Cost Sheet (manpower ≈ 48% of COGS at ฿6,000/day)
// weighted by the same probability the sales dashboard uses. Capacity planning needs every
// open deal of the team, not only the viewer's own, so this reads all projects.
const DAY_RATE = 6000
const demand = computed(() =>
  projects.filter((p) => isOpen(p) && (p.team === team.value || (p.splits ?? []).some((x) => x.team === team.value)))
    .map((p) => {
      const md = Math.round(((p.cost || p.budget * 0.7) * 0.48) / DAY_RATE)
      return { p, md, prob: Math.round(probability(p) * 100), weighted: Math.round(md * probability(p)) }
    })
    .sort((a, b) => b.weighted - a.weighted),
)
const kpis = computed(() => {
  const all = members.value.flatMap((m) => m.total)
  const util = all.length ? Math.round((all.reduce((a, b) => a + b, 0) / (all.length * 40)) * 100) : 0
  const overWeeks = members.value.reduce((s, m) => s + m.total.filter((h) => h > 40).length, 0)
  const atRisk = members.value.reduce((s, m) => s + m.total.filter((h, i) => h <= 40 && h + m.soft[i] > 40).length, 0)
  return [
    { label: 'สมาชิกทีม ' + team.value, value: String(members.value.length), note: `${WEEKS.length} สัปดาห์ข้างหน้า` },
    { label: 'ใช้กำลังคนเฉลี่ย', value: util + '%', note: 'เฉพาะงานที่จองแน่นอน', tone: util > 90 ? ('warn' as const) : ('' as const) },
    { label: 'สัปดาห์ที่เกิน 40 ชม.', value: String(overWeeks), note: atRisk ? `อีก ${atRisk} สัปดาห์เกินถ้ารวมการจองเบื้องต้น` : 'นับรายคนต่อสัปดาห์', tone: overWeeks ? ('bad' as const) : atRisk ? ('warn' as const) : ('' as const) },
    { label: 'ความต้องการจาก Pipeline', value: demand.value.reduce((s, d) => s + d.weighted, 0) + ' MD', note: 'Man-day ถ่วงน้ำหนักตามโอกาสปิด' },
  ]
})
</script>

<template>
  <div class="page">
    <PageHeader module="Delivery · ส่งมอบโครงการ" title="Resource Workload" :scope="'ทีม ' + team" subtitle="ชั่วโมงที่วางแผนต่อสัปดาห์ เทียบความสามารถ 40 ชม.">
      <div class="seg" role="radiogroup" aria-label="เลือกทีม">
        <button v-for="t in teamsWithPeople" :key="t" role="radio" :aria-checked="team === t" @click="team = t">{{ t }}</button>
      </div>
    </PageHeader>
    <KpiStrip :items="kpis" />

    <section class="panel scroll-x">
      <table class="heat">
        <thead><tr><th>สมาชิก</th><th v-for="w in WEEKS" :key="w">{{ w }}</th><th>เฉลี่ย</th></tr></thead>
        <tbody>
          <template v-for="m in members" :key="m.p.id">
            <tr class="person" @click="open = open === m.p.id ? null : m.p.id">
              <td>
                <button class="who" :aria-expanded="open === m.p.id"><Avatar :id="m.p.id" :size="28" /><span>{{ m.p.name }}<em>{{ m.rows.length }} โครงการ</em></span></button>
              </td>
              <td v-for="(h, i) in m.total" :key="i">
                <span class="cell num" :class="[tone(h), { risk: h + m.soft[i] > 40 && h <= 40 }]" :title="m.soft[i] ? `จองแน่นอน ${h} ชม. + จองเบื้องต้น ${m.soft[i]} ชม.` : `${h} ชม.`">
                  {{ h || '–' }}<sup v-if="m.soft[i]">+{{ m.soft[i] }}</sup>
                </span>
              </td>
              <td class="num avg">{{ m.avg }}</td>
            </tr>
            <template v-if="open === m.p.id">
              <tr v-for="r in m.rows" :key="r.projectId" class="sub">
                <td><router-link :to="`/projects/${r.projectId}`">{{ r.name }}</router-link> <span class="chip">{{ r.stage ? stageOf(r.stage).label : '' }}</span> <span v-if="r.soft" class="chip warn">จองเบื้องต้น</span></td>
                <td v-for="(h, i) in r.hrs" :key="i" class="num">{{ h || '' }}</td><td />
              </tr>
            </template>
          </template>
        </tbody>
      </table>
      <div class="legend small">
        <span><i class="free" />ว่าง</span><span><i class="low" />1–15</span><span><i class="mid" />16–31</span><span><i class="full" />32–40</span><span><i class="over" />เกิน 40 ชม.</span><span><i class="risk" />เกินถ้ารวมการจองเบื้องต้น</span><span><sup>+n</sup> ชั่วโมงจองเบื้องต้น (Soft booking)</span>
      </div>
    </section>

    <section v-if="requests.length" class="panel reqs">
      <div class="panel-head"><h2>คำขอคนจาก PM</h2><span class="muted small">เลือกคนจากงานค้างน้อยและไม่ลาช่วงนั้น · เพิ่มเป็นสมาชิกพื้นที่งานอัตโนมัติ</span></div>
      <table class="table"><tbody><tr v-for="x in requests" :key="x.r.id">
        <td><strong>{{ x.p.name }}</strong><p class="small muted">ขอโดย {{ person(x.r.by)?.name }} · {{ thDate(x.r.at) }}<template v-if="x.r.note"> · {{ x.r.note }}</template></p></td>
        <td>{{ MEMBER_ROLES[x.r.role] }} × {{ x.r.count }}</td><td class="small">{{ thDate(x.r.from) }} – {{ thDate(x.r.to) }}</td>
        <td class="r"><template v-if="canFill"><button class="btn sm primary" @click="filling = { ...x, pick: [] }">จัดคน</button> <button class="btn sm ghost" @click="decline(x.r)">ไม่อนุมัติ</button></template></td>
      </tr></tbody></table>
    </section>
    <Dialog :open="!!filling" :title="`จัด ${filling ? MEMBER_ROLES[filling.r.role] : ''} ให้ ${filling?.p.name ?? ''}`" @close="filling = null">
      <p class="small muted">ต้องการ {{ filling?.r.count }} คน · เรียงจากงานค้างน้อย · คนที่ลาช่วงนั้นอยู่ท้ายรายการ</p>
      <label v-for="u in candidates" :key="u.id" class="cand"><input v-model="filling!.pick" type="checkbox" :value="u.id" /> {{ u.name }} · {{ u.position }} · {{ u.team }}
        <span class="small muted">งานค้าง {{ busy(u.id, filling!.r) % 100 }}{{ busy(u.id, filling!.r) >= 100 ? ' · ลาช่วงนี้' : '' }}</span></label>
      <template #foot><button class="btn" @click="filling = null">ยกเลิก</button><button class="btn primary" :disabled="!filling?.pick.length" @click="fill">จัดคน</button></template>
    </Dialog>

    <section class="panel scroll-x leaves">
      <div class="panel-head"><h2>การลาของทีม</h2><button class="btn sm" @click="leaveOpen = true">แจ้งลา</button></div>
      <p class="muted small">แจ้งในระบบเพื่อดูผลกระทบกับงาน — การลาจริงยื่นในระบบ HR ตามปกติ · 20 วันทำการถัดไป</p>
      <table class="lc">
        <thead><tr><th />
          <th v-for="d in calDays" :key="d" :class="{ mon: new Date(d + 'T00:00:00Z').getUTCDay() === 1 }">{{ thDate(d).split(' ').slice(0, 2).join(' ') }}</th></tr></thead>
        <tbody>
          <tr v-for="id in teamPeople" :key="id">
            <th><span class="who"><Avatar :id="id" :size="22" />{{ person(id)?.name }}</span></th>
            <td v-for="d in calDays" :key="d" :class="{ mon: new Date(d + 'T00:00:00Z').getUTCDay() === 1 }">
              <span v-if="away(id, d)" class="cell" :class="away(id, d)!.part" :title="`ลา ${thDate(d)}`">{{ away(id, d)!.part === 'full' ? 'ลา' : away(id, d)!.part === 'am' ? 'เช้า' : 'บ่าย' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <h3 class="lh">บันทึกการลา (Log)</h3>
      <LeaveLog :people="teamPeople" show-past />
    </section>
    <LeaveDialog :open="leaveOpen" @close="leaveOpen = false" />

    <section class="panel demand">
      <div class="panel-head"><h2>ความต้องการคนจาก Pipeline</h2><span class="muted small">Man-day จาก Cost Sheet × โอกาสปิด (ค่าเดียวกับ Dashboard)</span></div>
      <table class="table">
        <thead><tr><th>โครงการ</th><th>สถานะ</th><th class="r">Man-day</th><th class="r">โอกาสปิด</th><th class="r">ถ่วงน้ำหนัก</th><th>คาดว่าปิด</th></tr></thead>
        <tbody>
          <tr v-for="d in demand" :key="d.p.id"><td><router-link :to="`/projects/${d.p.id}`">{{ d.p.name }}</router-link></td><td>{{ stageOf(d.p.stage).label }}</td><td class="r num">{{ d.md }}</td><td class="r num">{{ d.prob }}%</td><td class="r num"><b>{{ d.weighted }}</b></td><td class="small">{{ d.p.expectedClose ?? '—' }}</td></tr>
          <tr v-if="!demand.length"><td colspan="6" class="muted">ไม่มีดีลที่เปิดอยู่ของทีมนี้</td></tr>
        </tbody>
      </table>
      <p class="hint">ใช้ดูล่วงหน้าว่าถ้าชนะงาน ทีมไหนจะขาดคน · การจองแบ่งเป็น “จองเบื้องต้น” (ยังไม่กินกำลังคน) และ “จองแน่นอน” (มอบหมาย Task ได้) หลัง Handover</p>
    </section>

    <section class="panel note">
      <h3>อ่านตารางนี้อย่างไร</h3>
      <p class="muted">คลิกชื่อเพื่อดูว่าชั่วโมงมาจากโครงการไหน ช่องสีแดงคือคนที่ถูกจองเกินกำลัง — PM ควรเลื่อน Task หรือขอคนเพิ่มจากหัวหน้ากลุ่มก่อนเริ่มสัปดาห์นั้น
        <template v-if="members.some((m) => m.total.some((h) => h > 40))">ตอนนี้มี {{ members.filter((m) => m.total.some((h) => h > 40)).map((m) => person(m.p.id)?.name).join(', ') }} ที่เกินกำลัง</template>
      </p>
    </section>
  </div>
</template>

<style scoped>
.seg { display: inline-flex; background: var(--surface); border: 1px solid var(--line-strong); border-radius: var(--r-sm); padding: 3px; gap: 2px; }
.seg button { border: 0; background: none; padding: 0 14px; border-radius: 4px; font: 500 14px var(--font); color: var(--muted); cursor: pointer; min-height: 32px; }
.seg button[aria-checked='true'] { background: var(--ink); color: var(--on-ink); }
.heat { width: 100%; border-collapse: separate; border-spacing: 4px; min-width: 820px; }
.heat th { font-weight: 500; font-size: 12.5px; color: var(--muted); text-align: center; padding: 4px; }
.heat th:first-child { text-align: left; }
.heat td { text-align: center; font-size: 13px; }
.person { cursor: pointer; }
.who { display: flex; align-items: center; gap: 10px; background: none; border: 0; font: inherit; color: var(--ink); cursor: pointer; text-align: left; padding: 2px; }
.who span { display: grid; line-height: 1.3; font-weight: 500; font-size: 14px; }
.who em { font-style: normal; font-size: 12px; color: var(--muted); font-weight: 400; }
.cell { display: block; height: 40px; line-height: 40px; border-radius: 6px; font-weight: 600; }
.free { background: var(--sunken); color: var(--faint); }
.low { background: #e3f0f0; color: var(--post); }
.mid { background: #b9dcdd; color: #0b5d62; }
.full { background: var(--post); color: #fff; }
.over { background: var(--lose); color: #fff; }
.cell.risk, i.risk { box-shadow: inset 0 0 0 2px var(--warn); }
.cell sup { font-size: 10px; font-weight: 500; margin-left: 2px; opacity: 0.85; }
.demand { margin-top: 20px; }
.avg { font-weight: 600; }
.sub td { font-size: 12.5px; color: var(--muted); padding: 2px; }
.sub td:first-child { text-align: left; padding-left: 42px; }
.legend { display: flex; gap: 16px; margin-top: 16px; color: var(--muted); flex-wrap: wrap; }
.legend i { display: inline-block; width: 14px; height: 14px; border-radius: 3px; margin-right: 6px; vertical-align: -2px; }
.note { margin-top: 20px; display: grid; gap: 6px; }
.leaves { margin-top: 16px; display: grid; gap: 10px; }
.lc { border-collapse: collapse; font-size: 12px; min-width: 900px; }
.lc th, .lc td { padding: 4px; text-align: center; border-bottom: 1px solid var(--line); white-space: nowrap; }
.lc thead th { color: var(--muted); font-weight: 500; }
.lc tbody th { text-align: left; font-weight: 500; font-size: 13px; }
.lc .mon { border-left: 1px solid var(--line-strong); }
.lc .who { display: inline-flex; gap: 6px; align-items: center; }
.cell { display: inline-block; min-width: 34px; padding: 2px 4px; border-radius: 6px; background: var(--lose-soft); color: var(--lose); font-weight: 600; }
.cell.am, .cell.pm { background: var(--warn-soft); color: var(--warn); }
.lh { font-size: 15px; margin-top: 6px; }
.reqs { margin-top: 16px; }
.cand { display: flex; gap: 8px; align-items: center; font-size: 14px; padding: 4px 0; }
</style>
