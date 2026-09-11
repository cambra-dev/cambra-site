/**
 * The page's side of the Worker: a `CambraTransport` over `postMessage`, and
 * the journal that makes a replay possible.
 */

import type { CambraTransport, Row, SinkRows } from "./transport";
import type { Response } from "./worker";

/** One thing the host pushed, in the order it pushed it. */
export interface JournalEntry {
  source: string;
  rows: Row[];
}

/**
 * Every row the host has pushed, in order.
 *
 * The host is the only thing that has ever fed the program, and a host source
 * mints its keys from arrival order — so a fresh program fed this journal
 * reaches the state the old one held. That is the whole mechanism for carrying
 * state across a recompile: nothing in the runtime serializes a `Mut` cell.
 */
export class Journal {
  private readonly entries: JournalEntry[] = [];

  append(source: string, rows: Row[]): void {
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

  constructor(
    private readonly options: {
      wasmUrl: string;
      moduleUrl: URL;
      source: string;
      channels: unknown[];
      onError?: (message: string) => void;
    },
  ) {
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

  push(source: string, rows: Row[]): void {
    this.worker.postMessage({ kind: "push", source, rows });
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
