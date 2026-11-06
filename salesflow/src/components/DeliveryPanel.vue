<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Avatar from './Avatar.vue'
import Icon from './Icon.vue'
import type { Project, Task } from '../data/model'
import { PEOPLE, TEAMS, baht, person, thDate, TODAY } from '../data/mock'
import { notify, session } from '../store'

const props = defineProps<{ p: Project }>()
const view = ref<'plan' | 'tasks' | 'risks'>('plan')

/* ---------- Handover (Close Win → Handover) ---------- */
const checklist = reactive([
  { t: 'สัญญา / PO ฉบับลงนาม อยู่ในโฟลเดอร์ Contract', done: true },
  { t: 'Cost Sheet ฉบับอนุมัติ (Baseline งบประมาณ)', done: true },
  { t: 'TOR และ Proposal ที่ใช้ยื่น', done: true },
  { t: 'ขอบเขตงาน งวดงาน และเงื่อนไขค่าปรับ', done: false },
  { t: 'ผู้ติดต่อฝั่งลูกค้าและช่องทางสื่อสาร', done: false },
  { t: 'ความเสี่ยงและคำสัญญาที่ให้ลูกค้าระหว่างขาย', done: false },
])
const pick = reactive({ pm: props.p.pm ?? '', team: props.p.team })
const handoverReady = computed(() => checklist.every((c) => c.done) && pick.pm)
const canAssign = computed(() => ['pmo', 'head', 'admin'].includes(session.role))

function assign() {
  props.p.pm = pick.pm
  props.p.team = pick.team
  notify(`มอบหมาย ${person(pick.pm)?.name} เป็น PM แล้ว ส่งนัดประชุม Handover ใน Teams`)
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
const effort = computed(() => {
  const ts = props.p.tasks ?? []
  return { plan: ts.reduce((s, t) => s + t.hours, 0), spent: ts.reduce((s, t) => s + t.spent, 0), late: ts.filter(late).length }
})

const risks = [
  { lvl: 'สูง', t: 'API ชำระเงินของธนาคารเปลี่ยนเวอร์ชันระหว่างพัฒนา', owner: 'dev3', act: 'นัด Tech call กับธนาคาร 8 พ.ย.' },
  { lvl: 'กลาง', t: 'ผู้ใช้งานฝั่งลูกค้าว่างทดสอบ UAT ได้แค่ 2 วัน/สัปดาห์', owner: 'ak', act: 'แบ่ง UAT เป็น 3 รอบย่อย' },
  { lvl: 'ต่ำ', t: 'Server ลูกค้าส่งมอบล่าช้า 1 สัปดาห์', owner: 'ak', act: 'ใช้ Staging ของบริษัทชั่วคราว' },
]
const crs = [
  { id: 'CR-03', t: 'เพิ่มหน้าจอรายงานสถิติรายอำเภอ', md: 6, cost: 72_000, status: 'รอลูกค้าอนุมัติ' },
  { id: 'CR-02', t: 'เปลี่ยน OTP จาก SMS เป็น ThaiD', md: 4, cost: 0, status: 'อนุมัติ — อยู่ในขอบเขตเดิม' },
]
</script>

<template>
  <!-- Handover gate -->
  <section v-if="p.stage === 'win' || p.stage === 'handover'" class="panel hand">
    <div class="panel-head"><h2>Handover จาก Pre-sale ให้ PM</h2><span class="chip" :class="handoverReady ? 'win' : 'warn'">{{ checklist.filter((c) => c.done).length }}/{{ checklist.length }} รายการ</span></div>
    <div class="hgrid">
      <ul class="check">
        <li v-for="c in checklist" :key="c.t"><label><input v-model="c.done" type="checkbox" /> {{ c.t }}</label></li>
      </ul>
      <div class="assign">
        <div class="field">
          <label for="pm">Project Manager</label>
          <select id="pm" v-model="pick.pm" class="input" :disabled="!canAssign">
            <option value="" disabled>เลือก PM</option>
            <option v-for="u in PEOPLE.filter((x) => x.role === 'pm' && ['ak', 'ks'].includes(x.id))" :key="u.id" :value="u.id">{{ u.name }} · {{ u.team }}</option>
          </select>
        </div>
        <div class="field">
          <label for="team">ทีม DT ที่พัฒนา</label>
          <select id="team" v-model="pick.team" class="input" :disabled="!canAssign">
            <option v-for="t in TEAMS" :key="t.code" :value="t.code">{{ t.code }} · {{ t.name }}</option>
          </select>
          <span class="hint">ดูความว่างของทีมได้ที่เมนู Workload ทีม</span>
        </div>
        <button v-if="canAssign" class="btn primary" :disabled="!pick.pm" @click="assign">มอบหมาย PM และนัดประชุม Handover</button>
        <p v-else class="hint">PMO หรือหัวหน้ากลุ่มเป็นผู้มอบหมาย PM</p>
      </div>
    </div>
  </section>

  <template v-if="p.milestones">
    <div class="stats">
      <div><span>ความคืบหน้ารวม</span><strong class="num">{{ Math.round(p.milestones.reduce((s, m) => s + m.progress, 0) / p.milestones.length) }}%</strong></div>
      <div><span>ชั่วโมงใช้ไป / แผน</span><strong class="num">{{ effort.spent }} / {{ effort.plan }}</strong></div>
      <div><span>Task เลยกำหนด</span><strong class="num" :class="{ bad: effort.late }">{{ effort.late }}</strong></div>
      <div><span>รับชำระแล้ว</span><strong class="num">{{ baht(p.milestones.filter((m) => m.paid).reduce((s, m) => s + (m.payment ?? 0), 0)) }}</strong></div>
    </div>

    <div class="tabs" role="tablist">
      <button role="tab" :aria-selected="view === 'plan'" @click="view = 'plan'">Timeline และงวดงาน</button>
      <button role="tab" :aria-selected="view === 'tasks'" @click="view = 'tasks'">Task board</button>
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
            <div class="gpay num small">{{ m.payment ? baht(m.payment) : '' }}<span v-if="m.paid" class="chip win">รับแล้ว</span></div>
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
.hgrid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; }
.check { list-style: none; padding: 0; margin: 0; display: grid; gap: 4px; }
.check label { display: flex; gap: 10px; align-items: center; padding: 8px 10px; border-radius: var(--r-sm); cursor: pointer; }
.check label:hover { background: var(--sunken); }
.check input { width: 18px; height: 18px; accent-color: var(--ink); }
.assign { display: grid; gap: 14px; align-content: start; }

.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
.stats > div { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); padding: 14px 16px; display: grid; }
.stats span { font-size: 13px; color: var(--muted); }
.stats strong { font-size: 22px; font-weight: 600; }
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
@media (max-width: 1100px) { .hgrid, .rgrid { grid-template-columns: 1fr; } .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
