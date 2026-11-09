<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import Avatar from './Avatar.vue'
import Icon from './Icon.vue'
import { HANDOVER_PARTIES, type ContractTerms, type OtRequest, type Project, type Task } from '../data/model'
import { handoverGate, isTender } from '../domain/rules'
import { effort, health, lateTasks, paidAmount, progressPct, otBudget } from '../domain/metrics'
import KpiStrip from './KpiStrip.vue'
import { PEOPLE, SALES_TEAMS, baht, groupOf, person, thDate, TODAY, TODAY_ISO } from '../data/mock'
import { notify, session } from '../store'
import { newItem, record } from '../domain/work'

const props = defineProps<{ p: Project }>()
const view = ref<'plan' | 'tasks' | 'ot' | 'risks'>('plan')

/* ---------- Handover (Close Win → Handover) ---------- */
const done = !!props.p.handoverDone
const checklist = reactive([
  { t: 'สัญญา / PO ฉบับลงนาม อยู่ในโฟลเดอร์ Contract', done: true },
  { t: 'Cost Sheet ฉบับอนุมัติ (Baseline งบประมาณ)', done: true },
  { t: 'TOR และ Proposal ที่ใช้ยื่น', done: true },
  { t: 'ขอบเขตงาน งวดงาน และเกณฑ์ตรวจรับ', done },
  { t: 'ผู้ติดต่อฝั่งลูกค้าและคณะกรรมการตรวจรับ', done },
  { t: 'ความเสี่ยงและคำสัญญาที่ให้ลูกค้าระหว่างขาย', done },
])
watch(checklist, () => { props.p.handoverDone = checklist.every((c) => c.done) }, { deep: true })
const pick = reactive({ pm: props.p.pm ?? '', team: props.p.team })
const canAssign = computed(() => ['pmo', 'head', 'admin'].includes(session.role))

// P0-11 · contract terms are structured data (penalty exposure, SLA, tax) — required before delivery starts.
const terms = reactive<ContractTerms>(props.p.terms ? { ...props.p.terms } : {
  penaltyBasis: 'whole_contract', penaltyRatePerDay: 0.001, penaltyMinPerDay: 100, warrantyMonths: 12, slaTier: 'มาตรฐาน 8x5', whtRate: isTender(props.p) ? 0.01 : 0.03,
})
const ratePct = computed({ get: () => +(terms.penaltyRatePerDay * 100).toFixed(3), set: (v: number) => { terms.penaltyRatePerDay = v / 100 } })
const bond = reactive({ bank: 'ธนาคารกรุงไทย', expires: '', form: 'หนังสือค้ำประกันธนาคาร' })
const hasPerf = computed(() => (props.p.bonds ?? []).some((b) => b.kind === 'performance'))
function saveTerms() {
  props.p.terms = { ...terms }
  if (isTender(props.p) && !hasPerf.value && bond.expires) {
    const amount = Math.round((props.p.contractValue ?? props.p.revenue) * 0.05)
    props.p.bonds = [...(props.p.bonds ?? []), { kind: 'performance', pct: 5, amount, form: bond.form, bank: bond.bank, issued: TODAY_ISO, expires: bond.expires }]
  }
  notify('บันทึกเงื่อนไขสัญญาแล้ว')
}
const gate = computed(() => handoverGate(props.p, checklist.every((c) => c.done)))

// Handover meeting: SM, PM, MA, OPN and the Dev team lead. PMO invites them (calendar event
// with a Teams link) and ticks attendance after the meeting; the gate needs all five.
const devLeadOf = (team: string) => PEOPLE.find((x) => x.role === 'head' && x.team === team)?.id ?? PEOPLE.find((x) => x.role === 'head' && x.team === groupOf(team))?.id ?? ''
const DEFAULT_WHO = { ma: 'wm', opn: 'op' }
function assign() {
  props.p.pm = pick.pm
  props.p.team = pick.team
  props.p.handover = {
    meetingAt: props.p.handover?.meetingAt ?? 'นัดแล้ว',
    attendees: HANDOVER_PARTIES.map(({ k }) => ({
      party: k,
      who: k === 'sm' ? props.p.sm : k === 'pm' ? pick.pm : k === 'devlead' ? devLeadOf(pick.team) : DEFAULT_WHO[k],
      attended: props.p.handover?.attendees.find((a) => a.party === k)?.attended ?? false,
    })),
  }
  notify(`มอบหมาย ${person(pick.pm)?.name} เป็น PM แล้ว — ส่งนัดประชุม Handover (Teams) ถึงผู้เข้าร่วม 5 ฝ่าย`)
}
const canMarkAttendance = computed(() => ['pmo', 'admin'].includes(session.role))

