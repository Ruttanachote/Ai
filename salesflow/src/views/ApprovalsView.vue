<script setup lang="ts">
import { computed } from 'vue'
import Avatar from '../components/Avatar.vue'
import StageBadge from '../components/StageBadge.vue'
import PageHeader from '../components/PageHeader.vue'
import KpiStrip from '../components/KpiStrip.vue'
import { scope, session, canDecideStep } from '../store'
import { baht, mb, TODAY_ISO } from '../data/mock'
import { approvalState, pendingStep, gpPct, pipelineValue, sum, APPROVAL_LABEL } from '../domain/metrics'
import { customerName } from '../display'

// Same scope and approval state as the Cost Sheet tab and the Pipeline board chips.

const withApproval = computed(() => scope.value.list.filter((p) => approvalState(p, TODAY_ISO) !== 'none'))
const waiting = computed(() =>
  withApproval.value.filter((p) => p.approval?.submittedBy !== session.userId && canDecideStep(pendingStep(p, TODAY_ISO), session.role)),
)
// TOR Final waiting for this group head (or admin) before it goes to the customer.
const torQueue = computed(() => scope.value.list.filter((p) => p.torReview?.status === 'pending' && ['head', 'admin'].includes(session.role)))
const others = computed(() => withApproval.value.filter((p) => !waiting.value.includes(p)))
const reopen = computed(() => (['head', 'admin'].includes(session.role) ? scope.value.list.filter((p) => p.stage === 'lose') : []))
const kpis = computed(() => [
  { label: 'ถึงคิวคุณ', value: String(waiting.value.length + torQueue.value.length), note: mb(sum(waiting.value, pipelineValue)) + ' มูลค่ารวม', tone: waiting.value.length ? ('warn' as const) : ('' as const) },
  { label: 'รอผู้อื่นพิจารณา', value: String(others.value.filter((p) => approvalState(p, TODAY_ISO) === 'pending').length), note: 'คำขอที่ยังไม่ครบทุกขั้น' },
  { label: 'ต้องส่งใหม่', value: String(withApproval.value.filter((p) => ['stale', 'rejected', 'expired'].includes(approvalState(p, TODAY_ISO))).length), note: 'แก้ไฟล์หลังส่ง ส่งกลับ หรือหมดอายุ' },
  { label: 'GP ต่ำกว่า 25%', value: String(waiting.value.filter((p) => (gpPct(p) ?? 100) < 25).length), note: 'ในคำขอที่ถึงคิวคุณ', tone: waiting.value.some((p) => (gpPct(p) ?? 100) < 25) ? ('bad' as const) : ('' as const) },
])
</script>

<template>
  <div class="page">
    <PageHeader module="My Work · งานของฉัน" title="Approval Requests" :scope="scope.label" subtitle="อนุมัติได้จากหน้านี้หรือจากลิงก์ในอีเมล" />
    <KpiStrip :items="kpis" />

    <section v-if="torQueue.length" class="panel block">
      <div class="panel-head"><h2>TOR Final รอหัวหน้ากลุ่มตรวจ</h2><span class="muted small">ตรวจก่อน SM ส่งลูกค้า</span></div>
      <router-link v-for="p in torQueue" :key="p.id" :to="`/projects/${p.id}`" class="req">
        <Avatar :id="p.sm" :size="36" />
        <div class="main"><strong>{{ p.name }}</strong><p class="small muted">{{ p.code }} · {{ p.salesDocs?.tor }} · v{{ p.torReview?.version }} ส่ง {{ p.torReview?.at }}</p></div>
        <span class="chip warn">เปิดแท็บ Requirement และ TOR</span>
      </router-link>
    </section>

    <section class="list">
      <router-link v-for="p in waiting" :key="p.id" :to="`/projects/${p.id}`" class="req">
        <Avatar :id="p.sm" :size="40" />
        <div class="main">
          <strong>{{ p.name }}</strong>
          <p class="small muted">{{ p.code }} · {{ customerName(p) }} · ส่ง {{ p.approval?.version }} เมื่อ {{ p.approval?.submittedAt }}</p>
          <p v-for="s in p.approval?.steps.filter((x) => x.note)" :key="s.who" class="note small">{{ s.who }}: “{{ s.note }}”</p>
        </div>
        <div class="fig"><span>ราคาเสนอ</span><b class="num">{{ baht(pipelineValue(p)) }}</b></div>
        <div class="fig"><span>GP</span><b class="num" :class="(gpPct(p) ?? 0) < 25 ? 'bad' : 'good'">{{ (gpPct(p) ?? 0).toFixed(1) }}%</b></div>
        <span class="btn primary sm">พิจารณา</span>
      </router-link>
      <div v-if="!waiting.length" class="panel empty">
        <h3>ไม่มีคำขอค้าง</h3>
        <p class="muted">เมื่อ SM ส่งขออนุมัติ คุณจะได้รับอีเมลและเห็นรายการที่นี่</p>
      </div>
    </section>

    <section v-if="reopen.length" class="panel block">
      <div class="panel-head"><h2>งานที่แพ้ เปิดใหม่ได้</h2><span class="muted small">หัวหน้ากลุ่มและผู้บริหาร — เปิดเป็นโครงการใหม่</span></div>
      <router-link v-for="p in reopen" :key="p.id" :to="`/projects/${p.id}`" class="row">
        <span>{{ p.name }} <span class="muted small">· {{ p.nextStep }}</span></span><StageBadge :stage="p.stage" />
      </router-link>
    </section>

    <section v-if="others.length" class="panel block">
      <div class="panel-head"><h2>คำขออื่นที่ติดตามอยู่</h2></div>
      <router-link v-for="p in others" :key="p.id" :to="`/projects/${p.id}`" class="row">
        <span>{{ p.name }} <span class="muted small">· {{ pendingStep(p, TODAY_ISO)?.role ?? APPROVAL_LABEL[approvalState(p, TODAY_ISO)].label }}</span></span>
        <StageBadge :stage="p.stage" />
      </router-link>
    </section>
  </div>
</template>

<style scoped>
.list { display: grid; gap: 10px; }
.req { display: grid; grid-template-columns: auto 1fr auto auto auto; gap: 20px; align-items: center; background: var(--surface); border: 1px solid var(--line); border-left: 3px solid var(--warn); border-radius: var(--r-md); padding: 18px 20px; color: var(--ink); }
.req:hover { text-decoration: none; border-color: var(--line-strong); border-left-color: var(--warn); }
.main strong { font-weight: 600; }
.note { margin-top: 6px; background: var(--sunken); padding: 6px 10px; border-radius: var(--r-sm); color: var(--ink-2); }
.fig { display: grid; text-align: right; }
.fig span { font-size: 12px; color: var(--muted); }
.fig b { font-size: 18px; }
.good { color: var(--win); } .bad { color: var(--lose); }
.empty { text-align: center; display: grid; gap: 6px; padding: 48px; }
.block { margin-top: 20px; }
.row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--line); color: var(--ink); }
.row:last-child { border-bottom: 0; }
@media (max-width: 800px) { .req { grid-template-columns: auto 1fr; } .fig { text-align: left; } }
</style>
