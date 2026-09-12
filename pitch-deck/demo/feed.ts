/**
 * The price feed: Coinbase live, or a recorded slice on a loop.
 *
 * Both emit the same `Tick` through the same callback, so the journal and the
 * program see one shape and the toggle changes nothing downstream. Live is the
 * deck's default and the slice is what it falls back to; `CartDemo.vue` owns
 * that choice and the deadline behind it.
 *
 * The program declares this feed rather than the page inventing it:
 *
 *     ticker_updates = wasm_socket_subscribe(
 *         "wss://ws-feed.exchange.coinbase.com", "ticker_batch",
 *         ["BTC-USD", "ETH-USD", "SOL-USD"])
 *
 * `LiveFeed` is the page's implementation of that primitive — the same
 * endpoint, the same upstream channel, one typed row per quote — and
 * `ReplayFeed` is the offline stand-in that fills the same host source. Neither
 * pushes anything itself: a feed's job is to produce ticks, and which channel
 * they cross is the wiring's business, which is what lets one feed serve a
 * program that calls the source `price_updates` and one that calls it
 * `ticker_updates`.
 *
 * The arguments above are compile-time constants in the program and constants
 * here, in two places, which is a duplication worth naming. It is not one the
 * deck can remove: a channel declaration is `{name, kind, type}` and has no
 * field for an endpoint or a product list, `channels.json` is generated in the
 * compiler's repo, and the arguments themselves live in the program's source
 * text where the only way to reach them would be for the page to parse Cambra.
 * `SUBSCRIBED` below is that copy, in one place, next to the note.
 */

import { SCALE } from "./transport";

/**
 * One price the feed saw, in both of the names that price has.
 *
 * A Coinbase product id (`BTC-USD`) and a ticker (`BTC`) are not the same
 * string, and the split matters because the two sides of this page key off
 * different ones. The program's `holdings` and `one_map` are keyed by the bare
 * ticker — `one_map` has to answer `one_map[h.ticker]` for a holding, and a
 * holding is of an asset, not of a trading pair — so that is what crosses the
 * channel. The panel lists Coinbase products and formats each to its own
 * quoted precision, so `DECIMALS` and `prices` stay in product ids.
 *
 * Carrying both beats deriving one at each use. The derivation is a string
 * split and would be written in five places, each of which is a place to forget
 * it: the old wiring pushed `BTC-USD` into a program keyed by `BTC-USD` and the
 * mismatch could not arise; this one can, and a row keyed wrong does not fail,
 * it just quietly prices nothing.
 */
export interface Tick {
  /** The Coinbase product id, e.g. `BTC-USD`. What the panel keys on. */
  product: string;
  /** The bare ticker, e.g. `BTC`. What the program keys on. */
  ticker: string;
  /** Dollars × 10⁸, converted exactly from the decimal string. */
  price: number;
}

/** The 20 products the recorded slice carries, in the order the panel lists them. */
export const PRODUCTS = [
  "BTC-USD",
  "ETH-USD",
  "SOL-USD",
  "XRP-USD",
  "DOGE-USD",
  "ADA-USD",
  "AVAX-USD",
  "LINK-USD",
  "DOT-USD",
  "LTC-USD",
  "BCH-USD",
  "UNI-USD",
  "AAVE-USD",
  "ATOM-USD",
  "NEAR-USD",
  "APT-USD",
  "ARB-USD",
  "OP-USD",
  "SUI-USD",
  "HBAR-USD",
] as const;

/**
 * How many decimals each product's price is quoted to, from the slice.
 *
 * Display only. Every price crosses the channel at the same 10⁸ scale; this is
 * what the panel renders it back to, so `HBAR-USD` does not read as `$0.08000`.
 */
export const DECIMALS: Record<string, number> = {
  "AAVE-USD": 2,
  "BCH-USD": 2,
  "BTC-USD": 2,
  "ETH-USD": 2,
  "SOL-USD": 2,
  "AVAX-USD": 3,
  "LINK-USD": 3,
  "LTC-USD": 3,
  "APT-USD": 4,
  "ATOM-USD": 4,
  "DOT-USD": 4,
  "NEAR-USD": 4,
  "SUI-USD": 4,
  "UNI-USD": 4,
  "XRP-USD": 4,
  "ADA-USD": 5,
  "ARB-USD": 5,
  "DOGE-USD": 5,
  "HBAR-USD": 5,
  "OP-USD": 5,
};