/* ---------- OT (PM approves within the Cost Sheet reserve) ---------- */
const ot = computed(() => otBudget(props.p))
const canApproveOt = computed(() => (session.role === 'pm' && props.p.pm === session.userId) || session.role === 'admin')
function decideOt(o: OtRequest, ok: boolean) {
  if (ok && o.amount > ot.value.left) return
  o.status = ok ? 'approved' : 'rejected'
  notify(ok ? `อนุมัติ OT ${person(o.who)?.name} ${o.hours} ชม.` : 'ไม่อนุมัติ OT แล้ว')
}

/* ---------- Gantt ---------- */
const range = computed(() => {
  const ms = props.p.milestones ?? []
  const s = new Date(ms[0]?.start ?? TODAY)
  const e = new Date(ms[ms.length - 1]?.end ?? TODAY)
  return { s: new Date(s.getFullYear(), s.getMonth(), 1), e: new Date(e.getFullYear(), e.getMonth() + 1, 0) }
})
const span = computed(() => range.value.e.getTime() - range.value.s.getTime())
const x = (iso: string | Date) => ((new Date(iso).getTime() - range.value.s.getTime()) / span.value) * 100
const months = computed(() => {
  const out: { label: string; left: number }[] = []
  const d = new Date(range.value.s)
  while (d <= range.value.e) {
    out.push({ label: d.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }), left: x(d) })
    d.setMonth(d.getMonth() + 1)
  }
  return out
})
const todayX = computed(() => x(TODAY))

/* ---------- Tasks ---------- */
const COLS: { k: Task['status']; l: string }[] = [
  { k: 'todo', l: 'ยังไม่เริ่ม' }, { k: 'doing', l: 'กำลังทำ' }, { k: 'review', l: 'รอตรวจ' }, { k: 'done', l: 'เสร็จ' },
]
const late = (t: Task) => t.status !== 'done' && new Date(t.due) < TODAY
const over = (t: Task) => t.spent > t.hours
const move = (t: Task, dir: 1 | -1) => {
  const i = COLS.findIndex((c) => c.k === t.status)
  t.status = COLS[Math.min(3, Math.max(0, i + dir))].k
}
// Same figures and RAG as the Portfolio card for this project.
const kpis = computed(() => {
  const e = effort(props.p)
  const lateN = lateTasks(props.p, TODAY_ISO).length
  return [
    { label: 'ความคืบหน้ารวม', value: progressPct(props.p) + '%', note: health(props.p, TODAY_ISO)[0].note, tone: toneOf(health(props.p, TODAY_ISO)[0].tone) },
    { label: 'ชั่วโมงใช้ไป / แผน', value: `${e.spent} / ${e.plan}`, note: health(props.p, TODAY_ISO)[1].note, tone: toneOf(health(props.p, TODAY_ISO)[1].tone) },
    { label: 'Task เลยกำหนด', value: String(lateN), note: 'จาก Task board', tone: lateN ? ('bad' as const) : ('' as const) },
    { label: 'รับชำระแล้ว', value: baht(paidAmount(props.p)), note: health(props.p, TODAY_ISO)[2].note },
  ]
})
const toneOf = (t: 'ok' | 'warn' | 'bad') => (t === 'ok' ? ('' as const) : t)

