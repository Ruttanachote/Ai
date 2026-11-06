// P0-6 · Identity.
// - Validates Entra ID access tokens for the SalesFlow API (RS256, JWKS, iss/aud/tid/exp).
// - Maps App Role values in the `roles` claim to SalesFlow roles; a user may hold several.
// - On-Behalf-Of: exchanges the user's API token for a delegated Graph token (Workbook API,
//   calendar) using the Web app registration's certificate — never a client secret in prod.
import { createHash, createPublicKey, createSign, createVerify, randomUUID, type KeyObject } from 'node:crypto'

export type Role = 'sm' | 'head' | 'exec' | 'pmo' | 'pm' | 'ma' | 'admin'
export const APP_ROLE_VALUES: Record<string, Role> = {
  'SalesFlow.SM': 'sm', 'SalesFlow.Head': 'head', 'SalesFlow.Exec': 'exec', 'SalesFlow.PMO': 'pmo',
  'SalesFlow.PM': 'pm', 'SalesFlow.MA': 'ma', 'SalesFlow.Admin': 'admin',
}

export interface Principal { oid: string; name?: string; upn?: string; roles: Role[]; tid: string; teams: string[] }
export class AuthError extends Error { status = 401 }
export class ForbiddenError extends Error { status = 403 }

const b64url = (b: Buffer | string) => Buffer.from(b).toString('base64url')
const parse = (s: string) => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'))

export interface Jwk { kid: string; kty: string; n: string; e: string; x5c?: string[] }
export type KeyResolver = (kid: string) => Promise<KeyObject | undefined>

export function jwksResolver(tenantId: string, f: typeof fetch = fetch, ttlMs = 12 * 3600_000): KeyResolver {
  let cache: { at: number; keys: Map<string, KeyObject> } | undefined
  const load = async () => {
    const res = await f(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`)
    const { keys } = (await res.json()) as { keys: Jwk[] }
    cache = { at: Date.now(), keys: new Map(keys.map((k) => [k.kid, createPublicKey({ key: { kty: k.kty, n: k.n, e: k.e }, format: 'jwk' })])) }
  }
  return async (kid) => {
    if (!cache || Date.now() - cache.at > ttlMs) await load()
    if (!cache!.keys.has(kid)) await load() // key rollover
    return cache!.keys.get(kid)
  }
}

export async function verifyAccessToken(token: string, o: { tenantId: string; audience: string; keys: KeyResolver; now?: number; clockSkewSec?: number }): Promise<Principal> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new AuthError('token ไม่ถูกรูปแบบ')
  const header = parse(parts[0]) as { alg: string; kid: string }
  if (header.alg !== 'RS256') throw new AuthError('alg ไม่รองรับ')
  const key = await o.keys(header.kid)
  if (!key) throw new AuthError('ไม่รู้จัก signing key')
  const v = createVerify('RSA-SHA256')
  v.update(parts[0] + '.' + parts[1])
  if (!v.verify(key, Buffer.from(parts[2], 'base64url'))) throw new AuthError('ลายเซ็นไม่ถูกต้อง')
  const c = parse(parts[1]) as Record<string, unknown>
  const now = Math.floor((o.now ?? Date.now()) / 1000)
  const skew = o.clockSkewSec ?? 300
  if (typeof c.exp !== 'number' || c.exp + skew < now) throw new AuthError('token หมดอายุ')
  if (typeof c.nbf === 'number' && c.nbf - skew > now) throw new AuthError('token ยังไม่เริ่มใช้')
  if (c.tid !== o.tenantId) throw new AuthError('tenant ไม่ถูกต้อง')
  const issOk = c.iss === `https://login.microsoftonline.com/${o.tenantId}/v2.0` || c.iss === `https://sts.windows.net/${o.tenantId}/`
  if (!issOk) throw new AuthError('issuer ไม่ถูกต้อง')
  if (c.aud !== o.audience) throw new AuthError('audience ไม่ถูกต้อง')
  const roles = ((c.roles as string[] | undefined) ?? []).map((r) => APP_ROLE_VALUES[r]).filter((r): r is Role => !!r)
  if (!roles.length) throw new ForbiddenError('บัญชีนี้ยังไม่ได้รับบทบาทใน SalesFlow — ติดต่อผู้ดูแลระบบ')
  return { oid: String(c.oid), name: c.name as string | undefined, upn: (c.preferred_username ?? c.upn) as string | undefined, roles, tid: String(c.tid), teams: [] }
}

export function requireRole(p: Principal, ...allowed: Role[]) {
  if (!p.roles.some((r) => allowed.includes(r))) throw new ForbiddenError(`ต้องมีบทบาท ${allowed.join(' / ')}`)
}

/** Signed client assertion (RFC 7523) with the certificate's x5t#S256 thumbprint. */
export function clientAssertion(o: { tenantId: string; clientId: string; privateKeyPem: string; certDer: Buffer; now?: number }) {
  const now = Math.floor((o.now ?? Date.now()) / 1000)
  const header = { alg: 'PS256', typ: 'JWT', 'x5t#S256': b64url(createHash('sha256').update(o.certDer).digest()) }
  const payload = { aud: `https://login.microsoftonline.com/${o.tenantId}/oauth2/v2.0/token`, iss: o.clientId, sub: o.clientId, jti: randomUUID(), nbf: now, exp: now + 600 }
  const input = b64url(JSON.stringify(header)) + '.' + b64url(JSON.stringify(payload))
  const s = createSign('RSA-SHA256')
  s.update(input)
  const sig = s.sign({ key: o.privateKeyPem, padding: 6 /* RSA_PKCS1_PSS_PADDING */, saltLength: 32 })
  return input + '.' + b64url(sig)
}

export async function onBehalfOf(o: { tenantId: string; clientId: string; assertion: string; userToken: string; scopes: string[]; fetch?: typeof fetch }) {
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    client_id: o.clientId,
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: o.assertion,
    assertion: o.userToken,
    scope: o.scopes.join(' '),
    requested_token_use: 'on_behalf_of',
  })
  const res = await (o.fetch ?? fetch)(`https://login.microsoftonline.com/${o.tenantId}/oauth2/v2.0/token`, { method: 'POST', body })
  const j = (await res.json()) as { access_token?: string; error?: string; error_description?: string }
  if (!res.ok || !j.access_token) throw new AuthError(j.error === 'interaction_required' ? 'ต้องเข้าสู่ระบบใหม่เพื่อให้สิทธิ์ Excel' : `OBO ล้มเหลว: ${j.error}`)
  return { kind: 'delegated' as const, value: j.access_token }
}
