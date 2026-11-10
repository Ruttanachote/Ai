<script setup lang="ts">
// OKR Report — the monthly sales report for the OKR meeting with every team. Pulls targets,
// Close Win, pipeline and stage history from the projects the viewer may see; SM gets their
// own figures, the group head their teams, executives every team. Export: Excel and PDF.
import { computed, ref } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import Dialog from '../components/Dialog.vue'
import StageBadge from '../components/StageBadge.vue'
import { PEOPLE, SALES_TEAMS, TODAY_ISO, groupOf, person, thDate } from '../data/mock'
import { TARGET_LABEL } from '../domain/executive'
import { KR_GOALS, addMonths, monthLabel, okrReport, smUnit, teamUnit, type KeyResult, type UnitDef } from '../domain/okr'
import { notify, scope, session, smTargets } from '../store'
import { baht, okrPdf, okrXlsx } from '../components/reports/okrExport'
import { saveFile } from '../lib/save'

const me = computed(() => person(session.userId))
const isSm = computed(() => session.role === 'sm')
const myGroup = computed(() => (session.role === 'head' && me.value?.team ? groupOf(me.value.team) : undefined))
const teams = computed(() => SALES_TEAMS.filter((t) => t.active !== false && (!myGroup.value || groupOf(t.code) === myGroup.value)))
const sms = computed(() => PEOPLE.filter((u) => u.role === 'sm' && (!myGroup.value || groupOf(u.team ?? '') === myGroup.value)))
const by = ref<'team' | 'sm'>('team')
const months = computed(() => Array.from({ length: 12 }, (_, i) => addMonths(TODAY_ISO.slice(0, 7), -i)))
const month = ref(TODAY_ISO.slice(0, 7))

const defs = computed<UnitDef[]>(() => {
  if (isSm.value) return [smUnit(session.userId, me.value?.name ?? '', me.value?.team, smTargets[session.userId] ?? 0)]
  if (by.value === 'sm') return sms.value.map((u) => smUnit(u.id, u.name, u.team, smTargets[u.id] ?? 0))
  return teams.value.map((t) => teamUnit(t, Math.max(1, PEOPLE.filter((u) => u.role === 'sm' && u.team === t.code).length)))
})
const scopeName = computed(() => (isSm.value ? `${me.value?.name} · ${me.value?.team}` : myGroup.value ? scope.value.label : 'ทุกทีม DT'))
const report = computed(() => okrReport(defs.value, scope.value.list, month.value, TODAY_ISO, { key: 'all', name: 'รวม', target: defs.value.reduce((s, d) => s + d.target, 0) }))
const t = computed(() => report.value.total)
const noTarget = computed(() => !t.value.target)
const krValue = (k: KeyResult, v: number) => (k.unit === 'baht' ? baht(v) : k.unit === 'pct' ? `${Math.round(v * 100)}%` : k.unit === 'x' ? (v >= 9.99 ? 'ครอบคลุมแล้ว' : `${v.toFixed(2)} เท่า`) : `${v} โครงการ`)
const KR_LABEL = { ok: 'บรรลุ', warn: 'ใกล้เป้า', bad: 'ต่ำกว่าเป้า' }
const toneOf = (s: string) => (s === 'ok' || s === 'ontrack' ? 'win' : s === 'warn' || s === 'atrisk' ? 'warn' : 'lose')
const maxMonth = computed(() => Math.max(1, ...t.value.monthly))
const curM = computed(() => Number(month.value.slice(5, 7)))
const KIND = { new: 'โครงการใหม่', won: 'Close Win', lost: 'Close Lose', stage: 'เปลี่ยนสถานะ' }
const kindTone = { new: 'presale', won: 'win', lost: 'lose', stage: '' }

