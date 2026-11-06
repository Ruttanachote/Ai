<script setup lang="ts">
import { computed } from 'vue'
import Photo from '../components/Photo.vue'
import StageBadge from '../components/StageBadge.vue'
import Avatar from '../components/Avatar.vue'
import PageHeader from '../components/PageHeader.vue'
import KpiStrip from '../components/KpiStrip.vue'
import { projects, scope, session } from '../store'
import { PHOTOS, SALES_TEAMS, GROUP_NAME, mb, baht, daysUntil, daysSince, thDate, person } from '../data/mock'
import { stageOf, catOf, FORECAST_CAT, type StageKey } from '../data/model'
import { winRate } from '../domain/rules'
import { OPEN, isOpen, isWon, pipelineValue, bookedValue, weightedValue, teamTotals, sum } from '../domain/metrics'

// Every figure on this page comes from the shared scope + metrics, so it matches the
// Pipeline board, the project register and the account pages for the same role.
const mine = computed(() => scope.value.list)
const open = computed(() => mine.value.filter(isOpen))
const wonList = computed(() => mine.value.filter(isWon))
const visibleTeams = computed(() => {
  const s = scope.value
  return 'teams' in s && s.teams ? SALES_TEAMS.filter((t) => s.teams!(t.code)) : SALES_TEAMS
})
const PERSONAL_TARGET = 40_000_000
const target = computed(() => (session.role === 'sm' ? PERSONAL_TARGET : visibleTeams.value.reduce((s, t) => s + (t.target ?? 0), 0)))
const won = computed(() => sum(wonList.value, bookedValue))
const weighted = computed(() => sum(open.value, weightedValue))
const commit = computed(() => sum(open.value.filter((p) => catOf(p) === 'commit'), pipelineValue))
const gp = computed(() => {
  const r = sum(wonList.value, (p) => p.revenue)
  return r ? ((r - sum(wonList.value, (p) => p.cost)) / r) * 100 : 0
})
const pct = computed(() => Math.min(100, (won.value / target.value) * 100))

const kpis = computed(() => [
  { label: 'Pipeline ถ่วงน้ำหนัก', value: mb(weighted.value), note: `${open.value.length} โครงการที่ยังเปิดอยู่`, to: '/pipeline' },
  { label: 'Commit ไตรมาสนี้', value: mb(commit.value), note: 'หมวด Commit (ค่าเริ่มต้น: Forecast และ Rebidding)' },
  { label: 'Gross margin งานที่ชนะ', value: gp.value.toFixed(1) + '%', note: 'เป้าบริษัทไม่ต่ำกว่า 25%', tone: gp.value < 25 ? ('bad' as const) : ('' as const) },
  { label: 'Win rate', value: Math.round(winRate(mine.value) * 100) + '%', note: 'นับจากผลชนะ/แพ้ที่ปิดแล้ว' },
])

const cats = computed(() =>
  (['commit', 'bestcase', 'pipeline'] as const).map((c) => {
    const list = open.value.filter((p) => catOf(p) === c)
    return { c, label: FORECAST_CAT[c], n: list.length, v: sum(list, pipelineValue) }
  }),
)
const stalled = computed(() =>
  open.value
    .map((p) => ({ p, d: daysSince(p.stageSince), lim: stageOf(p.stage).staleDays ?? 999 }))
    .filter((x) => x.d > x.lim)
    .sort((a, b) => b.d - b.lim - (a.d - a.lim)),
)
const losses = computed(() => {
  const m = new Map<string, number>()
  mine.value.filter((p) => p.loss).forEach((p) => m.set(p.loss!.reason, (m.get(p.loss!.reason) ?? 0) + pipelineValue(p)))
  return [...m.entries()].sort((a, b) => b[1] - a[1])
})
const funnel = computed(() => {
  const keys: StageKey[] = [...OPEN, 'win']
  const rows = keys.map((k) => {
    const list = mine.value.filter((p) => (k === 'win' ? isWon(p) : p.stage === k))
    return { k, count: list.length, value: sum(list, k === 'win' ? bookedValue : pipelineValue) }
  })
  const max = Math.max(...rows.map((r) => r.value), 1)
  return rows.map((r) => ({ ...r, w: (r.value / max) * 100 }))
})

// Team totals credit each project by its revenue split, over all projects (a split may cross groups).
const teams = computed(() =>
  visibleTeams.value.map((t) => {
    const { won: w, weighted: pipe } = teamTotals(projects, t.code)
    const tg = t.target ?? 1
    return { ...t, won: w, pipe, wp: Math.min(100, (w / tg) * 100), pp: Math.min(100, ((w + pipe) / tg) * 100) }
  }),
)

