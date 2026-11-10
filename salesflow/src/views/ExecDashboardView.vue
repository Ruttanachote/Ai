<script setup lang="ts">
// Executive Dashboard: how every DT team stands — people, projects, workload and revenue
// against target — plus what waits for the executive's decision and what needs follow-up.
import { computed, ref } from 'vue'
import { NDrawer, NDrawerContent } from 'naive-ui'
import PageHeader from '../components/PageHeader.vue'
import KpiStrip from '../components/KpiStrip.vue'
import Avatar from '../components/Avatar.vue'
import Icon from '../components/Icon.vue'
import { projects, session } from '../store'
import { PEOPLE, SALES_TEAMS, GROUP_NAME, TODAY_ISO, mb, person, thDate } from '../data/mock'
import { dealValue, isOpen, sum } from '../domain/metrics'
import { TARGET_LABEL, TRACK_STEPS, stepIndex, teamStat, trackOf, yearElapsed, type TeamStat } from '../domain/executive'
import { myMails } from '../components/exec/mail'

const nameOf = (id?: string) => person(id)?.name ?? '—'
const group = ref('')
const groups = [...new Set(SALES_TEAMS.map((t) => t.group))]
const teams = computed(() =>
  SALES_TEAMS.filter((t) => !group.value || t.group === group.value).map((t) => teamStat(t, projects, TODAY_ISO, t.headcount ?? 0, t.load ?? 0)),
)
const inScope = computed(() => projects.filter((p) => !group.value || teams.value.some((t) => t.code === p.team)))
const target = computed(() => teams.value.reduce((s, t) => s + t.target, 0))
const won = computed(() => teams.value.reduce((s, t) => s + t.won, 0))
const weighted = computed(() => teams.value.reduce((s, t) => s + t.weighted, 0))
const elapsed = yearElapsed(TODAY_ISO)
const people = computed(() => teams.value.reduce((s, t) => s + t.headcount, 0))
const avgLoad = computed(() => (people.value ? teams.value.reduce((s, t) => s + t.load * t.headcount, 0) / people.value : 0))

const pending = computed(() => myMails.value.filter((m) => m.state === 'pending'))
const tracks = computed(() => inScope.value.map((p) => ({ p, t: trackOf(p, TODAY_ISO, nameOf, thDate) })))
const followUp = computed(() => tracks.value.filter((r) => !r.t.closed && (r.t.tone === 'bad' || r.t.tone === 'warn')).sort((a, b) => (a.t.tone === 'bad' ? -1 : 1) - (b.t.tone === 'bad' ? -1 : 1) || dealValue(b.p) - dealValue(a.p)))
const flow = computed(() => TRACK_STEPS.map((s) => {
  const list = tracks.value.filter((r) => !r.t.closed && r.t.step === s.k)
  return { ...s, n: list.length, v: sum(list.map((r) => r.p), dealValue) }
}))
const maxFlow = computed(() => Math.max(1, ...flow.value.map((f) => f.n)))

const kpis = computed(() => [
  { label: 'ยอดชนะเทียบเป้า', value: `${Math.round((won.value / target.value) * 100)}%`, note: `${mb(won.value)} จาก ${mb(target.value)} · ควรถึง ${Math.round(elapsed * 100)}% ณ วันนี้`, tone: won.value >= target.value * elapsed * 0.95 ? ('good' as const) : ('warn' as const) },
  { label: 'Pipeline ถ่วงน้ำหนัก', value: mb(weighted.value), note: `${inScope.value.filter(isOpen).length} ดีลที่ยังเปิด` },
  { label: 'รอคุณอนุมัติ', value: String(pending.value.length), note: pending.value.length ? mb(sum(pending.value.map((m) => m.p), (p) => p.approval?.snapshot?.revenue ?? p.revenue)) + ' มูลค่ารวม' : 'ไม่มีคำขอค้าง', tone: pending.value.length ? ('warn' as const) : ('' as const), to: '/inbox' },
  { label: 'โครงการต้องติดตาม', value: String(followUp.value.length), note: `${followUp.value.filter((r) => r.t.tone === 'bad').length} ล่าช้า`, tone: followUp.value.some((r) => r.t.tone === 'bad') ? ('bad' as const) : ('' as const), to: '/exec/tracker?attention=1' },
])
const statusCount = computed(() => (['ontrack', 'atrisk', 'behind'] as const).map((k) => ({ k, n: teams.value.filter((t) => t.status === k).length })))
const TONE = { ontrack: 'win', atrisk: 'warn', behind: 'lose' } as const
const loadTone = (l: number) => (l > 1 ? 'over' : l >= 0.85 ? 'full' : l >= 0.6 ? 'ok' : 'low')

