import { zipSync, strToU8 } from 'fflate';
import { compose, validate, figureMarkup, identFor, slugify, baseName, todayStamp, type ImageItem, type Kind, type Meta, type Rules } from './compose';
import { prepareImage, humanSize, toBase64 } from './images';
import { putImage, deleteImage, clearImages, allImages, readLocal, writeLocal, DRAFT_KEY, TOKEN_KEY } from './storage';
import { publishPost, GitHubError } from './github';

interface Img extends ImageItem { blob: Blob; url: string; order: number }

const SNIPPETS: Record<string, (n: number) => string> = {
  Callout: () => '<Callout kind="tldr">\nOne-paragraph summary.\n</Callout>',
  Sidenote: (n) => `<Sidenote num="${n}">Your aside here.</Sidenote>`,
  Cite: () => '<Cite id="onsager1944" />',
  References: () => "<References ids={['onsager1944']} />",
  Ising: (n) => `<Ising num={${n}} />`,
  PredictReveal: () => '<PredictReveal question="What will happen?" options={[\'A\', \'B\']} answer={0}>\nWhy.\n</PredictReveal>',
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function initStudio(root: HTMLElement) {
  if (root.dataset.ready) return;
  root.dataset.ready = '1';

  const rules = JSON.parse(root.dataset.rules!) as Rules;
  const repo = root.dataset.repo!;
  const branch = root.dataset.branch!;
  const $ = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;

  const f = {
    title: $<HTMLInputElement>('title'), slug: $<HTMLInputElement>('slug'), date: $<HTMLInputElement>('date'),
    tag: $<HTMLSelectElement>('tag'), topics: $<HTMLInputElement>('topics'), status: $<HTMLSelectElement>('status'),
    stage: $<HTMLSelectElement>('stage'), description: $<HTMLTextAreaElement>('description'), draft: $<HTMLInputElement>('draft'),
  };
  const body = $<HTMLTextAreaElement>('content');
  const preview = $('preview');
  const message = $('message');
  const say = (text: string, html = false) => { html ? (message.innerHTML = text) : (message.textContent = text); };

  let images: Img[] = [];
  let slugTouched = false;
  let nextOrder = 0;

  const kind = (): Kind => (root.querySelector<HTMLInputElement>('input[name="kind"]:checked')!.value as Kind);
  const readMeta = (): Meta => ({
    kind: kind(), title: f.title.value, slug: f.slug.value.trim(), date: f.date.value.trim(), tag: f.tag.value, status: f.status.value,
    stage: f.stage.value, topics: f.topics.value, description: f.description.value, draft: f.draft.checked,
  });
  const items = (): ImageItem[] => images.map(({ id, file, ident, alt, caption }) => ({ id, file, ident, alt, caption }));

  // ---------- persistence ----------
  function save() {
    writeLocal(DRAFT_KEY, JSON.stringify({ ...readMeta(), body: body.value, slugTouched }));
  }
  async function restore() {
    f.date.value = todayStamp();
    const raw = readLocal(DRAFT_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        root.querySelectorAll<HTMLInputElement>('input[name="kind"]').forEach((r) => (r.checked = r.value === d.kind));
        for (const k of ['title', 'slug', 'date', 'tag', 'topics', 'status', 'stage', 'description'] as const) if (d[k] != null) f[k].value = d[k];
        f.draft.checked = !!d.draft;
        body.value = d.body ?? '';
        slugTouched = !!d.slugTouched;
      } catch {}
    }
    for (const s of await allImages()) {
      images.push({ id: s.id, file: s.file, ident: s.ident, alt: s.alt, caption: s.caption, blob: s.blob, url: URL.createObjectURL(s.blob), order: s.order });
      nextOrder = Math.max(nextOrder, s.order + 1);
    }
    renderImages();
    refresh();
  }
  const persistImage = (img: Img) => putImage({ id: img.id, file: img.file, ident: img.ident, alt: img.alt, caption: img.caption, blob: img.blob, order: img.order });

  // ---------- derived UI ----------
  function refresh() {
    if (!slugTouched) f.slug.value = slugify(f.title.value);
    $('slug-hint').textContent = f.slug.value ? `/${kind() === 'note' ? 'notes/' : ''}${f.slug.value}/` : '';
    const dl = f.description.value.length;
    $('description-count').textContent = `${dl} characters${dl > 160 ? ' (link previews cut off near 160)' : ''}`;
    const words = body.value.match(/\w+/g)?.length ?? 0;
    $('counter').textContent = `${words} words, ${Math.max(1, Math.ceil(words / 225))} min read`;
    $('images-section').hidden = images.length === 0;
  }

  function showProblems(errors: string[], warnings: string[]) {
    $('errors').innerHTML = errors.map((e) => `<li>${esc(e)}</li>`).join('');
    $('warnings').innerHTML = warnings.map((w) => `<li>${esc(w)}</li>`).join('');
    $('problems').hidden = !errors.length && !warnings.length;
  }
  const check = () => {
    const r = validate(readMeta(), body.value, items(), rules);
    showProblems(r.errors, r.warnings);
    return r;
  };

  // ---------- editor helpers ----------
  function insertAtCursor(text: string, selectInner?: [number, number]) {
    const { selectionStart: a, selectionEnd: b } = body;
    body.setRangeText(text, a, b, 'end');
    if (selectInner) body.setSelectionRange(a + selectInner[0], a + selectInner[1]);
    body.focus();
    onChange();
  }
  function wrap(before: string, after: string, placeholder: string) {
    const { selectionStart: a, selectionEnd: b, value } = body;
    const sel = value.slice(a, b) || placeholder;
    body.setRangeText(before + sel + after, a, b, 'end');
    body.setSelectionRange(a + before.length, a + before.length + sel.length);
    body.focus();
    onChange();
  }
  const figureCount = () => (body.value.match(/<Figure\b/g)?.length ?? 0);
  const noteCount = () => (body.value.match(/<Sidenote\b/g)?.length ?? 0);

  const ACTIONS: Record<string, () => void> = {
    bold: () => wrap('**', '**', 'bold'),
    italic: () => wrap('*', '*', 'italic'),
    code: () => wrap('`', '`', 'code'),
    math: () => wrap('$', '$', 'x^2'),
    h2: () => insertAtCursor('\n\n## Heading\n\n', [5, 12]),
    quote: () => wrap('> ', '', 'quote'),
    link: () => {
      const sel = body.value.slice(body.selectionStart, body.selectionEnd) || 'text';
      insertAtCursor(`[${sel}](https://)`, [sel.length + 3, sel.length + 11]);
    },
  };
  root.querySelector('[role="toolbar"]')!.addEventListener('click', (e) => {
    const act = (e.target as Element).closest<HTMLElement>('[data-act]')?.dataset.act;
    if (act) ACTIONS[act]?.();
  });
  $<HTMLSelectElement>('insert').addEventListener('change', (e) => {
    const sel = e.target as HTMLSelectElement;
    if (sel.value) insertAtCursor(`\n\n${SNIPPETS[sel.value](noteCount() + 1)}\n\n`);
    sel.value = '';
  });

  // ---------- images ----------
  function renderImages() {
    const list = $('images');
    list.innerHTML = images.map((img) => `
      <li class="flex gap-4 items-start border border-hairlineDark bg-[rgb(var(--well))] p-3" data-id="${img.id}">
        <img src="${img.url}" alt="" class="w-24 h-24 object-cover border border-hairlineDark shrink-0" />
        <div class="grow space-y-2 min-w-0">
          <p class="font-mono text-xs text-graphiteLight truncate">${esc(img.file)} <span class="text-terracottaDark">as</span> ${esc(img.ident)} · ${humanSize(img.blob.size)}</p>
          <label class="block font-mono text-xs text-graphiteLight">Alt text (required)
            <input data-field="alt" type="text" value="${esc(img.alt)}" class="mt-1 w-full bg-paperDark border border-controlDark text-inkLight p-2 font-serif text-base focus:border-terracottaDark" placeholder="What the image shows" /></label>
          <label class="block font-mono text-xs text-graphiteLight">Caption (optional)
            <input data-field="caption" type="text" value="${esc(img.caption)}" class="mt-1 w-full bg-paperDark border border-controlDark text-inkLight p-2 font-serif text-base focus:border-terracottaDark" /></label>
          <div class="flex gap-3 font-mono text-xs">
            <button type="button" data-do="insert" class="text-graphiteLight hover:text-terracottaDark cursor-pointer">Insert at cursor</button>
            <button type="button" data-do="remove" class="text-graphiteLight hover:text-terracottaDark cursor-pointer">Remove</button>
          </div>
        </div>
      </li>`).join('');
    refresh();
  }
  const imgFor = (el: Element) => images.find((i) => i.id === el.closest<HTMLElement>('[data-id]')?.dataset.id);

  $('images').addEventListener('input', (e) => {
    const input = e.target as HTMLInputElement;
    const img = imgFor(input);
    const field = input.dataset.field as 'alt' | 'caption' | undefined;
    if (!img || !field) return;
    img[field] = input.value;
    persistImage(img);
    onChange();
  });
  $('images').addEventListener('click', (e) => {
    const t = e.target as Element;
    const img = imgFor(t);
    const action = t.closest<HTMLElement>('[data-do]')?.dataset.do;
    if (!img || !action) return;
    if (action === 'insert') insertAtCursor(`\n\n${figureMarkup(img, figureCount() + 1)}\n\n`);
    if (action === 'remove') {
      URL.revokeObjectURL(img.url);
      images = images.filter((i) => i !== img);
      deleteImage(img.id);
      renderImages();
      onChange();
      say(`Removed ${img.file}.`);
    }
  });

  async function addFiles(files: File[]) {
    const pics = files.filter((f) => f.type.startsWith('image/'));
    if (!pics.length) return;
    for (const file of pics) {
      try {
        let stem = baseName(file.name), n = 2;
        while (images.some((i) => i.file.startsWith(`${stem}.`))) stem = `${baseName(file.name)}-${n++}`;
        const p = await prepareImage(file, stem);
        const ident = identFor(p.file, images.map((i) => i.ident));
        const img: Img = { id: crypto.randomUUID(), file: p.file, ident, alt: '', caption: '', blob: p.blob, url: URL.createObjectURL(p.blob), order: nextOrder++ };
        images.push(img);
        await persistImage(img);
        insertAtCursor(`\n\n${figureMarkup(img, figureCount() + 1)}\n\n`);
        renderImages();
        root.querySelector<HTMLInputElement>(`[data-id="${img.id}"] [data-field="alt"]`)?.focus();
        const big = p.blob.size > 2 * 1024 * 1024 ? ' That is large; consider a smaller source image.' : '';
        say(`Added ${p.file}: ${humanSize(file.size)} to ${humanSize(p.blob.size)}. Describe it in the alt text.${big}`);
      } catch (err) {
        say(`Could not read ${file.name}: ${(err as Error).message}`);
      }
    }
  }
  $<HTMLInputElement>('file-input').addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    addFiles([...(input.files ?? [])]);
    input.value = '';
  });
  const zone = $('dropzone');
  const hint = $('drop-hint');
  for (const ev of ['dragenter', 'dragover'] as const) zone.addEventListener(ev, (e) => {
    if ([...(e.dataTransfer?.types ?? [])].includes('Files')) { e.preventDefault(); hint.hidden = false; }
  });
  for (const ev of ['dragleave', 'drop'] as const) zone.addEventListener(ev, () => (hint.hidden = true));
  zone.addEventListener('drop', (e) => { e.preventDefault(); addFiles([...(e.dataTransfer?.files ?? [])]); });
  body.addEventListener('paste', (e) => {
    const files = [...(e.clipboardData?.files ?? [])];
    if (files.some((f) => f.type.startsWith('image/'))) { e.preventDefault(); addFiles(files); }
  });

  // ---------- preview ----------
  const tabWrite = $('tab-write'), tabPreview = $('tab-preview');
  let previewing = false;
  let previewTimer = 0;
  async function drawPreview() {
    const urls = new Map(images.map((i) => [i.ident, i.url]));
    const { renderPreview } = await import('./preview');
    preview.innerHTML = await renderPreview(body.value, items(), urls);
  }
  function setView(p: boolean) {
    previewing = p;
    tabWrite.setAttribute('aria-selected', String(!p));
    tabPreview.setAttribute('aria-selected', String(p));
    body.hidden = p;
    preview.hidden = !p;
    if (p) { preview.textContent = 'Rendering…'; drawPreview(); } else body.focus();
  }
  tabWrite.addEventListener('click', () => setView(false));
  tabPreview.addEventListener('click', () => setView(true));

  // ---------- change handling ----------
  function onChange() {
    refresh();
    save();
    if (!$('problems').hidden) check(); // keep shown problems current as the author fixes them
    if (previewing) { clearTimeout(previewTimer); previewTimer = window.setTimeout(drawPreview, 250); }
  }
  f.slug.addEventListener('input', () => { slugTouched = f.slug.value !== slugify(f.title.value); });
  root.querySelector('form')!.addEventListener('input', (e) => { if (!(e.target as Element).closest('#images')) onChange(); });
  root.querySelector('form')!.addEventListener('change', (e) => { if (!(e.target as Element).closest('#images, #file-input, #insert')) onChange(); });

  // ---------- output ----------
  const ready = () => {
    const r = check();
    if (r.errors.length) { say('Fix the problems above first.'); $('problems').scrollIntoView({ block: 'nearest' }); return null; }
    return compose(readMeta(), body.value, items());
  };
  const blobOf = (path: string) => images.find((i) => path.endsWith(`/${i.file}`))!.blob;

  $('copy-md').addEventListener('click', async () => {
    const out = ready();
    if (!out) return;
    await navigator.clipboard.writeText(out.markdown);
    say(`Copied. Save it as ${out.path}${out.assets.length ? ` and add the ${out.assets.length} image(s) from the .zip` : ''}.`);
  });

  $('download-zip').addEventListener('click', async () => {
    const out = ready();
    if (!out) return;
    const files: Record<string, Uint8Array> = { [out.path]: strToU8(out.markdown) };
    for (const a of out.assets) files[a.path] = new Uint8Array(await blobOf(a.path).arrayBuffer());
    const url = URL.createObjectURL(new Blob([zipSync(files).slice().buffer as ArrayBuffer], { type: 'application/zip' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${readMeta().slug}.zip`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    say(`Downloaded. Unzip it into the repo root (it contains ${Object.keys(files).join(', ')}), commit and push.`);
  });

  $('open-github').addEventListener('click', () => {
    const out = ready();
    if (!out) return;
    if (out.assets.length) { say('This post has images, which a GitHub link cannot carry. Use "Open pull request" or the .zip.'); return; }
    const url = new URL(`https://github.com/${repo}/new/${branch}/${out.path.replace(/\/[^/]+$/, '')}`);
    url.searchParams.set('filename', out.path.split('/').pop()!);
    url.searchParams.set('value', out.markdown);
    if (url.toString().length > 7000) { say('Too long for a GitHub link. Use "Open pull request", the .zip, or Copy Markdown.'); return; }
    window.open(url.toString(), '_blank', 'noopener');
    say('Opened GitHub. Commit the file there to publish.');
  });

  const token = $<HTMLInputElement>('token');
  const remember = $<HTMLInputElement>('remember');
  const saved = readLocal(TOKEN_KEY);
  if (saved) { token.value = saved; remember.checked = true; }

  let publishing = false;
  async function publish() {
    if (publishing) return;
    const out = ready();
    if (!out) return;
    if (!token.value.trim()) {
      ($('token-panel') as HTMLDetailsElement).open = true;
      token.focus();
      say('Paste a GitHub token first (see "Connect GitHub"), or use the .zip.');
      return;
    }
    publishing = true;
    const btn = $<HTMLButtonElement>('publish-pr');
    btn.disabled = true;
    say('Creating a branch, committing and opening a pull request…');
    try {
      const meta = readMeta();
      const files = [{ path: out.path, content: out.markdown }];
      for (const a of out.assets) files.push({ path: a.path, content: await toBase64(blobOf(a.path)), binary: true } as never);
      const label = meta.kind === 'note' ? 'Note' : 'Post';
      const result = await publishPost({
        token: token.value.trim(), repo, base: branch, branch: `post/${meta.slug}`,
        title: `${label}: ${meta.title.trim()}`,
        body: `Drafted in the /write studio.\n\n- ${out.path}\n${out.assets.map((a) => `- ${a.path}`).join('\n')}`,
        files,
      });
      writeLocal(TOKEN_KEY, remember.checked ? token.value.trim() : null);
      say(`Pull request opened: <a class="underline text-terracottaDark" href="${esc(result.url)}" target="_blank" rel="noopener">${esc(result.url)}</a>. CI will build it; merge when it is green.`, true);
    } catch (err) {
      say(err instanceof GitHubError ? err.message : `Could not reach GitHub: ${(err as Error).message}`);
    } finally {
      publishing = false;
      btn.disabled = false;
    }
  }
  $('publish-pr').addEventListener('click', publish);

  $('clear').addEventListener('click', async () => {
    if (!confirm('Clear the draft and its images from this browser?')) return;
    root.querySelector('form')!.reset();
    f.date.value = todayStamp();
    images.forEach((i) => URL.revokeObjectURL(i.url));
    images = [];
    slugTouched = false;
    writeLocal(DRAFT_KEY, null);
    await clearImages();
    renderImages();
    showProblems([], []);
    if (previewing) setView(false);
    say('Cleared.');
  });

  // ---------- keyboard ----------
  body.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    if (e.key === 'b') { e.preventDefault(); ACTIONS.bold(); }
    else if (e.key === 'i') { e.preventDefault(); ACTIONS.italic(); }
    else if (e.key === 'k') { e.preventDefault(); ACTIONS.link(); }
  });
  root.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save(); say('Draft saved in this browser.'); }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); publish(); }
  });

  restore();
}