const deadlines = computed(() =>
  mine.value
    .flatMap((p) => [
      p.bidDue && isOpen(p) ? { p, what: 'ยื่นประมูล / Bid due', date: p.bidDue } : null,
      p.expectedClose && isOpen(p) ? { p, what: 'คาดว่าปิดการขาย', date: p.expectedClose } : null,
      p.endWarranty && p.stage === 'warranty' ? { p, what: 'หมดประกัน', date: p.endWarranty } : null,
    ])
    .filter((x): x is NonNullable<typeof x> => !!x && daysUntil(x.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6),
)
</script>

<template>
  <div class="page">
    <PageHeader module="งานขาย" title="ภาพรวมยอดขาย" :scope="scope.label" subtitle="ปีงบ 2569 · ข้อมูล ณ 6 พ.ย. 2569" />

    <section class="hero">
      <Photo :id="PHOTOS.meeting" :w="1800" alt="" />
      <div class="hero-in">
        <div>
          <p class="greet">สวัสดี {{ person(session.userId)?.name }} · ยอดปิดได้ปี 2569</p>
          <p class="big num">{{ mb(won) }} <span>จากเป้า {{ mb(target) }}</span></p>
        </div>
        <div class="goal" role="img" :aria-label="`ทำได้ ${pct.toFixed(0)}% ของเป้า`">
          <div class="bar"><i :style="{ width: pct + '%' }" /><i class="w" :style="{ left: pct + '%', width: Math.min(100 - pct, (weighted / target) * 100) + '%' }" /></div>
          <div class="legend"><span><b class="k1" />ปิดแล้ว {{ pct.toFixed(0) }}%</span><span><b class="k2" />Pipeline ถ่วงน้ำหนัก {{ mb(weighted) }}</span></div>
        </div>
      </div>
    </section>

    <KpiStrip :items="kpis" />

    <div class="grid">
      <section class="panel">
        <div class="panel-head"><h2>มูลค่าตามสถานะ</h2><span class="muted small">รวมรายได้ (หรือ Budget ถ้ายังไม่มีใบเสนอราคา)</span></div>
        <div class="funnel">
          <div v-for="r in funnel" :key="r.k" class="frow">
            <span class="fl">{{ stageOf(r.k).label }}<em>{{ stageOf(r.k).prob }}</em></span>
            <div class="ftrack"><i :class="{ win: r.k === 'win' }" :style="{ width: Math.max(r.w, 2) + '%' }" /></div>
            <span class="fv num">{{ mb(r.value) }}<em>{{ r.count }} งาน</em></span>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><h2>กำหนดการที่ใกล้ถึง</h2></div>
        <ul class="dl">
          <li v-for="d in deadlines" :key="d.p.id + d.what">
            <span class="day" :class="{ hot: daysUntil(d.date) <= 14 }"><b class="num">{{ daysUntil(d.date) }}</b>วัน</span>
            <div>
              <router-link :to="`/projects/${d.p.id}`">{{ d.p.name }}</router-link>
              <p class="muted small">{{ d.what }} · {{ thDate(d.date) }}</p>
            </div>
            <StageBadge :stage="d.p.stage" />
          </li>
        </ul>
      </section>
    </div>

    <div class="grid3">
      <section class="panel">
        <div class="panel-head"><h2>Forecast ตามความมั่นใจ</h2></div>
        <ul class="cats">
          <li v-for="c in cats" :key="c.c"><span>{{ c.label }}<em>{{ c.n }} งาน</em></span><b class="num">{{ mb(c.v) }}</b></li>
        </ul>
        <p class="hint">SM ปรับหมวดได้ในหน้าโครงการ ผู้บริหารใช้ยอด Commit เป็นตัวเลขส่งไตรมาส</p>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>ดีลค้างนาน</h2><span class="muted small">เกินเกณฑ์วันของสถานะ</span></div>
        <ul v-if="stalled.length" class="stl">
          <li v-for="x in stalled" :key="x.p.id"><router-link :to="`/projects/${x.p.id}`">{{ x.p.name }}</router-link><span class="small"><b class="num">{{ x.d }}</b> วันใน {{ stageOf(x.p.stage).label }} (เกณฑ์ {{ x.lim }})</span></li>
        </ul>
        <p v-else class="muted small">ไม่มีดีลที่ค้างเกินเกณฑ์</p>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>เหตุผลที่แพ้</h2></div>
        <ul v-if="losses.length" class="cats">
          <li v-for="[r, v] in losses" :key="r"><span>{{ r }}</span><b class="num">{{ mb(v) }}</b></li>
        </ul>
        <p v-else class="muted small">ยังไม่มีงานที่แพ้ในช่วงนี้</p>
        <p class="hint">บังคับเลือกเหตุผล ผู้ชนะ และราคาที่ชนะ ทุกครั้งที่ปิดเป็น Close Lose</p>
      </section>
    </div>

    <section class="panel">
      <div class="panel-head"><h2>ยอดขายเทียบเป้าราย DT และทีมย่อย</h2><span class="muted small">แถบเข้ม = ปิดแล้ว · แถบอ่อน = รวม Pipeline ถ่วงน้ำหนัก · นับตามสัดส่วนแบ่งยอดของแต่ละโครงการ</span></div>
      <div class="scroll-x">
        <table class="table">
          <thead><tr><th>ทีม</th><th style="width:40%">ความคืบหน้า</th><th class="r">ปิดแล้ว</th><th class="r">Pipeline</th><th class="r">เป้าปี</th></tr></thead>
          <tbody>
            <tr v-for="t in teams" :key="t.code">
              <td><strong>{{ t.code }}</strong> <span class="muted">{{ t.name }}</span><p class="small muted">{{ GROUP_NAME[t.group] }}{{ t.formerly ? ' · เดิม ' + t.formerly : '' }}</p></td>
              <td><div class="tt"><i class="p" :style="{ width: t.pp + '%' }" /><i :style="{ width: t.wp + '%' }" /></div></td>
              <td class="r num">{{ baht(Math.round(t.won)) }}</td>
              <td class="r num muted">{{ baht(Math.round(t.pipe)) }}</td>
              <td class="r num">{{ mb(t.target ?? 0) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <p class="foot muted small"><Avatar :id="session.userId" :size="20" /> ยอดชนะนับตั้งแต่ Close Win ขึ้นไป ใช้มูลค่าตามสัญญา (หรือราคาที่อนุมัติถ้ายังไม่มีสัญญา)</p>
  </div>
</template>

<style scoped>
.hero { position: relative; border-radius: var(--r-lg); overflow: hidden; min-height: 240px; margin-bottom: 20px; }
.hero .photo { position: absolute; inset: 0; }
.hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgb(22 27 38 / 0.92) 0%, rgb(22 27 38 / 0.7) 55%, rgb(22 27 38 / 0.35) 100%); }
.hero-in { position: relative; z-index: 1; padding: 32px 36px; color: #fff; display: grid; gap: 28px; }
.greet { color: #cfd4dd; font-size: 14px; }
.big { font-size: clamp(38px, 5vw, 60px); font-weight: 700; line-height: 1.05; margin-top: 6px; letter-spacing: -0.01em; }
.big span { font-size: 18px; font-weight: 500; color: #aeb5c2; margin-left: 8px; letter-spacing: 0; }
.goal { max-width: 720px; }
.bar { position: relative; height: 10px; background: rgb(255 255 255 / 0.16); border-radius: 999px; overflow: hidden; }
.bar i { position: absolute; top: 0; bottom: 0; left: 0; background: #fff; border-radius: 999px; }
.bar i.w { background: rgb(255 255 255 / 0.4); border-radius: 0 999px 999px 0; }
.legend { display: flex; gap: 20px; margin-top: 10px; font-size: 13px; color: #cfd4dd; flex-wrap: wrap; }
.legend b { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; vertical-align: -1px; }
.k1 { background: #fff; } .k2 { background: rgb(255 255 255 / 0.4); }


.grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; margin-bottom: 20px; align-items: start; }
.funnel { display: grid; gap: 12px; }
.frow { display: grid; grid-template-columns: 130px 1fr 110px; align-items: center; gap: 14px; }
.fl, .fv { display: grid; line-height: 1.3; font-size: 14px; }
.fl em, .fv em { font-style: normal; font-size: 12px; color: var(--faint); }
.fv { text-align: right; font-weight: 600; }
.ftrack { height: 26px; background: var(--sunken); border-radius: 4px; overflow: hidden; }
.ftrack i { display: block; height: 100%; background: var(--presale); border-radius: 4px; }
.ftrack i.win { background: var(--win); }

.dl { list-style: none; margin: 0; padding: 0; display: grid; }
.dl li { display: grid; grid-template-columns: 52px 1fr auto; gap: 12px; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--line); }
.dl li:last-child { border-bottom: 0; }
.day { display: grid; justify-items: center; font-size: 11px; color: var(--muted); background: var(--sunken); border-radius: var(--r-sm); padding: 4px 0; line-height: 1.2; }
.day b { font-size: 18px; color: var(--ink); }
.day.hot { background: var(--lose-soft); color: var(--lose); }
.day.hot b { color: var(--lose); }

.grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin-bottom: 20px; align-items: start; }
.cats { list-style: none; margin: 0 0 10px; padding: 0; display: grid; }
.cats li { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--line); }
.cats li:last-child { border-bottom: 0; }
.cats span { display: grid; line-height: 1.3; }
.cats em { font-style: normal; font-size: 12px; color: var(--faint); }
.cats b { font-size: 18px; }
.stl { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.stl li { display: grid; gap: 2px; padding-left: 10px; border-left: 3px solid var(--lose); }
.stl b { color: var(--lose); }
@media (max-width: 1100px) { .grid3 { grid-template-columns: 1fr; } }
.tt { position: relative; height: 8px; background: var(--sunken); border-radius: 999px; overflow: hidden; min-width: 160px; }
.tt i { position: absolute; inset: 0 auto 0 0; background: var(--ink); border-radius: 999px; }
.tt i.p { background: var(--presale-soft); }
.foot { display: flex; align-items: center; gap: 8px; margin-top: 16px; }

@media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }
@media (max-width: 560px) {
  .hero-in { padding: 24px 20px; }
  .frow { grid-template-columns: 92px 1fr 80px; gap: 8px; }
}
</style>
