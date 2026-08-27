import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

export default fp(async function prismaPlugin(fastify, opts) {
  const prisma = opts.databaseUrl
    ? new PrismaClient({ datasources: { db: { url: opts.databaseUrl } } })
    : new PrismaClient();

  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async (instance) => {
    await instance.prisma.$disconnect();
  });
});
