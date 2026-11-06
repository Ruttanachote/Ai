// P0-1 · Read the Cost Sheet summary the way Microsoft supports it.
//
// The Excel Workbook API does NOT support application permissions for createSession or
// names/{name}/range, so the primary path runs with the signed-in SM's *delegated* token
// (obtained via On-Behalf-Of) when they press Sync or Submit. The fallback downloads the
// file and parses defined names server-side. Neither path ever writes to a cell.
import { GraphClient, GraphError } from './client.ts'
import { readDefinedNames } from './xlsx.ts'

export const REQUIRED_NAMES = ['Total_Revenue', 'Total_COGS', 'OT_Reserve', 'Template_Version'] as const
export const SUPPORTED_TEMPLATES = ['2569.1', '2569.2']

export interface CostSheetSummary {
  revenue: number
  cost: number
  gp: number
  otReserve: number
  templateVersion: string
  source: 'workbook-api' | 'download'
}

export class CostSheetError extends Error {
  problems: string[]
  constructor(problems: string[]) {
    super('Cost Sheet ไม่ตรงกับ Template: ' + problems.join(' · '))
    this.problems = problems
  }
}

/** Marker so a caller can't accidentally pass the worker's app-only token. */
export interface DelegatedToken { kind: 'delegated'; value: string }

type Raw = Map<string, { value: unknown; cells: number } | { error: string }>

export function summarize(raw: Raw, source: CostSheetSummary['source']): CostSheetSummary {
  const problems: string[] = []
  const num = (n: string) => {
    const r = raw.get(n)
    if (!r) { problems.push(`ไม่พบชื่อ ${n}`); return 0 }
    if ('error' in r) { problems.push(r.error); return 0 }
    if (r.cells !== 1) { problems.push(`${n} ต้องเป็นเซลล์เดียว`); return 0 }
    if (typeof r.value !== 'number' || !Number.isFinite(r.value)) { problems.push(`${n} ต้องเป็นตัวเลข`); return 0 }
    return r.value
  }
  const revenue = num('Total_Revenue')
  const cost = num('Total_COGS')
  const otReserve = num('OT_Reserve')
  const tv = raw.get('Template_Version')
  let templateVersion = ''
  if (!tv || 'error' in tv) problems.push('ไม่พบ Template_Version (ชีต Meta)')
  else {
    templateVersion = String(tv.value)
    if (!SUPPORTED_TEMPLATES.includes(templateVersion)) problems.push(`Template ${templateVersion} ไม่รองรับ — ใช้ ${SUPPORTED_TEMPLATES.join(', ')}`)
  }
  if (!problems.length && revenue <= 0) problems.push('Total_Revenue ต้องมากกว่า 0')
  if (problems.length) throw new CostSheetError(problems)
  return { revenue, cost, otReserve, gp: revenue ? ((revenue - cost) / revenue) * 100 : 0, templateVersion, source }
}

export async function readViaWorkbookApi(g: GraphClient, user: DelegatedToken, driveId: string, itemId: string): Promise<CostSheetSummary> {
  if (user.kind !== 'delegated') throw new Error('Workbook API ต้องใช้ delegated token')
  const base = `/drives/${driveId}/items/${itemId}/workbook`
  const serialKey = `wb:${driveId}:${itemId}`
  const token = user.value
  const session = await g.post<{ id: string }>(`${base}/createSession`, { token, serialKey, body: { persistChanges: false } })
  const headers = { 'workbook-session-id': session.id }
  try {
    const names = await g.get<{ value: { name: string; type: string; value: string }[] }>(`${base}/names`, { token, serialKey, headers })
    const known = new Set(names.value.map((n) => n.name))
    const raw: Raw = new Map()
    for (const n of REQUIRED_NAMES) {
      if (!known.has(n)) continue
      const r = await g.get<{ values: unknown[][]; cellCount: number; address: string }>(
        `${base}/names/${encodeURIComponent(n)}/range?$select=values,cellCount,address`, { token, serialKey, headers })
      raw.set(n, { value: r.values?.[0]?.[0], cells: r.cellCount })
    }
    return summarize(raw, 'workbook-api')
  } finally {
    await g.post(`${base}/closeSession`, { token, serialKey, headers }).catch(() => undefined)
  }
}

export async function readViaDownload(g: GraphClient, token: string, driveId: string, itemId: string): Promise<CostSheetSummary> {
  const res = await g.get<Response>(`/drives/${driveId}/items/${itemId}/content`, { token, raw: true })
  const buf = new Uint8Array(await res.arrayBuffer())
  const names = readDefinedNames(buf)
  const raw: Raw = new Map()
  for (const [k, v] of names) raw.set(k, 'error' in v ? v : { value: v.value, cells: 1 })
  return summarize(raw, 'download')
}

/** Primary path with automatic fallback for errors the Workbook API cannot recover from. */
export async function readCostSheet(g: GraphClient, user: DelegatedToken, driveId: string, itemId: string) {
  try {
    return await readViaWorkbookApi(g, user, driveId, itemId)
  } catch (e) {
    if (e instanceof CostSheetError) throw e
    if (e instanceof GraphError && ['accessConflict', 'unsupportedWorkbook', 'fileTooLarge', 'serviceUnavailable'].includes(e.code))
      return readViaDownload(g, user.value, driveId, itemId)
    throw e
  }
}
