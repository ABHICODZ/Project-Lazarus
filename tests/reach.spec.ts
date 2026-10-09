import { test, expect } from '@playwright/test';

test('each post has its own share image, and it is a real PNG', async ({ page, request }) => {
  await page.goto('new-age-groceries/');
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og).toContain('/og/new-age-groceries.png');
  const res = await request.get(new URL(new URL(og!).pathname, page.url()).toString());
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toBe('image/png');
  const body = await res.body();
  expect(body.subarray(1, 4).toString()).toBe('PNG');
});

test('JSON Feed lists posts with absolute URLs under the base path', async ({ request, baseURL }) => {
  const res = await request.get(new URL('feed.json', baseURL).toString());
  expect(res.status()).toBe(200);
  const feed = await res.json();
  expect(feed.version).toContain('jsonfeed.org');
  expect(feed.items.length).toBeGreaterThan(0);
  for (const item of feed.items) {
    expect(new URL(item.url).pathname.startsWith(new URL(baseURL!).pathname.replace(/\/$/, ''))).toBe(true);
    expect(Number.isNaN(Date.parse(item.date_published))).toBe(false);
  }
});

test('search finds a post by a word from its body', async ({ page }) => {
  await page.goto('');
  await page.locator('pagefind-modal-trigger').getByRole('button').click();
  await page.getByRole('searchbox').fill('subscription');
  await expect(page.locator('pagefind-modal')).toContainText('New Age Groceries');
});

test('comments stay out of the page until giscus is configured', async ({ page }) => {
  await page.goto('new-age-groceries/');
  await expect(page.locator('#giscus-host')).toHaveCount(0);
});
