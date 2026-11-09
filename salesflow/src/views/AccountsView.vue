<script setup lang="ts">
import { computed, ref } from 'vue'
import { ACCOUNTS, account, mb } from '../data/mock'
import { scope } from '../store'
import PageHeader from '../components/PageHeader.vue'
import KpiStrip from '../components/KpiStrip.vue'
import { isOpen, isWon, bookedValue, pipelineValue, sum } from '../domain/metrics'
import type { Sector } from '../data/model'

const SECTOR: Record<Sector, string> = { government: 'หน่วยงานรัฐ', soe: 'รัฐวิสาหกิจ', enterprise: 'เอกชน', other: 'อื่น ๆ' }
const q = ref('')
const rows = computed(() =>
  ACCOUNTS.filter((a) => a.type === 'customer')
    .filter((a) => !q.value.trim() || [a.name, a.taxId ?? ''].some((v) => v.includes(q.value.trim())))
    .map((a) => {
      const list = scope.value.list.filter((p) => p.customerAccountId === a.id)
      return {
        a,
        parent: account(a.parentId),
        open: list.filter(isOpen).length,
        pipe: sum(list.filter(isOpen), pipelineValue),
        won: sum(list.filter(isWon), bookedValue),
        total: list.length,
      }
    })
    .sort((x, y) => y.won - x.won),
)
const unlinked = computed(() => scope.value.list.filter((p) => !p.customerAccountId && p.customer !== 'รอระบุลูกค้า'))
const active = computed(() => rows.value.filter((r) => r.total))
const kpis = computed(() => [
  { label: 'ลูกค้าที่มีโครงการ', value: String(active.value.length), note: `จากทะเบียน ${rows.value.length} ราย` },
  { label: 'ภาครัฐและรัฐวิสาหกิจ', value: String(active.value.filter((r) => r.a.sector !== 'enterprise').length), note: 'ขายผ่าน e-GP' },
  { label: 'Pipeline ที่เปิดอยู่', value: mb(sum(scope.value.list.filter(isOpen), pipelineValue)), note: 'รวมทุกลูกค้า' },
  { label: 'ยอดที่ชนะ', value: mb(sum(scope.value.list.filter(isWon), bookedValue)), note: 'ตามสัญญา' },
])
</script>

<template>
  <div class="page">
    <PageHeader module="General" title="Customer Accounts" :scope="scope.label" subtitle="ลูกค้าและหน่วยงานผู้ใช้ เชื่อมกับทุกโครงการ">
      <button class="btn primary">เพิ่มลูกค้า</button>
    </PageHeader>
    <KpiStrip :items="kpis" />

    <p v-if="unlinked.length" class="chip warn mig">มี {{ unlinked.length }} โครงการที่ยังไม่ได้ผูกกับทะเบียนลูกค้า — ผู้ดูแลระบบยืนยันการจับคู่ชื่อในหน้าตั้งค่า</p>

    <input v-model="q" class="input search" placeholder="ค้นหาชื่อหรือเลขประจำตัวผู้เสียภาษี" aria-label="ค้นหาลูกค้า" />

    <div class="panel flush scroll-x">
      <table class="table">
        <thead><tr><th>ลูกค้า</th><th>ประเภท</th><th>เลขประจำตัวผู้เสียภาษี</th><th class="r">Pipeline</th><th class="r">ยอดที่ชนะ</th></tr></thead>
        <tbody>
          <tr v-for="r in rows" :key="r.a.id">
            <td>
              <router-link :to="`/accounts/${r.a.id}`" class="name">{{ r.a.name }}</router-link>
              <p class="small muted">{{ r.parent ? 'สังกัด ' + r.parent.name + ' · ' : '' }}{{ r.a.province ?? '' }} · {{ r.total }} โครงการ</p>
            </td>
            <td><span class="chip" :class="r.a.sector === 'enterprise' ? '' : 'presale'">{{ SECTOR[r.a.sector] }}</span></td>
            <td class="num small">{{ r.a.taxId ?? '—' }}</td>
            <td class="r num">{{ r.pipe ? mb(r.pipe) : '—' }}<p class="small muted">{{ r.open }} ดีล</p></td>
            <td class="r num">{{ r.won ? mb(r.won) : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.search { max-width: 360px; margin-bottom: 16px; }
.mig { margin-bottom: 16px; height: auto; padding: 8px 12px; white-space: normal; }
.flush { padding: 4px 8px; }
.name { font-weight: 600; color: var(--ink); }
</style>
