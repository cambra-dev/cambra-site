<script setup lang="ts">
/**
 * The app panel: a phone-shaped column at a quarter of the slide's width.
 *
 * Every cart figure comes from the program — the panel divides by the 10⁸ scale
 * and formats, and adds the three line totals into a subtotal. The subtotal is
 * the one number the program does not compute, because a block reading all six
 * slots costs about two seconds per price row against twenty-two milliseconds
 * for the three the program has (`cart.cambra` says so, and the vault note
 * `as-of-read-cost` measures it).
 *
 * Prices for products the program does not track come from the panel's own copy
 * of the feed. The program has no opinion about a ticker it never sees, which is
 * exactly what the greyed `not tracked` rows are there to show.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

import { DECIMALS, PRODUCTS, formatPrice, type FeedMode } from "../demo/feed";
import { LINE_SINKS, SCALE, TRACKED, type Row } from "../demo/transport";

const props = defineProps<{
  /** Last price seen per product, scaled, from the feed. */
  prices: Record<string, number>;
  /** The line each tracked ticker's sink last produced. */
  lines: Record<string, { qty: number; price: number; total: number }>;
  /** What the feed is doing. */
  status: { mode: FeedMode; detail: string };
  /** Whether the program has compiled and is running. */
  ready: boolean;
  /** Why the module is not running, when it is not. */
  fault: string | null;
}>();

const emit = defineEmits<{
  (e: "quantity", ticker: string, qty: number): void;
  (e: "toggle-feed"): void;
}>();

const query = ref("");

/** The products the search box matches, tracked ones first. */
const matches = computed(() => {
  const needle = query.value.trim().toUpperCase();
  const all = PRODUCTS.filter((p) => p.includes(needle));
  return [...all].sort((a, b) => {
    const at = TRACKED.includes(a as (typeof TRACKED)[number]) ? 0 : 1;
    const bt = TRACKED.includes(b as (typeof TRACKED)[number]) ? 0 : 1;
    return at - bt || a.localeCompare(b);
  });
});

function isTracked(ticker: string): boolean {
  return ticker in LINE_SINKS;
}

/** The cart's rows: a tracked ticker the program says has a quantity. */
const cart = computed(() =>
  TRACKED.map((ticker) => ({ ticker, line: props.lines[ticker] })).filter(
    (entry) => (entry.line?.qty ?? 0) > 0,
  ),
);

/**
 * The subtotal, added here rather than in the program.
 *
 * Three additions, over figures the program computed. See the component's own
 * note for why the program does not do it.
 */
const subtotal = computed(() =>
  cart.value.reduce((sum, entry) => sum + (entry.line?.total ?? 0), 0),
);

function money(scaled: number, ticker: string): string {
  return formatPrice(scaled, ticker);
}

