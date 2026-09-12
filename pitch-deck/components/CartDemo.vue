<script setup lang="ts">
/**
 * The demo slide: a live asset cart, inspected.
 *
 * Owns the WebAssembly host, the price feed and the journal, and hands the
 * inspector a snapshot and a frame stream. The two panels below it are views —
 * neither knows there is a Worker.
 *
 * The host lives in module scope, not in this component. Slidev renders every
 * slide with `v-show` and mounts them all again for the overview and for
 * presenter mode, so a component-owned Worker would be a second module and a
 * second compile every time the speaker pressed `o`.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

import AssetCart from "./AssetCart.vue";
import ProgramInspector from "./ProgramInspector.vue";
import { Journal, WorkerTransport } from "../demo/host";
import { LiveFeed, ReplayFeed, type FeedMode, type FeedStatus } from "../demo/feed";
import { LINE_SINKS, SCALE, TRACKED, type Row } from "../demo/transport";

/**
 * The panes the slide opens without: the six IR stages, and the operator graph.
 *
 * Source and values are the two a room can read, and stacked they each get the
 * inspector's full width (see `INSPECTOR_SKIN`). The graph is out by default
 * rather than gone: `cart.cambra` is three parallel sinks, so its graph is
 * thousands of pixels wide and reads as a smear at slide scale — but it is the
 * best answer to "what did the compiler actually do", so it has to be one
 * gesture away. `☰ Panes` in the inspector's header lists every pane with a
 * checkbox, checked from this list, and re-checking one brings it straight
 * back. That is why nothing here is hidden with CSS: a pane hidden from the
 * skin would be unreachable.
 */
const HIDDEN_PANES = [
  "pre-inference",
  "post-inference",
  "post-channelize",
  "post-as-of-read",
  "post-lambda-elim",
  "post-planning",
  "post-conversion",
] as const;

/**
 * What to open pinned in the values pane, as source positions.
 *
 * A position rather than a `NodeId`, because ids are minted per compile. A
 * position that no longer names an operator is skipped, so an edit to the
 * program costs a pin rather than an error on the slide.
 *
 * These two are the story: `cart.cambra`'s `btc_updates` is the ingest filter,
 * where the twenty-product stream narrows to one ticker, and `btc_line` is what
 * the app renders. A store declaration is a poor pin — it renders as a
 * changelog with nothing in it until a commit lands.
 */
const PINS = [
  { line: 6, col: 1 },
  { line: 44, col: 9 },
] as const;

/**
 * The deck's skin for the inspector frame, injected by `ProgramInspector`.
 *
 * This is the seam between the deck and a bundle it does not build.
 * `public/inspector/index.html` is generated out of `cambra` and copied in, so
 * nothing below may assume more about it than the class names it renders — the
 * ones in this block, all of them present in the committed bundle. Three jobs:
 *
 *   1. Stack the panes. `.panels` is a flex row of `flex: 1 1 0` panes, so
 *      three across the old column gave each about 215 frame px — under 32
 *      characters, and every line of the program wrapped mid-expression.
 *      Stacked, source and values each get the inspector's full width.
 *   2. Raise the contrast. The bundle's dark palette is `--border: #3a3a3a` on
 *      `--bg: #1e1e1e`, which measures 1.47:1 — a hairline that is gone on a
 *      projector and gone again over video. Every ratio quoted below was
 *      computed, not eyeballed.
 *   3. Bring the frame into the deck's navy, so the inspector reads as part of
 *      the slide rather than a grey rectangle pasted onto it.
 *
 * Two mechanics to know before editing:
 *
 * - Order beats specificity here. The sheet is appended after the bundle's own
 *   `<style>`, the last element in its head, so plain rules win ties. The
 *   exception is CodeMirror, whose base theme is generated at run time and
 *   inserted at the *top* of the head with its own class in every selector;
 *   those rules carry `!important`, which is what the bundle itself does about
 *   the same problem.
 * - The frame renders at 2x and is scaled back by half (see
 *   `ProgramInspector.vue`), so one px here is half a deck px and lands near
 *   1:1 on a 1080p projector. px is the honest unit in this block for that
 *   reason, and nowhere else in the deck.
 *
 * Nothing here hides a pane: `HIDDEN_PANES` does that, so `☰ Panes` can undo it.
 */
