#!/usr/bin/env python3
"""Check the colours in a diagram against both GitHub themes at once.

    python3 check_contrast.py                # audit the documented palette
    python3 check_contrast.py fig.svg ...    # audit SVGs, text and graphics apart
    python3 check_contrast.py '#1C88A7' ...  # audit bare hex values

A diagram committed to a repository is read on GitHub's light theme by some
people and its dark theme by others, and it cannot tell which: an SVG referenced
as an image is a separate document, and the theme is an attribute on the host
page that it never sees.  Every colour therefore has to clear its threshold
against *both* backgrounds at once.

WCAG thresholds: 4.5:1 for normal text, 3:1 for large text and for graphical
objects such as strokes and boxes.

There is a ceiling on the first of those, and it is why this script does not
simply test for 4.5.  Equalising contrast against #ffffff and #0d1117 peaks
near 4.35:1, so *no* colour clears 4.5 on both themes — normal-size text in a
dual-theme diagram cannot reach AA at all.  Text is therefore graded against
what is actually achievable: below 3:1 is a failure, and anything short of the
ceiling is a warning saying how much contrast is being left unclaimed.  The
ways to close that last gap are to promote the label into the large-text
bracket, where 3:1 applies, or to leave the colour to the strokes and set the
text in the neutral.

Stdlib only, matching the other scripts in this repository.
"""

import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

LIGHT = "#ffffff"  # GitHub light canvas
DARK = "#0d1117"  # GitHub dark canvas

AA_TEXT = 4.5
AA_LARGE = 3.0  # also the threshold for graphical objects

# Large text per WCAG: >=24px, or >=18.66px when bold.
LARGE_PX = 24.0
LARGE_PX_BOLD = 18.66

# How close to the achievable ceiling a text colour must sit to pass unremarked.
CEILING_SLACK = 0.10

# The palette this repository's diagrams are drawn from.  Ratios are measured on
# every run rather than hardcoded, so editing a token shows up here immediately.
DIAGRAM_PALETTE = {
    "ocean (shared / v0)": "#1C88A7",
    "ember (divergent / v1)": "#D75A2E",
    "neutral (labels)": "#6B7A8A",
}

HEX_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")

GRAPHIC, TEXT, TEXT_LARGE = "graphic", "text", "text-large"


def _expand(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return h


def _linear(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(hex_colour):
    h = _expand(hex_colour)
    r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * _linear(r) + 0.7152 * _linear(g) + 0.0722 * _linear(b)


def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def dual_ceiling():
    """The best contrast any single colour can hold against both themes.

    At the luminance where the two ratios are equal, the worse of them is
    maximised; solving (L + 0.05)^2 = 1.05 * (L_dark + 0.05) gives that point.
    """
    ld = luminance(DARK)
    return ((1.05 * (ld + 0.05)) ** 0.5) / (ld + 0.05)


CEILING = dual_ceiling()


def grade(colour, kind):
    """Return (worst_ratio, verdict, note). Verdict is ok / warn / FAIL."""
    lo, dk = contrast(colour, LIGHT), contrast(colour, DARK)
    worst = min(lo, dk)
    if kind == TEXT:
        if worst < AA_LARGE:
            return lo, dk, "FAIL", f"under {AA_LARGE:g}:1; unreadable on one theme"
        if worst < CEILING - CEILING_SLACK:
            gap = CEILING - worst
            return lo, dk, "warn", f"{gap:.2f} below the {CEILING:.2f} ceiling"
        return lo, dk, "ok", f"at the {CEILING:.2f} ceiling; AA {AA_TEXT} unreachable"
    # Graphics and large text share the 3:1 threshold, which is reachable.
    if worst < AA_LARGE:
        return lo, dk, "FAIL", f"under {AA_LARGE:g}:1"
    return lo, dk, "ok", ""


def report(entries):
    """entries: list of (label, hex, kind). Returns (failures, warnings)."""
    width = max(len(e[0]) for e in entries)
    print(f"{'':{width}}  {'hex':9}{'light':>7}{'dark':>7}  verdict")
    failures = warnings = 0
    for label, colour, kind in entries:
        lo, dk, verdict, note = grade(colour, kind)
        if verdict == "FAIL":
            failures += 1
        elif verdict == "warn":
            warnings += 1
        tail = f"  {note}" if note else ""
        print(f"{label:{width}}  {colour:9}{lo:7.2f}{dk:7.2f}  {verdict}{tail}")
    return failures, warnings


def _strip_ns(tag):
    return tag.rsplit("}", 1)[-1]


def _is_large(el):
    try:
        size = float(el.get("font-size", "0"))
    except ValueError:
        return False
    weight = (el.get("font-weight") or "").strip()
    bold = weight in {"bold", "bolder"} or (weight.isdigit() and int(weight) >= 700)
    return size >= (LARGE_PX_BOLD if bold else LARGE_PX)


def scan_svg(path):
    """Collect (label, hex, kind) for every explicit colour the SVG sets."""
    root = ET.parse(path).getroot()
    seen = {}
    for el in root.iter():
        tag = _strip_ns(el.tag)
        for attr in ("fill", "stroke"):
            value = (el.get(attr) or "").strip()
            if not HEX_RE.match(value):
                continue  # skips "none", named colours, url(#...) references
            if tag == "text":
                # Large text shares the 3:1 threshold with graphics, and unlike
                # normal text that threshold is actually reachable.
                large = _is_large(el)
                kind = GRAPHIC if large else TEXT
                role = "text (large)" if large else "text"
            else:
                kind, role = GRAPHIC, f"{tag} {attr}"
            key = (value.lower(), role, kind)
            seen[key] = seen.get(key, 0) + 1
    return [
        (f"{role} x{count}", colour, kind)
        for (colour, role, kind), count in sorted(seen.items())
    ]


def main(argv):
    args = argv[1:]
    failures = warnings = 0

    if not args:
        print("Documented diagram palette, against both GitHub themes:\n")
        entries = [(name, colour, GRAPHIC) for name, colour in DIAGRAM_PALETTE.items()]
        f, w = report(entries)
        failures += f
        warnings += w
        print("\n(Graded as graphics. The same colours used for text are graded")
        print(" against the ceiling instead — run this over an actual SVG.)")
    else:
        for arg in args:
            if HEX_RE.match(arg):
                f, w = report([(arg, arg, TEXT)])
                failures += f
                warnings += w
                continue
            path = Path(arg)
            if not path.exists():
                print(f"{arg}: no such file", file=sys.stderr)
                failures += 1
                continue
            print(f"\n{path}:")
            entries = scan_svg(path)
            if not entries:
                print("  no explicit hex colours found")
                continue
            f, w = report(entries)
            failures += f
            warnings += w

    print(
        f"\nCeiling: no colour holds better than {CEILING:.2f}:1 against both "
        f"{LIGHT} and {DARK}."
    )
    summary = []
    if failures:
        summary.append(f"{failures} failure(s)")
    if warnings:
        summary.append(f"{warnings} warning(s)")
    print("; ".join(summary) if summary else "All colours clear their thresholds.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
