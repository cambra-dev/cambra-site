# The seed pitch deck

Slidev. Presented from a laptop, not hosted.

```bash
npm install
scripts/sync-cambra.sh   # builds the blobs that are not committed
npm run check:wasm       # both programs compile, and one reloads onto the other
npm run check:slide      # the slide boots, serves every product and upgrades
npm run dev              # opens the deck; the demo slide is /11
```

`npm run dev` serves on `localhost:3030` by default and opens a browser. Press `o` for the overview,
`p` for presenter mode; the demo slide's speaker notes carry its script.

**Re-run `scripts/sync-cambra.sh` after every `cambra` change you want the demo to show.** The
module and the inspector bundle are built from that checkout, not fetched, and nothing warns when
they are behind it — a stale pair simply demonstrates an older compiler, correctly and silently.
Neither blob is committed, so `git status` does not show one going stale either.

**Then run the two checks.** `npm run check:wasm` compiles both programs in the module the sync
just built, reloads one onto the other and checks that the state crossed; `npm run check:slide`
starts Slidev, drives the demo slide in a browser and checks what the presenter will see. Between
them they cover the two ways a sync breaks the demo without saying so: a program the module now
refuses, and a reply shape the panel no longer decodes.

## The demo slide

Slidev's `/11` today. The number moves whenever a slide is added ahead of it, so everything else
here names the slide rather than counting it — and a number that has been wrong in three files at
once is the reason.

One Cambra program, compiled to WebAssembly **in the page** and running while the slide is open. The
left panel is the program inspector — the program's source, and under it a strip of controls. The
right panel, and the larger half of the slide, is the app: a light surface against the inspector's
navy, so the slide reads as the tool beside the thing it runs.

- **The slide opens on the source alone.** Values, the six IR stages and the operator graph are all
  hidden — `HIDDEN_PANES` in `CartDemo.vue` — and each is one gesture away rather than gone: `☰
  Panes` in the inspector's header lists every pane with a checkbox. No pane is hidden from CSS,
  because a pane hidden that way is unreachable.
  - **Values is hidden but still pinned.** The bundle wires its reveal callback after it applies
    pins, so a pin does not force the pane open at boot the way a click on the source does. Opening
    it mid-demo therefore shows the two pinned groups already filling rather than an empty pane.
  - **The operator graph** is the best answer to "what did the compiler actually do", and it is out
    for a different reason: the program is three endpoints and a feed running beside each other, so
    its graph is thousands of pixels wide and reads as a smear at slide scale.
- **Provenance marks are off, and on a toggle.** `provenance off` on the strip turns on the marks
  the source pane paints over the spans a selection resolves to. They answer "where did this
  operator come from", which is a reader's question rather than an audience's, and they land on the
  one pane the whole room is reading. The rules live in `INSPECTOR_SKIN`; `ProgramInspector` puts a
  `no-provenance` class on the frame's root.

  The toggle reads `provenance n/a` and is disabled whenever the pane holds something the compiler
  has not seen — a staged version, or the reader's own typing. The marks name the operators the
  *compiled* program was built from, so over uncompiled source they point at lines confidently and
  wrongly.
- **The feed is the live Coinbase socket**, with the recorded slice behind it: 4,187 rows over 30
  minutes across 20 products, looping, armed by a four-second deadline that the first live price
  cancels. Click the status line at the foot of the order pad to switch between them by hand — an
  explicit choice retires the automatic fallback, so a presenter who asks for live keeps live.
- **The tracked products are the program's own.** Both versions declare `wasm_socket_subscribe` with
  the products they serve, and the panel reads that list back off the compiled program — at boot and
  again after every accepted reload — rather than being kept in step with it by hand. So v1 tracks
  BTC and LTC, v2 tracks those and ETH, and the panel grows a row the instant the upgrade lands.
  The other rows are greyed `not tracked` and are drawn from the page's own copy of the feed; the
  program never sees them. `SUBSCRIBED` in `demo/feed.ts` is only the floor, for the moment before
  the first `subscriptions()` read.
- **Every cart figure comes from the program.** The panel divides by the 10⁸ price scale and
  formats, and converts base units to whole ones. The one exception is the subtotal — a handful of
  additions — for the reason `cart-v0.cambra`'s TODO gives.
