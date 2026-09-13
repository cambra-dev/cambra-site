/**
 * Drive the demo slide's two programs through the WebAssembly module, and check
 * what the slide claims about them.
 *
 * The programs are the deck's own — `public/wasm/cart.cambra` and
 * `cart-v2.cambra`, over the channels in `channels.json` — and nothing else
 * checks that the module still takes them. The deck boots the program in a
 * Worker, and one the module refuses reaches the room as a fault line on the
 * order pad, so a compiler rebuild that broke either fails here instead.
 *
 *   npm run check:wasm
 *
 * The claims, in the order the presenter makes them:
 *
 *   1. v1 compiles, and says what it subscribes to. The panel's tracked rows
 *      are that list, so a program that named nothing would leave the slide
 *      showing a basket the program cannot see.
 *   2. It serves its three routes for every product it subscribes to. Each
 *      route reads its collections at a key and `m[k]` faults on an absent
 *      key — so a product the panel can press and the program has no seed for
 *      is a panic that takes the module with it.
 *   3. v2 is accepted as a reload and the state crosses the swap: the cart the
 *      presenter filled, the holdings behind it and the cash are all still
 *      there.
 *   4. v2 lists an asset v1 did not, and prices it at its own base unit. That
 *      is what a divisor per asset buys and what one shared `one_coin` could
 *      not express.
 *   5. The swap only runs forwards. v2 cannot be compiled from nothing, because
 *      `@LoadFrom` has no predecessor to read; and v1 cannot be reloaded over
 *      v2, because it says nothing about where the reshaped collections' values
 *      belong. The deck's `v1` button is a fresh compile for that second reason.
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const wasmDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "wasm");

/** The account the panel sends every request as — `ACCOUNT` in `CartDemo.vue`. */
const ACCOUNT = 1;
/** A quote per asset, scaled by 10^8 as every price on this page is. */
const QUOTE = { BTC: 10_000_000_000_000, LTC: 9_000_000_000, ETH: 250_000_000_000 };
/** One line, in base units. A thousandth of a coin at v1's scale. */
const QTY = 100_000;
/** What v2 divides an ETH line by, and v1 had no way to say. */
const GWEI = 1_000_000_000;

const problems = [];
function want(held, message) {
  if (!held) problems.push(message);
}

function say(heading) {
  process.stdout.write(`\n== ${heading}\n`);
}

const { default: init, init_panic_hook, Program } = await import(join(wasmDir, "cambra.js"));
await init({ module_or_path: await readFile(join(wasmDir, "cambra_bg.wasm")) });
init_panic_hook();

const channels = JSON.parse(await readFile(join(wasmDir, "channels.json"), "utf8")).channels;
const v1 = await readFile(join(wasmDir, "cart.cambra"), "utf8");
const v2 = await readFile(join(wasmDir, "cart-v2.cambra"), "utf8");

say("compiling cart.cambra against channels.json");
let program;
try {
  program = Program.compile("cart.cambra", v1, channels);
} catch (error) {
  console.error(`the module refused the program the slide boots:\n${error}`);
  process.exit(1);
}

/** What the running version subscribes to: its source, and its products. */
function subscribed() {
  const [quotes] = JSON.parse(program.subscriptions());
  return quotes ?? { source: null, products: [] };
}

let feed = subscribed();
console.log(`  compiled; ${feed.source} <- ${feed.products.join(", ")}`);
want(feed.source !== null, "v1 declares no subscription, so the panel has no basket to track");
want(
  feed.products.join() === "BTC-USD,LTC-USD",
  `v1 should list BTC and LTC, not ${feed.products.join(", ")}`,
);

/**
 * Rows the sinks produced since the last `reset`.
 *
 * The Worker's loop is a `setTimeout` chain; here it is a bounded run of ticks,
 * which is the same thing without a clock. The bound is far above what any
 * route below takes, so exhausting it would be a stall rather than a slow
 * answer.
 */
const TICKS_TO_SETTLE = 32;
let produced = [];
function settle() {
  for (let i = 0; i < TICKS_TO_SETTLE; i++) {
    for (const output of program.tick().outputs ?? []) produced.push(output);
  }
}
function reset() {
  produced = [];
}
function lastFrom(sink) {
  return produced.filter((o) => o.sink === sink).flatMap((o) => o.rows).pop();
}

