<script setup lang="ts">
import { computed, ref } from 'vue'
import Avatar from '../Avatar.vue'
import Icon from '../Icon.vue'
import { person, thDate, TODAY_ISO } from '../../data/mock'
import type { Project, WorkDoc } from '../../data/model'
import { notify, session } from '../../store'

// Project documents the PM keeps beside the work: home page, meeting minutes, milestone
// reports, whiteboards. Files live in the project's SharePoint folders (PM Report etc.).
const props = defineProps<{ p: Project }>()
const KIND: Record<WorkDoc['kind'], string> = { page: 'หน้าเอกสาร', meeting: 'บันทึกประชุม', report: 'รายงานงวด', whiteboard: 'Whiteboard' }
const q = ref('')
const kind = ref<'' | WorkDoc['kind']>('')
const sort = ref<'updated' | 'title'>('updated')
const docs = computed(() => props.p.workspace?.docs ?? [])
const shown = computed(() => {
  const list = docs.value.filter((d) => (!kind.value || d.kind === kind.value) && (!q.value.trim() || d.title.toLowerCase().includes(q.value.trim().toLowerCase())))
  const filtered = q.value.trim() || kind.value
  const sorted = [...list].sort((a, b) => (sort.value === 'title' ? a.title.localeCompare(b.title, 'th') : b.updated.localeCompare(a.updated)))
  if (filtered) return sorted.map((d) => ({ d, depth: 0 }))
  const out: { d: WorkDoc; depth: number }[] = []
  const walk = (pid: string | undefined, depth: number) => sorted.filter((d) => d.parentId === pid).forEach((d) => { out.push({ d, depth }); walk(d.id, depth + 1) })
  walk(undefined, 0)
  return out
})
const creating = ref<WorkDoc['kind'] | null>(null)
const title = ref('')
const TPL: Record<WorkDoc['kind'], { title: string; folder: string }> = {
  meeting: { title: `บันทึกประชุมลูกค้า ${thDate(TODAY_ISO)}`, folder: 'PM Report' },
  report: { title: 'รายงานความคืบหน้างวดถัดไป', folder: 'PM Report' },
  page: { title: 'หน้าเอกสารใหม่', folder: 'PM Report' },
  whiteboard: { title: 'Whiteboard ใหม่', folder: 'Document Config' },
}
function start(k: WorkDoc['kind']) { creating.value = k; title.value = TPL[k].title }
function create() {
  if (!creating.value || !title.value.trim() || !props.p.workspace) return
  const home = docs.value.find((d) => d.kind === 'page' && !d.parentId)
  props.p.workspace.docs = [{ id: 'd' + Date.now().toString(36), title: title.value.trim(), kind: creating.value, owner: session.userId, created: TODAY_ISO, updated: TODAY_ISO, folder: TPL[creating.value].folder, parentId: creating.value === 'whiteboard' ? undefined : home?.id }, ...docs.value]
  notify(`สร้าง “${title.value.trim()}” ในโฟลเดอร์ ${TPL[creating.value].folder} แล้ว`)
  creating.value = null
}
</script>

<template>
  <div class="docs">
    <div class="bar">
      <label class="srch"><Icon name="search" :size="16" /><input v-model="q" placeholder="ค้นหาเอกสาร" aria-label="ค้นหาเอกสาร" /></label>
      <select v-model="kind" class="input mini" aria-label="ประเภท"><option value="">ทุกประเภท</option><option v-for="(l, k) in KIND" :key="k" :value="k">{{ l }}</option></select>
      <select v-model="sort" class="input mini" aria-label="เรียง"><option value="updated">แก้ไขล่าสุด</option><option value="title">ชื่อ ก–ฮ</option></select>
      <span class="sp" />
      <span class="small muted">เก็บใน SharePoint › {{ p.code }}</span>
    </div>

    <section class="box">
      <header><Icon name="folder" :size="16" /> <strong>{{ p.name }}</strong></header>
      <table class="table">
        <thead><tr><th>ชื่อ</th><th>ประเภท</th><th>เจ้าของ</th><th>โฟลเดอร์</th><th>สร้าง</th><th>แก้ไขล่าสุด</th></tr></thead>
        <tbody>
          <tr v-for="{ d, depth } in shown" :key="d.id">
            <td><a href="#" class="nm" :style="{ paddingLeft: depth * 22 + 'px' }" @click.prevent="notify(`เปิด ${d.title} ใน SharePoint`)"><Icon :name="d.kind === 'whiteboard' ? 'board' : d.kind === 'meeting' ? 'people' : 'file'" :size="16" />{{ d.title }}</a></td>
            <td><span class="chip">{{ KIND[d.kind] }}</span></td>
            <td><span class="who"><Avatar :id="d.owner" :size="22" />{{ person(d.owner)?.name }}</span></td>
            <td class="small muted">{{ d.folder }}</td>
            <td class="small">{{ thDate(d.created) }}</td>
            <td class="small">{{ thDate(d.updated) }}</td>
          </tr>
          <tr v-if="!shown.length"><td colspan="6" class="muted">ไม่พบเอกสาร</td></tr>
        </tbody>
      </table>
      <div v-if="creating" class="new">
        <input v-model="title" class="input" :aria-label="`ชื่อ${KIND[creating]}`" @keydown.enter="create" @keydown.esc="creating = null" />
        <button class="btn primary sm" :disabled="!title.trim()" @click="create">สร้าง{{ KIND[creating] }}</button>
        <button class="btn ghost sm" @click="creating = null">ยกเลิก</button>
      </div>
      <div v-else class="adds">
        <span class="small muted">สร้าง</span>
        <button v-for="(l, k) in KIND" :key="k" class="btn sm" @click="start(k)">+ {{ l }}</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.docs { display: grid; gap: 14px; }
.bar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.srch { display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 10px; border: 1px solid var(--line-strong); border-radius: var(--r-sm); background: var(--surface); color: var(--muted); }
.srch input { border: 0; outline: 0; font: 14px var(--font); width: 200px; background: none; }
.input.mini { min-height: 34px; padding: 2px 8px; font-size: 14px; width: auto; }
.sp { flex: 1; }
.box { background: var(--sunken); border: 1px solid var(--line); border-radius: var(--r-md); padding: 12px; display: grid; gap: 10px; }
.box header { display: flex; gap: 8px; align-items: center; padding: 4px 6px; }
.box .table { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-sm); }
.nm { display: inline-flex; gap: 8px; align-items: center; color: var(--ink); }
.who { display: inline-flex; gap: 6px; align-items: center; white-space: nowrap; font-size: 14px; }
.adds, .new { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; padding: 4px 6px; }
.new .input { flex: 1; min-width: 220px; }
</style>
