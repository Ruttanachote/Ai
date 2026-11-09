<script setup lang="ts">
import { computed } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import KpiStrip from '../components/KpiStrip.vue'
import { scope } from '../store'
import { baht, daysUntil, mb, thDate } from '../data/mock'
import { bondReturnDue } from '../domain/metrics'

// Finance view of every bank guarantee still out — it ties up the company's credit line.
// Return dates come from the same rule the project's procurement tab uses.
const rows = computed(() =>
  scope.value.list.flatMap((p) => (p.bonds ?? []).map((b) => {
    const due = bondReturnDue(p, b)
    const overdue = !b.returned && !!due && daysUntil(due) < 0
    const expSoon = !b.returned && daysUntil(b.expires) < 60
    return { p, b, due, overdue, expSoon }
  })).sort((x, y) => Number(!!x.b.returned) - Number(!!y.b.returned) || x.b.expires.localeCompare(y.b.expires)),
)
const out = computed(() => rows.value.filter((r) => !r.b.returned))
const total = computed(() => out.value.reduce((s, r) => s + r.b.amount, 0))
const byBank = computed(() => {
  const m = new Map<string, number>()
  out.value.forEach((r) => m.set(r.b.bank, (m.get(r.b.bank) ?? 0) + r.b.amount))
  return [...m.entries()]
})
const kpis = computed(() => [
  { label: 'ค้ำประกันค้างอยู่', value: mb(total.value), note: `${out.value.length} ฉบับ` },
  { label: 'ธนาคารที่ใช้วงเงินมากสุด', value: byBank.value.length ? mb(Math.max(...byBank.value.map((x) => x[1]))) : '—', note: [...byBank.value].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'ไม่มี' },
  { label: 'หมดอายุภายใน 60 วัน', value: String(rows.value.filter((r) => r.expSoon).length), note: 'ต่ออายุหรือขอคืน', tone: rows.value.some((r) => r.expSoon) ? ('warn' as const) : ('' as const) },
  { label: 'เลยกำหนดขอคืน', value: String(rows.value.filter((r) => r.overdue).length), note: 'ฉบับ', tone: rows.value.some((r) => r.overdue) ? ('bad' as const) : ('' as const) },
])
</script>

<template>
  <div class="page">
    <PageHeader module="Finance" title="Guarantees" :scope="scope.label" subtitle="หนังสือค้ำประกันที่ยังไม่ได้คืน — ติดตามวันขอคืนและวันหมดอายุ" />

    <KpiStrip :items="kpis" />

    <div class="panel flush scroll-x">
      <table class="table">
        <thead><tr><th>โครงการ</th><th>ประเภท</th><th>ธนาคาร</th><th class="r">มูลค่า</th><th>หมดอายุ</th><th>ขอคืนได้</th><th>สถานะ</th></tr></thead>
        <tbody>
          <tr v-for="r in rows" :key="r.p.id + r.b.kind">
            <td><router-link :to="`/projects/${r.p.id}`">{{ r.p.name }}</router-link><p class="small muted">{{ r.p.code }}</p></td>
            <td class="small">{{ r.b.kind === 'bid' ? 'หลักประกันการเสนอราคา' : 'หลักประกันสัญญา' }} {{ r.b.pct }}%</td>
            <td class="small">{{ r.b.bank }}</td>
            <td class="r num">{{ baht(r.b.amount) }}</td>
            <td class="small" :class="{ bad: r.expSoon }">{{ thDate(r.b.expires) }}</td>
            <td class="small">{{ r.due ? thDate(r.due) : 'หลังพ้นข้อผูกพัน' }}</td>
            <td><span class="chip" :class="r.b.returned ? 'win' : r.overdue ? 'lose' : r.expSoon ? 'warn' : ''">{{ r.b.returned ? 'คืนแล้ว' : r.overdue ? 'เลยกำหนดขอคืน' : r.expSoon ? 'ต่ออายุหรือขอคืน' : 'ค้ำอยู่' }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="hint foot">หลักประกันการเสนอราคาคืนภายใน 15 วันหลังอนุมัติผู้ชนะ (ยกเว้น 3 รายต่ำสุดคืนหลังลงนาม) · หลักประกันสัญญาคืนภายใน 15 วันหลังพ้นข้อผูกพัน (ปกติคือหลังหมดประกัน)</p>
  </div>
</template>

<style scoped>
.flush { padding: 4px 8px; }
.bad { color: var(--lose); }
.foot { margin-top: 12px; }
</style>
