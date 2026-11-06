import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, createSign, type KeyObject } from 'node:crypto'
import { GraphClient, GraphError } from '../src/graph/client.ts'
import { submit, decide, recall, markStaleIfChanged, expireIfDue, canSendQuotation, snapshotHash, processDelta, archiveSubmittedCopy, ApprovalRuleError } from '../src/approval/approval.ts'
import { MemoryOutbox, enqueue, dispatch, approvalEmail } from '../src/mail/outbox.ts'
import { renderQuotationHtml, bahtText, quotationTotals, renderQuotationPdf, type QuotationData } from '../src/pdf/quotation.ts'
import { handoverEventBody, adaptiveCardMessage } from '../src/teams/handover.ts'
import { verifyAccessToken, requireRole, AuthError, ForbiddenError } from '../src/auth/auth.ts'
import { handle, type Deps } from '../src/http/app.ts'

const fake = (h: (url: string, init: RequestInit) => Response | Promise<Response>) => (async (u: string | URL | Request, i?: RequestInit) => h(String(u), i ?? {})) as typeof fetch
const summary = { revenue: 10_000_000, cost: 7_000_000, gp: 30, otReserve: 1, templateVersion: '2569.2', source: 'workbook-api' as const }
const newReq = () => submit({ id: 'a1', projectId: 'p2', previousVersion: 2, submittedBy: 'sm1', summary, driveId: 'd', itemId: 'i', spVersionId: '7.0', eTag: 'e1', approverIds: ['head1', 'exec1'], now: '2026-11-06' })

/* ---------------- P0-2 approvals ---------------- */

test('submit captures version, eTag, hash, archive path and validity', () => {
  const r = newReq()
  assert.equal(r.version, 3)
  assert.equal(r.archivedPath, 'Cost Sheet/Submitted/v3.xlsx')
  assert.equal(r.validUntil, '2027-01-05')
  assert.equal(r.snapshotHash, snapshotHash({ revenue: 10_000_000, cost: 7_000_000, gp: 30, templateVersion: '2569.2', spVersionId: '7.0' }))
  assert.equal(snapshotHash({ b: 1, a: 2 }), snapshotHash({ a: 2, b: 1 }))
  assert.throws(() => submit({ ...{ id: 'x', projectId: 'p', previousVersion: 0, summary, driveId: 'd', itemId: 'i', spVersionId: '1', eTag: 'e', now: '2026-11-06' }, submittedBy: 'u', approverIds: ['u'] }), ApprovalRuleError)
})

test('submitter cannot approve; steps run in order; delegate acts on behalf', () => {
  const r = newReq()
  assert.throws(() => decide(r, 'sm1', 'approve', 't'), /ของตัวเอง/)
  assert.throws(() => decide(r, 'exec1', 'approve', 't'), /ไม่ใช่ผู้อนุมัติ/)
  decide(r, 'head1', 'approve', 't')
  r.steps[1].delegateId = 'deputy'
  decide(r, 'deputy', 'approve', 't', { channel: 'email_link' })
  assert.equal(r.status, 'approved')
  assert.equal(r.events.at(-1)!.onBehalfOf, 'exec1')
  assert.equal(canSendQuotation(r, '2026-12-01'), true)
})

test('reject needs a note; recall only by submitter while pending', () => {
  const r = newReq()
  assert.throws(() => decide(r, 'head1', 'reject', 't'), /เหตุผล/)
  assert.throws(() => recall(r, 'head1', 't'), /ผู้ส่ง/)
  recall(r, 'sm1', 't')
  assert.equal(r.status, 'recalled')
})

