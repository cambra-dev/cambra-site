<script setup lang="ts">
/**
 * The demo slide: a live asset cart, inspected.
 *
 * Owns the WebAssembly host and the price feed, and hands the inspector a
 * snapshot, a frame stream and the two rebuild chords. The two panels below it
 * are views — neither knows there is a Worker.
 *
 * The host lives in module scope, not in this component. Slidev renders every
 * slide with `v-show` and mounts them all again for the overview and for
 * presenter mode, so a component-owned Worker would be a second module and a
 * second compile every time the speaker pressed `o`.
 */
import { onSlideEnter } from "@slidev/client";
import { onBeforeUnmount, reactive, ref } from "vue";

import AssetCart from "./AssetCart.vue";
import ProgramInspector from "./ProgramInspector.vue";
import { WorkerTransport } from "../demo/host";
import {
  LiveFeed,
  ReplayFeed,
  SUBSCRIBED,
  bareTicker,
  formatDollars,
  productFor,
  type FeedMode,
  type FeedStatus,
  type Tick,
} from "../demo/feed";
import {
  BASE_UNITS,
  type ReloadReport,
  type SocketSubscription,
  type Value,
} from "../demo/transport";

/**
 * The panes the slide opens without: values, the six IR stages, and the graph.
 *
 * The slide opens on the **source alone**, which is the program as the room
 * reads it and the thing every beat points back at. Everything else is one
 * gesture away rather than gone: `☰ Panes` in the inspector's header lists
 * every pane with a checkbox, checked from this list, and re-checking one
 * brings it straight back. That is why nothing here is hidden with CSS — a pane
 * hidden from the skin would be unreachable.
 *
 * Values is hidden but still **pinned**: `applyPins` runs before the bundle
 * wires its reveal callback, so a pin does not force the pane open at boot the
 * way a click on the source does. Opening it mid-demo therefore shows the two
 * pinned groups already filling, rather than an empty pane and a hunt for
 * something to inspect.
 *
 * The graph is the best answer to "what did the compiler actually do", and it
 * is out for a different reason: the program is three endpoints and a feed
 * running beside each other, so its graph is thousands of pixels wide and reads
 * as a smear at slide scale.
 */
const HIDDEN_PANES = [
  "values",
  "pre-inference",
  "post-inference",
  "post-channelize",
  "post-as-of-read",
  "post-lambda-elim",
  "post-planning",
  "post-conversion",
] as const;

/**
 * The two shapes this slide can run, and everything that differs between them.
 *
 * `cart.cambra` is the route-shaped program — three `wasm_serve` pairs and one
 * declared price source — and it is what the slide boots. `cart-v0.cambra` is
 * the four-channel program it replaced: one price source, one cart source, a
 * view request and three per-ticker line sinks. Both run; the old one is kept
 * reachable while anything still wants it, one query parameter away:
 *
 *     …/11              the route-shaped program, which is the default
 *     …/11?cart=v0      the four-channel program, as the deck used to run it
 *
 * Read once, at load, because switching wiring means a different program, a
 * different set of channels and a different host; the slide is not trying to
 * hot-swap them, only to make the old path reachable without an edit.
 *
 * The upgrade is not a third entry here. `cart-v2.cambra` serves the same three
 * routes at the same row types and is reached by reloading the running program
 * onto it (`loadUpgrade`), which is the whole point of the beat — a shape that
 * needed its own wiring would be a second program rather than a new version.
 *
 * Delete `flat` and its wiring, and the `-v0` files, when nothing needs the old
 * shape.
 */
type Shape = "routes" | "flat";

const SHAPES = {
  routes: {
    program: "cart.cambra",
    channels: "channels.json",
    /**
     * What to open pinned in the values pane, as source positions.
     *
     * A position rather than a `NodeId`, because ids are minted per compile. A
     * position that no longer names an operator is skipped, so an edit to the
     * program costs a pin rather than an error on the slide.
     *
     * These two are the story: the reply record `GET /cart` builds is the row
     * the app is drawn from, and the write at the foot of the price loop is
     * where a quote from the exchange lands in the program's state. A store
     * declaration is a poor pin — it renders as a changelog with nothing in it
     * until a commit lands.
     *
     * The reply's pin is the record itself and not the `view_replies <<` line
     * above it: a pin resolves to the tightest node at the position and then to
     * the operators built from it, and the feed write is erased by `channelize`
     * — it names no operator, so pinning it silently pins nothing.
     *
     * Source line numbers, so they move whenever the program does —
     * `npm run check:slide` is what notices, by asserting that the values pane
     * opens with groups in it rather than empty.
     */
    pins: [
      { line: 71, col: 13 },
      { line: 81, col: 9 },
    ],
    /**
     * What one press of the stepper adds, in whole units of the asset.
     *
     * A thousandth, because the seeded account holds $500 and the program
     * prices a line at the live quote: four presses of BTC is about $440 and
     * commits, five is about $550 and is denied. Both halves of the atomicity
     * beat are therefore reachable on stage without typing a number. A whole
     * unit per press would put every checkout on the denied side of the guard
     * and the commit path would never be seen.
     */
    step: 0.001,
  },
  flat: {
    program: "cart-v0.cambra",
    channels: "channels-v0.json",
    /** `btc_updates`, the ingest filter, and `btc_line`, what the app renders. */
    pins: [
      { line: 6, col: 1 },
      { line: 44, col: 9 },
    ],
    /** The four-channel program counts whole units and has no notion of a base unit. */
    step: 1,
  },
} as const;

