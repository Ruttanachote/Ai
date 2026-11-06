<script setup lang="ts">
import { computed, reactive } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import KpiStrip from '../components/KpiStrip.vue'
import Avatar from '../components/Avatar.vue'
import { notify, projects, scope, session, tickets } from '../store'
import { CONTRACTS, daysUntil, thDate } from '../data/mock'
import { customerName } from '../display'

// Call center (under the MA team) logs customer cases from Helpdesk. Before logging, the page
// checks the system is covered — in warranty or under an active MA contract — so uncovered
// requests go to the MA team as a renewal lead instead of a free fix.
const covered = computed(() =>
  scope.value.list.filter((p) => p.stage === 'warranty' && daysUntil(p.endWarranty) >= 0),
)
const expired = computed(() => projects.filter((p) => p.stage === 'ended' || (p.endWarranty && daysUntil(p.endWarranty) < 0)))

const IMPACT = ['ทั้งระบบใช้งานไม่ได้', 'บางฟังก์ชันใช้ไม่ได้', 'ใช้ได้แต่ไม่สะดวก']
const URGENCY = ['กระทบประชาชน / บริการหลัก', 'กระทบงานภายใน', 'รอได้']
// ITIL-style priority matrix: impact × urgency → P1–P3; a feature request is a CR, not an incident.
const priorityOf = (i: number, u: number) => (i + u <= 1 ? 'P1' : i + u <= 2 ? 'P2' : 'P3')
const SLA: Record<string, string> = { P1: '4 ชม.', P2: '8 ชม.', P3: '3 วัน', CR: '—' }

const f = reactive({ projectId: '', title: '', channel: 'Helpdesk', impact: 1, urgency: 1, isCr: false, contact: '' })
const project = computed(() => projects.find((p) => p.id === f.projectId))
const coverage = computed(() => {
  const p = project.value
  if (!p) return null
  const inCover = covered.value.includes(p)
  return { ok: inCover, text: inCover ? `อยู่ในความคุ้มครองถึง ${thDate(p.endWarranty)} · SLA ${CONTRACTS[p.id] ? 'ตามสัญญา' : 'มาตรฐาน 8x5'}` : 'หมดความคุ้มครองแล้ว — บันทึกเป็นโอกาสต่อ MA ให้ทีม MA ติดต่อลูกค้า' }
})
const priority = computed(() => (f.isCr ? 'CR' : priorityOf(f.impact, f.urgency)))

function log() {
  if (!project.value || !f.title.trim()) return
  const id = 'MA-' + (2312 + tickets.length)
  tickets.unshift({
    id, project: project.value.id, title: f.title.trim(), severity: priority.value,
    status: coverage.value?.ok ? 'รับเรื่องแล้ว' : 'ส่งทีม MA เสนอต่อสัญญา', opened: 'วันนี้', sla: SLA[priority.value],
    left: SLA[priority.value], owner: priority.value === 'P1' ? 'wm' : session.userId, resp: 'ตอบรับทันที', used: 0, paused: false, channel: f.channel,
  })
  notify(priority.value === 'P1' ? `เปิด ${id} (P1) และแจ้งทีม MA ทันที` : `เปิด ${id} แล้ว`)
  Object.assign(f, { title: '', contact: '', isCr: false })
}

const queue = computed(() => tickets.filter((t) => scope.value.list.some((p) => p.id === t.project)))
const kpis = computed(() => [
  { label: 'ระบบที่อยู่ในความคุ้มครอง', value: String(covered.value.length), note: 'ประกันหรือสัญญา MA' },
  { label: 'เคสเปิดอยู่', value: String(queue.value.filter((t) => t.severity !== 'CR').length), note: queue.value.filter((t) => t.severity === 'P1').length + ' เคส P1' },
  { label: 'เกิน SLA', value: String(queue.value.filter((t) => t.used >= 100).length), note: 'ส่งต่อหัวหน้าทีม MA', tone: queue.value.some((t) => t.used >= 100) ? ('bad' as const) : ('' as const) },
  { label: 'ขอแก้หลังหมดประกัน', value: String(expired.value.length), note: 'โอกาสต่อสัญญา MA' },
])
</script>