/**
 * Run one step, and turn a panic into a reported claim rather than a stack trace.
 *
 * A fault inside the module poisons it — every later call answers "recursive use
 * of an object detected" — so a step that throws ends the run. Reporting it as a
 * failed claim first is what names the press that did it.
 */
function step(what, act) {
  try {
    act();
    settle();
    return true;
  } catch (error) {
    problems.push(`${what} faulted the module: ${String(error).split("\n")[0]}`);
    return false;
  }
}

/** The bare ticker a product id carries: `BTC-USD` → `BTC`. */
const bare = (product) => product.split("-")[0];

/** Quote every subscribed product, set a line in it, and read the cart back. */
function tradeEach(label) {
  const views = {};
  for (const product of feed.products) {
    const ticker = bare(product);
    const ok =
      step(`a ${ticker} quote`, () =>
        program.push(feed.source, [{ ticker, price: QUOTE[ticker] }]),
      ) &&
      step(`PATCH /cart ${ticker}`, () =>
        program.request("PATCH", "/cart", [{ account: ACCOUNT, ticker, qty: QTY }]),
      ) &&
      step(`GET /cart on a ${ticker} line`, () => {
        reset();
        program.request("GET", "/cart", [{ account: ACCOUNT }]);
      });
    if (!ok) break;
    const view = lastFrom("GET /cart");
    want(view !== undefined, `${label}: GET /cart answered nothing for a ${ticker} line`);
    if (!view) break;
    views[ticker] = view;
    want(view.ticker === ticker, `${label}: the ${ticker} line came back as ${view.ticker}`);
    want(view.qty === QTY, `${label}: the ${ticker} line came back at qty ${view.qty}`);
    want(
      view.price === QUOTE[ticker],
      `${label}: the ${ticker} line priced at ${view.price}, not ${QUOTE[ticker]}`,
    );
    console.log(`  ${ticker.padEnd(3)} ${JSON.stringify(view)}`);
  }
  return views;
}

say("phase 1 — v1 serves every product it subscribes to");
const onV1 = tradeEach("v1");
// The claims below read the program's state across the swap, and a poisoned
// module answers nothing. Stopping here reports what broke rather than burying
// it under the aliasing error every later call raises.
if (problems.length > 0) report();

say("phase 2 — a cart to carry across the swap");
step("PATCH /cart BTC", () =>
  program.request("PATCH", "/cart", [{ account: ACCOUNT, ticker: "BTC", qty: QTY }]),
);
reset();
step("GET /cart", () => program.request("GET", "/cart", [{ account: ACCOUNT }]));
const before = lastFrom("GET /cart");
console.log(`  before ${JSON.stringify(before)}`);

say("phase 3 — reload onto cart-v2.cambra");
let tally;
try {
  tally = JSON.parse(program.reload(v2));
} catch (error) {
  console.error(`the module refused the upgrade:\n${error}`);
  process.exit(1);
}
console.log(`  generation ${tally.generation}: ${tally.kept} of ${tally.bound} operators kept`);
want(tally.generation === 1, `the upgrade should be generation 1, not ${tally.generation}`);
want(tally.kept > 0, "an upgrade that keeps no operator kept no state either");

feed = subscribed();
console.log(`  ${feed.source} <- ${feed.products.join(", ")}`);
want(
  feed.products.join() === "BTC-USD,LTC-USD,ETH-USD",
  `v2 should add ETH to v1's two, got ${feed.products.join(", ")}`,
);

say("phase 4 — the state crossed the swap");
reset();
step("GET /cart", () => program.request("GET", "/cart", [{ account: ACCOUNT }]));
const after = lastFrom("GET /cart");
console.log(`  after  ${JSON.stringify(after)}`);
if (before && after) {
  // BTC's divisor is 10^8 in both versions, so nothing about its line may move.
  // This is the claim that the migration carried the values rather than reset
  // them: `cart` and `holdings` are gone and `cart_rescaled` and
  // `holdings_rescaled` hold what they held.
  for (const field of ["cash", "ticker", "qty", "price", "total", "held"]) {
    want(
      after[field] === before[field],
      `the swap changed BTC's ${field}: ${before[field]} -> ${after[field]}`,
    );
  }
}

