<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Photo from '../components/Photo.vue'
import { ACCOUNTS, PHOTOS, SALES_TEAMS, TODAY_ISO, account, person } from '../data/mock'
import { validateCreate } from '../domain/rules'
import type { ProjectType } from '../data/model'
import { notify, projects, session } from '../store'

const router = useRouter()
const me = person(session.userId)
const f = reactive({
  name: '', customerAccountId: '', endUserAccountId: '', type: 'พัฒนาระบบ' as ProjectType, team: SALES_TEAMS.some((t) => t.code === me?.team) ? me!.team! : 'DT4-LC',
  budget: null as number | null, expectedClose: '', sales: '', nextStep: '', note: '',
})
const touched = reactive<Record<string, boolean>>({})
const salesList = computed(() => f.sales.split(',').map((x) => x.trim()).filter(Boolean))
const errors = computed(() => ({
  name: !f.name.trim() ? 'ใส่ชื่อโครงการ' : '',
  budget: f.budget !== null && f.budget < 0 ? 'งบประมาณต้องไม่ติดลบ' : '',
  sales: salesList.value.length ? '' : 'ใส่ชื่อ Sale อย่างน้อย 1 คน',
}))
const busy = ref(false)
const serverErrors = ref<string[]>([])
const customers = ACCOUNTS.filter((a) => a.type === 'customer')
const endUsers = computed(() => ACCOUNTS.filter((a) => a.parentId === f.customerAccountId || a.id === f.customerAccountId))

function create() {
  touched.name = true
  touched.sales = true
  if (errors.value.name || errors.value.budget || errors.value.sales) return
  const cust = account(f.customerAccountId)
  const draft = {
    id: '', code: '', name: f.name.trim(), customer: cust?.name ?? 'รอระบุลูกค้า', endUser: account(f.endUserAccountId)?.name ?? cust?.name ?? 'รอระบุลูกค้า',
    customerAccountId: f.customerAccountId || undefined, endUserAccountId: f.endUserAccountId || undefined,
    type: f.type, stage: 'opportunity' as const, team: f.team, revenue: 0, cost: 0, budget: f.budget ?? 0, sm: session.userId, sales: salesList.value,
    collaborators: [], nextStep: '', cover: PHOTOS.workshop, history: [],
  }
  const v = validateCreate(draft, TODAY_ISO)
  if (!v.ok) { serverErrors.value = v.errors; return }
  busy.value = true
  const id = 'p' + (projects.length + 1)
  projects.push({
    id, code: 'OPP-69-' + String(150 + projects.length).padStart(4, '0'), name: f.name.trim(),
    customer: draft.customer, endUser: draft.endUser, customerAccountId: draft.customerAccountId, endUserAccountId: draft.endUserAccountId,
    salesMotion: cust && cust.sector !== 'enterprise' ? 'tender' : 'direct', stageSince: TODAY_ISO, type: f.type, stage: 'opportunity', team: f.team,
    revenue: 0, cost: 0, budget: f.budget ?? 0, sm: session.userId, sales: salesList.value, collaborators: [],
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
          <div class="field">
            <label for="cus">ลูกค้า</label>
            <select id="cus" v-model="f.customerAccountId" class="input" @change="f.endUserAccountId = ''">
              <option value="">ยังไม่ทราบ — ระบุก่อนเข้า Pipeline</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <span class="hint">ไม่พบในรายการ? เพิ่มที่ทะเบียนลูกค้า</span>
          </div>
          <div class="field">
            <label for="eu">End User</label>
            <select id="eu" v-model="f.endUserAccountId" class="input" :disabled="!f.customerAccountId">
              <option value="">เหมือนลูกค้า</option>
              <option v-for="c in endUsers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
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
            <label for="team">ทีมเจ้าของโครงการ (Profit Center)</label>
            <select id="team" v-model="f.team" class="input"><option v-for="t in SALES_TEAMS" :key="t.code" :value="t.code">{{ t.code }} · {{ t.name }}</option></select>
          </div>
          <div class="field">
            <label for="bud">Budget ลูกค้า (บาท)</label>
            <input id="bud" v-model.number="f.budget" class="input num" type="number" min="0" step="10000" inputmode="numeric" @blur="touched.budget = true" />
            <span v-if="touched.budget && errors.budget" class="err">{{ errors.budget }}</span>
          </div>
        </div>

        <div class="two">
          <div class="field"><label for="ec">Expected Close</label><input id="ec" v-model="f.expectedClose" class="input" type="date" /></div>
          <div class="field">
            <label for="sale">Sale ที่ทำงานคู่กับคุณ</label>
            <input id="sale" v-model="f.sales" class="input" placeholder="เช่น Sirinya B., Pongsak T." :aria-invalid="touched.sales && !!errors.sales" @blur="touched.sales = true" />
            <span v-if="touched.sales && errors.sales" class="err">{{ errors.sales }}</span>
            <span v-else class="hint">อย่างน้อย 1 คน คั่นด้วยจุลภาค · Sale ไม่ได้ใช้ One Platform</span>
          </div>
        </div>

        <div class="field"><label for="ns">Next step</label><input id="ns" v-model="f.nextStep" class="input" placeholder="เช่น นัดเก็บ Requirement 12 พ.ย." /></div>

        <div v-if="serverErrors.length" class="err" role="alert"><p v-for="e in serverErrors" :key="e">{{ e }}</p></div>
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
