<script setup>
import { computed } from 'vue'

// One bar, two states. Each stage is a single box drawn at its full "today"
// width; the share Cambra keeps is filled and the rest is greyed out inside the
// same box, so a stage reads as one thing that shrinks rather than two things
// sitting side by side.
//
// Stages are labelled once, below the bar, each tied to its box by a stem.
// Labels alternate between two tiers because the narrow stages cannot hold
// their own text at their own width, and a label that has to be matched to its
// box by guesswork is worse than no label at all.
//
// Gains are multipliers snapped to a coarse ladder. A stage that computes to
// 23x is not known to that precision, and printing it that way costs more
// credibility than the extra digit buys.
const props = defineProps({
  title: { type: String, required: true },
  // [{ label, value, keep }] — value and keep in the same unit, any unit.
  segments: { type: Array, required: true },
  note: { type: String, default: '' },
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

const laid = computed(() => {
  let acc = 0
  return props.segments.map((s, i) => {
    const start = acc
    acc += s.value
    return {
      ...s,
      width: (s.value / total.value) * 100,
      centre: ((start + s.value / 2) / total.value) * 100,
      fill: (s.keep / s.value) * 100,
      gain: gain(s.value / s.keep),
      // Alternating tiers so neighbouring labels cannot collide.
      tier: i % 2,
    }
  })
})
</script>

<template>
  <div class="gb">
    <div class="gb-head">
      <span class="gb-title">{{ title }}</span>
      <span v-if="overall" class="gb-overall">{{ overall }}</span>
    </div>

    <div class="gb-track">
      <span
        v-for="s in laid"
        :key="s.label"
        class="gb-seg"
        :style="{ width: `calc(${s.width} * 1%)`, '--fill': `${s.fill}%` }"
      />
    </div>

    <div class="gb-labels">
      <span
        v-for="s in laid"
        :key="s.label"
        class="gb-tag"
        :class="[`tier-${s.tier}`, { first: s.centre < 7, last: s.centre > 90 }]"
        :style="{ left: `calc(${s.centre} * 1%)` }"
      >
        <span class="gb-stem" />
        <span class="gb-text">
          <span class="gb-name">{{ s.label }}</span>
          <span v-if="s.gain" class="gb-gain">{{ s.gain }}</span>
          <span v-else class="gb-flat">unchanged</span>
        </span>
      </span>
    </div>

    <div v-if="note" class="gb-note">{{ note }}</div>
  </div>
</template>

<style scoped>
.gb {
  display: flex;
  flex-direction: column;
}
.gb-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.6rem;
  margin-bottom: 0.25rem;
}
.gb-title {
  font-family: var(--f-mono);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fg-3);
}
.gb-overall {
  font-family: var(--f-mono);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
  color: var(--cool);
}
.gb-track {
  display: flex;
  gap: 2px;
  height: 1.25rem;
}
/* One box per stage: the kept share filled, the remainder greyed inside the
   same border, so the stage shrinks rather than splitting in two. */
.gb-seg {
  min-width: 2px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: linear-gradient(
    to right,
    var(--cool) 0 var(--fill),
    rgba(255, 255, 255, 0.06) var(--fill) 100%
  );
}
.gb-labels {
  position: relative;
  height: 2.15rem;
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
/* A stage at either extreme cannot have its label centred on it without the
   label running off the track — anchor to the edge instead and let the stem
   sit at the label's corner. */
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
  background: rgba(255, 255, 255, 0.22);
}
.gb-tag.tier-0 .gb-stem {
  height: 0.3rem;
}
.gb-tag.tier-1 .gb-stem {
  height: 1.15rem;
}
.gb-text {
  display: flex;
  align-items: baseline;
  gap: 0.28rem;
  padding-top: 0.1rem;
  font-family: var(--f-mono);
  font-size: 0.56rem;
}
.gb-name {
  font-weight: 700;
  color: var(--fg-2);
}
.gb-gain {
  font-weight: 700;
  color: var(--cool);
}
.gb-flat {
  color: var(--fg-3);
  opacity: 0.7;
}
.gb-note {
  font-size: 0.55rem;
  line-height: 1.35;
  color: var(--fg-3);
  opacity: 0.8;
}
</style>
