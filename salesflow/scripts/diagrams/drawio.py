"""Tiny draw.io writer: swimlane flowcharts, free graphs and UML sequence diagrams.

Every page is laid out from data (lane + column for flowcharts, participant order for
sequences), so the same geometry also renders an SVG preview for review.
"""
from html import escape
from xml.sax.saxutils import quoteattr

FONT = 'fontFamily=Prompt;'
STYLE = {
    'start': 'ellipse;whiteSpace=wrap;html=1;fillColor=#E3F3EC;strokeColor=#17845A;fontStyle=1;',
    'end': 'ellipse;whiteSpace=wrap;html=1;fillColor=#FBEAEA;strokeColor=#C4382F;strokeWidth=2;fontStyle=1;',
    'task': 'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#334055;arcSize=14;',
    'sys': 'rounded=1;whiteSpace=wrap;html=1;fillColor=#EBEFFC;strokeColor=#3457D5;arcSize=14;',
    'dec': 'rhombus;whiteSpace=wrap;html=1;fillColor=#FBF1DC;strokeColor=#A86A08;',
    'doc': 'shape=document;whiteSpace=wrap;html=1;boundedLbl=1;fillColor=#F7F8FB;strokeColor=#667085;size=0.18;',
    'ext': 'rounded=1;whiteSpace=wrap;html=1;fillColor=#F1EAFB;strokeColor=#6A3FC4;dashed=1;arcSize=14;',
    'sub': 'shape=process;whiteSpace=wrap;html=1;backgroundOutline=1;fillColor=#E1F2F3;strokeColor=#0F7F86;size=0.08;',
    'note': 'shape=note;whiteSpace=wrap;html=1;fillColor=#FFFBEA;strokeColor=#D6B656;size=12;align=left;spacingLeft=6;',
    'actor': 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#FFFFFF;strokeColor=#334055;',
    'system': 'ellipse;whiteSpace=wrap;html=1;fillColor=#3457D5;strokeColor=#213C9E;fontColor=#FFFFFF;fontStyle=1;fontSize=16;',
    'box': 'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#334055;arcSize=8;',
    'state': 'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#334055;arcSize=40;fontStyle=1;',
}
FILL = {  # for the SVG preview
    'start': ('#E3F3EC', '#17845A'), 'end': ('#FBEAEA', '#C4382F'), 'task': ('#FFFFFF', '#334055'), 'sys': ('#EBEFFC', '#3457D5'),
    'dec': ('#FBF1DC', '#A86A08'), 'doc': ('#F7F8FB', '#667085'), 'ext': ('#F1EAFB', '#6A3FC4'), 'sub': ('#E1F2F3', '#0F7F86'),
    'note': ('#FFFBEA', '#D6B656'), 'actor': ('#FFFFFF', '#334055'), 'system': ('#3457D5', '#213C9E'), 'box': ('#FFFFFF', '#334055'),
    'state': ('#FFFFFF', '#334055'),
}
TOBE = 'dashed=1;strokeColor=#C4382F;'
SIZE = {'start': (110, 50), 'end': (110, 50), 'dec': (140, 84), 'doc': (160, 64)}


