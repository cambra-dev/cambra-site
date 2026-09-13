/**
 * The page's side of the Worker: a `CambraTransport` over `postMessage`.
 *
 * ## The journal, and why it is gone
 *
 * This file used to export a `Journal`: every row the host had ever pushed, in
 * order, so that a recompiled program fed the whole history re-derived the state
 * the old one held. A host source mints its keys from arrival order and nothing
 * in the runtime serializes a `Mut` cell, so that replay was the only way to
 * make ⌘⏎ keep the cart — and it came with a careful argument about why
 * replaying a `PUT /checkout` did not double-charge (it was a re-derivation from
 * nothing, not an append onto live state).
 *
 * `Program.reload` makes the whole mechanism unnecessary, and it was never as
 * strong as the slide's claim. A replay produces a *second program* that happens
 * to agree: every operator is a new object, every `NodeId` is freshly minted,
 * and anything the program was holding that a source did not put there is gone.
 * A reload keeps the operators themselves — `kept` of `bound` counts them — so
 * the state does not travel, it simply is not disturbed. "Code, data and
 * in-flight work move in one transaction" is true of the second and only
 * approximately true of the first.
 *
 * The other chord does not want it either. ⌘⇧⏎ means *from scratch*, and a
 * fresh program fed the journal would be neither fresh nor the old program —
 * it would be exactly the thing ⌘⏎ now does properly, with none of the
 * identity. So the journal has no remaining caller, and keeping it would mean
 * growing an array by one entry per price row for the length of a talk on behalf
 * of nothing. It is deleted rather than left unused; this note is what it leaves
 * behind, and `jj` has the code if the argument ever needs re-reading.
 */

import { ChannelMap } from "./transport";
import type {
  CambraTransport,
  ChannelDecl,
  ReloadReport,
  Row,
  RouteHandle,
  SinkRows,
  SocketSubscription,
  Value,
} from "./transport";
import type { Response } from "./worker";

