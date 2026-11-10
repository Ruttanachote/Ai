import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Project, Task } from '../../src/data/model.ts'
import { tree, matches, emptyFilter, newItem, createWorkspace, suggestKey, groupKey, record } from '../../src/domain/work.ts'
import { lateTasks } from '../../src/domain/metrics.ts'

const proj = (o: Partial<Project> = {}): Project => ({
  id: 'p', code: 'WIN-1', name: 'Smart Permit Platform', customer: '', endUser: '', type: 'NNS', stage: 'delivery', team: 'DT4-LC',
  revenue: 1, cost: 1, budget: 1, sm: 'rk', sales: ['S'], collaborators: [], nextStep: '', cover: '', history: [], ...o,
})
const t = (o: Partial<Task>): Task => ({ id: 'x', title: 'x', assignee: '', status: 'todo', due: '2026-11-10', hours: 0, spent: 0, milestone: '', ...o })

test('list hierarchy: epic → story → sub-task, ordered by key number', () => {
  const list = [t({ id: 's', key: 'K-3', parentId: 'st' }), t({ id: 'e', key: 'K-1', type: 'epic' }), t({ id: 'st', key: 'K-2', parentId: 'e' }), t({ id: 'o', key: 'K-4' })]
  assert.deepEqual(tree(list).map((r) => `${r.t.key}:${r.depth}`), ['K-1:0', 'K-2:1', 'K-3:2', 'K-4:0'])
  // a child whose parent is filtered out is promoted to the top level, not lost
  assert.deepEqual(tree(list.filter((x) => x.id !== 'e')).map((r) => r.t.key), ['K-2', 'K-3', 'K-4'])
})

test('filters combine search, assignee, type, status and priority', () => {
  const a = t({ id: 'a', key: 'SPP-5', title: 'Thai QR', assignee: 'dev3', type: 'task', priority: 'highest', status: 'doing', labels: ['integration'] })
  const f = emptyFilter()
  assert.equal(matches(a, { ...f, q: 'spp-5' }), true)
  assert.equal(matches(a, { ...f, q: 'integration' }), true)
  assert.equal(matches(a, { ...f, assignees: ['dev1'] }), false)
  assert.equal(matches(a, { ...f, types: ['bug'] }), false)
  assert.equal(matches(a, { ...f, statuses: ['doing'], priorities: ['highest'] }), true)
  assert.equal(groupKey(a, 'assignee'), 'dev3')
})

test('workspace: key suggestion, milestone seeding, running keys, activity', () => {
  const p = proj({ milestones: [{ name: 'งวด 1', start: '2026-07-01', end: '2026-07-31', progress: 0 }, { name: 'งวด 2', start: '2026-08-01', end: '2026-09-30', progress: 0 }], pm: 'ak' })
  assert.equal(suggestKey(p), 'SPP')
  createWorkspace(p, 'milestone', 'SPP', 'ak', '2026-11-09')
  assert.deepEqual(p.tasks!.map((x) => `${x.key}:${x.type}:${x.due}`), ['SPP-1:epic:2026-07-31', 'SPP-2:epic:2026-09-30'])
  const n = newItem(p, { title: 'งานใหม่' }, 'ak', '2026-11-09')
  assert.equal(n.key, 'SPP-3')
  assert.equal(n.due, '')
  record(p, 'ak', n, 'สร้างงาน', '2026-11-09')
  assert.equal(p.workspace!.activity![0].key, 'SPP-3')
  const s = proj({ name: 'ระบบ OCR' })
  createWorkspace(s, 'scrum', 'OCR', 'ks', '2026-11-09')
  assert.deepEqual(s.workspace!.sprints!.map((x) => `${x.start}..${x.end}`), ['2026-11-09..2026-11-22', '2026-11-23..2026-12-06'])
})

test('unscheduled items are never counted as late', () => {
  const p = proj({ tasks: [t({ id: 'a', due: '' }), t({ id: 'b', due: '2026-11-01' }), t({ id: 'c', due: '2026-11-01', status: 'done' })] })
  assert.deepEqual(lateTasks(p, '2026-11-09').map((x) => x.id), ['b'])
})
