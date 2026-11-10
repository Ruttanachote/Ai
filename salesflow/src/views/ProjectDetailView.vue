<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
import PmRounds from '../components/PmRounds.vue'
import RequirementPanel from '../components/RequirementPanel.vue'
import ProcurementPanel from '../components/ProcurementPanel.vue'
import { moveStage, notify, projects, session } from '../store'
import { baht, person, thDate, daysSince, TEAMS, TODAY_ISO, account } from '../data/mock'
import { validateMove, checkContractValue, appealWindowEnd, reopenAsNew, isTender } from '../domain/rules'
import { SETTINGS, newApprovalSteps } from '../store'
import { probability, weightedValue, dealValue, teamShare } from '../domain/metrics'
import { allowedMoves, stageOf, catOf, FORECAST_CAT, LOSS_REASONS, type StageKey, type ForecastCat } from '../data/model'

const props = defineProps<{ id: string }>()
const p = computed(() => projects.find((x) => x.id === props.id))
const parent = computed(() => projects.find((x) => x.id === p.value?.parentId))
const children = computed(() => projects.filter((x) => x.parentId === props.id))

type Tab = 'overview' | 'req' | 'cost' | 'proc' | 'delivery' | 'ma' | 'history'
const tab = ref<Tab>((useRoute().query.tab as Tab) || 'overview')
const post = computed(() => !!p.value && ['win', 'handover', 'delivery', 'warranty', 'ended', 'cancelled'].includes(p.value.stage))
const tabs = computed(() => {
  const t: { k: Tab; l: string }[] = [{ k: 'overview', l: 'ภาพรวมและเอกสาร' }, ...(p.value?.type !== 'MA' ? [{ k: 'req' as Tab, l: 'Requirement และ TOR' }] : []), { k: 'cost', l: 'Cost Sheet และใบเสนอราคา' }]
  if (p.value?.bid || post.value) t.push({ k: 'proc', l: 'ประมูล หลักประกัน ค่าปรับ' })
  if (post.value) t.push({ k: 'delivery', l: p.value?.stage === 'win' || p.value?.stage === 'handover' ? 'Handover' : 'แผนงานและ Task' })
  if (p.value && ['warranty', 'ended'].includes(p.value.stage)) t.push({ k: 'ma', l: 'ประกันและ MA' })
  t.push({ k: 'history', l: 'ประวัติโครงการ' })
  return t
})

const moves = computed(() => (p.value ? allowedMoves(p.value.stage, session.role, p.value.type).filter((m) => !(p.value!.stage === 'lose' && m === 'pipeline')) : []))
// Lost deals are never reopened in place (win rate history must not change) — heads open a new linked deal.
const canReopen = computed(() => p.value?.stage === 'lose' && ['head', 'admin'].includes(session.role))
const target = ref<StageKey | null>(null)
const reason = ref('')
const forward = computed(() => !!target.value && !['lose', 'cancelled'].includes(target.value))
const gate = ref<boolean[]>([])
const loss = ref({ reason: '', competitor: '', price: null as number | null })
const contractValue = ref<number | null>(null)
const contractFile = ref(true)
watch(target, () => {
  gate.value = p.value ? stageOf(p.value.stage).exit.map(() => false) : []
  loss.value = { reason: '', competitor: '', price: null }
  contractValue.value = p.value?.approval?.snapshot?.revenue ?? p.value?.revenue ?? null
  reason.value = ''
})
const poCheck = computed(() =>
  p.value && target.value === 'win' && contractValue.value
    ? checkContractValue(p.value, { contractValue: contractValue.value, tolerancePct: SETTINGS.tolerancePct, gpDropPct: SETTINGS.gpDropPct }, TODAY_ISO)
    : undefined,
)
// Same rule set the API enforces (src/domain/rules.ts) — the dialog lists what is still missing.
const check = computed(() =>
  p.value && target.value
    ? validateMove(p.value, {
        to: target.value, today: TODAY_ISO, gateChecked: !gate.value.some((g) => !g), reason: reason.value,
        loss: target.value === 'lose' ? { code: loss.value.reason, competitor: loss.value.competitor || undefined, price: loss.value.price ?? undefined } : undefined,
        hasContractFile: contractFile.value, contractValue: contractValue.value ?? undefined, poCheck: poCheck.value,
        handoverChecklistDone: !!p.value.handoverDone,
      })
    : { ok: false, errors: [] },
)
const blocking = computed(() => check.value.errors.filter((e) => !e.startsWith('ยังไม่ได้ยืนยันเงื่อนไข')))
const appealEnd = computed(() => (p.value ? appealWindowEnd(p.value) : undefined))
const aging = computed(() => {
  if (!p.value?.stageSince) return null
  const d = daysSince(p.value.stageSince)
  const lim = stageOf(p.value.stage).staleDays
  return { d, stale: !!lim && d > lim, lim }
})

