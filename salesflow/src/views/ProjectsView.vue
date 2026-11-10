<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import PipelineView from './PipelineView.vue'
import { NButton, NDataTable, NEmpty, NInput, NRadioButton, NRadioGroup, NSelect, type DataTableColumns } from 'naive-ui'
import Icon from '../components/Icon.vue'
import StageBadge from '../components/StageBadge.vue'
import Avatar from '../components/Avatar.vue'
import PageHeader from '../components/PageHeader.vue'
import KpiStrip from '../components/KpiStrip.vue'
import { scope, session } from '../store'
import { baht, mb, person, TODAY_ISO } from '../data/mock'
import { STAGES, stageOf, type Phase, type Project } from '../data/model'
import { dealValue, gpPct, isOpen, isWon, bookedValue, pipelineValue, sum, approvalState, APPROVAL_LABEL } from '../domain/metrics'
import { customerName } from '../display'

// One register for sales: list view, pipeline board, and "register a new project" (starts at Opportunity).
const route = useRoute()
const salesRole = computed(() => ['sm', 'head', 'admin'].includes(session.role))
const canRegister = computed(() => ['sm', 'admin'].includes(session.role))
const view = ref<'list' | 'board'>(route.query.view === 'board' && ['sm', 'head', 'admin'].includes(session.role) ? 'board' : 'list')
watch(view, (v) => useRouterReplace(v))
const q = ref('')
const phase = ref<Phase | 'all'>('all')
const type = ref('all')

const base = computed(() => scope.value.list)
const list = computed(() =>
  base.value.filter((p) => {
    if (phase.value !== 'all' && stageOf(p.stage).phase !== phase.value) return false
    if (type.value !== 'all' && p.type !== type.value) return false
    const t = q.value.trim().toLowerCase()
    return !t || [p.name, customerName(p), p.code, p.team].some((v) => v.toLowerCase().includes(t))
  }),
)
// Register table (Naive UI): sortable columns, stage/team filters in the header, pagination,
// row click opens the project. Same scope + metrics as every other page.
const router = useRouter()
const typeOptions = [{ label: 'ทุกประเภท', value: 'all' }, ...['ซื้อขาย', 'เช่าซื้อ', 'พัฒนาระบบ', 'MA'].map((v) => ({ label: v, value: v }))]
const teams = computed(() => [...new Set(base.value.map((p) => p.team))].sort())
const columns = computed<DataTableColumns<Project>>(() => [
  {
    title: 'โครงการ', key: 'name', minWidth: 260, sorter: (a, b) => a.name.localeCompare(b.name, 'th'),
    render: (p) => h('div', [
      h(RouterLink, { to: `/projects/${p.id}`, class: 'name', onClick: (e: Event) => e.stopPropagation() }, { default: () => p.name }),
      h('p', { class: 'muted small' }, `${p.code} · ${customerName(p)} · ${p.type}${p.parentId ? ' · ต่อจากโครงการเดิม' : ''}`),
    ]),
  },
  {
    title: 'สถานะ', key: 'stage', width: 150, sorter: (a, b) => STAGES.findIndex((x) => x.key === a.stage) - STAGES.findIndex((x) => x.key === b.stage),
    filterOptions: STAGES.filter((st) => base.value.some((p) => p.stage === st.key)).map((st) => ({ label: st.label, value: st.key })), filter: (v, p) => p.stage === v,
    render: (p) => h(StageBadge, { stage: p.stage }),
  },
  { title: 'ใบเสนอราคา', key: 'approval', width: 130, render: (p) => { const a = APPROVAL_LABEL[approvalState(p, TODAY_ISO)]; return h('span', { class: ['chip', a.tone] }, a.label) } },
  { title: 'ทีม', key: 'team', width: 90, filterOptions: teams.value.map((t) => ({ label: t, value: t })), filter: (v, p) => p.team === v },
  {
    title: 'มูลค่า', key: 'value', width: 140, align: 'right', sorter: (a, b) => dealValue(a) - dealValue(b),
    render: (p) => h('div', { class: 'num' }, [dealValue(p) ? baht(dealValue(p)) : '—', h('p', { class: 'small muted' }, isWon(p) ? 'ตามสัญญา' : p.revenue ? 'ราคาเสนอ' : 'Budget')]),
  },
  { title: 'GP', key: 'gp', width: 80, align: 'right', sorter: (a, b) => (gpPct(a) ?? -1) - (gpPct(b) ?? -1), render: (p) => h('span', { class: 'num' }, gpPct(p) === null ? '—' : gpPct(p)!.toFixed(1) + '%') },
  {
    title: 'ผู้รับผิดชอบ', key: 'owner', width: 180,
    render: (p) => h('span', { class: 'ppl' }, [h(Avatar, { id: p.sm, size: 26 }), p.pm ? h(Avatar, { id: p.pm, size: 26 }) : null, h('span', { class: 'small muted' }, person(p.pm ?? p.sm)?.name)]),
  },
])
function useRouterReplace(v: 'list' | 'board') { router.replace({ query: v === 'board' ? { view: 'board' } : {} }) }
const rowProps = (p: Project) => ({ style: 'cursor: pointer', onClick: () => router.push(`/projects/${p.id}`) })
const page = ref(1)
const clear = () => { q.value = ''; phase.value = 'all'; type.value = 'all' }

