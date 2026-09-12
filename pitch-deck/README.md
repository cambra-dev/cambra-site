# The seed pitch deck

Slidev. Presented from a laptop, not hosted.

```bash
npm install
scripts/sync-cambra.sh   # builds the blobs that are not committed
npm run dev              # opens the deck; the demo slide is /11
```

`npm run dev` serves on `localhost:3030` by default and opens a browser. Press `o` for the overview,
`p` for presenter mode; the demo slide's speaker notes carry its script.

**Re-run `scripts/sync-cambra.sh` after every `cambra` change you want the demo to show.** The
module and the inspector bundle are built from that checkout, not fetched, and nothing warns when
they are behind it — a stale pair simply demonstrates an older compiler, correctly and silently.
Neither blob is committed, so `git status` does not show one going stale either.

## The demo slide

Slidev's `/11` today. The number moves whenever a slide is added ahead of it, so everything else
here names the slide rather than counting it — and a number that has been wrong in three files at
once is the reason.

One Cambra program, compiled to WebAssembly **in the page** and running while the slide is open. The
left panel is the program inspector — its source above the values flowing through it, stacked so
each pane gets the full width. The right panel, and the larger half of the slide, is the app: a
light surface against the inspector's navy, so the slide reads as the tool beside the thing it runs.

- **The operator graph is hidden by default.** `cart.cambra` is three parallel sinks, so its graph
  is thousands of pixels wide and reads as a smear at slide scale. It is one gesture away rather
  than gone: `☰ Panes` in the inspector's header lists every pane with a checkbox, and re-checking
  the operator one (`post-conversion`) brings it back. `HIDDEN_PANES` in `CartDemo.vue` is what
  starts it hidden — no pane is hidden from CSS, because a pane hidden that way is unreachable.
- **The feed replays a recorded Coinbase slice** at the rate it was captured: 4,187 rows over 30
  minutes across 20 products, looping. Click the status line at the foot of the order pad to switch
  to the live Coinbase socket, and again to go back.
- **The program tracks three of the twenty.** The rest are greyed `not tracked`; they still reach
  the program, because the ingest filter rejecting them is the thing being shown.
- **Every cart figure comes from the program.** The panel divides by the 10⁸ price scale and
  formats. The one exception is the subtotal — three additions — for the reason `cart.cambra`'s
  TODO gives.

Nothing is fetched from a server at run time except the module, the program and the slice, all of
which are files in `public/`.

### Where the pieces live

| | |
|---|---|
| `demo/worker.ts` | owns the WebAssembly module and the tick loop, off the slide's paint |
| `demo/host.ts` | the page's side of the Worker, and the journal |
| `demo/feed.ts` | replay and live Coinbase, both emitting scaled-integer prices |
| `demo/transport.ts` | the one interface the panels talk to |
| `components/CartDemo.vue` | wires them together; owns the host in module scope |
| `components/AssetCart.vue` | the app panel: prices beside the order, on a light surface |
| `components/ProgramInspector.vue` | the inspector, as a `srcdoc` frame with an injected snapshot, frame stream and skin |

### Restyling the inspector without rebuilding it

`public/inspector/index.html` is a generated blob, and the deck never edits it. The frame is
`srcdoc`, same-origin and carries no CSP, so `ProgramInspector.vue` takes a `skin` prop — CSS text
— and appends it to the frame's head after the bundle is written. The bundle's own stylesheet is
the last element in its head, so the skin wins ties on order alone; only CodeMirror, whose base
theme is generated at run time and inserted at the top of the head, needs `!important`.

`INSPECTOR_SKIN` in `CartDemo.vue` is that CSS, and it is the one place the deck reaches into a
bundle it does not own: it stacks the panes vertically, raises the inspector's contrast (its own
dark palette is a 1.47:1 border, which disappears on a projector) and moves it into the deck's
navy. Every rule names the class it targets and what it is defeating. A `cambra` rebuild that
renames a class silently drops the corresponding rule, so check the skin after a
`scripts/sync-cambra.sh`.

### The artifacts

The demo slide runs from files in `public/`, not from a server. Most of them are committed — the program
(`wasm/cart.cambra`), its channel declarations, and the 83 KB price slice — so the deck builds and
presents with no network.

**Three generated blobs are not committed**, each being over `jj`'s 1 MiB snapshot limit. All three
are reproducible from a `cambra` checkout, so nothing here needs to be handed between machines:

| | | |
|---|---|---|
| `public/wasm/cambra_bg.wasm` | 2.4 MB | the WebAssembly module the demo slide loads |
| `public/inspector/index.html` | 1.8 MB | the inspector bundle, copied from `cambra`'s `web/dist/` |
| `artifact/cambra-demo.html` | 6.9 MB | the standalone page, built last and only when it is wanted |

A fresh clone runs the sync script once before the demo will start:

```bash
scripts/sync-cambra.sh                 # assumes ../../cambra and ../../vault
scripts/sync-cambra.sh /path/to/cambra /path/to/vault
```

It needs a Rust toolchain, `npm`, and `wasm-bindgen-cli` at the version `cambra`'s `Cargo.lock`
resolved — none of which the deck needs again once the artifacts exist. That lock is not itself
committed (`cambra` is a library), so the version to match is the one a first `cargo build` writes;
`cambra/scripts/build-wasm.sh` reads it out and names it if the CLI is missing.

The pins in `CartDemo.vue` are source line numbers in `cart.cambra`; check them if the program's
lines moved. A pin that no longer names an operator is skipped rather than reported, so a stale one
costs a pinned group and not an error in front of an audience.

### Which `cambra` revision

The demo's compiler-side work is not landed. Both scripts build against the head of the `demo/*`
stack, which this names:

```bash
jj log -r 'heads(demo/05-wasm-build:: & bookmarks())'   # the revision the deck expects
jj bookmark list 'glob:demo/*'                          # the whole stack, for context
```

`& bookmarks()` is load-bearing: an empty working-copy commit sitting above the stack is a head
too, and without it the query names that instead of the tip of the work.

Read the head off the query rather than off the bookmark names. The numbers in them are part of a
slug, not a stack position, and the stack has been reordered more than once.

`scripts/build-artifact.mjs` builds the `wasm-release` profile, which `demo/05-wasm-build` adds.
Below that commit it stops on ``profile `wasm-release` is not defined``. An older revision of the
stack called the profile `wasm-fast`; a checkout carrying that name predates
`demo/05-wasm-build` and is too old for either script.

### The standalone artifact

`artifact/cambra-demo.html` is the demo slide as one self-contained page: the module, the program, the
inspector and the price slice are all base64 inside the document, so it runs with no origin serving
anything. It is what gets sent to someone who is not in the room.

```bash
node scripts/build-artifact.mjs                                    # -> artifact/cambra-demo.html
node scripts/build-artifact.mjs out.html /path/to/cambra
```

It builds its own copy of the module — the `wasm-fast` profile, and `wasm-bindgen --target
no-modules` rather than the deck's `--target web` — so it cannot reuse what is already in
`public/wasm/`. It does reuse `public/inspector/index.html` and the price slice, which means
`scripts/sync-cambra.sh` has to have run first.

The live Coinbase toggle is not in this build: a published page cannot open a socket to Coinbase, so
the toggle would be a control that silently did nothing. The recorded slice is what it replays.

## Exporting

```bash
npm run export       # PDF, via playwright-chromium
```

The demo slide waits on `[data-waitfor=".cart-demo"]`, so the export blocks until the demo has
mounted.