class Page:
    def __init__(self, name):
        self.name = name
        self.cells = []      # (id, value, style, x, y, w, h, kind, extra)
        self.edges = []      # (id, src, dst, label, style, points)
        self.free = []       # free-floating edges for sequences: (x1,y1,x2,y2,label,style,points)
        self.n = 2
        self.w = self.h = 0

    def nid(self):
        self.n += 1
        return f'c{self.n}'

    def add(self, value, kind, x, y, w=None, h=None, cid=None, style_extra='', tobe=False):
        dw, dh = SIZE.get(kind, (160, 60))
        w, h = w or dw, h or dh
        cid = cid or self.nid()
        style = STYLE[kind] + FONT + style_extra + (TOBE if tobe else '')
        self.cells.append((cid, value, style, x, y, w, h, kind, {'tobe': tobe}))
        self.w, self.h = max(self.w, x + w), max(self.h, y + h)
        return cid

    def edge(self, a, b, label='', style='', points=None):
        self.edges.append((self.nid(), a, b, label, style, points or []))

    def line(self, x1, y1, x2, y2, label='', style='', points=None):
        self.free.append((x1, y1, x2, y2, label, style, points or []))
        self.w, self.h = max(self.w, x1, x2), max(self.h, y1, y2)

    def xml(self):
        out = [f'<diagram name={quoteattr(self.name)} id={quoteattr(self.name[:40])}><mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" '
               f'tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{int(self.w + 60)}" pageHeight="{int(self.h + 60)}" math="0" shadow="0">'
               '<root><mxCell id="0"/><mxCell id="1" parent="0"/>']
        for cid, value, style, x, y, w, h, kind, _ in self.cells:
            out.append(f'<mxCell id="{cid}" value={quoteattr(html(value))} style={quoteattr(style)} vertex="1" parent="1">'
                       f'<mxGeometry x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{h:.0f}" as="geometry"/></mxCell>')
        base = 'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;strokeColor=#334055;' + FONT + 'fontSize=11;labelBackgroundColor=#FFFFFF;'
        for eid, a, b, label, style, pts in self.edges:
            p = ''.join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts)
            out.append(f'<mxCell id="{eid}" value={quoteattr(html(label))} style={quoteattr(base + style)} edge="1" parent="1" source="{a}" target="{b}">'
                       f'<mxGeometry relative="1" as="geometry">{"<Array as=\"points\">" + p + "</Array>" if p else ""}</mxGeometry></mxCell>')
        seqbase = 'html=1;endArrow=block;endFill=1;strokeColor=#334055;' + FONT + 'fontSize=11;labelBackgroundColor=#FFFFFF;verticalAlign=bottom;'
        for x1, y1, x2, y2, label, style, pts in self.free:
            p = ''.join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts)
            out.append(f'<mxCell id="{self.nid()}" value={quoteattr(html(label))} style={quoteattr(seqbase + style)} edge="1" parent="1">'
                       f'<mxGeometry relative="1" as="geometry"><mxPoint x="{x1}" y="{y1}" as="sourcePoint"/><mxPoint x="{x2}" y="{y2}" as="targetPoint"/>'
                       f'{"<Array as=\"points\">" + p + "</Array>" if p else ""}</mxGeometry></mxCell>')
        out.append('</root></mxGraphModel></diagram>')
        return ''.join(out)

    # ---------- SVG preview (approximation, for layout review) ----------
    def svg(self):
        W, H = int(self.w + 40), int(self.h + 40)
        s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="Prompt, sans-serif">'
             '<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#334055"/></marker></defs>'
             f'<rect width="{W}" height="{H}" fill="#fff"/>']
        geo = {c[0]: c for c in self.cells}
        for cid, value, style, x, y, w, h, kind, ex in self.cells:
            if kind in ('lane', 'lanehead', 'frame', 'title', 'lifeline', 'label'):
                fill, stroke = ex.get('fill', '#fff'), ex.get('stroke', '#cdd3de')
                if kind != 'title' and kind != 'label':
                    s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke}" {"stroke-dasharray=\"5 4\"" if kind in ("lifeline", "frame") else ""}/>')
                if kind == 'lanehead':
                    s.append(f'<g transform="rotate(-90 {x + w / 2} {y + h / 2})">' + text(value, x + w / 2, y + h / 2, 12, 'middle', bold=True, wrap=h - 8) + '</g>')
                else:
                    s.append(text(value, x + (w / 2 if kind == 'lifeline' else 8), y + 18 + (14 if kind == 'lifeline' else 0), 13 if kind != 'title' else 18,
                                  'middle' if kind == 'lifeline' else 'start', bold=kind != 'label'))
                continue
            fill, stroke = FILL.get(kind, ('#fff', '#334'))
            dash = ' stroke-dasharray="6 4"' if ex.get('tobe') or kind == 'ext' else ''
            if ex.get('tobe'):
                stroke = '#C4382F'
            if kind == 'dec':
                s.append(f'<polygon points="{x + w / 2},{y} {x + w},{y + h / 2} {x + w / 2},{y + h} {x},{y + h / 2}" fill="{fill}" stroke="{stroke}"{dash}/>')
            elif kind in ('start', 'end', 'system'):
                s.append(f'<ellipse cx="{x + w / 2}" cy="{y + h / 2}" rx="{w / 2}" ry="{h / 2}" fill="{fill}" stroke="{stroke}"{dash}/>')
            elif kind == 'actor':
                cx = x + w / 2
                s.append(f'<circle cx="{cx}" cy="{y + 8}" r="8" fill="#fff" stroke="{stroke}"/><path d="M{cx} {y + 16}V{y + h - 14}M{x + 2} {y + 26}H{x + w - 2}M{cx} {y + h - 14}L{x + 3} {y + h}M{cx} {y + h - 14}L{x + w - 3} {y + h}" stroke="{stroke}" fill="none"/>')
                s.append(text(value, cx, y + h + 14, 12, 'middle'))
                continue
            else:
                s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{8 if kind not in ("doc", "note") else 2}" fill="{fill}" stroke="{stroke}"{dash}/>')
            s.append(text(value, x + w / 2, y + h / 2, 11.5, 'middle', color='#fff' if kind == 'system' else '#141a26', wrap=w - 10))
        for eid, a, b, label, style, pts in self.edges:
            A, B = geo[a], geo[b]
            path = route(A, B, pts, style)
            dash = ' stroke-dasharray="5 4"' if 'dashed=1' in style else ''
            s.append(f'<polyline points="{" ".join(f"{px},{py}" for px, py in path)}" fill="none" stroke="#334055" marker-end="url(#a)"{dash}/>')
            if label:
                (mx, my) = mid(path)
                s.append(f'<rect x="{mx - len(label) * 3.2}" y="{my - 9}" width="{len(label) * 6.4}" height="15" fill="#fff"/>' + text(label, mx, my, 10.5, 'middle'))
        for x1, y1, x2, y2, label, style, pts in self.free:
            path = [(x1, y1), *pts, (x2, y2)]
            dash = ' stroke-dasharray="5 4"' if 'dashed=1' in style else ''
            arrow = '' if 'endArrow=none' in style else ' marker-end="url(#a)"'
            s.append(f'<polyline points="{" ".join(f"{px},{py}" for px, py in path)}" fill="none" stroke="#334055"{arrow}{dash}/>')
            if label:
                s.append(text(label, (x1 + (pts[0][0] if pts else x2)) / 2 + (40 if pts else 0), min(y1, y2) - 5, 10.5, 'middle'))
        s.append('</svg>')
        return ''.join(s)


