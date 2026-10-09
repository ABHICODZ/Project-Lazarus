// Single source for the deployment URL, shared by astro.config.mjs and build plugins.
export const SITE = process.env.SITE_URL ?? 'https://abhicodz.github.io';
export const BASE = (process.env.SITE_BASE ?? '/Project-Lazarus').replace(/\/$/, '');
