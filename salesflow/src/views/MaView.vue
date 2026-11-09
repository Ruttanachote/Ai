<script setup lang="ts">
import { computed } from 'vue'
import Avatar from '../components/Avatar.vue'
import StageBadge from '../components/StageBadge.vue'
import PageHeader from '../components/PageHeader.vue'
import KpiStrip from '../components/KpiStrip.vue'
import { projects, scope, tickets as allTickets } from '../store'
import { CONTRACTS, baht, daysUntil, thDate, addDays, mb } from '../data/mock'
import { warrantyBucket, bookedValue, sum } from '../domain/metrics'
import { customerName } from '../display'

// Buckets use the same thresholds as the project's "ประกันและ MA" tab; tickets and renewals
// are limited to the projects this role can see.
const base = computed(() => scope.value.list.filter((p) => p.stage === 'warranty'))
const ids = computed(() => new Set(scope.value.list.map((p) => p.id)))
const sorted = computed(() => [...base.value].sort((a, b) => daysUntil(a.endWarranty) - daysUntil(b.endWarranty)))
const inBucket = (k: string) => sorted.value.filter((p) => warrantyBucket(daysUntil(p.endWarranty)) === k)
const buckets = computed(() => [
  { k: 'ภายใน 30 วัน', d: 'ใกล้หรือเลยกำหนดแจ้งต่อสัญญา ต้องตามคำตอบลูกค้า', list: inBucket('due30'), tone: 'hot' },
  { k: '31–120 วัน', d: 'ส่งใบเสนอราคา MA — ลูกค้าภาครัฐต้องทันรอบตั้งงบ (ยื่นคำของบราว พ.ค.)', list: inBucket('due120'), tone: 'warm' },
  { k: 'มากกว่า 120 วัน', d: 'ดูแลตาม SLA และเก็บข้อมูลสุขภาพลูกค้า', list: inBucket('later'), tone: '' },
])
const tickets = computed(() => allTickets.filter((t) => ids.value.has(t.project)).map((t) => ({ ...t, p: scope.value.list.find((p) => p.id === t.project) })))
const renewals = computed(() => scope.value.list.filter((p) => p.type === 'MA'))
const kpis = computed(() => [
  { label: 'โครงการในระยะประกัน', value: String(base.value.length), note: mb(sum(base.value, bookedValue)) + ' มูลค่าตามสัญญา' },
  { label: 'หมดภายใน 30 วัน', value: String(buckets.value[0].list.length), note: 'ต้องตามคำตอบเรื่องต่อ MA', tone: buckets.value[0].list.length ? ('warn' as const) : ('' as const) },
  { label: 'Ticket เปิดอยู่', value: String(tickets.value.filter((t) => t.severity !== 'CR').length), note: tickets.value.filter((t) => t.used >= 100).length + ' รายการเกิน SLA', tone: tickets.value.some((t) => t.used >= 100) ? ('bad' as const) : ('' as const) },
  { label: 'สัญญา MA ที่ต่อแล้ว', value: String(renewals.value.length), note: mb(sum(renewals.value, bookedValue)) + ' ต่อปี' },
])
</script>

