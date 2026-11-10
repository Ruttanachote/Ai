<script setup lang="ts">
import { computed } from 'vue'
import Avatar from '../components/Avatar.vue'
import Photo from '../components/Photo.vue'
import PageHeader from '../components/PageHeader.vue'
import KpiStrip from '../components/KpiStrip.vue'
import { scope, session } from '../store'
import { mb, thDate, daysSince, TODAY_ISO } from '../data/mock'
import { stageOf, catOf, type StageKey } from '../data/model'
import { isOpen, pipelineValue, weightedValue, sum, approvalState, APPROVAL_LABEL } from '../domain/metrics'
import { customerName } from '../display'

const COLS: StageKey[] = ['opportunity', 'pipeline', 'forecast', 'rebidding', 'win', 'lose']
const list = computed(() => scope.value.list)
const cols = computed(() =>
  COLS.map((k) => {
    const items = list.value.filter((p) => p.stage === k)
    return { k, s: stageOf(k), items, total: sum(items, pipelineValue) }
  }),
)
const open = computed(() => list.value.filter(isOpen))
const stale = (p: (typeof open.value)[number]) => !!p.stageSince && daysSince(p.stageSince) > (stageOf(p.stage).staleDays ?? 999)
const kpis = computed(() => [
  { label: 'ดีลที่เปิดอยู่', value: String(open.value.length), note: mb(sum(open.value, pipelineValue)) + ' มูลค่ารวม' },
  { label: 'Pipeline ถ่วงน้ำหนัก', value: mb(sum(open.value, weightedValue)), note: 'มูลค่า × โอกาสปิด', to: '/' },
  { label: 'Commit', value: mb(sum(open.value.filter((p) => catOf(p) === 'commit'), pipelineValue)), note: 'ตัวเลขส่งผู้บริหาร' },
  { label: 'ค้างนานเกินเกณฑ์', value: String(open.value.filter(stale).length), note: 'ดูรายละเอียดใน Dashboard', tone: open.value.some(stale) ? ('warn' as const) : ('' as const) },
])
</script>

<template>
  <div class="page wide">
    <PageHeader module="Sales · ก่อนขาย" title="Sales Pipeline" :scope="scope.label" subtitle="เปลี่ยนสถานะได้จากหน้ารายละเอียดโครงการ">
      <router-link v-if="['sm', 'admin'].includes(session.role)" to="/projects/new" class="btn primary">ลงทะเบียนโครงการ</router-link>
    </PageHeader>
    <KpiStrip :items="kpis" />

    <div class="board">
      <section v-for="c in cols" :key="c.k" class="col" :class="c.k">
        <header>
          <h3>{{ c.s.label }}</h3>
          <span class="muted small">{{ c.s.prob }}</span>
          <p class="sum"><b class="num">{{ mb(c.total) }}</b> · {{ c.items.length }} งาน</p>
        </header>
        <router-link v-for="p in c.items" :key="p.id" :to="`/projects/${p.id}`" class="card">
          <Photo :id="p.cover" :w="500" />
          <div class="body">
            <span class="code">{{ p.code }} · {{ p.team }}</span>
            <strong>{{ p.name }}</strong>
            <span class="muted small">{{ customerName(p) }}</span>
            <div class="foot">
              <span class="num val">{{ p.revenue ? mb(pipelineValue(p)) : 'Budget ' + mb(pipelineValue(p)) }}</span>
              <Avatar :id="p.sm" :size="24" />
            </div>
            <div class="chips">
              <span v-if="approvalState(p, TODAY_ISO) !== 'none'" class="chip" :class="APPROVAL_LABEL[approvalState(p, TODAY_ISO)].tone">{{ APPROVAL_LABEL[approvalState(p, TODAY_ISO)].label }} {{ p.approval?.version }}</span>
              <span v-if="p.bidDue && isOpen(p)" class="chip">ยื่นซอง {{ thDate(p.bidDue) }}</span>
              <span v-if="isOpen(p) && stale(p)" class="chip lose">ค้าง {{ daysSince(p.stageSince) }} วัน</span>
            </div>
          </div>
        </router-link>
        <p v-if="!c.items.length" class="empty">ไม่มีโครงการในสถานะนี้</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.wide { max-width: none; }
.board { display: grid; grid-template-columns: repeat(6, minmax(240px, 1fr)); gap: 14px; overflow-x: auto; padding-bottom: 12px; }
.col { background: var(--sunken); border: 1px solid var(--line); border-radius: var(--r-lg); padding: 14px; display: flex; flex-direction: column; gap: 10px; min-height: 420px; }
.col header { display: grid; grid-template-columns: 1fr auto; align-items: baseline; padding: 2px 4px 10px; border-bottom: 2px solid var(--presale); }
.col.win header { border-color: var(--win); }
.col.lose header { border-color: var(--lose); }
.sum { grid-column: 1 / -1; font-size: 13px; color: var(--muted); margin-top: 2px; }
.sum b { color: var(--ink); }
.card { display: block; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); overflow: hidden; color: var(--ink); transition: border-color var(--t-fast); }
.card:hover { text-decoration: none; border-color: var(--line-strong); }
.card .photo { height: 76px; }
.body { padding: 12px 14px 14px; display: grid; gap: 4px; }
.code { font-size: 12px; color: var(--faint); }
.body strong { font-weight: 600; line-height: 1.4; }
.foot { display: flex; align-items: center; justify-content: space-between; margin: 6px 0 4px; }
.val { font-weight: 600; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; }
.lose .card { opacity: 0.75; }
.empty { font-size: 13px; color: var(--faint); text-align: center; padding: 24px 0; }
</style>
