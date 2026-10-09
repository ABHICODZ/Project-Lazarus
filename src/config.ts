/** Site-wide constants shared by pages, scripts and the content schema. */
export const REPO = 'ABHICODZ/Project-Lazarus';
export const BRANCH = 'main';
export const TAGS = ['TECH', 'PHYSICS', 'MATH', 'HISTORY', 'ANIME', 'LOG'] as const;
export const STATUSES = ['speculative', 'working', 'settled'] as const;
export const STAGES = ['seedling', 'budding', 'evergreen'] as const;

/**
 * Comments via giscus (GitHub Discussions). Enable Discussions on the repo, install the giscus app,
 * then copy the two IDs from https://giscus.app into .env as PUBLIC_GISCUS_REPO_ID / PUBLIC_GISCUS_CATEGORY_ID.
 * With either missing the comments section is simply not rendered.
 */
export const GISCUS = {
  repo: REPO,
  repoId: import.meta.env.PUBLIC_GISCUS_REPO_ID as string | undefined,
  category: (import.meta.env.PUBLIC_GISCUS_CATEGORY as string | undefined) ?? 'Announcements',
  categoryId: import.meta.env.PUBLIC_GISCUS_CATEGORY_ID as string | undefined,
};
