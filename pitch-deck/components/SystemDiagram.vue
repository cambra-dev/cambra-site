<script setup>
import { computed } from 'vue'
import { useNav } from '@slidev/client'
import { VueFlow, MarkerType } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import ArchNode from './ArchNode.vue'
import ClusterNode from './ClusterNode.vue'
import { useFlowFit } from '../composables/useFlowFit'
import { arch, around, centred, cluster, row } from '../composables/layout'

const props = defineProps({
  // Driven by Slidev's $clicks: 1 = three-tier, 2 = async, 3 = analytics,
  // 4 = telemetry. Anything above 4 keeps the full system on screen.
  stage: { type: Number, default: 4 },
})

// Slidev reveals every v-click element when exporting, but these diagrams take
// their build stage as a prop, so an export rendered them at click 0 — this one
// with nothing lit at all. Match Slidev's own print behaviour and show the
// finished diagram.
const { isPrintMode } = useNav()
const MAX_STAGE = 4
const activeStage = computed(() => (isPrintMode.value ? MAX_STAGE : props.stage))

const COOL = '#6CC4C8'
const WARM = '#F5A337'
const CORAL = '#F18B40'

// Stage at which a node joins the picture (see `shown` below).
const at = (stage, nodes) => nodes.map((n) => ({ ...n, at: stage }))

const ROW_H = 46
// The 3-tier app, and the column band the async and analytics clusters share —
// declaring one band is what keeps their right edges aligned.
const APP = { x: 28, pad: { x: 17, y: 16 } }
const BAND = { x: 250, w: 456, padX: 16, padTop: 18, h: 84 }
// Rows the app column aligns to, so every cross-cluster edge is a straight
// horizontal: Web Server with the async row, Database with the analytics row.
const ASYNC_Y = 96
const ANALYTICS_Y = 190

const bandRow = (items, y) => row(items, { x: BAND.x + BAND.padX, y, h: ROW_H, gap: 20 })
const bandCluster = (id, y, data) =>
  cluster(id, { x: BAND.x, y: y - BAND.padTop, w: BAND.w, h: BAND.h }, data)

const app = at(1, [
  arch('fe', { x: APP.x + APP.pad.x, y: 20, w: 140, h: ROW_H }, { title: 'Frontend', sub: 'React, etc.' }),
  arch('ws', { x: APP.x + APP.pad.x, y: ASYNC_Y, w: 140, h: ROW_H }, { title: 'Web Server', sub: 'Express, Django, etc.' }),
  arch('db', { x: APP.x + APP.pad.x, y: ANALYTICS_Y, w: 140, h: ROW_H }, { title: 'Database', sub: 'Postgres, MySQL', variant: 'store' }),
])

const asyncRow = at(2, bandRow([
  { id: 'q', w: 120, data: { title: 'Queue', sub: 'Kafka, SQS', variant: 'bolt' } },
  { id: 'wp', w: 120, data: { title: 'Worker Pool', sub: 'K8s, Lambda', variant: 'bolt' } },
  { id: 'js', w: 140, data: { title: 'Job State', sub: 'Postgress, Cassandra', variant: 'bolt store' } },
], ASYNC_Y))

const analyticsRow = at(3, bandRow([
  { id: 'etl', w: 120, data: { title: 'ETL', sub: 'Fivetran, DBT, etc.', variant: 'bolt' } },
  { id: 'dl', w: 140, data: { title: 'Lakehouse', sub: 'Snowflake, Databricks, etc.', variant: 'bolt store' } },
  { id: 'bi', w: 124, data: { title: 'BI', sub: 'Looker, Tableau', variant: 'bolt' } },
], ANALYTICS_Y))

// Telemetry instruments everything, so it is centred under the whole diagram.
const DIAGRAM = { x: APP.x, w: BAND.x + BAND.w - APP.x }
const TEL_W = 200

const ALL_NODES = [
  ...at(1, [around('c-app', app, { pad: APP.pad, label: '3-tier app', variant: 'cool' })]),
  ...app,
  ...at(2, [bandCluster('c-async', ASYNC_Y, { label: 'Background tasks', variant: 'warm' })]),
  ...asyncRow,
  ...at(3, [bandCluster('c-analytics', ANALYTICS_Y, { label: 'Analytics', variant: 'warm' })]),
  ...analyticsRow,
  ...at(4, [
    arch(
      'tel',
      { x: centred(DIAGRAM.x, DIAGRAM.w, TEL_W), y: 290, w: TEL_W, h: 44 },
      { title: 'Telemetry', sub: 'Datadog, Grafana', variant: 'tele' },
    ),
  ]),
]