const kpis = computed(() => [
  { label: 'โครงการทั้งหมด', value: String(list.value.length), note: list.value.length === base.value.length ? 'ไม่ได้กรอง' : `กรองจาก ${base.value.length}` },
  { label: 'ช่วงขาย', value: mb(sum(list.value.filter(isOpen), pipelineValue)), note: `${list.value.filter(isOpen).length} ดีล` },
  { label: 'ชนะแล้ว', value: mb(sum(list.value.filter(isWon), bookedValue)), note: `${list.value.filter(isWon).length} โครงการ` },
  { label: 'รออนุมัติราคา', value: String(list.value.filter((p) => approvalState(p, TODAY_ISO) === 'pending').length), note: 'คำขอที่ยังไม่ครบทุกขั้น' },
])
</script>

<template>
  <div class="page">
    <PageHeader :module="salesRole ? 'Sales · ก่อนขาย' : 'Projects & Customers · ข้อมูลกลาง'" title="Project Register" :scope="scope.label" :subtitle="salesRole ? 'ทะเบียนโครงการ · Pipeline · ลงทะเบียนโครงการใหม่ (เริ่มที่สถานะ Opportunity)' : `${list.length} รายการ`">
      <div v-if="salesRole" class="seg" role="radiogroup" aria-label="มุมมอง">
        <button role="radio" :aria-checked="view === 'list'" @click="view = 'list'">รายการ</button>
        <button role="radio" :aria-checked="view === 'board'" @click="view = 'board'">Pipeline</button>
      </div>
      <router-link v-if="canRegister" to="/projects/new" class="btn primary">+ ลงทะเบียนโครงการใหม่</router-link>
    </PageHeader>

    <PipelineView v-if="view === 'board'" embedded />
    <template v-else>
    <KpiStrip :items="kpis" />

    <div class="filters">
      <NInput v-model:value="q" clearable placeholder="ค้นหาชื่อ ลูกค้า รหัส หรือทีม" aria-label="ค้นหาโครงการ" class="q"><template #prefix><Icon name="search" :size="16" /></template></NInput>
      <NRadioGroup v-model:value="phase" aria-label="ช่วงงาน">
        <NRadioButton v-for="o in [{ k: 'all', l: 'ทั้งหมด' }, { k: 'presale', l: 'ช่วงขาย' }, { k: 'result', l: 'ผลการขาย' }, { k: 'postsale', l: 'หลังขาย' }]" :key="o.k" :value="o.k">{{ o.l }}</NRadioButton>
      </NRadioGroup>
      <NSelect v-model:value="type" :options="typeOptions" class="ty" aria-label="ประเภทโครงการ" />
    </div>

    <NDataTable :columns="columns" :data="list" :row-key="(p: Project) => p.id" :row-props="rowProps" :bordered="false" :scroll-x="1040"
      :pagination="{ page, pageSize: 10, onUpdatePage: (n: number) => (page = n), showSizePicker: false }" class="reg">
      <template #empty>
        <NEmpty description="ไม่พบโครงการที่ตรงกับตัวกรอง"><template #extra><NButton size="small" @click="clear">ล้างตัวกรอง</NButton></template></NEmpty>
      </template>
    </NDataTable>
    </template>
  </div>
</template>

<style scoped>
.filters { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
.q { max-width: 340px; }
.ty { width: 160px; }
.reg { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
.reg :deep(.name) { font-weight: 600; color: var(--ink); }
.reg :deep(.ppl) { display: flex; align-items: center; gap: 4px; }
.reg :deep(.ppl .small) { margin-left: 6px; white-space: nowrap; }
.reg :deep(.n-data-table__pagination) { padding: 10px 14px; }
</style>
