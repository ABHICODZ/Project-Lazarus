import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import remarkWikiLinks, { parseWikiLinks, collectTargets } from '../../plugins/wikilinks.mjs';

const fixture = () => {
  const root = mkdtempSync(join(tmpdir(), 'lazarus-'));
  mkdirSync(join(root, 'blog')); mkdirSync(join(root, 'notes'));
  writeFileSync(join(root, 'blog', 'big-essay.mdx'), '');
  writeFileSync(join(root, 'notes', 'tiny-note.md'), '');
  return root;
};
const text = (value) => ({ type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', value }] }] });

test('parseWikiLinks reads targets and optional labels', () => {
  assert.deepEqual(parseWikiLinks('a [[x]] b [[y|why]] c'), [{ target: 'x', label: undefined }, { target: 'y', label: 'why' }]);
  assert.deepEqual(parseWikiLinks('no links, only [brackets]'), []);
});

test('collectTargets maps essays to the root and notes to /notes/', () => {
  const t = collectTargets(fixture());
  assert.equal(t.get('big-essay'), '');
  assert.equal(t.get('tiny-note'), 'notes/');
});

test('plugin rewrites links with the base path and keeps surrounding text', () => {
  const tree = text('see [[big-essay]] and [[tiny-note|a note]] now');
  remarkWikiLinks({ base: '/Site', root: fixture() })(tree, { path: 'x.md' });
  const kids = tree.children[0].children;
  assert.deepEqual(kids.map((k) => k.type), ['text', 'link', 'text', 'link', 'text']);
  assert.equal(kids[1].url, '/Site/big-essay/');
  assert.equal(kids[3].url, '/Site/notes/tiny-note/');
  assert.equal(kids[3].children[0].value, 'a note');
  assert.equal(kids[4].value, ' now');
});

test('plugin fails the build on an unknown target and names the file', () => {
  assert.throws(
    () => remarkWikiLinks({ base: '', root: fixture() })(text('[[nope]]'), { path: 'src/content/blog/post.mdx' }),
    /Unknown wiki link \[\[nope\]\] in src\/content\/blog\/post\.mdx/,
  );
});

test('target matching ignores case', () => {
  const tree = text('[[Big-Essay]]');
  remarkWikiLinks({ base: '', root: fixture() })(tree, {});
  assert.equal(tree.children[0].children[0].url, '/big-essay/');
});