// Forecast category override needs a reason (shown to the head in the forecast roll-up).
const catDraft = ref<ForecastCat | null>(null)
const catReason = ref('')
function setCat(e: Event) {
  if (!p.value) return
  const v = (e.target as HTMLSelectElement).value as ForecastCat
  catDraft.value = v === catOf({ stage: p.value.stage }) ? null : v
  if (!catDraft.value) { p.value.forecastCat = undefined; p.value.forecastReason = undefined }
}
function saveCat() {
  if (!p.value || !catDraft.value || !catReason.value.trim()) return
  p.value.forecastCat = catDraft.value
  p.value.forecastReason = catReason.value.trim()
  catDraft.value = null
  catReason.value = ''
  notify('บันทึก Forecast category แล้ว')
}

function confirmMove() {
  if (!p.value || !target.value || !check.value.ok) return
  const to = stageOf(target.value).label
  if (target.value === 'lose') {
    p.value.loss = { reason: loss.value.reason, competitor: loss.value.competitor || undefined, price: loss.value.price ?? undefined }
    reason.value = reason.value || `แพ้งาน: ${loss.value.reason}${loss.value.competitor ? ' · ผู้ชนะ ' + loss.value.competitor : ''}`
  }
  if (target.value === 'win') p.value.contractValue = contractValue.value ?? undefined
  p.value.stageSince = TODAY_ISO
  p.value.forecastCat = undefined
  moveStage(p.value.id, target.value, reason.value || `เปลี่ยนสถานะเป็น ${to}`, person(session.userId)?.name ?? '')
  notify(`เปลี่ยนสถานะเป็น ${to} แล้ว`)
  target.value = null
}

function requestPostAward() {
  if (!p.value?.approval) return
  p.value.approval = {
    ...p.value.approval, version: 'v' + (Number(p.value.approval.version.slice(1)) + 1), status: 'pending', postAward: true, submittedAt: 'วันนี้',
    snapshot: { ...p.value.approval.snapshot!, contractValue: contractValue.value ?? undefined },
    steps: newApprovalSteps(session.userId, 'SM ส่งขออนุมัติหลังได้งาน'),
  }
  target.value = null
  notify('ส่งขออนุมัติหลังได้งาน (มูลค่า PO ต่างจากที่อนุมัติ) แล้ว')
}