const edge = (id, source, sourceHandle, target, targetHandle, opts = {}) => ({
  id,
  // Above the cluster backdrops (0), below the boxes (2).
  zIndex: 1,
  source,
  target,
  sourceHandle,
  targetHandle,
  type: 'smoothstep',
  animated: opts.animated ?? false,
  style: { stroke: opts.color ?? COOL, strokeWidth: 1.6, strokeDasharray: opts.dash },
  markerEnd: { type: MarkerType.ArrowClosed, color: opts.color ?? COOL, width: 16, height: 16 },
  ...(opts.offset ? { pathOptions: { offset: opts.offset } } : {}),
  ...(opts.both
    ? { markerStart: { type: MarkerType.ArrowClosed, color: opts.color ?? COOL, width: 16, height: 16 } }
    : {}),
  at: opts.at,
})

const ALL_EDGES = [
  edge('e-fe-ws', 'fe', 'bottom-s', 'ws', 'top-t', { at: 1, both: true }),
  edge('e-ws-db', 'ws', 'bottom-s', 'db', 'top-t', { at: 1, both: true }),

  // Bidirectional: the server enqueues, the workers report back.
  edge('e-ws-q', 'ws', 'right-s', 'q', 'left-t', { at: 2, color: WARM, both: true }),
  edge('e-q-wp', 'q', 'right-s', 'wp', 'left-t', { at: 2, color: WARM, both: true }),
  edge('e-ws-wp', 'ws', 'bottom-s', 'wp', 'bottom-t', { at: 2, color: WARM, both: true, offset: 13 }),
  // The async tier ends up owning its own datastore — more fragmentation.
  edge('e-wp-js', 'wp', 'right-s', 'js', 'left-t', { at: 2, color: WARM, both: true }),

  edge('e-db-etl', 'db', 'right-s', 'etl', 'left-t', { at: 3, color: WARM, dash: '5 4' }),
  edge('e-etl-dl', 'etl', 'right-s', 'dl', 'left-t', { at: 3, color: WARM }),
  edge('e-dl-bi', 'dl', 'right-s', 'bi', 'left-t', { at: 3, color: WARM }),

  // One feed per cluster, each entering a different face of the telemetry box
  // so the three dashed runs stay apart. Async has to go around the right —
  // analytics sits directly beneath it. The offsets keep those detours clear
  // of the cluster borders they run alongside.
  edge('e-app-tel', 'c-app', 'bottom-s', 'tel', 'left-t', { at: 4, color: CORAL, dash: '3 4'}),
  edge('e-async-tel', 'c-async', 'right-s', 'tel', 'right-t', { at: 4, color: CORAL, dash: '3 4' }),
  edge('e-ana-tel', 'c-analytics', 'bottom-s', 'tel', 'top-t', { at: 4, color: CORAL, dash: '3 4', offset: 17 }),
]

const { wrap, flowId, onPaneReady, fitOptions } = useFlowFit({ padding: 0.1 })

const shown = (at) => (at <= activeStage.value ? 1 : 0)

// Every node and edge stays mounted so the viewport is computed once from the
// full diagram and never shifts; each stage only fades its members in. That
// also avoids fitView racing newly-added nodes before they are measured.
const nodes = computed(() =>
  ALL_NODES.map((n) => ({
    ...n,
    style: { ...n.style, opacity: shown(n.at) },
  })),
)
const edges = computed(() =>
  ALL_EDGES.map((e) => ({
    ...e,
    style: { ...e.style, opacity: shown(e.at) },
    animated: e.animated && shown(e.at) === 1,
  })),
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
      @pane-ready="onPaneReady"
      class="arch-flow"
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
:deep(.vue-flow__edge-path) {
  transition: opacity 0.45s ease;
}
/* The deck is a fixed stage, not an interactive canvas. */
:deep(.vue-flow__panel),
:deep(.vue-flow__attribution) {
  display: none;
}
</style>
