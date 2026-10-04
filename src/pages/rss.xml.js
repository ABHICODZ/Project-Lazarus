import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const blog = await getCollection('blog', ({ data }) => !data.draft);
  
  return rss({
    title: 'Project Lazarus',
    description: 'Research Notes & Working Papers // The Archival Rabbit Hole',
    site: context.site,
    items: blog.map((post) => ({
      title: post.data.title,
      pubDate: new Date(post.data.date),
      description: post.data.description || '',
      link: `/${post.slug}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}
