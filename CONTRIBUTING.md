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
