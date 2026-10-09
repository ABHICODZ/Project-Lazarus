import { readdirSync, existsSync } from 'node:fs';
import { visit } from 'unist-util-visit';

/** Matches [[target]] and [[target|label]]. */
export const WIKILINK = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

/** Every wiki link in a string, as { target, label? }. */
export function parseWikiLinks(text = '') {
  return [...text.matchAll(WIKILINK)].map((m) => ({ target: m[1].trim(), label: m[2]?.trim() }));
}

/** Maps entry id -> URL section ('' for essays, 'notes/' for notes) by reading the content folders. */
export function collectTargets(root = 'src/content') {
  const sections = { blog: '', notes: 'notes/' };
  const map = new Map();
  for (const [dir, section] of Object.entries(sections)) {
    const path = `${root}/${dir}`;
    if (!existsSync(path)) continue;
    for (const file of readdirSync(path)) {
      if (!/\.(md|mdx)$/.test(file)) continue;
      map.set(file.replace(/\.(md|mdx)$/, '').toLowerCase(), section);
    }
  }
  return map;
}

/** Turns [[slug]] into a link to that post or note. An unknown slug fails the build. */
export default function remarkWikiLinks({ base = '', root } = {}) {
  const targets = collectTargets(root);
  return (tree, file) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index == null || !node.value.includes('[[')) return;
      const parts = [];
      let last = 0;
      for (const m of node.value.matchAll(WIKILINK)) {
        const id = m[1].trim().toLowerCase();
        if (!targets.has(id)) {
          throw new Error(`Unknown wiki link [[${m[1].trim()}]] in ${file?.path ?? 'a document'}`);
        }
        if (m.index > last) parts.push({ type: 'text', value: node.value.slice(last, m.index) });
        parts.push({
          type: 'link',
          url: `${base}/${targets.get(id)}${id}/`,
          data: { hProperties: { className: ['wikilink'] } },
          children: [{ type: 'text', value: (m[2] ?? m[1]).trim() }],
        });
        last = m.index + m[0].length;
      }
      if (!parts.length) return;
      if (last < node.value.length) parts.push({ type: 'text', value: node.value.slice(last) });
      parent.children.splice(index, 1, ...parts);
      return index + parts.length;
    });
  };
}