const risks = [
  { lvl: 'สูง', t: 'API ชำระเงินของธนาคารเปลี่ยนเวอร์ชันระหว่างพัฒนา', owner: 'dev3', act: 'นัด Tech call กับธนาคาร 8 พ.ย.' },
  { lvl: 'กลาง', t: 'ผู้ใช้งานฝั่งลูกค้าว่างทดสอบ UAT ได้แค่ 2 วัน/สัปดาห์', owner: 'ak', act: 'แบ่ง UAT เป็น 3 รอบย่อย' },
  { lvl: 'ต่ำ', t: 'Server ลูกค้าส่งมอบล่าช้า 1 สัปดาห์', owner: 'ak', act: 'ใช้ Staging ของบริษัทชั่วคราว' },
]
const crs = reactive([
  { id: 'CR-03', t: 'เพิ่มหน้าจอรายงานสถิติรายอำเภอ', md: 6, cost: 72_000, status: 'รอลูกค้าอนุมัติ', approved: false },
  { id: 'CR-02', t: 'เปลี่ยน OTP จาก SMS เป็น ThaiD', md: 4, cost: 0, status: 'อนุมัติ — อยู่ในขอบเขตเดิม', approved: true },
])
// An approved CR becomes a story in the workspace (estimate = Man-day × 8), linked both ways.
const crItem = (id: string) => (props.p.tasks ?? []).find((t) => t.crId === id)
const canPlanCr = computed(() => !!props.p.workspace && (session.role === 'admin' || session.role === 'pmo' || props.p.pm === session.userId))
function crToWork(c: (typeof crs)[number]) {
  if (!props.p.workspace || crItem(c.id)) return
  const t = newItem(props.p, { title: c.t, type: 'story', crId: c.id, hours: c.md * 8, labels: ['CR'], priority: 'high', description: `จาก ${c.id} · ${c.md} Man-day${c.cost ? ' · ค่าใช้จ่ายเพิ่ม ' + baht(c.cost) : ''}` }, session.userId, TODAY_ISO)
  props.p.tasks = [...(props.p.tasks ?? []), t]
  record(props.p, session.userId, t, `สร้างงานจาก ${c.id}`, TODAY_ISO)
  notify(`สร้าง ${t.key} จาก ${c.id} ในพื้นที่งานแล้ว`)
}
</script>

