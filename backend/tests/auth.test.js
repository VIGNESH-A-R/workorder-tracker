import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { buildApp } from "../src/server.js";

const TEST_DATABASE_URL = "file:./test.db";
const ADMIN = { username: "admin", password: "Admin@123", fullName: "Alex Morgan", role: "Administrator" };

let app;

beforeAll(async () => {
  app = await buildApp({ databaseUrl: TEST_DATABASE_URL, logger: false });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await app.prisma.user.deleteMany();

  await app.prisma.user.create({
    data: {
      username: ADMIN.username,
      passwordHash: await bcrypt.hash(ADMIN.password, 10),
      fullName: ADMIN.fullName,
      role: ADMIN.role,
    },
  });
});

async function login(username = ADMIN.username, password = ADMIN.password) {
  return app.inject({ method: "POST", url: "/auth/login", payload: { username, password } });
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

  it("requires a valid JWT for authenticated routes", async () => {
    const res = await app.inject({ method: "GET", url: "/users" });
    expect(res.statusCode).toBe(401);
  });

  it("returns the current user for GET /auth/me with a valid token", async () => {
    const { token } = (await login()).json();
    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().username).toBe(ADMIN.username);
  });
});
