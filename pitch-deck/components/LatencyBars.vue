<script setup>
import { computed } from 'vue'

// Elapsed wall-clock time from "change written" to "change fully live", not
// effort. Both tracks share one hour scale, so the second bar is shorter by
// exactly what goes away and the ratio printed below is the ratio drawn above.
//
// `kind` is 'work' (someone is doing something) or 'wait' (pure queue).
// `cambra` is the same step's duration on Cambra, in hours.
const STEPS = [
  { label: 'Implement',           hours: 2,   cambra: 2,   kind: 'work' },
  { label: 'Wait for review',     hours: 12,  cambra: 12,  kind: 'wait' },
  { label: 'Review & rework',     hours: 12,  cambra: 12,  kind: 'work' },
  { label: 'CI & integration suite', hours: 2, cambra: 0.2, kind: 'work' },
  { label: 'Release train',       hours: 168, cambra: 0,   kind: 'wait' },
  { label: 'Staging soak',        hours: 24,  cambra: 0,   kind: 'wait' },
  { label: 'Progressive rollout', hours: 480, cambra: 0,   kind: 'wait' },
]

const sum = (pick) => STEPS.reduce((a, s) => a + pick(s), 0)
const today = computed(() => sum((s) => s.hours))
const cambra = computed(() => sum((s) => s.cambra))
const ratio = computed(() => Math.round(today.value / cambra.value))

// Days for anything over a couple of days, hours below that.
const dur = (h) => (h >= 48 ? `${Math.round(h / 24)} days` : `${Math.round(h)} h`)

const rows = computed(() => [
  { key: 'Today', total: today.value, pick: (s) => s.hours },
  { key: 'Cambra', total: cambra.value, pick: (s) => s.cambra },
])
</script>

<template>
  <div class="lat">
    <div v-for="row in rows" :key="row.key" class="lat-row">
      <span class="lat-key">{{ row.key }}</span>
      <span class="lat-track">
        <span
          v-for="s in STEPS.filter((s) => row.pick(s) > 0)"
          :key="s.label"
          class="lat-seg"
          :class="s.kind"
          :style="{ width: `calc(${(row.pick(s) / today) * 100} * 1%)` }"
          :title="`${s.label} — ${dur(row.pick(s))}`"
        />
      </span>
      <span class="lat-total">{{ dur(row.total) }}</span>
    </div>
    <div class="lat-legend">
      <span class="lat-item work">Work</span>
      <span class="lat-item wait">Waiting</span>
      <span class="lat-note">Release train, soak and staged rollout are pure queue &mdash; they go to zero.</span>
    </div>
  </div>
</template>

<style scoped>
.lat {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.lat-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.lat-key {
  flex: none;
  width: 3.4rem;
  text-align: right;
  font-family: var(--f-mono);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fg-3);
}
.lat-track {
  display: flex;
  flex: 1;
  gap: 1.5px;
  height: 1.5rem;
}
.lat-seg {
  border-radius: 2px;
  /* Steps that are hours sit next to steps that are weeks. A 1px floor keeps
     the short ones painting without inflating the short bar — the drawn ratio
     has to stay equal to the stated one or the chart argues against itself. */
  min-width: 1px;
}
/* Work is the part someone is actually doing. It survives. */
.lat-seg.work {
  background: var(--cool);
}
/* Queue. This is what the claim is about. */
.lat-seg.wait {
  background: var(--coral);
  opacity: 0.85;
}
.lat-total {
  flex: none;
  width: 4.2rem;
  font-family: var(--f-mono);
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--fg-2);
}
.lat-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.15rem 0.7rem;
  margin-left: 3.9rem;
}
.lat-item {
  display: flex;
  align-items: center;
  gap: 0.28rem;
  font-size: 0.55rem;
  color: var(--fg-3);
}
.lat-item::before {
  content: '';
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 2px;
  flex: none;
}
.lat-item.work::before {
  background: var(--cool);
}
.lat-item.wait::before {
  background: var(--coral);
  opacity: 0.85;
}
.lat-note {
  font-size: 0.55rem;
  color: var(--fg-3);
  opacity: 0.8;
}
</style>
