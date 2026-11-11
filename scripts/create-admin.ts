import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

const [email, password, name = "Admin"] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: bun run create-admin <email> <password> [name]");
  process.exit(1);
}

const existing = await prisma.user.findUnique({ where: { email } });

if (existing) {
  await prisma.user.update({ where: { email }, data: { role: "admin" } });
  console.log(`Promoted ${email} to admin.`);
} else {
  await auth.api.signUpEmail({ body: { email, password, name } });
  await prisma.user.update({ where: { email }, data: { role: "admin" } });
  console.log(`Created admin ${email}.`);
}

process.exit(0);
