<script setup>
import { VueFlow, MarkerType } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import ArchNode from './ArchNode.vue'
import { useFlowFit } from '../composables/useFlowFit'
import { arch } from '../composables/layout'

// Three mature ingredients meeting in one place, laid out as an equilateral
// triangle pointing in at the nautilus with AI at the apex. Deliberately small
// — it sits inside a column on the Why Now slide, not on its own.
const NODE = { w: 66, h: 52 }
const CORE = { w: 56, h: 56 }
const R = 78 // circumradius: distance from the centre to each vertex

const CX = R * Math.cos(Math.PI / 6) + NODE.w / 2
const CY = R + NODE.h / 2
const FRAME = { x: 0, y: 0, width: CX * 2, height: CY + R / 2 + NODE.h / 2 }

const { wrap, flowId, onPaneReady, fitOptions } = useFlowFit({ padding: 0.08, bounds: FRAME })

// Angles measured from the centre: apex up, then the two lower vertices.
const VERTICES = [
  { id: 'ai', angle: -90, data: { icon: 'i-ph-brain-fill', title: 'AI', variant: 'mark stack' } },
  { id: 'db', angle: 150, data: { icon: 'i-ph-database-fill', title: 'Databases', variant: 'mark stack' } },
  { id: 'pl', angle: 30, data: { icon: 'i-ph-function-fill', title: 'Languages', variant: 'mark stack' } },
]

const nodes = [
  ...VERTICES.map((v) => {
    const rad = (v.angle * Math.PI) / 180
    return arch(
      v.id,
      {
        x: CX + R * Math.cos(rad) - NODE.w / 2,
        y: CY + R * Math.sin(rad) - NODE.h / 2,
        ...NODE,
      },
      v.data,
    )
  }),
  arch(
    'cambra',
    { x: CX - CORE.w / 2, y: CY - CORE.h / 2, ...CORE },
    { img: '/brand/symbol.svg', variant: 'mark' },
  ),
]

const WIRE = '#7d97b2'
const edges = [
  { id: 'ai', from: 'bottom-s', to: 'top-t' },
  { id: 'db', from: 'top-s', to: 'left-t' },
  { id: 'pl', from: 'top-s', to: 'right-t' },
].map((e) => ({
  id: `${e.id}-cambra`,
  source: e.id,
  target: 'cambra',
  sourceHandle: e.from,
  targetHandle: e.to,
  // Straight: each line should read as pointing at the centre.
  type: 'straight',
  zIndex: 1,
  style: { stroke: WIRE, strokeWidth: 1.4 },
  markerEnd: { type: MarkerType.ArrowClosed, color: WIRE, width: 11, height: 11 },
}))
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
    </VueFlow>
  </div>
</template>

<style scoped>
.arch-flow {
  width: 100%;
  height: 100%;
}
:deep(.vue-flow__panel),
:deep(.vue-flow__attribution) {
  display: none;
}
</style>
