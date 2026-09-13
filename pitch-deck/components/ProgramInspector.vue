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
  /**
   * The versions the slide can switch between, and which is running.
   *
   * Absent where there is only one program, in which case the control is not
   * rendered rather than rendered inert. `switching` disables both while a
   * swap is in flight: a second press mid-reload would compile against a
   * program the first is part-way through replacing.
   */
  versions?: readonly { id: string; label: string; title: string }[];
  version?: string;
  switching?: boolean;
  /**
   * Whether the source pane marks the spans a selection resolves to.
   *
   * Off for a room: the marks answer "where did this operator come from",
   * which is a question a reader asks and an audience has not been given yet —
   * and they land on the one pane everyone is reading. The toggle is on the
   * strip so it can be turned on mid-demo when someone does ask.
   *
   * Enforced from the skin rather than from the bundle, which has no flag for
   * it: `CartDemo.vue`'s `INSPECTOR_SKIN` carries rules under
   * `.no-provenance`, and this puts that class on the frame's root.
   */
  provenance?: boolean;
}>();

const emit = defineEmits<{
  (e: "switch", id: string): void;
  (e: "toggle-provenance"): void;
}>();

const frame = ref<HTMLIFrameElement | null>(null);

/**
 * Reflect `provenance` onto the frame's root element.
 *
 * A class rather than a stylesheet swap, so the rules ride the skin with every
 * other thing the deck asserts about the bundle and the toggle is one attribute
 * write. Called after each mount too, because a mount rewrites the document.
 */
function applyProvenance(): void {
  frame.value?.contentDocument?.documentElement.classList.toggle(
    "no-provenance",
    props.provenance !== true,
  );
}
const bundle = ref<string | null>(null);
const fault = ref<string | null>(null);
/** Why the last press of a strip control did nothing, if it did nothing. */
const chordFault = ref<string | null>(null);
let unsubscribe: (() => void) | null = null;

/**
 * Press one of the editor's rebuild chords from outside the frame.
 *
 * The strip's two controls are the chords, for a presenter who would rather
 * point at a thing than reach for a modifier. They dispatch the chord into the
 * editor rather than calling `rebuild` with text of their own, because the
 * source that matters is the one in CodeMirror — the presenter's edits, not the
 * file the slide booted — and CodeMirror renders only the lines in view, so
 * there is no honest way to read the document out of the DOM. Going through the
 * binding also means the click and the chord are the same act: the same
 * `keepState`, the same rejection floated over the editor, the same everything.
 *
 * `Mod-` is Cmd on a Mac and Ctrl everywhere else, and the binding calls
 * `preventDefault` — so a dispatch that comes back handled is the modifier this
 * platform uses, and the other matches no binding at all. Trying one and then
 * the other is therefore exactly one rebuild on either, with no sniffing of a
 * platform the bundle already decided for itself.
 *
 * `.cm-content` is the second place the deck reaches into a bundle it does not
 * build, after `CartDemo.vue`'s skin. A rename there costs the two controls and
 * says so in the strip; the chords themselves are untouched, because they are
 * the bundle's own.
 */
function press(keepState: boolean): void {
  const content = frame.value?.contentDocument?.querySelector<HTMLElement>(".cm-content");
  if (!content) {
    chordFault.value = "no editor to rebuild from";
    return;
  }
  const send = (modifier: "metaKey" | "ctrlKey"): boolean =>
    !content.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        shiftKey: !keepState,
        [modifier]: true,
        bubbles: true,
        cancelable: true,
      }),
    );
  chordFault.value = send("metaKey") || send("ctrlKey") ? null : "the editor refused the chord";
}

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
    applyProvenance();
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

