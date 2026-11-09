<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import KpiStrip from '../components/KpiStrip.vue'
import Avatar from '../components/Avatar.vue'
import Dialog from '../components/Dialog.vue'
import { notify, scope, session } from '../store'
import { baht, mb, person, thDate, TODAY_ISO } from '../data/mock'
import type { ProcurementRequest, Project } from '../data/model'
import { procurementBudget } from '../domain/metrics'

// OPN (DT3-2) approves purchase disbursements against the Hardware/Software lines of the
// approved Cost Sheet. PMs raise PRs for their projects. Budgets come from the same Cost
// Sheet lines shown on the project's Cost Sheet tab.
const list = computed(() => scope.value.list.filter((p) => ['win', 'handover', 'delivery', 'warranty'].includes(p.stage)))
const rows = computed(() => list.value.flatMap((p) => (p.procurement ?? []).map((r) => ({ p, r }))).sort((a, b) => Number(a.r.status !== 'pending') - Number(b.r.status !== 'pending') || b.r.at.localeCompare(a.r.at)))
const pending = computed(() => rows.value.filter((x) => x.r.status === 'pending'))
const lineLeft = (p: Project, line: string) => procurementBudget(p).find((b) => b.line === line)?.left ?? 0

const canApprove = computed(() => ['opn', 'admin'].includes(session.role))
const canRequest = computed(() => ['pm', 'admin'].includes(session.role))

const kpis = computed(() => {
  const budgets = list.value.flatMap((p) => procurementBudget(p))
  return [
    { label: 'รออนุมัติเบิกจ่าย', value: String(pending.value.length), note: mb(pending.value.reduce((s, x) => s + x.r.amount, 0)) + ' มูลค่ารวม', tone: pending.value.length ? ('warn' as const) : ('' as const) },
    { label: 'งบจัดซื้อตาม Cost Sheet', value: mb(budgets.reduce((s, b) => s + b.budget, 0)), note: `${list.value.length} โครงการที่ชนะแล้ว` },
    { label: 'ผูกพันแล้ว', value: mb(budgets.reduce((s, b) => s + b.committed, 0)), note: 'อนุมัติหรือออก PO แล้ว' },
    { label: 'เกินงบถ้าอนุมัติ', value: String(pending.value.filter((x) => x.r.amount > lineLeft(x.p, x.r.budgetLine)).length), note: 'ต้องขออนุมัติเพิ่มจากรองผู้บริหาร', tone: pending.value.some((x) => x.r.amount > lineLeft(x.p, x.r.budgetLine)) ? ('bad' as const) : ('' as const) },
  ]
})

function decide(x: { p: Project; r: ProcurementRequest }, ok: boolean) {
  if (ok && x.r.amount > lineLeft(x.p, x.r.budgetLine)) return
  x.r.status = ok ? 'approved' : 'rejected'
  notify(ok ? `อนุมัติเบิกจ่าย ${x.r.id} แล้ว — แจ้งจัดซื้อออก PO` : `ไม่อนุมัติ ${x.r.id}`)
}

const open = ref(false)
const draft = reactive({ projectId: '', item: '', vendor: '', amount: null as number | null, budgetLine: '' })
const mine = computed(() => list.value.filter((p) => p.pm === session.userId || session.role === 'admin'))
const draftLines = computed(() => procurementBudget(list.value.find((p) => p.id === draft.projectId) ?? list.value[0]))
function submit() {
  const p = list.value.find((x) => x.id === draft.projectId)
  if (!p || !draft.item || !draft.amount || !draft.budgetLine) return
  p.procurement = [...(p.procurement ?? []), { id: 'PR-69-' + String(600 + rows.value.length), item: draft.item, vendor: draft.vendor, amount: draft.amount, budgetLine: draft.budgetLine, requestedBy: session.userId, at: TODAY_ISO, status: 'pending' }]
  open.value = false
  Object.assign(draft, { item: '', vendor: '', amount: null, budgetLine: '' })
  notify('ส่งคำขอซื้อถึง OPN แล้ว')
}
</script>

