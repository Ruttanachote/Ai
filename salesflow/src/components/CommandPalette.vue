<script setup lang="ts">
// Ctrl/⌘ + K: jump to any menu, project or work item the signed-in role can see.
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NModal } from 'naive-ui'
import Icon from './Icon.vue'
import { NAV } from '../nav'
import { scope, session } from '../store'
import { STAGES } from '../data/model'
import { keyOf } from '../domain/work'

const open = defineModel<boolean>({ default: false })
const router = useRouter()
const q = ref('')
const active = ref(0)
const input = ref<HTMLInputElement>()

interface Hit { group: string; label: string; hint: string; icon: string; to: string }
const hits = computed<Hit[]>(() => {
  const s = q.value.trim().toLowerCase()
  const has = (...v: (string | undefined)[]) => !s || v.some((x) => x?.toLowerCase().includes(s))
  const menus = NAV.flatMap((g) => g.items.filter((i) => i.roles.includes(session.role)).map((i) => ({ group: 'เมนู', label: i.label, hint: g.title, icon: i.icon, to: i.to })))
    .filter((h) => has(h.label, h.hint))
  const projects = scope.value.list.filter((p) => has(p.name, p.code, p.customer))
    .map((p) => ({ group: 'โครงการ', label: p.name, hint: `${p.code} · ${STAGES.find((x) => x.key === p.stage)?.label ?? p.stage}`, icon: 'folder', to: session.role === 'dev' ? `/work/${p.id}` : `/projects/${p.id}` }))
  const work = s.length < 2 ? [] : scope.value.list.flatMap((p) => (p.tasks ?? []).filter((t) => has(keyOf(t), t.title)).map((t) => ({ group: 'งาน', label: `${keyOf(t)} ${t.title}`, hint: p.name, icon: 'check', to: `/work/${p.id}` })))
  return [...menus.slice(0, 8), ...projects.slice(0, 6), ...work.slice(0, 6)]
})
const groups = computed(() => [...new Set(hits.value.map((h) => h.group))].map((g) => ({ g, items: hits.value.filter((h) => h.group === g) })))

watch(open, async (o) => { if (o) { q.value = ''; active.value = 0; await nextTick(); input.value?.focus() } })
watch(q, () => (active.value = 0))
function go(h?: Hit) {
  if (!h) return
  open.value = false
  router.push(h.to)
}
function key(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') { active.value = Math.min(hits.value.length - 1, active.value + 1); e.preventDefault() }
  if (e.key === 'ArrowUp') { active.value = Math.max(0, active.value - 1); e.preventDefault() }
  if (e.key === 'Enter') go(hits.value[active.value])
}
</script>

<template>
  <NModal v-model:show="open" :auto-focus="false" transform-origin="center">
    <div class="cp" role="dialog" aria-label="ค้นหาและไปยังหน้า">
      <label class="in"><Icon name="search" /><input ref="input" v-model="q" placeholder="ค้นหาเมนู โครงการ หรือรหัสงาน เช่น SPP-5" aria-label="ค้นหา" @keydown="key" /><kbd>Esc</kbd></label>
      <div class="res" role="listbox">
        <template v-for="g in groups" :key="g.g">
          <p class="gt">{{ g.g }}</p>
          <button v-for="h in g.items" :key="h.group + h.to + h.label" role="option" :aria-selected="hits.indexOf(h) === active" class="hit"
            @mouseenter="active = hits.indexOf(h)" @click="go(h)">
            <Icon :name="h.icon" :size="16" /><span class="l">{{ h.label }}</span><span class="h">{{ h.hint }}</span>
          </button>
        </template>
        <p v-if="!hits.length" class="none">ไม่พบ “{{ q }}” — ลองค้นด้วยรหัสโครงการหรือชื่อลูกค้า</p>
      </div>
      <footer><span><kbd>↑</kbd><kbd>↓</kbd> เลือก</span><span><kbd>Enter</kbd> เปิด</span><span><kbd>Ctrl</kbd><kbd>K</kbd> เปิดจากทุกหน้า</span></footer>
    </div>
  </NModal>
</template>

<style scoped>
.cp { width: min(640px, calc(100vw - 32px)); background: var(--raised); border: 1px solid var(--line); border-radius: 16px; box-shadow: var(--shadow-pop); overflow: hidden; margin: 12vh auto auto; align-self: flex-start; }
.in { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--line); color: var(--muted); }
.in input { flex: 1; border: 0; outline: 0; background: none; font: 16px var(--font); color: var(--ink); }
kbd { font: 11px var(--font); border: 1px solid var(--line-strong); border-bottom-width: 2px; border-radius: 5px; padding: 0 5px; color: var(--muted); background: var(--sunken); }
.res { max-height: 52vh; overflow-y: auto; padding: 6px; }
.gt { font-size: 12px; color: var(--faint); padding: 8px 10px 4px; }
.hit { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 10px; align-items: center; width: 100%; border: 0; background: none; text-align: left; padding: 9px 10px; border-radius: 8px; font: 14px var(--font); color: var(--ink); cursor: pointer; }
.hit[aria-selected='true'] { background: var(--primary-soft); color: var(--primary); }
.l { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.h { font-size: 12px; color: var(--muted); white-space: nowrap; }
.none { padding: 24px; text-align: center; color: var(--muted); font-size: 14px; }
footer { display: flex; gap: 16px; padding: 10px 16px; border-top: 1px solid var(--line); font-size: 12px; color: var(--muted); background: var(--sunken); }
footer span { display: inline-flex; gap: 4px; align-items: center; }
@media (max-width: 560px) { footer span:last-child { display: none; } }
</style>
