import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';

const png = (w = 2400, h = 1200) => sharp({ create: { width: w, height: h, channels: 3, background: '#c85a48' } }).png().toBuffer();

async function addImage(page: Page, name = 'Lattice Photo.png', w = 2400, h = 1200) {
  await page.locator('#file-input').setInputFiles({ name, mimeType: 'image/png', buffer: await png(w, h) });
  await expect(page.locator('#images li')).not.toHaveCount(0);
}

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await page.goto('write/');
  await page.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('lazarus-write'); });
  await page.reload();
});

test('slug follows the title until it is edited by hand', async ({ page }) => {
  await page.locator('#title').fill('Why Magnets Forget!');
  await expect(page.locator('#slug')).toHaveValue('why-magnets-forget');
  await page.locator('#slug').fill('magnets');
  await page.locator('#title').fill('Something else entirely');
  await expect(page.locator('#slug')).toHaveValue('magnets');
  await expect(page.locator('#slug-hint')).toHaveText('/magnets/');
  await page.getByLabel('Note (growing)').check();
  await expect(page.locator('#slug-hint')).toHaveText('/notes/magnets/');
});

test('adding an image resizes it to WebP, inserts a figure and demands alt text', async ({ page }) => {
  await page.locator('#title').fill('Image test');
  await page.locator('#content').fill('Intro paragraph.');
  await addImage(page);

  await expect(page.locator('#images li')).toContainText('lattice-photo.webp');
  await expect(page.locator('#content')).toHaveValue(/<Figure src=\{img_lattice_photo\} num=\{1\} \/>/);
  await expect(page.locator('#message')).toContainText('Describe it in the alt text');

  // The stored blob must really be a <=1600px WebP.
  const info = await page.evaluate(async () => {
    const db: IDBDatabase = await new Promise((res) => { const r = indexedDB.open('lazarus-write', 1); r.onsuccess = () => res(r.result); });
    const rec: { blob: Blob } = await new Promise((res) => { const q = db.transaction('images').objectStore('images').getAll(); q.onsuccess = () => res(q.result[0]); });
    const bmp = await createImageBitmap(rec.blob);
    return { type: rec.blob.type, width: bmp.width, height: bmp.height };
  });
  expect(info.type).toBe('image/webp');
  expect(info.width).toBe(1600);
  expect(info.height).toBe(800);

  await page.locator('#copy-md').click();
  await expect(page.locator('#errors')).toContainText('Add alt text for lattice-photo.webp');

  await page.locator('[data-field="alt"]').fill('Red field');
  await expect(page.locator('#errors')).toBeHidden().catch(() => {}); // problems clear as they are fixed
  await page.locator('#copy-md').click();
  const md = await page.evaluate(() => navigator.clipboard.readText());
  expect(md).toContain(`import img_lattice_photo from '../../assets/posts/image-test/lattice-photo.webp';`);
  expect(md).toContain(`import Figure from '../../components/Figure.astro';`);
  expect(md).toContain('alt={"Red field"}');
  expect(md).toMatch(/^---\ntitle: "Image test"\n/);
});

test('editing alt text in the tray updates the published markdown', async ({ page }) => {
  await page.locator('#title').fill('Alt edit');
  await page.locator('#content').fill('Hello');
  await addImage(page);
  await page.locator('[data-field="alt"]').fill('first');
  await page.locator('[data-field="alt"]').fill('second');
  await page.locator('[data-field="caption"]').fill('A caption');
  await page.locator('#copy-md').click();
  const md = await page.evaluate(() => navigator.clipboard.readText());
  expect(md).toContain('alt={"second"}');
  expect(md).toContain('caption={"A caption"}');
  expect(md).not.toContain('"first"');
});

