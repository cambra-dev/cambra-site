<script setup>
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

const props = defineProps({
  initials: { type: String, required: true },
  quote: { type: String, required: true },
  // The unabridged version. Shown from `expandAt` onwards; omit it and the
  // card never changes.
  fullQuote: { type: String, default: '' },
  // Click index at which the excerpt gives way to the full quote. Reading
  // $clicks does not itself register a click, so the slide still needs a
  // v-click that reaches this number for the step to exist.
  expandAt: { type: [Number, String], default: null },
  // Hide the card entirely until it expands, keeping its space so the column
  // does not reflow. Opt-in, so cards that should read as a standing quote
  // still do.
  revealOnExpand: { type: Boolean, default: false },
  name: { type: String, required: true },
  title: { type: String, required: true },
})

const { $clicks } = useSlideContext()
const expanded = computed(
  () => !!props.fullQuote && props.expandAt != null && $clicks.value >= Number(props.expandAt),
)
</script>

<template>
  <div class="quote-card" :class="{ expanded, veiled: revealOnExpand && !expanded }">
    <div class="avatar">{{ initials }}</div>
    <div class="qbody">
      <p class="qtext">{{ quote }}</p>
      <div class="qname"><b>{{ name }}</b> — {{ title }}</div>
    </div>

    <!-- The full quotes run several times the length of the excerpts, so
         growing the card in place pushes the whole three-column slide past the
         frame. This takes over its whole column instead (it anchors to .col,
         not to the card): the layout underneath never moves, and covering the
         column outright reads as deliberate where a partial overlay just looks
         like a clipped bullet. Attribution is repeated so it stands alone. -->
    <div v-if="fullQuote" class="qfull" :class="{ expanded }">
      <div class="avatar">{{ initials }}</div>
      <div class="qbody">
        <p class="qtext">{{ fullQuote }}</p>
        <div class="qname"><b>{{ name }}</b> — {{ title }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quote-card {
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-left: 3px solid var(--warm);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  transition:
    border-color 0.35s ease,
    background 0.35s ease;
}
/* The overlay replaces this card entirely, so stop painting it underneath —
   its border otherwise shows as a seam along the overlay's edge. Child
   combinators: the overlay has its own .avatar and .qbody. */
.quote-card.expanded {
  background: transparent;
  border-color: transparent;
}
/* Present in the layout, invisible until it expands. */
.quote-card.veiled {
  opacity: 0;
}
.quote-card.expanded > .avatar,
.quote-card.expanded > .qbody {
  opacity: 0;
}
.quote-card > .avatar,
.quote-card > .qbody {
  transition: opacity 0.3s ease;
}
.avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--f-mono);
  font-weight: 700;
  font-size: 0.7rem;
  color: var(--abyssal);
  background: var(--amber);
}
.qbody {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}
.qtext {
  font-size: 0.7rem;
  line-height: 1.24;
  color: var(--fg);
  margin: 0;
}
.qname {
  font-family: var(--f-mono);
  font-size: 0.6rem;
  letter-spacing: 0.03em;
  color: var(--fg-3);
}
.qname b {
  color: var(--fg-2);
  font-weight: 700;
}

/* inset:0 resolves against .col-body — the part of the column this quote is
   allowed to cover (see style.css). */
.qfull {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  background: var(--bg-2);
  border-radius: 8px;
  padding: 0.2rem 0;
  opacity: 0;
  visibility: hidden;
  transform: translateY(0.35rem);
  transition:
    opacity 0.35s ease,
    transform 0.35s ease,
    visibility 0.35s;
}
.qfull.expanded {
  opacity: 1;
  visibility: visible;
  transform: none;
}
</style>
