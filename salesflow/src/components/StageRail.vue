<script setup lang="ts">
import { computed } from 'vue'
import { RAIL, stageOf, type StageKey } from '../data/model'

// The lifecycle rail: one line from first contact to project end, with the three
// ownership phases (Pre-sale → result → PMO/PM/MA) drawn as bands beneath it.
// `sales` (SM view): the SM's process ends at Close Win and hands the project to the team and PM,
// so the rail stops at CW plus one hand-off step; delivery stages are summarised in one line.
const props = defineProps<{ stage: StageKey; compact?: boolean; sales?: boolean; pm?: string }>()
type Step = StageKey | 'handoff'
const SALES_RAIL: Step[] = ['opportunity', 'pipeline', 'forecast', 'rebidding', 'win', 'handoff']
const steps = computed<Step[]>(() => (props.sales ? SALES_RAIL : RAIL))
const post = computed(() => RAIL.indexOf(props.stage) > RAIL.indexOf('win'))
const info = (k: Step) => (k === 'handoff' ? { code: 'HO', label: 'ส่งต่อทีม & PM', prob: 'จบงาน SM' } : stageOf(k))

const exit = computed(() => (props.stage === 'lose' || props.stage === 'cancelled' ? props.stage : null))
// Close Lose stops after the selling stages; Cancelled stops somewhere after Win.
const reached = computed(() => {
  if (props.stage === 'lose') return RAIL.indexOf('rebidding')
  if (props.stage === 'cancelled') return RAIL.indexOf('win')
  // SM view: once the project is past Close Win it has been handed off — every step is done.
  if (props.sales && post.value) return SALES_RAIL.length
  return RAIL.indexOf(props.stage)
})
const bands = computed(() => props.sales
  ? [{ label: 'ช่วงขาย · Pre-sale', from: 0, to: 3, tone: 'presale' }, { label: 'ผลการขาย', from: 4, to: 4, tone: 'win' }, { label: 'ทีมและ PM รับต่อ', from: 5, to: 5, tone: 'post' }]
  : [{ label: 'ช่วงขาย · Pre-sale', from: 0, to: 3, tone: 'presale' }, { label: 'ผลการขาย', from: 4, to: 4, tone: 'win' }, { label: 'หลังขาย · PMO / PM / MA', from: 5, to: 8, tone: 'post' }])
</script>

<template>
  <div class="rail" :class="{ compact, sales }" :style="{ '--n': steps.length }" role="list" aria-label="สถานะโครงการ">
    <div class="track">
      <div v-for="(k, i) in steps" :key="k" class="step" role="listitem"
        :class="{ done: i < reached || (i === reached && exit), now: i === reached && !exit, ahead: i > reached }"
        :aria-current="i === reached && !exit ? 'step' : undefined">
        <span class="node" :class="{ ho: k === 'handoff' }"><svg v-if="i < reached" viewBox="0 0 12 12" width="10" height="10"><path d="M2.5 6.2l2.2 2.2L9.5 3.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
        <span class="name"><b class="code">{{ info(k).code }}</b> {{ info(k).label }}</span>
        <span v-if="!compact" class="prob">{{ info(k).prob }}</span>
      </div>
    </div>
    <div v-if="!compact" class="bands">
      <span v-for="b in bands" :key="b.label" :class="b.tone" :style="{ gridColumn: `${b.from + 1} / ${b.to + 2}` }">{{ b.label }}</span>
    </div>
    <p v-if="sales && !exit && props.stage === 'win'" class="exit handoff">ขั้นสุดท้ายของ SM — แจ้งทีมพัฒนาและขอ PM จากนั้น PMO / PM รับไปส่งมอบโครงการ</p>
    <p v-else-if="sales && post && !exit" class="exit handoff">ส่งต่อให้ทีมและ PM แล้ว{{ pm ? ` (PM: ${pm})` : '' }} — ตอนนี้อยู่ที่ <b>{{ stageOf(props.stage).code }} {{ stageOf(props.stage).label }}</b> · SM ดูความคืบหน้าได้ แต่ไม่ต้องดำเนินการต่อ</p>
    <p v-if="exit" class="exit" :class="exit">
      {{ exit === 'lose' ? 'ออกจากเส้นทางที่ Close Lose — หัวหน้ากลุ่มเปิดกลับเป็น Pipeline ได้' : 'ยกเลิกหลังชนะงาน — โครงการปิดโดยหัวหน้ากลุ่ม' }}
    </p>
  </div>
</template>

<style scoped>
.rail { --n: 9; }
.track { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); position: relative; }
.step { position: relative; display: grid; justify-items: center; gap: 6px; text-align: center; padding-top: 2px; }
.step::before { content: ''; position: absolute; top: 11px; left: -50%; right: 50%; height: 2px; background: var(--line-strong); }
.step:first-child::before { display: none; }
.step.done::before, .step.now::before { background: var(--ink); }
.node { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; background: var(--surface); border: 2px solid var(--line-strong); position: relative; z-index: 1; color: #fff; }
.done .node { background: var(--ink); border-color: var(--ink); }
.now .node { border-color: var(--brand); background: var(--brand); box-shadow: 0 0 0 5px rgb(226 51 43 / 0.16); }
.name { font-size: 13px; font-weight: 500; color: var(--ink-2); line-height: 1.3; }
.now .name { color: var(--ink); font-weight: 600; }
.ahead .name { color: var(--faint); }
.prob { font-size: 12px; color: var(--faint); font-family: var(--display); }
.now .prob { color: var(--brand); }
.bands { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 4px; margin-top: 12px; }
.bands span { font-size: 12px; padding: 4px 8px; border-radius: 4px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bands .presale { background: var(--presale-soft); color: var(--presale); }
.bands .win { background: var(--win-soft); color: var(--win); }
.bands .post { background: var(--post-soft); color: var(--post); }
.exit { margin-top: 12px; font-size: 13px; padding: 8px 12px; border-radius: var(--r-sm); }
.exit.lose { background: var(--lose-soft); color: var(--lose); }
.exit.handoff { background: var(--post-soft); color: var(--post); }
.exit.cancelled { background: var(--idle-soft); color: var(--ink-2); }
.code { display: block; font-family: var(--display); font-size: 11px; letter-spacing: 0.04em; color: var(--muted); }
.now .code { color: var(--brand); }
.compact .name { font-size: 12px; }
@media (max-width: 760px) {
  .rail { overflow-x: auto; }
  .track, .bands { min-width: 640px; }
  .sales .track, .sales .bands { min-width: 460px; }
}
</style>
