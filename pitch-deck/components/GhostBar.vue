<script setup>
import { computed } from 'vue'

// Two bars on one scale: what a stage costs today (top, full width) and what it
// costs on Cambra (bottom, the kept share). Both are measured against the same
// total, so the bottom bar's shortness IS the claim — you read the saving as
// the length that is simply missing, without decoding a fill.
//
// The middle band carries the labels and the connectors. A label sits under its
// own section of the TOP bar, where the stages are at full width and there is
// room to spread; below the labels the connectors fan inward to the bottom bar.
// Anchoring labels to the bottom bar instead packs them all into the left tenth
// of the chart, because that is what a 10x saving does to the geometry.
// Labels stagger across `tiers` rows: narrow stages cannot hold their own text
// at their own width.
//
// Gains are multipliers snapped to a coarse ladder. A stage that computes to
// 23x is not known to that precision, and printing it that way costs more
// credibility than the extra digit buys.
const props = defineProps({
  title: { type: String, required: true },
  // [{ label, value, keep, accent? }] — value and keep in the same unit, any
  // unit. `accent` overrides the bar's colour for one stage.
  segments: { type: Array, required: true },
  note: { type: String, default: '' },
  // How many rows the labels stagger across.
  tiers: { type: Number, default: 2 },
  // 'cool' | 'warm' — the bar's colour, overridable per segment.
  accent: { type: String, default: 'cool' },
})

const RUNGS = [1.5, 2, 3, 5, 10, 20, 50, 100]
const snap = (r) =>
  RUNGS.reduce((best, x) =>
    Math.abs(Math.log(x) - Math.log(r)) < Math.abs(Math.log(best) - Math.log(r)) ? x : best,
  )
// Below this a stage is not meaningfully faster, and says so rather than
// rounding itself up to a gain it does not have.
const FLAT = 1.25
const gain = (r) => (r < FLAT ? null : `${snap(r)}×`)

const total = computed(() => props.segments.reduce((a, s) => a + s.value, 0))
const kept = computed(() => props.segments.reduce((a, s) => a + s.keep, 0))
const overall = computed(() => gain(total.value / kept.value))
// The bottom bar's share of the full width. The multiplier goes in what is left
// over, which is empty precisely in proportion to how big the win is.
const keptPct = computed(() => (kept.value / total.value) * 100)

const laid = computed(() => {
  let accV = 0
  let accK = 0
  return props.segments.map((s, i) => {
    const startV = accV
    const startK = accK
    accV += s.value
    accK += s.keep
    // Both bars are measured against the same total, so their widths compare.
    const xu = ((startV + s.value / 2) / total.value) * 100
    const xl = ((startK + s.keep / 2) / total.value) * 100
    return {
      ...s,
      wUpper: (s.value / total.value) * 100,
      wLower: (s.keep / total.value) * 100,
      xu,
      xl,
      tier: i % props.tiers,
      gain: gain(s.value / s.keep),
      acc: `var(--${s.accent || props.accent})`,
    }
  })
})
</script>

<template>
  <div class="gb" :style="{ '--acc': `var(--${accent})` }">
    <div class="gb-title">{{ title }}</div>

    <!-- Today: every stage at full cost. -->
    <div class="gb-track">
      <span
        v-for="s in laid"
        :key="`u${s.label}`"
        class="gb-seg today"
        :style="{ width: `calc(${s.wUpper} * 1%)` }"
      />
    </div>

    <div class="gb-labels" :style="{ '--tiers': tiers }">
      <span
        v-for="s in laid"
        :key="`t${s.label}`"
        class="gb-tag"
        :class="[`tier-${s.tier}`, { first: s.xu < 6, last: s.xu > 94 }]"
        :style="{ left: `calc(${s.xu} * 1%)`, '--stem': `${0.2 + s.tier * 1.3}rem`, '--acc': s.acc }"
      >
        <span class="gb-stem" />
        <span class="gb-text">
          <span class="gb-name">{{ s.label }}</span>
          <span v-if="s.gain" class="gb-gain">{{ s.gain }}</span>
          <span v-else class="gb-flat">unchanged</span>
        </span>
      </span>
    </div>

    <!-- The fan: one line per stage, from under its label to its section of the
         bottom bar. preserveAspectRatio=none lets x stay in percentages of the
         bar while the band keeps a fixed height; non-scaling-stroke stops that
         distorting the line weight. -->
    <svg class="gb-fan" viewBox="0 0 100 100" preserveAspectRatio="none">
      <line
        v-for="s in laid"
        :key="`k${s.label}`"
        :x1="s.xu"
        y1="0"
        :x2="s.xl"
        y2="100"
        :stroke="s.acc"
        vector-effect="non-scaling-stroke"
      />
    </svg>

    <!-- With Cambra: the same stages, at the width that survives. -->
    <div class="gb-low">
      <div class="gb-track kept" :style="{ width: `calc(${keptPct} * 1%)` }">
        <span
          v-for="s in laid"
          :key="`l${s.label}`"
          class="gb-seg cambra"
          :style="{ flexGrow: s.keep, background: s.acc }"
        />
      </div>
      <span v-if="overall" class="gb-overall">{{ overall }}</span>
    </div>

    <div v-if="note" class="gb-note">{{ note }}</div>
  </div>
</template>

<style scoped>
.gb {
  display: flex;
  flex-direction: column;
}
.gb-title {
  font-family: var(--f-mono);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fg-3);
  margin-bottom: 0.3rem;
}
.gb-track {
  display: flex;
  gap: 2px;
  height: 1.15rem;
}
.gb-seg {
  min-width: 2px;
  border-radius: 3px;
}
/* Today reads as cost, not as colour: outlined and nearly empty, so the only
   saturated thing on the chart is what Cambra leaves behind. */
.gb-seg.today {
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.05);
}
.gb-labels {
  position: relative;
  height: calc(0.35rem + var(--tiers, 2) * 1.3rem);
}
.gb-tag {
  position: absolute;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-50%);
  white-space: nowrap;
}
/* A label at either extreme cannot centre on its stage without running off the
   chart — anchor it to the edge and let the stem sit at its corner. */
.gb-tag.first {
  transform: none;
  align-items: flex-start;
}
.gb-tag.last {
  transform: translateX(-100%);
  align-items: flex-end;
}
.gb-stem {
  width: 1px;
  height: var(--stem);
  background: var(--acc);
  opacity: 0.55;
}
.gb-text {
  display: flex;
  align-items: baseline;
  gap: 0.28rem;
  padding-top: 0.1rem;
  font-family: var(--f-mono);
  font-size: 0.68rem;
}
.gb-fan {
  width: 100%;
  height: 1.5rem;
  opacity: 0.5;
  stroke-width: 1;
}
.gb-low {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
/* Segments share the kept width in proportion, so the bottom bar is a scaled
   copy of the top one rather than a separate chart. */
.gb-track.kept {
  flex: none;
}
.gb-seg.cambra {
  flex-basis: 0;
  border: none;
}
.gb-overall {
  font-family: var(--f-mono);
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
  color: var(--acc);
}
.gb-note {
  margin-top: 0.3rem;
  font-size: 0.55rem;
  line-height: 1.35;
  color: var(--fg-3);
  opacity: 0.8;
}
</style>
