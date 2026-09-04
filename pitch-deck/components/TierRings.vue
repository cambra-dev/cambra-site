<script setup>
// Three circles per revenue tier, drawn the same way in every column so the
// reader sees one product with three layers rather than three products.
//
// The circles are co-tangent at the bottom rather than concentric: each one
// grows upward from the same ground line, so a larger tier both rests on the
// same foundation and encloses the tiers beneath it. Concentric rings said
// "three sizes of the same thing" and lost the part that matters — that the
// hosted runtime is only sellable because the open-source core exists, and the
// self-building apps only because the hosted runtime does.
//
// A column lights every circle up to and including its own tier, so the glyph
// accumulates left to right: the business visibly grows a layer per column
// rather than moving a highlight between three equal options.
//
// The innermost circle is never filled: the open-source core is the thing you
// do not pay for, and leaving it hollow in all three states says so without a
// caption. Plain divs rather than SVG, matching the market Venn.
defineProps({
  // 0 = open source (smallest), 1 = core revenue, 2 = value added (largest)
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
      :class="[`tier-${r.key}`, { on: r.key <= tier }]"
      :style="{ width: `${r.size}%`, height: `${r.size}%` }"
    />
  </div>
</template>

<style scoped>
.tr {
  position: relative;
  width: 4rem;
  height: 4rem;
  flex: none;
}
/* The ground line. Tangency at a single point is easy to miss at this size;
   a rule through that point, run wider than the largest circle, says "these
   all stand on the same thing" outright. */
.tr::after {
  content: '';
  position: absolute;
  left: -8%;
  right: -8%;
  bottom: 0;
  height: 1px;
  background: var(--line-2);
  opacity: 0.55;
}
/* Anchored to the bottom centre, which is the tangent point: every circle's
   lowest edge lands on the same line. */
.tr-ring {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  border-radius: 50%;
  border: 1.5px solid var(--line-2);
  opacity: 0.45;
}
/* Circles at or below this column's tier. The smallest stays hollow in every
   column — the core is the part nobody pays for. */
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
  background: color-mix(in srgb, var(--coral) 34%, transparent);
}
/* A filled larger circle would cover the ones it contains, so the stack is
   painted outermost-first. */
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
