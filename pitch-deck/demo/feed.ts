/**
 * The price feed: a recorded slice on a loop, or Coinbase live.
 *
 * Both emit the same `{ticker, price}` rows through the same callback, so the
 * journal and the program see one shape and the toggle changes nothing
 * downstream. Replay is the default because a deck must work with no network.
 */

import { SCALE } from "./transport";

/** One price the feed saw. */
export interface Tick {
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
        this.onTick({ ticker: row.p, price: scalePrice(row.px) });
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
 * The live toggle. `ticker_batch` sends one message per product per ~5 s when
 * the price moved, which is already inside the band the replay was recorded at,
 * so nothing downstream throttles.
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
        this.onTick({ ticker: message.product_id, price: scalePrice(message.price) });
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
