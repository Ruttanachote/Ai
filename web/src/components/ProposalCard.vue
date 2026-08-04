<script setup lang="ts">
import { computed } from 'vue'
import { fmtMs } from '../api'
import type { EditProposal, EditOperation } from '../types'

const props = defineProps<{ proposal: EditProposal; applied: boolean }>()
defineEmits<{ apply: []; reject: [] }>()

function describe(op: EditOperation): string {
  switch (op.type) {
    case 'remove_ranges': {
      const total = op.ranges.reduce((s, r) => s + (r.end_ms - r.start_ms), 0)
      return `ตัดออก ${op.ranges.length} ช่วง (รวม ${fmtMs(total)})`
    }
    case 'keep_only_ranges':
      return `เก็บไว้เฉพาะ ${op.ranges.length} ช่วง`
    case 'split_clip':
      return `แบ่งคลิปที่ ${fmtMs(op.at_ms)}`
    case 'reorder_clips':
      return `เรียงคลิปใหม่ ${op.clip_ids.length} ชิ้น`
    case 'set_captions':
      return `ใส่ซับ ${op.captions.length} บรรทัด (${op.language})`
  }
}

const hasOps = computed(() => props.proposal.operations.length > 0)
</script>

<template>
  <div class="proposal">
    <p class="summary">{{ proposal.summary }}</p>
    <ul v-if="hasOps">
      <li v-for="(op, i) in proposal.operations" :key="i">{{ describe(op) }}</li>
    </ul>
    <div v-if="hasOps" class="actions">
      <template v-if="!applied">
        <button class="success" @click="$emit('apply')">✓ Apply</button>
        <button @click="$emit('reject')">✕ ไม่เอา</button>
      </template>
      <span v-else class="done">✓ Apply แล้ว — กด Undo ที่ timeline ได้ถ้าเปลี่ยนใจ</span>
    </div>
  </div>
</template>

<style scoped>
.proposal {
  border: 1px solid var(--accent);
  border-radius: 8px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

.summary {
  margin: 0 0 6px;
}

ul {
  margin: 0 0 8px;
  padding-left: 18px;
  color: var(--muted);
  font-size: 12.5px;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.done {
  color: var(--accent-2);
  font-size: 12.5px;
}
</style>