const busy = ref<'' | 'xlsx' | 'pdf'>('')
const meta = () => ({ scope: scopeName.value, by: me.value?.name ?? '', today: TODAY_ISO, projects: scope.value.list.filter((p) => defs.value.some((d) => d.share(p) > 0)) })
const fileBase = computed(() => `OKR_${(isSm.value ? me.value?.name ?? 'SM' : myGroup.value ?? 'DT').replace(/\W+/g, '')}_${month.value}`)
async function exportXlsx() {
  busy.value = 'xlsx'
  try { report_(await saveFile(`${fileBase.value}.xlsx`, okrXlsx(report.value, meta())), 'Excel') } finally { busy.value = '' }
}
const pdf = ref<{ blob: Blob; previews: string[] } | null>(null)
async function makePdf() {
  busy.value = 'pdf'
  try { pdf.value = await okrPdf(report.value, meta()) } catch { notify('สร้าง PDF ไม่สำเร็จ ลองอีกครั้ง') } finally { busy.value = '' }
}
async function savePdf() { if (pdf.value) report_(await saveFile(`${fileBase.value}.pdf`, pdf.value.blob), 'PDF') }
function report_(o: string, kind: string) {
  notify(o === 'saved' ? `บันทึกไฟล์ ${kind} แล้ว` : o === 'declined' ? `ยกเลิกการบันทึก ${kind}` : `บันทึกไฟล์ ${kind} ไม่ได้ในหน้านี้ — ลองเปิดเว็บในเบราว์เซอร์`)
}
</script>

