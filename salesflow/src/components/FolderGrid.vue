<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import type { StageKey } from '../data/model'

// Folder sets are created with the project in SharePoint; each unlocks at a stage.
const props = defineProps<{ stage: StageKey; set: 'pre' | 'post' | 'ma'; files?: Record<string, number> }>()
const emit = defineEmits<{ open: [name: string] }>()

const ORDER: StageKey[] = ['opportunity', 'pipeline', 'forecast', 'rebidding', 'win', 'handover', 'delivery', 'warranty', 'ended']
const at = computed(() => {
  if (props.stage === 'lose') return ORDER.indexOf('rebidding')
  if (props.stage === 'cancelled') return ORDER.indexOf('delivery')
  return ORDER.indexOf(props.stage)
})

const SETS: Record<string, { name: string; opens: StageKey }[]> = {
  pre: [
    { name: 'TOR', opens: 'opportunity' }, { name: 'Proposal', opens: 'opportunity' },
    { name: 'Cost Sheet', opens: 'pipeline' }, { name: 'Quotation', opens: 'pipeline' },
    { name: 'Contract', opens: 'forecast' }, { name: 'Official PO', opens: 'forecast' },
  ],
  post: [
    { name: 'Handover', opens: 'win' }, { name: 'Summary Plan Sheet', opens: 'win' }, { name: 'PR', opens: 'win' }, { name: 'PO', opens: 'win' },
    { name: 'PA', opens: 'win' }, { name: 'DO', opens: 'win' }, { name: 'Document Training', opens: 'win' },
    { name: 'Document Inspection', opens: 'win' }, { name: 'Document Config', opens: 'win' }, { name: 'PM Report', opens: 'win' }, { name: 'CM', opens: 'win' },
  ],
  ma: [
    { name: 'Warranty Certificate', opens: 'warranty' }, { name: 'SLA Report', opens: 'warranty' },
    { name: 'หนังสือแจ้งหมดประกัน', opens: 'warranty' }, { name: 'MA Quotation', opens: 'warranty' }, { name: 'Ticket Log', opens: 'warranty' },
  ],
}
const LABEL: Partial<Record<StageKey, string>> = { pipeline: 'Pipeline', forecast: 'Forecast', win: 'Close Win', warranty: 'Warranty' }
const items = computed(() =>
  SETS[props.set].map((f) => ({ ...f, open: ORDER.indexOf(f.opens) <= at.value, count: props.files?.[f.name] ?? 0 })),
)
</script>

<template>
  <div class="grid">
    <button v-for="f in items" :key="f.name" class="folder" :class="{ locked: !f.open, has: f.count }" :disabled="!f.open"
      @click="emit('open', f.name)" :aria-label="f.open ? `เปิดโฟลเดอร์ ${f.name}` : `${f.name} — เปิดเมื่อเป็น ${LABEL[f.opens]}`">
      <svg class="ico" viewBox="0 0 48 40" aria-hidden="true">
        <path d="M2 6a4 4 0 0 1 4-4h12l5 5h19a4 4 0 0 1 4 4v23a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" />
        <path class="lip" d="M2 13h44v21a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" />
      </svg>
      <strong>{{ f.name }}</strong>
      <span v-if="!f.open" class="state"><Icon name="lock" :size="13" /> เปิดเมื่อเป็น {{ LABEL[f.opens] }}</span>
      <span v-else-if="f.count" class="state on">{{ f.count }} ไฟล์</span>
      <span v-else class="state">ยังไม่มีไฟล์</span>
    </button>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.folder { display: grid; justify-items: center; gap: 4px; padding: 18px 10px 14px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); cursor: pointer; font: inherit; color: var(--ink); text-align: center; transition: border-color var(--t-fast), background var(--t-fast); }
.folder:hover:not(:disabled) { border-color: var(--line-strong); background: var(--sunken); }
.ico { width: 44px; height: 36px; margin-bottom: 6px; }
.ico path { fill: #f0c24a; }
.ico .lip { fill: #f7d36c; }
.folder strong { font-size: 14px; font-weight: 600; line-height: 1.35; }
.state { font-size: 12px; color: var(--muted); display: inline-flex; align-items: center; gap: 4px; }
.state.on { color: var(--win); font-weight: 500; }
.locked { cursor: not-allowed; background: var(--sunken); }
.locked .ico path { fill: #e7dcc0; }
.locked .ico .lip { fill: #efe6cf; }
.locked strong { color: var(--muted); font-weight: 500; }
</style>