const INSPECTOR_SKIN = `
/* ── palette ──────────────────────────────────────────────────
   Stated unconditionally, because the bundle ships a light and a dark palette
   and chooses with prefers-color-scheme: a presenter whose laptop is in light
   mode would otherwise get a white inspector on a navy slide. color-scheme
   pins the frame's scrollbars to match. */
:root {
  color-scheme: dark;
  --bg: #0b1b2b;                        /* --code-bg */
  --bg-panel: #0b1b2b;
  --bg-header: #17324d;                 /* --bg-2, the one raised surface */
  --fg: #fff0d1;                        /* --sand on --code-bg: 15.45:1 */
  --fg-muted: #7d97b2;                  /* --fg-3: 5.76:1, labels only */
  --border: rgba(255, 255, 255, 0.36);  /* 3.31:1, against 1.47:1 before */
  /* Roles, not syntax. The source pane has no highlighting to restyle; these
     colour what the inspector means by a type, a node id and a dataflow edge,
     and the pair below is its one coding: what you pointed at (lagoon) against
     where the other panes traced it to (amber). Only the hues move. */
  --sel-here: rgba(108, 196, 200, 0.3);
  --sel-elsewhere: rgba(245, 163, 55, 0.34);
  --caret: #f18b40;                     /* --coral */
  --type: #6cc4c8;                      /* --lagoon: 8.6:1 */
  --node-id: #f5a337;                   /* --amber: 8.44:1 */
  --edge: #6cc4c8;
  --err: #f18b40;                       /* --coral: 7.05:1; --ember is 4.47 */
  --warn: #f5a337;
}
body { font-size: 16px; }

/* ── the vertical rail ───────────────────────────────────────
   Source above values, each the full width. Source takes the larger share
   because it is the thing being read aloud; values needs only enough rows to
   show the stream moving. */
.panels { flex-direction: column; }
.panel { border-right: none; border-bottom: 2px solid var(--border); }
.panel.last-visible { border-bottom: none; }
.panel[data-pane-id="source"] { flex: 1.3 1 0; }
.panel[data-pane-id="values"] { flex: 1 1 0; }

/* ── chrome ──────────────────────────────────────────────────
   The header stays: it carries the live tick counter — the cheapest liveness
   proof on the slide — and the ☰ Panes menu, which is the only way back to a
   hidden pane. */
.header { padding: 0.4rem 0.9rem; border-bottom: 2px solid var(--border); font-size: 14px; }
.header .title { color: var(--fg-muted); letter-spacing: 0.1em; text-transform: uppercase; }
.header .name { color: var(--fg); }
.header .badge { font-size: 12px; }
/* The second badge is \`live · tick N\`; it gets the one accent in the bar. */
.header .badge + .badge {
  color: #6cc4c8;
  border-color: rgba(108, 196, 200, 0.55);
  font-variant-numeric: tabular-nums;
}
.pane-menu-button { font-size: 12px; color: var(--fg); }
.pane-menu-item { font-size: 13px; }
.panel-title {
  font-size: 12px;
  letter-spacing: 0.12em;
  padding: 0.35rem 0.9rem;
  border-bottom: 2px solid var(--border);
}
.pane-badge { font-size: 11px; color: #6cc4c8; border-color: rgba(108, 196, 200, 0.55); }
/* Copying a pane's text is a developer's affordance, and its slot is wanted
   for the caption below. */
.pane-copy { display: none; }
/* The values pane shows what actually crosses a channel: 8172786000000. Said
   once, that is the no-floats-anywhere point; unsaid it looks like a bug. It
   is a caption, so it is content on the pane's own title bar — the bundle
   renders no element for it and this block invents no DOM. */
.panel[data-pane-id="values"] .panel-title::after {
  content: "prices are exact integers · dollars × 10⁸";
  margin-left: auto;
  text-transform: none;
  letter-spacing: 0.02em;
  color: var(--fg-muted);
}

/* ── source ──────────────────────────────────────────────────
   16px is a width budget, not a taste: the program's longest line is 79
   characters, the pane is ~817 frame px wide, and 79 × 0.6em × 16px ≈ 760px
   fits what the gutter leaves. Larger wraps that line — the thing the rail was
   widened to fix. The !important rules below are all against CodeMirror's
   run-time base theme, which is light-mode by default and would otherwise put
   a #f5f5f5 gutter on the navy. */
.panel.source .cm-content,
.panel.source .cm-gutters { font-size: 16px !important; line-height: 1.55 !important; }
.cm-editor .cm-content { color: var(--fg) !important; caret-color: var(--caret) !important; }
.cm-editor .cm-gutters {
  background: transparent !important;
  color: var(--fg-muted) !important;
  border-right: 1px solid var(--border) !important;
}
.cm-editor .cm-activeLine { background: rgba(108, 196, 200, 0.08) !important; }
.cm-editor .cm-activeLineGutter {
  background: rgba(108, 196, 200, 0.08) !important;
  color: var(--fg) !important;
}

/* ── values ──────────────────────────────────────────────────
   Sized up, and tabular so a figure changing a digit does not shift the row.
   The pin menu stays: pins are the speaker's, and one may want adding live. */
.live-group-head { font-size: 14px; padding: 0.25rem 0.9rem; }
.live-group-meta { font-size: 12px; padding: 0 0.9rem 0.3rem; }
.live-row { font-size: 15px; padding: 0.1rem 0.9rem; font-variant-numeric: tabular-nums; }
.live-value { overflow-wrap: anywhere; }
.live-empty { font-size: 14px; }
.live-dropped { font-size: 13px; font-style: normal; }
.live-menu-button { font-size: 12px; }

/* ── the operator graph, for when ☰ Panes brings it back ─────
   Edges and nodes already read the palette above; what they need at slide
   scale is weight. */
.graph-node { border-width: 2px; border-radius: 5px; font-size: 12px; }
.node-label { font-size: 13px; }
.graph-chip, .graph-tiling { font-size: 11px; }
.graph-edge-value, .graph-edge-share { stroke-width: 2.4; opacity: 0.9; }
.graph-detail { font-size: 12px; border-bottom: 2px solid var(--border); }
`;

