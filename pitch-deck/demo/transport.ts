/**
 * The one interface the demo panel talks to.
 *
 * A Cambra program reads named sources and feeds named sinks; a host pushes
 * rows into the first and reads rows out of the second. Everything on the page
 * — the cart, the inspector, the feed — goes through this, so what is behind it
 * (a WebAssembly module in a Worker, or an in-memory stand-in) is not a thing
 * the panel knows.
 *
 * The program used to declare four flat channels and the page spelled all six
 * names. It now declares routes — `wasm_serve("PATCH", "/cart")` binds a
 * request source and a reply sink as a pair — and a socket, and the names on
 * either side of those pairs are *local bindings in the program*, produced by a
 * top-level tuple destructure. Nothing outside the program sees them; what both
 * sides agree on is the method and the path. So the page asks for a route and
 * the channel names are resolved out of the declarations it was handed, rather
 * than written here. See `ChannelMap` for what that resolution tolerates and
 * why.
 */

/** A scalar a row field can hold, matching the channel's declared type. */
export type Scalar = string | number | boolean;

/**
 * One value a row field can hold.
 *
 * Rows used to be flat, and `Row = Record<string, Scalar>` was honest about it:
 * every channel in the four-channel program carried three integers. `GET /cart`
 * replies with `{cash, lines: [...], positions: [...]}` — a record whose fields
 * are lists of records — so the flat type would have made the one row the cart
 * is drawn from the one row that does not typecheck.
 *
 * Deliberately structural rather than a declared reply interface: this type
 * describes what *a channel* can carry, and the shape of any particular row is
 * the program's business, checked where the page decodes it (`CartDemo.vue`)
 * rather than asserted here. A declared interface would have to be kept in step
 * with a program the deck does not own, and would read as a promise the deck
 * cannot keep.
 */
export type Value = Scalar | Value[] | { [field: string]: Value };

/**
 * One row crossing a channel, its fields named by the declared row type.
 *
 * Every route in the route-shaped program carries a record, so this is the type
 * a reply is read at and a request is written at. It is not, however, what a
 * *channel* can carry: a row is a value of the declared row type and that type
 * need not be a record — the four-channel program declares `view_requests` as a
 * bare `Bool`, and its rows are `true`. `push` therefore takes `Value[]` and
 * only the route form narrows to records.
 */
export type Row = Record<string, Value>;

/** Rows one sink produced. */
export interface SinkRows {
  sink: string;
  rows: Row[];
}

/**
 * One host channel, as `public/wasm/channels.json` declares it.
 *
 * The three fields the module's own `ChannelDecl` deserializes, and no more:
 * this file is generated in the compiler's repo and copied in by
 * `scripts/sync-cambra.sh`, so the deck reads the contract and never writes it.
 * A route is not a fourth field — see `ChannelMap`.
 */
export interface ChannelDecl {
  /**
   * The name the channel is registered under.
   *
   * For a plain source or sink, the name the program spells. For a route's two
   * halves, the request line the `wasm_serve` names — `"PATCH /cart"` — which
   * both halves carry, because a route is one name with a direction on each
   * side.
   */
  name: string;
  /** `source`, `sink`, or a route's `request` / `response`. */
  kind: string;
  /** The row type, as a CHL type expression. Unread here; the module parses it. */
  type?: string;
}

/** A route's two channels, and the two things the page does with them. */
export interface RouteHandle {
  readonly method: string;
  readonly path: string;
  /** The host source a request crosses. Named, because the journal records it. */
  readonly requests: string;
  /** The host sink the paired reply crosses. */
  readonly replies: string;
  /** Send one request. The reply arrives on `onReply`, not from here. */
  send(rows: readonly Row[]): void;
  /** Subscribe to this route's replies; returns an unsubscribe. */
  onReply(cb: (rows: Row[]) => void): () => void;
}

/** The request line a route's two halves are registered under. */
export function routeName(method: string, path: string): string {
  return `${method.toUpperCase()} ${path}`;
}

/** Whether a declaration's name is a route's rather than a program's. */
function isRouteName(name: string): boolean {
  return /^[A-Z]+ \//.test(name);
}

/** A declaration that carries rows *into* the program. */
function isRequestSide(kind: string): boolean {
  return kind === "request" || kind === "source";
}

/** A declaration that carries rows *out of* it. */
function isReplySide(kind: string): boolean {
  return kind === "response" || kind === "sink";
}

/**
 * The declarations, indexed the way the program binds them.
 *
 * Two things are resolved here rather than written into the page:
 *
 * A **route** is found by `(method, path)`. `wasm_serve("PATCH", "/cart")`
 * returns two locally-named bindings — `cart_changes, cart_change_acks` — and
 * those names are the program's own business; what the host registers both
 * halves under is the request line, `"PATCH /cart"`, with `kind` saying which
 * direction each half runs. So the page asks for a method and a path, which is
 * the half of the binding both sides can see, and never spells a channel name.
 * The four-channel wiring spelled `cart_changes`, `btc_line` and four more in
 * `CartDemo.vue`; every one of those was a guess that happened to be right, and
 * would have gone on being a guess that silently pushed into nothing the moment
 * the program renamed a binding.
 *
 * The **socket** is found by elimination: the ingress channel that is not part
 * of a route. Matching on the name would mean choosing between `price_updates`
 * and `ticker_updates` — the four-channel name and the one the route-shaped
 * draft uses — and being wrong about it costs the whole feed, silently, because
 * a push to a name no source answers to is the one error the deck cannot see
 * coming. There is exactly one non-route source in the program, so "the one
 * that is left" is both true and stable under a rename.
 *
 * `kind` is read a little loosely: `request`/`response` is what the module's
 * `ChannelKind` spells for a route, and `source`/`sink` under a route name is
 * accepted as the same thing. That costs two predicates and covers a
 * declaration file written by hand — this deck ships one as a stand-in until
 * the compiler's own lands — without weakening anything, since the route name
 * has already selected the pair.
 *
 * Every lookup that fails throws, naming what the file *does* carry. The demo
 * slide turns that into the panel's fault line, which is the point: a route the
 * program does not serve has to be visible on the slide, not a control that
 * quietly does nothing when it is pressed.
 */
