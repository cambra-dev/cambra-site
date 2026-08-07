#!/usr/bin/env python3
"""Verify that copies of the brand tokens still match their source.

    python3 check_tokens.py     # exits non-zero if any copy has drifted

`src/styles/global.css` is the source of truth for the palette.  Anything that
cannot import it has to restate the values, and a restated value is a value
that can rot silently: the copy keeps rendering, just in the wrong colour.  The
deck is the standing example — it carries its own `:root` block with a comment
pointing back at `global.css`, and nothing until now checked that the pointer
was still true.

Add a row to COPIES when something else restates the palette.  A token in a
copy with no entry in the map is reported as unmapped rather than ignored, so
that a new token cannot quietly escape the check.

Stdlib only, matching the other scripts in this repository.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "src/styles/global.css"

# copy path -> {token name in the copy: token name in global.css}
COPIES = {
    ROOT
    / "src/decks/dagstuhl/deck.html": {
        "abyssal": "color-abyssal",
        "deep-sea": "color-deep-sea",
        "ocean": "color-ocean",
        "lagoon": "color-lagoon",
        "san-blas": "color-san-blas",
        "ember": "color-ember",
        "coral": "color-coral",
        "amber": "color-amber",
        "sand": "color-sand",
        "soft-sand": "color-bg",
        "muted": "color-muted",
        "c-fg": "astro-code-foreground",
        "c-cm": "astro-code-token-comment",
    },
}

# Tokens in a copy that are deliberately local — a value the source does not
# define, rather than a copy of one it does.
LOCAL_ONLY = {
    "bg", "bg-2", "fg", "fg-2", "fg-3", "line", "line-2",
    "cool", "warm", "hot", "code-bg", "f-mono", "f-body",
}

DECL = re.compile(r"--([a-zA-Z0-9-]+)\s*:\s*([^;{}]+?)\s*;")


def declarations(path):
    """Every `--name: value` in the file, last definition winning."""
    out = {}
    for name, value in DECL.findall(path.read_text(encoding="utf-8")):
        out[name] = value.strip()
    return out


def resolve(value, table, depth=0):
    """Follow `var(--x)` indirection so a copy can be compared to a literal."""
    if depth > 8:
        return value
    m = re.fullmatch(r"var\(\s*--([a-zA-Z0-9-]+)\s*\)", value.strip())
    if m and m.group(1) in table:
        return resolve(table[m.group(1)], table, depth + 1)
    return value.strip()


def normalise(value):
    v = value.strip().lower()
    if re.fullmatch(r"#[0-9a-f]{3}", v):
        v = "#" + "".join(c * 2 for c in v[1:])
    return v


def main():
    if not SOURCE.exists():
        print(f"source not found: {SOURCE}", file=sys.stderr)
        return 2
    source = declarations(SOURCE)
    problems = 0

    for copy_path, mapping in COPIES.items():
        rel = copy_path.relative_to(ROOT)
        if not copy_path.exists():
            print(f"{rel}: missing", file=sys.stderr)
            problems += 1
            continue
        copy = declarations(copy_path)
        print(f"{rel}  ({len(mapping)} mapped token(s))")

        for local, upstream in sorted(mapping.items()):
            if local not in copy:
                print(f"  --{local}: not defined in the copy any more")
                problems += 1
                continue
            if upstream not in source:
                print(f"  --{local}: source has no --{upstream}")
                problems += 1
                continue
            got = normalise(resolve(copy[local], copy))
            want = normalise(resolve(source[upstream], source))
            if got != want:
                print(f"  --{local}: {got} but --{upstream} is {want}")
                problems += 1

        unmapped = sorted(set(copy) - set(mapping) - LOCAL_ONLY)
        # A copy's own derived tokens are fine; flag only what looks like a
        # palette value, so a new brand colour cannot slip in unchecked.
        suspicious = [t for t in unmapped if normalise(resolve(copy[t], copy)).startswith("#")]
        for token in suspicious:
            print(f"  --{token}: unmapped literal {normalise(resolve(copy[token], copy))}")
            problems += 1

    if problems:
        print(f"\n{problems} problem(s). Update the copy, or the map in this script.")
        return 1
    print("\nAll mapped tokens match their source.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
