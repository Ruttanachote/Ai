<script setup lang="ts">
// e-Signature pad: draw with mouse, finger or pen (pointer events, smoothed strokes), undo,
// clear, or type your name and pick a handwriting style (keyboard-friendly alternative).
// Emits a trimmed PNG data URL on save.
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps<{ name: string; initial?: string }>()
const emit = defineEmits<{ save: [dataUrl: string, method: 'draw' | 'type']; cancel: [] }>()

const mode = ref<'draw' | 'type'>('draw')
const canvas = ref<HTMLCanvasElement | null>(null)
type Pt = { x: number; y: number; w: number }
const strokes = ref<Pt[][]>([])
let drawing = false
const ink = ref('#1f2a5a')
const INKS = [{ c: '#1f2a5a', l: 'น้ำเงินเข้ม' }, { c: '#111111', l: 'ดำ' }, { c: '#1d4ed8', l: 'น้ำเงิน' }]
const W = 560, H = 180

function ctx() {
  const c = canvas.value!
  const x = c.getContext('2d')!
  return x
}
function setup() {
  const c = canvas.value
  if (!c) return
  const dpr = window.devicePixelRatio || 1
  c.width = W * dpr; c.height = H * dpr
  c.style.width = '100%'
  ctx().setTransform(dpr, 0, 0, dpr, 0, 0)
  redraw()
}
function pos(e: PointerEvent): Pt {
  const r = canvas.value!.getBoundingClientRect()
  const pressure = e.pressure && e.pointerType === 'pen' ? e.pressure : 0.5
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H, w: 1.4 + pressure * 2.6 }
}
function down(e: PointerEvent) {
  canvas.value!.setPointerCapture(e.pointerId)
  drawing = true
  strokes.value.push([pos(e)])
}
function move(e: PointerEvent) {
  if (!drawing) return
  const s = strokes.value[strokes.value.length - 1]
  s.push(pos(e))
  drawStroke(s, s.length - 2)
}
function up() { drawing = false }
/** Quadratic smoothing between midpoints so lines look like ink, not polylines. */
function drawStroke(s: Pt[], from = 0) {
  const x = ctx()
  x.strokeStyle = ink.value; x.lineCap = 'round'; x.lineJoin = 'round'
  if (s.length === 1) { x.beginPath(); x.arc(s[0].x, s[0].y, s[0].w / 2, 0, Math.PI * 2); x.fillStyle = ink.value; x.fill(); return }
  for (let i = Math.max(1, from); i < s.length; i++) {
    const a = s[i - 1], b = s[i], m1 = i > 1 ? { x: (s[i - 2].x + a.x) / 2, y: (s[i - 2].y + a.y) / 2 } : a, m2 = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    x.lineWidth = (a.w + b.w) / 2
    x.beginPath(); x.moveTo(m1.x, m1.y); x.quadraticCurveTo(a.x, a.y, m2.x, m2.y); x.stroke()
  }
}
function redraw() {
  if (!canvas.value) return
  const x = ctx()
  x.clearRect(0, 0, W, H)
  strokes.value.forEach((s) => drawStroke(s))
}
const undo = () => { strokes.value.pop(); redraw() }
const clear = () => { strokes.value = []; redraw() }
watch(ink, redraw)
onMounted(setup)
watch(mode, (m) => { if (m === 'draw') nextTick(setup) })

/* ---------- type mode ---------- */
const typed = ref(props.name)
const FONTS = [{ f: "'Segoe Script','Brush Script MT',cursive", l: 'ลายมือ 1' }, { f: "'Snell Roundhand','Apple Chancery',cursive", l: 'ลายมือ 2' }, { f: "'Lucida Handwriting','Comic Sans MS',cursive", l: 'ลายมือ 3' }]
const font = ref(FONTS[0].f)

const empty = computed(() => (mode.value === 'draw' ? !strokes.value.length : !typed.value.trim()))
/** Render to PNG, cropped to the ink with a small margin. */
function exportPng(): string {
  const out = document.createElement('canvas')
  const scale = 2
  out.width = W * scale; out.height = H * scale
  const x = out.getContext('2d')!
  x.scale(scale, scale)
  if (mode.value === 'draw') {
    x.strokeStyle = ink.value; x.fillStyle = ink.value; x.lineCap = 'round'; x.lineJoin = 'round'
    for (const s of strokes.value) {
      if (s.length === 1) { x.beginPath(); x.arc(s[0].x, s[0].y, s[0].w / 2, 0, Math.PI * 2); x.fill(); continue }
      for (let i = 1; i < s.length; i++) {
        const a = s[i - 1], b = s[i], m1 = i > 1 ? { x: (s[i - 2].x + a.x) / 2, y: (s[i - 2].y + a.y) / 2 } : a, m2 = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        x.lineWidth = (a.w + b.w) / 2; x.beginPath(); x.moveTo(m1.x, m1.y); x.quadraticCurveTo(a.x, a.y, m2.x, m2.y); x.stroke()
      }
    }
  } else {
    x.fillStyle = ink.value; x.font = `48px ${font.value}`; x.textBaseline = 'middle'
    x.fillText(typed.value.trim(), 20, H / 2)
  }
  // Crop to the drawn area.
  const d = x.getImageData(0, 0, out.width, out.height).data
  let minX = out.width, minY = out.height, maxX = 0, maxY = 0
  for (let yy = 0; yy < out.height; yy += 2) for (let xx = 0; xx < out.width; xx += 2) if (d[(yy * out.width + xx) * 4 + 3] > 10) { minX = Math.min(minX, xx); maxX = Math.max(maxX, xx); minY = Math.min(minY, yy); maxY = Math.max(maxY, yy) }
  if (maxX <= minX) return out.toDataURL('image/png')
  const pad = 16
  const cw = Math.min(out.width, maxX - minX + pad * 2), ch = Math.min(out.height, maxY - minY + pad * 2)
  const crop = document.createElement('canvas')
  crop.width = cw; crop.height = ch
  crop.getContext('2d')!.drawImage(out, Math.max(0, minX - pad), Math.max(0, minY - pad), cw, ch, 0, 0, cw, ch)
  return crop.toDataURL('image/png')
}
function save() { if (!empty.value) emit('save', exportPng(), mode.value) }
</script>

