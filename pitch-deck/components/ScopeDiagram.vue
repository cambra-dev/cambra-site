<script setup>
import { computed, h } from 'vue'
import { VueFlow, MarkerType } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import ArchNode from './ArchNode.vue'
import ClusterNode from './ClusterNode.vue'
import { useFlowFit } from '../composables/useFlowFit'
import { arch, centred, cluster, column, row, spanOf } from '../composables/layout'

const props = defineProps({
  // 'today': programs sealed inside operating systems, each with its own disk,
  // talking to each other as bytes over the network. 'system': one program over
  // a runtime that owns the resources.
  variant: { type: String, default: 'today' },
})

// Both frames share a height and a left edge, so fitView scales them the same
// and they line up when stacked; only the widths differ.
const FRAME_Y = 16
const FRAME_H = 170
const FRAME_X = 8
const TODAY_FRAME = { x: FRAME_X, y: FRAME_Y, w: 466, h: FRAME_H }
const NEED_FRAME = { x: FRAME_X, y: FRAME_Y, w: 380, h: FRAME_H }

// fitView centres; align the frames' left edge with the captions instead.
const { wrap, flowId, onPaneReady, fitOptions } = useFlowFit({
  padding: 0.14,
  alignLeft: { x: FRAME_X, margin: 2 },
})

// Left: a program per OS, each OS owning its own disk. The only path between
// `user` and `cart` runs out of one OS as bytes and into the other.
const TODAY = (() => {
  const OS_PAD = 14
  const PROG_PAD = 16
  const CHIP = { w: 68, h: 22, gap: 8 }
  const PROG = { w: CHIP.w + PROG_PAD * 2, h: 84 }
  // Hardware sits under the OS, spanning its width: two boxes side by side.
  const HW_GAP = 8
  // Clear of the OS box, so the step's horizontal run reads as a line rather
  // than disappearing into the OS border.
  const HW_DROP = 26
  const HW = { w: (PROG.w + OS_PAD * 2 - HW_GAP) / 2, h: 32 }
  const OS = { w: PROG.w + OS_PAD * 2, h: PROG.h + OS_PAD * 2 }
  const NET = { w: 98, h: 38 }
  const GAP = 56

  const osBlock = (prefix, x, titles) => {
    const prog = { x: x + OS_PAD, y: FRAME_Y + OS_PAD, ...PROG }
    const chips = column(
      titles.map((title) => ({ id: `${prefix}-${title}`, data: { title, variant: 'bolt chip' } })),
      {
        x: centred(prog.x, prog.w, CHIP.w),
        y: centred(prog.y, prog.h, spanOf(titles.length, CHIP.h, CHIP.gap)),
        ...CHIP,
      },
    )
    return [
      cluster(`${prefix}-os`, { x, y: FRAME_Y, ...OS }, { label: 'OS', variant: 'cool solid lg' }),
      cluster(`${prefix}-prog`, prog, { label: 'Program', variant: 'warm solid lg' }),
      ...chips,
      // Outside the OS box: the program only reaches these through the OS.
      arch(
        `${prefix}-disk`,
        { x, y: FRAME_Y + OS.h + HW_DROP, ...HW },
        { title: 'Disk', variant: 'store lg' },
      ),
      arch(
        `${prefix}-gpu`,
        { x: x + HW.w + HW_GAP, y: FRAME_Y + OS.h + HW_DROP, ...HW },
        { title: 'GPU', variant: 'lg' },
      ),
    ]
  }

  const netX = TODAY_FRAME.x + OS.w + GAP
  const progY = FRAME_Y + OS_PAD
  return [
    ...osBlock('a', TODAY_FRAME.x, ['user']),
    arch(
      'network',
      { x: netX, y: centred(progY, PROG.h, NET.h), ...NET },
      { title: 'Network', variant: 'lg' },
    ),
    ...osBlock('b', netX + NET.w + GAP, ['product', 'cart']),
  ]
})()