const prices = reactive<Record<string, number>>({});
const lines = reactive<Record<string, { qty: number; price: number; total: number }>>({});
const snapshot = ref<string | null>(null);
const ready = ref(false);
const fault = ref<string | null>(null);
const status = ref<FeedStatus>({ mode: "replay", detail: "loading" });
const mode = ref<FeedMode>("replay");

/** Module scope: one host for the life of the deck, however often this mounts. */
let transport: WorkerTransport | null = null;
let journal: Journal | null = null;
let replay: ReplayFeed | null = null;
let live: LiveFeed | null = null;
const unsubscribes: (() => void)[] = [];

/** Ticks the panel has not painted yet, coalesced into one frame. */
let pendingPaint = false;

function paint(): void {
  if (pendingPaint) return;
  pendingPaint = true;
  requestAnimationFrame(() => {
    pendingPaint = false;
  });
}

/**
 * Push a price into the program and into the panel's own copy.
 *
 * Both, because they answer different questions: the program prices the cart,
 * and the panel lists twenty products of which the program tracks three.
 */
function onTick(tick: { ticker: string; price: number }): void {
  prices[tick.ticker] = tick.price;
  if (!(tick.ticker in LINE_SINKS)) {
    // A ticker the program ignores still reaches it: the ingest filter is the
    // thing being shown, and a filter with nothing to reject shows nothing.
    push("price_updates", [{ ticker: tick.ticker, price: tick.price }]);
    return;
  }
  push("price_updates", [{ ticker: tick.ticker, price: tick.price }]);
  requestView();
  paint();
}

/** Push, journaling first, so a replay reproduces exactly this run. */
function push(source: string, rows: Row[]): void {
  journal?.append(source, rows);
  transport?.push(source, rows);
}

/** Ask the program for a view. Every cart figure comes from the answer. */
function requestView(): void {
  push("view_requests", [true]);
}

function setQuantity(ticker: string, qty: number): void {
  push("cart_changes", [{ ticker, qty }]);
  requestView();
}

function toggleFeed(): void {
  if (mode.value === "replay") {
    replay?.stop();
    mode.value = "live";
    live = new LiveFeed(onTick, (s) => (status.value = s));
    live.start();
  } else {
    live?.stop();
    live = null;
    mode.value = "replay";
    void startReplay();
  }
}

