/** Parse post dates written as `YYYY.MM.DD`, `YYYY-MM-DD` or `YYYY/MM/DD` into epoch ms (UTC). */
export function parseDate(value: string): number {
  const m = value.trim().match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : Date.parse(value);
}

/** Site base path with exactly one trailing slash, e.g. `/Project-Lazarus/`. */
export const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
