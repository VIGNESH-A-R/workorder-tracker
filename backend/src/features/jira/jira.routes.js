import {
  JiraApiError,
  fetchBoards,
  fetchIssue,
  fetchProjects,
  fetchSprints,
  isProjectMember,
  searchIssues,
  testConnection,
} from "./jiraClient.js";
import { classifyTickets } from "../ticket-optimization/ticketOptimizationService.js";

const CREDENTIALS_ID = 1; // single-row table — see prisma/schema.prisma
const ISSUES_PAGE_SIZE = 25;

const credentialsResponseSchema = {
  type: "object",
  properties: {
    siteUrl: { type: ["string", "null"] },
    email: { type: ["string", "null"] },
    connected: { type: "boolean" },
  },
};

const projectSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    key: { type: "string" },
    name: { type: "string" },
  },
};

const boardSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    type: { type: "string" },
  },
};

const sprintSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    state: { type: "string" },
  },
};

const issueSchema = {
  type: "object",
  properties: {
    key: { type: "string" },
    summary: { type: "string" },
    project: { type: "string" },
    status: { type: "string" },
    assignee: { type: ["string", "null"] },
    priority: { type: ["string", "null"] },
    updated: { type: ["string", "null"] },
    dueDate: { type: ["string", "null"] },
  },
};

const issueDetailSchema = {
  type: "object",
  properties: {
    key: { type: "string" },
    summary: { type: "string" },
    description: { type: "string" },
    status: { type: "string" },
    priority: { type: ["string", "null"] },
    project: { type: "string" },
    assignee: { type: ["string", "null"] },
    reporter: { type: ["string", "null"] },
    created: { type: ["string", "null"] },
    updated: { type: ["string", "null"] },
    dueDate: { type: ["string", "null"] },
    comments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          author: { type: "string" },
          body: { type: "string" },
          created: { type: ["string", "null"] },
        },
      },
    },
  },
};

