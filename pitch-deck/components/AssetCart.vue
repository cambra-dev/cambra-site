<script setup lang="ts">
/**
 * The app panel: a product surface at half the slide's width.
 *
 * It is deliberately not styled like the rest of the deck. Everything else on
 * the screen is dark, so nothing on the screen reads as a *product*; one light
 * surface splits the slide into the tool and the thing the tool is running,
 * which is the demo's whole argument made without a word of narration. It used
 * to be drawn as a phone, because its column was a phone's 215px and the
 * proportions were honest; at hero width a phone frame would be a costume.
 *
 * Every cart figure comes from the program — the panel divides by the 10⁸ scale
 * and formats, and adds the line totals into a subtotal. The subtotal is the one
 * number the program does not compute, because a block reading every slot costs
 * about two seconds per price row against twenty-two milliseconds for the three
 * the four-channel program had (`cart-v0.cambra` says so, and the vault note
 * `as-of-read-cost` measures it). The route-shaped program computes it happily —
 * `sum([...])` over the cart is one line of `PUT /checkout` — and still does not
 * put it in the view reply, so the addition stays here.
 *
 * Prices for products the program does not track come from the panel's own copy
 * of the feed. The program has no opinion about a ticker it never sees, which is
 * exactly what the greyed `not tracked` rows are there to show.
 *
 * Quantities are in whole units of the asset, always. What the program counts in
 * — base units, thousandths of one on the stepper — is `CartDemo.vue`'s problem,
 * and it converts on both crossings. A panel that dealt in satoshi would have to
 * know which asset it was drawing, and the panel is the half of this slide that
 * is meant to look like software anyone has used.
 */
import { computed, ref } from "vue";

import {
  PRODUCTS,
  formatDollars,
  formatPrice,
  formatQuantity,
  type FeedMode,
} from "../demo/feed";

const props = defineProps<{
  /** Last price seen per product, scaled, from the feed. */
  prices: Record<string, number>;
  /** The cart the program last reported, keyed by product, quantities in whole units. */
  lines: Record<string, { qty: number; price: number; total: number }>;
  /** What the account holds, keyed by product, in whole units. Empty where the program has none. */
  positions: Record<string, number>;
  /** The account's cash, scaled, or `null` where the program does not report one. */
  cash: number | null;
  /** What the program said about the last write, if it said anything. */
  notice: string | null;
  /** The products the program is subscribed to; the rest are listed but greyed. */
  tracked: readonly string[];
  /** What one press of the stepper adds, in whole units. */
  step: number;
  /** Whether the program serves a checkout. */
  canCheckout: boolean;
  /** What the feed is doing. */
  status: { mode: FeedMode; detail: string };
  /** Whether the program has compiled and is running. */
  ready: boolean;
  /** Why the module is not running, when it is not. */
  fault: string | null;
}>();

const emit = defineEmits<{
  (e: "quantity", ticker: string, qty: number): void;
  (e: "checkout"): void;
  (e: "toggle-feed"): void;
}>();

const query = ref("");

/** The products the search box matches, tracked ones first. */
const matches = computed(() => {
  const needle = query.value.trim().toUpperCase();
  const all = PRODUCTS.filter((p) => p.includes(needle));
  return [...all].sort((a, b) => {
    const at = isTracked(a) ? 0 : 1;
    const bt = isTracked(b) ? 0 : 1;
    return at - bt || a.localeCompare(b);
  });
});

function isTracked(ticker: string): boolean {
  return props.tracked.includes(ticker);
}

/**
 * The cart's rows: a tracked product the program says has a quantity.
 *
 * Ordered by the tracked list rather than by the reply, so a line does not jump
 * the moment the program returns them in another order — the route-shaped
 * program iterates a map, and a map's order is not the panel's to depend on.
 */
const cart = computed(() =>
  props.tracked
    .map((ticker) => ({ ticker, line: props.lines[ticker] }))
    .filter((entry) => (entry.line?.qty ?? 0) > 0),
);

/** What the account holds, in the same order, and only what it holds. */
const held = computed(() =>
  props.tracked
    .map((ticker) => ({ ticker, qty: props.positions[ticker] ?? 0 }))
    .filter((entry) => entry.qty > 0),
);

/**
 * The subtotal, added here rather than in the program.
 *
 * A handful of additions, over figures the program computed. See the
 * component's own note for why the program does not do it.
 */
const subtotal = computed(() =>
  cart.value.reduce((sum, entry) => sum + (entry.line?.total ?? 0), 0),
);

function money(scaled: number, ticker: string): string {
  return formatPrice(scaled, ticker);
}

