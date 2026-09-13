#!/usr/bin/env bash
# Refresh the artifacts the demo slide runs from, out of a `cambra` checkout.
#
# Three things come from the compiler's repo and none of them can be built here:
#   public/wasm/cambra.js, cambra_bg.wasm   the WebAssembly module
#   public/inspector/index.html             the inspector's single-file bundle
#   public/data/*.ndjson.gz                 the recorded price slice (from the vault)
#
# The programs are **not** among them. `public/wasm/cart.cambra` and
# `cart-v2.cambra` are the deck's own, written against the compiler rather than
# copied out of its test gallery, and this script leaves them alone —
# `npm run check:wasm` is what says whether the module just built still takes
# them.
#
# The small ones are committed, so the deck builds and presents with no network
# and no Rust toolchain. `cambra_bg.wasm` and the inspector bundle are not: both
# clear jj's 1 MiB snapshot limit, so `.gitignore` excludes them and a fresh
# clone runs this script once before the demo will start. Either way they go
# stale, which is what this script is for: run it when the program, the inspector
# or the module changes, and commit whichever of the committed ones moved.
#
#   scripts/sync-cambra.sh [path-to-cambra] [path-to-vault]
set -euo pipefail

deck="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cambra="${1:-${deck}/../../cambra}"
vault="${2:-${deck}/../../vault}"

if [[ ! -f "${cambra}/Cargo.toml" ]]; then
  echo "no cambra checkout at ${cambra}" >&2
  echo "usage: $0 [path-to-cambra] [path-to-vault]" >&2
  exit 1
fi

echo "building the module and the inspector bundle in ${cambra}"
(cd "${cambra}" && ./scripts/build-wasm.sh --target web)
(cd "${cambra}/web" && npm run build)

mkdir -p "${deck}/public/wasm" "${deck}/public/inspector" "${deck}/public/data"
cp "${cambra}/scripts/pkg/cambra.js" "${deck}/public/wasm/"
cp "${cambra}/scripts/pkg/cambra_bg.wasm" "${deck}/public/wasm/"
cp "${cambra}/scripts/pkg/cambra.d.ts" "${deck}/public/wasm/"
cp "${cambra}/web/dist/index.html" "${deck}/public/inspector/index.html"

slice="${vault}/projects/storefront-demo/data/coinbase-2026-09-03-30min.ndjson.gz"
if [[ -f "${slice}" ]]; then
  cp "${slice}" "${deck}/public/data/"
else
  echo "no price slice at ${slice}; leaving the committed one in place" >&2
fi

echo
echo "synced. Two things to check before presenting from this:"
echo
echo "  npm run check:wasm   both programs still compile in the module just"
echo "                       built, and one still reloads onto the other"
echo "  npm run check:slide  the slide boots, serves every product, switches"
echo "                       versions and checks out"
