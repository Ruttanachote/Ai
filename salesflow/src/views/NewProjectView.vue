<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Photo from '../components/Photo.vue'
import { CATALOG, PHOTOS, SALES_TEAMS, TODAY_ISO, account, person } from '../data/mock'
import { validateCreate } from '../domain/rules'
import { PROJECT_TYPES, WORK_SCOPES, type ProjectType, type WorkScope } from '../data/model'
import { accounts, notify, projects, session } from '../store'
import AccountDialog from '../components/AccountDialog.vue'

const router = useRouter()
const me = person(session.userId)
const f = reactive({
  origin: 'customer' as 'customer' | 'product', catalogId: '',
  name: '', customerAccountId: '', endUserAccountId: '', type: 'NNS' as ProjectType, scope: 'software' as WorkScope, team: SALES_TEAMS.some((t) => t.code === me?.team) ? me!.team! : 'DT4-LC',
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
// Product-led: start from a Solution Catalog item (name, team and price prefilled).
const item = computed(() => CATALOG.find((c) => c.id === f.catalogId))
function pickCatalog() {
  const c = item.value
  if (!c) return
  if (!f.name.trim()) f.name = c.name
  f.team = c.team
  if (f.budget === null) f.budget = c.price
}
const customers = computed(() => accounts.filter((a) => a.type === 'customer'))
const accOpen = ref<'' | 'customer' | 'end_user'>('')
function onAccount(id: string) { if (accOpen.value === 'end_user') f.endUserAccountId = id; else { f.customerAccountId = id; f.endUserAccountId = '' } }
const endUsers = computed(() => accounts.filter((a) => a.parentId === f.customerAccountId || a.id === f.customerAccountId))

function create() {
  touched.name = true
  touched.sales = true
  if (errors.value.name || errors.value.budget || errors.value.sales) return
  const cust = account(f.customerAccountId)
  const draft = {
    id: '', code: '', name: f.name.trim(), customer: cust?.name ?? 'รอระบุลูกค้า', endUser: account(f.endUserAccountId)?.name ?? cust?.name ?? 'รอระบุลูกค้า',
    customerAccountId: f.customerAccountId || undefined, endUserAccountId: f.endUserAccountId || undefined,
    origin: f.origin, catalogId: f.origin === 'product' ? f.catalogId || undefined : undefined,
    salesDocs: f.origin === 'product' && item.value ? { proposal: item.value.proposal.replace('-template', '-v1') } : undefined,
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
    salesMotion: cust && cust.sector !== 'enterprise' ? 'tender' : 'direct', stageSince: TODAY_ISO, type: f.type, scope: f.scope, stage: 'opportunity', team: f.team,
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
    <router-link to="/projects" class="back small">‹ Project Overview</router-link>
    <div class="wrap">
      <form class="panel form" novalidate @submit.prevent="create">
        <header>
          <h1>ลงทะเบียนโครงการใหม่ <span class="chip presale">สถานะเริ่มต้น: Opportunity</span></h1>
          <p class="muted">กรอกเท่าที่รู้ตอนนี้ ข้อมูลอื่นเพิ่มได้ภายหลัง โครงการจะเริ่มที่สถานะ Opportunity</p>
        </header>

        <fieldset class="field">
          <legend>แหล่งที่มาของโครงการ</legend>
          <div class="types">
            <label :class="{ on: f.origin === 'customer' }"><input v-model="f.origin" type="radio" name="origin" value="customer" /> ลูกค้ามีโอกาสจ้าง</label>
            <label :class="{ on: f.origin === 'product' }"><input v-model="f.origin" type="radio" name="origin" value="product" /> ทีมคิด Product เอง (Product-led)</label>
          </div>
        </fieldset>
        <div v-if="f.origin === 'product'" class="field">
          <label for="cat">เลือกจาก Solution Catalog</label>
          <select id="cat" v-model="f.catalogId" class="input" @change="pickCatalog">
            <option value="">เลือกโซลูชัน…</option>
            <option v-for="c in CATALOG" :key="c.id" :value="c.id">{{ c.name }} · {{ c.team }}</option>
          </select>
          <span v-if="item" class="hint">{{ item.summary }} · ราคาอ้างอิง {{ item.price.toLocaleString() }} บาท · {{ item.manday }} Man-day · ได้ Proposal ตั้งต้นจาก Template</span>
        </div>

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
            <button type="button" class="btn ghost sm addacc" @click="accOpen = 'customer'">+ เพิ่มลูกค้าใหม่</button>
          </div>
          <div class="field">
            <label for="eu">End User</label>
            <select id="eu" v-model="f.endUserAccountId" class="input" :disabled="!f.customerAccountId">
              <option value="">เหมือนลูกค้า</option>
              <option v-for="c in endUsers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <button type="button" class="btn ghost sm addacc" :disabled="!f.customerAccountId" @click="accOpen = 'end_user'">+ เพิ่มหน่วยงานผู้ใช้</button>
          </div>
        </div>

        <fieldset class="field">
          <legend>ประเภทโครงการ</legend>
          <div class="types">
            <label v-for="(t, k) in PROJECT_TYPES" :key="k" :class="{ on: f.type === k }">
              <input v-model="f.type" type="radio" name="type" :value="k" /> <span><b>{{ t.label }}</b> <span class="small muted tth">{{ t.th }}</span></span>
            </label>
          </div>
        </fieldset>

        <fieldset class="field">
          <legend>ลักษณะงาน</legend>
          <div class="types">
            <label v-for="(l, k) in WORK_SCOPES" :key="k" :class="{ on: f.scope === k }">
              <input v-model="f.scope" type="radio" name="scope" :value="k" /> {{ l }}
            </label>
          </div>
          <span class="hint">PMO ใช้เลือก PM ที่ถนัดงานแบบนี้ — เช่น ติดตั้ง Hardware ลงพื้นที่บ่อย หรือพัฒนาระบบ Software</span>
        </fieldset>

        <div class="two">
          <div class="field">
            <label for="team">ทีมเจ้าของโครงการ (Profit Center)</label>
            <select id="team" v-model="f.team" class="input"><option v-for="t in SALES_TEAMS.filter((x) => x.active !== false)" :key="t.code" :value="t.code">{{ t.code }} · {{ t.name }}</option></select>
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
    <AccountDialog :open="!!accOpen" :type="accOpen || 'customer'" :parent-id="accOpen === 'end_user' ? f.customerAccountId : undefined" @close="accOpen = ''" @created="onAccount" />
  </div>
</template>

<style scoped>
.addacc { justify-self: start; }
.back { display: inline-block; margin-bottom: 12px; color: var(--muted); }
header h1 .chip { vertical-align: middle; margin-left: 8px; font-size: 13px; }
.wrap { display: grid; grid-template-columns: minmax(0, 680px) 1fr; gap: 24px; align-items: start; }
.form { display: grid; gap: 20px; padding: 32px; }
.form header p { margin-top: 6px; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
fieldset { border: 0; padding: 0; margin: 0; }
legend { font-size: 13px; font-weight: 500; color: var(--ink-2); margin-bottom: 6px; }
.types { display: flex; gap: 8px; flex-wrap: wrap; }
.types label { display: inline-flex; align-items: center; gap: 8px; padding: 0 14px; min-height: 40px; border: 1px solid var(--line-strong); border-radius: var(--r-sm); cursor: pointer; font-size: 14px; }
.types label.on { border-color: var(--ink); background: var(--ink); color: var(--on-ink); }
.tth { margin-left: 4px; }
.types label.on .muted { color: inherit; opacity: 0.75; }
.types input { position: absolute; opacity: 0; }
.types label:focus-within { outline: 2px solid var(--focus); outline-offset: 2px; }
.err { font-size: 13px; color: var(--lose); }
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
