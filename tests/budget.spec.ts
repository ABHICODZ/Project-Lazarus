import { test, expect, type Page } from '@playwright/test';

/**
 * Budgets for a cold load of each page type. They have headroom over today's numbers (home: ~16 KB JS,
 * ~41 KB CSS, ~24 KB images, CLS 0), so a failure means something heavy was added to every page.
 * Core Web Vitals "good" is CLS <= 0.1 (web.dev/articles/vitals).
 */
async function coldLoad(page: Page, path: string) {
  const bytes = { js: 0, css: 0, img: 0 };
  const pending: Promise<void>[] = [];
  page.on('response', (r) => {
    pending.push((async () => {
      const type = r.headers()['content-type'] ?? '';
      const size = (await r.body().catch(() => Buffer.alloc(0))).length;
      if (type.includes('javascript')) bytes.js += size;
      else if (type.includes('css')) bytes.css += size;
      else if (type.startsWith('image/')) bytes.img += size;
    })());
  });
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await Promise.all(pending);
  const cls = await page.evaluate(() => new Promise<number>((resolve) => {
    let total = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as unknown as { hadRecentInput: boolean; value: number }[]) if (!e.hadRecentInput) total += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => resolve(total), 400);
  }));
  return { ...bytes, cls };
}

const KB = 1024;

test('home page stays light', async ({ page }) => {
  const m = await coldLoad(page, '');
  expect(m.js, 'JS bytes').toBeLessThan(40 * KB);
  expect(m.css, 'CSS bytes').toBeLessThan(80 * KB);
  expect(m.img, 'image bytes').toBeLessThan(120 * KB);
  expect(m.cls, 'layout shift').toBeLessThan(0.1);
});

test('an article page without math stays light and does not load search or KaTeX', async ({ page }) => {
  const urls: string[] = [];
  page.on('request', (r) => urls.push(r.url()));
  const m = await coldLoad(page, 'new-age-groceries/');
  expect(m.js, 'JS bytes').toBeLessThan(40 * KB);
  expect(m.css, 'CSS bytes').toBeLessThan(80 * KB);
  expect(m.cls, 'layout shift').toBeLessThan(0.1);
  expect(urls.some((u) => u.includes('pagefind-component-ui')), 'search bundle should load on demand').toBe(false);
  expect(urls.some((u) => /katex.*\.css/i.test(u)), 'KaTeX CSS only where there is math').toBe(false);
});

test('the search bundle loads on first use, not before', async ({ page }) => {
  const urls: string[] = [];
  page.on('request', (r) => urls.push(r.url()));
  await page.goto('');
  await page.waitForLoadState('networkidle');
  expect(urls.some((u) => u.includes('pagefind-component-ui'))).toBe(false);
  await page.getByRole('button', { name: 'Search this site' }).click();
  await expect(page.getByRole('searchbox')).toBeVisible();
  expect(urls.some((u) => u.includes('pagefind-component-ui.js'))).toBe(true);
});

test('pressing / opens search', async ({ page }) => {
  await page.goto('');
  await page.keyboard.press('/');
  await expect(page.getByRole('searchbox')).toBeVisible();
});

test('print stylesheet hides chrome and keeps sidenotes', async ({ page }) => {
  await page.goto('new-age-groceries/');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#theme-toggle')).toBeHidden();
  await expect(page.locator('#progress-bar')).toBeHidden();
  const note = page.locator('.sidenote-body').first();
  await expect(note).toBeVisible();
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(255, 255, 255)');
});

test('sidenotes can be revealed by keyboard focus, not only hover', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 }); // below the xl breakpoint, where notes are popovers
  await page.goto('new-age-groceries/');
  const wrap = page.locator('[role="note"]').first();
  const body = wrap.locator('.sidenote-body');
  await expect(body).toBeHidden();
  await wrap.focus();
  await expect(body).toBeVisible();
});
