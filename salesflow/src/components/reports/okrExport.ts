// Turns an OkrReport into the two files the monthly OKR meeting uses: an Excel workbook
// (numbers + formulas, one sheet per section) and an A4-landscape PDF drawn on canvas.
import type { KeyResult, OkrReport, OkrUnit } from '../../domain/okr'
import { TARGET_LABEL } from '../../domain/executive'
import { PROJECT_TYPES, stageOf } from '../../data/model'
import { account, person } from '../../data/mock'
import { bookedValue, isWon, pipelineValue, probability, weightedValue } from '../../domain/metrics'
import { wonDay } from '../../domain/okr'
import type { Project } from '../../data/model'
import { xlsxBlob, type Cell, type Sheet } from '../../lib/xlsx'
import { canvasJpeg, pdfBlob } from '../../lib/pdf'

export interface ReportMeta { scope: string; by: string; today: string; projects: Project[] }
const M = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const thDate = (iso: string) => (iso ? `${Number(iso.slice(8, 10))} ${M[Number(iso.slice(5, 7)) - 1]} ${(Number(iso.slice(0, 4)) + 543) % 100}` : '—')
const custOf = (p: Project) => account(p.customerAccountId)?.name ?? p.customer ?? ''
const KR_STATUS = { ok: 'บรรลุ', warn: 'ใกล้เป้า', bad: 'ต่ำกว่าเป้า' }
const krText = (k: KeyResult, v: number) => (k.unit === 'baht' ? baht(v) : k.unit === 'pct' ? `${Math.round(v * 100)}%` : k.unit === 'x' ? `${v >= 9.99 ? '∞' : v.toFixed(2)} เท่า` : `${v}`)
export const baht = (n: number) => (Math.abs(n) >= 1e6 ? `฿${(n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1)}M` : `฿${Math.round(n).toLocaleString('en-US')}`)

