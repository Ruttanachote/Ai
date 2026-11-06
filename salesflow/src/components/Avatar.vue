<script setup lang="ts">
import { computed } from 'vue'
import { person } from '../data/mock'
const props = defineProps<{ id?: string; size?: number; label?: string }>()
const p = computed(() => person(props.id))
</script>

<template>
  <span class="av" :style="{ width: (size ?? 32) + 'px', height: (size ?? 32) + 'px', background: p?.color ?? '#9aa1ae', fontSize: (size ?? 32) * 0.36 + 'px' }"
    :title="p?.name ?? label ?? 'ยังไม่ระบุ'">
    {{ p?.initials ?? label?.slice(0, 1) ?? '?' }}
  </span>
</template>

<style scoped>
.av { display: inline-grid; place-items: center; border-radius: 50%; color: #fff; font-weight: 600; flex: none; font-family: var(--display); letter-spacing: 0.02em; }
</style>
