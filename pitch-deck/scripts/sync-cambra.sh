#!/usr/bin/env bash
# Refresh the artifacts the demo slide runs from, out of a `cambra` checkout.
#
# Four things come from the compiler's repo and none of them can be built here:
#   public/wasm/cambra.js, cambra_bg.wasm   the WebAssembly module
#   public/wasm/cart.cambra, channels.json  the program and its host channels
#   public/inspector/index.html             the inspector's single-file bundle
#   public/data/*.ndjson.gz                 the recorded price slice (from the vault)
#
# The program is mid-rewrite, from four flat channels to three `wasm_serve`
# routes, and the deck carries both: `cart-v0.cambra` and `channels-v0.json` are
# the four-channel pair, frozen here and never synced, because the compiler repo
# is about to stop shipping a program of that shape and `?cart=v0` has to keep
# working until the new one runs. `cart.cambra` and `channels.json` are the
# route-shaped pair, and what this script copies over them is
# `asset_cart/v1_single_line.cambra` plus the declarations beside it — once there
# is one. Until then it leaves the deck's provisional copy alone and says so,
# rather than overwriting a route-shaped program with the four-channel one and
# leaving the slide wired to a program it is not driving.
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
# `v1_single_line`, and not `v1`, because it is the one that runs.
#
# Both are the route-shaped app. `v1.cambra` keys the cart by `{account,
# ticker}`, so an account holds a basket and every read of the cart is an
# iteration over the entries belonging to one account — and that iteration is
# what its own header lists four unbuilt obstructions to. `v1_single_line.cambra`
# holds one line per account, which turns each of those reads into a keyed
# lookup, and it compiles. The deck's job is to run something, so it takes the
# one that does; swap the stem back the day the basket compiles.
#
# Two consequences worth knowing before this lands on the slide. Its price feed
# is the plain host source `price_updates`, as `v0.cambra`'s was, because
# `wasm_socket_subscribe` is not built yet — the page resolves that source by
# elimination rather than by name (`ChannelMap.socket`), so the wiring does not
# care which of the two names it is. And its `GET /cart` reply is one line
# rather than a list of them, which the panel's decode in `CartDemo.vue` will
# have to follow.
program="${cambra}/tests/programs/asset_cart/v1_single_line.cambra"
# `ChannelFile::beside` reads `<stem>.channels.json` before `channels.json`, so
# this version's declarations are `v1_single_line.channels.json` and the
# unqualified file in that directory stays v0's. The versions are wired
# differently — four flat channels against three routes — so taking the
# unqualified one here would hand the new program the old program's channels,
# which registers as a half-declared route rather than as anything a reader
# would recognise as the wrong file. The same goes for `v1.channels.json`, whose
# reply types are the basket's: a program is only ever paired with the
# declarations that carry its own stem, and anything else is refused below.
declared="${cambra}/tests/programs/asset_cart/v1_single_line.channels.json"
if [[ -f "${program}" && -f "${declared}" ]]; then
  cp "${program}" "${deck}/public/wasm/cart.cambra"
  cp "${declared}" "${deck}/public/wasm/channels.json"
elif [[ -f "${program}" ]]; then
  echo "found ${program} but no ${declared}; keeping the provisional pair" >&2
  echo "  a program without the declarations beside it cannot register" >&2
else
  echo "no ${program}; keeping the deck's provisional route-shaped program" >&2
  echo "  (the four-channel pair is cart-v0.cambra / channels-v0.json, at ?cart=v0)" >&2
fi
cp "${cambra}/web/dist/index.html" "${deck}/public/inspector/index.html"

slice="${vault}/projects/storefront-demo/data/coinbase-2026-09-03-30min.ndjson.gz"
if [[ -f "${slice}" ]]; then
  cp "${slice}" "${deck}/public/data/"
else
  echo "no price slice at ${slice}; leaving the committed one in place" >&2
fi

echo
echo "synced. The pins in components/CartDemo.vue are source line numbers in"
echo "cart.cambra — check them if the program's lines moved. The route-shaped"
echo "pins are a provisional program's and will not survive the first real v1."
