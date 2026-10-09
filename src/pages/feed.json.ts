import type { APIRoute } from 'astro';
import { getPosts } from '../utils/posts';
import { parseDate, base } from '../utils/date';

export const GET: APIRoute = async ({ site }) => {
  const root = new URL(base, site).href;
  const posts = await getPosts();
  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Project Lazarus',
    home_page_url: root,
    feed_url: new URL('feed.json', root).href,
    description: 'Research Notes & Working Papers // The Archival Rabbit Hole',
    language: 'en-US',
    items: posts.map((p) => ({
      id: new URL(`${p.id}/`, root).href,
      url: new URL(`${p.id}/`, root).href,
      title: p.data.title,
      summary: p.data.description ?? '',
      date_published: new Date(parseDate(p.data.date)).toISOString(),
      ...(p.data.updated ? { date_modified: new Date(parseDate(p.data.updated)).toISOString() } : {}),
      tags: p.data.tags,
      image: new URL(`og/${p.id}.png`, root).href,
    })),
  };
  return new Response(JSON.stringify(feed, null, 2), { headers: { 'Content-Type': 'application/feed+json; charset=utf-8' } });
};
