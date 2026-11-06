import { createRouter, createWebHashHistory } from 'vue-router'
import { session } from './store'
import { canSee, HOME } from './nav'

const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/login', component: () => import('./views/LoginView.vue') },
    { path: '/', component: () => import('./views/DashboardView.vue') },
    { path: '/pipeline', component: () => import('./views/PipelineView.vue') },
    { path: '/projects', component: () => import('./views/ProjectsView.vue') },
    { path: '/projects/new', component: () => import('./views/NewProjectView.vue') },
    { path: '/projects/:id', component: () => import('./views/ProjectDetailView.vue'), props: true },
    { path: '/approvals', component: () => import('./views/ApprovalsView.vue') },
    { path: '/delivery', component: () => import('./views/DeliveryView.vue') },
    { path: '/workload', component: () => import('./views/WorkloadView.vue') },
    { path: '/ma', component: () => import('./views/MaView.vue') },
    { path: '/settings', component: () => import('./views/SettingsView.vue') },
    { path: '/accounts', component: () => import('./views/AccountsView.vue') },
    { path: '/accounts/:id', component: () => import('./views/AccountDetailView.vue'), props: true },
    { path: '/guarantees', component: () => import('./views/GuaranteesView.vue') },
    { path: '/print/quotation/:id', component: () => import('./views/QuotationPrintView.vue'), props: true },
  ],
})

// Role guard: modules outside the signed-in role redirect to that role's home.
router.beforeEach((to) => {
  if (to.path === '/login') return true
  if (!session.signedIn) return '/login'
  if (to.path.startsWith('/projects/') && to.path !== '/projects/new') return true
  if (to.path.startsWith('/print/') || to.path.startsWith('/accounts/')) return true
  if (!canSee(to.path, session.role)) return HOME[session.role]
  return true
})

export default router
