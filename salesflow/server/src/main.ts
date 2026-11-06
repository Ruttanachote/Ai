// SalesFlow API + worker entry point (Node ≥ 22, runs TypeScript directly via type stripping).
//   node server/src/main.ts
// Required env: TENANT_ID, API_AUDIENCE (api://<web-app-client-id>), GRAPH_CLIENT_STATE.
import { createServer } from 'node:http'
import { handle, type Deps } from './http/app.ts'
import { jwksResolver, verifyAccessToken } from './auth/auth.ts'

const env = (k: string, fallback?: string) => {
  const v = process.env[k] ?? fallback
  if (v === undefined) throw new Error(`ต้องตั้งค่า ${k}`)
  return v
}

const tenantId = env('TENANT_ID')
const audience = env('API_AUDIENCE')
const keys = jwksResolver(tenantId)
const pendingDriveChanges = new Set<string>()

const deps: Deps = {
  async authenticate(h) {
    const token = h?.startsWith('Bearer ') ? h.slice(7) : ''
    return verifyAccessToken(token, { tenantId, audience, keys })
  },
  projects: new Map(),
  approvals: new Map(),
  today: () => new Date().toISOString().slice(0, 10),
  now: () => new Date().toISOString(),
  clientState: env('GRAPH_CLIENT_STATE'),
  onDriveNotification: (r) => pendingDriveChanges.add(r), // drained by the delta worker
  settings: { tolerancePct: Number(env('PO_TOLERANCE_PCT', '2')), gpDropPct: Number(env('GP_DROP_PCT', '3')) },
  hasContractFile: async () => false, // wired to SharePoint folder listing in the worker
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(c as Buffer)
  const raw = Buffer.concat(chunks).toString('utf8')
  let body: unknown
  try { body = raw ? JSON.parse(raw) : undefined } catch { res.writeHead(400).end('invalid json'); return }
  try {
    const out = await handle(deps, { method: req.method ?? 'GET', path: url.pathname, query: url.searchParams, headers: req.headers as Record<string, string>, body })
    const isText = typeof out.body === 'string'
    res.writeHead(out.status, { 'Content-Type': isText ? 'text/plain' : 'application/json', ...out.headers })
    res.end(isText ? out.body : JSON.stringify(out.body ?? {}))
  } catch (e) {
    console.error(e)
    res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'internal error' }))
  }
}).listen(Number(env('PORT', '8090')), () => console.log('SalesFlow API ready'))
