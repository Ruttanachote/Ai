<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api, fmtMs } from '../api'
import type { Project, Transcript } from '../types'
import ChatPanel from '../components/ChatPanel.vue'
import TranscriptPanel from '../components/TranscriptPanel.vue'
import TimelineBar from '../components/TimelineBar.vue'

const props = defineProps<{ id: string }>()

const project = ref<Project | null>(null)
const error = ref('')
const playheadMs = ref(0)

const transcript = computed<Transcript | null>(
  () => project.value?.assets.find((a) => a.transcript)?.transcript ?? null,
)

async function load() {
  try {
    project.value = await api.getProject(props.id)
    error.value = ''
  } catch (e) {
    error.value = (e as Error).message
  }
}

async function undo() {
  try {
    await api.undo(props.id)
    await load()
  } catch (e) {
    error.value = (e as Error).message
  }
}

// Demo footage with a Thai transcript, so the whole chat→proposal→apply loop
// can be exercised before real upload + transcription land.
async function loadDemoAsset() {
  const demo: Transcript = {
    language: 'th',
    segments: [
      { start_ms: 0, end_ms: 3000, text: 'สวัสดีครับ วันนี้เรามารีวิวเครื่องชงกาแฟกัน' },
      { start_ms: 3000, end_ms: 4200, text: 'เอ่อ' },
      { start_ms: 4200, end_ms: 9000, text: 'ตัวนี้ราคาอยู่ที่สองพันเก้า ซึ่งถือว่าคุ้มมากในกลุ่มนี้' },
      { start_ms: 12000, end_ms: 17000, text: 'จุดเด่นคือทำอุณหภูมิได้นิ่ง รสชาติเลยสม่ำเสมอ' },
      { start_ms: 17000, end_ms: 18100, text: 'อืม' },
      { start_ms: 18100, end_ms: 24000, text: 'ข้อเสียคือถังน้ำเล็กไปหน่อย ต้องเติมบ่อยถ้าชงหลายแก้ว' },
      { start_ms: 26000, end_ms: 30000, text: 'สรุปสั้น ๆ ถ้างบไม่เกินสามพัน ตัวนี้คือตัวจบครับ' },
    ],
  }
  try {
    await api.addAsset(props.id, 'demo-review.mp4', 30000, demo)
    await load()
  } catch (e) {
    error.value = (e as Error).message
  }
}

onMounted(load)
</script>

<template>
  <div v-if="error" class="page-error">
    <p>⚠ {{ error }}</p>
    <button @click="load">ลองใหม่</button>
  </div>

  <div v-else-if="project" class="editor">
    <div class="workspace">
      <ChatPanel :project-id="project.id" @applied="load" />

      <section class="preview panel">
        <template v-if="project.assets.length === 0">
          <div class="empty">
            <p class="muted">ยังไม่มีฟุตเทจในโปรเจกต์นี้</p>
            <button class="primary" @click="loadDemoAsset">▶ โหลดคลิปตัวอย่าง (30 วิ)</button>
            <p class="muted small">
              การอัปโหลดไฟล์จริง + ถอดเสียงอัตโนมัติจะมาใน milestone ถัดไป
            </p>
          </div>
        </template>
        <template v-else>
          <div class="screen">
            <span class="time">{{ fmtMs(playheadMs) }}</span>
            <span class="muted">/ {{ fmtMs(project.timeline.tracks[0]?.clips.reduce((s, c) => s + c.source_out_ms - c.source_in_ms, 0) ?? 0) }}</span>
          </div>
          <p class="muted small">
            {{ project.assets.length }} ไฟล์ · แก้ไขแล้ว {{ project.history.length }} ครั้ง
          </p>
        </template>
      </section>

      <TranscriptPanel :transcript="transcript" @seek="playheadMs = $event" />
    </div>

    <TimelineBar
      :timeline="project.timeline"
      :assets="project.assets"
      :playhead-ms="playheadMs"
      @undo="undo"
    />
  </div>
</template>

<style scoped>
.editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px;
}

.workspace {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: 320px 1fr 320px;
  gap: 12px;
}

.preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
}

.screen {
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 100%;
  background: #0b0d12;
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.time {
  font-size: 28px;
  font-variant-numeric: tabular-nums;
  color: var(--accent-2);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.small {
  font-size: 12px;
}

.page-error {
  padding: 40px;
  text-align: center;
  color: var(--danger);
}

@media (max-width: 1100px) {
  .workspace {
    grid-template-columns: 1fr;
  }
}
</style>
