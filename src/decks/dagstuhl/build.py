#!/usr/bin/env python3
"""Compile deck.md into a self-contained slide deck.

    python3 build.py            # -> cambra-dagstuhl.html
    python3 build.py --check    # parse + report word counts, write nothing

Stdlib only. Fonts come pre-subsetted from fonts.css (regenerate with
subset.py only if the brand faces change).
"""
import html
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
SRC = HERE / "deck.md"
TPL = HERE / "template.html"
FONTS = HERE / "fonts.css"
LOGOS = HERE / "logos.css"
OUT = HERE / "deck.html"

# Directives that take "- item" rows beneath them.
LIST_BLOCKS = {"box", "rows", "rows2", "cols", "callouts", "table", "pills",
               "byline"}
# Directives that take verbatim lines beneath them.
VERBATIM_BLOCKS = {"code", "diag"}
# Directives whose text is read as sentences rather than scanned as a list.
PROSE_BLOCKS = {"headline", "eyebrow", "punch", "sub", "wink", "lead"}
# All a title/closing slide may contain. Anything else makes it a content
# slide, laid out as head + centred body.
TITLE_BLOCKS = PROSE_BLOCKS | {"byline", "pills", "chip"}

PROSE_BUDGET = 26   # words the audience reads instead of listening to you
ITEM_BUDGET = 6     # rows / bullets / box entries they scan

TIMELINE = """<svg class="tl" viewBox="0 0 520 250" aria-label="A step function over the commit order; a read reaches back to the last commit before it">
  <line class="ax" x1="26" y1="200" x2="502" y2="200"/>
  <line class="tk" x1="40" y1="195" x2="40" y2="205"/>
  <line class="tk" x1="130" y1="195" x2="130" y2="205"/>
  <line class="tk" x1="220" y1="195" x2="220" y2="205"/>
  <line class="tk" x1="310" y1="195" x2="310" y2="205"/>
  <text x="40" y="226" text-anchor="middle">t0</text>
  <text x="130" y="226" text-anchor="middle">t1</text>
  <text x="220" y="226" text-anchor="middle">t2</text>
  <text x="310" y="226" text-anchor="middle">t3</text>
  <text class="a" x="400" y="226" text-anchor="middle">t (now)</text>
  <path class="st" d="M40 158 H130 V130 H220 V96 H310 V148 H400"/>
  <circle class="d" cx="40" cy="158" r="4.5"/>
  <circle class="d" cx="130" cy="130" r="4.5"/>
  <circle class="d" cx="220" cy="96" r="4.5"/>
  <circle class="da" cx="310" cy="148" r="6"/>
  <line class="nw" x1="400" y1="76" x2="400" y2="200"/>
  <path class="rc" d="M394 104 C 362 88, 330 122, 318 140"/>
  <path class="rc" d="M318 140 l 12 -2 M318 140 l 2 -12" stroke-linecap="round"/>
  <text class="a" x="502" y="36" text-anchor="end">read at t</text>
  <text x="502" y="56" text-anchor="end">reaches back, never forward</text>
</svg>"""

# Deliberately wide and short: a tall viewBox letterboxes inside a full-width
# slot, shrinking the drawing to a sliver in the middle of the slide.
FORK = """<svg class="fk" viewBox="0 0 700 152" aria-label="One shared history forking at t_new into two versions that continue independently">
  <line class="ax" x1="20" y1="126" x2="680" y2="126"/>
  <line class="tk" x1="330" y1="121" x2="330" y2="131"/>
  <text class="a" x="330" y="147" text-anchor="middle">t_new</text>
  <path class="trunk" d="M30 88 H330"/>
  <path class="main"  d="M330 88 H598"/>
  <path class="brnch" d="M330 88 C 372 88, 378 34, 420 34 H598"/>
  <circle class="fdot" cx="330" cy="88" r="7"/>
  <text class="lbl" x="32" y="70">one history</text>
  <text class="mn" x="608" y="89">v0</text>
  <text class="mnq" x="608" y="105">prod</text>
  <text class="br" x="608" y="35">v1</text>
  <text class="brq" x="608" y="51">under test</text>
</svg>"""

