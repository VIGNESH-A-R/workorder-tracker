const SETTINGS_ID = 1; // single-row table — see prisma/schema.prisma

const activeProviderResponseSchema = {
  type: "object",
  properties: { activeProvider: { type: "string" } },
};

export default async function integrationsRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get(
    "/active",
    { schema: { response: { 200: activeProviderResponseSchema } } },
    async () => {
      const settings = await fastify.prisma.integrationSettings.findUnique({
        where: { id: SETTINGS_ID },
      });
      return { activeProvider: settings?.activeProvider || "jira" };
    }
  );

  fastify.put(
    "/active",
    {
      schema: {
        body: {
          type: "object",
          required: ["activeProvider"],
          properties: { activeProvider: { type: "string", enum: ["jira", "github"] } },
        },
        response: { 200: activeProviderResponseSchema },
      },
    },
    async (request) => {
      const { activeProvider } = request.body;
      const settings = await fastify.prisma.integrationSettings.upsert({
        where: { id: SETTINGS_ID },
        update: { activeProvider },
        create: { id: SETTINGS_ID, activeProvider },
      });
      return { activeProvider: settings.activeProvider };
    }
  );
}
