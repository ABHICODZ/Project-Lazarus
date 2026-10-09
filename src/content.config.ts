import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { TAGS, STATUSES, STAGES } from './config';

const DATE = /^\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}$/;

/** Fields shared by essays and notes. */
const base = z.object({
  title: z.string(),
  // Accepts YYYY.MM.DD, YYYY-MM-DD or YYYY/MM/DD; a typo fails the build instead of sorting wrongly.
  date: z.string().regex(DATE, 'date must look like 2026.10.04'),
  tag: z.enum(TAGS).default('LOG'),
  /** Extra free-form topics, used for tag pages and related posts. */
  topics: z.array(z.string()).default([]),
  /** How sure are you? Shown as a badge under the title. */
  status: z.enum(STATUSES).optional(),
  /** Date of the last meaningful revision, same format as `date`. */
  updated: z.string().regex(DATE).optional(),
  description: z.string().optional(),
  draft: z.boolean().default(false),
});

/** Adds `tags`: the main tag plus any topics, upper-cased, de-duplicated. */
const addTags = <D extends { tag: string; topics: string[] }>(d: D) => ({
  ...d,
  tags: [...new Set([d.tag, ...d.topics.map((t) => t.toUpperCase())])],
});

export const collections = {
  // Finished essays.
  blog: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
    schema: base.extend({ stage: z.enum(STAGES).optional() }).transform(addTags),
  }),
  // Short, growing notes. They default to seedlings.
  notes: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
    schema: base.extend({ stage: z.enum(STAGES).default('seedling') }).transform(addTags),
  }),
};
