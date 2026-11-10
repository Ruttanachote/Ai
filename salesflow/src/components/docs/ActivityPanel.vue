<script setup lang="ts">
// Activity log (spec §3.5): every change — who, what, when, old → new — including files,
// approvals and status moves. Filter by event type and by person.
import { computed, ref } from 'vue'
import type { ActivityType, Project } from '../../data/model'

const props = defineProps<{ p: Project }>()
const TYPES: Record<ActivityType, string> = { stage: 'สถานะ', file: 'ไฟล์', document: 'Cost Sheet / Quotation', approval: 'อนุมัติ', field: 'แก้ข้อมูล', team: 'ทีม' }
const type = ref<ActivityType | ''>('')
const who = ref('')
const rows = computed(() => props.p.activities ?? [])
const people = computed(() => [...new Set(rows.value.map((r) => r.who))].sort())
const list = computed(() => rows.value.filter((r) => (!type.value || r.type === type.value) && (!who.value || r.who === who.value)))
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <h2>Activity</h2>
      <div class="flt">
        <label class="sr" for="aft">ประเภท</label>
        <select id="aft" v-model="type" class="input mini"><option value="">ทุกประเภท</option><option v-for="(l, k) in TYPES" :key="k" :value="k">{{ l }}</option></select>
        <label class="sr" for="afw">ผู้ใช้</label>
        <select id="afw" v-model="who" class="input mini"><option value="">ทุกคน</option><option v-for="w in people" :key="w" :value="w">{{ w }}</option></select>
      </div>
    </div>
    <ol class="log">
      <li v-for="r in list" :key="r.id">
        <span class="chip" :class="{ presale: r.type === 'stage', post: r.type === 'file', warn: r.type === 'approval', win: r.type === 'document' }">{{ TYPES[r.type] }}</span>
        <div>
          <p><b>{{ r.who }}</b> {{ r.text }}<template v-if="r.from !== undefined || r.to !== undefined"> จาก <s>{{ r.from ?? '—' }}</s> เป็น <b>{{ r.to ?? '—' }}</b></template></p>
          <p class="small muted">{{ r.at }}</p>
        </div>
      </li>
    </ol>
    <p v-if="!list.length" class="small muted">ไม่มีรายการตามตัวกรอง</p>
  </section>
</template>

<style scoped>
.flt { display: flex; gap: 8px; }
.mini { min-height: 34px; font-size: 14px; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.log { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.log li { display: grid; grid-template-columns: 150px 1fr; gap: 12px; align-items: start; border-bottom: 1px solid var(--line); padding-bottom: 10px; }
.log .chip { justify-self: start; }
.log p { margin: 0; }
.log s { color: var(--muted); }
@media (max-width: 640px) { .log li { grid-template-columns: 1fr; gap: 4px; } }
</style>
