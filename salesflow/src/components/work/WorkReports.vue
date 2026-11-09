<script setup lang="ts">
import { computed, ref } from 'vue'
import Avatar from '../Avatar.vue'
import { baht, person, thDate, TODAY_ISO } from '../../data/mock'
import type { Project } from '../../data/model'
import { typeOf } from '../../domain/work'
import { burndown, sizeOf, statusOf, velocity, workflowOf } from '../../domain/workflow'

// Reports for the PM: sprint burndown + velocity (Scrum), contract milestones driven by epics
// (ตามงวดงาน), and time/OT per member for every template.
const props = defineProps<{ p: Project }>()
const unit = computed(() => (props.p.workspace?.estimate === 'points' ? 'pts' : 'ชม.'))
const sprints = computed(() => props.p.workspace?.sprints ?? [])
const pick = ref(sprints.value.find((s) => s.state === 'active')?.id ?? sprints.value.find((s) => s.state !== 'planned')?.id ?? '')
const sprint = computed(() => sprints.value.find((s) => s.id === pick.value))
const bd = computed(() => (sprint.value ? burndown(props.p, sprint.value, TODAY_ISO) : undefined))
const W = 640, H = 220, PAD = 32
const sx = (i: number) => PAD + (i * (W - PAD * 2)) / Math.max(1, (bd.value?.points.length ?? 1) - 1)
const sy = (v: number) => H - PAD - (v / Math.max(1, bd.value?.total ?? 1)) * (H - PAD * 2)
const idealPath = computed(() => bd.value?.points.map((pt, i) => `${i ? 'L' : 'M'}${sx(i)},${sy(pt.ideal)}`).join(' ') ?? '')
const realPath = computed(() => bd.value?.points.filter((pt) => pt.remaining !== undefined).map((pt, i) => `${i ? 'L' : 'M'}${sx(i)},${sy(pt.remaining!)}`).join(' ') ?? '')
const last = computed(() => bd.value?.points.filter((pt) => pt.remaining !== undefined).at(-1))
const onTrack = computed(() => !!last.value && last.value.remaining! <= last.value.ideal)

const vel = computed(() => velocity(props.p))
const vmax = computed(() => Math.max(1, ...vel.value.flatMap((v) => [v.committed, v.completed])))

const sprintItems = computed(() => (props.p.tasks ?? []).filter((t) => t.sprint === pick.value && typeOf(t) !== 'epic'))
const byStatus = computed(() => workflowOf(props.p).statuses.map((s) => ({ s, n: sprintItems.value.filter((t) => statusOf(props.p, t).id === s.id).length })))

const milestones = computed(() => (props.p.milestones ?? []).map((m) => {
  const kids = (props.p.tasks ?? []).filter((t) => t.milestone === m.name && typeOf(t) !== 'epic')
  return { m, kids: kids.length, done: kids.filter((k) => k.status === 'done').length, late: kids.filter((k) => k.due && k.status !== 'done' && k.due < TODAY_ISO).length }
}))

// Time per member: estimate vs logged, OT from worklogs and requests.
const members = computed(() => {
  const ids = new Set<string>([...(props.p.workspace?.members ?? []).map((m) => m.userId), ...(props.p.tasks ?? []).map((t) => t.assignee).filter(Boolean)])
  return [...ids].map((id) => {
    const mine = (props.p.tasks ?? []).filter((t) => t.assignee === id && typeOf(t) !== 'epic')
    const logs = (props.p.tasks ?? []).flatMap((t) => (t.worklogs ?? []).filter((w) => w.who === id))
    const ot = (props.p.ot ?? []).filter((o) => o.who === id)
    return {
      id, open: mine.filter((t) => t.status !== 'done').length, size: mine.filter((t) => t.status !== 'done').reduce((s, t) => s + sizeOf(props.p, t), 0),
      est: mine.reduce((s, t) => s + (t.hours || 0), 0), spent: mine.reduce((s, t) => s + (t.spent || 0), 0),
      logged: logs.reduce((s, w) => s + w.hours, 0), otH: ot.reduce((s, o) => s + o.hours, 0), otPending: ot.filter((o) => o.status === 'pending').length,
    }
  }).filter((r) => r.est || r.open || r.otH)
})
const otTotal = computed(() => (props.p.ot ?? []).reduce((s, o) => s + o.amount, 0))
</script>

