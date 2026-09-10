<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

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
// Labels drop to a lower row only when they have to. Staggering every other
// label by index pushed plenty of labels down that had room to stay put — the
// wide stages especially. So rows are assigned greedily from measured widths:
// each label takes the highest row where it clears the last label already on
// that row. `tiers` is the cap, not the pattern.
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

// Measured row assignment. Text width is not knowable until it is rendered, so
// the labels go out at row 0, get measured, and settle. One frame, invisible.
const labelsEl = ref(null)
const rowOf = ref([])
const rowCount = computed(() => (rowOf.value.length ? Math.max(...rowOf.value) + 1 : 1))
// Breathing room between two labels sharing a row, in px.
const GAP = 10
let ro

const assignRows = () => {
  const el = labelsEl.value
  if (!el) return
  const width = el.getBoundingClientRect().width
  if (width < 1) return
  const tags = [...el.querySelectorAll('.gb-tag')]
  if (tags.length !== laid.value.length) return
  // Rightmost ink placed on each row so far.
  const filled = []
  const next = laid.value.map((s, i) => {
    const w = tags[i].getBoundingClientRect().width
    const centre = (s.xu / 100) * width
    // Must match the .first/.last clamps below, or the maths describes a box
    // that is not where the label actually is.
    const left = s.xu < 6 ? centre : s.xu > 94 ? centre - w : centre - w / 2
    let row = 0
    while (row < props.tiers - 1 && filled[row] != null && left < filled[row] + GAP) row += 1
    filled[row] = Math.max(filled[row] ?? -Infinity, left + w)
    return row
  })
  if (next.length !== rowOf.value.length || next.some((r, i) => r !== rowOf.value[i])) {
    rowOf.value = next
  }
}

onMounted(() => {
  assignRows()
  // Web fonts land after first paint and change every measurement.
  document.fonts?.ready?.then(assignRows)
  if (labelsEl.value) {
    ro = new ResizeObserver(assignRows)
    ro.observe(labelsEl.value)
  }
})
onBeforeUnmount(() => ro?.disconnect())
watch(() => props.segments, () => { rowOf.value = []; assignRows() }, { deep: true })

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
        :style="{ width: `calc(${s.wUpper} * 1%)`, '--acc': s.acc }"
      />
    </div>

    <div ref="labelsEl" class="gb-labels" :style="{ '--tiers': rowCount }">
      <span
        v-for="(s, i) in laid"
        :key="`t${s.label}`"
        class="gb-tag"
        :class="[`tier-${rowOf[i] || 0}`, { first: s.xu < 6, last: s.xu > 94 }]"
        :style="{ left: `calc(${s.xu} * 1%)`, '--stem': `calc(0.2rem + ${rowOf[i] || 0} * var(--row-step))`, '--acc': s.acc }"
      >
        <span class="gb-stem" />
        <span class="gb-text">
          <span class="gb-name">{{ s.label }}</span>
          <span v-if="s.gain" class="gb-gain">{{ s.gain }}</span>
          <span v-else class="gb-flat">unchanged</span>
        </span>
      </span>
    </div>

    <!-- The fan: one curve per stage, from under its label to its section of
         the bottom bar. Cubic with both control points at mid-height gives a
         smoothstep — it leaves and arrives vertically, so the curves read as
         the same stage narrowing rather than as a bundle of diagonals.
         preserveAspectRatio=none lets x stay in percentages of the bar while
         the band keeps a fixed height; non-scaling-stroke stops that
         distorting the line weight. -->
    <svg class="gb-fan" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path
        v-for="s in laid"
        :key="`k${s.label}`"
        :d="`M${s.xu} 0C${s.xu} 50 ${s.xl} 50 ${s.xl} 100`"
        :stroke="s.acc"
        fill="none"
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
/* Same colour as the stage's section below, lighter: the pair is one stage in
   two states, so the eye should match them by hue and read the difference as
   length. */
.gb-seg.today {
  /* Solid, the same colour as the stage's section below: the pair is one stage
     in two states, and the only difference the reader should have to decode is
     length. Any translucency over this navy also desaturates toward grey. */
  background: var(--acc);
}
.gb-labels {
  position: relative;
  /* One place to set the gap between label rows. The stems below derive from
     it, so rows and stems cannot drift apart. */
  --row-step: 1.75rem;
  height: calc(0.35rem + var(--tiers, 2) * var(--row-step));
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
/* Name over multiplier rather than side by side: stacked, a label occupies
   half the width, so the labels can sit closer before they collide and each
   one reads as a unit. */
.gb-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.15;
  padding-top: 0.1rem;
  font-family: var(--f-mono);
  font-size: 0.68rem;
}
.gb-tag.first .gb-text {
  align-items: flex-start;
}
.gb-tag.last .gb-text {
  align-items: flex-end;
}
/* Tall enough for the curve to actually curve: in a short band the control
   points sit too close together and every connector flattens into the same
   near-horizontal swoosh. */
.gb-fan {
  width: 100%;
  height: 2.6rem;
  opacity: 0.55;
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