- **A version the compiler refuses is underlined where it went wrong.** The report is thrown with
  the same `Diagnostic`s a snapshot carries, so the pane marks the spans they name and a hover gives
  the message. The program that was running goes on running, and the strip says at which generation.
  A rejection with no span to point at still falls back to a banner.
- **The source pane is editable, and ⌘⏎ keeps the state.** That chord is `Program.reload`: the
  edited version compiles against the channels the program already has, takes over every operator
  whose computation is unchanged, and resumes every mutable variable from the value it held. The
  strip under the inspector says how many — `12 of 14 operators kept` — because an operator
  surviving an edit looks exactly like nothing having happened. ⌘⇧⏎ is `Program.compile` instead: a
  new program, nothing kept, the cart emptied. A version that will not compile changes neither: the
  inspector floats the rendered diagnostic over the source it points into, and the program that was
  running goes on running, at the generation the strip names.
- **`v1` and `v2` on the strip change what the pane shows. They compile nothing.** Both programs are
  fetched at boot, so a press is instant, and the press puts that version's source in the editor and
  stops there: the room reads the program before it runs, and the strip says `v2 shown · not
  compiled` until someone asks for it. ⇧U is the same act as pressing `v2`.

  **`Reload` is what compiles**, always — the editor's text, whether that is a staged version or
  something typed by hand. The two directions are not symmetric, and the asymmetry is the point:
  - **`v2` reloads and keeps the state.** v2 declares `cart_rescaled` and `holdings_rescaled` with
    `@LoadFrom` over v1's `cart` and `holdings`, so the swap says where every value goes: the cart
    the presenter filled survives it, and the strip's tally is the evidence.
  - **`v1` compiles a new program**, because the reload back is refused — *"`cart_rescaled` is no
    longer declared … a value carries forward into the same variable at the same type, or into what
    a `@LoadFrom` reads it into, and only where the source says which variable it belongs to."* v1
    says nothing about where the reshaped collections' values belong, so there is nowhere to put
    them. Going back is starting the demo over, and the emptied cart is the honest sign of it.

  The strip's `Reload` and `from scratch` press the editor's own chords, by dispatching them into
  the frame: the source that matters is the one in CodeMirror, and CodeMirror renders only the lines
  in view, so there is no honest way to read the document out of the DOM. Putting a version *into*
  the editor is the mirror of that — `onEditor` in the inspector's injected-host contract, which
  hands the page a `setSource`. Without it the only way text reaches the pane is a compile, which is
  exactly the swap these controls exist not to make.

### The two programs

The slide runs two programs over one set of channels, all three files the deck's own:

| | |
|---|---|
| `public/wasm/cart.cambra` | v1 — one divisor for every asset, BTC and LTC listed |
| `public/wasm/cart-v2.cambra` | v2 — a divisor per asset, and ETH listed as well |
| `public/wasm/channels.json` | the three routes and the price source, which both serve |

They are written against the compiler rather than copied out of its test gallery, so
`scripts/sync-cambra.sh` leaves them alone and `npm run check:wasm` is what says whether the module
it just built still takes them. There are no comments in either file: the source pane is what a room
reads, and a header written for a maintainer is thirty lines of prose in front of the program.

