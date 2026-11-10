import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Project } from '../../src/data/model.ts'
import { dailyJobs } from '../../src/domain/scheduler.ts'

const proj = (o: Partial<Project>): Project => ({
  id: 'p', code: 'C', name: 'P', customer: '', endUser: '', type: 'NNS', stage: 'warranty', team: 'DT4-LC', revenue: 1, cost: 1, budget: 1,
  sm: 'rk', sales: ['S'], collaborators: [], nextStep: '', cover: '', history: [], ...o,
})
const opts = { headOf: () => 'sw', maLead: 'wm' }

test('renewal notices: round 1 at 90 days to the customer from the MA mailbox, round 2 at 30 days to the head', () => {
  const p = proj({ endWarranty: '2027-01-31', pmPlan: { cycle: 3, first: '2026-05-01', leadDays: 14, template: 't', customerEmail: 'it@x.go.th' } })
  let { jobs } = dailyJobs([p], [], [], '2026-11-06', opts)
  const r1 = jobs.find((j) => j.rule === 'renew')!
  assert.equal(r1.mail?.to, 'it@x.go.th')
  assert.equal(r1.mail?.from, 'ma-support@stream.co.th')
  r1.apply!(p)
  ;({ jobs } = dailyJobs([p], [], [], '2026-11-06', opts))
  assert.equal(jobs.filter((j) => j.rule === 'renew').length, 0, 'round 1 is not sent twice')
  ;({ jobs } = dailyJobs([p], [], [], '2027-01-05', opts))
  assert.equal(jobs.find((j) => j.rule === 'renew')?.to, 'sw')
})

test('quotation expiry, bid result reminder, SLA and weekly report rules', () => {
  const quote = proj({ id: 'q', stage: 'forecast', approval: { version: 'v1', submittedAt: '', status: 'approved', validUntil: '2026-11-15', steps: [{ who: 'a', role: 'r', status: 'approved' }] } as never })
  const bid = proj({ id: 'b', stage: 'rebidding', bid: { method: 'e-bidding', resultDue: '2026-11-07' } })
  const { jobs, reports } = dailyJobs([quote, bid], [{ id: 'T1', project: 'q', title: 'x', used: 85, paused: false, severity: 'P2' }, { id: 'T2', project: 'q', title: 'y', used: 90, paused: true, severity: 'P2' }], [], '2026-11-06', { ...opts, forceWeekly: true })
  assert.deepEqual(jobs.map((j) => j.rule).sort(), ['bid', 'quote', 'sla'])
  assert.equal(reports.length, 0, 'no delivery projects with a workspace')
})
