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
  | { kind: "push"; source: string; rows: Record<string, unknown>[] }
  | { kind: "setRate"; idleMs: number }
  | { kind: "stop" };

/** What the Worker sends back. */
export type Response =
  | { kind: "ready"; snapshot: string }
  | { kind: "error"; message: string }
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
      post({ kind: "ready", snapshot: program.snapshot() });
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
