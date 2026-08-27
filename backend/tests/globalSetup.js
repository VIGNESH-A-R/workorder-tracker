import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const backendDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const testDbPath = path.join(backendDir, "prisma", "test.db");
const TEST_DATABASE_URL = "file:./test.db";

export async function setup() {
  if (fs.existsSync(testDbPath)) fs.rmSync(testDbPath);
  execSync("npx prisma db push --skip-generate", {
    cwd: backendDir,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });
}

export async function teardown() {
  if (fs.existsSync(testDbPath)) fs.rmSync(testDbPath);
}
