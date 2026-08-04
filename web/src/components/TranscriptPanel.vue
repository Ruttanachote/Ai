<script setup lang="ts">
import { fmtMs } from '../api'
import type { Transcript } from '../types'

defineProps<{ transcript: Transcript | null }>()
defineEmits<{ seek: [ms: number] }>()
</script>

<template>
  <section class="transcript panel">
    <h2>📝 Transcript</h2>
    <p v-if="!transcript" class="muted">
      ยังไม่มี transcript — เพิ่มไฟล์พร้อม transcript หรือกด "โหลดคลิปตัวอย่าง"
      (งานถอดเสียงอัตโนมัติจะมาใน milestone ถัดไป)
    </p>
    <div v-else class="segments">
      <button
        v-for="(s, i) in transcript.segments"
        :key="i"
        class="segment"
        :title="`ไปที่ ${fmtMs(s.start_ms)}`"
        @click="$emit('seek', s.start_ms)"
      >
        <span class="time">{{ fmtMs(s.start_ms) }}</span>
        <span class="text">{{ s.text }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.transcript {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 14px;
  gap: 10px;
}

h2 {
  margin: 0;
  font-size: 14px;
}

.segments {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.segment {
  display: flex;
  gap: 10px;
  text-align: left;
  border: none;
  background: transparent;
  padding: 5px 6px;
  border-radius: 6px;
}

.segment:hover {
  background: var(--panel-2);
}

.time {
  color: var(--accent);
  font-variant-numeric: tabular-nums;
  flex: 0 0 auto;
  font-size: 12px;
  padding-top: 1px;
}

.text {
  color: var(--text);
}
</style>