/* ================= Excel ================= */
export function okrXlsx(r: OkrReport, meta: ReportMeta): Blob {
  const units = r.units
  const H = (v: string): Cell => ({ v, s: 'head' })
  const st = (s: string): Cell => ({ v: TARGET_LABEL[s as keyof typeof TARGET_LABEL], s: s === 'ontrack' ? 'good' : s === 'atrisk' ? 'warn' : 'bad' })
  // Sheet 1 — summary
  const rows: Cell[][] = [
    [{ v: `รายงาน OKR ประจำเดือน ${r.label}`, s: 'title' }],
    [{ v: `${meta.scope} · ข้อมูล ณ ${thDate(r.asOf)} · จัดทำโดย ${meta.by} · One Platform`, s: 'sub' }],
    [],
    [{ v: 'Objective', s: 'bold' }, { v: r.objective, s: 'bold' }],
    [],
    [H('Key Result'), H('เป้า'), H('ผลจริง'), H('คะแนน'), H('สถานะ')],
    ...r.total.krs.map((k): Cell[] => [k.label, krCell(k, k.goal), krCell(k, k.actual), { v: k.score, s: 'pct' }, { v: KR_STATUS[k.status], s: k.status === 'ok' ? 'good' : k.status === 'warn' ? 'warn' : 'bad' }]),
    [],
    [H('หน่วย'), H('ชื่อ'), H('เป้าทั้งปี'), H('Close Win สะสม'), H('% ของเป้า'), H('Close Win เดือนนี้'), H('ยอดที่ยังขาด'), H('Pipeline (มูลค่าเต็ม)'), H('Pipeline ถ่วงน้ำหนัก'), H('Coverage (เท่า)'), H('โครงการใหม่ในเดือน'), H('ชนะ'), H('แพ้'), H('Win rate'), H('สถานะ')],
  ]
  const first = rows.length + 1
  for (const u of units) {
    const n = rows.length + 1
    rows.push([u.name, u.sub ?? '', u.target, u.wonYtd, { f: `IF(C${n}=0,0,D${n}/C${n})`, v: u.pct, s: 'pct' }, u.wonMonth, { f: `MAX(0,C${n}-D${n})`, v: u.gap },
      u.open, u.weighted, { f: `IF(G${n}=0,0,I${n}/G${n})`, v: Math.min(u.coverage, 9.99), s: 'x' }, { v: u.newOpp, s: 'int' }, { v: u.won, s: 'int' }, { v: u.lost, s: 'int' },
      { f: `IF(L${n}+M${n}=0,0,L${n}/(L${n}+M${n}))`, v: u.winRate ?? 0, s: 'pct' }, st(u.status)])
  }
  const last = rows.length
  const t = r.total
  const sumCol = (c: string, s: 'moneyB' | 'intB' = 'moneyB'): Cell => ({ f: `SUM(${c}${first}:${c}${last})`, s })
  const tn = rows.length + 1
  rows.push([{ v: 'รวม', s: 'bold' }, { v: '', s: 'bold' }, sumCol('C'), sumCol('D'), { f: `IF(C${tn}=0,0,D${tn}/C${tn})`, v: t.pct, s: 'pctB' }, sumCol('F'), sumCol('G'), sumCol('H'), sumCol('I'),
    { f: `IF(G${tn}=0,0,I${tn}/G${tn})`, v: Math.min(t.coverage, 9.99), s: 'x' }, sumCol('K', 'intB'), sumCol('L', 'intB'), sumCol('M', 'intB'), { f: `IF(L${tn}+M${tn}=0,0,L${tn}/(L${tn}+M${tn}))`, v: t.winRate ?? 0, s: 'pctB' }, st(t.status)])
  rows.push([], [{ v: `Coverage = Pipeline ถ่วงน้ำหนัก ÷ ยอดที่ยังขาด · Win rate = ชนะ ÷ (ชนะ + แพ้) ปีนี้ · โครงการที่แบ่งยอดระหว่างทีมนับตามสัดส่วน`, s: 'sub' }])
  const summary: Sheet = { name: 'สรุป OKR', rows, cols: [40, 26, 16, 16, 11, 16, 16, 18, 18, 12, 12, 8, 8, 10, 12], merges: ['A1:H1', 'A2:H2', 'B4:H4'] }

  // Sheet 2 — monthly Close Win
  const mRows: Cell[][] = [[{ v: `Close Win รายเดือน ปี ${Number(r.month.slice(0, 4)) + 543}`, s: 'title' }], [], [H('หน่วย'), ...M.map(H), H('รวม'), H('เป้าทั้งปี'), H('% ของเป้า')]]
  for (const u of [...units, t]) {
    const n = mRows.length + 1
    const tot = u === t
    mRows.push([{ v: tot ? 'รวม' : u.name, s: tot ? 'bold' : undefined }, ...u.monthly.map((v): Cell => ({ v, s: tot ? 'moneyB' : 'money' })), { f: `SUM(B${n}:M${n})`, v: u.wonYtd, s: 'moneyB' }, { v: u.target, s: tot ? 'moneyB' : 'money' }, { f: `IF(O${n}=0,0,N${n}/O${n})`, v: u.pct, s: tot ? 'pctB' : 'pct' }])
  }
  const monthly: Sheet = { name: 'รายเดือน', rows: mRows, cols: [16, ...M.map(() => 13), 15, 15, 11], freeze: 3 }

  // Sheet 3 — what moved this month
  const KIND = { new: 'โครงการใหม่', won: 'Close Win', lost: 'Close Lose', stage: 'เปลี่ยนสถานะ' }
  const mv: Cell[][] = [[{ v: `ความเคลื่อนไหวเดือน ${r.label}`, s: 'title' }], [], [H('วันที่'), H('ประเภท'), H('รหัส'), H('โครงการ'), H('ลูกค้า'), H('ทีม'), H('SM'), H('สถานะ'), H('มูลค่า'), H('หมายเหตุ')],
    ...r.movements.map((m): Cell[] => [thDate(m.day), KIND[m.kind], m.p.code, m.p.name, custOf(m.p), m.p.team, person(m.p.sm)?.name ?? '', `${stageOf(m.to).code} ${stageOf(m.to).label}`, m.value, m.note])]
  if (!r.movements.length) mv.push(['ไม่มีความเคลื่อนไหวในเดือนนี้'])
  mv.push([], [{ v: 'เหตุผลที่ไม่ได้งาน (ปีนี้)', s: 'bold' }], [H('เหตุผล'), H('จำนวน'), H('มูลค่า')], ...r.losses.map((l): Cell[] => [l.reason, { v: l.count, s: 'int' }, l.value]))
  if (!r.losses.length) mv.push(['ไม่มี'])
  mv.push([], [{ v: 'โครงการค้างนานเกินเกณฑ์', s: 'bold' }], [H('รหัส'), H('โครงการ'), H('สถานะ'), H('ค้าง (วัน)'), H('มูลค่า')], ...r.stalled.map((x): Cell[] => [x.p.code, x.p.name, `${stageOf(x.p.stage).code} ${stageOf(x.p.stage).label}`, { v: x.days, s: 'int' }, pipelineValue(x.p)]))
  if (!r.stalled.length) mv.push(['ไม่มี'])
  const moves: Sheet = { name: 'ความเคลื่อนไหว', rows: mv, cols: [12, 14, 14, 36, 28, 10, 18, 20, 16, 40], freeze: 3 }

  // Sheet 4 — expected to close in the next 3 months (the plan for next month's meeting)
  const nc: Cell[][] = [[{ v: 'โครงการที่คาดว่าจะปิดใน 3 เดือนข้างหน้า', s: 'title' }], [], [H('คาดปิด'), H('รหัส'), H('โครงการ'), H('ลูกค้า'), H('ทีม'), H('SM'), H('สถานะ'), H('มูลค่า'), H('โอกาส'), H('ถ่วงน้ำหนัก'), H('Next step')]]
  const ncFirst = nc.length + 1
  for (const x of r.nextClose) nc.push([thDate(x.day), x.p.code, x.p.name, custOf(x.p), x.p.team, person(x.p.sm)?.name ?? '', `${stageOf(x.p.stage).code} ${stageOf(x.p.stage).label}`, x.value, { v: probability(x.p), s: 'pct' }, { f: `H${nc.length + 1}*I${nc.length + 1}`, v: x.weighted }, x.p.nextStep])
  if (r.nextClose.length) nc.push([{ v: 'รวม', s: 'bold' }, '', '', '', '', '', '', { f: `SUM(H${ncFirst}:H${nc.length})`, s: 'moneyB' }, '', { f: `SUM(J${ncFirst}:J${nc.length})`, s: 'moneyB' }])
  else nc.push(['ไม่มีโครงการที่กำหนดวันคาดปิดในช่วงนี้'])
  const next: Sheet = { name: 'คาดปิด 3 เดือน', rows: nc, cols: [12, 14, 36, 28, 10, 18, 20, 16, 10, 16, 40], freeze: 3 }

  // Sheet 5 — every project behind the numbers
  const pr: Cell[][] = [[{ v: 'ข้อมูลโครงการทั้งหมดในรายงาน', s: 'title' }], [], [H('รหัส'), H('โครงการ'), H('ลูกค้า'), H('ประเภท'), H('ทีม'), H('SM'), H('ตัวย่อ'), H('สถานะ'), H('มูลค่า'), H('โอกาส'), H('ถ่วงน้ำหนัก'), H('คาดปิด'), H('วันที่ชนะ')]]
  for (const p of meta.projects) pr.push([p.code, p.name, custOf(p), PROJECT_TYPES[p.type]?.label ?? p.type, p.team, person(p.sm)?.name ?? '', stageOf(p.stage).code, stageOf(p.stage).label,
    isWon(p) ? bookedValue(p) : pipelineValue(p), { v: isWon(p) ? 1 : probability(p), s: 'pct' }, weightedValue(p), p.expectedClose ? thDate(p.expectedClose) : '', isWon(p) ? thDate(wonDay(p, meta.today)) : ''])
  const all: Sheet = { name: 'โครงการ', rows: pr, cols: [14, 36, 28, 22, 10, 18, 8, 14, 16, 10, 16, 12, 12], freeze: 3 }
  return xlsxBlob([summary, monthly, moves, next, all], { title: `OKR ${r.label}`, author: meta.by })
}
function krCell(k: KeyResult, v: number): Cell {
  return k.unit === 'baht' ? { v, s: 'money' } : k.unit === 'pct' ? { v, s: 'pct' } : k.unit === 'x' ? { v: Math.min(v, 9.99), s: 'x' } : { v, s: 'int' }
}