<template>
  <!-- Handover gate -->
  <section v-if="p.stage === 'win' || p.stage === 'handover'" class="panel hand">
    <div class="panel-head"><h2>Handover จาก Pre-sale ให้ PM</h2><span class="chip" :class="gate.ok ? 'win' : 'warn'">{{ gate.ok ? 'พร้อมเริ่มส่งมอบ' : `เหลือ ${gate.errors.length} รายการ` }}</span></div>
    <div class="hgrid">
      <ul class="check">
        <li v-for="c in checklist" :key="c.t"><label><input v-model="c.done" type="checkbox" /> {{ c.t }}</label></li>
      </ul>
      <div class="assign">
        <div class="field">
          <label for="pm">Project Manager</label>
          <select id="pm" v-model="pick.pm" class="input" :disabled="!canAssign">
            <option value="" disabled>เลือก PM</option>
            <option v-for="u in PEOPLE.filter((x) => x.role === 'pm' && x.team === 'DT3-3')" :key="u.id" :value="u.id">{{ u.name }} · PMO</option>
          </select>
        </div>
        <div class="field">
          <label for="team">ทีม DT ที่พัฒนา</label>
          <select id="team" v-model="pick.team" class="input" :disabled="!canAssign">
            <option v-for="t in SALES_TEAMS" :key="t.code" :value="t.code">{{ t.code }} · {{ t.name }}</option>
          </select>
          <span class="hint">ดูความว่างของทีมได้ที่เมนู Team Workload</span>
        </div>
        <button v-if="canAssign" class="btn primary" :disabled="!pick.pm" @click="assign">มอบหมาย PM และนัดประชุม Handover</button>
        <p v-else class="hint">PMO หรือหัวหน้ากลุ่มเป็นผู้มอบหมาย PM</p>
      </div>
    </div>
    <div class="att">
      <h3>ผู้เข้าประชุม Handover</h3>
      <p v-if="!p.handover" class="hint">มอบหมาย PM ก่อน ระบบจะส่งนัดถึง SM, PM, ทีม MA, OPN และหัวหน้าทีม Dev</p>
      <ul v-else>
        <li v-for="a in p.handover.attendees" :key="a.party">
          <Avatar :id="a.who" :size="28" />
          <span><strong>{{ HANDOVER_PARTIES.find((x) => x.k === a.party)?.label }}</strong><em>{{ person(a.who)?.name ?? 'ยังไม่ระบุ' }}</em></span>
          <label class="ok"><input v-model="a.attended" type="checkbox" :disabled="!canMarkAttendance" /> เข้าร่วมแล้ว</label>
        </li>
      </ul>
    </div>
    <div class="terms">
      <h3>เงื่อนไขสัญญา</h3>
      <div class="tgrid">
        <div class="field"><label for="pb">ฐานคิดค่าปรับ</label>
          <select id="pb" v-model="terms.penaltyBasis" class="input" :disabled="!canAssign"><option value="whole_contract">ราคาเต็มสัญญา (งานส่งมอบทั้งระบบ)</option><option value="undelivered_value">มูลค่างานที่ยังไม่ส่งมอบ</option></select></div>
        <div class="field"><label for="pr">อัตราค่าปรับ (% ต่อวัน)</label><input id="pr" v-model.number="ratePct" class="input num" type="number" step="0.01" min="0.01" max="0.2" :disabled="!canAssign" /><span class="hint">ระเบียบ: 0.01–0.20% (งานทั้งระบบ 0.01–0.10%) ขั้นต่ำ ฿{{ terms.penaltyMinPerDay }}/วัน</span></div>
        <div class="field"><label for="wm">ระยะรับประกัน (เดือน)</label><input id="wm" v-model.number="terms.warrantyMonths" class="input num" type="number" min="0" :disabled="!canAssign" /></div>
        <div class="field"><label for="sla">ระดับ SLA</label><select id="sla" v-model="terms.slaTier" class="input" :disabled="!canAssign"><option>มาตรฐาน 8x5</option><option>พรีเมียม 24x7</option></select></div>
        <div class="field"><label for="wht">หัก ณ ที่จ่าย</label><select id="wht" v-model.number="terms.whtRate" class="input" :disabled="!canAssign"><option :value="0.01">1% (หน่วยงานรัฐ)</option><option :value="0.03">3% (ค่าบริการ เอกชน)</option></select></div>
      </div>
      <div v-if="isTender(p) && !hasPerf" class="tgrid">
        <div class="field"><label for="bb">หลักประกันสัญญา 5% — ธนาคาร</label><input id="bb" v-model="bond.bank" class="input" :disabled="!canAssign" /></div>
        <div class="field"><label for="be">หมดอายุ</label><input id="be" v-model="bond.expires" class="input" type="date" :disabled="!canAssign" /><span class="hint">ควรครอบคลุมถึงหลังหมดประกัน</span></div>
      </div>
      <button v-if="canAssign" class="btn" @click="saveTerms">บันทึกเงื่อนไขสัญญา</button>
      <div v-if="!gate.ok" class="missing"><strong>ก่อนย้ายเป็น In Delivery ต้องมี</strong><ul><li v-for="e in gate.errors" :key="e">{{ e }}</li></ul></div>
    </div>
  </section>

  <template v-if="p.milestones">
    <KpiStrip :items="kpis" />
    <div class="wslink"><span class="small muted">จัดการงานแบบรายการ บอร์ด ปฏิทิน Timeline เอกสาร และแบบฟอร์ม</span><router-link :to="`/work/${p.id}`" class="btn sm primary">เปิดพื้นที่งาน {{ p.workspace?.key ?? '' }}</router-link></div>

    <div class="tabs" role="tablist">
      <button role="tab" :aria-selected="view === 'plan'" @click="view = 'plan'">Timeline และงวดงาน</button>
      <button role="tab" :aria-selected="view === 'tasks'" @click="view = 'tasks'">Task board</button>
      <button role="tab" :aria-selected="view === 'ot'" @click="view = 'ot'">OT</button>
      <button role="tab" :aria-selected="view === 'risks'" @click="view = 'risks'">ความเสี่ยงและ Change request</button>
    </div>

    <section v-if="view === 'plan'" class="panel">
      <div class="gantt scroll-x">
        <div class="ginner">
          <div class="gmonths">
            <span v-for="m in months" :key="m.label" :style="{ left: m.left + '%' }">{{ m.label }}</span>
          </div>
          <div class="gtoday"><div class="today" :style="{ left: todayX + '%' }"><em>วันนี้</em></div></div>
          <div v-for="m in p.milestones" :key="m.name" class="grow">
            <div class="gl"><strong>{{ m.name }}</strong><span class="small muted">{{ thDate(m.start) }} – {{ thDate(m.end) }}</span></div>
            <div class="gt">
              <div class="gbar" :class="{ done: m.progress === 100, behind: m.progress < 100 && new Date(m.end) < TODAY }"
                :style="{ left: x(m.start) + '%', width: x(m.end) - x(m.start) + '%' }">
                <i :style="{ width: m.progress + '%' }" /><span class="num" :class="{ dim: m.progress < 20 }">{{ m.progress }}%</span>
              </div>
            </div>
            <div class="gpay num small">{{ m.payment ? baht(m.payment) : '' }}<span class="chip" :class="m.state === 'paid' ? 'win' : m.state === 'planned' || !m.state ? '' : 'warn'">{{ ({ planned: 'ยังไม่ส่งมอบ', delivered: 'ส่งมอบแล้ว', inspected: 'ตรวจรับแล้ว', invoiced: 'วางบิลแล้ว', paid: 'รับเงินแล้ว' } as Record<string, string>)[m.state ?? 'planned'] }}</span></div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="view === 'tasks'" class="kan">
      <div v-for="c in COLS" :key="c.k" class="kcol">
        <h3>{{ c.l }} <span class="muted">{{ p.tasks?.filter((t) => t.status === c.k).length }}</span></h3>
        <article v-for="t in p.tasks?.filter((t) => t.status === c.k)" :key="t.id" class="task" :class="{ late: late(t) }">
          <strong>{{ t.title }}</strong>
          <p class="small muted">{{ t.milestone }}</p>
          <div class="hrs"><div class="hb"><i :class="{ over: over(t) }" :style="{ width: Math.min(100, (t.spent / t.hours) * 100) + '%' }" /></div><span class="small num">{{ t.spent }}/{{ t.hours }} ชม.</span></div>
          <div class="tf">
            <Avatar :id="t.assignee" :size="24" />
            <span class="small" :class="late(t) ? 'bad' : 'muted'"><Icon name="clock" :size="13" /> {{ thDate(t.due) }}{{ late(t) ? ' · เลยกำหนด' : '' }}</span>
            <span class="mv">
              <button class="btn ghost sm" :disabled="c.k === 'todo'" aria-label="ย้อนสถานะ" @click="move(t, -1)">‹</button>
              <button class="btn ghost sm" :disabled="c.k === 'done'" aria-label="เลื่อนสถานะ" @click="move(t, 1)">›</button>
            </span>
          </div>
        </article>
      </div>
    </section>

    <section v-if="view === 'ot'" class="panel">
      <div class="panel-head"><h2>OT ทีมพัฒนา</h2><span class="muted small">PM อนุมัติได้ไม่เกินเงินกัน OT ใน Cost Sheet ที่อนุมัติ</span></div>
      <div class="otbar" role="img" :aria-label="`ใช้ไป ${ot.approved} จาก ${ot.reserve}`">
        <i class="a" :style="{ width: Math.min(100, (ot.approved / ot.reserve) * 100) + '%' }" />
        <i class="p" :style="{ width: Math.min(100 - (ot.approved / ot.reserve) * 100, (ot.pending / ot.reserve) * 100) + '%' }" />
      </div>
      <p class="small otl"><span>อนุมัติแล้ว <b class="num">{{ baht(ot.approved) }}</b></span><span>รออนุมัติ <b class="num">{{ baht(ot.pending) }}</b></span><span>คงเหลือ <b class="num">{{ baht(ot.left) }}</b> จาก {{ baht(ot.reserve) }}</span></p>
      <table class="table">
        <thead><tr><th>ผู้ขอ</th><th>สัปดาห์</th><th class="r">ชม.</th><th class="r">จำนวนเงิน</th><th>เหตุผล</th><th>สถานะ</th></tr></thead>
        <tbody>
          <tr v-for="o in p.ot ?? []" :key="o.id">
            <td><span class="who"><Avatar :id="o.who" :size="24" />{{ person(o.who)?.name }}</span></td>
            <td class="small">{{ o.week }}</td><td class="r num">{{ o.hours }}</td><td class="r num">{{ baht(o.amount) }}</td>
            <td class="small">{{ o.reason }}</td>
            <td>
              <template v-if="o.status === 'pending' && canApproveOt">
                <button class="btn sm primary" :disabled="o.amount > ot.left" @click="decideOt(o, true)">อนุมัติ</button>
                <button class="btn sm ghost" @click="decideOt(o, false)">ไม่อนุมัติ</button>
                <p v-if="o.amount > ot.left" class="small bad">เกินเงินกัน — ต้องให้หัวหน้าทีม Dev และรองผู้บริหารอนุมัติ</p>
              </template>
              <span v-else class="chip" :class="o.status === 'approved' ? 'win' : o.status === 'rejected' ? 'lose' : 'warn'">{{ o.status === 'approved' ? 'อนุมัติแล้ว' : o.status === 'rejected' ? 'ไม่อนุมัติ' : 'รอ PM อนุมัติ' }}</span>
            </td>
          </tr>
          <tr v-if="!(p.ot ?? []).length"><td colspan="6" class="muted">ยังไม่มีคำขอ OT</td></tr>
        </tbody>
      </table>
    </section>

    <section v-if="view === 'risks'" class="rgrid">
      <div class="panel">
        <div class="panel-head"><h2>ความเสี่ยงและปัญหา</h2><button class="btn sm">เพิ่มความเสี่ยง</button></div>
        <ul class="rl">
          <li v-for="r in risks" :key="r.t">
            <span class="chip" :class="r.lvl === 'สูง' ? 'lose' : r.lvl === 'กลาง' ? 'warn' : ''">{{ r.lvl }}</span>
            <div><strong>{{ r.t }}</strong><p class="small muted">แผนรับมือ: {{ r.act }}</p></div>
            <Avatar :id="r.owner" :size="26" />
          </li>
        </ul>
      </div>
      <div class="panel">
        <div class="panel-head"><h2>Change request</h2><button class="btn sm">เปิด CR</button></div>
        <ul class="rl">
          <li v-for="c in crs" :key="c.id">
            <span class="chip">{{ c.id }}</span>
            <div><strong>{{ c.t }}</strong><p class="small muted">{{ c.md }} Man-day · {{ c.cost ? baht(c.cost) : 'ไม่มีค่าใช้จ่ายเพิ่ม' }} · {{ c.status }}</p></div>
            <router-link v-if="crItem(c.id)" :to="`/work/${p.id}`" class="btn sm ghost">{{ crItem(c.id)!.key }} · {{ crItem(c.id)!.status === 'done' ? 'เสร็จ' : 'ในแผนงาน' }}</router-link>
            <button v-else-if="c.approved && canPlanCr" class="btn sm" @click="crToWork(c)">สร้างงานในพื้นที่งาน</button>
          </li>
        </ul>
      </div>
    </section>
  </template>

  <section v-else-if="p.stage === 'delivery'" class="panel empty">
    <h3>ยังไม่มีแผนงาน</h3>
    <p class="muted">สร้าง Timeline จาก Template ตามประเภทโครงการ แล้วปรับวันที่และงวดชำระเงินตามสัญญา</p>
    <button class="btn primary">สร้างแผนจาก Template</button>
  </section>
