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
  /**
   * Recompile edited source and answer the new snapshot.
   *
   * Supplying it is what makes the pane editable — the inspector leaves the
   * editor read-only when there is nothing behind the chord.
   */
  rebuild?: (source: string, options: { keepState: boolean }) => Promise<unknown>;
  /**
   * The snapshot for the version running *now*, parsed.
   *
   * Not the same thing as `snapshot`, which seeds the frame once and remounts
   * it when it changes — and a remount mid-demo would throw away the editor's
   * text and the pane layout. This is what the bundle calls when a live frame
   * names a generation later than the one it is rendering: an accepted reload
   * mints fresh `NodeId`s for every operator it rebuilt, so the panes have to
   * be re-seeded from the new version's payload or they are naming nodes that
   * no longer exist. Without it the bundle falls back to `fetch("/api/snapshot")`,
   * which on this page is a server that does not exist and a console error in
   * place of a redraw.
   */
  currentSnapshot?: () => unknown;
  /**
   * What the last reload kept, for the strip under the frame. Null until one
   * is accepted, and again after a from-scratch compile, which keeps nothing by
   * construction.
   */
  tally?: { generation: number; kept: number; bound: number } | null;
  /**
   * Whether the last reload was refused.
   *
   * The diagnostic itself is the bundle's to show — it catches the rejection
   * and floats it over the editor, against the source the author is looking at.
   * This is the quieter half: what the strip says about which version is
   * running, which is still the one before the edit.
   */
  rejected?: boolean;
  /**
   * CSS appended to the frame's head once the bundle has been written.
   *
   * The seam between the deck and a bundle it does not build: the frame is
   * same-origin and carries no CSP, so the deck can retheme the inspector's
   * internals without a `cambra` rebuild. See `CartDemo.vue`'s `INSPECTOR_SKIN`
   * for what the deck passes and why each rule is there.
   */
  skin?: string;
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
      // Read through `props` at call time rather than captured: the frame is
      // written once, and the handler has to stay valid for its whole life.
      rebuild: props.rebuild
        ? (text: string, options: { keepState: boolean }) =>
            props.rebuild!(text, options)
        : undefined,
      // Read through `props` at call time, as `rebuild` is, and for the same
      // reason: the frame is written once and this has to answer for whichever
      // version is running when a frame arrives.
      currentSnapshot: props.currentSnapshot ? () => props.currentSnapshot!() : undefined,
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

    // The skin goes in last, and has to: the bundle's own stylesheet is the
    // final element in its `<head>`, so a sheet appended after it wins every
    // tie at equal specificity. Re-applied on every mount, because each mount
    // rewrites the document from `html`.
    if (props.skin) {
      const style = doc.createElement("style");
      style.textContent = props.skin;
      doc.head.appendChild(style);
    }
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
  () => [bundle.value, props.snapshot, props.skin] as const,
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
    <div class="inspector-stage">
      <div v-if="fault" class="inspector-fault">{{ fault }}</div>
      <div v-else-if="!snapshot" class="inspector-wait">compiling…</div>
      <iframe
        v-show="snapshot && !fault"
        ref="frame"
        class="inspector-frame"
        title="Cambra program inspector"
      />
    </div>
    <!-- The reuse tally, and the chords that produce it.
         An operator surviving an edit is invisible by nature: the cart still
         holds what it held, which looks exactly like nothing having happened.
         `11 of 12 operators kept` is the evidence, so it is on the slide rather
         than in a console — one line, in the inspector's own register, under
         the frame it belongs to. Before the first reload it is the legend for
         the two chords instead, which is what the strip is worth when there is
         no tally to show. -->
    <div v-if="rebuild" class="reload-line" :class="{ refused: rejected }">
      <span class="reload-label">Reload</span>
      <template v-if="rejected">
        <span class="reload-detail"
          >refused · generation {{ tally?.generation ?? 0 }} still running</span
        >
      </template>
      <template v-else-if="tally">
        <span class="reload-detail">generation {{ tally.generation }}</span>
        <span class="reload-figure">{{ tally.kept }} of {{ tally.bound }} operators kept</span>
      </template>
      <template v-else>
        <span class="reload-detail">⌘⏎ in place · ⌘⇧⏎ from scratch</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.inspector {
  /* Slidev draws the slide at its 980px design width and scales the whole thing
     to the viewport — about 2x on a laptop, more on a projector — and the
     inspector is blown up with it. Rendering the frame at twice its box and
     scaling it back halves that: the inspector lays out in twice the design
     pixels, so the pane holds twice the content at the same apparent size.

     A scale rather than smaller type. The pane's geometry — node boxes, gutters,
     borders, the padding on every chip — is px set in CSS and in
     `operatorView.ts`, and none of it is font-relative, so shrinking the fonts
     alone would leave 22px node boxes around 5px labels. Scaling moves all of it
     together. It also lands the type back near 1:1 on screen (0.5 x 1.96), which
     is where text is sharpest. */
  --frame-scale: 0.5;
  height: 100%;
  border: 1px solid var(--line);
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--code-bg);
  display: flex;
  flex-direction: column;
}
/* The frame's own box. The scaled iframe is positioned against this rather than
   against `.inspector`, so the strip below takes its height out of the frame
   instead of being overlaid on the values pane's last row — an overlay there
   covers content that is moving, which is the one part of the pane the room is
   watching. */
.inspector-stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
}
.inspector-frame {
  position: absolute;
  top: 0;
  left: 0;
  border: 0;
  width: calc(100% / var(--frame-scale));
  height: calc(100% / var(--frame-scale));
  transform: scale(var(--frame-scale));
  transform-origin: top left;
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

/* The strip. Mono, uppercase label, tabular figures — the same register as the
   app panel's `Prices` / `Order` labels and its status line, so the two halves
   of the slide read as one design. Quiet by default; the tally is the one thing
   on it that takes an accent, because it is the only thing on it that is
   evidence. */
.reload-line {
  flex: none;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.3rem 0.6rem;
  border-top: 1px solid var(--line);
  font-family: var(--f-mono);
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  color: var(--fg-3);
}
.reload-label {
  font-weight: 700;
  font-size: 0.58rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.reload-detail {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* `--lagoon` is 8.6:1 on `--code-bg`, and it is the accent the inspector's own
   badges already use, so the tally lands as part of the frame rather than as a
   deck annotation stuck under it. */
.reload-figure {
  margin-left: auto;
  color: var(--lagoon);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
/* A refusal has to be readable before it is coloured: the message is small, so
   the ink goes to full contrast and `--hot` does its work as a rule beside it —
   the same trade the app panel's fault line makes on sand. */
.reload-line.refused {
  color: var(--fg-2);
}
.reload-line.refused .reload-detail {
  padding-left: 0.4rem;
  border-left: 3px solid var(--hot);
}
</style>
