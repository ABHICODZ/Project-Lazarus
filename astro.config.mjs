import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkWikiLinks from './plugins/wikilinks.mjs';
import { SITE, BASE } from './site.config.mjs';

export default defineConfig({
  // Override for another host, e.g. SITE_URL=https://example.com SITE_BASE=/ npm run build
  site: SITE,
  base: BASE || '/',
  integrations: [mdx(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  markdown: {
    remarkPlugins: [remarkMath, [remarkWikiLinks, { base: BASE }]],
    rehypePlugins: [
      rehypeKatex,
      rehypeSlug,
      [rehypeAutolinkHeadings, {
        behavior: 'prepend',
        properties: { class: 'anchor', ariaHidden: 'true', tabIndex: -1 },
        content: { type: 'text', value: '#' },
      }],
    ],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
      wrap: false,
    },
  },
  output: 'static',
});