const router = useRouter()
function reopen() {
  if (!p.value) return
  const id = 'p' + (projects.length + 1)
  projects.push(reopenAsNew(p.value, id, 'PIP-69-' + String(200 + projects.length).padStart(4, '0'), TODAY_ISO, person(session.userId)?.name ?? ''))
  notify('เปิดโครงการใหม่จากดีลที่แพ้แล้ว — ดีลเดิมยังนับเป็น Close Lose')
  router.push('/projects/' + id)
}
const reopened = computed(() => projects.filter((x) => x.reopenedFromId === props.id))
const fromLost = computed(() => projects.find((x) => x.id === p.value?.reopenedFromId))

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
    <router-link to="/projects" class="back small"><Icon name="chevron" :size="14" style="transform: rotate(180deg)" /> Project Register</router-link>

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
        <p class="sub">{{ p.code }} · <router-link v-if="p.customerAccountId" :to="`/accounts/${p.customerAccountId}`">{{ account(p.customerAccountId)?.name }}</router-link><template v-else>{{ p.customer }}</template>
          · {{ isTender(p) ? 'ประมูลภาครัฐ' : 'ขายตรง' }}
          <template v-if="parent"> · ต่อจาก <router-link :to="`/projects/${parent.id}`">{{ parent.code }}</router-link></template>
          <template v-if="fromLost"> · เปิดใหม่จาก <router-link :to="`/projects/${fromLost.id}`">{{ fromLost.code }}</router-link></template>
        </p>
        <div v-if="moves.length || canReopen" class="moves">
          <button v-for="m in moves" :key="m" class="btn" :class="m === 'lose' || m === 'cancelled' ? 'quiet' : 'light'" @click="target = m">ย้ายไป {{ stageOf(m).label }}</button>
          <button v-if="canReopen" class="btn light" @click="reopen">เปิดโครงการใหม่จากดีลนี้</button>
        </div>
        <p v-if="reopened.length" class="sub small">เปิดใหม่แล้วเป็น <router-link v-for="r in reopened" :key="r.id" :to="`/projects/${r.id}`">{{ r.code }}</router-link></p>
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
            <dt>ลูกค้า</dt><dd><router-link v-if="p.customerAccountId" :to="`/accounts/${p.customerAccountId}`">{{ account(p.customerAccountId)?.name }}</router-link><template v-else>{{ p.customer }}<em>ยังไม่ผูกทะเบียนลูกค้า</em></template></dd>
            <dt>End User</dt><dd>{{ account(p.endUserAccountId)?.name ?? p.endUser }}</dd>
            <template v-if="p.contractValue"><dt>มูลค่าตามสัญญา</dt><dd class="num strong">{{ baht(p.contractValue) }}</dd></template>
            <dt>Revenue</dt><dd class="num strong">{{ baht(p.revenue) }}<em v-if="!p.revenue">รอ Quotation อนุมัติ</em></dd>
            <dt>Cost (COGS)</dt><dd class="num">{{ baht(p.cost) }}<em v-if="!p.cost">รอ Cost Sheet อนุมัติ</em></dd>
            <dt>Gross Profit</dt><dd class="num strong">{{ baht(gp) }}<span v-if="p.revenue" class="muted"> · {{ ((gp / p.revenue) * 100).toFixed(1) }}%</span></dd>
            <dt>Budget ลูกค้า</dt><dd class="num">{{ baht(p.budget) }}</dd>
            <template v-if="stageOf(p.stage).phase === 'presale'">
              <dt>โอกาสปิด</dt><dd class="num">{{ Math.round(probability(p) * 100) }}% · ถ่วงน้ำหนัก {{ baht(Math.round(weightedValue(p))) }}</dd>
              <dt><label for="fc">Forecast category</label></dt>
              <dd>
                <select id="fc" class="input mini" :value="catDraft ?? catOf(p)" @change="setCat"><option v-for="(l, k) in FORECAST_CAT" :key="k" :value="k">{{ l }}</option></select>
                <em v-if="p.forecastReason && !catDraft" class="lossnote">ปรับเอง: {{ p.forecastReason }}</em>
              </dd>
              <template v-if="catDraft">
                <dt><label for="fcr">เหตุผลที่ปรับ</label></dt>
                <dd class="catr"><input id="fcr" v-model="catReason" class="input mini" placeholder="เช่น ลูกค้ายืนยันงบแล้ว" /><button class="btn sm" :disabled="!catReason.trim()" @click="saveCat">บันทึก</button></dd>
              </template>
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
            <li v-for="(x, i) in p.splits ?? [{ team: p.team, pct: 100 }]" :key="x.team"><b :class="'s' + i" />{{ x.team }} <span class="muted">{{ TEAMS.find((t) => t.code === x.team)?.name }}</span><span class="num">{{ x.pct }}% · {{ baht(Math.round(dealValue(p) * teamShare(p, x.team))) }}</span></li>
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
          <div class="pp"><Avatar :label="p.sales[0] ?? '?'" :size="40" /><div><span>Sale ที่ทำงานคู่กับ SM</span><strong>{{ p.sales.length ? p.sales.join(', ') : 'ยังไม่ระบุ — ต้องมีอย่างน้อย 1 คน' }}</strong><em>ข้อมูลอ้างอิง · Sale ไม่ได้ใช้ One Platform</em></div></div>
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

    <RequirementPanel v-if="tab === 'req'" :p="p" />
    <CostSheetPanel v-if="tab === 'cost'" :p="p" />
    <DeliveryPanel v-if="tab === 'delivery'" :p="p" />
    <PmRounds v-if="tab === 'overview' && session.role !== 'opn'" :p="p" class="pmov" />
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

    <Dialog :open="!!target" :title="target ? `ย้ายไป ${stageOf(target).label}` : ''" wide @close="target = null">
      <p v-if="target">{{ stageOf(target).hint }}</p>
      <template v-if="target === 'win'">
        <div class="two">
          <div class="field">
            <label for="cv">มูลค่าตามสัญญา / PO (บาท ไม่รวม VAT)</label>
            <input id="cv" v-model.number="contractValue" class="input num" type="number" min="0" step="1000" />
            <span class="hint">อนุมัติไว้ {{ baht(p.approval?.snapshot?.revenue ?? p.revenue) }} · ต่างได้ ±{{ SETTINGS.tolerancePct }}% และ GP ลดได้ไม่เกิน {{ SETTINGS.gpDropPct }} จุด</span>
          </div>
          <label class="file"><input v-model="contractFile" type="checkbox" /> มีไฟล์ PO / สัญญาที่ลงนามในโฟลเดอร์ Official PO หรือ Contract แล้ว</label>
        </div>
        <div v-if="poCheck" class="po" :class="poCheck.ok ? 'ok' : 'bad'">
          <span>GP ที่อนุมัติ <b class="num">{{ poCheck.gpApproved.toFixed(1) }}%</b></span>
          <span>GP ตามสัญญา <b class="num">{{ poCheck.gpContract.toFixed(1) }}%</b></span>
          <span>ต่างจากที่อนุมัติ <b class="num">{{ poCheck.diffPct > 0 ? '+' : '' }}{{ poCheck.diffPct.toFixed(1) }}%</b></span>
        </div>
        <p v-if="isTender(p) && appealEnd" class="hint">ประกาศผู้ชนะ {{ thDate(p.bid?.result) }} · พ้นระยะอุทธรณ์ 7 วันทำการวันที่ {{ thDate(appealEnd) }}</p>
      </template>
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
        <label for="rs">{{ target === 'cancelled' ? 'เหตุผล (บังคับ)' : 'บันทึก (ไม่บังคับ)' }}</label>
        <textarea id="rs" v-model="reason" class="input" rows="2" />
      </div>
      <div v-if="blocking.length" class="missing" role="status">
        <strong>ยังย้ายไม่ได้ เพราะ</strong>
        <ul><li v-for="e in blocking" :key="e">{{ e }}</li></ul>
      </div>
      <template #foot>
        <button class="btn" @click="target = null">ยกเลิก</button>
        <button v-if="target === 'win' && poCheck?.needsReapproval" class="btn" @click="requestPostAward">ขออนุมัติหลังได้งาน</button>
        <button class="btn primary" :disabled="!check.ok" @click="confirmMove">
          {{ target === 'cancelled' ? 'ยกเลิกโครงการ' : `ย้ายไป ${target ? stageOf(target).label : ''}` }}
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
.pp > div > span { font-size: 13px; color: var(--muted); }
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
.input.mini { min-height: 32px; padding: 2px 8px; font-size: 14px; width: auto; }
.lossnote { color: var(--muted) !important; }
.split { display: flex; height: 10px; border-radius: 99px; overflow: hidden; gap: 2px; margin-bottom: 12px; }
.split i, .splitl b { background: var(--presale); }
.split .s1, .splitl .s1 { background: var(--post); }
.split .s2, .splitl .s2 { background: var(--warn); }
.splitl { list-style: none; margin: 0 0 8px; padding: 0; display: grid; gap: 6px; font-size: 14px; }
.splitl li { display: flex; align-items: center; gap: 8px; }
.splitl b { width: 10px; height: 10px; border-radius: 2px; flex: none; }
.splitl .num { margin-left: auto; }
.catr { display: flex; gap: 6px; justify-content: flex-end; }
.catr .input { width: 180px; }
.sub a { color: #fff; text-decoration: underline; margin-right: 6px; }
.file { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; padding-top: 26px; cursor: pointer; }
.file input { width: 17px; height: 17px; accent-color: var(--ink); margin-top: 3px; }
.po { display: flex; gap: 20px; flex-wrap: wrap; padding: 10px 14px; border-radius: var(--r-md); font-size: 14px; }
.po.ok { background: var(--win-soft); color: var(--win); }
.po.bad { background: var(--lose-soft); color: var(--lose); }
.missing { background: var(--warn-soft); color: var(--warn); border-radius: var(--r-md); padding: 10px 14px; font-size: 14px; }
.missing ul { margin: 4px 0 0; padding-left: 18px; }
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
.pmov { margin-top: 20px; }
</style>
