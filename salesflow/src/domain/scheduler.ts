// Daily scheduled job (07:00 in production, outbox → Graph mail / Teams). Pure: returns what to
// send; the caller records it. Each item has a stable key so a notice is never sent twice.
import type { Leave, Project, WeeklyReport } from '../data/model.ts'
import { MA_MAILBOX } from '../data/model.ts'
import { approvalState } from './metrics.ts'
import { dueRounds } from './pm.ts'
import { addDays, typeOf } from './work.ts'
import { doneDay } from './workflow.ts'
import { weekOf } from './timesheet.ts'

export interface Ticketish { id: string; project: string; title: string; used: number; paused: boolean; severity: string }
export interface Job {
  key: string; rule: string; to: string; text: string; link: string
  mail?: { to: string; from: string; subject: string; kind: 'email' | 'teams' }
  apply?: (p: Project) => void
  projectId?: string
}
export const RULES: Record<string, string> = {
  quote: 'ใบเสนอราคาใกล้หมดอายุ (14 วัน) / หมดอายุ',
  bid: 'วันประกาศผลประมูล (ล่วงหน้า 1 วัน)',
  renew: 'แจ้งลูกค้าต่อประกัน รอบ 1 (90 วัน) / รอบ 2 (30 วัน)',
  pm: 'รอบ Preventive Maintenance: ถึงเวลาเตรียม / เลยกำหนด',
  sla: 'Ticket ใช้เวลาเกิน 80% ของ SLA / เกิน SLA',
  weekly: 'Weekly report ถึง PM (วันศุกร์)',
  leave: 'แจ้ง PM ก่อนวันลา 1 วัน',
}

const diff = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86_400_000)