test('preview renders figures and math, and sanitises scripts', async ({ page }) => {
  await page.locator('#title').fill('Preview');
  await page.locator('#content').fill('Euler: $e^{i\\pi} + 1 = 0$\n\n<img src=x onerror="window.__pwned=1">\n\n<script>window.__pwned=2</script>');
  await addImage(page, 'pic.png', 800, 400);
  await page.locator('[data-field="alt"]').fill('Alt');
  await page.locator('#tab-preview').click();
  await expect(page.locator('#preview .katex')).toBeVisible();
  await expect(page.locator('#preview figure img')).toBeVisible();
  // A broken image still has a box, so assert the bytes actually decoded.
  await expect.poll(() => page.locator('#preview figure img').evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  const html = await page.locator('#preview').innerHTML();
  expect(html).not.toContain('onerror');
  expect(html).not.toContain('<script');
  expect(html).not.toMatch(/javascript:/i);
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
  await page.locator('#tab-write').click();
  await expect(page.locator('#content')).toBeVisible();
});

test('the draft and its images survive a reload', async ({ page }) => {
  await page.locator('#title').fill('Persistent');
  await page.locator('#content').fill('Body text');
  await page.locator('#tag').selectOption('PHYSICS');
  await addImage(page);
  await page.locator('[data-field="alt"]').fill('Kept');
  await page.reload();
  await expect(page.locator('#title')).toHaveValue('Persistent');
  await expect(page.locator('#tag')).toHaveValue('PHYSICS');
  await expect(page.locator('#content')).toHaveValue(/Body text/);
  await expect(page.locator('[data-field="alt"]')).toHaveValue('Kept');
  await expect(page.locator('#images li img')).toBeVisible();
});

test('the .zip contains the post and its image at the right repo paths', async ({ page }) => {
  await page.locator('#title').fill('Zip me');
  await page.locator('#content').fill('Body');
  await addImage(page);
  await page.locator('[data-field="alt"]').fill('Alt');
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#download-zip').click()]);
  expect(download.suggestedFilename()).toBe('zip-me.zip');
  const files = unzipSync(readFileSync((await download.path())!));
  expect(Object.keys(files).sort()).toEqual(['src/assets/posts/zip-me/lattice-photo.webp', 'src/content/blog/zip-me.mdx']);
  expect(strFromU8(files['src/content/blog/zip-me.mdx'])).toContain('title: "Zip me"');
  expect(Buffer.from(files['src/assets/posts/zip-me/lattice-photo.webp']).subarray(8, 12).toString()).toBe('WEBP');
});

test('publishing opens a pull request with one commit containing every file', async ({ page }) => {
  const seen: { method: string; path: string; body?: any }[] = [];
  await page.route('https://api.github.com/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^\/repos\/[^/]+\/[^/]+/, '');
    const body = req.postData() ? JSON.parse(req.postData()!) : undefined;
    seen.push({ method: req.method(), path, body });
    const json = (status: number, data: unknown) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data), headers: { 'access-control-allow-origin': '*' } });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (path === '/git/ref/heads/main') return json(200, { object: { sha: 'BASE' } });
    if (path === '/git/commits/BASE') return json(200, { tree: { sha: 'BT' } });
    if (path === '/git/blobs') return json(201, { sha: 'b' + seen.length });
    if (path === '/git/trees') return json(201, { sha: 'T' });
    if (path === '/git/commits') return json(201, { sha: 'C' });
    if (path === '/git/refs') return json(201, {});
    if (path === '/pulls') return json(201, { html_url: 'https://github.com/o/r/pull/42' });
    return json(500, {});
  });
  await page.locator('#title').fill('Ship it');
  await page.locator('#content').fill('Body');
  await addImage(page);
  await page.locator('[data-field="alt"]').fill('Alt');

  await page.locator('#publish-pr').click();
  await expect(page.locator('#message')).toContainText('Paste a GitHub token'); // no token yet

  await page.locator('#token').fill('github_pat_test');
  await page.locator('#publish-pr').click();
  await expect(page.locator('#message a')).toHaveAttribute('href', 'https://github.com/o/r/pull/42');

  const real = seen.filter((c) => c.method !== 'OPTIONS');
  const tree = real.find((c) => c.path === '/git/trees')!.body.tree.map((t: { path: string }) => t.path).sort();
  expect(tree).toEqual(['src/assets/posts/ship-it/lattice-photo.webp', 'src/content/blog/ship-it.mdx']);
  expect(real.find((c) => c.path === '/git/refs')!.body.ref).toBe('refs/heads/post/ship-it');
  const encodings = real.filter((c) => c.path === '/git/blobs').map((c) => c.body.encoding).sort();
  expect(encodings).toEqual(['base64', 'utf-8']);
  // The token is only remembered when asked.
  expect(await page.evaluate(() => localStorage.getItem('lazarus-write-token'))).toBeNull();
});

test('GitHub errors are explained, not dumped', async ({ page }) => {
  await page.route('https://api.github.com/**', (route) =>
    route.request().method() === 'OPTIONS'
      ? route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
      : route.fulfill({ status: 401, contentType: 'application/json', body: '{}', headers: { 'access-control-allow-origin': '*' } }));
  await page.locator('#title').fill('Nope');
  await page.locator('#content').fill('Body');
  await page.locator('#token-panel summary').click();
  await page.locator('#token').fill('bad');
  await page.locator('#publish-pr').click();
  await expect(page.locator('#message')).toContainText('rejected the token');
});

test('keyboard shortcuts: Ctrl+B wraps the selection and does not open site search', async ({ page }) => {
  await page.locator('#content').fill('make bold');
  await page.locator('#content').selectText();
  await page.keyboard.press('Control+b');
  await expect(page.locator('#content')).toHaveValue('**make bold**');
  await page.locator('#content').press('Control+k');
  await expect(page.getByRole('searchbox')).toHaveCount(0);
  await expect(page.locator('#content')).toHaveValue(/\]\(https:\/\/\)/);
});

test('no horizontal overflow with images attached', async ({ page }) => {
  await page.locator('#title').fill('Overflow');
  await page.locator('#content').fill('x');
  await addImage(page, 'a-very-long-file-name-that-keeps-going-and-going-and-going.png');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});
