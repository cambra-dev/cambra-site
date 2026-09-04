<script setup>
// Three nested rings, one per revenue tier, drawn the same way in every column
// so the reader sees one product with three layers rather than three products.
// The ring belonging to this column is at full strength; the others stay as
// faint outlines, which is what makes the glyph say "you are here".
//
// The innermost ring is never filled: the open-source core is the thing you do
// not pay for, and leaving it hollow in all three states says so without a
// caption. Plain divs rather than SVG, matching the market Venn.
defineProps({
  // 0 = open source (inner), 1 = core revenue (middle), 2 = value added (outer)
  tier: { type: Number, required: true },
})

const RINGS = [
  { key: 0, size: 34 },
  { key: 1, size: 66 },
  { key: 2, size: 100 },
]
</script>

<template>
  <div class="tr" :aria-hidden="true">
    <span
      v-for="r in RINGS"
      :key="r.key"
      class="tr-ring"
      :class="[`tier-${r.key}`, { on: r.key === tier }]"
      :style="{ width: `${r.size}%`, height: `${r.size}%` }"
    />
  </div>
</template>

<style scoped>
.tr {
  position: relative;
  width: 3.1rem;
  height: 3.1rem;
  flex: none;
}
.tr-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1.5px solid var(--line-2);
  opacity: 0.45;
}
/* The active ring. Inner stays hollow whichever tier is active. */
.tr-ring.on {
  opacity: 1;
}
.tr-ring.tier-0.on {
  border-color: var(--cool);
  border-width: 2px;
}
.tr-ring.tier-1.on {
  border-color: var(--warm);
  background: color-mix(in srgb, var(--warm) 60%, transparent);
}
.tr-ring.tier-2.on {
  border-color: var(--coral);
  background: color-mix(in srgb, var(--coral) 26%, transparent);
}
/* An outer filled ring would cover the ones inside it, so the active outer ring
   is painted behind them. */
.tr-ring.tier-2 {
  z-index: 0;
}
.tr-ring.tier-1 {
  z-index: 1;
}
.tr-ring.tier-0 {
  z-index: 2;
}
</style>