KW = r"def|for|in|if|else|match|case|with|as|true|false|requires|return|and|or|not"
TY = (r"Mut|Feed|Txn|Map|FullMap|Int|Real|String|Bool|Time|Dollars|Qty|SKU"
      r"|ItemPricing|Transaction|Stock|Order|Line|Sku|Set")
TOKEN = re.compile(
    r"(#[^\n]*)"                        # 1 comment
    r'|("(?:[^"\\]|\\.)*")'             # 2 string
    r"|\b(" + KW + r")\b"               # 3 keyword
    r"|\b(" + TY + r")\b"               # 4 type
)


def esc(s):
    return html.escape(s, quote=False)


def highlight(code):
    """Tokenize CHL-ish source into brand-palette spans, escaping the gaps."""
    out, pos = [], 0
    for m in TOKEN.finditer(code):
        out.append(esc(code[pos:m.start()]))
        if m.group(1):
            out.append('<span class="cm">%s</span>' % esc(m.group(1)))
        elif m.group(2):
            out.append('<span class="st">%s</span>' % esc(m.group(2)))
        elif m.group(3):
            out.append('<span class="kw">%s</span>' % esc(m.group(3)))
        else:
            out.append('<span class="ty">%s</span>' % esc(m.group(4)))
        pos = m.end()
    out.append(esc(code[pos:]))
    return "".join(out)


def marks(s):
    """[[x]] -> highlighted span. Applied after escaping, so brackets survive."""
    return re.sub(r"\[\[(.+?)\]\]", r"<mark>\1</mark>", s)


def smart_quotes(s):
    """Straight quotes to typographic ones. The brand display face draws U+0022
    as a slanted prime, so a straight pair reads as two closing quotes."""
    s = re.sub(r'(^|[\s(\[{—–])"', "\\1\u201c", s)
    s = s.replace('"', "\u201d")
    s = re.sub(r"(^|[\s(\[{—–])'", "\\1\u2018", s)
    s = s.replace("'", "\u2019")
    return s


def inline(s):
    """Light inline markdown for prose: **bold**, *em*, _em_, `code`.
    Everything outside a `code` span also gets typographic quotes."""
    s = esc(s)
    out = []
    for i, part in enumerate(re.split(r"(`[^`]+`)", s)):
        if i % 2:                       # inside backticks: verbatim
            out.append("<code>%s</code>" % part[1:-1])
            continue
        part = smart_quotes(part)
        part = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", part)
        part = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", part)
        # Underscore emphasis, but never intraword — otherwise identifiers
        # like order_reqs and stats_resps get mangled into italics.
        part = re.sub(r"(?<![A-Za-z0-9_])_([^_]+)_(?![A-Za-z0-9_])",
                      r"<em>\1</em>", part)
        out.append(part)
    return "".join(out)


def strip_bullet(s):
    """Drop a hand-typed leading bullet — the CSS draws its own marker."""
    return re.sub(r"^\s*[•\-\*–•]\s+", "", s)