/** A line total or subtotal, always at two decimals — these are dollars. */
function dollars(scaled: number): string {
  return formatDollars(scaled);
}

/** A quantity in whole units: `0.003`, or `2` for a round holding. */
function quantity(units: number): string {
  return formatQuantity(units);
}

function add(ticker: string): void {
  if (!isTracked(ticker)) return;
  emit("quantity", ticker, (props.lines[ticker]?.qty ?? 0) + props.step);
}

/**
 * Move a line by one press of the stepper.
 *
 * Floored at zero rather than removing the line: zero is a quantity the program
 * holds and reports, and a cart row that vanishes on the way down is a row the
 * presenter cannot step back up. The rounding is the panel's own — a sum of
 * thousandths in binary floating point drifts, and the drift would otherwise
 * reach the program as a quantity nobody pressed.
 */
function step(ticker: string, by: number): void {
  const next = Math.max(0, (props.lines[ticker]?.qty ?? 0) + by * props.step);
  emit("quantity", ticker, Number(next.toFixed(6)));
}
</script>

<template>
  <div class="app">
    <div class="app-head">
      <div class="app-id">
        <div class="app-title">Order pad</div>
        <div class="app-sub">served by the program</div>
      </div>
      <span class="app-dot" :class="{ live: ready }" />
    </div>

    <!-- Prices beside the order, which is what the hero width buys: the row a
         price arrives on and the line it moves sit side by side, so a tap and
         its consequence are one glance apart. -->
    <div class="app-body">
      <div class="app-col">
        <div class="col-head">
          <span class="sec-label">Prices</span>
          <input
            v-model="query"
            class="search"
            type="text"
            placeholder="Filter"
            spellcheck="false"
            autocomplete="off"
          />
        </div>
        <div class="product-list">
          <button
            v-for="ticker in matches"
            :key="ticker"
            class="product"
            :class="{ untracked: !isTracked(ticker) }"
            :disabled="!isTracked(ticker)"
            @click="add(ticker)"
          >
            <span class="product-ticker">{{ ticker }}</span>
            <span class="product-note">{{ isTracked(ticker) ? "" : "not tracked" }}</span>
            <span class="product-price">{{
              prices[ticker] === undefined ? "—" : money(prices[ticker], ticker)
            }}</span>
            <span v-if="isTracked(ticker)" class="product-add">Add</span>
          </button>
        </div>
      </div>

      <div class="app-col app-col-order">
        <div class="col-head">
          <span class="sec-label">Order</span>
        </div>
        <div class="order-list">
          <div v-if="cart.length === 0" class="order-empty">
            Nothing yet — add a tracked product.
          </div>
          <div v-for="entry in cart" :key="entry.ticker" class="order-row">
            <span class="order-ticker">{{ entry.ticker }}</span>
            <span class="stepper">
              <button class="step" @click="step(entry.ticker, -1)">−</button>
              <span class="order-qty">{{ quantity(entry.line?.qty ?? 0) }}</span>
              <button class="step" @click="step(entry.ticker, 1)">+</button>
            </span>
            <span class="order-total">{{ dollars(entry.line?.total ?? 0) }}</span>
          </div>
        </div>
        <!-- What the account owns, which is where a committed checkout puts
             what was in the cart. Absent entirely under a program that has no
             holdings, rather than shown empty: an empty rail below the order
             reads as a thing that is broken. -->
        <div v-if="held.length" class="holdings">
          <span class="sec-label">Holdings</span>
          <span v-for="entry in held" :key="entry.ticker" class="holding">
            {{ entry.ticker }} <b>{{ quantity(entry.qty) }}</b>
          </span>
        </div>
      </div>
    </div>

    <div class="app-foot">
      <div class="subtotal">
        <span class="subtotal-label">Subtotal</span>
        <span class="subtotal-figure">{{ dollars(subtotal) }}</span>
      </div>
      <!-- The checkout beat: the balance the program is about to spend, and the
           one control that spends it. Both are hidden under a program that
           serves no `PUT /checkout`, because a button that cannot be answered is
           worse than no button — the room reads a dead control as a broken demo,
           not as a feature that is not there yet. -->
      <div v-if="canCheckout" class="settle">
        <span class="cash-label">Cash</span>
        <span class="cash-figure">{{ cash === null ? "—" : dollars(cash) }}</span>
        <button class="checkout" :disabled="cart.length === 0" @click="emit('checkout')">
          Checkout
        </button>
      </div>
      <div v-if="notice" class="notice">{{ notice }}</div>
      <button class="status" @click="emit('toggle-feed')">
        <span v-if="fault" class="status-fault">{{ fault }}</span>
        <span v-else>{{ status.mode }} · {{ status.detail }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/*
 * Sized in `rem` throughout. Slidev's `.slidev-layout` sets `font-size: 1.1rem`,
 * so `em` here would start from 17.6px and every figure would be a tenth larger
 * than it reads at; `rem` stays 16, and the column's ~450px holds two interior
 * columns of roughly 205px each at these sizes.
 */
.app {
  /* The deck's ink and rule tokens are white at low alpha, drawn for a navy
     ground; on sand they are invisible. These are the same idea inverted —
     `--abyssal` at the alpha each job needs — with the measured ratio against
     `--sand` beside it, so a later edit can see what it is spending. */
  --ink: var(--abyssal); /* 13.83:1 */
  --ink-2: rgba(16, 37, 58, 0.8); /* 7.65:1 — secondary figures */
  --ink-3: rgba(16, 37, 58, 0.66); /* 4.91:1 — labels, the floor for small text */
  --rule: rgba(16, 37, 58, 0.16); /* hairlines between rows */
  --rule-2: rgba(16, 37, 58, 0.5); /* 3.08:1 — borders of things you press */

  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--sand);
  color: var(--ink);
  font-family: var(--f-body);
  border-radius: 0.6rem;
  /* No border: sand against the slide's abyssal is a 13.8:1 edge already. The
     shadow is what lifts it off the deck rather than sitting in it. */
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.42);
}

