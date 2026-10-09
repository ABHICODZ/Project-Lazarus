import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { TAGS, STATUSES, STAGES } from './config';

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    // Accepts YYYY.MM.DD, YYYY-MM-DD or YYYY/MM/DD; a typo fails the build instead of sorting wrongly.
    date: z.string().regex(/^\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}$/, 'date must look like 2026.10.04'),
    tag: z.enum(TAGS).default('LOG'),
    /** Extra free-form topics, used for tag pages and related posts. */
    topics: z.array(z.string()).default([]),
    /** Maturity of the note, garden-style. */
    stage: z.enum(STAGES).optional(),
    /** Date of the last meaningful revision, same format as `date`. */
    updated: z.string().optional(),
    description: z.string().optional(),
    /** How sure are you? Shown as a badge under the title. */
    status: z.enum(STATUSES).optional(),
    draft: z.boolean().default(false),
  }).transform((d) => ({ ...d, tags: [...new Set([d.tag, ...d.topics.map((t) => t.toUpperCase())])] })),
});

export const collections = {
  'blog': blogCollection,
};
