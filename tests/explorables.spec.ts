import { test, expect } from '@playwright/test';

test.describe('Ising explorable', () => {
  test('slider updates the label and the URL, and a shared URL restores the state', async ({ page }) => {
    await page.goto('lab/');
    const root = page.locator('[data-ising]');
    await root.scrollIntoViewIfNeeded();
    await root.locator('[data-temp]').fill('3.2');
    await expect(root.locator('[data-temp-out]')).toHaveText('3.20');
    expect(new URL(page.url()).searchParams.get('ising.T')).toBe('3.20');

    await page.goto('lab/?ising.T=1.25');
    await expect(page.locator('[data-ising] [data-temp-out]')).toHaveText('1.25');
  });

  test('a cold lattice stays ordered at low T and reports magnetisation near 1', async ({ page }) => {
    await page.goto('lab/?ising.T=1');
    const root = page.locator('[data-ising]');
    await root.getByRole('button', { name: 'Pause' }).click();
    await root.getByRole('button', { name: 'All up' }).click();
    await root.getByRole('button', { name: 'Step' }).click();
    const m = Number(await root.locator('[data-m]').textContent());
    expect(m).toBeGreaterThan(0.9);
  });

  test('a hot lattice is disordered', async ({ page }) => {
    await page.goto('lab/?ising.T=4');
    const root = page.locator('[data-ising]');
    await root.getByRole('button', { name: 'Pause' }).click();
    await root.getByRole('button', { name: 'Random' }).click();
    for (let i = 0; i < 5; i++) await root.getByRole('button', { name: 'Step' }).click();
    expect(Number(await root.locator('[data-m]').textContent())).toBeLessThan(0.3);
  });

  test('reduced motion starts paused', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('lab/');
    const root = page.locator('[data-ising]');
    await expect(root.getByRole('button', { name: 'Run' })).toBeVisible();
    await expect(root.locator('[data-motion-note]')).toBeVisible();
  });

  test('the same seed and temperature reproduce the same first frame', async ({ page }) => {
    const grab = async () => {
      await page.goto('lab/?ising.T=2.5&ising.seed=7');
      const root = page.locator('[data-ising]');
      await root.getByRole('button', { name: 'Pause' }).click();
      await root.getByRole('button', { name: 'Random' }).click();
      return page.evaluate(() => {
        const c = document.querySelector('[data-ising] canvas') as HTMLCanvasElement;
        return Array.from(c.getContext('2d')!.getImageData(0, 0, 16, 16).data).join(',');
      });
    };
    expect(await grab()).toBe(await grab());
  });
});

test('predict-then-reveal hides the explanation until a choice is made', async ({ page }) => {
  await page.goto('lab/');
  const box = page.locator('[data-predict]');
  await expect(box.locator('[data-reveal]')).toBeHidden();
  await box.getByRole('button', { name: 'Still noise' }).click();
  await expect(box.locator('[data-verdict]')).toContainText('Not quite');
  await expect(box.locator('[data-reveal]')).toBeVisible();
  await box.getByRole('button', { name: 'Large single-colour domains' }).click();
  await expect(box.locator('[data-verdict]')).toContainText('Right');
});
