<script setup>
import { ref, onMounted } from 'vue'

const EXAMPLES = {
  inner_join: `users = [
    (id=1, name="alice"),
    (id=2, name="bob"),
    (id=3, name="carol"),
]

orders = [
    (user_id=1, amount=50),
    (user_id=2, amount=75),
    (user_id=1, amount=100),
    (user_id=99, amount=999),
]

[
    (customer=u.name, total=o.amount)
    for u in users
    for o in orders
    if u.id == o.user_id
]
`,
  filter_and_aggregate: `users = [
    (name="alice", age=30, score=85),
    (name="bob",   age=17, score=92),
    (name="carol", age=25, score=78),
    (name="dave",  age=45, score=90),
]
sum([u.score for u in users if u.age >= 18])
`,
  for_accumulator: `acc := 0
for i in [1, 2, 3, 4, 5]:
    acc := acc + i
acc
`,
}

const example = ref('inner_join')
const code = ref(EXAMPLES.inner_join)
const output = ref('')
const error = ref('')
const status = ref('loading compiler…')
const statusOk = ref(null)
const ready = ref(false)

let compile_and_run = null

function pickExample() {
  code.value = EXAMPLES[example.value]
  run()
}

async function run() {
  if (!ready.value) return
  status.value = 'running…'
  statusOk.value = null
  error.value = ''
  await new Promise((r) => setTimeout(r, 0))
  const t0 = performance.now()
  try {
    const result = compile_and_run(code.value)
    const ms = (performance.now() - t0).toFixed(1)
    if (result.error) {
      output.value = ''
      error.value = result.error
      status.value = `error (${ms}ms)`
      statusOk.value = false
    } else {
      output.value = result.output || '(no output)'
      error.value = ''
      status.value = `ok (${ms}ms)`
      statusOk.value = true
    }
  } catch (e) {
    error.value = String(e)
    status.value = 'panic (see browser console)'
    statusOk.value = false
  }
}

onMounted(async () => {
  try {
    // A literal import() of a /public path is a Vite dev-server error
    // ("Cannot import non-asset file ... inside /public") even with
    // @vite-ignore, since Vite's import-analysis plugin still sees the
    // string. Building the call via `new Function` keeps it out of
    // Vite's static analysis entirely, so the browser just does a plain
    // runtime ESM import against the served URL.
    const dynImport = new Function('url', 'return import(url)')
    const mod = await dynImport('/wasm/cambra.js')
    await mod.default()
    mod.init_panic_hook()
    compile_and_run = mod.compile_and_run
    ready.value = true
    status.value = 'ready'
    run()
  } catch (e) {
    status.value = 'failed to load compiler'
    statusOk.value = false
    error.value = String(e)
  }
})
</script>

<template>
  <div class="wasm-demo">
    <div class="bar">
      <select v-model="example" @change="pickExample">
        <option value="inner_join">inner_join</option>
        <option value="filter_and_aggregate">filter_and_aggregate</option>
        <option value="for_accumulator">for_accumulator</option>
      </select>
      <button :disabled="!ready" @click="run">Run</button>
      <span
        class="status"
        :class="{ ok: statusOk === true, err: statusOk === false }"
        >{{ status }}</span
      >
    </div>
    <textarea
      v-model="code"
      spellcheck="false"
      class="editor"
      @keydown.tab.prevent="
        (e) => {
          const s = e.target.selectionStart
          code = code.slice(0, s) + '    ' + code.slice(e.target.selectionEnd)
        }
      "
    ></textarea>
    <pre v-if="error" class="out err">{{ error }}</pre>
    <pre v-else class="out">{{ output }}</pre>
    <div class="tag">Actual Cambra compiler, compiled to WASM — running in this browser.</div>
  </div>
</template>

<style scoped>
.wasm-demo {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--code-bg);
  border: 1px solid var(--line-2);
  border-radius: 10px;
  padding: 0.8rem;
}
.bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
select,
button {
  font-family: var(--f-mono);
  font-size: 0.72rem;
  background: var(--bg-2);
  color: var(--fg-2);
  border: 1px solid var(--line-2);
  border-radius: 6px;
  padding: 0.35rem 0.6rem;
}
button {
  color: var(--fg);
  cursor: pointer;
}
button:hover:not(:disabled) {
  border-color: var(--warm);
  color: var(--warm);
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
.status {
  font-family: var(--f-mono);
  font-size: 0.68rem;
  color: var(--fg-3);
  margin-left: auto;
}
.status.ok {
  color: var(--lagoon);
}
.status.err {
  color: var(--hot);
}
.editor {
  width: 100%;
  height: 9.5rem;
  resize: vertical;
  background: rgba(0, 0, 0, 0.25);
  color: var(--fg);
  border: 1px solid var(--line);
  border-radius: 6px;
  font-family: var(--f-mono);
  font-size: 0.72rem;
  line-height: 1.5;
  padding: 0.6rem 0.7rem;
  box-sizing: border-box;
}
.out {
  margin: 0;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--line);
  border-radius: 6px;
  font-family: var(--f-mono);
  font-size: 0.72rem;
  line-height: 1.4;
  color: var(--fg-2);
  padding: 0.6rem 0.7rem;
  min-height: 2.4rem;
  max-height: 5rem;
  overflow: auto;
  white-space: pre-wrap;
}
.out.err {
  color: var(--hot);
}
.tag {
  font-family: var(--f-mono);
  font-size: 0.62rem;
  color: var(--fg-3);
  font-style: italic;
}
</style>
