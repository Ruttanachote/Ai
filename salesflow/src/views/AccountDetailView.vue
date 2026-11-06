<script setup lang="ts">
import { computed } from 'vue'
import StageBadge from '../components/StageBadge.vue'
import { ACCOUNTS, account, baht, daysUntil, mb, thDate } from '../data/mock'
import { scope } from '../store'
import PageHeader from '../components/PageHeader.vue'
import KpiStrip from '../components/KpiStrip.vue'
import { isOpen, isWon, bookedValue, pipelineValue, dealValue, sum } from '../domain/metrics'
import { winRate } from '../domain/rules'

const props = defineProps<{ id: string }>()
const a = computed(() => account(props.id))
const children = computed(() => ACCOUNTS.filter((x) => x.parentId === props.id))
const ids = computed(() => [props.id, ...children.value.map((c) => c.id)])
const list = computed(() => scope.value.list.filter((p) => ids.value.includes(p.customerAccountId ?? '') || ids.value.includes(p.endUserAccountId ?? '')))
const won = computed(() => sum(list.value.filter(isWon), bookedValue))
const pipe = computed(() => sum(list.value.filter(isOpen), pipelineValue))
const expiring = computed(() => list.value.filter((p) => p.endWarranty && daysUntil(p.endWarranty) > 0).sort((x, y) => x.endWarranty!.localeCompare(y.endWarranty!)))
const lost = computed(() => list.value.filter((p) => p.loss))
const kpis = computed(() => [
  { label: 'ยอดที่ชนะทั้งหมด', value: mb(won.value), note: 'ตามสัญญา' },
  { label: 'Pipeline ที่เปิดอยู่', value: mb(pipe.value), note: `${list.value.filter(isOpen).length} ดีล` },
  { label: 'Win rate กับลูกค้านี้', value: Math.round(winRate(list.value) * 100) + '%', note: 'นับจากผลชนะ/แพ้' },
  { label: 'ประกันใกล้หมด', value: expiring.value[0] ? daysUntil(expiring.value[0].endWarranty) + ' วัน' : '—', note: expiring.value[0]?.name ?? 'ไม่มีโครงการในระยะประกัน' },
])
</script>

<template>
  <div v-if="a" class="page">
    <router-link to="/accounts" class="back small">‹ ทะเบียนลูกค้า</router-link>
    <PageHeader module="ทะเบียนลูกค้า" :title="a.name" :scope="scope.label" :subtitle="[a.taxId ? 'เลขประจำตัวผู้เสียภาษี ' + a.taxId : '', a.province, a.parentId ? 'สังกัด ' + account(a.parentId)?.name : ''].filter(Boolean).join(' · ')" />

    <KpiStrip :items="kpis" />

    <div class="grid">
      <section class="panel">
        <div class="panel-head"><h2>โครงการ</h2></div>
        <table class="table">
          <tbody>
            <tr v-for="p in list" :key="p.id">
              <td><router-link :to="`/projects/${p.id}`">{{ p.name }}</router-link><p class="small muted">{{ p.code }} · {{ p.team }}{{ p.endUserAccountId ? ' · ผู้ใช้ ' + account(p.endUserAccountId)?.name : '' }}</p></td>
              <td><StageBadge :stage="p.stage" /></td>
              <td class="r num">{{ baht(dealValue(p)) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
      <aside class="side">
        <section v-if="children.length" class="panel">
          <h3>หน่วยงานในสังกัด</h3>
          <ul class="plain"><li v-for="c in children" :key="c.id"><router-link :to="`/accounts/${c.id}`">{{ c.name }}</router-link></li></ul>
        </section>
        <section class="panel">
          <h3>ประกันและ MA</h3>
          <ul v-if="expiring.length" class="plain"><li v-for="p in expiring" :key="p.id">{{ p.name }}<span class="small muted"> · หมด {{ thDate(p.endWarranty) }}</span></li></ul>
          <p v-else class="muted small">ไม่มีโครงการในระยะประกัน</p>
        </section>
        <section v-if="lost.length" class="panel">
          <h3>งานที่แพ้</h3>
          <ul class="plain"><li v-for="p in lost" :key="p.id">{{ p.name }}<p class="small muted">{{ p.loss!.reason }}{{ p.loss!.competitor ? ' · ' + p.loss!.competitor : '' }}</p></li></ul>
        </section>
      </aside>
    </div>
  </div>
  <div v-else class="page"><h1>ไม่พบลูกค้า</h1><router-link to="/accounts">กลับไปทะเบียนลูกค้า</router-link></div>
</template>

<style scoped>
.back { color: var(--muted); display: inline-block; margin-bottom: 8px; }
.grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; align-items: start; }
.side { display: grid; gap: 16px; }
.side h3 { margin-bottom: 10px; }
.plain { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; font-size: 14px; }
@media (max-width: 1000px) { .grid { grid-template-columns: 1fr; } }
</style>
