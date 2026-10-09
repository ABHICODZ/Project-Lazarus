import { resolveFigures, type ImageItem } from './compose';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = (attrs: string, name: string) => {
  const m = new RegExp(`\\b${name}=(?:\\{("(?:[^"\\\\]|\\\\.)*")\\}|"([^"]*)"|\\{([^}]*)\\})`).exec(attrs);
  if (!m) return undefined;
  return m[1] ? (JSON.parse(m[1]) as string) : (m[2] ?? m[3]);
};

let katexCss: Promise<void> | null = null;
const loadKatexCss = () =>
  (katexCss ??= import('katex/dist/katex.min.css?url').then(({ default: href }) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }));

/**
 * Render a post body as sanitised HTML for the preview pane. MDX components cannot run in the browser, so
 * figures are drawn for real and other components get a labelled stand-in.
 * `urls` maps an image identifier to a blob: URL.
 */
export async function renderPreview(body: string, images: ImageItem[], urls: Map<string, string>): Promise<string> {
  const [{ marked }, { default: DOMPurify }, katex] = await Promise.all([import('marked'), import('dompurify'), import('katex'), loadKatexCss()]);

  let text = resolveFigures(body, images)
    .replace(/^\s*import\s.+from\s+['"].+['"];?\s*$/gm, '');

  text = text.replace(/<Figure\b([^>]*?)\s*\/>/g, (_all, attrs: string) => {
    const src = /\bsrc=\{(\w+)\}/.exec(attrs)?.[1];
    const url = src ? urls.get(src) : undefined;
    if (!url) return `\n\n<span class="pv-component">[Figure: image not found]</span>\n\n`;
    const alt = attr(attrs, 'alt') ?? '';
    const caption = attr(attrs, 'caption');
    const num = attr(attrs, 'num');
    return `\n\n<figure class="pv-figure"><img src="${esc(url)}" alt="${esc(alt)}">${
      caption ? `<figcaption>${num ? `<b>Fig. ${esc(num)}.</b> ` : ''}${esc(caption)}</figcaption>` : ''}</figure>\n\n`;
  });

  text = text
    .replace(/<Callout\b([^>]*)>([\s\S]*?)<\/Callout>/g, (_a, attrs: string, inner: string) => {
      const kind = attr(attrs, 'kind') ?? 'note';
      const label = attr(attrs, 'title') ?? { tldr: 'TL;DR', warning: 'Caution', note: 'Note' }[kind] ?? 'Note';
      return `\n\n<aside class="pv-callout"><b>${esc(label)}</b>\n\n${inner.trim()}\n\n</aside>\n\n`;
    })
    .replace(/<Sidenote\b([^>]*)>([\s\S]*?)<\/Sidenote>/g, (_a, attrs: string, inner: string) =>
      `<span class="pv-note"><sup>[${esc(attr(attrs, 'num') ?? '*')}]</sup> ${esc(inner.trim())}</span>`)
    .replace(/<PredictReveal\b([^>]*)>[\s\S]*?<\/PredictReveal>/g, (_a, attrs: string) =>
      `\n\n<div class="pv-component">Predict first: ${esc(attr(attrs, 'question') ?? '')}</div>\n\n`)
    .replace(/<(Ising|Cite|References)\b[^>]*\/>/g, (_a, name: string) => `<span class="pv-component">[${name}]</span>`);

  // Math: protect it from Markdown (but leave code alone), render after sanitising.
  const math: { src: string; display: boolean }[] = [];
  text = text.replace(/(```[\s\S]*?```|`[^`\n]+`)|\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (whole, code, display, inline) => {
    if (code) return whole;
    math.push({ src: (display ?? inline).trim(), display: display !== undefined });
    return `@@MATH${math.length - 1}@@`;
  });

  const html = marked.parse(text, { gfm: true, async: false }) as string;
  // DOMPurify's default URL allow-list rejects blob: (our uploaded images). Allow that one extra scheme; scripts stay out.
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|blob):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
  return clean.replace(/@@MATH(\d+)@@/g, (_m, i: string) => {
    const { src, display } = math[Number(i)];
    return katex.default.renderToString(src, { displayMode: display, throwOnError: false });
  });
}
