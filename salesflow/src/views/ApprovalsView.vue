<script setup lang="ts">
import { computed } from 'vue'
import Avatar from '../components/Avatar.vue'
import StageBadge from '../components/StageBadge.vue'
import { projects, session } from '../store'
import { baht } from '../data/mock'

const mine = (role: string) =>
  (session.role === 'head' && role.includes('หัวหน้า')) || (session.role === 'exec' && role.includes('ผู้บริหาร')) || session.role === 'admin'

const waiting = computed(() =>
  projects.filter((p) => p.approval?.steps.some((s) => s.status === 'pending' && mine(s.role))),
)
const others = computed(() =>
  projects.filter((p) => p.approval && !waiting.value.includes(p)),
)
const gp = (r: number, c: number) => (r ? ((r - c) / r) * 100 : 0)
const reopen = computed(() => (['head', 'admin'].includes(session.role) ? projects.filter((p) => p.stage === 'lose') : []))
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div><h1>รออนุมัติราคา</h1><p>คำขอที่ถึงคิวคุณ · อนุมัติได้จากอีเมล Outlook หรือจากหน้านี้</p></div>
    </header>

    <section class="list">
      <router-link v-for="p in waiting" :key="p.id" :to="`/projects/${p.id}`" class="req">
        <Avatar :id="p.sm" :size="40" />
        <div class="main">
          <strong>{{ p.name }}</strong>
          <p class="small muted">{{ p.code }} · {{ p.customer }} · ส่ง {{ p.approval?.version }} เมื่อ {{ p.approval?.submittedAt }}</p>
          <p v-for="s in p.approval?.steps.filter((x) => x.note)" :key="s.who" class="note small">{{ s.who }}: “{{ s.note }}”</p>
        </div>
        <div class="fig"><span>ราคาเสนอ</span><b class="num">{{ baht(p.revenue) }}</b></div>
        <div class="fig"><span>GP</span><b class="num" :class="gp(p.revenue, p.cost) < 25 ? 'bad' : 'good'">{{ gp(p.revenue, p.cost).toFixed(1) }}%</b></div>
        <span class="btn primary sm">พิจารณา</span>
      </router-link>
      <div v-if="!waiting.length" class="panel empty">
        <h3>ไม่มีคำขอค้าง</h3>
        <p class="muted">เมื่อ SM ส่งขออนุมัติ คุณจะได้รับอีเมลและเห็นรายการที่นี่</p>
      </div>
    </section>

    <section v-if="reopen.length" class="panel block">
      <div class="panel-head"><h2>Close Lose ที่เปิดกลับได้</h2><span class="muted small">เฉพาะหัวหน้ากลุ่ม</span></div>
      <router-link v-for="p in reopen" :key="p.id" :to="`/projects/${p.id}`" class="row">
        <span>{{ p.name }} <span class="muted small">· {{ p.nextStep }}</span></span><StageBadge :stage="p.stage" />
      </router-link>
    </section>

    <section v-if="others.length" class="panel block">
      <div class="panel-head"><h2>คำขออื่นที่ติดตามอยู่</h2></div>
      <router-link v-for="p in others" :key="p.id" :to="`/projects/${p.id}`" class="row">
        <span>{{ p.name }} <span class="muted small">· {{ p.approval?.steps.find((s) => s.status === 'pending')?.role ?? 'อนุมัติครบแล้ว' }}</span></span>
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
.fig b { font-size: 17px; }
.good { color: var(--win); } .bad { color: var(--lose); }
.empty { text-align: center; display: grid; gap: 6px; padding: 48px; }
.block { margin-top: 20px; }
.row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--line); color: var(--ink); }
.row:last-child { border-bottom: 0; }
@media (max-width: 800px) { .req { grid-template-columns: auto 1fr; } .fig { text-align: left; } }
</style>
