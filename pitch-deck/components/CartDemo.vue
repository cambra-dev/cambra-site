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
import { onSlideEnter } from "@slidev/client";
import { onBeforeUnmount, reactive, ref } from "vue";

import AssetCart from "./AssetCart.vue";
import ProgramInspector from "./ProgramInspector.vue";
import { Journal, WorkerTransport } from "../demo/host";
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
import { BASE_UNITS, type Row, type Value } from "../demo/transport";

/**
 * The panes the slide opens without: the six IR stages, and the operator graph.
 *
 * Source and values are the two a room can read, and stacked they each get the
 * inspector's full width (see `INSPECTOR_SKIN`). The graph is out by default
 * rather than gone: the program is three endpoints and a feed running beside
 * each other, so its graph is thousands of pixels wide and reads as a smear at
 * slide scale — it was three parallel sinks before and is no narrower for being
 * three routes — but it is the
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
 * The two programs this slide can run, and everything that differs between them.
 *
 * The demo is mid-rewrite. `cart.cambra` is the route-shaped program — three
 * `wasm_serve` pairs and a `wasm_socket_subscribe` — and it is what the slide
 * boots. `cart-v0.cambra` is the four-channel program it replaces: one price
 * source, one cart source, a view request and three per-ticker line sinks.
 *
 * Both are kept because the new one cannot compile yet. It needs a `for` inside
 * `with begin():`, entry iteration over a transactional map and a sink row
 * carrying lists, and each of those is being built in the compiler's repo right
 * now. Until they land, a deck synced against a `cambra` checkout will fail to
 * compile the route-shaped program and say so on the slide — and the four-
 * channel program is one query parameter away:
 *
 *     …/11              the route-shaped program, which is the default
 *     …/11?cart=v0      the four-channel program, as the deck has always run it
 *
 * The route-shaped program is the default *because* it does not compile yet.
 * This branch exists for the compiler work that will make it compile, and the
 * people doing that work should meet the failure on load rather than have to
 * know a query parameter to find it. The slide names the fault and the way back.
 *
 * That is the opposite of what a branch being presented from would want, so if
 * this is ever the branch someone demos, flip the comparison in `chooseShape`
 * — the four-channel program is whole and runs.
 *
 * Read once, at load, because switching wiring means a different program, a
 * different set of channels and a different host; the slide is not trying to
 * hot-swap them, only to make the old path reachable without an edit. Delete
 * `flat` and its wiring once the route-shaped program runs.
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
     * program costs a pin rather than an error on the slide — which is also
     * what saves these two, since the line numbers below are a *provisional*
     * program's and the compiler repo's own will not match them.
     *
     * These two are the story either way: the write at the foot of the socket
     * loop is where a quote from the exchange lands in the program's state, and
     * `view_replies` is the row the app is drawn from. A store declaration is a
     * poor pin — it renders as a changelog with nothing in it until a commit
     * lands.
     */
    pins: [
      { line: 134, col: 9 },
      { line: 107, col: 9 },
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

/** What to add to a fault so the room is not stuck on a program that will not build. */
const FALLBACK_HINT =
  shape === "routes" ? " — reload with ?cart=v0 for the four-channel program" : "";

/**
 * The account every request carries.
 *
 * The program seeds exactly one (`accts = ((1, 500 * one_dollar))`) and the
 * panel is a single user's order pad, so this is a constant rather than a
 * control. It is in the row types all the same — `{account: Int, …}` — because
 * the keys the program holds are `(account, ticker)` pairs, and a demo that
 * pretended the account away would be showing a different program from the one
 * on the screen beside it.
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
const fault = ref<string | null>(null);
const status = ref<FeedStatus>({ mode: "live", detail: "connecting" });
const mode = ref<FeedMode>("live");

/** Module scope: one host for the life of the deck, however often this mounts. */
let transport: WorkerTransport | null = null;
let journal: Journal | null = null;
let replay: ReplayFeed | null = null;
let live: LiveFeed | null = null;
let wiring: Wiring | null = null;
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

/** Push, journaling first, so a replay reproduces exactly this run. */
function push(source: string, rows: readonly Value[]): void {
  journal?.append(source, rows);
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
 * A reply field that should be a list of rows.
 *
 * Deliberately forgiving, because this is the newest and least settled part of
 * the contract: `GET /cart` replies with `{cash, lines: [...], positions: [...]}`
 * and the module's `row_to_json` encodes scalars and records but not lists yet.
 * Until it does, a reply may well arrive with these fields missing. A cart that
 * draws empty is a demo with nothing in it; a `rows.map` on `undefined` is a
 * blank slide and a stack trace.
 */
function rowsIn(value: Value | undefined): Row[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is Row => typeof entry === "object" && entry !== null && !Array.isArray(entry),
  );
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
  const quotes = host.channels.socket();
  const patch = host.route("PATCH", "/cart");
  const checkoutRoute = host.route("PUT", "/checkout");
  const view = host.route("GET", "/cart");

  // A read, so it is sent rather than pushed: `push` journals, and a journal of
  // reads is a recompile re-asking a question whose answer it is about to
  // overwrite. `Journal` has the long version. `rebuild` asks for one view of
  // its own afterwards, which is the whole of what this costs.
  const refresh = (): void => view.send([{ account: ACCOUNT }]);

  return {
    attach: () => [
      view.onReply((rows) => {
        const row = rows[rows.length - 1];
        if (!row) return;
        cash.value = numberIn(row.cash);
        // Rebuilt rather than merged: the reply is the cart, so a line that is
        // no longer in it has to leave the panel. Merging would leave a
        // checked-out line on the screen forever, priced and totalled, with
        // nothing behind it.
        for (const key of Object.keys(lines)) delete lines[key];
        for (const line of rowsIn(row.lines)) {
          const product = productFor(String(line.ticker));
          lines[product] = {
            qty: numberIn(line.qty) / BASE_UNITS,
            price: numberIn(line.price),
            total: numberIn(line.total),
          };
        }
        for (const key of Object.keys(positions)) delete positions[key];
        for (const held of rowsIn(row.positions)) {
          positions[productFor(String(held.ticker))] = numberIn(held.qty) / BASE_UNITS;
        }
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
      if (!(SUBSCRIBED as readonly string[]).includes(tick.product)) return;
      push(quotes, [{ ticker: tick.ticker, price: tick.price }]);
      // A price moved, so every line's total did. The cart is the program's to
      // compute, so the panel asks rather than multiplying.
      refresh();
    },
    setQuantity: (product, qty) => {
      notice.value = null;
      push(patch.requests, [
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
      push(checkoutRoute.requests, [{ account: ACCOUNT }]);
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
    fetch(`${base}wasm/${SHAPE.program}`).then((r) => r.text()),
    fetch(`${base}wasm/${SHAPE.channels}`).then((r) => r.json()),
  ]);

  journal = new Journal();
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
    snapshot.value = await transport.snapshot();
    ready.value = true;
  } catch (e) {
    fault.value = `compile: ${String(e)}${FALLBACK_HINT}`;
    return;
  }
  startLive();
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
  for (const key of Object.keys(positions)) delete positions[key];
  cash.value = null;
  notice.value = null;
  if (options.keepState) journal.replay(transport);
  else journal.clear();
  // One read, afterwards, either way. The journal carries writes only — a `GET`
  // is not history, and journaling one would have the replay re-ask a question
  // whose answer the next row overwrites — so nothing in the replay repaints the
  // cart, and a fresh run has an empty cart and a seeded balance worth showing.
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
      :pins="SHAPE.pins"
      :frames="subscribeFrames"
      :rebuild="rebuild"
      :skin="INSPECTOR_SKIN"
    />
    <AssetCart
      :prices="prices"
      :lines="lines"
      :positions="positions"
      :cash="cash"
      :notice="notice"
      :tracked="SUBSCRIBED"
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
