import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Project, Task } from '../../src/data/model.ts'
import {
  addWorklog, allowedTargets, burndown, canMove, completeSprint, defaultAutomation, defaultWorkflow, moveItem, statusOf, syncMilestones, velocity,
} from '../../src/domain/workflow.ts'

const t = (o: Partial<Task>): Task => ({ id: 'x', key: 'K-1', title: 'x', assignee: 'dev1', reporter: 'ak', status: 'todo', due: '', hours: 8, spent: 0, milestone: '', ...o })
const proj = (tasks: Task[], o: Partial<Project> = {}): Project => {
  const wf = defaultWorkflow('milestone')
  return {
    id: 'p', code: 'C', name: 'P', customer: '', endUser: '', type: 'พัฒนาระบบ', stage: 'delivery', team: 'DT4-LC', revenue: 1, cost: 1, budget: 1,
    sm: 'rk', sales: ['S'], pm: 'ak', collaborators: [], nextStep: '', cover: '', history: [], tasks,
    workspace: {
      template: 'milestone', key: 'K', nextNo: 9, createdAt: '2026-09-01', workflow: wf, automation: defaultAutomation(wf), estimate: 'hours', hourlyRate: 600,
      members: [{ userId: 'ak', role: 'pm' }, { userId: 'dev1', role: 'dev' }, { userId: 'qa1', role: 'qa' }, { userId: 'qa2', role: 'qa' }, { userId: 'pj', role: 'viewer' }],
    },
    ...o,
  }
}

test('default workflow: one step forward, any step back, Done only by QA / PM / lead', () => {
  const a = t({ statusId: 'doing', status: 'doing' })
  const p = proj([a])
  assert.equal(canMove(p, a, 'review', 'dev1').ok, true)
  assert.equal(canMove(p, a, 'qa', 'dev1').ok, false, 'cannot skip Code Review')
  assert.equal(canMove(p, a, 'todo', 'dev1').ok, true, 'can always go back')
  const u = t({ statusId: 'uat', status: 'review' })
  const p2 = proj([u])
  assert.match(canMove(p2, u, 'done', 'dev1').reason ?? '', /เฉพาะ/)
  assert.equal(canMove(p2, u, 'done', 'qa1').ok, true)
  assert.equal(canMove(p2, u, 'done', 'zz', { isAdmin: true }).ok, true, 'admin overrides')
})

test('non-members and viewers cannot move; allowedTargets mirrors canMove', () => {
  const a = t({ statusId: 'todo' })
  const p = proj([a])
  assert.equal(canMove(p, a, 'doing', 'stranger').ok, false)
  assert.equal(canMove(p, a, 'doing', 'pj').ok, false)
  assert.deepEqual(allowedTargets(p, a, 'dev1').map((s) => s.id), ['todo', 'doing'])
})

test('Definition of Done blocks Done until every acceptance criterion is ticked', () => {
  const a = t({ statusId: 'uat', status: 'review', acceptance: [{ text: 'a', done: true }, { text: 'b', done: false }] })
  const p = proj([a])
  assert.match(canMove(p, a, 'done', 'qa1').reason ?? '', /Acceptance/)
  a.acceptance![1].done = true
  assert.equal(canMove(p, a, 'done', 'qa1').ok, true)
})

test('WIP limit counts other items already in the column', () => {
  const p = proj([t({ id: 'a', statusId: 'doing' }), t({ id: 'b', statusId: 'todo' })])
  p.workspace!.workflow!.statuses.find((s) => s.id === 'doing')!.wipLimit = 1
  assert.match(canMove(p, p.tasks![1], 'doing', 'dev1').reason ?? '', /เต็ม/)
})

