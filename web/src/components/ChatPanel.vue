<script setup lang="ts">
import { ref } from 'vue'
import { api } from '../api'
import type { EditProposal } from '../types'
import ProposalCard from './ProposalCard.vue'

const props = defineProps<{ projectId: string }>()
const emit = defineEmits<{ applied: [] }>()

interface ChatItem {
  role: 'user' | 'agent' | 'error'
  text?: string
  proposal?: EditProposal
  applied?: boolean
}

const items = ref<ChatItem[]>([])
const draft = ref('')
const busy = ref(false)

const quickPrompts = [
  'ตัดช่วงเงียบและคำฟุ่มเฟือยออก',
  'ทำไฮไลต์ยาว 60 วินาที',
  'ใส่ซับไตเติลภาษาไทย',
]

async function send(text?: string) {
  const message = (text ?? draft.value).trim()
  if (!message || busy.value) return
  draft.value = ''
  items.value.push({ role: 'user', text: message })
  busy.value = true
  try {
    const proposal = await api.chat(props.projectId, message)
    items.value.push({ role: 'agent', proposal })
  } catch (e) {
    items.value.push({ role: 'error', text: (e as Error).message })
  } finally {
    busy.value = false
  }
}

async function apply(item: ChatItem) {
  if (!item.proposal || item.applied) return
  try {
    await api.applyEdits(props.projectId, item.proposal.summary, item.proposal.operations)
    item.applied = true
    emit('applied')
  } catch (e) {
    items.value.push({ role: 'error', text: (e as Error).message })
  }
}

function reject(item: ChatItem) {
  items.value = items.value.filter((i) => i !== item)
}
</script>

<template>
  <section class="chat panel">
    <h2>💬 สั่งตัดต่อ</h2>

    <div class="messages">
      <p v-if="items.length === 0" class="muted hint">
        พิมพ์สั่งเป็นภาษาไทยหรืออังกฤษได้เลย — AI จะเสนอการแก้ไขให้กด Apply ก่อนเสมอ
        ไม่มีอะไรถูกแก้โดยที่คุณไม่เห็น
      </p>
      <template v-for="(item, i) in items" :key="i">
        <div v-if="item.role === 'user'" class="bubble user">{{ item.text }}</div>
        <div v-else-if="item.role === 'error'" class="bubble error">⚠ {{ item.text }}</div>
        <ProposalCard
          v-else-if="item.proposal"
          :proposal="item.proposal"
          :applied="item.applied ?? false"
          @apply="apply(item)"
          @reject="reject(item)"
        />
      </template>
      <div v-if="busy" class="bubble agent muted">กำลังคิด…</div>
    </div>

    <div class="quick">
      <button v-for="q in quickPrompts" :key="q" :disabled="busy" @click="send(q)">
        {{ q }}
      </button>
    </div>

    <form class="composer" @submit.prevent="send()">
      <textarea
        v-model="draft"
        rows="2"
        placeholder="เช่น ตัด 30 วินาทีแรกออก แล้วเก็บเฉพาะช่วงที่พูดถึงราคา"
        @keydown.enter.exact.prevent="send()"
      />
      <button class="primary" type="submit" :disabled="busy || !draft.trim()">ส่ง</button>
    </form>
  </section>
</template>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 14px;
  gap: 10px;
}

h2 {
  margin: 0;
  font-size: 14px;
}

.messages {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hint {
  font-size: 12.5px;
}

.bubble {
  border-radius: 8px;
  padding: 8px 11px;
  max-width: 95%;
}

.bubble.user {
  background: var(--accent);
  color: #0d1020;
  align-self: flex-end;
}

.bubble.agent {
  background: var(--panel-2);
}

.bubble.error {
  background: color-mix(in srgb, var(--danger) 18%, transparent);
  color: var(--danger);
}

.quick {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.quick button {
  font-size: 12px;
  padding: 4px 10px;
}

.composer {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.composer textarea {
  resize: none;
}
</style>