/* ================= PDF (canvas pages) ================= */
const W = 1754, HT = 1240, PAD = 72
const C = { ink: '#1f2430', ink2: '#4b5563', muted: '#6b7280', line: '#e5e7eb', brand: '#E2332B', soft: '#f4f4f5', win: '#1f8a5b', winS: '#e6f4ea', warn: '#b7791f', warnS: '#fef3c7', lose: '#d23b33', loseS: '#fde2e1', pre: '#3a63c9', preS: '#e8eefc', dark: '#1f2430' }
const tone = (s: string) => (s === 'ok' || s === 'ontrack' ? [C.win, C.winS] : s === 'warn' || s === 'atrisk' ? [C.warn, C.warnS] : [C.lose, C.loseS])
const F = (w: number, px: number) => `${w} ${px}px Prompt, Sarabun, sans-serif`

class Pager {
  pages: HTMLCanvasElement[] = []; g!: CanvasRenderingContext2D; y = 0
  head: string; sub: string
  constructor(head: string, sub: string) { this.head = head; this.sub = sub; this.add() }
  add() {
    const c = document.createElement('canvas'); c.width = W; c.height = HT
    const g = c.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, W, HT); g.textBaseline = 'alphabetic'
    this.pages.push(c); this.g = g
    g.fillStyle = C.brand; g.fillRect(0, 0, W, 10)
    g.fillStyle = C.ink; g.font = F(700, 18); g.fillText('STREAM  ›  One Platform', PAD, 52)
    g.font = F(600, 30); g.fillText(this.head, PAD, 98)
    g.fillStyle = C.muted; g.font = F(400, 18); g.fillText(this.sub, PAD, 128)
    g.fillStyle = C.line; g.fillRect(PAD, 146, W - PAD * 2, 2)
    this.y = 186
  }
  need(h: number) { if (this.y + h > HT - 80) this.add() }
  finish() {
    this.pages.forEach((c, i) => { const g = c.getContext('2d')!; g.fillStyle = C.muted; g.font = F(400, 15); g.textAlign = 'right'; g.fillText(`หน้า ${i + 1} / ${this.pages.length}`, W - PAD, HT - 36); g.textAlign = 'left'; g.fillText('รายงาน OKR · สร้างจากข้อมูลใน One Platform', PAD, HT - 36) })
    return this.pages
  }
}
function fit(g: CanvasRenderingContext2D, s: string, w: number) {
  if (g.measureText(s).width <= w) return s
  let t = s; while (t.length > 1 && g.measureText(t + '…').width > w) t = t.slice(0, -1)
  return t + '…'
}
function rrect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) {
  g.beginPath(); g.roundRect(x, y, w, h, r); g.fillStyle = fill; g.fill(); if (stroke) { g.strokeStyle = stroke; g.lineWidth = 2; g.stroke() }
}
function section(p: Pager, title: string, note?: string) {
  p.need(70); const g = p.g
  g.fillStyle = C.ink; g.font = F(600, 24); g.fillText(title, PAD, p.y + 24)
  const tw = g.measureText(title).width
  if (note) { g.fillStyle = C.muted; g.font = F(400, 17); g.fillText(note, PAD + tw + 16, p.y + 24) }
  p.y += 48
}
interface Col { h: string; w: number; align?: 'right' | 'left' | 'center'; v: (i: number) => string; tone?: (i: number) => string | undefined; bold?: (i: number) => boolean }
function table(p: Pager, cols: Col[], n: number, empty: string) {
  const total = cols.reduce((s, c) => s + c.w, 0); const scale = (W - PAD * 2) / total; const RH = 44
  const header = () => {
    const g = p.g; rrect(g, PAD, p.y, W - PAD * 2, RH, 8, '#3f3f46'); g.font = F(600, 17); g.fillStyle = '#fff'
    let x = PAD; for (const c of cols) { const w = c.w * scale; g.textAlign = c.align ?? 'left'; g.fillText(fit(g, c.h, w - 20), c.align === 'right' ? x + w - 12 : c.align === 'center' ? x + w / 2 : x + 12, p.y + 29); x += w }
    g.textAlign = 'left'; p.y += RH
  }
  p.need(RH * 2); header()
  if (!n) { const g = p.g; g.fillStyle = C.muted; g.font = F(400, 18); g.fillText(empty, PAD + 12, p.y + 32); p.y += RH + 10; return }
  for (let i = 0; i < n; i++) {
    if (p.y + RH > HT - 80) { p.add(); header() }
    const g = p.g; if (i % 2) { g.fillStyle = '#fafafa'; g.fillRect(PAD, p.y, W - PAD * 2, RH) }
    g.fillStyle = C.line; g.fillRect(PAD, p.y + RH - 1, W - PAD * 2, 1)
    let x = PAD
    for (const c of cols) {
      const w = c.w * scale; const t = c.tone?.(i); const text = c.v(i)
      g.font = F(c.bold?.(i) ? 600 : 400, 17); g.textAlign = c.align ?? 'left'
      if (t) { const [fg, bg] = tone(t); g.font = F(600, 15); const tw = Math.min(g.measureText(text).width + 24, w - 12); const bx = c.align === 'right' ? x + w - 8 - tw : x + 8; rrect(g, bx, p.y + 9, tw, RH - 18, 13, bg); g.fillStyle = fg; g.textAlign = 'center'; g.fillText(fit(g, text, tw - 12), bx + tw / 2, p.y + 28) }
      else { g.fillStyle = C.ink; g.fillText(fit(g, text, w - 24), c.align === 'right' ? x + w - 12 : c.align === 'center' ? x + w / 2 : x + 12, p.y + 29) }
      x += w
    }
    g.textAlign = 'left'; p.y += RH
  }
  p.y += 30
}

