<script setup lang="ts">
// Admin › ทีมและทีมย่อย: list, add, edit, view details and change history of every team.
// Teams are never deleted — old projects keep their team — so an admin closes a team instead.
import { computed, reactive, ref } from 'vue'
import { NDrawer, NDrawerContent } from 'naive-ui'
import Avatar from '../Avatar.vue'
import Icon from '../Icon.vue'
import Dialog from '../Dialog.vue'
import { GROUP_NAME, PEOPLE, mb, person } from '../../data/mock'
import type { Team } from '../../data/model'
import { notify, projects, saveTeam, session, setTeamActive, teamLog, teams } from '../../store'
import { TEAM_KIND, validateTeam } from '../../domain/teams'
import { isOpen } from '../../domain/metrics'

const q = ref('')
const group = ref('')
const showInactive = ref(false)
const groups = computed(() => [...new Set(teams.map((t) => t.group))])
const members = (code: string) => PEOPLE.filter((u) => u.team === code)
const teamProjects = (code: string) => projects.filter((p) => p.team === code || (p.splits ?? []).some((s) => s.team === code))
const lastChange = (code: string) => teamLog.find((l) => l.team === code)
const rows = computed(() => {
  const s = q.value.trim().toLowerCase()
  return teams
    .filter((t) => (showInactive.value || t.active !== false) && (!group.value || t.group === group.value))
    .filter((t) => !s || `${t.code} ${t.name} ${person(t.head)?.name ?? ''}`.toLowerCase().includes(s))
    .sort((a, b) => a.group.localeCompare(b.group) || a.code.localeCompare(b.code))
})
const inactiveN = computed(() => teams.filter((t) => t.active === false).length)

/* ---------- detail ---------- */
const openCode = ref<string | null>(null)
const cur = computed(() => teams.find((t) => t.code === openCode.value) ?? null)
const curLog = computed(() => teamLog.filter((l) => l.team === openCode.value))
const curProjects = computed(() => (cur.value ? teamProjects(cur.value.code) : []))
const ACTION: Record<string, { l: string; tone: string }> = { create: { l: 'สร้างทีม', tone: 'win' }, update: { l: 'แก้ไข', tone: 'presale' }, deactivate: { l: 'ปิดใช้งาน', tone: 'lose' }, activate: { l: 'เปิดใช้งาน', tone: 'win' } }

/* ---------- add / edit ---------- */
const formOpen = ref(false)
const isNew = ref(true)
const blank = (): Team => ({ code: '', name: '', group: group.value || 'DT4', kind: 'sales', target: undefined, headcount: undefined, head: '', formerly: '', note: '' })
const form = reactive<Team>(blank())
const reason = ref('')
const touched = reactive<Record<string, boolean>>({})
const submitted = ref(false)
const errors = computed(() => validateTeam(form, teams, isNew.value))
const err = (k: string) => (touched[k] || submitted.value ? errors.value[k] : '')
const heads = computed(() => PEOPLE.filter((u) => u.role !== 'dev').sort((a, b) => Number(b.team === form.code || b.team === form.group) - Number(a.team === form.code || a.team === form.group)))
function startAdd() {
  Object.assign(form, blank()); isNew.value = true; reason.value = ''; submitted.value = false
  Object.keys(touched).forEach((k) => delete touched[k]); formOpen.value = true
}
function startEdit(t: Team) {
  Object.assign(form, blank(), { ...t, head: t.head ?? '', formerly: t.formerly ?? '', note: t.note ?? '' }); isNew.value = false; reason.value = ''; submitted.value = false
  Object.keys(touched).forEach((k) => delete touched[k]); formOpen.value = true
}
function save() {
  submitted.value = true
  if (Object.keys(errors.value).length) return
  const clean: Team = {
    ...form, code: form.code.trim(), name: form.name.trim(),
    head: form.head || undefined, formerly: form.formerly?.trim() || undefined, note: form.note?.trim() || undefined,
    target: form.kind === 'sales' ? Number(form.target) : form.target ? Number(form.target) : undefined,
    headcount: form.headcount === undefined || (form.headcount as unknown) === '' ? undefined : Number(form.headcount),
  }
  const n = saveTeam(clean, isNew.value, session.userId, reason.value.trim() || undefined)
  formOpen.value = false
  notify(isNew.value ? `เพิ่มทีม ${clean.code} แล้ว` : n ? `บันทึกการแก้ไข ${clean.code} แล้ว (${n} รายการ)` : 'ไม่มีข้อมูลที่เปลี่ยน', n || isNew.value ? 'success' : 'info')
  openCode.value = clean.code
}

