// Records the demo GIFs in README.md from the real, running site.
//   npm run build && npx astro preview --port 4399 &   (then)   node scripts/readme/record.mjs
// The write-studio demo mocks api.github.com, so no real pull request is opened.
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:4399/Project-Lazarus/';
const ONLY = process.env.ONLY; // 'ising' or 'studio' to record just one
const OUT = 'docs/media';
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Grab frames in the background while a scenario runs. */
function recorder(shoot, gap = 25) {
  const frames = [];
  let run = true, paused = false;
  const t0 = Date.now();
  const loop = (async () => {
    while (run) {
      const t = Date.now() - t0;
      if (!paused) { try { frames.push({ t, buf: await shoot() }); } catch {} }
      await sleep(gap);
    }
  })();
  return {
    /** Run a scroll (or anything that repaints the whole page) without recording its half-painted frames. */
    async quiet(fn, settle = 260) { paused = true; await sleep(60); await fn(); await sleep(settle); paused = false; },
    async stop() { run = false; await loop; return frames; },
  };
}

/** Frames -> animated GIF. Identical neighbours are merged so still moments cost nothing. */
async function toGif(frames, file, { width, colours = 96, minDelay = 40, hold = 1800 }) {
  const raws = [];
  let h = 0;
  for (const f of frames) {
    const { data, info } = await sharp(f.buf).resize({ width }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    h = info.height;
    raws.push(data);
  }
  const keep = [], delays = [];
  raws.forEach((raw, i) => {
    const d = i < frames.length - 1 ? Math.max(minDelay, frames[i + 1].t - frames[i].t) : hold;
    if (keep.length && keep[keep.length - 1].equals(raw)) delays[delays.length - 1] += d;
    else { keep.push(raw); delays.push(d); }
  });
  const info = await sharp(Buffer.concat(keep), { raw: { width, height: h * keep.length, channels: 3, pageHeight: h } })
    .gif({ delay: delays, loop: 0, colours, effort: 8, dither: 0.6 }).toFile(file);
  console.log(file.padEnd(24), `${keep.length} frames (from ${frames.length}), ${Math.round(info.size / 1024)} KB, ${(delays.reduce((a, b) => a + b, 0) / 1000).toFixed(1)}s`);
}

const browser = await chromium.launch();

// ------------------------------------------------------------ 1. the simulation
if (!ONLY || ONLY === 'ising') {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 1, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.goto(`${BASE}lab/?ising.seed=5&ising.T=1.2`);
  await page.waitForLoadState('networkidle');
  await page.addStyleTag({ content: '#theme-toggle{display:none!important}' });
  const box = page.locator('[data-explorable]').last();
  await box.scrollIntoViewIfNeeded();
  const setT = (t) => page.evaluate((t) => {
    const s = document.querySelector('[data-ising] [data-temp]');
    s.value = String(t); s.dispatchEvent(new Event('input', { bubbles: true }));
  }, t);
  await page.locator('[data-ising] [data-reset]').click(); // fresh random lattice at T = 1.2
  const rec = recorder(() => box.screenshot());
  const ramp = async (from, to, ms) => {
    const t0 = Date.now();
    for (;;) {
      const k = Math.min(1, (Date.now() - t0) / ms);
      await setT((from + (to - from) * k).toFixed(2));
      if (k >= 1) break;
      await sleep(30);
    }
  };
  await sleep(1800);            // domains coarsen below T_c
  await ramp(1.2, 3.6, 3200);   // heat it up: order melts
  await sleep(900);
  await ramp(3.6, 2.27, 2200);  // cool to the critical point
  await sleep(1600);
  await toGif(await rec.stop(), `${OUT}/ising.gif`, { width: 640, colours: 48 });
  await ctx.close();
}

// ------------------------------------------------------------ 2. the write studio
if (!ONLY || ONLY === 'studio') {
  // reducedMotion turns off the site's smooth scrolling, which otherwise leaves half-painted frames in screenshots.
  const ctx = await browser.newContext({ viewport: { width: 820, height: 620 }, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.route('https://api.github.com/**', (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^\/repos\/[^/]+\/[^/]+/, '');
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    const json = (s, d) => route.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(d), headers: cors });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (path.startsWith('/git/ref/')) return json(200, { object: { sha: 'a' } });
    if (path.startsWith('/git/commits/')) return json(200, { tree: { sha: 't' } });
    if (path === '/git/blobs') return json(201, { sha: 'b' });
    if (path === '/git/trees') return json(201, { sha: 't' });
    if (path === '/git/commits') return json(201, { sha: 'c' });
    if (path === '/git/refs') return json(201, {});
    if (path === '/pulls') return json(201, { html_url: 'https://github.com/ABHICODZ/Project-Lazarus/pull/123' });
    return json(500, {});
  });
  await page.goto(`${BASE}write/`);
  await page.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('lazarus-write'); localStorage.setItem('theme', 'dark'); });
  await page.reload();
  // The fixed blend-mode background texture repaints badly in scripted screenshots; it is only decoration.
  await page.addStyleTag({ content: '#theme-toggle,body>div[aria-hidden="true"]{display:none!important}' });

  // A picture that looks like what the essay is about: a coarsened lattice of spins.
  const N = 90, cell = 20, px = Buffer.alloc(N * (N / 2) * 3);
  const W = N, H = N / 2;
  let s = 3;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const field = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => (Math.sin(x / 9) + Math.cos(y / 5) + (r() - 0.5) * 0.9 > 0 ? 1 : 0)));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 3, c = field[y][x] ? [224, 109, 92] : [74, 74, 74]; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; }
  const lattice = await sharp(px, { raw: { width: W, height: H, channels: 3 } }).resize(W * cell, H * cell, { kernel: 'nearest' }).png().toBuffer();

  // Virtual camera: screenshot the whole page and crop a moving window, so there is no real scrolling
  // (scripted scrolling leaves half-painted frames). The camera glides to wherever the action is.
  const VIEW_H = 620;
  const cam = { y: 0, from: 0, to: 0, t0: 0, dur: 1 };
  const camY = () => { const k = Math.min(1, (Date.now() - cam.t0) / cam.dur); const e = k * k * (3 - 2 * k); return cam.from + (cam.to - cam.from) * e; };
  const glideTo = (y, dur = 800) => { cam.from = camY(); cam.to = Math.max(0, y); cam.t0 = Date.now(); cam.dur = dur; };
  const docY = async (sel) => { const box = await page.locator(sel).boundingBox(); return box.y + (await page.evaluate(() => scrollY)); };
  const rec = recorder(async () => {
    const full = await page.screenshot({ fullPage: true });
    const { height } = await sharp(full).metadata();
    const top = Math.round(Math.min(Math.max(0, camY()), Math.max(0, height - VIEW_H)));
    return sharp(full).extract({ left: 0, top, width: 820, height: Math.min(VIEW_H, height) }).png().toBuffer();
  });
  const type = (loc, text, delay = 55) => page.locator(loc).pressSequentially(text, { delay });
  await sleep(700);
  await type('#title', 'Why magnets forget', 60);
  await sleep(500);
  await page.selectOption('#tag', 'PHYSICS'); await sleep(350);
  await page.selectOption('#status', 'working'); await sleep(350);
  await type('#description', 'A short tour of the Ising model.', 28);
  glideTo((await docY('#content')) - 110, 900); await sleep(1000);
  await page.locator('#content').click();
  await page.keyboard.type('## The model\n\nEach spin is $s_i \\in \\{-1,+1\\}$, and the energy is\n\n$$H = -J \\sum_{\\langle i,j\\rangle} s_i s_j$$\n\n', { delay: 22 });
  await sleep(500);
  await page.setInputFiles('#file-input', { name: 'lattice.png', mimeType: 'image/png', buffer: lattice });
  await sleep(600);
  glideTo((await docY('#images-section')) - 40, 900); await sleep(1100);
  await type('[data-field=alt]', 'A coarsened lattice of spins', 40);
  await sleep(600);
  glideTo((await docY('#tab-write')) - 30, 800); await sleep(900);
  await page.locator('#tab-preview').click();
  await page.waitForSelector('#preview .katex'); await sleep(2600);
  glideTo((await docY('#token-panel')) - 60, 900); await sleep(1000);
  await page.locator('#token-panel summary').click(); await sleep(400);
  await type('#token', 'github_pat_demo_token', 20);
  await sleep(400);
  await page.locator('#publish-pr').click();
  await page.waitForSelector('#message a');
  { const m = await page.locator('#message').boundingBox(); glideTo((await docY('#message')) + m.height - VIEW_H + 50, 700); }
  await sleep(3200);
  await toGif(await rec.stop(), `${OUT}/studio.gif`, { width: 820, colours: 64, hold: 2600 });
  await ctx.close();
}
await browser.close();
