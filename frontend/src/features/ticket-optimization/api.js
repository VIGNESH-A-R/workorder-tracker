import { request } from "../../shared/api/client.js";

export function runTicketOptimization(project, sprint) {
  return request("/jira/ticket-optimization", {
    method: "POST",
    body: JSON.stringify({ project, sprint: sprint || null }),
  });
}