def html(v):
    return escape(v).replace('\n', '<br>')


def text(v, x, y, size, anchor, bold=False, color='#141a26', wrap=None):
    lines = []
    for raw in v.split('\n'):
        if wrap:
            maxc = max(6, int(wrap / (size * 0.52)))
            while len(raw) > maxc:
                cut = raw.rfind(' ', 0, maxc)
                cut = cut if cut > maxc * 0.4 else maxc
                lines.append(raw[:cut]); raw = raw[cut:].lstrip()
        lines.append(raw)
    y0 = y - (len(lines) - 1) * size * 0.6 + size * 0.35
    return ''.join(f'<text x="{x}" y="{y0 + i * size * 1.2:.1f}" font-size="{size}" text-anchor="{anchor}" fill="{color}"{" font-weight=\"600\"" if bold else ""}>{escape(l)}</text>' for i, l in enumerate(lines))


def center(c):
    _, _, _, x, y, w, h, *_ = c
    return x + w / 2, y + h / 2


def port(c, fx, fy):
    _, _, _, x, y, w, h, *_ = c
    return x + w * fx, y + h * fy


def sty(style, k):
    for part in style.split(';'):
        if part.startswith(k + '='):
            return float(part.split('=')[1])
    return None


def side(fx, fy):
    return (-1, 0) if fx == 0 else (1, 0) if fx == 1 else (0, -1) if fy == 0 else (0, 1)


