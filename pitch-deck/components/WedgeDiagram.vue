<script setup>
// Cambra driving into the market: the point goes into a fracture that is
// already in the durable-execution segment, and the body follows through the
// opening it makes. Each of the slide's claims is a part of the picture —
// the concepts inside Cambra, what AI does along its leading edges, the flaw it
// exploits at the contact, and the incremental going-in bracketed over the
// wedge.
import { computed } from 'vue'
import { useNav } from '@slidev/client'

const props = defineProps({
  // 0 the market, 1 the fracture, 2 Cambra drives in, 3 the annotation.
  stage: { type: Number, default: 3 },
  // Print applies no clicks, so an export would render at stage 0.
  printStage: { type: Number, default: null },
})
const { isPrintMode } = useNav()
const MAX_STAGE = 3
const at = computed(() =>
  isPrintMode.value ? (props.printStage ?? MAX_STAGE) : props.stage,
)
const shown = (s) => (at.value >= s ? 1 : 0)

// ── Geometry ────────────────────────────────────────────────────────────
// The Venn's box in the SVG's own coordinates. Everything the diagram needs to
// touch the Venn is derived from these four numbers rather than measured off a
// render, so moving or resizing it does not silently leave the fracture
// floating beside a circle it is supposed to be splitting.
const BOX = { w: 900, h: 390 }
const VX = 60
const VY = 70
const VW = 330
// `.venn` is `aspect-ratio: 1 / 0.9511`, and `.venn-circle` is 63.49% of its
// width — both from the Venn's own derivation in style.css.
const VH = VW * 0.9511
const R = (VW * 0.6349) / 2
// `durable` is the circle pinned to the Venn's top-right, so the point of its
// edge that faces Cambra is its rightmost.
const MOUTH = { x: VX + VW, y: VY + R }

const vennStyle = {
  left: `${(VX / BOX.w) * 100}%`,
  top: `${(VY / BOX.h) * 100}%`,
  height: `${(VH / BOX.h) * 100}%`,
}

// Cambra: body to the right, its leading point resting on the mouth.
// Top and bottom stay equidistant from the tip's y, or the point comes out
// lopsided. Grown from 158 to 174 to leave the pills room above the edge.
const BODY = { x: 600, right: 884, top: 88, bottom: 262, r: 14 }
const TIP = { x: MOUTH.x + 2, y: MOUTH.y }

const cambraPath = computed(() =>
  `M${TIP.x} ${TIP.y} L${BODY.x} ${BODY.top} L${BODY.right - BODY.r} ${BODY.top}` +
  ` A${BODY.r} ${BODY.r} 0 0 1 ${BODY.right} ${BODY.top + BODY.r}` +
  ` L${BODY.right} ${BODY.bottom - BODY.r}` +
  ` A${BODY.r} ${BODY.r} 0 0 1 ${BODY.right - BODY.r} ${BODY.bottom}` +
  ` L${BODY.x} ${BODY.bottom} Z`,
)

// A closed seam running in from the mouth, short enough to read as damage local
// to the impact. Offsets are from the mouth, so it travels with the Venn.
const seg = (dx, dy) => `${MOUTH.x + dx} ${MOUTH.y + dy}`
const fracturePath = computed(
  () => `M${seg(0, 0)} L${seg(-12, -9)} L${seg(-21, 6)} L${seg(-32, -4)} L${seg(-42, 13)}`,
)
const splinters = computed(() => [
  `M${seg(-3, -7)} L${seg(-18, -30)}`,
  `M${seg(-2, 7)} L${seg(-17, 32)}`,
])

// Labels ride the leading edges at the edges' own angle.
const edgeAngle = computed(() => {
  const deg = Math.atan2(BODY.top - TIP.y, BODY.x - TIP.x) * (180 / Math.PI)
  return Math.round(deg * 10) / 10
})
const edgeLabel = (sign) => {
  const mx = (TIP.x + BODY.x) / 2
  const my = (TIP.y + (sign < 0 ? BODY.top : BODY.bottom)) / 2
  return { x: mx - 5, y: my + sign * 13 }
}
</script>

