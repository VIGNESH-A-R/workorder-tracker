// Jira keys look like "PROJ-123" and GitHub keys are always exactly
// `#${number}` (see backend features/github/github.routes.js's mapIssue) —
// the two namespaces never collide, so a leading "#" reliably identifies a
// GitHub-sourced issue/ticket without needing a separate "source" prop
// threaded through every card. Route params can't carry a literal "#", so
// GitHub issues are addressed as "gh-<number>" instead.
export function issueDetailPath(key) {
  if (key.startsWith("#")) {
    return `/issues/gh-${encodeURIComponent(key.slice(1))}`;
  }
  return `/issues/${encodeURIComponent(key)}`;
}

// Inverse of the encoding above — given the ":key" route param, returns
// { source, id } where id is the Jira key or the GitHub issue number.
export function parseIssueRouteKey(routeKey) {
  if (routeKey.startsWith("gh-")) {
    return { source: "github", id: routeKey.slice(3) };
  }
  return { source: "jira", id: routeKey };
}
