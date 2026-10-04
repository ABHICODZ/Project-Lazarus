import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://abhicodz.github.io',
  base: '/Project-Lazarus',
  integrations: [tailwind(), mdx()],
  output: 'static'
});