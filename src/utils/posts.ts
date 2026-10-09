import { getCollection, type CollectionEntry } from 'astro:content';
import { parseDate, base } from './date';
import { parseWikiLinks } from '../../plugins/wikilinks.mjs';

export type Post = CollectionEntry<'blog'>;
export type Note = CollectionEntry<'notes'>;
export type Entry = Post | Note;

// Set INCLUDE_DRAFTS=1 to preview drafts locally.
const showDrafts = () => process.env.INCLUDE_DRAFTS === '1';
const newestFirst = <T extends Entry>(xs: T[]) => xs.sort((a, b) => parseDate(b.data.date) - parseDate(a.data.date));

/** Published essays, newest first. */
export async function getPosts(): Promise<Post[]> {
  return newestFirst(await getCollection('blog', ({ data }) => showDrafts() || !data.draft));
}

/** Published notes, newest first. */
export async function getNotes(): Promise<Note[]> {
  return newestFirst(await getCollection('notes', ({ data }) => showDrafts() || !data.draft));
}

/** Essays and notes together, newest first. */
export async function getEntries(): Promise<Entry[]> {
  return newestFirst([...(await getPosts()), ...(await getNotes())]);
}

export const isNote = (e: Entry): e is Note => e.collection === 'notes';

/** Site-relative URL for an entry, including the base path. */
export const hrefOf = (e: Entry) => `${base}${isNote(e) ? 'notes/' : ''}${e.id}/`;

/** Name of the generated share image for an entry (see src/pages/og). */
export const ogName = (e: Entry) => (isNote(e) ? `note-${e.id}` : e.id);

export function readingTime(body: string | undefined): string {
  const words = (body ?? '').match(/\w+/g)?.length ?? 0;
  return `${Math.max(1, Math.ceil(words / 225))} min read`;
}

/** Entries sharing the most tags with `entry`, falling back to the newest. */
export function related(entry: Entry, all: Entry[], n = 3): Entry[] {
  const others = all.filter((p) => p.id !== entry.id);
  const tags = new Set(entry.data.tags);
  const score = (p: Entry) => p.data.tags.filter((t: string) => tags.has(t)).length;
  return others.sort((a, b) => score(b) - score(a)).slice(0, n);
}

/** Entries that link to `entry` with [[wiki links]]. */
export function backlinks(entry: Entry, all: Entry[]): Entry[] {
  return all.filter(
    (e) => e.id !== entry.id && parseWikiLinks(e.body).some((l: { target: string }) => l.target.toLowerCase() === entry.id),
  );
}

/** Edges for the constellation: [[wiki links]] are strong, shared tags weak. */
export function graph(all: Entry[]) {
  const nodes = all.map((e) => ({ id: `${e.collection}:${e.id}`, title: e.data.title, href: hrefOf(e), tag: e.data.tag, kind: e.collection }));
  const index = new Map(all.map((e, i) => [e.id, i]));
  const edges: { a: number; b: number; strong: boolean }[] = [];
  all.forEach((e, i) => {
    for (const l of parseWikiLinks(e.body) as { target: string }[]) {
      const j = index.get(l.target.toLowerCase());
      if (j !== undefined && j !== i) edges.push({ a: i, b: j, strong: true });
    }
    for (let j = i + 1; j < all.length; j++) {
      if (all[j].data.tags.some((t: string) => e.data.tags.includes(t))) edges.push({ a: i, b: j, strong: false });
    }
  });
  return { nodes, edges };
}
