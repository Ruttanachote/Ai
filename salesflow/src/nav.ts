import type { Role } from './data/model'

export interface NavItem { to: string; label: string; icon: string; roles: Role[] }
export interface NavGroup { title: string; items: NavItem[] }

const ALL: Role[] = ['sm', 'head', 'exec', 'pmo', 'pm', 'ma', 'admin']

// One module per job. A role only sees the modules it works in.
export const NAV: NavGroup[] = [
  {
    title: 'งานขาย',
    items: [
      { to: '/', label: 'ภาพรวมยอดขาย', icon: 'dashboard', roles: ['sm', 'head', 'exec', 'admin'] },
      { to: '/pipeline', label: 'Pipeline board', icon: 'board', roles: ['sm', 'head', 'exec', 'admin'] },
      { to: '/projects', label: 'ทะเบียนโครงการ', icon: 'list', roles: ALL },
      { to: '/projects/new', label: 'ลงทะเบียนโครงการ', icon: 'plus', roles: ['sm', 'head', 'admin'] },
    ],
  },
  {
    title: 'อนุมัติ',
    items: [{ to: '/approvals', label: 'รออนุมัติราคา', icon: 'inbox', roles: ['head', 'exec', 'admin'] }],
  },
  {
    title: 'ส่งมอบโครงการ',
    items: [
      { to: '/delivery', label: 'Portfolio โครงการ', icon: 'gantt', roles: ['pmo', 'pm', 'head', 'exec', 'admin'] },
      { to: '/workload', label: 'Workload ทีม', icon: 'people', roles: ['pmo', 'pm', 'head', 'admin'] },
    ],
  },
  {
    title: 'ประกันและ MA',
    items: [{ to: '/ma', label: 'ประกันและ MA', icon: 'shield', roles: ['ma', 'pmo', 'head', 'exec', 'sm', 'admin'] }],
  },
  {
    title: 'ระบบ',
    items: [{ to: '/settings', label: 'สิทธิ์และการตั้งค่า', icon: 'settings', roles: ['admin'] }],
  },
]

export const HOME: Record<Role, string> = {
  sm: '/', head: '/approvals', exec: '/', pmo: '/delivery', pm: '/delivery', ma: '/ma', admin: '/settings',
}

export const canSee = (path: string, role: Role) =>
  NAV.flatMap((g) => g.items).some((i) => i.to === path && i.roles.includes(role))
