<script setup>
import NodeHandles from './NodeHandles.vue'

defineProps({
  data: { type: Object, required: true },
})
</script>

<template>
  <div class="arch-node" :class="data.variant">
    <NodeHandles />
    <div v-if="data.icon" class="an-icon" :class="data.icon" />
    <img v-if="data.img" class="an-img" :src="data.img" alt="" />
    <div v-if="data.title" class="an-title">{{ data.title }}</div>
    <div v-if="data.sub" class="an-sub">{{ data.sub }}</div>
  </div>
</template>

<style scoped>
.arch-node {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  background: var(--bg-2);
  border: 2px solid var(--cool);
  border-radius: 8px;
  padding: 0.4rem 0.55rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
  text-align: center;
}
.arch-node.bolt {
  border-color: var(--warm);
}
.arch-node.tele {
  border-color: var(--coral);
}
.arch-node.chip {
  padding: 0.1rem 0.25rem;
  border-width: 1.5px;
  border-radius: 5px;
  gap: 0;
}
.arch-node.chip .an-title {
  font-size: 0.76rem;
  font-weight: 600;
}
/* An annotation, not a box in the diagram. */
.arch-node.note {
  background: none;
  border: 0;
  padding: 0;
  align-items: flex-start;
  text-align: left;
}
.arch-node.note .an-title {
  font-family: var(--f-disp);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--warm);
  white-space: nowrap;
}
/* Just the mark — who is producing the feedback this edge carries. */
.arch-node.mark {
  background: none;
  border: 0;
  padding: 0;
}
.arch-node.stack {
  gap: 0.15rem;
}
.arch-node.stack .an-title {
  font-family: var(--f-mono);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--fg-3);
}
.an-icon {
  font-size: 1.9rem;
  color: var(--fg-3);
}
.an-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* An invisible handle to hang an annotation off. */
.arch-node.ghost {
  background: none;
  border: 0;
  padding: 0;
}
/* Bigger type for diagrams that carry the slide on their own. */
.arch-node.lg .an-title {
  font-size: 1rem;
}
.arch-node.dashed {
  border-style: dashed;
}
.arch-node.store {
  border-radius: 8px / 22px;
}
.an-title {
  font-family: var(--f-disp);
  font-weight: 700;
  font-size: 0.78rem;
  line-height: 1.15;
  color: var(--fg);
}
.an-sub {
  font-family: var(--f-mono);
  font-size: 0.55rem;
  line-height: 1.2;
  color: var(--fg-3);
}
</style>