def route(A, B, pts, style=''):
    (ax, ay), (bx, by) = center(A), center(B)
    _, _, _, Ax, Ay, Aw, Ah, *_ = A
    _, _, _, Bx, By, Bw, Bh, *_ = B
    if 'edgeStyle=none' in style:
        def clip(c, tx, ty):
            _, _, _, x, y, w, h, *_ = c
            cx, cy = x + w / 2, y + h / 2
            dx, dy = tx - cx, ty - cy
            k = min(w / 2 / abs(dx) if dx else 1e9, h / 2 / abs(dy) if dy else 1e9)
            return cx + dx * k, cy + dy * k
        return [clip(A, bx, by), clip(B, ax, ay)]
    ex, ey, nx, ny = (sty(style, k) for k in ('exitX', 'exitY', 'entryX', 'entryY'))
    if pts:
        return [(ax, ay), *pts, (bx, by)]
    if ex is None:
        if abs(ay - by) < 4:
            return [(Ax + Aw if bx > ax else Ax, ay), (Bx if bx > ax else Bx + Bw, by)]
        if abs(ax - bx) < 4:
            return [(ax, Ay + Ah if by > ay else Ay), (bx, By if by > ay else By + Bh)]
        sx = Ax + Aw if bx > ax else Ax
        return [(sx, ay), (bx, ay), (bx, By if by > ay else By + Bh)]
    p0 = port(A, ex, ey)
    p1 = port(B, nx if nx is not None else 0.5, ny if ny is not None else 0.5)
    d0 = side(ex, ey)
    d1 = side(nx if nx is not None else 0.5, ny if ny is not None else 0)
    q0 = (p0[0] + d0[0] * 24, p0[1] + d0[1] * 24)
    q1 = (p1[0] + d1[0] * 24, p1[1] + d1[1] * 24)
    elbow = (q1[0], q0[1]) if d0[1] == 0 else (q0[0], q1[1])
    return [p0, q0, elbow, q1, p1]


def mid(path):
    if len(path) == 2:
        return (path[0][0] + path[1][0]) / 2, (path[0][1] + path[1][1]) / 2
    seg = max(zip(path, path[1:]), key=lambda s: abs(s[0][0] - s[1][0]) + abs(s[0][1] - s[1][1]))
    return (seg[0][0] + seg[1][0]) / 2, (seg[0][1] + seg[1][1]) / 2


# ---------------- builders ----------------
LANE_H, HEAD_W, COL_W, TOP = 132, 150, 200, 70


def legend(pg, x, y):
    items = [('start', 'เริ่ม'), ('end', 'จบ'), ('task', 'ผู้ใช้ทำ'), ('sys', 'ระบบทำ'), ('dec', 'ตัดสินใจ'), ('doc', 'เอกสาร'), ('ext', 'Microsoft 365'), ('sub', 'Sub-process (ดูหน้าถัดไป)')]
    pg.cells.append((pg.nid(), 'สัญลักษณ์', 'text;html=1;fontStyle=1;' + FONT, x, y, 120, 20, 'label', {}))
    for i, (k, t) in enumerate(items):
        pg.add(t, k, x + i * 128, y + 26, 118, 40 if k != 'dec' else 46)
    pg.add('To-be (ยังไม่มีในระบบ)', 'task', x + len(items) * 128, y + 26, 150, 40, tobe=True)


