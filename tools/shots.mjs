// Captures the screenshots used on the portfolio card: node tools/shots.mjs
// Runs its own Vite dev server (random port, never 5193), plays real rounds with real mouse drags
// through the read-only window.__ww bridge, then saves:
//   prototype/shots/{worlds,counting,parent}.jpg  phone shots, 600 wide
//   prototype/shots/web.jpg                      desktop shot, 1440×900 (copy to the portfolio's assets/thumbs/web-wonderworld.jpg)
import fs from 'node:fs'
import path from 'node:path'
import { spawn, execFileSync } from 'node:child_process'
import { chromium } from '@playwright/test'

const ROOT = path.resolve(import.meta.dirname, '..')
const SHOTS = path.join(ROOT, 'prototype', 'shots')
const PIN = '2468' // demo-only PIN for this local profile
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
fs.mkdirSync(SHOTS, { recursive: true })
const tmp = fs.mkdtempSync(path.join(ROOT, '.shots-'))
const port = 5700 + Math.floor(Math.random() * 200)
const server = spawn('npx', ['vite', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' })
const origin = `http://127.0.0.1:${port}`

const ww = (page, fn, arg) => page.evaluate(({ fn, arg }) => window.__ww[fn](arg), { fn, arg })
const waitFor = async (check, ms = 60000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await check()) return; await sleep(250) } throw new Error('timeout') }
const settle = async (page) => {
  await page.waitForFunction(() => window.__ww && 'round' in window.__ww, null, { timeout: 60000 })
  await waitFor(async () => { const r = await ww(page, 'round'); return !r.loading && !r.moving })
  await sleep(400)
}
const drag = async (page, from, to) => {
  await page.mouse.move(from.x, from.y - 8); await page.mouse.down()
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2 - 20, { steps: 6 })
  await page.mouse.move(to.x, to.y, { steps: 6 }); await page.mouse.up(); await sleep(450)
}
const press3D = async (page, id) => { await settle(page); const p = await ww(page, 'screen', id); await page.mouse.click(p.x, p.y) }
const inZone = async (page, zone) => { const r = await ww(page, 'round'); return r.round.items.filter((i) => i.kind !== 'number' && r.placements[i.id] === zone).map((i) => i.id) }
async function move(page, from, to, n) {
  for (let k = 0; k < n; k++) {
    const ids = await inZone(page, from)
    const pts = await Promise.all(ids.map((id) => ww(page, 'screen', id)))
    const front = pts.filter(Boolean).reduce((b, p) => (p.y > b.y ? p : b))
    const before = (await inZone(page, to)).length
    await drag(page, front, await ww(page, 'zone', to))
    await waitFor(async () => (await inZone(page, to)).length === before + 1, 15000)
  }
}
const grab = async (page, file, width = 600) => {
  const png = path.join(tmp, file + '.png')
  await page.screenshot({ path: png })
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '84', '--resampleWidth', String(width), png, '--out', path.join(SHOTS, file + '.jpg')], { stdio: 'pipe' })
}

const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
try {
  for (let i = 0; i < 120; i++) { try { if ((await fetch(origin)).ok) break } catch {} await sleep(250) }
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(() => { speechSynthesis.speak = () => {} })
  const page = await ctx.newPage()

  // A child profile that has finished a few rounds, so worlds, stars and the dashboard are real.
  await page.goto(`${origin}/profiles?new=1`)
  await page.getByPlaceholder('e.g. Star Fox').fill('Meera')
  await page.getByRole('button', { name: 'Let’s go!' }).click()
  await page.waitForURL(/\/worlds/)
  await page.getByRole('button', { name: 'Start' }).click()
  await settle(page)
  for (let r = 0; r < 2; r++) {
    await press3D(page, 'activity:counting')
    await waitFor(async () => (await ww(page, 'round')).round?.type === 'counting'); await settle(page)
    const target = (await ww(page, 'round')).round.target
    await move(page, 'pile', 'tray', target)
    await press3D(page, 'round:check')
    await waitFor(async () => (await ww(page, 'round')).celebration?.stars > 0)
    await sleep(2500)
    await page.goto(`${origin}/worlds`); await page.getByRole('button', { name: 'Start' }).click(); await settle(page)
  }

  // Desktop: a counting round half done, objects in the tray.
  await press3D(page, 'activity:counting')
  await waitFor(async () => (await ww(page, 'round')).round?.type === 'counting'); await settle(page)
  const target = (await ww(page, 'round')).round.target
  await move(page, 'pile', 'tray', Math.max(1, Math.floor(target / 2)))
  await sleep(800)
  await grab(page, 'web', 1440)

  // Phone shots.
  await page.setViewportSize({ width: 390, height: 844 })
  await sleep(1500); await settle(page)
  await grab(page, 'counting')
  await page.goto(`${origin}/worlds`); await sleep(1500)
  await grab(page, 'worlds')
  await page.goto(`${origin}/parent`)
  const q = await page.getByTestId('gate-question').innerText()
  const [x, y] = q.split('×').map((n) => Number(n.trim()))
  await page.getByLabel('Answer').fill(String(x * y))
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByLabel('PIN', { exact: true }).fill(PIN)
  await page.getByLabel('Repeat PIN').fill(PIN)
  await page.getByRole('button', { name: 'Save PIN' }).click()
  await page.getByText('Learning dashboard').waitFor()
  await sleep(800)
  await grab(page, 'parent')
  console.log('captured', fs.readdirSync(SHOTS).join(', '))
} finally {
  await browser.close(); server.kill()
  fs.rmSync(tmp, { recursive: true, force: true })
}
