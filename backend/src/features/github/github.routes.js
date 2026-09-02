import {
  GitHubApiError,
  fetchAllIssues,
  fetchBranches,
  fetchCommits,
  fetchIssue,
  fetchIssueComments,
  fetchPullRequests,
  postIssueComment,
  testConnection,
} from "./githubClient.js";

const CREDENTIALS_ID = 1; // single-row table — see prisma/schema.prisma

const credentialsResponseSchema = {
  type: "object",
  properties: {
    owner: { type: ["string", "null"] },
    repo: { type: ["string", "null"] },
    connected: { type: "boolean" },
  },
};

const issueSchema = {
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
  },
};

const commentSchema = {
  type: "object",
  properties: {
    author: { type: "string" },
    body: { type: "string" },
    created: { type: ["string", "null"] },
  },
};

const issueDetailSchema = {
  type: "object",
  properties: {
    ...issueSchema.properties,
    comments: { type: "array", items: commentSchema },
  },
};

const addCommentBodySchema = {
  type: "object",
  required: ["body"],
  properties: {
    body: { type: "string" },
  },
};

const devActivityResponseSchema = {
  type: "object",
  properties: {
    branch: {
      type: ["object", "null"],
      properties: {
        name: { type: "string" },
        url: { type: "string" },
      },
    },
    commits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sha: { type: "string" },
          message: { type: "string" },
          url: { type: "string" },
          date: { type: ["string", "null"] },
          author: { type: "string" },
        },
      },
    },
    pullRequests: {
      type: "array",
      items: {
        type: "object",
        properties: {
          number: { type: "integer" },
          title: { type: "string" },
          state: { type: "string" },
          merged: { type: "boolean" },
          url: { type: "string" },
          createdAt: { type: ["string", "null"] },
        },
      },
    },
  },
};

// True if `number` appears in `text` as a whole token — bounded by non-digit
// characters (or the string's start/end) on both sides. Guards against e.g.
// issue 7 matching a branch named "issue-73-something".
function containsWholeNumberToken(text, number) {
  const escaped = String(number).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\D)${escaped}(?:$|\\D)`).test(text);
}

// Same idea as containsWholeNumberToken, but for a fixed literal marker
// (e.g. "#7") rather than a bare number — only the trailing edge can be
// ambiguous ("#71" contains "#7" as a substring but isn't a match for issue 7).
function containsIssueMarker(text, marker) {
  let index = text.indexOf(marker);
  while (index !== -1) {
    const nextChar = text[index + marker.length];
    if (!nextChar || !/\d/.test(nextChar)) return true;
    index = text.indexOf(marker, index + 1);
  }
  return false;
}

function pullRequestReferencesIssue(pr, number) {
  const headRef = pr.head?.ref || "";
  if (headRef.includes(`issue-${number}-`)) return true;

  const marker = `#${number}`;
  return containsIssueMarker(pr.title || "", marker) || containsIssueMarker(pr.body || "", marker);
}

// Maps a GitHub issue to the SAME normalized shape used for Jira issues, so
// the frontend's Issues/detail screens and AI Analysis can render either
// provider's data identically.
function mapIssue(issue, owner, repo) {
  return {
    key: `#${issue.number}`,
    summary: issue.title || "",
    description: issue.body || "",
    status: issue.state === "open" ? "Open" : "Closed",
    priority: null,
    project: `${owner}/${repo}`,
    assignee: issue.assignee?.login || null,
    reporter: issue.user?.login || null,
    created: issue.created_at || null,
    updated: issue.updated_at || null,
    dueDate: null,
  };
}