// Right: one program in terms of the application's own concepts, over a runtime
// that owns the machine. Nothing to seal into, no wire to cross.
const SYSTEM = (() => {
  const PROG_PAD = 20
  const CONCEPT = { w: 100, h: 44, gap: 20 }
  const RES = { w: 100, h: 32, gap: 20 }
  const PROG_H = CONCEPT.h + PROG_PAD * 2
  const RUNTIME_H = FRAME_H - PROG_H - 12

  const concepts = ['user', 'product', 'cart']
  const inner = row(
    concepts.map((title) => ({ id: title, data: { title, variant: 'bolt lg' } })),
    {
      x: centred(NEED_FRAME.x, NEED_FRAME.w, spanOf(concepts.length, CONCEPT.w, CONCEPT.gap)),
      y: centred(FRAME_Y, PROG_H, CONCEPT.h),
      ...CONCEPT,
    },
  )
  const runtimeY = FRAME_Y + PROG_H + 12
  const resources = ['memory', 'compute', 'storage']
  const res = row(
    resources.map((title) => ({ id: title, data: { title, variant: 'lg dashed' } })),
    {
      x: centred(NEED_FRAME.x, NEED_FRAME.w, spanOf(resources.length, RES.w, RES.gap)),
      y: centred(runtimeY, RUNTIME_H, RES.h),
      ...RES,
    },
  )
  return [
    cluster('program', { x: NEED_FRAME.x, y: FRAME_Y, w: NEED_FRAME.w, h: PROG_H }, {
      label: 'Program',
      variant: 'warm solid lg',
    }),
    ...inner,
    cluster('runtime', { x: NEED_FRAME.x, y: runtimeY, w: NEED_FRAME.w, h: RUNTIME_H }, {
      label: 'Runtime',
      variant: 'cool solid lg',
    }),
    ...res,
  ]
})()

const WIRE = '#7d97b2'
const WARM = '#f5a337'

// No background chip on the label, so lift it clear of the line it sits on.
const lifted = (text) => () => [h('tspan', { x: 0, dy: '-0.55em' }, text)]

const link = (source, target, opts = {}) => ({
  id: `${source}-${target}`,
  // Above the cluster backdrops (0), below the boxes (2).
  zIndex: 1,
  source,
  target,
  sourceHandle: opts.sourceHandle ?? 'right-s',
  targetHandle: opts.targetHandle ?? 'left-t',
  type: opts.type ?? 'smoothstep',
  style: { stroke: opts.color ?? WIRE, strokeWidth: opts.width ?? 1.6 },
  ...(opts.offset ? { pathOptions: { offset: opts.offset } } : {}),
  ...(opts.label
    ? {
        label: lifted(opts.label),
        labelShowBg: false,
        labelStyle: {
          fill: opts.color ?? WIRE,
          fontFamily: 'var(--f-mono)',
          fontSize: '11px',
          letterSpacing: '0.08em',
        },
      }
    : {}),
  ...(opts.arrow === false
    ? {}
    : {
        markerEnd: { type: MarkerType.ArrowClosed, color: opts.color ?? WIRE, width: 12, height: 12 },
      }),
  ...(opts.both
    ? {
        markerStart: { type: MarkerType.ArrowClosed, color: opts.color ?? WIRE, width: 12, height: 12 },
      }
    : {}),
})

// Bytes on the wire, and bytes onto the platter: everything the program says
// has to be flattened before it leaves the program.
// Half the vertical gap between the program and the hardware row. Any other
// value makes the source's turn and the target's turn overshoot each other and
// the path doubles back — that is the kink.
const HW_OFFSET = 20

const TODAY_EDGES = [
  link('a-prog', 'network', { label: '01001010', both: true }),
  link('network', 'b-prog', { label: '01101001', both: true }),
  link('a-prog', 'a-disk', { sourceHandle: 'bottom-s', targetHandle: 'top-t', both: true, offset: HW_OFFSET }),
  link('a-prog', 'a-gpu', { sourceHandle: 'bottom-s', targetHandle: 'top-t', both: true, offset: HW_OFFSET }),
  link('b-prog', 'b-disk', { sourceHandle: 'bottom-s', targetHandle: 'top-t', both: true, offset: HW_OFFSET }),
  link('b-prog', 'b-gpu', { sourceHandle: 'bottom-s', targetHandle: 'top-t', both: true, offset: HW_OFFSET }),
]
// Relationships, not transport — so no arrowheads and a quieter line.
const SYSTEM_EDGES = [
  link('user', 'product', { arrow: false, color: WARM, width: 1.1 }),
  link('product', 'cart', { arrow: false, color: WARM, width: 1.1 }),
]

const nodes = computed(() => (props.variant === 'today' ? TODAY : SYSTEM))
const edges = computed(() => (props.variant === 'today' ? TODAY_EDGES : SYSTEM_EDGES))
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
/* The deck is a fixed stage, not an interactive canvas. */
:deep(.vue-flow__panel),
:deep(.vue-flow__attribution) {
  display: none;
}
</style>
