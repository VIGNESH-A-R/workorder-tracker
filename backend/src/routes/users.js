// Not wired to any screen yet — kept as a small, scoped scaffold for a future
// "manage users" feature ticket. Never returns passwordHash.
const userSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    username: { type: "string" },
    fullName: { type: "string" },
    role: { type: "string" },
  },
};

export default async function userRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get(
    "/",
    { schema: { response: { 200: { type: "array", items: userSchema } } } },
    async () => {
      return fastify.prisma.user.findMany({
        select: { id: true, username: true, fullName: true, role: true },
        orderBy: { id: "asc" },
      });
    }
  );
}
