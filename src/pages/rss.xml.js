import rss from '@astrojs/rss';
import { parseDate, base } from '../utils/date';
import { getEntries, hrefOf } from '../utils/posts';

export async function GET(context) {
  const blog = await getEntries();

  return rss({
    title: 'Project Lazarus',
    description: 'Research Notes & Working Papers // The Archival Rabbit Hole',
    // Channel link is derived from `site`, so include the base path.
    site: new URL(base, context.site).href,
    items: blog.map((post) => ({
      title: post.data.title,
      pubDate: new Date(parseDate(post.data.date)),
      description: post.data.description || '',
      link: hrefOf(post),
    })),
    customData: `<language>en-us</language>`,
  });
}