// Separately from the mount above: the toggle flips while the frame stands, and
// re-mounting it to change a class would throw away the editor's text.
watch(() => props.provenance, applyProvenance);

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
    <!-- The strip: what a presenter presses, and the evidence it produces.

         Two rows, split by how often a hand reaches for them. The version
         switch is the demo's main gesture and the reuse tally is what it is
         for, so those share the top row and the eye has one place to look.
         The rebuild controls and the provenance toggle are the second row:
         used once each, in answer to a question from the floor.

         An operator surviving an edit is invisible by nature — the cart still
         holds what it held, which looks exactly like nothing having happened —
         so `9 of 16 operators kept` is the evidence, and it belongs on the
         slide rather than in a console. -->
    <div v-if="rebuild" class="reload-strip" :class="{ refused: rejected }">
      <div class="reload-row">
        <div v-if="versions && versions.length" class="version-switch" role="group">
          <button
            v-for="entry in versions"
            :key="entry.id"
            type="button"
            class="version-press"
            :class="{ running: entry.id === version }"
            :aria-pressed="entry.id === version"
            :disabled="!snapshot || switching"
            :title="entry.title"
            @click="emit('switch', entry.id)"
          >
            {{ entry.label }}
          </button>
        </div>
        <span v-if="chordFault" class="reload-detail">{{ chordFault }}</span>
        <span v-else-if="rejected" class="reload-detail"
          >refused · gen {{ tally?.generation ?? 0 }} still running</span
        >
        <template v-else-if="tally">
          <span class="reload-detail">gen {{ tally.generation }}</span>
          <span class="reload-figure">{{ tally.kept }} of {{ tally.bound }} operators kept</span>
        </template>
        <span v-else class="reload-detail">nothing reloaded yet</span>
      </div>
      <div class="reload-row reload-row-quiet">
        <button
          type="button"
          class="reload-press"
          :disabled="!snapshot"
          title="Reload the edited source in place — the new version takes over the state (⌘⏎)"
          @click="press(true)"
        >
          Reload
        </button>
        <span class="reload-sep" aria-hidden="true">·</span>
        <button
          type="button"
          class="reload-press reload-quiet"
          :disabled="!snapshot"
          title="Compile the edited source as a new program — nothing kept, the cart emptied (⌘⇧⏎)"
          @click="press(false)"
        >
          from scratch
        </button>
        <span class="reload-sep" aria-hidden="true">·</span>
        <button
          type="button"
          class="reload-press reload-quiet provenance-press"
          :class="{ on: provenance }"
          :disabled="!snapshot"
          title="Mark the source spans a selection resolves to"
          @click="emit('toggle-provenance')"
        >
          provenance {{ provenance ? "on" : "off" }}
        </button>
      </div>
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
.reload-strip {
  flex: none;
  padding: 0.28rem 0.6rem 0.32rem;
  border-top: 1px solid var(--line);
  font-family: var(--f-mono);
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  color: var(--fg-3);
}
.reload-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
/* The second row is answers-to-questions rather than the demo's spine, so it
   reads as a footnote to the row above and does not compete with the tally. */
.reload-row-quiet {
  margin-top: 0.15rem;
  opacity: 0.75;
}
/* The chords, with a click on them. Typed as the label they replaced — the
   strip reads the same from the back of a room whether or not anyone presses
   one — so the affordance is the cursor, the hover rule and the focus ring
   rather than a button's chrome, which at this size would be a box around two
   words and would pull the eye off the tally. */
.reload-press {
  appearance: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 700;
  font-size: 0.58rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;
  /* The column is narrow and the strip is one row. A control that wrapped would
     take the tally beside it with it, so each stays on its own line and the
     detail is what gives way. */
  white-space: nowrap;
  border-bottom: 1px solid transparent;
}
.reload-press:hover:not(:disabled),
.reload-press:focus-visible {
  color: var(--lagoon);
  border-bottom-color: var(--lagoon);
}
.reload-press:disabled {
  cursor: default;
  opacity: 0.5;
}
/* The destructive half, and the one a presenter reaches for by accident: it
   keeps nothing and empties the cart. Lighter than its neighbour so the eye
   lands on `Reload` first, which is the one the demo repeats. */
.reload-quiet {
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: none;
}
.reload-sep {
  opacity: 0.45;
}
/* Pushed right, so the controls are a group on the left and the status is a
   group on the right rather than one run of small caps the eye cannot divide.
   It is the element that gives way when the column is narrow, because the tally
   beside it is the evidence and `generation 1` is the label on it. */
.reload-detail {
  margin-left: auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* `--lagoon` is 8.6:1 on `--code-bg`, and it is the accent the inspector's own
   badges already use, so the tally lands as part of the frame rather than as a
   deck annotation stuck under it. */
.reload-figure {
  margin-left: 0.5rem;
  color: var(--lagoon);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
/* A refusal has to be readable before it is coloured: the message is small, so
   the ink goes to full contrast and `--hot` does its work as a rule beside it —
   the same trade the app panel's fault line makes on sand. */
.reload-strip.refused {
  color: var(--fg-2);
}
.reload-strip.refused .reload-detail {
  padding-left: 0.4rem;
  border-left: 3px solid var(--hot);
}
/* The version switch: which program is running, and the one gesture that
   changes it. Typed larger than the rest of the strip because it is the
   control a presenter finds without looking. */
.version-switch {
  display: flex;
  gap: 0.25rem;
}
.version-press {
  appearance: none;
  margin: 0;
  padding: 0.05rem 0.4rem;
  border: 1px solid var(--line);
  border-radius: 3px;
  background: none;
  color: inherit;
  font: inherit;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
}
.version-press:hover:not(:disabled),
.version-press:focus-visible {
  border-color: var(--lagoon);
  color: var(--lagoon);
}
/* The running one is filled rather than merely outlined: at slide scale a
   border-colour difference is not a state anyone reads from the third row. */
.version-press.running {
  background: var(--lagoon);
  border-color: var(--lagoon);
  color: var(--code-bg);
  cursor: default;
}
.version-press:disabled {
  cursor: default;
  opacity: 0.5;
}
/* On is the exception, so it is the state that carries the accent. */
.provenance-press.on {
  color: var(--lagoon);
}
</style>
