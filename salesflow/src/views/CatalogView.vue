<script setup lang="ts">
// Solution Catalog: ready-made solutions the teams sell again. Shows how often each has been
// sold and its booked value, and starts a Product-led opportunity from it.
import { computed } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import KpiStrip from '../components/KpiStrip.vue'
import Avatar from '../components/Avatar.vue'
import { CATALOG, baht, mb } from '../data/mock'
import { projects, session } from '../store'
import { bookedValue, isOpen, isWon, pipelineValue, sum } from '../domain/metrics'

const rows = computed(() => CATALOG.map((c) => {
  const deals = projects.filter((p) => p.catalogId === c.id)
  return { c, deals, won: deals.filter(isWon), open: deals.filter(isOpen) }
}))
const kpis = computed(() => [
  { label: 'โซลูชันในแคตตาล็อก', value: String(CATALOG.length), note: `${new Set(CATALOG.map((c) => c.team)).size} ทีม` },
  { label: 'โครงการจากแคตตาล็อก', value: String(rows.value.reduce((s, r) => s + r.deals.length, 0)), note: `จาก ${projects.length} โครงการทั้งหมด` },
  { label: 'มูลค่าที่ชนะแล้ว', value: mb(rows.value.reduce((s, r) => s + sum(r.won, bookedValue), 0)), note: 'ตามสัญญา' },
  { label: 'Pipeline เปิดอยู่', value: mb(rows.value.reduce((s, r) => s + sum(r.open, pipelineValue), 0)), note: 'ดีลที่ยังไม่ปิด' },
])
const canStart = computed(() => ['sm', 'head', 'admin'].includes(session.role))
</script>

<template>
  <div class="page">
    <PageHeader module="Sales · ก่อนขาย" title="Solution Catalog" scope="ทุกทีม DT" subtitle="โซลูชันสำเร็จรูปที่ขายซ้ำได้ — เริ่มโครงการแบบ Product-led ได้เอกสารตั้งต้นทันที">
      <router-link v-if="canStart" to="/projects/new" class="btn primary">ลงทะเบียน Product-led</router-link>
    </PageHeader>
    <KpiStrip :items="kpis" />
    <div class="grid">
      <article v-for="r in rows" :key="r.c.id" class="panel card">
        <header><span class="chip">{{ r.c.team }}</span><Avatar :id="r.c.owner" :size="24" /></header>
        <h3>{{ r.c.name }}</h3>
        <p class="muted small">{{ r.c.summary }}</p>
        <ul class="mods"><li v-for="m in r.c.modules" :key="m">{{ m }}</li></ul>
        <dl>
          <dt>ราคาอ้างอิง</dt><dd class="num">{{ baht(r.c.price) }}</dd>
          <dt>Man-day มาตรฐาน</dt><dd class="num">{{ r.c.manday }}</dd>
          <dt>ขายแล้ว</dt><dd>{{ r.won.length }} โครงการ · {{ mb(sum(r.won, bookedValue)) }}</dd>
          <dt>กำลังเสนอ</dt><dd>{{ r.open.length }} ดีล</dd>
        </dl>
        <p class="small">📄 {{ r.c.proposal }}</p>
        <div class="deals"><router-link v-for="d in r.deals" :key="d.id" :to="`/projects/${d.id}`" class="small">{{ d.name }}</router-link></div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.card { display: grid; gap: 10px; align-content: start; }
.card header { display: flex; justify-content: space-between; align-items: center; }
.mods { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.mods li { font-size: 12px; padding: 2px 8px; border-radius: 99px; background: var(--primary-soft); color: var(--primary); }
dl { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; margin: 0; font-size: 14px; }
dt { color: var(--muted); }
dd { margin: 0; }
.deals { display: grid; gap: 2px; border-top: 1px solid var(--line); padding-top: 8px; }
</style>
