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
  <span class="chip" :class="tone"><span class="dot" />{{ s.label }}</span>
</template>

<style scoped>
.dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
</style>
