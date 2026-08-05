<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from './api'
import type { Health } from './types'

const health = ref<Health | null>(null)
const offline = ref(false)

onMounted(async () => {
  try {
    health.value = await api.health()
  } catch {
    offline.value = true
  }
})
</script>

<template>
  <header class="topbar">
    <RouterLink to="/" class="brand">🎬 PromptCut</RouterLink>
    <span class="status">
      <template v-if="offline">
        <span class="dot off" /> เชื่อมต่อ server ไม่ได้ — รัน
        <code>cargo run -p promptcut-server</code> ก่อน
      </template>
      <template v-else-if="health">
        <span class="dot" :class="health.agent_enabled ? 'on' : 'warn'" />
        <template v-if="health.agent_mode === 'claude-cli'">AI พร้อม (Claude Code — subscription)</template>
        <template v-else-if="health.agent_enabled">AI พร้อม ({{ health.model }})</template>
        <template v-else>AI ปิดอยู่ — ตั้ง ANTHROPIC_API_KEY หรือ login Claude Code</template>
      </template>
    </span>
  </header>
  <main class="content">
    <RouterView />
  </main>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
  flex: 0 0 auto;
}

.brand {
  font-weight: 700;
  font-size: 16px;
  color: var(--text);
  text-decoration: none;
}

.status {
  color: var(--muted);
  font-size: 12.5px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot.on { background: var(--accent-2); }
.dot.warn { background: #e0b653; }
.dot.off { background: var(--danger); }

.content {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
</style>