def parse(text):
    """deck.md -> [slide dict]. Order of keys in `blocks` is render order."""
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    slides, cur, warnings = [], None, []
    prev_blank = True
    block = None          # (name, arg) currently collecting into
    in_notes = False

    def new_slide():
        return {"blocks": [], "notes": []}

    for raw in text.split("\n"):
        line = raw.rstrip()

        if line.strip() == "---":
            if cur and (cur["blocks"] or cur["notes"]):
                slides.append(cur)
            cur, block, in_notes = new_slide(), None, False
            continue
        if cur is None:
            if not line.strip():
                continue
            cur = new_slide()

        if in_notes:
            cur["notes"].append(line)
            continue

        if block and block[0] in VERBATIM_BLOCKS:
            # Verbatim until the next %directive (or the slide break handled
            # above). Deliberately NOT terminated by "#": that's a comment in
            # CHL, and treating it as a heading silently ate code lines.
            if line.startswith("%"):
                block = None
            else:
                cur["blocks"][-1][2].append(line)
                continue

        if not line.strip():
            prev_blank = True
            continue
        was_blank, prev_blank = prev_blank, False

        if line.startswith("%"):
            parts = line[1:].split(None, 1)
            name = parts[0]
            arg = parts[1].strip() if len(parts) > 1 else ""
            if name == "notes":
                in_notes = True
                block = None
                continue
            if name in ("timeline", "fork", "split"):
                cur["blocks"].append((name, "", []))
                block = None
                continue
            cur["blocks"].append((name, arg, []))
            block = (name, arg) if name in LIST_BLOCKS | VERBATIM_BLOCKS else None
            continue

        if line.startswith("### "):
            if block and block[0] == "cols":
                cur["blocks"][-1][2].append(("head", line[4:].strip()))
            continue
        if line.startswith("## "):
            cur["blocks"].append(("eyebrow", line[3:].strip(), []))
            block = None
            continue
        if line.startswith("# "):
            cur["blocks"].append(("headline", line[2:].strip(), []))
            block = None
            continue
        if line.startswith("- "):
            item = line[2:].strip()
            if block and block[0] in LIST_BLOCKS:
                if block[0] == "cols":
                    cur["blocks"][-1][2].append(("item", item))
                else:
                    cur["blocks"][-1][2].append(item)
            else:
                warnings.append((raw, "a '- ' item with no list directive above it"))
            continue

        # A bare line directly under a prose directive is a wrapped
        # continuation of it. After a blank line it's a new paragraph, so it
        # becomes a %lead instead of being glued onto the headline.
        last_prose = cur["blocks"] and cur["blocks"][-1][0] in PROSE_BLOCKS
        if last_prose and not was_blank:
            nm, arg, its = cur["blocks"][-1]
            cur["blocks"][-1] = (nm, (arg + " " + line.strip()).strip(), its)
            continue
        if cur["blocks"]:
            cur["blocks"].append(("lead", line.strip(), []))
            continue
        warnings.append((raw, "not attached to any directive"))

    if cur and (cur["blocks"] or cur["notes"]):
        slides.append(cur)
    return slides, warnings


def cells(item, n):
    """Split a '- a | b | c' row into exactly n stripped cells."""
    parts = [p.strip() for p in item.split("|")]
    parts += [""] * (n - len(parts))
    return parts[:n]


