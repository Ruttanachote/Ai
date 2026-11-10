// Executive module rules: the detailed project status each project is in, and how each sales
// team stands against its target. Pure functions, shared by the web app and the server tests.
import type { Project, Team } from '../data/model.ts'
import { isOpen, isWon, teamTotals } from './metrics.ts'
import { statusOf } from './workflow.ts'

/** The steps an executive follows a project through, in order. */
export type TrackStep = 'propose' | 'bid' | 'result' | 'awarded' | 'staffing' | 'develop' | 'test' | 'deliver' | 'ma'
export const TRACK_STEPS: { k: TrackStep; label: string; owner: string }[] = [
  { k: 'propose', label: 'เตรียมข้อเสนอ', owner: 'SM' },
  { k: 'bid', label: 'รอ Sale ยื่น', owner: 'Sale' },
  { k: 'result', label: 'รอประกาศผล', owner: 'ลูกค้า' },
  { k: 'awarded', label: 'ประกาศผล', owner: 'SM' },
  { k: 'staffing', label: 'แจ้งทีม · หา PM', owner: 'SM · PMO' },
  { k: 'develop', label: 'กำลังพัฒนา', owner: 'ทีมพัฒนา' },
  { k: 'test', label: 'กำลังทดสอบ', owner: 'QA · ลูกค้า' },
  { k: 'deliver', label: 'กำลังส่งมอบ', owner: 'PM' },
  { k: 'ma', label: 'ประกัน · MA', owner: 'ทีม MA' },
]
export const stepIndex = (k: TrackStep) => TRACK_STEPS.findIndex((s) => s.k === k)

export interface Track {
  step: TrackStep
  /** What is happening inside the step, in one line. */
  detail: string
  /** Person (or Sale name) the next move waits on. */
  waitingOn: string
  tone: 'ok' | 'warn' | 'bad' | 'done'
  /** Close Lose or cancelled — the tracker stops at "ประกาศผล". */
  closed?: 'lose' | 'cancelled'
  /** Delivery progress 0–100 (delivery steps only). */
  progress?: number
}

const REVIEW_STATUSES = ['readyqa', 'qa', 'uat']

/**
 * Derive the detailed step from data the teams already record — bid dates, award, the
 * "notify dev team" action, PM assignment, workspace task statuses and milestones —
 * so nobody has to type a status for the executive.
 */
export function trackOf(p: Project, today: string, nameOf: (id?: string) => string = (id) => id ?? '', date: (iso?: string) => string = (d) => d ?? ''): Track {
  const sale = p.sales.length ? p.sales.join(', ') : 'Sale'
  const pending = p.approval?.status === 'pending' ? p.approval.steps.find((s) => s.status === 'pending') : undefined
  switch (p.stage) {
    case 'lose':
      return { step: 'awarded', detail: `ไม่ได้งาน${p.loss ? ' — ' + p.loss.reason : ''}`, waitingOn: '—', tone: 'bad', closed: 'lose' }
    case 'cancelled':
      return { step: 'awarded', detail: 'ยกเลิกโครงการหลังชนะงาน', waitingOn: '—', tone: 'bad', closed: 'cancelled' }
    case 'opportunity':
    case 'pipeline':
      if (pending) return { step: 'propose', detail: `รออนุมัติราคา — ${pending.role}`, waitingOn: pending.who, tone: 'warn' }
      return { step: 'propose', detail: p.stage === 'opportunity' ? 'เก็บ Requirement กับ Sale' : 'ทำ Cost Sheet และใบเสนอราคา', waitingOn: nameOf(p.sm), tone: 'ok' }
    case 'forecast':
      return { step: 'bid', detail: `ใบเสนอราคาอนุมัติแล้ว — ${sale} ยื่นให้ลูกค้า`, waitingOn: sale, tone: 'ok' }
    case 'rebidding': {
      const b = p.bid
      if (b?.submit && b.submit <= today) {
        const late = !!b.resultDue && b.resultDue < today
        return { step: 'result', detail: b.resultDue ? `ยื่นแล้ว ${date(b.submit)} · คาดประกาศผล ${date(b.resultDue)}` : `ยื่นแล้ว ${date(b.submit)}`, waitingOn: 'ลูกค้า', tone: late ? 'warn' : 'ok' }
      }
      return { step: 'bid', detail: b?.submit ? `${sale} ยื่นซองภายใน ${date(b.submit)}` : `${sale} เตรียมยื่นซอง`, waitingOn: sale, tone: b?.submit && b.submit < today ? 'bad' : 'ok' }
    }
    case 'win':
      if (!p.devNotified) return { step: 'awarded', detail: 'ชนะงาน — SM ยังไม่แจ้งทีมพัฒนา', waitingOn: nameOf(p.sm), tone: 'warn' }
      return { step: 'staffing', detail: p.pm ? `PM: ${nameOf(p.pm)} — รอประชุม Handover` : 'แจ้งทีมแล้ว — รอ PMO มอบหมาย PM', waitingOn: p.pm ? nameOf(p.pm) : 'PMO', tone: p.pm ? 'ok' : 'warn' }
    case 'handover':
      return { step: 'staffing', detail: p.pm ? `PM: ${nameOf(p.pm)} — ประชุม Handover และตั้ง Workspace` : 'รอ PMO มอบหมาย PM', waitingOn: p.pm ? nameOf(p.pm) : 'PMO', tone: p.pm ? 'ok' : 'warn' }
    case 'delivery': {
      const ms = p.milestones ?? []
      const progress = ms.length ? Math.round(ms.reduce((s, m) => s + m.progress, 0) / ms.length) : 0
      const behind = ms.some((m) => m.progress < 100 && m.end < today)
      const tone = behind ? 'bad' : 'ok'
      const pm = nameOf(p.pm)
      const sent = ms.find((m) => (m.sentAt || m.state === 'delivered') && !m.acceptance && m.state !== 'inspected' && m.state !== 'invoiced' && m.state !== 'paid')
      if (sent) return { step: 'deliver', detail: `ส่งมอบ ${sent.name} — รอลูกค้าตรวจรับ`, waitingOn: 'ลูกค้า', tone, progress }
      const open = (p.tasks ?? []).filter((t) => t.status !== 'done')
      const inReview = open.filter((t) => REVIEW_STATUSES.includes(statusOf(p, t).id)).length
      if (progress >= 90 || (open.length > 0 && inReview / open.length >= 0.4)) return { step: 'test', detail: `ทดสอบ ${inReview} งาน · ความคืบหน้า ${progress}%`, waitingOn: pm, tone, progress }
      const cur = ms.find((m) => m.progress < 100)
      return { step: 'develop', detail: `${cur ? cur.name + ' · ' : ''}ความคืบหน้า ${progress}%`, waitingOn: pm, tone, progress }
    }
    case 'warranty':
      return { step: 'ma', detail: p.endWarranty ? `รับประกันถึง ${date(p.endWarranty)}` : 'ระยะรับประกัน', waitingOn: 'ทีม MA', tone: 'done' }
    case 'ended':
      return { step: 'ma', detail: 'ปิดโครงการ', waitingOn: '—', tone: 'done' }
  }
}

