"""Build docs/workflows-by-role.html from docs/data/workflows.json.

Usage: python3 tnsu-system/tools/build_viewer.py
The page embeds the JSON so it works as a single published file.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "docs" / "data" / "workflows.json"
HEAD = ROOT / "tools" / "viewer_template_head.html"
OUT = ROOT / "docs" / "workflows-by-role.html"

# ลำดับกลุ่มบทบาทบนหน้าจอ (กลุ่มที่ไม่อยู่ในรายการจะต่อท้าย)
GROUP_ORDER = [
    "นักศึกษาและครอบครัว", "อาจารย์และผู้บริหาร", "เจ้าหน้าที่", "กีฬาและสุขภาพ",
    "โรงเรียนกีฬา", "บัณฑิตศึกษาและฝึกประสบการณ์", "กำกับดูแล",
    "บุคคลและหน่วยงานภายนอก", "ผู้ดูแลระบบ",
]

SCRIPT = r"""<script>
const DATA = __DATA__;
const GROUP_ORDER = __GROUPS__;
const NAME = {}, SHORT = {};
DATA.roles.forEach(r => { NAME[r.code] = r.name; SHORT[r.code] = r.name.split(" (")[0]; });
const ALIAS = DATA.alias || {};
const STAGES = DATA.stages;
const WF = DATA.workflows;
const used = new Set(); WF.forEach(w => w.steps.forEach(s => used.add(s.role)));
const groups = {};
DATA.roles.filter(r => r.code !== "system" && used.has(r.code) && !Object.values(ALIAS).some(a => a.includes(r.code) && !ALIAS[r.code]))
  .forEach(r => (groups[r.group] = groups[r.group] || []).push(r));
const groupNames = Object.keys(groups).sort((a, b) => {
  const ia = GROUP_ORDER.indexOf(a), ib = GROUP_ORDER.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
});

let current = "student", query = "";
try { const s = localStorage.getItem("tnsu-wf-role3"); if (s && NAME[s]) current = s; } catch (e) {}

const picker = document.getElementById("picker");
picker.innerHTML = groupNames.map(g =>
  `<div class="group"><div class="group-label">${g}</div><div class="chips">${
    groups[g].map(r => `<button type="button" id="r-${r.code}" data-role="${r.code}" aria-pressed="${r.code === current}">${SHORT[r.code]}</button>`).join("")
  }</div></div>`).join("") +
  `<div class="group"><label class="group-label" for="q">ค้นหาชื่องาน</label><input id="q" type="search" placeholder="เช่น สมัคร สอบ ลงทะเบียน กยศ." autocomplete="off"></div>`;
picker.addEventListener("click", e => {
  const b = e.target.closest("button[data-role]"); if (!b) return;
  current = b.dataset.role;
  picker.querySelectorAll("button[data-role]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.role === current)));
  try { localStorage.setItem("tnsu-wf-role3", current); } catch (e) {}
  render();
});
document.getElementById("q").addEventListener("input", e => { query = e.target.value.trim(); render(); });

const mine = r => (ALIAS[current] || [current]).includes(r);
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
function card(w) {
  const starts = mine(w.steps[0].role);
  return `<article class="card">
    <div class="card-top"><span class="wid">${w.id}</span><h3>${esc(w.name)}</h3>${w.isNew ? '<span class="badge-new">ใหม่</span>' : ""}</div>
    <div class="sla"><span class="myrole ${starts ? "start" : "part"}">${starts ? "คุณเริ่ม" : "คุณมีส่วน"}</span> · ${esc(w.sla)} · ระบบ ${esc(w.module)}</div>
    ${w.trigger ? `<div class="sla">เริ่มเมื่อ: ${esc(w.trigger)}</div>` : ""}
    <ol class="steps">${w.steps.map((s, i) =>
      `<li class="${mine(s.role) ? "mine" : ""}"><span class="num">${i + 1}</span><div class="step"><span class="who">${esc(SHORT[s.role] || s.role)}</span><span class="what">${esc(s.action)}</span></div></li>`
    ).join("")}</ol>
    ${w.output ? `<div class="sla">ผลลัพธ์: ${esc(w.output)}</div>` : ""}
  </article>`;
}
function render() {
  const q = query.toLowerCase();
  const mineWF = WF.filter(w => w.steps.some(s => mine(s.role)) &&
    (!q || w.name.toLowerCase().includes(q) || w.id.toLowerCase().includes(q)));
  const nStart = mineWF.filter(w => mine(w.steps[0].role)).length;
  const usedStages = STAGES.filter(st => mineWF.some(w => w.stage === st.code));
  document.getElementById("resultHead").innerHTML =
    `<h2>งานของ <strong>${esc(SHORT[current])}</strong></h2>
     <p class="muted">เกี่ยวข้อง ${mineWF.length} งาน · เป็นคนเริ่ม ${nStart} งาน · เรียงตามช่วงเวลาที่เกิดจริง${q ? ` · ค้นหา "${esc(query)}"` : ""}</p>
     <nav class="stage-nav" aria-label="ไปยังช่วง">${usedStages.map((st, i) => `<a href="#st-${st.code}">${i + 1}. ${esc(st.name)}</a>`).join("")}</nav>`;
  document.getElementById("lists").innerHTML = usedStages.length ? usedStages.map((st, i) => {
    const list = mineWF.filter(w => w.stage === st.code);
    return `<section class="stage" id="st-${st.code}"><div class="stage-title"><span class="n">${i + 1}</span><h2>${esc(st.name)}</h2><p class="muted">${esc(st.desc || "")}</p></div><div class="cards">${list.map(card).join("")}</div></section>`;
  }).join("") : `<div class="empty">ไม่พบงานที่ตรงกับคำค้น ลองคำอื่น หรือลบคำค้นออก</div>`;
}
render();
</script>
"""


def main() -> None:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    head = HEAD.read_text(encoding="utf-8")
    payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    script = SCRIPT.replace("__DATA__", payload).replace(
        "__GROUPS__", json.dumps(GROUP_ORDER, ensure_ascii=False))
    OUT.write_text(head + script, encoding="utf-8")
    print(f"wrote {OUT} ({len(data['workflows'])} workflows)")


if __name__ == "__main__":
    main()
