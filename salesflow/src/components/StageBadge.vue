<script setup lang="ts">
import { computed } from 'vue'
import { stageOf, type StageKey } from '../data/model'
const props = defineProps<{ stage: StageKey }>()
const s = computed(() => stageOf(props.stage))
const tone = computed(() =>
  props.stage === 'win' ? 'win' : props.stage === 'lose' ? 'lose' : props.stage === 'cancelled' || props.stage === 'ended' ? '' : s.value.phase === 'presale' ? 'presale' : 'post',
)
</script>

<template>
  <span class="chip" :class="tone" :title="`${s.code} – ${s.label}: ${s.hint}`"><span class="dot" /><b class="code">{{ s.code }}</b>{{ s.label }}</span>
</template>

<style scoped>
.dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.code { font-family: var(--display); font-weight: 700; letter-spacing: 0.02em; }
</style>
