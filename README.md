# Project Lazarus

A minimalist archival blog and digital garden built with **Astro 6**. It is for research notes, working papers and technical explorations: essays you can read, notes that are still growing, and experiments you can break.

Dark and light themes, EB Garamond and Courier Prime, terracotta accents.

## Features

**Reading**
- KaTeX math (`$E = mc^2$`, `$$ ... $$`), Shiki syntax highlighting, self-hosted fonts, linked headings, a scroll-spy table of contents, Tufte-style sidenotes (tap or focus on small screens), a print stylesheet.
- Light and dark themes: follows the OS, remembers your choice, no flash on load.

**Explorables** (in the [Lab](src/pages/lab.astro) and inside essays)
- `<Explorable>` wrapper with model notes, a "view source" link and a "copy link to this state" button.
- An Ising model simulator (Metropolis dynamics, seeded, URL-backed temperature) and a predict-then-reveal widget.
- `<Cite id="..." />` and `<References ids={[...]} />`, backed by [`src/data/references.json`](src/data/references.json).

**Garden**
- Essays (`src/content/blog`) and short notes (`src/content/notes`, default stage "seedling").
- `[[wiki links]]` between any entries, with "Mentioned in" backlinks. A link to a page that does not exist fails the build.
- A Constellation map, a Start here page grouped by growth stage, tag pages, an archive, related posts.

**Discovery and reach**
- Search (Pagefind), loaded on demand; press `/` or `Ctrl/Cmd+K`.
- Per-post share images generated at build time, RSS and JSON Feed, sitemap.
- Optional comments through giscus (see below).

**Quality gates**
- Strict TypeScript (`astro check`), unit tests for the wiki link plugin, Playwright tests for links, RSS, theme, the Lab, explorables, contrast tokens, print styles and performance budgets (JS, CSS, images, layout shift).
- A weekly external link-rot check with Internet Archive suggestions.

## Develop

```bash
npm install
npm run dev
```

Open <http://localhost:4321/Project-Lazarus/>. Search needs a build (`npm run build && npm run preview`) because Pagefind indexes the built HTML.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check, build, then index for search |
| `npm run preview` | Serve the production build |
| `npm test` | Unit tests, then Playwright (run `npm run build` first) |
| `npm run check:links` | Check external links in content |

Preview drafts with `INCLUDE_DRAFTS=1 npm run build`.

## Writing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the frontmatter fields and components. Two ways to publish:

1. **In the browser:** open `/write`, draft, and either open the pre-filled GitHub "new file" page or copy the Markdown.
2. **Locally:** add an `.mdx` file to `src/content/blog/` (essay) or `src/content/notes/` (note) and push to `main`.

## Hosting

Deployed to GitHub Pages by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): pull requests build and test; only `main` deploys. To host elsewhere, set the URL and base path at build time. For example, on a root domain:

```bash
SITE_URL=https://example.com SITE_BASE=/ npm run build
```

Playwright reads `SITE_BASE` too, so the tests follow.

## Comments (optional)

Comments use [giscus](https://giscus.app) and appear only when configured. Enable Discussions on the repo, install the giscus app, then copy `.env.example` to `.env` and fill in `PUBLIC_GISCUS_REPO_ID` and `PUBLIC_GISCUS_CATEGORY_ID` (and add them as repository variables if you build in CI).

## Stack

Astro 6, Tailwind CSS 4 (Vite plugin), MDX, KaTeX, Shiki, Pagefind, Satori + sharp, Playwright. Vite is pinned to 7 so Astro and the Tailwind plugin share one copy.

## License

MIT
