<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Dialog from './Dialog.vue'
import type { Project } from '../data/model'
import { TICKETS, CONTRACTS, baht, daysUntil, thDate } from '../data/mock'
import { bookedValue } from '../domain/metrics'
import { notify, projects, session } from '../store'

const props = defineProps<{ p: Project }>()
const router = useRouter()
const left = computed(() => daysUntil(props.p.endWarranty))
const renewOpen = ref(false)
const maPrice = ref(Math.round(bookedValue(props.p) * (CONTRACTS[props.p.id]?.uplift ?? 0.12)))
const canAct = computed(() => ['ma', 'head', 'admin', 'sm'].includes(session.role))

// Notice cadence: 90 days (internal), 60 days (SM/Sale prepare price), 30 days (letter to customer), 0 (end).
const notices = computed(() => [
  { d: 180, who: 'ลูกค้าภาครัฐ', what: 'แจ้งลูกค้าตั้งงบ MA ในคำของบประมาณปีถัดไป (รอบยื่นคำของบราว พ.ค.)' },
  { d: 120, who: 'ภายใน · MA + SM', what: 'สรุปการใช้งาน Ticket SLA และคะแนนสุขภาพลูกค้า เตรียมเสนอต่อ' },
  { d: 90, who: 'ภายใน · SM', what: 'ทำใบเสนอราคา MA (ค่าเริ่มต้น 12% ของมูลค่าเดิม ปรับได้) และขออนุมัติ' },
  { d: 60, who: 'ลูกค้า', what: 'ส่งใบเสนอราคา MA ก่อนกำหนดแจ้งต่อสัญญาตามสัญญา' },
  { d: 30, who: 'ลูกค้า', what: 'ส่งหนังสือแจ้งหมดประกัน พร้อมสอบถามการต่อ MA และแนบใบเสนอราคา' },
  { d: 7, who: 'ลูกค้า', what: 'ติดตามคำตอบ ถ้ายังไม่ตอบ แจ้งหัวหน้ากลุ่ม' },
  { d: 0, who: 'ระบบ', what: 'หมดประกัน → ปิดโครงการ (Ended) หรือเปิดโครงการ MA ใหม่' },
])
const tickets = computed(() => TICKETS.filter((t) => t.project === props.p.id))

function renew() {
  const id = 'p' + (projects.length + 1)
  projects.push({
    ...props.p, id, code: 'MA-69-' + String(projects.length + 1).padStart(4, '0'), name: 'MA ปีที่ 2 — ' + props.p.name, type: 'MA',
    stage: 'opportunity', revenue: maPrice.value, cost: Math.round(maPrice.value * 0.55), budget: maPrice.value, parentId: props.p.id,
    approval: undefined, milestones: undefined, tasks: undefined, startWarranty: undefined, endWarranty: undefined,
    nextStep: 'ทำใบเสนอราคา MA และส่งขออนุมัติ',
    history: [{ stage: 'opportunity', note: `เปิดจากโครงการเดิม ${props.p.code}`, at: 'วันนี้', by: 'Wichai M.' }],
  })
  renewOpen.value = false
  notify('สร้างโครงการ MA ใหม่ใต้โครงการเดิมแล้ว')
  router.push('/projects/' + id)
}
</script>

