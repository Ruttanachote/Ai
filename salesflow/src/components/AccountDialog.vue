<script setup lang="ts">
// Add a customer (or an end-user agency under a customer) to the account register.
import { computed, reactive, ref, watch } from 'vue'
import Dialog from './Dialog.vue'
import type { Account, Sector } from '../data/model'
import { accountErrors, accounts, addAccount, notify } from '../store'

const props = defineProps<{ open: boolean; type?: Account['type']; parentId?: string }>()
const emit = defineEmits<{ close: []; created: [id: string] }>()
const SECTOR: Record<Sector, string> = { government: 'หน่วยงานรัฐ', soe: 'รัฐวิสาหกิจ', enterprise: 'เอกชน', other: 'อื่น ๆ' }
const f = reactive({ name: '', type: 'customer' as Account['type'], taxId: '', sector: 'government' as Sector, parentId: '', province: '' })
const tried = ref(false)
watch(() => props.open, (o) => { if (o) { Object.assign(f, { name: '', type: props.type ?? 'customer', taxId: '', sector: 'government', parentId: props.parentId ?? '', province: '' }); tried.value = false } })
const errors = computed(() => accountErrors({ ...f, parentId: f.parentId || undefined, taxId: f.taxId || undefined }))
const parents = computed(() => accounts.filter((a) => a.type === 'customer'))
function save() {
  tried.value = true
  if (Object.keys(errors.value).length) return
  const id = addAccount({ name: f.name, type: f.type, sector: f.sector, taxId: f.taxId || undefined, parentId: f.parentId || undefined, province: f.province.trim() || undefined })
  notify(`เพิ่ม ${f.name.trim()} ในทะเบียนลูกค้าแล้ว`)
  emit('created', id)
  emit('close')
}
const err = (k: string) => (tried.value ? errors.value[k] : '')
</script>

<template>
  <Dialog :open="open" :title="f.type === 'end_user' ? 'เพิ่มหน่วยงานผู้ใช้ (End User)' : 'เพิ่มลูกค้า'" @close="emit('close')">
    <form class="af" @submit.prevent="save">
      <fieldset class="field">
        <legend>ประเภท</legend>
        <div class="seg" role="radiogroup">
          <button type="button" role="radio" :aria-checked="f.type === 'customer'" @click="f.type = 'customer'">ลูกค้า (ผู้ว่าจ้าง)</button>
          <button type="button" role="radio" :aria-checked="f.type === 'end_user'" @click="f.type = 'end_user'">หน่วยงานผู้ใช้ (End User)</button>
        </div>
      </fieldset>
      <div class="field" :class="{ bad: err('name') }"><label for="ac-name">ชื่อลูกค้า / หน่วยงาน</label><input id="ac-name" v-model="f.name" class="input" autocomplete="organization" @blur="tried = tried || !!f.name" /><span v-if="err('name')" class="msg" role="alert">{{ err('name') }}</span></div>
      <div v-if="f.type === 'end_user'" class="field" :class="{ bad: err('parentId') }"><label for="ac-parent">สังกัดลูกค้า</label><select id="ac-parent" v-model="f.parentId" class="input"><option value="">— เลือก —</option><option v-for="a in parents" :key="a.id" :value="a.id">{{ a.name }}</option></select><span v-if="err('parentId')" class="msg" role="alert">{{ err('parentId') }}</span></div>
      <div class="two">
        <div class="field"><label for="ac-sector">ภาคส่วน</label><select id="ac-sector" v-model="f.sector" class="input"><option v-for="(l, k) in SECTOR" :key="k" :value="k">{{ l }}</option></select></div>
        <div class="field"><label for="ac-prov">จังหวัด (ไม่บังคับ)</label><input id="ac-prov" v-model="f.province" class="input" /></div>
      </div>
      <div class="field" :class="{ bad: err('taxId') }"><label for="ac-tax">เลขประจำตัวผู้เสียภาษี (ไม่บังคับ)</label><input id="ac-tax" v-model="f.taxId" class="input num" inputmode="numeric" placeholder="13 หลัก" /><span v-if="err('taxId')" class="msg" role="alert">{{ err('taxId') }}</span><span v-else class="hint">ใช้ตรวจชื่อซ้ำและออกใบเสนอราคา / ใบแจ้งหนี้</span></div>
      <button type="submit" hidden />
    </form>
    <template #foot><button class="btn" @click="emit('close')">ยกเลิก</button><button class="btn primary" @click="save">เพิ่ม{{ f.type === 'end_user' ? 'หน่วยงาน' : 'ลูกค้า' }}</button></template>
  </Dialog>
</template>

<style scoped>
.af { display: grid; gap: 12px; }
.af fieldset { border: 0; padding: 0; margin: 0; }
.af legend { font-size: 13px; font-weight: 500; color: var(--ink-2); margin-bottom: 6px; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.msg { font-size: 12px; color: var(--lose); }
.bad .input { border-color: var(--lose); }
@media (max-width: 560px) { .two { grid-template-columns: 1fr; } }
</style>
