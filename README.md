# Project Lazarus

A highly experimental, minimalist archival blog built with **Astro**. Tailored specifically for research notes, working papers, and technical explorations. 

Designed with an "Archival Dark Mode" aesthetic, the architecture completely side-steps traditional CMS bloat in favor of Git-backed MDX, high-performance canvas experiments, and mathematical text layout engines.

---

## ✦ Features

- **Archival Aesthetic:** A stark, ultra-minimalist dark mode utilizing EB Garamond and Courier Prime, accented by deep terracotta (`#C85A48`).
- **The Lab:** A dedicated route for interactive experiments:
  - **Quantum Lattice:** A lightweight, interactive HTML5 canvas particle field.
  - **Kinetic Engine:** A DOM-less text layout engine using Meta's [`@chenglou/pretext`](https://github.com/chenglou/pretext) mathematically combined with `anime.js` to create a staggered, matrix-style typography swarm.
- **Tufte-Style Sidenotes:** A custom `<Sidenote>` MDX component that smartly injects references into the right-hand margin on desktop, and collapses into interactive tooltips on mobile.
- **Serverless Editor (`/write`):** A custom built-in interface that allows you to draft essays in the browser, auto-generating markdown frontmatter, and seamlessly piping the payload directly into the GitHub Web Editor for instant publishing.
- **Astro ViewTransitions:** Zero-reload SPA-like navigation across the entire site.

- **Typeset for reading:** KaTeX math (`$E=mc^2$`, `$$ ... $$`), Shiki syntax highlighting with light/dark themes, self-hosted fonts, auto-linked headings, a scroll-spy table of contents, and a drop cap.
- **Light & dark themes:** follows the OS by default, with a persistent toggle and no flash on load.
- **Discovery:** tag pages, a year-by-year archive, related posts, prev/next navigation, a sitemap and RSS.
- **Components:** `<Sidenote>`, `<Figure>`, `<Callout kind="tldr|note|warning">`.
- **Epistemic status:** add `status: speculative | working | settled` to a post's frontmatter.

## ✦ Tech Stack

- **Framework:** [Astro](https://astro.build/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Content:** Markdown / MDX (with Astro Content Collections)
- **Animation:** [Anime.js](https://animejs.com/)
- **Layout Engine:** [Pretext](https://github.com/chenglou/pretext)
- **Deployment:** GitHub Pages (Automated via GitHub Actions)

## ✦ Local Development

To run this project locally on your machine and experiment with the source code:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ABHICODZ/Project-Lazarus.git
   cd Project-Lazarus
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:4321/Project-Lazarus/`. The local server features instantaneous Hot-Module Replacement (HMR).

## ✦ Writing a Post

There are two ways to publish a new transmission:

1. **Via the Web:** Navigate to `/write` on the live site to use the bespoke editor. It will compile your markdown and open a GitHub PR/Commit screen automatically.
2. **Via Local Editor:** Create a new `.mdx` file inside `src/content/blog/`. Add the required frontmatter (`title`, `date`, `tag`, `description`; optional `topics`, `status`, `draft`) and push your changes to the `main` branch. GitHub Actions will automatically rebuild and deploy the site in under 60 seconds.

## ✦ License

MIT
