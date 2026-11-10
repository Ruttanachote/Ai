<script setup lang="ts">
// Weekly timesheet for one person from the worklogs on every work item: normal hours against
// the 8-hour day, OT on top, and past working days that are not fully logged.
import { computed, ref } from 'vue'
import { thDate, TODAY_ISO } from '../data/mock'
import { addDays } from '../domain/work'
import { dayHours, timesheet, weekOf } from '../domain/timesheet'
import { projects, SETTINGS } from '../store'

const props = defineProps<{ who: string }>()
const anchor = ref(TODAY_ISO)
const logs = computed(() => projects.flatMap((p) => (p.tasks ?? []).flatMap((t) => t.worklogs ?? [])))
const days = computed(() => timesheet(logs.value, props.who, weekOf(anchor.value), TODAY_ISO, SETTINGS.hours))
const shown = computed(() => days.value.filter((d) => d.work || d.normal || d.ot))
const target = computed(() => dayHours(SETTINGS.hours))
const total = computed(() => ({ normal: days.value.reduce((s, d) => s + d.normal, 0), ot: days.value.reduce((s, d) => s + d.ot, 0), short: days.value.filter((d) => d.short).length }))
const dow = (d: string) => new Date(d + 'T00:00:00Z').toLocaleDateString('th-TH', { weekday: 'short', timeZone: 'UTC' })
</script>

<template>
  <section class="panel ts">
    <div class="hd">
      <div><h3>Timesheet สัปดาห์ {{ thDate(weekOf(anchor)[0]) }}</h3>
        <p class="small muted">เวลาทำงาน จ.–ศ. {{ SETTINGS.hours.start }}–{{ SETTINGS.hours.end }} ({{ target }} ชม./วัน) · เสาร์–อาทิตย์และวันหยุดราชการนับเป็น OT</p></div>
      <div class="nav"><button class="btn sm ghost" aria-label="สัปดาห์ก่อน" @click="anchor = addDays(anchor, -7)">‹</button><button class="btn sm ghost" @click="anchor = TODAY_ISO">สัปดาห์นี้</button><button class="btn sm ghost" aria-label="สัปดาห์ถัดไป" @click="anchor = addDays(anchor, 7)">›</button></div>
    </div>
    <div class="days">
      <div v-for="d in shown" :key="d.day" class="d" :class="{ short: d.short, today: d.day === TODAY_ISO, off: !d.work }">
        <span class="dw">{{ dow(d.day) }} {{ thDate(d.day).split(' ')[0] }}</span>
        <span class="bar"><i :style="{ width: Math.min(100, d.target ? (d.normal / d.target) * 100 : 0) + '%' }" /></span>
        <span class="h num">{{ d.normal }}<small>/{{ d.target || '—' }}</small></span>
        <span v-if="d.ot" class="otb">OT {{ d.ot }}</span>
      </div>
    </div>
    <p class="small"><b>{{ total.normal }}</b> ชม. ปกติ · <b>{{ total.ot }}</b> ชม. OT<template v-if="total.short"> · <span class="bad">บันทึกไม่ครบ {{ total.short }} วัน</span></template></p>
  </section>
</template>

<style scoped>
.ts { display: grid; gap: 10px; }
.hd { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; flex-wrap: wrap; }
.nav { display: flex; gap: 2px; }
.days { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; }
.d { border: 1px solid var(--line); border-radius: 10px; padding: 8px 10px; display: grid; gap: 4px; }
.d.today { border-color: var(--primary); }
.d.short { border-color: var(--lose); background: var(--lose-soft); }
.d.off { background: var(--sunken); }
.dw { font-size: 12px; color: var(--muted); }
.bar { height: 5px; background: var(--idle-soft); border-radius: 99px; overflow: hidden; }
.bar i { display: block; height: 100%; background: var(--win); }
.h { font-size: 18px; font-weight: 600; }
.h small { font-size: 12px; color: var(--muted); font-weight: 400; }
.otb { justify-self: start; font-size: 11px; font-weight: 600; color: var(--warn); background: var(--warn-soft); padding: 1px 6px; border-radius: 99px; }
.bad { color: var(--lose); }
</style>
