// Minimal .xlsx writer (no dependencies): inline strings, numbers, formulas, a few styles,
// column widths, merged cells and a frozen header. Files are stored uncompressed in the zip.
export type Style = 'title' | 'sub' | 'head' | 'money' | 'moneyB' | 'pct' | 'pctB' | 'x' | 'int' | 'intB' | 'bold' | 'text' | 'good' | 'warn' | 'bad'
export type Cell = string | number | null | undefined | { v?: string | number; f?: string; s?: Style }
export interface Sheet { name: string; rows: Cell[][]; cols?: number[]; merges?: string[]; freeze?: number }

const STYLE_ID: Record<Style, number> = { text: 0, title: 1, sub: 2, head: 3, money: 4, moneyB: 5, pct: 6, pctB: 7, x: 8, int: 9, intB: 10, bold: 11, good: 12, warn: 13, bad: 14 }
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
export const colName = (i: number) => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26) } return s }

function sheetXml(sh: Sheet) {
  const rows = sh.rows.map((r, ri) => `<row r="${ri + 1}">${r.map((c, ci) => {
    if (c === null || c === undefined || c === '') return ''
    const o = typeof c === 'object' ? c : { v: c }
    const ref = colName(ci) + (ri + 1)
    const s = o.s ? ` s="${STYLE_ID[o.s]}"` : typeof o.v === 'number' ? ' s="4"' : ''
    if (o.f) return `<c r="${ref}"${s}><f>${esc(o.f)}</f>${typeof o.v === 'number' ? `<v>${o.v}</v>` : ''}</c>`
    if (typeof o.v === 'number') return `<c r="${ref}"${s}><v>${Number.isFinite(o.v) ? o.v : 0}</v></c>`
    if (o.v === undefined) return `<c r="${ref}"${s}/>`
    return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(String(o.v))}</t></is></c>`
  }).join('')}</row>`).join('')
  const cols = sh.cols?.length ? `<cols>${sh.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` : ''
  const pane = sh.freeze ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${sh.freeze}" topLeftCell="A${sh.freeze + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` : ''
  const merges = sh.merges?.length ? `<mergeCells count="${sh.merges.length}">${sh.merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : ''
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${pane}${cols}<sheetData>${rows}</sheetData>${merges}<pageSetup orientation="landscape" paperSize="9"/></worksheet>`
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="3"><numFmt numFmtId="164" formatCode="#,##0"/><numFmt numFmtId="165" formatCode="0.0%"/><numFmt numFmtId="166" formatCode="0.00&quot;x&quot;"/></numFmts>
<fonts count="5"><font><sz val="11"/><name val="Tahoma"/></font><font><b/><sz val="16"/><color rgb="FFE2332B"/><name val="Tahoma"/></font><font><sz val="10"/><color rgb="FF6B7280"/><name val="Tahoma"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Tahoma"/></font><font><b/><sz val="11"/><name val="Tahoma"/></font></fonts>
<fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF3F3F46"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE6F4EA"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFDE2E1"/></patternFill></fill></fills>
<borders count="2"><border/><border><top style="thin"><color rgb="FF9CA3AF"/></top><bottom style="thin"><color rgb="FF9CA3AF"/></bottom></border></borders>
<cellStyleXfs count="1"><xf/></cellStyleXfs>
<cellXfs count="15">
<xf xfId="0" fontId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf xfId="0" fontId="1" applyFont="1"/>
<xf xfId="0" fontId="2" applyFont="1"/>
<xf xfId="0" fontId="3" fillId="2" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf xfId="0" numFmtId="164" fontId="0" applyNumberFormat="1"/>
<xf xfId="0" numFmtId="164" fontId="4" borderId="1" applyNumberFormat="1" applyFont="1" applyBorder="1"/>
<xf xfId="0" numFmtId="165" fontId="0" applyNumberFormat="1"/>
<xf xfId="0" numFmtId="165" fontId="4" borderId="1" applyNumberFormat="1" applyFont="1" applyBorder="1"/>
<xf xfId="0" numFmtId="166" fontId="0" applyNumberFormat="1"/>
<xf xfId="0" numFmtId="1" fontId="0" applyNumberFormat="1"/>
<xf xfId="0" numFmtId="1" fontId="4" borderId="1" applyNumberFormat="1" applyFont="1" applyBorder="1"/>
<xf xfId="0" fontId="4" borderId="1" applyFont="1" applyBorder="1"/>
<xf xfId="0" fontId="0" fillId="3" applyFill="1"/>
<xf xfId="0" fontId="0" fillId="4" applyFill="1"/>
<xf xfId="0" fontId="0" fillId="5" applyFill="1"/>
</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`

export function xlsxBlob(sheets: Sheet[], meta: { title?: string; author?: string } = {}): Blob {
  const names = sheets.map((s, i) => (s.name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || `Sheet${i + 1}`))
  const files: [string, string][] = [
    ['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`],
    ['_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`],
    ['docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${esc(meta.title ?? '')}</dc:title><dc:creator>${esc(meta.author ?? 'One Platform')}</dc:creator></cp:coreProperties>`],
    ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets><calcPr fullCalcOnLoad="1"/></workbook>`],
    ['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml', STYLES],
    ...sheets.map((s, i) => [`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s)] as [string, string]),
  ]
  return new Blob([zip(files.map(([n, t]) => [n, new TextEncoder().encode(t)]))], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

/* ---------------- stored (uncompressed) zip ---------------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
function crc32(b: Uint8Array) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
export function zip(entries: [string, Uint8Array][]): Uint8Array<ArrayBuffer> {
  const parts: Uint8Array[] = []; const central: Uint8Array[] = []; let off = 0
  for (const [name, data] of entries) {
    const nm = new TextEncoder().encode(name); const crc = crc32(data)
    const h = new DataView(new ArrayBuffer(30))
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true)
    h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true)
    h.setUint16(26, nm.length, true); h.setUint16(28, 0, true)
    parts.push(new Uint8Array(h.buffer), nm, data)
    const c = new DataView(new ArrayBuffer(46))
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true)
    c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true)
    c.setUint16(28, nm.length, true); c.setUint32(42, off, true)
    central.push(new Uint8Array(c.buffer), nm)
    off += 30 + nm.length + data.length
  }
  const cdSize = central.reduce((s, b) => s + b.length, 0)
  const e = new DataView(new ArrayBuffer(22))
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, entries.length, true); e.setUint16(10, entries.length, true); e.setUint32(12, cdSize, true); e.setUint32(16, off, true)
  return concat([...parts, ...central, new Uint8Array(e.buffer)])
}
export function concat(arrs: Uint8Array[]): Uint8Array<ArrayBuffer> { const out = new Uint8Array(arrs.reduce((s, a) => s + a.length, 0)); let o = 0; for (const a of arrs) { out.set(a, o); o += a.length } return out }
