/**
 * The Worker that owns the WebAssembly module.
 *
 * Compiling a program and ticking it are the two things on this page that take
 * real time, and both happen here so neither lands on the slide's paint. The
 * Worker also owns the clock: `tick` does one scheduler pass and returns, so the
 * loop is a `setTimeout` this file controls rather than anything the module
 * holds.
 *
 * The runtime is `Rc`/`RefCell` throughout with no `Send`, and `thread::spawn`
 * panics on wasm, so there is exactly one module in one Worker — no threads, no
 * `SharedArrayBuffer`, and none of the cross-origin isolation those would need.
 */

import init, { init_panic_hook, Program } from "../public/wasm/cambra.js";

/** What the page sends the Worker. */
type Request =
  | { kind: "compile"; wasmUrl: string; source: string; channels: unknown[] }
  /**
   * Swap an edited version in over the running one, keeping its state.
   *
   * No `channels`: a version compiles against the declarations the program was
   * built with, and a reload that took a fresh set would be a different program
   * wearing the same name. That is the shape of the difference between this and
   * `compile` — one replaces the version, the other replaces the program.
   */
  | { kind: "reload"; source: string }
  // A row is a value of the channel's declared row type, which is usually a
  // record and need not be one — `view_requests` in the four-channel program is
  // a bare `Bool`. The module decodes against the declaration, so anything
  // narrower here would be this file claiming to know the program's types.
  | { kind: "push"; source: string; rows: unknown[] }
  | { kind: "setRate"; idleMs: number }
  | { kind: "stop" };

/**
 * What the Worker sends back.
 *
 * `rejected` is deliberately not `error`. An `error` is the host failing — a
 * program that would not compile at boot, a tick that threw — and the page
 * paints it as a fault, because nothing is running behind it. A `rejected` is a
 * *version* the compiler would not take, which leaves the program that was
 * already running still running and still holding its state: the page has a
 * diagnostic to show the author and nothing to mourn. Collapsing the two would
 * put a typo on stage on the same footing as a dead module, which is the one
 * behaviour this path exists to avoid.
 */
export type Response =
  | { kind: "ready"; snapshot: string; subscriptions: string }
  | { kind: "error"; message: string }
  /** An accepted reload: the reuse tally, and the payloads a page re-reads. */
  | { kind: "reloaded"; tally: string; snapshot: string; subscriptions: string }
  /** A refused version: the rendered diagnostic against the source sent. */
  | { kind: "rejected"; message: string }
  | { kind: "sink"; sink: string; rows: Record<string, unknown>[] }
  | { kind: "frame"; frame: string };

let program: Program | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
/**
 * How long to wait before the next tick when the last one produced nothing.
 *
 * A tick that produced is followed immediately, because a program that just
 * moved usually has more to say; an idle one waits, so a deck sitting on
 * another slide is not spending a core on a program with no input.
 */
let idleMs = 16;

function post(message: Response): void {
  self.postMessage(message);
}

/** One pass: drive the program, forward what it produced. */
function pump(): void {
  timer = null;
  if (!program) return;
  let produced = false;
  try {
    const result = program.tick();
    produced = result.produced === true;
    for (const output of result.outputs ?? []) {
      post({ kind: "sink", sink: output.sink, rows: output.rows });
    }
    // A frame is worth rendering only when something recorded; on any other
    // tick it repeats what the last one said, and the values pane would redraw
    // an unchanged picture many times a second.
    if (produced) post({ kind: "frame", frame: program.frame(false) });
  } catch (e) {
    post({ kind: "error", message: `tick: ${String(e)}` });
    return;
  }
  schedule(produced ? 0 : idleMs);
}

function schedule(delay: number): void {
  if (timer !== null) clearTimeout(timer);
  timer = setTimeout(pump, delay);
}

self.onmessage = async (event: MessageEvent<Request>) => {
  const request = event.data;
  try {
    if (request.kind === "compile") {
      await init({ module_or_path: request.wasmUrl });
      init_panic_hook();
      program = Program.compile("cart.cambra", request.source, request.channels);
      post({
        kind: "ready",
        snapshot: program.snapshot(),
        subscriptions: program.subscriptions(),
      });
      schedule(0);
      return;
    }
    if (request.kind === "reload") {
      // Answered whatever happens, including this. The page holds a promise per
      // reload and the inspector shows the editor's fault line from its
      // rejection, so a request the Worker drops silently is an editor that
      // swallows the chord — the failure mode hardest to diagnose from a stage.
      if (!program) {
        post({ kind: "rejected", message: "the program is not running" });
        return;
      }
      // Caught here rather than by the handler's own `catch`, which posts an
      // `error` and so tells the page the host is gone. It is not: `reload`
      // compiles and type-checks the new version before it tears anything down,
      // so a throw leaves the old program answering at the generation it last
      // reported, with every cell it was holding.
      let tally: string;
      try {
        tally = program.reload(request.source);
      } catch (e) {
        post({ kind: "rejected", message: String(e) });
        return;
      }
      // Both re-read, and after the swap rather than before: `snapshot` is the
      // new version's source and IR, and `subscriptions` is the new version's
      // whole list — a feed it dropped is gone from it rather than marked, so
      // the page compares lists rather than applying a delta.
      post({
        kind: "reloaded",
        tally,
        snapshot: program.snapshot(),
        subscriptions: program.subscriptions(),
      });
      // The new version has not been driven yet and the page is about to ask it
      // for a view; a pass now is what answers that in the same beat as the
      // chord rather than after the idle delay.
      schedule(0);
      return;
    }
    if (!program) return;
    if (request.kind === "push") {
      program.push(request.source, request.rows);
      // A push is news: drive at once rather than waiting out the idle delay,
      // so the cart answers a tap in one frame rather than in sixteen
      // milliseconds plus whatever the loop was sleeping.
      schedule(0);
      return;
    }
    if (request.kind === "setRate") {
      idleMs = request.idleMs;
      return;
    }
    if (request.kind === "stop") {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    }
  } catch (e) {
    post({ kind: "error", message: String(e) });
  }
};
