// Thin Microsoft Graph client shared by every integration.
// - Retries 429/503/504 honouring Retry-After (seconds or HTTP-date), else exponential backoff + jitter.
// - `serialKey` queues requests per key: Microsoft asks that calls to one workbook are sent one at a time.
// - `mailbox` caps concurrent requests per mailbox at 4 (Outlook limit).
// - Every request is passed to an audit hook (method, path, status, request-id) — never the body.

export class GraphError extends Error {
  status: number
  code: string
  requestId?: string
  constructor(status: number, code: string, message: string, requestId?: string) {
    super(`${status} ${code}: ${message}`)
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}

export interface AuditEntry { method: string; path: string; status: number; requestId?: string; attempt: number; ms: number }

export interface GraphClientOptions {
  baseUrl?: string
  fetch?: typeof fetch
  maxRetries?: number
  sleep?: (ms: number) => Promise<void>
  audit?: (e: AuditEntry) => void
  random?: () => number
}

export interface RequestOptions {
  token: string
  body?: unknown
  headers?: Record<string, string>
  serialKey?: string
  mailbox?: string
  /** Return the raw Response (for downloads and 202 Accepted with Location). */
  raw?: boolean
}

const RETRYABLE = new Set([429, 503, 504])
const MAILBOX_LIMIT = 4

class Semaphore {
  private active = 0
  private queue: (() => void)[] = []
  private limit: number
  constructor(limit: number) { this.limit = limit }
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) await new Promise<void>((r) => this.queue.push(r))
    this.active++
    try {
      return await fn()
    } finally {
      this.active--
      this.queue.shift()?.()
    }
  }
}

export function retryAfterMs(h: string | null, now = Date.now()): number | undefined {
  if (!h) return undefined
  const secs = Number(h)
  if (Number.isFinite(secs)) return Math.max(0, secs * 1000)
  const at = Date.parse(h)
  return Number.isNaN(at) ? undefined : Math.max(0, at - now)
}

export class GraphClient {
  readonly baseUrl: string
  private f: typeof fetch
  private maxRetries: number
  private sleep: (ms: number) => Promise<void>
  private audit?: (e: AuditEntry) => void
  private random: () => number
  private chains = new Map<string, Promise<unknown>>()
  private mailboxes = new Map<string, Semaphore>()

  constructor(o: GraphClientOptions = {}) {
    this.baseUrl = o.baseUrl ?? 'https://graph.microsoft.com/v1.0'
    this.f = o.fetch ?? fetch
    this.maxRetries = o.maxRetries ?? 5
    this.sleep = o.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)))
    this.audit = o.audit
    this.random = o.random ?? Math.random
  }

  request<T = unknown>(method: string, path: string, o: RequestOptions): Promise<T> {
    let run = () => this.send<T>(method, path, o)
    if (o.mailbox) {
      const key = o.mailbox.toLowerCase()
      if (!this.mailboxes.has(key)) this.mailboxes.set(key, new Semaphore(MAILBOX_LIMIT))
      const sem = this.mailboxes.get(key)!
      const inner = run
      run = () => sem.run(inner)
    }
    if (!o.serialKey) return run()
    const prev = this.chains.get(o.serialKey) ?? Promise.resolve()
    const next = prev.catch(() => undefined).then(run)
    this.chains.set(o.serialKey, next)
    next.finally(() => { if (this.chains.get(o.serialKey!) === next) this.chains.delete(o.serialKey!) }).catch(() => undefined)
    return next
  }

  get<T = unknown>(path: string, o: RequestOptions) { return this.request<T>('GET', path, o) }
  post<T = unknown>(path: string, o: RequestOptions) { return this.request<T>('POST', path, o) }
  patch<T = unknown>(path: string, o: RequestOptions) { return this.request<T>('PATCH', path, o) }

  /** Poll an async-operation monitor URL (e.g. driveItem copy) until it completes. */
  async waitForOperation(monitorUrl: string, everyMs = 1000, timeoutMs = 120_000): Promise<{ resourceId?: string }> {
    const start = Date.now()
    for (;;) {
      // Monitor URLs are pre-authenticated; no bearer token must be sent.
      const res = await this.f(monitorUrl)
      const body = (await res.json()) as { status: string; resourceId?: string; error?: { code: string; message: string } }
      if (body.status === 'completed') return { resourceId: body.resourceId }
      if (body.status === 'failed') throw new GraphError(500, body.error?.code ?? 'copyFailed', body.error?.message ?? 'Copy failed')
      if (Date.now() - start > timeoutMs) throw new GraphError(504, 'timeout', 'Async operation did not finish in time')
      await this.sleep(everyMs)
    }
  }

  private async send<T>(method: string, path: string, o: RequestOptions): Promise<T> {
    const url = path.startsWith('http') ? path : this.baseUrl + path
    for (let attempt = 0; ; attempt++) {
      const t0 = Date.now()
      const headers: Record<string, string> = { Authorization: `Bearer ${o.token}`, ...o.headers }
      let body: BodyInit | undefined
      if (o.body !== undefined) {
        headers['Content-Type'] ??= 'application/json'
        body = typeof o.body === 'string' || o.body instanceof Uint8Array ? (o.body as BodyInit) : JSON.stringify(o.body)
      }
      let res: Response
      try {
        res = await this.f(url, { method, headers, body })
      } catch (err) {
        if (attempt >= this.maxRetries) throw err
        await this.sleep(this.backoff(attempt))
        continue
      }
      const requestId = res.headers.get('request-id') ?? undefined
      this.audit?.({ method, path, status: res.status, requestId, attempt, ms: Date.now() - t0 })
      if (RETRYABLE.has(res.status) && attempt < this.maxRetries) {
        await this.sleep(retryAfterMs(res.headers.get('Retry-After')) ?? this.backoff(attempt))
        continue
      }
      if (!res.ok) {
        let code = 'error'
        let message = res.statusText
        try {
          const j = (await res.json()) as { error?: { code?: string; message?: string } }
          code = j.error?.code ?? code
          message = j.error?.message ?? message
        } catch { /* non-JSON error body */ }
        throw new GraphError(res.status, code, message, requestId)
      }
      if (o.raw) return res as unknown as T
      if (res.status === 204 || res.headers.get('content-length') === '0') return undefined as T
      const ct = res.headers.get('content-type') ?? ''
      return (ct.includes('json') ? await res.json() : await res.text()) as T
    }
  }

  private backoff(attempt: number) {
    const base = Math.min(30_000, 500 * 2 ** attempt)
    return base / 2 + this.random() * (base / 2)
  }
}
