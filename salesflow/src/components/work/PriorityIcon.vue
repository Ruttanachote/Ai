<script setup lang="ts">
import { PRIORITIES, type Priority } from '../../data/model'
defineProps<{ p?: Priority; label?: boolean }>()
const COLOR: Record<Priority, string> = { highest: '#c4382f', high: '#d9622b', medium: '#a86a08', low: '#2f6fd8', lowest: '#6b7384' }
const ROT: Record<Priority, number> = { highest: 0, high: 0, medium: 90, low: 180, lowest: 180 }
</script>

<template>
  <span class="pi" :title="PRIORITIES[p ?? 'medium'].label">
    <svg viewBox="0 0 16 16" width="14" height="14" :style="{ color: COLOR[p ?? 'medium'], transform: `rotate(${ROT[p ?? 'medium']}deg)` }" aria-hidden="true">
      <path v-if="(p ?? 'medium') === 'medium'" d="M3 6h10M3 10h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <template v-else><path d="M4 9l4-4 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /><path v-if="p === 'highest' || p === 'lowest'" d="M4 13l4-4 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></template>
    </svg>
    <span v-if="label">{{ PRIORITIES[p ?? 'medium'].label }}</span>
  </span>
</template>

<style scoped>
.pi { display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; white-space: nowrap; }
</style>