// A sprint selection is required, not optional — without it, "all open
// tickets in the project" can be thousands of tickets on a real Jira
// instance, which both takes far too long to fetch and fans out into far
// too many concurrent AI classification batches. Scoping to one sprint
// keeps the ticket count (and batch count) small enough to run in a
// reasonable time.
const ticketOptimizationBodySchema = {
  type: "object",
  required: ["project", "sprint"],
  properties: {
    project: { type: "string" },
    sprint: { type: ["integer", "string"] },
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

// Escapes a value dropped into a double-quoted JQL string literal.
function jqlEscape(value) {
  return value.replace(/["\\]/g, "\\$&");
}

// Jira requires every /search/jql query to be "bounded" — restricted by one
// of a specific set of clauses (project, issuekey, id, updated, created).
// status and text ~ "..." are real filters but neither bounds a query on
// their own, so an unbounded query (no project picked) always gets an
// `updated >= -90d` clause to satisfy that requirement; a project filter
// already bounds the query on its own and takes priority when present.
function buildJql({ project, status, search, sprint }) {
  const clauses = [];
  if (project) {
    clauses.push(`project = "${jqlEscape(project)}"`);
  } else {
    clauses.push("updated >= -90d");
  }
  if (status) clauses.push(`status = "${jqlEscape(status)}"`);
  if (search) clauses.push(`text ~ "${jqlEscape(search)}*"`);
  // sprint is an additional filter, not a bounding clause — project or the
  // updated >= -90d fallback above still governs bounding. Not quoted (sprint
  // ids are numeric), so validate it looks like one before interpolating.
  if (sprint && /^\d+$/.test(String(sprint))) clauses.push(`sprint = ${sprint}`);

  return `${clauses.join(" AND ")} ORDER BY updated DESC`;
}

function mapIssue(issue) {
  return {
    key: issue.key,
    summary: issue.fields.summary || "",
    project: issue.fields.project?.name || issue.fields.project?.key || "",
    status: issue.fields.status?.name || "",
    assignee: issue.fields.assignee?.displayName || null,
    priority: issue.fields.priority?.name || null,
    updated: issue.fields.updated || null,
    dueDate: issue.fields.duedate || null,
  };
}

// Jira's description and comment bodies are Atlassian Document Format (ADF)
// JSON, not plain text. This is a minimal walker — not a full ADF renderer —
// that recursively joins text nodes and adds a newline after block-level
// nodes (paragraphs, list items, headings, ...) and explicit hard breaks, so
// a description/comment reads naturally as plain text for this demo's UI.
const ADF_BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "codeBlock",
  "listItem",
  "bulletList",
  "orderedList",
  "rule",
  "panel",
]);

function adfNodeToText(node) {
  if (!node || typeof node !== "object") return "";
  if (node.type === "text") return node.text || "";
  if (node.type === "hardBreak") return "\n";

  const childText = (node.content || []).map(adfNodeToText).join("");
  return ADF_BLOCK_TYPES.has(node.type) ? `${childText}\n` : childText;
}

function adfToPlainText(doc) {
  if (!doc) return "";
  if (typeof doc === "string") return doc; // defensive: already plain text
  return adfNodeToText(doc)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function mapIssueDetail(issue) {
  const fields = issue.fields || {};
  return {
    key: issue.key,
    summary: fields.summary || "",
    description: adfToPlainText(fields.description),
    status: fields.status?.name || "",
    priority: fields.priority?.name || null,
    project: fields.project?.name || fields.project?.key || "",
    assignee: fields.assignee?.displayName || null,
    reporter: fields.reporter?.displayName || null,
    created: fields.created || null,
    updated: fields.updated || null,
    dueDate: fields.duedate || null,
    comments: (fields.comment?.comments || []).map((comment) => ({
      author: comment.author?.displayName || "Unknown",
      body: adfToPlainText(comment.body),
      created: comment.created || null,
    })),
  };
}

// Fields requested from Jira's search/jql endpoint for ticket optimization.
// "project" isn't strictly needed for classification, but is included so
// mapIssueForOptimization can attribute each ticket back to its project name
// without a second fetch.
const TICKET_OPTIMIZATION_FIELDS = "summary,description,priority,status,duedate,assignee,comment,project";

// Always bounded by project AND sprint (both required in the request body,
// validated by the route before calling this) plus an explicit exclusion of
// Done tickets — the classification prompt itself also refuses to
// categorize closed tickets, but excluding them here means they're never
// sent to the AI gateway at all. sprint is not quoted (sprint ids are
// numeric) — the caller has already validated it looks like one.
function buildTicketOptimizationJql({ project, sprint }) {
  return `project = "${jqlEscape(project)}" AND sprint = ${sprint} AND status != "Done" ORDER BY updated DESC`;
}

// Maps a fetched Jira issue to the shared, provider-agnostic shape consumed
// by ticket-optimization/ticketOptimizationService.js's classifyTickets —
// same idea as mapIssueDetail, but including the comment bodies
// classification needs.
function mapIssueForOptimization(issue) {
  const fields = issue.fields || {};
  return {
    key: issue.key,
    summary: fields.summary || "",
    description: adfToPlainText(fields.description),
    priority: fields.priority?.name || null,
    status: fields.status?.name || "",
    project: fields.project?.name || fields.project?.key || "",
    dueDate: fields.duedate || null,
    assignee: fields.assignee?.displayName || "Unassigned",
    comments: (fields.comment?.comments || []).map((comment) => adfToPlainText(comment.body)),
  };
}

// Caps how many `mapper` calls are in flight at once, instead of firing all
// of them via Promise.all — used by the /projects membership check, where
// an unbounded fan-out across a large real project list reliably triggers
// Jira's 429 rate limit (each project's role-membership check is itself
// several requests), which previously meant legitimate projects got
// silently excluded rather than just retried.
async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

export default async function jiraRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);

  async function getCredentials() {
    return fastify.prisma.jiraCredential.findUnique({ where: { id: CREDENTIALS_ID } });
  }

  fastify.get(
    "/credentials",
    { schema: { response: { 200: credentialsResponseSchema } } },
    async () => {
      const creds = await getCredentials();
      if (!creds) {
        return { siteUrl: null, email: null, connected: false };
      }
      return { siteUrl: creds.siteUrl, email: creds.email, connected: true };
    }
  );

  fastify.put(
    "/credentials",
    {
      schema: {
        body: {
          type: "object",
          required: ["siteUrl", "email", "apiToken"],
          properties: {
            siteUrl: { type: "string" },
            email: { type: "string" },
            apiToken: { type: "string" },
          },
        },
        response: { 200: credentialsResponseSchema },
      },
    },
    async (request, reply) => {
      const { siteUrl, email, apiToken } = request.body;

      let accountId = null;
      try {
        const me = await testConnection(siteUrl, email, apiToken);
        accountId = me.accountId || null;
      } catch (err) {
        const message =
          err instanceof JiraApiError
            ? err.message
            : "Could not connect to Jira with those credentials.";
        return reply.code(400).send({ error: message });
      }

      const creds = await fastify.prisma.jiraCredential.upsert({
        where: { id: CREDENTIALS_ID },
        update: { siteUrl, email, apiToken, accountId },
        create: { id: CREDENTIALS_ID, siteUrl, email, apiToken, accountId },
      });

      return { siteUrl: creds.siteUrl, email: creds.email, connected: true };
    }
  );

  fastify.get(
    "/projects",
    { schema: { response: { 200: { type: "array", items: projectSchema } } } },
    async (request, reply) => {
      const creds = await getCredentials();
      if (!creds) {
        return reply
          .code(400)
          .send({ error: "Jira is not connected yet. Add your credentials in Settings." });
      }

      try {
        // accountId is cached on the credential row at save time (see PUT
        // /credentials). Back-fill it here for rows saved before that
        // caching existed, and persist it so later calls hit the cache too
        // — this should be a one-time fetch per connection, not per call.
        let accountId = creds.accountId;
        if (!accountId) {
          const me = await testConnection(creds.siteUrl, creds.email, creds.apiToken);
          accountId = me.accountId || null;
          if (accountId) {
            await fastify.prisma.jiraCredential.update({
              where: { id: CREDENTIALS_ID },
              data: { accountId },
            });
          }
        }
        if (!accountId) {
          throw new JiraApiError("Could not determine the connected Jira account's accountId.");
        }

        const projects = await fetchProjects(creds.siteUrl, creds.email, creds.apiToken);

        // Narrow down to projects this account is actually a member of (via
        // project role membership) rather than the BROWSE_PROJECTS
        // permission check — an org/site-admin account has Browse on every
        // project regardless, so that check can't narrow anything for such
        // an account. Role membership reflects who's actually been added to
        // the project.
        //
        // This is N+1+M: one role-list call per project, then one call per
        // role within each project. Capped at 4 projects in flight at once
        // (mapWithConcurrency) rather than firing all of them via
        // Promise.all — a real project list can be 100+ projects, and
        // unbounded concurrency here reliably triggers Jira's rate limit
        // (rawFetch also retries individual 429s with backoff as a second
        // line of defense). Fine for a demo-sized project/role count, but
        // would need real batching/caching against a much larger instance.
        const memberships = await mapWithConcurrency(projects, 4, async (project) => {
          try {
            const isMember = await isProjectMember(
              creds.siteUrl,
              creds.email,
              creds.apiToken,
              project.key,
              accountId
            );
            return isMember ? project : null;
          } catch (err) {
            request.log.warn(
              { err, projectKey: project.key },
              "Failed to check Jira project role membership; excluding it"
            );
            return null;
          }
        });

        return memberships
          .filter((project) => project !== null)
          .map((project) => ({
            id: project.id,
            key: project.key,
            name: project.name,
          }));
      } catch (err) {
        const message = err instanceof JiraApiError ? err.message : "Failed to reach Jira.";
        return reply.code(502).send({ error: message });
      }
    }
  );

  fastify.get(
    "/boards",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["project"],
          properties: { project: { type: "string" } },
        },
        response: { 200: { type: "array", items: boardSchema } },
      },
    },
    async (request, reply) => {
      const creds = await getCredentials();
      if (!creds) {
        return reply
          .code(400)
          .send({ error: "Jira is not connected yet. Add your credentials in Settings." });
      }

      try {
        const data = await fetchBoards(creds.siteUrl, creds.email, creds.apiToken, request.query.project);
        return (data.values || []).map((board) => ({
          id: board.id,
          name: board.name,
          type: board.type,
        }));
      } catch (err) {
        const message = err instanceof JiraApiError ? err.message : "Failed to reach Jira.";
        return reply.code(502).send({ error: message });
      }
    }
  );

  fastify.get(
    "/sprints",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["project"],
          properties: { project: { type: "string" } },
        },
        response: { 200: { type: "array", items: sprintSchema } },
      },
    },
    async (request, reply) => {
      const creds = await getCredentials();
      if (!creds) {
        return reply
          .code(400)
          .send({ error: "Jira is not connected yet. Add your credentials in Settings." });
      }

      try {
        const boardsData = await fetchBoards(
          creds.siteUrl,
          creds.email,
          creds.apiToken,
          request.query.project
        );
        // Team-managed project boards report type "simple" in Jira's Agile
        // API even when they have full sprint functionality — only "kanban"
        // boards are guaranteed to never have sprints, so both "scrum" and
        // "simple" are attempted here.
        const sprintCapableBoard = (boardsData.values || []).find(
          (board) => board.type === "scrum" || board.type === "simple"
        );
        if (!sprintCapableBoard) {
          // No boards, or kanban-only — sprints simply don't apply. Not an error.
          return [];
        }

        const sprintsData = await fetchSprints(creds.siteUrl, creds.email, creds.apiToken, sprintCapableBoard.id);
        // An empty result here (e.g. a "simple" board with no sprints yet)
        // is a legitimate empty state, not an error — the .map below
        // naturally returns [] and the frontend already renders that as
        // "No sprints for this project".
        return (sprintsData.values || []).map((sprint) => ({
          id: sprint.id,
          name: sprint.name,
          state: sprint.state,
        }));
      } catch (err) {
        const message = err instanceof JiraApiError ? err.message : "Failed to reach Jira.";
        return reply.code(502).send({ error: message });
      }
    }
  );

  fastify.get(
    "/issues",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            project: { type: "string" },
            status: { type: "string" },
            search: { type: "string" },
            sprint: { type: "string" },
            pageToken: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              issues: { type: "array", items: issueSchema },
              nextPageToken: { type: ["string", "null"] },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const creds = await getCredentials();
      if (!creds) {
        return reply
          .code(400)
          .send({ error: "Jira is not connected yet. Add your credentials in Settings." });
      }

      const { project, status, search, sprint, pageToken } = request.query;
      const jql = buildJql({ project, status, search, sprint });

      try {
        const data = await searchIssues(creds.siteUrl, creds.email, creds.apiToken, {
          jql,
          maxResults: ISSUES_PAGE_SIZE,
          pageToken,
        });
        return {
          issues: (data.issues || []).map(mapIssue),
          nextPageToken: data.nextPageToken ?? null,
        };
      } catch (err) {
        const message = err instanceof JiraApiError ? err.message : "Failed to reach Jira.";
        return reply.code(502).send({ error: message });
      }
    }
  );

  fastify.get(
    "/issues/:key",
    { schema: { response: { 200: issueDetailSchema } } },
    async (request, reply) => {
      const creds = await getCredentials();
      if (!creds) {
        return reply
          .code(400)
          .send({ error: "Jira is not connected yet. Add your credentials in Settings." });
      }

      try {
        const issue = await fetchIssue(creds.siteUrl, creds.email, creds.apiToken, request.params.key);
        return mapIssueDetail(issue);
      } catch (err) {
        if (err instanceof JiraApiError && err.status === 404) {
          return reply.code(404).send({ error: `Issue ${request.params.key} was not found.` });
        }
        const message = err instanceof JiraApiError ? err.message : "Failed to reach Jira.";
        return reply.code(502).send({ error: message });
      }
    }
  );

  // Administrator-only like the rest of /jira — enforced by the frontend's
  // AdminRoute guard (see /admin/ticket-optimization), not a server-side role
  // check, consistent with every other route in this file.
  fastify.post(
    "/ticket-optimization",
    { schema: { body: ticketOptimizationBodySchema, response: { 200: ticketOptimizationResponseSchema } } },
    async (request, reply) => {
      const creds = await getCredentials();
      if (!creds) {
        return reply
          .code(400)
          .send({ error: "Jira is not connected yet. Add your credentials in Settings." });
      }

      const { project, sprint } = request.body;
      if (!/^\d+$/.test(String(sprint))) {
        return reply.code(400).send({ error: "A valid sprint must be selected to run ticket optimization." });
      }
      const jql = buildTicketOptimizationJql({ project, sprint });

      let issues = [];
      try {
        let pageToken;
        // Larger page size than the 25 used for the user-facing Issues list
        // — this loops internally until every matching ticket is fetched,
        // rather than exposing pages to the caller.
        const PAGE_SIZE = 100;
        for (;;) {
          const data = await searchIssues(creds.siteUrl, creds.email, creds.apiToken, {
            jql,
            maxResults: PAGE_SIZE,
            pageToken,
            fields: TICKET_OPTIMIZATION_FIELDS,
          });
          issues = issues.concat(data.issues || []);
          if (!data.nextPageToken) break;
          pageToken = data.nextPageToken;
        }
      } catch (err) {
        const message = err instanceof JiraApiError ? err.message : "Failed to reach Jira.";
        return reply.code(502).send({ error: message });
      }

      if (issues.length === 0) {
        return reply.code(400).send({ error: "No tickets found for the selected project/sprint." });
      }

      try {
        return await classifyTickets(issues.map(mapIssueForOptimization), { log: request.log });
      } catch (err) {
        request.log.warn({ err }, "Ticket optimization failed to classify");
        return reply.code(502).send({ error: "AI analysis is temporarily unavailable." });
      }
    }
  );
}
