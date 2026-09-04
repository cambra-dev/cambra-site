<script setup>
// The business model as one figure: three circles co-tangent at a shared ground
// line, each one annotated by a note to its right.
//
// Co-tangent rather than concentric. Concentric rings say "three sizes of the
// same thing"; circles rising from a common base say what is actually true —
// the hosted runtime is only sellable because the open-source core exists, and
// the self-building apps only because the hosted runtime does. Each tier both
// rests on the same ground and encloses everything under it.
//
// The innermost circle is never filled: the open-source core is the part nobody
// pays for, and leaving it hollow says so without a caption.
//
// The tiers arrive one click at a time, innermost first, so the figure is built
// up in the order the business is: open source, then the hosted runtime on top
// of it, then the services on top of that. The ground line is there from the
// start — it is the stage, not one of the tiers.
//
// Plain divs rather than SVG, matching the market Venn.

// Diameter as a fraction of the square figure, and the height the tier's leader
// line leaves at — both measured from the bottom edge, which is the tangent
// line. The three heights are the row centres of the three notes alongside, so
// the leaders come out horizontal and cannot cross one another.
const TIERS = [
  { key: 0, d: 0.34, y: 1 / 6 },
  { key: 1, d: 0.66, y: 3 / 6 },
  { key: 2, d: 1.0, y: 5 / 6 },
]

// Where a horizontal line at height y meets a circle of radius r whose centre
// sits r above the tangent line: x² + (y − r)² = r². Solving it rather than
// eyeballing offsets is what keeps each leader touching its own circle when the
// diameters or the row count change.
const laid = TIERS.map((t) => {
  const r = t.d / 2
  const half = Math.sqrt(Math.max(r * r - (t.y - r) ** 2, 0))
  return { key: t.key, size: t.d * 100, y: t.y * 100, x: (0.5 + half) * 100 }
})
</script>

<template>
  <div class="ts" :aria-hidden="true">
    <span
      v-for="t in laid"
      :key="`c${t.key}`"
      v-click="t.key + 1"
      class="ts-c"
      :class="`tier-${t.key}`"
      :style="{ width: `${t.size}%`, height: `${t.size}%` }"
    />
    <span
      v-for="t in laid"
      :key="`l${t.key}`"
      v-click="t.key + 1"
      class="ts-lead"
      :class="`tier-${t.key}`"
      :style="{ bottom: `${t.y}%`, left: `${t.x}%` }"
    />
  </div>
</template>

<style scoped>
.ts {
  position: relative;
  height: 100%;
  /* Square, so the circle geometry above holds in both axes. */
  aspect-ratio: 1;
  flex: none;
}
/* The ground line. It runs wider than the largest circle so the tangency reads
   as "all three stand on the same thing" rather than as a coincidence. */
.ts::after {
  content: '';
  position: absolute;
  left: -4%;
  right: -4%;
  bottom: 0;
  height: 1px;
  background: var(--line-2);
  opacity: 0.5;
}
.ts-c {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  border-radius: 50%;
  border: 2px solid;
}
/* A filled larger circle would cover the ones it contains, so the stack is
   painted outermost-first. */
/* Fill weights follow the market Venn: a whisper of colour at 0.08 and the
   identity carried by the stroke. Anything heavier turns muddy where the
   circles overlap, because warm translucency over this navy desaturates. The
   overlaps still read, since the fills accumulate where circles contain one
   another. */
.ts-c.tier-2 {
  z-index: 1;
  border-color: rgba(241, 139, 64, 0.75);
  background: rgba(241, 139, 64, 0.08);
}
.ts-c.tier-1 {
  z-index: 2;
  border-color: rgba(245, 163, 55, 0.8);
  background: rgba(245, 163, 55, 0.09);
}
.ts-c.tier-0 {
  z-index: 3;
  border-color: rgba(108, 196, 200, 0.95);
}
/* Leaders run from a point on their own circle out past the figure's edge, to
   meet the accent bar of the note they belong to. */
.ts-lead {
  position: absolute;
  right: -1.4rem;
  height: 1px;
  z-index: 4;
  background: currentColor;
  opacity: 0.75;
}
.ts-lead::before {
  content: '';
  position: absolute;
  left: -3px;
  top: -2.5px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.ts-lead.tier-0 {
  color: var(--cool);
}
.ts-lead.tier-1 {
  color: var(--warm);
}
.ts-lead.tier-2 {
  color: var(--coral);
}
</style>
