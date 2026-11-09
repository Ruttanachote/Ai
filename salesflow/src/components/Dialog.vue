<script setup lang="ts">
// App-wide dialog on Naive UI's NModal (mask, focus trap, Esc, scroll lock, transitions)
// with our header/footer layout. API unchanged: open, title, wide, #foot.
import { NModal } from 'naive-ui'
defineProps<{ open: boolean; title: string; wide?: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <NModal :show="open" :mask-closable="true" :close-on-esc="true" transform-origin="center" @update:show="(v: boolean) => !v && emit('close')">
    <div class="dlg" :class="{ wide }" role="dialog" aria-modal="true" :aria-label="title">
      <header><h2>{{ title }}</h2><button class="btn ghost x" aria-label="ปิด" @click="emit('close')">✕</button></header>
      <div class="content"><slot /></div>
      <footer><slot name="foot" /></footer>
    </div>
  </NModal>
</template>

<style scoped>
.dlg { background: var(--raised); border: 1px solid var(--line); border-radius: 16px; width: calc(100vw - 32px); max-width: 520px; max-height: calc(100vh - 32px); display: flex; flex-direction: column; box-shadow: var(--shadow-pop); }
.dlg.wide { max-width: 720px; }
header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 8px; }
.x { padding: 0 10px; }
.content { padding: 8px 24px 16px; overflow-y: auto; display: grid; gap: 16px; }
footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px 20px; border-top: 1px solid var(--line); }
</style>
<style>
.dlg .content .chip { white-space: normal; height: auto; padding: 8px 12px; border-radius: 8px; line-height: 1.5; }
</style>
