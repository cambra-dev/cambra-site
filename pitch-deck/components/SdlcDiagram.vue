<script setup>
import { computed, h } from 'vue'
import { useNav } from '@slidev/client'
import { VueFlow, MarkerType } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import ArchNode from './ArchNode.vue'
import ClusterNode from './ClusterNode.vue'
import { useFlowFit } from '../composables/useFlowFit'
import { arch, cluster, row, spanOf } from '../composables/layout'

const props = defineProps({
  // Driven by $clicks. 1 = the lifecycle, 2 = what a language can tell you,
  // 3 = what only production tells you, 4 = Cambra pulls that forward.
  stage: { type: Number, default: 4 },
  // Set when `stage` is pinned deliberately rather than driven by clicks — the
  // short deck splits this diagram across two slides at fixed stages, and the
  // print override below would otherwise collapse both to the finished state.
  fixed: { type: Boolean, default: false },
})

// Slidev reveals every v-click element when exporting, but these diagrams take
// their build stage as a prop, so an export rendered them at click 0 — this one
// with nothing lit at all. Match Slidev's own print behaviour and show the
// finished diagram.
const { isPrintMode } = useNav()
const MAX_STAGE = 4
const activeStage = computed(() =>
  isPrintMode.value && !props.fixed ? MAX_STAGE : props.stage,
)

const COOL = '#6CC4C8'
const EMBER = '#D75A2E'
const CORAL = '#F18B40'
const GREY = '#7d97b2'

const STAGE = { w: 108, h: 48, gap: 24 }
const ROW_X = 8
const ROW_Y = 110
const STAGES = [
  { id: 'code', data: { title: 'Code', variant: 'lg' } },
  { id: 'compile', data: { title: 'Compile', variant: 'lg' } },
  { id: 'test', data: { title: 'Test', variant: 'lg' } },
  { id: 'deploy', data: { title: 'Deploy', variant: 'lg' } },
  { id: 'operate', data: { title: 'Operate', variant: 'lg' } },
]
const ROW_W = spanOf(STAGES.length, STAGE.w, STAGE.gap)
const ROW_BOTTOM = ROW_Y + STAGE.h

// Feedback arcs: the language's own loops run over the top, the property loops
// run underneath. Offsets nest them; the horizontal span is the point — how far
// back you have to come from to learn the thing.
const OVER = { syntax: 20, debuggers: 62 }
const UNDER = { after: 40, afterOuter: 88, before: 106 }



// Who produces the feedback each family of loops carries.
const MARK = { w: 34, h: 34 }
const centreOf = (i) => ROW_X + i * (STAGE.w + STAGE.gap) + STAGE.w / 2
// Each mark sits just clear of the vertical drop of the loop it explains.
const NAUTILUS_X = centreOf(2) + 18
const PERSON_X = centreOf(4) + 16

// The whole lifecycle, boxed.
const BOX_PAD = { x: 22, top: OVER.debuggers + 46, bottom: Math.max(UNDER.before, UNDER.afterOuter) + 26 }
const BOX = {
  x: ROW_X - BOX_PAD.x,
  y: ROW_Y - BOX_PAD.top,
  w: ROW_W + BOX_PAD.x * 2,
  h: STAGE.h + BOX_PAD.top + BOX_PAD.bottom,
}

// The box's own label hangs above its top edge, so give it room.
const BOUNDS = { x: BOX.x, y: BOX.y - 16, width: BOX.w, height: BOX.h + 16 }

const { wrap, flowId, onPaneReady, fitOptions } = useFlowFit({ padding: 0.04, bounds: BOUNDS })

const at = (stage, nodes, until) => nodes.map((n) => ({ ...n, at: stage, until }))

// Vue Flow renders a non-string edge label as a component, so a label can emit
// its own tspans. Stacking the words keeps a two-word label from lying along
// the arrow and hiding it.
// No background chip, so the arc runs behind the label: lay the lines out so
// the run falls in the gap between them, and sit a lone line just above it.
const LINE_GAP = 1.8
const BASELINE_NUDGE = 0.3
const stacked = (...lines) => () => {
  const first =
    lines.length === 1 ? -0.55 : (-LINE_GAP / 2) * (lines.length - 1) + BASELINE_NUDGE
  return lines.map((line, i) =>
    h('tspan', { x: 0, dy: i === 0 ? `${first}em` : `${LINE_GAP}em` }, line),
  )
}


const ALL_NODES = [
  ...at(1, [cluster('sdlc', BOX, { label: 'Software Development Lifecycle', variant: 'lg' })]),
  ...at(1, row(STAGES, { x: ROW_X, y: ROW_Y, ...STAGE })),
  // Cambra is the reason these two loops exist at all.
  ...at(4, [
    arch(
      'nautilus',
      { x: NAUTILUS_X, y: ROW_BOTTOM + (UNDER.after + UNDER.afterOuter) / 2 - MARK.h / 2, ...MARK },
      { img: '/brand/symbol.svg', variant: 'mark' },
    ),
  ]),
  // A human is the only thing closing the long loop today.
  ...at(3, [
    arch(
      'person',
      { x: PERSON_X, y: ROW_BOTTOM + UNDER.before - MARK.h / 2, ...MARK },
      { icon: 'i-ph-user-fill', variant: 'mark' },
    ),
  ], 3),
]

