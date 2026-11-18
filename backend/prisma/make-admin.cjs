// Usage (from the backend folder):
//   node prisma/make-admin.cjs someone@stu.hunter.cuny.edu
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const email = (process.argv[2] || "").toLowerCase();
  if (!email) {
    console.log("Give an email: node prisma/make-admin.cjs you@school.edu");
    process.exit(1);
  }
  const user = await prisma.user.update({
    where: { email },
    data: { isAdmin: true },
  });
  console.log("Now admin:", user.email);
  await prisma.$disconnect();
})().catch((err) => {
  console.error("Could not make admin (did they sign up yet?):", err.message);
  process.exit(1);
});