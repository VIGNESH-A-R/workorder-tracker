import { request } from "../../shared/api/client.js";

export function runTicketOptimization(project, sprint) {
  return request("/jira/ticket-optimization", {
    method: "POST",
    body: JSON.stringify({ project, sprint: sprint || null }),
  });
}

// Provider-agnostic classification — the caller has already fetched and
// normalized the tickets (used for GitHub, where there's no project/sprint
// to scope a server-side fetch by).
export function classifyTickets(tickets) {
  return request("/ticket-optimization/classify", {
    method: "POST",
    body: JSON.stringify({ tickets }),
  });
}
