<script setup lang="ts">
import { ref } from 'vue'
import { ROLES, type Role } from '../data/model'
import { TEAMS, mb } from '../data/mock'

const tab = ref<'roles' | 'approval' | 'teams' | 'm365'>('roles')
const R = Object.keys(ROLES) as Role[]
type Level = 'full' | 'own' | 'view' | ''
const MATRIX: { cap: string; v: Level[] }[] = [
  { cap: 'ลงทะเบียน / แก้ไขโครงการช่วงขาย', v: ['own', 'full', 'view', 'view', '', '', 'full'] },
  { cap: 'แก้ไข Cost Sheet และใบเสนอราคา', v: ['own', 'full', 'view', '', '', '', 'full'] },
  { cap: 'อนุมัติราคา', v: ['', 'full', 'full', '', '', '', 'full'] },
  { cap: 'เปลี่ยนสถานะ Opportunity → Close Win', v: ['own', 'full', 'full', '', '', '', 'full'] },
  { cap: 'เปิด Close Lose กลับเป็น Pipeline', v: ['', 'full', 'full', '', '', '', 'full'] },
  { cap: 'ยกเลิกโครงการหลังชนะ (Cancelled)', v: ['', 'full', 'full', '', '', '', 'full'] },
  { cap: 'Handover · มอบหมาย PM และทีม DT', v: ['', 'full', 'view', 'full', 'view', '', 'full'] },
  { cap: 'แผนงาน Task Workload Risk CR', v: ['view', 'view', 'view', 'full', 'own', '', 'full'] },
  { cap: 'ประกัน หนังสือแจ้ง Ticket', v: ['view', 'view', 'view', 'view', 'own', 'full', 'full'] },
  { cap: 'เปิดโครงการ MA ใหม่จากโครงการเดิม', v: ['own', 'full', '', '', '', 'full', 'full'] },
  { cap: 'Dashboard ยอดขายทุกทีม', v: ['', 'own', 'full', 'view', '', '', 'full'] },
  { cap: 'จัดการผู้ใช้ สิทธิ์ ทีม และ Template', v: ['', '', '', '', '', '', 'full'] },
]
const LBL: Record<Level, string> = { full: 'ทั้งหมด', own: 'ของตัวเอง', view: 'ดูได้', '': '—' }
const RULES = [
  { when: 'GP ≥ 30% และมูลค่า ≤ ฿5M', who: 'หัวหน้ากลุ่ม DT', sla: '2 วันทำการ' },
  { when: 'GP 25–30% หรือมูลค่า ฿5M–20M', who: 'หัวหน้ากลุ่ม DT → ผู้บริหาร', sla: '3 วันทำการ' },
  { when: 'GP < 25% หรือมูลค่า > ฿20M', who: 'หัวหน้ากลุ่ม DT → ผู้บริหาร → CFO', sla: '5 วันทำการ' },
  { when: 'โครงการ MA ต่อสัญญา', who: 'หัวหน้ากลุ่ม DT', sla: '2 วันทำการ' },
]
const M365 = [
  { name: 'Microsoft Entra ID', what: 'Single sign-on และ App Roles (SM, Head, Exec, PMO, PM, MA, Admin)', ok: true },
  { name: 'SharePoint / OneDrive', what: 'สร้างโฟลเดอร์เอกสารต่อโครงการ เก็บเวอร์ชันไฟล์อัตโนมัติ', ok: true },
  { name: 'Excel Online (Graph Workbook API)', what: 'สร้าง Cost Sheet + Quotation จาก Template อ่านค่าสรุปจาก Named range', ok: true },
  { name: 'Outlook (Graph Mail)', what: 'อีเมลขออนุมัติแบบ Actionable Message ส่งใบเสนอราคาให้ Sale หนังสือแจ้งหมดประกัน', ok: true },
  { name: 'Microsoft Teams', what: 'นัดประชุม Handover แจ้งเตือนในช่องทีม DT', ok: false },
]
</script>

<template>
  <div class="page">
    <header class="page-head"><div><h1>สิทธิ์และการตั้งค่า</h1><p>กำหนดว่าแต่ละตำแหน่งทำอะไรได้ ลำดับอนุมัติ ทีม DT และการเชื่อม Microsoft 365</p></div></header>
    <div class="tabs" role="tablist">
      <button role="tab" :aria-selected="tab === 'roles'" @click="tab = 'roles'">สิทธิ์ตามบทบาท</button>
      <button role="tab" :aria-selected="tab === 'approval'" @click="tab = 'approval'">ลำดับการอนุมัติ</button>
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
      <p class="hint" style="margin-top: 12px">ถ้าเกิน SLA ระบบส่งอีเมลเตือนซ้ำ และแจ้งผู้อนุมัติลำดับถัดไป</p>
    </section>

    <section v-if="tab === 'teams'" class="panel">
      <table class="table">
        <thead><tr><th>รหัส</th><th>ชื่อทีม</th><th class="r">เป้ายอดขายปี 2569</th></tr></thead>
        <tbody><tr v-for="t in TEAMS" :key="t.code"><td><strong>{{ t.code }}</strong></td><td>{{ t.name }}</td><td class="r num">{{ mb(t.target) }}</td></tr></tbody>
      </table>
    </section>

    <section v-if="tab === 'm365'" class="m365">
      <div v-for="c in M365" :key="c.name" class="panel con">
        <div><h3>{{ c.name }}</h3><p class="muted small">{{ c.what }}</p></div>
        <span class="chip" :class="c.ok ? 'win' : ''">{{ c.ok ? 'เชื่อมต่อแล้ว' : 'ยังไม่เชื่อมต่อ' }}</span>
        <button class="btn sm">{{ c.ok ? 'ตั้งค่า' : 'เชื่อมต่อ' }}</button>
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
.lv.full { background: var(--ink); color: #fff; }
.lv.own { background: var(--presale-soft); color: var(--presale); }
.lv.view { background: var(--idle-soft); color: var(--ink-2); }
.lv.none { color: var(--faint); }
.m365 { display: grid; gap: 10px; }
.con { display: grid; grid-template-columns: 1fr auto auto; gap: 16px; align-items: center; padding: 18px 22px; }
@media (max-width: 560px) { .con { grid-template-columns: 1fr; } }
</style>
