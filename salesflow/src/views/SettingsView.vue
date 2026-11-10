<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ROLES, type Role } from '../data/model'
import { TEAMS, GROUP_NAME, mb, thDate } from '../data/mock'
import { TH_GOV_2026 } from '../domain/calendar'
import { SETTINGS } from '../store'
import PageHeader from '../components/PageHeader.vue'

const tab = ref<'roles' | 'approval' | 'calendar' | 'channels' | 'teams' | 'm365'>('roles')
const R = Object.keys(ROLES) as Role[]
type Level = 'full' | 'own' | 'view' | ''
// Columns follow ROLES: SM, หัวหน้ากลุ่ม, รองผู้บริหาร, ผู้บริหาร, PMO, OPN, PM, Dev, MA, Call center, Admin
const MATRIX: { cap: string; v: Level[] }[] = [
  { cap: 'ลงทะเบียน / แก้ไขโครงการช่วงขาย', v: ['own', 'own', 'view', 'view', 'view', '', '', '', '', '', 'full'] },
  { cap: 'แก้ไข Cost Sheet และใบเสนอราคา (Man-day ตาม TOR)', v: ['own', 'view', 'view', 'view', '', '', '', '', '', '', 'full'] },
  { cap: 'อนุมัติ Cost Sheet และใบเสนอราคา', v: ['', '', 'full', 'full', '', '', '', '', '', '', 'full'] },
  { cap: 'เปลี่ยนสถานะ Opportunity → Close Win', v: ['own', 'own', 'full', 'full', '', '', '', '', '', '', 'full'] },
  { cap: 'เปิดโครงการใหม่จากงานที่แพ้ / ยกเลิกหลังชนะ', v: ['', 'own', 'full', 'full', '', '', '', '', '', '', 'full'] },
  { cap: 'จัดประชุม Handover · มอบหมาย PM', v: ['view', 'view', 'view', 'view', 'full', 'view', 'view', '', 'view', '', 'full'] },
  { cap: 'แผนงาน Task ความเสี่ยง CR', v: ['view', 'own', 'view', 'view', 'full', '', 'own', 'own', 'view', '', 'full'] },
  { cap: 'บอร์ดงาน · บันทึกเวลา · ขอ OT (Dev / QA / BA)', v: ['', 'view', '', '', 'view', '', 'full', 'own', '', '', 'full'] },
  { cap: 'My Tasks · Timesheet · แจ้งลา', v: ['own', 'own', 'own', 'own', 'own', 'own', 'own', 'own', 'own', 'own', 'full'] },
  { cap: 'ตั้งค่า Workflow / สมาชิก / Automation ของพื้นที่งาน', v: ['', '', '', '', 'view', '', 'own', '', '', '', 'full'] },
  { cap: 'อนุมัติ OT ในเงินกันของ Cost Sheet', v: ['', '', '', '', '', '', 'own', '', '', '', 'full'] },
  { cap: 'ขอซื้อ (PR) ตามงบ Cost Sheet', v: ['', '', '', '', '', 'view', 'own', '', '', '', 'full'] },
  { cap: 'อนุมัติเบิกจ่ายจัดซื้อ', v: ['', '', 'view', 'view', '', 'full', 'view', '', '', '', 'full'] },
  { cap: 'ประกัน หนังสือแจ้งลูกค้า ต่อสัญญา MA', v: ['view', 'view', 'view', 'view', 'view', '', '', '', 'full', 'view', 'full'] },
  { cap: 'ออกใบเสนอราคาต่อสัญญา MA', v: ['', '', '', '', '', '', '', '', 'full', '', 'full'] },
  { cap: 'รับเคส Helpdesk / Ticket', v: ['', '', '', '', '', '', '', '', 'full', 'full', 'full'] },
  { cap: 'Dashboard ยอดขาย', v: ['own', 'own', 'full', 'full', '', '', '', '', '', '', 'full'] },
  { cap: 'จัดการผู้ใช้ สิทธิ์ ทีม และ Template', v: ['', '', '', '', '', '', '', '', '', '', 'full'] },
]
const LBL: Record<Level, string> = { full: 'ทั้งหมด', own: 'ของตัวเอง', view: 'ดูได้', '': '—' }
const RULES = [
  { when: 'Cost Sheet + ใบเสนอราคา ทุกโครงการขาย', who: 'รองผู้บริหาร DT → ผู้บริหาร DT', sla: '2 + 2 วันทำการ' },
  { when: 'ขออนุมัติหลังได้งาน (PO ต่างจากที่อนุมัติ)', who: 'รองผู้บริหาร DT → ผู้บริหาร DT', sla: '2 + 2 วันทำการ' },
  { when: 'ใบเสนอราคาต่อสัญญา MA (ทีม MA ออกเอง)', who: 'รองผู้บริหาร DT → ผู้บริหาร DT', sla: '2 + 2 วันทำการ' },
  { when: 'เบิกจ่ายจัดซื้อ (PR) ภายในงบ Cost Sheet', who: 'OPN (DT3-2)', sla: '3 วันทำการ' },
  { when: 'OT ภายในเงินกันใน Cost Sheet', who: 'Project Manager', sla: 'ภายในสัปดาห์' },
  { when: 'OT เกินเงินกัน', who: 'หัวหน้าทีม Dev → รองผู้บริหาร DT', sla: '2 วันทำการ' },
]
const APPS = [
  { name: 'One Platform Web', use: 'หน้าเว็บ + API: เข้าสู่ระบบ, App Roles, อ่าน Excel แทน SM (OBO)', cred: 'Certificate',
    perms: ['User.Read (Delegated)', 'Files.ReadWrite (Delegated) — อ่าน Named range ตอนกด Sync/ส่งอนุมัติ', 'Calendars.ReadWrite (Delegated) — นัด Handover ในนามของ PMO'] },
  { name: 'One Platform Worker', use: 'งานเบื้องหลัง: โฟลเดอร์ SharePoint, ส่งอีเมล, ตรวจไฟล์ถูกแก้', cred: 'Certificate',
    perms: ['Sites.Selected (Application) — write เฉพาะไซต์ Stream Projects', 'Mail.Send (Application) — จำกัดด้วย Exchange RBAC ให้ส่งได้จาก salesflow@ เท่านั้น'] },
]
const NOT_USED = [
  'Excel Workbook API แบบ Application — Microsoft ไม่รองรับ',
  'แปลง Excel เป็น PDF (?format=pdf) — เลือกชีตไม่ได้และจำกัด 2 MB ระบบสร้าง PDF เอง',
  'ChannelMessage.Send แบบ Application — ใช้ได้เฉพาะงาน migration',
  'Office 365 Connectors / Incoming Webhook ของ Teams — ยกเลิกในปี 2026',
]
const CHANNELS = reactive([
  { k: 'inapp', name: 'กล่องงานในระบบ', what: 'ช่องทางหลักของการอนุมัติและงานที่ต้องทำ ใช้ได้บนมือถือ', on: true, fixed: true },
  { k: 'email', name: 'อีเมลจาก salesflow@', what: 'แจ้งเตือนพร้อมลิงก์เข้าหน้าที่เกี่ยวข้อง (เข้าผ่าน SSO) ส่งผ่าน Outbox มี retry', on: true, fixed: false },
  { k: 'teams', name: 'Teams Workflows ต่อช่อง DT', what: 'โพสต์การ์ดเมื่อชนะงาน, Handover, ประกันใกล้หมด', on: true, fixed: false },
  { k: 'am', name: 'ปุ่มอนุมัติในอีเมล (Actionable Message)', what: 'เฟส 2 — ต้องลงทะเบียนกับ Microsoft, ใช้บนเบราว์เซอร์มือถือไม่ได้, หมดอายุ 1 เดือน', on: false, fixed: false },
])
const WEBHOOKS = reactive(TEAMS.map((t) => ({ team: t.code, url: t.code === 'DT4-2' ? 'https://prod-27.southeastasia.logic.azure.com/workflows/…' : '' })))
// reactive() proxies the same object, so domain rules see added holidays immediately.
const cal = reactive(TH_GOV_2026)
const holidays = computed(() => cal.holidays.filter((h) => h.startsWith('2026') || h.startsWith('2027')))
const newHoliday = ref('')
function addHoliday() {
  if (newHoliday.value && !cal.holidays.includes(newHoliday.value)) cal.holidays.push(newHoliday.value)
  cal.holidays.sort()
  newHoliday.value = ''
}
</script>

