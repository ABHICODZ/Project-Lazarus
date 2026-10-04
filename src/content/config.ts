import { z, defineCollection } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    tag: z.enum(['TECH', 'PHYSICS', 'HISTORY', 'ANIME', 'LOG']).default('LOG'),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  })
});

export const collections = {
  'blog': blogCollection,
};
