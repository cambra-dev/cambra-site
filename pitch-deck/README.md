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

- **The operator graph is hidden by default.** The program is three endpoints and a feed running
  beside each other, so its graph is thousands of pixels wide and reads as a smear at slide scale.
  It is one gesture away rather than gone: `☰ Panes` in the inspector's header lists every pane with
  a checkbox, and re-checking the operator one (`post-conversion`) brings it back. `HIDDEN_PANES` in
  `CartDemo.vue` is what starts it hidden — no pane is hidden from CSS, because a pane hidden that
  way is unreachable.
- **The feed is the live Coinbase socket**, with the recorded slice behind it: 4,187 rows over 30
  minutes across 20 products, looping, armed by a four-second deadline that the first live price
  cancels. Click the status line at the foot of the order pad to switch between them by hand — an
  explicit choice retires the automatic fallback, so a presenter who asks for live keeps live.
- **The program is subscribed to three of the twenty.** The rest are greyed `not tracked` and are
  drawn from the page's own copy of the feed; the program never sees them, because
  `wasm_socket_subscribe` names three products and the page is what implements it.
- **Every cart figure comes from the program.** The panel divides by the 10⁸ price scale and
  formats, and converts base units to whole ones. The one exception is the subtotal — a handful of
  additions — for the reason `cart-v0.cambra`'s TODO gives.
- **The source pane is editable, and ⌘⏎ keeps the state.** That chord is `Program.reload`: the
  edited version compiles against the channels the program already has, takes over every operator
  whose computation is unchanged, and resumes every mutable variable from the value it held. The
  strip under the inspector says how many — `12 of 14 operators kept` — because an operator
  surviving an edit looks exactly like nothing having happened. ⌘⇧⏎ is `Program.compile` instead: a
  new program, nothing kept, the cart emptied. A version that will not compile changes neither: the
  inspector floats the rendered diagnostic over the source it points into, and the program that was
  running goes on running, at the generation the strip names.

### Two programs, while the rewrite lands

The program is being rewritten from four flat channels to three `wasm_serve` routes and a socket:
`PATCH /cart` sets a line, `PUT /checkout` spends the account's cash, `GET /cart` answers with the
cash, every line and every position in one reply, and `wasm_socket_subscribe` carries the quotes.
The route-shaped program is `public/wasm/cart.cambra` and is what the slide boots.

It does not compile yet — it needs a `for` inside `with begin():`, entry iteration over a
transactional map and a sink row carrying lists, all of which are being built in `cambra` — so the
four-channel program it replaces is kept beside it and is one query parameter away:

```
/11?cart=v0      the four-channel program: cart-v0.cambra, channels-v0.json
/11?cart=v1      the route-shaped one, which is the default
```

The parameter is read once, at load, so switching means a reload rather than a click; it selects a
program, its declarations, its pins and the stepper's increment together. A route the declarations
do not carry, or a program that does not compile, puts a fault on the order pad naming the escape
hatch rather than leaving a control that quietly does nothing.

`public/wasm/cart.cambra` and `channels.json` are a **provisional** copy of the v1 program from
`cambra`'s `demo_code_syntax.md`, so the deck has something route-shaped to boot, to show in the
inspector and to edit live. `scripts/sync-cambra.sh` replaces both the moment the compiler repo has
an `asset_cart/v1_single_line.cambra` — the version of the route-shaped app that compiles, holding
one cart line per account rather than a basket, which is what turns every read of the cart into a
keyed lookup. Two things about that version are worth knowing before it lands here: its prices
arrive on a plain declared source (`price_updates`, as the four-channel program's did) because
`wasm_socket_subscribe` is not built yet — the page resolves the price channel by elimination, so
the wiring does not care which — and its `GET /cart` reply carries one line rather than a list of
them, which the decode in `CartDemo.vue` will have to follow. The `-v0` pair is frozen here and never synced, since the compiler repo
is about to stop shipping a program of that shape. Delete the `flat` wiring in `CartDemo.vue`, the
`-v0` files and this section once the route-shaped program runs.

Nothing is fetched from a server at run time except the module, the program and the slice, all of
which are files in `public/`.

### Where the pieces live

| | |
|---|---|
| `demo/worker.ts` | owns the WebAssembly module and the tick loop, off the slide's paint |
| `demo/host.ts` | the page's side of the Worker: compile, reload, push, sinks, frames |
| `demo/feed.ts` | live Coinbase and the recorded slice, both emitting scaled-integer prices |
| `demo/transport.ts` | the one interface the panels talk to, and the route lookup behind it |
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

The demo slide runs from files in `public/`, not from a server. Most of them are committed — both
programs (`wasm/cart.cambra`, `wasm/cart-v0.cambra`), their channel declarations, and the 83 KB
price slice — so the deck builds and presents with no network.

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

It still builds the **four-channel** program — `scripts/build-artifact.mjs` reads `asset_cart/v0.cambra`
out of the `cambra` checkout and `scripts/artifact-template.html` spells the six channel names in its
own copy of the wiring, which is a copy and not a reuse of `demo/`. It follows the rewrite when
someone moves it, not before, and it is a page rather than a slide, so nothing in the deck depends
on that happening.

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
