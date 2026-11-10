<script setup lang="ts">
// Mail Inbox: the approver's Microsoft 365 approval mails inside One Platform. Three panes —
// folders, mail list, reading pane — with Approve / Reject on the mail itself.
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '../components/Icon.vue'
import Avatar from '../components/Avatar.vue'
import Dialog from '../components/Dialog.vue'
import { baht, person, thDate } from '../data/mock'
import { session, decideApproval, notify, mailRead, mailStarred, canDecideStep } from '../store'
import { myMails, mailboxOf, MAIL_STATE, type ApprovalMail, type MailState } from '../components/exec/mail'

type Folder = 'inbox' | 'upcoming' | 'approved' | 'returned' | 'starred' | 'all'
const FOLDERS: { k: Folder; label: string; icon: string; states?: MailState[] }[] = [
  { k: 'inbox', label: 'Inbox · รอพิจารณา', icon: 'inbox', states: ['pending'] },
  { k: 'upcoming', label: 'รอขั้นก่อนหน้า', icon: 'clock', states: ['upcoming'] },
  { k: 'approved', label: 'Approved', icon: 'check', states: ['approved'] },
  { k: 'returned', label: 'Rejected', icon: 'x', states: ['returned'] },
  { k: 'starred', label: 'Starred', icon: 'flag' },
  { k: 'all', label: 'ทั้งหมด', icon: 'mail' },
]
const route = useRoute()
const folder = ref<Folder>('inbox')
const onlyUnread = ref(false)
const q = ref('')
const count = (f: (typeof FOLDERS)[number]) => myMails.value.filter((m) => inFolder(m, f.k)).length
function inFolder(m: ApprovalMail, k: Folder) {
  if (k === 'all') return true
  if (k === 'starred') return mailStarred.has(m.key)
  return FOLDERS.find((f) => f.k === k)!.states!.includes(m.state)
}
const list = computed(() => {
  const s = q.value.trim().toLowerCase()
  return myMails.value.filter((m) => inFolder(m, folder.value) && (!onlyUnread.value || m.unread) && (!s || `${m.subject} ${m.from} ${m.p.customer} ${m.p.code}`.toLowerCase().includes(s)))
})
const openKey = ref<string | null>(null)
const mail = computed(() => myMails.value.find((m) => m.key === openKey.value) ?? null)
function open(m: ApprovalMail) { openKey.value = m.key; mailRead.add(m.key) }
// Desktop opens the first mail; a deep link (?p=) opens that project's mail.
watch([list, () => route.query.p], () => {
  const want = route.query.p ? myMails.value.find((m) => m.p.id === route.query.p) : undefined
  if (want && openKey.value !== want.key) { folder.value = 'all'; open(want); return }
  if (!openKey.value && list.value[0] && window.innerWidth > 900) open(list.value[0])
}, { immediate: true })

const gp = computed(() => mail.value?.a.snapshot?.gp ?? null)
const myTurn = computed(() => !!mail.value && mail.value.state === 'pending' && canDecideStep(mail.value.step, session.role) && mail.value.a.submittedBy !== session.userId)

// Decision
const decide = ref<null | 'approve' | 'reject'>(null)
const note = ref('')
const FIX_DOCS = ['Cost Sheet', 'ใบเสนอราคา (Quotation)', 'Proposal']
const fix = ref<string[]>([])
const canSend = computed(() => decide.value === 'approve' || (note.value.trim().length > 0 && fix.value.length > 0))
function send() {
  if (!mail.value || !decide.value || !canSend.value) return
  const m = mail.value
  const next = m.a.steps[m.a.steps.indexOf(m.step) + 1]
  decideApproval(m.p, decide.value, note.value.trim(), fix.value, 'mail_inbox')
  notify(decide.value === 'approve' ? (next ? `อนุมัติแล้ว ส่งต่อ ${next.who}` : 'อนุมัติครบทุกขั้น แจ้ง SM ทางอีเมลแล้ว') : 'ส่งกลับให้ SM แก้ไขแล้ว')
  decide.value = null; note.value = ''; fix.value = []
}
const stepTone = (s: string) => (s === 'approved' ? 'win' : s === 'rejected' ? 'lose' : s === 'pending' ? 'warn' : '')
const STEP_LABEL: Record<string, string> = { approved: 'อนุมัติ', rejected: 'ส่งกลับ', pending: 'รอพิจารณา', waiting: 'ยังไม่ถึงคิว' }
const CHANNEL: Record<string, string> = { web: 'ในระบบ', email_link: 'ลิงก์ในอีเมล', mail_inbox: 'Mail Inbox' }
</script>

