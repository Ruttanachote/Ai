<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  NBadge, NButton, NConfigProvider, NDialogProvider, NDrawer, NDrawerContent, NDropdown, NMenu, NMessageProvider, NPopover, NTooltip,
  dateThTH, thTH, type MenuOption,
} from 'naive-ui'
import Icon from './components/Icon.vue'
import Avatar from './components/Avatar.vue'
import Feedback from './components/Feedback.vue'
import CommandPalette from './components/CommandPalette.vue'
import { notifications, session, setRole } from './store'
import { NAV, HOME } from './nav'
import { ROLES, type Role } from './data/model'
import { person } from './data/mock'
import { isDark, naiveTheme, overrides, setMode, theme, type Mode } from './theme'

const route = useRoute()
const router = useRouter()
const me = computed(() => person(session.userId))

// Sidebar: Naive UI menu grouped by lifecycle, collapsible to an icon rail (remembered).
const readCollapsed = () => { try { return localStorage.getItem('op-rail') === '1' } catch { return false } }
const collapsed = ref(readCollapsed())
watch(collapsed, (v) => { try { localStorage.setItem('op-rail', v ? '1' : '0') } catch { /* ignore */ } })
const mobileOpen = ref(false)
const icon = (name: string) => () => h(Icon, { name, size: 18 })
const groups = computed(() => NAV.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(session.role)) })).filter((g) => g.items.length))
const menu = computed<MenuOption[]>(() => groups.value.map((g) => ({
  type: 'group', key: g.title, label: g.title,
  children: g.items.map((i) => ({ key: i.to, icon: icon(i.icon), label: () => h(RouterLink, { to: i.to }, { default: () => i.label }) })),
})))
const activeKey = computed(() => {
  const p = route.path
  if (p.startsWith('/work/')) return '/work'
  if (p === '/projects/new') return p
  if (p.startsWith('/projects/')) return '/projects'
  if (p.startsWith('/accounts/')) return '/accounts'
  return p
})
const crumb = computed(() => {
  for (const g of NAV) for (const i of g.items) if (i.to === activeKey.value) return { group: g.title, page: i.label }
  return null
})

// Top bar: command palette, role (demo), theme, notifications, profile.
const palette = ref(false)
function onKey(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette.value = !palette.value }
}
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))

const roleOptions = computed(() => (Object.keys(ROLES) as Role[]).map((k) => ({ key: k, label: ROLES[k].label, icon: k === session.role ? icon('check') : undefined })))
function switchRole(r: Role) {
  setRole(r)
  router.push(HOME[session.role])
}
const MODES: { k: Mode; label: string; icon: string }[] = [{ k: 'light', label: 'สว่าง', icon: 'sun' }, { k: 'dark', label: 'มืด', icon: 'moon' }, { k: 'system', label: 'ตามระบบ', icon: 'monitor' }]
const profileOptions = computed(() => [
  { type: 'render', key: 'who', render: () => h('div', { class: 'pf' }, [h('strong', me.value?.name), h('span', ROLES[session.role].label)]) },
  { type: 'divider', key: 'd1' },
  { key: 'role', label: 'ดูในบทบาท (เดโม)', icon: icon('people'), children: roleOptions.value },
  { key: 'mode', label: 'ธีม', icon: icon(isDark.value ? 'moon' : 'sun'), children: MODES.map((m) => ({ key: 'mode:' + m.k, label: m.label, icon: theme.mode === m.k ? icon('check') : icon(m.icon) })) },
  { type: 'divider', key: 'd2' },
  { key: 'logout', label: 'ออกจากระบบ', icon: icon('logout') },
])
function onProfile(key: string) {
  if (key === 'logout') { session.signedIn = false; router.push('/login') }
  else if (key.startsWith('mode:')) setMode(key.slice(5) as Mode)
  else if (key in ROLES) switchRole(key as Role)
}

const mine = computed(() => notifications.filter((n) => n.to === session.userId))
const unread = computed(() => mine.value.filter((n) => !n.read).length)
const bellOpen = ref(false)
function openNote(n: { link: string; read: boolean }) { n.read = true; bellOpen.value = false; router.push(n.link) }
const readAll = () => mine.value.forEach((n) => (n.read = true))

watch(() => route.path, () => { mobileOpen.value = false; bellOpen.value = false })
const bare = computed(() => route.path === '/login' || route.path.startsWith('/print/'))
</script>