<template>
  <div class="page">
    <PageHeader module="System Administration" title="System Settings" scope="ผู้ดูแลระบบ" subtitle="สิทธิ์ตามบทบาท ลำดับอนุมัติ ปฏิทิน ช่องทางแจ้งเตือน ทีม DT และ Microsoft 365" />
    <div class="tabs" role="tablist">
      <button role="tab" :aria-selected="tab === 'roles'" @click="tab = 'roles'">สิทธิ์ตามบทบาท</button>
      <button role="tab" :aria-selected="tab === 'approval'" @click="tab = 'approval'">ลำดับการอนุมัติ</button>
      <button role="tab" :aria-selected="tab === 'calendar'" @click="tab = 'calendar'">ปฏิทินวันทำการ</button>
      <button role="tab" :aria-selected="tab === 'channels'" @click="tab = 'channels'">ช่องทางแจ้งเตือน</button>
      <button role="tab" :aria-selected="tab === 'teams'" @click="tab = 'teams'">ทีม DT และเป้า</button>
      <button role="tab" :aria-selected="tab === 'm365'" @click="tab = 'm365'">Microsoft 365</button>
    </div>

    <section v-if="tab === 'roles'" class="panel scroll-x">
      <table class="table mx">
        <thead><tr><th>ความสามารถ</th><th v-for="r in R" :key="r">{{ ROLES[r].label }}</th></tr></thead>
        <tbody>
          <tr v-for="m in MATRIX" :key="m.cap"><td>{{ m.cap }}</td><td v-for="(v, i) in m.v" :key="i"><span class="lv" :class="v || 'none'">{{ LBL[v] }}</span></td></tr>
        </tbody>
      </table>
    </section>

    <section v-if="tab === 'approval'" class="panel">
      <table class="table">
        <thead><tr><th>เงื่อนไข</th><th>ผู้อนุมัติตามลำดับ</th><th>SLA</th></tr></thead>
        <tbody><tr v-for="r in RULES" :key="r.when"><td>{{ r.when }}</td><td><strong>{{ r.who }}</strong></td><td>{{ r.sla }}</td></tr></tbody>
      </table>
      <p class="hint" style="margin-top: 12px">ถ้าเกิน SLA ระบบส่งอีเมลเตือนซ้ำ และแจ้งผู้รับมอบอำนาจแทน · ผู้ส่งคำขออนุมัติคำขอของตัวเองไม่ได้</p>
      <h3 class="sub">เกณฑ์ความถูกต้องของราคา</h3>
      <div class="thr">
        <div class="field"><label for="tol">มูลค่า PO ต่างจากที่อนุมัติได้ (±%)</label><input id="tol" v-model.number="SETTINGS.tolerancePct" class="input num" type="number" min="0" step="0.5" /></div>
        <div class="field"><label for="gpd">GP ลดลงได้ไม่เกิน (จุด)</label><input id="gpd" v-model.number="SETTINGS.gpDropPct" class="input num" type="number" min="0" step="0.5" /></div>
        <div class="field"><label for="vd">อายุการอนุมัติ (วัน)</label><input id="vd" v-model.number="SETTINGS.approvalValidDays" class="input num" type="number" min="1" /><span class="hint">ตรงกับระยะยืนราคาในใบเสนอราคา</span></div>
      </div>
      <p class="hint">เกินเกณฑ์ตอน Close Win ต้องขออนุมัติหลังได้งาน · แก้ไฟล์ Excel หลังอนุมัติ คำขอจะถูกระงับจนส่งใหม่</p>
    </section>

    <section v-if="tab === 'calendar'" class="panel">
      <div class="panel-head"><h2>วันหยุดราชการ</h2><span class="muted small">ใช้นับวันอุทธรณ์ e-GP (7 วันทำการ), SLA การอนุมัติ และ SLA ของ Ticket</span></div>
      <div class="addh"><input v-model="newHoliday" class="input" type="date" aria-label="วันหยุดใหม่" /><button class="btn" :disabled="!newHoliday" @click="addHoliday">เพิ่มวันหยุด</button></div>
      <ul class="hol"><li v-for="h in holidays" :key="h">{{ thDate(h) }}</li></ul>
      <p class="hint">วันทำการ: จันทร์–ศุกร์ · ปรับทุกปีตามประกาศคณะรัฐมนตรี</p>
      <div class="panel-head hrs"><h2>เวลาทำงานและ OT</h2><span class="muted small">ใช้แยกชั่วโมงปกติกับ OT ตอนบันทึกเวลา และคำนวณ Timesheet</span></div>
      <div class="hgrid">
        <label class="field">เข้างาน<input v-model="SETTINGS.hours.start" type="time" class="input" /></label>
        <label class="field">เลิกงาน<input v-model="SETTINGS.hours.end" type="time" class="input" /></label>
        <label class="field">พักกลางวัน<span class="pair"><input v-model="SETTINGS.hours.lunchStart" type="time" class="input" /><input v-model="SETTINGS.hours.lunchEnd" type="time" class="input" /></span></label>
        <label class="field">เริ่มนับ OT หลัง<input v-model="SETTINGS.hours.otFrom" type="time" class="input" /></label>
      </div>
      <p class="hint">วันหยุด: เสาร์ อาทิตย์ และวันหยุดราชการด้านบน — ทำงานวันหยุดนับเป็น OT ทั้งหมด · ก่อนเข้างานนับเป็น OT</p>
    </section>

    <section v-if="tab === 'channels'" class="channels">
      <div v-for="c in CHANNELS" :key="c.k" class="panel con">
        <div><h3>{{ c.name }}</h3><p class="muted small">{{ c.what }}</p></div>
        <label class="sw"><input v-model="c.on" type="checkbox" :disabled="c.fixed" /> {{ c.on ? 'เปิด' : 'ปิด' }}</label>
      </div>
      <div class="panel">
        <div class="panel-head"><h2>URL ของ Teams Workflow ต่อทีม</h2></div>
        <div v-for="w in WEBHOOKS" :key="w.team" class="hook"><span>{{ w.team }}</span><input v-model="w.url" class="input" placeholder="วาง URL จาก Workflow “Post to a channel when a webhook request is received”" /></div>
      </div>
    </section>

    <section v-if="tab === 'teams'" class="panel">
      <table class="table">
        <thead><tr><th>รหัส</th><th>ชื่อทีม</th><th>กลุ่ม</th><th>บทบาท</th><th>เดิม</th><th class="r">เป้ายอดขายปี 2569</th></tr></thead>
        <tbody><tr v-for="t in TEAMS" :key="t.code"><td><strong>{{ t.code }}</strong></td><td>{{ t.name }}</td><td class="small">{{ GROUP_NAME[t.group] }}</td>
          <td><span class="chip" :class="t.kind === 'sales' ? 'presale' : ''">{{ t.kind === 'sales' ? 'ทีมขาย/พัฒนา' : t.kind === 'support' ? 'ทีมสนับสนุน' : 'ผู้บริหาร' }}</span></td>
          <td class="small muted">{{ t.formerly ?? '—' }}</td><td class="r num">{{ t.target ? mb(t.target) : '—' }}</td></tr></tbody>
      </table>
    </section>

    <section v-if="tab === 'm365'" class="m365">
      <div v-for="a in APPS" :key="a.name" class="panel app">
        <div class="apph"><h3>{{ a.name }}</h3><span class="chip">{{ a.cred }}</span></div>
        <p class="muted small">{{ a.use }}</p>
        <ul><li v-for="x in a.perms" :key="x">{{ x }}</li></ul>
      </div>
      <div class="panel app">
        <h3>ไม่ใช้โดยตั้งใจ</h3>
        <ul class="no"><li v-for="x in NOT_USED" :key="x">{{ x }}</li></ul>
        <p class="hint">ขั้นตอนตั้งค่าและสคริปต์อยู่ที่ server/infra ใน repository</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.mx th { white-space: normal; font-size: 12.5px; text-align: center; min-width: 92px; }