def render_block(name, arg, items):
    if name == "eyebrow":
        return '<div class="eyebrow">%s</div>' % inline(arg), "head"
    if name == "headline":
        return "<h2>%s</h2>" % marks(inline(arg)), "head"
    if name == "sub":
        return '<p class="sub">%s</p>' % inline(arg), "sub"
    if name == "lead":
        return '<p class="lead-p">%s</p>' % marks(inline(arg)), "body"
    if name == "punch":
        return '<p class="punch">%s</p>' % marks(inline(arg)), "body"
    if name == "wink":
        return '<p class="wink">%s</p>' % inline(arg), "wink"
    if name == "chip":
        cls = "chip run" if arg.strip() == "running" else "chip"
        return '<div class="%s">%s</div>' % (cls, esc(arg.strip())), "chip"

    if name == "box":
        rows = []
        for it in items:
            label, gloss = cells(strip_bullet(it), 2)
            g = " <em>— %s</em>" % inline(gloss) if gloss else ""
            rows.append("<div>%s%s</div>" % (inline(label), g))
        return (
            '<div class="box-outer"><div class="box">'
            '<div class="box-label">inside the box</div>'
            '<div class="parts">%s</div></div>'
            '<div class="win" aria-hidden="true"></div>'
            '<div class="attendant" aria-hidden="true">'
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"'
            ' stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'
            '<circle cx="12" cy="8" r="4"/>'
            '<path d="M4.5 21c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7"/></svg></div>'
            '<div class="win-label">%s</div></div>'
            % ("".join(rows), esc(arg or "SQL"))
        ), "body"

    if name in ("rows", "rows2"):
        rows = []
        for it in items:
            left, right = cells(strip_bullet(it), 2)
            rows.append(
                '<div><span class="l">%s</span><span class="r">%s</span></div>'
                % (inline(left), marks(inline(right)))
            )
        cls = "rows two" if name == "rows2" else "rows"
        return '<div class="%s">%s</div>' % (cls, "".join(rows)), "body"

    if name == "cols":
        cols, cur = [], None
        for kind, val in items:
            if kind == "head":
                cur = {"head": val, "items": []}
                cols.append(cur)
            elif cur is not None:
                cur["items"].append(val)
        out = []
        for c in cols:
            lis = "".join("<li>%s</li>" % inline(strip_bullet(x))
                          for x in c["items"])
            out.append(
                '<div class="col"><h3>%s</h3><ul>%s</ul></div>'
                % (inline(c["head"]), lis)
            )
        return '<div class="cols">%s</div>' % "".join(out), "body"

    if name == "code":
        body = "\n".join(items).strip("\n")
        n = len(body.split("\n"))
        cls = "tiny" if n > 20 else "dense" if n > 6 else ""
        return '<pre class="%s">%s</pre>' % (cls, marks(highlight(body))), "body"

    if name == "diag":
        body = "\n".join(items).strip("\n")
        body = esc(body)
        body = re.sub(r"^error", '<span class="e">error</span>', body)
        body = body.replace("--&gt;", '<span class="g">--&gt;</span>')
        body = re.sub(r"(\^+)", r'<span class="c">\1</span>', body)
        body = re.sub(r"^(\s*)=", r'\1<span class="g">=</span>', body, flags=re.M)
        body = re.sub(r"^(\s*)\|", r'\1<span class="g">|</span>', body, flags=re.M)
        return '<div class="diag">%s</div>' % body, "body"

    if name == "timeline":
        return TIMELINE, "body"

    if name == "fork":
        return FORK, "body"

    if name == "split":
        return "", "split"

    if name == "callouts":
        out = []
        for it in items:
            label, desc = cells(it, 2)
            out.append(
                '<div><span class="ct">%s</span><span class="cd">%s</span></div>'
                % (inline(label), inline(desc))
            )
        return '<div class="callouts">%s</div>' % "".join(out), "callouts"

    if name == "table":
        rows = []
        for it in items:
            prog, what, status = cells(it, 3)
            y = " y" if status.lower().startswith("run") else ""
            rows.append(
                '<tr><td class="p">%s</td><td>%s</td><td class="s%s">%s</td></tr>'
                % (esc(prog), inline(what), y, esc(status))
            )
        return (
            '<div class="tw"><table><thead><tr><th>Program</th><th>Exercises</th>'
            "<th>Status</th></tr></thead><tbody>%s</tbody></table></div>"
            % "".join(rows)
        ), "body"

    if name == "pills":
        return (
            '<div class="pills">%s</div>'
            % "".join('<span class="pill">%s</span>' % esc(x) for x in items)
        ), "body"

    if name == "byline":
        return (
            '<div class="byline">%s</div>'
            % "".join("<span>%s</span>" % esc(x) for x in items)
        ), "byline"

    raise SystemExit("build.py: unknown directive %%%s" % name)


def render_notes(lines):
    """Blank-line separated paragraphs -> <p>. First one is styled as the quote."""
    paras, buf = [], []
    for ln in lines:
        if ln.strip():
            buf.append(ln.strip())
        elif buf:
            paras.append(" ".join(buf))
            buf = []
    if buf:
        paras.append(" ".join(buf))
    if not paras:
        return ""
    return '<aside class="n">%s</aside>' % "".join(
        "<p>%s</p>" % inline(p) for p in paras
    )


