import bcrypt from "bcryptjs";

const userResponseSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    username: { type: "string" },
    fullName: { type: "string" },
    role: { type: "string" },
  },
};

export default async function authRoutes(fastify) {
  fastify.post(
    "/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["username", "password"],
          properties: {
            username: { type: "string" },
            password: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: { token: { type: "string" } },
          },
          401: {
            type: "object",
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (request, reply) => {
      const { username, password } = request.body;
      const user = await fastify.prisma.user.findUnique({ where: { username } });
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return reply.code(401).send({ error: "Invalid username or password" });
      }
      const token = fastify.jwt.sign({ id: user.id, username: user.username });
      return { token };
    }
  );

  fastify.get(
    "/me",
    {
      preHandler: [fastify.authenticate],
      schema: { response: { 200: userResponseSchema } },
    },
    async (request) => {
      const user = await fastify.prisma.user.findUnique({ where: { id: request.user.id } });
      return { id: user.id, username: user.username, fullName: user.fullName, role: user.role };
    }
  );

  fastify.patch(
    "/me",
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: "object",
          properties: {
            fullName: { type: "string" },
            password: { type: "string" },
          },
        },
        response: { 200: userResponseSchema },
      },
    },
    async (request) => {
      const data = {};
      if (request.body.fullName) data.fullName = request.body.fullName;
      if (request.body.password) data.passwordHash = await bcrypt.hash(request.body.password, 10);

      const user = await fastify.prisma.user.update({
        where: { id: request.user.id },
        data,
      });
      return { id: user.id, username: user.username, fullName: user.fullName, role: user.role };
    }
  );
}