<template>
  <div class="rp">
    <template v-if="p.workspace?.template === 'scrum'">
      <section class="panel">
        <header class="hd">
          <div><h3>Burndown</h3><p class="small muted">งานคงเหลือ ({{ unit }}) เทียบเส้นอุดมคติ</p></div>
          <select v-model="pick" class="input mini" aria-label="เลือก Sprint"><option v-for="s in sprints.filter((x) => x.state !== 'planned')" :key="s.id" :value="s.id">{{ s.name }}</option></select>
        </header>
        <template v-if="bd && bd.total">
          <p class="verdict" :class="onTrack ? 'ok' : 'bad'">{{ onTrack ? 'ตามแผน' : 'ช้ากว่าแผน' }} — คงเหลือ {{ last?.remaining }} จาก {{ bd.total }} {{ unit }} · {{ sprint?.goal }}</p>
          <svg :viewBox="`0 0 ${W} ${H}`" class="chart" role="img" :aria-label="`Burndown ${sprint?.name}`">
            <line v-for="g in 4" :key="g" :x1="PAD" :x2="W - PAD" :y1="sy((bd.total * g) / 4)" :y2="sy((bd.total * g) / 4)" class="grid" />
            <line :x1="PAD" :x2="W - PAD" :y1="sy(0)" :y2="sy(0)" class="axis" />
            <text v-for="g in 4" :key="'t' + g" :x="PAD - 6" :y="sy((bd.total * g) / 4) + 4" class="tick" text-anchor="end">{{ Math.round((bd.total * g) / 4) }}</text>
            <text v-for="(pt, i) in bd.points" v-show="i % 2 === 0 || i === bd.points.length - 1" :key="pt.day" :x="sx(i)" :y="H - 10" class="tick" text-anchor="middle">{{ thDate(pt.day).split(' ').slice(0, 2).join(' ') }}</text>
            <path :d="idealPath" class="ideal" />
            <path :d="realPath" class="real" />
            <circle v-for="(pt, i) in bd.points.filter((x) => x.remaining !== undefined)" :key="'c' + i" :cx="sx(i)" :cy="sy(pt.remaining!)" r="3" class="dot"><title>{{ thDate(pt.day) }}: คงเหลือ {{ pt.remaining }} {{ unit }}</title></circle>
          </svg>
          <p class="legend small"><i class="li ideal" /> เส้นอุดมคติ <i class="li real" /> งานคงเหลือจริง</p>
        </template>
        <p v-else class="muted">ยังไม่มีงานที่ประมาณขนาดใน Sprint นี้</p>
        <div class="sts"><span v-for="x in byStatus" :key="x.s.id" class="small"><b>{{ x.n }}</b> {{ x.s.name }}</span></div>
      </section>

      <section class="panel">
        <header class="hd"><div><h3>Velocity</h3><p class="small muted">ตั้งใจ vs เสร็จจริงต่อ Sprint — ใช้วางแผนรอบถัดไป</p></div></header>
        <div v-if="vel.length" class="vel">
          <div v-for="v in vel" :key="v.name" class="vc">
            <div class="bars"><span class="b c" :style="{ height: (v.committed / vmax) * 140 + 'px' }" :title="`ตั้งใจ ${v.committed}`" /><span class="b d" :style="{ height: (v.completed / vmax) * 140 + 'px' }" :title="`เสร็จ ${v.completed}`" /></div>
            <span class="small">{{ v.name.replace(p.workspace?.key + ' ', '') }}</span><span class="small muted num">{{ v.completed }}/{{ v.committed }}</span>
          </div>
        </div>
        <p v-else class="muted">ยังไม่มี Sprint ที่ปิด</p>
        <p class="legend small"><i class="li c" /> ตั้งใจ <i class="li d" /> เสร็จจริง</p>
      </section>
    </template>

    <section v-if="p.milestones?.length" class="panel wide">
      <header class="hd"><div><h3>งวดงานตามสัญญา</h3><p class="small muted">ความคืบหน้าคำนวณจากงานใน Epic ของงวดนั้น — Epic เสร็จครบ = งวดพร้อมส่งมอบ</p></div></header>
      <table class="table">
        <thead><tr><th>งวดงาน</th><th>ช่วงเวลา</th><th class="r">งาน เสร็จ/ทั้งหมด</th><th class="r">เลยกำหนด</th><th>ความคืบหน้า</th><th class="r">มูลค่างวด</th><th>สถานะ</th></tr></thead>
        <tbody>
          <tr v-for="x in milestones" :key="x.m.name">
            <td>{{ x.m.name }}</td><td class="small muted">{{ thDate(x.m.start) }} – {{ thDate(x.m.end) }}</td>
            <td class="r num">{{ x.done }}/{{ x.kids }}</td><td class="r num" :class="{ bad: x.late }">{{ x.late || '—' }}</td>
            <td><span class="pg"><i :style="{ width: x.m.progress + '%' }" /></span> <span class="small num">{{ x.m.progress }}%</span></td>
            <td class="r num">{{ baht(x.m.payment ?? 0) }}</td>
            <td><span class="chip" :class="x.m.paid ? 'win' : x.m.state === 'delivered' ? 'presale' : ''">{{ x.m.paid ? 'รับเงินแล้ว' : x.m.state === 'delivered' ? 'ส่งมอบแล้ว' : 'วางแผน' }}</span></td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="panel wide">
      <header class="hd"><div><h3>เวลาและ OT ของทีม</h3><p class="small muted">ชั่วโมงประมาณ vs ใช้จริง และ OT ที่ขอจากการบันทึกเวลา — ค่า OT รวม {{ baht(otTotal) }}</p></div></header>
      <table class="table">
        <thead><tr><th>สมาชิก</th><th class="r">งานค้าง</th><th class="r">ขนาดค้าง ({{ unit }})</th><th class="r">ชม. ประมาณ</th><th class="r">ชม. ใช้</th><th>ใช้ / ประมาณ</th><th class="r">OT (ชม.)</th><th class="r">OT รออนุมัติ</th></tr></thead>
        <tbody>
          <tr v-for="r in members" :key="r.id">
            <td><span class="who"><Avatar :id="r.id" :size="24" />{{ person(r.id)?.name }}</span></td>
            <td class="r num">{{ r.open }}</td><td class="r num">{{ r.size }}</td><td class="r num">{{ r.est }}</td><td class="r num" :class="{ bad: r.spent > r.est && r.est }">{{ r.spent }}</td>
            <td><span class="pg" :class="{ over: r.spent > r.est }"><i :style="{ width: Math.min(100, r.est ? (r.spent / r.est) * 100 : 0) + '%' }" /></span></td>
            <td class="r num">{{ r.otH || '—' }}</td><td class="r num" :class="{ warn: r.otPending }">{{ r.otPending || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.rp { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 14px; }
.wide { grid-column: 1 / -1; }
.panel { overflow-x: auto; }
.hd { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
.input.mini { min-height: 32px; padding: 2px 8px; font-size: 13.5px; width: auto; }
.verdict { font-size: 13.5px; font-weight: 600; margin-bottom: 6px; }
.verdict.ok { color: var(--win); }
.verdict.bad { color: var(--lose); }
.chart { width: 100%; height: auto; }
.grid { stroke: var(--line); stroke-dasharray: 3 3; }
.axis { stroke: var(--line-strong); }
.tick { font-size: 10px; fill: var(--muted); }
.ideal { fill: none; stroke: var(--faint); stroke-width: 1.5; stroke-dasharray: 5 4; }
.real { fill: none; stroke: var(--presale); stroke-width: 2.5; }
.dot { fill: var(--presale); }
.legend { display: flex; gap: 6px; align-items: center; color: var(--muted); margin-top: 6px; }
.li { display: inline-block; width: 14px; height: 3px; margin-left: 8px; }
.li.ideal { border-top: 2px dashed var(--faint); height: 0; }
.li.real { background: var(--presale); }
.li.c { background: var(--line-strong); height: 10px; width: 10px; }
.li.d { background: var(--win); height: 10px; width: 10px; }
.sts { display: flex; gap: 14px; flex-wrap: wrap; border-top: 1px solid var(--line); padding-top: 10px; margin-top: 10px; color: var(--muted); }
.sts b { color: var(--ink); }
.vel { display: flex; gap: 22px; align-items: flex-end; min-height: 190px; padding: 10px 4px; }
.vc { display: grid; justify-items: center; gap: 4px; }
.bars { display: flex; gap: 4px; align-items: flex-end; height: 140px; }
.b { width: 22px; border-radius: 3px 3px 0 0; }
.b.c { background: var(--line-strong); }
.b.d { background: var(--win); }
.pg { display: inline-block; width: 110px; height: 6px; border-radius: 99px; background: var(--idle-soft); overflow: hidden; vertical-align: middle; }
.pg i { display: block; height: 100%; background: var(--win); }
.pg.over i { background: var(--lose); }
.who { display: inline-flex; gap: 8px; align-items: center; }
.bad { color: var(--lose); }
.warn { color: var(--warn); font-weight: 600; }
@media (max-width: 520px) { .rp { grid-template-columns: 1fr; } }
</style>
