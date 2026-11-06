<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Photo from '../components/Photo.vue'
import StageRail from '../components/StageRail.vue'
import StageBadge from '../components/StageBadge.vue'
import Avatar from '../components/Avatar.vue'
import Icon from '../components/Icon.vue'
import Dialog from '../components/Dialog.vue'
import FolderGrid from '../components/FolderGrid.vue'
import CostSheetPanel from '../components/CostSheetPanel.vue'
import DeliveryPanel from '../components/DeliveryPanel.vue'
import MaPanel from '../components/MaPanel.vue'
import ProcurementPanel from '../components/ProcurementPanel.vue'
import { moveStage, notify, projects, session } from '../store'
import { baht, person, thDate, daysSince, TEAMS } from '../data/mock'
import { allowedMoves, stageOf, probOf, catOf, FORECAST_CAT, LOSS_REASONS, type StageKey, type ForecastCat } from '../data/model'

const props = defineProps<{ id: string }>()
const p = computed(() => projects.find((x) => x.id === props.id))
const parent = computed(() => projects.find((x) => x.id === p.value?.parentId))
const children = computed(() => projects.filter((x) => x.parentId === props.id))

type Tab = 'overview' | 'cost' | 'proc' | 'delivery' | 'ma' | 'history'
const tab = ref<Tab>('overview')
const post = computed(() => !!p.value && ['win', 'handover', 'delivery', 'warranty', 'ended', 'cancelled'].includes(p.value.stage))
const tabs = computed(() => {
  const t: { k: Tab; l: string }[] = [{ k: 'overview', l: 'ภาพรวมและเอกสาร' }, { k: 'cost', l: 'Cost Sheet และใบเสนอราคา' }]
  if (p.value?.bid || post.value) t.push({ k: 'proc', l: 'ประมูล หลักประกัน ค่าปรับ' })
  if (post.value) t.push({ k: 'delivery', l: p.value?.stage === 'win' || p.value?.stage === 'handover' ? 'Handover' : 'แผนงานและ Task' })
  if (p.value && ['warranty', 'ended'].includes(p.value.stage)) t.push({ k: 'ma', l: 'ประกันและ MA' })
  t.push({ k: 'history', l: 'ประวัติโครงการ' })
  return t
})

const moves = computed(() => (p.value ? allowedMoves(p.value.stage, session.role) : []))
const target = ref<StageKey | null>(null)
const reason = ref('')
const needsReason = computed(() => target.value === 'cancelled' || (p.value?.stage === 'lose' && target.value === 'pipeline'))
// Forward moves must pass the current stage's exit criteria; exits (Lose/Cancelled) skip them.
const forward = computed(() => !!target.value && !['lose', 'cancelled'].includes(target.value) && p.value?.stage !== 'lose')
const gate = ref<boolean[]>([])
const loss = ref({ reason: '', competitor: '', price: null as number | null })
watch(target, () => {
  gate.value = p.value ? stageOf(p.value.stage).exit.map(() => false) : []
  loss.value = { reason: '', competitor: '', price: null }
})
const canConfirm = computed(() => {
  if (needsReason.value && !reason.value.trim()) return false
  if (target.value === 'lose' && !loss.value.reason) return false
  if (forward.value && gate.value.some((g) => !g)) return false
  return true
})
const aging = computed(() => {
  if (!p.value?.stageSince) return null
  const d = daysSince(p.value.stageSince)
  const lim = stageOf(p.value.stage).staleDays
  return { d, stale: !!lim && d > lim, lim }
})
function setCat(e: Event) {
  if (p.value) p.value.forecastCat = (e.target as HTMLSelectElement).value as ForecastCat
}
function confirmMove() {
  if (!p.value || !target.value || !canConfirm.value) return
  const to = stageOf(target.value).label
  if (target.value === 'lose') {
    p.value.loss = { reason: loss.value.reason, competitor: loss.value.competitor || undefined, price: loss.value.price ?? undefined }
    reason.value = reason.value || `แพ้งาน: ${loss.value.reason}${loss.value.competitor ? ' · ผู้ชนะ ' + loss.value.competitor : ''}`
  }
  p.value.stageSince = new Date().toISOString().slice(0, 10)
  p.value.forecastCat = undefined
  moveStage(p.value.id, target.value, reason.value || `เปลี่ยนสถานะเป็น ${to}`, person(session.userId)?.name ?? '')
  notify(`เปลี่ยนสถานะเป็น ${to} แล้ว`)
  target.value = null
  reason.value = ''
}

