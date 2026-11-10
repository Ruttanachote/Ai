import type { Role } from './data/model'

export interface NavItem { to: string; label: string; icon: string; roles: Role[] }
export interface NavGroup { title: string; items: NavItem[] }

const ALL: Role[] = ['sm', 'head', 'deputy', 'exec', 'pmo', 'opn', 'pm', 'ma', 'callcenter', 'admin']

// Menus follow the project lifecycle: shared records (projects, customers) and my work first, then Sales → Delivery → Service,
// with finance and admin last. A role only sees the menus it works in.
export const NAV: NavGroup[] = [
  {
    title: 'General',
    items: [
      { to: '/my-work', label: 'My Tasks', icon: 'check', roles: [...ALL, 'dev'] },
      { to: '/calendar', label: 'Calendar', icon: 'clock', roles: [...ALL, 'dev'] },
      { to: '/performance', label: 'My Performance', icon: 'chart', roles: ['dev', 'pm', 'head', 'pmo', 'admin'] },
      { to: '/approvals', label: 'Approval Requests', icon: 'inbox', roles: ['head', 'deputy', 'exec', 'admin'] },
      { to: '/projects', label: 'Project Register', icon: 'list', roles: ALL },
      { to: '/accounts', label: 'Customer Accounts', icon: 'people', roles: ['sm', 'head', 'deputy', 'exec', 'pmo', 'ma', 'admin'] },
    ],
  },
  {
    title: 'Sales Management',
    items: [
      { to: '/', label: 'Sales Dashboard', icon: 'dashboard', roles: ['sm', 'head', 'deputy', 'exec', 'admin'] },
      { to: '/pipeline', label: 'Sales Pipeline', icon: 'board', roles: ['sm', 'head', 'deputy', 'exec', 'admin'] },
      { to: '/projects/new', label: 'Opportunity Registration', icon: 'plus', roles: ['sm', 'head', 'admin'] },
      { to: '/catalog', label: 'Solution Catalog', icon: 'folder', roles: ['sm', 'head', 'deputy', 'exec', 'pmo', 'admin'] },
    ],
  },
  {
    title: 'Project Management',
    items: [
      { to: '/delivery', label: 'Project Overview', icon: 'gantt', roles: ['pmo', 'pm', 'head', 'deputy', 'exec', 'admin'] },
      { to: '/work', label: 'Project Workspace', icon: 'board', roles: ['pm', 'dev', 'pmo', 'head', 'admin'] },
      { to: '/workload', label: 'Resource Workload', icon: 'people', roles: ['pmo', 'pm', 'head', 'admin'] },
    ],
  },
  {
    title: 'After-Sales Service',
    items: [
      { to: '/ma', label: 'Warranty & Maintenance', icon: 'shield', roles: ['ma', 'pmo', 'head', 'deputy', 'exec', 'sm', 'admin'] },
      { to: '/helpdesk', label: 'Service Desk', icon: 'ticket', roles: ['callcenter', 'ma', 'admin'] },
    ],
  },
  {
    title: 'Finance & Procurement',
    items: [
      { to: '/procurement', label: 'Purchase Requisitions', icon: 'file', roles: ['opn', 'pm', 'deputy', 'exec', 'admin'] },
      { to: '/guarantees', label: 'Bank Guarantees', icon: 'lock', roles: ['opn', 'head', 'deputy', 'exec', 'pmo', 'admin'] },
    ],
  },
  {
    title: 'System Administration',
    items: [{ to: '/settings', label: 'System Settings', icon: 'settings', roles: ['admin'] }],
  },
]

export const HOME: Record<Role, string> = {
  sm: '/', head: '/', deputy: '/approvals', exec: '/', pmo: '/delivery', opn: '/procurement', pm: '/work', dev: '/my-work', ma: '/ma', callcenter: '/helpdesk', admin: '/settings',
}

export const canSee = (path: string, role: Role) =>
  NAV.flatMap((g) => g.items).some((i) => i.to === path && i.roles.includes(role))