.app-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.9rem;
  border-bottom: 1px solid var(--rule);
}
.app-title {
  font-family: var(--f-disp);
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.1;
}
.app-sub {
  font-size: 0.68rem;
  color: var(--ink-3);
  margin-top: 0.1rem;
}
.app-dot {
  margin-left: auto;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--ink-3);
}
/* A filled dot, not a pulsing one: a breathing dot reads as a loading state. */
.app-dot.live {
  background: var(--ocean);
  box-shadow: 0 0 0 0.2rem rgba(28, 136, 167, 0.18);
}

.app-body {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  /* The order is the column that grows: its rows carry a stepper and a total. */
  grid-template-columns: 1fr 1.12fr;
}
.app-col {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.app-col-order {
  border-left: 1px solid var(--rule);
}
.col-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 1.9rem;
  padding: 0.25rem 0.7rem;
}
.sec-label {
  flex: none;
  font-family: var(--f-mono);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.search {
  flex: 1 1 auto;
  min-width: 0;
  box-sizing: border-box;
  padding: 0.2rem 0.4rem;
  border: 1px solid var(--rule-2);
  border-radius: 0.3rem;
  background: transparent;
  color: var(--ink);
  font-family: var(--f-body);
  font-size: 0.68rem;
  outline: none;
}
.search::placeholder {
  color: var(--ink-3);
}
.search:focus {
  border-color: var(--ocean);
}

.product-list,
.order-list {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  /* A scroll that jumps as rows repaint is what a live list gets wrong. */
  overflow-anchor: auto;
}

.product {
  display: grid;
  /* Four rails, always: ticker, the `not tracked` gloss, the price, the
     control. The gloss cell is empty on a tracked row rather than absent, so
     every price in the list lands on the same rail whatever the row says. */
  grid-template-columns: auto 1fr auto 2.3rem;
  align-items: baseline;
  gap: 0.35rem;
  width: 100%;
  padding: 0.3rem 0.7rem;
  border: 0;
  border-bottom: 1px solid var(--rule);
  background: transparent;
  color: var(--ink);
  text-align: left;
  cursor: pointer;
  font-family: var(--f-body);
  font-size: 0.76rem;
}
.product:hover:not(:disabled) {
  background: rgba(28, 136, 167, 0.1);
}
/* An untracked row has no control, so it takes the control's rail back rather
   than reserving it: `not tracked` beside an eight-character ticker does not
   fit in what is left of 212px otherwise, and wrapped to two lines. */
.product.untracked {
  grid-template-columns: auto 1fr auto;
  color: var(--ink-3);
  cursor: default;
}
.product-ticker {
  font-weight: 600;
  font-size: 0.74rem;
  letter-spacing: 0.01em;
  white-space: nowrap;
}
.product-note {
  min-width: 0;
  font-size: 0.58rem;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  color: var(--ink-3);
}
/* Mono and tabular: the prices sit in a column and repaint several times a
   second, and proportional digits make that column shimmer. */
.product-price {
  font-family: var(--f-mono);
  font-size: 0.72rem;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: var(--ink-2);
}
.product.untracked .product-price {
  color: var(--ink-3);
}
.product-add {
  justify-self: end;
  padding: 0.05rem 0.3rem;
  border: 1px solid var(--rule-2);
  border-radius: 0.25rem;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ink);
}
.product:hover:not(:disabled) .product-add {
  background: var(--ocean);
  border-color: var(--ocean);
  color: #fff;
}

