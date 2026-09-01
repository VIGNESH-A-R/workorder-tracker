import { request } from "../../shared/api/client.js";

export function getJiraCredentials() {
  return request("/jira/credentials");
}

export function saveJiraCredentials(data) {
  return request("/jira/credentials", { method: "PUT", body: JSON.stringify(data) });
}

export function getJiraProjects() {
  return request("/jira/projects");
}

export function getBoards(project) {
  const params = new URLSearchParams({ project });
  return request(`/jira/boards?${params.toString()}`);
}

export function getSprints(project) {
  const params = new URLSearchParams({ project });
  return request(`/jira/sprints?${params.toString()}`);
}

export function getJiraIssues({ project, status, search, sprint, pageToken } = {}) {
  const params = new URLSearchParams();
  if (project) params.set("project", project);
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (sprint) params.set("sprint", sprint);
  if (pageToken) params.set("pageToken", pageToken);

  const query = params.toString();
  return request(`/jira/issues${query ? `?${query}` : ""}`);
}

export function getIssueDetail(key) {
  return request(`/jira/issues/${encodeURIComponent(key)}`);
}

// Sends the already-loaded issue detail object as-is — the backend uses it
// directly rather than re-fetching it from Jira.
export function getIssueAIAnalysis(key, issue) {
  return request(`/jira/issues/${encodeURIComponent(key)}/ai-analysis`, {
    method: "POST",
    body: JSON.stringify({ issue }),
  });
}
