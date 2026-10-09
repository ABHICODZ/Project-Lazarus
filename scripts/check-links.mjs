// Checks every external URL in the content and the reference list, and suggests an Internet Archive
// snapshot for any that fail. Run weekly in CI (see .github/workflows/links.yml); it is not a PR gate
// because other people's servers fail for reasons that are not ours.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const URL_RE = /https?:\/\/[^\s)"'<>\]]+/g;
const trim = (u) => u.replace(/[.,;:!?]+$/, '');

function* walk(dir) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) yield* walk(p);
    else if (/\.(mdx?|json)$/.test(f.name)) yield p;
  }
}

const found = new Map(); // url -> files that mention it
for (const root of ['src/content', 'src/data']) {
  for (const file of walk(root)) {
    for (const m of readFileSync(file, 'utf8').matchAll(URL_RE)) {
      const url = trim(m[0]);
      found.set(url, [...(found.get(url) ?? []), file]);
    }
  }
}

async function check(url) {
  const attempt = async (method) => {
    const res = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'lazarus-link-check' } });
    return res.status;
  };
  try {
    let status = await attempt('HEAD');
    if (status >= 400) status = await attempt('GET'); // some servers reject HEAD
    // 401/403/429 usually mean "we do not serve scripts" (publishers, CDNs), not that the page is gone.
    return { url, ok: status < 400, soft: [401, 403, 429].includes(status), status };
  } catch (e) {
    return { url, ok: false, status: e.name === 'TimeoutError' ? 'timeout' : 'network error' };
  }
}

const urls = [...found.keys()];
const results = [];
const queue = [...urls];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) results.push(await check(queue.shift()));
}));

const bad = results.filter((r) => !r.ok && !r.soft);
const soft = results.filter((r) => !r.ok && r.soft);
for (const r of soft) console.log(`WARN ${r.status}  ${r.url}  (blocks scripts; check by hand)`);
console.log(`Checked ${results.length} external links.`);
for (const r of bad) {
  console.log(`\nFAIL ${r.status}  ${r.url}\n  in: ${[...new Set(found.get(r.url))].join(', ')}\n  archive: https://web.archive.org/web/${r.url}`);
}
if (bad.length) { console.log(`\n${bad.length} broken.`); process.exit(1); }
console.log('All good.');