.order-empty {
  padding: 0.5rem 0.7rem;
  font-size: 0.7rem;
  line-height: 1.35;
  color: var(--ink-3);
}
.order-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  border-bottom: 1px solid var(--rule);
  font-size: 0.76rem;
}
.order-ticker {
  font-weight: 600;
}
.stepper {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.order-qty {
  min-width: 1.4ch;
  text-align: center;
  font-family: var(--f-mono);
  font-size: 0.74rem;
  font-variant-numeric: tabular-nums;
}
.step {
  width: 1.15rem;
  height: 1.15rem;
  line-height: 1;
  padding: 0;
  border: 1px solid var(--rule-2);
  border-radius: 0.25rem;
  background: transparent;
  color: var(--ink);
  font-family: var(--f-body);
  font-size: 0.74rem;
  cursor: pointer;
}
.step:hover {
  background: var(--ocean);
  border-color: var(--ocean);
  color: #fff;
}
/* A floor on the width, not a fit: a line total gaining a digit would
   otherwise shift the stepper beside it every time the price crossed a power
   of ten, and a row that moves while the room is watching reads as a glitch. */
.order-total {
  min-width: 9ch;
  font-family: var(--f-mono);
  font-size: 0.76rem;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

/* Holdings, as a wrapped strip rather than a third list: it is a footnote to
   the order — two or three short figures — and a scrolling pane for it would
   take height from the two lists that carry the demo. */
.holdings {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.3rem 0.55rem;
  padding: 0.35rem 0.7rem;
  border-top: 1px solid var(--rule);
}
.holding {
  font-family: var(--f-mono);
  font-size: 0.66rem;
  font-variant-numeric: tabular-nums;
  color: var(--ink-2);
  white-space: nowrap;
}
.holding b {
  color: var(--ink);
}

.app-foot {
  flex: none;
  border-top: 1px solid var(--rule);
}
/* One row: the balance on the left, the control on the right. The cash figure
   is quiet — it is context for the subtotal above it, not a second headline. */
.settle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.9rem 0.5rem;
}
.cash-label {
  font-family: var(--f-mono);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.cash-figure {
  font-family: var(--f-mono);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  color: var(--ink-2);
}
.checkout {
  margin-left: auto;
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--ocean);
  border-radius: 0.3rem;
  background: var(--ocean);
  color: #fff;
  font-family: var(--f-body);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
}
.checkout:disabled {
  border-color: var(--rule-2);
  background: transparent;
  color: var(--ink-3);
  cursor: default;
}
/* What the program said in reply: charged, declined, rejected. Ink on sand with
   an ocean rule, for the same reason the fault line is ink with an ember rule —
   10px of coloured text on this surface is under the contrast floor. */
.notice {
  margin: 0 0.9rem 0.5rem;
  padding-left: 0.4rem;
  border-left: 3px solid var(--ocean);
  font-family: var(--f-mono);
  font-size: 0.64rem;
  letter-spacing: 0.02em;
  color: var(--ink);
}
.subtotal {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  padding: 0.5rem 0.9rem 0.35rem;
}
.subtotal-label {
  font-family: var(--f-mono);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-3);
}
/* The one hot figure on the surface. `--ember` is 3.46:1 on sand, which is the
   large-text threshold and no more — so it is only ever this: bold, and never
   under 24px as rendered. */
.subtotal-figure {
  margin-left: auto;
  font-family: var(--f-disp);
  font-size: 1.55rem;
  font-weight: 700;
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
  color: var(--ember);
}
/* The feed toggle. It says what the feed is doing and switches replay to the
   live Coinbase socket — the one control on the panel the speaker presses that
   is not part of the cart. */
.status {
  display: block;
  width: 100%;
  border: 0;
  border-top: 1px solid var(--rule);
  background: transparent;
  padding: 0.3rem 0.9rem 0.4rem;
  text-align: left;
  font-family: var(--f-mono);
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  color: var(--ink-3);
  cursor: pointer;
}
.status:hover {
  color: var(--ink);
}
/* A fault has to be readable before it is red: `--ember` is 3.46:1 on sand,
   which is fine for the 25px subtotal and not for 10px of message. The ink
   stays at 13.8:1 and the ember does its work as a rule beside it. */
.status-fault {
  display: inline-block;
  padding-left: 0.4rem;
  border-left: 3px solid var(--ember);
  color: var(--ink);
  font-weight: 700;
}
</style>
