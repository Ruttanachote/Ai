<script setup lang="ts">
// Central calendar (C-05): every dated event the role can see — holidays, leave, meetings,
// installment due dates, PM rounds, bid results, quotation expiry and warranty ends.
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
import { person, thDate, TODAY_ISO } from '../data/mock'
import { MEETING_KINDS } from '../data/model'
import { TH_GOV_2026 } from '../domain/calendar'
import { addDays } from '../domain/work'
import { leaves, scope, session } from '../store'

type Kind = 'holiday' | 'leave' | 'meeting' | 'milestone' | 'pm' | 'bid' | 'quote' | 'warranty'
const KINDS: Record<Kind, { l: string; tone: string }> = {
  holiday: { l: 'วันหยุด', tone: 'idle' }, leave: { l: 'ลา', tone: 'lose' }, meeting: { l: 'ประชุม', tone: 'presale' }, milestone: { l: 'ส่งงวดงาน', tone: 'win' },
  pm: { l: 'รอบ PM', tone: 'post' }, bid: { l: 'ประกาศผลประมูล', tone: 'warn' }, quote: { l: 'ใบเสนอราคาหมดอายุ', tone: 'warn' }, warranty: { l: 'หมดประกัน', tone: 'lose' },
}
// Who sees which kind: SM does not see the team's leave; bid results and quotation expiry
// are sales follow-ups, so only SM and PM see them.
const HIDE: Partial<Record<Kind, string[]>> = { leave: ['sm'] }
const ONLY: Partial<Record<Kind, string[]>> = { bid: ['sm', 'pm'], quote: ['sm', 'pm'] }
const visible = (k: Kind) => !HIDE[k]?.includes(session.role) && (!ONLY[k] || ONLY[k]!.includes(session.role))
const kinds = computed(() => (Object.keys(KINDS) as Kind[]).filter(visible))
const on = reactive<Record<Kind, boolean>>({ holiday: true, leave: true, meeting: true, milestone: true, pm: true, bid: true, quote: true, warranty: true })
const router = useRouter()