export function dailyJobs(projects: Project[], tickets: Ticketish[], leaves: Leave[], today: string, opts: { headOf: (team: string) => string | undefined; maLead: string; forceWeekly?: boolean }): { jobs: Job[]; reports: WeeklyReport[] } {
  const jobs: Job[] = []
  for (const p of projects) {
    // 1 · quotation validity
    const st = approvalState(p, today)
    if (p.approval?.validUntil && st === 'approved' && diff(today, p.approval.validUntil) <= 14)
      jobs.push({ key: `quote14:${p.id}:${p.approval.validUntil}`, rule: 'quote', to: p.sm, link: `/projects/${p.id}`, text: `ใบเสนอราคา ${p.name} จะหมดอายุ ${p.approval.validUntil} — ขออนุมัติใหม่หรือยืนราคากับลูกค้า` })
    if (st === 'expired' && p.approval?.validUntil)
      jobs.push({ key: `quoteexp:${p.id}:${p.approval.validUntil}`, rule: 'quote', to: p.sm, link: `/projects/${p.id}`, text: `ใบเสนอราคา ${p.name} หมดอายุแล้ว — ใช้กับ Forecast / Close Win ไม่ได้` })
    // 2 · bid result tomorrow
    if (p.bid?.resultDue && !p.bid.result && diff(today, p.bid.resultDue) >= 0 && diff(today, p.bid.resultDue) <= 1)
      jobs.push({ key: `bid:${p.id}:${p.bid.resultDue}`, rule: 'bid', to: p.sm, link: `/projects/${p.id}`, text: `${p.name}: ประกาศผลประมูล ${p.bid.resultDue} — ติดตามผลจาก Sale และบันทึกในระบบ` })
    // 3 · renewal notices to the customer from the MA mailbox
    if (p.stage === 'warranty' && p.endWarranty) {
      const left = diff(today, p.endWarranty)
      const customer = p.pmPlan?.customerEmail ?? `contact@${p.customerAccountId ?? 'customer'}.example`
      for (const [round, days] of [[1, 90], [2, 30]] as const) {
        if (left <= days && left > 0 && !(p.renewalNotices ?? []).some((n) => n.round === round))
          jobs.push({
            key: `renew${round}:${p.id}`, rule: 'renew', to: round === 1 ? opts.maLead : opts.headOf(p.team) ?? opts.maLead, link: `/projects/${p.id}`, projectId: p.id,
            text: `${p.name}: ส่งอีเมลแจ้งต่อประกันรอบที่ ${round} ถึงลูกค้าแล้ว (เหลือ ${left} วัน) — ติดตามคำตอบ`,
            mail: { to: customer, from: MA_MAILBOX, kind: 'email', subject: `แจ้งการสิ้นสุดระยะรับประกัน ${p.name} (รอบที่ ${round}) และสอบถามการต่อสัญญา MA` },
            apply: (x) => { x.renewalNotices = [...(x.renewalNotices ?? []), { round, at: today, to: customer }] },
          })
      }
    }
  }
  // 4 · Preventive Maintenance rounds
  for (const { p, r, state } of dueRounds(projects, today)) {
    if (state === 'prepare' && r.status === 'planned' && p.pmPlan?.preparer)
      jobs.push({ key: `pmprep:${r.id}`, rule: 'pm', to: p.pmPlan.preparer, link: '/my-work', text: `ถึงเวลาเตรียมรายงาน PM รอบที่ ${r.no} · ${p.name} (ส่งลูกค้า ${r.due})` })
    if (state === 'late')
      jobs.push({ key: `pmlate:${r.id}`, rule: 'pm', to: opts.maLead, link: '/ma', text: `รายงาน PM รอบที่ ${r.no} · ${p.name} เลยกำหนด ${r.due}` })
  }
  // 5 · SLA
  for (const t of tickets) {
    if (t.paused || t.severity === 'CR') continue
    if (t.used >= 100) jobs.push({ key: `sla100:${t.id}`, rule: 'sla', to: opts.maLead, link: '/helpdesk', text: `${t.id} ${t.title} เกิน SLA แล้ว` })
    else if (t.used >= 80) jobs.push({ key: `sla80:${t.id}`, rule: 'sla', to: opts.maLead, link: '/helpdesk', text: `${t.id} ${t.title} ใช้เวลา ${t.used}% ของ SLA` })
  }
  // 6 · leave tomorrow → PMs of affected projects
  for (const l of leaves.filter((x) => x.status === 'active' && x.from === addDays(today, 1)))
    for (const pid of new Set(l.impacts.map((i) => i.projectId))) {
      const p = projects.find((x) => x.id === pid)
      if (p?.pm) jobs.push({ key: `leave:${l.id}:${pid}`, rule: 'leave', to: p.pm, link: '/workload', text: `พรุ่งนี้มีสมาชิกลา (${l.from} – ${l.to}) กระทบ ${l.impacts.filter((i) => i.projectId === pid).length} งานใน ${p.name}` })
    }
  // 7 · weekly report (Friday)
  const reports: WeeklyReport[] = []
  const isFriday = new Date(today + 'T00:00:00Z').getUTCDay() === 5
  if (isFriday || opts.forceWeekly) {
    const week = weekOf(today)
    for (const p of projects.filter((x) => x.workspace && x.pm && x.stage === 'delivery')) {
      const items = (p.tasks ?? []).filter((t) => typeOf(t) !== 'epic')
      const logs = items.flatMap((t) => t.worklogs ?? []).filter((w) => w.day >= week[0] && w.day <= week[6])
      const r: WeeklyReport = {
        id: `wr-${p.id}-${week[0]}`, week: week[0], projectId: p.id, pm: p.pm!, at: today,
        done: items.filter((t) => { const d = doneDay(p, t); return !!d && d >= week[0] && d <= week[6] }).length,
        open: items.filter((t) => t.status !== 'done').length,
        late: items.filter((t) => t.status !== 'done' && t.due && t.due < today).length,
        hours: logs.filter((w) => !w.overtime).reduce((s, w) => s + w.hours, 0), ot: logs.filter((w) => w.overtime).reduce((s, w) => s + w.hours, 0),
      }
      reports.push(r)
      jobs.push({ key: `weekly:${p.id}:${week[0]}`, rule: 'weekly', to: p.pm!, link: `/work/${p.id}`, text: `Weekly report ${p.name}: เสร็จ ${r.done} · ค้าง ${r.open} · เลยกำหนด ${r.late} · ${r.hours} ชม. (OT ${r.ot})`,
        mail: { to: p.pm!, from: 'One Platform', kind: 'teams', subject: `Weekly report ${p.workspace!.key} สัปดาห์ ${week[0]}` } })
    }
  }
  return { jobs, reports }
}
