"""Regenerate the generated parts of docs/05-workflows.md from docs/data/workflows.json.

Regenerates: summary counts table (section 1), stage tables (section 3) and the
step-by-step appendix (section 6). Hand-written sections (rules, diagrams,
review closure) are kept as they are.
Usage: python3 tnsu-system/tools/gen_05.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOC = ROOT / "docs" / "05-workflows.md"
DATA = ROOT / "docs" / "data" / "workflows.json"


def short(name: str) -> str:
    return name.split(" (")[0].split(" / ")[0]


def main() -> None:
    d = json.loads(DATA.read_text(encoding="utf-8"))
    names = {r["code"]: short(r["name"]) for r in d["roles"]}
    names["system"] = "ระบบ"
    wfs = d["workflows"]
    order = {s["code"]: i for i, s in enumerate(d["stages"])}
    wfs = sorted(wfs, key=lambda w: (order[w["stage"]], int(w["id"][2:])))
    num = lambda w: int(w["id"][2:])
    ids = sorted(num(w) for w in wfs)
    used_roles = {s["role"] for w in wfs for s in w["steps"]}
    seed = [w for w in wfs if num(w) <= 68]
    new = [w for w in wfs if num(w) >= 69]

    summary = (
        "| รายการ | จำนวน |\n|---|---|\n"
        f"| Workflow ทั้งหมด | **{len(wfs)}** (W-01..W-{ids[-1]:02d}; **W-63 ว่าง** ตาม seed) |\n"
        f"| คงความหมายจาก seed (W-01..W-68) | {len(seed)} (ปรับขั้นตอนตาม review แล้ว) |\n"
        f"| ใหม่ (W-69 ขึ้นไป) | **{len(new)}** (W-69..W-{ids[-1]}) |\n"
        f"| Stage | {len(d['stages'])} ({', '.join('`' + s['code'] + '`' for s in d['stages'])}) |\n"
        f"| บทบาทที่ใช้ใน JSON | {len(used_roles)} รหัสที่ใช้ในขั้นตอน (catalogue {len(d['roles'])} รหัส; รายการสุดท้ายอยู่ในเล่ม 04) |\n"
        f"| workflow ถัดไปที่ว่าง | **W-{ids[-1] + 1}** |\n"
    )

    tables = ["## 3. ทะเบียน workflow ตาม stage\n"]
    appendix = ["## 6. ภาคผนวก ก — ขั้นตอนละเอียดของทุก workflow (สร้างจาก `data/workflows.json`)\n"]
    for st in d["stages"]:
        group = [w for w in wfs if w["stage"] == st["code"]]
        if not group:
            continue
        tables.append(f"### {st['name']} (`{st['code']}`) — {len(group)} workflow\n")
        tables.append(f"> {st.get('desc', '')}\n")
        tables.append("| ID | ชื่อ | ผู้เริ่ม | สายอนุมัติ / ผู้ดำเนินการ | SLA | โมดูล | ผลลัพธ์ |\n|---|---|---|---|---|---|---|")
        appendix.append(f"#### {st['name']} (`{st['code']}`)\n")
        for w in group:
            chain = []
            for s in w["steps"][1:]:
                n = names.get(s["role"], s["role"])
                if not chain or chain[-1] != n:
                    chain.append(n)
            mark = " 🆕" if num(w) >= 69 else ""
            cell = lambda t: str(t).replace("|", "/").replace("\n", " ")
            tables.append(
                f"| {w['id']}{mark} | {cell(w['name'])} | {names.get(w['steps'][0]['role'], w['steps'][0]['role'])} | "
                f"{' → '.join(chain)} | {cell(w['sla'])} | {w['module']} | {cell(w.get('output', ''))} |")
            appendix.append(f"**{w['id']} {w['name']}** — `{w['module']}` · SLA: {w['sla']}  ")
            appendix.append(f"เริ่มเมื่อ: {w.get('trigger', '-')} · ผลลัพธ์: {w.get('output', '-')}\n")
            appendix.extend(f"{i}. `{s['role']}` — {s['action']}" for i, s in enumerate(w["steps"], 1))
            appendix.append("")
        tables.append("")

    text = DOC.read_text(encoding="utf-8")
    text = re.sub(r"(## 1\. สรุป\n\n)\| รายการ \| จำนวน \|\n(?:\|.*\|\n)+", lambda m: m.group(1) + summary, text, count=1)
    text = re.sub(r"## 3\. ทะเบียน workflow ตาม stage\n.*?(?=\n## 4\.)", lambda m: "\n".join(tables).rstrip() + "\n", text, count=1, flags=re.S)
    text = re.sub(r"## 6\. ภาคผนวก ก.*?(?=\n## 7\.)", lambda m: "\n".join(appendix).rstrip() + "\n", text, count=1, flags=re.S)
    DOC.write_text(text, encoding="utf-8")
    print(f"05 regenerated: {len(wfs)} workflows, next free W-{ids[-1] + 1}")


if __name__ == "__main__":
    main()
