# Dagstuhl gong show — "Free the database"

A 10-minute talk deck. `deck.md` is the source of truth; everything else compiles
it into a single self-contained HTML file.

## Editing

Edit `deck.md`, then:

```sh
python3 build.py            # -> deck.html
python3 build.py --check    # per-slide word/item budgets, writes nothing
python3 check_overflow.py   # -> overflow-report.png (needs Chrome)
```

`build.py` and `check_overflow.py` are **stdlib only** — no venv needed.

Open `deck.html` in a browser, or run `npm run dev` at the repo root and
visit `/talks/dagstuhl/`. `←`/`→` to move, `N` for speaker
notes, `G` for a grid overview, `T` to switch theme, `?` for keys.

## deck.md syntax

`---` starts a slide, `#` is the headline, `##` the eyebrow, and `%directive`
introduces a block. The full list is in the comment at the top of `deck.md`.

Two things that bite:

- **`#` inside `%code` is a CHL comment, not a heading.** Verbatim blocks end
  only at the next `%directive` or `---`.
- A bare line *directly* under a prose directive continues it; a bare line
  *after a blank line* becomes a `%lead` paragraph. Anything the parser can't
  attach prints a `WARNING: dropped line` — don't ignore those.

## Budgets

`--check` reports two numbers per slide, because they cost differently:

| | budget | why |
|---|---|---|
| prose words | ≤ 26 | sentences get *read*, which competes with the speaker |
| scanned items | ≤ 6 | rows/bullets cost a glance each |

Code, diagrams and tables are excluded — they're figures, not reading.

## Assets

The deck embeds everything as `data:` URIs, so it has **zero external
references** and renders identically offline on any machine.

| Generated | From | Regenerate with |
|---|---|---|
| `fonts.css` | `../../../CAMBRA BRAND/Typography/` + `vendor/` | `subset.py` |
| `logos.css` | `../../../public/brand/` | `make_logos.py` |

Only re-run those if the brand files change.

- `subset.py` needs `fonttools` and `brotli` (`pip install fonttools brotli`).
  It subsets each face to the glyphs the deck uses, and **synthesizes U+2218
  (∘)** — no Cambra brand face ships a ring operator, so without it the
  composition symbol falls back to whatever the presenting machine has.
- `vendor/` holds Space Mono, which isn't in `CAMBRA BRAND/` — the site loads it
  from Google Fonts, so the TTFs are vendored here for offline subsetting.
- The logos are embedded as CSS `background-image` rather than inline `<svg>`:
  the Illustrator exports all use generic `.st0`/`.st1` class names, so inlining
  two of them into one document collides. Backgrounds also let the theme swap
  the lockup with no JS.

## Publishing

`deck.html` is committed, and `src/pages/talks/[slug]/index.astro` wraps it in a
document head and serves it at `/talks/dagstuhl/`. The site build never runs
Python — rebuild and commit `deck.html` when the deck changes.

The abstract shown on `/talks` lives in `src/content/talks/dagstuhl.md`, which is
also where indexing is controlled. See the repo README's Talks section.

## Themes

The deck follows the presenting machine's `prefers-color-scheme`: abyssal (the
site's hero) or sand (its body sections). The brand lockup swaps with it —
`logo-horizontal-negative` on dark, the full-colour `logo-horizontal` on light.
**Check which theme you're in before presenting**; `T` forces the other.