<template>
  <div class="page">
    <PageHeader module="Sales · ก่อนขาย" title="OKR Report" :scope="scopeName" :subtitle="`สรุปยอดหาโครงการเทียบเป้า สำหรับประชุม OKR ประจำเดือน · ข้อมูล ณ ${thDate(report.asOf)}`">
      <button class="btn" :disabled="!!busy" @click="exportXlsx">{{ busy === 'xlsx' ? 'กำลังสร้าง…' : 'Export Excel' }}</button>
      <button class="btn primary" :disabled="!!busy" @click="makePdf">{{ busy === 'pdf' ? 'กำลังสร้าง…' : 'Export PDF' }}</button>
    </PageHeader>

    <div class="bar">
      <div class="field inline"><label for="okr-m">เดือน</label>
        <select id="okr-m" v-model="month" class="input"><option v-for="m in months" :key="m" :value="m">{{ monthLabel(m) }}</option></select></div>
      <div v-if="!isSm" class="seg" role="radiogroup" aria-label="สรุปตาม">
        <button role="radio" :aria-checked="by === 'team'" @click="by = 'team'">ตามทีม ({{ teams.length }})</button>
        <button role="radio" :aria-checked="by === 'sm'" @click="by = 'sm'">ตาม SM ({{ sms.length }})</button>
      </div>
      <span class="muted small">KR: Coverage ≥ {{ KR_GOALS.coverage }} เท่า · โครงการใหม่ {{ KR_GOALS.newOppPerMonth }} โครงการ/SM/เดือน · Win rate ≥ {{ KR_GOALS.winRate * 100 }}%</span>
    </div>

    <p v-if="noTarget" class="callout warn">ยังไม่ได้ตั้งเป้ายอดขาย — <router-link v-if="isSm" to="/">ตั้งเป้าที่ SM Dashboard</router-link><span v-else>SM ในหน่วยนี้ยังไม่ได้ตั้งเป้า</span> เพื่อให้รายงานคำนวณ % ของเป้าได้</p>

    <section class="objective">
      <span class="ol">Objective</span>
      <h2>{{ report.objective }}</h2>
    </section>

    <section class="krs">
      <article v-for="(k, i) in t.krs" :key="k.key" class="panel kr">
        <header><span class="muted small">KR{{ i + 1 }}</span><span class="chip" :class="toneOf(k.status)">{{ KR_LABEL[k.status] }}</span></header>
        <p class="kl">{{ k.label }}</p>
        <strong class="num kv">{{ krValue(k, k.actual) }}</strong>
        <span class="muted small">เป้า {{ krValue(k, k.goal) }}</span>
        <div class="meter" role="meter" :aria-valuenow="Math.round(k.score * 100)" aria-valuemin="0" aria-valuemax="100" :aria-label="k.label"><i :class="toneOf(k.status)" :style="{ width: Math.min(100, k.score * 100) + '%' }" /></div>
      </article>
    </section>

    <section class="panel prog">
      <div class="ph"><h2>ยอด Close Win สะสมเทียบเป้าทั้งปี</h2><span class="chip" :class="toneOf(t.status)">{{ TARGET_LABEL[t.status] }}</span></div>
      <p><strong class="num big">{{ baht(t.wonYtd) }}</strong> <span class="muted">จากเป้า {{ baht(t.target) }} · {{ Math.round(t.pct * 100) }}% · ยังขาด {{ baht(t.gap) }} · Pipeline ถ่วงน้ำหนัก {{ baht(t.weighted) }}</span></p>
      <div class="track"><i :class="toneOf(t.status)" :style="{ width: Math.min(100, t.pct * 100) + '%' }" /><b v-if="t.target" class="pace" :style="{ left: Math.min(100, (t.pace / t.target) * 100) + '%' }" :title="`ควรถึง ${baht(t.pace)} ณ วันนี้`" /></div>
      <p class="small muted">เส้นดำ = ยอดที่ควรถึง ณ {{ thDate(report.asOf) }} ({{ baht(t.pace) }}) ถ้าขายเท่ากันทุกเดือน</p>
      <h3 class="sub">Close Win รายเดือน</h3>
      <div class="months" role="img" :aria-label="`Close Win รายเดือน ยอดสะสม ${baht(t.wonYtd)}`">
        <div v-for="(v, i) in t.monthly" :key="i" class="mcol" :class="{ cur: i + 1 === curM, future: i + 1 > curM }">
          <span class="mv small">{{ v ? baht(v) : '' }}</span>
          <i :style="{ height: (v / maxMonth) * 100 + '%' }" />
          <span class="ml small">{{ ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][i] }}</span>
        </div>
      </div>
    </section>

    <section v-if="report.units.length > 1" class="panel">
      <div class="ph"><h2>ผล{{ by === 'team' ? 'รายทีม' : 'ราย SM' }}</h2></div>
      <div class="tw"><table class="tbl">
        <thead><tr><th>{{ by === 'team' ? 'ทีม' : 'SM' }}</th><th class="r">เป้าทั้งปี</th><th class="r">Close Win สะสม</th><th class="r">% เป้า</th><th class="r">เดือนนี้</th><th class="r">ยังขาด</th><th class="r">ถ่วงน้ำหนัก</th><th class="r">Coverage</th><th class="r">ใหม่</th><th class="r">Win rate</th><th>สถานะ</th></tr></thead>
        <tbody>
          <tr v-for="u in report.units" :key="u.key">
            <td><b>{{ u.name }}</b><span class="small muted d">{{ u.sub }}</span></td>
            <td class="r num">{{ baht(u.target) }}</td><td class="r num">{{ baht(u.wonYtd) }}</td>
            <td class="r num"><span class="mini"><i :class="toneOf(u.status)" :style="{ width: Math.min(100, u.pct * 100) + '%' }" /></span>{{ Math.round(u.pct * 100) }}%</td>
            <td class="r num">{{ baht(u.wonMonth) }}</td><td class="r num">{{ baht(u.gap) }}</td><td class="r num">{{ baht(u.weighted) }}</td>
            <td class="r num">{{ u.coverage >= 9.99 ? '—' : u.coverage.toFixed(2) + 'x' }}</td><td class="r num">{{ u.newOpp }}</td>
            <td class="r num">{{ u.winRate === null ? '—' : Math.round(u.winRate * 100) + '%' }}</td>
            <td><span class="chip" :class="toneOf(u.status)">{{ TARGET_LABEL[u.status] }}</span></td>
          </tr>
        </tbody>
        <tfoot><tr><td><b>รวม</b></td><td class="r num">{{ baht(t.target) }}</td><td class="r num">{{ baht(t.wonYtd) }}</td><td class="r num">{{ Math.round(t.pct * 100) }}%</td><td class="r num">{{ baht(t.wonMonth) }}</td><td class="r num">{{ baht(t.gap) }}</td><td class="r num">{{ baht(t.weighted) }}</td><td class="r num">{{ t.coverage >= 9.99 ? '—' : t.coverage.toFixed(2) + 'x' }}</td><td class="r num">{{ t.newOpp }}</td><td class="r num">{{ t.winRate === null ? '—' : Math.round(t.winRate * 100) + '%' }}</td><td /></tr></tfoot>
      </table></div>
    </section>

    <div class="two">
      <section class="panel">
        <div class="ph"><h2>ความเคลื่อนไหวเดือน {{ report.label }}</h2><span class="muted small">{{ report.movements.length }} รายการ</span></div>
        <ul v-if="report.movements.length" class="list">
          <li v-for="(m, i) in report.movements" :key="i">
            <span class="chip" :class="kindTone[m.kind]">{{ KIND[m.kind] }}</span>
            <span class="lt"><router-link :to="`/projects/${m.p.id}`">{{ m.p.name }}</router-link><span class="small muted"> · {{ thDate(m.day) }} · {{ m.note }}</span></span>
            <b class="num">{{ baht(m.value) }}</b>
          </li>
        </ul>
        <p v-else class="muted small">ไม่มีความเคลื่อนไหวในเดือนนี้</p>
      </section>
      <section class="panel">
        <div class="ph"><h2>คาดว่าจะปิดใน 3 เดือนข้างหน้า</h2><span class="muted small">ถ่วงน้ำหนัก {{ baht(report.nextClose.reduce((s, x) => s + x.weighted, 0)) }}</span></div>
        <ul v-if="report.nextClose.length" class="list">
          <li v-for="x in report.nextClose" :key="x.p.id">
            <StageBadge :stage="x.p.stage" />
            <span class="lt"><router-link :to="`/projects/${x.p.id}`">{{ x.p.name }}</router-link><span class="small muted"> · คาดปิด {{ thDate(x.day) }} · {{ x.p.nextStep }}</span></span>
            <b class="num">{{ baht(x.value) }}</b>
          </li>
        </ul>
        <p v-else class="muted small">ไม่มีโครงการที่กำหนดวันคาดปิดในช่วงนี้ — กำหนด Expected Close ในหน้าโครงการ</p>
      </section>
      <section class="panel">
        <div class="ph"><h2>เหตุผลที่ไม่ได้งาน (ปีนี้)</h2></div>
        <ul v-if="report.losses.length" class="list"><li v-for="l in report.losses" :key="l.reason"><span class="lt">{{ l.reason }}</span><span class="small muted">{{ l.count }} โครงการ</span><b class="num">{{ baht(l.value) }}</b></li></ul>
        <p v-else class="muted small">ไม่มีโครงการที่แพ้ในปีนี้</p>
      </section>
      <section class="panel">
        <div class="ph"><h2>โครงการค้างนานเกินเกณฑ์</h2></div>
        <ul v-if="report.stalled.length" class="list"><li v-for="x in report.stalled" :key="x.p.id"><StageBadge :stage="x.p.stage" /><span class="lt"><router-link :to="`/projects/${x.p.id}`">{{ x.p.name }}</router-link></span><b class="num">{{ x.days }} วัน</b></li></ul>
        <p v-else class="muted small">ไม่มีโครงการค้างนาน</p>
      </section>
    </div>

    <Dialog :open="!!pdf" :title="`ตัวอย่าง PDF · ${pdf?.previews.length ?? 0} หน้า`" wide @close="pdf = null">
      <div class="pv"><img v-for="(src, i) in pdf?.previews ?? []" :key="i" :src="src" :alt="`หน้า ${i + 1}`" /></div>
      <template #foot><button class="btn" @click="pdf = null">ปิด</button><button class="btn primary" @click="savePdf">ดาวน์โหลด PDF</button></template>
    </Dialog>
  </div>
