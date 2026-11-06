<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Photo from '../components/Photo.vue'
import { PHOTOS, TEAMS, person } from '../data/mock'
import type { ProjectType } from '../data/model'
import { notify, projects, session } from '../store'

const router = useRouter()
const me = person(session.userId)
const f = reactive({
  name: '', customer: '', endUser: '', type: 'พัฒนาระบบ' as ProjectType, team: me?.team ?? 'DT4-2',
  budget: null as number | null, expectedClose: '', sale: '', nextStep: '', note: '',
})
const touched = reactive<Record<string, boolean>>({})
const errors = computed(() => ({
  name: !f.name.trim() ? 'ใส่ชื่อโครงการ' : '',
  budget: f.budget !== null && f.budget < 0 ? 'งบประมาณต้องไม่ติดลบ' : '',
}))
const busy = ref(false)

function create() {
  touched.name = true
  if (errors.value.name || errors.value.budget) return
  busy.value = true
  const id = 'p' + (projects.length + 1)
  projects.push({
    id, code: 'OPP-69-' + String(150 + projects.length).padStart(4, '0'), name: f.name.trim(),
    customer: f.customer || 'รอระบุลูกค้า', endUser: f.endUser || 'รอระบุลูกค้า', type: f.type, stage: 'opportunity', team: f.team,
    revenue: 0, cost: 0, budget: f.budget ?? 0, sm: session.userId, sale: f.sale, collaborators: [],
    expectedClose: f.expectedClose || undefined, nextStep: f.nextStep || 'ระบุลูกค้าและนัดเก็บ Requirement', cover: PHOTOS.workshop,
    history: [{ stage: 'opportunity', note: `สร้างโครงการ งบประมาณลูกค้า ฿${(f.budget ?? 0).toLocaleString()}`, at: 'วันนี้', by: me?.name ?? '' }],
  })
  notify('ลงทะเบียนโครงการแล้ว — สร้างโฟลเดอร์ใน SharePoint ครบชุด')
  router.push('/projects/' + id)
}
</script>

<template>
  <div class="page">
    <div class="wrap">
      <form class="panel form" novalidate @submit.prevent="create">
        <header>
          <h1>ลงทะเบียนโครงการ</h1>
          <p class="muted">กรอกเท่าที่รู้ตอนนี้ ข้อมูลอื่นเพิ่มได้ภายหลัง โครงการจะเริ่มที่สถานะ Opportunity</p>
        </header>

        <div class="field">
          <label for="name">ชื่อโครงการ</label>
          <input id="name" v-model="f.name" class="input" :aria-invalid="touched.name && !!errors.name" aria-describedby="name-e" @blur="touched.name = true" @input="touched.name && (touched.name = !!errors.name)" />
          <span v-if="touched.name && errors.name" id="name-e" class="err">{{ errors.name }}</span>
        </div>

        <div class="two">
          <div class="field"><label for="cus">ลูกค้า</label><input id="cus" v-model="f.customer" class="input" /><span class="hint">ว่างได้ ระบบแสดงเป็น “รอระบุลูกค้า”</span></div>
          <div class="field"><label for="eu">End User</label><input id="eu" v-model="f.endUser" class="input" /></div>
        </div>

        <fieldset class="field">
          <legend>ประเภทโครงการ</legend>
          <div class="types">
            <label v-for="t in ['ซื้อขาย', 'เช่าซื้อ', 'พัฒนาระบบ', 'MA']" :key="t" :class="{ on: f.type === t }">
              <input v-model="f.type" type="radio" name="type" :value="t" /> {{ t }}
            </label>
          </div>
        </fieldset>

        <div class="two">
          <div class="field">
            <label for="team">ทีม DT (Profit Center)</label>
            <select id="team" v-model="f.team" class="input"><option v-for="t in TEAMS" :key="t.code" :value="t.code">{{ t.code }} · {{ t.name }}</option></select>
          </div>
          <div class="field">
            <label for="bud">Budget ลูกค้า (บาท)</label>
            <input id="bud" v-model.number="f.budget" class="input num" type="number" min="0" step="10000" inputmode="numeric" @blur="touched.budget = true" />
            <span v-if="touched.budget && errors.budget" class="err">{{ errors.budget }}</span>
          </div>
        </div>

        <div class="two">
          <div class="field"><label for="ec">Expected Close</label><input id="ec" v-model="f.expectedClose" class="input" type="date" /></div>
          <div class="field"><label for="sale">Account Executive (Sale)</label><input id="sale" v-model="f.sale" class="input" /><span class="hint">Sale รับใบเสนอราคาทางอีเมล</span></div>
        </div>

        <div class="field"><label for="ns">Next step</label><input id="ns" v-model="f.nextStep" class="input" placeholder="เช่น นัดเก็บ Requirement 12 พ.ย." /></div>

        <footer>
          <router-link to="/projects" class="btn ghost">ยกเลิก</router-link>
          <button class="btn primary" type="submit" :disabled="busy">ลงทะเบียนโครงการ</button>
        </footer>
      </form>

      <aside class="after">
        <Photo :id="PHOTOS.team" :w="900" alt="" />
        <div class="after-in">
          <h3>หลังลงทะเบียน ระบบจะ</h3>
          <ol>
            <li>สร้างโฟลเดอร์เอกสารก่อนและหลังการขายใน SharePoint</li>
            <li>สร้างไฟล์ Cost Sheet + Quotation (แยกแท็บ) จาก Template เมื่อเข้า Pipeline</li>
            <li>นับโครงการเข้า Pipeline ของคุณและทีม {{ f.team }}</li>
          </ol>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.wrap { display: grid; grid-template-columns: minmax(0, 680px) 1fr; gap: 24px; align-items: start; }
.form { display: grid; gap: 20px; padding: 32px; }
.form header p { margin-top: 6px; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
fieldset { border: 0; padding: 0; margin: 0; }
legend { font-size: 13px; font-weight: 500; color: var(--ink-2); margin-bottom: 6px; }
.types { display: flex; gap: 8px; flex-wrap: wrap; }
.types label { display: inline-flex; align-items: center; gap: 8px; padding: 0 14px; min-height: 40px; border: 1px solid var(--line-strong); border-radius: var(--r-sm); cursor: pointer; font-size: 14px; }
.types label.on { border-color: var(--ink); background: var(--ink); color: #fff; }
.types input { position: absolute; opacity: 0; }
.types label:focus-within { outline: 2px solid var(--focus); outline-offset: 2px; }
.err { font-size: 12.5px; color: var(--lose); }
.input[aria-invalid='true'] { border-color: var(--lose); }
footer { display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px; border-top: 1px solid var(--line); }
.after { position: sticky; top: 84px; border-radius: var(--r-lg); overflow: hidden; min-height: 420px; display: flex; align-items: flex-end; }
.after .photo { position: absolute; inset: 0; }
.after::after { content: ''; position: absolute; inset: 0; background: linear-gradient(0deg, rgb(22 27 38 / 0.92) 30%, rgb(22 27 38 / 0.2)); }
.after-in { position: relative; z-index: 1; color: #fff; padding: 28px; }
.after-in ol { margin: 12px 0 0; padding-left: 20px; display: grid; gap: 8px; color: #d5d9e1; font-size: 14px; }
@media (max-width: 1000px) { .wrap { grid-template-columns: 1fr; } .after { display: none; } }
@media (max-width: 560px) { .two { grid-template-columns: 1fr; } .form { padding: 20px; } }
</style>
