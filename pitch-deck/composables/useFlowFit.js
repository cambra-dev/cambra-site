import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useVueFlow } from '@vue-flow/core'

// Each diagram needs its own Vue Flow store, so ids must not collide.
let seq = 0

/**
 * Shared plumbing for the deck's Vue Flow diagrams.
 *
 * Bind `wrap` to an element carrying the global `.flow-unscale` class, and
 * `onPaneReady` to VueFlow's @pane-ready. Three problems it handles:
 *
 * 1. Slidev scales the whole slide with a CSS transform. Vue Flow measures
 *    handle positions with getBoundingClientRect but divides only by its OWN
 *    zoom, so that outer scale leaks in and edges attach offset from their
 *    handles. `.flow-unscale` cancels it so the accumulated page transform is
 *    exactly 1 inside the flow.
 * 2. fitView only runs on init, but the box tracks the window. Without a
 *    refit, resizing after load — plugging in a projector, going fullscreen,
 *    entering presenter mode — leaves a viewport fitted to the old box, and
 *    shrinking spills the diagram past the right edge.
 * 3. A fit is only as good as the box it measures, and Slidev hands us bad
 *    boxes twice. Neighbouring slides are mounted while hidden, so @pane-ready
 *    can fire against a 0x0 element; and slide transitions animate the box, so
 *    a fit taken mid-transition is fitted to a size the diagram never keeps.
 *    Either one leaves a diagram blank or mis-scaled until something else
 *    happens to resize it, which is why it looked intermittent. So: never fit a
 *    zero-size box, wait for the size to stop changing before fitting, and
 *    refit when a hidden slide becomes visible (which need not resize it).
 *
 *    The instance is taken from `useVueFlow(id)` rather than from @pane-ready,
 *    because that event is exactly what goes missing: a VueFlow mounted while
 *    its slide is hidden never initialises, never emits, and so never fits —
 *    and navigating back to that slide shows the un-fitted copy. Holding the
 *    store directly means the fit no longer depends on an event that may not
 *    arrive. Bind `flowId` to <VueFlow :id>.
 */
export function useFlowFit(options = {}) {
  // `alignLeft` takes the diagram's own bounds in flow coordinates. fitView
  // always centres, so after fitting we shift the viewport so that the left
  // edge of those bounds lands at `alignLeft.margin` px from the canvas edge.
  // `bounds` fits an explicit rect instead of the node bounds — needed when a
  // diagram draws outside its boxes (arcs above a row, labels above a cluster),
  // since fitView only measures nodes and would crop them.
  const { alignLeft, bounds, ...fitOptions } = { padding: 0.08, ...options }
  const wrap = ref(null)
  const flowId = `flowfit-${(seq += 1)}`
  const flow = useVueFlow(flowId)
  let pending = 0
  let ro
  let io
  let lastW = 0
  let lastH = 0
  // A box that never settles would otherwise spin rAF forever.
  let tries = 0
  const MAX_TRIES = 90

  // Vue Flow tracks the pane's size in its own store, updated by its own
  // observer. At @pane-ready that store is still zero even though the DOM
  // element already has a size, and fitView/fitBounds against a zero pane is a
  // silent no-op — the diagram keeps the identity transform and looks unscaled
  // or blank. So gate on Vue Flow's measurement, not ours.
  const paneMeasured = () => {
    const v = flow.dimensions?.value
    return !!v && v.width >= 1 && v.height >= 1
  }

  // fitBounds takes a Rect: width/height, not the w/h these diagrams use for
  // their own node boxes. Passing the wrong shape yields a null viewport and a
  // diagram that silently keeps the identity transform, which is a miserable
  // thing to debug from the rendered output.
  if (bounds && (bounds.width == null || bounds.height == null)) {
    throw new Error('useFlowFit: bounds needs {x, y, width, height}, got ' + JSON.stringify(bounds))
  }

  const applyFit = () => {
    if (bounds) flow.fitBounds(bounds, fitOptions)
    else flow.fitView(fitOptions)
    if (alignLeft) {
      const vp = flow.getViewport()
      flow.setViewport({ ...vp, x: (alignLeft.margin ?? 0) - alignLeft.x * vp.zoom })
    }
  }

  // Fit only once the box is real and has stopped moving: two consecutive
  // frames at the same non-zero size.
  const settleThenFit = () => {
    if (!wrap.value) return
    const { width, height } = wrap.value.getBoundingClientRect()
    if (width < 1 || height < 1) return // hidden; the observers will call back
    // Two reasons to look again next frame: our box is still moving (a slide
    // transition animates it, and a fit taken mid-flight is fitted to a size
    // the diagram never keeps), or Vue Flow has not measured the pane yet.
    const moving = width !== lastW || height !== lastH
    if ((moving || !paneMeasured()) && tries < MAX_TRIES) {
      lastW = width
      lastH = height
      tries += 1
      schedule()
      return
    }
    tries = 0
    if (paneMeasured()) applyFit()
  }

  const schedule = () => {
    cancelAnimationFrame(pending)
    pending = requestAnimationFrame(settleThenFit)
  }

  const restart = () => {
    tries = 0
    schedule()
  }

  // Still worth listening to when it does arrive — it is the earliest moment a
  // fit can succeed.
  const onPaneReady = () => restart()

  onMounted(() => {
    if (!wrap.value) return
    ro = new ResizeObserver(restart)
    ro.observe(wrap.value)
    // Becoming visible is not necessarily a resize — a slide revealed at the
    // size it was mounted at fires no ResizeObserver entry at all.
    io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) restart()
      },
      { threshold: 0.01 },
    )
    io.observe(wrap.value)
  })

  onBeforeUnmount(() => {
    cancelAnimationFrame(pending)
    ro?.disconnect()
    io?.disconnect()
  })

  return { wrap, flowId, onPaneReady, fitOptions }
}
