import { createRouter, createWebHistory } from 'vue-router'
import ProjectsView from './views/ProjectsView.vue'
import EditorView from './views/EditorView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'projects', component: ProjectsView },
    { path: '/projects/:id', name: 'editor', component: EditorView, props: true },
  ],
})