/* ---------- close / reopen ---------- */
const closing = ref<Team | null>(null)
const closeReason = ref('')
const openWork = computed(() => (closing.value ? teamProjects(closing.value.code).filter((p) => isOpen(p) || ['win', 'handover', 'delivery'].includes(p.stage)).length : 0))
function confirmClose() {
  if (!closing.value || !closeReason.value.trim()) return
  setTeamActive(closing.value.code, false, session.userId, closeReason.value.trim())
  notify(`ปิดใช้งานทีม ${closing.value.code} แล้ว — โครงการเดิมยังอยู่ครบ`)
  closing.value = null; closeReason.value = ''
}
function reopen(t: Team) { setTeamActive(t.code, true, session.userId, 'เปิดใช้งานอีกครั้ง'); notify(`เปิดใช้งานทีม ${t.code} แล้ว`) }
</script>

<template>
  <section class="panel ta">
    <div class="bar">
      <label class="search"><Icon name="search" :size="16" /><span class="sr">ค้นหาทีม</span><input v-model="q" placeholder="รหัส ชื่อทีม หรือหัวหน้าทีม" /></label>
      <div class="seg" role="radiogroup" aria-label="กลุ่ม">
        <button role="radio" :aria-checked="!group" @click="group = ''">ทุกกลุ่ม</button>
        <button v-for="g in groups" :key="g" role="radio" :aria-checked="group === g" :title="GROUP_NAME[g]" @click="group = g">{{ g }}</button>
      </div>
      <label v-if="inactiveN" class="chk"><input v-model="showInactive" type="checkbox" /> แสดงทีมที่ปิดใช้งาน ({{ inactiveN }})</label>
      <button class="btn primary add" @click="startAdd"><Icon name="plus" :size="16" /> เพิ่มทีมย่อย</button>
    </div>

    <div class="scroll-x">
      <table class="table">
        <thead><tr><th>ทีม</th><th>กลุ่ม</th><th>ประเภท</th><th>หัวหน้าทีม</th><th class="r">คน</th><th class="r">โครงการ</th><th class="r">เป้ายอดขาย</th><th>สถานะ</th><th>แก้ไขล่าสุด</th><th><span class="sr">จัดการ</span></th></tr></thead>
        <tbody>
          <tr v-for="t in rows" :key="t.code" :class="{ off: t.active === false }" tabindex="0" @click="openCode = t.code" @keydown.enter="openCode = t.code">
            <td><strong>{{ t.code }}</strong><span class="sub small muted">{{ t.name }}</span></td>
            <td class="small">{{ t.group }}</td>
            <td><span class="chip" :class="t.kind === 'sales' ? 'presale' : ''">{{ TEAM_KIND[t.kind] }}</span></td>
            <td><span v-if="t.head" class="who"><Avatar :id="t.head" :size="24" />{{ person(t.head)?.name }}</span><span v-else class="small muted">ยังไม่ระบุ</span></td>
            <td class="r num">{{ t.headcount ?? members(t.code).length }}</td>
            <td class="r num">{{ teamProjects(t.code).length }}</td>
            <td class="r num">{{ t.target ? mb(t.target) : '—' }}</td>
            <td><span class="chip" :class="t.active === false ? 'lose' : 'win'">{{ t.active === false ? 'ปิดใช้งาน' : 'ใช้งาน' }}</span></td>
            <td class="small muted nowrap">{{ lastChange(t.code)?.at.slice(0, 10) ?? '—' }}</td>
            <td class="acts" @click.stop>
              <button class="btn ghost sm" :aria-label="`ดูรายละเอียด ${t.code}`" @click="openCode = t.code">ดู</button>
              <button class="btn ghost sm" :aria-label="`แก้ไข ${t.code}`" @click="startEdit(t)">แก้ไข</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!rows.length" class="empty"><p><strong>ไม่พบทีมตามที่ค้นหา</strong></p><button class="btn sm" @click="q = ''; group = ''">ล้างตัวกรอง</button></div>
    <p class="hint foot">ทีมย่อยอยู่ภายใต้กลุ่ม (เช่น DT4 → DT4-LC) · ลบทีมไม่ได้เพราะโครงการเดิมอ้างถึง ให้ปิดใช้งานแทน · ทุกการแก้ไขบันทึกในประวัติและ Audit log</p>
  </section>

  <!-- Detail -->
  <NDrawer :show="!!cur" :width="560" placement="right" @update:show="(v: boolean) => { if (!v) openCode = null }">
    <NDrawerContent v-if="cur" :title="`${cur.code} · ${cur.name}`" closable>
      <div class="dr">
        <div class="dact">
          <span class="chip" :class="cur.active === false ? 'lose' : 'win'">{{ cur.active === false ? 'ปิดใช้งาน' : 'ใช้งาน' }}</span>
          <span class="sp" />
          <button class="btn sm" @click="startEdit(cur)">แก้ไขข้อมูล</button>
          <button v-if="cur.active !== false" class="btn sm danger" @click="closing = cur">ปิดใช้งานทีม</button>
          <button v-else class="btn sm" @click="reopen(cur)">เปิดใช้งานอีกครั้ง</button>
        </div>
        <dl class="info">
          <dt>กลุ่ม</dt><dd>{{ GROUP_NAME[cur.group] ?? cur.group }}</dd>
          <dt>ประเภท</dt><dd>{{ TEAM_KIND[cur.kind] }}</dd>
          <dt>หัวหน้าทีม</dt><dd><span v-if="cur.head" class="who"><Avatar :id="cur.head" :size="24" />{{ person(cur.head)?.name }}</span><template v-else>—</template></dd>
          <dt>จำนวนคน</dt><dd class="num">{{ cur.headcount ?? '—' }} <span class="small muted">· ใช้ระบบ {{ members(cur.code).length }} คน</span></dd>
          <dt>เป้ายอดขายปี 2569</dt><dd class="num">{{ cur.target ? mb(cur.target) : '—' }}</dd>
          <dt>ชื่อเดิม</dt><dd>{{ cur.formerly ?? '—' }}</dd>
          <dt>รายละเอียด</dt><dd class="desc">{{ cur.note ?? '—' }}</dd>
        </dl>

        <h3>สมาชิกในระบบ ({{ members(cur.code).length }})</h3>
        <ul v-if="members(cur.code).length" class="ppl"><li v-for="u in members(cur.code)" :key="u.id"><Avatar :id="u.id" :size="28" /><span>{{ u.name }} <span class="small muted">· {{ u.position ?? u.role.toUpperCase() }}</span></span></li></ul>
        <p v-else class="small muted">ยังไม่มีสมาชิกทีมนี้ใช้ One Platform — กำหนดทีมให้ผู้ใช้ได้จาก Microsoft Entra ID</p>

        <h3>โครงการ ({{ curProjects.length }})</h3>
        <router-link v-for="p in curProjects" :key="p.id" :to="`/projects/${p.id}`" class="pj"><span>{{ p.name }}</span><span class="small muted">{{ p.code }}</span></router-link>
        <p v-if="!curProjects.length" class="small muted">ยังไม่มีโครงการ</p>

        <h3>ประวัติการแก้ไข ({{ curLog.length }})</h3>
        <ol class="log">
          <li v-for="l in curLog" :key="l.id">
            <span class="dot" :class="ACTION[l.action].tone" />
            <div>
              <p class="lh"><span class="chip" :class="ACTION[l.action].tone">{{ ACTION[l.action].l }}</span><span class="small muted">{{ l.at }} · {{ person(l.by)?.name ?? l.by }}</span></p>
              <ul class="ch"><li v-for="c in l.changes" :key="c.field" class="small"><b>{{ c.field }}</b>: <template v-if="l.action !== 'create' && c.from !== undefined"><s>{{ c.from }}</s> → </template>{{ c.to ?? '—' }}</li></ul>
              <p v-if="l.reason" class="small reason">เหตุผล: {{ l.reason }}</p>
            </div>
          </li>
        </ol>
        <p v-if="!curLog.length" class="small muted">ยังไม่มีการแก้ไขตั้งแต่เริ่มใช้ระบบ</p>
      </div>
    </NDrawerContent>
  </NDrawer>

  <!-- Add / edit -->
  <Dialog :open="formOpen" :title="isNew ? 'เพิ่มทีมย่อย' : `แก้ไขทีม ${form.code}`" wide @close="formOpen = false">
    <form class="tf" @submit.prevent="save">
      <div class="field" :class="{ bad: err('code') }">
        <label for="tcode">รหัสทีม</label>
        <input id="tcode" v-model="form.code" class="input" :disabled="!isNew" placeholder="เช่น DT4-DA" @blur="touched.code = true" />
        <span v-if="err('code')" class="msg" role="alert">{{ err('code') }}</span>
        <span v-else class="hint">{{ isNew ? 'ตั้งแล้วเปลี่ยนไม่ได้ เพราะโครงการอ้างถึงรหัสนี้' : 'รหัสทีมแก้ไม่ได้' }}</span>
      </div>
      <div class="field" :class="{ bad: err('name') }">
        <label for="tname">ชื่อทีม</label>
        <input id="tname" v-model="form.name" class="input" @blur="touched.name = true" />
        <span v-if="err('name')" class="msg" role="alert">{{ err('name') }}</span>
      </div>
      <div class="field">
        <label for="tgroup">อยู่ภายใต้กลุ่ม</label>
        <select id="tgroup" v-model="form.group" class="input"><option v-for="g in groups" :key="g" :value="g">{{ GROUP_NAME[g] ?? g }}</option></select>
      </div>
      <fieldset class="field">
        <legend>ประเภททีม</legend>
        <div class="seg" role="radiogroup">
          <button v-for="(l, k) in TEAM_KIND" :key="k" type="button" role="radio" :aria-checked="form.kind === k" @click="form.kind = k">{{ l }}</button>
        </div>
      </fieldset>
      <div class="field">
        <label for="thead">หัวหน้าทีม</label>
        <select id="thead" v-model="form.head" class="input"><option value="">ยังไม่ระบุ</option><option v-for="u in heads" :key="u.id" :value="u.id">{{ u.name }} · {{ u.team }}</option></select>
      </div>
      <div class="field" :class="{ bad: err('headcount') }">
        <label for="thc">จำนวนคนในทีม</label>
        <input id="thc" v-model.number="form.headcount" class="input num" type="number" min="0" step="1" @blur="touched.headcount = true" />
        <span v-if="err('headcount')" class="msg" role="alert">{{ err('headcount') }}</span>
        <span v-else class="hint">ใช้ใน Executive Dashboard</span>
      </div>
      <div v-if="form.kind === 'sales'" class="field" :class="{ bad: err('target') }">
        <label for="ttarget">เป้ายอดขายปี 2569 (บาท)</label>
        <input id="ttarget" v-model.number="form.target" class="input num" type="number" min="0" step="1000000" @blur="touched.target = true" />
        <span v-if="err('target')" class="msg" role="alert">{{ err('target') }}</span>
        <span v-else-if="form.target" class="hint">{{ mb(Number(form.target)) }}</span>
      </div>
      <div class="field">
        <label for="tfor">ชื่อเดิม (ไม่บังคับ)</label>
        <input id="tfor" v-model="form.formerly" class="input" placeholder="เช่น BU3" />
      </div>
      <div class="field wide">
        <label for="tnote">รายละเอียดทีม (ไม่บังคับ)</label>
        <textarea id="tnote" v-model="form.note" class="input" rows="2" />
      </div>
      <div class="field wide">
        <label for="treason">{{ isNew ? 'เหตุผลที่ตั้งทีม' : 'เหตุผลที่แก้ไข' }} (ไม่บังคับ)</label>
        <input id="treason" v-model="reason" class="input" placeholder="บันทึกในประวัติการแก้ไข" />
      </div>
      <button type="submit" hidden />
    </form>
    <template #foot>
      <button class="btn" @click="formOpen = false">ยกเลิก</button>
      <button class="btn primary" @click="save">{{ isNew ? 'เพิ่มทีม' : 'บันทึกการแก้ไข' }}</button>
    </template>
  </Dialog>

  <!-- Close a team -->
  <Dialog :open="!!closing" :title="`ปิดใช้งานทีม ${closing?.code}`" @close="closing = null">
    <p>ทีมที่ปิดใช้งานจะเลือกให้โครงการใหม่ไม่ได้ แต่โครงการเดิมและประวัติยังอยู่ครบ</p>
    <p v-if="openWork" class="warnbox small">ทีมนี้ยังมี {{ openWork }} โครงการที่ยังไม่จบ — ควรย้ายทีมของโครงการเหล่านั้นก่อน</p>
    <div class="field"><label for="creason">เหตุผล</label><input id="creason" v-model="closeReason" class="input" placeholder="เช่น รวมกับทีม DT4-AI" /></div>
    <template #foot>
      <button class="btn" @click="closing = null">ยกเลิก</button>
      <button class="btn danger" :disabled="!closeReason.trim()" @click="confirmClose">ปิดใช้งาน {{ closing?.code }}</button>
    </template>
  </Dialog>