/** A line total or subtotal, always at two decimals — these are dollars. */
function dollars(scaled: number): string {
  return (scaled / SCALE).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function add(ticker: string): void {
  if (!isTracked(ticker)) return;
  emit("quantity", ticker, (props.lines[ticker]?.qty ?? 0) + 1);
}

function step(ticker: string, by: number): void {
  const next = Math.max(0, (props.lines[ticker]?.qty ?? 0) + by);
  emit("quantity", ticker, next);
}
</script>

<template>
  <div class="phone">
    <div class="phone-screen">
      <div class="app-head">
        <span class="app-title">Assets</span>
        <span class="app-dot" :class="{ live: ready }" />
      </div>

      <div class="search">
        <input
          v-model="query"
          class="search-input"
          type="text"
          placeholder="Add…"
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
          <span v-if="!isTracked(ticker)" class="product-note">not tracked</span>
          <span class="product-price">{{
            prices[ticker] === undefined ? "—" : money(prices[ticker], ticker)
          }}</span>
          <span v-if="isTracked(ticker)" class="product-add">+</span>
        </button>
      </div>

      <div class="cart">
        <div v-if="cart.length === 0" class="cart-empty">No positions</div>
        <div v-for="entry in cart" :key="entry.ticker" class="cart-row">
          <div class="cart-line">
            <span class="cart-ticker">{{ entry.ticker }}</span>
            <span class="cart-qty">×{{ entry.line?.qty }}</span>
            <span class="cart-price">{{ money(entry.line?.price ?? 0, entry.ticker) }}</span>
          </div>
          <div class="cart-line cart-line-2">
            <button class="step" @click="step(entry.ticker, -1)">−</button>
            <button class="step" @click="step(entry.ticker, 1)">+</button>
            <span class="cart-total">{{ dollars(entry.line?.total ?? 0) }}</span>
          </div>
        </div>
        <div class="cart-rule" />
        <div class="cart-sub">
          <span>Subtotal</span>
          <span class="cart-sub-figure">{{ dollars(subtotal) }}</span>
        </div>
      </div>

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
 * than it reads at; `rem` stays 16 and the column's 215px holds
 * `XXX-USD ×NN  NN,NNN.NN` at these sizes.
 */
.phone {
  height: 100%;
  display: flex;
  align-items: stretch;
  justify-content: center;
}
.phone-screen {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.6rem;
  border: 1px solid var(--line-2);
  border-radius: 1.1rem;
  background: var(--code-bg);
  overflow: hidden;
}

.app-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.app-title {
  font-family: var(--f-mono);
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--fg-3);
}
.app-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--fg-3);
}
.app-dot.live {
  background: var(--lagoon);
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.3rem 0.45rem;
  border: 1px solid var(--line);
  border-radius: 0.4rem;
  background: transparent;
  color: var(--fg);
  font-family: var(--f-mono);
  font-size: 0.72rem;
  outline: none;
}
.search-input:focus {
  border-color: var(--lagoon);
}

.product-list {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  /* A scroll that jumps as rows repaint is what a live list gets wrong. */
  overflow-anchor: auto;
}
.product {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: baseline;
  gap: 0.3rem;
  padding: 0.22rem 0.1rem;
  border: 0;
  background: transparent;
  color: var(--fg-2);
  text-align: left;
  cursor: pointer;
  font-family: var(--f-mono);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}
.product:hover:not(:disabled) {
  color: var(--fg);
}
.product.untracked {
  color: var(--fg-3);
  cursor: default;
  grid-template-columns: auto 1fr auto;
}
.product-note {
  font-size: 0.6rem;
  letter-spacing: 0.04em;
  color: var(--fg-3);
}
.product-price {
  text-align: right;
}
.product-add {
  color: var(--lagoon);
}

.cart {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.cart-empty {
  font-family: var(--f-body);
  font-size: 0.68rem;
  color: var(--fg-3);
}
.cart-row {
  display: flex;
  flex-direction: column;
}
.cart-line {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  font-family: var(--f-mono);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}
/* The line total goes on a second row: 215px does not hold it beside the price. */
.cart-line-2 {
  justify-content: flex-start;
  gap: 0.25rem;
}
.cart-ticker {
  color: var(--fg);
}
.cart-qty {
  color: var(--lagoon);
}
.cart-price {
  margin-left: auto;
  color: var(--fg-2);
}
.cart-total {
  margin-left: auto;
  color: var(--fg);
}
.step {
  width: 1.05rem;
  height: 1.05rem;
  line-height: 1;
  border: 1px solid var(--line);
  border-radius: 0.25rem;
  background: transparent;
  color: var(--fg-2);
  font-family: var(--f-mono);
  font-size: 0.7rem;
  cursor: pointer;
}
.step:hover {
  border-color: var(--lagoon);
  color: var(--fg);
}
.cart-rule {
  height: 1px;
  background: var(--line);
  margin: 0.25rem 0;
}
.cart-sub {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-family: var(--f-mono);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  color: var(--fg-3);
}
.cart-sub-figure {
  color: var(--fg);
}

.status {
  border: 0;
  background: transparent;
  padding: 0;
  text-align: left;
  font-family: var(--f-mono);
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  color: var(--fg-3);
  cursor: pointer;
}
.status:hover {
  color: var(--fg-2);
}
.status-fault {
  color: var(--hot);
}
</style>
