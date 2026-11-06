import { reactive } from 'vue'
import type { Role, StageKey } from './data/model'
import { PROJECTS } from './data/mock'

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
