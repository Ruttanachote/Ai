<script setup lang="ts">
// "คำอธิบายสถานะ" — the project statuses and project types with their proposed short codes,
// grouped like the sales hand-book: Pre-sale, sales result, post-sale.
import { ref } from 'vue'
import Dialog from './Dialog.vue'
import { PROJECT_TYPES, STAGES, type Phase } from '../data/model'

defineProps<{ label?: string }>()
const open = ref(false)
const GROUPS: { phase: Phase; title: string; owner: string }[] = [
  { phase: 'presale', title: 'ช่วงขาย', owner: 'Pre-sale ดูแล' },
  { phase: 'result', title: 'ผลการขาย', owner: '' },
  { phase: 'postsale', title: 'ช่วงหลังขาย', owner: 'PMO / PM / MA ดูแล' },
]
</script>

<template>
  <button type="button" class="btn ghost sm" @click="open = true">{{ label ?? 'คำอธิบายสถานะ' }}</button>
  <Dialog :open="open" title="สถานะโครงการใน One Platform" wide @close="open = false">
    <section v-for="g in GROUPS" :key="g.phase" class="grp">
      <h3>{{ g.title }} <span v-if="g.owner" class="muted small">({{ g.owner }})</span></h3>
      <dl>
        <template v-for="s in STAGES.filter((x) => x.phase === g.phase)" :key="s.key">
          <dt><b class="code" :class="s.key === 'lose' ? 'lose' : s.key === 'cancelled' || s.key === 'ended' ? '' : g.phase">{{ s.code }}</b> {{ s.label }}</dt>
          <dd>{{ s.hint }}<span v-if="s.prob !== '—'" class="prob"> ({{ s.prob }})</span></dd>
        </template>
      </dl>
    </section>
    <section class="grp">
      <h3>ประเภทโครงการ</h3>
      <dl>
        <template v-for="(t, k) in PROJECT_TYPES" :key="k"><dt><b class="code">{{ k }}</b> {{ t.label.replace(`${k} · `, '') }}</dt><dd>{{ t.th }}</dd></template>
      </dl>
    </section>
    <p class="small muted note">หมายเหตุ: ตัวย่อสถานะและประเภทเป็นชุดที่เสนอ ใครมีความเห็นแจ้งได้ก่อนนำขึ้นระบบ</p>
    <template #foot><button class="btn primary" @click="open = false">ปิด</button></template>
  </Dialog>
</template>

<style scoped>
.grp h3 { font-size: 15px; margin: 0 0 8px; }
dl { display: grid; grid-template-columns: minmax(150px, auto) 1fr; gap: 8px 16px; margin: 0; }
dt { font-weight: 600; white-space: nowrap; }
dd { margin: 0; color: var(--ink-2); }
.code { display: inline-block; min-width: 40px; padding: 1px 6px; margin-right: 4px; border-radius: 4px; font-family: var(--display); font-size: 12px; text-align: center; background: var(--idle-soft); color: var(--ink-2); }
.code.presale { background: var(--presale-soft); color: var(--presale); }
.code.result { background: var(--win-soft); color: var(--win); }
.code.postsale { background: var(--post-soft); color: var(--post); }
.code.lose { background: var(--lose-soft); color: var(--lose); }
.prob { color: var(--muted); }
.note { margin: 0; }
@media (max-width: 560px) { dl { grid-template-columns: 1fr; gap: 2px; } dd { margin-bottom: 8px; } }
</style>
