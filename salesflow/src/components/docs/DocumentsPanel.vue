<script setup lang="ts">
// Project documents (spec §4): fixed folders by phase, drag-and-drop upload with progress,
// versions (approved versions locked), preview, download, rename / move, soft delete + trash,
// search, card and list views. Cost Sheet and Quotation folders also show the revisions made
// in the Cost Sheet & Quotation module.
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NDrawer, NDrawerContent } from 'naive-ui'
import Icon from '../Icon.vue'
import Dialog from '../Dialog.vue'
import { DOC_STATUS, type Project, type ProjectDocument, type StageKey } from '../../data/model'
import { TODAY_ISO, person, thDate } from '../../data/mock'
import { notify } from '../../store'
import { FOLDERS, folderOf, foldersFor, uploadError, MAX_MB, type FolderDef } from '../../domain/salesdocs'
import { addFile, canDelete, canOpenFolder, canUpload, deleteDoc, isOwner, logDownload, moveDoc, renameDoc, restoreDoc, restoreVersion, type UploadMeta } from '../../docstore'

const props = defineProps<{ p: Project; focus?: string | null }>()
const emit = defineEmits<{ openCost: [] }>()
const router = useRouter()

const ORDER: StageKey[] = ['opportunity', 'pipeline', 'forecast', 'rebidding', 'win', 'handover', 'delivery', 'warranty', 'ended']
const at = computed(() => ORDER.indexOf(props.p.stage === 'lose' ? 'rebidding' : props.p.stage === 'cancelled' ? 'delivery' : props.p.stage))
const opensAt = (f: FolderDef): StageKey => (f.module ? 'pipeline' : f.phase === 'post' ? 'win' : 'opportunity')
const isOpenFolder = (f: FolderDef) => ORDER.indexOf(opensAt(f)) <= at.value
const STAGE_TH: Partial<Record<StageKey, string>> = { pipeline: 'Pipeline', forecast: 'Forecast', win: 'Close Win', warranty: 'ปิดงานส่งมอบ (Warranty)' }

const live = computed(() => (props.p.documents ?? []).filter((d) => !d.deletedAt))
const trash = computed(() => (props.p.documents ?? []).filter((d) => d.deletedAt))
const docsIn = (code: string) => live.value.filter((d) => d.folder === code)
const moduleCount = (f: FolderDef) => (f.module === 'cost' ? props.p.costSheets?.length ?? 0 : f.module === 'quote' ? props.p.quotations?.length ?? 0 : 0)
const moduleState = (f: FolderDef) => {
  const list = f.module === 'cost' ? props.p.costSheets : f.module === 'quote' ? props.p.quotations : undefined
  if (!list?.length) return null
  if (list.some((x) => x.status === 'APPROVED')) return 'approved'
  if (list.some((x) => x.status === 'PENDING')) return 'pending'
  return null
}
const lastUpdate = (code: string) => docsIn(code).flatMap((d) => d.versions.map((v) => v.at)).sort().at(-1)
/** Required for the stage the project moves into next and still missing. */
const nextStage = computed(() => ORDER.slice(at.value + 1).find((k) => FOLDERS.some((f) => f.requiredFor === k)))
const missing = (f: FolderDef) => f.requiredFor === nextStage.value && !docsIn(f.code).length && !(f.module && moduleState(f) === 'approved')

const cards = computed(() => foldersFor(props.p.type).map((f) => {
  const count = docsIn(f.code).length + moduleCount(f)
  const ms = moduleState(f)
  const state = !isOpenFolder(f) ? 'locked' : ms === 'approved' ? 'approved' : ms === 'pending' ? 'pending' : count ? 'has' : 'empty'
  return { f, count, state, last: lastUpdate(f.code), missing: isOpenFolder(f) && missing(f), canOpen: canOpenFolder(props.p, f.code) }
}))
const STATE: Record<string, { l: string; tone: string }> = { empty: { l: 'ว่าง', tone: '' }, has: { l: 'มีไฟล์', tone: 'post' }, pending: { l: 'รออนุมัติ', tone: 'warn' }, approved: { l: 'อนุมัติแล้ว', tone: 'win' }, locked: { l: 'ยังไม่เปิด', tone: '' } }
const PHASES = [{ k: 'pre', l: 'เอกสารก่อนการขาย' }, { k: 'post', l: 'เอกสารหลังการขาย' }, { k: 'other', l: 'Other Documents' }] as const