def swimlane(name, title, lanes, nodes, edges, notes=(), subtitle=''):
    """nodes: (id, lane, col, kind, text[, tobe]) — edges: (a, b[, label[, style]])"""
    pg = Page(name)
    cols = max(n[2] for n in nodes) + 1
    width = HEAD_W + cols * COL_W + 40
    pg.cells.append((pg.nid(), title, 'text;html=1;fontSize=20;fontStyle=1;' + FONT, 20, 14, width, 30, 'title', {}))
    if subtitle:
        pg.cells.append((pg.nid(), subtitle, 'text;html=1;fontSize=12;fontColor=#667085;' + FONT, 20, 42, width, 20, 'label', {}))
    for i, lane in enumerate(lanes):
        y = TOP + i * LANE_H
        sysl = lane.startswith('One Platform') or lane.startswith('Microsoft')
        fill = '#F5F7FD' if lane.startswith('One Platform') else '#FAF7FE' if lane.startswith('Microsoft') else '#FFFFFF' if i % 2 == 0 else '#FAFBFC'
        pg.cells.append((pg.nid(), '', f'rounded=0;whiteSpace=wrap;html=1;fillColor={fill};strokeColor=#CDD3DE;' + FONT, 20, y, width - 20, LANE_H, 'lane', {'fill': fill}))
        pg.cells.append((pg.nid(), lane, f'rounded=0;whiteSpace=wrap;html=1;fillColor={"#DDE4FA" if sysl else "#EEF0F4"};strokeColor=#CDD3DE;fontStyle=1;horizontal=0;' + FONT,
                         20, y, 34, LANE_H, 'lanehead', {'fill': '#DDE4FA' if sysl else '#EEF0F4'}))
    pg.w = max(pg.w, width)
    pg.h = max(pg.h, TOP + len(lanes) * LANE_H)
    ids = {}
    for n in nodes:
        nid, lane, col, kind, txt = n[:5]
        tobe = len(n) > 5 and n[5]
        w, h = SIZE.get(kind, (160, 64))
        x = HEAD_W - 70 + col * COL_W + (COL_W - w) / 2
        y = TOP + lane * LANE_H + (LANE_H - h) / 2
        ids[nid] = pg.add(txt, kind, x, y, w, h, tobe=tobe)
    where = {n[0]: (n[1], n[2]) for n in nodes}
    occ = {(n[1], n[2]) for n in nodes}
    between = lambda a, b: range(min(a, b) + 1, max(a, b))
    for e in edges:
        a, b = e[0], e[1]
        style = e[3] if len(e) > 3 else ''
        (la, ca), (lb, cb) = where[a], where[b]
        if 'exitX' not in style:
            if la == lb and any((la, c) in occ for c in between(ca, cb)):
                style += 'exitX=0.5;exitY=0;entryX=0.5;entryY=0;'          # hop over boxes in the same lane
            elif la != lb and ca != cb:
                vert_clear = (lb, ca) not in occ and not any((l, ca) in occ for l in between(la, lb)) and not any((lb, c) in occ for c in between(ca, cb))
                horiz_clear = (la, cb) not in occ and not any((la, c) in occ for c in between(ca, cb)) and not any((l, cb) in occ for l in between(la, lb))
                if vert_clear or not horiz_clear:   # vertical first, enter from the side
                    style += f"exitX=0.5;exitY={1 if lb > la else 0};entryX={0 if cb > ca else 1};entryY=0.5;"
                else:                               # horizontal first, enter from top/bottom
                    style += f"exitX={1 if cb > ca else 0};exitY=0.5;entryX=0.5;entryY={0 if lb > la else 1};"
        pg.edge(ids[a], ids[b], e[2] if len(e) > 2 else '', style)
    y = TOP + len(lanes) * LANE_H + 24
    for i, t in enumerate(notes):
        pg.add(t, 'note', 20 + i * 330, y, 320, 74)
    legend(pg, 20, y + (100 if notes else 0))
    return pg


