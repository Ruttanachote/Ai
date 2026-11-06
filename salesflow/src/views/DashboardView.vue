<script setup lang="ts">
import { computed } from 'vue'
import Photo from '../components/Photo.vue'
import StageBadge from '../components/StageBadge.vue'
import Avatar from '../components/Avatar.vue'
import { projects, session } from '../store'
import { PHOTOS, TEAMS, mb, baht, daysUntil, thDate, person } from '../data/mock'
import { stageOf, type StageKey } from '../data/model'

const WEIGHT: Partial<Record<StageKey, number>> = { opportunity: 0.15, pipeline: 0.45, forecast: 0.75, rebidding: 0.75 }
const WON: StageKey[] = ['win', 'handover', 'delivery', 'warranty', 'ended']

const mine = computed(() => (session.role === 'sm' ? projects.filter((p) => p.sm === session.userId) : projects))
const scopeLabel = computed(() => (session.role === 'sm' ? 'ของคุณ' : 'ทุกทีม DT'))

const won = computed(() => mine.value.filter((p) => WON.includes(p.stage)).reduce((s, p) => s + p.revenue, 0))
const target = computed(() => (session.role === 'sm' ? 40_000_000 : TEAMS.reduce((s, t) => s + t.target, 0)))
const open = computed(() => mine.value.filter((p) => WEIGHT[p.stage] !== undefined))
const weighted = computed(() => open.value.reduce((s, p) => s + (p.revenue || p.budget) * WEIGHT[p.stage]!, 0))
const forecast = computed(() => open.value.filter((p) => p.stage === 'forecast' || p.stage === 'rebidding').reduce((s, p) => s + p.revenue, 0))
const gp = computed(() => {
  const w = mine.value.filter((p) => WON.includes(p.stage))
  const r = w.reduce((s, p) => s + p.revenue, 0)
  return r ? ((r - w.reduce((s, p) => s + p.cost, 0)) / r) * 100 : 0
})
const pct = computed(() => Math.min(100, (won.value / target.value) * 100))

const funnel = computed(() => {
  const keys: StageKey[] = ['opportunity', 'pipeline', 'forecast', 'rebidding', 'win']
  const rows = keys.map((k) => {
    const list = mine.value.filter((p) => (k === 'win' ? WON.includes(p.stage) : p.stage === k))
    return { k, count: list.length, value: list.reduce((s, p) => s + (p.revenue || p.budget), 0) }
  })
  const max = Math.max(...rows.map((r) => r.value), 1)
  return rows.map((r) => ({ ...r, w: (r.value / max) * 100 }))
})

const teams = computed(() =>
  TEAMS.map((t) => {
    const list = projects.filter((p) => p.team === t.code)
    const w = list.filter((p) => WON.includes(p.stage)).reduce((s, p) => s + p.revenue, 0)
    const pipe = list.filter((p) => WEIGHT[p.stage] !== undefined).reduce((s, p) => s + (p.revenue || p.budget) * WEIGHT[p.stage]!, 0)
    return { ...t, won: w, pipe, wp: Math.min(100, (w / t.target) * 100), pp: Math.min(100, ((w + pipe) / t.target) * 100) }
  }),
)

