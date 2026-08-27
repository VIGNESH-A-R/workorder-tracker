const customerRefSchema = {
  type: ["object", "null"],
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    contactEmail: { type: ["string", "null"] },
    phone: { type: ["string", "null"] },
    address: { type: ["string", "null"] },
  },
};

const technicianRefSchema = {
  type: ["object", "null"],
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    phone: { type: ["string", "null"] },
    specialty: { type: ["string", "null"] },
  },
};

const workOrderResponseSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    title: { type: "string" },
    description: { type: ["string", "null"] },
    customerId: { type: "integer" },
    customer: customerRefSchema,
    location: { type: ["string", "null"] },
    technicianId: { type: ["integer", "null"] },
    technician: technicianRefSchema,
    status: { type: "string" },
    scheduledDate: { type: ["string", "null"], format: "date-time" },
    createdAt: { type: "string", format: "date-time" },
  },
};

// Body schema is intentionally permissive: title is not required (an empty
// title must be accepted) and scheduledDate is not validated against "today".
const workOrderBodySchema = {
  type: "object",
  required: ["customerId"],
  properties: {
    title: { type: "string" },
    description: { type: ["string", "null"] },
    customerId: { type: "integer" },
    location: { type: ["string", "null"] },
    technicianId: { type: ["integer", "null"] },
    status: { type: "string" },
    scheduledDate: { type: ["string", "null"] },
  },
};

const workOrderUpdateSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: ["string", "null"] },
    customerId: { type: "integer" },
    location: { type: ["string", "null"] },
    technicianId: { type: ["integer", "null"] },
    status: { type: "string" },
    scheduledDate: { type: ["string", "null"] },
  },
};

const include = { customer: true, technician: true };

function toPrismaData(body) {
  const data = { ...body };
  if (data.scheduledDate) data.scheduledDate = new Date(data.scheduledDate);
  return data;
}

export default async function workOrderRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get(
    "/",
    { schema: { response: { 200: { type: "array", items: workOrderResponseSchema } } } },
    async () => {
      return fastify.prisma.workOrder.findMany({ include, orderBy: { id: "asc" } });
    }
  );

  fastify.get(
    "/stats",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              total: { type: "integer" },
              open: { type: "integer" },
              completed: { type: "integer" },
            },
          },
        },
      },
    },
    async () => {
      const total = await fastify.prisma.workOrder.count();
      // Intentionally counts ALL work orders, including "Done" ones — this is
      // the baseline behavior the demo starts from, not a bug to fix here.
      const open = await fastify.prisma.workOrder.count();
      const completed = await fastify.prisma.workOrder.count({ where: { status: "Done" } });
      return { total, open, completed };
    }
  );

  fastify.post(
    "/",
    {
      schema: {
        body: workOrderBodySchema,
        response: { 201: workOrderResponseSchema },
      },
    },
    async (request, reply) => {
      const data = toPrismaData(request.body);
      const workOrder = await fastify.prisma.workOrder.create({
        data: {
          title: data.title ?? "",
          description: data.description,
          customerId: data.customerId,
          location: data.location,
          technicianId: data.technicianId,
          status: data.status || "New",
          scheduledDate: data.scheduledDate,
        },
        include,
      });
      reply.code(201);
      return workOrder;
    }
  );

  fastify.get(
    "/:id",
    { schema: { response: { 200: workOrderResponseSchema } } },
    async (request, reply) => {
      const id = Number(request.params.id);
      const workOrder = await fastify.prisma.workOrder.findUnique({ where: { id }, include });
      if (!workOrder) {
        return reply.code(404).send({ error: "Work order not found" });
      }
      return workOrder;
    }
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        body: workOrderUpdateSchema,
        response: { 200: workOrderResponseSchema },
      },
    },
    async (request, reply) => {
      const id = Number(request.params.id);
      const data = toPrismaData(request.body);
      try {
        const workOrder = await fastify.prisma.workOrder.update({ where: { id }, data, include });
        return workOrder;
      } catch (err) {
        return reply.code(404).send({ error: "Work order not found" });
      }
    }
  );
}
