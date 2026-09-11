# The seed pitch deck

Slidev. Presented from a laptop, not hosted.

```bash
npm install
scripts/sync-cambra.sh   # once: builds the blobs that are not committed
npm run dev              # opens the deck; slide 6 is the live demo
```

`npm run dev` serves on `localhost:3030` by default and opens a browser. Press `o` for the overview,
`p` for presenter mode; slide 6's speaker notes carry the demo's script.

## Slide 6 — the live demo

One Cambra program, compiled to WebAssembly **in the page** and running while the slide is open. The
left panel is the program inspector — source, operator graph, and the values flowing through it. The
right panel is the app, at a quarter of the width, so its proportions are a phone's.

- **The feed replays a recorded Coinbase slice** at the rate it was captured: 4,187 rows over 30
  minutes across 20 products, looping. Click the status line at the foot of the phone to switch to
  the live Coinbase socket, and again to go back.
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
| `components/AssetCart.vue` | the phone panel |
| `components/ProgramInspector.vue` | the inspector, as a `srcdoc` frame with an injected snapshot and frame stream |

### The artifacts

Slide 6 runs from files in `public/`, not from a server. Most of them are committed — the program
(`wasm/cart.cambra`), its channel declarations, and the 83 KB price slice — so the deck builds and
presents with no network.

**Three generated blobs are not committed**, each being over `jj`'s 1 MiB snapshot limit. All three
are reproducible from a `cambra` checkout, so nothing here needs to be handed between machines:

| | | |
|---|---|---|
| `public/wasm/cambra_bg.wasm` | 2.1 MB | the WebAssembly module slide 6 loads |
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

The demo's compiler-side work is not landed. Both scripts build against the tip of the `demo/*`
stack, and the bookmark names do **not** run in order — `demo/03-inspector-embed` is currently the
tip, sitting above `demo/05-wasm-build`. Build from anywhere below it and
`scripts/build-artifact.mjs` stops on ``profile `wasm-fast` is not defined``, because the tip commit
is the one that adds that profile.

```bash
jj log -r 'heads(demo/05-wasm-build::)'    # the tip the deck expects
```

### The standalone artifact

`artifact/cambra-demo.html` is slide 6 as one self-contained page: the module, the program, the
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

Slide 6 waits on `[data-waitfor=".cart-demo"]`, so the export blocks until the demo has mounted.