<template>
  <div class="sp">
    <div class="seg" role="radiogroup" aria-label="วิธีสร้างลายเซ็น">
      <button role="radio" :aria-checked="mode === 'draw'" @click="mode = 'draw'">วาดลายเซ็น</button>
      <button role="radio" :aria-checked="mode === 'type'" @click="mode = 'type'">พิมพ์ชื่อ</button>
    </div>
    <template v-if="mode === 'draw'">
      <div class="pad">
        <canvas ref="canvas" :width="W" :height="H" aria-label="พื้นที่วาดลายเซ็น — ใช้เมาส์ นิ้ว หรือปากกาลากเพื่อเซ็น" role="img"
          @pointerdown.prevent="down" @pointermove.prevent="move" @pointerup="up" @pointercancel="up" @pointerleave="up" />
        <span class="line" aria-hidden="true" />
        <span v-if="!strokes.length" class="ph" aria-hidden="true">ลากเพื่อเซ็นชื่อที่นี่</span>
      </div>
      <div class="tools">
        <span class="small muted" style="white-space: nowrap">สีหมึก</span>
        <button v-for="i in INKS" :key="i.c" class="ink" :class="{ on: ink === i.c }" :style="{ background: i.c }" :aria-label="`หมึก${i.l}`" :aria-pressed="ink === i.c" @click="ink = i.c" />
        <span class="sp2" />
        <button class="btn ghost sm" :disabled="!strokes.length" @click="undo">ย้อนกลับ</button>
        <button class="btn ghost sm" :disabled="!strokes.length" @click="clear">ล้าง</button>
      </div>
    </template>
    <template v-else>
      <div class="field"><label for="sig-typed">ชื่อที่ใช้เป็นลายเซ็น</label><input id="sig-typed" v-model="typed" class="input" /></div>
      <div class="fonts" role="radiogroup" aria-label="รูปแบบลายมือ">
        <button v-for="f in FONTS" :key="f.l" role="radio" :aria-checked="font === f.f" class="font" :class="{ on: font === f.f }" :style="{ fontFamily: f.f, color: ink }" @click="font = f.f">{{ typed || name }}</button>
      </div>
    </template>
    <p class="small muted">ลายเซ็นใช้แนบกับการส่งขออนุมัติและการอนุมัติออนไลน์เท่านั้น ระบบบันทึกเวลาที่ลงนามทุกครั้ง</p>
    <div class="acts">
      <button class="btn" @click="emit('cancel')">ยกเลิก</button>
      <button class="btn primary" :disabled="empty" @click="save">บันทึกลายเซ็น</button>
    </div>
  </div>
</template>

<style scoped>
.sp { display: grid; gap: 12px; }
.pad { position: relative; border: 1px dashed var(--line-strong); border-radius: var(--r-md); background: #fff; touch-action: none; }
canvas { display: block; width: 100%; aspect-ratio: 560 / 180; cursor: crosshair; touch-action: none; border-radius: var(--r-md); }
.line { position: absolute; left: 6%; right: 6%; bottom: 24%; border-bottom: 1px solid #c8ccd4; pointer-events: none; }
.ph { position: absolute; inset: 0; display: grid; place-items: center; color: #9aa1ae; pointer-events: none; font-size: 14px; }
.tools { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.sp { min-width: 0; }
.sp2 { flex: 1; }
.ink { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px var(--line-strong); cursor: pointer; padding: 0; }
.ink.on { box-shadow: 0 0 0 2px var(--focus); }
.fonts { display: grid; gap: 8px; }
.font { text-align: left; font-size: 30px; padding: 10px 16px; border: 1px solid var(--line); border-radius: var(--r-md); background: #fff; cursor: pointer; }
.font.on { border-color: var(--primary); box-shadow: 0 0 0 2px var(--primary-soft); }
.acts { display: flex; justify-content: flex-end; gap: 8px; }
@media (pointer: coarse) { .ink { width: 32px; height: 32px; } }
</style>
