import base64, io, math, os
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen


def add_ring(font, codepoint=0x2218, sides=28):
    """Synthesize a RING OPERATOR. No Cambra brand face ships one, and the deck
    uses it for function composition, so without this the glyph falls back to
    whatever the presenting machine happens to have — or to tofu."""
    have = set()
    for t in font["cmap"].tables:
        have |= set(t.cmap.keys())
    if codepoint in have:
        return False

    upem = font["head"].unitsPerEm
    cy, R, th = 0.30 * upem, 0.150 * upem, 0.052 * upem

    glyf, hmtx = font["glyf"], font["hmtx"]
    ref = next((c for c in ("x", "o", "period", "space") if c in glyf.glyphs), None)
    adv = hmtx.metrics[ref][0] if ref else int(0.5 * upem)
    if not adv:
        adv = int(0.5 * upem)
    cx = adv / 2

    # A 28-gon is indistinguishable from a circle at 13-21px, and needs no
    # quadratic-curve fitting. Opposite winding on the inner ring cuts the hole.
    pen = TTGlyphPen(None)
    for radius, ccw in ((R, True), (R - th, False)):
        pts = []
        for i in range(sides):
            a = 2 * math.pi * i / sides
            if not ccw:
                a = -a
            pts.append((round(cx + radius * math.cos(a)),
                        round(cy + radius * math.sin(a))))
        pen.moveTo(pts[0])
        for p in pts[1:]:
            pen.lineTo(p)
        pen.closePath()

    name = "uni2218"
    glyf.glyphs[name] = pen.glyph()
    hmtx.metrics[name] = (adv, 0)
    font.setGlyphOrder(list(font.getGlyphOrder()) + [name])
    glyf.glyphOrder = font.getGlyphOrder()
    font["maxp"].numGlyphs = len(font.getGlyphOrder())
    for t in font["cmap"].tables:
        t.cmap[codepoint] = name
    return True

HERE = os.path.dirname(os.path.abspath(__file__))
# Repo-relative: this script lives at <repo>/src/decks/<slug>/.
BRAND = os.path.join(HERE, "..", "..", "..", "CAMBRA BRAND", "Typography")
VENDOR = os.path.join(HERE, "vendor")

FACES = [
    ("Fredoka",       600, f"{BRAND}/Fredoka-Logo font/static- to install/Fredoka-SemiBold.ttf"),
    ("SpaceGrotesk",  700, f"{BRAND}/Space Grotesk- Secodary font/static- to install/SpaceGrotesk-Bold.ttf"),
    ("SpaceGrotesk",  500, f"{BRAND}/Space Grotesk- Secodary font/static- to install/SpaceGrotesk-Medium.ttf"),
    ("Montserrat",    400, f"{BRAND}/Montserrat- Primary font/static- to install/Montserrat-Regular.ttf"),
    ("Montserrat",    600, f"{BRAND}/Montserrat- Primary font/static- to install/Montserrat-SemiBold.ttf"),
    ("SpaceMono",     400, f"{VENDOR}/SpaceMono-Regular.ttf"),
    ("SpaceMono",     700, f"{VENDOR}/SpaceMono-Bold.ttf"),
]

# Basic latin + punctuation + the symbolic notation the deck uses.
EXTRA = [
    0x00A0, 0x00B7, 0x00D7, 0x2009, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D,
    0x2022, 0x2026, 0x2190, 0x2191, 0x2192, 0x2193, 0x21D2, 0x2205, 0x2264, 0x2265,
    0x226B, 0x2295, 0x2713, 0x25AA, 0x25B7, 0x25B8, 0x25C6, 0x25C7, 0x03BB, 0x2261,
    0x2218, 0x25E6, 0x00B0,
] + list(range(0x2080, 0x208A))

UNI = set(range(0x20, 0x7F)) | set(EXTRA)

results = []
for family, weight, path in FACES:
    if not os.path.exists(path):
        print("MISSING", path)
        continue
    font = TTFont(path)
    synthesized = add_ring(font)
    have = set()
    for table in font["cmap"].tables:
        have |= set(table.cmap.keys())
    keep = UNI & have
    missing = sorted(c for c in EXTRA if c not in have)

    opts = subset.Options()
    opts.layout_features = ["kern", "liga", "calt"]
    opts.drop_tables += ["DSIG"]
    opts.notdef_outline = True
    opts.recalc_bounds = True
    opts.flavor = "woff2"
    subsetter = subset.Subsetter(options=opts)
    subsetter.populate(unicodes=keep)
    subsetter.subset(font)

    buf = io.BytesIO()
    font.flavor = "woff2"
    font.save(buf)
    raw = buf.getvalue()
    b64 = base64.b64encode(raw).decode("ascii")
    results.append((family, weight, b64, len(raw)))
    print(f"{family}-{weight}: {len(raw)/1024:.1f} KB woff2"
          f"{'  +synthesized U+2218' if synthesized else ''}, "
          f"missing={[hex(m) for m in missing]}")

css = []
for family, weight, b64, _ in results:
    css.append(
        "@font-face{font-family:'%s';font-style:normal;font-weight:%d;font-display:block;"
        "src:url(data:font/woff2;base64,%s) format('woff2')}" % (family, weight, b64)
    )
out = "\n".join(css)
open(f"{HERE}/fonts.css", "w").write(out)
print(f"\nTOTAL fonts.css: {len(out)/1024:.1f} KB")
