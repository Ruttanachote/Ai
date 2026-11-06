<script setup lang="ts">
import { computed } from 'vue'
import Photo from '../components/Photo.vue'
import Avatar from '../components/Avatar.vue'
import StageBadge from '../components/StageBadge.vue'
import PageHeader from '../components/PageHeader.vue'
import KpiStrip from '../components/KpiStrip.vue'
import { scope } from '../store'
import { baht, mb, person, thDate, daysUntil, TODAY_ISO } from '../data/mock'
import { bookedValue, health, progressPct, lateTasks, paidAmount, sum } from '../domain/metrics'
import { customerName } from '../display'

// Same health / progress numbers as each project's "แผนงานและ Task" tab.
const queue = computed(() => scope.value.list.filter((p) => p.stage === 'win' || p.stage === 'handover'))
const active = computed(() => scope.value.list.filter((p) => p.stage === 'delivery'))
const payments = computed(() =>
  active.value.flatMap((p) => (p.milestones ?? []).filter((m) => !m.paid && m.payment).map((m) => ({ p, m })))
    .sort((a, b) => a.m.end.localeCompare(b.m.end)).slice(0, 5),
)
const kpis = computed(() => [
  { label: 'รอ Handover', value: String(queue.value.length), note: queue.value.filter((p) => !p.pm).length + ' โครงการยังไม่มี PM', tone: queue.value.some((p) => !p.pm) ? ('warn' as const) : ('' as const) },
  { label: 'กำลังส่งมอบ', value: String(active.value.length), note: mb(sum(active.value, bookedValue)) + ' มูลค่าตามสัญญา' },
  { label: 'Task เลยกำหนด', value: String(sum(active.value, (p) => lateTasks(p, TODAY_ISO).length)), note: 'รวมทุกโครงการที่กำลังส่งมอบ', tone: active.value.some((p) => lateTasks(p, TODAY_ISO).length) ? ('bad' as const) : ('' as const) },
  { label: 'รับชำระแล้ว', value: mb(sum(active.value, paidAmount)), note: 'จากงวดที่ส่งมอบแล้ว' },
])
</script>

<template>
  <div class="page">
    <PageHeader module="ส่งมอบโครงการ" title="Portfolio โครงการ" :scope="scope.label" subtitle="โครงการหลังชนะงาน ตั้งแต่ Handover ถึงส่งมอบ" />
    <KpiStrip :items="kpis" />

    <section v-if="queue.length" class="panel q">
      <div class="panel-head"><h2>รอ Handover</h2><span class="muted small">ชนะงานแล้ว รอประชุมส่งต่อและเลือก PM / ทีม DT</span></div>
      <router-link v-for="p in queue" :key="p.id" :to="`/projects/${p.id}`" class="qrow">
        <div><strong>{{ p.name }}</strong><p class="small muted">{{ customerName(p) }} · {{ mb(bookedValue(p)) }} · SM {{ person(p.sm)?.name }}</p></div>
        <StageBadge :stage="p.stage" />
        <span class="small">{{ p.pm ? 'PM ' + person(p.pm)?.name : 'ยังไม่มี PM' }}</span>
      </router-link>
    </section>

    <div class="cards">
      <router-link v-for="p in active" :key="p.id" :to="`/projects/${p.id}`" class="card">
        <Photo :id="p.cover" :w="900" />
        <div class="body">
          <div class="top"><span class="small muted">{{ p.code }} · {{ p.team }}</span><Avatar :id="p.pm" :size="26" /></div>
          <h3>{{ p.name }}</h3>
          <p class="small muted">{{ customerName(p) }} · ส่งมอบ {{ thDate(p.endProject) }} ({{ daysUntil(p.endProject) }} วัน)</p>
          <div class="prog">
            <div class="pb"><i :style="{ width: progressPct(p) + '%' }" /></div>
            <span class="num small">{{ progressPct(p) }}%</span>
          </div>
          <ul class="health">
            <li v-for="h in health(p, TODAY_ISO)" :key="h.k" :class="h.tone"><b>{{ h.k }}</b>{{ h.note }}</li>
          </ul>
        </div>
      </router-link>
      <div v-if="!active.length" class="panel empty"><h3>ยังไม่มีโครงการที่กำลังส่งมอบ</h3><p class="muted">โครงการจะมาที่นี่หลังประชุม Handover และเปลี่ยนเป็น In Delivery</p></div>
    </div>

    <section v-if="payments.length" class="panel">
      <div class="panel-head"><h2>งวดชำระเงินที่จะถึง</h2><span class="muted small">ส่งงานตามงวด → แจ้งบัญชีวางบิล</span></div>
      <table class="table">
        <thead><tr><th>งวดงาน</th><th>โครงการ</th><th>ครบกำหนด</th><th class="r">มูลค่า</th></tr></thead>
        <tbody><tr v-for="x in payments" :key="x.p.id + x.m.name"><td>{{ x.m.name }}</td><td>{{ x.p.name }}</td><td>{{ thDate(x.m.end) }}</td><td class="r num">{{ baht(x.m.payment!) }}</td></tr></tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.q { margin-bottom: 20px; }
.qrow { display: grid; grid-template-columns: 1fr auto 140px; gap: 16px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--line); color: var(--ink); }
.qrow:last-child { border-bottom: 0; }
.qrow strong { font-weight: 600; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; margin-bottom: 20px; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-lg); overflow: hidden; color: var(--ink); }
.card:hover { text-decoration: none; border-color: var(--line-strong); }
.card .photo { height: 140px; }
.body { padding: 18px 20px 20px; display: grid; gap: 6px; }
.top { display: flex; justify-content: space-between; align-items: center; }
.prog { display: flex; align-items: center; gap: 10px; margin: 8px 0; }
.pb { flex: 1; height: 8px; background: var(--post-soft); border-radius: 99px; overflow: hidden; }
.pb i { display: block; height: 100%; background: var(--post); }
.health { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.health li { font-size: 12px; padding: 8px 10px; border-radius: var(--r-sm); display: grid; line-height: 1.35; }
.health b { font-weight: 600; font-size: 12.5px; }
.ok { background: var(--win-soft); color: var(--win); }
.warn { background: var(--warn-soft); color: var(--warn); }
.bad { background: var(--lose-soft); color: var(--lose); }
.empty { display: grid; gap: 6px; }
@media (max-width: 560px) { .qrow { grid-template-columns: 1fr; gap: 6px; } .cards { grid-template-columns: 1fr; } }
</style>
