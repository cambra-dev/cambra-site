import { defineShortcutsSetup } from '@slidev/types'
import { useNav } from '@slidev/client'

/**
 * Shift+arrow jumps between *built* slides rather than collapsed ones.
 *
 * Slidev's own Shift+left/right call prevSlide()/nextSlide() with lastClicks
 * defaulting to false, so they land you on a slide with none of its build
 * revealed — no use when what you want is to look at a finished slide.
 *
 * We keep the base shortcuts' key bindings and swap only their handlers, so
 * the chords stay exactly as Slidev defines them.
 *
 * Written as .js on purpose: pitch-deck/ sits inside the Astro site, and a
 * .ts file here picks up that project's tsconfig, which extends
 * 'astro/tsconfigs/strict' — not installed in this package, so the transform
 * fails and the whole app 500s with a blank page.
 */
export default defineShortcutsSetup((nav, base) => {
  const { currentSlideNo, clicks, clicksTotal, total, go } = useNav()

  // go() clamps clicks to the target slide's own total — but a slide that has
  // never been rendered has no total yet, so asking for its last click lands on
  // click 0 instead and the slide comes up blank. Navigate first, let it mount,
  // then ask again.
  const built = async (no) => {
    await go(no)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    await go(no, 9999)
  }

  const prevBuilt = () => {
    if (currentSlideNo.value > 1) built(currentSlideNo.value - 1)
  }

  // Finish the slide you are on; if it is already finished, move on to the
  // next one, also finished.
  const nextBuilt = () => {
    if (clicks.value < clicksTotal.value) built(currentSlideNo.value)
    else if (currentSlideNo.value < total.value) built(currentSlideNo.value + 1)
  }

  return base.map((shortcut) => {
    if (shortcut.name === 'prev_shift') return { ...shortcut, fn: prevBuilt }
    if (shortcut.name === 'next_shift') return { ...shortcut, fn: nextBuilt }
    return shortcut
  })
})