test('a newer workbook version makes the approval stale; expiry blocks sending', () => {
  const r = newReq()
  decide(r, 'head1', 'approve', 't'); decide(r, 'exec1', 'approve', 't')
  assert.equal(markStaleIfChanged(r, { itemId: 'i', eTag: 'e1' }, 't'), false)
  assert.equal(markStaleIfChanged(r, { itemId: 'other', eTag: 'e9' }, 't'), false)
  assert.equal(markStaleIfChanged(r, { itemId: 'i', eTag: 'e2' }, 't'), true)
  assert.equal(canSendQuotation(r, '2026-12-01'), false)
  const r2 = newReq(); decide(r2, 'head1', 'approve', 't'); decide(r2, 'exec1', 'approve', 't')
  assert.equal(expireIfDue(r2, '2027-02-01'), true)
  assert.equal(canSendQuotation(r2, '2027-02-01'), false)
})

test('delta feed walks pages and stales matching approvals', async () => {
  const r = newReq()
  const pages: Record<string, unknown> = {
    'https://g/delta?1': { value: [{ id: 'x', eTag: 'q' }], '@odata.nextLink': 'https://g/delta?2' },
    'https://g/delta?2': { value: [{ id: 'i', eTag: 'e2' }], '@odata.deltaLink': 'https://g/delta?3' },
  }
  const g = new GraphClient({ fetch: fake((u) => new Response(JSON.stringify(pages[u]), { headers: { 'content-type': 'application/json' } })) })
  const out = await processDelta(g, 'app', 'https://g/delta?1', [r], 't')
  assert.deepEqual(out, { deltaLink: 'https://g/delta?3', staled: ['a1'] })
})

test('archive copy polls the monitor URL then applies the retention label', async () => {
  const seen: string[] = []
  const g = new GraphClient({ sleep: async () => {}, fetch: fake((u, i) => {
    seen.push(`${i.method ?? 'GET'} ${u}`)
    if (u.includes('/copy')) return new Response(null, { status: 202, headers: { Location: 'https://monitor/1' } })
    if (u === 'https://monitor/1') return new Response(JSON.stringify({ status: 'completed', resourceId: 'new1' }))
    return new Response(JSON.stringify({}), { headers: { 'content-type': 'application/json' } })
  }) })
  assert.equal(await archiveSubmittedCopy(g, 'app', newReq(), 'folder', 'SalesFlow Approved Quote'), 'new1')
  assert.ok(seen.some((s) => s.startsWith('PATCH') && s.endsWith('/items/new1/retentionLabel')))
})

/* ---------------- P0-5/6 mail outbox ---------------- */

test('outbox dedupes, sends from the shared mailbox, and backs off on throttling', async () => {
  const store = new MemoryOutbox()
  const mail = approvalEmail({ approverName: 'Supawadee', projectCode: 'PIP-1', projectName: 'e-Service', customer: 'กรม', revenue: '฿1', gp: '30%', version: 'v3', link: 'https://salesflow/#/approvals?req=a1', dueText: '9 พ.ย.' })
  assert.ok(mail.html.includes('https://salesflow/#/approvals?req=a1'))
  assert.equal(enqueue(store, { id: 'm1', dedupeKey: 'approval:a1:step1', to: ['h@x'], ...mail }, 0), true)
  assert.equal(enqueue(store, { id: 'm2', dedupeKey: 'approval:a1:step1', to: ['h@x'], ...mail }, 0), false)
  let n = 0
  const urls: string[] = []
  const g = new GraphClient({ maxRetries: 0, sleep: async () => {}, fetch: fake((u) => { urls.push(u); return ++n === 1 ? new Response('', { status: 503 }) : new Response(null, { status: 202 }) }) })
  await dispatch(g, store, 'app', 'salesflow@stream.co.th', 0)
  const row = store.rows.get('m1')!
  assert.equal(row.status, 'pending')
  assert.equal(row.nextAttemptAt, 60_000)
  await dispatch(g, store, 'app', 'salesflow@stream.co.th', 60_000)
  assert.equal(store.rows.get('m1')!.status, 'sent')
  assert.ok(urls.every((u) => u.endsWith('/users/salesflow%40stream.co.th/sendMail')))
})

