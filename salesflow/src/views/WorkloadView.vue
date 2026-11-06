<script setup lang="ts">
import { computed, ref } from 'vue'
import Avatar from '../components/Avatar.vue'
import { PEOPLE, person } from '../data/mock'

// Planned hours per person per week (capacity 40h). Source in production:
// task estimates + timesheet entries; allocations come from project plans.
const team = ref<'DT4-2' | 'DT2'>('DT4-2')
const WEEKS = ['3 พ.ย.', '10 พ.ย.', '17 พ.ย.', '24 พ.ย.', '1 ธ.ค.', '8 ธ.ค.', '15 ธ.ค.', '22 ธ.ค.']
const ALLOC: Record<string, { project: string; hrs: number[] }[]> = {
  ak: [{ project: 'Smart Permit', hrs: [24, 28, 30, 26, 20, 20, 16, 12] }, { project: 'ระบบจองคิว (MA)', hrs: [6, 4, 4, 4, 4, 4, 4, 2] }],
  dev1: [{ project: 'Smart Permit', hrs: [36, 32, 28, 24, 30, 30, 20, 8] }],
  dev2: [{ project: 'Smart Permit', hrs: [40, 40, 36, 30, 24, 16, 8, 0] }, { project: 'Presale e-Service', hrs: [8, 8, 0, 0, 0, 0, 0, 0] }],
  dev3: [{ project: 'Smart Permit', hrs: [30, 30, 24, 24, 28, 32, 24, 8] }, { project: 'ระบบจองคิว (MA)', hrs: [10, 6, 4, 4, 4, 4, 4, 4] }],
  ks: [{ project: 'Network Monitoring (MA)', hrs: [8, 8, 6, 6, 4, 4, 4, 4] }, { project: 'AI OCR (Handover)', hrs: [4, 12, 20, 24, 24, 24, 24, 16] }],
  dev4: [{ project: 'AI OCR (Handover)', hrs: [0, 8, 32, 40, 40, 40, 36, 24] }],
  dev5: [{ project: 'Data Lakehouse (Presale PoC)', hrs: [24, 24, 16, 8, 0, 0, 0, 0] }, { project: 'AI OCR (Handover)', hrs: [0, 0, 16, 32, 40, 40, 40, 32] }],
}
const members = computed(() =>
  PEOPLE.filter((p) => p.team === team.value && ALLOC[p.id]).map((p) => {
    const rows = ALLOC[p.id]
    const total = WEEKS.map((_, i) => rows.reduce((s, r) => s + r.hrs[i], 0))
    return { p, rows, total, avg: Math.round(total.reduce((a, b) => a + b, 0) / WEEKS.length) }
  }),
)
const tone = (h: number) => (h > 40 ? 'over' : h >= 32 ? 'full' : h >= 16 ? 'mid' : h > 0 ? 'low' : 'free')
const open = ref<string | null>(null)
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div><h1>Workload ทีม</h1><p>ชั่วโมงที่วางแผนต่อสัปดาห์ เทียบความสามารถ 40 ชม. · ใช้เลือกทีมตอน Handover</p></div>
      <div class="seg" role="radiogroup" aria-label="เลือกทีม">
        <button v-for="t in ['DT4-2', 'DT2'] as const" :key="t" role="radio" :aria-checked="team === t" @click="team = t">{{ t }}</button>
      </div>
    </header>

    <section class="panel scroll-x">
      <table class="heat">
        <thead><tr><th>สมาชิก</th><th v-for="w in WEEKS" :key="w">{{ w }}</th><th>เฉลี่ย</th></tr></thead>
        <tbody>
          <template v-for="m in members" :key="m.p.id">
            <tr class="person" @click="open = open === m.p.id ? null : m.p.id">
              <td>
                <button class="who" :aria-expanded="open === m.p.id"><Avatar :id="m.p.id" :size="28" /><span>{{ m.p.name }}<em>{{ m.rows.length }} โครงการ</em></span></button>
              </td>
              <td v-for="(h, i) in m.total" :key="i"><span class="cell num" :class="tone(h)">{{ h || '–' }}</span></td>
              <td class="num avg">{{ m.avg }}</td>
            </tr>
            <template v-if="open === m.p.id">
              <tr v-for="r in m.rows" :key="r.project" class="sub">
                <td>{{ r.project }}</td>
                <td v-for="(h, i) in r.hrs" :key="i" class="num">{{ h || '' }}</td><td />
              </tr>
            </template>
          </template>
        </tbody>
      </table>
      <div class="legend small">
        <span><i class="free" />ว่าง</span><span><i class="low" />1–15</span><span><i class="mid" />16–31</span><span><i class="full" />32–40</span><span><i class="over" />เกิน 40 ชม.</span>
      </div>
    </section>

    <section class="panel note">
      <h3>อ่านตารางนี้อย่างไร</h3>
      <p class="muted">คลิกชื่อเพื่อดูว่าชั่วโมงมาจากโครงการไหน ช่องสีแดงคือคนที่ถูกจองเกินกำลัง — PM ควรเลื่อน Task หรือขอคนเพิ่มจากหัวหน้ากลุ่มก่อนเริ่มสัปดาห์นั้น
        <template v-if="members.some((m) => m.total.some((h) => h > 40))">ตอนนี้มี {{ members.filter((m) => m.total.some((h) => h > 40)).map((m) => person(m.p.id)?.name).join(', ') }} ที่เกินกำลัง</template>
      </p>
    </section>
  </div>
</template>

<style scoped>
.seg { display: inline-flex; background: var(--surface); border: 1px solid var(--line-strong); border-radius: var(--r-sm); padding: 3px; gap: 2px; }
.seg button { border: 0; background: none; padding: 0 14px; border-radius: 4px; font: 500 14px var(--font); color: var(--muted); cursor: pointer; min-height: 32px; }
.seg button[aria-checked='true'] { background: var(--ink); color: #fff; }
.heat { width: 100%; border-collapse: separate; border-spacing: 4px; min-width: 820px; }
.heat th { font-weight: 500; font-size: 12.5px; color: var(--muted); text-align: center; padding: 4px; }
.heat th:first-child { text-align: left; }
.heat td { text-align: center; font-size: 13px; }
.person { cursor: pointer; }
.who { display: flex; align-items: center; gap: 10px; background: none; border: 0; font: inherit; color: var(--ink); cursor: pointer; text-align: left; padding: 2px; }
.who span { display: grid; line-height: 1.3; font-weight: 500; font-size: 14px; }
.who em { font-style: normal; font-size: 12px; color: var(--muted); font-weight: 400; }
.cell { display: block; height: 40px; line-height: 40px; border-radius: 6px; font-weight: 600; }
.free { background: var(--sunken); color: var(--faint); }
.low { background: #e3f0f0; color: var(--post); }
.mid { background: #b9dcdd; color: #0b5d62; }
.full { background: var(--post); color: #fff; }
.over { background: var(--lose); color: #fff; }
.avg { font-weight: 600; }
.sub td { font-size: 12.5px; color: var(--muted); padding: 2px; }
.sub td:first-child { text-align: left; padding-left: 42px; }
.legend { display: flex; gap: 16px; margin-top: 16px; color: var(--muted); flex-wrap: wrap; }
.legend i { display: inline-block; width: 14px; height: 14px; border-radius: 3px; margin-right: 6px; vertical-align: -2px; }
.note { margin-top: 20px; display: grid; gap: 6px; }
</style>
