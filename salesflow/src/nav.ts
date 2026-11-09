import type { Role } from './data/model'

export interface NavItem { to: string; label: string; icon: string; roles: Role[] }
export interface NavGroup { title: string; items: NavItem[] }

const ALL: Role[] = ['sm', 'head', 'deputy', 'exec', 'pmo', 'opn', 'pm', 'ma', 'callcenter', 'admin']

// One module per job. A role only sees the modules it works in.
export const NAV: NavGroup[] = [
  {
    title: 'งานขาย',
    items: [
      { to: '/', label: 'ภาพรวมยอดขาย', icon: 'dashboard', roles: ['sm', 'head', 'deputy', 'exec', 'admin'] },
      { to: '/pipeline', label: 'Pipeline board', icon: 'board', roles: ['sm', 'head', 'deputy', 'exec', 'admin'] },
      { to: '/projects', label: 'ทะเบียนโครงการ', icon: 'list', roles: ALL },
      { to: '/projects/new', label: 'ลงทะเบียนโครงการ', icon: 'plus', roles: ['sm', 'head', 'admin'] },
      { to: '/accounts', label: 'ทะเบียนลูกค้า', icon: 'people', roles: ['sm', 'head', 'deputy', 'exec', 'pmo', 'ma', 'admin'] },
    ],
  },
  {
    title: 'อนุมัติและการเงิน',
    items: [
      { to: '/approvals', label: 'รออนุมัติราคา', icon: 'inbox', roles: ['deputy', 'exec', 'admin'] },
      { to: '/procurement', label: 'จัดซื้อและเบิกจ่าย', icon: 'file', roles: ['opn', 'pm', 'deputy', 'exec', 'admin'] },
      { to: '/guarantees', label: 'หลักประกัน', icon: 'shield', roles: ['opn', 'head', 'deputy', 'exec', 'pmo', 'admin'] },
    ],
  },
  {
    title: 'ส่งมอบโครงการ',
    items: [
      { to: '/delivery', label: 'Portfolio โครงการ', icon: 'gantt', roles: ['pmo', 'pm', 'head', 'deputy', 'exec', 'admin'] },
      { to: '/work', label: 'พื้นที่งานโครงการ', icon: 'board', roles: ['pm', 'pmo', 'head', 'admin'] },
      { to: '/workload', label: 'Workload ทีม', icon: 'people', roles: ['pmo', 'pm', 'head', 'admin'] },
    ],
  },
  {
    title: 'ประกันและ MA',
    items: [
      { to: '/ma', label: 'ประกันและ MA', icon: 'shield', roles: ['ma', 'pmo', 'head', 'deputy', 'exec', 'sm', 'admin'] },
      { to: '/helpdesk', label: 'Helpdesk', icon: 'ticket', roles: ['callcenter', 'ma', 'admin'] },
    ],
  },
  {
    title: 'ระบบ',
    items: [{ to: '/settings', label: 'สิทธิ์และการตั้งค่า', icon: 'settings', roles: ['admin'] }],
  },
]

export const HOME: Record<Role, string> = {
  sm: '/', head: '/', deputy: '/approvals', exec: '/', pmo: '/delivery', opn: '/procurement', pm: '/work', ma: '/ma', callcenter: '/helpdesk', admin: '/settings',
}

export const canSee = (path: string, role: Role) =>
  NAV.flatMap((g) => g.items).some((i) => i.to === path && i.roles.includes(role))
