// Thin wrapper around Jira Cloud's REST API using Node's built-in fetch —
// no HTTP client dependency needed. Every call here is server-to-server
// (this backend calling Jira on behalf of the signed-in demo user), never
// exposed directly to the frontend.

export class JiraApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status; // upstream Jira status, or undefined for network errors
  }
}

function normalizeSiteUrl(siteUrl) {
  return siteUrl.replace(/\/+$/, "");
}

function authHeader(email, apiToken) {
  // Demo-only: apiToken is stored in plaintext in the JiraCredential table
  // (see prisma/schema.prisma) rather than encrypted — same tradeoff as the
  // hardcoded JWT secret in plugins/auth.js, not something to fix silently.
  const token = Buffer.from(`${email}:${apiToken}`).toString("base64");
  return `Basic ${token}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Jira Cloud rate-limits bursts of concurrent requests with a 429 — hit
// routinely by anything that fans out across many projects/roles at once
// (see /projects below). Retried with backoff (honoring Retry-After when
// Jira sends one) rather than failing immediately, since a transient 429 is
// not a real error — the request would very likely succeed a moment later.
const MAX_429_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 400;

async function rawFetch(url, email, apiToken, options, errorContext) {
  for (let attempt = 0; ; attempt++) {
    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          Authorization: authHeader(email, apiToken),
          Accept: "application/json",
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
    } catch (err) {
      throw new JiraApiError(`Could not reach Jira at ${errorContext}: ${err.message}`);
    }

    if (response.status === 429 && attempt < MAX_429_RETRIES) {
      const retryAfterSeconds = Number(response.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? retryAfterSeconds * 1000
        : RETRY_BASE_DELAY_MS * 2 ** attempt;
      await sleep(delay);
      continue;
    }

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const body = await response.json();
        detail = body.errorMessages?.[0] || body.message || detail;
      } catch {
        // Jira didn't return a JSON body — fall back to statusText
      }
      throw new JiraApiError(`Jira request failed: ${detail}`, response.status);
    }

    if (response.status === 204) return null;
    return response.json();
  }
}

async function jiraFetch(siteUrl, email, apiToken, path, options = {}) {
  return rawFetch(`${normalizeSiteUrl(siteUrl)}${path}`, email, apiToken, options, siteUrl);
}

// Project role actor URLs come back from Jira as full absolute URLs, not
// paths relative to the site — same auth/error handling as jiraFetch, just
// fetched as-is instead of appended to siteUrl.
function jiraFetchAbsoluteUrl(url, email, apiToken, options = {}) {
  return rawFetch(url, email, apiToken, options, url);
}

export function testConnection(siteUrl, email, apiToken) {
  return jiraFetch(siteUrl, email, apiToken, "/rest/api/3/myself");
}

// Jira's project/search endpoint is paginated (default page size 50) — loop
// until isLast so callers always get the complete project list, not just
// the first page. Returns the combined `values` array directly.
export async function fetchProjects(siteUrl, email, apiToken) {
  const maxResults = 50;
  let startAt = 0;
  let values = [];
  let isLast = false;

  while (!isLast) {
    const data = await jiraFetch(
      siteUrl,
      email,
      apiToken,
      `/rest/api/3/project/search?maxResults=${maxResults}&startAt=${startAt}`
    );
    const page = data.values || [];
    values = values.concat(page);
    isLast = data.isLast ?? true;
    // Advance by the actual page size returned, not the requested maxResults
    // — Jira (like most paginated APIs) may return fewer items than asked
    // for, and advancing by the requested count would skip results.
    if (page.length === 0) break;
    startAt += page.length;
  }

  return values;
}

// GET /project/{key}/role returns { roleName: roleUrl } — one URL per role
// defined on the project (names vary between company-managed and
// team-managed projects, e.g. "Administrators" vs "admin").
function fetchProjectRoles(siteUrl, email, apiToken, projectKey) {
  return jiraFetch(siteUrl, email, apiToken, `/rest/api/3/project/${encodeURIComponent(projectKey)}/role`);
}

function fetchRoleActors(email, apiToken, roleUrl) {
  return jiraFetchAbsoluteUrl(roleUrl, email, apiToken);
}

// Used to filter the project list down to what this Jira account is
// actually a member of (see the /projects route) — true if `accountId`
// appears in the actors of ANY role on the project. Role names differ
// between company-managed and team-managed projects, but every role's
// actor list has the same actorUser.accountId shape, so no special-casing
// is needed. Role checks for a single project run concurrently.
export async function isProjectMember(siteUrl, email, apiToken, projectKey, accountId) {
  const roles = await fetchProjectRoles(siteUrl, email, apiToken, projectKey);
  const roleUrls = Object.values(roles || {});
  const roleActorLists = await Promise.all(
    roleUrls.map((roleUrl) => fetchRoleActors(email, apiToken, roleUrl))
  );
  return roleActorLists.some((roleData) =>
    (roleData?.actors || []).some((actor) => actor.actorUser?.accountId === accountId)
  );
}

// Sprints belong to boards, not projects — this two-step lookup (used by the
// /jira/sprints route) starts here. A single page is enough for this demo;
// project board lists don't get large enough to need pagination like
// project/search does.
export function fetchBoards(siteUrl, email, apiToken, projectKey) {
  const params = new URLSearchParams({ projectKeyOrId: projectKey });
  return jiraFetch(siteUrl, email, apiToken, `/rest/agile/1.0/board?${params.toString()}`);
}

export function fetchSprints(siteUrl, email, apiToken, boardId) {
  return jiraFetch(
    siteUrl,
    email,
    apiToken,
    `/rest/agile/1.0/board/${boardId}/sprint?state=active,future,closed`
  );
}

// Jira Cloud retired POST /rest/api/3/search (410 Gone) in favor of this
// cursor-paginated GET endpoint — see /rest/api/3/search/jql. Pagination is
// via an opaque `nextPageToken` (no more startAt/total offset paging).
export function searchIssues(
  siteUrl,
  email,
  apiToken,
  { jql, maxResults, pageToken, fields = "summary,status,project,assignee,priority,updated,duedate" }
) {
  const params = new URLSearchParams({
    jql,
    maxResults: String(maxResults),
    fields,
  });
  if (pageToken) params.set("nextPageToken", pageToken);

  return jiraFetch(siteUrl, email, apiToken, `/rest/api/3/search/jql?${params.toString()}`);
}

const ISSUE_DETAIL_FIELDS =
  "summary,description,status,priority,project,assignee,reporter,created,updated,duedate,comment";

export function fetchIssue(siteUrl, email, apiToken, issueKey) {
  return jiraFetch(
    siteUrl,
    email,
    apiToken,
    `/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=${ISSUE_DETAIL_FIELDS}`
  );
}

// `adfBody` is a full ADF document (see features/jira/jira.routes.js's
// plainTextToAdf) — Jira's add-comment endpoint takes the same document
// shape it returns when reading comments back, just wrapped as { body: ... }.
export function addComment(siteUrl, email, apiToken, issueKey, adfBody) {
  return jiraFetch(siteUrl, email, apiToken, `/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`, {
    method: "POST",
    body: JSON.stringify({ body: adfBody }),
  });
}
