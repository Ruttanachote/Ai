<script setup lang="ts">
import { computed } from 'vue'
import { fmtMs } from '../api'
import type { MediaAsset, Timeline } from '../types'

const props = defineProps<{ timeline: Timeline; assets: MediaAsset[]; playheadMs: number }>()
defineEmits<{ undo: [] }>()

const duration = computed(() =>
  Math.max(
    1,
    ...props.timeline.tracks.map((t) =>
      t.clips.reduce((s, c) => s + (c.source_out_ms - c.source_in_ms), 0),
    ),
  ),
)

const primaryClips = computed(() => {
  const track = props.timeline.tracks[0]
  if (!track) return []
  let pos = 0
  return track.clips.map((c) => {
    const len = c.source_out_ms - c.source_in_ms
    const left = (pos / duration.value) * 100
    const width = (len / duration.value) * 100
    pos += len
    const asset = props.assets.find((a) => a.id === c.asset_id)
    return { id: c.id, left, width, label: asset?.filename ?? '?', len }
  })
})

const playheadLeft = computed(() =>
  Math.min(100, (props.playheadMs / duration.value) * 100),
)
</script>

<template>
  <section class="timeline panel">
    <div class="bar-header">
      <h2>🎞 Timeline · {{ fmtMs(duration) }}</h2>
      <span v-if="timeline.captions.length" class="muted">
        ซับ {{ timeline.captions.length }} บรรทัด ({{ timeline.caption_language }})
      </span>
      <button @click="$emit('undo')">↩ Undo</button>
    </div>
    <div class="track">
      <div
        v-for="clip in primaryClips"
        :key="clip.id"
        class="clip"
        :style="{ left: clip.left + '%', width: clip.width + '%' }"
        :title="`${clip.label} · ${fmtMs(clip.len)}`"
      >
        <span>{{ clip.label }}</span>
      </div>
      <div class="playhead" :style="{ left: playheadLeft + '%' }" />
    </div>
  </section>
</template>

<style scoped>
.timeline {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bar-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.bar-header h2 {
  margin: 0;
  font-size: 14px;
  flex: 1;
}

.track {
  position: relative;
  height: 52px;
  background: var(--panel-2);
  border-radius: 8px;
  overflow: hidden;
}

.clip {
  position: absolute;
  top: 6px;
  bottom: 6px;
  background: linear-gradient(180deg, #3d5aad, #31488c);
  border: 1px solid var(--accent);
  border-radius: 6px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  overflow: hidden;
}

.clip span {
  font-size: 11px;
  white-space: nowrap;
  color: #dfe6ff;
}

.playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--accent-2);
}
</style>