/* ---------------- Team dashboard ---------------- */

export type TargetStatus = 'ontrack' | 'atrisk' | 'behind'
export const TARGET_LABEL: Record<TargetStatus, string> = { ontrack: 'ตามเป้า', atrisk: 'ต้องเร่ง', behind: 'ต่ำกว่าเป้า' }

/** Share of the fiscal (calendar) year elapsed on `today`, 0–1. */
export function yearElapsed(today: string) {
  const d = new Date(today + 'T00:00:00Z')
  const start = Date.UTC(d.getUTCFullYear(), 0, 1)
  const end = Date.UTC(d.getUTCFullYear() + 1, 0, 1)
  return (d.getTime() - start) / (end - start)
}

/**
 * On target = booked revenue at least 95% of the pro-rated target for today.
 * Needs a push = behind pace, but booked + weighted pipeline still covers the year.
 * Below target = even the weighted pipeline does not cover the year.
 */
export function targetStatus(won: number, weighted: number, target: number, today: string): TargetStatus {
  if (!target) return 'ontrack'
  if (won >= target * yearElapsed(today) * 0.95) return 'ontrack'
  return won + weighted >= target ? 'atrisk' : 'behind'
}

export interface TeamStat {
  code: string; name: string; group: string; target: number
  headcount: number; load: number
  won: number; weighted: number; pct: number; pace: number; status: TargetStatus
  presale: number; delivery: number; ma: number; lost: number
}

/** One row of the executive team dashboard. `load` is the team's average utilisation (0–1+). */
export function teamStat(t: Team, all: Project[], today: string, headcount: number, load: number): TeamStat {
  const { won, weighted } = teamTotals(all, t.code)
  const mine = all.filter((p) => p.team === t.code || (p.splits ?? []).some((s) => s.team === t.code))
  const target = t.target ?? 0
  return {
    code: t.code, name: t.name, group: t.group, target, headcount, load, won, weighted,
    pct: target ? won / target : 0,
    pace: target * yearElapsed(today),
    status: targetStatus(won, weighted, target, today),
    presale: mine.filter(isOpen).length,
    delivery: mine.filter((p) => ['win', 'handover', 'delivery'].includes(p.stage)).length,
    ma: mine.filter((p) => isWon(p) && ['warranty', 'ended'].includes(p.stage)).length,
    lost: mine.filter((p) => p.stage === 'lose').length,
  }
}
