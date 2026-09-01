import OpenAI from "openai";

// The frontend sends the full issue detail object it already has loaded
// (from either GET /jira/issues/:key or GET /github/issues/:number, both in
// the same normalized shape) — this route never re-fetches it from the
// provider, so the body schema is deliberately permissive on shape;
// summary/status presence is checked by hand in the route instead of via a
// stricter JSON schema.
const aiAnalysisBodySchema = {
  type: "object",
  required: ["issue"],
  properties: {
    issue: { type: "object" },
  },
};

const aiAnalysisResponseSchema = {
  type: "object",
  properties: {
    html: { type: "string" },
  },
};

function buildAiAnalysisPrompt(issue) {
  return `IMPORTANT:
Do NOT think step-by-step.
Do NOT output reasoning.
Do NOT output analysis.
Do NOT output <think> tags.
Respond ONLY with the final HTML output. No markdown, no explanation.

You are an AI ticket analysis assistant.

Analyze the given ticket JSON and generate a concise, professional summary
formatted as HTML styled with Tailwind CSS utility classes, that can be directly
rendered inside an existing web app (Tailwind is already loaded on the page).

Your summary must identify:
- Main task or issue
- Current status
- Priority level
- Assignee (or note if unassigned)
- Reporter
- Important blockers, failures, escalations, or risks
- Recent activity (from comments, if present)
- Due date (flag if it's in the past and still not resolved)

Rules:
- Use Tailwind utility classes for styling (rounded-lg, border, shadow-sm, p-4,
  bg-slate-50, text-slate-900, and small colored pill/badge spans for status and
  priority — bg-red-100 text-red-700 for high priority, bg-amber-100 text-amber-700
  for medium, bg-slate-100 text-slate-600 for low, similar tones for status).
  Do NOT use Bootstrap classes (card, badge, list-group, etc.) — they are not
  available on this page.
- Keep content short and human-readable.
- Focus only on important operational details. Ignore internal IDs and metadata.
- Mention deployment failures, escalations, approvals, delays, or dependencies if
  present in the description or comments.
- Output ONLY the HTML fragment (no <html>, <head>, or <body> tags — just a <div>
  with Tailwind classes).
- Maximum 12 content lines.

Expected output structure (example):
<div class="rounded-lg border border-slate-200 shadow-sm bg-white">
  <div class="px-4 py-2 bg-orange-500 text-white rounded-t-lg font-semibold">Issue Title</div>
  <div class="p-4">
    <p class="mb-2">
      <span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">High Priority</span>
      <span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">In Progress</span>
    </p>
    <ul class="divide-y divide-slate-100 text-sm">
      <li class="py-1.5"><strong>Assignee:</strong> ...</li>
      <li class="py-1.5"><strong>Reporter:</strong> ...</li>
      <li class="py-1.5"><strong>Summary:</strong> ...</li>
      <li class="py-1.5"><strong>Risks/Blockers:</strong> ...</li>
      <li class="py-1.5"><strong>Recent Activity:</strong> ...</li>
    </ul>
  </div>
</div>

Here is the ticket JSON:
${JSON.stringify(issue, null, 2)}

Output:`;
}

export default async function aiAnalysisRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.post(
    "/issue",
    { schema: { body: aiAnalysisBodySchema, response: { 200: aiAnalysisResponseSchema } } },
    async (request, reply) => {
      const { issue } = request.body;
      if (!issue?.summary || !issue?.status) {
        return reply.code(400).send({ error: "issue must include at least a summary and status." });
      }

      const client = new OpenAI({
        apiKey: process.env.AI_GATEWAY_API_KEY || "not-needed",
        baseURL: process.env.AI_GATEWAY_BASE_URL,
      });

      try {
        const completion = await client.chat.completions.create({
          model: process.env.AI_GATEWAY_MODEL || "gpt-4o-mini",
          messages: [{ role: "user", content: buildAiAnalysisPrompt(issue) }],
        });

        const raw = completion.choices[0].message.content || "";
        // Defensive strip — the prompt already forbids <think> blocks, but
        // some models emit them anyway.
        const html = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

        return { html };
      } catch (err) {
        request.log.warn({ err }, "AI gateway call failed for issue ai-analysis");
        return reply.code(502).send({ error: "AI analysis is temporarily unavailable." });
      }
    }
  );
}