</template>

<style scoped>
.ta { padding: 20px 0 16px; }
.bar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; padding: 0 24px 16px; }
.search { display: flex; align-items: center; gap: 8px; padding: 0 12px; border: 1px solid var(--line-strong); border-radius: var(--r-sm); color: var(--muted); flex: 1; min-width: 220px; max-width: 340px; }
.search input { border: 0; outline: 0; background: none; font: inherit; color: var(--ink); min-height: 38px; flex: 1; min-width: 0; }
.search:focus-within { border-color: var(--focus); box-shadow: 0 0 0 3px var(--primary-soft); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.chk { display: inline-flex; gap: 8px; align-items: center; font-size: 14px; cursor: pointer; }
.add { margin-left: auto; }
table { width: 100%; }
tbody tr { cursor: pointer; }
tbody tr:hover { background: var(--sunken); }
tbody tr.off td { color: var(--muted); }
td:first-child, th:first-child { padding-left: 24px; }
.sub { display: block; }
.who { display: inline-flex; align-items: center; gap: 8px; }
.r { text-align: right; }
.nowrap { white-space: nowrap; }
.acts { white-space: nowrap; text-align: right; padding-right: 16px; }
.empty { padding: 32px; text-align: center; display: grid; justify-items: center; gap: 8px; }
.empty p { margin: 0; }
.foot { padding: 12px 24px 0; margin: 0; }
.dr { display: grid; gap: 12px; }
.dr h3 { font-size: 16px; margin: 12px 0 0; }
.dact { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.sp { flex: 1; }
.info { display: grid; grid-template-columns: 140px 1fr; gap: 8px 12px; margin: 0; }
.info dt { color: var(--muted); font-size: 14px; }
.info dd { margin: 0; }
.desc { font-family: var(--desc); }
.ppl { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.ppl li { display: flex; align-items: center; gap: 10px; }
.pj { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--line); color: var(--ink); }
.pj:hover { text-decoration: none; background: var(--sunken); }
.log { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
.log > li { display: grid; grid-template-columns: 12px 1fr; gap: 10px; }
.dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 8px; background: var(--line-strong); }
.dot.win { background: var(--win); } .dot.presale { background: var(--presale); } .dot.lose { background: var(--lose); }
.lh { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin: 0 0 4px; }
.ch { margin: 0; padding-left: 18px; display: grid; gap: 2px; }
.ch s { color: var(--muted); }
.reason { margin: 4px 0 0; font-family: var(--desc); color: var(--ink-2); }
.tf { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; align-items: start; }
.tf .field { align-content: start; }
.tf fieldset { border: 0; padding: 0; margin: 0; }
.tf legend { font-size: 13px; font-weight: 500; color: var(--ink-2); margin-bottom: 6px; }
.wide { grid-column: 1 / -1; }
.bad .input { border-color: var(--lose); }
.msg { font-size: 12px; color: var(--lose); }
.warnbox { background: var(--warn-soft); color: var(--warn); padding: 10px 12px; border-radius: var(--r-sm); }
@media (max-width: 640px) { .tf { grid-template-columns: 1fr; } .add { margin-left: 0; } .info { grid-template-columns: 1fr; } }
</style>