export default async function githubRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);

  async function getCredentials() {
    return fastify.prisma.gitHubCredential.findUnique({ where: { id: CREDENTIALS_ID } });
  }

  fastify.get(
    "/credentials",
    { schema: { response: { 200: credentialsResponseSchema } } },
    async () => {
      const creds = await getCredentials();
      if (!creds) {
        return { owner: null, repo: null, connected: false };
      }
      return { owner: creds.owner, repo: creds.repo, connected: true };
    }
  );

  fastify.put(
    "/credentials",
    {
      schema: {
        body: {
          type: "object",
          required: ["owner", "repo", "token"],
          properties: {
            owner: { type: "string" },
            repo: { type: "string" },
            token: { type: "string" },
          },
        },
        response: { 200: credentialsResponseSchema },
      },
    },
    async (request, reply) => {
      const { owner, repo, token } = request.body;

      try {
        await testConnection(owner, repo, token);
      } catch (err) {
        const message =
          err instanceof GitHubApiError
            ? err.message
            : "Could not connect to GitHub with those credentials.";
        return reply.code(400).send({ error: message });
      }

      const creds = await fastify.prisma.gitHubCredential.upsert({
        where: { id: CREDENTIALS_ID },
        update: { owner, repo, token },
        create: { id: CREDENTIALS_ID, owner, repo, token },
      });

      return { owner: creds.owner, repo: creds.repo, connected: true };
    }
  );

  fastify.get(
    "/issues",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            state: { type: "string", enum: ["open", "closed", "all"], default: "open" },
            search: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: { issues: { type: "array", items: issueSchema } },
          },
        },
      },
    },
    async (request, reply) => {
      const creds = await getCredentials();
      if (!creds) {
        return reply
          .code(400)
          .send({ error: "GitHub is not connected yet. Add your credentials in Settings." });
      }

      const { state = "open", search } = request.query;

      try {
        const rawItems = await fetchAllIssues(creds.owner, creds.repo, creds.token, state);
        // GitHub's issues endpoint also returns pull requests — exclude them.
        const issuesOnly = rawItems.filter((item) => !("pull_request" in item));
        const mapped = issuesOnly.map((issue) => mapIssue(issue, creds.owner, creds.repo));

        // GitHub's basic issues endpoint doesn't support full-text search
        // well enough to rely on server-side for a demo, so search is
        // applied client-side (here, server-side relative to the frontend)
        // against title/body of the already-fetched page.
        const filtered = search
          ? mapped.filter((issue) => {
              const needle = search.toLowerCase();
              return (
                issue.summary.toLowerCase().includes(needle) ||
                issue.description.toLowerCase().includes(needle)
              );
            })
          : mapped;

        return { issues: filtered };
      } catch (err) {
        const message = err instanceof GitHubApiError ? err.message : "Failed to reach GitHub.";
        return reply.code(502).send({ error: message });
      }
    }
  );

  fastify.get(
    "/issues/:number",
    { schema: { response: { 200: issueDetailSchema } } },
    async (request, reply) => {
      const creds = await getCredentials();
      if (!creds) {
        return reply
          .code(400)
          .send({ error: "GitHub is not connected yet. Add your credentials in Settings." });
      }

      try {
        const [issue, comments] = await Promise.all([
          fetchIssue(creds.owner, creds.repo, creds.token, request.params.number),
          fetchIssueComments(creds.owner, creds.repo, creds.token, request.params.number),
        ]);

        return {
          ...mapIssue(issue, creds.owner, creds.repo),
          comments: comments.map((comment) => ({
            author: comment.user?.login || "Unknown",
            body: comment.body || "",
            created: comment.created_at || null,
          })),
        };
      } catch (err) {
        if (err instanceof GitHubApiError && err.status === 404) {
          return reply.code(404).send({ error: `Issue #${request.params.number} was not found.` });
        }
        const message = err instanceof GitHubApiError ? err.message : "Failed to reach GitHub.";
        return reply.code(502).send({ error: message });
      }
    }
  );

  fastify.post(
    "/issues/:number/comments",
    { schema: { body: addCommentBodySchema, response: { 200: commentSchema } } },
    async (request, reply) => {
      const creds = await getCredentials();
      if (!creds) {
        return reply
          .code(400)
          .send({ error: "GitHub is not connected yet. Add your credentials in Settings." });
      }

      const text = request.body.body.trim();
      if (!text) {
        return reply.code(400).send({ error: "Comment text is required." });
      }

      try {
        const comment = await postIssueComment(creds.owner, creds.repo, creds.token, request.params.number, text);
        return {
          author: comment.user?.login || "Unknown",
          body: comment.body || "",
          created: comment.created_at || null,
        };
      } catch (err) {
        const message = err instanceof GitHubApiError ? err.message : "Failed to reach GitHub.";
        return reply.code(502).send({ error: message });
      }
    }
  );

  // Read-only: surfaces the branch/commits/PR already associated with an
  // issue, purely for display — never creates or links anything itself.
  fastify.get(
    "/dev-activity/:number",
    { schema: { response: { 200: devActivityResponseSchema } } },
    async (request, reply) => {
      const creds = await getCredentials();
      if (!creds) {
        return reply
          .code(400)
          .send({ error: "GitHub is not connected yet. Add your credentials in Settings." });
      }

      const { number } = request.params;

      try {
        const branches = await fetchBranches(creds.owner, creds.repo, creds.token);
        const matchedBranch = branches.find((b) => containsWholeNumberToken(b.name, number));
        const branch = matchedBranch
          ? {
              name: matchedBranch.name,
              url: `https://github.com/${creds.owner}/${creds.repo}/tree/${matchedBranch.name}`,
            }
          : null;

        // No point fetching commits for a branch that doesn't exist — an
        // empty list is a normal "nothing worked on yet" state, not an error.
        let commits = [];
        if (branch) {
          const rawCommits = await fetchCommits(creds.owner, creds.repo, creds.token, {
            sha: branch.name,
            perPage: 10,
          });
          commits = rawCommits.map((commit) => ({
            sha: (commit.sha || "").slice(0, 7),
            message: (commit.commit?.message || "").split("\n")[0],
            url: commit.html_url,
            date: commit.commit?.author?.date || null,
            author: commit.commit?.author?.name || "Unknown",
          }));
        }

        const rawPulls = await fetchPullRequests(creds.owner, creds.repo, creds.token, {
          state: "all",
          perPage: 50,
        });
        const pullRequests = rawPulls
          .filter((pr) => pullRequestReferencesIssue(pr, number))
          .map((pr) => ({
            number: pr.number,
            title: pr.title || "",
            state: pr.state,
            merged: Boolean(pr.merged_at),
            url: pr.html_url,
            createdAt: pr.created_at || null,
          }));

        return { branch, commits, pullRequests };
      } catch (err) {
        const message = err instanceof GitHubApiError ? err.message : "Failed to reach GitHub.";
        return reply.code(502).send({ error: message });
      }
    }
  );
}
