"""Regenerate the per-module "Workflow:" lines in docs/06-modules.md from docs/data/workflows.json.

Each core module section (### n.n CODE — ...) gets the list of workflows whose
`module` is that code. Usage: python3 tnsu-system/tools/gen_06_workflows.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOC = ROOT / "docs" / "06-modules.md"
DATA = ROOT / "docs" / "data" / "workflows.json"


def main() -> None:
    wfs = json.loads(DATA.read_text(encoding="utf-8"))["workflows"]
    by_module = {}
    for w in sorted(wfs, key=lambda w: int(w["id"][2:])):
        by_module.setdefault(w["module"], []).append(f"{w['id']} {w['name']}")

    lines = DOC.read_text(encoding="utf-8").split("\n")
    current, done, missing = None, set(), []
    for i, line in enumerate(lines):
        m = re.match(r"^### \d+\.\d+ ([A-Z]+) — ", line)
        if m:
            current = m.group(1)
            continue
        if line.startswith("## "):
            current = None
        if current and line.startswith("- **Workflow:**") and current not in done:
            owned = by_module.get(current, [])
            body = "; ".join(owned) if owned else "ไม่มี workflow ที่โมดูลนี้เป็นเจ้าของ (ให้บริการแก่ workflow ของโมดูลอื่น)"
            lines[i] = f"- **Workflow:** (เป็นเจ้าของ {len(owned)} รายการ, สร้างจาก `data/workflows.json`) {body}"
            done.add(current)
        elif current and line.startswith("- **แนวทาง:**") and current not in done:
            owned = by_module.get(current, [])
            body = "; ".join(owned) if owned else "ไม่มี workflow ที่โมดูลนี้เป็นเจ้าของ (ให้บริการแก่ workflow ของโมดูลอื่น)"
            lines[i] = f"- **Workflow:** (เป็นเจ้าของ {len(owned)} รายการ, สร้างจาก `data/workflows.json`) {body}\n" + line
            done.add(current)
    for code in by_module:
        if code not in done:
            missing.append(code)
    DOC.write_text("\n".join(lines), encoding="utf-8")
    print(f"updated {len(done)} module sections; modules in JSON without a section line: {missing}")


if __name__ == "__main__":
    main()
