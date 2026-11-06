<script setup lang="ts">
import { computed } from 'vue'
import { projects } from '../store'
import { baht, daysUntil, mb, thDate } from '../data/mock'
import { addDays } from '../domain/calendar'

// Finance view of every bank guarantee still out — it ties up the company's credit line.
const rows = computed(() =>
  projects.flatMap((p) => (p.bonds ?? []).map((b) => {
    const due = b.kind === 'performance' ? (p.endWarranty ? addDays(p.endWarranty, 15) : undefined) : p.bid?.result ? addDays(p.bid.result, 15) : undefined
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
</script>

<template>
  <div class="page">
    <header class="page-head"><div><h1>หลักประกัน</h1><p>หนังสือค้ำประกันที่ยังไม่ได้คืน ทุกโครงการ — ติดตามวันขอคืนและวันหมดอายุ</p></div></header>

    <section class="kpis">
      <div><span>ค้ำประกันค้างอยู่</span><strong class="num">{{ mb(total) }}</strong><em>{{ out.length }} ฉบับ</em></div>
      <div v-for="[bank, v] in byBank" :key="bank"><span>{{ bank }}</span><strong class="num">{{ mb(v) }}</strong><em>วงเงินค้ำที่ใช้อยู่</em></div>
      <div><span>ถึงกำหนดขอคืนแล้ว</span><strong class="num" :class="{ bad: rows.some((r) => r.overdue) }">{{ rows.filter((r) => r.overdue).length }}</strong><em>ฉบับ</em></div>
    </section>

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
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px; }
.kpis div { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); padding: 14px 16px; display: grid; }
.kpis span { font-size: 13px; color: var(--muted); }
.kpis strong { font-size: 24px; font-weight: 600; }
.kpis em { font-style: normal; font-size: 12px; color: var(--faint); }
.flush { padding: 4px 8px; }
.bad { color: var(--lose); }
.foot { margin-top: 12px; }
</style>
