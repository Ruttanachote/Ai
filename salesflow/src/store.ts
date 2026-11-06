import { computed, reactive } from 'vue'
import type { Role, StageKey } from './data/model'
import { PROJECTS, person } from './data/mock'

// Demo session — in production this comes from Microsoft Entra ID (app roles claim).
export const session = reactive({
  signedIn: false,
  role: 'sm' as Role,
  userId: 'rk',
})

export const ROLE_USER: Record<Role, string> = {
  sm: 'rk', head: 'sw', exec: 'tc', pmo: 'pj', pm: 'ak', ma: 'wm', admin: 'tc',
}

export function setRole(r: Role) {
  session.role = r
  session.userId = ROLE_USER[r]
}

export const projects = reactive(PROJECTS)

/**
 * The single project scope every page starts from, so a menu shows the same set of
 * projects (and therefore the same totals) wherever it appears.
 *   SM   — projects they own or collaborate on
 *   Head — every project of their DT group (DT4 → DT4-1, DT4-2), including revenue splits
 *   PM   — projects they manage or work on
 *   MA   — projects in warranty, ended, or MA-type contracts
 *   Exec, PMO, Admin — everything
 */
export const scope = computed(() => {
  const me = person(session.userId)
  const group = me?.team?.split('-')[0]
  switch (session.role) {
    case 'sm':
      return { label: 'โครงการของคุณ', list: projects.filter((p) => p.sm === session.userId || p.collaborators.includes(session.userId)) }
    case 'head': {
      const inGroup = (t: string) => t === group || t.startsWith(group + '-')
      return { label: `ทีม ${group} ทั้งกลุ่ม`, teams: (t: string) => inGroup(t), list: projects.filter((p) => inGroup(p.team) || (p.splits ?? []).some((x) => inGroup(x.team))) }
    }
    case 'pm':
      return { label: 'โครงการที่คุณดูแล', list: projects.filter((p) => p.pm === session.userId || p.collaborators.includes(session.userId)) }
    case 'ma':
      return { label: 'โครงการในระยะประกันและ MA', list: projects.filter((p) => ['warranty', 'ended'].includes(p.stage) || p.type === 'MA') }
    default:
      return { label: 'ทุกทีม DT', list: [...projects] }
  }
})

/** Admin-tunable approval thresholds (Settings → ลำดับการอนุมัติ). */
export const SETTINGS = reactive({ tolerancePct: 2, gpDropPct: 3, approvalValidDays: 60 })

export function moveStage(id: string, to: StageKey, note: string, by: string) {
  const p = projects.find((x) => x.id === id)
  if (!p) return
  p.stage = to
  p.history.push({ stage: to, note, at: 'วันนี้', by })
}

export const toast = reactive({ text: '', show: false })
let timer: number | undefined
export function notify(text: string) {
  toast.text = text
  toast.show = true
  clearTimeout(timer)
  timer = window.setTimeout(() => (toast.show = false), 3200)
}