const gp = computed(() => (p.value ? p.value.revenue - p.value.cost : 0))
const files = { TOR: 3, Proposal: 2, 'Cost Sheet': 1, Quotation: 1, Contract: 1, 'Official PO': 1, Handover: 2, 'Summary Plan Sheet': 1, 'PM Report': 4, 'Warranty Certificate': 1, 'SLA Report': 3 }
const dates = computed(() => p.value ? [
  ['Bid Due Date', p.value.bidDue], ['Expected Close', p.value.expectedClose], ['Start Project', p.value.startProject],
  ['End Project', p.value.endProject], ['Start Warranty', p.value.startWarranty], ['End Warranty', p.value.endWarranty],
] as [string, string | undefined][] : [])
const drop = ref(false)
</script>

<template>
  <div v-if="p" class="page">
    <router-link to="/projects" class="back small"><Icon name="chevron" :size="14" style="transform: rotate(180deg)" /> ทะเบียนโครงการ</router-link>

    <section class="cover">
      <Photo :id="p.cover" :w="1800" alt="" />
      <div class="cover-in">
        <div class="tags">
          <StageBadge :stage="p.stage" />
          <span class="chip dark">{{ p.type }}</span>
          <span class="chip dark">{{ p.team }}</span>
          <span v-if="aging" class="chip" :class="aging.stale ? 'lose' : 'dark'" :title="aging.stale ? `เกินเกณฑ์ ${aging.lim} วันของสถานะนี้` : ''">อยู่ในสถานะนี้ {{ aging.d }} วัน{{ aging.stale ? ' · ค้างนาน' : '' }}</span>
        </div>
        <h1>{{ p.name }}</h1>
        <p class="sub">{{ p.code }} · {{ p.customer }}<template v-if="parent"> · ต่อจาก <router-link :to="`/projects/${parent.id}`">{{ parent.code }}</router-link></template></p>
        <div v-if="moves.length" class="moves">
          <button v-for="m in moves" :key="m" class="btn" :class="m === 'lose' || m === 'cancelled' ? 'quiet' : 'light'" @click="target = m">
            {{ m === 'pipeline' && p.stage === 'lose' ? 'เปิดกลับเป็น Pipeline' : 'ย้ายไป ' + stageOf(m).label }}
          </button>
        </div>
      </div>
    </section>

    <section class="panel railbox">
      <StageRail :stage="p.stage" />
      <p class="next"><strong>Next step</strong> {{ p.nextStep }}</p>
    </section>

    <div class="tabs" role="tablist">
      <button v-for="t in tabs" :key="t.k" role="tab" :aria-selected="tab === t.k" @click="tab = t.k">{{ t.l }}</button>
    </div>

    <div v-if="tab === 'overview'" class="ov">
      <div class="left">
        <section class="panel">
          <h3>ข้อมูลการขาย</h3>
          <dl class="kv">
            <dt>ลูกค้า</dt><dd>{{ p.customer }}</dd>
            <dt>End User</dt><dd>{{ p.endUser }}</dd>
            <dt>Revenue</dt><dd class="num strong">{{ baht(p.revenue) }}<em v-if="!p.revenue">รอ Quotation อนุมัติ</em></dd>
            <dt>Cost (COGS)</dt><dd class="num">{{ baht(p.cost) }}<em v-if="!p.cost">รอ Cost Sheet อนุมัติ</em></dd>
            <dt>Gross Profit</dt><dd class="num strong">{{ baht(gp) }}<span v-if="p.revenue" class="muted"> · {{ ((gp / p.revenue) * 100).toFixed(1) }}%</span></dd>
            <dt>Budget ลูกค้า</dt><dd class="num">{{ baht(p.budget) }}</dd>
            <template v-if="stageOf(p.stage).phase === 'presale'">
              <dt>โอกาสปิด</dt><dd class="num">{{ Math.round(probOf(p) * 100) }}% · ถ่วงน้ำหนัก {{ baht(Math.round((p.revenue || p.budget) * probOf(p))) }}</dd>
              <dt><label for="fc">Forecast category</label></dt>
              <dd><select id="fc" class="input mini" :value="catOf(p)" @change="setCat"><option v-for="(l, k) in FORECAST_CAT" :key="k" :value="k">{{ l }}</option></select></dd>
            </template>
            <template v-if="p.loss">
              <dt>เหตุผลที่แพ้</dt><dd>{{ p.loss.reason }}<em v-if="p.loss.competitor" class="lossnote">ผู้ชนะ {{ p.loss.competitor }}{{ p.loss.price ? ' · ' + baht(p.loss.price) : '' }}</em></dd>
            </template>
          </dl>
        </section>

        <section class="panel">
          <h3>แบ่งยอดขายระหว่างทีม DT</h3>
          <div class="split" role="img" :aria-label="(p.splits ?? [{ team: p.team, pct: 100 }]).map((x) => x.team + ' ' + x.pct + '%').join(', ')">
            <i v-for="(x, i) in p.splits ?? [{ team: p.team, pct: 100 }]" :key="x.team" :class="'s' + i" :style="{ width: x.pct + '%' }" />
          </div>
          <ul class="splitl">
            <li v-for="(x, i) in p.splits ?? [{ team: p.team, pct: 100 }]" :key="x.team"><b :class="'s' + i" />{{ x.team }} <span class="muted">{{ TEAMS.find((t) => t.code === x.team)?.name }}</span><span class="num">{{ x.pct }}% · {{ baht(Math.round((p.revenue || p.budget) * x.pct / 100)) }}</span></li>
          </ul>
          <p class="hint">ยอดนับเข้าเป้าแต่ละทีมตามสัดส่วนนี้ รวมต้องเท่ากับ 100%</p>
        </section>

        <section class="panel">
          <h3>กำหนดการ</h3>
          <dl class="kv">
            <template v-for="[l, v] in dates" :key="l"><dt>{{ l }}</dt><dd :class="{ muted: !v }">{{ v ? thDate(v) : 'ยังไม่กำหนด' }}</dd></template>
          </dl>
        </section>

        <section class="panel people">
          <div class="pp"><Avatar :id="p.sm" :size="40" /><div><span>Owner Project (SM)</span><strong>{{ person(p.sm)?.name }}</strong></div></div>
          <div class="pp"><Avatar :label="p.sale || '?'" :size="40" /><div><span>Account Executive (Sale)</span><strong>{{ p.sale || 'ยังไม่ระบุ' }}</strong><em>รับใบเสนอราคาทางอีเมล ไม่ใช้ระบบ</em></div></div>
          <div class="pp"><Avatar :id="p.pm" :size="40" :label="p.pm ? undefined : '?'" /><div><span>Project Manager</span><strong>{{ person(p.pm)?.name ?? (post ? 'รอ PMO มอบหมาย' : 'มอบหมายหลัง Close Win') }}</strong></div></div>
          <div v-if="p.collaborators.length" class="collab"><span class="small muted">ผู้ร่วมงาน</span><div><Avatar v-for="c in p.collaborators" :key="c" :id="c" :size="28" /></div></div>
        </section>
      </div>

      <div class="right">
        <section class="panel">
          <div class="panel-head"><h2>เอกสารก่อนการขาย</h2><span class="muted small">SharePoint › {{ p.code }}</span></div>
          <FolderGrid :stage="p.stage" set="pre" :files="p.stage === 'opportunity' ? {} : files" @open="(n) => notify(`เปิดโฟลเดอร์ ${n} ใน SharePoint`)" />
        </section>
        <section class="panel">
          <div class="panel-head"><h2>เอกสารหลังการขาย</h2></div>
          <FolderGrid :stage="p.stage" set="post" :files="post ? files : {}" @open="(n) => notify(`เปิดโฟลเดอร์ ${n} ใน SharePoint`)" />
        </section>
        <section v-if="['warranty', 'ended'].includes(p.stage) || p.type === 'MA'" class="panel">
          <div class="panel-head"><h2>เอกสารประกันและ MA</h2></div>
          <FolderGrid :stage="p.stage" set="ma" :files="files" @open="(n) => notify(`เปิดโฟลเดอร์ ${n} ใน SharePoint`)" />
        </section>
        <section class="panel">
          <div class="panel-head"><h2>เอกสารอื่น</h2></div>
          <label class="drop" :class="{ on: drop }" @dragover.prevent="drop = true" @dragleave="drop = false" @drop.prevent="drop = false; notify('อัปโหลดไฟล์แล้ว')">
            <input type="file" multiple class="sr" @change="notify('อัปโหลดไฟล์แล้ว')" />
            <Icon name="upload" :size="22" />
            <strong>คลิกหรือลากไฟล์มาวางเพื่ออัปโหลด</strong>
            <span class="muted small">เช่น บันทึกการประชุม ภาพหน้างาน</span>
          </label>
        </section>
        <section v-if="children.length" class="panel">
          <div class="panel-head"><h2>โครงการ MA ต่อเนื่อง</h2></div>
          <router-link v-for="c in children" :key="c.id" :to="`/projects/${c.id}`" class="child">
            <span>{{ c.name }}</span><StageBadge :stage="c.stage" />
          </router-link>
        </section>
      </div>
    </div>

    <CostSheetPanel v-if="tab === 'cost'" :p="p" />
    <DeliveryPanel v-if="tab === 'delivery'" :p="p" />
    <MaPanel v-if="tab === 'ma'" :p="p" />
    <ProcurementPanel v-if="tab === 'proc'" :p="p" />

    <section v-if="tab === 'history'" class="panel">
      <ol class="hist">
        <li v-for="(h, i) in [...p.history].reverse()" :key="i">
          <StageBadge :stage="h.stage" />
          <div><strong>{{ h.note }}</strong><p class="small muted">{{ h.at }} · {{ h.by }}</p></div>
        </li>
        <li v-if="!p.history.length" class="muted">ยังไม่มีประวัติ</li>
      </ol>
    </section>

    <Dialog :open="!!target" :title="target ? (p.stage === 'lose' ? 'เปิดกลับเป็น Pipeline' : `ย้ายไป ${stageOf(target).label}`) : ''" @close="target = null">
      <p v-if="target">{{ stageOf(target).hint }}</p>
      <p v-if="target === 'win'" class="chip warn">ต้องแนบ PO หรือสัญญาในโฟลเดอร์ Official PO / Contract — ระบบจะแจ้ง PMO ให้จัด Handover</p>
      <p v-if="target === 'cancelled'" class="chip lose">ยกเลิกแล้วกู้คืนไม่ได้ ยอดขายจะถูกหักออกจากเป้าของ SM</p>
      <fieldset v-if="forward && stageOf(p.stage).exit.length" class="gate">
        <legend>ยืนยันเงื่อนไขก่อนออกจาก {{ stageOf(p.stage).label }}</legend>
        <label v-for="(c, i) in stageOf(p.stage).exit" :key="c"><input v-model="gate[i]" type="checkbox" /> {{ c }}</label>
      </fieldset>
      <template v-if="target === 'lose'">
        <div class="field">
          <label for="lr">เหตุผลที่แพ้ (บังคับ)</label>
          <select id="lr" v-model="loss.reason" class="input"><option value="" disabled>เลือกเหตุผล</option><option v-for="r in LOSS_REASONS" :key="r">{{ r }}</option></select>
        </div>
        <div class="two">
          <div class="field"><label for="lc">ผู้ชนะ / คู่แข่ง</label><input id="lc" v-model="loss.competitor" class="input" /></div>
          <div class="field"><label for="lp">ราคาที่ชนะ (บาท)</label><input id="lp" v-model.number="loss.price" class="input num" type="number" min="0" /></div>
        </div>
      </template>
      <div class="field">
        <label for="rs">{{ needsReason ? 'เหตุผล (บังคับ)' : 'บันทึก (ไม่บังคับ)' }}</label>
        <textarea id="rs" v-model="reason" class="input" rows="3" />
      </div>
      <template #foot>
        <button class="btn" @click="target = null">ยกเลิก</button>
        <button class="btn primary" :disabled="!canConfirm" @click="confirmMove">
          {{ target === 'cancelled' ? 'ยกเลิกโครงการ' : p.stage === 'lose' ? 'เปิดกลับเป็น Pipeline' : `ย้ายไป ${target ? stageOf(target).label : ''}` }}
        </button>
      </template>
    </Dialog>
  </div>
  <div v-else class="page"><h1>ไม่พบโครงการ</h1><router-link to="/projects">กลับไปทะเบียนโครงการ</router-link></div>
