/** @type {import('tailwindcss').Config} */
// Colours are CSS variables (see src/styles/global.css) so the whole site can flip between themes.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        paperDark: token('paper'),
        inkLight: token('ink'),
        graphiteLight: token('graphite'),
        terracottaDark: token('accent'),
        hairlineDark: token('hairline'),
      },
      fontFamily: {
        serif: ['"EB Garamond Variable"', '"EB Garamond"', 'Georgia', 'serif'],
        mono: ['"Courier Prime"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