<template>
  <NConfigProvider :theme="naiveTheme" :theme-overrides="overrides" :locale="thTH" :date-locale="dateThTH">
    <NMessageProvider placement="bottom" :max="3">
      <NDialogProvider>
        <Feedback />
        <router-view v-if="bare" />
        <div v-else class="shell" :class="{ rail: collapsed }">
          <aside class="side" aria-label="เมนูหลัก">
            <div class="brand">
              <svg class="chev" viewBox="0 0 10 16" width="10" height="16" aria-hidden="true"><path d="M1.5 1.5L8 8l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
              <span v-if="!collapsed" class="sub">One Platform</span>
            </div>
            <nav class="menu"><NMenu :options="menu" :value="activeKey" :collapsed="collapsed" :collapsed-width="64" :collapsed-icon-size="20" :indent="14" /></nav>
            <NTooltip placement="right" :disabled="!collapsed">
              <template #trigger>
                <button class="railbtn" :aria-label="collapsed ? 'ขยายเมนู' : 'ย่อเมนู'" :aria-pressed="collapsed" @click="collapsed = !collapsed"><Icon name="collapse" /><span v-if="!collapsed">ย่อเมนู</span></button>
              </template>
              ขยายเมนู
            </NTooltip>
          </aside>

          <div class="main">
            <header class="top">
              <NButton quaternary circle class="burger" aria-label="เปิดเมนู" @click="mobileOpen = true"><Icon name="menu" /></NButton>
              <nav v-if="crumb" class="crumb small" aria-label="ตำแหน่งหน้า"><span>{{ crumb.group }}</span><Icon name="chevron" :size="12" /><strong>{{ crumb.page }}</strong></nav>
              <button class="search" aria-label="ค้นหา (Ctrl+K)" @click="palette = true"><Icon name="search" :size="16" /><span>ค้นหาเมนู โครงการ หรืองาน</span><kbd>Ctrl K</kbd></button>
              <span class="sp" />
              <NTooltip>
                <template #trigger>
                  <NButton quaternary circle :aria-label="isDark ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'" @click="setMode(isDark ? 'light' : 'dark')"><Icon :name="isDark ? 'sun' : 'moon'" /></NButton>
                </template>
                {{ isDark ? 'ธีมสว่าง' : 'ธีมมืด' }}
              </NTooltip>
              <NPopover v-model:show="bellOpen" trigger="click" placement="bottom-end" :show-arrow="false" raw>
                <template #trigger>
                  <NBadge :value="unread" :max="9" :show="unread > 0" :offset="[-4, 6]">
                    <NButton quaternary circle :aria-label="`การแจ้งเตือน ${unread} รายการใหม่`"><Icon name="bell" /></NButton>
                  </NBadge>
                </template>
                <div class="notes" role="dialog" aria-label="การแจ้งเตือน">
                  <header><strong>การแจ้งเตือน</strong><button v-if="unread" class="lnk" @click="readAll">อ่านทั้งหมด</button></header>
                  <button v-for="n in mine" :key="n.id" class="note" :class="{ new: !n.read }" @click="openNote(n)"><span>{{ n.text }}</span><small>{{ n.at }}</small></button>
                  <p v-if="!mine.length" class="empty">ไม่มีการแจ้งเตือน</p>
                </div>
              </NPopover>
              <NDropdown trigger="click" placement="bottom-end" :options="profileOptions" @select="onProfile">
                <button class="me" :aria-label="`บัญชี ${me?.name} · ${ROLES[session.role].label}`">
                  <Avatar :id="session.userId" :size="30" />
                  <span class="who"><strong>{{ me?.name }}</strong><span>{{ ROLES[session.role].label }}</span></span>
                  <Icon name="down" :size="14" />
                </button>
              </NDropdown>
            </header>
            <router-view :key="route.fullPath" />
          </div>

          <NDrawer v-model:show="mobileOpen" placement="left" :width="280">
            <NDrawerContent :body-content-style="{ padding: '12px 8px' }">
              <template #header><span class="mbrand"><svg viewBox="0 0 10 16" width="10" height="16" aria-hidden="true"><path d="M1.5 1.5L8 8l-6.5 6.5" fill="none" stroke="var(--brand)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" /></svg> One Platform</span></template>
              <NMenu :options="menu" :value="activeKey" :indent="14" />
            </NDrawerContent>
          </NDrawer>
        </div>
        <CommandPalette v-model="palette" />
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style scoped>
.shell { display: grid; grid-template-columns: 252px 1fr; min-height: 100vh; transition: grid-template-columns var(--t-med) var(--ease); }
.shell.rail { grid-template-columns: 64px 1fr; }
.side { background: var(--surface); border-right: 1px solid var(--line); display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow: hidden; }
.brand { display: flex; align-items: center; gap: 10px; height: 60px; padding: 0 23px; flex: none; }
.chev { color: var(--brand); flex: none; }
.sub { font-family: var(--display); font-weight: 600; font-size: 17px; color: var(--ink); white-space: nowrap; }
.menu { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 0 8px 8px; }
.rail .menu { padding: 0; }
.rail .menu :deep(.n-menu-item-group-title) { height: 1px; margin: 8px 14px; padding: 0 !important; overflow: hidden; color: transparent; background: var(--line); }
.railbtn { display: flex; align-items: center; gap: 10px; margin: 8px; padding: 9px 14px; border: 0; border-radius: 8px; background: none; color: var(--muted); font: 13.5px var(--font); cursor: pointer; white-space: nowrap; }
.railbtn:hover { background: var(--idle-soft); color: var(--ink); }
.rail .railbtn { justify-content: center; padding: 9px 0; }
.rail .railbtn :deep(svg) { transform: scaleX(-1); }