<template>
  <div class="ma">
    <section class="panel count">
      <p class="muted small">ระยะรับประกัน {{ thDate(p.startWarranty) }} – {{ thDate(p.endWarranty) }}</p>
      <p class="days num" :class="{ hot: left <= 30 }">{{ left > 0 ? left : 0 }}<span>วันก่อนหมดประกัน</span></p>
      <div class="bar"><i :style="{ width: Math.max(0, Math.min(100, 100 - (left / 365) * 100)) + '%' }" /></div>
      <div v-if="canAct" class="acts">
        <button class="btn primary" @click="notify('สร้างหนังสือแจ้งหมดประกันจาก Template และส่งให้ลูกค้าทางอีเมลแล้ว')">ส่งหนังสือแจ้งหมดประกัน</button>
        <button class="btn" @click="renewOpen = true">ลูกค้าต่อ MA — เปิดโครงการใหม่</button>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head"><h2>แจ้งเตือนอัตโนมัติ</h2><span class="muted small">อ้างอิงวันหมดประกัน</span></div>
      <ol class="tl">
        <li v-for="n in notices" :key="n.d" :class="{ past: left <= n.d, next: left > n.d && notices.filter((m) => left > m.d)[0]?.d === n.d }">
          <span class="d num">{{ n.d === 0 ? 'วันหมด' : n.d + ' วัน' }}</span>
          <div><strong>{{ n.what }}</strong><p class="small muted">{{ n.who }} · {{ thDate(new Date(new Date(p.endWarranty!).getTime() - n.d * 86400000).toISOString()) }}</p></div>
        </li>
      </ol>
    </section>

    <section class="panel">
      <div class="panel-head"><h2>Ticket ในระยะประกัน</h2><span class="muted small">SLA ตามสัญญา: P1 4 ชม. · P2 8 ชม. · P3 3 วันทำการ</span></div>
      <table v-if="tickets.length" class="table">
        <tbody>
          <tr v-for="t in tickets" :key="t.id">
            <td><span class="chip" :class="t.severity === 'P1' ? 'lose' : t.severity === 'CR' ? 'presale' : 'warn'">{{ t.severity }}</span></td>
            <td><strong>{{ t.title }}</strong><p class="small muted">{{ t.id }} · เปิด {{ t.opened }}</p></td>
            <td>{{ t.status }}</td>
            <td class="r small" :class="t.left.startsWith('เกิน') ? 'bad' : 'muted'">{{ t.left }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="muted">ไม่มี Ticket ค้าง</p>
    </section>
  </div>

  <Dialog :open="renewOpen" title="เปิดโครงการ MA ใหม่" @close="renewOpen = false">
    <p>ระบบจะสร้างโครงการประเภท MA ใต้ <strong>{{ p.code }}</strong> คัดลอกลูกค้า ทีม และผู้ติดต่อ แล้วเริ่มที่สถานะ Opportunity เพื่อทำใบเสนอราคาและขออนุมัติตามขั้นตอนขาย</p>
    <div class="field">
      <label for="mp">มูลค่า MA ต่อปี (ประมาณการ)</label>
      <input id="mp" v-model.number="maPrice" class="input num" type="number" min="0" step="10000" />
      <span class="hint">ค่าเริ่มต้น {{ Math.round((CONTRACTS[p.id]?.uplift ?? 0.12) * 100) }}% ของมูลค่าตามสัญญาเดิม ({{ baht(bookedValue(p)) }}) — ตัวเลขเดียวกับหน้าประกันและ MA</span>
    </div>
    <template #foot><button class="btn" @click="renewOpen = false">ยกเลิก</button><button class="btn primary" @click="renew">สร้างโครงการ MA</button></template>
  </Dialog>
</template>

<style scoped>
.ma { display: grid; grid-template-columns: 360px 1fr; gap: 20px; align-items: start; }
.ma > .panel:last-child { grid-column: 1 / -1; }
.count { display: grid; gap: 12px; }
.days { font-size: 64px; font-weight: 700; line-height: 1; display: grid; }
.days span { font-size: 14px; font-weight: 500; color: var(--muted); font-family: var(--font); margin-top: 6px; }
.days.hot { color: var(--lose); }
.bar { height: 8px; background: var(--idle-soft); border-radius: 99px; overflow: hidden; }
.bar i { display: block; height: 100%; background: var(--post); }
.acts { display: grid; gap: 8px; margin-top: 8px; }
.tl { list-style: none; margin: 0; padding: 0; display: grid; }
.tl li { display: grid; grid-template-columns: 72px 1fr; gap: 14px; padding: 10px 0; border-bottom: 1px solid var(--line); }
.tl li:last-child { border-bottom: 0; }
.tl strong { font-weight: 500; }
.d { font-weight: 600; font-size: 14px; color: var(--muted); }
.past { opacity: 0.55; }
.past .d::after { content: ' ✓'; color: var(--win); }
.next .d { color: var(--brand); }
.next strong { font-weight: 600; }
.bad { color: var(--lose); }
@media (max-width: 1000px) { .ma { grid-template-columns: 1fr; } }
</style>
