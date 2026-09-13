/**
 * Drive the demo slide in a browser and check what the presenter will see.
 *
 * `scripts/check-wasm-cart.mjs` checks the two programs against the module.
 * This checks the slide around them: that the panel tracks what the program
 * subscribes to, decodes the reply it sends, and that the strip's controls do
 * what their labels say.
 *
 *   npm run check:slide
 *
 * It starts Slidev on a port of its own and stops it again, which is the deck
 * as it is presented: `npm run dev`. Not `dist/` — `npm run build` copies
 * `demo/worker.ts` out as an asset under its own extension rather than
 * transpiling it, because the `new Worker` that loads it takes a URL through a
 * variable and Vite only rewrites the inline form. The dev server transforms it
 * on request, so the demo runs there and only there.
 *
 * The recorded price slice replays. A check that waited on a socket to Coinbase
 * would be a check that failed for the wrong reason.
 *
 * `SHOTS=dir` writes the slide at each named moment into `dir`.
 */

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright-chromium";

const deck = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 4319;

/** The demo slide's number, read from the deck rather than counted. */
function demoSlideNumber() {
  const slides = readFileSync(join(deck, "slides.md"), "utf8").split(/^---$/m);
  const index = slides.findIndex((slide) => slide.includes("<CartDemo />"));
  if (index < 0) throw new Error("no slide in slides.md mounts <CartDemo />");
  // `index` is how many `---` rules precede the block. The deck's own
  // frontmatter is fenced by two of them and is not a slide, and Slidev numbers
  // from 1 — so one rule per slide boundary plus one for the leading fence.
  return index - 1;
}

const problems = [];
function want(held, message) {
  if (!held) problems.push(message);
}

let page;
async function shot(moment) {
  if (!process.env.SHOTS) return;
  const path = join(process.env.SHOTS, `${moment}.png`);
  await page.screenshot({ path, fullPage: true });
  console.log(`  screenshot: ${path}`);
}

/**
 * Slidev, on a port of its own, with no browser of its own.
 *
 * `npm run dev` passes `--open`, which is right for a presenter and wrong here.
 * The server is ready when it answers, which is what the poll below waits for —
 * a fixed sleep is either slower than the start or shorter than it.
 */