function krCards(p: Pager, krs: KeyResult[]) {
  const g = p.g; const gap = 20; const w = (W - PAD * 2 - gap * 3) / 4; const h = 196
  p.need(h + 20)
  krs.forEach((k, i) => {
    const x = PAD + i * (w + gap); const [fg, bg] = tone(k.status)
    rrect(g, x, p.y, w, h, 14, '#fff', C.line)
    g.fillStyle = C.muted; g.font = F(600, 16); g.fillText(`KR${i + 1}`, x + 20, p.y + 34)
    g.font = F(600, 14); const st = KR_STATUS[k.status]; const sw = g.measureText(st).width + 22; rrect(g, x + w - 20 - sw, p.y + 16, sw, 28, 14, bg); g.fillStyle = fg; g.textAlign = 'center'; g.fillText(st, x + w - 20 - sw / 2, p.y + 35); g.textAlign = 'left'
    g.fillStyle = C.ink2; g.font = F(400, 16); wrap(g, k.label, x + 20, p.y + 64, w - 40, 22, 2)
    g.fillStyle = C.ink; g.font = F(600, 34); g.fillText(krText(k, k.actual), x + 20, p.y + 142)
    g.fillStyle = C.muted; g.font = F(400, 15); g.fillText(`เป้า ${krText(k, k.goal)}`, x + 20, p.y + 166)
    rrect(g, x + 20, p.y + 176, w - 40, 8, 4, C.soft); rrect(g, x + 20, p.y + 176, Math.max(8, (w - 40) * Math.min(1, k.score)), 8, 4, fg)
  })
  p.y += h + 30
}
function wrap(g: CanvasRenderingContext2D, s: string, x: number, y: number, w: number, lh: number, max: number) {
  // Thai has no spaces between words: break on spaces where possible, else by characters.
  const words = s.split(/(\s+)/); let line = ''; let n = 0
  const flush = () => { g.fillText(n === max - 1 ? fit(g, line, w) : line, x, y + n * lh); n++; line = '' }
  for (const wd of words) {
    if (g.measureText(line + wd).width <= w) { line += wd; continue }
    if (line.trim()) flush(); if (n >= max) return
    line = wd.trimStart()
    while (g.measureText(line).width > w && n < max - 1) { let k = line.length; while (k > 1 && g.measureText(line.slice(0, k)).width > w) k--; g.fillText(line.slice(0, k), x, y + n * lh); n++; line = line.slice(k) }
  }
  if (line && n < max) flush()
}
function progress(p: Pager, u: OkrUnit) {
  const g = p.g; const h = 150; p.need(h)
  const x = PAD, w = W - PAD * 2
  rrect(g, x, p.y, w, h, 14, C.soft)
  g.fillStyle = C.ink2; g.font = F(500, 18); g.fillText('ยอด Close Win สะสมเทียบเป้าทั้งปี', x + 24, p.y + 36)
  g.fillStyle = C.ink; g.font = F(600, 40); g.fillText(baht(u.wonYtd), x + 24, p.y + 88)
  const tw = g.measureText(baht(u.wonYtd)).width
  g.fillStyle = C.muted; g.font = F(400, 20); g.fillText(`จากเป้า ${baht(u.target)} · ${Math.round(u.pct * 100)}% · ยังขาด ${baht(u.gap)} · Pipeline ถ่วงน้ำหนัก ${baht(u.weighted)}`, x + 40 + tw, p.y + 86)
  const [fg] = tone(u.status); const by = p.y + 110, bw = w - 48
  rrect(g, x + 24, by, bw, 16, 8, '#e4e4e7')
  rrect(g, x + 24, by, Math.max(12, bw * Math.min(1, u.pct)), 16, 8, fg)
  if (u.target) { const px = x + 24 + bw * Math.min(1, u.pace / u.target); g.fillStyle = C.ink; g.fillRect(px - 2, by - 8, 4, 32); g.font = F(400, 14); g.fillStyle = C.ink2; g.textAlign = 'center'; g.fillText(`ควรถึง ${baht(u.pace)}`, px, by + 40); g.textAlign = 'left' }
  g.font = F(600, 16); const st = TARGET_LABEL[u.status]; const sw = g.measureText(st).width + 26; const [f2, b2] = tone(u.status); rrect(g, x + w - 24 - sw, p.y + 16, sw, 32, 16, b2); g.fillStyle = f2; g.textAlign = 'center'; g.fillText(st, x + w - 24 - sw / 2, p.y + 38); g.textAlign = 'left'
  p.y += h + 40
}
function monthChart(p: Pager, u: OkrUnit, month: string) {
  const g = p.g; const h = 330; p.need(h + 40)
  const x0 = PAD + 90, x1 = W - PAD - 20, y0 = p.y + 20, y1 = p.y + h - 40
  let cum = 0; const cumul = u.monthly.map((v) => (cum += v))
  const max = Math.max(u.target, cum, 1) * 1.08
  const Y = (v: number) => y1 - ((y1 - y0) * v) / max
  g.strokeStyle = C.line; g.lineWidth = 1; g.fillStyle = C.muted; g.font = F(400, 14); g.textAlign = 'right'
  for (let i = 0; i <= 4; i++) { const v = (max / 4) * i; g.beginPath(); g.moveTo(x0, Y(v)); g.lineTo(x1, Y(v)); g.stroke(); g.fillText(baht(v), x0 - 10, Y(v) + 5) }
  g.textAlign = 'center'
  const step = (x1 - x0) / 12; const cur = Number(month.slice(5, 7))
  u.monthly.forEach((v, i) => {
    const cx = x0 + step * i + step / 2; const bw = step * 0.46
    rrect(g, cx - bw / 2, Y(v), bw, Math.max(0, y1 - Y(v)), 4, i + 1 === cur ? C.brand : i + 1 < cur ? '#9ca3af' : '#e5e7eb')
    if (v) { g.fillStyle = C.ink; g.font = F(500, 13); g.fillText(baht(v), cx, Y(v) - 8) }
    g.fillStyle = i + 1 === cur ? C.ink : C.muted; g.font = F(i + 1 === cur ? 600 : 400, 15); g.fillText(M[i], cx, y1 + 24)
  })
  // cumulative line vs. straight-line target pace
  g.setLineDash([8, 6]); g.strokeStyle = C.ink2; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, Y(0)); g.lineTo(x1, Y(u.target)); g.stroke(); g.setLineDash([])
  g.strokeStyle = C.pre; g.lineWidth = 3; g.beginPath(); cumul.slice(0, cur).forEach((v, i) => { const cx = x0 + step * (i + 1); i ? g.lineTo(cx, Y(v)) : (g.moveTo(x0, Y(0)), g.lineTo(cx, Y(v))) }); g.stroke()
  g.textAlign = 'left'; g.font = F(400, 15)
  const lg = [[C.brand, 'Close Win เดือนนี้'], ['#9ca3af', 'เดือนก่อนหน้า'], [C.pre, 'ยอดสะสม'], [C.ink2, 'เป้าตามเวลา (เส้นประ)']]
  let lx = x0; for (const [c, l] of lg) { g.fillStyle = c; g.fillRect(lx, y1 + 42, 18, 10); g.fillStyle = C.ink2; g.fillText(l, lx + 26, y1 + 52); lx += g.measureText(l).width + 60 }
  p.y += h + 40
}