/** A transport over a Worker holding the WebAssembly module. */
export class WorkerTransport implements CambraTransport {
  private readonly worker: Worker;
  private readonly sinkHandlers = new Map<string, Set<(rows: Row[]) => void>>();
  private readonly frameHandlers = new Set<(frame: string) => void>();
  private snapshotText!: Promise<string>;
  private resolveSnapshot!: (text: string) => void;
  private rejectSnapshot!: (reason: Error) => void;
  private subscriptionList!: Promise<SocketSubscription[]>;
  private resolveSubscriptions!: (feeds: SocketSubscription[]) => void;
  private rejectSubscriptions!: (reason: Error) => void;
  /**
   * One settler per reload in flight, oldest first.
   *
   * A queue rather than a single slot, because the Worker answers every
   * `reload` with exactly one `reloaded` or `rejected` in the order it took
   * them, and a chord pressed twice in a second would otherwise leave the first
   * promise pending forever — which reaches the author as an editor that
   * swallowed the keystroke rather than as anything diagnosable.
   */
  private readonly pendingReloads: {
    resolve: (report: ReloadReport) => void;
    reject: (reason: Error) => void;
  }[] = [];
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
    this.arm();
    this.worker = new Worker(options.moduleUrl, { type: "module" });
    this.worker.onmessage = (event: MessageEvent<Response>) => this.receive(event.data);
    this.worker.postMessage({
      kind: "compile",
      wasmUrl: options.wasmUrl,
      source: options.source,
      channels: options.channels,
    });
  }

  /**
   * Arm the promises a compile settles: the snapshot and the subscription list.
   *
   * Both, together, because they describe one program and one `ready` message
   * carries both. Re-armed by `recompile`, which is the other thing that
   * produces a `ready`.
   *
   * The idle `catch` on the subscription list is not a swallowed failure. A
   * compile that fails settles both as rejections and the boot path reports it
   * from the snapshot, which it awaits first and returns on; the list is then a
   * rejection nobody is waiting for, and an unhandled rejection in the console
   * is noise on top of a fault the page has already named.
   */
  private arm(): void {
    this.snapshotText = new Promise<string>((resolve, reject) => {
      this.resolveSnapshot = resolve;
      this.rejectSnapshot = reject;
    });
    this.subscriptionList = new Promise<SocketSubscription[]>((resolve, reject) => {
      this.resolveSubscriptions = resolve;
      this.rejectSubscriptions = reject;
    });
    void this.subscriptionList.catch(() => {});
  }

  private receive(message: Response): void {
    if (message.kind === "ready") {
      this.resolveSnapshot(message.snapshot);
      this.resolveSubscriptions(JSON.parse(message.subscriptions) as SocketSubscription[]);
      return;
    }
    if (message.kind === "error") {
      this.rejectSnapshot(new Error(message.message));
      this.rejectSubscriptions(new Error(message.message));
      this.options.onError?.(message.message);
      return;
    }
    if (message.kind === "reloaded") {
      const tally = JSON.parse(message.tally) as {
        generation: number;
        kept: number;
        bound: number;
      };
      this.pendingReloads.shift()?.resolve({
        ...tally,
        snapshot: message.snapshot,
        subscriptions: JSON.parse(message.subscriptions) as SocketSubscription[],
      });
      return;
    }
    if (message.kind === "rejected") {
      // A rejection and not `onError`: the program the page is driving is
      // unchanged and still answering. Only the author's editor hears about
      // this, which is where the diagnostic points.
      this.pendingReloads.shift()?.reject(new Error(message.message));
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
   * What the running program subscribes to, settled by the same `ready` the
   * snapshot is.
   *
   * Empty where the program declares no `wasm_socket_subscribe`, which is what
   * the version running today reports: its prices arrive on a plain declared
   * source that the page fills from a socket of its own. `demo/feed.ts` says
   * what the page does with each case.
   */
  subscriptions(): Promise<SocketSubscription[]> {
    return this.subscriptionList;
  }

  /**
   * Swap an edited version in over the running one, keeping its state.
   *
   * This is the keep-state chord, and it is a different act from `recompile`:
   * the program is not replaced, a *version* of it is. Operators whose
   * computation is unchanged keep running and every mutable variable resumes
   * from the value it held, so there is nothing for the caller to carry across
   * — which is why this file no longer has a journal, and why the report says
   * `kept` of `bound` rather than just succeeding.
   *
   * No channels are sent. A version compiles against the declarations the
   * program already has; handing it a fresh set would make it a different
   * program wearing the same name, and `route` handles resolved before the
   * reload would quietly be pointing at the old one's channels.
   *
   * A version the compiler will not take settles this as a rejection carrying
   * the rendered diagnostic — a line, a column and a caret into the source the
   * caller sent — and changes nothing: the old program answers on, at the
   * generation it last reported, with everything it was holding. That is the
   * behaviour the demo slide depends on, because the source pane is edited live
   * in front of a room and a typo there must cost a toast, not the program.
   */
  reload(source: string): Promise<ReloadReport> {
    const report = new Promise<ReloadReport>((resolve, reject) => {
      this.pendingReloads.push({ resolve, reject });
    });
    this.worker.postMessage({ kind: "reload", source });
    return report;
  }

  /**
   * Compile `source` as a new program in place of the running one, and answer
   * its snapshot.
   *
   * The from-scratch chord. The same Worker and the same module — `init` is
   * cached, so this is one `Program.compile` and the tick loop picks the new
   * program up on its next pass — but a new program: nothing carries over, no
   * operator is reused, generation counts from zero again, and every `Mut` cell
   * starts at its declaration's value. That is the point of the chord, and the
   * reason `reload` exists beside it rather than instead of it.
   *
   * A program that does not compile settles the promise as a rejection; the
   * previous program keeps running, because the Worker only replaces `program`
   * once `Program.compile` has returned.
   */
  recompile(source: string): Promise<string> {
    this.arm();
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