<template>
  <div class="page inbox-page">
    <div class="mailbox" :class="{ reading: !!mail }">
      <!-- Folders -->
      <nav class="folders" aria-label="โฟลเดอร์">
        <h1><Icon name="mail" :size="20" /> Mail Inbox</h1>
        <p class="acct"><Icon name="mail" :size="14" /> {{ mailboxOf(session.userId) }}</p>
        <p class="sync small muted">ซิงก์จาก Outlook (Microsoft 365) · โฟลเดอร์ Approval</p>
        <p class="fh">Approval mailbox</p>
        <button v-for="f in FOLDERS" :key="f.k" class="folder" :aria-current="folder === f.k" @click="folder = f.k; openKey = null">
          <Icon :name="f.icon" :size="16" /><span>{{ f.label }}</span><b v-if="count(f)" class="num">{{ count(f) }}</b>
        </button>
      </nav>

      <!-- List -->
      <section class="list" aria-label="รายการอีเมล">
        <header class="lh">
          <h2>{{ FOLDERS.find((f) => f.k === folder)?.label }} <span class="cnt num">{{ list.length }}</span></h2>
          <div class="seg" role="radiogroup" aria-label="กรอง">
            <button role="radio" :aria-checked="!onlyUnread" @click="onlyUnread = false">All</button>
            <button role="radio" :aria-checked="onlyUnread" @click="onlyUnread = true">Unread</button>
          </div>
        </header>
        <label class="search"><Icon name="search" :size="16" /><span class="sr">ค้นหาอีเมล</span><input v-model="q" placeholder="Search mail" /></label>
        <ul>
          <li v-for="m in list" :key="m.key">
            <button class="item" :class="{ on: m.key === openKey, unread: m.unread }" @click="open(m)">
              <Avatar :id="m.a.submittedBy ?? m.p.sm" :size="36" />
              <span class="it">
                <span class="r1"><strong>{{ m.from }}</strong><time>{{ m.at.split(' ').slice(0, 2).join(' ') }}</time></span>
                <span class="r2">{{ m.subject }}</span>
                <span class="r3"><span class="chip" :class="MAIL_STATE[m.state].tone">{{ MAIL_STATE[m.state].label }}</span><span class="muted small">{{ m.a.version }} · {{ baht(m.a.snapshot?.revenue ?? m.p.revenue) }}</span></span>
              </span>
            </button>
          </li>
        </ul>
        <div v-if="!list.length" class="empty">
          <Icon name="inbox" :size="28" />
          <p><strong>{{ folder === 'inbox' ? 'ไม่มีคำขอรอคุณพิจารณา' : 'ไม่มีอีเมลในโฟลเดอร์นี้' }}</strong></p>
          <p class="muted small">เมื่อ SM ส่งขออนุมัติ อีเมลจะเข้า Outlook และแสดงที่นี่พร้อมกัน</p>
          <button v-if="folder !== 'all'" class="btn sm" @click="folder = 'all'">ดูทั้งหมด</button>
        </div>
      </section>

      <!-- Reading pane -->
      <article v-if="mail" class="read" aria-live="polite">
        <header class="rh">
          <button class="btn ghost icon back" aria-label="กลับไปรายการ" @click="openKey = null"><Icon name="x" :size="18" /></button>
          <h2>{{ mail.subject }}</h2>
          <button class="btn ghost icon" :aria-pressed="mailStarred.has(mail.key)" :aria-label="mailStarred.has(mail.key) ? 'เลิกติดดาว' : 'ติดดาว'" @click="mailStarred.has(mail.key) ? mailStarred.delete(mail.key) : mailStarred.add(mail.key)">
            <Icon name="flag" :size="18" :class="{ starred: mailStarred.has(mail.key) }" />
          </button>
        </header>
        <div class="rb">
          <p class="crumb"><span class="muted">Cost Sheet approval</span><router-link :to="`/projects/${mail.p.id}?tab=cost`" class="pchip"><Icon name="folder" :size="14" /> {{ mail.p.code }} · {{ mail.p.name }}</router-link></p>
          <div class="title">
            <span class="tag">Cost Sheet</span>
            <h3>{{ mail.p.name }}</h3>
            <span class="chip" :class="MAIL_STATE[mail.state].tone">{{ MAIL_STATE[mail.state].label }}</span>
          </div>
          <div class="from">
            <Avatar :id="mail.a.submittedBy ?? mail.p.sm" :size="40" />
            <div><strong>{{ mail.from }}</strong><p class="small muted">ถึง {{ mail.step.who }} ({{ mail.step.role }})</p></div>
            <time class="small muted">{{ mail.at }}</time>
          </div>

          <p class="msg">{{ mail.a.message ?? `ขออนุมัติ Cost Sheet และใบเสนอราคา ${mail.a.version} โครงการ ${mail.p.name}` }}</p>

          <section class="figs" aria-label="ตัวเลขที่ขออนุมัติ">
            <div><span>ราคาเสนอ</span><b class="num">{{ baht(mail.a.snapshot?.revenue ?? mail.p.revenue) }}</b></div>
            <div><span>ต้นทุน</span><b class="num">{{ baht(mail.a.snapshot?.cost ?? mail.p.cost) }}</b></div>
            <div><span>GP</span><b class="num" :class="gp !== null && gp < 25 ? 'bad' : 'good'">{{ gp ?? '—' }}%</b><em v-if="gp !== null && gp < 25">ต่ำกว่าเกณฑ์ 25%</em></div>
            <div v-if="mail.p.bid?.refPrice"><span>ราคากลาง</span><b class="num">{{ baht(mail.p.bid.refPrice) }}</b></div>
          </section>

          <section class="meet" :class="{ missing: !mail.a.preMeeting }">
            <h4>ประชุมชี้แจงก่อนส่ง</h4>
            <template v-if="mail.a.preMeeting">
              <p class="small muted">{{ thDate(mail.a.preMeeting.date) }}<template v-if="mail.a.preMeeting.place"> · {{ mail.a.preMeeting.place }}</template></p>
              <p class="who"><Avatar v-for="id in mail.a.preMeeting.attendees" :key="id" :id="id" :size="24" /><span class="small">{{ mail.a.preMeeting.attendees.map((id) => person(id)?.name).join(', ') }}</span></p>
              <p class="sum">{{ mail.a.preMeeting.summary }}</p>
            </template>
            <p v-else class="small">ไม่มีบันทึกการประชุมก่อนส่ง — ส่งกลับให้ SM นัดประชุมได้</p>
          </section>

          <h4 class="att-h">2 attachments</h4>
          <div class="atts">
            <a class="att" href="#" @click.prevent="notify('เปิดไฟล์ใน Excel Online (อ่านอย่างเดียว)', 'info')"><Icon name="excel" :size="22" /><span>Cost Sheet {{ mail.a.version }}.xlsx</span><span class="chip" :class="MAIL_STATE[mail.state].tone">{{ MAIL_STATE[mail.state].label }}</span></a>
            <a class="att" href="#" @click.prevent="notify('เปิด PDF ใบเสนอราคา', 'info')"><Icon name="file" :size="22" /><span>Quotation {{ mail.a.version }}.pdf</span></a>
          </div>

          <section class="chain">
            <h4>ลำดับการอนุมัติ</h4>
            <ol>
              <li v-for="s in mail.a.steps" :key="s.role" :class="s.status">
                <span class="dot" />
                <span><strong>{{ s.role }}</strong> · {{ s.who }}</span>
                <span class="chip" :class="stepTone(s.status)">{{ s.approver ? STEP_LABEL[s.status] : 'ส่งคำขอ' }}</span>
                <span class="small muted">{{ s.at }}<template v-if="s.channel"> · {{ CHANNEL[s.channel] }}</template></span>
                <p v-if="s.note" class="note small">“{{ s.note }}”</p>
              </li>
            </ol>
          </section>

          <footer v-if="myTurn" class="decide">
            <p class="small muted">การตัดสินใจจะบันทึกในระบบและตอบกลับ SM ทางอีเมลอัตโนมัติ</p>
            <div class="btns">
              <button class="btn danger" @click="decide = 'reject'">Reject · ส่งกลับแก้ไข</button>
              <button class="btn primary" @click="decide = 'approve'">Approve · อนุมัติ</button>
            </div>
          </footer>
          <footer v-else-if="mail.state === 'approved' || mail.state === 'returned'" class="done" :class="mail.state">
            <p><b>● {{ mail.state === 'approved' ? 'Approved By' : 'Rejected By' }}:</b> {{ mail.step.who }} | {{ mail.step.at }}</p>
            <p class="small"><span class="muted">Note:</span> {{ mail.step.note ?? '-' }}</p>
          </footer>
          <footer v-else-if="mail.state === 'upcoming'" class="done">
            <p class="small">คำขอนี้ยังอยู่ที่ <b>{{ mail.a.steps.find((s) => s.status === 'pending')?.who }}</b> — คุณจะได้รับอีเมลเมื่อถึงคิว</p>
          </footer>
          <footer v-else-if="mail.state === 'withdrawn'" class="done">
            <p class="small">SM ดึงคำขอกลับหรือแก้ไฟล์หลังส่ง จะส่งเวอร์ชันใหม่มาอีกครั้ง</p>
          </footer>
        </div>
      </article>
      <div v-else class="read placeholder"><Icon name="mail" :size="32" /><p class="muted">เลือกอีเมลเพื่ออ่าน</p></div>
    </div>

    <Dialog :open="!!decide" :title="decide === 'approve' ? `Approve ${mail?.p.name} ${mail?.a.version}` : 'Reject · ส่งกลับให้ SM แก้ไข'" @close="decide = null">
      <p v-if="mail" class="small">{{ baht(mail.a.snapshot?.revenue ?? mail.p.revenue) }} · GP {{ gp }}%</p>
      <div class="field">
        <label for="dn">{{ decide === 'approve' ? 'Note (ไม่บังคับ)' : 'สิ่งที่ต้องแก้ไข' }}</label>
        <textarea id="dn" v-model="note" class="input" rows="3" />
      </div>
      <fieldset v-if="decide === 'reject'" class="field fx">
        <legend>เอกสารที่ต้องแก้</legend>
        <label v-for="d in FIX_DOCS" :key="d"><input v-model="fix" type="checkbox" :value="d" /> {{ d }}</label>
      </fieldset>
      <template #foot>
        <button class="btn" @click="decide = null">ยกเลิก</button>
        <button class="btn" :class="decide === 'approve' ? 'primary' : 'danger'" :disabled="!canSend" @click="send">{{ decide === 'approve' ? 'Approve' : 'ส่งกลับแก้ไข' }}</button>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.inbox-page { padding-top: 20px; padding-bottom: 20px; max-width: none; }
