import fp from "fastify-plugin";
import jwt from "@fastify/jwt";

// Demo-only secret; a real deployment would load this from the environment.
const JWT_SECRET = "workorder-tracker-demo-secret-key";

export default fp(async function authPlugin(fastify) {
  await fastify.register(jwt, { secret: JWT_SECRET });

  fastify.decorate("authenticate", async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });
});
