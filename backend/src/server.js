import { pathToFileURL } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./routes/auth.js";
import workOrderRoutes from "./routes/workOrders.js";
import technicianRoutes from "./routes/technicians.js";
import customerRoutes from "./routes/customers.js";
import userRoutes from "./routes/users.js";

export async function buildApp(opts = {}) {
  const app = Fastify({ logger: opts.logger ?? true });

  await app.register(cors, {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  });

  await app.register(swagger, {
    openapi: {
      info: { title: "Work Order Tracker API", version: "1.0.0" },
    },
  });
  await app.register(swaggerUI, { routePrefix: "/docs" });

  await app.register(prismaPlugin, { databaseUrl: opts.databaseUrl });
  await app.register(authPlugin);

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(workOrderRoutes, { prefix: "/work-orders" });
  await app.register(technicianRoutes, { prefix: "/technicians" });
  await app.register(customerRoutes, { prefix: "/customers" });
  await app.register(userRoutes, { prefix: "/users" });

  app.get("/", async () => ({ status: "ok", service: "Work Order Tracker API" }));

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
