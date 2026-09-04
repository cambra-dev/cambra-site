// Build the standalone demo: one HTML file with the compiler, the program, the
// inspector and the price slice inside it.
//
// The deck's slide fetches those four things from `public/`. A page that has to
// survive on its own — pasted somewhere, opened from a file, published where no
// origin serves assets — carries them instead, so everything here is base64 in
// the document. That is the only difference: the program, the module and the
// inspector are the same bytes the deck runs.
//
// The live Coinbase toggle is not in this build. A published artifact cannot
// open a socket to any host, so a toggle would be a control that silently does
// nothing; the recorded slice is what this page replays.
//
//   node scripts/build-artifact.mjs [out.html] [path-to-cambra]
//
// Needs `wasm-bindgen`, and a cambra checkout carrying the `wasm-fast` profile
// this builds against; see scripts/sync-cambra.sh for both.

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const deck = resolve(here, "..");
const out = resolve(process.argv[2] ?? join(deck, "artifact", "cambra-demo.html"));
const cambra = resolve(process.argv[3] ?? join(deck, "../../cambra"));

// Fail on the path rather than several minutes into a cargo build that cannot
// find a crate.
if (!existsSync(join(cambra, "Cargo.toml"))) {
  console.error(`no cambra checkout at ${cambra}`);
  console.error("usage: node scripts/build-artifact.mjs [out.html] [path-to-cambra]");
  process.exit(1);
}

/** The module, built for speed rather than size: an artifact has bytes to spare
 *  and a per-row time budget it does not. */
function buildModule() {
  console.log("building the module (wasm-fast)");
  execFileSync(
    "cargo",
    ["build", "--profile", "wasm-fast", "--target", "wasm32-unknown-unknown", "--lib"],
    { cwd: cambra, stdio: "inherit" },
  );
  const staging = mkdtempSync(join(tmpdir(), "cambra-artifact-"));
  execFileSync(
    "wasm-bindgen",
    [
      "--target",
      "no-modules",
      "--out-dir",
      staging,
      join(cambra, "target/wasm32-unknown-unknown/wasm-fast/cambra.wasm"),
    ],
    { stdio: "inherit" },
  );
  return staging;
}

const staging = buildModule();
const glue = readFileSync(join(staging, "cambra.js"), "utf8");
const wasm = readFileSync(join(staging, "cambra_bg.wasm"));
rmSync(staging, { recursive: true, force: true });

const program = readFileSync(join(cambra, "tests/programs/asset_cart/v0.cambra"), "utf8");
const channels = readFileSync(join(cambra, "tests/programs/asset_cart/channels.json"), "utf8");
const inspector = readFileSync(join(deck, "public/inspector/index.html"));
const slice = readFileSync(join(deck, "public/data/coinbase-2026-09-03-30min.ndjson.gz"));

const b64 = (buf) => buf.toString("base64");
const mb = (n) => (n / 1024 / 1024).toFixed(2);

// The program and the declarations go in as JSON string literals, which is safe
// for any content; the three binaries go in as base64, which is what keeps the
// inspector's own `</script>` out of this document's parser.
const html = readFileSync(join(here, "artifact-template.html"), "utf8")
  .replace("__GLUE__", () => glue)
  .replace("__WASM_B64__", () => b64(wasm))
  .replace("__INSPECTOR_B64__", () => b64(inspector))
  .replace("__SLICE_B64__", () => b64(slice))
  .replace("__PROGRAM_JSON__", () => JSON.stringify(program))
  .replace("__CHANNELS_JSON__", () => JSON.stringify(JSON.parse(channels)));

writeFileSync(out, html);
console.log(
  `\n${out}\n` +
    `  module     ${mb(wasm.length)} MB\n` +
    `  inspector  ${mb(inspector.length)} MB\n` +
    `  slice      ${mb(slice.length)} MB\n` +
    `  page       ${mb(Buffer.byteLength(html))} MB`,
);