/**
 * The products the program's socket subscribes to.
 *
 * The third argument to the `wasm_socket_subscribe` at the foot of the program,
 * copied — see this module's note for why it cannot be read from anywhere. It
 * is the whole of what "tracked" means now: the four-channel program filtered
 * its one price source down to three tickers in the program, and the panel
 * could tell which were tracked by asking which had a sink. The route-shaped
 * program has no such filter — `prices[u.ticker] := u.price` takes whatever
 * arrives — so what the program prices is exactly what the host subscribed it
 * to, and the page is the host.
 *
 * The panel lists twenty products either way. Rows outside this list are drawn
 * from the page's own copy of the feed and marked `not tracked`, which is
 * honest in a way the old wiring was not: the program never sees them at all
 * now, rather than seeing them and rejecting them.
 */
export const SUBSCRIBED = ["BTC-USD", "ETH-USD", "SOL-USD"] as const;

/**
 * The bare ticker in a product id: `BTC-USD` → `BTC`.
 *
 * Everything the deck quotes is a `-USD` pair, so this is a suffix strip rather
 * than a parse. It takes the part before the first `-` instead of stripping the
 * literal `-USD` so that a `BTC-USDC` or a `BTC-EUR` added to the panel later
 * lands on the asset's own ticker, which is the key the program holds it under.
 * A product id with no `-` in it is already bare and comes back unchanged.
 */
export function bareTicker(product: string): string {
  const dash = product.indexOf("-");
  return dash === -1 ? product : product.slice(0, dash);
}

/**
 * The product id a bare ticker belongs to: `BTC` → `BTC-USD`.
 *
 * The inverse of `bareTicker`, for the one direction the reply path needs: a
 * `GET /cart` reply names its lines by ticker and the panel draws them in
 * product-id space. Resolved against `PRODUCTS` rather than by appending
 * `-USD`, so the answer stays right if the panel's basket ever quotes an asset
 * against something else; an unknown ticker falls back to the `-USD` pair,
 * because a row the panel cannot name is still a row it must draw.
 */
const PRODUCT_FOR_TICKER = new Map(PRODUCTS.map((p) => [bareTicker(p), p as string]));

export function productFor(ticker: string): string {
  return PRODUCT_FOR_TICKER.get(ticker) ?? `${ticker}-USD`;
}

/**
 * A decimal price string as dollars × 10⁸, exactly.
 *
 * String arithmetic rather than `parseFloat(x) * 1e8`: the float route turns
 * `"0.07948"` into `7947999.999999999`, and a price that arrives at the program
 * one unit off its true value is a wrong number on a slide. Digits are shifted
 * instead, which is exact for every decimal the feed quotes.
 */
export function scalePrice(decimal: string): number {
  const trimmed = decimal.trim();
  const negative = trimmed.startsWith("-");
  const body = negative ? trimmed.slice(1) : trimmed;
  const [whole, fraction = ""] = body.split(".");
  const digits = String(SCALE).length - 1;
  if (fraction.length > digits) {
    throw new Error(`price ${decimal} is quoted finer than the 10^${digits} scale`);
  }
  const padded = fraction.padEnd(digits, "0");
  const scaled = Number(`${whole}${padded}`);
  if (!Number.isSafeInteger(scaled)) {
    throw new Error(`price ${decimal} does not scale to a safe integer`);
  }
  return negative ? -scaled : scaled;
}