</template>

<style scoped>
.back { display: inline-flex; align-items: center; gap: 4px; color: var(--muted); margin-bottom: 12px; }
.cover { position: relative; border-radius: var(--r-lg); overflow: hidden; min-height: 240px; display: flex; align-items: flex-end; }
.cover .photo { position: absolute; inset: 0; }
.cover::after { content: ''; position: absolute; inset: 0; background: linear-gradient(0deg, rgb(22 27 38 / 0.94) 10%, rgb(22 27 38 / 0.45) 100%); }
.cover-in { position: relative; z-index: 1; padding: 28px 32px; color: #fff; width: 100%; }
.tags { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.chip.dark { background: rgb(255 255 255 / 0.14); color: #fff; }
.cover h1 { font-size: clamp(26px, 3.2vw, 38px); font-weight: 600; }
.sub { color: #cfd4dd; margin-top: 4px; }
.sub a { color: #fff; text-decoration: underline; }
.moves { display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap; }
.btn.light { background: #fff; border-color: #fff; color: var(--ink); }
.btn.quiet { background: transparent; border-color: rgb(255 255 255 / 0.35); color: #fff; }
.btn.quiet:hover { background: rgb(255 255 255 / 0.1); }
.railbox { margin: 16px 0 20px; padding: 22px 24px 18px; }
.next { margin-top: 16px; font-size: 14px; color: var(--ink-2); display: flex; gap: 10px; flex-wrap: wrap; }
.next strong { color: var(--brand); font-weight: 600; }

.ov { display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 20px; align-items: start; }
.left, .right { display: grid; gap: 16px; }
.left h3 { margin-bottom: 12px; }
.kv { display: grid; grid-template-columns: auto 1fr; gap: 10px 16px; margin: 0; font-size: 14.5px; }
.kv dt { color: var(--muted); }
.kv dd { margin: 0; text-align: right; }
.kv dd em { display: block; font-style: normal; font-size: 12px; color: var(--warn); font-family: var(--font); font-weight: 400; }
.kv .strong { font-weight: 700; }
.people { display: grid; gap: 16px; }
.pp { display: flex; gap: 12px; align-items: center; }
.pp > div { display: grid; line-height: 1.35; }
.pp > div > span { font-size: 12.5px; color: var(--muted); }
.pp strong { font-weight: 500; }
.pp em { font-style: normal; font-size: 12px; color: var(--faint); }
.collab { display: grid; gap: 6px; padding-top: 12px; border-top: 1px solid var(--line); }
.collab div { display: flex; gap: 4px; }
.drop { display: grid; justify-items: center; gap: 6px; padding: 36px 16px; border: 1.5px dashed var(--line-strong); border-radius: var(--r-md); cursor: pointer; color: var(--muted); text-align: center; transition: background var(--t-fast), border-color var(--t-fast); }
.drop strong { color: var(--ink); font-weight: 500; }
.drop:hover, .drop.on { background: var(--sunken); border-color: var(--action); }
.drop:focus-within { outline: 2px solid var(--focus); outline-offset: 2px; }
.sr { position: absolute; width: 1px; height: 1px; opacity: 0; }
.child { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; color: var(--ink); border-bottom: 1px solid var(--line); }
.input.mini { min-height: 32px; padding: 2px 8px; font-size: 13.5px; width: auto; }
.lossnote { color: var(--muted) !important; }
.split { display: flex; height: 10px; border-radius: 99px; overflow: hidden; gap: 2px; margin-bottom: 12px; }
.split i, .splitl b { background: var(--presale); }
.split .s1, .splitl .s1 { background: var(--post); }
.split .s2, .splitl .s2 { background: var(--warn); }
.splitl { list-style: none; margin: 0 0 8px; padding: 0; display: grid; gap: 6px; font-size: 14px; }
.splitl li { display: flex; align-items: center; gap: 8px; }
.splitl b { width: 10px; height: 10px; border-radius: 2px; flex: none; }
.splitl .num { margin-left: auto; }
.gate { border: 1px solid var(--line); border-radius: var(--r-md); padding: 12px 14px; margin: 0; display: grid; gap: 6px; }
.gate legend { font-size: 13px; font-weight: 600; padding: 0 4px; }
.gate label { display: flex; gap: 10px; align-items: center; font-size: 14px; cursor: pointer; }
.gate input { width: 17px; height: 17px; accent-color: var(--ink); }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.hist { list-style: none; margin: 0; padding: 0; display: grid; }
.hist li { display: grid; grid-template-columns: 130px 1fr; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--line); align-items: start; }
.hist li:last-child { border-bottom: 0; }
.hist strong { font-weight: 500; }
@media (max-width: 1100px) { .ov { grid-template-columns: 1fr; } }
@media (max-width: 560px) { .cover-in { padding: 20px; } .hist li { grid-template-columns: 1fr; gap: 6px; } }
</style>