test('moveItem records history + activity, keeps the category, and runs automation (assign least-loaded QA, notify)', () => {
  const a = t({ id: 'a', statusId: 'qa', status: 'review' })
  const busy = t({ id: 'b', assignee: 'qa1', statusId: 'doing', status: 'doing' })
  const item = t({ id: 'c', statusId: 'review', status: 'review' })
  const p = proj([a, busy, item])
  const r = moveItem(p, item, 'readyqa', 'dev1', '2026-11-06')
  assert.equal(r.ok, true)
  assert.equal(item.status, 'review')
  assert.equal(statusOf(p, item).name, 'Ready for QA')
  assert.equal(item.assignee, 'qa2', 'qa1 already has open work')
  assert.equal(item.history?.find((h) => h.field === 'สถานะ')?.to, 'Ready for QA')
  assert.equal(item.history?.find((h) => h.field === 'ผู้รับผิดชอบ')?.who, 'automation')
  assert.deepEqual(r.notices.map((n) => n.to), ['qa2'])
  assert.equal(p.workspace!.activity?.[0].text, 'เปลี่ยนสถานะเป็น Ready for QA')
  const fail = moveItem(p, item, 'done', 'dev1', '2026-11-06')
  assert.equal(fail.ok, false)
  assert.equal(statusOf(p, item).id, 'readyqa', 'a refused move changes nothing')
})

test('items without statusId fall back to the first status of their category', () => {
  const p = proj([t({ status: 'review' })])
  assert.equal(statusOf(p, p.tasks![0]).id, 'review')
})

test('worklog adds spent hours; overtime raises a pending OT request at the workspace rate', () => {
  const a = t({})
  const p = proj([a])
  addWorklog(p, a, 'dev1', '2026-11-05', 3, false, '', '2026-11-05')
  addWorklog(p, a, 'dev1', '2026-11-05', 4, true, 'เร่ง UAT', '2026-11-05')
  assert.equal(a.spent, 7)
  assert.equal(a.worklogs?.length, 2)
  assert.equal(p.ot?.length, 1)
  assert.equal(p.ot?.[0].amount, 2400)
  assert.equal(p.ot?.[0].status, 'pending')
})

test('epic progress drives the contract milestone; all epics done marks it delivered', () => {
  const e = t({ id: 'e', type: 'epic', milestone: 'M1', status: 'doing' })
  const k1 = t({ id: 'k1', milestone: 'M1', status: 'done' })
  const k2 = t({ id: 'k2', milestone: 'M1', status: 'todo' })
  const p = proj([e, k1, k2], { milestones: [{ name: 'M1', start: '2026-09-01', end: '2026-10-01', progress: 0, payment: 1, state: 'planned' }] })
  syncMilestones(p)
  assert.equal(p.milestones![0].progress, 50)
  e.status = 'done'; k2.status = 'done'
  syncMilestones(p)
  assert.equal(p.milestones![0].state, 'delivered')
})

test('burndown uses the day each item reached Done; velocity and complete-sprint snapshot sizes', () => {
  const wf = defaultWorkflow('scrum')
  const done = (day: string) => [{ at: '', day, who: 'qa1', field: 'สถานะ', from: 'QA', to: 'Done' }]
  const items = [
    t({ id: 'a', sprint: 's1', storyPoints: 5, status: 'done', statusId: 'done', history: done('2026-11-03') }),
    t({ id: 'b', sprint: 's1', storyPoints: 3, status: 'doing', statusId: 'doing' }),
    t({ id: 'c', sprint: 's1', storyPoints: 2, status: 'done', statusId: 'done', history: done('2026-11-05') }),
  ]
  const p = proj(items)
  Object.assign(p.workspace!, { template: 'scrum', workflow: wf, estimate: 'points', sprints: [{ id: 's1', name: 'S1', start: '2026-11-02', end: '2026-11-06', state: 'active' }, { id: 's2', name: 'S2', start: '2026-11-09', end: '2026-11-13', state: 'planned' }] })
  const bd = burndown(p, p.workspace!.sprints![0], '2026-11-05')
  assert.equal(bd.total, 10)
  assert.deepEqual(bd.points.map((x) => x.remaining), [10, 5, 5, 3, undefined])
  assert.equal(bd.points[0].ideal, 10)
  assert.equal(bd.points[4].ideal, 0)
  const r = completeSprint(p, 's1', 's2', 'ak', '2026-11-06')
  assert.deepEqual(r, { done: 2, open: 1 })
  assert.equal(items[1].sprint, 's2')
  assert.deepEqual(velocity(p), [{ name: 'S1', committed: 10, completed: 7 }])
})
