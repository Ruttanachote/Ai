<script setup lang="ts">
// My Profile (every role): details from Microsoft Entra ID, phone and notification preferences,
// the menus this role can use — and for SM / executives an e-signature that is attached to every
// approval request they send and every approval they give.
import { computed, ref } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import Avatar from '../components/Avatar.vue'
import Icon from '../components/Icon.vue'
import Dialog from '../components/Dialog.vue'
import SignaturePad from '../components/SignaturePad.vue'
import { GROUP_NAME, PEOPLE, groupOf, person, teamOf, thDate } from '../data/mock'
import { ROLES } from '../data/model'
import { NAV } from '../nav'
import { SIGNER_ROLES, notify, profileOf, projects, removeSignature, session, setSignature, signatureLog, signatures } from '../store'
import { mailboxOf } from '../components/exec/mail'

const me = computed(() => person(session.userId))
const team = computed(() => teamOf(me.value?.team))
const manager = computed(() => PEOPLE.find((u) => u.id !== session.userId && u.role === 'head' && (u.team === me.value?.team || u.team === groupOf(me.value?.team ?? ''))))
const prof = computed(() => profileOf(session.userId))
const canSign = computed(() => SIGNER_ROLES.includes(session.role))
const sig = computed(() => signatures[session.userId])
const menus = computed(() => NAV.map((g) => ({ g: g.title, items: g.items.filter((i) => i.roles.includes(session.role)) })).filter((g) => g.items.length))
// Where my signature has been attached.
const signed = computed(() => projects.flatMap((p) => (p.approval?.steps ?? []).filter((s) => s.whoId === session.userId && s.signature).map((s) => ({ p, s, v: p.approval!.version }))))
const myLog = computed(() => signatureLog.filter((l) => l.who === session.userId))

const padOpen = ref(false)
const confirmRemove = ref(false)
function onSave(dataUrl: string, method: 'draw' | 'type') {
  setSignature(session.userId, dataUrl, method)
  padOpen.value = false
  notify('บันทึกลายเซ็นแล้ว — จะแนบไปกับการอนุมัติครั้งถัดไป')
}
</script>

