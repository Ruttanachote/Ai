<script setup lang="ts">
// Project Status Tracker: every project on one line, with the detailed step it is in — from
// "waiting for Sale to submit" to MA — derived from what the teams already record.
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Avatar from '../components/Avatar.vue'
import Icon from '../components/Icon.vue'
import PageHeader from '../components/PageHeader.vue'
import { scope } from '../store'
import { person, mb, TODAY_ISO, groupOf, GROUP_NAME, teamOf, thDate } from '../data/mock'
import { dealValue } from '../domain/metrics'
import { TRACK_STEPS, stepIndex, trackOf, type TrackStep } from '../domain/executive'
import { customerName } from '../display'

const route = useRoute()
const router = useRouter()
const nameOf = (id?: string) => person(id)?.name ?? '—'
const rows = computed(() => scope.value.list.map((p) => ({ p, t: trackOf(p, TODAY_ISO, nameOf, thDate) })))

const step = ref<TrackStep | 'closed' | ''>((route.query.step as TrackStep) || '')
const group = ref((route.query.group as string) || '')
const q = ref('')
const attention = ref(route.query.attention === '1')
watch([step, group, attention], () => router.replace({ query: { ...(step.value ? { step: step.value } : {}), ...(group.value ? { group: group.value } : {}), ...(attention.value ? { attention: '1' } : {}) } }))

const groups = computed(() => [...new Set(scope.value.list.map((p) => groupOf(p.team)))].sort())
const base = computed(() => rows.value.filter((r) => !group.value || groupOf(r.p.team) === group.value))
const counts = computed(() => Object.fromEntries(TRACK_STEPS.map((s) => [s.k, base.value.filter((r) => !r.t.closed && r.t.step === s.k).length])))
const closedN = computed(() => base.value.filter((r) => r.t.closed).length)
const list = computed(() => {
  const s = q.value.trim().toLowerCase()
  return base.value
    .filter((r) => (step.value === 'closed' ? !!r.t.closed : step.value ? !r.t.closed && r.t.step === step.value : !r.t.closed))
    .filter((r) => !attention.value || r.t.tone === 'warn' || r.t.tone === 'bad')
    .filter((r) => !s || `${r.p.name} ${r.p.code} ${r.p.customer} ${r.p.sales.join(' ')} ${r.t.waitingOn}`.toLowerCase().includes(s))
    .sort((a, b) => stepIndex(a.t.step) - stepIndex(b.t.step) || dealValue(b.p) - dealValue(a.p))
})
const flagged = computed(() => base.value.filter((r) => !r.t.closed && (r.t.tone === 'warn' || r.t.tone === 'bad')).length)
const pick = (k: TrackStep | 'closed') => (step.value = step.value === k ? '' : k)
const TONE: Record<string, string> = { ok: 'ตามแผน', warn: 'ต้องติดตาม', bad: 'ล่าช้า', done: 'ส่งต่อ MA' }
</script>

<template>
  <div class="page">
    <PageHeader module="Executive · ผู้บริหาร" title="Project Status Tracker" :scope="scope.label" subtitle="สถานะละเอียดของทุกโครงการ ระบบคำนวณจากข้อมูลที่ทีมบันทึกอยู่แล้ว ไม่ต้องกรอกเพิ่ม" />

    <section class="steps" aria-label="จำนวนโครงการแต่ละขั้น">
      <button v-for="(s, i) in TRACK_STEPS" :key="s.k" class="st" :aria-pressed="step === s.k" @click="pick(s.k)">
        <span class="no num">{{ i + 1 }}</span>
        <span class="lb">{{ s.label }}</span>
        <b class="num">{{ counts[s.k] }}</b>
        <span class="ow">{{ s.owner }}</span>
      </button>
      <button class="st closed" :aria-pressed="step === 'closed'" @click="pick('closed')">
        <span class="no"><Icon name="x" :size="12" /></span><span class="lb">แพ้ · ยกเลิก</span><b class="num">{{ closedN }}</b><span class="ow">ปิดแล้ว</span>
      </button>
    </section>

    <div class="bar">
      <label class="search"><Icon name="search" :size="16" /><span class="sr">ค้นหา</span><input v-model="q" placeholder="ชื่อโครงการ ลูกค้า หรือชื่อ Sale" /></label>
      <div class="seg" role="radiogroup" aria-label="กลุ่ม">
        <button role="radio" :aria-checked="!group" @click="group = ''">ทุกกลุ่ม</button>
        <button v-for="g in groups" :key="g" role="radio" :aria-checked="group === g" :title="GROUP_NAME[g]" @click="group = g">{{ g }}</button>
      </div>
      <label class="chk"><input v-model="attention" type="checkbox" /> ต้องติดตามเท่านั้น <span class="chip warn">{{ flagged }}</span></label>
    </div>

    <section class="panel tbl">
      <div class="head" aria-hidden="true"><span>โครงการ</span><span>ขั้นตอน</span><span>สถานะตอนนี้</span><span>รอใคร</span><span class="r">มูลค่า</span></div>
      <router-link v-for="r in list" :key="r.p.id" :to="`/projects/${r.p.id}`" class="row" :class="r.t.tone">
        <div class="pj">
          <strong>{{ r.p.name }}</strong>
          <span class="small muted">{{ r.p.code }} · {{ customerName(r.p) }}</span>
          <span class="small"><span class="chip">{{ r.p.team }}</span> <span class="muted">{{ teamOf(r.p.team)?.name }}</span></span>
        </div>
        <div class="trail" :aria-label="`ขั้นที่ ${stepIndex(r.t.step) + 1} จาก ${TRACK_STEPS.length}: ${TRACK_STEPS[stepIndex(r.t.step)].label}`">
          <i v-for="(s, i) in TRACK_STEPS" :key="s.k" :class="{ done: i < stepIndex(r.t.step), cur: i === stepIndex(r.t.step), lost: r.t.closed && i === stepIndex(r.t.step) }" :title="s.label" />
          <span class="sl">{{ r.t.closed ? (r.t.closed === 'lose' ? 'Close Lose' : 'ยกเลิก') : TRACK_STEPS[stepIndex(r.t.step)].label }}</span>
        </div>
        <div class="now">
          <span class="flag" :class="r.t.tone">{{ TONE[r.t.tone] }}</span>
          <span class="small">{{ r.t.detail }}</span>
          <span v-if="r.t.progress !== undefined" class="prog"><i :style="{ width: r.t.progress + '%' }" /></span>
        </div>
        <div class="wait small">
          <span>{{ r.t.waitingOn }}</span>
          <span class="muted">SM {{ person(r.p.sm)?.name }}<template v-if="r.p.pm"> · PM {{ person(r.p.pm)?.name }}</template></span>
        </div>
        <div class="val num r">{{ mb(dealValue(r.p)) }}<Avatar :id="r.p.pm ?? r.p.sm" :size="24" /></div>
      </router-link>
      <div v-if="!list.length" class="empty">
        <p><strong>ไม่มีโครงการตามตัวกรองนี้</strong></p>
        <button class="btn sm" @click="step = ''; attention = false; q = ''; group = ''">ล้างตัวกรอง</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.steps { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 6px; margin-bottom: 16px; }