<template>
  <div class="wv-wrap">
    <div class="wv-venn" :style="vennStyle">
      <div class="venn">
        <div class="venn-circle serving"></div>
        <div class="venn-circle durable"></div>
        <div class="venn-circle analytics"></div>
        <!-- The deck's own label treatment, so this reads as the same diagram
             the market slides use. Names only: valuations belong there. -->
        <div class="venn-label serving"><span class="vl-name">Serving</span></div>
        <div class="venn-label durable"><span class="vl-name">Durable execution</span></div>
        <div class="venn-label analytics"><span class="vl-name">Analytics</span></div>
      </div>
    </div>

    <svg class="wv-svg" :viewBox="`0 0 ${BOX.w} ${BOX.h}`" preserveAspectRatio="xMidYMid meet">
      <defs>
        <!-- Brightest where the point bears on it, fading to nothing inward:
             the eye goes to where the force is. -->
        <linearGradient
          id="wv-fracture"
          :x1="MOUTH.x - 46" y1="0" :x2="MOUTH.x" y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#6cc4c8" stop-opacity="0.25"></stop>
          <stop offset="0.55" stop-color="#6cc4c8" stop-opacity="0.7"></stop>
          <stop offset="1" stop-color="#6cc4c8" stop-opacity="1"></stop>
        </linearGradient>
      </defs>

      <!-- The fracture already in the segment: Cambra's point goes into the
           opening that is there rather than making one, which is the argument.
           Closed rather than a void — open, the two read as Cambra coming out of
           the circle instead of being driven into it. -->
      <g class="beat" :style="{ opacity: shown(1) }">
        <path class="fracture" :d="fracturePath"></path>
        <path v-for="(d, i) in splinters" :key="i" class="splinter" :d="d"></path>
        <path class="leader" d="M366 186 L396 296 L436 296"></path>
        <text class="lbl sm flaw-t left" x="444" y="300">VERSIONING</text>
        <text class="lbl sm flaw-t left" x="444" y="320">PROBLEMS</text>
      </g>

      <!-- Cambra as one shape: the wedge is not a separate thing pushing it in,
           it is Cambra's own leading point. One path, so there is no seam
           between them to read as a join. -->
      <g class="beat" :style="{ opacity: shown(2) }">
        <path class="cambra" :d="cambraPath"></path>
        <!-- Outside the edges rather than within them: what AI does is ease the
             way in, not fill the space. -->
        <text
          class="lbl sm warm-t"
          :transform="`rotate(${edgeAngle} ${edgeLabel(-1).x} ${edgeLabel(-1).y})`"
          :x="edgeLabel(-1).x" :y="edgeLabel(-1).y"
        >AI automates adoption</text>
        <text
          class="lbl sm warm-t"
          :transform="`rotate(${-edgeAngle} ${edgeLabel(1).x} ${edgeLabel(1).y})`"
          :x="edgeLabel(1).x" :y="edgeLabel(1).y"
        >AI helps you learn</text>
      </g>

      <!-- Over the wedge alone: the incremental part is the going-in. -->
      <g class="beat" :style="{ opacity: shown(3) }">
        <path :d="`M${TIP.x} 52 L${TIP.x} 40 L${BODY.x - 4} 40 L${BODY.x - 4} 52`" class="ann"></path>
        <text class="lbl sm cool-t" :x="(TIP.x + BODY.x) / 2" y="32">ONE WORKLOAD AT A TIME</text>
      </g>
    </svg>

    <!-- Cambra's contents, over the shape the SVG draws. HTML because the
         entries are pills: they need inline flow and wrapping, which SVG text
         has neither of. -->
    <div class="wv-panel beat" :style="{ opacity: shown(2) }">
      <!-- The wordmark itself, not the name set in the UI face. This is the
           horizontal lockup the cover uses, so it already carries the symbol. -->
      <img class="wv-logo" src="/brand/logo-horizontal-negative.svg" alt="Cambra" />
      <p class="wv-lead">Presents familiar concepts</p>
      <p class="wv-lead">Slots into the SDLC</p>
      <p class="wv-lead">Plugs into the stack</p>
    </div>

    <!-- The other half of the claim, unboxed: what the shape holds is what you
         write, and this is what you stop writing. -->
    <div class="wv-gone beat" :style="{ opacity: shown(2) }">
      <span class="wv-gone-label">Gone</span>
      <div class="bm-tags">
        <span>glue code</span><span>infra</span><span>config</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wv-wrap {
  position: relative;
  width: 100%;
  max-height: 100%;
  aspect-ratio: 900 / 390;
  margin: auto;
}
.wv-venn {
  position: absolute;
}
.wv-venn .venn {
  height: 100%;
  width: auto;
}
/* `.vl-name` is sized in cqw against the Venn, which is far narrower here than
   in the two-column market slides — inheriting it alone renders the names at
   about two thirds the size they read at there. */
