import { classifyTickets } from "./ticketOptimizationService.js";

// Same normalized shape produced by both providers' issue mapping, plus the
// extra fields (comments) ticket classification needs. `key` doubles as the
// id the LLM classifies against and the display key re-attached afterward.
const ticketInputSchema = {
  type: "object",
  required: ["key", "summary", "status"],
  properties: {
    key: { type: "string" },
    summary: { type: "string" },
    description: { type: "string" },
    priority: { type: ["string", "null"] },
    status: { type: "string" },
    project: { type: "string" },
    dueDate: { type: ["string", "null"] },
    assignee: { type: "string" },
    comments: { type: "array", items: { type: "string" } },
  },
};

const classifyBodySchema = {
  type: "object",
  required: ["tickets"],
  properties: {
    tickets: { type: "array", items: ticketInputSchema, minItems: 1 },
  },
};

const optimizedTicketSchema = {
  type: "object",
  properties: {
    key: { type: "string" },
    summary: { type: "string" },
    project: { type: "string" },
    priority: { type: ["string", "null"] },
    status: { type: "string" },
    dueDate: { type: ["string", "null"] },
    assignee: { type: "string" },
    solution: { type: "string" },
  },
};

const optimizationLevelSchema = {
  type: "object",
  properties: {
    count: { type: "integer" },
    tickets: { type: "array", items: optimizedTicketSchema },
  },
};

const ticketOptimizationResponseSchema = {
  type: "object",
  properties: {
    L1: optimizationLevelSchema,
    L2: optimizationLevelSchema,
    L3: optimizationLevelSchema,
    total: { type: "integer" },
  },
};

export default async function ticketOptimizationRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);

  // Provider-agnostic classification — the caller has already fetched and
  // normalized the tickets (from Jira or GitHub) before calling this.
  fastify.post(
    "/classify",
    { schema: { body: classifyBodySchema, response: { 200: ticketOptimizationResponseSchema } } },
    async (request, reply) => {
      try {
        const result = await classifyTickets(request.body.tickets, { log: request.log });
        return result;
      } catch (err) {
        request.log.warn({ err }, "Ticket optimization failed to classify");
        return reply.code(502).send({ error: "AI analysis is temporarily unavailable." });
      }
    }
  );
}