/* ---------- search + views ---------- */
const q = ref('')
const view = ref<'cards' | 'list'>('cards')
const hits = computed(() => {
  const s = q.value.trim().toLowerCase()
  const rows = live.value.filter((d) => canOpenFolder(props.p, d.folder))
  return s ? rows.filter((d) => `${d.title} ${d.docNo ?? ''} ${person(d.createdBy)?.name ?? ''} ${d.versions.map((v) => v.stdName + ' ' + v.fileName).join(' ')}`.toLowerCase().includes(s)) : rows
})
const latest = (d: ProjectDocument) => d.versions[d.versions.length - 1]
const fmtSize = (b: number) => (b > 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB')

/* ---------- folder drawer ---------- */
const openFolder = ref<string | null>(props.focus ?? null)
// The project page's step guide can open a folder directly (e.g. Contract before Close Win).
watch(() => props.focus, (f) => { if (f) openFolder.value = f })
const folder = computed(() => (openFolder.value ? folderOf(openFolder.value) : undefined))
const folderDocs = computed(() => (openFolder.value ? docsIn(openFolder.value) : []))
const expanded = reactive<Record<string, boolean>>({})
function tryOpen(c: (typeof cards.value)[number]) {
  if (c.state === 'locked') return notify(`โฟลเดอร์ ${c.f.name} เปิดเมื่อโครงการเป็น ${STAGE_TH[opensAt(c.f)]}`, 'info')
  if (!c.canOpen) return notify(`${c.f.name} มีต้นทุนภายใน — เปิดได้เฉพาะ Owner, SM, ผู้อนุมัติ และผู้บริหาร`, 'warning')
  openFolder.value = c.f.code
}
const moduleRows = computed(() => {
  if (folder.value?.module === 'cost') return (props.p.costSheets ?? []).slice().reverse().map((c) => ({ id: c.id, title: `${c.docNo} rev.${c.revision}`, status: c.status, at: c.preparedAt, by: c.createdBy, to: `/projects/${props.p.id}/cost-sheet/${c.id}` }))
  if (folder.value?.module === 'quote') return (props.p.quotations ?? []).slice().reverse().map((x) => ({ id: x.id, title: `${x.docNo} rev.${x.revision}`, status: x.status, at: x.issueDate, by: x.createdBy, to: `/projects/${props.p.id}/quotation/${x.id}` }))
  return []
})

/* ---------- upload ---------- */
interface Pending { file: File; err: string; pct: number; state: 'ready' | 'uploading' | 'done' | 'error' }
const up = reactive({ open: false, folder: 'other', target: null as ProjectDocument | null, files: [] as Pending[], meta: { title: '', docNo: '', docDate: TODAY_ISO, amount: undefined as number | undefined, note: '' } as UploadMeta & { title: string; docNo: string }, busy: false, tried: false })
const dragOn = ref<string | null>(null)
function startUpload(folderCode?: string, files?: FileList | File[], target?: ProjectDocument) {
  up.folder = folderCode ?? openFolder.value ?? 'other'
  up.target = target ?? null
  up.files = []
  up.meta = { title: target?.title ?? '', docNo: target?.docNo ?? '', docDate: TODAY_ISO, amount: undefined, note: '' }
  up.tried = false
  up.open = true
  if (files) addPicked(files)
}
function addPicked(list: FileList | File[]) {
  for (const f of Array.from(list)) up.files.push({ file: f, err: uploadError(f.name, f.size, up.folder, MAX_MB), pct: 0, state: 'ready' })
  if (up.target) up.files = up.files.slice(-1)
}
function revalidate() { up.files.forEach((x) => { if (x.state === 'ready') x.err = uploadError(x.file.name, x.file.size, up.folder) }) }
const upFolder = computed(() => folderOf(up.folder))
const docNoMissing = computed(() => !!upFolder.value?.needsDocNo && !up.meta.docNo.trim())
const uploadable = computed(() => up.files.filter((x) => !x.err && x.state !== 'done'))
function onDropCard(e: DragEvent, c: (typeof cards.value)[number]) {
  dragOn.value = null
  if (c.state === 'locked' || !canUpload(props.p, c.f.code)) return notify(c.state === 'locked' ? `โฟลเดอร์ ${c.f.name} ยังไม่เปิด` : 'คุณไม่มีสิทธิ์อัปโหลดลงโฟลเดอร์นี้', 'warning')
  if (e.dataTransfer?.files?.length) startUpload(c.f.code, e.dataTransfer.files)
}
function runOne(x: Pending) {
  x.state = 'uploading'; x.pct = 0
  // Upload goes straight to object storage with a presigned URL; progress per file.
  const step = Math.max(4, Math.round(40 / Math.max(1, x.file.size / (4 * 1024 * 1024))))
  const t = window.setInterval(() => {
    if (!navigator.onLine) { window.clearInterval(t); x.state = 'error'; x.err = 'การเชื่อมต่อหลุด — กดลองใหม่'; return }
    x.pct = Math.min(100, x.pct + step)
    if (x.pct >= 100) {
      window.clearInterval(t)
      x.state = 'done'
      addFile(props.p, up.folder, { name: x.file.name, size: x.file.size, type: x.file.type, url: URL.createObjectURL(x.file) },
        { ...up.meta, title: up.files.length > 1 ? '' : up.meta.title, amount: up.meta.amount ? Number(up.meta.amount) : undefined }, up.target ?? undefined)
      if (up.files.every((y) => y.state === 'done' || (y.err && y.state !== 'error'))) finishUpload()
    }
  }, 60)
}
function startAll() {
  up.tried = true
  if (docNoMissing.value || !uploadable.value.length) return
  uploadable.value.forEach(runOne)
}
function retry(x: Pending) { x.err = ''; runOne(x) }
function finishUpload() {
  const n = up.files.filter((x) => x.state === 'done').length
  window.setTimeout(() => { up.open = false; notify(`อัปโหลด ${n} ไฟล์ลง ${upFolder.value?.name} แล้ว`) }, 300)
  openFolder.value = up.folder
}

/* ---------- file actions ---------- */
const preview = ref<{ d: ProjectDocument; no: number } | null>(null)
const pv = computed(() => (preview.value ? preview.value.d.versions.find((v) => v.no === preview.value!.no) : undefined))
const isPdf = computed(() => pv.value?.mime === 'application/pdf' || pv.value?.fileName.toLowerCase().endsWith('.pdf'))
const isImg = computed(() => !!pv.value?.mime.startsWith('image/'))
function download(d: ProjectDocument, no: number) {
  const v = d.versions.find((x) => x.no === no)!
  logDownload(props.p, d, no)
  if (v.url) { const a = document.createElement('a'); a.href = v.url; a.download = v.stdName; a.click() }
  else notify(`ดาวน์โหลด ${v.stdName} (ต้นแบบ: ไฟล์ตัวอย่างไม่มีเนื้อหาจริง)`, 'info')
}
const renaming = ref<{ d: ProjectDocument; title: string } | null>(null)
const moving = ref<{ d: ProjectDocument; to: string } | null>(null)
const deleting = ref<{ d: ProjectDocument; typed: string } | null>(null)
const isLocked = (d: ProjectDocument) => d.approvedVersion !== undefined || d.versions.some((v) => v.locked)
const trashOpen = ref(false)
const daysLeft = (d: ProjectDocument) => 30 - Math.round((new Date(TODAY_ISO).getTime() - new Date(d.deletedAt!).getTime()) / 86_400_000)
const owner = computed(() => isOwner(props.p))
/** Create opens the new workbook in Excel Online (Cost Sheet) or the Quotation tab. */
function create(kind: 'cost' | 'quote') {
  openFolder.value = null
  if (kind === 'cost') router.push(`/projects/${props.p.id}/cost-sheet/new`)
  else emit('openCost')
}
</script>

<template>
  <section class="panel docs">
    <div class="dh">
      <h2>เอกสารโครงการ</h2>
      <label class="search"><Icon name="search" :size="16" /><span class="sr">ค้นหาไฟล์</span><input v-model="q" placeholder="ค้นหาชื่อไฟล์ เลขที่เอกสาร หรือผู้อัปโหลด" /></label>
      <div class="seg" role="radiogroup" aria-label="มุมมอง">
        <button role="radio" :aria-checked="view === 'cards'" @click="view = 'cards'">การ์ด</button>
        <button role="radio" :aria-checked="view === 'list'" @click="view = 'list'">รายการ</button>
      </div>
      <button v-if="trash.length && owner" class="btn sm" @click="trashOpen = true"><Icon name="x" :size="14" /> ถังขยะ ({{ trash.length }})</button>
      <button v-if="canUpload(p, 'other') || canUpload(p, 'pr')" class="btn primary sm" @click="startUpload(undefined)"><Icon name="upload" :size="16" /> Upload</button>
    </div>

    <template v-if="view === 'cards' && !q.trim()">
      <div v-for="ph in PHASES" :key="ph.k" class="phase">
        <h3>{{ ph.l }}</h3>
        <div class="grid">
          <button v-for="c in cards.filter((x) => x.f.phase === ph.k)" :key="c.f.code" class="folder" :class="[c.state, { drag: dragOn === c.f.code }]"
            :aria-label="`${c.f.name}: ${STATE[c.state].l}${c.count ? ', ' + c.count + ' ไฟล์' : ''}${c.missing ? ', เอกสารบังคับที่ยังขาด' : ''}`"
            @click="tryOpen(c)" @dragover.prevent="dragOn = c.f.code" @dragleave="dragOn = null" @drop.prevent="onDropCard($event, c)">
            <span v-if="c.missing" class="req" title="เอกสารบังคับของสถานะถัดไปที่ยังขาด">✱</span>
            <svg class="ico" viewBox="0 0 48 40" aria-hidden="true"><path d="M2 6a4 4 0 0 1 4-4h12l5 5h19a4 4 0 0 1 4 4v23a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" /><path class="lip" d="M2 13h44v21a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" /></svg>
            <strong>{{ c.f.name }}</strong>
            <span class="meta">
              <template v-if="c.state === 'locked'"><Icon name="lock" :size="12" /> เปิดเมื่อเป็น {{ STAGE_TH[opensAt(c.f)] }}</template>
              <template v-else-if="!c.canOpen"><Icon name="lock" :size="12" /> เฉพาะผู้เกี่ยวข้อง</template>
              <template v-else>{{ c.count ? c.count + ' ไฟล์' : 'ยังไม่มีไฟล์' }}<template v-if="c.last"> · {{ thDate(c.last) }}</template></template>
            </span>
            <span v-if="c.state !== 'locked' && c.canOpen" class="chip" :class="STATE[c.state].tone">{{ STATE[c.state].l }}</span>
          </button>
        </div>
      </div>
      <p class="hint"><b>✱</b> = เอกสารที่ต้องมีก่อนเปลี่ยนเป็น {{ nextStage ? STAGE_TH[nextStage] ?? nextStage : '—' }} · ลากไฟล์มาวางบนการ์ดโฟลเดอร์เพื่ออัปโหลดได้ทันที</p>
    </template>

    <div v-else class="scroll-x">
      <table class="table">
        <thead><tr><th>ชื่อไฟล์</th><th>โฟลเดอร์</th><th>เวอร์ชัน</th><th>สถานะ</th><th>ผู้อัปโหลด</th><th>วันที่</th></tr></thead>
        <tbody>
          <tr v-for="d in hits" :key="d.id" class="lr" @click="openFolder = d.folder">
            <td><strong>{{ d.title }}</strong><span class="small muted sub">{{ latest(d).stdName }}<template v-if="d.docNo"> · เลขที่ {{ d.docNo }}</template></span></td>
            <td class="small">{{ folderOf(d.folder)?.name }}</td>
            <td class="num">v{{ latest(d).no }}</td>
            <td><span class="chip" :class="isLocked(d) ? 'win' : 'post'">{{ isLocked(d) ? 'อนุมัติแล้ว' : 'มีไฟล์' }}</span></td>
            <td class="small">{{ person(d.createdBy)?.name ?? d.createdBy }}</td>
            <td class="small nowrap">{{ thDate(latest(d).at) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!hits.length" class="empty small muted">ไม่พบไฟล์{{ q ? ` ที่ตรงกับ “${q}”` : '' }}</p>
    </div>
  </section>

  <!-- Folder -->
  <NDrawer :show="!!folder" :width="620" placement="right" @update:show="(v: boolean) => { if (!v) openFolder = null }">
    <NDrawerContent v-if="folder" :title="folder.name" closable>
      <div class="fd">
        <div class="fdh">
          <p v-if="folder.requiredFor" class="small muted">ต้องใช้ก่อนเปลี่ยนเป็น {{ STAGE_TH[folder.requiredFor] ?? folder.requiredFor }}</p>
          <span class="sp" />
          <button v-if="folder.module" class="btn sm" @click="create(folder.module)">{{ folder.module === 'cost' ? '+ Create Cost Sheet (Excel Online)' : '+ Create Quotation' }}</button>
          <button v-if="canUpload(p, folder.code)" class="btn primary sm" @click="startUpload(folder.code)"><Icon name="upload" :size="14" /> อัปโหลดไฟล์</button>
        </div>

        <div v-if="moduleRows.length" class="mod">
          <p class="small"><b>สร้างในระบบ (Cost Sheet &amp; Quotation)</b></p>
          <router-link v-for="r in moduleRows" :key="r.id" :to="r.to" class="mrow">
            <Icon :name="folder.module === 'cost' ? 'excel' : 'file'" :size="18" />
            <span>{{ r.title }}<span class="small muted"> · {{ person(r.by)?.name }} · {{ thDate(r.at) }}</span></span>
            <span class="chip" :class="DOC_STATUS[r.status].tone">{{ DOC_STATUS[r.status].label }}</span>
          </router-link>
        </div>

        <label v-if="canUpload(p, folder.code)" class="drop" :class="{ on: dragOn === 'drawer' }" @dragover.prevent="dragOn = 'drawer'" @dragleave="dragOn = null" @drop.prevent="dragOn = null; $event.dataTransfer?.files?.length && startUpload(folder.code, $event.dataTransfer.files)">
          <input type="file" multiple class="sr" @change="(e) => { const fs = (e.target as HTMLInputElement).files; if (fs?.length) startUpload(folder!.code, fs) }" />
          <Icon name="upload" :size="20" /><span><b>ลากไฟล์มาวาง</b> หรือคลิกเพื่อเลือก</span><span class="small muted">PDF DOCX XLSX PPTX PNG/JPG ZIP · ไม่เกิน {{ MAX_MB }} MB ต่อไฟล์</span>
        </label>

        <div v-for="d in folderDocs" :key="d.id" class="doc">
          <div class="dt">
            <Icon name="file" :size="20" />
            <div class="dn">
              <strong>{{ d.title }}</strong>
              <span class="small muted">{{ latest(d).stdName }} · {{ fmtSize(latest(d).size) }}<template v-if="d.docNo"> · เลขที่ {{ d.docNo }}</template><template v-if="d.amount"> · ฿{{ d.amount.toLocaleString('en-US') }}</template></span>
              <span class="badges"><span class="chip post">ล่าสุด v{{ latest(d).no }}</span><span v-if="d.approvedVersion" class="chip win"><Icon name="lock" :size="11" /> อนุมัติแล้ว v{{ d.approvedVersion }}</span></span>
              <span class="small muted">{{ person(latest(d).by)?.name }} · {{ thDate(latest(d).at) }}<template v-if="latest(d).note"> · {{ latest(d).note }}</template></span>
            </div>
          </div>
          <div class="acts">
            <button class="btn ghost sm" @click="preview = { d, no: latest(d).no }">ดู</button>
            <button class="btn ghost sm" @click="download(d, latest(d).no)">ดาวน์โหลด</button>
            <button v-if="canUpload(p, d.folder)" class="btn ghost sm" @click="startUpload(d.folder, undefined, d)">เวอร์ชันใหม่</button>
            <button class="btn ghost sm" :aria-expanded="!!expanded[d.id]" @click="expanded[d.id] = !expanded[d.id]">ประวัติ ({{ d.versions.length }})</button>
            <button v-if="canDelete(p, d)" class="btn ghost sm" @click="renaming = { d, title: d.title }">เปลี่ยนชื่อ</button>
            <button v-if="canDelete(p, d)" class="btn ghost sm" @click="moving = { d, to: d.folder }">ย้าย</button>
            <button v-if="canDelete(p, d) && !isLocked(d)" class="btn ghost sm danger" @click="deleting = { d, typed: '' }">ลบ</button>
          </div>
          <ol v-if="expanded[d.id]" class="vers">
            <li v-for="v in d.versions.slice().reverse()" :key="v.no">
              <span class="num"><b>v{{ v.no }}</b></span>
              <span class="small">{{ v.fileName }} · {{ fmtSize(v.size) }} · {{ person(v.by)?.name ?? v.by }} · {{ thDate(v.at) }}<template v-if="v.note"> · {{ v.note }}</template></span>
              <span class="va">
                <span v-if="v.no === d.approvedVersion" class="chip win"><Icon name="lock" :size="11" /> ล็อก</span>
                <button class="btn ghost sm" @click="preview = { d, no: v.no }">ดู</button>
                <button class="btn ghost sm" @click="download(d, v.no)">ดาวน์โหลด</button>
                <button v-if="v.no !== latest(d).no && canUpload(p, d.folder)" class="btn ghost sm" @click="restoreVersion(p, d, v.no); notify(`ย้อนกลับเป็นเนื้อหา v${v.no} แล้ว`)">ย้อนกลับ</button>
              </span>
            </li>
          </ol>
        </div>

        <div v-if="!folderDocs.length && !moduleRows.length" class="fempty">
          <Icon name="folder" :size="28" />
          <p><strong>ยังไม่มีไฟล์ในโฟลเดอร์นี้</strong></p>
          <p v-if="folder.requiredFor" class="small muted">เอกสารนี้ต้องใช้ก่อนเปลี่ยนสถานะเป็น {{ STAGE_TH[folder.requiredFor] ?? folder.requiredFor }}</p>
          <button v-if="canUpload(p, folder.code)" class="btn primary sm" @click="startUpload(folder.code)">อัปโหลดไฟล์</button>
        </div>
      </div>
    </NDrawerContent>
  </NDrawer>

  <!-- Upload -->
  <Dialog :open="up.open" :title="up.target ? `อัปโหลดเวอร์ชันใหม่ · ${up.target.title}` : 'อัปโหลดไฟล์'" wide @close="up.open = false">
    <div class="upf">
      <div class="field">
        <label for="upfolder">โฟลเดอร์ปลายทาง</label>
        <select id="upfolder" v-model="up.folder" class="input" :disabled="!!up.target" @change="revalidate">
          <option v-for="f in foldersFor(p.type).filter((x) => canUpload(p, x.code) && cards.find((c) => c.f.code === x.code)?.state !== 'locked')" :key="f.code" :value="f.code">{{ f.name }}</option>
        </select>
      </div>
      <label class="drop" :class="{ on: dragOn === 'dlg' }" @dragover.prevent="dragOn = 'dlg'" @dragleave="dragOn = null" @drop.prevent="dragOn = null; $event.dataTransfer?.files && addPicked($event.dataTransfer.files)">
        <input type="file" :multiple="!up.target" class="sr" @change="(e) => { const fs = (e.target as HTMLInputElement).files; if (fs) addPicked(fs) }" />
        <Icon name="upload" :size="20" /><span><b>ลากไฟล์มาวาง</b> หรือคลิกเพื่อเลือก{{ up.target ? '' : ' (หลายไฟล์ได้)' }}</span>
        <span class="small muted">PDF DOCX XLSX PPTX PNG/JPG ZIP · ไม่เกิน {{ MAX_MB }} MB · ระบบตั้งชื่อมาตรฐาน {ProjectCode}_{DocType}_v{n}_{YYYYMMDD} และเก็บชื่อเดิมไว้</span>
      </label>
      <ul v-if="up.files.length" class="ufl">
        <li v-for="(x, i) in up.files" :key="i" :class="{ bad: x.err }">
          <span class="un"><Icon name="file" :size="16" />{{ x.file.name }} <span class="small muted">{{ fmtSize(x.file.size) }}</span></span>
          <span v-if="x.err" class="msg" role="alert">{{ x.err }}</span>
          <span v-else-if="x.state !== 'ready'" class="bar"><i :style="{ width: x.pct + '%' }" /></span>
          <span class="us small">
            <template v-if="x.state === 'done'">✓ เสร็จ</template>
            <template v-else-if="x.state === 'uploading'">{{ x.pct }}%</template>
            <button v-else-if="x.state === 'error'" class="btn sm" @click="retry(x)">ลองใหม่</button>
            <button v-else class="btn ghost sm" :aria-label="`เอา ${x.file.name} ออก`" @click="up.files.splice(i, 1)">เอาออก</button>
          </span>
        </li>
      </ul>
      <div class="mg">
        <div v-if="up.files.length <= 1 && !up.target" class="field"><label for="umt">ชื่อเอกสาร (ไม่บังคับ)</label><input id="umt" v-model="up.meta.title" class="input" placeholder="ใช้ชื่อไฟล์ถ้าเว้นว่าง" /></div>
        <div class="field" :class="{ bad: up.tried && docNoMissing }">
          <label for="umn">เลขที่เอกสาร{{ upFolder?.needsDocNo ? '' : ' (ไม่บังคับ)' }}</label>
          <input id="umn" v-model="up.meta.docNo" class="input" />
          <span v-if="up.tried && docNoMissing" class="msg" role="alert">ระบุเลขที่เอกสาร (บังคับสำหรับ {{ upFolder?.name }})</span>
        </div>
        <div class="field"><label for="umd">วันที่เอกสาร (ไม่บังคับ)</label><input id="umd" v-model="up.meta.docDate" class="input" type="date" /></div>
        <div class="field"><label for="uma">มูลค่า (บาท, ไม่บังคับ)</label><input id="uma" v-model.number="up.meta.amount" class="input num" type="number" min="0" /></div>
        <div class="field wide"><label for="umr">หมายเหตุ (ไม่บังคับ)</label><input id="umr" v-model="up.meta.note" class="input" /></div>
      </div>
    </div>
    <template #foot>
      <button class="btn" @click="up.open = false">ยกเลิก</button>
      <button class="btn primary" :disabled="!uploadable.length" @click="startAll">อัปโหลด {{ uploadable.length || '' }} ไฟล์</button>
    </template>
  </Dialog>

  <!-- Preview -->
  <Dialog :open="!!preview" :title="pv ? `${preview!.d.title} · v${pv.no}` : ''" wide @close="preview = null">
    <div v-if="pv" class="pvw">
      <iframe v-if="pv.url && isPdf" :src="pv.url" title="ตัวอย่าง PDF" />
      <img v-else-if="pv.url && isImg" :src="pv.url" :alt="preview!.d.title" />
      <div v-else class="pvph">
        <Icon name="file" :size="36" />
        <p><strong>{{ pv.stdName }}</strong></p>
        <p class="small muted">ชื่อเดิม {{ pv.fileName }} · {{ fmtSize(pv.size) }} · อัปโหลด {{ thDate(pv.at) }} โดย {{ person(pv.by)?.name ?? pv.by }}</p>
        <p class="small muted">{{ pv.url ? 'ไฟล์ Office แสดงตัวอย่างหลังระบบแปลงเป็น PDF ฝั่ง server' : 'ไฟล์ตัวอย่างในต้นแบบ — ระบบจริงเปิดไฟล์จาก Object storage' }}</p>
      </div>
    </div>
    <template #foot><button class="btn" @click="preview = null">ปิด</button><button v-if="pv" class="btn primary" @click="download(preview!.d, pv.no)">ดาวน์โหลด</button></template>
  </Dialog>

  <Dialog :open="!!renaming" title="เปลี่ยนชื่อเอกสาร" @close="renaming = null">
    <div v-if="renaming" class="field"><label for="rn">ชื่อใหม่</label><input id="rn" v-model="renaming.title" class="input" @keydown.enter="renaming.title.trim() && (renameDoc(p, renaming.d, renaming.title), renaming = null)" /></div>
    <template #foot><button class="btn" @click="renaming = null">ยกเลิก</button><button class="btn primary" :disabled="!renaming?.title.trim()" @click="renameDoc(p, renaming!.d, renaming!.title); renaming = null; notify('เปลี่ยนชื่อแล้ว')">บันทึก</button></template>
  </Dialog>
  <Dialog :open="!!moving" title="ย้ายไปโฟลเดอร์" @close="moving = null">
    <div v-if="moving" class="field"><label for="mv">โฟลเดอร์</label><select id="mv" v-model="moving.to" class="input"><option v-for="f in foldersFor(p.type).filter((x) => !x.module && canUpload(p, x.code))" :key="f.code" :value="f.code">{{ f.name }}</option></select></div>
    <template #foot><button class="btn" @click="moving = null">ยกเลิก</button><button class="btn primary" :disabled="moving?.to === moving?.d.folder" @click="moveDoc(p, moving!.d, moving!.to); notify(`ย้ายไป ${folderOf(moving!.to)?.name} แล้ว`); moving = null">ย้าย</button></template>
  </Dialog>
  <Dialog :open="!!deleting" :title="`ลบ “${deleting?.d.title}”`" @close="deleting = null">
    <p>ไฟล์จะไปอยู่ในถังขยะของโครงการ และกู้คืนได้ภายใน 30 วัน</p>
    <div v-if="deleting" class="field"><label for="dc">พิมพ์ชื่อเอกสาร “{{ deleting.d.title }}” เพื่อยืนยัน</label><input id="dc" v-model="deleting.typed" class="input" autocomplete="off" /></div>
    <template #foot><button class="btn" @click="deleting = null">ยกเลิก</button><button class="btn danger" :disabled="deleting?.typed.trim() !== deleting?.d.title" @click="deleteDoc(p, deleting!.d); notify('ย้ายไปถังขยะแล้ว'); deleting = null">ลบ {{ deleting?.d.title }}</button></template>
  </Dialog>
  <Dialog :open="trashOpen" title="ถังขยะของโครงการ" @close="trashOpen = false">
    <p class="small muted">ไฟล์ที่ลบจะถูกลบถาวรเมื่อครบ 30 วัน</p>
    <ul class="trash">
      <li v-for="d in trash" :key="d.id"><span><strong>{{ d.title }}</strong><span class="small muted"> · {{ folderOf(d.folder)?.name }} · ลบโดย {{ person(d.deletedBy)?.name }} · เหลือ {{ daysLeft(d) }} วัน</span></span><button class="btn sm" @click="restoreDoc(p, d); notify(`กู้คืน ${d.title} แล้ว`)">กู้คืน</button></li>
    </ul>
    <p v-if="!trash.length" class="small muted">ถังขยะว่าง</p>
    <template #foot><button class="btn" @click="trashOpen = false">ปิด</button></template>
  </Dialog>
</template>

<style scoped>
.docs { display: grid; gap: 16px; }
.dh { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.dh h2 { margin: 0; flex: 1 1 auto; font-size: 18px; }
.search { display: flex; align-items: center; gap: 8px; padding: 0 10px; border: 1px solid var(--line-strong); border-radius: var(--r-sm); color: var(--muted); min-width: 200px; flex: 1 1 220px; max-width: 320px; }
.search input { border: 0; outline: 0; background: none; font: inherit; color: var(--ink); min-height: 34px; flex: 1; min-width: 0; }
.search:focus-within { border-color: var(--focus); box-shadow: 0 0 0 3px var(--primary-soft); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.dh .seg button { min-height: 30px; padding: 0 10px; font-size: 13px; }
.phase h3 { font-size: 14px; margin: 0 0 8px; color: var(--ink-2); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.folder { position: relative; display: grid; justify-items: center; gap: 4px; padding: 16px 10px 12px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); cursor: pointer; font: inherit; color: var(--ink); text-align: center; transition: border-color var(--t-fast), background var(--t-fast); }
.folder:hover { border-color: var(--line-strong); background: var(--sunken); }
.folder.drag { border: 2px dashed var(--primary); background: var(--primary-soft); }
.folder.locked { opacity: 0.6; }
.folder strong { font-size: 14px; font-weight: 500; }
.ico { width: 40px; height: 32px; margin-bottom: 4px; }
.ico path { fill: #f0c24a; }
.ico .lip { fill: #f6d26c; }
.locked .ico path { fill: var(--line-strong); }
.meta { font-size: 12px; color: var(--muted); display: inline-flex; gap: 4px; align-items: center; }
.folder .chip { height: 20px; font-size: 12px; }
.req { position: absolute; top: 6px; right: 8px; color: var(--lose); font-weight: 700; font-size: 16px; }
.lr { cursor: pointer; }
.lr:hover { background: var(--sunken); }
.sub { display: block; }
.nowrap { white-space: nowrap; }
.empty { padding: 16px; text-align: center; }
.fd { display: grid; gap: 14px; }
.fdh { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.fdh p { margin: 0; }
.sp { flex: 1; }
.mod { display: grid; gap: 6px; border: 1px solid var(--line); border-radius: var(--r-md); padding: 10px 12px; }
.mod p { margin: 0; }
.mrow { display: flex; align-items: center; gap: 10px; padding: 6px 4px; color: var(--ink); border-radius: var(--r-sm); }
.mrow:hover { background: var(--sunken); text-decoration: none; }
.mrow > span:nth-child(2) { flex: 1; }
.drop { display: grid; justify-items: center; gap: 4px; padding: 18px; border: 2px dashed var(--line-strong); border-radius: var(--r-md); cursor: pointer; text-align: center; color: var(--ink-2); }
.drop.on, .drop:hover { border-color: var(--primary); background: var(--primary-soft); }
.drop:focus-within { outline: 2px solid var(--focus); outline-offset: 2px; }
.doc { border: 1px solid var(--line); border-radius: var(--r-md); padding: 12px; display: grid; gap: 8px; }
.dt { display: flex; gap: 10px; }
.dn { display: grid; gap: 2px; min-width: 0; }
.dn > span { overflow-wrap: anywhere; }
.badges { display: flex; gap: 6px; flex-wrap: wrap; margin: 2px 0; }
.badges .chip { height: 20px; font-size: 12px; }
.acts { display: flex; flex-wrap: wrap; gap: 2px; }
.vers { list-style: none; margin: 0; padding: 8px 0 0; border-top: 1px solid var(--line); display: grid; gap: 6px; }
.vers li { display: grid; grid-template-columns: 36px 1fr; gap: 6px; align-items: center; }
.va { grid-column: 2; display: flex; gap: 2px; align-items: center; flex-wrap: wrap; }
.fempty { display: grid; justify-items: center; gap: 6px; padding: 28px 16px; text-align: center; color: var(--muted); }
.fempty p { margin: 0; }
.upf { display: grid; gap: 14px; }
.ufl { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.ufl li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 12px; align-items: center; padding: 8px 10px; border: 1px solid var(--line); border-radius: var(--r-sm); }
.ufl li.bad { border-color: var(--lose); background: var(--lose-soft); }
.un { display: inline-flex; gap: 6px; align-items: center; overflow-wrap: anywhere; }
.us { grid-row: 1; grid-column: 2; }
.bar { grid-column: 1 / -1; height: 6px; background: var(--line); border-radius: 3px; overflow: hidden; }
.bar i { display: block; height: 100%; background: var(--primary); transition: width 60ms linear; }
.msg { grid-column: 1 / -1; font-size: 12px; color: var(--lose); }
.field .msg { grid-column: auto; }
.mg { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
.mg .wide { grid-column: 1 / -1; }
.bad .input { border-color: var(--lose); }
.pvw iframe { width: 100%; height: 70vh; border: 1px solid var(--line); border-radius: var(--r-sm); }
.pvw img { max-width: 100%; max-height: 70vh; display: block; margin: 0 auto; }
.pvph { display: grid; justify-items: center; gap: 6px; padding: 40px 16px; text-align: center; background: var(--sunken); border-radius: var(--r-md); }
.pvph p { margin: 0; }
.trash { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.trash li { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--line); }
@media (max-width: 640px) { .mg { grid-template-columns: 1fr; } .search { max-width: none; } }
</style>