<template>
  <div class="page">
    <PageHeader title="My Profile" :subtitle="canSign ? 'ข้อมูลพนักงานจาก Microsoft Entra ID · ตั้งค่าการแจ้งเตือน · ลายเซ็นอิเล็กทรอนิกส์' : 'ข้อมูลพนักงานจาก Microsoft Entra ID · ตั้งค่าการแจ้งเตือน'" />
    <div v-if="me" class="grid">
      <section class="panel card">
        <Avatar :id="me.id" :size="72" />
        <div class="who">
          <h2>{{ me.name }}</h2>
          <p class="muted">{{ me.position ?? ROLES[session.role].label }}</p>
          <p class="small"><span class="chip">{{ ROLES[session.role].label }}</span></p>
        </div>
        <dl class="kv">
          <dt>อีเมล (Microsoft 365)</dt><dd>{{ mailboxOf(me.id) }}</dd>
          <dt>ทีม</dt><dd>{{ me.team }} · {{ team?.name }}</dd>
          <dt>กลุ่ม</dt><dd>{{ GROUP_NAME[groupOf(me.team ?? '')] ?? '—' }}</dd>
          <dt>หัวหน้า</dt><dd>{{ manager?.name ?? '—' }}</dd>
          <dt><label for="pf-phone">โทรศัพท์</label></dt><dd><input id="pf-phone" v-model="prof.phone" class="input mini" placeholder="08x-xxx-xxxx" /></dd>
        </dl>
        <p class="hint">ชื่อ ตำแหน่ง ทีม และบทบาทมาจาก Microsoft Entra ID — แก้ได้ที่ฝ่าย IT / ผู้ดูแลระบบ</p>
      </section>

      <section v-if="canSign" class="panel">
        <div class="panel-head"><h2><Icon name="check" :size="18" /> ลายเซ็นอิเล็กทรอนิกส์</h2><span class="muted small">แนบกับการส่งขออนุมัติและการอนุมัติออนไลน์</span></div>
        <div v-if="sig" class="sigbox">
          <img :src="sig.dataUrl" :alt="`ลายเซ็นของ ${me.name}`" />
          <p class="small muted">{{ sig.method === 'draw' ? 'วาดด้วยมือ' : 'พิมพ์ชื่อ' }} · อัปเดต {{ thDate(sig.updatedAt) }}</p>
        </div>
        <div v-else class="empty">
          <Icon name="file" :size="26" />
          <p><strong>ยังไม่มีลายเซ็น</strong></p>
          <p class="small muted">{{ session.role === 'sm' ? 'ต้องมีลายเซ็นก่อนส่ง Cost Sheet + Quotation ขออนุมัติ' : 'ต้องมีลายเซ็นก่อนกดอนุมัติออนไลน์' }}</p>
        </div>
        <div class="acts">
          <button class="btn primary" @click="padOpen = true">{{ sig ? 'เปลี่ยนลายเซ็น' : 'สร้างลายเซ็น' }}</button>
          <button v-if="sig" class="btn danger" @click="confirmRemove = true">ลบลายเซ็น</button>
        </div>
        <h3 class="sub">เอกสารที่แนบลายเซ็นแล้ว ({{ signed.length }})</h3>
        <ul class="signed">
          <li v-for="x in signed" :key="x.p.id + x.s.role">
            <img :src="x.s.signature" alt="" />
            <span><router-link :to="`/projects/${x.p.id}?tab=cost`">{{ x.p.name }}</router-link><span class="small muted"> · {{ x.s.role }} · {{ x.v }} · {{ x.s.signedAt ?? x.s.at }}</span></span>
          </li>
        </ul>
        <p v-if="!signed.length" class="small muted">ยังไม่มี</p>
        <p v-if="myLog.length" class="small muted">ประวัติ: {{ myLog.map((l) => `${l.text} ${thDate(l.at)}`).join(' · ') }}</p>
      </section>

      <section class="panel">
        <div class="panel-head"><h2><Icon name="bell" :size="18" /> การแจ้งเตือน</h2></div>
        <label class="tg"><input v-model="prof.notify.inapp" type="checkbox" /> <span><b>ในระบบ (กระดิ่ง)</b><span class="small muted">งานที่ถึงคิว คำขออนุมัติ การเปลี่ยนสถานะ</span></span></label>
        <label class="tg"><input v-model="prof.notify.email" type="checkbox" /> <span><b>อีเมล Outlook</b><span class="small muted">คำขออนุมัติ ผลอนุมัติ และงานอัตโนมัติรายวัน</span></span></label>
        <label class="tg"><input v-model="prof.notify.teams" type="checkbox" /> <span><b>Microsoft Teams</b><span class="small muted">แจ้งเตือนในแชท และนัดประชุม</span></span></label>
      </section>

      <section class="panel">
        <div class="panel-head"><h2><Icon name="lock" :size="18" /> สิทธิ์ของฉัน</h2></div>
        <p class="small">{{ ROLES[session.role].th }}</p>
        <div v-for="g in menus" :key="g.g" class="mg"><p class="small muted">{{ g.g }}</p><div class="chips"><router-link v-for="i in g.items" :key="i.to" :to="i.to" class="chip">{{ i.label }}</router-link></div></div>
      </section>
    </div>

    <Dialog :open="padOpen" :title="sig ? 'เปลี่ยนลายเซ็น' : 'สร้างลายเซ็น'" wide @close="padOpen = false">
      <SignaturePad v-if="padOpen && me" :name="me.name" @save="onSave" @cancel="padOpen = false" />
    </Dialog>
    <Dialog :open="confirmRemove" title="ลบลายเซ็น" @close="confirmRemove = false">
      <p>เอกสารที่ลงนามไปแล้วยังเก็บลายเซ็นเดิมไว้ แต่การอนุมัติครั้งถัดไปต้องสร้างลายเซ็นใหม่ก่อน</p>
      <template #foot><button class="btn" @click="confirmRemove = false">ยกเลิก</button><button class="btn danger" @click="removeSignature(session.userId); confirmRemove = false; notify('ลบลายเซ็นแล้ว')">ลบลายเซ็น</button></template>
    </Dialog>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(420px, 100%), 1fr)); gap: 20px; align-items: start; }
.card { display: grid; gap: 14px; }
.who h2 { margin: 0; font-size: 22px; }
.who p { margin: 2px 0 0; }
.kv { display: grid; grid-template-columns: 150px 1fr; gap: 8px 12px; margin: 0; align-items: center; }
.kv dt { color: var(--muted); font-size: 14px; }
.kv dd { margin: 0; overflow-wrap: anywhere; }
.mini { min-height: 36px; }
.panel-head h2 { display: flex; gap: 8px; align-items: center; font-size: 18px; }
.sigbox { border: 1px solid var(--line); border-radius: var(--r-md); padding: 16px; background: #fff; display: grid; justify-items: center; gap: 6px; }
.sigbox img { max-width: 100%; max-height: 110px; }
.sigbox p { margin: 0; }
.empty { display: grid; justify-items: center; gap: 4px; padding: 20px; border: 1px dashed var(--line-strong); border-radius: var(--r-md); text-align: center; color: var(--muted); }
.empty p { margin: 0; }
.acts { display: flex; gap: 8px; margin-top: 12px; }
.sub { font-size: 15px; margin: 18px 0 8px; }
.signed { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.signed li { display: flex; align-items: center; gap: 12px; }
.signed img { width: 90px; height: 34px; object-fit: contain; background: #fff; border: 1px solid var(--line); border-radius: 4px; }
.tg { display: flex; gap: 12px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid var(--line); cursor: pointer; }
.tg:last-child { border-bottom: 0; }
.tg input { width: 18px; height: 18px; margin-top: 3px; }
.tg > span { display: grid; }
.mg { margin-top: 10px; }
.mg p { margin: 0 0 4px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chips .chip:hover { text-decoration: none; background: var(--primary-soft); color: var(--primary); }
@media (max-width: 560px) { .kv { grid-template-columns: 1fr; } }
</style>