test('permanent Graph errors fail the message without retry', async () => {
  const store = new MemoryOutbox()
  enqueue(store, { id: 'm', dedupeKey: 'k', to: ['a@x'], subject: 's', html: 'h' }, 0)
  const g = new GraphClient({ fetch: fake(() => new Response(JSON.stringify({ error: { code: 'ErrorAccessDenied', message: 'scope' } }), { status: 403 })) })
  await dispatch(g, store, 'app', 'salesflow@x', 0)
  assert.equal(store.rows.get('m')!.status, 'failed')
  assert.ok(new GraphError(403, 'x', 'y').message.includes('403'))
})

/* ---------------- P0-4 quotation ---------------- */

const q: QuotationData = {
  number: 'QT-PIP-69-0098-v3', issueDate: '6 พ.ย. 2569', validDays: 60, customer: { name: 'กรมส่งเสริมการค้าดิจิทัล', taxId: '0994000000000' },
  projectName: 'ระบบ e-Service <ใบอนุญาต>', paymentTerms: '5 งวดตาม Milestone', approvedVersion: 'v3', snapshotHash: 'abcdef1234567890',
  company: { name: 'Stream Co., Ltd.', taxId: '0105500000000', address: 'Bangkok' },
  items: [{ description: 'พัฒนาระบบ e-Service', qty: 1, unit: 'งาน', unitPrice: 15_000_000 }, { description: 'Server และ License', qty: 1, unit: 'ชุด', unitPrice: 3_400_000 }],
}

test('quotation HTML shows customer-facing figures only and escapes input', () => {
  const html = renderQuotationHtml(q)
  assert.ok(html.includes('18,400,000.00'))
  assert.ok(html.includes('1,288,000.00'))
  assert.ok(!/COGS|Cost Sheet|ต้นทุน|OT/.test(html))
  assert.ok(html.includes('&lt;ใบอนุญาต&gt;'))
  assert.equal(quotationTotals(q.items).total, 19_688_000)
})

test('Thai baht text', () => {
  assert.equal(bahtText(19_688_000), 'สิบเก้าล้านหกแสนแปดหมื่นแปดพันบาทถ้วน')
  assert.equal(bahtText(121.5), 'หนึ่งร้อยยี่สิบเอ็ดบาทห้าสิบสตางค์')
  assert.equal(bahtText(11), 'สิบเอ็ดบาทถ้วน')
})

test('quotation renders to a real PDF with headless Chromium', async (t) => {
  let pdf: Buffer
  try { pdf = await renderQuotationPdf(q) } catch (e) { t.skip(`Chromium ไม่พร้อม: ${(e as Error).message}`); return }
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-')
  assert.ok(pdf.length > 5_000)
})

/* ---------------- P0-5 handover meeting ---------------- */

test('handover meeting is a calendar event with a Teams link; channel notice is an Adaptive Card', () => {
  const b = handoverEventBody({ subject: 'Handover', startIso: '2026-11-10T10:00:00', endIso: '2026-11-10T11:00:00', attendees: [{ email: 'pm@x' }, { email: 'sale@x', optional: true }], agendaHtml: '<p>x</p>' })
  assert.equal(b.isOnlineMeeting, true)
  assert.equal(b.onlineMeetingProvider, 'teamsForBusiness')
  assert.equal(b.attendees[1].type, 'optional')
  const card = adaptiveCardMessage('ชนะงาน', [['มูลค่า', '฿9.6M']], 'https://salesflow')
  assert.equal(card.attachments[0].content.version, '1.4')
})

/* ---------------- P0-6 token validation ---------------- */

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const sign = (claims: object, key: KeyObject = privateKey, kid = 'k1') => {
  const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const input = enc({ alg: 'RS256', kid }) + '.' + enc(claims)
  const s = createSign('RSA-SHA256'); s.update(input)
  return input + '.' + s.sign(key).toString('base64url')
}
const T = 'tenant-1'
const opts = { tenantId: T, audience: 'api://salesflow', keys: async (kid: string) => (kid === 'k1' ? publicKey : undefined), now: 1_800_000_000_000 }
const claims = (o: object = {}) => ({ tid: T, iss: `https://login.microsoftonline.com/${T}/v2.0`, aud: 'api://salesflow', exp: 1_800_000_600, nbf: 1_799_999_000, oid: 'u1', name: 'RK', roles: ['OnePlatform.SM', 'OnePlatform.Head', 'Other.Role'], ...o })

