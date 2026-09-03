<script setup>
defineProps({
  photo: { type: String, default: null },
  initials: { type: String, default: '' },
  name: { type: String, required: true },
  role: { type: String, required: true },
  // Where they come from. Each entry is either a simple-icons class
  // (`i-simple-icons-snowflake`) or, where no mark exists, plain text.
  companies: { type: Array, default: () => [] },
  // Supporting cast: same layout, 30% smaller, so the founders lead.
  small: { type: Boolean, default: false },
})
</script>

<template>
  <div class="team-card" :class="{ small }">
      <div class="team-pic">
        <img v-if="photo" class="photo" :src="photo" :alt="name" />
        <div v-else class="initials">{{ initials }}</div>
        <div class="name">{{ name }}</div>
        <div class="role">{{ role }}</div>
      </div>
      <div class="past">
        <slot></slot>
        <div v-if="companies.length" class="crest">
          <template v-for="c in companies" :key="c">
            <div v-if="c.startsWith('i-')" class="crest-mark" :class="c" />
            <span v-else class="crest-text">{{ c }}</span>
          </template>
        </div>
      </div>
  </div>
</template>

<style scoped>
/* 30% down on every dimension that carries visual weight. */
.team-card.small .photo,
.team-card.small .initials {
  width: 3.1rem;
  height: 3.1rem;
  font-size: 0.77rem;
}
.team-card.small .team-pic {
  width: 5rem;
}
.team-card.small .name {
  font-size: 0.6rem;
}
.team-card.small .role {
  font-size: 0.5rem;
}
.team-card.small .past {
  font-size: 0.72rem;
  padding-left: 0.6rem;
}
.team-card.small .crest-mark {
  font-size: 0.74rem;
}
.team-card.small .crest-text {
  font-size: 0.5rem;
}
/* The supporting row has room to spare, so centre each card in its column
   instead of letting it hang off the left edge. */
.team-card.small {
  justify-content: center;
}
.team-card.small .past {
  flex: 0 1 auto;
}
.crest {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.45rem;
}
.crest-mark {
  font-size: 1.05rem;
  color: var(--fg-3);
}
.crest-text {
  font-family: var(--f-mono);
  font-size: 0.72rem;
  line-height: 1;
  letter-spacing: 0.04em;
  color: var(--fg-3);
}
.team-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  text-align: center;
}
.team-pic {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  text-align: center;
  /* Wide enough that the names and roles sit on one line. */
  flex: none;
  width: 7.2rem;
}
.photo {
  width: 4.4rem;
  height: 4.4rem;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--line-2);
}
.initials {
  width: 4.4rem;
  height: 4.4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--f-mono);
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--abyssal);
  background: var(--lagoon);
  border: 2px solid var(--line-2);
}
.name {
  font-family: var(--f-disp);
  font-size: 0.8rem;
  white-space: nowrap;
  font-weight: 600;
  color: var(--fg);
}
.role {
  font-family: var(--f-mono);
  font-size: 0.58rem;
  white-space: nowrap;
  letter-spacing: 0.05em;
  color: var(--fg-3);
}
.past {
  font-size: 0.72rem;
  padding: 0 0 0 0.9rem;
  text-align: left;
  min-width: 0;
}
.past :deep(p) {
  margin: 0;
  line-height: 1.35;
  color: var(--fg-2);
}
</style>
