const { chromium } = require('playwright-chromium')
// PORT=3141 npm run sweep to check the other workspace's server.
const PORT = process.env.PORT || 3142
// Slidev keeps previous/active/next mounted. querySelector('.slidev-page')
// returns the PREVIOUS slide on every interior page, so pick by hit test.
// .frame is overflow:hidden, so exceeding it means content is CUT OFF — that is
// what we are looking for. Two families are oversized on purpose and clipped by
// design: Vue Flow's pannable canvas, and the decorative bleed glows.
const PROBE = () => {
  const IGNORE = /vue-flow__|bg-glow/
  const cx = innerWidth / 2, cy = innerHeight / 2
  const root = [...document.querySelectorAll('.slidev-page')].find((el) => {
    const r = el.getBoundingClientRect()
    return r.left <= cx && r.right >= cx && r.top <= cy && r.bottom >= cy
  })
  if (!root) return ['NO ACTIVE SLIDE']
  const rb = root.getBoundingClientRect(); const out = []
  root.querySelectorAll('*').forEach((el) => {
    const cls = typeof el.className === 'string' ? el.className : (el.getAttribute('class') || '')
    if (IGNORE.test(cls) || el.closest('.vue-flow')) return
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.opacity === '0') return
    const dx = Math.round(Math.max(rb.left - r.left, r.right - rb.right))
    const dy = Math.round(Math.max(rb.top - r.top, r.bottom - rb.bottom))
    if (dx > 1 || dy > 1) out.push(`${el.tagName}.${cls.slice(0, 40)} dx${dx} dy${dy}`)
  })
  return out.slice(0, 4)
}
;(async () => {
  const b = await chromium.launch()
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } })
  let issues = 0
  for (let p = 1; p <= 19; p++) {
    await pg.goto(`http://localhost:${PORT}/${p}`, { waitUntil: 'networkidle' })
    await pg.waitForTimeout(1200)
    let steps = 0
    for (;;) {
      const bad = await pg.evaluate(PROBE)
      if (bad.length) { issues++; console.log(`page ${p} clicks ${steps}:`, bad.join(' | ')) }
      await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(420)
      if (await pg.evaluate(() => location.pathname) !== `/${p}`) break
      if (++steps > 12) break
    }
  }
  console.log(issues ? `${issues} overflow states` : 'sweep clean (active slide, decorative bleeds excluded)')
  await b.close()
})()
