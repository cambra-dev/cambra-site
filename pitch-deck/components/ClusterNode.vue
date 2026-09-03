<script setup>
import NodeHandles from './NodeHandles.vue'

defineProps({
  data: { type: Object, required: true },
})
</script>

<template>
  <div class="cluster" :class="data.variant">
    <NodeHandles />
    <span v-if="data.label" class="cluster-label">{{ data.label }}</span>
  </div>
</template>

<style scoped>
.cluster {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border: 1px dashed var(--line-2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  position: relative;
}
.cluster.cool {
  border-color:var(--lagoon);
  background: var(--bg-2);
}
.cluster.warm {
  border-color: rgba(245, 163, 55, 0.4);
  background: rgba(245, 163, 55, 0.06);
}
/* For the boundary that is the point of the picture, not just a grouping. */
.cluster.solid {
  border-style: solid;
  border-width: 2px;
}
.cluster-label {
  position: absolute;
  top: -0.62rem;
  left: 0.55rem;
  padding: 0 0.3rem;
  background: var(--abyssal);
  font-family: var(--f-mono);
  font-size: 0.5rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--fg-3);
  white-space: nowrap;
}
.cluster.lg .cluster-label {
  font-size: 0.66rem;
  top: -0.78rem;
}
.cluster.cool .cluster-label {
    color:var(--lagoon);
}
.cluster.warm .cluster-label {
  color: var(--warm);
}
</style>
