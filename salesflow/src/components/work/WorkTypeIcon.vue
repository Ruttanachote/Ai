<script setup lang="ts">
import { WORK_TYPES, type WorkType } from '../../data/model'
// Small square glyph per work type — colour plus shape so it is not colour-only.
defineProps<{ type: WorkType; size?: number }>()
const PATH: Record<WorkType, string> = {
  epic: 'M9 2L4 9h4l-1 5 5-7H8z',
  story: 'M5 3h6v10l-3-2-3 2z',
  task: 'M4.5 8.2l2.3 2.3L11.5 5.8',
  subtask: 'M5 4v5h6M9 7l2 2-2 2',
  bug: 'M8 4a3 3 0 0 1 3 3v3a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3zM3 8h2M11 8h2M4 12l1.5-1M12 12l-1.5-1',
}
</script>

<template>
  <span class="wt" :style="{ background: WORK_TYPES[type].color, width: (size ?? 16) + 'px', height: (size ?? 16) + 'px' }" :title="WORK_TYPES[type].label" role="img" :aria-label="WORK_TYPES[type].label">
    <svg viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path :d="PATH[type]" :fill="type === 'epic' || type === 'story' ? '#fff' : 'none'" /></svg>
  </span>
</template>

<style scoped>
.wt { display: inline-grid; place-items: center; border-radius: 4px; flex: none; }
.wt svg { width: 75%; height: 75%; }
</style>
