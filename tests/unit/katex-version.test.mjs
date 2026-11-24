import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Published pages are rendered by rehype-katex (its own katex) but styled by our katex stylesheet. If the two
 * versions differ, class names can drift (0.19 renamed .stretchy), which silently breaks things like \boxed.
 */
function katexCopies(dir = 'node_modules', found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    const path = join(dir, entry.name);
    if (entry.name === 'katex') {
      const pkg = join(path, 'package.json');
      if (existsSync(pkg) && JSON.parse(readFileSync(pkg, 'utf8')).name === 'katex') found.push({ path, version: JSON.parse(readFileSync(pkg, 'utf8')).version });
    }
    if (entry.name === 'node_modules' || entry.name.startsWith('@') || dir === 'node_modules') {
      // Only descend into scoped folders and nested node_modules; a full walk of the tree is not needed.
      if (entry.name.startsWith('@') || entry.name === 'node_modules') katexCopies(path, found);
      else if (dir === 'node_modules' && existsSync(join(path, 'node_modules'))) katexCopies(join(path, 'node_modules'), found);
    }
  }
  return found;
}

test('exactly one version of katex is installed', () => {
  const copies = katexCopies();
  const versions = [...new Set(copies.map((c) => c.version))];
  assert.ok(copies.length >= 1, 'katex should be installed');
  assert.equal(versions.length, 1, `katex versions differ: ${copies.map((c) => `${c.path}@${c.version}`).join(', ')}`);
});
