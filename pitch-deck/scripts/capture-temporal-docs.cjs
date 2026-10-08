// Re-captures the Temporal documentation screenshots used by the Problem
// slides into public/temporal/. Real pages, not mockups — run from this
// directory: `node scripts/capture-temporal-docs.cjs`

const { chromium } = require('playwright-chromium')
const PAGES = [
  ['workflows',      'https://docs.temporal.io/workflows'],
  ['activities',     'https://docs.temporal.io/activities'],
  ['workers',        'https://docs.temporal.io/workers'],
  ['determinism',    'https://docs.temporal.io/workflow-definition'],
  ['versioning',     'https://docs.temporal.io/develop/python/versioning'],
  ['safe-deploys',   'https://docs.temporal.io/develop/safe-deployments'],
  ['limits',         'https://docs.temporal.io/workflow-execution/limits'],
  ['worker-versioning', 'https://docs.temporal.io/production-deployment/worker-deployments/worker-versioning'],
  ['message-passing', 'https://docs.temporal.io/sending-messages'],
  ['task-queues',    'https://docs.temporal.io/task-queue'],
]
;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1320, height: 900 }, deviceScaleFactor: 3 })
  for (const [name, url] of PAGES) {
    const page = await ctx.newPage()
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 })
      if (!resp || !resp.ok()) { console.log(`SKIP ${name}: HTTP ${resp && resp.status()}`); await page.close(); continue }
      await page.waitForTimeout(2200)
      // Dismiss a cookie banner if one is in the way of the content.
      for (const sel of ['button:has-text("Accept")', 'button:has-text("Got it")', '#onetrust-accept-btn-handler']) {
        const b = page.locator(sel).first()
        if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); break }
      }
      await page.waitForTimeout(400)
      await page.screenshot({
        path: `public/temporal/${name}.png`,
        clip: { x: 0, y: 0, width: 840, height: 620 },
      })
      console.log(`OK   ${name}  ${await page.title()}`)
    } catch (e) {
      console.log(`FAIL ${name}: ${e.message.split('\n')[0]}`)
    }
    await page.close()
  }
  await browser.close()
})()