</template>

<style scoped>
.hand { margin-bottom: 20px; }
.wslink { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin: -6px 0 16px; }
.att { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--line); }
.att h3 { margin-bottom: 10px; }
.att ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
.att li { display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; align-items: center; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r-md); }
.att li span { display: grid; line-height: 1.3; font-size: 13.5px; }
.att em { font-style: normal; color: var(--muted); font-size: 12.5px; }
.att .ok { grid-column: 1 / -1; display: flex; gap: 8px; align-items: center; font-size: 13px; }
.att .ok input { accent-color: var(--ink); width: 16px; height: 16px; }
.otbar { position: relative; height: 12px; background: var(--idle-soft); border-radius: 99px; overflow: hidden; display: flex; }
.otbar i { display: block; height: 100%; }
.otbar .a { background: var(--post); }
.otbar .p { background: repeating-linear-gradient(45deg, var(--warn) 0 4px, var(--warn-soft) 4px 8px); }
.otl { display: flex; gap: 20px; flex-wrap: wrap; margin: 10px 0 14px; color: var(--muted); }
.otl b { color: var(--ink); }
.who { display: inline-flex; gap: 6px; align-items: center; white-space: nowrap; }
.terms { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--line); display: grid; gap: 14px; justify-items: start; }
.tgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; width: 100%; align-items: start; }
.tgrid .field { align-content: start; }
.missing { background: var(--warn-soft); color: var(--warn); border-radius: var(--r-md); padding: 10px 14px; font-size: 13.5px; width: 100%; }
.missing ul { margin: 4px 0 0; padding-left: 18px; }
.hgrid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; }
.check { list-style: none; padding: 0; margin: 0; display: grid; gap: 4px; }
.check label { display: flex; gap: 10px; align-items: center; padding: 8px 10px; border-radius: var(--r-sm); cursor: pointer; }
.check label:hover { background: var(--sunken); }
.check input { width: 18px; height: 18px; accent-color: var(--ink); }
.assign { display: grid; gap: 14px; align-content: start; }

