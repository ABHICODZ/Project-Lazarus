/**
 * Pure logic for the /write studio: validate a draft and turn it into the files that go in the repo.
 * No DOM, no network, so it can be unit-tested with `node --test`.
 */

export type Kind = 'essay' | 'note';

export interface Meta {
  kind: Kind;
  title: string;
  slug: string;
  date: string;
  tag: string;
  status: string;
  stage: string;
  topics: string;
  description: string;
  draft: boolean;
}

export interface ImageItem {
  /** Stable id, used as the key in storage. */
  id: string;
  /** File name inside the post's asset folder, e.g. "ising-lattice.webp". */
  file: string;
  /** JS identifier the post imports the image as. */
  ident: string;
  alt: string;
  caption: string;
}

export interface Rules {
  tags: readonly string[];
  statuses: readonly string[];
  stages: readonly string[];
}

/** Components a post can use, and where they live relative to `src/`. */
export const COMPONENTS: Record<string, string> = {
  Sidenote: 'components/Sidenote.astro',
  Callout: 'components/Callout.astro',
  Figure: 'components/Figure.astro',
  Cite: 'components/Cite.astro',
  References: 'components/References.astro',
  Ising: 'components/explorables/Ising.astro',
  PredictReveal: 'components/explorables/PredictReveal.astro',
};

const DATE = /^\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}$/;

export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** A JSON string is a valid YAML double-quoted scalar, and a valid JS string literal. */
const q = (s: string) => JSON.stringify(s);

export const todayStamp = (d = new Date()) =>
  `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

/** "My Pic 1.PNG" -> "my-pic-1" (no extension). */
export const baseName = (name: string) => slugify(name.replace(/\.[^.]+$/, '')) || 'image';

/** A valid JS identifier for an image, unique among `taken`. */
export function identFor(file: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const stem = 'img_' + baseName(file).replace(/-/g, '_');
  let ident = stem;
  for (let i = 2; used.has(ident); i++) ident = `${stem}_${i}`;
  return ident;
}

/**
 * Markup the editor inserts for an image. It only references the image: alt text and caption live in the
 * image tray and are filled in by `resolveFigures`, so editing them there updates every use.
 */
export function figureMarkup(img: ImageItem, num?: number): string {
  return `<Figure src={${img.ident}}${num ? ` num={${num}}` : ''} />`;
}

const FIGURE = /<Figure\b([^>]*?)\s*\/>/g;

/** Fills in `alt` and `caption` on <Figure> tags from the tray, unless the author wrote their own. */
export function resolveFigures(body: string, images: ImageItem[]): string {
  const byIdent = new Map(images.map((i) => [i.ident, i]));
  return body.replace(FIGURE, (whole, attrs: string) => {
    const ident = /\bsrc=\{(\w+)\}/.exec(attrs)?.[1];
    const img = ident ? byIdent.get(ident) : undefined;
    if (!img) return whole;
    let out = attrs.trimEnd();
    if (!/\balt=/.test(out)) out += ` alt={${q(img.alt)}}`;
    if (img.caption && !/\bcaption=/.test(out)) out += ` caption={${q(img.caption)}}`;
    return `<Figure${out.startsWith(' ') ? '' : ' '}${out} />`;
  });
}

/** Every <Figure> tag in a body with its parsed alt text (undefined when absent). */
function figureTags(body: string) {
  return [...body.matchAll(FIGURE)].map((m) => {
    const attrs = m[1];
    const src = /\bsrc=\{(\w+)\}/.exec(attrs)?.[1];
    const alt = /\balt=\{("(?:[^"\\]|\\.)*")\}/.exec(attrs);
    const plain = /\balt="([^"]*)"/.exec(attrs);
    return { src, alt: alt ? (JSON.parse(alt[1]) as string) : plain?.[1] };
  });
}

const usedComponents = (body: string) => Object.keys(COMPONENTS).filter((c) => new RegExp(`<${c}[\\s/>]`).test(body));
const usedImageIdents = (body: string) => [...body.matchAll(/\bsrc=\{(\w+)\}/g)].map((m) => m[1]);

export function validate(meta: Meta, body: string, images: ImageItem[], rules: Rules): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!meta.title.trim()) errors.push('Add a title.');
  if (!meta.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(meta.slug)) errors.push('The slug may only use lowercase letters, numbers and hyphens.');
  if (!DATE.test(meta.date)) errors.push('The date must look like 2026.10.04.');
  if (!rules.tags.includes(meta.tag)) errors.push(`Unknown tag "${meta.tag}".`);
  if (meta.status && !rules.statuses.includes(meta.status)) errors.push(`Unknown status "${meta.status}".`);
  if (meta.stage && !rules.stages.includes(meta.stage)) errors.push(`Unknown stage "${meta.stage}".`);
  if (!body.trim()) errors.push('The post is empty.');

  const byIdent = new Map(images.map((i) => [i.ident, i]));
  const referenced = new Set(usedImageIdents(body).filter((id) => id.startsWith('img_')));
  for (const id of referenced) if (!byIdent.has(id)) errors.push(`The post uses "${id}" but no such image is attached.`);
  for (const tag of figureTags(resolveFigures(body, images))) {
    if (tag.src && byIdent.has(tag.src) && !(tag.alt ?? '').trim()) errors.push(`Add alt text for ${byIdent.get(tag.src)!.file}.`);
  }
  for (const img of images) if (!referenced.has(img.ident)) warnings.push(`${img.file} is attached but not used in the post, so it will not be published.`);
  if (meta.description.length > 160) warnings.push('The description is over 160 characters and may be cut off in link previews.');
  return { errors, warnings };
}

export interface Composed {
  /** Repo path of the post. */
  path: string;
  markdown: string;
  /** Images that are actually referenced, with their repo paths. */
  assets: { path: string; image: ImageItem }[];
}

export function compose(meta: Meta, rawBody: string, images: ImageItem[]): Composed {
  const body = resolveFigures(rawBody, images);
  const dir = meta.kind === 'note' ? 'notes' : 'blog';
  const topics = meta.topics.split(',').map((t) => t.trim()).filter(Boolean);
  const fm = [`title: ${q(meta.title.trim())}`, `date: ${q(meta.date)}`, `tag: ${q(meta.tag)}`];
  if (topics.length) fm.push(`topics: [${topics.map(q).join(', ')}]`);
  if (meta.status) fm.push(`status: ${q(meta.status)}`);
  if (meta.stage) fm.push(`stage: ${q(meta.stage)}`);
  if (meta.description.trim()) fm.push(`description: ${q(meta.description.trim())}`);
  if (meta.draft) fm.push('draft: true');

  const referenced = new Set(usedImageIdents(body));
  const assets = images
    .filter((i) => referenced.has(i.ident))
    .map((image) => ({ path: `src/assets/posts/${meta.slug}/${image.file}`, image }));

  // Add imports, but never duplicate ones the author typed by hand.
  const hasImport = (name: string) => new RegExp(`^\\s*import\\s+${name}\\s+from`, 'm').test(body);
  const imports = [
    ...usedComponents(body).filter((c) => !hasImport(c)).map((c) => `import ${c} from '../../${COMPONENTS[c]}';`),
    ...assets.filter((a) => !hasImport(a.image.ident)).map((a) => `import ${a.image.ident} from '../../assets/posts/${meta.slug}/${a.image.file}';`),
  ];

  const markdown = `---\n${fm.join('\n')}\n---\n\n${imports.length ? imports.join('\n') + '\n\n' : ''}${body.trim()}\n`;
  return { path: `src/content/${dir}/${meta.slug}.mdx`, markdown, assets };
}