const slidev = spawn(
  "npx",
  ["slidev", "slides.md", "--port", String(PORT), "--remote", "false"],
  { cwd: deck, stdio: "ignore" },
);
const base = `http://127.0.0.1:${PORT}`;
for (let attempt = 0; ; attempt++) {
  if (attempt > 120) {
    slidev.kill();
    throw new Error(`slidev never answered on ${base}`);
  }
  try {
    if ((await fetch(base)).ok) break;
  } catch {
    // Not up yet.
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}

const browser = await chromium.launch();
try {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.split("\n")[0]));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().split("\n")[0]);
  });

  const slide = demoSlideNumber();
  await page.goto(`${base}/${slide}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".cart-demo", { timeout: 30_000 });

  const text = (selector) => page.locator(selector).first().textContent();
  const trimmed = async (selector) => (await text(selector)).replace(/\s+/g, " ").trim();
  /** The products the panel is drawing as the program's, in listed order. */
  const tracked = () =>
    page.locator(".product:not(.untracked) .product-ticker").allTextContents();
  const orderRow = async () =>
    (await page.locator(".order-row").count()) ? await trimmed(".order-row") : null;
  /**
   * Press a version and wait for it to be the one running.
   *
   * On the button's own `running` mark rather than on a tally or an emptied
   * cart: both of those are states the slide is often already in — a tally from
   * the last reload, a cart the last checkout drained — so waiting on either
   * passes instantly and the check reads the state before the switch.
   */
  /** Press a control, and say what state it was in when the press would not land. */
  const pressControl = async (locator, what) => {
    try {
      await locator.click({ timeout: 15_000 });
      return true;
    } catch {
      const disabled = await locator.isDisabled().catch(() => "unknown");
      const visible = await locator.isVisible().catch(() => "unknown");
      problems.push(
        `${what} would not take a click (disabled: ${disabled}, visible: ${visible})` +
          ` — the strip read: ${await trimmed(".reload-strip")}`,
      );
      return false;
    }
  };
  /** Press Reload on something that will not compile, and wait for the refusal. */
  const compileRejected = async () => {
    if (!(await pressControl(page.locator(".reload-press").first(), "Reload"))) return false;
    try {
      await page.waitForFunction(
        () => document.querySelector(".reload-strip")?.textContent?.includes("refused") === true,
        undefined,
        { timeout: 40_000 },
      );
      return true;
    } catch {
      problems.push("a version that cannot compile was not refused");
      return false;
    }
  };
  const show = async (label) => {
    if (!(await pressControl(page.locator(".version-press", { hasText: label }), label))) {
      return false;
    }
    try {
      await page.waitForFunction(
        ([want]) => document.querySelector(".version-press.staged")?.textContent?.trim() === want,
        [label],
        { timeout: 20_000 },
      );
      return true;
    } catch {
      problems.push(`pressing ${label} did not stage it in the source pane`);
      return false;
    }
  };
  /** Compile what the pane holds, and wait for the strip to stop saying it has not. */
  const compile = async (label, fresh = false) => {
    const control = page.locator(fresh ? ".reload-fresh" : ".reload-press").first();
    if (!(await pressControl(control, fresh ? "from scratch" : "Reload"))) return false;
    try {
      await page.waitForFunction(
        ([want]) => {
          const staged = document.querySelector(".reload-strip .staged-note");
          const running = document.querySelector(".version-press.running");
          return !staged && running?.textContent?.trim() === want;
        },
        [label],
        { timeout: 40_000 },
      );
      return true;
    } catch {
      problems.push(`compiling did not make ${label} the running version`);
      return false;
    }
  };

  console.log(`\n== the slide boots (slide ${slide})`);
  try {
    await page.waitForSelector(".app-dot.live", { timeout: 30_000 });
  } catch {
    console.error(`  the host never started. the order pad says: ${await trimmed(".status")}`);
    for (const error of errors.slice(0, 8)) console.error(`  page error: ${error}`);
    problems.push("the program did not compile in the page");
    throw new Error("boot");
  }
  await page.waitForFunction(
    () => document.querySelector(".cash-figure")?.textContent?.trim() !== "—",
    undefined,
    { timeout: 30_000 },
  );
  await shot("boot");
  const cashAtBoot = (await text(".cash-figure")).trim();
  console.log(`  cash ${cashAtBoot}`);
  want(cashAtBoot === "500.00", `the account should open at 500.00, not ${cashAtBoot}`);
  want(
    (await page.locator(".status-fault").count()) === 0,
    "the order pad is showing a fault at boot",
  );

  console.log("\n== the source is the only pane open");
  // The values pane is hidden but pinned, so opening it mid-demo shows the two
  // pinned groups already filling rather than an empty pane.
  const panes = await page
    .frameLocator("iframe")
    .first()
    .locator(".panel:not(.hidden)")
    .evaluateAll((els) => els.map((e) => e.dataset.paneId));
  console.log(`  open: ${panes.join(", ") || "(none)"}`);
  want(
    panes.length === 1 && panes[0] === "source",
    `the slide should open on the source alone, got ${panes.join(", ") || "none"}`,
  );

  // Hidden, but pinned: a stale pin is skipped rather than reported, so nothing
  // else would notice the program's lines moving out from under `SHAPES.pins`.
  const pinned = await page
    .frameLocator("iframe")
    .first()
    .locator('.panel[data-pane-id="values"] .live-group')
    .count();
  console.log(`  values holds ${pinned} pinned group(s), waiting behind ☰ Panes`);
  want(pinned > 0, "the values pane opened empty — `SHAPES.pins` no longer names an operator");

  console.log("\n== the panel tracks what v1 subscribes to");
  const v1Tracked = await tracked();
  console.log(`  ${v1Tracked.join(", ")}`);
  want(
    v1Tracked.join() === "BTC-USD,LTC-USD",
    `v1 lists BTC and LTC; the panel tracks ${v1Tracked.join(", ")}`,
  );

  console.log("\n== pressing Add on each of them");
  // Every one of these reads its collections at a key, and `m[k]` faults on an
  // absent key — a fault poisons the module for the rest of the slide.
  for (const product of v1Tracked) {
    await page.locator(".product", { hasText: product }).first().click();
    // On the ticker the row names, not on the row's text changing: the feed is
    // replaying, so a quote lands between any two reads and the text moves on
    // its own. The cart holds one line, so the press has landed exactly when
    // the row is the product just pressed.
    try {
      await page.waitForFunction(
        ([want]) => document.querySelector(".order-row")?.textContent?.includes(want),
        [product],
        { timeout: 15_000 },
      );
    } catch {
      problems.push(`pressing Add on ${product} did not put a ${product} line in the cart`);
      break;
    }
    console.log(`  ${await orderRow()}`);
  }
  want((await page.locator(".status-fault").count()) === 0, "a press faulted the host");
  // The reply carries the position at the line's own ticker, and the panel draws
  // it only where there is one to draw: account 1 opens holding BTC and no LTC.
  await page.locator(".product", { hasText: "BTC-USD" }).first().click();
  await page.waitForFunction(
    () => document.querySelector(".order-row")?.textContent?.includes("BTC-USD"),
    undefined,
    { timeout: 15_000 },
  );
  const holdings = await page.locator(".holding").allTextContents();
  console.log(`  holdings behind a BTC line: ${JSON.stringify(holdings.map((h) => h.replace(/\s+/g, " ").trim()))}`);
  want(holdings.length === 1, `one holding should show behind the BTC line, got ${holdings.length}`);

  console.log("\n== the strip's rebuild controls");
  // They dispatch the editor's own chords into the frame, so a bundle that
  // renamed `.cm-content` breaks them silently. `Reload` keeps the cart.
  await page.locator(".reload-press").first().click();
  try {
    await page.waitForSelector(".reload-figure", { timeout: 20_000 });
    console.log(`  Reload: ${await trimmed(".reload-strip")}`);
  } catch {
    problems.push("clicking Reload produced no tally — the chord did not reach the editor");
  }
  want(
    (await page.locator(".order-row").count()) === 1,
    "clicking Reload should keep the cart — that is what it means",
  );

  console.log("\n== typing marks the pane as not compiled");
  await page.frameLocator("iframe").first().locator(".cm-content").click();
  await page.keyboard.type("  ");
  try {
    await page.waitForSelector(".reload-strip .staged-note", { timeout: 10_000 });
    console.log(`  ${await trimmed(".reload-strip")}`);
  } catch {
    problems.push("typing in the editor did not mark the pane as uncompiled");
  }
  want(
    await page.locator(".provenance-press").isDisabled(),
    "provenance should be unavailable over an edited program",
  );
  // Put it back, so the beats below run against the program as shipped. Not
  // `show`: v1 is what is running, so restoring its text leaves the pane and the
  // program agreeing and nothing is staged — which is the state to wait for.
  await page.locator(".version-press", { hasText: "v1" }).click();
  try {
    await page.waitForFunction(
      () => document.querySelector(".reload-strip .staged-note") === null,
      undefined,
      { timeout: 20_000 },
    );
  } catch {
    problems.push("restoring v1's text left the pane marked as uncompiled");
  }

  console.log("\n== the provenance toggle");
  const marksSuppressed = () =>
    page
      .frameLocator("iframe")
      .first()
      .locator("html")
      .evaluate((el) => el.classList.contains("no-provenance"));
  want(await marksSuppressed(), "provenance marks should start suppressed, for a room");
  await page.locator(".provenance-press").click();
  want(!(await marksSuppressed()), "the toggle should turn the provenance marks on");
  await page.locator(".provenance-press").click();
  want(await marksSuppressed(), "the toggle should turn them off again");
  console.log("  off at boot, on, off — and the class rides the frame's root");

  console.log("\n== v2 — the upgrade, over the state the program is holding");
  // A line in LTC, whose divisor is 10^8 in both versions: what crosses the swap
  // has to cross it unchanged.
  await page.locator(".product", { hasText: "LTC-USD" }).first().click();
  await page.waitForFunction(
    () => document.querySelector(".order-row")?.textContent?.includes("LTC-USD"),
    undefined,
    { timeout: 15_000 },
  );
  // A line is worth nothing until a quote for it arrives, and a fresh program
  // starts every price at zero.
  await page.waitForFunction(
    () => (document.querySelector(".order-total")?.textContent?.trim() ?? "0.00") !== "0.00",
    undefined,
    { timeout: 30_000 },
  );
  const qtyBefore = (await text(".order-qty")).trim();
  const cashBefore = (await text(".cash-figure")).trim();

  // Pressing a version changes what the pane shows and compiles nothing: the
  // presenter reads the new program to the room before running it.
  const trackedBefore = (await tracked()).join();
  const runningBefore = await trimmed(".version-press.running");
  if (await show("v2")) {
    console.log(`  staged: ${await trimmed(".reload-strip")}`);
    // The two facts that would have moved if it had compiled. The tally is not
    // one of them: the strip replaces it with the staged note, so its absence
    // here says nothing either way.
    want(
      (await tracked()).join() === trackedBefore,
      "pressing v2 changed what the panel tracks, so it compiled — it must not",
    );
    want(
      (await trimmed(".version-press.running")) === runningBefore,
      `pressing v2 changed the running version to ${await trimmed(".version-press.running")}` +
        " — it must only change what the pane shows",
    );
    want(
      await page.locator(".provenance-press").isDisabled(),
      "provenance should be unavailable while the pane shows source nothing compiled",
    );
  }
  if (await compile("v2")) {
    console.log(`  compiled: ${await trimmed(".reload-strip")}`);
    want(
      (await page.locator(".reload-figure").count()) === 1,
      "the upgrade is a reload, so it should leave a reuse tally on the strip",
    );
    want(
      !(await page.locator(".provenance-press").isDisabled()),
      "provenance should come back once the pane and the program agree",
    );
  }
  const qtyAfter = (await text(".order-qty")).trim();
  const cashAfter = (await text(".cash-figure")).trim();
  console.log(`  LTC qty ${qtyBefore} -> ${qtyAfter}, cash ${cashBefore} -> ${cashAfter}`);
  want(
    (await page.locator(".order-row").count()) === 1,
    "the cart should survive the upgrade — it is the claim the beat makes",
  );
  // The quantity and the balance, not the line total: the feed is replaying and
  // a quote lands between any two reads, so the total moves for a reason that
  // has nothing to do with the swap. What must not move is what the program was
  // holding.
  want(qtyAfter === qtyBefore, `the line should cross the swap: ${qtyBefore} -> ${qtyAfter}`);
  want(cashAfter === cashBefore, `the balance should cross the swap: ${cashBefore} -> ${cashAfter}`);

  console.log("\n== v2 lists an asset v1 did not");
  // The panel's tracked set is `Program.subscriptions()`, re-read after every
  // accepted reload, so it grows when the new version says it does.
  await page
    .waitForFunction(
      () => document.querySelectorAll(".product:not(.untracked)").length === 3,
      undefined,
      { timeout: 20_000 },
    )
    .catch(() => {});
  const v2Tracked = await tracked();
  console.log(`  ${v2Tracked.join(", ")}`);
  want(
    v2Tracked.includes("ETH-USD"),
    `the panel should track ETH after the upgrade, got ${v2Tracked.join(", ")}`,
  );
  await page.locator(".product", { hasText: "ETH-USD" }).first().click();
  await page.waitForFunction(
    () => document.querySelector(".order-row")?.textContent?.includes("ETH-USD"),
    undefined,
    { timeout: 15_000 },
  );
  console.log(`  ${await orderRow()}`);

  console.log("\n== checkout against the migrated state");
  await page.waitForFunction(
    () => (document.querySelector(".order-total")?.textContent?.trim() ?? "0.00") !== "0.00",
    undefined,
    { timeout: 30_000 },
  );
  await page.locator(".checkout").click();
  await page.waitForSelector(".notice", { timeout: 15_000 });
  const notice = await trimmed(".notice");
  console.log(`  ${notice}`);
  want(/bought/.test(notice), `the checkout should commit, panel said: ${notice}`);
  await shot("upgraded");

  console.log("\n== a version the compiler refuses is marked in the pane");
  // Not a banner over the source: the report names a line, and the line is on
  // the screen. The program that was running goes on running behind it.
  const editor = page.frameLocator("iframe").first();
  await editor.locator(".cm-content").click();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("x = undefined_name + 1\n");
  if (await compileRejected()) {
    const marks = await editor.locator(".cm-lintRange").count();
    console.log(`  ${marks} mark(s), strip: ${await trimmed(".reload-strip")}`);
    want(marks > 0, "a refused version should be underlined in the pane, not bannered over it");
    want(
      (await editor.locator(".rebuild-fault").count()) === 0,
      "a refused version with spans should not also raise the fallback banner",
    );
    want(
      (await trimmed(".reload-strip")).includes("refused"),
      "the strip should say which version is still running after a refusal",
    );
    want(
      (await page.locator(".app-dot.live").count()) === 1,
      "a refused version must leave the running program running",
    );
  }

  console.log("\n== v1 — starting over");
  // Refused as a reload, because v1 says nothing about where `cart_rescaled`'s
  // values belong; the button compiles a new program instead, and the emptied
  // cart is the honest sign of it.
  // v1 over a running v2 is refused as a reload, so the way back is a fresh
  // compile — `from scratch` rather than `Reload`.
  if ((await show("v1")) && (await compile("v1", true))) {
    want(
      (await page.locator(".order-row").count()) === 0,
      "a new program starts with an empty cart",
    );
    want(
      (await page.locator(".reload-figure").count()) === 0,
      "a new program kept nothing, so the strip should carry no tally",
    );
  }
  await page
    .waitForFunction(
      () => document.querySelectorAll(".product:not(.untracked)").length === 2,
      undefined,
      { timeout: 20_000 },
    )
    .catch(() => {});
  const backTracked = await tracked();
  console.log(`  tracked: ${backTracked.join(", ")}, cart emptied`);
  want(
    backTracked.join() === "BTC-USD,LTC-USD",
    `back on v1 the panel should track BTC and LTC, got ${backTracked.join(", ")}`,
  );

  // Wake Lock is a headless-Chromium refusal, not the deck's doing: Slidev asks
  // for it to keep a presenting laptop awake and there is no screen here.
  const fatal = errors.filter((e) => !/favicon|net::ERR_|Wake Lock/.test(e));
  if (fatal.length) {
    problems.push(`the page logged errors:\n    ${fatal.slice(0, 4).join("\n    ")}`);
  }
} catch (e) {
  if (!String(e).includes("boot")) {
    problems.push(`the run stopped: ${String(e).split("\n")[0]}`);
  }
} finally {
  await browser.close();
  slidev.kill();
}

if (problems.length) {
  process.stdout.write("\n");
  for (const problem of problems) console.error(`  FAIL ${problem}`);
  process.exit(1);
}
process.stdout.write("\n  the slide boots, tracks what each version serves, and switches both ways\n");
process.exit(0);
