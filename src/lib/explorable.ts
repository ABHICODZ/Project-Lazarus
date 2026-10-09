/** Small helpers shared by explorables: seeded RNG, URL-backed state, and "only run while visible". */

/** mulberry32: a tiny deterministic PRNG, so a shared URL reproduces the same run. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Read a numeric URL parameter, clamped to [min, max]; falls back when missing or invalid. */
export function readParam(name: string, fallback: number, min: number, max: number): number {
  const raw = new URLSearchParams(location.search).get(name);
  const n = raw === null ? NaN : Number(raw);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** Write a URL parameter without adding history entries. */
export function writeParam(name: string, value: number | string) {
  const url = new URL(location.href);
  url.searchParams.set(name, String(value));
  history.replaceState(history.state, '', url);
}

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Calls `onChange(true|false)` as the element enters or leaves the viewport. Returns a disposer. */
export function whileVisible(el: Element, onChange: (visible: boolean) => void) {
  const io = new IntersectionObserver(([e]) => onChange(e.isIntersecting));
  io.observe(el);
  return () => io.disconnect();
}

export const cssRgb = (name: string): [number, number, number] =>
  getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim().split(/\s+/).map(Number) as [number, number, number];
