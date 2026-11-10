// Minimal PDF writer: one full-page JPEG per page. Pages are drawn on a canvas first, so Thai
// text is shaped by the browser exactly as on screen (no font embedding needed).
import { concat } from './xlsx'

export interface PdfPage { jpeg: Uint8Array; w: number; h: number }
/** `mm` is the page size in millimetres (A4 landscape = 297 × 210). */
export function pdfBlob(pages: PdfPage[], mm: { w: number; h: number }, title = ''): Blob {
  const pt = { w: (mm.w / 25.4) * 72, h: (mm.h / 25.4) * 72 }
  const enc = (s: string) => new TextEncoder().encode(s)
  const chunks: Uint8Array[] = [enc('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')]
  const offsets: number[] = []
  let pos = chunks[0].length
  const obj = (n: number, body: Uint8Array[]) => { offsets[n] = pos; const head = enc(`${n} 0 obj\n`); const tail = enc('\nendobj\n'); for (const c of [head, ...body, tail]) { chunks.push(c); pos += c.length } }
  const N = pages.length
  // 1 catalog, 2 pages, 3 info, then per page: page, content, image
  const kids = pages.map((_, i) => `${4 + i * 3} 0 R`).join(' ')
  obj(1, [enc('<< /Type /Catalog /Pages 2 0 R >>')])
  obj(2, [enc(`<< /Type /Pages /Kids [${kids}] /Count ${N} >>`)])
  const utf16 = (s: string) => '<FEFF' + [...s].map((c) => c.codePointAt(0)!.toString(16).padStart(4, '0')).join('') + '>'
  obj(3, [enc(`<< /Title ${utf16(title)} /Producer (One Platform) >>`)])
  pages.forEach((p, i) => {
    const n = 4 + i * 3
    obj(n, [enc(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pt.w.toFixed(2)} ${pt.h.toFixed(2)}] /Resources << /XObject << /Im${i} ${n + 2} 0 R >> >> /Contents ${n + 1} 0 R >>`)])
    const cs = `q ${pt.w.toFixed(2)} 0 0 ${pt.h.toFixed(2)} 0 0 cm /Im${i} Do Q`
    obj(n + 1, [enc(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`)])
    obj(n + 2, [enc(`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`), p.jpeg, enc('\nendstream')])
  })
  const xrefAt = pos
  const total = 4 + N * 3
  let xref = `xref\n0 ${total}\n0000000000 65535 f \n`
  for (let i = 1; i < total; i++) xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  xref += `trailer\n<< /Size ${total} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xrefAt}\n%%EOF`
  chunks.push(enc(xref))
  return new Blob([concat(chunks)], { type: 'application/pdf' })
}

export async function canvasJpeg(c: HTMLCanvasElement, q = 0.9): Promise<PdfPage> {
  const blob: Blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('canvas'))), 'image/jpeg', q))
  return { jpeg: new Uint8Array(await blob.arrayBuffer()), w: c.width, h: c.height }
}
