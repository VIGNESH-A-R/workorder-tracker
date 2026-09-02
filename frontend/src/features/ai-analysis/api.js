import { request } from "../../shared/api/client.js";

// Sends the already-loaded issue detail object as-is (Jira or GitHub, same
// normalized shape) — the backend uses it directly rather than re-fetching
// it from the provider.
export function runAiAnalysis(issue) {
  return request("/ai-analysis/issue", {
    method: "POST",
    body: JSON.stringify({ issue }),
  });
}
