<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Photo from '../components/Photo.vue'
import { PHOTOS } from '../data/mock'
import { ROLES, type Role } from '../data/model'
import { session, setRole } from '../store'
import { HOME } from '../nav'

const router = useRouter()
const role = ref<Role>('sm')
const busy = ref(false)

function signIn() {
  busy.value = true
  // Production: MSAL redirect to Entra ID → app role claim decides the module set.
  setTimeout(() => {
    setRole(role.value)
    session.signedIn = true
    router.push(HOME[role.value])
  }, 450)
}
</script>

<template>
  <main class="login">
    <section class="visual">
      <Photo :id="PHOTOS.login" :w="1600" alt="สำนักงานที่ทีม DT ทำงานร่วมกัน" />
      <div class="caption">
        <div class="mark">
          <span>STREAM</span>
          <svg viewBox="0 0 10 16" width="12" height="19" aria-hidden="true"><path d="M1.5 1.5L8 8l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </div>
        <h1>One Platform<br />จากโอกาสขายแรก<br />ถึงวันต่อสัญญา MA</h1>
        <ol class="flow">
          <li><b>Pre-sale</b> SM กับ Sale เก็บ Requirement ประเมิน Man-day ใน Cost Sheet ตาม TOR</li>
          <li><b>อนุมัติ</b> รองผู้บริหาร แล้วผู้บริหาร DT พร้อมเก็บทุกเวอร์ชัน</li>
          <li><b>Handover และส่งมอบ</b> SM PM MA OPN และหัวหน้าทีม Dev ส่งต่องาน PM คุมแผนและ OT</li>
          <li><b>MA</b> ดูแลประกัน รับเคสผ่าน Helpdesk และออกใบเสนอราคาต่อสัญญาเอง</li>
        </ol>
      </div>
    </section>

    <section class="form">
      <div class="box">
        <h2>เข้าสู่ระบบ</h2>
        <p class="muted">ใช้บัญชี Microsoft ของบริษัท ระบบจะเปิดโมดูลตามตำแหน่งงานของคุณ · เปิดใช้กับ DT SBU ก่อน แล้วขยายไป DB</p>

        <div class="field">
          <label for="role">บทบาทสำหรับเดโม</label>
          <select id="role" v-model="role" class="input">
            <option v-for="(r, k) in ROLES" :key="k" :value="k">{{ r.label }}</option>
          </select>
          <span class="hint">{{ ROLES[role].th }}</span>
        </div>

        <button class="btn primary ms" :disabled="busy" @click="signIn">
          <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true"><rect width="10" height="10" fill="#f25022" /><rect x="11" width="10" height="10" fill="#7fba00" /><rect y="11" width="10" height="10" fill="#00a4ef" /><rect x="11" y="11" width="10" height="10" fill="#ffb900" /></svg>
          {{ busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบด้วย Microsoft' }}
        </button>
        <p class="hint">ในระบบจริงไม่มีช่องเลือกบทบาท — สิทธิ์มาจาก App Role ใน Microsoft Entra ID ที่ผู้ดูแลระบบกำหนด</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login { display: grid; grid-template-columns: 1.15fr 1fr; min-height: 100vh; background: var(--surface); }
.visual { position: relative; }
.visual .photo { position: absolute; inset: 0; }
.visual::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgb(22 27 38 / 0.25) 0%, rgb(22 27 38 / 0.86) 72%); }
.caption { position: absolute; inset: auto 0 0 0; z-index: 1; padding: 48px 56px; color: #fff; display: grid; gap: 28px; }
.mark { display: flex; align-items: center; gap: 10px; font-family: var(--display); font-weight: 700; letter-spacing: 0.24em; font-size: 15px; }
.mark svg { color: var(--brand); }
.caption h1 { font-size: clamp(30px, 3.4vw, 46px); line-height: 1.18; font-weight: 600; max-width: 16ch; }
.flow { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 28px; counter-reset: s; max-width: 640px; }
.flow li { counter-increment: s; font-size: 14px; color: #d5d9e1; padding-left: 30px; position: relative; line-height: 1.5; }
.flow li::before { content: counter(s); position: absolute; left: 0; top: 0; width: 20px; height: 20px; border: 1px solid #ffffff66; border-radius: 50%; display: grid; place-items: center; font-size: 11px; font-family: var(--display); }
.flow b { display: block; color: #fff; font-weight: 600; }
.form { display: grid; place-items: center; padding: 40px 24px; }
.box { width: 100%; max-width: 380px; display: grid; gap: 20px; }
.ms { min-height: 46px; font-size: 15px; }
@media (max-width: 900px) {
  .login { grid-template-columns: 1fr; }
  .visual { min-height: 440px; }
  .caption { padding: 32px 20px; }
  .flow { grid-template-columns: 1fr; }
}
</style>
