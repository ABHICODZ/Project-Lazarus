import { getCollection, type CollectionEntry } from 'astro:content';
import { parseDate } from './date';

export type Post = CollectionEntry<'blog'>;

/** Published posts, newest first. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => parseDate(b.data.date) - parseDate(a.data.date));
}

export function readingTime(body: string): string {
  const words = body.match(/\w+/g)?.length ?? 0;
  return `${Math.max(1, Math.ceil(words / 225))} min read`;
}

/** Posts sharing the most tags with `post`, falling back to the newest. */
export function related(post: Post, all: Post[], n = 3): Post[] {
  const others = all.filter((p) => p.slug !== post.slug);
  const tags = new Set(post.data.tags);
  const score = (p: Post) => p.data.tags.filter((t) => tags.has(t)).length;
  return others.sort((a, b) => score(b) - score(a)).slice(0, n);
}
