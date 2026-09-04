<script setup lang="ts">
/**
 * Slide 05: a live asset cart, inspected.
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

/** The six IR panes, hidden so source, operators and values fit at ~215px each. */
const HIDDEN_PANES = [
  "pre-inference",
  "post-inference",
  "post-channelize",
  "post-as-of-read",
  "post-lambda-elim",
  "post-planning",
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
  /* The inspector reads at a tablet's width and the app at a phone's, which is
     why the app is drawn as a phone: the proportions are honest at 215 × 383. */
  grid-template-columns: 3fr 1fr;
  gap: 1.2rem;
  height: 100%;
  min-height: 0;
}
</style>
