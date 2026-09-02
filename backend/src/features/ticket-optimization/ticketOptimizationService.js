// Provider-agnostic ticket classification. Callers (features/jira's
// /ticket-optimization route, or this feature's own /classify route for
// GitHub-sourced tickets) fetch and normalize tickets themselves, then hand
// the already-fetched, minimized tickets here.

import OpenAI from "openai";

export function buildClassificationPrompt(payload) {
  return `You are a support ticket classification assistant.

Categorize the tickets into:
- L1
- L2
- L3

Definitions:
- L1 = basic/simple issue or simple feature development LIKE "issue in login ui"
- L2 = moderate technical issue
- L3 = advanced/critical issue

Rules:
- If L1, provide one-line solution.
- If L2/L3, no solution needed.
- If a ticket is closed, DO NOT categorize it.

Return ONLY VALID JSON in this format:

{
  "L1": { "count": 0, "tickets": [{ "id": "ticket_id", "solution": "solution text" }] },
  "L2": { "count": 0, "tickets": [{ "id": "ticket_id" }] },
  "L3": { "count": 0, "tickets": [{ "id": "ticket_id" }] }
}

Tickets:
${JSON.stringify(payload, null, 2)}`;
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

const noopLogger = { warn() {} };

// `tickets` is an array of { key, summary, description, priority, status,
// project, dueDate, assignee, comments } — the shared normalized shape used
// by both the Jira and GitHub ticket-optimization flows. Returns the same
// { L1, L2, L3, total } shape the frontend already renders.
export async function classifyTickets(tickets, { log = noopLogger } = {}) {
  const displayByKey = new Map(
    tickets.map((ticket) => [
      ticket.key,
      {
        key: ticket.key,
        summary: ticket.summary || "",
        project: ticket.project || "",
        priority: ticket.priority ?? null,
        status: ticket.status || "",
        dueDate: ticket.dueDate ?? null,
        assignee: ticket.assignee || "Unassigned",
      },
    ])
  );

  const batches = chunkArray(
    tickets.map((ticket) => ({
      id: ticket.key,
      title: ticket.summary || "",
      description: ticket.description || "",
      priority: ticket.priority ?? null,
      state: ticket.status || "",
      comments: ticket.comments || [],
    })),
    25
  );

  const client = new OpenAI({
    apiKey: process.env.AI_GATEWAY_API_KEY || "not-needed",
    baseURL: process.env.AI_GATEWAY_BASE_URL,
  });

  const batchResults = await Promise.all(
    batches.map(async (batch, index) => {
      try {
        const completion = await client.chat.completions.create({
          model: process.env.AI_GATEWAY_MODEL || "gpt-4o-mini",
          messages: [{ role: "user", content: buildClassificationPrompt(batch) }],
          response_format: { type: "json_object" },
        });
        return JSON.parse((completion.choices[0].message.content || "{}").trim());
      } catch (err) {
        log.warn({ err, batchIndex: index }, "Ticket optimization batch failed to classify or parse; skipping its results");
        return null;
      }
    })
  );

  if (batchResults.every((result) => result === null)) {
    throw new Error("AI analysis is temporarily unavailable.");
  }

  const merged = { L1: [], L2: [], L3: [] };
  for (const result of batchResults) {
    if (!result) continue;
    for (const level of ["L1", "L2", "L3"]) {
      const entries = result[level]?.tickets;
      if (Array.isArray(entries)) merged[level].push(...entries);
    }
  }

  // Re-attach each classified ticket's full display fields, matched by
  // id/key. A classified id the model hallucinated (not among the tickets we
  // actually sent) is dropped rather than surfaced broken.
  function attachDisplay(entries) {
    return entries
      .map((entry) => {
        const display = displayByKey.get(entry.id);
        if (!display) {
          log.warn({ ticketId: entry.id }, "Classified ticket id not found among fetched tickets; skipping");
          return null;
        }
        return entry.solution ? { ...display, solution: entry.solution } : display;
      })
      .filter((ticket) => ticket !== null);
  }

  const L1 = attachDisplay(merged.L1);
  const L2 = attachDisplay(merged.L2);
  const L3 = attachDisplay(merged.L3);

  return {
    L1: { count: L1.length, tickets: L1 },
    L2: { count: L2.length, tickets: L2 },
    L3: { count: L3.length, tickets: L3 },
    total: L1.length + L2.length + L3.length,
  };
}
