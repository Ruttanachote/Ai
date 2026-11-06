import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deflateRawSync } from 'node:zlib'
import { GraphClient, GraphError, retryAfterMs } from '../src/graph/client.ts'
import { readCostSheet, readViaWorkbookApi, CostSheetError, summarize } from '../src/graph/costsheet.ts'
import { readDefinedNames, parseRef } from '../src/graph/xlsx.ts'

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>
const fake = (h: Handler) => (async (url: string | URL | Request, init?: RequestInit) => h(String(url), init ?? {})) as typeof fetch
const ok = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
const noSleep = async () => {}

test('Retry-After: seconds and HTTP-date', () => {
  assert.equal(retryAfterMs('3'), 3000)
  assert.equal(retryAfterMs(new Date(10_000).toUTCString(), 4000), 6000)
  assert.equal(retryAfterMs(null), undefined)
})

test('retries 429 honouring Retry-After, then succeeds', async () => {
  const waits: number[] = []
  let n = 0
  const g = new GraphClient({ fetch: fake(() => (++n < 3 ? new Response('', { status: 429, headers: { 'Retry-After': '2' } }) : ok({ v: 1 }))), sleep: async (ms) => { waits.push(ms) } })
  assert.deepEqual(await g.get('/x', { token: 't' }), { v: 1 })
  assert.deepEqual(waits, [2000, 2000])
})

test('non-retryable errors surface Graph error code and request-id', async () => {
  const g = new GraphClient({ fetch: fake(() => new Response(JSON.stringify({ error: { code: 'accessDenied', message: 'no' } }), { status: 403, headers: { 'request-id': 'r1' } })), sleep: noSleep })
  await assert.rejects(g.get('/x', { token: 't' }), (e: unknown) => e instanceof GraphError && e.code === 'accessDenied' && e.requestId === 'r1')
})

test('serialKey runs workbook calls one at a time; mailbox caps concurrency at 4', async () => {
  let active = 0
  let peak = 0
  const slow: Handler = async () => {
    active++; peak = Math.max(peak, active)
    await new Promise((r) => setTimeout(r, 5))
    active--
    return ok({})
  }
  const g = new GraphClient({ fetch: fake(slow), sleep: noSleep })
  await Promise.all([1, 2, 3, 4, 5].map(() => g.get('/wb', { token: 't', serialKey: 'wb1' })))
  assert.equal(peak, 1)
  peak = 0
  await Promise.all(Array.from({ length: 10 }, () => g.post('/users/m/sendMail', { token: 't', mailbox: 'salesflow@x' })))
  assert.equal(peak, 4)
})

/* ---------------- Cost Sheet (P0-1) ---------------- */

test('workbook API path: non-persistent session, reads names, closes session, never writes', async () => {
  const calls: string[] = []
  const values: Record<string, unknown> = { Total_Revenue: 18_400_000, Total_COGS: 12_950_000, OT_Reserve: 647_500, Template_Version: '2569.2' }
  const g = new GraphClient({ sleep: noSleep, fetch: fake((url, init) => {
    calls.push(`${init.method} ${url.replace('https://graph.microsoft.com/v1.0', '')}`)
    if (url.endsWith('/createSession')) { assert.deepEqual(JSON.parse(String(init.body)), { persistChanges: false }); return ok({ id: 's1' }) }
    if (url.endsWith('/names')) return ok({ value: Object.keys(values).map((name) => ({ name, type: 'Range', value: '' })) })
    const m = /names\/([^/]+)\/range/.exec(url)
    if (m) { assert.equal((init.headers as Record<string, string>)['workbook-session-id'], 's1'); return ok({ values: [[values[decodeURIComponent(m[1])]]], cellCount: 1, address: 'X' }) }
    if (url.endsWith('/closeSession')) return new Response(null, { status: 204 })
    return ok({}, 404)
  }) })
  const s = await readViaWorkbookApi(g, { kind: 'delegated', value: 'user' }, 'd', 'i')
  assert.equal(s.revenue, 18_400_000)
  assert.equal(s.gp.toFixed(1), '29.6')
  assert.ok(calls.at(-1)!.endsWith('/closeSession'))
  assert.ok(calls.every((c) => c.startsWith('GET') || /createSession|closeSession/.test(c)), 'no writes besides session control')
})

