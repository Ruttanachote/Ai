<script setup lang="ts">
import { computed, ref } from 'vue'
import { projects } from '../store'
import { account } from '../data/mock'
import { renderQuotationHtml, type QuotationData } from '../domain/quotation'
import { validApproval } from '../domain/rules'

// Same template the server prints to PDF — built from the approved snapshot only.
const props = defineProps<{ id: string }>()
const frame = ref<HTMLIFrameElement>()
const print = () => frame.value?.contentWindow?.print()
const p = computed(() => projects.find((x) => x.id === props.id))
const a = computed(() => (p.value ? validApproval(p.value, '2026-11-06') ?? p.value.approval : undefined))
const ok = computed(() => !!p.value && !!a.value && a.value.status !== 'stale' && a.value.steps.every((s) => s.status === 'approved'))
const html = computed(() => {
  if (!p.value || !a.value) return ''
  const rev = a.value.snapshot?.revenue ?? p.value.revenue
  const cust = account(p.value.customerAccountId)
  const data: QuotationData = {
    number: `QT-${p.value.code}-${a.value.version}`, issueDate: '6 พ.ย. 2569', validDays: 60,
    customer: { name: cust?.name ?? p.value.customer, taxId: cust?.taxId },
    projectName: p.value.name, paymentTerms: '5 งวดตามงวดงานในสัญญา', approvedVersion: a.value.version, snapshotHash: a.value.snapshotHash ?? 'draft',
    company: { name: 'บริษัท สตรีม ไอที จำกัด', taxId: '0105500000000', address: 'กรุงเทพมหานคร' },
    items: [
      { description: `${p.value.name} — พัฒนาและติดตั้งระบบ`, qty: 1, unit: 'งาน', unitPrice: Math.round(rev * 0.72) },
      { description: 'Hardware และ Software License', qty: 1, unit: 'ชุด', unitPrice: Math.round(rev * 0.2) },
      { description: 'อบรมการใช้งานและรับประกัน 12 เดือน', qty: 1, unit: 'งาน', unitPrice: rev - Math.round(rev * 0.72) - Math.round(rev * 0.2) },
    ],
  }
  return renderQuotationHtml(data)
})
</script>

<template>
  <div class="wrap">
    <div class="bar">
      <router-link :to="`/projects/${id}`" class="btn ghost">‹ กลับไปโครงการ</router-link>
      <span v-if="!ok" class="chip warn">ฉบับร่าง — ยังไม่ได้รับอนุมัติครบ ส่งให้ Sale ไม่ได้</span>
      <button class="btn primary" :disabled="!html" @click="print">พิมพ์ / บันทึก PDF</button>
    </div>
    <iframe v-if="html" ref="frame" class="doc" :srcdoc="html" title="ใบเสนอราคา" />
  </div>
</template>

<style scoped>
.wrap { min-height: 100vh; background: #e9ebef; padding: 16px; display: grid; justify-items: center; gap: 12px; }
.bar { width: 100%; max-width: 820px; display: flex; gap: 10px; align-items: center; }
.bar .primary { margin-left: auto; }
.doc { width: 100%; max-width: 820px; height: 1120px; border: 0; background: #fff; box-shadow: 0 8px 24px -12px rgb(0 0 0 / 0.3); }
@media print { .bar { display: none; } .wrap { padding: 0; background: #fff; } .doc { box-shadow: none; height: 100vh; } }
</style>
