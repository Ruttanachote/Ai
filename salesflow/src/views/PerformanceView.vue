<script setup lang="ts">
// My Performance (T-08): one person's month — logged hours against the working-day target, OT,
// tasks finished and on-time rate, hours per project. Team heads can look at their team.
import { computed, ref } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import KpiStrip from '../components/KpiStrip.vue'
import { PEOPLE, groupOf, person, thDate, TODAY_ISO } from '../data/mock'
import { projects, session, SETTINGS } from '../store'
import { isWorkday } from '../domain/calendar'
import { addDays, typeOf } from '../domain/work'
import { dayHours } from '../domain/timesheet'
import { doneDay } from '../domain/workflow'

const canPick = computed(() => ['head', 'admin', 'pmo'].includes(session.role))
const people = computed(() => PEOPLE.filter((u) => u.role === 'dev' || u.role === 'pm').filter((u) => session.role !== 'head' || groupOf(u.team ?? '') === groupOf(person(session.userId)?.team ?? '')))
const who = ref(session.userId)
const month = ref(TODAY_ISO.slice(0, 7))
const days = computed(() => {
  const out: string[] = []
  for (let d = month.value + '-01'; d.startsWith(month.value); d = addDays(d, 1)) out.push(d)
  return out
})
const logs = computed(() => projects.flatMap((p) => (p.tasks ?? []).flatMap((t) => (t.worklogs ?? []).filter((w) => w.who === who.value && w.day.startsWith(month.value)).map((w) => ({ ...w, p })))))
const daily = computed(() => days.value.map((d) => ({ d, work: isWorkday(d), normal: logs.value.filter((l) => l.day === d && !l.overtime).reduce((s, l) => s + l.hours, 0), ot: logs.value.filter((l) => l.day === d && l.overtime).reduce((s, l) => s + l.hours, 0) })))
const target = computed(() => daily.value.filter((x) => x.work && x.d <= TODAY_ISO).length * dayHours(SETTINGS.hours))
const normal = computed(() => daily.value.reduce((s, x) => s + x.normal, 0))
const ot = computed(() => daily.value.reduce((s, x) => s + x.ot, 0))
const otReq = computed(() => projects.flatMap((p) => (p.ot ?? []).filter((o) => o.who === who.value)))
const finished = computed(() => projects.flatMap((p) => (p.tasks ?? []).filter((t) => typeOf(t) !== 'epic' && (t.assignee === who.value) && t.status === 'done').map((t) => ({ t, d: doneDay(p, t) }))).filter((x) => x.d?.startsWith(month.value)))
const onTime = computed(() => (finished.value.length ? Math.round((finished.value.filter((x) => !x.t.due || x.d! <= x.t.due).length / finished.value.length) * 100) : null))
const perProject = computed(() => [...new Set(logs.value.map((l) => l.p.id))].map((id) => { const ls = logs.value.filter((l) => l.p.id === id); return { name: ls[0].p.name, h: ls.reduce((s, l) => s + l.hours, 0) } }).sort((a, b) => b.h - a.h))
const kpis = computed(() => [
  { label: 'ชั่วโมงปกติ', value: `${normal.value}`, note: `เป้าถึงวันนี้ ${target.value} ชม.`, tone: normal.value < target.value ? ('warn' as const) : ('' as const) },
  { label: 'OT', value: `${ot.value} ชม.`, note: `คำขอ ${otReq.value.length} · อนุมัติ ${otReq.value.filter((o) => o.status === 'approved').length}` },
  { label: 'งานที่เสร็จเดือนนี้', value: String(finished.value.length), note: 'ที่ได้รับมอบหมาย' },
  { label: 'เสร็จตรงเวลา', value: onTime.value === null ? '—' : onTime.value + '%', note: 'เทียบกำหนดเสร็จ', tone: onTime.value !== null && onTime.value < 80 ? ('warn' as const) : ('' as const) },
])
const maxH = computed(() => Math.max(10, ...daily.value.map((x) => x.normal + x.ot)))
</script>

