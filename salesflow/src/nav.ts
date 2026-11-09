import type { Role } from './data/model'

export interface NavItem { to: string; label: string; icon: string; roles: Role[] }
export interface NavGroup { title: string; items: NavItem[] }

const ALL: Role[] = ['sm', 'head', 'deputy', 'exec', 'pmo', 'opn', 'pm', 'ma', 'callcenter', 'admin']

// Menus follow the project lifecycle: shared records (projects, customers) and my work first, then Sales → Delivery → Service,
// with finance and admin last. A role only sees the menus it works in.
export const NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: 'dashboard', roles: ['sm', 'head', 'deputy', 'exec', 'admin'] },
      { to: '/my-work', label: 'My Work', icon: 'check', roles: ['pm', 'dev', 'head', 'admin'] },
      { to: '/approvals', label: 'Approvals', icon: 'inbox', roles: ['deputy', 'exec', 'admin'] },
      { to: '/projects', label: 'Projects', icon: 'list', roles: ALL },
      { to: '/accounts', label: 'Customers', icon: 'people', roles: ['sm', 'head', 'deputy', 'exec', 'pmo', 'ma', 'admin'] },
    ],
  },
  {
    title: 'Sales',
    items: [
      { to: '/pipeline', label: 'Pipeline', icon: 'board', roles: ['sm', 'head', 'deputy', 'exec', 'admin'] },
      { to: '/projects/new', label: 'New Project', icon: 'plus', roles: ['sm', 'head', 'admin'] },
    ],
  },
  {
    title: 'Delivery',
    items: [
      { to: '/delivery', label: 'Portfolio', icon: 'gantt', roles: ['pmo', 'pm', 'head', 'deputy', 'exec', 'admin'] },
      { to: '/work', label: 'Workspaces', icon: 'board', roles: ['pm', 'dev', 'pmo', 'head', 'admin'] },
      { to: '/workload', label: 'Team Workload', icon: 'people', roles: ['pmo', 'pm', 'head', 'admin'] },
    ],
  },
  {
    title: 'Service',
    items: [
      { to: '/ma', label: 'Warranty & MA', icon: 'shield', roles: ['ma', 'pmo', 'head', 'deputy', 'exec', 'sm', 'admin'] },
      { to: '/helpdesk', label: 'Helpdesk', icon: 'ticket', roles: ['callcenter', 'ma', 'admin'] },
    ],
  },
  {
    title: 'Finance',
    items: [
      { to: '/procurement', label: 'Procurement', icon: 'file', roles: ['opn', 'pm', 'deputy', 'exec', 'admin'] },
      { to: '/guarantees', label: 'Guarantees', icon: 'lock', roles: ['opn', 'head', 'deputy', 'exec', 'pmo', 'admin'] },
    ],
  },
  {
    title: 'Admin',
    items: [{ to: '/settings', label: 'Settings', icon: 'settings', roles: ['admin'] }],
  },
]

export const HOME: Record<Role, string> = {
  sm: '/', head: '/', deputy: '/approvals', exec: '/', pmo: '/delivery', opn: '/procurement', pm: '/work', dev: '/my-work', ma: '/ma', callcenter: '/helpdesk', admin: '/settings',
}

export const canSee = (path: string, role: Role) =>
  NAV.flatMap((g) => g.items).some((i) => i.to === path && i.roles.includes(role))
