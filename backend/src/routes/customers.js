const customerSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    contactEmail: { type: ["string", "null"] },
    phone: { type: ["string", "null"] },
    address: { type: ["string", "null"] },
    workOrderCount: { type: "integer" },
  },
};

const workOrderSummarySchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    title: { type: "string" },
    status: { type: "string" },
    scheduledDate: { type: ["string", "null"], format: "date-time" },
    technician: {
      type: ["object", "null"],
      properties: {
        id: { type: "integer" },
        name: { type: "string" },
      },
    },
  },
};

export default async function customerRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get(
    "/",
    { schema: { response: { 200: { type: "array", items: customerSchema } } } },
    async () => {
      const customers = await fastify.prisma.customer.findMany({
        include: { _count: { select: { workOrders: true } } },
        orderBy: { id: "asc" },
      });
      return customers.map(({ _count, ...customer }) => ({
        ...customer,
        workOrderCount: _count.workOrders,
      }));
    }
  );

  fastify.post(
    "/",
    {
      schema: {
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            contactEmail: { type: ["string", "null"] },
            phone: { type: ["string", "null"] },
            address: { type: ["string", "null"] },
          },
        },
        response: { 201: customerSchema },
      },
    },
    async (request, reply) => {
      const customer = await fastify.prisma.customer.create({ data: request.body });
      reply.code(201);
      return { ...customer, workOrderCount: 0 };
    }
  );

  fastify.get(
    "/:id",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              ...customerSchema.properties,
              workOrders: { type: "array", items: workOrderSummarySchema },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const id = Number(request.params.id);
      const customer = await fastify.prisma.customer.findUnique({
        where: { id },
        include: { workOrders: { include: { technician: true }, orderBy: { id: "asc" } } },
      });
      if (!customer) {
        return reply.code(404).send({ error: "Customer not found" });
      }
      const { workOrders, ...rest } = customer;
      return { ...rest, workOrders, workOrderCount: workOrders.length };
    }
  );
}
