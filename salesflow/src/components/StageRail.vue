<script setup lang="ts">
import { computed } from 'vue'
import { RAIL, stageOf, type StageKey } from '../data/model'

// The lifecycle rail: one line from first contact to project end, with the three
// ownership phases (Pre-sale → result → PMO/PM/MA) drawn as bands beneath it.
const props = defineProps<{ stage: StageKey; compact?: boolean }>()

const exit = computed(() => (props.stage === 'lose' || props.stage === 'cancelled' ? props.stage : null))
// Close Lose stops after the selling stages; Cancelled stops somewhere after Win.
const reached = computed(() => {
  if (props.stage === 'lose') return RAIL.indexOf('rebidding')
  if (props.stage === 'cancelled') return RAIL.indexOf('win')
  return RAIL.indexOf(props.stage)
})
const bands = [
  { label: 'ช่วงขาย · Pre-sale', from: 0, to: 3, tone: 'presale' },
  { label: 'ผลการขาย', from: 4, to: 4, tone: 'win' },
  { label: 'หลังขาย · PMO / PM / MA', from: 5, to: 8, tone: 'post' },
]
</script>

<template>
  <div class="rail" :class="{ compact }" role="list" aria-label="สถานะโครงการ">
    <div class="track">
      <div v-for="(k, i) in RAIL" :key="k" class="step" role="listitem"
        :class="{ done: i < reached || (i === reached && exit), now: i === reached && !exit, ahead: i > reached }"
        :aria-current="i === reached && !exit ? 'step' : undefined">
        <span class="node"><svg v-if="i < reached" viewBox="0 0 12 12" width="10" height="10"><path d="M2.5 6.2l2.2 2.2L9.5 3.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
        <span class="name">{{ stageOf(k).label }}</span>
        <span v-if="!compact" class="prob">{{ stageOf(k).prob }}</span>
      </div>
    </div>
    <div v-if="!compact" class="bands">
      <span v-for="b in bands" :key="b.label" :class="b.tone" :style="{ gridColumn: `${b.from + 1} / ${b.to + 2}` }">{{ b.label }}</span>
    </div>
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
.name { font-size: 12.5px; font-weight: 500; color: var(--ink-2); line-height: 1.3; }
.now .name { color: var(--ink); font-weight: 600; }
.ahead .name { color: var(--faint); }
.prob { font-size: 11.5px; color: var(--faint); font-family: var(--display); }
.now .prob { color: var(--brand); }
.bands { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 4px; margin-top: 12px; }
.bands span { font-size: 11.5px; padding: 4px 8px; border-radius: 4px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bands .presale { background: var(--presale-soft); color: var(--presale); }
.bands .win { background: var(--win-soft); color: var(--win); }
.bands .post { background: var(--post-soft); color: var(--post); }
.exit { margin-top: 12px; font-size: 13px; padding: 8px 12px; border-radius: var(--r-sm); }
.exit.lose { background: var(--lose-soft); color: var(--lose); }
.exit.cancelled { background: var(--idle-soft); color: var(--ink-2); }
.compact .name { font-size: 11px; }
@media (max-width: 760px) {
  .rail { overflow-x: auto; }
  .track, .bands { min-width: 640px; }
}
</style>