<template>
  <div class="page">
    <PageHeader module="ประกันและ MA" title="Helpdesk" :scope="scope.label" subtitle="Call center รับเคสลูกค้า ตรวจความคุ้มครอง แล้วส่งให้ทีม MA" />
    <KpiStrip :items="kpis" />

    <div class="grid">
      <form class="panel form" novalidate @submit.prevent="log">
        <h2>รับเรื่องใหม่</h2>
        <div class="field">
          <label for="hp">ระบบของลูกค้า</label>
          <select id="hp" v-model="f.projectId" class="input">
            <option value="" disabled>เลือกโครงการ</option>
            <optgroup label="อยู่ในความคุ้มครอง"><option v-for="p in covered" :key="p.id" :value="p.id">{{ p.name }} · {{ customerName(p) }}</option></optgroup>
            <optgroup v-if="expired.length" label="หมดความคุ้มครอง"><option v-for="p in expired" :key="p.id" :value="p.id">{{ p.name }} · {{ customerName(p) }}</option></optgroup>
          </select>
          <span v-if="coverage" class="cov" :class="coverage.ok ? 'ok' : 'no'">{{ coverage.text }}</span>
        </div>
        <div class="field"><label for="ht">อาการที่ลูกค้าแจ้ง</label><textarea id="ht" v-model="f.title" class="input" rows="2" /></div>
        <div class="two">
          <div class="field"><label for="hi">ผลกระทบ</label><select id="hi" v-model.number="f.impact" class="input" :disabled="f.isCr"><option v-for="(x, i) in IMPACT" :key="x" :value="i">{{ x }}</option></select></div>
          <div class="field"><label for="hu">ความเร่งด่วน</label><select id="hu" v-model.number="f.urgency" class="input" :disabled="f.isCr"><option v-for="(x, i) in URGENCY" :key="x" :value="i">{{ x }}</option></select></div>
        </div>
        <div class="two">
          <div class="field"><label for="hc">ช่องทาง</label><select id="hc" v-model="f.channel" class="input"><option>Helpdesk</option><option>โทรศัพท์</option><option>อีเมล</option><option>LINE OA</option></select></div>
          <div class="field"><label for="hn">ผู้ติดต่อ</label><input id="hn" v-model="f.contact" class="input" /></div>
        </div>
        <label class="cr"><input v-model="f.isCr" type="checkbox" /> เป็นคำขอเพิ่มความสามารถ (Change request) ไม่ใช่ปัญหา</label>
        <div class="pri"><span>ระดับ</span><b class="chip" :class="priority === 'P1' ? 'lose' : priority === 'CR' ? 'presale' : 'warn'">{{ priority }}</b><span class="muted small">SLA แก้ไข {{ SLA[priority] }}</span></div>
        <button class="btn primary" type="submit" :disabled="!f.projectId || !f.title.trim()">เปิดเคส</button>
      </form>

      <section class="panel flush scroll-x">
        <div class="panel-head pad"><h2>คิวเคส</h2></div>
        <table class="table">
          <thead><tr><th>ระดับ</th><th>เรื่อง</th><th>ช่องทาง</th><th>สถานะ</th><th>ผู้รับผิดชอบ</th></tr></thead>
          <tbody>
            <tr v-for="t in queue" :key="t.id">
              <td><span class="chip" :class="t.severity === 'P1' ? 'lose' : t.severity === 'CR' ? 'presale' : 'warn'">{{ t.severity }}</span></td>
              <td><strong class="tt">{{ t.title }}</strong><p class="small muted">{{ t.id }} · {{ projects.find((p) => p.id === t.project)?.name }} · {{ t.opened }}</p></td>
              <td class="small">{{ t.channel }}</td>
              <td class="small">{{ t.status }}</td>
              <td><Avatar :id="t.owner" :size="26" /></td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 400px minmax(0, 1fr); gap: 20px; align-items: start; }
.form { display: grid; gap: 14px; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.cov { font-size: 12.5px; padding: 6px 10px; border-radius: var(--r-sm); }
.cov.ok { background: var(--win-soft); color: var(--win); }
.cov.no { background: var(--warn-soft); color: var(--warn); }
.cr { display: flex; gap: 8px; align-items: center; font-size: 13.5px; }
.cr input { accent-color: var(--ink); width: 16px; height: 16px; }
.pri { display: flex; gap: 10px; align-items: center; font-size: 14px; }
.flush { padding: 4px 8px; }
.pad { padding: 16px 12px 0; }
.tt { font-weight: 500; }
@media (max-width: 1000px) { .grid { grid-template-columns: 1fr; } }
</style>