<template>
  <div class="page">
    <PageHeader module="Finance" title="Procurement" :scope="scope.label" subtitle="คำขอซื้อเทียบงบ Hardware / Software ใน Cost Sheet ที่อนุมัติ · OPN (DT3-2) อนุมัติ">
      <button v-if="canRequest" class="btn primary" @click="open = true; draft.projectId = mine[0]?.id ?? ''">ขอซื้อ (PR)</button>
    </PageHeader>
    <KpiStrip :items="kpis" />

    <section class="panel">
      <div class="panel-head"><h2>งบจัดซื้อรายโครงการ</h2><span class="muted small">แถบเข้ม = ผูกพันแล้ว · ลาย = รออนุมัติ</span></div>
      <div class="budgets">
        <div v-for="p in list.filter((x) => (x.procurement ?? []).length || x.stage === 'delivery')" :key="p.id" class="bp">
          <router-link :to="`/projects/${p.id}`" class="pn">{{ p.name }}</router-link>
          <div v-for="b in procurementBudget(p)" :key="b.line" class="bl">
            <span class="small">{{ b.line }}</span>
            <div class="bar"><i class="c" :style="{ width: Math.min(100, (b.committed / b.budget) * 100) + '%' }" /><i class="w" :style="{ width: Math.min(100, (Math.max(0, Math.min(b.pending, b.left)) / b.budget) * 100) + '%' }" /></div>
            <span class="small num" :class="{ bad: b.pending > b.left }">เหลือ {{ baht(b.left) }} / {{ baht(b.budget) }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="panel flush scroll-x">
      <table class="table">
        <thead><tr><th>คำขอ</th><th>โครงการ</th><th>รายการงบ</th><th class="r">จำนวนเงิน</th><th>ผู้ขอ</th><th>สถานะ</th></tr></thead>
        <tbody>
          <tr v-for="x in rows" :key="x.r.id">
            <td><strong>{{ x.r.item }}</strong><p class="small muted">{{ x.r.id }} · {{ x.r.vendor }} · {{ thDate(x.r.at) }}</p></td>
            <td class="small"><router-link :to="`/projects/${x.p.id}`">{{ x.p.name }}</router-link></td>
            <td class="small">{{ x.r.budgetLine }}</td>
            <td class="r num">{{ baht(x.r.amount) }}</td>
            <td><span class="who"><Avatar :id="x.r.requestedBy" :size="24" />{{ person(x.r.requestedBy)?.name }}</span></td>
            <td>
              <template v-if="x.r.status === 'pending' && canApprove">
                <div class="acts">
                  <button class="btn sm primary" :disabled="x.r.amount > lineLeft(x.p, x.r.budgetLine)" @click="decide(x, true)">อนุมัติเบิกจ่าย</button>
                  <button class="btn sm ghost" @click="decide(x, false)">ไม่อนุมัติ</button>
                </div>
                <p v-if="x.r.amount > lineLeft(x.p, x.r.budgetLine)" class="small bad">เกินงบที่เหลือ {{ baht(lineLeft(x.p, x.r.budgetLine)) }}</p>
              </template>
              <span v-else class="chip" :class="{ win: x.r.status !== 'pending' && x.r.status !== 'rejected', lose: x.r.status === 'rejected', warn: x.r.status === 'pending' }">
                {{ { pending: 'รอ OPN อนุมัติ', approved: 'อนุมัติแล้ว', rejected: 'ไม่อนุมัติ', po_issued: 'ออก PO แล้ว' }[x.r.status] }}
              </span>
            </td>
          </tr>
          <tr v-if="!rows.length"><td colspan="6" class="muted">ยังไม่มีคำขอซื้อ</td></tr>
        </tbody>
      </table>
    </section>

    <Dialog :open="open" title="ขอซื้อ (PR)" @close="open = false">
      <div class="field">
        <label for="pp">โครงการ</label>
        <select id="pp" v-model="draft.projectId" class="input"><option v-for="p in mine" :key="p.id" :value="p.id">{{ p.name }}</option></select>
      </div>
      <div class="field">
        <label for="bl">รายการงบใน Cost Sheet</label>
        <select id="bl" v-model="draft.budgetLine" class="input"><option value="" disabled>เลือกรายการ</option><option v-for="b in draftLines" :key="b.line" :value="b.line">{{ b.line }} — เหลือ {{ baht(b.left) }}</option></select>
      </div>
      <div class="field"><label for="it">สิ่งที่ซื้อ</label><input id="it" v-model="draft.item" class="input" /></div>
      <div class="two">
        <div class="field"><label for="vd">ผู้ขาย</label><input id="vd" v-model="draft.vendor" class="input" /></div>
        <div class="field"><label for="am">จำนวนเงิน (บาท)</label><input id="am" v-model.number="draft.amount" class="input num" type="number" min="0" /></div>
      </div>
      <template #foot>
        <button class="btn" @click="open = false">ยกเลิก</button>
        <button class="btn primary" :disabled="!draft.projectId || !draft.item || !draft.amount || !draft.budgetLine" @click="submit">ส่งคำขอซื้อ</button>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.budgets { display: grid; gap: 18px; }
.bp { display: grid; gap: 8px; }
.pn { font-weight: 600; color: var(--ink); }
.bl { display: grid; grid-template-columns: minmax(160px, 260px) 1fr minmax(170px, auto); gap: 12px; align-items: center; }
.bar { height: 10px; background: var(--idle-soft); border-radius: 99px; overflow: hidden; display: flex; }
.bar i { display: block; height: 100%; }
.bar .c { background: var(--ink); }
.bar .w { background: repeating-linear-gradient(45deg, var(--warn) 0 4px, var(--warn-soft) 4px 8px); }
.flush { padding: 4px 8px; margin-top: 20px; }
.who { display: inline-flex; gap: 6px; align-items: center; white-space: nowrap; font-size: 13.5px; }
.acts { display: flex; gap: 6px; flex-wrap: wrap; }
.bad { color: var(--lose); }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 700px) { .bl { grid-template-columns: 1fr; gap: 4px; } }
</style>
