import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canSeeLeave, canSeeMeeting, projectTeam } from '../../src/domain/calendarAccess.ts'
import type { Meeting, Person, Project } from '../../src/data/model.ts'

const P = (id: string, team: string, role = 'dev'): Person => ({ id, name: id, initials: id, role, team, color: '' } as Person)
const rk = P('rk', 'DT4-LC', 'sm'), sw = P('sw', 'DT4', 'head'), ak = P('ak', 'DT3-3', 'pm'), ks = P('ks', 'DT3-3', 'pm')
const dev2 = P('dev2', 'DT4-LC'), dev3 = P('dev3', 'DT4-LC'), dev4 = P('dev4', 'DT4-AI'), dev9 = P('dev9', 'DT1'), tc = P('tc', 'DT-EXEC', 'exec')

test('leave: own always; SM only own; head whole group; others own team; executives everyone', () => {
  assert.equal(canSeeLeave(rk, 'sm', rk), true)
  assert.equal(canSeeLeave(rk, 'sm', dev2), false)
  assert.equal(canSeeLeave(sw, 'head', dev4), true)
  assert.equal(canSeeLeave(sw, 'head', dev9), false)
  assert.equal(canSeeLeave(dev2, 'dev', dev3), true)
  assert.equal(canSeeLeave(dev2, 'dev', dev4), false)
  assert.equal(canSeeLeave(tc, 'exec', dev9), true)
})

test('PM sees PM-team leave and the people on projects they run, nobody else', () => {
  const projects = [{ id: 'p', pm: 'ak', workspace: { members: [{ userId: 'dev2' }] } }] as unknown as Project[]
  const team = projectTeam('ak', projects)
  assert.equal(canSeeLeave(ak, 'pm', ks, team), true)
  assert.equal(canSeeLeave(ak, 'pm', dev2, team), true)
  assert.equal(canSeeLeave(ak, 'pm', dev4, team), false)
})

test('meetings: only the ones you attend or own, unless you supervise the project', () => {
  const p = { sm: 'rk', pm: 'ak' } as Project
  const m = { attendees: ['dev2'], by: 'ak' } as Meeting
  assert.equal(canSeeMeeting('dev2', 'dev', m, p), true)
  assert.equal(canSeeMeeting('dev3', 'dev', m, p), false)
  assert.equal(canSeeMeeting('rk', 'sm', m, p), true)
  assert.equal(canSeeMeeting('np', 'sm', m, p), false)
  assert.equal(canSeeMeeting('sw', 'head', m, p), true)
})