function chooseShape(): Shape {
  if (typeof window === "undefined") return "routes";
  return new URLSearchParams(window.location.search).get("cart") === "v0" ? "flat" : "routes";
}

const shape: Shape = chooseShape();
const SHAPE = SHAPES[shape];

/**
 * Whether the running wiring has two versions to switch between.
 *
 * The four-channel program at `?cart=v0` has no upgrade and never had one, so
 * the strip's version control is absent there rather than present and inert.
 */
const versioned = shape === "routes";

/** What to add to a fault so the room is not stuck on a program that will not run. */
const FALLBACK_HINT =
  shape === "routes" ? " — reload with ?cart=v0 for the four-channel program" : "";

/**
 * The account every request carries.
 *
 * The program seeds two accounts at `opening_balance` and the panel is a single
 * user's order pad, so this is a constant rather than a control. It is in the
 * row types all the same — `{account: Int, …}` — because the program keys its
 * cart by account and its holdings by `(account, ticker)`, and a demo that
 * pretended the account away would be showing a different program from the one
 * on the screen beside it.
 *
 * Which account, and not just any: `scripts/sync-cambra.sh` seeds this one's
 * holdings for every product the panel tracks, because `m[k]` faults on an
 * absent key. Changing it here without changing the seeds there is a press that
 * takes the module down.
 */
const ACCOUNT = 1;

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
   16px is a width budget, not a taste: the program's longest line of code is 79
   characters, the pane is ~817 frame px wide, and 79 × 0.6em × 16px ≈ 760px
   fits what the gutter leaves. Larger wraps that line — the thing the rail was
   widened to fix. (Two comment lines in the route-shaped program run to 81 and
   wrap by a character; they are prose, and reflowing a copied program to save
   two characters would make the next sync a conflict.) The !important rules below are all against CodeMirror's
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

/* ── provenance marks, and the strip's toggle for them ───────
   \`.cm-sel-node\` is the span a click resolved to and \`.cm-link-node\` is the
   same node as another pane traces it; both are backgrounds laid over syntax
   ink in the one pane the whole room is reading. Suppressed unless asked for,
   by a class \`ProgramInspector\` puts on the frame's root. Not \`display:none\`
   and not a rule on the decoration's existence: the marks stay in the document
   and stop being painted, so turning them on mid-answer costs an attribute
   rather than a re-render. */
