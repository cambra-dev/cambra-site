<script setup>
import { computed } from 'vue'
import { VueFlow, MarkerType } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import ArchNode from './ArchNode.vue'
import ClusterNode from './ClusterNode.vue'
import { useFlowFit } from '../composables/useFlowFit'
import { arch, cluster } from '../composables/layout'

// Four pictures of the same program, drawn on one fixed 2x2 grid — logic in
// the left column, state in the right — so that the ONLY thing that changes
// between them is where the boundary falls:
//
//   program  no boundary. One box, logic and state cycling.
//   dsl      cut through BOTH columns. The platform takes control flow and
//            durable state; your code is left holding leaves and locals.
//   replay   cut through the state column only. You keep your control flow —
//            which is why this won — and the log pays for it by re-running
//            your logic to find out where it was.
//   durable  no boundary again, over an engine that understands the program.
//
// The grid is fixed on purpose. The argument is geometric: count the cuts.
const props = defineProps({
  variant: { type: String, default: 'program' },
})

// Tall enough for a title AND a sub — the `State` cell carries one, and at 34
// it rendered its second line through the box's own bottom border.
const CELL = { w: 112, h: 46 }
const CELL_GAP = 12
const PAD = 14
const BOX_W = CELL.w * 2 + CELL_GAP + PAD * 2
const BAND_H = CELL.h + PAD * 2
const BAND_GAP = 46
const H = BAND_H * 2 + BAND_GAP

// Column origins. Everything in every variant lands on one of these two.
const COL_L = PAD
const COL_R = PAD + CELL.w + CELL_GAP
const TOP_Y = 0
const BOT_Y = BAND_H + BAND_GAP

// One rect for the three cut variants, so every panel is fitted at the same
// scale and the boxes line up across the row. Margins clear the cluster
// labels, which hang above their box, and the edge labels.
const BOUNDS = { x: -14, y: -20, width: BOX_W + 28, height: H + 34 }
// `program` is one band, not two, and it sits in a short strip of its own.
// Fitting it to the two-band rect would scale it to a third of the others and
// render its labels illegible, so it gets a rect the size of what it draws.
const PROGRAM_Y = (H - BAND_H) / 2
const PROGRAM_BOUNDS = {
  x: -14,
  y: PROGRAM_Y - 20,
  width: BOX_W + 28,
  height: BAND_H + 30,
}
const { wrap, flowId, onPaneReady, fitOptions } = useFlowFit({
  padding: 0.04,
  bounds: props.variant === 'program' ? PROGRAM_BOUNDS : BOUNDS,
})

const cell = (id, y, x, title, opts = {}) =>
  arch(id, { x, y: y + PAD, ...CELL, ...(opts.size ?? {}) }, {
    title,
    sub: opts.sub,
    variant: opts.variant ?? 'lg',
  })

const band = (id, y, label, opts = {}) =>
  cluster(id, { x: opts.x ?? 0, y, w: opts.w ?? BOX_W, h: opts.h ?? BAND_H }, {
    label,
    variant: opts.variant ?? 'lg solid',
  })

// The program, whole: one box, two halves, a cycle between them. Centred in
// the frame so the other variants can split away from it in both directions.
const PROGRAM = [
  band('prog', PROGRAM_Y, 'Program', { variant: 'warm solid lg' }),
  cell('logic', PROGRAM_Y, COL_L, 'Logic'),
  cell('state', PROGRAM_Y, COL_R, 'State', { sub: 'durable + ephemeral' }),
]

// Cut twice. Control flow and durable state are both on the far side of the
// boundary, so the program's shape is no longer written in your language —
// that is the cost this picture exists to make obvious.
const DSL = [
  band('platform', TOP_Y, 'Platform'),
  cell('flow', TOP_Y, COL_L, 'Control flow'),
  cell('durable', TOP_Y, COL_R, 'Durable state', { variant: 'lg store' }),
  band('yours', BOT_Y, 'Your code', { variant: 'warm solid lg' }),
  cell('leaf', BOT_Y, COL_L, 'Leaf logic'),
  cell('eph', BOT_Y, COL_R, 'Ephemeral', { variant: 'lg dashed' }),
]

