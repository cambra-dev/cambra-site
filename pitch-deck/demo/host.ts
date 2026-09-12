/**
 * The page's side of the Worker: a `CambraTransport` over `postMessage`, and
 * the journal that makes a replay possible.
 */

import { ChannelMap } from "./transport";
import type { CambraTransport, ChannelDecl, Row, RouteHandle, SinkRows, Value } from "./transport";
import type { Response } from "./worker";

/** One thing the host pushed, in the order it pushed it. */
export interface JournalEntry {
  source: string;
  rows: readonly Value[];
}

/**
 * Every row the host has pushed, in order.
 *
 * The host is the only thing that has ever fed the program, and a host source
 * mints its keys from arrival order — so a fresh program fed this journal
 * reaches the state the old one held. That is the whole mechanism for carrying
 * state across a recompile: nothing in the runtime serializes a `Mut` cell.
 *
 * The route rewrite makes that mechanism carry a `PUT /checkout` — a row that
 * spends money — and the question is whether replaying one double-charges. It
 * does not, and the reason is worth stating, because the intuition from every
 * system that replays a message queue says otherwise. A replay here is not an
 * append onto live state: the recompiled program starts from its declarations
 * with empty `Mut` cells, and the journal is the *whole* history, pushed in the
 * order it was pushed the first time. A deterministic program re-derives the
 * same state, so the replayed checkout re-runs against the same balance, makes
 * the same `cash >= due` decision and lands on the same figure. An `at-least
 * once` delivery onto surviving state would double-charge; a re-derivation
 * from nothing cannot.
 *
 * The one case where the replay *should* differ is the case the chord exists
 * for: an edited program. A checkout that committed under the old source may be
 * denied under the new one — a different price, a different guard — and that is
 * the correct answer for the program now running, not a fault in the replay.
 *
 * What must stay out of the journal is a read. `GET /cart` changes nothing, so
 * replaying it only re-emits replies the panel then overwrites; `CartDemo.vue`
 * asks for one view after a replay instead, which keeps the journal to the rows
 * that are actually history. Journaling the reads would not be wrong, only
 * wasteful — and since a view is requested on every tracked price tick, it is
 * most of the volume.
 */
export class Journal {
  private readonly entries: JournalEntry[] = [];

  append(source: string, rows: readonly Value[]): void {
    this.entries.push({ source, rows });
  }

  /** What has been pushed, oldest first. */
  all(): readonly JournalEntry[] {
    return this.entries;
  }

  get length(): number {
    return this.entries.length;
  }

  /** Push every entry into `into`, in order. */
  replay(into: CambraTransport): void {
    for (const entry of this.entries) into.push(entry.source, entry.rows);
  }

  /** Forget everything pushed so far, for a run that starts from nothing. */
  clear(): void {
    this.entries.length = 0;
  }
}

/** A transport over a Worker holding the WebAssembly module. */
export class WorkerTransport implements CambraTransport {
  private readonly worker: Worker;
  private readonly sinkHandlers = new Map<string, Set<(rows: Row[]) => void>>();
  private readonly frameHandlers = new Set<(frame: string) => void>();
  private snapshotText: Promise<string>;
  private resolveSnapshot!: (text: string) => void;
  private rejectSnapshot!: (reason: Error) => void;
  /** The declarations, indexed by route — see `ChannelMap`. */
  readonly channels: ChannelMap;

  constructor(
    private readonly options: {
      wasmUrl: string;
      moduleUrl: URL;
      source: string;
      channels: ChannelDecl[];
      onError?: (message: string) => void;
    },
  ) {
    this.channels = new ChannelMap(options.channels);
    this.snapshotText = new Promise<string>((resolve, reject) => {
      this.resolveSnapshot = resolve;
      this.rejectSnapshot = reject;
    });
    this.worker = new Worker(options.moduleUrl, { type: "module" });
    this.worker.onmessage = (event: MessageEvent<Response>) => this.receive(event.data);
    this.worker.postMessage({
      kind: "compile",
      wasmUrl: options.wasmUrl,
      source: options.source,
      channels: options.channels,
    });
  }

  private receive(message: Response): void {
    if (message.kind === "ready") {
      this.resolveSnapshot(message.snapshot);
      return;
    }
    if (message.kind === "error") {
      this.rejectSnapshot(new Error(message.message));
      this.options.onError?.(message.message);
      return;
    }
    if (message.kind === "sink") {
      const handlers = this.sinkHandlers.get(message.sink);
      if (handlers) for (const h of handlers) h(message.rows as Row[]);
      return;
    }
    for (const h of this.frameHandlers) h(message.frame);
  }

  push(source: string, rows: readonly Value[]): void {
    this.worker.postMessage({ kind: "push", source, rows });
  }

  /**
   * The two channels `wasm_serve(method, path)` bound, as one handle.
   *
   * Resolved once, at the call: the declarations do not change while a program
   * runs, and a handle held across a recompile stays valid because the same
   * `channels` are passed to it (`recompile` sends `this.options.channels`
   * again). A handle that re-read the file on every send would be the only
   * thing on this page doing per-row work for no reason.
   *
   * `ChannelMap.pair` throws when the route is not declared, and this does not
   * catch it: a missing route is a wiring fault the slide should show, not a
   * control that silently does nothing.
   */
  route(method: string, path: string): RouteHandle {
    const { requests, replies } = this.channels.pair(method, path);
    return {
      method,
      path,
      requests,
      replies,
      send: (rows: readonly Row[]) => this.push(requests, rows),
      onReply: (cb: (rows: Row[]) => void) => this.sink(replies, cb),
    };
  }

  sink(name: string, cb: (rows: Row[]) => void): () => void {
    const handlers = this.sinkHandlers.get(name) ?? new Set();
    handlers.add(cb);
    this.sinkHandlers.set(name, handlers);
    return () => handlers.delete(cb);
  }

  frames(cb: (frame: string) => void): () => void {
    this.frameHandlers.add(cb);
    return () => this.frameHandlers.delete(cb);
  }

  snapshot(): Promise<string> {
    return this.snapshotText;
  }

  /**
   * Compile `source` in place of the running program, and answer its snapshot.
   *
   * The same Worker and the same module: `init` is cached, so this is one
   * `Program.compile` and the tick loop picks the new program up on its next
   * pass. Nothing carries over — a `Mut` cell is not serializable and the new
   * program's operators are new objects — so state is the caller's problem, and
   * `Journal.replay` is how the caller solves it.
   *
   * A program that does not compile settles the promise as a rejection; the
   * previous program keeps running, because the Worker only replaces `program`
   * once `Program.compile` has returned.
   */
  recompile(source: string): Promise<string> {
    this.snapshotText = new Promise<string>((resolve, reject) => {
      this.resolveSnapshot = resolve;
      this.rejectSnapshot = reject;
    });
    this.worker.postMessage({
      kind: "compile",
      wasmUrl: this.options.wasmUrl,
      source,
      channels: this.options.channels,
    });
    return this.snapshotText;
  }

  /**
   * How long the Worker waits before an idle tick.
   *
   * The deck keeps every slide mounted, so the program runs from load and the
   * cart is warm when the speaker arrives. Backing the rate off while the slide
   * is not current is what keeps that from costing a core for the whole talk.
   */
  setRate(idleMs: number): void {
    this.worker.postMessage({ kind: "setRate", idleMs });
  }

  dispose(): void {
    this.worker.postMessage({ kind: "stop" });
    this.worker.terminate();
    this.sinkHandlers.clear();
    this.frameHandlers.clear();
  }
}

/** Rows a sink produced, as the panel reads them. */
export type { SinkRows };