.main { min-width: 0; }
.top { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; gap: 6px; height: 60px; padding: 0 24px 0 32px; background: var(--glass); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
.burger { display: none; }
.crumb { display: flex; align-items: center; gap: 6px; color: var(--muted); margin-right: 14px; white-space: nowrap; }
.crumb strong { color: var(--ink); font-weight: 500; }
.search { display: flex; align-items: center; gap: 8px; height: 36px; width: min(380px, 34vw); padding: 0 8px 0 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--muted); font: 13.5px var(--font); cursor: text; }
.search:hover { border-color: var(--line-strong); }
.search span { flex: 1; text-align: left; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
kbd { font: 11px var(--font); border: 1px solid var(--line-strong); border-bottom-width: 2px; border-radius: 5px; padding: 0 5px; background: var(--sunken); white-space: nowrap; }
.sp { flex: 1; }
.me { display: flex; align-items: center; gap: 10px; border: 0; background: none; padding: 4px 6px 4px 4px; border-radius: 10px; cursor: pointer; color: var(--muted); margin-left: 6px; }
.me:hover { background: var(--idle-soft); }
.who { display: grid; line-height: 1.25; text-align: left; }
.who strong { color: var(--ink); font-size: 13.5px; font-weight: 500; }
.who span { font-size: 12px; color: var(--muted); max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mbrand { display: inline-flex; gap: 10px; align-items: center; font-family: var(--display); }

.notes { width: min(360px, calc(100vw - 32px)); background: var(--raised); border: 1px solid var(--line); border-radius: 14px; box-shadow: var(--shadow-pop); padding: 6px; display: grid; max-height: 420px; overflow-y: auto; }
.notes header { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; font-size: 14px; }
.lnk { border: 0; background: none; color: var(--primary); font: 13px var(--font); cursor: pointer; }
.note { border: 0; background: none; text-align: left; display: grid; gap: 2px; padding: 9px 10px 9px 18px; border-radius: 8px; font: 13.5px var(--font); color: var(--ink-2); cursor: pointer; position: relative; }
.note:hover { background: var(--sunken); }
.note.new { color: var(--ink); }
.note.new::before { content: ''; position: absolute; left: 6px; top: 15px; width: 6px; height: 6px; border-radius: 50%; background: var(--primary); }
.note small { color: var(--muted); font-size: 12px; }
.empty { padding: 16px; text-align: center; color: var(--muted); font-size: 13.5px; }
:global(.pf) { display: grid; padding: 6px 14px 8px; line-height: 1.35; }
:global(.pf strong) { font-size: 14px; }
:global(.pf span) { font-size: 12px; opacity: 0.7; }

@media (max-width: 1000px) {
  .shell, .shell.rail { grid-template-columns: 1fr; }
  .side { display: none; }
  .burger { display: inline-flex; }
  .top { padding: 0 12px; }
  .crumb { display: none; }
  .who { display: none; }
}
@media (max-width: 560px) { .search span, .search kbd { display: none; } .search { width: 40px; padding: 0; justify-content: center; } }
</style>
