<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from './components/Icon.vue'
import Avatar from './components/Avatar.vue'
import { session, setRole, toast } from './store'
import { NAV, HOME } from './nav'
import { ROLES, type Role } from './data/model'
import { person } from './data/mock'

const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)
const me = computed(() => person(session.userId))
const groups = computed(() =>
  NAV.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(session.role)) })).filter((g) => g.items.length),
)
const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path === to || (to === '/projects' && /^\/projects\/(?!new)/.test(route.path)))

function switchRole(e: Event) {
  setRole((e.target as HTMLSelectElement).value as Role)
  router.push(HOME[session.role])
}
function signOut() {
  session.signedIn = false
  router.push('/login')
}
watch(() => route.path, () => (menuOpen.value = false))
</script>

<template>
  <router-view v-if="route.path === '/login' || route.path.startsWith('/print/')" />
  <div v-else class="shell" :class="{ open: menuOpen }">
    <aside class="side">
      <div class="brand">
        <svg class="chev" viewBox="0 0 10 16" width="10" height="16" aria-hidden="true"><path d="M1.5 1.5L8 8l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
        <span class="sub">One Platform</span>
        <button class="btn ghost close" aria-label="ปิดเมนู" @click="menuOpen = false"><Icon name="x" /></button>
      </div>

      <nav aria-label="โมดูล">
        <div v-for="g in groups" :key="g.title" class="group">
          <p class="gtitle">{{ g.title }}</p>
          <router-link v-for="i in g.items" :key="i.to" :to="i.to" class="nav" :class="{ active: isActive(i.to) }"
            :aria-current="isActive(i.to) ? 'page' : undefined">
            <Icon :name="i.icon" /> {{ i.label }}
          </router-link>
        </div>
      </nav>

      <div class="me">
        <Avatar :id="session.userId" :size="34" />
        <div class="who">
          <strong>{{ me?.name }}</strong>
          <span>{{ ROLES[session.role].label }}</span>
        </div>
        <button class="btn ghost out" title="ออกจากระบบ" aria-label="ออกจากระบบ" @click="signOut"><Icon name="logout" /></button>
      </div>
    </aside>

    <div class="main">
      <header class="top">
        <button class="btn ghost burger" aria-label="เปิดเมนู" @click="menuOpen = true"><Icon name="menu" /></button>
        <label class="search">
          <Icon name="search" />
          <input placeholder="ค้นหาโครงการ ลูกค้า หรือรหัส" aria-label="ค้นหา" />
        </label>
        <label class="role">
          <span>ดูในบทบาท</span>
          <select class="input" :value="session.role" @change="switchRole" aria-label="สลับบทบาท (เดโม)">
            <option v-for="(r, k) in ROLES" :key="k" :value="k">{{ r.label }}</option>
          </select>
        </label>
        <button class="btn ghost bell" aria-label="การแจ้งเตือน"><Icon name="bell" /><span class="pip" /></button>
      </header>
      <router-view :key="route.fullPath" />
    </div>
    <div class="scrim" @click="menuOpen = false" />
  </div>

  <Transition name="toast">
    <div v-if="toast.show" class="toast" role="status"><Icon name="check" /> {{ toast.text }}</div>
  </Transition>
</template>

<style scoped>
.shell { display: grid; grid-template-columns: 248px 1fr; min-height: 100vh; }
.side { background: var(--ink); color: #c9ced8; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; padding: 20px 14px; overflow-y: auto; }
.brand { display: flex; align-items: center; gap: 8px; padding: 4px 10px 22px; color: #fff; }
.chev { color: var(--brand); }
.sub { font-family: var(--display); font-weight: 600; font-size: 16px; color: #fff; }
.close { display: none; margin-left: auto; color: #fff; }
.group { margin-bottom: 18px; }
.gtitle { font-size: 12px; color: #7d8596; padding: 0 10px 6px; }
.nav { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: var(--r-sm); color: #c9ced8; font-size: 14px; }
.nav:hover { background: #222a39; text-decoration: none; color: #fff; }
.nav.active { background: #fff; color: var(--ink); font-weight: 500; }
.me { margin-top: auto; display: flex; align-items: center; gap: 10px; padding: 12px 8px 0; border-top: 1px solid #2a3142; }
.who { display: grid; line-height: 1.3; min-width: 0; }
.who strong { color: #fff; font-size: 13.5px; font-weight: 500; }
.who span { font-size: 12px; color: #8d95a5; }
.out { margin-left: auto; color: #8d95a5; padding: 0 8px; }
.out:hover { background: #222a39; color: #fff; }

.main { min-width: 0; }
.top { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; gap: 12px; padding: 12px 32px; background: rgb(242 243 246 / 0.92); backdrop-filter: blur(6px); border-bottom: 1px solid var(--line); }
.burger { display: none; padding: 0 8px; }
.search { flex: 1; max-width: 460px; display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 12px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-sm); color: var(--muted); }
.search input { border: 0; outline: 0; flex: 1; font: 14px var(--font); background: none; min-width: 0; }
.search:focus-within { border-color: var(--focus); }
.role { margin-left: auto; display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); }
.role .input { width: auto; min-height: 36px; padding: 4px 8px; font-size: 14px; }
.bell { position: relative; padding: 0 9px; }
.pip { position: absolute; top: 8px; right: 9px; width: 7px; height: 7px; border-radius: 50%; background: var(--brand); }
.scrim { display: none; }

.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--ink); color: #fff; padding: 12px 18px; border-radius: var(--r-md); display: flex; gap: 8px; align-items: center; box-shadow: var(--shadow-pop); z-index: 100; font-size: 14px; max-width: calc(100vw - 32px); }
.toast-enter-active, .toast-leave-active { transition: opacity var(--t-med) var(--ease), transform var(--t-med) var(--ease); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 8px); }

@media (max-width: 1000px) {
  .shell { grid-template-columns: 1fr; }
  .side { position: fixed; inset: 0 auto 0 0; width: 272px; z-index: 50; transform: translateX(-100%); transition: transform var(--t-med) var(--ease); }
  .open .side { transform: none; }
  .open .scrim { display: block; position: fixed; inset: 0; background: rgb(22 27 38 / 0.4); z-index: 40; }
  .close, .burger { display: inline-flex; }
  .top { padding: 10px 16px; }
  .role span { display: none; }
}
@media (max-width: 560px) {
  .search { display: none; }
}
</style>
