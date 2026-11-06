<script setup lang="ts">
import { computed } from 'vue'
import StageBadge from '../components/StageBadge.vue'
import { ACCOUNTS, account, baht, daysUntil, mb, thDate } from '../data/mock'
import { projects } from '../store'
import { winRate } from '../domain/rules'

const props = defineProps<{ id: string }>()
const a = computed(() => account(props.id))
const children = computed(() => ACCOUNTS.filter((x) => x.parentId === props.id))
const ids = computed(() => [props.id, ...children.value.map((c) => c.id)])
const list = computed(() => projects.filter((p) => ids.value.includes(p.customerAccountId ?? '') || ids.value.includes(p.endUserAccountId ?? '')))
const WON = ['win', 'handover', 'delivery', 'warranty', 'ended']
const won = computed(() => list.value.filter((p) => WON.includes(p.stage)).reduce((s, p) => s + (p.contractValue ?? p.revenue), 0))
const pipe = computed(() => list.value.filter((p) => ['opportunity', 'pipeline', 'forecast', 'rebidding'].includes(p.stage)).reduce((s, p) => s + (p.revenue || p.budget), 0))
const expiring = computed(() => list.value.filter((p) => p.endWarranty && daysUntil(p.endWarranty) > 0).sort((x, y) => x.endWarranty!.localeCompare(y.endWarranty!)))
const lost = computed(() => list.value.filter((p) => p.loss))
</script>

<template>
  <div v-if="a" class="page">
    <router-link to="/accounts" class="back small">‹ ทะเบียนลูกค้า</router-link>
    <header class="page-head">
      <div>
        <h1>{{ a.name }}</h1>
        <p>{{ a.taxId ? 'เลขประจำตัวผู้เสียภาษี ' + a.taxId + ' · ' : '' }}{{ a.province ?? '' }}<template v-if="a.parentId"> · สังกัด <router-link :to="`/accounts/${a.parentId}`">{{ account(a.parentId)?.name }}</router-link></template></p>
      </div>
    </header>

    <section class="kpis">
      <div><span>ยอดที่ชนะทั้งหมด</span><strong class="num">{{ mb(won) }}</strong></div>
      <div><span>Pipeline ที่เปิดอยู่</span><strong class="num">{{ mb(pipe) }}</strong></div>
      <div><span>Win rate กับลูกค้านี้</span><strong class="num">{{ Math.round(winRate(list) * 100) }}%</strong></div>
      <div><span>ประกันใกล้หมด</span><strong class="num">{{ expiring[0] ? daysUntil(expiring[0].endWarranty) + ' วัน' : '—' }}</strong></div>
    </section>

    <div class="grid">
      <section class="panel">
        <div class="panel-head"><h2>โครงการ</h2></div>
        <table class="table">
          <tbody>
            <tr v-for="p in list" :key="p.id">
              <td><router-link :to="`/projects/${p.id}`">{{ p.name }}</router-link><p class="small muted">{{ p.code }} · {{ p.team }}{{ p.endUserAccountId ? ' · ผู้ใช้ ' + account(p.endUserAccountId)?.name : '' }}</p></td>
              <td><StageBadge :stage="p.stage" /></td>
              <td class="r num">{{ baht(p.contractValue ?? (p.revenue || p.budget)) }}</td>
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
.kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
.kpis div { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); padding: 14px 16px; display: grid; }
.kpis span { font-size: 13px; color: var(--muted); }
.kpis strong { font-size: 24px; font-weight: 600; }
.grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; align-items: start; }
.side { display: grid; gap: 16px; }
.side h3 { margin-bottom: 10px; }
.plain { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; font-size: 14px; }
@media (max-width: 1000px) { .grid { grid-template-columns: 1fr; } .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
