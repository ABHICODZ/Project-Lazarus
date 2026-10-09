import { test, expect } from '@playwright/test';

/** Guards the contrast fixes: tokens must clear WCAG AA for text (4.5) and UI borders (3.0) in both themes. */
const lum = (c: number[]) => {
  const [r, g, b] = c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

for (const theme of ['dark', 'light'] as const) {
  test(`${theme} theme tokens meet WCAG AA`, async ({ page }) => {
    await page.goto('');
    const t = await page.evaluate((th) => {
      document.documentElement.dataset.theme = th;
      const s = getComputedStyle(document.documentElement);
      const get = (n: string) => s.getPropertyValue(`--${n}`).trim().split(/\s+/).map(Number);
      return { paper: get('paper'), ink: get('ink'), graphite: get('graphite'), accent: get('accent'), control: get('control') };
    }, theme);
    expect(ratio(t.ink, t.paper)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.graphite, t.paper)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.accent, t.paper)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.control, t.paper)).toBeGreaterThanOrEqual(3);
  });
}