say("phase 5 — v2 lists an asset v1 did not, at its own base unit");
const onV2 = tradeEach("v2");
want("ETH" in onV2, "v2 should serve ETH — it is what the upgrade adds");
if (onV2.ETH) {
  // The whole of the upgrade in one figure: v1 divided every quantity by one
  // `one_coin`, and an ETH line is a count of gwei. A shared divisor would
  // price this line ten times over.
  want(
    onV2.ETH.total === Math.floor((QTY * QUOTE.ETH) / GWEI),
    `ETH should price at the gwei divisor: ${onV2.ETH.total} != ${Math.floor((QTY * QUOTE.ETH) / GWEI)}`,
  );
  want(
    onV1.BTC !== undefined && onV2.BTC !== undefined && onV2.BTC.total === onV1.BTC.total,
    "BTC's divisor is 10^8 in both versions, so its line may not move across the swap",
  );
}

say("phase 6 — a checkout against the migrated collections");
reset();
step("PUT /checkout", () => program.request("PUT", "/checkout", [{ account: ACCOUNT }]));
const ack = lastFrom("PUT /checkout");
reset();
step("GET /cart", () => program.request("GET", "/cart", [{ account: ACCOUNT }]));
const settled = lastFrom("GET /cart");
console.log(`  checkout ${JSON.stringify(ack)}`);
console.log(`  settled  ${JSON.stringify(settled)}`);
if (ack && settled && onV2.ETH) {
  want(ack.ok === true, `the checkout should commit, got ${JSON.stringify(ack)}`);
  want(ack.due === onV2.ETH.total, `the checkout should price the line at ${onV2.ETH.total}`);
  want(settled.qty === 0, `the line should be cleared, got qty ${settled.qty}`);
  want(
    settled.held === onV2.ETH.held + QTY,
    `the holding should gain the line: ${onV2.ETH.held} + ${QTY} != ${settled.held}`,
  );
  want(settled.cash === ack.cash, `the debit should stand, got cash ${settled.cash}`);
}

say("phase 7 — the swap only runs forwards");
// Both refusals are what the deck's two buttons are built on: `v2` reloads
// because a reload is the thing that keeps the state, and `v1` compiles from
// scratch because the reload back is refused.
let fresh = null;
try {
  Program.compile("cart-v2.cambra", v2, channels);
  fresh = "accepted";
} catch (error) {
  fresh = String(error);
}
want(
  /no previous version to read from/.test(fresh),
  `compiling v2 from nothing should name the missing predecessor, got: ${fresh.slice(0, 160)}`,
);
console.log("  v2 from nothing: refused, and names @LoadFrom's missing predecessor");

let back = null;
try {
  program.reload(v1);
  back = "accepted";
} catch (error) {
  back = String(error);
}
want(
  /no longer declared/.test(back),
  `reloading v1 over v2 should name the retired collections, got: ${back.slice(0, 160)}`,
);
console.log("  v1 over v2: refused, and names the collections v1 retires");

say("phase 8 — the refined Balance is load-bearing");
// `Balance` demands `__elem >= 0` and `^-` types the debit
// `{Microcents | __elem == cash ^- due}`, so the `cash >= due` guard is what
// closes the gap — assumable inside its own arm. Weaken it and the write is
// unproved. Without this claim a program that kept the declaration and lost the
// check would pass every other one here.
//
// It is also the claim that says the solver is running at all: the query goes
// to a linked-in solver rather than to `z3` over a pipe, because wasm32 opens
// no pipe (`cambra`'s `ci.sh wasm`).
const weakened = v1.replace("if cash >= due:", "if cash >= 0:");
want(weakened !== v1, "the checkout guard is not where this check expects it");
let verdict;
try {
  Program.compile("weakened.cambra", weakened, channels);
  verdict = "accepted";
} catch (error) {
  verdict = String(error);
}
want(
  /__elem >= 0|Balance/.test(verdict),
  `a weakened guard should leave the debit unproved, got: ${verdict.slice(0, 200)}`,
);
console.log("  a weakened guard is refused, and the refinement names itself");

report();

function report() {
  if (problems.length > 0) {
    process.stdout.write("\n");
    for (const problem of problems) console.error(`  FAIL ${problem}`);
    process.exit(1);
  }
  process.stdout.write(
    "\n  both programs run in the module, the state crossed the swap " +
      "and v2 prices an asset v1 could not\n",
  );
  process.exit(0);
}