<template>
  <div class="page">
    <PageHeader module="My Work · งานของฉัน" title="My Performance" :scope="person(who)?.name + (person(who)?.position ? ' · ' + person(who)?.position : '')" subtitle="เห็นเฉพาะตัวเองและหัวหน้าทีม — ชั่วโมงทำงาน OT และงานที่เสร็จ">
      <select v-if="canPick" v-model="who" class="input pick" aria-label="เลือกคน"><option v-for="u in people" :key="u.id" :value="u.id">{{ u.name }} · {{ u.position ?? 'PM' }}</option></select>
      <input v-model="month" type="month" class="input pick" aria-label="เดือน" />
    </PageHeader>
    <KpiStrip :items="kpis" />
    <section class="panel">
      <h3>ชั่วโมงรายวัน · {{ month }}</h3>
      <div class="chart" role="img" aria-label="ชั่วโมงรายวัน">
        <div v-for="x in daily" :key="x.d" class="col" :class="{ off: !x.work, short: x.work && x.d < TODAY_ISO && x.normal < dayHours(SETTINGS.hours) }" :title="`${thDate(x.d)} · ${x.normal} ชม.${x.ot ? ' + OT ' + x.ot : ''}`">
          <span class="ot" :style="{ height: (x.ot / maxH) * 140 + 'px' }" /><span class="n" :style="{ height: (x.normal / maxH) * 140 + 'px' }" /><em>{{ Number(x.d.slice(8)) }}</em>
        </div>
        <i class="line" :style="{ bottom: 18 + (dayHours(SETTINGS.hours) / maxH) * 140 + 'px' }" />
      </div>
      <p class="small muted legend"><i class="n" /> ชั่วโมงปกติ <i class="ot" /> OT · เส้นประ = {{ dayHours(SETTINGS.hours) }} ชม./วัน · ช่องจาง = วันหยุด</p>
    </section>
    <div class="two">
      <section class="panel"><h3>ชั่วโมงตามโครงการ</h3>
        <ul class="pp"><li v-for="x in perProject" :key="x.name"><span>{{ x.name }}</span><b class="num">{{ x.h }} ชม.</b></li><li v-if="!perProject.length" class="muted small">ยังไม่มีการบันทึกเวลาเดือนนี้</li></ul></section>
      <section class="panel"><h3>งานที่เสร็จ</h3>
        <ul class="pp"><li v-for="x in finished" :key="x.t.id"><span>{{ x.t.key }} {{ x.t.title }}</span><span class="small" :class="x.t.due && x.d! > x.t.due ? 'bad' : 'ok'">{{ thDate(x.d) }}{{ x.t.due && x.d! > x.t.due ? ' (ช้า)' : '' }}</span></li><li v-if="!finished.length" class="muted small">ยังไม่มีงานที่เสร็จเดือนนี้</li></ul></section>
    </div>
  </div>
</template>

<style scoped>
.pick { width: auto; min-height: 36px; }
.chart { position: relative; display: flex; gap: 4px; align-items: flex-end; height: 180px; padding-top: 10px; margin-top: 10px; overflow-x: auto; }
.col { flex: 1; min-width: 16px; display: flex; flex-direction: column; justify-content: flex-end; align-items: stretch; height: 100%; }
.col .n { background: var(--win); border-radius: 3px 3px 0 0; }
.col .ot { background: var(--warn); }
.col em { font-style: normal; font-size: 12px; color: var(--muted); text-align: center; height: 18px; line-height: 18px; }
.col.off { opacity: 0.4; }
.col.short em { color: var(--lose); font-weight: 600; }
.line { position: absolute; left: 0; right: 0; border-top: 1px dashed var(--faint); }
.legend { display: flex; gap: 6px; align-items: center; margin-top: 6px; }
.legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-left: 8px; }
.legend .n { background: var(--win); } .legend .ot { background: var(--warn); }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
.pp { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 6px; font-size: 14px; }
.pp li { display: flex; justify-content: space-between; gap: 10px; }
.bad { color: var(--lose); } .ok { color: var(--win); }
@media (max-width: 760px) { .two { grid-template-columns: 1fr; } }
</style>
