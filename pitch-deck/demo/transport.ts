/**
 * The one interface the demo panel talks to.
 *
 * A Cambra program reads named sources and feeds named sinks; a host pushes
 * rows into the first and reads rows out of the second. Everything on the page
 * — the cart, the inspector, the feed — goes through this, so what is behind it
 * (a WebAssembly module in a Worker, or an in-memory stand-in) is not a thing
 * the panel knows.
 */

/** A scalar a row field can hold, matching the channel's declared type. */
export type Scalar = string | number | boolean;

/** One row crossing a channel, its fields named by the declared row type. */
export type Row = Record<string, Scalar>;

/** Rows one sink produced. */
export interface SinkRows {
  sink: string;
  rows: Row[];
}

export interface CambraTransport {
  /** Append typed rows to a host source. */
  push(source: string, rows: Row[]): void;
  /** Subscribe to a sink; returns an unsubscribe. */
  sink(name: string, cb: (rows: Row[]) => void): () => void;
  /** Subscribe to the inspector's live frames; returns an unsubscribe. */
  frames(cb: (frame: string) => void): () => void;
  /** The `/api/snapshot` payload for the running program. */
  snapshot(): Promise<string>;
  /** Stop driving and release whatever is behind this. */
  dispose(): void;
}

/** The tickers the demo program keeps, in the order the cart lists them. */
export const TRACKED = ["BTC-USD", "ETH-USD", "SOL-USD"] as const;

/** The sink each tracked ticker's line arrives on. */
export const LINE_SINKS: Record<string, string> = {
  "BTC-USD": "btc_line",
  "ETH-USD": "eth_line",
  "SOL-USD": "sol_line",
};

/**
 * Dollars × 10⁸ — the scale every price crosses a channel at.
 *
 * Fixed for every product rather than per-product, so replay needs no
 * `/products` call and the deck stays offline. Exact for every price in the
 * basket, and inside `Number.MAX_SAFE_INTEGER` for any plausible one.
 */
export const SCALE = 100_000_000;
