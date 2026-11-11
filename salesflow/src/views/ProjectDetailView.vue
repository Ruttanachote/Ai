<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Photo from '../components/Photo.vue'
import StageRail from '../components/StageRail.vue'
import StatusGuide from '../components/StatusGuide.vue'
import StageBadge from '../components/StageBadge.vue'
import Avatar from '../components/Avatar.vue'
import Icon from '../components/Icon.vue'
import Dialog from '../components/Dialog.vue'
import DocumentsPanel from '../components/docs/DocumentsPanel.vue'
import CostQuotePanel from '../components/docs/CostQuotePanel.vue'
import ActivityPanel from '../components/docs/ActivityPanel.vue'
import { canSeeCost, isOwner } from '../docstore'
import DeliveryPanel from '../components/DeliveryPanel.vue'
import MaPanel from '../components/MaPanel.vue'
import PmRounds from '../components/PmRounds.vue'
import RequirementPanel from '../components/RequirementPanel.vue'
import ProcurementPanel from '../components/ProcurementPanel.vue'
import { moveStage, notify, projects, session, scope, accounts } from '../store'
import AccountDialog from '../components/AccountDialog.vue'
import { baht, person, thDate, daysSince, TEAMS, TODAY_ISO, account, SALES_TEAMS } from '../data/mock'
import { stageChecklist, type Fix } from '../domain/nextstep'
import { log } from '../docstore'
import { validateMove, checkContractValue, appealWindowEnd, reopenAsNew, isTender, requirementsFor } from '../domain/rules'
import { SETTINGS, newApprovalSteps } from '../store'
import { probability, weightedValue, dealValue, teamShare } from '../domain/metrics'
import { PROJECT_TYPES, WORK_SCOPES, allowedMoves, stageOf, catOf, FORECAST_CAT, LOSS_REASONS, type StageKey, type ForecastCat } from '../data/model'

const props = defineProps<{ id: string }>()
// An SM opens only their own projects (or ones they collaborate on); other teams' deals stay hidden.
const found = computed(() => projects.find((x) => x.id === props.id))
const denied = computed(() => !!found.value && session.role === 'sm' && !scope.value.list.includes(found.value))
const p = computed(() => (denied.value ? undefined : found.value))
const parent = computed(() => projects.find((x) => x.id === p.value?.parentId))
const children = computed(() => projects.filter((x) => x.parentId === props.id))

