import { z, defineCollection } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    tag: z.enum(['TECH', 'PHYSICS', 'MATH', 'HISTORY', 'ANIME', 'LOG']).default('LOG'),
    /** Extra free-form topics, used for tag pages and related posts. */
    topics: z.array(z.string()).default([]),
    description: z.string().optional(),
    /** How sure are you? Shown as a badge under the title. */
    status: z.enum(['speculative', 'working', 'settled']).optional(),
    draft: z.boolean().default(false),
  }).transform((d) => ({ ...d, tags: [...new Set([d.tag, ...d.topics.map((t) => t.toUpperCase())])] })),
});

export const collections = {
  'blog': blogCollection,
};