.no-provenance .cm-sel-node,
.no-provenance .cm-link-node {
  background: none;
  box-shadow: none;
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
/**
 * What the account holds after a checkout, keyed by product id, in whole units.
 *
 * The payoff of the atomicity beat and the reason the panel shows it: a
 * committed checkout moves a quantity out of the cart and into `holdings` in
 * the same transaction that debits the cash, and a denied one moves neither.
 * Empty under the four-channel program, which has no holdings.
 */
const positions = reactive<Record<string, number>>({});
/** The account's cash, as the program last reported it. `null` until it does. */
const cash = ref<number | null>(null);
/**
 * Whether the running program serves a checkout.
 *
 * A ref rather than a read of `wiring`, which is a plain module-scope binding
 * and so invisible to the renderer: a template that asked `wiring` directly
 * would be right only by accident, when some other ref happened to re-render
 * the panel in the same breath.
 */
const checkoutServed = ref(false);
/** What the last write the panel made was told in reply. */
const notice = ref<string | null>(null);
const snapshot = ref<string | null>(null);
const ready = ref(false);
/**
 * What the last accepted reload kept, for the strip under the inspector.
 *
 * Null before the first one, and again after a from-scratch compile, which
 * keeps nothing by construction and would be lying if it showed a tally.
 */
const tally = ref<{ generation: number; kept: number; bound: number } | null>(null);
/**
 * Whether the version last sent was refused.
 *
 * Deliberately not `fault`. `fault` means the host is not running and the panel
 * paints it over the status line; a refused version means the host is running
 * exactly as it was, and the only thing wrong is the text in an editor. The
 * rendered diagnostic goes back to the inspector, which floats it over the
 * source it points into; this ref is what the strip needs to say which version
 * the room is actually looking at the output of.
 */
const rejected = ref(false);
const fault = ref<string | null>(null);
const status = ref<FeedStatus>({ mode: "live", detail: "connecting" });
const mode = ref<FeedMode>("live");

/**
 * Where prices go, and which ones go there.
 *
 * The program's answer where it has one. A version that declares
 * `wasm_socket_subscribe` names its own endpoint, feed and products, and the
 * page reads that list back off the compiled program rather than being kept in
 * step with it by hand — at boot, and again after every accepted reload, since
 * a reload replaces the list rather than adding to it.
 *
 * Seeded from `SUBSCRIBED` because the version that runs today declares no such
 * thing: the primitive is not built, its prices arrive on a plain declared
 * source, and the list comes back empty. `feed.ts` says why that constant is
 * the page's own choice and not a copy of anything.
 *
 * Reactive, because `products` is what the panel greys its untracked rows from
 * and a plain binding would leave those rows stale until some other ref
 * happened to repaint the panel.
 */
const feed = reactive<{ source: string; products: string[] }>({
  source: "",
  products: [...SUBSCRIBED],
});

/** Module scope: one host for the life of the deck, however often this mounts. */
let transport: WorkerTransport | null = null;
let replay: ReplayFeed | null = null;
let live: LiveFeed | null = null;
let wiring: Wiring | null = null;
/**
 * The snapshot of the version running now, as the module last answered it.
 *
 * Held beside `snapshot` and not in it. `snapshot` is what seeds the inspector
 * frame, and writing to it remounts the frame from scratch — which after an
 * edit would throw away the author's text and every pane they had opened. The
 * inspector re-renders itself from what `rebuild` resolves to, and asks for
 * this one when a live frame names a generation later than the panes it is
 * showing.
 */
let latestSnapshot: string | null = null;
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
 * and the panel lists twenty products of which the program is subscribed to
 * three. Which of the two the program hears is `Wiring.price`'s business — the
 * two shapes disagree about it, and about what a price row is even called.
 */
function onTick(tick: Tick): void {
  // A price arriving is the only proof the live socket is carrying data; an
  // open socket is not. Whichever feed produced this, the deadline has done
  // its job. First, and before any early return: a tick that the wiring drops
  // is still a tick that arrived, and a deadline that survived it would flip a
  // working live feed to the recorded slice four seconds in.
  clearLiveDeadline();
  prices[tick.product] = tick.price;
  // A price that beat the program here. The feed is started by `boot` after the
  // compile settles, so this is the recompile window rather than a race.
  if (!wiring) return;
  wiring.price(tick);
  paint();
}

/**
 * Push rows into a named host source.
 *
 * It used to journal first, so that a recompile could re-derive the program's
 * state by replaying every row the host had ever sent. `Program.reload` keeps
 * the state in place instead and the journal is gone; `demo/host.ts` carries
 * the argument for why that is a stronger thing and not merely a cheaper one.
 */
function push(source: string, rows: readonly Value[]): void {
  transport?.push(source, rows);
}

/**
 * A reply field as a number, whatever the row put there.
 *
 * Rows arrive as JSON and a field the program declared `Int` arrives as one;
 * this is what keeps a `NaN` out of the panel if it does not. The cart is drawn
 * from these numbers live in front of a room, and `$NaN` is a worse failure
 * than a zero.
 */
function numberIn(value: Value | undefined): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * What the panel does to the program, in whichever shape the program declares.
 *
 * The panel above this is one panel: it lists prices, holds an order and has a
 * checkout control. What that means in channel terms is what changed. The
 * four-channel program took an absolute quantity on `cart_changes` and answered
 * a `view_requests` ping with three per-ticker sinks; the route-shaped one
 * takes a `PATCH /cart` and answers a `GET /cart` with the whole cart in one
 * reply, and adds a `PUT /checkout` that spends money. An interface rather than
 * a branch at each call site, so the difference is stated once, in two blocks
 * that can be read side by side — and so that deleting the old shape later is
 * deleting one function.
 *
 * Both speak the panel's units, not the program's. The panel counts whole units
 * of an asset because that is what a person buys; the route-shaped program
 * counts base units because that is what `holdings` holds. Every crossing is in
 * `routeWiring`, and the four-channel program needs none, which is exactly the
 * simplification `one_map` exists to undo.
 */
interface Wiring {
  /** Subscribe to what the program feeds; returns the unsubscribes. */
  attach(): (() => void)[];
  /** A price the feed produced, on its way into the program. */
  price(tick: Tick): void;
  /** Set one cart line, in whole units of the asset. */
  setQuantity(product: string, qty: number): void;
  /** Ask the program for the cart as it stands. */
  refresh(): void;
  /** Buy what is in the cart, where the program serves a checkout. */
  checkout: (() => void) | null;
}

/**
 * The route-shaped program: PATCH a line, PUT a checkout, GET the cart.
 *
 * Every channel name here is resolved from the declarations rather than
 * spelled — see `ChannelMap` — so this function names three routes, one socket,
 * and no channels at all.
 *
 * The one subscription that draws the cart is `GET /cart`'s reply. That is the
 * shape's whole argument: the old wiring kept three sinks and the panel added
 * their totals up, and every figure it showed was from a different tick. One
 * reply is one commit snapshot — the cash, every line and every position as
 * they stood together — which is the claim the slide makes out loud.
 */
function routeWiring(host: WorkerTransport): Wiring {
  // Resolved eagerly, and here rather than at each push: `ChannelMap.socket`
  // throws when the declarations carry no ingress channel outside a route, and
  // `boot` turns that throw into the panel's wiring fault, which is a thing the
  // slide should show before a single row moves. A subscription read off the
  // compiled program may point the feed at another declared source later;
  // until one does, this is where prices go.
  feed.source = host.channels.socket();
  const patch = host.route("PATCH", "/cart");
  const checkoutRoute = host.route("PUT", "/checkout");
  const view = host.route("GET", "/cart");

  // Through the handle rather than by name, as every other write on this path
  // is: the route resolved its two channels once and `send` is what puts a row
  // on the request side of the pair. `rebuild` asks for one view of its own
  // after an edit, which is how the panel repaints from the version now
  // running rather than from the one that answered last.
  const refresh = (): void => view.send([{ account: ACCOUNT }]);

  return {
    attach: () => [
      view.onReply((rows) => {
        const row = rows[rows.length - 1];
        if (!row) return;
        cash.value = numberIn(row.cash);
        const product = productFor(String(row.ticker));
        // Rebuilt rather than merged, and the reply is one line because the
        // cart holds one: a `PATCH /cart` for another asset replaces the line
        // rather than adding to it. Merging would leave the asset the presenter
        // stepped away from on the screen, priced and totalled, with nothing
        // behind it — and a checked-out line there forever.
        for (const key of Object.keys(lines)) delete lines[key];
        lines[product] = {
          qty: numberIn(row.qty) / BASE_UNITS,
          price: numberIn(row.price),
          total: numberIn(row.total),
        };
        // The one position the reply carries, which is the one at the line's
        // own ticker: `GET /cart` reads `holdings[(account, line.ticker)]`, and
        // answering with every position an account holds is an iteration over
        // the cart's entries — the read the single-line shape traded away. So
        // the panel shows the holding behind the line on the screen, and the
        // others are in the program rather than on the slide.
        for (const key of Object.keys(positions)) delete positions[key];
        positions[product] = numberIn(row.held) / BASE_UNITS;
        paint();
      }),
      patch.onReply((rows) => {
        const row = rows[rows.length - 1];
        // The ack's `ok` is the program's deny idiom reaching the page: a
        // quantity that is not a sane count of base units writes nothing and
        // says so. The panel cannot send one — the stepper floors at zero — so
        // this is here to make a program edit that tightens the guard visible
        // rather than mysterious.
        if (row && row.ok === false) {
          notice.value = `${String(row.ticker)} rejected`;
          paint();
        }
      }),
      checkoutRoute.onReply((rows) => {
        const row = rows[rows.length - 1];
        if (!row) return;
        const due = numberIn(row.due);
        // The program's read-your-writes: the debited balance on the committing
        // path, the untouched one on the denied path. Both are worth saying out
        // loud on the slide, which is why the denial names the two figures the
        // guard compared rather than saying "declined".
        const remaining = numberIn(row.cash);
        cash.value = remaining;
        notice.value =
          row.ok === true
            ? `bought · $${formatDollars(due)} charged`
            : `declined · $${formatDollars(due)} due, $${formatDollars(remaining)} on hand`;
        // The ack carries the cash and the verdict but not the lines, and a
        // committed checkout has drained every one of them. One GET repaints
        // the cart and the holdings from the state the checkout left behind.
        refresh();
        paint();
      }),
    ],
    price: (tick) => {
      // Only what the program subscribed to. The page is this program's
      // implementation of `wasm_socket_subscribe`, and a host that delivered
      // seventeen products the declaration never asked for would be lying about
      // what the program is reading — which is the one thing this slide claims.
      if (!feed.products.includes(tick.product)) return;
      push(feed.source, [{ ticker: tick.ticker, price: tick.price }]);
      // A price moved, so every line's total did. The cart is the program's to
      // compute, so the panel asks rather than multiplying.
      refresh();
    },
    setQuantity: (product, qty) => {
      notice.value = null;
      patch.send([
        {
          account: ACCOUNT,
          ticker: bareTicker(product),
          // Rounded, because the panel's number is a sum of floating-point
          // steps and the channel's is an `Int`: three presses of a thousandth
          // is 0.003000000000000000002 of a unit, and 300000.0000000000002 base
          // units is a row the module rejects rather than a row it truncates.
          qty: Math.round(qty * BASE_UNITS),
        },
      ]);
      refresh();
    },
    refresh,
    checkout: () => {
      notice.value = null;
      checkoutRoute.send([{ account: ACCOUNT }]);
    },
  };
}

/**
 * The four-channel program: an absolute quantity in, three line sinks out.
 *
 * Kept only until the route-shaped program compiles, and reachable at
 * `?cart=v0`. The names below are spelled because that program spells them: it
 * declares `price_updates`, `cart_changes`, `view_requests` and one sink per
 * ticker, and there is no route to resolve them from. Nothing here is worth
 * generalising — it is the shape being replaced.
 */
function flatWiring(host: WorkerTransport): Wiring {
  /** The sink each tracked ticker's line arrives on — and, by its keys, that set. */
  const LINE_SINKS: Record<string, string> = {
    "BTC-USD": "btc_line",
    "ETH-USD": "eth_line",
    "SOL-USD": "sol_line",
  };

  const refresh = (): void => push("view_requests", [true]);

  return {
    attach: () =>
      Object.entries(LINE_SINKS).map(([product, sink]) =>
        host.sink(sink, (rows) => {
          const row = rows[rows.length - 1];
          if (!row) return;
          lines[product] = {
            qty: numberIn(row.qty),
            price: numberIn(row.price),
            total: numberIn(row.total),
          };
          paint();
        }),
      ),
    price: (tick) => {
      // The product id, not the bare ticker: this program compares against
      // `"BTC-USD"` in its own ingest filter. A ticker it ignores still reaches
      // it, because the filter rejecting them is the thing being shown.
      push("price_updates", [{ ticker: tick.product, price: tick.price }]);
      if (!(tick.product in LINE_SINKS)) return;
      refresh();
    },
    setQuantity: (product, qty) => {
      push("cart_changes", [{ ticker: product, qty: Math.round(qty) }]);
      refresh();
    },
    refresh,
    // No checkout: the four-channel program has no cash, no holdings and
    // nothing to spend. The panel hides the control rather than offering one
    // that does nothing.
    checkout: null,
  };
}

/** Set one cart line, in whole units. The panel's only write. */
function setQuantity(product: string, qty: number): void {
  wiring?.setQuantity(product, qty);
}

/** Buy the cart. Only ever called when the panel is showing the control. */
function checkout(): void {
  wiring?.checkout?.();
}

function toggleFeed(): void {
  // An explicit choice retires the automatic fallback either way.
  clearLiveDeadline();
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

/**
 * How long the live feed has to produce a price before the slice takes over.
 *
 * The failure that matters is not a refused socket — that reports itself — but a
 * socket that opens onto conference wifi and then delivers nothing. Coinbase
 * batches `ticker_batch` about once a second per product, so a feed that is
 * genuinely working is well inside this, and a feed that is not has stopped
 * being worth waiting for.
 */
const LIVE_DEADLINE_MS = 4000;

/** Cleared by the first live price, or fired to fall back to the slice. */
let liveDeadline: ReturnType<typeof setTimeout> | null = null;

function clearLiveDeadline(): void {
  if (liveDeadline !== null) clearTimeout(liveDeadline);
  liveDeadline = null;
}

/**
 * Open the live feed, with the recorded slice behind it.
 *
 * Live is the deck's default because the claim on the slide is that a program
 * is reading a real exchange; the slice exists so that claim degrades to a
 * working demo rather than to an empty panel when the room's network does not
 * cooperate.
 *
 * The fallback is armed here and not in `toggleFeed`. A presenter who clicks
 * the status line to go live has asked for live, and a control that bounced
 * back to replay on its own would read as a control that did not work — there
 * the honest answer is the `unreachable` the feed already reports.
 */
function startLive(): void {
  mode.value = "live";
  live = new LiveFeed(onTick, (s) => {
    status.value = s;
    // `LiveFeed` says what it knows through status alone: it has no failure
    // callback, and these two details are the shapes a dead socket takes.
    if (s.detail === "unreachable" || s.detail === "disconnected") fallBackToSlice();
  });
  live.start();
  clearLiveDeadline();
  liveDeadline = setTimeout(fallBackToSlice, LIVE_DEADLINE_MS);
}

/** Give up on live and replay the recorded slice instead. */
function fallBackToSlice(): void {
  clearLiveDeadline();
  if (mode.value !== "live") return;
  live?.stop();
  live = null;
  mode.value = "replay";
  void startReplay();
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
  const [source, declarations] = await Promise.all([
    versioned ? sourceFor("v1") : fetch(`${base}wasm/${SHAPE.program}`).then((r) => r.text()),
    fetch(`${base}wasm/${SHAPE.channels}`).then((r) => r.json()),
  ]);
  // The upgrade, warmed while the module is still compiling the version above
  // it. Not awaited: the slide is usable without it, and a switch that had to
  // fetch first would put a network round trip inside the gesture. A failure
  // here is silent by design — `showVersion` asks again and reports it there,
  // where a presenter is actually waiting on the answer.
  if (versioned) void sourceFor("v2").catch(() => {});

  transport = new WorkerTransport({
    wasmUrl: `${base}wasm/cambra_bg.wasm`,
    moduleUrl: new URL("../demo/worker.ts", import.meta.url),
    source,
    channels: declarations.channels,
    onError: (message) => (fault.value = message),
  });

  // Before the compile, and separately from it, because the two fail for
  // different reasons and the difference is what a reader needs: a program that
  // does not compile is a program, and declarations that do not carry the route
  // the panel presses are a *wiring* fault — the file synced in describes a
  // different program from the one this panel drives. Resolving them here also
  // means every channel name is settled before a single row moves.
  try {
    wiring = shape === "routes" ? routeWiring(transport) : flatWiring(transport);
    unsubscribes.push(...wiring.attach());
    checkoutServed.value = wiring.checkout !== null;
  } catch (e) {
    fault.value = `wiring: ${e instanceof Error ? e.message : String(e)}${FALLBACK_HINT}`;
    return;
  }

  try {
    const text = await transport.snapshot();
    latestSnapshot = text;
    snapshot.value = text;
    settleVersions(text);
    ready.value = true;
  } catch (e) {
    fault.value = `compile: ${String(e)}${FALLBACK_HINT}`;
    return;
  }
  // Before the feed opens, so the first price already goes where the program
  // wants it. Settled by the same `ready` the snapshot was, so this does not
  // wait for anything.
  applySubscriptions(await transport.subscriptions());
  startLive();
}

/**
 * Point the page's feed at what the version now running subscribes to.
 *
 * The list is the program's statement of what to connect to — endpoint, feed
 * and products — read back off the compiled program rather than configured
 * here to match it. It is also the *whole* list for the version running: a
 * reload replaces it rather than merging into it, which is why this takes the
 * list and not a delta.
 *
 * An empty list is the case today and is not a failure. `wasm_socket_subscribe`
 * is not built, so the version that compiles reads its prices from a plain
 * declared source, and the page keeps the basket in `SUBSCRIBED` and the
 * channel `ChannelMap.socket` resolved. Clearing the tracked set here instead
 * would leave the room looking at twenty greyed rows and a cart that no longer
 * priced anything, on a program that is working.
 *
 * What a non-empty list does *not* do is reopen the socket. `LiveFeed` holds
 * one connection to Coinbase carrying all twenty products the panel lists,
 * because the panel is a price list whether or not the program is reading it;
 * so a changed product list is a change to which of those cross into the
 * program, not a resubscribe on the wire, and a feed that leaves the list
 * closes nothing that the panel is not still using. An `endpoint` naming
 * something other than Coinbase would be past what this page implements, and
 * the honest place to notice that is where the socket is opened rather than
 * here, mid-demo.
 */
function applySubscriptions(subscriptions: readonly SocketSubscription[]): void {
  const quotes = subscriptions[0];
  if (!quotes) return;
  feed.source = quotes.source;
  feed.products = [...quotes.products];
}

function subscribeFrames(cb: (frame: string) => void): () => void {
  if (!transport) return () => {};
  return transport.frames(cb);
}

/**
 * The version now running, for the inspector to re-seed its panes from.
 *
 * An accepted reload mints a fresh `NodeId` for every operator it had to
 * rebuild, so a pane holding ids from the version before it is naming nodes
 * that no longer exist. Frames carry the generation they were produced at, and
 * the inspector calls this when it sees one later than what it is rendering.
 */
function currentSnapshot(): unknown {
  if (!latestSnapshot) throw new Error("the program has not compiled yet");
  return JSON.parse(latestSnapshot);
}

/**
 * Put the edited source in front of the room, keeping the program or not.
 *
 * Two chords, and now two genuinely different acts rather than one act with a
 * replay bolted onto it.
 *
 * **⌘⏎ keeps the state because the program keeps it.** `Program.reload`
 * compiles the new version against the channels the program already has, checks
 * that it can take over what the running one is holding, and then swaps it in:
 * every operator whose computation is unchanged goes on running, and every
 * mutable variable resumes from the value it held. Nothing is carried across by
 * this page, because nothing has to be. The tally it answers with — `kept` of
 * `bound` operators — is the evidence, and it goes on the slide.
 *
 * What this replaced was a journal replay: every row the host had ever pushed,
 * re-pushed into a freshly compiled program so that it re-derived the same
 * state. That worked, and it was a weaker claim than the slide's. A replay
 * produces a second program that agrees with the first; a reload keeps the
 * first. `demo/host.ts` carries the long version, and the fate of the journal.
 *
 * **⌘⇧⏎ starts over**, which is `Program.compile` and a new program: no
 * operator reused, generation back to zero, every cell at its declaration's
 * value. The panel's own figures are cleared with it — they are a mirror of
 * what the program last said, and the new one has not said anything.
 *
 * **A version that will not compile changes nothing.** The reload throws a
 * rendered diagnostic against the source that was sent, the program that was
 * running goes on running at the generation it last reported, and this
 * rethrows so the inspector floats the diagnostic over the editor. It
 * deliberately does not touch `fault`, which is the panel's "the host is not
 * running" line: the host is running, and a typo made on stage must cost a
 * toast and nothing else.
 */
async function rebuild(source: string, options: { keepState: boolean }): Promise<unknown> {
  if (!transport) throw new Error("the host is not running");
  // Marked here rather than at the controls, because this is where *every*
  // rebuild passes: the strip's two buttons, the chords inside the editor, and
  // a version the presenter staged. A spinner wired to a button would miss the
  // chord, which is the one a presenter uses most.
  //
  // Which one is in flight, not just that one is: the strip spins the control
  // that was pressed, and `Reload` and `from scratch` are different promises to
  // be waiting on.
  rebuilding.value = options.keepState ? "keep" : "fresh";
  paint();
  try {
    return await (options.keepState
      ? reloadInPlace(transport, source)
      : compileFresh(transport, source));
  } finally {
    rebuilding.value = null;
    paint();
  }
}

/** ⌘⏎: a new version of the running program, over the state it is holding. */
async function reloadInPlace(host: WorkerTransport, source: string): Promise<unknown> {
  let report: ReloadReport;
  try {
    report = await host.reload(source);
  } catch (e) {
    // The strip says which version the room is looking at the output of; the
    // inspector says what was wrong with the one that was refused.
    rejected.value = true;
    paint();
    throw e;
  }
  rejected.value = false;
  tally.value = { generation: report.generation, kept: report.kept, bound: report.bound };
  latestSnapshot = report.snapshot;
  settleVersions(report.snapshot);
  applySubscriptions(report.subscriptions);
  // Nothing is cleared, which is the whole point: the cart the presenter filled
  // is still in the program, so the panel's mirror of it is still right. One
  // read afterwards all the same, because the *new* version may price or guard
  // it differently and the figures on screen should be that version's.
  wiring?.refresh();
  paint();
  return JSON.parse(report.snapshot);
}

/**
 * The two versions the slide runs, and which one is running now.
 *
 * `v1` is what it boots: one divisor for every asset, BTC and LTC listed.
 * `v2` is the upgrade — a divisor per asset, so `cart` and `holdings` change
 * shape and are declared under new names, each seeded from what v1 held through
 * `@LoadFrom` — and it lists ETH as well.
 *
 * Both are fetched once, at boot, so the switch is a keystroke's worth of work
 * rather than a fetch in front of the room. They are files under `public/` and
 * are what the inspector shows: the deck writes no program into a string.
 */
const VERSIONS = {
  // v1's path is `SHAPES.routes.program` and is spelled there: the boot path
  // reads it from `SHAPE` and the switch reads it from here, and two spellings
  // of one filename is the kind of drift that costs a slide.
  v1: { file: `wasm/${SHAPES.routes.program}`, label: "v1" },
  v2: { file: "wasm/cart-v2.cambra", label: "v2" },
} as const;

type Version = keyof typeof VERSIONS;

/** The strip's two buttons, with what each one does to the running program. */
const VERSION_CONTROLS = [
  {
    id: "v1",
    label: "v1",
    title:
      "Show v1 — one divisor for every asset, BTC and LTC. Nothing compiles until you press Reload,"
      + " and v1 over a running v2 needs `from scratch`: the reload back is refused.",
  },
  {
    id: "v2",
    label: "v2",
    title:
      "Show v2 — a divisor per asset, ETH listed (⇧U). Nothing compiles until you press Reload,"
      + " which carries the cart across through @LoadFrom.",
  },
] as const;

/**
 * Whether the source pane marks the spans a selection resolves to.
 *
 * Off for a room, on for a reader — see `ProgramInspector`'s prop.
 */
const provenance = ref(false);

/**
 * The version whose source the editor is showing, and the one that is compiled.
 *
 * They are two facts, not one, because the version control **does not compile**.
 * Pressing `v2` puts v2's source in the pane and stops: what the room is reading
 * has changed and what is running has not, which is the state `dirty` names and
 * the strip says out loud. Compiling is `Reload`, always, and the beat is two
 * deliberate presses rather than one press with a swap hidden inside it.
 *
 * `running` is read back off the compiled snapshot rather than remembered from
 * whatever was last sent: the presenter can edit either version and compile
 * that, and a remembered label would go on naming a program nobody is running.
 * `null` means the compiled source is neither version as shipped.
 */
const shown = ref<Version | null>("v1");
const running = ref<Version | null>("v1");
/** Whether a version's source is being fetched, so the controls cannot race. */
const switching = ref(false);
/**
 * Whether the editor holds something other than what is compiled.
 *
 * Set by a version press and by the reader's own typing, cleared by a compile
 * that succeeded. It is what suppresses the provenance marks: they map a
 * selection onto the operators the compiled program was built from, and over
 * source that has not been compiled they point at lines that mean nothing.
 */
const dirty = ref(false);
/**
 * Which rebuild is in flight, if one is.
 *
 * A compile takes a second or two on this module, which is long enough that a
 * press with no acknowledgement reads as a press that missed. The strip spins
 * the control that is working and disables both, so a second press cannot start
 * a rebuild against a program the first is part-way through replacing.
 */
const rebuilding = ref<"keep" | "fresh" | null>(null);
const sources: Partial<Record<Version, string>> = {};
/** The bundle's handle on its editor, once it has handed one over. */
let editor: { setSource(text: string): void; source(): string | null } | null = null;

async function sourceFor(which: Version): Promise<string> {
  const held = sources[which];
  if (held !== undefined) return held;
  const path = `${import.meta.env.BASE_URL}${VERSIONS[which].file}`;
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  const text = await response.text();
  sources[which] = text;
  return text;
}

/** Which shipped version `text` is, or `null` where it is neither. */
function versionOf(text: string): Version | null {
  for (const which of Object.keys(VERSIONS) as Version[]) {
    if (sources[which] === text) return which;
  }
  return null;
}

/**
 * Put `which` in the source pane. Nothing is compiled.
 *
 * The whole of the version control: the room reads the program it is about to
 * run before it runs, and the presenter chooses when. `Reload` is what applies
 * it, and the two directions differ there rather than here —
 *
 * **Forward keeps the state.** v2 declares `cart_rescaled` and
 * `holdings_rescaled` with `@LoadFrom` over v1's `cart` and `holdings`, so the
 * swap says where every value goes and the cart the presenter filled survives.
 *
 * **Back cannot.** A reload from v2 to v1 is refused — *"`cart_rescaled` is no
 * longer declared … a value carries forward into the same variable at the same
 * type, or into what a `@LoadFrom` reads it into, and only where the source says
 * which variable it belongs to."* v1 says nothing about where the reshaped
 * collections' values belong, so there is nowhere to put them, and `from
 * scratch` is the way back.
 */
function showVersion(which: Version): Promise<void> {
  if (switching.value) return Promise.resolve();
  switching.value = true;
  return (async () => {
    try {
      const source = await sourceFor(which);
      if (!editor) throw new Error("the inspector has not handed over its editor");
      editor.setSource(source);
      shown.value = which;
      dirty.value = which !== running.value;
      paint();
    } catch (e) {
      notice.value = `${VERSIONS[which].label} did not load — ${String(e)}`;
      paint();
    } finally {
      switching.value = false;
    }
  })();
}

/** The reader typed: what the pane holds is now nobody's shipped program. */
function onEdited(): void {
  if (shown.value !== null || !dirty.value) {
    shown.value = null;
    dirty.value = true;
    paint();
  }
}

/**
 * Take the bundle's editor handle, and put the booted version's source in it.
 *
 * The pane already shows that source — it came from the snapshot — so the write
 * is a no-op on the text and is worth making anyway: it is what proves the
 * handle works before a presenter depends on it in front of a room.
 */
function onEditorReady(handle: {
  setSource(text: string): void;
  source(): string | null;
}): void {
  editor = handle;
}

/**
 * Settle both version facts from a snapshot a compile just produced.
 *
 * The snapshot carries the source it was built from, so this asks the compiled
 * program which version it is rather than trusting what was last sent. An edit
 * to either version compiles to neither, and the strip then names no version —
 * which is the truth, and is why `running` is nullable.
 */
function settleVersions(snapshotText: string): void {
  let compiled: string | null = null;
  try {
    compiled = (JSON.parse(snapshotText) as { source?: { text?: string } }).source?.text ?? null;
  } catch {
    // A payload this cannot read is one the panes could not render either, and
    // the inspector reports that. Leaving the labels alone is better than
    // clearing them on a parse.
    return;
  }
  running.value = compiled === null ? null : versionOf(compiled);
  // Against the editor's text rather than assumed clean. A compile takes a
  // second or two, and a reader who starts typing inside that window would
  // otherwise have the answer land and mark their edit compiled.
  const inPane = editor?.source() ?? compiled;
  dirty.value = inPane !== compiled;
  shown.value = dirty.value ? versionOf(inPane ?? "") : running.value;
}

/**
 * ⇧U anywhere on the slide, except where the presenter is typing: show v2.
 *
 * The same act as pressing `v2` on the strip, for a presenter who would rather
 * not reach for the pointer — and, like the button, it compiles nothing. It only
 * ever goes forward: the keystroke is the upgrade beat, and starting the demo
 * over is a thing to do deliberately.
 *
 * The two rebuild chords live inside the inspector's frame, which owns its own
 * keys; this one is the page's, because the gesture is not an edit. A keystroke
 * while the panel's product search has focus is a search for "U", so a target
 * that takes text keeps it.
 *
 * Shift rather than a bare letter: Slidev binds several single keys (`o`, `g`,
 * `d`) and a stray press on this slide should do nothing rather than something.
 */
function onKey(event: KeyboardEvent): void {
  if (event.key !== "U" || event.metaKey || event.ctrlKey || event.altKey) return;
  const target = event.target;
  if (
    target instanceof HTMLElement &&
    (target.isContentEditable || /^(INPUT|TEXTAREA)$/.test(target.tagName))
  ) {
    return;
  }
  event.preventDefault();
  void showVersion("v2");
}

/** ⌘⇧⏎: a new program, from nothing. */
async function compileFresh(host: WorkerTransport, source: string): Promise<unknown> {
  let text: string;
  try {
    text = await host.recompile(source);
  } catch (e) {
    rejected.value = true;
    paint();
    throw e;
  }
  latestSnapshot = text;
  settleVersions(text);
  // No tally: a fresh program kept nothing, and a stale `11 of 12` under it
  // would be the one figure on this slide that was not evidence of anything.
  // Which version the strip names is settled from the compiled source below,
  // not from whatever was last shown.
  tally.value = null;
  rejected.value = false;
  for (const key of Object.keys(lines)) delete lines[key];
  for (const key of Object.keys(positions)) delete positions[key];
  cash.value = null;
  notice.value = null;
  applySubscriptions(await host.subscriptions());
  // One read, so the empty cart and the seeded balance the new program starts
  // with are on the screen rather than a blank panel.
  wiring?.refresh();
  paint();
  return JSON.parse(text);
}

// Slidev mounts the slides either side of the current one, so `onMounted` fires
// while the presenter is still some slides away: the module downloads, the
// program compiles and the feed starts replaying into a slide nobody is looking
// at. That is a 2.1 MB fetch and a tick loop running for however long the
// preceding slides take.
//
// `onSlideEnter` fires on arrival instead. It is not `onMounted`'s twin — it
// also fires on every *return* to the slide — but `boot` is idempotent (it
// returns early once the transport exists), so coming back does not start a
// second host.
//
// Deliberately no `onSlideLeave` teardown: navigating away and back is
// something a presenter does to re-explain a point, and tearing down would
// empty the cart they had just filled. The host outliving the slide is the
// behaviour worth keeping.
onSlideEnter(() => {
  void boot();
});

// On the window rather than an element, because the gesture belongs to the
// slide and not to either panel, and paired with the `removeEventListener`
// below so the mounts Slidev makes for the overview and for presenter mode
// each take their listener away with them.
if (typeof window !== "undefined") window.addEventListener("keydown", onKey);

onBeforeUnmount(() => {
  if (typeof window !== "undefined") window.removeEventListener("keydown", onKey);
  for (const off of unsubscribes) off();
  unsubscribes.length = 0;
});
</script>

<template>
  <div class="cart-demo">
    <ProgramInspector
      :snapshot="snapshot"
      :hidden-panes="HIDDEN_PANES"
      :pins="SHAPE.pins"
      :frames="subscribeFrames"
      :rebuild="rebuild"
      :current-snapshot="currentSnapshot"
      :tally="tally"
      :rejected="rejected"
      :skin="INSPECTOR_SKIN"
      :versions="versioned ? VERSION_CONTROLS : undefined"
      :version="running"
      :shown="shown"
      :dirty="dirty"
      :switching="switching"
      :rebuilding="rebuilding"
      :provenance="provenance"
      @switch="showVersion($event as Version)"
      @toggle-provenance="provenance = !provenance"
      @editor="onEditorReady"
      @edited="onEdited"
    />
    <AssetCart
      :prices="prices"
      :lines="lines"
      :positions="positions"
      :cash="cash"
      :notice="notice"
      :tracked="feed.products"
      :step="SHAPE.step"
      :can-checkout="checkoutServed"
      :status="status"
      :ready="ready"
      :fault="fault"
      @quantity="setQuantity"
      @checkout="checkout"
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
