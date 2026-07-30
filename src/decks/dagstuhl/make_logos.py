#!/usr/bin/env python3
"""Generate logos.css: the Cambra marks as data-URI CSS variables.

    python3 make_logos.py     # -> logos.css

Embedded as background-image data URIs rather than inlined <svg>, for two
reasons: the Illustrator exports all use generic .st0/.st1 class names, so
inlining two of them into one document collides; and background-image lets the
theme swap the mark with no JS and no duplicated payload.
"""
import base64
import re
from pathlib import Path

HERE = Path(__file__).parent
# Repo-relative: this script lives at <repo>/src/decks/<slug>/.
BRAND = HERE.parents[2] / "public" / "brand"
OUT = HERE / "logos.css"

# negative = white wordmark, for the abyssal ground.
# horizontal = the principal full-colour lockup, for the sand ground.
# symbol = the mark alone; legible on either ground, so it needs no variant.
WANT = {
    "--logo-neg": "logo-horizontal-negative.svg",
    "--logo-pos": "logo-horizontal.svg",
    "--mark": "symbol.svg",
}


def minify(svg):
    svg = re.sub(r"<\?xml[^>]*\?>", "", svg)
    svg = re.sub(r"<!--.*?-->", "", svg, flags=re.S)
    # The Illustrator <foreignObject> is inert; <switch> then picks the <g>.
    svg = re.sub(r"<foreignObject.*?</foreignObject>", "", svg, flags=re.S)
    svg = re.sub(r">\s+<", "><", svg)
    svg = re.sub(r"\s{2,}", " ", svg)
    return svg.strip()


def main():
    lines, total = [], 0
    for var, fname in WANT.items():
        src = BRAND / fname
        if not src.exists():
            raise SystemExit("missing brand asset: %s" % src)
        data = minify(src.read_text())
        b64 = base64.b64encode(data.encode()).decode()
        total += len(b64)
        lines.append('  %s: url("data:image/svg+xml;base64,%s");' % (var, b64))
        print("%-12s %-32s %6.1f KB b64" % (var, fname, len(b64) / 1024))

    css = "\n".join([
        ":root {",
        *lines,
        "  --logo: var(--logo-neg);",
        "}",
        "@media (prefers-color-scheme: light) { :root { --logo: var(--logo-pos) } }",
        ':root[data-theme="light"] { --logo: var(--logo-pos) }',
        ':root[data-theme="dark"]  { --logo: var(--logo-neg) }',
    ])
    OUT.write_text(css)
    print("\nwrote %s — %.1f KB" % (OUT.name, len(css) / 1024))


if __name__ == "__main__":
    main()