.wv-venn .vl-name {
  font-size: 3.6cqw;
  max-width: 8em;
}
/* Clear of the fracture, which runs through where this label sits by default. */
.wv-venn .venn-label.durable {
  top: 13%;
  left: 77%;
}
/* The market has to hold its own beside a filled Cambra, and the segment under
   attack carries more weight than its neighbours. */
.wv-venn .venn-circle {
  border-color: rgba(108, 196, 200, 0.7);
  background: rgba(108, 196, 200, 0.07);
}
.wv-venn .venn-circle.durable {
  border-color: rgba(108, 196, 200, 0.95);
  background: rgba(108, 196, 200, 0.14);
}

.wv-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.beat {
  transition: opacity 0.35s ease;
}

/* Cambra is the warm thing on the slide; the market stays cool. */
.cambra {
  fill: rgba(245, 163, 55, 0.13);
  stroke: var(--amber);
  stroke-width: 2;
  stroke-linejoin: round;
}
.fracture {
  fill: none;
  stroke: url(#wv-fracture);
  stroke-width: 2.6;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.splinter {
  fill: none;
  stroke: var(--cool);
  stroke-width: 1.4;
  stroke-linecap: round;
  opacity: 0.7;
}
.ann {
  fill: none;
  stroke: var(--cool);
  stroke-width: 1.5;
}
.leader {
  fill: none;
  stroke: var(--ember);
  stroke-width: 1.2;
  opacity: 0.75;
}

.wv-svg text {
  text-anchor: middle;
  font-family: var(--f-mono);
  fill: var(--fg);
}
.lbl {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.lbl.sm {
  font-size: 13px;
  letter-spacing: 0.08em;
}
/* Also scoped past `.wv-svg text`, which otherwise keeps this centred and runs
   the leader line through the label it points at. */
.wv-svg .left {
  text-anchor: start;
}
/* Scoped to beat `.wv-svg text`, which sets the default ink and would
   otherwise outrank a bare class and leave every label white. */
.wv-svg .warm-t { fill: var(--warm); }
.wv-svg .cool-t { fill: var(--cool); }
/* Ember: the flaw is the one thing on the slide that is wrong, and it should
   read before anything else in the market half. */
.wv-svg .flaw-t { fill: var(--ember); }

.wv-panel {
  position: absolute;
  left: 69.33%;
  top: 27.5%;
  width: 27.3%;
}
.wv-logo {
  display: block;
  width: 150px;
  height: auto;
}
.wv-lead {
  margin: 0.55rem 0 0;
  font-size: 1rem;
  color: var(--fg-2);
}
.wv-logo + .wv-lead {
  margin-top: 0.9rem;
}
.wv-gone {
  position: absolute;
  left: 69.33%;
  /* Just under the shape's bottom edge. The flaw callout sits to its left, and
     splitting that onto two lines is what opens the gap between them. */
  top: 73%;
  width: 27.3%;
}
.wv-gone-label {
  font-family: var(--f-mono);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--fg-3);
}
.wv-gone .bm-tags {
  margin-top: 0.4rem;
}
</style>
