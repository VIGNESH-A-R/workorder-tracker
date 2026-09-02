import { pathToFileURL } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./features/auth/auth.routes.js";
import userRoutes from "./features/users/users.routes.js";
import jiraRoutes from "./features/jira/jira.routes.js";
import githubRoutes from "./features/github/github.routes.js";
import integrationsRoutes from "./features/integrations/integrations.routes.js";
import aiAnalysisRoutes from "./features/ai-analysis/aiAnalysis.routes.js";
import ticketOptimizationRoutes from "./features/ticket-optimization/ticketOptimization.routes.js";

export async function buildApp(opts = {}) {
  const app = Fastify({ logger: opts.logger ?? true });

  await app.register(cors, {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  });

  await app.register(swagger, {
    openapi: {
      info: { title: "Ticketing System API", version: "1.0.0" },
    },
  });
  await app.register(swaggerUI, { routePrefix: "/docs" });

  await app.register(prismaPlugin, { databaseUrl: opts.databaseUrl });
  await app.register(authPlugin);

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(userRoutes, { prefix: "/users" });
  await app.register(jiraRoutes, { prefix: "/jira" });
  await app.register(githubRoutes, { prefix: "/github" });
  await app.register(integrationsRoutes, { prefix: "/integrations" });
  await app.register(aiAnalysisRoutes, { prefix: "/ai-analysis" });
  await app.register(ticketOptimizationRoutes, { prefix: "/ticket-optimization" });

  app.get("/", async () => ({ status: "ok", service: "Ticketing System API" }));

  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = await buildApp();
  app.listen({ port: 8000, host: "0.0.0.0" }, (err) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
  });
}