test('valid token maps App Roles (multi-role) and requireRole enforces them', async () => {
  const p = await verifyAccessToken(sign(claims()), opts)
  assert.deepEqual(p.roles, ['sm', 'head'])
  requireRole(p, 'head')
  assert.throws(() => requireRole(p, 'admin'), ForbiddenError)
})

test('rejects bad signature, wrong audience/tenant, expiry, and users without a role', async () => {
  const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey
  await assert.rejects(verifyAccessToken(sign(claims(), other), opts), AuthError)
  await assert.rejects(verifyAccessToken(sign(claims({ aud: 'api://other' })), opts), /audience/)
  await assert.rejects(verifyAccessToken(sign(claims({ tid: 'evil' })), opts), /tenant/)
  await assert.rejects(verifyAccessToken(sign(claims({ exp: 1_700_000_000 })), opts), /หมดอายุ/)
  await assert.rejects(verifyAccessToken(sign(claims({ roles: [] })), opts), ForbiddenError)
})

/* ---------------- HTTP surface ---------------- */

test('API enforces shared rules and Graph webhook validation', async () => {
  const deps: Deps = {
    authenticate: async (h) => { if (!h) throw new AuthError('no token'); return { oid: 'sm1', roles: ['sm'], tid: T, teams: [] } },
    projects: new Map([['p', { id: 'p', code: 'C', name: 'X', customer: '', endUser: '', type: 'MA', stage: 'rebidding', team: 'DT2', revenue: 1, cost: 1, budget: 1, sm: 'sm1', sales: [], collaborators: [], nextStep: '', cover: '', history: [] }]]),
    approvals: new Map([['a1', newReq()]]),
    today: () => '2026-11-06', now: () => '2026-11-06T10:00:00Z', clientState: 'secret',
    onDriveNotification: () => {}, settings: { tolerancePct: 2, gpDropPct: 3 }, hasContractFile: async () => true,
  }
  const q0 = new URLSearchParams()
  const v = await handle(deps, { method: 'POST', path: '/api/graph/notifications', headers: {}, query: new URLSearchParams({ validationToken: 'abc' }) })
  assert.deepEqual([v.status, v.body], [200, 'abc'])
  assert.equal((await handle(deps, { method: 'POST', path: '/api/graph/notifications', headers: {}, query: q0, body: { value: [{ clientState: 'x', resource: 'r' }] } })).status, 401)
  assert.equal((await handle(deps, { method: 'POST', path: '/api/projects/p/move', headers: {}, query: q0, body: { to: 'lose' } })).status, 401)
  const bad = await handle(deps, { method: 'POST', path: '/api/projects/p/move', headers: { authorization: 'Bearer x' }, query: q0, body: { to: 'lose', gateChecked: false } })
  assert.equal(bad.status, 422)
  const good = await handle(deps, { method: 'POST', path: '/api/projects/p/move', headers: { authorization: 'Bearer x' }, query: q0, body: { to: 'lose', gateChecked: false, loss: { code: 'ลูกค้าตัดงบ / ยกเลิกโครงการ' } } })
  assert.equal(good.status, 200)
  const self = await handle(deps, { method: 'POST', path: '/api/approvals/a1/approve', headers: { authorization: 'Bearer x' }, query: q0 })
  assert.equal(self.status, 403)
  // an SM cannot move a project out of Handover — that is PMO/PM work
  deps.projects.get('p')!.stage = 'handover'
  const pmOnly = await handle(deps, { method: 'POST', path: '/api/projects/p/move', headers: { authorization: 'Bearer x' }, query: q0, body: { to: 'delivery', gateChecked: true } })
  assert.equal(pmOnly.status, 403)
})
