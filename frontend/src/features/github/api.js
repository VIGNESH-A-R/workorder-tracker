import { request } from "../../shared/api/client.js";

export function getGitHubCredentials() {
  return request("/github/credentials");
}

export function saveGitHubCredentials(data) {
  return request("/github/credentials", { method: "PUT", body: JSON.stringify(data) });
}

export function getGitHubIssues(state = "open", search) {
  const params = new URLSearchParams({ state });
  if (search) params.set("search", search);
  return request(`/github/issues?${params.toString()}`);
}

export function getGitHubIssue(number) {
  return request(`/github/issues/${encodeURIComponent(number)}`);
}

export function getDevActivity(number) {
  return request(`/github/dev-activity/${encodeURIComponent(number)}`);
}
