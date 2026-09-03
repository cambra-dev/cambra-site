/**
 * Declarative layout primitives for the deck's Vue Flow diagrams.
 *
 * Vue Flow only renders — it has no layout of its own, so positions have to
 * come from somewhere. These let a diagram state its structure ("a row of
 * boxes", "a boundary around them") and derive the coordinates, instead of
 * restating arithmetic that goes stale the moment a box is added or renamed.
 *
 * Deliberately not a graph layout engine (dagre/elk). These are editorial
 * diagrams: the arrangement carries the argument — the 3-tier column is
 * vertical because that is how people picture it, and the analytics row sits
 * under the async row so the shared vertical centres keep the cross-cluster
 * edges straight. An optimiser would re-derive a different picture every time
 * the content changed, which is the opposite of what a deck wants.
 */

const rect = (n) => ({ x: n.position.x, y: n.position.y, w: n.width, h: n.height })

/** Bounding box of a set of nodes. */
export function boundsOf(nodes) {
  const rs = nodes.map(rect)
  const x = Math.min(...rs.map((r) => r.x))
  const y = Math.min(...rs.map((r) => r.y))
  const right = Math.max(...rs.map((r) => r.x + r.w))
  const bottom = Math.max(...rs.map((r) => r.y + r.h))
  return { x, y, w: right - x, h: bottom - y }
}

function make(type, id, { x, y, w, h }, data) {
  return {
    id,
    type,
    position: { x, y },
    // width/height as well as style so Vue Flow knows the box before the DOM
    // is measured.
    width: w,
    height: h,
    style: { width: `${w}px`, height: `${h}px` },
    data,
    zIndex: type === 'arch' ? 2 : 0,
  }
}

export const arch = (id, box, data) => make('arch', id, box, data)
export const cluster = (id, box, data) => make('cluster', id, box, data)

/**
 * Lay items out left to right from (x, y). `w`/`h` are defaults an item can
 * override with its own `w`/`h`.
 */
export function row(items, { x, y, w, h, gap = 16 }) {
  let cx = x
  return items.map((item) => {
    const iw = item.w ?? w
    const node = make(item.type ?? 'arch', item.id, { x: cx, y, w: iw, h: item.h ?? h }, item.data)
    cx += iw + gap
    return node
  })
}

/** Lay items out top to bottom from (x, y). */
export function column(items, { x, y, w, h, gap = 16 }) {
  let cy = y
  return items.map((item) => {
    const ih = item.h ?? h
    const node = make(item.type ?? 'arch', item.id, { x, y: cy, w: item.w ?? w, h: ih }, item.data)
    cy += ih + gap
    return node
  })
}

/** A cluster sized to contain `children`, with `pad` around them. */
export function around(id, children, { pad = 16, ...data }) {
  const p = typeof pad === 'number' ? { x: pad, y: pad } : pad
  const b = boundsOf(children)
  return cluster(id, { x: b.x - p.x, y: b.y - p.y, w: b.w + p.x * 2, h: b.h + p.y * 2 }, data)
}

/** Total span of `n` items of size `size` separated by `gap`. */
export const spanOf = (n, size, gap) => n * size + (n - 1) * gap

/** Offset that centres a span of `size` inside `[start, start + extent)`. */
export const centred = (start, extent, size) => start + (extent - size) / 2
