import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Leave, Project, Task } from '../../src/data/model.ts'
import { awayOn, findImpacts, firstDayBack, leaveLength, overlaps, suggestStandIn, unresolved } from '../../src/domain/leave.ts'

const t = (o: Partial<Task>): Task => ({ id: 'x', key: 'K-1', title: 'x', assignee: 'dev1', status: 'todo', due: '2026-11-20', hours: 8, spent: 0, milestone: '', ...o })
const p = (tasks: Task[]): Project => ({
  id: 'p', code: 'C', name: 'P', customer: '', endUser: '', type: 'พัฒนาระบบ', stage: 'delivery', team: 'DT4-LC', revenue: 1, cost: 1, budget: 1,
  sm: 'rk', sales: ['S'], pm: 'ak', collaborators: [], nextStep: '', cover: '', history: [], tasks,
  workspace: { template: 'milestone', key: 'K', nextNo: 9, createdAt: '2026-09-01', members: [{ userId: 'dev1', role: 'dev' }, { userId: 'dev2', role: 'dev' }, { userId: 'dev3', role: 'dev' }, { userId: 'qa1', role: 'qa' }] },
})
const lv = (o: Partial<Leave>): Leave => ({ id: 'l', who: 'dev1', from: '2026-11-16', to: '2026-11-17', part: 'full', type: 'vacation', createdAt: '2026-11-10', status: 'active', impacts: [], log: [], ...o })

test('leave length counts working days only; half day = 0.5', () => {
  assert.equal(leaveLength({ from: '2026-11-13', to: '2026-11-16', part: 'full' }), 2, 'Fri + Mon, weekend skipped')
  assert.equal(leaveLength({ from: '2026-11-16', to: '2026-11-16', part: 'am' }), 0.5)
  assert.equal(leaveLength({ from: '2026-12-05', to: '2026-12-07', part: 'full' }), 0, '5 Dec Sat, 6 Sun, 7 Mon = substitute holiday for Father’s Day')
})

test('overlap: open items of the person (or co-assignee) whose start–due window touches the leave', () => {
  assert.equal(overlaps(t({ start: '2026-11-10', due: '2026-11-20' }), 'dev1', '2026-11-16', '2026-11-17'), true)
  assert.equal(overlaps(t({ start: '2026-11-18', due: '2026-11-20' }), 'dev1', '2026-11-16', '2026-11-17'), false)
  assert.equal(overlaps(t({ due: '2026-11-17', status: 'done' }), 'dev1', '2026-11-16', '2026-11-17'), false)
  assert.equal(overlaps(t({ due: '2026-11-17', assignee: 'dev2', coAssignees: ['dev1'] }), 'dev1', '2026-11-16', '2026-11-17'), true)
  assert.equal(overlaps(t({ due: '' }), 'dev1', '2026-11-16', '2026-11-17'), false, 'unscheduled items are not on the timeline')
})

test('impacts: due inside the leave needs a decision, running through it defaults to no impact', () => {
  const list = findImpacts([p([t({ id: 'a', key: 'K-1', due: '2026-11-17' }), t({ id: 'b', key: 'K-2', start: '2026-11-10', due: '2026-11-25' })])], 'dev1', '2026-11-16', '2026-11-17')
  assert.deepEqual(list.map((i) => [i.key, i.action]), [['K-1', 'pending'], ['K-2', 'none']])
  const kept = findImpacts([p([t({ id: 'a', due: '2026-11-17' })])], 'dev1', '2026-11-16', '2026-11-18', [{ ...list[0], action: 'move' }])
  assert.equal(kept[0].action, 'move', 'changing the dates keeps decisions already made')
})

test('stand-in: same role, not away, fewest open items', () => {
  const proj = p([t({ id: 'a', assignee: 'dev2', due: '2026-11-30' }), t({ id: 'b', assignee: 'dev2', due: '2026-11-30' }), t({ id: 'c', assignee: 'dev3', due: '2026-11-30' })])
  assert.deepEqual(suggestStandIn(proj, 'dev1', '2026-11-16', '2026-11-17', []).map((s) => s.userId), ['dev3', 'dev2'])
  assert.deepEqual(suggestStandIn(proj, 'dev1', '2026-11-16', '2026-11-17', [lv({ who: 'dev3', from: '2026-11-17', to: '2026-11-17' })]).map((s) => s.userId), ['dev2'])
})

test('first day back skips weekends; awayOn and unresolved', () => {
  assert.equal(firstDayBack('2026-11-13'), '2026-11-16')
  const l = lv({ impacts: [{ projectId: 'p', taskId: 'a', key: 'K-1', title: 'x', due: '2026-11-17', action: 'move', newDue: '2026-11-18' }, { projectId: 'p', taskId: 'b', key: 'K-2', title: 'y', due: '2026-11-17', action: 'before', resolved: true }] })
  assert.equal(awayOn([l], 'dev1', '2026-11-17')?.id, 'l')
  assert.equal(awayOn([{ ...l, status: 'cancelled' }], 'dev1', '2026-11-17'), undefined)
  assert.deepEqual(unresolved(l).map((i) => i.key), ['K-1'])
})
