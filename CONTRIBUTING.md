# Writing for Lazarus

## Frontmatter

Shared by essays (`src/content/blog/`) and notes (`src/content/notes/`). The schema lives in [`src/content.config.ts`](src/content.config.ts); a bad value fails the build with a message naming the file.

| Field | Required | Values |
| --- | --- | --- |
| `title` | yes | text |
| `date` | yes | `YYYY.MM.DD` (also `-` or `/`) |
| `tag` | no, default `LOG` | `TECH` `PHYSICS` `MATH` `HISTORY` `ANIME` `LOG` (edit `TAGS` in [`src/config.ts`](src/config.ts) to add one) |
| `topics` | no | list of free-form topics; they get tag pages and drive related posts |
| `description` | no | one sentence, used in link previews and feeds |
| `status` | no | `speculative`, `working`, `settled` (epistemic status) |
| `stage` | no | `seedling`, `budding`, `evergreen`. Notes default to `seedling` |
| `updated` | no | date of the last meaningful revision |
| `draft` | no | `true` hides it from every list, feed and the search index |

## Components

Import what you use at the top of an `.mdx` file.

```mdx
import Sidenote from '../../components/Sidenote.astro';
import Callout from '../../components/Callout.astro';
import Figure from '../../components/Figure.astro';
import Cite from '../../components/Cite.astro';
import References from '../../components/References.astro';
import Ising from '../../components/explorables/Ising.astro';
import PredictReveal from '../../components/explorables/PredictReveal.astro';
```

- `<Sidenote num="1">...</Sidenote>`: margin note on wide screens, tap-to-reveal on small ones.
- `<Callout kind="tldr | note | warning">...</Callout>`
- `<Figure src alt caption num />`: `alt` is required.
- `<Cite id="onsager1944" />` and `<References ids={['onsager1944']} />`: add entries to [`src/data/references.json`](src/data/references.json).
- `<Ising />` and `<PredictReveal question options answer>...</PredictReveal>`.

## Linking

- Between entries: `[[slug]]` or `[[slug|link text]]`, where `slug` is the filename without extension. The target gains a "Mentioned in" list. Unknown slugs fail the build.
- Math: `$inline$` and `$$display$$`.

## Images

- In `/write`, drop, paste or pick an image. It is resized to 1600px wide and converted to WebP in your browser; give it alt text (required) and an optional caption.
- Images live in `src/assets/posts/<slug>/` and are imported by the post, so Astro optimises them at build time. Reference one by hand like this:

```mdx
import Figure from '../../components/Figure.astro';
import lattice from '../../assets/posts/my-post/lattice.webp';

<Figure src={lattice} alt="Spins at T = 2" caption="A lattice near the critical point" num={1} />
```

- GIFs and SVGs are kept as they are (a canvas would flatten the animation or rasterise the vector).

## Publishing from /write

| Option | Use when | Notes |
| --- | --- | --- |
| Open pull request | You want one click, with CI checking it before it goes live | Needs a [fine-grained token](https://github.com/settings/personal-access-tokens/new) limited to this repo with Contents and Pull requests set to read and write. Commits the post and images to `post/<slug>` in one commit. The token goes only to api.github.com; tick "Remember" to keep it in this browser's storage (unencrypted) |
| Download .zip | No token, or you prefer committing yourself | Unzip into the repo root: it contains `src/content/...` and `src/assets/posts/...` |
| Copy Markdown | Text only, or you are adding images separately | |
| Open in GitHub (text only) | A short post without images | Long posts exceed GitHub's URL limit |

## Adding an explorable

1. Make `src/components/explorables/YourThing.astro`, wrapping its UI in `<Explorable title="..." source="src/components/explorables/YourThing.astro">`.
2. Use [`src/lib/explorable.ts`](src/lib/explorable.ts): `rng(seed)` for deterministic randomness, `readParam`/`writeParam` for URL state, `whileVisible` to pause off-screen work, `prefersReducedMotion()`.
3. Start paused when the visitor prefers reduced motion, and give the `fallback` slot a sentence for no-JavaScript readers.
4. Add a test in `tests/explorables.spec.ts`.

## Before you push

```bash
npm run build && npm test
```

CI runs the same, and the performance budgets in `tests/budget.spec.ts` fail if a change makes every page heavier.
