<script setup lang="ts">
import { computed, ref } from 'vue'
import StageBadge from '../components/StageBadge.vue'
import Avatar from '../components/Avatar.vue'
import PageHeader from '../components/PageHeader.vue'
import KpiStrip from '../components/KpiStrip.vue'
import { scope, session } from '../store'
import { baht, mb, person, TODAY_ISO } from '../data/mock'
import { stageOf, type Phase } from '../data/model'
import { dealValue, gpPct, isOpen, isWon, bookedValue, pipelineValue, sum, approvalState, APPROVAL_LABEL } from '../domain/metrics'
import { customerName } from '../display'

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
const kpis = computed(() => [
  { label: 'โครงการทั้งหมด', value: String(list.value.length), note: list.value.length === base.value.length ? 'ไม่ได้กรอง' : `กรองจาก ${base.value.length}` },
  { label: 'ช่วงขาย', value: mb(sum(list.value.filter(isOpen), pipelineValue)), note: `${list.value.filter(isOpen).length} ดีล` },
  { label: 'ชนะแล้ว', value: mb(sum(list.value.filter(isWon), bookedValue)), note: `${list.value.filter(isWon).length} โครงการ` },
  { label: 'รออนุมัติราคา', value: String(list.value.filter((p) => approvalState(p, TODAY_ISO) === 'pending').length), note: 'คำขอที่ยังไม่ครบทุกขั้น' },
])
</script>

<template>
  <div class="page">
    <PageHeader module="งานขาย" title="ทะเบียนโครงการ" :scope="scope.label" :subtitle="`${list.length} รายการ`">
      <router-link v-if="['sm', 'head', 'admin'].includes(session.role)" to="/projects/new" class="btn primary">ลงทะเบียนโครงการ</router-link>
    </PageHeader>
    <KpiStrip :items="kpis" />

    <div class="filters">
      <input v-model="q" class="input" placeholder="ค้นหาชื่อ ลูกค้า รหัส หรือทีม" aria-label="ค้นหาโครงการ" />
      <div class="seg" role="radiogroup" aria-label="ช่วงงาน">
        <button v-for="o in [{ k: 'all', l: 'ทั้งหมด' }, { k: 'presale', l: 'ช่วงขาย' }, { k: 'result', l: 'ผลการขาย' }, { k: 'postsale', l: 'หลังขาย' }]" :key="o.k"
          role="radio" :aria-checked="phase === o.k" @click="phase = o.k as Phase | 'all'">{{ o.l }}</button>
      </div>
      <select v-model="type" class="input" aria-label="ประเภทโครงการ">
        <option value="all">ทุกประเภท</option>
        <option>ซื้อขาย</option><option>เช่าซื้อ</option><option>พัฒนาระบบ</option><option>MA</option>
      </select>
    </div>

    <div class="panel flush scroll-x">
      <table class="table">
        <thead><tr><th>โครงการ</th><th>สถานะ</th><th>ใบเสนอราคา</th><th>ทีม</th><th class="r">มูลค่า</th><th class="r">GP</th><th>ผู้รับผิดชอบ</th></tr></thead>
        <tbody>
          <tr v-for="p in list" :key="p.id">
            <td>
              <router-link :to="`/projects/${p.id}`" class="name">{{ p.name }}</router-link>
              <p class="muted small">{{ p.code }} · {{ customerName(p) }} · {{ p.type }}<template v-if="p.parentId"> · ต่อจากโครงการเดิม</template></p>
            </td>
            <td><StageBadge :stage="p.stage" /></td>
            <td><span class="chip" :class="APPROVAL_LABEL[approvalState(p, TODAY_ISO)].tone">{{ APPROVAL_LABEL[approvalState(p, TODAY_ISO)].label }}</span></td>
            <td>{{ p.team }}</td>
            <td class="r num">{{ dealValue(p) ? baht(dealValue(p)) : '—' }}<p class="small muted">{{ isWon(p) ? 'ตามสัญญา' : p.revenue ? 'ราคาเสนอ' : 'Budget' }}</p></td>
            <td class="r num">{{ gpPct(p) === null ? '—' : gpPct(p)!.toFixed(1) + '%' }}</td>
            <td>
              <span class="ppl"><Avatar :id="p.sm" :size="26" /><Avatar v-if="p.pm" :id="p.pm" :size="26" />
                <span class="small muted">{{ person(p.pm ?? p.sm)?.name }}</span></span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!list.length" class="empty">
        <p><strong>ไม่พบโครงการที่ตรงกับตัวกรอง</strong></p>
        <button class="btn sm" @click="q = ''; phase = 'all'; type = 'all'">ล้างตัวกรอง</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filters { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.filters > .input:first-child { max-width: 320px; }
.filters select { width: auto; }
.seg { display: inline-flex; background: var(--surface); border: 1px solid var(--line-strong); border-radius: var(--r-sm); padding: 3px; gap: 2px; }
.seg button { border: 0; background: none; padding: 0 12px; border-radius: 4px; font: 500 13.5px var(--font); color: var(--muted); cursor: pointer; min-height: 32px; }
.seg button[aria-checked='true'] { background: var(--ink); color: #fff; }
.flush { padding: 4px 8px; }
.name { font-weight: 600; color: var(--ink); }
.ppl { display: flex; align-items: center; gap: 4px; }
.ppl .small { margin-left: 6px; white-space: nowrap; }
.empty { text-align: center; padding: 40px 0; display: grid; gap: 12px; justify-items: center; }
</style>