.st { display: grid; align-content: start; gap: 2px; text-align: left; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); padding: 10px 12px; font: inherit; color: var(--ink); cursor: pointer; position: relative; }
.st:hover { border-color: var(--line-strong); }
.st[aria-pressed='true'] { border-color: var(--primary); box-shadow: 0 0 0 1px var(--primary) inset; background: var(--primary-soft); }
.st:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.no { width: 20px; height: 20px; border-radius: 50%; background: var(--sunken); border: 1px solid var(--line-strong); display: grid; place-items: center; font-size: 11.5px; color: var(--muted); }
.lb { font-size: 12.5px; color: var(--ink-2); line-height: 1.3; min-height: 2.6em; }
.st b { font-size: 22px; font-weight: 600; line-height: 1.3; }
.ow { font-family: var(--desc); font-size: 11.5px; color: var(--faint); }
.st.closed .lb { color: var(--lose); }
.bar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
.search { display: flex; align-items: center; gap: 8px; padding: 0 12px; border: 1px solid var(--line-strong); border-radius: var(--r-sm); background: var(--surface); color: var(--muted); flex: 1; min-width: 220px; max-width: 380px; }
.search input { border: 0; outline: 0; background: none; font: inherit; color: var(--ink); min-height: 38px; flex: 1; min-width: 0; }
.search:focus-within { border-color: var(--focus); box-shadow: 0 0 0 3px var(--primary-soft); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.chk { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
.tbl { padding: 0; overflow: hidden; }
.head, .row { display: grid; grid-template-columns: minmax(220px, 1.4fr) minmax(180px, 1fr) minmax(220px, 1.4fr) minmax(150px, 0.8fr) 110px; gap: 16px; align-items: center; padding: 14px 20px; }
.head { font-size: 12.5px; color: var(--muted); border-bottom: 1px solid var(--line); background: var(--sunken); padding-top: 10px; padding-bottom: 10px; }
.r { text-align: right; justify-content: flex-end; }
.row { border-bottom: 1px solid var(--line); color: var(--ink); border-left: 3px solid transparent; }
.row:last-child { border-bottom: 0; }
.row:hover { background: var(--sunken); text-decoration: none; }
.row.bad { border-left-color: var(--lose); }
.row.warn { border-left-color: var(--warn); }
.pj, .now, .wait { display: grid; gap: 2px; min-width: 0; }
.pj strong { font-weight: 600; }
.trail { display: flex; align-items: center; gap: 3px; flex-wrap: wrap; }
.trail i { width: 14px; height: 6px; border-radius: 3px; background: var(--line); }
.trail i.done { background: var(--post); }
.trail i.cur { background: var(--primary); width: 22px; }
.trail i.lost { background: var(--lose); }
.sl { width: 100%; font-size: 13px; font-weight: 500; margin-top: 4px; }
.flag { font-size: 12px; font-weight: 600; }
.flag.ok { color: var(--win); } .flag.warn { color: var(--warn); } .flag.bad { color: var(--lose); } .flag.done { color: var(--post); }
.prog { height: 4px; border-radius: 2px; background: var(--line); overflow: hidden; max-width: 200px; margin-top: 4px; }
.prog i { display: block; height: 100%; background: var(--post); }
.val { display: flex; align-items: center; gap: 8px; font-weight: 500; }
.empty { padding: 40px; text-align: center; display: grid; justify-items: center; gap: 8px; }
.empty p { margin: 0; }
@media (max-width: 1280px) { .steps { grid-template-columns: repeat(5, minmax(0, 1fr)); } }
@media (max-width: 1000px) {
  .head { display: none; }
  .row { grid-template-columns: 1fr auto; }
  .trail, .now, .wait { grid-column: 1 / -1; }
  .val { grid-row: 1; grid-column: 2; }
}
@media (max-width: 640px) {
  .steps { display: flex; overflow-x: auto; margin: 0 -16px 16px; padding: 0 16px 4px; scroll-snap-type: x proximity; }
  .st { flex: 0 0 116px; scroll-snap-align: start; }
  .search { max-width: none; }
}
</style>