const edge = (id, source, target, opts = {}) => ({
  id,
  // Above the backdrops (0), below the boxes (2).
  zIndex: 1,
  source,
  target,
  sourceHandle: opts.sourceHandle ?? 'right-s',
  targetHandle: opts.targetHandle ?? 'left-t',
  type: 'smoothstep',
  style: { stroke: opts.color ?? COOL, strokeWidth: opts.width ?? 1.8, strokeDasharray: opts.dash },
  ...(opts.offset ? { pathOptions: { offset: opts.offset } } : {}),
  ...(opts.arrow === false
    ? {}
    : {
        markerEnd: { type: MarkerType.ArrowClosed, color: opts.color ?? COOL, width: 13, height: 13 },
      }),
  ...(opts.label
    ? {
        label: opts.label,
        labelStyle: {
          fill: opts.color ?? COOL,
          fontFamily: 'var(--f-mono)',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.04em',
        },
        labelShowBg: false,
      }
    : {}),
  at: opts.at,
  until: opts.until,
})

const over = (id, source, opts) =>
  edge(id, source, 'code', { sourceHandle: 'top-s', targetHandle: 'top-t', ...opts })
const under = (id, source, opts) =>
  edge(id, source, 'code', {
    sourceHandle: 'bottom-s',
    targetHandle: 'bottom-t',
    color: CORAL,
    width: 2.4,
    ...opts,
  })

const ALL_EDGES = [
  ...STAGES.slice(1).map((s, i) => edge(`f-${s.id}`, STAGES[i].id, s.id, { at: 1, color: '#7d97b2' })),

  // What a language can tell you today, and how quickly.
  over('l-compile', 'compile', { at: 2, offset: OVER.syntax, label: stacked('soundness') }),
  over('l-test', 'test', { at: 2, offset: OVER.debuggers, label: stacked('bugs') }),

  // What actually matters — and today you only find out in production.
  under('l-operate', 'operate', {
    at: 3,
    until: 3,
    offset: UNDER.before,
    color: GREY,
    label: stacked('reliability · integrity · security · performance'),
  }),
  // Cambra checks the same properties within the lifecycle: statically where it
  // can, at test time where it must.
  under('l-static', 'compile', { at: 4, offset: UNDER.after, label: stacked('integrity', 'security') }),
  under('l-dynamic', 'test', {
    at: 4,
    offset: UNDER.afterOuter,
    label: stacked('performance', 'reliability'),
  }),

  // The annotation hangs off the loops, not off a stage.
]

const shown = (item) => {
  const s = Math.max(activeStage.value, 1)
  return item.at <= s && (item.until == null || s <= item.until) ? 1 : 0
}

// Everything stays mounted so the viewport never shifts; opacity drives the
// reveal, and the two warm arcs cross-fade into each other.
const nodes = computed(() =>
  ALL_NODES.map((n) => ({ ...n, style: { ...n.style, opacity: shown(n) } })),
)
const edges = computed(() =>
  ALL_EDGES.map((e) => {
    const opacity = shown(e)
    return {
      ...e,
      style: { ...e.style, opacity },
      ...(e.labelStyle ? { labelStyle: { ...e.labelStyle, opacity } } : {}),
      ...(e.labelBgStyle ? { labelBgStyle: { ...e.labelBgStyle, opacity } } : {}),
    }
  }),
)
</script>

<template>
  <div ref="wrap" class="flow-unscale">
    <VueFlow
      :id="flowId"
      :nodes="nodes"
      :edges="edges"
      :nodes-draggable="false"
      :nodes-connectable="false"
      :elements-selectable="false"
      :zoom-on-scroll="false"
      :zoom-on-pinch="false"
      :zoom-on-double-click="false"
      :pan-on-drag="false"
      :pan-on-scroll="false"
      :prevent-scrolling="false"
      fit-view-on-init
      :fit-view-on-init-options="fitOptions"
      class="arch-flow"
      @pane-ready="onPaneReady"
    >
      <template #node-arch="{ data }">
        <ArchNode :data="data" />
      </template>
      <template #node-cluster="{ data }">
        <ClusterNode :data="data" />
      </template>
    </VueFlow>
  </div>
</template>

<style scoped>
.arch-flow {
  width: 100%;
  height: 100%;
}
:deep(.vue-flow__node),
:deep(.vue-flow__edge-path),
:deep(.vue-flow__edge-text),
:deep(.vue-flow__edge-textbg) {
  transition: opacity 0.45s ease;
}
/* The deck is a fixed stage, not an interactive canvas. */
:deep(.vue-flow__panel),
:deep(.vue-flow__attribution) {
  display: none;
}
</style>