.bad { color: var(--lose) !important; }

.ginner { position: relative; min-width: 860px; padding: 28px 0 24px; }
.gmonths { position: absolute; top: 0; left: 240px; right: 140px; height: 100%; }
.gmonths span { position: absolute; top: 0; font-size: 12px; color: var(--muted); padding-left: 6px; border-left: 1px dashed var(--line); height: 100%; }
.gtoday { position: absolute; top: 0; bottom: 0; left: 240px; right: 140px; z-index: 3; pointer-events: none; }
.gt { z-index: 1; }
.gbar span.dim { color: var(--post); text-shadow: none; }
.today { position: absolute; top: 22px; bottom: 20px; width: 0; border-left: 2px solid var(--brand); }
.today em { position: absolute; white-space: nowrap; bottom: -20px; left: -18px; background: var(--surface); padding: 0 4px; font-style: normal; font-size: 11px; color: var(--brand); font-weight: 600; }
.grow { display: grid; grid-template-columns: 240px 1fr 140px; align-items: center; min-height: 52px; border-top: 1px solid var(--line); position: relative; }
.gl { display: grid; line-height: 1.35; padding-right: 12px; }
.gl strong { font-size: 14px; font-weight: 500; }
.gt { position: relative; height: 26px; }
.gbar { position: absolute; top: 0; height: 26px; background: var(--post-soft); border-radius: 5px; overflow: hidden; }
.gbar i { position: absolute; inset: 0 auto 0 0; background: var(--post); }
.gbar span { position: relative; z-index: 1; font-size: 12px; font-weight: 600; color: #fff; padding: 0 8px; line-height: 26px; mix-blend-mode: normal; text-shadow: 0 0 2px rgb(0 0 0 / 0.25); }
.gbar.done { background: var(--ink); } .gbar.done i { background: var(--ink); }
.gbar.behind { outline: 2px solid var(--lose); }
.gpay { text-align: right; display: flex; gap: 6px; justify-content: flex-end; align-items: center; }

.kan { display: grid; grid-template-columns: repeat(4, minmax(220px, 1fr)); gap: 12px; overflow-x: auto; }
.kcol { background: var(--sunken); border: 1px solid var(--line); border-radius: var(--r-lg); padding: 12px; display: grid; gap: 10px; align-content: start; min-height: 300px; }
.kcol h3 { font-size: 14px; padding: 2px 4px; }
.task { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); padding: 12px; display: grid; gap: 6px; }
.task.late { border-left: 3px solid var(--lose); }
.task strong { font-weight: 500; font-size: 14px; line-height: 1.4; }
.hrs { display: flex; gap: 8px; align-items: center; }
.hb { flex: 1; height: 5px; background: var(--idle-soft); border-radius: 99px; overflow: hidden; }
.hb i { display: block; height: 100%; background: var(--post); }
.hb i.over { background: var(--lose); }
.tf { display: flex; align-items: center; gap: 8px; }
.tf .small { display: inline-flex; align-items: center; gap: 3px; }
.mv { margin-left: auto; display: flex; }
.mv .btn { padding: 0 8px; min-height: 26px; }

.rgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.rl { list-style: none; margin: 0; padding: 0; display: grid; }
.rl li { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: start; padding: 12px 0; border-bottom: 1px solid var(--line); }
.rl li:last-child { border-bottom: 0; }
.rl strong { font-weight: 500; }
.empty { display: grid; gap: 10px; justify-items: start; }
@media (max-width: 1100px) { .hgrid, .rgrid { grid-template-columns: 1fr; } }
</style>