.mailbox { display: grid; grid-template-columns: 240px minmax(300px, 380px) 1fr; height: calc(100vh - 112px); min-height: 560px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-lg); overflow: hidden; }
.folders { border-right: 1px solid var(--line); padding: 20px 12px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
.folders h1 { font-size: 18px; display: flex; align-items: center; gap: 8px; margin: 0 8px 12px; }
.acct { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; margin: 0 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sync { margin: 2px 8px 16px; font-family: var(--desc); }
.fh { font-size: 11.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--faint); font-weight: 600; margin: 8px 8px 6px; }
.folder { display: flex; align-items: center; gap: 10px; min-height: 40px; padding: 0 10px; border: 0; background: none; border-radius: var(--r-sm); font: 400 14px var(--font); color: var(--ink-2); cursor: pointer; text-align: left; }
.folder span { flex: 1; }
.folder b { font-size: 12.5px; font-weight: 600; color: var(--ink); }
.folder:hover { background: var(--sunken); }
.folder[aria-current='true'] { background: var(--primary-soft); color: var(--primary); font-weight: 500; }
.folder:focus-visible, .item:focus-visible { outline: 2px solid var(--focus); outline-offset: -2px; }

.list { border-right: 1px solid var(--line); display: flex; flex-direction: column; min-width: 0; }
.lh { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 16px 16px 10px; }
.lh h2 { font-size: 16px; margin: 0; display: flex; align-items: center; gap: 8px; }
.cnt { font-size: 12px; background: var(--sunken); border: 1px solid var(--line); border-radius: 6px; padding: 0 6px; font-weight: 500; }
.lh .seg button { min-height: 28px; padding: 0 10px; font-size: 13px; }
.search { display: flex; align-items: center; gap: 8px; margin: 0 16px 10px; padding: 0 12px; border: 1px solid var(--line-strong); border-radius: var(--r-sm); color: var(--muted); }
.search input { border: 0; outline: 0; background: none; font: inherit; color: var(--ink); min-height: 38px; flex: 1; min-width: 0; }
.search:focus-within { border-color: var(--focus); box-shadow: 0 0 0 3px var(--primary-soft); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.list ul { list-style: none; margin: 0; padding: 0; overflow-y: auto; flex: 1; }
.item { display: flex; gap: 12px; width: 100%; padding: 14px 16px; border: 0; border-bottom: 1px solid var(--line); border-left: 3px solid transparent; background: none; text-align: left; font: inherit; color: var(--ink); cursor: pointer; }
.item:hover { background: var(--sunken); }
.item.on { background: var(--primary-soft); border-left-color: var(--primary); }
.it { display: grid; gap: 2px; min-width: 0; flex: 1; }
.r1 { display: flex; justify-content: space-between; gap: 8px; }
.r1 strong { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.r1 time { font-size: 12px; color: var(--muted); white-space: nowrap; }
.r2 { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink-2); }
.unread .r1 strong, .unread .r2 { font-weight: 600; color: var(--ink); }
.r3 { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.r3 .chip { height: 20px; font-size: 11.5px; padding: 0 8px; }
.empty { display: grid; justify-items: center; gap: 4px; padding: 40px 20px; text-align: center; color: var(--muted); }
.empty p { margin: 0; }

.read { overflow-y: auto; min-width: 0; }
.placeholder { display: grid; place-content: center; justify-items: center; gap: 8px; color: var(--faint); }
.rh { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-bottom: 1px solid var(--line); position: sticky; top: 0; background: var(--surface); z-index: 1; }
.rh h2 { flex: 1; font-size: 16px; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.icon { width: 36px; height: 36px; min-height: 36px; padding: 0; justify-content: center; }
.starred { color: var(--warn); }
.rb { padding: 20px 32px 32px; display: grid; gap: 18px; max-width: 860px; }
.crumb { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 0; padding-bottom: 14px; border-bottom: 1px solid var(--line); }
.pchip { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; padding: 2px 10px; border: 1px solid var(--line-strong); border-radius: var(--r-sm); color: var(--primary); }
.title { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.title h3 { font-size: 20px; margin: 0; flex: 1; min-width: 200px; }
.tag { font-size: 13px; padding: 4px 12px; border: 1px solid var(--line-strong); border-radius: 999px; }
.from { display: flex; align-items: center; gap: 12px; }
.from div { flex: 1; }
.from p { margin: 0; }
.msg { font-family: var(--desc); font-size: 15px; margin: 0; white-space: pre-line; }
.figs { display: flex; flex-wrap: wrap; gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: var(--r-md); overflow: hidden; }
.figs div { background: var(--surface); padding: 12px 16px; display: grid; flex: 1 1 140px; }
.figs span { font-size: 12.5px; color: var(--muted); }
.figs b { font-size: 18px; }
.figs em { font-style: normal; font-size: 12px; color: var(--lose); }
.good { color: var(--win); } .bad { color: var(--lose); }
.meet { border: 1px solid var(--line); border-left: 3px solid var(--post); border-radius: var(--r-md); padding: 12px 16px; display: grid; gap: 4px; }
.meet.missing { border-left-color: var(--warn); background: var(--warn-soft); }
.meet h4, .chain h4, .att-h { margin: 0; font-size: 14px; }
.meet p { margin: 0; }
.who { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.who span { margin-left: 6px; }
.sum { font-family: var(--desc); }
.atts { display: flex; flex-wrap: wrap; gap: 10px; }
.att { display: inline-flex; align-items: center; gap: 10px; padding: 12px 16px; border: 1px solid var(--line-strong); border-radius: var(--r-md); color: var(--ink); }
.att:hover { text-decoration: none; background: var(--sunken); }
.chain ol { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 8px; }
.chain li { display: grid; grid-template-columns: 12px 1fr auto; column-gap: 10px; align-items: center; }
.chain li .small.muted { grid-column: 2 / 4; }
.chain .note { grid-column: 2 / 4; margin: 2px 0 0; background: var(--sunken); padding: 6px 10px; border-radius: var(--r-sm); }
.dot { width: 10px; height: 10px; border-radius: 50%; background: var(--line-strong); }
.approved .dot { background: var(--win); } .pending .dot { background: var(--warn); } .rejected .dot { background: var(--lose); }
.decide { position: sticky; bottom: 0; background: var(--surface); border-top: 1px solid var(--line); padding: 14px 0 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.decide p { margin: 0; }
.btns { display: flex; gap: 8px; }
.done { border-top: 1px solid var(--line); padding-top: 14px; }
.done p { margin: 0 0 6px; }
.done.approved b { color: var(--win); } .done.returned b { color: var(--lose); }
.fx { border: 0; padding: 0; display: grid; gap: 6px; margin-top: 12px; }

@media (max-width: 1180px) {
  .mailbox { grid-template-columns: 200px minmax(260px, 320px) 1fr; }
  .rb { padding: 16px 20px 24px; }
}
@media (max-width: 900px) {
  .inbox-page { padding: 12px 16px; }
  .mailbox { grid-template-columns: 1fr; height: auto; min-height: 0; }
  .folders { flex-direction: row; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--line); padding: 10px; align-items: center; }
  .folders h1, .acct, .sync, .fh { display: none; }
  .folder { white-space: nowrap; flex: none; }
  .list { border-right: 0; }
  .mailbox.reading .list, .mailbox.reading .folders { display: none; }
  .mailbox:not(.reading) .read { display: none; }
  .decide { flex-direction: column; align-items: stretch; }
  .btns { flex-direction: column-reverse; }
}
</style>
