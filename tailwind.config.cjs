/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        paperDark: '#121212',
        inkLight: '#F4F2EC',
        graphiteLight: '#B0AEA8',
        terracottaDark: '#E06D5C',
        hairlineDark: '#4A4A4A'
      },
      fontFamily: {
        serif: ['"EB Garamond"', 'serif'],
        mono: ['"Courier Prime"', 'monospace']
      }
    }
  },
  plugins: [],
}
