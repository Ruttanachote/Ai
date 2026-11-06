// HTTP surface. `handle()` is transport-free so it can be unit tested; main.ts adapts node:http.
// Every business rule comes from src/domain (shared with the web app) and is enforced here.
import type { Project } from '../../../src/data/model.ts'
import { validateMove, checkContractValue, type MoveInput } from '../../../src/domain/rules.ts'
import { decide, recall, type ApprovalRequest, ApprovalRuleError, canSendQuotation } from '../approval/approval.ts'
import { AuthError, ForbiddenError, requireRole, type Principal } from '../auth/auth.ts'

export interface Req { method: string; path: string; headers: Record<string, string | undefined>; query: URLSearchParams; body?: unknown }
export interface Res { status: number; body?: unknown; headers?: Record<string, string> }

export interface Deps {
  authenticate(authorization: string | undefined): Promise<Principal>
  projects: Map<string, Project>
  approvals: Map<string, ApprovalRequest>
  today(): string
  now(): string
  clientState: string
  onDriveNotification(resource: string): void
  settings: { tolerancePct: number; gpDropPct: number }
  hasContractFile(projectId: string): Promise<boolean>
}

const json = (status: number, body: unknown): Res => ({ status, body })

export async function handle(d: Deps, req: Req): Promise<Res> {
  try {
    if (req.method === 'GET' && req.path === '/healthz') return json(200, { ok: true })

    // Graph change notifications: echo the validation token, then verify clientState.
    if (req.method === 'POST' && req.path === '/api/graph/notifications') {
      const vt = req.query.get('validationToken')
      if (vt) return { status: 200, body: vt, headers: { 'Content-Type': 'text/plain' } }
      const items = ((req.body as { value?: { clientState?: string; resource: string }[] })?.value ?? [])
      if (items.some((n) => n.clientState !== d.clientState)) return json(401, { error: 'clientState ไม่ถูกต้อง' })
      items.forEach((n) => d.onDriveNotification(n.resource))
      return json(202, {})
    }

    const me = await d.authenticate(req.headers.authorization)
    let m: RegExpExecArray | null

    if (req.method === 'POST' && (m = /^\/api\/projects\/([^/]+)\/move$/.exec(req.path))) {
      requireRole(me, 'sm', 'head', 'exec', 'pmo', 'pm', 'ma', 'admin')
      const p = d.projects.get(m[1])
      if (!p) return json(404, { error: 'ไม่พบโครงการ' })
      const b = req.body as Omit<MoveInput, 'today' | 'poCheck' | 'hasContractFile'>
      const input: MoveInput = { ...b, today: d.today() }
      if (b.to === 'win' && b.contractValue) {
        input.poCheck = checkContractValue(p, { contractValue: b.contractValue, tolerancePct: d.settings.tolerancePct, gpDropPct: d.settings.gpDropPct }, d.today())
        input.hasContractFile = await d.hasContractFile(p.id)
      }
      const r = validateMove(p, input)
      if (!r.ok) return json(422, { errors: r.errors, poCheck: input.poCheck })
      p.stage = b.to
      p.stageSince = d.today()
      if (b.to === 'win') p.contractValue = b.contractValue
      p.history.push({ stage: b.to, note: b.reason ?? '', at: d.now(), by: me.name ?? me.oid })
      return json(200, p)
    }

    if (req.method === 'POST' && (m = /^\/api\/approvals\/([^/]+)\/(approve|reject|recall)$/.exec(req.path))) {
      const a = d.approvals.get(m[1])
      if (!a) return json(404, { error: 'ไม่พบคำขอ' })
      const body = (req.body ?? {}) as { note?: string; channel?: 'web' | 'email_link' }
      if (m[2] === 'recall') recall(a, me.oid, d.now())
      else {
        requireRole(me, 'head', 'exec', 'admin')
        decide(a, me.oid, m[2] as 'approve' | 'reject', d.now(), body)
      }
      return json(200, a)
    }

    if (req.method === 'GET' && (m = /^\/api\/approvals\/([^/]+)\/can-send$/.exec(req.path))) {
      const a = d.approvals.get(m[1])
      return json(200, { canSend: canSendQuotation(a, d.today()), status: a?.status })
    }

    return json(404, { error: 'not found' })
  } catch (e) {
    if (e instanceof AuthError) return json(401, { error: e.message })
    if (e instanceof ForbiddenError) return json(403, { error: e.message })
    if (e instanceof ApprovalRuleError) return json(409, { error: e.message })
    throw e
  }
}
