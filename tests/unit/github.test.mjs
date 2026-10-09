import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publishPost, GitHubError } from '../../src/lib/write/github.ts';

/** A fake GitHub: routes by method + path, records every call. */
function fakeGitHub({ takenBranches = [], failAt } = {}) {
  const calls = [];
  const fetchFn = async (url, init = {}) => {
    const path = new URL(url).pathname.replace('/repos/o/r', '');
    const method = init.method ?? 'GET';
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ method, path, body, auth: init.headers?.Authorization });
    const json = (status, data) => new Response(JSON.stringify(data), { status });
    if (failAt === `${method} ${path}`) return json(403, {});
    if (method === 'GET' && path === '/git/ref/heads/main') return json(200, { object: { sha: 'BASE' } });
    if (method === 'GET' && path === '/git/commits/BASE') return json(200, { tree: { sha: 'BASETREE' } });
    if (method === 'POST' && path === '/git/blobs') return json(201, { sha: `blob${calls.filter((c) => c.path === '/git/blobs').length}` });
    if (method === 'POST' && path === '/git/trees') return json(201, { sha: 'TREE' });
    if (method === 'POST' && path === '/git/commits') return json(201, { sha: 'COMMIT' });
    if (method === 'POST' && path === '/git/refs') return takenBranches.includes(body.ref.replace('refs/heads/', '')) ? json(422, {}) : json(201, {});
    if (method === 'POST' && path === '/pulls') return json(201, { html_url: `https://github.com/o/r/pull/7?head=${body.head}` });
    return json(500, {});
  };
  return { calls, fetchFn };
}

const base = { token: 'tok', repo: 'o/r', base: 'main', branch: 'post/hello', title: 'Add: Hello', files: [
  { path: 'src/content/blog/hello.mdx', content: '# hi' },
  { path: 'src/assets/posts/hello/a.webp', content: 'QUJD', binary: true },
] };

test('commits all files atomically on a new branch and opens a PR', async () => {
  const { calls, fetchFn } = fakeGitHub();
  const out = await publishPost({ ...base, fetchFn });
  assert.equal(out.branch, 'post/hello');
  assert.match(out.url, /pull\/7/);
  assert.deepEqual(calls.map((c) => `${c.method} ${c.path}`), [
    'GET /git/ref/heads/main', 'GET /git/commits/BASE',
    'POST /git/blobs', 'POST /git/blobs', 'POST /git/trees', 'POST /git/commits', 'POST /git/refs', 'POST /pulls',
  ]);
  assert.ok(calls.every((c) => c.auth === 'Bearer tok'));
  const blobs = calls.filter((c) => c.path === '/git/blobs').map((c) => c.body);
  assert.deepEqual(blobs, [{ content: '# hi', encoding: 'utf-8' }, { content: 'QUJD', encoding: 'base64' }]);
  const tree = calls.find((c) => c.path === '/git/trees').body;
  assert.equal(tree.base_tree, 'BASETREE');
  assert.deepEqual(tree.tree.map((t) => t.path), ['src/content/blog/hello.mdx', 'src/assets/posts/hello/a.webp']);
  assert.deepEqual(calls.find((c) => c.path === '/git/commits').body.parents, ['BASE']);
});

test('suffixes the branch name when it is taken', async () => {
  const { fetchFn } = fakeGitHub({ takenBranches: ['post/hello', 'post/hello-2'] });
  assert.equal((await publishPost({ ...base, fetchFn })).branch, 'post/hello-3');
});

test('maps GitHub failures to readable errors', async () => {
  const { fetchFn } = fakeGitHub({ failAt: 'POST /git/blobs' });
  await assert.rejects(publishPost({ ...base, fetchFn }), (e) => e instanceof GitHubError && e.status === 403 && /Contents/.test(e.message));
});