One channel file, because the upgrade serves the same routes at the same row types — which is what
makes it a reload rather than a second program. `PATCH /cart` sets the account's line, `PUT
/checkout` spends its cash, and `GET /cart` answers with the cash, the line and the position behind
it in one reply, pinned to one commit snapshot. `wasm_socket_subscribe` binds the price source and
names the products, which is where the panel's tracked rows come from.

**What changes between them.** ETH's base unit is the gwei and BTC's is the satoshi, so one shared
`one_coin` cannot price both — which is why v1 lists neither ETH nor anything else whose base unit
differs. v2 carries a `scale` on every line instead, so `cart` and `holdings` change shape, are
declared under new names, and are seeded from what v1 held through `@LoadFrom`. Nothing v1 held
changes value across the swap: BTC and LTC are 10⁸ in both versions. What the upgrade buys is an
asset v1 could not have priced.

**The cart holds one line per account.** A second `PATCH /cart` replaces the line rather than adding
to it, so the panel shows one row and one holding at a time: `GET /cart` reads
`holdings[(account, line.ticker)]`, and answering with every position an account holds is an
iteration over the cart's entries, which is the read this shape traded away for keyed lookups.

**Every collection is seeded for every product either version lists**, including the ETH holdings v1
does not trade. Each route reads its collections at a key and `m[k]` faults on an absent key, so a
product the program holds no entry for is a panic the moment a presenter presses it — and a panic
poisons the module for the rest of the slide. v1 seeding ETH at zero is what lets v2 serve it the
instant the swap lands.

**`Balance` is refined** — `{Microcents where _ >= 0}` — and the checkout's debit is `cash ^- due`,
the subtraction that records its difference, so the write is typed
`{Microcents | __elem == cash ^- due}` and the `cash >= due` guard is what discharges `__elem >= 0`.
Weaken the guard and the program does not compile; `npm run check:wasm` makes that claim, because a
program that kept the declaration and lost the check would pass every other one.

That refinement runs **in the browser**, which it could not until recently: refinement subtyping
discharges its queries to a solver, and the solver used to be `z3` spawned over a pipe. wasm32 opens
no pipe, so the module panicked at compile on any refinement it could not settle structurally. The
compiler now links a pure-Rust solver in (`cambra`'s `ci.sh wasm` is the gate that keeps it
reachable), and the module is about 1.4 MB larger for it.

#### The four-channel program, at `?cart=v0`

`cart-v0.cambra` and `channels-v0.json` are the shape the routes replaced: one price source, one
cart source, a view request and a sink per ticker. They are frozen here and never synced, because
the compiler repo no longer ships a program of that shape.

```
/11?cart=v0      the four-channel program: cart-v0.cambra, channels-v0.json
/11              the route-shaped pair, which is the default
```

The parameter is read once, at load, so switching means a page reload rather than a click; it
selects a program, its declarations, its pins and the stepper's increment together. A route the
declarations do not carry puts a fault on the order pad naming the escape hatch, rather than leaving
a control that quietly does nothing. Delete the `flat` wiring in `CartDemo.vue`, the `-v0` files and
this subsection when nothing needs the old shape.

Nothing is fetched from a server at run time except the module, the programs and the slice, all of
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
| `public/wasm/cart.cambra`, `cart-v2.cambra` | the two programs, and the deck's own |
| `scripts/sync-cambra.sh` | rebuilds the module and the inspector bundle out of a `cambra` checkout |
| `scripts/check-wasm-cart.mjs` | drives both programs through the module: compile, reload, migrate |
| `scripts/check-slide.mjs` | drives the slide in a browser: boot, both versions, the strip, a refusal, checkout |

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

The demo slide runs from files in `public/`, not from a server. Most of them are committed — all
three programs (`wasm/cart.cambra`, `wasm/cart-v2.cambra`, `wasm/cart-v0.cambra`), their channel
declarations, and the 83 KB price slice — so the deck builds and presents with no network.

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
lines moved, which a copied program's do whenever its prose does. A position that no longer names an
operator is skipped rather than reported, so a stale pin costs a pinned group and not an error in
front of an audience — and a pin has to name a position the compiler built an operator *from*: the
reply pin is the record itself rather than the `view_replies <<` above it, because `channelize`
erases the feed write.

Pins are applied when the inspector mounts and are not re-resolved by a reload, so the values pane
empties after ⇧U: the upgrade rebuilds the operators those pins named, and the new version's lines
are not the old version's. The source and IR panes do follow the swap.

### Which `cambra` revision

The demo's compiler-side work is not landed. Both scripts build against
`skylar/asset-cart-loadfrom-upgrade`, which is the bookmark that carries the `@LoadFrom` upgrade
path and the pure-Rust refinement solver the browser build needs:

```bash
jj log -r skylar/asset-cart-loadfrom-upgrade     # the revision the deck expects
jj bookmark list 'glob:demo/*'                   # the stack below it, for context
```

Read the revision off the bookmark rather than off a stack position. The numbers in the `demo/*`
names are part of a slug, and that stack has been reordered more than once.

A checkout without the solver swap builds a module that panics at compile on the refined `Balance`,
which reaches the slide as a fault line on the order pad. `npm run check:wasm` catches it in one
line rather than in front of a room.

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
