<script setup lang="ts">
// The one summary row used on every page: same size, same order of label → value → note.
export interface Kpi { label: string; value: string; note?: string; tone?: '' | 'good' | 'warn' | 'bad'; to?: string }
defineProps<{ items: Kpi[] }>()
</script>

<template>
  <section class="kpis" :style="{ '--n': Math.min(items.length, 4) }">
    <component :is="k.to ? 'router-link' : 'div'" v-for="k in items" :key="k.label" :to="k.to" class="kpi" :class="[k.tone, { link: k.to }]">
      <span class="l">{{ k.label }}</span>
      <strong class="v num">{{ k.value }}</strong>
      <em v-if="k.note" class="n">{{ k.note }}</em>
    </component>
  </section>
</template>

<style scoped>
.kpis { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
.kpi { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); padding: 14px 18px; display: grid; gap: 2px; align-content: start; color: var(--ink); }
.kpi.link:hover { border-color: var(--line-strong); text-decoration: none; }
.l { font-size: 13px; color: var(--muted); }
.v { font-size: 24px; font-weight: 600; line-height: 1.25; }
.n { font-family: var(--desc); font-style: normal; font-size: 13px; color: var(--faint); }
.good .v { color: var(--win); }
.warn .v { color: var(--warn); }
.bad .v { color: var(--lose); }
@media (max-width: 1000px) { .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 420px) { .v { font-size: 20px; } }
</style>
