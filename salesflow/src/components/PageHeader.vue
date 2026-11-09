<script setup lang="ts">
// Every module page opens the same way: title, what it shows, whose data, then actions.
defineProps<{ title: string; subtitle?: string; scope?: string; module?: string }>()
</script>

<template>
  <header class="ph">
    <div class="txt">
      <p v-if="module" class="mod">{{ module }}</p>
      <h1>{{ title }}</h1>
      <p v-if="subtitle || scope" class="sub">
        <span v-if="scope" class="scope">{{ scope }}</span>
        <span v-if="subtitle">{{ subtitle }}</span>
      </p>
    </div>
    <div v-if="$slots.default" class="acts"><slot /></div>
  </header>
</template>

<style scoped>
.ph { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.txt { min-width: 0; display: grid; gap: 4px; }
.mod { font-size: 13px; color: var(--muted); }
h1 { text-wrap: balance; }
.sub { font-family: var(--desc); font-size: 15px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; color: var(--muted); }
.scope { font-family: var(--font); display: inline-flex; align-items: center; height: 24px; padding: 0 10px; border-radius: 999px; background: var(--ink); color: var(--on-ink); font-size: 12px; font-weight: 500; }
.acts { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