export class ChannelMap {
  constructor(private readonly declarations: readonly ChannelDecl[]) {}

  /** The declarations, as `Program.compile` wants them. */
  get all(): readonly ChannelDecl[] {
    return this.declarations;
  }

  /** The two channels bound by `wasm_serve(method, path)`. */
  pair(method: string, path: string): { requests: string; replies: string } {
    const name = routeName(method, path);
    const requests = this.declarations.find((d) => d.name === name && isRequestSide(d.kind));
    const replies = this.declarations.find((d) => d.name === name && isReplySide(d.kind));
    if (!requests || !replies) {
      throw new Error(
        `the program declares no '${name}' ${requests ? "response" : "request"} channel` +
          ` — it declares ${this.summary()}`,
      );
    }
    return { requests: requests.name, replies: replies.name };
  }

  /**
   * The source a `wasm_socket_subscribe` feed fills.
   *
   * The name only. What that socket subscribes to is in the program's own
   * source text as compile-time constants, and the declaration file has no
   * field for it — `demo/feed.ts` carries the page's copy of those arguments
   * and says why.
   */
  socket(): string {
    const sockets = this.declarations.filter(
      (d) => isRequestSide(d.kind) && d.kind !== "request" && !isRouteName(d.name),
    );
    if (sockets.length !== 1) {
      throw new Error(
        `the program declares ${sockets.length} sources outside a route, not one` +
          ` — it declares ${this.summary()}`,
      );
    }
    return sockets[0]!.name;
  }

  /** What the file carries, for an error a reader can act on. */
  private summary(): string {
    if (this.declarations.length === 0) return "nothing";
    return this.declarations.map((d) => `${d.kind} ${d.name}`).join(", ");
  }
}

export interface CambraTransport {
  /** Append typed rows to a host source. */
  push(source: string, rows: readonly Value[]): void;
  /**
   * The request/response form of `push`: a route, with its reply attached.
   *
   * `push` names one channel and knows nothing about what answers it. A route
   * is a pair — the program bound both halves in one `wasm_serve` call — so the
   * page asks for the pair once and then sends requests and hears replies
   * through the handle without naming either side.
   *
   * The handle broadcasts: every subscriber sees every reply, and the newest
   * reply is the current answer. It deliberately does not return a promise per
   * request. Pairing a reply to *its own* request would need a correlation id,
   * and the declared row types carry none — `{ok, ticker, qty}` says which
   * ticker changed but not which press changed it — so pairing could only be by
   * arrival order. Two things break that: a program that does not reply on a
   * denied path desynchronises the queue permanently (and whether an in-block
   * feed fires beside a false guard is an open question on the program side,
   * not a settled one), and a journal replay delivers a burst of replies with no
   * requests behind them at all. Under a subscription both cost a stale figure
   * for one frame; under a promise queue both mis-attribute every reply that
   * follows, for the rest of the talk.
   *
   * Throws when the declarations carry no such route, rather than pushing into
   * a channel that is not there.
   */
  route(method: string, path: string): RouteHandle;
  /** Subscribe to a sink; returns an unsubscribe. */
  sink(name: string, cb: (rows: Row[]) => void): () => void;
  /** Subscribe to the inspector's live frames; returns an unsubscribe. */
  frames(cb: (frame: string) => void): () => void;
  /** The `/api/snapshot` payload for the running program. */
  snapshot(): Promise<string>;
  /** Stop driving and release whatever is behind this. */
  dispose(): void;
}

/**
 * Dollars × 10⁸ — the scale every price crosses a channel at.
 *
 * Fixed for every product rather than per-product, so replay needs no
 * `/products` call and the deck stays offline. Exact for every price in the
 * basket, and inside `Number.MAX_SAFE_INTEGER` for any plausible one.
 */
export const SCALE = 100_000_000;

/**
 * Base units in one whole unit of an asset — satoshi per bitcoin.
 *
 * The same number as `SCALE` and a different quantity: `SCALE` is how finely a
 * *price* is quoted, this is how finely a *holding* is counted. The v1 program
 * divides every line by one constant (`one_btc`) whatever the asset is, which
 * is the simplification its `_rescaled` successor exists to undo — at which
 * point this constant becomes a per-ticker lookup (`one_map`) and the two stop
 * being equal for ETH and SOL. Keeping them apart now means that change lands
 * in one place instead of being archaeology.
 *
 * The panel talks in whole units and the program in base units; every crossing
 * multiplies or divides by this, and rounds, because a stepper adding thousandths
 * of a unit in binary floating point does not stay an integer on its own.
 */
export const BASE_UNITS = 100_000_000;