/** A scaled price back to a display string, at the product's own precision. */
export function formatPrice(scaled: number, ticker: string): string {
  const decimals = DECIMALS[ticker] ?? 2;
  return (scaled / SCALE).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * A scaled figure as dollars and cents.
 *
 * A line total, a balance and an amount due are all money, so they are all two
 * decimals whatever the asset's price is quoted to — `formatPrice` is the one
 * that varies, and it varies because a quote for HBAR at two decimals would
 * read as `$0.08` for every price it ever takes.
 */
export function formatDollars(scaled: number): string {
  return (scaled / SCALE).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * A quantity in whole units, at a precision that suits what it is.
 *
 * Up to four decimals and no trailing zeroes: the route-shaped program's cart
 * moves in thousandths of a unit, and a holding seeded at two whole bitcoin
 * should read `2`, not `2.0000`. The four-channel program counts whole units
 * only and lands on the same rendering for free.
 */
export function formatQuantity(units: number): string {
  return units.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

/** One row of the recorded slice. */
interface SliceRow {
  /** Milliseconds from the start of the capture. */
  t: number;
  /** Product id. */
  p: string;
  /** Price, as the decimal string Coinbase sent. */
  px: string;
}

/** Parse the slice's NDJSON, dropping rows that are not price rows. */
export function parseSlice(text: string): SliceRow[] {
  const rows: SliceRow[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const row: unknown = JSON.parse(line);
    if (
      typeof row === "object" &&
      row !== null &&
      typeof (row as SliceRow).t === "number" &&
      typeof (row as SliceRow).p === "string" &&
      typeof (row as SliceRow).px === "string"
    ) {
      rows.push(row as SliceRow);
    }
  }
  return rows;
}

/**
 * A response body as text, inflating it only if it is still compressed.
 *
 * Whether a `.gz` arrives compressed depends on the server: one that sets
 * `Content-Encoding: gzip` has the browser inflate it already, and inflating
 * again fails; one that serves the bytes as an opaque file leaves the work
 * here. Both happen — Vite's dev server does the first, a bare file server the
 * second — so the magic number decides rather than a guess about the host.
 */
export async function readMaybeGzip(resp: Response): Promise<string> {
  const bytes = new Uint8Array(await resp.arrayBuffer());
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
  if (!isGzip) return new TextDecoder().decode(bytes);
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

export type FeedMode = "replay" | "live";

export interface FeedStatus {
  mode: FeedMode;
  /** What the feed is doing, for the panel's status line. */
  detail: string;
}

/**
 * The recorded slice, replayed on its own timings and looped.
 *
 * The loop re-bases `t` rather than restarting the clock, so a deck left open
 * keeps producing without a visible seam. Rows arrive at the rate they were
 * recorded at — 2.33/s across 20 products — because that rate is the thing
 * being shown.
 */
export class ReplayFeed {
  private rows: SliceRow[] = [];
  private index = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private base = 0;
  private startedAt = 0;

  constructor(
    private readonly onTick: (tick: Tick) => void,
    private readonly onStatus: (status: FeedStatus) => void,
  ) {}

  async start(url: string): Promise<void> {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`slice: HTTP ${resp.status}`);
    this.rows = parseSlice(await readMaybeGzip(resp));
    if (this.rows.length === 0) throw new Error("the slice carries no price rows");
    this.startedAt = performance.now();
    this.onStatus({ mode: "replay", detail: `${this.rows.length} rows` });
    this.schedule();
  }

  private schedule(): void {
    const row = this.rows[this.index];
    if (!row) {
      // Loop: re-base so the next pass' timings continue rather than restart.
      this.index = 0;
      this.base += this.rows[this.rows.length - 1]?.t ?? 0;
      this.schedule();
      return;
    }
    const due = this.base + row.t;
    const wait = Math.max(0, due - (performance.now() - this.startedAt));
    this.timer = setTimeout(() => {
      this.index += 1;
      try {
        this.onTick({ product: row.p, ticker: bareTicker(row.p), price: scalePrice(row.px) });
      } catch {
        // A row quoted finer than the scale is dropped rather than stopping the
        // feed; the slice has none, and a live one should not end the demo.
      }
      this.schedule();
    }, wait);
  }

  stop(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}

/**
 * Coinbase's public `ticker_batch` channel — keyless, CORS-open, 24/7.
 *
 * The deck's default feed, and the page's side of `wasm_socket_subscribe`:
 * connect, send the subscription, decode each message, emit one typed row per
 * quote. No JSON reaches the program — that is the point of the primitive, and
 * the reason the program contains no string splitting.
 *
 * It subscribes to all twenty products the panel lists, not to the three the
 * program's declaration names. The panel is a price list and shows twenty; the
 * wiring is what decides which of them cross into the program, and it uses the
 * declared list. Subscribing here to the declared three instead would leave the
 * other seventeen rows blank, which says "this demo has three products" rather
 * than "this program is reading three of the twenty on screen".
 *
 * `ticker_batch` sends one message per product per ~5 s when the price moved,
 * which is already inside the band the replay was recorded at, so nothing
 * downstream throttles.
 */
export class LiveFeed {
  private socket: WebSocket | null = null;

  constructor(
    private readonly onTick: (tick: Tick) => void,
    private readonly onStatus: (status: FeedStatus) => void,
  ) {}

  start(): void {
    this.onStatus({ mode: "live", detail: "connecting" });
    const socket = new WebSocket("wss://ws-feed.exchange.coinbase.com");
    this.socket = socket;
    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          channels: [{ name: "ticker_batch", product_ids: [...PRODUCTS] }],
        }),
      );
      this.onStatus({ mode: "live", detail: "coinbase" });
    });
    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") return;
      let message: { type?: string; product_id?: string; price?: string };
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message.type !== "ticker" || !message.product_id || !message.price) return;
      try {
        this.onTick({
          product: message.product_id,
          ticker: bareTicker(message.product_id),
          price: scalePrice(message.price),
        });
      } catch {
        // As replay: a price the scale cannot hold is dropped, not fatal.
      }
    });
    socket.addEventListener("close", () => this.onStatus({ mode: "live", detail: "disconnected" }));
    socket.addEventListener("error", () => this.onStatus({ mode: "live", detail: "unreachable" }));
  }

  stop(): void {
    this.socket?.close();
    this.socket = null;
  }
}