type Tab = 'overview' | 'req' | 'cost' | 'proc' | 'delivery' | 'ma' | 'history'
const tab = ref<Tab>((useRoute().query.tab as Tab) || 'overview')
const post = computed(() => !!p.value && ['win', 'handover', 'delivery', 'warranty', 'ended', 'cancelled'].includes(p.value.stage))
const tabs = computed(() => {
  const t: { k: Tab; l: string }[] = [{ k: 'overview', l: 'ภาพรวมและเอกสาร' }, ...(p.value?.type !== 'MA' ? [{ k: 'req' as Tab, l: 'Requirement และ TOR' }] : []), ...(p.value && canSeeCost(p.value) ? [{ k: 'cost' as Tab, l: 'Cost Sheet และใบเสนอราคา' }] : [])]
  // Procurement data is entered from the sales stages on (method, e-GP, reference price, result).
  if (p.value && (p.value.bid || post.value || p.value.stage !== 'lose')) t.push({ k: 'proc', l: post.value ? 'ประมูล หลักประกัน ค่าปรับ' : 'จัดซื้อ / ประมูล' })
  if (post.value) t.push({ k: 'delivery', l: p.value?.stage === 'win' || p.value?.stage === 'handover' ? 'Handover' : 'แผนงานและ Task' })
  if (p.value && ['warranty', 'ended'].includes(p.value.stage)) t.push({ k: 'ma', l: 'ประกันและ MA' })
  t.push({ k: 'history', l: 'Activity' })
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
// Signed contract / PO comes from the documents folders, not a tick box.
const contractFile = computed(() => (p.value?.documents ?? []).some((d) => !d.deletedAt && (d.folder === 'contract' || d.folder === 'official-po')))
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
/* ---------- Step guide: what is still missing for the next status, and a link to fix each ---------- */
const forwardMoves = computed(() => moves.value.filter((m) => !['lose', 'cancelled'].includes(m)))
const guideTo = ref<StageKey | null>(null)
const guideTarget = computed(() => (guideTo.value && forwardMoves.value.includes(guideTo.value) ? guideTo.value : forwardMoves.value[0] ?? null))
const guide = computed(() => (p.value && guideTarget.value ? stageChecklist(p.value, guideTarget.value, TODAY_ISO) : []))
const guideDone = computed(() => guide.value.filter((i) => i.ok).length)
const missingFor = (to: StageKey) => (p.value ? stageChecklist(p.value, to, TODAY_ISO).filter((i) => !i.ok).length : 0)
// In the move dialog: checklist items get "fix" buttons; anything else stays as text.
const dialogItems = computed(() => (p.value && target.value ? stageChecklist(p.value, target.value, TODAY_ISO).filter((i) => !i.ok) : []))
const otherBlocking = computed(() => { const req = p.value && target.value ? requirementsFor(target.value, p.value, TODAY_ISO) : []; return blocking.value.filter((e) => !req.includes(e)) })
const tabsEl = ref<HTMLElement | null>(null)
const focusFolder = ref<string | null>(null)
function doFix(f: Fix) {
  target.value = null
  if (f.kind === 'edit') return openEdit(f.field)
  if (f.kind === 'folder') { tab.value = 'overview'; focusFolder.value = null; nextTick(() => (focusFolder.value = f.folder)); return }
  tab.value = f.tab
  nextTick(() => tabsEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}
/* ---------- Edit project data (customer, team, Sale, dates) ---------- */
const canEditInfo = computed(() => !!p.value && (isOwner(p.value) || ['head', 'admin'].includes(session.role)))
const accOpen = ref<'' | 'customer' | 'end_user'>('')
function onAccount(id: string) { if (accOpen.value === 'end_user') edit.endUser = id; else edit.customer = id }
const edit = reactive({ open: false, field: '', customer: '', endUser: '', team: '', sales: '', expectedClose: '', bidDue: '', budget: 0 })
const customers = computed(() => accounts.filter((a) => a.type === 'customer'))
const endUsers = computed(() => accounts.filter((a) => a.type !== 'competitor' && (a.id === edit.customer || a.parentId === edit.customer || a.type === 'end_user')))
function openEdit(field = '') {
  if (!p.value) return
  Object.assign(edit, { open: true, field, customer: p.value.customerAccountId ?? '', endUser: p.value.endUserAccountId ?? '', team: p.value.team, sales: p.value.sales.join(', '), expectedClose: p.value.expectedClose ?? '', bidDue: p.value.bidDue ?? '', budget: p.value.budget })
  nextTick(() => document.getElementById(`ed-${field || 'customer'}`)?.focus())
}
function saveEdit() {
  const x = p.value
  if (!x) return
  const ch = (label: string, from: string | undefined, to: string | undefined) => { if ((from ?? '') !== (to ?? '')) log(x, 'field', `แก้ ${label}`, from || '—', to || '—') }
  ch('ลูกค้า', account(x.customerAccountId)?.name, account(edit.customer)?.name)
  ch('End User', account(x.endUserAccountId)?.name, account(edit.endUser)?.name)
  ch('ทีม DT', x.team, edit.team)
  const sales = edit.sales.split(',').map((v) => v.trim()).filter(Boolean)
  ch('Sale', x.sales.join(', '), sales.join(', '))
  ch('Expected Close', x.expectedClose, edit.expectedClose || undefined)
  ch('Bid Due Date', x.bidDue, edit.bidDue || undefined)
  ch('Budget ลูกค้า', String(x.budget), String(edit.budget))
  x.customerAccountId = edit.customer || undefined
  if (edit.customer) x.customer = account(edit.customer)?.name ?? x.customer
  x.endUserAccountId = edit.endUser || undefined
  if (edit.endUser) x.endUser = account(edit.endUser)?.name ?? x.endUser
  x.team = edit.team; x.sales = sales
  x.expectedClose = edit.expectedClose || undefined; x.bidDue = edit.bidDue || undefined; x.budget = Number(edit.budget) || 0
  edit.open = false
  notify('บันทึกข้อมูลโครงการแล้ว')
}
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
const dates = computed(() => p.value ? [
  ['Bid Due Date', p.value.bidDue], ['Expected Close', p.value.expectedClose], ['Start Project', p.value.startProject],
  ['End Project', p.value.endProject], ['Start Warranty', p.value.startWarranty], ['End Warranty', p.value.endWarranty],
] as [string, string | undefined][] : [])
</script>

<template>
  <div v-if="p" class="page">
    <router-link to="/projects" class="back small"><Icon name="chevron" :size="14" style="transform: rotate(180deg)" /> Project Overview</router-link>

    <section class="cover">
      <Photo :id="p.cover" :w="1800" alt="" />
      <div class="cover-in">
        <div class="tags">
          <StageBadge :stage="p.stage" />
          <span class="chip dark" :title="PROJECT_TYPES[p.type]?.th">{{ PROJECT_TYPES[p.type]?.label ?? p.type }}</span><span v-if="p.scope" class="chip dark">{{ WORK_SCOPES[p.scope] }}</span>
          <span class="chip dark">{{ p.team }}</span>
          <span v-if="aging" class="chip" :class="aging.stale ? 'lose' : 'dark'" :title="aging.stale ? `เกินเกณฑ์ ${aging.lim} วันของสถานะนี้` : ''">อยู่ในสถานะนี้ {{ aging.d }} วัน{{ aging.stale ? ' · ค้างนาน' : '' }}</span>
        </div>
        <h1>{{ p.name }}</h1>
        <p class="sub">{{ p.code }} · <router-link v-if="p.customerAccountId" :to="`/accounts/${p.customerAccountId}`">{{ account(p.customerAccountId)?.name }}</router-link><template v-else>{{ p.customer }}</template>
          · {{ isTender(p) ? 'ประมูลภาครัฐ' : 'ขายตรง' }}
          <template v-if="parent"> · ต่อจาก <router-link :to="`/projects/${parent.id}`">{{ parent.code }}</router-link></template>
          <template v-if="fromLost"> · เปิดใหม่จาก <router-link :to="`/projects/${fromLost.id}`">{{ fromLost.code }}</router-link></template>
        </p>
        <div v-if="moves.length || canReopen || isOwner(p)" class="moves">
          <button v-for="m in moves" :key="m" class="btn" :class="m === 'lose' || m === 'cancelled' ? 'quiet' : 'light'" @click="target = m">ย้ายไป {{ stageOf(m).label }}<span v-if="!['lose', 'cancelled'].includes(m) && missingFor(m)" class="miss">ขาด {{ missingFor(m) }}</span></button>
          <button v-if="canReopen" class="btn light" @click="reopen">เปิดโครงการใหม่จากดีลนี้</button>
          <button v-if="isOwner(p) && ['pipeline', 'forecast', 'rebidding'].includes(p.stage) && p.approval?.status !== 'pending'" class="btn light" @click="tab = 'cost'">Send to Approve</button>
        </div>
        <p v-if="reopened.length" class="sub small">เปิดใหม่แล้วเป็น <router-link v-for="r in reopened" :key="r.id" :to="`/projects/${r.id}`">{{ r.code }}</router-link></p>
      </div>
    </section>

    <section class="panel railbox">
      <div class="railhead"><StatusGuide /></div>
      <StageRail :stage="p.stage" :sales="session.role === 'sm'" :pm="p.pm ? person(p.pm)?.name : undefined" />
      <div v-if="guideTarget" class="guide" aria-label="ขั้นตอนก่อนเปลี่ยนสถานะ">
        <div class="gh">
          <div>
            <p class="gt">ขั้นถัดไป · ต้องทำให้ครบก่อนย้ายไป <b>{{ stageOf(guideTarget).label }}</b></p>
            <p class="small muted">ทำครบแล้ว {{ guideDone }} จาก {{ guide.length }} รายการ{{ guide.length ? '' : ' — ไม่มีเงื่อนไขข้อมูล ยืนยันเกณฑ์ในขั้นตอนย้ายได้เลย' }}</p>
          </div>
          <div v-if="forwardMoves.length > 1" class="seg" role="radiogroup" aria-label="สถานะเป้าหมาย">
            <button v-for="m in forwardMoves" :key="m" role="radio" :aria-checked="guideTarget === m" @click="guideTo = m">{{ stageOf(m).label }}</button>
          </div>
          <button class="btn" :class="guideDone === guide.length ? 'primary' : ''" @click="target = guideTarget">{{ guideDone === guide.length ? `ย้ายไป ${stageOf(guideTarget).label}` : 'ดูเงื่อนไขทั้งหมด' }}</button>
        </div>
        <div v-if="guide.length" class="gbar" role="progressbar" :aria-valuenow="guideDone" :aria-valuemax="guide.length"><i :style="{ width: (guideDone / guide.length) * 100 + '%' }" /></div>
        <ol class="gl">
          <li v-for="(i, k) in guide" :key="i.id" :class="{ ok: i.ok }">
            <span class="gn" :aria-label="i.ok ? 'ทำแล้ว' : 'ยังไม่ได้ทำ'">{{ i.ok ? '✓' : k + 1 }}</span>
            <span class="gi"><b>{{ i.label }}</b><span class="small muted">{{ i.hint }}</span></span>
            <button v-if="!i.ok && (i.fix.kind !== 'edit' || canEditInfo)" class="btn sm" @click="doFix(i.fix)">{{ i.doLabel }} →</button>
          </li>
        </ol>
      </div>
      <p class="next"><strong>Next step</strong> {{ p.nextStep }}<button v-if="canEditInfo" class="btn ghost sm edit" @click="openEdit()">แก้ข้อมูลโครงการ</button></p>
    </section>

    <div ref="tabsEl" class="tabs" role="tablist">
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
            <dt>Revenue</dt><dd class="num strong">{{ baht(p.revenue) }}<em v-if="p.financeSource" class="src">{{ p.financeSource.label }}</em><em v-else-if="p.revenue" class="src est">ประมาณการ — ยังไม่มี Cost Sheet อนุมัติ</em><em v-else>รอ Cost Sheet อนุมัติ</em></dd>
            <dt>Cost (COGS)</dt><dd class="num">{{ baht(p.cost) }}<em v-if="!p.cost">รอ Cost Sheet อนุมัติ</em></dd>
            <dt>Gross Profit</dt><dd class="num strong">{{ baht(gp) }}<span v-if="p.revenue" class="muted"> · {{ ((gp / p.revenue) * 100).toFixed(1) }}%</span></dd>
            <template v-if="p.contributionMargin !== undefined"><dt>Contribution Margin</dt><dd class="num">{{ baht(p.contributionMargin) }}</dd></template>
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
        <DocumentsPanel :p="p" :focus="focusFolder" @open-cost="tab = 'cost'" />
        <section v-if="children.length" class="panel">
          <div class="panel-head"><h2>โครงการ MA ต่อเนื่อง</h2></div>
          <router-link v-for="c in children" :key="c.id" :to="`/projects/${c.id}`" class="child">
            <span>{{ c.name }}</span><StageBadge :stage="c.stage" />
          </router-link>
        </section>
      </div>
    </div>

    <RequirementPanel v-if="tab === 'req'" :p="p" />
    <CostQuotePanel v-if="tab === 'cost'" :p="p" />
    <DeliveryPanel v-if="tab === 'delivery'" :p="p" />
    <PmRounds v-if="tab === 'overview' && session.role !== 'opn'" :p="p" class="pmov" />
    <MaPanel v-if="tab === 'ma'" :p="p" />
    <ProcurementPanel v-if="tab === 'proc'" :p="p" />

    <ActivityPanel v-if="tab === 'history'" :p="p" />

    <Dialog :open="!!target" :title="target ? `ย้ายไป ${stageOf(target).label}` : ''" wide @close="target = null">
      <p v-if="target">{{ stageOf(target).hint }}</p>
      <template v-if="target === 'win'">
        <div class="two">
          <div class="field">
            <label for="cv">มูลค่าตามสัญญา / PO (บาท ไม่รวม VAT)</label>
            <input id="cv" v-model.number="contractValue" class="input num" type="number" min="0" step="1000" />
            <span class="hint">อนุมัติไว้ {{ baht(p.approval?.snapshot?.revenue ?? p.revenue) }} · ต่างได้ ±{{ SETTINGS.tolerancePct }}% และ GP ลดได้ไม่เกิน {{ SETTINGS.gpDropPct }} จุด</span>
          </div>
          <p class="file" :class="contractFile ? 'okf' : 'nof'">{{ contractFile ? '✓ มีไฟล์สัญญา / PO ในโฟลเดอร์แล้ว' : '✗ ยังไม่มีไฟล์สัญญา / PO — อัปโหลดในโฟลเดอร์ Contract หรือ Official PO' }}</p>
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
      <div v-if="dialogItems.length || otherBlocking.length" class="missing" role="status">
        <strong>ยังย้ายไม่ได้ — ทำรายการเหล่านี้ให้ครบก่อน</strong>
        <ul>
          <li v-for="i in dialogItems" :key="i.id"><span>{{ i.label }} <span class="small">· {{ i.hint }}</span></span><button v-if="i.fix.kind !== 'edit' || canEditInfo" class="btn sm" @click="doFix(i.fix)">{{ i.doLabel }} →</button></li>
          <li v-for="e in otherBlocking" :key="e"><span>{{ e }}</span></li>
        </ul>
      </div>
      <template #foot>
        <button class="btn" @click="target = null">ยกเลิก</button>
        <button v-if="target === 'win' && poCheck?.needsReapproval" class="btn" @click="requestPostAward">ขออนุมัติหลังได้งาน</button>
        <button class="btn primary" :disabled="!check.ok" @click="confirmMove">
          {{ target === 'cancelled' ? 'ยกเลิกโครงการ' : `ย้ายไป ${target ? stageOf(target).label : ''}` }}
        </button>
      </template>
    </Dialog>
    <Dialog :open="edit.open" title="แก้ข้อมูลโครงการ" @close="edit.open = false">
      <form class="ef" @submit.prevent="saveEdit">
        <div class="field" :class="{ hl: edit.field === 'customer' }"><label for="ed-customer">ลูกค้า (ทะเบียนลูกค้า)</label><select id="ed-customer" v-model="edit.customer" class="input"><option value="">— ยังไม่เลือก —</option><option v-for="a in customers" :key="a.id" :value="a.id">{{ a.name }}</option></select><button type="button" class="btn ghost sm addacc" @click="accOpen = 'customer'">+ เพิ่มลูกค้าใหม่</button></div>
        <div class="field"><label for="ed-enduser">End User (หน่วยงานผู้ใช้)</label><select id="ed-enduser" v-model="edit.endUser" class="input"><option value="">— เหมือนลูกค้า —</option><option v-for="a in endUsers" :key="a.id" :value="a.id">{{ a.name }}</option></select><button type="button" class="btn ghost sm addacc" :disabled="!edit.customer" @click="accOpen = 'end_user'">+ เพิ่มหน่วยงานผู้ใช้</button></div>
        <div class="field" :class="{ hl: edit.field === 'team' }"><label for="ed-team">ทีม DT (Profit Center)</label><select id="ed-team" v-model="edit.team" class="input"><option v-for="t in SALES_TEAMS.filter((x) => x.active !== false)" :key="t.code" :value="t.code">{{ t.code }} · {{ t.name }}</option></select></div>
        <div class="field" :class="{ hl: edit.field === 'sales' }"><label for="ed-sales">Sale ที่ทำงานคู่กับ SM</label><input id="ed-sales" v-model="edit.sales" class="input" placeholder="เช่น Sirinya B., Pongsak T." /><span class="hint">คั่นหลายคนด้วยจุลภาค · Sale ไม่ได้ใช้ One Platform</span></div>
        <div class="two">
          <div class="field" :class="{ hl: edit.field === 'expectedClose' }"><label for="ed-expectedClose">Expected Close</label><input id="ed-expectedClose" v-model="edit.expectedClose" type="date" class="input" /></div>
          <div class="field"><label for="ed-bidDue">Bid Due Date</label><input id="ed-bidDue" v-model="edit.bidDue" type="date" class="input" /></div>
        </div>
        <div class="field"><label for="ed-budget">Budget ลูกค้า (บาท)</label><input id="ed-budget" v-model.number="edit.budget" type="number" min="0" class="input num" /></div>
        <button type="submit" hidden />
      </form>
      <template #foot><button class="btn" @click="edit.open = false">ยกเลิก</button><button class="btn primary" @click="saveEdit">บันทึก</button></template>
    </Dialog>
    <AccountDialog :open="!!accOpen" :type="accOpen || 'customer'" :parent-id="accOpen === 'end_user' ? edit.customer : undefined" @close="accOpen = ''" @created="onAccount" />
  </div>
  <div v-else class="page"><h1>{{ denied ? 'ไม่มีสิทธิ์ดูโครงการนี้' : 'ไม่พบโครงการ' }}</h1><p v-if="denied" class="muted">โครงการนี้เป็นของ SM คนอื่น — คุณเห็นเฉพาะโครงการที่คุณดูแลหรือร่วมทำ</p><router-link to="/projects">กลับไปทะเบียนโครงการ</router-link></div>
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
.kv dd em.src { display: block; font-style: normal; font-size: 12px; color: var(--win); }
.kv dd em.src.est { color: var(--warn); }
.guide { margin-top: 18px; border: 1px solid var(--line); border-radius: var(--r-md); padding: 14px 16px; display: grid; gap: 10px; background: var(--sunken); }
.gh { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.gh > div:first-child { flex: 1 1 260px; }
.gh p { margin: 0; }
.gt { font-size: 15px; }
.gbar { height: 6px; background: var(--line); border-radius: 3px; overflow: hidden; }
.gbar i { display: block; height: 100%; background: var(--win); transition: width var(--t-med); }
.gl { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.gl li { display: grid; grid-template-columns: 26px 1fr auto; gap: 10px; align-items: center; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-sm); padding: 8px 10px; }
.gl li.ok { opacity: 0.75; }
.gn { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 600; background: var(--warn-soft); color: var(--warn); }
.gl li.ok .gn { background: var(--win-soft); color: var(--win); }
.gi { display: grid; }
.gl li.ok .gi b { font-weight: 500; text-decoration: line-through; text-decoration-color: var(--faint); }
.miss { margin-left: 8px; font-size: 12px; padding: 0 8px; border-radius: 99px; background: var(--warn-soft); color: var(--warn); }
.next .edit { margin-left: 8px; }
.missing li { display: flex; justify-content: space-between; gap: 10px; align-items: center; margin: 4px 0; }
.file.okf { color: var(--win); } .file.nof { color: var(--lose); }
.ef { display: grid; gap: 12px; }
.hl .input { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
@media (max-width: 640px) { .gl li { grid-template-columns: 26px 1fr; } .gl li .btn { grid-column: 2; justify-self: start; } }
.addacc { justify-self: start; }
.railhead { display: flex; justify-content: flex-end; margin: -6px 0 6px; }
</style>
