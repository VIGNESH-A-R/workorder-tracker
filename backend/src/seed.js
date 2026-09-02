import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USERS = [
  { username: "admin", password: "Admin@123", fullName: "Alex Morgan", role: "Administrator" },
  { username: "dispatcher", password: "Dispatch@123", fullName: "Priya Nair", role: "Dispatcher" },
];

async function main() {
  for (const user of USERS) {
    const existing = await prisma.user.findUnique({ where: { username: user.username } });
    if (!existing) {
      await prisma.user.create({
        data: {
          username: user.username,
          passwordHash: await bcrypt.hash(user.password, 10),
          fullName: user.fullName,
          role: user.role,
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
