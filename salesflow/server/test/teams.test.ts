import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Team } from '../../src/data/model.ts'
import { diffTeam, validateTeam } from '../../src/domain/teams.ts'

const ALL: Team[] = [{ code: 'DT4-LC', name: 'Low Code', group: 'DT4', kind: 'sales', target: 40 }]

test('new team needs a unique, well-formed code, a name, a group and a target for sales teams', () => {
  assert.deepEqual(Object.keys(validateTeam({ code: 'dt4-lc', name: 'x', group: 'DT4', kind: 'support' }, ALL, true)), ['code'])
  assert.ok(validateTeam({ code: 'DT 4', name: 'x', group: 'DT4', kind: 'support' }, ALL, true).code)
  assert.ok(validateTeam({ code: 'DT4-DA', name: 'Data', group: 'DT4', kind: 'sales', target: 0 }, ALL, true).target)
  assert.deepEqual(validateTeam({ code: 'DT4-DA', name: 'Data', group: 'DT4', kind: 'sales', target: 10, headcount: 4 }, ALL, true), {})
})

test('editing keeps its own code valid', () => {
  assert.deepEqual(validateTeam({ ...ALL[0] }, ALL, false), {})
})

test('diff lists only changed fields with readable values', () => {
  const d = diffTeam(ALL[0], { ...ALL[0], name: 'Low Code Platform', target: 45, head: 'dl' }, (id) => (id === 'dl' ? 'Somkiat L.' : ''))
  assert.deepEqual(d.map((c) => c.field), ['ชื่อทีม', 'หัวหน้าทีม', 'เป้ายอดขาย'])
  assert.equal(d[1].to, 'Somkiat L.')
  assert.equal(diffTeam(ALL[0], { ...ALL[0], active: false })[0].to, 'ปิดใช้งาน')
})
