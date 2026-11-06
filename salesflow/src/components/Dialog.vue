<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
const props = defineProps<{ open: boolean; title: string; wide?: boolean }>()
const emit = defineEmits<{ close: [] }>()
const box = ref<HTMLElement>()
let last: Element | null = null

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
  if (e.key === 'Tab' && box.value) {
    const f = box.value.querySelectorAll<HTMLElement>('button, [href], input, select, textarea')
    if (!f.length) return
    const first = f[0], end = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end.focus() }
    else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); first.focus() }
  }
}
watch(() => props.open, async (o) => {
  if (o) {
    last = document.activeElement
    document.addEventListener('keydown', onKey)
    await nextTick()
    box.value?.querySelector<HTMLElement>('input, select, textarea, button')?.focus()
  } else {
    document.removeEventListener('keydown', onKey)
    ;(last as HTMLElement | null)?.focus?.()
  }
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Transition name="dlg">
    <div v-if="open" class="back" @mousedown.self="emit('close')">
      <div ref="box" class="dlg" :class="{ wide }" role="dialog" aria-modal="true" :aria-label="title">
        <header><h2>{{ title }}</h2><button class="btn ghost x" aria-label="ปิด" @click="emit('close')">✕</button></header>
        <div class="content"><slot /></div>
        <footer><slot name="foot" /></footer>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.back { position: fixed; inset: 0; background: rgb(22 27 38 / 0.45); display: flex; align-items: center; justify-content: center; z-index: 80; padding: 16px; }
.dlg { background: var(--surface); border-radius: var(--r-lg); width: 100%; max-width: 520px; max-height: calc(100vh - 32px); display: flex; flex-direction: column; box-shadow: var(--shadow-pop); }
.dlg.wide { max-width: 720px; }
header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 8px; }
.x { padding: 0 10px; }
.content { padding: 8px 24px 16px; overflow-y: auto; display: grid; gap: 16px; }
footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px 20px; border-top: 1px solid var(--line); }
.dlg-enter-active, .dlg-leave-active { transition: opacity var(--t-med) var(--ease); }
.dlg-enter-active .dlg, .dlg-leave-active .dlg { transition: transform var(--t-med) var(--ease); }
.dlg-enter-from, .dlg-leave-to { opacity: 0; }
.dlg-enter-from .dlg, .dlg-leave-to .dlg { transform: translateY(8px) scale(0.99); }
</style>
<style>
.dlg .content .chip { white-space: normal; height: auto; padding: 8px 12px; border-radius: 8px; line-height: 1.5; }
</style>