test('summarize names the broken range in the error', () => {
  const raw = new Map<string, { value: unknown; cells: number } | { error: string }>([
    ['Total_Revenue', { value: 'abc', cells: 1 }], ['Total_COGS', { value: 1, cells: 4 }], ['Template_Version', { value: '2568.1', cells: 1 }],
  ])
  assert.throws(() => summarize(raw, 'download'), (e: unknown) => e instanceof CostSheetError
    && e.problems.some((p) => p.includes('Total_Revenue ต้องเป็นตัวเลข'))
    && e.problems.some((p) => p.includes('Total_COGS ต้องเป็นเซลล์เดียว'))
    && e.problems.some((p) => p.includes('ไม่พบชื่อ OT_Reserve'))
    && e.problems.some((p) => p.includes('2568.1')))
})

/** Build a tiny .xlsx (zip, deflate) in memory. */
function makeXlsx(files: Record<string, string>) {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0
  for (const [name, text] of Object.entries(files)) {
    const data = deflateRawSync(Buffer.from(text, 'utf8'))
    const nameBuf = Buffer.from(name)
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(8, 8); lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(Buffer.byteLength(text), 22); lh.writeUInt16LE(nameBuf.length, 26)
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(8, 10); ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(Buffer.byteLength(text), 24); ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt32LE(offset, 42)
    locals.push(lh, nameBuf, data)
    centrals.push(ch, nameBuf)
    offset += 30 + nameBuf.length + data.length
  }
  const cd = Buffer.concat(centrals)
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(Object.keys(files).length, 8); end.writeUInt16LE(Object.keys(files).length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16)
  return new Uint8Array(Buffer.concat([...locals, cd, end]))
}

const XLSX = makeXlsx({
  'xl/workbook.xml': `<workbook xmlns:r="r"><sheets><sheet name="Summary" sheetId="1" r:id="rId1"/><sheet name="Meta" sheetId="2" r:id="rId2"/></sheets>
<definedNames><definedName name="Total_Revenue">Summary!$B$2</definedName><definedName name="Total_COGS">Summary!$B$3</definedName>
<definedName name="OT_Reserve">Summary!$B$4</definedName><definedName name="Template_Version">Meta!$A$1</definedName>
<definedName name="Lines">Summary!$A$1:$B$9</definedName></definedNames></workbook>`,
  'xl/_rels/workbook.xml.rels': `<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="worksheets/sheet2.xml"/></Relationships>`,
  'xl/sharedStrings.xml': `<sst><si><t>2569.2</t></si></sst>`,
  'xl/worksheets/sheet1.xml': `<worksheet><sheetData><row r="2"><c r="B2"><f>SUM(X)</f><v>9600000</v></c></row><row r="3"><c r="B3"><v>6400000</v></c></row><row r="4"><c r="B4"><v>320000</v></c></row></sheetData></worksheet>`,
  'xl/worksheets/sheet2.xml': `<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c></row></sheetData></worksheet>`,
})

test('xlsx fallback reads defined names and cached formula values', () => {
  assert.deepEqual(parseRef("'Cost Sheet'!$C$10"), { sheet: 'Cost Sheet', cell: 'C10' })
  const n = readDefinedNames(XLSX)
  assert.deepEqual(n.get('Total_Revenue'), { sheet: 'Summary', address: 'B2', value: 9_600_000 })
  assert.deepEqual(n.get('Template_Version'), { sheet: 'Meta', address: 'A1', value: '2569.2' })
  assert.ok('error' in n.get('Lines')!)
})

test('readCostSheet falls back to download when the workbook is locked for editing', async () => {
  const g = new GraphClient({ sleep: noSleep, fetch: fake((url) => {
    if (url.endsWith('/createSession')) return new Response(JSON.stringify({ error: { code: 'accessConflict', message: 'busy' } }), { status: 409 })
    if (url.endsWith('/content')) return new Response(Buffer.from(XLSX), { status: 200 })
    return ok({}, 404)
  }) })
  const s = await readCostSheet(g, { kind: 'delegated', value: 'u' }, 'd', 'i')
  assert.equal(s.source, 'download')
  assert.equal(s.cost, 6_400_000)
})