.mx th:first-child { text-align: left; min-width: 260px; }
.mx td { text-align: center; }
.mx td:first-child { text-align: left; }
.lv { display: inline-block; font-size: 12px; padding: 2px 8px; border-radius: 4px; }
.lv.full { background: var(--ink); color: var(--on-ink); }
.lv.own { background: var(--presale-soft); color: var(--presale); }
.lv.view { background: var(--idle-soft); color: var(--ink-2); }
.lv.none { color: var(--faint); }
.m365 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; }
.app ul { margin: 10px 0 0; padding-left: 18px; font-size: 14px; display: grid; gap: 4px; }
.apph { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.no li { color: var(--muted); }
.sub { margin: 24px 0 12px; }
.thr { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 8px; }
.addh { display: flex; gap: 8px; margin-bottom: 14px; max-width: 360px; }
.hol { list-style: none; margin: 0 0 12px; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 6px; font-size: 14px; }
.hol li { background: var(--sunken); border-radius: var(--r-sm); padding: 6px 10px; }
.channels { display: grid; gap: 10px; }
.sw { display: flex; gap: 8px; align-items: center; font-size: 14px; }
.sw input { width: 18px; height: 18px; accent-color: var(--ink); }
.hook { display: grid; grid-template-columns: 70px 1fr; gap: 10px; align-items: center; margin-bottom: 8px; font-weight: 500; }
.con { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: center; padding: 18px 22px; }
@media (max-width: 560px) { .con { grid-template-columns: 1fr; } }
.hrs { margin-top: 24px; }
.hgrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.pair { display: flex; gap: 6px; }
@media (max-width: 760px) { .hgrid { grid-template-columns: 1fr 1fr; } }
</style>
