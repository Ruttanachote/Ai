<script setup lang="ts">
import { computed, ref } from 'vue'
import StageBadge from '../components/StageBadge.vue'
import Avatar from '../components/Avatar.vue'
import { projects, session } from '../store'
import { baht, person } from '../data/mock'
import { STAGES, type Phase } from '../data/model'

const q = ref('')
const phase = ref<Phase | 'all'>('all')
const type = ref('all')

// Each role starts with the slice it works in; heads and execs see everything.
const base = computed(() => {
  if (session.role === 'sm') return projects.filter((p) => p.sm === session.userId)
  if (session.role === 'pm') return projects.filter((p) => p.pm === session.userId)
  if (session.role === 'ma') return projects.filter((p) => ['warranty', 'ended'].includes(p.stage))
  return projects
})
const list = computed(() =>
  base.value.filter((p) => {
    const s = STAGES.find((x) => x.key === p.stage)!
    if (phase.value !== 'all' && s.phase !== phase.value) return false
    if (type.value !== 'all' && p.type !== type.value) return false
    const t = q.value.trim().toLowerCase()
    return !t || [p.name, p.customer, p.code, p.team].some((v) => v.toLowerCase().includes(t))
  }),
)
const margin = (r: number, c: number) => (r ? (((r - c) / r) * 100).toFixed(1) + '%' : '—')
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <h1>ทะเบียนโครงการ</h1>
        <p>{{ session.role === 'sm' ? 'โครงการที่คุณเป็น Owner' : session.role === 'pm' ? 'โครงการที่คุณเป็น PM' : session.role === 'ma' ? 'โครงการในระยะประกันและ MA' : 'ทุกโครงการทุกทีม DT' }} · {{ list.length }} รายการ</p>
      </div>
      <router-link v-if="['sm', 'head', 'admin'].includes(session.role)" to="/projects/new" class="btn primary">ลงทะเบียนโครงการ</router-link>
    </header>

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
        <thead><tr><th>โครงการ</th><th>สถานะ</th><th>ประเภท</th><th>ทีม</th><th class="r">รายได้</th><th class="r">GP</th><th>ผู้รับผิดชอบ</th></tr></thead>
        <tbody>
          <tr v-for="p in list" :key="p.id">
            <td>
              <router-link :to="`/projects/${p.id}`" class="name">{{ p.name }}</router-link>
              <p class="muted small">{{ p.code }} · {{ p.customer }}<template v-if="p.parentId"> · ต่อจากโครงการเดิม</template></p>
            </td>
            <td><StageBadge :stage="p.stage" /></td>
            <td>{{ p.type }}</td>
            <td>{{ p.team }}</td>
            <td class="r num">{{ p.revenue ? baht(p.revenue) : '—' }}</td>
            <td class="r num">{{ margin(p.revenue, p.cost) }}</td>
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
