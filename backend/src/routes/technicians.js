const technicianSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    phone: { type: ["string", "null"] },
    specialty: { type: ["string", "null"] },
    workload: {
      type: "object",
      properties: {
        open: { type: "integer" },
        done: { type: "integer" },
      },
    },
  },
};

const workOrderSummarySchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    title: { type: "string" },
    status: { type: "string" },
    scheduledDate: { type: ["string", "null"], format: "date-time" },
    customer: {
      type: ["object", "null"],
      properties: {
        id: { type: "integer" },
        name: { type: "string" },
      },
    },
  },
};

function workload(workOrders) {
  const done = workOrders.filter((wo) => wo.status === "Done").length;
  return { open: workOrders.length - done, done };
}

export default async function technicianRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get(
    "/",
    {
      schema: {
        response: { 200: { type: "array", items: technicianSchema } },
      },
    },
    async () => {
      const technicians = await fastify.prisma.technician.findMany({
        include: { workOrders: true },
        orderBy: { id: "asc" },
      });
      return technicians.map(({ workOrders, ...technician }) => ({
        ...technician,
        workload: workload(workOrders),
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
            phone: { type: ["string", "null"] },
            specialty: { type: ["string", "null"] },
          },
        },
        response: { 201: technicianSchema },
      },
    },
    async (request, reply) => {
      const technician = await fastify.prisma.technician.create({ data: request.body });
      reply.code(201);
      return { ...technician, workload: { open: 0, done: 0 } };
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
              ...technicianSchema.properties,
              workOrders: { type: "array", items: workOrderSummarySchema },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const id = Number(request.params.id);
      const technician = await fastify.prisma.technician.findUnique({
        where: { id },
        include: { workOrders: { include: { customer: true }, orderBy: { id: "asc" } } },
      });
      if (!technician) {
        return reply.code(404).send({ error: "Technician not found" });
      }
      const { workOrders, ...rest } = technician;
      return { ...rest, workOrders, workload: workload(workOrders) };
    }
  );
}