const events = computed(() => {
  const out: { day: string; kind: Kind; text: string; link?: string }[] = []
  for (const d of TH_GOV_2026.holidays) out.push({ day: d, kind: 'holiday', text: 'วันหยุดราชการ' })
  for (const l of leaves.filter((x) => x.status === 'active'))
    for (let d = l.from; d <= l.to; d = addDays(d, 1)) out.push({ day: d, kind: 'leave', text: `${person(l.who)?.name}${l.part !== 'full' ? (l.part === 'am' ? ' (เช้า)' : ' (บ่าย)') : ''}`, link: '/my-work' })
  for (const p of scope.value.list) {
    const link = `/projects/${p.id}`
    for (const m of p.meetings ?? []) out.push({ day: m.date, kind: 'meeting', text: `${m.time} ${MEETING_KINDS[m.kind]} · ${p.name}`, link })
    for (const m of p.milestones ?? []) if (!m.acceptance) out.push({ day: m.end, kind: 'milestone', text: `${m.name} · ${p.name}`, link })
    for (const r of p.pmRounds ?? []) if (r.status !== 'sent') out.push({ day: r.due, kind: 'pm', text: `PM รอบ ${r.no} · ${p.name}`, link })
    if (p.bid?.resultDue && !p.bid.result) out.push({ day: p.bid.resultDue, kind: 'bid', text: p.name, link })
    if (p.approval?.validUntil && ['pipeline', 'forecast', 'rebidding'].includes(p.stage)) out.push({ day: p.approval.validUntil, kind: 'quote', text: p.name, link })
    if (p.endWarranty && p.stage === 'warranty') out.push({ day: p.endWarranty, kind: 'warranty', text: p.name, link })
  }
  return out.filter((e) => visible(e.kind) && on[e.kind])
})
const month = ref(TODAY_ISO.slice(0, 7))
const grid = computed(() => {
  const first = new Date(month.value + '-01T00:00:00Z')
  const start = addDays(month.value + '-01', -((first.getUTCDay() + 6) % 7))
  return Array.from({ length: 42 }, (_, i) => { const d = addDays(start, i); return { d, inMonth: d.startsWith(month.value), ev: events.value.filter((e) => e.day === d) } })
})
const label = computed(() => new Date(month.value + '-01T00:00:00Z').toLocaleDateString('th-TH', { month: 'long', year: 'numeric', timeZone: 'UTC' }))
function shift(n: number) { const d = new Date(month.value + '-01T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + n); month.value = d.toISOString().slice(0, 7) }
const upcoming = computed(() => events.value.filter((e) => e.day >= TODAY_ISO && e.day <= addDays(TODAY_ISO, 14) && e.kind !== 'holiday').sort((a, b) => a.day.localeCompare(b.day)))
</script>

<template>
  <div class="page">
    <PageHeader module="My Work · งานของฉัน" title="Calendar" :scope="scope.label" :subtitle="`ปฏิทินกลาง — ${kinds.map((k) => KINDS[k].l).join(' · ')}`" />
    <div class="filters">
      <label v-for="key in kinds" :key="key" class="f" :class="KINDS[key].tone"><input v-model="on[key]" type="checkbox" /> {{ KINDS[key].l }}</label>
    </div>
    <div class="layout">
      <section class="panel cal">
        <header><button class="btn sm ghost" aria-label="เดือนก่อน" @click="shift(-1)">‹</button><h2>{{ label }}</h2><button class="btn sm ghost" aria-label="เดือนถัดไป" @click="shift(1)">›</button><button class="btn sm" @click="month = TODAY_ISO.slice(0, 7)">เดือนนี้</button></header>
        <div class="dow"><span v-for="d in ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.']" :key="d">{{ d }}</span></div>
        <div class="grid">
          <div v-for="c in grid" :key="c.d" class="day" :class="{ out: !c.inMonth, today: c.d === TODAY_ISO }">
            <span class="n">{{ Number(c.d.slice(8)) }}</span>
            <button v-for="(e, i) in c.ev.slice(0, 4)" :key="i" class="ev" :class="KINDS[e.kind].tone" :title="`${KINDS[e.kind].l}: ${e.text}`" @click="e.link && router.push(e.link)">{{ e.kind === 'holiday' ? e.text : KINDS[e.kind].l + ' · ' + e.text }}</button>
            <span v-if="c.ev.length > 4" class="more">+{{ c.ev.length - 4 }}</span>
          </div>
        </div>
      </section>
      <aside class="panel"><h3>14 วันข้างหน้า</h3>
        <ul class="up"><li v-for="(e, i) in upcoming" :key="i"><b>{{ thDate(e.day) }}</b><span class="chip" :class="KINDS[e.kind].tone">{{ KINDS[e.kind].l }}</span><span class="small">{{ e.text }}</span></li>
          <li v-if="!upcoming.length" class="muted small">ไม่มีเหตุการณ์</li></ul></aside>
    </div>
  </div>
</template>

<style scoped>
.filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.f { display: inline-flex; gap: 6px; align-items: center; font-size: 13px; padding: 4px 10px; border-radius: 99px; background: var(--surface); border: 1px solid var(--line); cursor: pointer; }
.layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 16px; align-items: start; }
.cal header { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
.cal header { flex-wrap: wrap; }
.cal header .btn.ghost { min-width: 40px; }
.cal header h2 { font-size: 18px; min-width: 0; flex: 0 1 auto; text-align: center; }
.dow, .grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
.dow span { font-size: 12px; color: var(--muted); text-align: center; }
.day { min-height: 108px; border: 1px solid var(--line); border-radius: 8px; padding: 4px; display: grid; align-content: start; gap: 2px; background: var(--surface); }
.day.out { opacity: 0.45; }
.day.today { border-color: var(--primary); box-shadow: inset 0 0 0 1px var(--primary); }
.n { font-size: 12px; font-weight: 600; }
.ev { border: 0; text-align: left; font: 11px var(--font); padding: 1px 5px; border-radius: 4px; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; background: var(--idle-soft); color: var(--ink-2); }
.ev.lose { background: var(--lose-soft); color: var(--lose); } .ev.presale { background: var(--presale-soft); color: var(--presale); }
.ev.win { background: var(--win-soft); color: var(--win); } .ev.post { background: var(--post-soft); color: var(--post); } .ev.warn { background: var(--warn-soft); color: var(--warn); }
.more { font-size: 12px; color: var(--muted); }
.up { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 8px; }
.up li { display: grid; gap: 2px; }
@media (max-width: 1000px) { .layout { grid-template-columns: 1fr; } .day { min-height: 72px; } .ev { font-size: 12px; } }
/* Phones: day cells are ~40px wide, so events become colour bars; the 14-day list below carries the text. */
@media (max-width: 560px) { .cal { padding: 12px; } .dow, .grid { gap: 2px; } .day { min-height: 56px; padding: 3px; border-radius: 6px; } .ev { font-size: 0; height: 6px; padding: 0; pointer-events: none; } .more { font-size: 10px; } }
</style>
