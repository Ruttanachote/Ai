// Team (sub-team) administration: validation and change tracking. Pure functions shared by
// the admin page and the server tests.
import type { Team, TeamChange } from '../data/model.ts'

export const TEAM_KIND: Record<Team['kind'], string> = { sales: 'ทีมขาย / พัฒนา', support: 'ทีมสนับสนุน', exec: 'ผู้บริหาร' }

/** Labels for the fields an admin can change (also used in the history). */
export const TEAM_FIELDS: Record<string, string> = {
  code: 'รหัสทีม', name: 'ชื่อทีม', group: 'กลุ่ม', kind: 'ประเภท', head: 'หัวหน้าทีม', target: 'เป้ายอดขาย',
  headcount: 'จำนวนคน', formerly: 'ชื่อเดิม', note: 'รายละเอียด', active: 'สถานะ',
}

/** Problems with a team form; empty when it can be saved. */
export function validateTeam(t: Partial<Team>, all: Team[], isNew: boolean): Record<string, string> {
  const e: Record<string, string> = {}
  const code = (t.code ?? '').trim()
  if (!code) e.code = 'ระบุรหัสทีม'
  else if (!/^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/.test(code)) e.code = 'ใช้ตัวอักษรอังกฤษ ตัวเลข และขีด (-) เช่น DT4-LC'
  else if (isNew && all.some((x) => x.code.toLowerCase() === code.toLowerCase())) e.code = `มีรหัส ${code} อยู่แล้ว`
  if (!(t.name ?? '').trim()) e.name = 'ระบุชื่อทีม'
  if (!t.group) e.group = 'เลือกกลุ่ม'
  if (t.kind === 'sales' && !(Number(t.target) > 0)) e.target = 'ทีมขายต้องมีเป้ายอดขายมากกว่า 0'
  if (t.headcount !== undefined && (Number(t.headcount) < 0 || !Number.isInteger(Number(t.headcount)))) e.headcount = 'จำนวนคนต้องเป็นจำนวนเต็มไม่ติดลบ'
  return e
}

const show = (k: string, v: unknown, name: (id?: string) => string) =>
  v === undefined || v === '' || v === null ? undefined
  : k === 'head' ? name(v as string)
  : k === 'kind' ? TEAM_KIND[v as Team['kind']]
  : k === 'active' ? (v === false ? 'ปิดใช้งาน' : 'ใช้งาน')
  : k === 'target' ? '฿' + Number(v).toLocaleString('en-US')
  : String(v)

/** Field-by-field differences between two versions of a team. */
export function diffTeam(before: Partial<Team>, after: Partial<Team>, name: (id?: string) => string = (id) => id ?? ''): TeamChange['changes'] {
  return Object.keys(TEAM_FIELDS)
    .filter((k) => (before as Record<string, unknown>)[k] !== (after as Record<string, unknown>)[k] && !(k === 'active' && before.active !== false && after.active !== false))
    .map((k) => ({ field: TEAM_FIELDS[k], from: show(k, (before as Record<string, unknown>)[k], name), to: show(k, (after as Record<string, unknown>)[k], name) }))
}
