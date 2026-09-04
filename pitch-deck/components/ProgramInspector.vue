<script setup lang="ts">
/**
 * The program inspector, embedded.
 *
 * The bundle is one file with no external references, so it goes in as
 * `srcdoc` rather than as a URL. A `srcdoc` frame inherits the embedder's
 * origin, which is what lets this page reach into it to install
 * `window.__CAMBRA__` before its script runs — and it still gets its own
 * document, so the inspector's CodeMirror and the deck's key handling never
 * meet.
 *
 * Nothing is fetched: the snapshot and the frames come from the WebAssembly
 * host in the Worker, which has no origin to serve them from.
 */
import { onBeforeUnmount, ref, watch } from "vue";

const props = defineProps<{
  /** The `/api/snapshot` payload, once the program has compiled. */
  snapshot: string | null;
  /** Pane ids to open hidden. */
  hiddenPanes: readonly string[];
  /** Source positions to open pinned, 1-based. */
  pins: readonly { line: number; col: number }[];
  /** Subscribe to live frames; returns an unsubscribe. */
  frames: (cb: (frame: string) => void) => () => void;
}>();

const frame = ref<HTMLIFrameElement | null>(null);
const bundle = ref<string | null>(null);
const fault = ref<string | null>(null);
let unsubscribe: (() => void) | null = null;

/** Deliver a frame the way `connectLive`'s message handler expects. */
type FrameHandler = (event: { data: unknown }) => void;

/**
 * Install the injected host, then let the bundle run.
 *
 * The bundle is written into the frame only after `__CAMBRA__` is in place: its
 * entry point runs on load and reads the global immediately, so an install that
 * followed the write would race it.
 */
function mount(html: string, snapshot: string): void {
  const el = frame.value;
  if (!el) return;

  const messageHandlers: FrameHandler[] = [];
  unsubscribe?.();
  unsubscribe = props.frames((text) => {
    for (const handler of messageHandlers) handler({ data: text });
  });

  el.srcdoc = "<!doctype html><html><head></head><body></body></html>";
  el.onload = () => {
    const win = el.contentWindow as (Window & { __CAMBRA__?: unknown }) | null;
    const doc = el.contentDocument;
    if (!win || !doc) {
      fault.value = "the inspector frame has no document";
      return;
    }
    win.__CAMBRA__ = {
      snapshot: JSON.parse(snapshot),
      hiddenPanes: [...props.hiddenPanes],
      pins: [...props.pins],
      // The frame source the inspector's `connectLive` accepts: the three
      // events and the one method it uses, no socket behind them.
      openLive: () => ({
        addEventListener(type: string, handler: FrameHandler) {
          if (type === "message") messageHandlers.push(handler);
        },
        close() {
          unsubscribe?.();
          unsubscribe = null;
        },
      }),
    };
    el.onload = null;
    doc.open();
    doc.write(html);
    doc.close();
  };
}

async function load(): Promise<void> {
  try {
    const resp = await fetch(`${import.meta.env.BASE_URL}inspector/index.html`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    bundle.value = await resp.text();
  } catch (e) {
    fault.value = `inspector bundle: ${String(e)}`;
  }
}

void load();

watch(
  () => [bundle.value, props.snapshot] as const,
  ([html, snapshot]) => {
    if (html && snapshot) mount(html, snapshot);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  unsubscribe?.();
  unsubscribe = null;
});
</script>

<template>
  <div class="inspector">
    <div v-if="fault" class="inspector-fault">{{ fault }}</div>
    <div v-else-if="!snapshot" class="inspector-wait">compiling…</div>
    <iframe
      v-show="snapshot && !fault"
      ref="frame"
      class="inspector-frame"
      title="Cambra program inspector"
    />
  </div>
</template>

<style scoped>
.inspector {
  height: 100%;
  border: 1px solid var(--line);
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--code-bg);
  display: flex;
}
.inspector-frame {
  flex: 1 1 auto;
  border: 0;
  width: 100%;
  height: 100%;
  background: var(--code-bg);
}
.inspector-wait,
.inspector-fault {
  margin: auto;
  font-family: var(--f-mono);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: var(--fg-3);
}
.inspector-fault {
  color: var(--hot);
}
</style>