<template>
  <div class="page">
    <PageHeader module="After-Sales Service" title="Warranty & Maintenance" :scope="scope.label" subtitle="วันหมดประกัน การแจ้งต่อสัญญา และ Ticket ตาม SLA" />
    <KpiStrip :items="kpis" />

    <div class="radar">
      <section v-for="b in buckets" :key="b.k" class="bucket" :class="b.tone">
        <header><h2>{{ b.k }}</h2><p class="small muted">{{ b.d }}</p></header>
        <router-link v-for="p in b.list" :key="p.id" :to="`/projects/${p.id}`" class="w">
          <div class="d num">{{ daysUntil(p.endWarranty) }}<span>วัน</span></div>
          <div>
            <strong>{{ p.name }}</strong>
            <p class="small muted">{{ customerName(p) }} · หมด {{ thDate(p.endWarranty) }}</p>
            <p v-if="CONTRACTS[p.id]" class="small">แจ้งต่อสัญญาภายใน {{ thDate(addDays(p.endWarranty!, -CONTRACTS[p.id].noticeDays)) }} · MA ปีถัดไป {{ baht(Math.round(bookedValue(p) * CONTRACTS[p.id].uplift)) }}</p>
            <p v-if="CONTRACTS[p.id]" class="hs small" :class="CONTRACTS[p.id].health < 60 ? 'low' : CONTRACTS[p.id].health < 75 ? 'mid' : 'ok'" :title="CONTRACTS[p.id].reasons.join(' · ')">
              สุขภาพลูกค้า <b class="num">{{ CONTRACTS[p.id].health }}</b> · {{ CONTRACTS[p.id].reasons[0] }}
            </p>
          </div>
        </router-link>
        <p v-if="!b.list.length" class="small muted none">ไม่มีโครงการในช่วงนี้</p>
      </section>
    </div>

    <section class="panel">
      <div class="panel-head"><h2>คิว Ticket ตาม SLA</h2><button class="btn sm">รับเรื่องใหม่</button></div>
      <div class="scroll-x">
        <table class="table">
          <thead><tr><th>ระดับ</th><th>เรื่อง</th><th>โครงการ</th><th>สถานะ</th><th>ตอบรับ</th><th style="min-width:150px">แก้ไขเสร็จ (SLA)</th><th>ผู้รับผิดชอบ</th></tr></thead>
          <tbody>
            <tr v-for="t in tickets" :key="t.id">
              <td><span class="chip" :class="t.severity === 'P1' ? 'lose' : t.severity === 'CR' ? 'presale' : 'warn'">{{ t.severity }}</span></td>
              <td><strong class="tt">{{ t.title }}</strong><p class="small muted">{{ t.id }} · {{ t.opened }}</p></td>
              <td class="small">{{ t.p?.name }}</td>
              <td class="small">{{ t.status }}</td>
              <td class="small" :class="{ bad: t.resp.includes('ช้า') }">{{ t.resp }}</td>
              <td>
                <template v-if="t.severity !== 'CR'">
                  <div class="slab" :class="{ paused: t.paused, w50: t.used >= 50, br: t.used >= 100 }"><i :style="{ width: Math.min(100, t.used) + '%' }" /></div>
                  <span class="small" :class="t.used >= 100 ? 'bad' : t.used >= 75 ? 'warnc' : 'muted'">{{ t.paused ? 'หยุดนับ — รอลูกค้า' : t.left }} · {{ t.sla }}</span>
                </template>
                <span v-else class="small muted">ประเมินเป็นงานขายเพิ่ม</span>
              </td>
              <td><Avatar :id="t.owner" :size="26" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel ren">
      <div class="panel-head"><h2>สัญญา MA ต่อเนื่อง</h2><span class="muted small">เปิดเป็นโครงการ Type MA ใต้โครงการเดิม</span></div>
      <router-link v-for="p in renewals" :key="p.id" :to="`/projects/${p.id}`" class="row">
        <span><strong>{{ p.name }}</strong><span class="small muted"> · {{ baht(bookedValue(p)) }}/ปี · ต่อจาก {{ projects.find((x) => x.id === p.parentId)?.code }}</span></span>
        <StageBadge :stage="p.stage" />
      </router-link>
    </section>
  </div>
</template>

<style scoped>
.radar { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-bottom: 20px; }
.bucket { background: var(--surface); border: 1px solid var(--line); border-top: 3px solid var(--line-strong); border-radius: var(--r-lg); padding: 18px; display: grid; gap: 10px; align-content: start; }
.bucket.hot { border-top-color: var(--lose); }
.bucket.warm { border-top-color: var(--warn); }
.w { display: grid; grid-template-columns: 56px 1fr; gap: 12px; padding: 12px; border-radius: var(--r-md); background: var(--sunken); color: var(--ink); }
.w:hover { text-decoration: none; background: var(--idle-soft); }
.w strong { font-weight: 600; font-size: 14px; }
.d { font-size: 24px; font-weight: 700; display: grid; line-height: 1.1; text-align: center; }
.d span { font-size: 11px; font-weight: 500; color: var(--muted); font-family: var(--font); }
.hot .d { color: var(--lose); }
.warm .d { color: var(--warn); }
.none { padding: 12px 0; }
.tt { font-weight: 500; }
.slab { height: 6px; background: var(--idle-soft); border-radius: 99px; overflow: hidden; margin-bottom: 4px; }
.slab i { display: block; height: 100%; background: var(--post); }
.slab.w50 i { background: var(--warn); }
.slab.br i { background: var(--lose); }
.slab.paused i { background: repeating-linear-gradient(45deg, var(--faint) 0 4px, var(--line-strong) 4px 8px); }
.hs { margin-top: 4px; }
.hs.ok b { color: var(--win); } .hs.mid b { color: var(--warn); } .hs.low b { color: var(--lose); }
.bad { color: var(--lose); font-weight: 600; }
.warnc { color: var(--warn); font-weight: 600; }
.ren { margin-top: 20px; }
.row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--line); color: var(--ink); }
.row:last-child { border-bottom: 0; }
@media (max-width: 1000px) { .radar { grid-template-columns: 1fr; } }
</style>