const deadlines = computed(() =>
  mine.value
    .flatMap((p) => [
      p.bidDue ? { p, what: 'ยื่นประมูล / Bid due', date: p.bidDue } : null,
      p.expectedClose && WEIGHT[p.stage] !== undefined ? { p, what: 'คาดว่าปิดการขาย', date: p.expectedClose } : null,
      p.endWarranty && p.stage === 'warranty' ? { p, what: 'หมดประกัน', date: p.endWarranty } : null,
    ])
    .filter((x): x is NonNullable<typeof x> => !!x && daysUntil(x.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6),
)
</script>

<template>
  <div class="page">
    <section class="hero">
      <Photo :id="PHOTOS.meeting" :w="1800" alt="" />
      <div class="hero-in">
        <div>
          <p class="greet">สวัสดี {{ person(session.userId)?.name }} · ยอดปิดได้ปี 2569 {{ scopeLabel }}</p>
          <p class="big num">{{ mb(won) }} <span>จากเป้า {{ mb(target) }}</span></p>
        </div>
        <div class="goal" role="img" :aria-label="`ทำได้ ${pct.toFixed(0)}% ของเป้า`">
          <div class="bar"><i :style="{ width: pct + '%' }" /><i class="w" :style="{ left: pct + '%', width: Math.min(100 - pct, (weighted / target) * 100) + '%' }" /></div>
          <div class="legend"><span><b class="k1" />ปิดแล้ว {{ pct.toFixed(0) }}%</span><span><b class="k2" />Pipeline ถ่วงน้ำหนัก {{ mb(weighted) }}</span></div>
        </div>
      </div>
    </section>

    <section class="kpis">
      <div class="kpi"><span>Pipeline ถ่วงน้ำหนัก</span><strong class="num">{{ mb(weighted) }}</strong><em>{{ open.length }} โครงการที่ยังเปิดอยู่</em></div>
      <div class="kpi"><span>Forecast + Rebidding</span><strong class="num">{{ mb(forecast) }}</strong><em>โอกาส 70–80% ปิดไตรมาสนี้–หน้า</em></div>
      <div class="kpi"><span>Gross margin งานที่ชนะ</span><strong class="num">{{ gp.toFixed(1) }}%</strong><em>เป้าบริษัทไม่ต่ำกว่า 25%</em></div>
      <div class="kpi"><span>Win rate ปีนี้</span><strong class="num">71%</strong><em>ชนะ 5 จาก 7 โครงการที่มีผล</em></div>
    </section>

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

    <section class="panel">
      <div class="panel-head"><h2>ยอดขายเทียบเป้าราย DT</h2><span class="muted small">แถบเข้ม = ปิดแล้ว · แถบอ่อน = รวม Pipeline ถ่วงน้ำหนัก</span></div>
      <div class="scroll-x">
        <table class="table">
          <thead><tr><th>ทีม</th><th style="width:40%">ความคืบหน้า</th><th class="r">ปิดแล้ว</th><th class="r">Pipeline</th><th class="r">เป้าปี</th></tr></thead>
          <tbody>
            <tr v-for="t in teams" :key="t.code">
              <td><strong>{{ t.code }}</strong> <span class="muted">{{ t.name }}</span></td>
              <td><div class="tt"><i class="p" :style="{ width: t.pp + '%' }" /><i :style="{ width: t.wp + '%' }" /></div></td>
              <td class="r num">{{ baht(t.won) }}</td>
              <td class="r num muted">{{ baht(Math.round(t.pipe)) }}</td>
              <td class="r num">{{ mb(t.target) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <p class="foot muted small"><Avatar :id="session.userId" :size="20" /> ข้อมูล ณ 6 พ.ย. 2569 · ยอดชนะนับเมื่อสถานะเป็น Close Win ขึ้นไป</p>
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

.kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
.kpi { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); padding: 16px 18px; display: grid; gap: 2px; }
.kpi span { font-size: 13px; color: var(--muted); }
.kpi strong { font-size: 26px; font-weight: 600; }
.kpi em { font-style: normal; font-size: 12.5px; color: var(--faint); }

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

.tt { position: relative; height: 8px; background: var(--sunken); border-radius: 999px; overflow: hidden; min-width: 160px; }
.tt i { position: absolute; inset: 0 auto 0 0; background: var(--ink); border-radius: 999px; }
.tt i.p { background: var(--presale-soft); }
.foot { display: flex; align-items: center; gap: 8px; margin-top: 16px; }

@media (max-width: 1100px) { .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } .grid { grid-template-columns: 1fr; } }
@media (max-width: 560px) {
  .hero-in { padding: 24px 20px; }
  .frow { grid-template-columns: 92px 1fr 80px; gap: 8px; }
  .kpi strong { font-size: 22px; }
}
</style>