def main():
    check = "--check" in sys.argv
    slides, warnings = parse(SRC.read_text())
    for raw, why in warnings:
        print("WARNING: dropped line (%s): %r" % (why, raw.strip()), file=sys.stderr)

    # A title slide is one whose headline should render as <h1>.
    out = []
    for n, slide in enumerate(slides):
        names = [b[0] for b in slide["blocks"]]
        # Allowlist, not denylist: a slide is a title slide only if it carries
        # nothing but prose and title furniture. A denylist of content
        # directives silently mis-renders every directive added after it.
        title_ish = all(n in TITLE_BLOCKS for n in names)
        parts = []
        chip = ""
        head, body, prose = [], [], []
        nitems = 0
        for name, arg, items in slide["blocks"]:
            # Two different costs. Sentences get *read* — that's what steals
            # attention from the speaker. Rows, boxes and tables get *scanned*,
            # so they cost a glance each, not a reading.
            if name in PROSE_BLOCKS:
                prose.append(arg)
            elif name not in ("chip", "code", "diag", "timeline", "fork", "table"):
                # A "### Title" in %cols is a label, not a bullet.
                nitems += sum(
                    1 for x in items
                    if not (isinstance(x, tuple) and x[0] == "head")
                )
            if name == "headline" and title_ish:
                # Step the display size down as the headline grows, so a long
                # closing line doesn't wrap to three 96px lines. Note: do NOT
                # bind this to `n` — that's the enumerate index over slides.
                hlen = len(arg)
                cls = ("" if hlen <= 24 else ' class="long"' if hlen <= 48
                       else ' class="xlong"')
                head.append("<h1%s>%s</h1>" % (cls, marks(inline(arg))))
                continue
            frag, role = render_block(name, arg, items)
            if role == "chip":
                chip = frag
            elif role == "head":
                head.append(frag)
            else:
                body.append((frag, role))

        # %split pairs the two body blocks that follow it, side by side.
        merged, k = [], 0
        while k < len(body):
            frag, role = body[k]
            if role == "split":
                pair = [f for f, _ in body[k + 1:k + 3]]
                merged.append(
                    ('<div class="split-2">%s</div>' % "".join(pair), "body")
                )
                k += 1 + len(pair)
            else:
                merged.append((frag, role))
                k += 1
        body = merged

        notes = render_notes(slide["notes"])

        if title_ish:
            inner = ['<div class="brand" role="img" aria-label="Cambra"></div>'] \
                    + head + [f for f, _ in body]
            parts.append(
                '<section class="slide title-slide">%s%s%s</section>'
                % (chip, "".join(inner), notes)
            )
        else:
            co = [f for f, r in body if r == "callouts"]
            if co:
                code = [f for f, r in body if f.startswith("<pre")]
                rest = [f for f, r in body
                        if r != "callouts" and not f.startswith("<pre")]
                grow = ['<div class="annot">%s%s</div>'
                        % ("".join(code), "".join(co))] + rest
            else:
                grow = [f for f, _ in body]
            parts.append(
                '<section class="slide">%s<div class="head">%s</div>'
                '<div class="grow">%s</div>%s</section>'
                % (chip, "".join(head), "".join(grow), notes)
            )
        out.append("".join(parts))

        if check:
            words = len(" ".join(prose).split())
            flags = []
            if words > PROSE_BUDGET:
                flags.append("prose")
            if nitems > ITEM_BUDGET:
                flags.append("items")
            flag = "   <-- TRIM (%s)" % ", ".join(flags) if flags else ""
            label = next((a for nm, a, _ in slide["blocks"]
                          if nm == "headline"), "(title)")
            print("%2d. %-46s %2d words  %2d items%s"
                  % (n + 1, label[:46], words, nitems, flag))

    if check:
        print("\n%d slides.  budget: <=%d prose words (headline, eyebrow, punch,"
              " sub), <=%d scanned items." % (len(slides), PROSE_BUDGET, ITEM_BUDGET))
        return

    title = "Free the Database — Cambra @ Dagstuhl"
    tpl = TPL.read_text()
    doc = (tpl.replace("{{FONTS}}", FONTS.read_text())
              .replace("{{LOGOS}}", LOGOS.read_text())
              .replace("{{SLIDES}}", "\n".join(out))
              .replace("{{TITLE}}", title)
              .replace("{{RAIL}}", "Free the database"))  # the mark says Cambra
    OUT.write_text(doc)
    print("built %s — %d slides, %.1f KB" % (OUT.name, len(slides), len(doc) / 1024))


if __name__ == "__main__":
    main()