// Team drill-down
const openTeam = ref<TeamStat | null>(null)
const teamProjects = computed(() => (openTeam.value ? tracks.value.filter((r) => r.p.team === openTeam.value!.code || (r.p.splits ?? []).some((s) => s.team === openTeam.value!.code)).sort((a, b) => stepIndex(a.t.step) - stepIndex(b.t.step)) : []))
const teamPeople = computed(() => (openTeam.value ? PEOPLE.filter((u) => u.team === openTeam.value!.code) : []))
const pct = (n: number) => Math.round(n * 100)
</script>

<template>
  <div class="page">
    <PageHeader module="Executive · ผู้บริหาร" title="Executive Dashboard" scope="ทุกทีม DT" :subtitle="`ปีงบ 2569 · ข้อมูล ณ ${thDate(TODAY_ISO)}`">
      <div class="seg" role="radiogroup" aria-label="กลุ่ม">
        <button role="radio" :aria-checked="!group" @click="group = ''">ทั้งหมด</button>
        <button v-for="g in groups" :key="g" role="radio" :aria-checked="group === g" :title="GROUP_NAME[g]" @click="group = g">{{ g }}</button>
      </div>
    </PageHeader>
    <p class="hello">สวัสดี {{ person(session.userId)?.name }}<template v-if="pending.length"> — มี <router-link to="/inbox">{{ pending.length }} คำขอรออนุมัติ</router-link> ใน Mail Inbox</template></p>

    <KpiStrip :items="kpis" />

    <section class="panel teams">
      <div class="panel-head">
        <h2>ทีมเทียบเป้า <span class="small muted sub">{{ teams.length }} ทีม · {{ people }} คน · Workload เฉลี่ย {{ pct(avgLoad) }}%</span></h2>
        <div class="legend">
          <span v-for="s in statusCount" :key="s.k" class="chip" :class="TONE[s.k]">{{ TARGET_LABEL[s.k] }} {{ s.n }}</span>
        </div>
      </div>
      <div class="scroll-x">
        <table>
          <thead>
            <tr>
              <th scope="col">ทีม</th>
              <th scope="col" class="r">คน</th>
              <th scope="col">Workload</th>
              <th scope="col" class="c">ก่อนขาย</th>
              <th scope="col" class="c">ส่งมอบ</th>
              <th scope="col" class="c">MA</th>
              <th scope="col">ยอดชนะ / เป้า</th>
              <th scope="col">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in teams" :key="t.code" tabindex="0" @click="openTeam = t" @keydown.enter="openTeam = t">
              <th scope="row"><strong>{{ t.code }}</strong><span class="small muted">{{ t.name }}</span></th>
              <td class="r num">{{ t.headcount }}</td>
              <td>
                <span class="load"><span class="lbar"><i :class="loadTone(t.load)" :style="{ width: Math.min(100, pct(t.load)) + '%' }" /></span><span class="num small" :class="loadTone(t.load)">{{ pct(t.load) }}%</span></span>
              </td>
              <td class="c num">{{ t.presale }}</td>
              <td class="c num">{{ t.delivery }}</td>
              <td class="c num">{{ t.ma }}</td>
              <td>
                <span class="tg">
                  <span class="tbar" :title="`ควรถึง ${mb(t.pace)} ณ วันนี้`"><i :style="{ width: Math.min(100, pct(t.pct)) + '%' }" :class="TONE[t.status]" /><i class="w" :style="{ left: Math.min(100, pct(t.pct)) + '%', width: Math.min(100 - Math.min(100, pct(t.pct)), (t.weighted / t.target) * 100) + '%' }" /><b class="pace" :style="{ left: pct(elapsed) + '%' }" /></span>
                  <span class="small num">{{ mb(t.won) }} / {{ mb(t.target) }} · <b>{{ pct(t.pct) }}%</b></span>
                </span>
              </td>
              <td><span class="chip" :class="TONE[t.status]">{{ TARGET_LABEL[t.status] }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="foot small muted">แถบสีเข้ม = ยอดชนะ · สีอ่อน = Pipeline ถ่วงน้ำหนัก · เส้นตั้ง = เป้าที่ควรถึง ณ วันนี้ ({{ pct(elapsed) }}% ของปี) · Workload จากแผนงานและ Timesheet เทียบ 40 ชม./สัปดาห์ · คลิกทีมเพื่อดูรายละเอียด</p>
    </section>

    <div class="grid">
      <section class="panel">
        <div class="panel-head"><h2>โครงการแต่ละขั้น</h2><router-link to="/exec/tracker" class="small">เปิด Project Status Tracker</router-link></div>
        <ul class="flow">
          <li v-for="(f, i) in flow" :key="f.k">
            <router-link :to="`/exec/tracker?step=${f.k}`" class="fl">
              <span class="fn num">{{ i + 1 }}</span>
              <span class="fname">{{ f.label }}<em>{{ f.owner }}</em></span>
              <span class="fbar"><i :style="{ width: (f.n / maxFlow) * 100 + '%' }" /></span>
              <span class="fv num">{{ f.n }}<em>{{ mb(f.v) }}</em></span>
            </router-link>
          </li>
        </ul>
      </section>

      <div class="side">
        <section class="panel">
          <div class="panel-head"><h2>รอคุณอนุมัติ</h2><router-link to="/inbox" class="small">Mail Inbox</router-link></div>
          <router-link v-for="m in pending" :key="m.key" :to="`/inbox?p=${m.p.id}`" class="mrow">
            <Avatar :id="m.a.submittedBy ?? m.p.sm" :size="32" />
            <span><strong>{{ m.p.name }}</strong><span class="small muted">{{ m.from }} · {{ m.a.version }} · GP {{ m.a.snapshot?.gp }}%</span></span>
            <span class="num small">{{ mb(m.a.snapshot?.revenue ?? m.p.revenue) }}</span>
          </router-link>
          <p v-if="!pending.length" class="muted small">ไม่มีคำขอค้าง</p>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>ต้องติดตาม</h2><router-link to="/exec/tracker?attention=1" class="small">ดูทั้งหมด</router-link></div>
          <router-link v-for="r in followUp.slice(0, 5)" :key="r.p.id" :to="`/projects/${r.p.id}`" class="frow">
            <Icon name="alert" :size="16" :class="r.t.tone" />
            <span><strong>{{ r.p.name }}</strong><span class="small muted">{{ TRACK_STEPS[stepIndex(r.t.step)].label }} · {{ r.t.detail }}</span></span>
          </router-link>
          <p v-if="!followUp.length" class="muted small">ทุกโครงการเป็นไปตามแผน</p>
        </section>
      </div>
    </div>

    <NDrawer :show="!!openTeam" :width="520" placement="right" @update:show="(v: boolean) => { if (!v) openTeam = null }">
      <NDrawerContent v-if="openTeam" :title="`${openTeam.code} · ${openTeam.name}`" closable>
        <div class="dr">
          <div class="dk">
            <div><span>คน</span><b class="num">{{ openTeam.headcount }}</b></div>
            <div><span>Workload</span><b class="num" :class="loadTone(openTeam.load)">{{ pct(openTeam.load) }}%</b></div>
            <div><span>ยอดชนะ</span><b class="num">{{ mb(openTeam.won) }}</b></div>
            <div><span>เป้า</span><b class="num">{{ mb(openTeam.target) }}</b></div>
          </div>
          <p><span class="chip" :class="TONE[openTeam.status]">{{ TARGET_LABEL[openTeam.status] }}</span> <span class="small muted">ควรถึง {{ mb(openTeam.pace) }} ณ วันนี้ · Pipeline ถ่วงน้ำหนัก {{ mb(openTeam.weighted) }}</span></p>
          <h3>โครงการ ({{ teamProjects.length }})</h3>
          <router-link v-for="r in teamProjects" :key="r.p.id" :to="`/projects/${r.p.id}`" class="dp">
            <span><strong>{{ r.p.name }}</strong><span class="small muted">{{ r.t.closed ? 'ปิดแล้ว' : TRACK_STEPS[stepIndex(r.t.step)].label }} · {{ r.t.detail }}</span></span>
            <span class="num small">{{ mb(dealValue(r.p)) }}</span>
          </router-link>
          <p v-if="!teamProjects.length" class="muted small">ยังไม่มีโครงการในปีนี้</p>
          <h3>คนในระบบ ({{ teamPeople.length }} จาก {{ openTeam.headcount }})</h3>
          <p v-if="!teamPeople.length" class="muted small">ยังไม่มีสมาชิกทีมนี้ใช้ One Platform</p>
          <ul class="ppl">
            <li v-for="u in teamPeople" :key="u.id"><Avatar :id="u.id" :size="28" /><span>{{ u.name }}<span class="small muted"> · {{ u.position ?? u.role.toUpperCase() }}</span></span></li>
          </ul>
        </div>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped>
.hello { margin: -8px 0 16px; font-family: var(--desc); color: var(--ink-2); }
.teams { padding: 20px 0 12px; margin-bottom: 20px; }
.teams .panel-head { padding: 0 24px; }
.sub { font-weight: 400; margin-left: 8px; }
.legend { display: flex; gap: 6px; flex-wrap: wrap; }
.scroll-x { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 860px; }
thead th { font-size: 12.5px; font-weight: 500; color: var(--muted); text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--line); }
tbody tr { cursor: pointer; }
tbody tr:hover { background: var(--sunken); }
tbody tr:focus-visible { outline: 2px solid var(--focus); outline-offset: -2px; }
tbody th, tbody td { padding: 12px; border-bottom: 1px solid var(--line); text-align: left; font-weight: 400; vertical-align: middle; }
tbody th { display: grid; padding-left: 24px; }
tbody tr:last-child th, tbody tr:last-child td { border-bottom: 0; }
.r { text-align: right !important; }
.c { text-align: center !important; }
.load { display: flex; align-items: center; gap: 8px; }
.lbar { width: 72px; height: 6px; border-radius: 3px; background: var(--line); overflow: hidden; }
.lbar i { display: block; height: 100%; background: var(--post); }
.lbar i.full { background: var(--warn); } .lbar i.over { background: var(--lose); } .lbar i.low { background: var(--faint); }
span.over { color: var(--lose); font-weight: 600; } span.full { color: var(--warn); }
b.over { color: var(--lose); } b.full { color: var(--warn); }
.tg { display: grid; gap: 4px; min-width: 220px; }
.tbar { position: relative; height: 8px; border-radius: 4px; background: var(--line); }
.tbar i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 4px; background: var(--win); }
.tbar i.warn { background: var(--warn); } .tbar i.lose { background: var(--lose); }
.tbar i.w { background: var(--presale); opacity: 0.25; border-radius: 0 4px 4px 0; }
.pace { position: absolute; top: -3px; bottom: -3px; width: 2px; background: var(--ink); border-radius: 1px; }
.foot { padding: 10px 24px 0; margin: 0; font-family: var(--desc); }
.grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 20px; align-items: start; }
.side { display: grid; gap: 20px; }
.flow { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.fl { display: grid; grid-template-columns: 24px minmax(120px, 160px) 1fr 90px; gap: 12px; align-items: center; padding: 8px; border-radius: var(--r-sm); color: var(--ink); }
.fl:hover { background: var(--sunken); text-decoration: none; }
.fn { width: 22px; height: 22px; border-radius: 50%; background: var(--sunken); border: 1px solid var(--line-strong); display: grid; place-items: center; font-size: 11.5px; color: var(--muted); }
.fname { display: grid; font-size: 14px; }
.fname em, .fv em { font-style: normal; font-family: var(--desc); font-size: 12px; color: var(--faint); }
.fbar { height: 10px; background: var(--sunken); border-radius: 5px; overflow: hidden; }
.fbar i { display: block; height: 100%; background: var(--primary); border-radius: 5px; min-width: 2px; }
.fv { display: grid; text-align: right; font-weight: 600; }
.mrow, .frow, .dp { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line); color: var(--ink); }
.mrow:last-of-type, .frow:last-of-type { border-bottom: 0; }
.mrow:hover, .frow:hover, .dp:hover { text-decoration: none; background: var(--sunken); }
.mrow > span:nth-child(2), .frow > span, .dp > span:first-child { display: grid; flex: 1; min-width: 0; }
.mrow strong, .frow strong, .dp strong { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.frow .bad { color: var(--lose); } .frow .warn { color: var(--warn); }
.dr { display: grid; gap: 12px; }
.dr h3 { font-size: 15px; margin: 8px 0 0; }
.dr p { margin: 0; }
.dk { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: var(--r-md); overflow: hidden; }
.dk div { background: var(--surface); padding: 10px 12px; display: grid; }
.dk span { font-size: 12px; color: var(--muted); }
.dk b { font-size: 18px; }
.ppl { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.ppl li { display: flex; align-items: center; gap: 10px; }
@media (max-width: 1000px) { .grid { grid-template-columns: 1fr; } }
@media (max-width: 560px) { .fl { grid-template-columns: 24px 1fr 70px; } .fbar { display: none; } .dk { grid-template-columns: repeat(2, 1fr); } }
</style>
