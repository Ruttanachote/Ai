<script setup lang="ts">
import { computed } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import KpiStrip from '../components/KpiStrip.vue'
import Avatar from '../components/Avatar.vue'
import StageBadge from '../components/StageBadge.vue'
import { scope } from '../store'
import { TODAY_ISO } from '../data/mock'
import { WORKSPACE_TEMPLATES } from '../data/model'
import { lateTasks, progressPct } from '../domain/metrics'
import { customerName } from '../display'

// Entry to the PM module: every post-handover project and whether its workspace exists.
const list = computed(() => scope.value.list.filter((p) => ['handover', 'delivery', 'warranty'].includes(p.stage) || p.workspace))
const kpis = computed(() => {
  const ws = list.value.filter((p) => p.workspace)
  const open = ws.flatMap((p) => (p.tasks ?? []).filter((t) => t.status !== 'done' && t.type !== 'epic'))
  return [
    { label: 'พื้นที่งาน', value: String(ws.length), note: `จาก ${list.value.length} โครงการหลัง Handover` },
    { label: 'งานที่ยังไม่เสร็จ', value: String(open.length), note: 'ไม่นับ Epic' },
    { label: 'เลยกำหนด', value: String(ws.reduce((s, p) => s + lateTasks(p, TODAY_ISO).length, 0)), note: 'ทุกพื้นที่งาน', tone: ws.some((p) => lateTasks(p, TODAY_ISO).length) ? ('bad' as const) : ('' as const) },
    { label: 'รอสร้างพื้นที่งาน', value: String(list.value.length - ws.length), note: 'PM เลือกรูปแบบหลัง Handover', tone: list.value.length > ws.length ? ('warn' as const) : ('' as const) },
  ]
})
</script>

<template>
  <div class="page">
    <PageHeader module="ส่งมอบโครงการ" title="พื้นที่งานโครงการ" :scope="scope.label" subtitle="รายการ บอร์ด ปฏิทิน Timeline เอกสาร และแบบฟอร์มของแต่ละโครงการ" />
    <KpiStrip :items="kpis" />
    <div class="panel flush scroll-x">
      <table class="table">
        <thead><tr><th>โครงการ</th><th>รหัสงาน</th><th>รูปแบบ</th><th>สถานะโครงการ</th><th class="r">ความคืบหน้า</th><th class="r">งานเลยกำหนด</th><th>PM</th><th /></tr></thead>
        <tbody>
          <tr v-for="p in list" :key="p.id">
            <td><router-link :to="`/work/${p.id}`" class="nm">{{ p.name }}</router-link><p class="small muted">{{ customerName(p) }} · {{ p.team }}</p></td>
            <td><span v-if="p.workspace" class="key">{{ p.workspace.key }}</span><span v-else class="muted small">—</span></td>
            <td class="small">{{ p.workspace ? WORKSPACE_TEMPLATES[p.workspace.template].label : 'ยังไม่สร้าง' }}</td>
            <td><StageBadge :stage="p.stage" /></td>
            <td class="r num">{{ p.workspace ? progressPct(p) + '%' : '—' }}</td>
            <td class="r num" :class="{ bad: lateTasks(p, TODAY_ISO).length }">{{ p.workspace ? lateTasks(p, TODAY_ISO).length : '—' }}</td>
            <td><Avatar :id="p.pm" :label="p.pm ? undefined : '?'" :size="26" /></td>
            <td><router-link :to="`/work/${p.id}`" class="btn sm" :class="{ primary: !p.workspace }">{{ p.workspace ? 'เปิด' : 'สร้างพื้นที่งาน' }}</router-link></td>
          </tr>
          <tr v-if="!list.length"><td colspan="8" class="muted">ยังไม่มีโครงการหลัง Handover</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.flush { padding: 4px 8px; }
.nm { font-weight: 600; color: var(--ink); }
.key { font: 600 12px var(--display); background: var(--ink); color: #fff; padding: 2px 8px; border-radius: 4px; }
.bad { color: var(--lose); }
</style>
