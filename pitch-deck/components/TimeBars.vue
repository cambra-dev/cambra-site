<script setup>
import { computed } from 'vue'

// Where engineering time goes, and what it becomes on Cambra. One row per
// category: `today` and `cambra` are percentages of the same 100-point total,
// so the two tracks share a scale and the second bar is shorter by exactly the
// share that goes away. Tune the numbers here — nothing else needs to change.
//
// `tone` only picks the colour: 'plain' and 'plain-alt' for work Cambra does
// not claim (two shades so adjacent neutral blocks stay legible), 'cut' for
// work it reduces, 'gone' for work it removes outright. Rows may be reordered
// freely — nothing keys off position.
const SEGMENTS = [
  { label: 'Feature work',        today: 50, cambra: 50, tone: 'plain' },
  { label: 'Review & planning',   today: 19, cambra: 19, tone: 'plain-alt' },
  { label: 'Debugging',           today: 15, cambra: 12, tone: 'cut' },
  { label: 'Incident response',   today: 8,  cambra: 6,  tone: 'cut' },
  { label: 'Observability infra', today: 4,  cambra: 0,  tone: 'gone' },
  { label: 'Release automation',  today: 4,  cambra: 0,  tone: 'gone' },
]

const props = defineProps({
  // Print the implied multiple under the bars. Off by default: the ratio is a
  // claim, and it should not appear until it agrees with the rest of the deck.
  showRatio: { type: Boolean, default: false },
})

const rows = [
  { key: 'Today', of: (s) => s.today },
  { key: 'Cambra', of: (s) => s.cambra },
]
const total = (pick) => SEGMENTS.reduce((a, s) => a + pick(s), 0)
const ratio = computed(() => (total((s) => s.today) / total((s) => s.cambra)).toFixed(2))
const shown = (seg, pick) => pick(seg) > 0
</script>

<template>
  <div class="tbar">
    <div v-for="row in rows" :key="row.key" class="tb-row">
      <span class="tb-key">{{ row.key }}</span>
      <span class="tb-track">
        <span
          v-for="seg in SEGMENTS.filter((s) => shown(s, row.of))"
          :key="seg.label"
          class="tb-seg"
          :class="[seg.tone, { faded: row.key === 'Cambra' && seg.tone === 'cut' }]"
          :style="{ width: `calc(${row.of(seg)} * 1%)` }"
        />
      </span>
    </div>
    <div class="tb-legend">
      <span v-for="seg in SEGMENTS" :key="seg.label" class="tb-item" :class="seg.tone">
        {{ seg.label }}
      </span>
    </div>
    <div v-if="showRatio" class="tb-ratio">{{ ratio }}&times;</div>
  </div>
</template>

<style scoped>
.tbar {
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
}
.tb-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}
.tb-key {
  flex: none;
  width: 3.5rem;
  text-align: right;
  font-family: var(--f-mono);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fg-3);
}
.tb-track {
  display: flex;
  flex: 1;
  gap: 2px;
  height: 1.55rem;
}
.tb-seg {
  border-radius: 2px;
}
/* Work Cambra does not claim: present in both bars, deliberately quiet. */
.tb-seg.plain {
  background: rgba(255, 255, 255, 0.14);
}
.tb-seg.plain-alt {
  background: rgba(255, 255, 255, 0.09);
}
.tb-seg.cut {
  background: var(--warm);
  opacity: 0.85;
}
.tb-seg.gone {
  background: var(--coral);
}
.tb-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.12rem 0.7rem;
  margin-left: 4.05rem;
}
.tb-item {
  display: flex;
  align-items: center;
  gap: 0.28rem;
  font-size: 0.55rem;
  color: var(--fg-3);
  white-space: nowrap;
}
.tb-item::before {
  content: '';
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 2px;
  flex: none;
}
.tb-item.plain::before {
  background: rgba(255, 255, 255, 0.14);
}
.tb-item.plain-alt::before {
  background: rgba(255, 255, 255, 0.09);
}
.tb-item.cut::before {
  background: var(--warm);
}
.tb-item.gone::before {
  background: var(--coral);
}
.tb-ratio {
  margin-left: 4.05rem;
  font-family: var(--f-mono);
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--cool);
}
</style>
