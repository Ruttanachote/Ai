// Minimal, dependency-free reader for the parts of an .xlsx we need: defined names and the
// cached values of the cells they point at. Used as the fallback when the Workbook API is
// unavailable (file too big, session conflicts) — the server downloads /content and parses it.
import { inflateRawSync } from 'node:zlib'

export function unzip(buf: Uint8Array): Map<string, Buffer> {
  const b = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength)
  // End of central directory record: signature 0x06054b50, search backwards (comment ≤ 64 KiB).
  let eocd = -1
  for (let i = b.length - 22; i >= Math.max(0, b.length - 22 - 0xffff); i--) {
    if (b.readUInt32LE(i) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('ไฟล์ไม่ใช่ .xlsx (ไม่พบ zip directory)')
  const count = b.readUInt16LE(eocd + 10)
  let p = b.readUInt32LE(eocd + 16)
  const out = new Map<string, Buffer>()
  for (let n = 0; n < count; n++) {
    if (b.readUInt32LE(p) !== 0x02014b50) throw new Error('zip directory เสียหาย')
    const method = b.readUInt16LE(p + 10)
    const csize = b.readUInt32LE(p + 20)
    const nameLen = b.readUInt16LE(p + 28)
    const extraLen = b.readUInt16LE(p + 30)
    const commentLen = b.readUInt16LE(p + 32)
    const local = b.readUInt32LE(p + 42)
    const name = b.toString('utf8', p + 46, p + 46 + nameLen)
    const lNameLen = b.readUInt16LE(local + 26)
    const lExtraLen = b.readUInt16LE(local + 28)
    const start = local + 30 + lNameLen + lExtraLen
    const data = b.subarray(start, start + csize)
    if (method === 0) out.set(name, Buffer.from(data))
    else if (method === 8) out.set(name, inflateRawSync(data))
    else throw new Error(`zip compression ${method} ไม่รองรับ`)
    p += 46 + nameLen + extraLen + commentLen
  }
  return out
}

const decode = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')

export interface CellValue { sheet: string; address: string; value: number | string | null }

/** Parse `'Sheet name'!$B$5` → { sheet, cell: 'B5' }. Returns undefined for ranges / formulas. */
export function parseRef(ref: string): { sheet: string; cell: string } | undefined {
  const m = /^(?:'((?:[^']|'')+)'|([^!]+))!\$?([A-Z]{1,3})\$?(\d+)$/.exec(ref.trim())
  if (!m) return undefined
  return { sheet: (m[1] ?? m[2]).replace(/''/g, "'"), cell: m[3] + m[4] }
}

export function readDefinedNames(buf: Uint8Array): Map<string, CellValue | { error: string }> {
  const files = unzip(buf)
  const wb = files.get('xl/workbook.xml')?.toString('utf8')
  const rels = files.get('xl/_rels/workbook.xml.rels')?.toString('utf8')
  if (!wb || !rels) throw new Error('ไม่พบ xl/workbook.xml')
  const relTarget = new Map<string, string>()
  for (const m of rels.matchAll(/<Relationship\b[^>]*?Id="([^"]+)"[^>]*?Target="([^"]+)"/g)) relTarget.set(m[1], m[2])
  for (const m of rels.matchAll(/<Relationship\b[^>]*?Target="([^"]+)"[^>]*?Id="([^"]+)"/g)) relTarget.set(m[2], m[1])
  const sheetPath = new Map<string, string>()
  for (const m of wb.matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const name = /name="([^"]*)"/.exec(m[1])?.[1]
    const rid = /r:id="([^"]*)"/.exec(m[1])?.[1]
    if (!name || !rid) continue
    const t = relTarget.get(rid) ?? ''
    sheetPath.set(decode(name), t.startsWith('/') ? t.slice(1) : 'xl/' + t)
  }
  const shared: string[] = []
  const ss = files.get('xl/sharedStrings.xml')?.toString('utf8')
  if (ss) for (const m of ss.matchAll(/<si>([\s\S]*?)<\/si>/g)) shared.push(decode([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join('')))

  const out = new Map<string, CellValue | { error: string }>()
  for (const m of wb.matchAll(/<definedName\b([^>]*)>([\s\S]*?)<\/definedName>/g)) {
    const name = /name="([^"]*)"/.exec(m[1])?.[1]
    if (!name || /localSheetId=/.test(m[1])) continue
    const ref = parseRef(decode(m[2]))
    if (!ref) { out.set(name, { error: `${name} ไม่ได้ชี้ไปที่เซลล์เดียว (${decode(m[2])})` }); continue }
    const path = sheetPath.get(ref.sheet)
    const xml = path ? files.get(path)?.toString('utf8') : undefined
    if (!xml) { out.set(name, { error: `${name} ชี้ไปชีต “${ref.sheet}” ที่ไม่มีอยู่` }); continue }
    const cell = new RegExp(`<c\\b[^>]*\\br="${ref.cell}"([^>]*)(?:/>|>([\\s\\S]*?)</c>)`).exec(xml)
    let value: number | string | null = null
    if (cell) {
      const attrs = cell[0]
      const type = /\bt="([^"]+)"/.exec(attrs)?.[1]
      const v = /<v>([\s\S]*?)<\/v>/.exec(cell[2] ?? '')?.[1]
      const inline = /<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>/.exec(cell[2] ?? '')?.[1]
      if (type === 's' && v !== undefined) value = shared[Number(v)] ?? null
      else if (type === 'inlineStr') value = inline !== undefined ? decode(inline) : null
      else if (type === 'str') value = v !== undefined ? decode(v) : null
      else if (v !== undefined) value = Number(v)
    }
    out.set(name, { sheet: ref.sheet, address: ref.cell, value })
  }
  return out
}
