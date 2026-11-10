<script setup lang="ts">
import { ref } from 'vue'
import { WORKSPACE_TEMPLATES, type Project, type WorkspaceTemplate } from '../../data/model'
import { suggestKey } from '../../domain/work'

// First visit after Handover: the PM picks how the team will run the work. The choice only
// changes which views open by default — every view stays available later.
const props = defineProps<{ p: Project }>()
const emit = defineEmits<{ create: [template: WorkspaceTemplate, key: string]; cancel: [] }>()
const pick = ref<WorkspaceTemplate>(props.p.type === 'MA' ? 'kanban' : (props.p.milestones?.length ? 'milestone' : 'scrum'))
const key = ref(suggestKey(props.p))
const keyOk = () => /^[A-Z][A-Z0-9]{1,5}$/.test(key.value)
</script>

<template>
  <section class="tp">
    <header>
      <h1>เลือกรูปแบบการจัดการโครงการ</h1>
      <p class="muted">เปลี่ยนได้ภายหลัง รูปแบบที่เลือกกำหนดแค่มุมมองเริ่มต้น ทุกมุมมองยังใช้ได้ครบ</p>
    </header>

    <div class="cards" role="radiogroup" aria-label="รูปแบบ">
      <button v-for="(t, k) in WORKSPACE_TEMPLATES" :key="k" type="button" class="card" role="radio" :aria-checked="pick === k" @click="pick = k">
        <div class="art" :class="k" aria-hidden="true">
          <template v-if="k === 'kanban'"><div v-for="c in 3" :key="c" class="col"><i v-for="r in 4 - c + 1" :key="r" /></div></template>
          <template v-else-if="k === 'milestone'"><div v-for="r in 4" :key="r" class="row"><b /><i :style="{ marginLeft: (r - 1) * 18 + '%', width: 30 + r * 6 + '%' }" /></div></template>
          <template v-else><div class="sp"><span>Sprint 1</span><i /><i /></div><div class="sp"><span>Sprint 2</span><i /><i /><i /></div><div class="sp bl"><span>Backlog</span><i /></div></template>
        </div>
        <h2>{{ t.label }}</h2>
        <p>{{ t.th }}</p>
        <span class="views">{{ t.views.map((v) => ({ summary: 'สรุป', list: 'รายการ', board: 'บอร์ด', calendar: 'ปฏิทิน', timeline: 'Timeline', backlog: 'Backlog' } as Record<string, string>)[v]).join(' · ') }}</span>
      </button>
    </div>

    <div class="field keyf">
      <label for="wk">รหัสงานของโครงการ</label>
      <input id="wk" v-model="key" class="input num" maxlength="6" @input="key = key.toUpperCase()" />
      <span class="hint">งานจะได้รหัส {{ key || 'KEY' }}-1, {{ key || 'KEY' }}-2 … ตัวอักษรภาษาอังกฤษ 2–6 ตัว</span>
    </div>

    <footer>
      <button class="btn" type="button" @click="emit('cancel')">กลับ</button>
      <button class="btn primary" type="button" :disabled="!keyOk()" @click="emit('create', pick, key)">สร้างพื้นที่งาน</button>
    </footer>
  </section>
</template>

<style scoped>
.tp { display: grid; gap: 24px; justify-items: center; text-align: center; padding: 12px 0 24px; }
header { display: grid; gap: 6px; }
header h1 { font-size: clamp(24px, 3vw, 32px); }
.cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; width: 100%; max-width: 1080px; padding: 20px; background: var(--sunken); border: 1px solid var(--line); border-radius: var(--r-lg); }
.card { display: grid; gap: 8px; align-content: start; text-align: left; padding: 18px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); cursor: pointer; font: inherit; color: var(--ink); transition: border-color var(--t-fast), box-shadow var(--t-fast); }
.card:hover { border-color: var(--line-strong); }
.card[aria-checked='true'] { border-color: var(--action); box-shadow: 0 0 0 2px var(--action); }
.card h2 { font-size: 20px; margin-top: 6px; }
.card p { font-size: 14px; color: var(--ink-2); line-height: 1.55; }
.views { font-size: 13px; color: var(--muted); }
.art { height: 150px; border-radius: var(--r-sm); background: var(--paper); padding: 16px; display: flex; gap: 8px; }
.art.kanban .col { flex: 1; background: var(--surface); border-radius: 6px; padding: 6px; display: grid; gap: 6px; align-content: start; border: 1px solid var(--line); }
.art.kanban .col i { height: 16px; border-radius: 4px; background: var(--presale-soft); border-left: 3px solid var(--presale); }
.art.kanban .col:nth-child(3) i { background: var(--win-soft); border-left-color: var(--win); }
.art.milestone { flex-direction: column; justify-content: center; }
.art.milestone .row { display: flex; align-items: center; gap: 8px; height: 22px; }
.art.milestone b { width: 22%; height: 8px; border-radius: 4px; background: var(--line-strong); flex: none; }
.art.milestone i { height: 12px; border-radius: 4px; background: var(--post); display: block; }
.art.scrum { flex-direction: column; }
.art.scrum .sp { background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 5px 8px; display: flex; gap: 5px; align-items: center; }
.art.scrum .sp span { font-size: 12px; color: var(--muted); width: 54px; }
.art.scrum .sp i { flex: 1; height: 10px; border-radius: 3px; background: var(--presale-soft); }
.art.scrum .bl i { background: var(--idle-soft); }
.keyf { width: 100%; max-width: 360px; text-align: left; }
footer { display: flex; gap: 8px; }
@media (max-width: 860px) { .cards { grid-template-columns: 1fr; } }
</style>
