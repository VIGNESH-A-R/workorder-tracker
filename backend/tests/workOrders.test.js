import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { buildApp } from "../src/server.js";

const TEST_DATABASE_URL = "file:./test.db";
const ADMIN = { username: "admin", password: "Admin@123", fullName: "Alex Morgan", role: "Administrator" };

let app;
let customerId;

beforeAll(async () => {
  app = await buildApp({ databaseUrl: TEST_DATABASE_URL, logger: false });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await app.prisma.workOrder.deleteMany();
  await app.prisma.technician.deleteMany();
  await app.prisma.customer.deleteMany();
  await app.prisma.user.deleteMany();

  await app.prisma.user.create({
    data: {
      username: ADMIN.username,
      passwordHash: await bcrypt.hash(ADMIN.password, 10),
      fullName: ADMIN.fullName,
      role: ADMIN.role,
    },
  });

  const customer = await app.prisma.customer.create({ data: { name: "Acme Corp" } });
  customerId = customer.id;
});

async function login(username = ADMIN.username, password = ADMIN.password) {
  return app.inject({ method: "POST", url: "/auth/login", payload: { username, password } });
}

async function authHeaders() {
  const res = await login();
  const { token } = res.json();
  return { authorization: `Bearer ${token}` };
}

function sampleWorkOrder(overrides = {}) {
  return {
    title: "Fix leaking pipe",
    description: "Kitchen sink leaking",
    customerId,
    location: "123 Main St",
    status: "New",
    scheduledDate: "2026-09-01",
    ...overrides,
  };
}

describe("auth", () => {
  it("logs in with correct credentials and returns a token", async () => {
    const res = await login();
    expect(res.statusCode).toBe(200);
    expect(res.json().token).toBeTruthy();
  });

  it("rejects bad credentials with 401", async () => {
    const res = await login(ADMIN.username, "wrong-password");
    expect(res.statusCode).toBe(401);
  });
});

describe("work orders", () => {
  it("requires authentication", async () => {
    const res = await app.inject({ method: "GET", url: "/work-orders" });
    expect(res.statusCode).toBe(401);
  });

  it("creates a work order", async () => {
    const headers = await authHeaders();
    const res = await app.inject({
      method: "POST",
      url: "/work-orders",
      headers,
      payload: sampleWorkOrder(),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.title).toBe("Fix leaking pipe");
    expect(body.customer.name).toBe("Acme Corp");
    expect(body.status).toBe("New");
    expect(body.id).toBeDefined();
  });

  it("lists work orders", async () => {
    const headers = await authHeaders();
    await app.inject({ method: "POST", url: "/work-orders", headers, payload: sampleWorkOrder({ title: "Order A" }) });
    await app.inject({ method: "POST", url: "/work-orders", headers, payload: sampleWorkOrder({ title: "Order B" }) });

    const res = await app.inject({ method: "GET", url: "/work-orders", headers });
    expect(res.statusCode).toBe(200);
    const titles = res.json().map((wo) => wo.title);
    expect(titles.sort()).toEqual(["Order A", "Order B"]);
  });

  it("gets a work order by id, with customer joined in", async () => {
    const headers = await authHeaders();
    const created = (
      await app.inject({ method: "POST", url: "/work-orders", headers, payload: sampleWorkOrder() })
    ).json();

    const res = await app.inject({ method: "GET", url: `/work-orders/${created.id}`, headers });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(created.id);
    expect(res.json().customer.name).toBe("Acme Corp");
  });

  it("returns 404 for a missing work order", async () => {
    const headers = await authHeaders();
    const res = await app.inject({ method: "GET", url: "/work-orders/999999", headers });
    expect(res.statusCode).toBe(404);
  });

  it("updates status via PATCH", async () => {
    const headers = await authHeaders();
    const created = (
      await app.inject({ method: "POST", url: "/work-orders", headers, payload: sampleWorkOrder() })
    ).json();

    const technician = await app.prisma.technician.create({ data: { name: "Ravi Kumar" } });

    const res = await app.inject({
      method: "PATCH",
      url: `/work-orders/${created.id}`,
      headers,
      payload: { status: "Assigned", technicianId: technician.id },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("Assigned");
    expect(body.technician.name).toBe("Ravi Kumar");
  });
});
