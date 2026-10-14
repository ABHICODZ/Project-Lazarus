// Generates the animated SVGs used in README.md. GitHub strips JavaScript but plays SMIL animation
// inside <img>, so everything here is declarative. Run: node scripts/readme/svg.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = 'docs/media';
mkdirSync(OUT, { recursive: true });

const C = { bg: '#0f0f0f', panel: '#161616', line: '#3a3a3a', ink: '#F4F2EC', dim: '#B0AEA8', faint: '#6b6963', accent: '#E06D5C' };
const MONO = "'Courier Prime','SF Mono',Menlo,Consolas,'Courier New',monospace";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n = (x) => +x.toFixed(4);

/** Deterministic PRNG so regenerating produces identical files. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** An <animate> that loops forever with the given per-keyframe values and times (0..1). */
const anim = (attr, values, times, dur, extra = '') =>
  `<animate attributeName="${attr}" values="${values.join(';')}" keyTimes="${times.map(n).join(';')}" dur="${dur}s" repeatCount="indefinite"${extra}/>`;

// ------------------------------------------------------------------ banner
function banner() {
  const W = 1280, H = 400, DUR = 14;
  const title = 'PROJECT LAZARUS';
  const chars = title.length;
  const tw = 800, x0 = 80, y = 196;
  const rand = rng(7);

  // A lattice of dots; a few of them breathe, echoing the Quantum Lattice in the Lab.
  let dots = '';
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 33; c++) {
      const cx = 40 + c * 37.5, cy = 36 + r * 41;
      const live = rand() < 0.16;
      dots += `<circle cx="${n(cx)}" cy="${n(cy)}" r="1.6" fill="${live ? C.accent : C.line}" opacity="${live ? 0.9 : 0.55}">`;
      if (live) {
        const d = 3 + rand() * 4, b = rand() * d;
        dots += `<animate attributeName="r" values="1.6;4.2;1.6" dur="${n(d)}s" begin="-${n(b)}s" repeatCount="indefinite"/>`;
        dots += `<animate attributeName="opacity" values="0.9;0.25;0.9" dur="${n(d)}s" begin="-${n(b)}s" repeatCount="indefinite"/>`;
      }
      dots += '</circle>';
    }
  }

  // Typing: reveal one character at a time with a discrete clip, hold, then reset.
  const start = 0.04, end = 0.2;
  const widths = [0], times = [0];
  for (let i = 1; i <= chars; i++) { widths.push(n((tw * i) / chars)); times.push(start + ((end - start) * (i - 1)) / (chars - 1)); }
  widths.push(0); times.push(0.97);
  widths.push(0); times.push(1);
  const revealVals = widths.map((w) => w);
  const clipAnim = `<animate attributeName="width" calcMode="discrete" values="${revealVals.join(';')}" keyTimes="${times.map(n).join(';')}" dur="${DUR}s" repeatCount="indefinite"/>`;
  const cursorX = widths.map((w) => n(x0 + w + 2));
  const cursorAnim = `<animate attributeName="x" calcMode="discrete" values="${cursorX.join(';')}" keyTimes="${times.map(n).join(';')}" dur="${DUR}s" repeatCount="indefinite"/>`;

  const phrases = [
    'research notes · working papers · things you can break',
    'essays with a live simulation inside',
    'a digital garden you can write to from the browser',
  ];
  const win = (k) => {
    const a = 0.26 + k * 0.23, b = a + 0.2;
    return { a, b };
  };
  const phraseSvg = phrases.map((p, k) => {
    const { a, b } = win(k);
    return `<text x="${x0}" y="262" font-family="${MONO}" font-size="27" fill="${C.dim}" opacity="0">${esc(p)}${anim('opacity', [0, 0, 1, 1, 0, 0], [0, a - 0.01, a + 0.02, b - 0.02, b, 1], DUR)}</text>`;
  }).join('');

  const chips = ['Astro 6', 'MDX', 'KaTeX', 'Pagefind', 'Playwright'];
  let cx = x0;
  const chipSvg = chips.map((t) => {
    const w = t.length * 11 + 28, g = `<g transform="translate(${cx},320)"><rect width="${w}" height="30" rx="4" fill="none" stroke="${C.line}"/><text x="${w / 2}" y="20" text-anchor="middle" font-family="${MONO}" font-size="14" fill="${C.faint}">${esc(t)}</text></g>`;
    cx += w + 12;
    return g;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Project Lazarus: research notes, working papers, and things you can break">
<defs><clipPath id="type"><rect x="${x0}" y="${y - 70}" width="0" height="96">${clipAnim}</rect></clipPath></defs>
<rect width="${W}" height="${H}" fill="${C.bg}"/>
${dots}
<rect x="0" y="${H - 4}" width="${W}" height="4" fill="${C.accent}"/>
<g clip-path="url(#type)"><text x="${x0}" y="${y}" font-family="${MONO}" font-size="82" font-weight="700" fill="${C.ink}" textLength="${tw}" lengthAdjust="spacing">${esc(title)}</text></g>
<rect x="${x0 + 2}" y="${y - 66}" width="6" height="84" fill="${C.accent}">${cursorAnim}${anim('opacity', [1, 0, 1], [0, 0.5, 1], 1.1)}</rect>
${phraseSvg}
${chipSvg}
</svg>
`;
}

// ------------------------------------------------------------------ pipeline
function pipeline() {
  const W = 1000, bw = 205, bh = 84, gap = 40, x0 = 30;
  const rows = [
    { y: 74, label: '01  CAPTURE', boxes: [['Browser draft', 'MDX + images to WebP'], ['Atomic commit', 'GitHub Git Data API'], ['Pull request', 'branch post/<slug>'], ['CI wakes up', 'GitHub Actions']] },
    { y: 224, label: '02  COMPILE', boxes: [['remark', 'math · [[wiki links]]'], ['rehype', 'KaTeX · Shiki · anchors'], ['Astro', 'static HTML · srcset'], ['Pagefind', 'search index']] },
    { y: 374, label: '03  PROVE AND SHIP', boxes: [['Type check', 'astro check, strict'], ['Tests', '20 unit + 82 e2e'], ['Budgets', 'JS · CSS · CLS'], ['Deploy', 'GitHub Pages']] },
  ];
  const H = 492, DUR = 14;
  const left = 10, right = 990;
  const cy = rows.map((r) => r.y + bh / 2);
  const gapY = [ (rows[0].y + bh + rows[1].y) / 2, (rows[1].y + bh + rows[2].y) / 2 ];
  // The dot snakes through the rows: L to R, drop, R to L along the gap, drop, L to R ...
  const segs = [];
  const P = (x, y) => ({ x, y });
  let pts = [P(x0, cy[0]), P(right, cy[0]), P(right, gapY[0]), P(left, gapY[0]), P(left, cy[1]), P(right, cy[1]), P(right, gapY[1]), P(left, gapY[1]), P(left, cy[2]), P(x0 + 3 * (bw + gap) + bw, cy[2])];
  let total = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); segs.push({ from: pts[i - 1], to: pts[i], d, start: total }); total += d; }
  const arcAt = (row, x) => {
    const seg = segs[[0, 4, 8][row]];
    return seg.start + Math.abs(x - seg.from.x);
  };
  const d = 'M' + pts.map((p) => `${p.x},${p.y}`).join(' L');

  let boxes = '';
  rows.forEach((row, ri) => {
    boxes += `<text x="${x0}" y="${row.y - 14}" font-family="${MONO}" font-size="14" letter-spacing="3" fill="${C.accent}">${esc(row.label)}</text>`;
    row.boxes.forEach(([title, sub], bi) => {
      const x = x0 + bi * (bw + gap);
      const t = arcAt(ri, x + bw / 2) / total;
      const lo = Math.max(0.001, t - 0.045), hi = Math.min(0.998, t + 0.075);
      boxes += `<g><rect x="${x}" y="${row.y}" width="${bw}" height="${bh}" rx="6" fill="${C.bg}"/><rect x="${x}" y="${row.y}" width="${bw}" height="${bh}" rx="6" fill="${C.accent}" fill-opacity="0.05" stroke="${C.line}" stroke-width="1.5">`
        + anim('fill-opacity', [0.05, 0.05, 0.38, 0.05, 0.05], [0, lo, t, hi, 1], DUR)
        + anim('stroke', [C.line, C.line, C.accent, C.line, C.line], [0, lo, t, hi, 1], DUR) + '</rect>'
        + `<text x="${x + 18}" y="${row.y + 36}" font-family="${MONO}" font-size="20" font-weight="700" fill="${C.ink}">${esc(title)}</text>`
        + `<text x="${x + 18}" y="${row.y + 62}" font-family="${MONO}" font-size="14.5" fill="${C.dim}">${esc(sub)}</text></g>`;
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="What happens when a post is published: capture in the browser, compile with remark and rehype into static HTML, then type-check, test and deploy">
<rect width="${W}" height="${H}" fill="${C.bg}"/>
<path d="${d}" fill="none" stroke="${C.line}" stroke-width="1.5" stroke-dasharray="3 7"/>
${boxes}
<circle r="7" fill="${C.accent}"><animateMotion dur="${DUR}s" repeatCount="indefinite" path="${d}"/></circle>
<circle r="14" fill="${C.accent}" opacity="0.25"><animateMotion dur="${DUR}s" repeatCount="indefinite" path="${d}"/></circle>
</svg>
`;
}

// ------------------------------------------------------------------ terminal
function terminal() {
  const W = 1000, H = 470, DUR = 22, x = 44;
  // [time in seconds, kind, text, color]
  const script = [
    [0.5, 'cmd', 'npm run build'],
    [2.6, 'out', 'astro check    56 files    0 errors    0 warnings', C.dim],
    [3.6, 'out', 'astro build    13 pages built in 1.39s', C.dim],
    [4.6, 'out', 'pagefind       2 pages indexed for search', C.dim],
    [6.2, 'cmd', 'npm test'],
    [7.8, 'out', 'unit           20 passed', C.dim],
    [8.9, 'out', 'playwright     82 passed   desktop + mobile', C.dim],
    [10.0, 'out', 'budgets        JS 16 KB   CSS 41 KB   CLS 0.000', C.dim],
    [12.0, 'cmd', 'git push && gh pr create'],
    [14.0, 'ok', 'build ✓   tests ✓   deploy (main only) ✓'],
  ];
  const lineH = 34, top = 112;
  let body = '';
  script.forEach(([t, kind, text, color], i) => {
    const y = top + i * lineH;
    const frac = t / DUR;
    const vis = (a) => anim('opacity', [0, 0, 1, 1, 0], [0, frac, Math.min(frac + 0.012, 0.97), 0.965, 1], DUR);
    if (kind === 'cmd') {
      body += `<g opacity="0">${vis()}<text x="${x}" y="${y}" font-family="${MONO}" font-size="20" fill="${C.accent}">$</text><text x="${x + 26}" y="${y}" font-family="${MONO}" font-size="20" fill="${C.ink}" style="white-space:pre" xml:space="preserve">${esc(text)}</text></g>`;
    } else {
      body += `<text x="${x + 26}" y="${y}" font-family="${MONO}" font-size="19" fill="${kind === 'ok' ? C.accent : color}" opacity="0" style="white-space:pre" xml:space="preserve">${esc(text)}${vis()}</text>`;
    }
  });
  // The cursor sits on the line after the most recent output, so it never runs ahead of the text.
  const rowY = (i) => top + i * lineH - 15;
  const curTimes = [0, ...script.map(([t]) => t / DUR), 0.97, 1];
  const curY = [rowY(0), ...script.map((_, i) => rowY(Math.min(i + 1, script.length))), rowY(script.length), rowY(0)];
  const cursorMove = `<animate attributeName="y" calcMode="discrete" values="${curY.map(n).join(';')}" keyTimes="${curTimes.map(n).join(';')}" dur="${DUR}s" repeatCount="indefinite"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="A terminal session: build with 0 type errors, 20 unit and 82 end-to-end tests passing, performance budgets met">
<rect width="${W}" height="${H}" rx="10" fill="${C.bg}"/>
<rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="10" fill="none" stroke="${C.line}" stroke-width="1.5"/>
<rect x="0" y="0" width="${W}" height="52" rx="10" fill="${C.panel}"/><rect x="0" y="40" width="${W}" height="12" fill="${C.panel}"/>
<circle cx="30" cy="26" r="7" fill="#ff5f57"/><circle cx="54" cy="26" r="7" fill="#febc2e"/><circle cx="78" cy="26" r="7" fill="#28c840"/>
<text x="${W / 2}" y="31" text-anchor="middle" font-family="${MONO}" font-size="15" fill="${C.faint}">project-lazarus</text>
${body}
<rect x="${x + 26}" y="${rowY(0)}" width="11" height="22" fill="${C.accent}">${cursorMove}${anim('opacity', [1, 0, 1], [0, 0.5, 1], 1.1)}</rect>
</svg>
`;
}

// ------------------------------------------------------------------ weight
function weight() {
  const W = 1000, H = 400, DUR = 12, bx = 230, bwMax = 600;
  const rows = [
    ['JavaScript', 186.9, 15.6, 'KB'],
    ['CSS', 112.2, 41.0, 'KB'],
    ['Images', 604.6, 23.8, 'KB'],
    ['Layout shift', 0.09, 0.0, 'CLS'],
  ];
  let g = '';
  rows.forEach(([name, before, after, unit], i) => {
    const y = 96 + i * 72;
    const fmt = (v) => (unit === 'CLS' ? v.toFixed(3) : v.toFixed(1)) + (unit === 'KB' ? ' KB' : '');
    const wb = bwMax, wa = after === 0 ? 0 : Math.max((after / before) * bwMax, 4);
    const grow = (w, a, b) => anim('width', [0, 0, w, w, 0], [0, a, b, 0.94, 1], DUR);
    const show = (a, b) => anim('opacity', [0, 0, 1, 1, 0], [0, a, b, 0.94, 1], DUR);
    const cut = Math.round((1 - after / before) * 100);
    g += `<text x="30" y="${y + 20}" font-family="${MONO}" font-size="19" fill="${C.ink}">${esc(name)}</text>`;
    g += `<rect x="${bx}" y="${y}" width="0" height="20" rx="3" fill="${C.faint}">${grow(n(wb), 0.04 + i * 0.03, 0.22 + i * 0.03)}</rect>`;
    g += `<text x="${bx + wb - 8}" y="${y + 15}" text-anchor="end" font-family="${MONO}" font-size="14" fill="${C.ink}" opacity="0">${esc(fmt(before))}${show(0.2 + i * 0.03, 0.24 + i * 0.03)}</text>`;
    g += `<rect x="${bx}" y="${y + 28}" width="0" height="20" rx="3" fill="${C.accent}">${grow(n(wa), 0.3 + i * 0.03, 0.48 + i * 0.03)}</rect>`;
    g += `<text x="${bx + wa + 10}" y="${y + 43}" font-family="${MONO}" font-size="14" fill="${C.ink}" opacity="0">${esc(fmt(after))}${show(0.46 + i * 0.03, 0.5 + i * 0.03)}</text>`;
    g += `<text x="${W - 30}" y="${y + 33}" text-anchor="end" font-family="${MONO}" font-size="24" font-weight="700" fill="${C.accent}" opacity="0">\u2212${cut}%${show(0.5 + i * 0.03, 0.54 + i * 0.03)}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Home page weight before and after: JavaScript 187 KB to 16 KB, CSS 112 KB to 41 KB, images 605 KB to 24 KB, layout shift 0.09 to 0">
<rect width="${W}" height="${H}" rx="10" fill="${C.bg}"/>
<rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="10" fill="none" stroke="${C.line}" stroke-width="1.5"/>
<text x="30" y="44" font-family="${MONO}" font-size="15" letter-spacing="3" fill="${C.accent}">HOME PAGE, COLD LOAD</text>
<rect x="${W - 270}" y="30" width="14" height="14" rx="2" fill="${C.faint}"/><text x="${W - 248}" y="42" font-family="${MONO}" font-size="14" fill="${C.dim}">before</text>
<rect x="${W - 170}" y="30" width="14" height="14" rx="2" fill="${C.accent}"/><text x="${W - 148}" y="42" font-family="${MONO}" font-size="14" fill="${C.dim}">after</text>
${g}
</svg>
`;
}

const files = { 'banner.svg': banner(), 'pipeline.svg': pipeline(), 'terminal.svg': terminal(), 'weight.svg': weight() };
for (const [name, svg] of Object.entries(files)) {
  writeFileSync(`${OUT}/${name}`, svg);
  console.log(name.padEnd(14), `${(svg.length / 1024).toFixed(1)} KB`);
}