async function startReplay(): Promise<void> {
  replay = new ReplayFeed(onTick, (s) => (status.value = s));
  try {
    await replay.start(`${import.meta.env.BASE_URL}data/coinbase-2026-09-03-30min.ndjson.gz`);
  } catch (e) {
    status.value = { mode: "replay", detail: "slice unavailable" };
    fault.value = `feed: ${String(e)}`;
  }
}

async function boot(): Promise<void> {
  if (transport) return;
  const base = import.meta.env.BASE_URL;
  const [source, channels] = await Promise.all([
    fetch(`${base}wasm/cart.cambra`).then((r) => r.text()),
    fetch(`${base}wasm/channels.json`).then((r) => r.json()),
  ]);

  journal = new Journal();
  transport = new WorkerTransport({
    wasmUrl: `${base}wasm/cambra_bg.wasm`,
    moduleUrl: new URL("../demo/worker.ts", import.meta.url),
    source,
    channels: channels.channels,
    onError: (message) => (fault.value = message),
  });

  for (const ticker of TRACKED) {
    const sink = LINE_SINKS[ticker];
    unsubscribes.push(
      transport.sink(sink, (rows) => {
        const row = rows[rows.length - 1];
        if (!row) return;
        lines[ticker] = {
          qty: Number(row.qty),
          price: Number(row.price),
          total: Number(row.total),
        };
        paint();
      }),
    );
  }

  try {
    snapshot.value = await transport.snapshot();
    ready.value = true;
  } catch (e) {
    fault.value = `compile: ${String(e)}`;
    return;
  }
  await startReplay();
}

function subscribeFrames(cb: (frame: string) => void): () => void {
  if (!transport) return () => {};
  return transport.frames(cb);
}

/**
 * Recompile the edited program, with or without the state the old one held.
 *
 * The difference is one line, and it is the whole distinction the two chords
 * make. `keepState` replays the journal — every row the host has ever pushed,
 * in order — so the new program arrives at the state the old one was in, and
 * the cart still holds what the presenter put in it. Without it the journal is
 * dropped and the program starts from nothing.
 *
 * Replay is not free: the journal grows for as long as the slide is open, so a
 * reload late in a demo re-pushes everything that came before it. That is fast
 * — no wall-clock delay, the feed's own pacing is not reproduced — but it is
 * linear in the run so far, which is why `clear()` exists for the other chord.
 *
 * The panel's own figures are cleared either way: they are a mirror of what the
 * sinks last produced, and the new program has produced nothing yet. A replay
 * refills them within a frame; a fresh run leaves them at zero, which is
 * honest.
 */
async function rebuild(source: string, options: { keepState: boolean }): Promise<unknown> {
  if (!transport || !journal) throw new Error("the host is not running");
  const text = await transport.recompile(source);
  for (const key of Object.keys(lines)) delete lines[key];
  if (options.keepState) journal.replay(transport);
  else journal.clear();
  paint();
  return JSON.parse(text);
}

onMounted(() => {
  void boot();
});

onBeforeUnmount(() => {
  for (const off of unsubscribes) off();
  unsubscribes.length = 0;
});
</script>

<template>
  <div class="cart-demo">
    <ProgramInspector
      :snapshot="snapshot"
      :hidden-panes="HIDDEN_PANES"
      :pins="PINS"
      :frames="subscribeFrames"
      :rebuild="rebuild"
      :skin="INSPECTOR_SKIN"
    />
    <AssetCart
      :prices="prices"
      :lines="lines"
      :status="status"
      :ready="ready"
      :fault="fault"
      @quantity="setQuantity"
      @toggle-feed="toggleFeed"
    />
  </div>
</template>

<style scoped>
.cart-demo {
  display: grid;
  /* The app is the hero and takes a little over half; the inspector gets the
     rest. The old 3fr / 1fr put the app at a phone's 215px, which is why it
     used to be drawn as a phone — honest then, and dishonest now: nobody ships
     this on a handset, and a phone bezel at hero width is a costume.
     The split is also a width budget on both sides. At 980px of design width
     less the frame's padding and this gap there are ~858px to divide, so the
     inspector's column is ~409px — 817px inside the frame, which is what the
     skin's 16px source type is sized against — and the app's is ~450px, which
     is what carries two interior columns rather than one phone's worth. */
  grid-template-columns: 1fr 1.1fr;
  gap: 1.2rem;
  height: 100%;
  min-height: 0;
}
</style>
