import { test, expect, type Page } from '@playwright/test';

const pages = ['', 'archive/', 'lab/', 'write/', 'tag/tech/', 'new-age-groceries/'];

/** Collect console errors and failed requests while a page loads. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
  page.on('response', (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
  return problems;
}

for (const path of pages) {
  test(`/${path} loads without errors and has no horizontal overflow`, async ({ page }) => {
    const problems = watch(page);
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await page.waitForLoadState('networkidle');
    expect(problems).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('every internal link on every page resolves', async ({ page, request, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const seen = new Set<string>();
  for (const path of pages) {
    await page.goto(path);
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => (a as HTMLAnchorElement).href));
    for (const href of hrefs) {
      const u = new URL(href);
      if (u.origin !== origin) continue;
      u.hash = '';
      seen.add(u.toString());
    }
  }
  expect(seen.size).toBeGreaterThan(5);
  for (const url of seen) {
    const res = await request.get(url);
    expect(res.status(), url).toBe(200);
  }
});

test('RSS feed is well formed and links stay under the base path', async ({ request, baseURL }) => {
  const res = await request.get(new URL('rss.xml', baseURL).toString());
  expect(res.status()).toBe(200);
  const xml = await res.text();
  expect(xml).toContain('<rss');
  const links = [...xml.matchAll(/<link>([^<]+)<\/link>/g)].map((m) => m[1]);
  expect(links.length).toBeGreaterThan(1);
  for (const l of links) expect(new URL(l).pathname.startsWith(new URL(baseURL!).pathname.replace(/\/$/, ''))).toBe(true);
});

test('theme toggle flips the theme and survives a reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: /toggle light and dark/i }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'light');
});

test('the lab lattice canvas paints pixels', async ({ page }) => {
  await page.goto('lab/');
  await page.waitForTimeout(500);
  const painted = await page.evaluate(() => {
    const c = document.getElementById('particle-canvas') as HTMLCanvasElement;
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i]) n++;
    return n;
  });
  expect(painted).toBeGreaterThan(100);
});

test('write form builds frontmatter that matches the content schema', async ({ page }) => {
  await page.goto('write/');
  await page.getByLabel('Title', { exact: true }).fill('A "quoted" title');
  await page.getByLabel('Tag', { exact: true }).selectOption('PHYSICS');
  await page.getByLabel('Content (MDX)').fill('Hello $x^2$');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await page.getByRole('button', { name: 'Copy' }).click();
  await expect(page.locator('#message')).toContainText('a-quoted-title.mdx');
});
