<script setup>
import { Handle, Position } from '@vue-flow/core'

// Every side carries both a source and a target handle (overlapping, hidden)
// so an edge can enter or leave any face.
//
// Drop these from a node type and Vue Flow cannot resolve a named
// sourceHandle/targetHandle on it — it silently falls back to the node's
// default position (bottom for a source, top for a target) instead of warning.
// Any node an edge can attach to needs this.
const SIDES = [
  ['top', Position.Top],
  ['right', Position.Right],
  ['bottom', Position.Bottom],
  ['left', Position.Left],
]
</script>

<template>
  <template v-for="[name, pos] in SIDES" :key="name">
    <Handle :id="`${name}-s`" type="source" :position="pos" />
    <Handle :id="`${name}-t`" type="target" :position="pos" />
  </template>
</template>

<style scoped>
/* Handles are wiring, not decoration. */
.vue-flow__handle {
  opacity: 0;
  width: 1px;
  height: 1px;
  min-width: 0;
  min-height: 0;
  border: 0;
}
</style>
