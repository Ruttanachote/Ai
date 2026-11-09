// One Platform theme — "Cobalt Slate". One token set drives both our CSS variables and
// Naive UI's themeOverrides, so native pages and Naive components always match.
// Light is the default for office hours; dark follows the OS or the user's choice.
import { computed, reactive, watchEffect } from 'vue'
import { darkTheme, type GlobalThemeOverrides } from 'naive-ui'

export type Mode = 'light' | 'dark' | 'system'

const T = {
  light: {
    paper: '#f3f5f9', surface: '#ffffff', sunken: '#f7f8fb', raised: '#ffffff',
    ink: '#141a26', ink2: '#3a4356', muted: '#667085', faint: '#98a1b2', line: '#e4e7ee', lineStrong: '#cdd3de', onInk: '#ffffff',
    primary: '#3457d5', primaryHover: '#2a49bd', primaryPressed: '#213c9e', primarySoft: '#ebeffc',
    presale: '#4b5bd6', presaleSoft: '#eceefc', win: '#17845a', winSoft: '#e3f3ec', lose: '#c4382f', loseSoft: '#fbeaea',
    post: '#0f7f86', postSoft: '#e1f2f3', warn: '#a86a08', warnSoft: '#fbf1dc', idleSoft: '#eef0f4',
    epic: '#6a3fc4', epicSoft: '#efe9fb', glass: 'rgb(243 245 249 / 0.86)', shadowPop: '0 16px 40px -16px rgb(20 26 38 / 0.32)',
  },
  dark: {
    paper: '#0d1118', surface: '#151b25', sunken: '#111720', raised: '#1b2230',
    ink: '#e7ebf3', ink2: '#c3cad8', muted: '#8b95a8', faint: '#5f6a7e', line: '#252e3c', lineStrong: '#334055', onInk: '#0d1118',
    primary: '#7b93ff', primaryHover: '#94a8ff', primaryPressed: '#6680f0', primarySoft: '#1d2645',
    presale: '#8e9bff', presaleSoft: '#1f2547', win: '#4cc38a', winSoft: '#12302a', lose: '#ff7a70', loseSoft: '#3a1b1d',
    post: '#45c4c9', postSoft: '#10302f', warn: '#e9b04d', warnSoft: '#35290f', idleSoft: '#1e2633',
    epic: '#b394ff', epicSoft: '#2a2142', glass: 'rgb(13 17 24 / 0.82)', shadowPop: '0 16px 40px -12px rgb(0 0 0 / 0.6)',
  },
}

const read = (): Mode => { try { return (localStorage.getItem('op-theme') as Mode) || 'system' } catch { return 'system' } }
const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
export const theme = reactive({ mode: read(), systemDark: !!mq?.matches })
mq?.addEventListener?.('change', (e) => (theme.systemDark = e.matches))

export const isDark = computed(() => theme.mode === 'dark' || (theme.mode === 'system' && theme.systemDark))
export function setMode(m: Mode) {
  theme.mode = m
  try { localStorage.setItem('op-theme', m) } catch { /* private window: keep in memory */ }
}

// Mirror the tokens onto :root so every hand-written style follows the mode.
watchEffect(() => {
  if (typeof document === 'undefined') return
  const t = isDark.value ? T.dark : T.light
  const r = document.documentElement
  r.dataset.theme = isDark.value ? 'dark' : 'light'
  r.style.colorScheme = isDark.value ? 'dark' : 'light'
  const map: Record<string, string> = {
    paper: t.paper, surface: t.surface, sunken: t.sunken, raised: t.raised, ink: t.ink, 'ink-2': t.ink2, muted: t.muted, faint: t.faint,
    line: t.line, 'line-strong': t.lineStrong, 'on-ink': t.onInk, action: t.primary, focus: t.primary, primary: t.primary, 'primary-soft': t.primarySoft,
    presale: t.presale, 'presale-soft': t.presaleSoft, win: t.win, 'win-soft': t.winSoft, lose: t.lose, 'lose-soft': t.loseSoft,
    post: t.post, 'post-soft': t.postSoft, warn: t.warn, 'warn-soft': t.warnSoft, idle: t.muted, 'idle-soft': t.idleSoft,
    epic: t.epic, 'epic-soft': t.epicSoft, glass: t.glass, 'shadow-pop': t.shadowPop,
  }
  for (const [k, v] of Object.entries(map)) r.style.setProperty(`--${k}`, v)
})

const FONT = "'Anuphan', system-ui, sans-serif"
export const naiveTheme = computed(() => (isDark.value ? darkTheme : null))
export const overrides = computed<GlobalThemeOverrides>(() => {
  const t = isDark.value ? T.dark : T.light
  return {
    common: {
      fontFamily: FONT, fontSize: '14px', fontSizeMedium: '14px', borderRadius: '8px', borderRadiusSmall: '6px',
      primaryColor: t.primary, primaryColorHover: t.primaryHover, primaryColorPressed: t.primaryPressed, primaryColorSuppl: t.primaryHover,
      successColor: t.win, successColorHover: t.win, successColorPressed: t.win,
      warningColor: t.warn, warningColorHover: t.warn, warningColorPressed: t.warn,
      errorColor: t.lose, errorColorHover: t.lose, errorColorPressed: t.lose,
      infoColor: t.presale, textColorBase: t.ink, textColor1: t.ink, textColor2: t.ink2, textColor3: t.muted,
      bodyColor: t.paper, cardColor: t.surface, modalColor: t.surface, popoverColor: t.raised, tableColor: t.surface,
      borderColor: t.line, dividerColor: t.line, hoverColor: t.sunken, inputColor: t.surface,
    },
    Button: { fontWeight: '500', heightMedium: '36px', paddingMedium: '0 16px' },
    Card: { borderRadius: '14px', paddingMedium: '20px 24px' },
    DataTable: { thColor: t.sunken, thTextColor: t.muted, thFontWeight: '500', tdColorHover: t.sunken, borderRadius: '14px' },
    Menu: {
      itemHeight: '38px', borderRadius: '8px', itemTextColor: t.ink2, itemIconColor: t.muted,
      itemColorActive: t.primarySoft, itemColorActiveHover: t.primarySoft, itemTextColorActive: t.primary, itemIconColorActive: t.primary,
      itemTextColorActiveHover: t.primary, itemIconColorActiveHover: t.primary, itemColorHover: t.idleSoft, groupTextColor: t.faint,
    },
    Tag: { borderRadius: '999px' },
    Input: { heightMedium: '36px' },
  }
})
