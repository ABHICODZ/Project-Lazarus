import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compose, validate, slugify, identFor, figureMarkup, resolveFigures, baseName, todayStamp } from '../../src/lib/write/compose.ts';

const rules = { tags: ['TECH', 'PHYSICS', 'LOG'], statuses: ['speculative', 'working', 'settled'], stages: ['seedling', 'budding', 'evergreen'] };
const meta = (over = {}) => ({ kind: 'essay', title: 'Why Magnets "Forget"', slug: 'why-magnets-forget', date: '2026.10.10', tag: 'PHYSICS', status: '', stage: '', topics: '', description: '', draft: false, ...over });
const img = (over = {}) => ({ id: '1', file: 'lattice.webp', ident: 'img_lattice', alt: 'A lattice', caption: 'Spins at T = 2', ...over });

test('slugify and baseName', () => {
  assert.equal(slugify('  The End of History! '), 'the-end-of-history');
  assert.equal(baseName('My Pic 1.PNG'), 'my-pic-1');
  assert.equal(baseName('....png'), 'image');
});

test('todayStamp zero-pads', () => assert.equal(todayStamp(new Date(2026, 0, 5)), '2026.01.05'));

test('identFor is a valid identifier and unique', () => {
  assert.equal(identFor('My Pic-1.png', []), 'img_my_pic_1');
  assert.equal(identFor('a.png', ['img_a', 'img_a_2']), 'img_a_3');
});

test('frontmatter quotes titles safely and includes optional fields only when set', () => {
  const { markdown } = compose(meta({ topics: 'phase transitions, Ising', status: 'working', description: 'Short.' }), 'Hello', []);
  assert.match(markdown, /^---\ntitle: "Why Magnets \\"Forget\\""\n/);
  assert.match(markdown, /topics: \["phase transitions", "Ising"\]/);
  assert.match(markdown, /status: "working"/);
  assert.ok(!markdown.includes('stage:'));
  assert.ok(!markdown.includes('draft:'));
  assert.equal(compose(meta({ draft: true }), 'x', []).markdown.includes('draft: true'), true);
});

test('notes go to the notes folder, essays to blog', () => {
  assert.equal(compose(meta({ kind: 'note' }), 'x', []).path, 'src/content/notes/why-magnets-forget.mdx');
  assert.equal(compose(meta(), 'x', []).path, 'src/content/blog/why-magnets-forget.mdx');
});

test('imports are added for used components and images, and not duplicated', () => {
  const i = img();
  const body = `Text <Sidenote num="1">n</Sidenote>\n\n${figureMarkup(i, 1)}`;
  const { markdown, assets } = compose(meta(), body, [i]);
  assert.match(markdown, /import Sidenote from '\.\.\/\.\.\/components\/Sidenote\.astro';/);
  assert.match(markdown, /import Figure from '\.\.\/\.\.\/components\/Figure\.astro';/);
  assert.match(markdown, /import img_lattice from '\.\.\/\.\.\/assets\/posts\/why-magnets-forget\/lattice\.webp';/);
  assert.deepEqual(assets.map((a) => a.path), ['src/assets/posts/why-magnets-forget/lattice.webp']);

  const typed = `import Sidenote from '../../components/Sidenote.astro';\n<Sidenote num="1">n</Sidenote>`;
  assert.equal([...compose(meta(), typed, []).markdown.matchAll(/import Sidenote/g)].length, 1);
});

test('unreferenced images are not published and produce a warning', () => {
  const unused = img({ ident: 'img_unused', file: 'unused.webp' });
  assert.equal(compose(meta(), 'no figures', [unused]).assets.length, 0);
  assert.match(validate(meta(), 'no figures', [unused], rules).warnings[0], /unused\.webp.*not used/);
});

test('figureMarkup only references the image; resolveFigures fills alt and caption from the tray', () => {
  const i = img({ alt: 'He said "hi"', caption: '' });
  assert.equal(figureMarkup(i, 2), '<Figure src={img_lattice} num={2} />');
  assert.equal(resolveFigures(figureMarkup(i, 2), [i]), '<Figure src={img_lattice} num={2} alt={"He said \\"hi\\""} />');
  const withCaption = img({ caption: 'Spins' });
  assert.match(resolveFigures('<Figure src={img_lattice} />', [withCaption]), /alt=\{"A lattice"\} caption=\{"Spins"\} \/>$/);
});

test('editing alt in the tray changes the published markup, and hand-written alt wins', () => {
  const i = img({ alt: 'new alt' });
  assert.match(compose(meta(), figureMarkup(i, 1), [i]).markdown, /alt=\{"new alt"\}/);
  assert.match(compose(meta(), '<Figure src={img_lattice} alt="mine" />', [i]).markdown, /alt="mine"/);
  assert.ok(!compose(meta(), '<Figure src={img_lattice} alt="mine" />', [i]).markdown.includes('new alt'));
});

test('validate mirrors the content schema', () => {
  const bad = validate(meta({ title: ' ', slug: 'Bad Slug', date: '10/10/2026', tag: 'NOPE', status: 'maybe' }), '', [], rules).errors;
  assert.ok(bad.some((e) => /title/i.test(e)));
  assert.ok(bad.some((e) => /slug/i.test(e)));
  assert.ok(bad.some((e) => /date/i.test(e)));
  assert.ok(bad.some((e) => /tag/i.test(e)));
  assert.ok(bad.some((e) => /status/i.test(e)));
  assert.ok(bad.some((e) => /empty/i.test(e)));
  assert.deepEqual(validate(meta(), 'ok', [], rules).errors, []);
});

test('validate requires alt text and an attached image for every figure', () => {
  const noAlt = img({ alt: '  ' });
  assert.ok(validate(meta(), figureMarkup(noAlt), [noAlt], rules).errors.some((e) => /alt text/i.test(e)));
  assert.deepEqual(validate(meta(), figureMarkup(img()), [img()], rules).errors, []);
  assert.deepEqual(validate(meta(), '<Figure src={img_lattice} alt="by hand" />', [noAlt], rules).errors, []);
  assert.ok(validate(meta(), '<Figure src={img_ghost} alt={"x"} />', [], rules).errors.some((e) => /img_ghost/.test(e)));
});

test('long descriptions warn but do not block', () => {
  const r = validate(meta({ description: 'x'.repeat(170) }), 'ok', [], rules);
  assert.deepEqual(r.errors, []);
  assert.equal(r.warnings.length, 1);
});