export async function okrPdf(r: OkrReport, meta: ReportMeta): Promise<{ blob: Blob; previews: string[] }> {
  await document.fonts.load(F(600, 20)); await document.fonts.load(F(400, 20)); await document.fonts.ready
  const p = new Pager(`รายงาน OKR ประจำเดือน ${r.label}`, `${meta.scope} · ข้อมูล ณ ${thDate(r.asOf)} · จัดทำโดย ${meta.by}`)
  const g = p.g
  rrect(g, PAD, p.y, W - PAD * 2, 74, 14, C.dark); g.fillStyle = '#9ca3af'; g.font = F(600, 16); g.fillText('OBJECTIVE', PAD + 24, p.y + 30); g.fillStyle = '#fff'; g.font = F(600, 24); g.fillText(r.objective, PAD + 24, p.y + 60); p.y += 98
  krCards(p, r.total.krs)
  progress(p, r.total)
  section(p, 'Close Win รายเดือน')
  monthChart(p, r.total, r.month)
  p.add()
  const us = r.units
  section(p, `ผลรายหน่วย (${us.length})`)
  table(p, [
    { h: 'หน่วย', w: 150, v: (i) => us[i].name, bold: () => true }, { h: 'ชื่อ', w: 220, v: (i) => us[i].sub ?? '' },
    { h: 'เป้าทั้งปี', w: 130, align: 'right', v: (i) => baht(us[i].target) }, { h: 'Close Win สะสม', w: 150, align: 'right', v: (i) => baht(us[i].wonYtd) },
    { h: '% เป้า', w: 90, align: 'right', v: (i) => `${Math.round(us[i].pct * 100)}%` }, { h: 'เดือนนี้', w: 120, align: 'right', v: (i) => baht(us[i].wonMonth) },
    { h: 'ยังขาด', w: 130, align: 'right', v: (i) => baht(us[i].gap) }, { h: 'ถ่วงน้ำหนัก', w: 140, align: 'right', v: (i) => baht(us[i].weighted) },
    { h: 'Coverage', w: 100, align: 'right', v: (i) => (us[i].coverage >= 9.99 ? '∞' : `${us[i].coverage.toFixed(2)}x`) }, { h: 'ใหม่', w: 70, align: 'right', v: (i) => `${us[i].newOpp}` },
    { h: 'Win rate', w: 100, align: 'right', v: (i) => (us[i].winRate === null ? '—' : `${Math.round(us[i].winRate! * 100)}%`) },
    { h: 'สถานะ', w: 130, align: 'center', v: (i) => TARGET_LABEL[us[i].status], tone: (i) => us[i].status },
  ], us.length, 'ไม่มีข้อมูล')
  p.add()
  const KIND = { new: 'ใหม่', won: 'Close Win', lost: 'Close Lose', stage: 'เปลี่ยนสถานะ' }
  const mv = r.movements
  section(p, `ความเคลื่อนไหวเดือน ${r.label} (${mv.length})`)
  table(p, [
    { h: 'วันที่', w: 100, v: (i) => thDate(mv[i].day) }, { h: 'ประเภท', w: 130, align: 'center', v: (i) => KIND[mv[i].kind], tone: (i) => (mv[i].kind === 'won' ? 'ok' : mv[i].kind === 'lost' ? 'bad' : mv[i].kind === 'new' ? 'warn' : undefined) },
    { h: 'โครงการ', w: 380, v: (i) => `${mv[i].p.code} · ${mv[i].p.name}` }, { h: 'ทีม', w: 100, v: (i) => mv[i].p.team },
    { h: 'สถานะ', w: 180, v: (i) => `${stageOf(mv[i].to).code} ${stageOf(mv[i].to).label}` }, { h: 'มูลค่า', w: 140, align: 'right', v: (i) => baht(mv[i].value) }, { h: 'หมายเหตุ', w: 330, v: (i) => mv[i].note },
  ], mv.length, 'ไม่มีความเคลื่อนไหวในเดือนนี้')
  const nc = r.nextClose
  section(p, `คาดว่าจะปิดใน 3 เดือนข้างหน้า (${nc.length})`, nc.length ? `รวม ${baht(nc.reduce((s, x) => s + x.value, 0))} · ถ่วงน้ำหนัก ${baht(nc.reduce((s, x) => s + x.weighted, 0))}` : '')
  table(p, [
    { h: 'คาดปิด', w: 100, v: (i) => thDate(nc[i].day) }, { h: 'โครงการ', w: 380, v: (i) => `${nc[i].p.code} · ${nc[i].p.name}` }, { h: 'SM', w: 170, v: (i) => person(nc[i].p.sm)?.name ?? '' },
    { h: 'สถานะ', w: 170, v: (i) => `${stageOf(nc[i].p.stage).code} ${stageOf(nc[i].p.stage).label}` }, { h: 'มูลค่า', w: 140, align: 'right', v: (i) => baht(nc[i].value) },
    { h: 'ถ่วงน้ำหนัก', w: 140, align: 'right', v: (i) => baht(nc[i].weighted) }, { h: 'Next step', w: 300, v: (i) => nc[i].p.nextStep },
  ], nc.length, 'ไม่มีโครงการที่กำหนดวันคาดปิดในช่วงนี้')
  const ls = r.losses, sl = r.stalled
  section(p, 'เหตุผลที่ไม่ได้งาน (ปีนี้) และโครงการค้างนาน')
  table(p, [{ h: 'เหตุผลที่ไม่ได้งาน', w: 500, v: (i) => ls[i].reason }, { h: 'จำนวน', w: 100, align: 'right', v: (i) => `${ls[i].count}` }, { h: 'มูลค่า', w: 160, align: 'right', v: (i) => baht(ls[i].value) }], ls.length, 'ไม่มีโครงการที่แพ้ในปีนี้')
  table(p, [{ h: 'ค้างนานเกินเกณฑ์', w: 500, v: (i) => `${sl[i].p.code} · ${sl[i].p.name}` }, { h: 'สถานะ', w: 200, v: (i) => `${stageOf(sl[i].p.stage).code} ${stageOf(sl[i].p.stage).label}` }, { h: 'ค้าง (วัน)', w: 120, align: 'right', v: (i) => `${sl[i].days}` }], sl.length, 'ไม่มีโครงการค้างนาน')
  const pages = p.finish()
  const jpgs = await Promise.all(pages.map((c) => canvasJpeg(c, 0.88)))
  return { blob: pdfBlob(jpgs, { w: 297, h: 210 }, `OKR ${r.label}`), previews: pages.map((c) => c.toDataURL('image/jpeg', 0.7)) }
}