def sequence(name, title, parts, msgs, frames=(), subtitle=''):
    """parts: (id, label, kind 'actor'|'sys'|'ext') · msgs: (from, to, text, type) type: sync|ret|self|async · frames: (label, i0, i1)"""
    pg = Page(name)
    GAP, X0, PW, Y0, MH = 190, 60, 150, 90, 44
    pos = {p[0]: X0 + i * GAP + PW / 2 for i, p in enumerate(parts)}
    total = Y0 + 70 + len(msgs) * MH + 40
    pg.cells.append((pg.nid(), title, 'text;html=1;fontSize=20;fontStyle=1;' + FONT, 20, 14, len(parts) * GAP + 60, 30, 'title', {}))
    if subtitle:
        pg.cells.append((pg.nid(), subtitle, 'text;html=1;fontSize=12;fontColor=#667085;' + FONT, 20, 42, len(parts) * GAP, 20, 'label', {}))
    for i, (pid, label, kind) in enumerate(parts):
        x = X0 + i * GAP
        fill = {'actor': '#FFFFFF', 'sys': '#EBEFFC', 'ext': '#F1EAFB'}[kind]
        participant = 'umlActor' if kind == 'actor' else 'rect'
        style = f'shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=0;collapsible=0;recursiveResize=0;outlineConnect=0;participant={participant};size=50;fillColor={fill};strokeColor=#334055;fontStyle=1;' + FONT
        if kind == 'actor':
            style += 'verticalLabelPosition=bottom;verticalAlign=top;'
        pg.cells.append((pg.nid(), label, style, x, Y0, PW, total - Y0, 'lifeline', {'fill': fill, 'stroke': '#334055'}))
    for label, i0, i1 in frames:
        y = Y0 + 60 + i0 * MH - 8
        h = (i1 - i0 + 1) * MH + 12
        pg.cells.append((pg.nid(), label, 'shape=umlFrame;whiteSpace=wrap;html=1;width=150;height=24;fillColor=none;strokeColor=#A86A08;fontColor=#A86A08;align=left;spacingLeft=4;' + FONT,
                         X0 - 30, y, len(parts) * GAP - 10, h, 'frame', {'fill': 'none', 'stroke': '#A86A08'}))
    for i, (a, b, txt, typ) in enumerate(msgs):
        y = Y0 + 70 + i * MH + 18
        if typ == 'self':
            x = pos[a]
            pg.line(x, y - 10, x, y + 12, txt, 'endArrow=block;endFill=1;align=left;spacingLeft=6;', [(x + 40, y - 10), (x + 40, y + 12)])
        else:
            st = {'sync': 'endArrow=block;endFill=1;', 'async': 'endArrow=open;endFill=0;', 'ret': 'endArrow=open;endFill=0;dashed=1;'}[typ]
            pg.line(pos[a], y, pos[b], y, txt, st)
    pg.h = max(pg.h, total)
    return pg


def free(name, title, subtitle=''):
    pg = Page(name)
    pg.cells.append((pg.nid(), title, 'text;html=1;fontSize=20;fontStyle=1;' + FONT, 20, 14, 900, 30, 'title', {}))
    if subtitle:
        pg.cells.append((pg.nid(), subtitle, 'text;html=1;fontSize=12;fontColor=#667085;' + FONT, 20, 42, 900, 20, 'label', {}))
    return pg


def write(pages, path, preview):
    xml = '<mxfile host="app.diagrams.net" agent="One Platform diagram generator" version="24.7.0">' + ''.join(p.xml() for p in pages) + '</mxfile>'
    open(path, 'w', encoding='utf-8').write(xml)
    nav = ''.join(f'<a href="#p{i}">{escape(p.name)}</a>' for i, p in enumerate(pages))
    body = ''.join(f'<section id="p{i}"><h2>{escape(p.name)}</h2>{p.svg()}</section>' for i, p in enumerate(pages))
    open(preview, 'w', encoding='utf-8').write(
        '<!doctype html><meta charset="utf-8"><title>One Platform flows</title><link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;600&display=swap" rel="stylesheet">'
        '<style>body{font-family:Prompt,sans-serif;margin:0;background:#f3f5f9}nav{background:#fff;padding:10px 16px;display:flex;flex-wrap:wrap;gap:6px 14px;border-bottom:1px solid #e4e7ee;font-size:13px;z-index:2}'
        'section{background:#fff;margin:16px;padding:12px;border:1px solid #e4e7ee;border-radius:12px;width:max-content}h2{font-size:15px;margin:4px 6px 10px}a{color:#3457d5;text-decoration:none}</style>'
        f'<nav>{nav}</nav>{body}')
