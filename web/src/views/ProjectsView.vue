<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, fmtMs } from '../api'
import type { ProjectSummary } from '../types'

const router = useRouter()
const projects = ref<ProjectSummary[]>([])
const name = ref('')
const error = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    projects.value = await api.listProjects()
    error.value = ''
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function create() {
  if (!name.value.trim()) return
  try {
    const p = await api.createProject(name.value.trim())
    router.push({ name: 'editor', params: { id: p.id } })
  } catch (e) {
    error.value = (e as Error).message
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <h1>โปรเจกต์ของฉัน</h1>

    <form class="new-project" @submit.prevent="create">
      <input v-model="name" placeholder="ตั้งชื่อโปรเจกต์ใหม่ เช่น คลิปสัมภาษณ์ EP.12" />
      <button class="primary" type="submit" :disabled="!name.trim()">+ สร้างโปรเจกต์</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="loading" class="muted">กำลังโหลด…</p>
    <p v-else-if="projects.length === 0" class="muted">
      ยังไม่มีโปรเจกต์ — สร้างอันแรกแล้วลองพิมพ์สั่งตัดวิดีโอดูครับ
    </p>

    <div class="grid">
      <RouterLink
        v-for="p in projects"
        :key="p.id"
        class="card panel"
        :to="{ name: 'editor', params: { id: p.id } }"
      >
        <strong>{{ p.name }}</strong>
        <span class="muted">
          ความยาว {{ fmtMs(p.duration_ms) }} · {{ p.assets }} ไฟล์ · แก้ไข {{ p.history_len }} ครั้ง
        </span>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 860px;
  margin: 0 auto;
  padding: 28px 20px;
}

.new-project {
  display: flex;
  gap: 10px;
  margin: 18px 0 24px;
}

.new-project button {
  flex: 0 0 auto;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 14px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  color: var(--text);
  text-decoration: none;
}

.card:hover {
  border-color: var(--accent);
}

.error {
  color: var(--danger);
}
</style>
