import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Person, Project } from '../../src/data/model.ts'
import { projectNeeds, rankPms } from '../../src/domain/staffing.ts'

const proj = (o: Partial<Project> = {}): Project => ({
  id: 'p', code: 'C', name: 'P', customer: '', endUser: '', type: 'พัฒนาระบบ', stage: 'win', team: 'DT4-LC', revenue: 1, cost: 1, budget: 1,
  sm: 'rk', sales: ['S'], collaborators: [], nextStep: '', cover: '', history: [], ...o,
})
const pm = (id: string, skills: Person['pmProfile']): Person => ({ id, name: id, initials: id, role: 'pm', color: '', pmProfile: skills })
const SW = pm('sw', { skills: ['software'], onsite: false, maxProjects: 2 })
const HW = pm('hw', { skills: ['hardware', 'network'], onsite: true, maxProjects: 2 })

test('project type decides the skills needed', () => {
  assert.deepEqual(projectNeeds(proj()).skills, ['software'])
  assert.equal(projectNeeds(proj({ type: 'ซื้อขาย' })).onsite, true)
  assert.ok(projectNeeds(proj({ team: 'DT4-IoT' })).skills.includes('iot'))
})

test('hardware project ranks the on-site hardware PM first; software project the software PM', () => {
  assert.equal(rankPms(proj({ type: 'ซื้อขาย' }), [SW, HW], [])[0].pm.id, 'hw')
  assert.equal(rankPms(proj(), [SW, HW], [])[0].pm.id, 'sw')
})

test('a PM at full load drops below the others', () => {
  const busy = [proj({ id: 'a', pm: 'sw', stage: 'delivery' }), proj({ id: 'b', pm: 'sw', stage: 'handover' })]
  const r = rankPms(proj(), [SW, HW], busy)
  assert.equal(r[0].pm.id, 'hw')
  assert.equal(r[1].full, true)
})
