"""Build the export bundle for handing the design to another tool (e.g. Claude Design).

Writes tnsu-system/export/:
  02-ALL-WORKFLOWS.md   roles + every workflow with steps, grouped by stage
  03-UX-SCREENS-KPI.md  volume 14 sections 1-12 (personas, screens, flows, Thai typography, KPIs)
  04-FULL-DESIGN-DOCS.md  every design volume concatenated in reading order
  TNSU-design-export.zip  the four files
Usage: python3 tnsu-system/tools/build_export.py
"""
import json
import pathlib
import re
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
OUT = ROOT / "export"

ORDER = [
    "00-blueprint.md", "00-fix-decisions-v1.1.md", "01-overview.md", "02-student-journey.md",
    "03-academic-calendar.md", "04-roles-permissions.md", "05-workflows.md", "06-modules.md",
    "07-architecture.md", "08-data.md", "09-integrations.md", "10-security-compliance.md",
    "11-operations.md", "12-roadmap-cost-risk.md", "13-open-questions.md", "14-ux-adoption.md",
    "government-relations.md",
]


def workflows_md() -> str:
    d = json.loads((DOCS / "data" / "workflows.json").read_text(encoding="utf-8"))
    names = {r["code"]: r["name"] for r in d["roles"]}
    names["system"] = "ระบบ (อัตโนมัติ)"
    out = ["# Workflow ทั้งหมดของระบบ TNSU (สร้างจาก data/workflows.json)\n",
           f"รวม {len(d['workflows'])} workflow · {len(d['roles'])} บทบาท · {len(d['stages'])} ช่วงเวลา\n",
           "## บทบาท\n", "| รหัส | ชื่อ | กลุ่ม |", "|---|---|---|"]
    out += [f"| `{r['code']}` | {r['name']} | {r['group']} |" for r in d["roles"]]
    for st in d["stages"]:
        group = sorted((w for w in d["workflows"] if w["stage"] == st["code"]), key=lambda w: int(w["id"][2:]))
        out.append(f"\n## {st['name']} (`{st['code']}`) — {len(group)} workflow\n\n{st.get('desc', '')}\n")
        for w in group:
            out.append(f"### {w['id']} {w['name']}\n")
            out.append(f"- โมดูล: `{w['module']}` · ระยะเวลา: {w['sla']}")
            out.append(f"- เริ่มเมื่อ: {w.get('trigger', '-')}")
            out.append(f"- ผลลัพธ์: {w.get('output', '-')}")
            out += [f"{i}. **{names.get(s['role'], s['role'])}** — {s['action']}" for i, s in enumerate(w["steps"], 1)]
            out.append("")
    return "\n".join(out) + "\n"


def ux_md() -> str:
    text = (DOCS / "14-ux-adoption.md").read_text(encoding="utf-8")
    m = re.search(r"\n## 13\. ", text)
    return text[: m.start()] + "\n" if m else text


def full_md() -> str:
    parts = ["# เอกสารออกแบบระบบ TNSU ฉบับเต็ม (v1.1)\n",
             "รวมทุกเล่มตามลำดับการอ่าน ลิงก์ภายในชี้ไปยังไฟล์ต้นฉบับใน repo\n"]
    for name in ORDER:
        parts.append(f"\n\n---\n\n<!-- ไฟล์ต้นฉบับ: docs/{name} -->\n")
        parts.append((DOCS / name).read_text(encoding="utf-8"))
    r1 = DOCS / "r1"
    if r1.exists():
        for f in sorted(r1.glob("*.md")):
            parts.append(f"\n\n---\n\n<!-- ไฟล์ต้นฉบับ: docs/r1/{f.name} -->\n")
            parts.append(f.read_text(encoding="utf-8"))
    return "".join(parts)


def main() -> None:
    OUT.mkdir(exist_ok=True)
    (OUT / "02-ALL-WORKFLOWS.md").write_text(workflows_md(), encoding="utf-8")
    (OUT / "03-UX-SCREENS-KPI.md").write_text(ux_md(), encoding="utf-8")
    (OUT / "04-FULL-DESIGN-DOCS.md").write_text(full_md(), encoding="utf-8")
    files = ["01-DESIGN-BRIEF.md", "02-ALL-WORKFLOWS.md", "03-UX-SCREENS-KPI.md", "04-FULL-DESIGN-DOCS.md"]
    with zipfile.ZipFile(OUT / "TNSU-design-export.zip", "w", zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(OUT / f, f)
    for f in files + ["TNSU-design-export.zip"]:
        print(f, (OUT / f).stat().st_size)


if __name__ == "__main__":
    main()
