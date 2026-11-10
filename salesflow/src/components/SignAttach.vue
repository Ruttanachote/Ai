<script setup lang="ts">
// "Sign and confirm" block used in Approve / Send to Approve: shows the e-signature that will be
// attached, lets the person create one on the spot (saved to their profile), and asks for consent.
import { computed, ref } from 'vue'
import SignaturePad from './SignaturePad.vue'
import { notify, session, setSignature, signatures } from '../store'
import { person, TODAY_ISO, thDate } from '../data/mock'

const confirmed = defineModel<boolean>('confirmed', { default: false })
defineProps<{ action: string }>()
const sig = computed(() => signatures[session.userId])
const drawing = ref(false)
function onSave(url: string, method: 'draw' | 'type') { setSignature(session.userId, url, method); drawing.value = false; notify('บันทึกลายเซ็นในโปรไฟล์แล้ว') }
</script>

<template>
  <section class="sa" aria-label="ลายเซ็นอิเล็กทรอนิกส์">
    <p class="h"><b>ลายเซ็นที่แนบกับการ{{ action }}</b></p>
    <template v-if="sig && !drawing">
      <div class="pv"><img :src="sig.dataUrl" :alt="`ลายเซ็นของ ${person(session.userId)?.name}`" /><span class="small muted">{{ person(session.userId)?.name }} · ลงนาม {{ thDate(TODAY_ISO) }}</span></div>
      <button class="btn ghost sm" @click="drawing = true">เซ็นใหม่</button>
    </template>
    <template v-else>
      <p v-if="!sig" class="small warn">ยังไม่มีลายเซ็น — สร้างที่นี่ได้เลย (บันทึกในโปรไฟล์ของคุณ)</p>
      <SignaturePad :name="person(session.userId)?.name ?? ''" @save="onSave" @cancel="drawing = false" />
    </template>
    <label v-if="sig && !drawing" class="ok"><input v-model="confirmed" type="checkbox" /> ข้าพเจ้ายืนยันการลงนามอิเล็กทรอนิกส์เพื่อ{{ action }}เอกสารนี้</label>
  </section>
</template>

<style scoped>
.sa { border: 1px solid var(--line); border-radius: var(--r-md); padding: 12px 14px; display: grid; gap: 8px; margin-top: 12px; }
.h { margin: 0; }
.pv { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid var(--line); border-radius: var(--r-sm); padding: 6px 10px; }
.pv img { height: 48px; max-width: 220px; object-fit: contain; }
.warn { color: var(--warn); margin: 0; }
.ok { display: flex; gap: 8px; align-items: flex-start; font-size: 14px; cursor: pointer; }
.ok input { margin-top: 3px; width: 18px; height: 18px; }
</style>
