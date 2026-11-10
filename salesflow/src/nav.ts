import type { Role } from './data/model'

export interface NavItem { to: string; label: string; icon: string; roles: Role[] }
export interface NavGroup { title: string; items: NavItem[] }

const ALL: Role[] = ['sm', 'head', 'deputy', 'exec', 'pmo', 'opn', 'pm', 'ma', 'callcenter', 'admin']
/** Everyone who does hands-on work. Executives (deputy, exec) get the Executive menu instead. */
const WORKERS: Role[] = ['sm', 'head', 'pmo', 'opn', 'pm', 'ma', 'callcenter', 'admin']
const EXEC: Role[] = ['exec', 'deputy']

// Menus follow the user's journey: my own work first, the shared records, then the project
// lifecycle in order (sales → delivery → after-sales), then finance and administration.
// Executives see a short menu: their dashboard, the project status tracker, the approval
// mailbox, the project register and the calendar — nothing that needs hands-on input.
export const NAV: NavGroup[] = [
  {
    title: 'Sales · ก่อนขาย',
    items: [
      { to: '/', label: 'SM Dashboard', icon: 'dashboard', roles: ['sm', 'head', 'admin'] },
      // One register for the whole sales journey: list, pipeline board and "register a new project" (starts at Opportunity).
      { to: '/projects', label: 'Project Overview', icon: 'list', roles: ['sm', 'head'] },
      { to: '/catalog', label: 'Solution Catalog', icon: 'folder', roles: ['sm', 'head', 'admin'] },
    ],
  },
  {
    title: 'Executive · ผู้บริหาร DT',
    items: [
      { to: '/exec', label: 'Executive Dashboard', icon: 'dashboard', roles: [...EXEC, 'admin'] },
      { to: '/exec/tracker', label: 'Project Status Tracker', icon: 'gantt', roles: [...EXEC, 'admin'] },
      { to: '/inbox', label: 'Mail Inbox', icon: 'inbox', roles: [...EXEC, 'admin'] },
    ],
  },
  {
    title: 'My Work · งานของฉัน',
    items: [
      { to: '/my-work', label: 'My Tasks', icon: 'check', roles: [...WORKERS.filter((r) => r !== 'sm'), 'dev'] },
      { to: '/approvals', label: 'Approval Requests', icon: 'inbox', roles: ['head', 'admin'] },
      { to: '/calendar', label: 'Calendar', icon: 'clock', roles: [...ALL, 'dev'] },
      { to: '/performance', label: 'My Performance', icon: 'chart', roles: ['dev', 'pm', 'head', 'pmo', 'admin'] },
    ],
  },
  {
    title: 'Projects & Customers · ข้อมูลกลาง',
    items: [
      { to: '/projects', label: 'Project Overview', icon: 'list', roles: ALL.filter((r) => !['callcenter', 'sm', 'head'].includes(r)) },
      { to: '/accounts', label: 'Customer Accounts', icon: 'people', roles: ['sm', 'head', 'ma', 'admin'] },
    ],
  },
  {
    title: 'Delivery · ส่งมอบโครงการ',
    items: [
      { to: '/delivery', label: 'Delivery Overview', icon: 'gantt', roles: ['pmo', 'pm', 'head', 'admin'] },
      { to: '/work', label: 'Project Workspace', icon: 'board', roles: ['pm', 'dev', 'pmo', 'head', 'admin'] },
      { to: '/workload', label: 'Resource Workload', icon: 'people', roles: ['pmo', 'pm', 'head', 'admin'] },
    ],
  },
  {
    title: 'After-Sales · ประกันและ MA',
    items: [
      { to: '/ma', label: 'Warranty & Maintenance', icon: 'shield', roles: ['ma', 'admin'] },
      { to: '/helpdesk', label: 'Service Desk', icon: 'ticket', roles: ['callcenter', 'ma', 'admin'] },
    ],
  },
  {
    title: 'Finance · จัดซื้อและการเงิน',
    items: [
      { to: '/procurement', label: 'Purchase Requisitions', icon: 'file', roles: ['opn', 'pm', 'admin'] },
      { to: '/guarantees', label: 'Bank Guarantees', icon: 'lock', roles: ['opn', 'admin'] },
    ],
  },
  {
    title: 'Admin · ผู้ดูแลระบบ',
    items: [{ to: '/settings', label: 'System Settings', icon: 'settings', roles: ['admin'] }],
  },
]

export const HOME: Record<Role, string> = {
  sm: '/', head: '/', deputy: '/inbox', exec: '/exec', pmo: '/delivery', opn: '/procurement', pm: '/work', dev: '/my-work', ma: '/ma', callcenter: '/helpdesk', admin: '/settings',
}

/** Pages reached from inside a menu rather than from the menu itself. */
const EXTRA: Record<string, Role[]> = { '/projects/new': ['sm', 'admin'] }
export const canSee = (path: string, role: Role) =>
  (EXTRA[path]?.includes(role) ?? false) || NAV.flatMap((g) => g.items).some((i) => i.to === path && i.roles.includes(role))