// Cut once. The top band covers the state column only — you kept your control
// flow, and the empty left half is the whole reason this model beat the one
// above it. The price is the arrow coming back: the log has to re-run your
// logic to discover where the program was.
const REPLAY = [
  band('platform', TOP_Y, 'Platform', { x: COL_R - PAD, w: CELL.w + PAD * 2 }),
  cell('log', TOP_Y, COL_R, 'Event log', { variant: 'lg store' }),
  band('yours', BOT_Y, 'Your code', { variant: 'warm solid lg' }),
  cell('logic', BOT_Y, COL_L, 'Logic'),
  cell('eph', BOT_Y, COL_R, 'Ephemeral', { variant: 'lg dashed' }),
]

// No boundary. Same silhouette as PROGRAM, over an engine that can see the
// dependency structure — which is what buys back everything the cuts cost.
const DURABLE = (() => {
  const ENGINE_H = 46
  const GAP = 10
  const y = (H - (BAND_H + GAP + ENGINE_H)) / 2
  const engineY = y + BAND_H + GAP
  return [
    band('prog', y, 'Program', { variant: 'warm solid lg' }),
    cell('logic', y, COL_L, 'Logic'),
    cell('state', y, COL_R, 'State', { sub: 'durable + ephemeral' }),
    band('engine', engineY, 'Engine', { h: ENGINE_H, variant: 'cool solid lg' }),
    arch(
      'knows',
      { x: COL_L, y: engineY + 15, w: BOX_W - PAD * 2, h: 16 },
      { title: 'knows what derives from what', variant: 'mark stack' },
    ),
  ]
})()

const WIRE = '#7d97b2'
const WARM = '#f5a337'
const COOL = '#6cc4c8'

const link = (source, target, opts = {}) => ({
  id: `${source}-${target}`,
  zIndex: 1,
  source,
  target,
  sourceHandle: opts.sourceHandle ?? 'right-s',
  targetHandle: opts.targetHandle ?? 'left-t',
  type: opts.type ?? 'straight',
  style: { stroke: opts.color ?? WIRE, strokeWidth: opts.width ?? 1.6 },
  ...(opts.label
    ? {
        label: opts.label,
        labelShowBg: true,
        // Knock the background out behind the text: these labels sit on top of
        // a vertical line, where a lifted tspan would still cross it.
        labelBgStyle: { fill: '#10253a', stroke: 'none' },
        labelBgPadding: [4, 2],
        labelStyle: {
          fill: opts.color ?? WIRE,
          fontFamily: 'var(--f-mono)',
          fontSize: '10px',
          letterSpacing: '0.06em',
        },
      }
    : {}),
  markerEnd: { type: MarkerType.ArrowClosed, color: opts.color ?? WIRE, width: 11, height: 11 },
  ...(opts.both
    ? { markerStart: { type: MarkerType.ArrowClosed, color: opts.color ?? WIRE, width: 11, height: 11 } }
    : {}),
})

// The cycle that is the program. Warm, no label — it is the thing being cut,
// not a mechanism worth naming.
const cycle = (a, b) => link(a, b, { color: WARM, both: true, width: 1.4 })

const vert = (a, b, opts) =>
  link(a, b, { sourceHandle: 'top-s', targetHandle: 'bottom-t', ...opts })

const EDGES = {
  program: [cycle('logic', 'state')],
  // Two crossings, one per column: the two cuts, stated as the work they cost.
  dsl: [
    vert('leaf', 'flow', { label: 'invoke', both: true }),
    vert('eph', 'durable', { label: 'serialize', both: true }),
  ],
  replay: [
    cycle('logic', 'eph'),
    vert('eph', 'log', { label: 'append' }),
    // Back into the LOGIC, not the state — that is what replay means, and it
    // is why the logic may not change.
    link('log', 'logic', {
      sourceHandle: 'left-s',
      targetHandle: 'top-t',
      type: 'smoothstep',
      label: 'replay',
      color: COOL,
    }),
  ],
  durable: [cycle('logic', 'state')],
}

const NODES = { program: PROGRAM, dsl: DSL, replay: REPLAY, durable: DURABLE }

const nodes = computed(() => NODES[props.variant] ?? PROGRAM)
const edges = computed(() => EDGES[props.variant] ?? [])
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
