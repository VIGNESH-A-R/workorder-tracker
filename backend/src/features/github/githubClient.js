// Thin wrapper around GitHub's REST API using Node's built-in fetch — no HTTP
// client dependency needed, same approach as features/jira/jiraClient.js.
// Every call here is server-to-server (this backend calling GitHub on behalf
// of the signed-in demo user), never exposed directly to the frontend.

export class GitHubApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status; // upstream GitHub status, or undefined for network errors
  }
}

const GITHUB_API_BASE = "https://api.github.com";

function authHeaders(token) {
  // Demo-only: token is stored in plaintext in the GitHubCredential table
  // (see prisma/schema.prisma) — same tradeoff as JiraCredential.apiToken.
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function rawFetch(url, token, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { ...authHeaders(token), ...options.headers },
    });
  } catch (err) {
    throw new GitHubApiError(`Could not reach GitHub: ${err.message}`);
  }

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.message || detail;
    } catch {
      // GitHub didn't return a JSON body — fall back to statusText
    }
    throw new GitHubApiError(`GitHub request failed: ${detail}`, response.status);
  }

  return response;
}

function githubFetch(path, token, options) {
  return rawFetch(`${GITHUB_API_BASE}${path}`, token, options);
}

export async function testConnection(owner, repo, token) {
  const response = await githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, token);
  return response.json();
}

// Parses the Link response header for a rel="next" URL, per GitHub's
// pagination convention — undefined/null once there is no next page.
function nextPageUrl(linkHeader) {
  if (!linkHeader) return null;
  const nextPart = linkHeader.split(",").find((part) => part.includes('rel="next"'));
  if (!nextPart) return null;
  const match = nextPart.match(/<([^>]+)>/);
  return match ? match[1] : null;
}

// Loops through every page of /repos/{owner}/{repo}/issues via the Link
// header's rel="next" until it's absent, so callers always get the complete
// result set rather than just the first page. Note: GitHub's issues endpoint
// also returns pull requests mixed in — callers must filter those out.
export async function fetchAllIssues(owner, repo, token, state) {
  let items = [];
  let url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=${encodeURIComponent(state)}&per_page=50&page=1`;

  while (url) {
    const response = await rawFetch(url, token);
    const page = await response.json();
    items = items.concat(page);
    url = nextPageUrl(response.headers.get("link"));
  }

  return items;
}

export async function fetchIssue(owner, repo, token, number) {
  const response = await githubFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${encodeURIComponent(number)}`,
    token
  );
  return response.json();
}

export async function fetchIssueComments(owner, repo, token, number) {
  const response = await githubFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${encodeURIComponent(number)}/comments`,
    token
  );
  return response.json();
}

export async function postIssueComment(owner, repo, token, number, body) {
  const response = await githubFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${encodeURIComponent(number)}/comments`,
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    }
  );
  return response.json();
}

// Loops through every page of /repos/{owner}/{repo}/branches — same
// rel="next" pagination as fetchAllIssues, so a matching branch is never
// missed just because it's past the first page.
export async function fetchBranches(owner, repo, token) {
  let items = [];
  let url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=100&page=1`;

  while (url) {
    const response = await rawFetch(url, token);
    const page = await response.json();
    items = items.concat(page);
    url = nextPageUrl(response.headers.get("link"));
  }

  return items;
}

// Commits unique to `head` since it diverged from `base` — unlike
// GET /commits?sha=, which returns the branch's ENTIRE history (everything
// already on the base branch too), the compare endpoint's `.commits` array
// is just the delta. `.commits` is always an array (empty when `head` has no
// commits ahead of `base` yet — a normal, expected state, not an error).
export async function compareCommits(owner, repo, token, base, head) {
  const response = await githubFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`,
    token
  );
  return response.json();
}

export async function fetchPullRequests(owner, repo, token, { state = "all", perPage = 50 } = {}) {
  const params = new URLSearchParams({ state, per_page: String(perPage) });
  const response = await githubFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?${params.toString()}`,
    token
  );
  return response.json();
}

// A PR's own commits — stable regardless of merge status or whether its
// branch still exists (unlike comparing live against main, which goes to
// zero once a PR merges, since its commits become part of main's history).
export async function fetchPullRequestCommits(owner, repo, token, pullNumber) {
  const response = await githubFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${encodeURIComponent(pullNumber)}/commits?per_page=100`,
    token
  );
  return response.json();
}
