/**
 * Commit a post and its images to a new branch and open a pull request, using GitHub's Git Data API
 * so everything lands in one atomic commit. The token never leaves the browser except in requests to
 * api.github.com. `fetchFn` is injectable for tests.
 */

export interface FileToCommit {
  path: string;
  /** Text content, or base64 when `binary` is true. */
  content: string;
  binary?: boolean;
}

export interface PublishOptions {
  token: string;
  repo: string;
  /** Branch the pull request targets. */
  base: string;
  /** Preferred name for the new branch. A suffix is added if it already exists. */
  branch: string;
  title: string;
  body?: string;
  files: FileToCommit[];
  fetchFn?: typeof fetch;
}

export class GitHubError extends Error {
  // Plain field instead of a constructor parameter property: Node's type stripping (used by the unit tests) rejects those.
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const explain = (status: number, step: string) => {
  if (status === 401) return 'GitHub rejected the token. Check that it is correct and has not expired.';
  if (status === 403) return 'The token is not allowed to do that. It needs "Contents" and "Pull requests" write access to this repository.';
  if (status === 404) return 'GitHub could not find the repository or branch. Check the token covers this repository.';
  return `GitHub returned ${status} while ${step}.`;
};

export async function publishPost(opts: PublishOptions): Promise<{ url: string; branch: string }> {
  const f = opts.fetchFn ?? fetch;
  const api = `https://api.github.com/repos/${opts.repo}`;
  const headers = {
    Authorization: `Bearer ${opts.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };

  async function call<T>(method: string, path: string, step: string, body?: unknown, okStatuses: number[] = [200, 201]): Promise<T> {
    const res = await f(`${api}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!okStatuses.includes(res.status)) throw new GitHubError(explain(res.status, step), res.status);
    return (await res.json()) as T;
  }

  const ref = await call<{ object: { sha: string } }>('GET', `/git/ref/heads/${opts.base}`, 'reading the base branch');
  const baseSha = ref.object.sha;
  const baseCommit = await call<{ tree: { sha: string } }>('GET', `/git/commits/${baseSha}`, 'reading the base commit');

  const tree: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];
  for (const file of opts.files) {
    const blob = await call<{ sha: string }>('POST', '/git/blobs', `uploading ${file.path}`, {
      content: file.content,
      encoding: file.binary ? 'base64' : 'utf-8',
    });
    tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const newTree = await call<{ sha: string }>('POST', '/git/trees', 'creating the tree', { base_tree: baseCommit.tree.sha, tree });
  const commit = await call<{ sha: string }>('POST', '/git/commits', 'creating the commit', {
    message: opts.title,
    tree: newTree.sha,
    parents: [baseSha],
  });

  // Create the branch; if the name is taken (422), try suffixed names.
  let branch = opts.branch;
  for (let attempt = 0; ; attempt++) {
    const res = await f(`${api}/git/refs`, { method: 'POST', headers, body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }) });
    if (res.status === 201) break;
    if (res.status === 422 && attempt < 5) { branch = `${opts.branch}-${attempt + 2}`; continue; }
    throw new GitHubError(explain(res.status, 'creating the branch'), res.status);
  }

  const pr = await call<{ html_url: string }>('POST', '/pulls', 'opening the pull request', {
    title: opts.title,
    head: branch,
    base: opts.base,
    body: opts.body ?? '',
  });
  return { url: pr.html_url, branch };
}