</template>

<style scoped>
.bar { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; margin-bottom: 16px; }
.inline { display: flex; align-items: center; gap: 8px; }
.inline select { width: auto; min-width: 140px; }
.callout { padding: 10px 14px; border-radius: var(--r-sm); margin: 0 0 16px; }
.callout.warn { background: var(--warn-soft); color: var(--warn); }
.objective { background: var(--ink); color: var(--on-ink); border-radius: var(--r-lg, 16px); padding: 18px 24px; margin-bottom: 16px; }
.objective .ol { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.7; }
.objective h2 { font-size: 20px; margin-top: 4px; }
.krs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
.kr { display: grid; gap: 4px; align-content: start; }
.kr header { display: flex; justify-content: space-between; align-items: center; }
.kl { margin: 4px 0 6px; font-size: 14px; color: var(--ink-2); min-height: 40px; }
.kv { font-size: 26px; }
.meter, .track, .mini { background: var(--sunken); border-radius: 99px; overflow: hidden; position: relative; }
.meter { height: 8px; margin-top: 8px; }
.meter i, .track i, .mini i { display: block; height: 100%; border-radius: 99px; background: var(--muted); }
i.win { background: var(--win); } i.warn { background: var(--warn); } i.lose { background: var(--lose); }
.prog { margin-bottom: 16px; }
.ph { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 10px; }
.ph h2 { font-size: 17px; }
.big { font-size: 30px; }
.track { height: 14px; overflow: visible; margin: 8px 0 6px; }
.pace { position: absolute; top: -6px; width: 3px; height: 26px; background: var(--ink); border-radius: 2px; transform: translateX(-1px); }
.sub { font-size: 15px; margin: 18px 0 8px; }
.months { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 6px; height: 180px; align-items: end; }
.mcol { display: grid; grid-template-rows: 20px 1fr 20px; height: 100%; justify-items: center; align-items: end; }
.mcol i { width: 60%; min-height: 2px; background: var(--line-strong); border-radius: 4px 4px 0 0; }
.mcol.cur i { background: var(--brand); } .mcol.future { opacity: 0.45; }
.mv { color: var(--ink-2); white-space: nowrap; font-size: 11px; }
.ml { color: var(--muted); }
.mcol.cur .ml { color: var(--ink); font-weight: 600; }
.tw { overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; min-width: 900px; }
.tbl th { text-align: left; font-size: 13px; font-weight: 500; color: var(--muted); padding: 8px 10px; border-bottom: 1px solid var(--line); white-space: nowrap; }
.tbl td { padding: 10px; border-bottom: 1px solid var(--line); vertical-align: middle; }
.tbl tfoot td { font-weight: 600; border-bottom: 0; border-top: 2px solid var(--line-strong); }
.r { text-align: right; }
.d { display: block; }
.mini { display: inline-block; width: 48px; height: 6px; margin-right: 8px; vertical-align: middle; }
.two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
.list { list-style: none; margin: 0; padding: 0; display: grid; }
.list li { display: flex; gap: 10px; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--line); }
.list li:last-child { border-bottom: 0; }
.lt { flex: 1; min-width: 0; }
.pv { display: grid; gap: 12px; }
.pv img { width: 100%; border: 1px solid var(--line); border-radius: 8px; }
@media (max-width: 1100px) { .krs { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 760px) { .two { grid-template-columns: 1fr; } .months { height: 140px; } .mv { display: none; } }
@media (max-width: 480px) { .krs { grid-template-columns: 1fr; } .big { font-size: 24px; } }
</style>
