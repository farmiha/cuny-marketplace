// PURPOSE OF THIS FILE:

// inserts 5 rows of data (name + email domain) into the Campus table
// once those rows exist, Farmiha's signup code can query the Campus table and check "does this student's email domain match any row here?"
// If yes, proceed to send the verification code;
// if no, reject before even sending one. Without the seeded rows, that check would have nothing to compare against

// This script sets up the starting data every CUNY Marketplace install needs:
// the campuses we support, and the listing categories.
//
// Run it with: npx prisma db seed
// Safe to run multiple times — it uses "upsert", so existing rows won't be
// duplicated or overwritten, only missing ones get added.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Campuses — each needs a unique "emailDomain" for signup verification.
  const campuses = [
    { name: "Hunter", emailDomain: "stu-mail.hunter.cuny.edu" },
    { name: "Brooklyn", emailDomain: "stu-mail.brooklyn.cuny.edu" },
    { name: "Baruch", emailDomain: "stu-mail.baruch.cuny.edu" },
    { name: "Queens", emailDomain: "stu-mail.qc.cuny.edu" },
    { name: "CSI", emailDomain: "stu-mail.csi.cuny.edu" },
    { name: "CCNY", emailDomain: "stu-mail.ccny.edu" },
    { name: "York", emailDomain: "stu-mail.york.edu" },
    { name: "Lehman", emailDomain: "stu-mail.lehman.cuny.edu" },
    { name: "Medgar Evers", emailDomain: "stu-mail.mec.cuny.edu" },
    { name: "John Jay", emailDomain: "stu-mail.jjay.cuny.edu" },
    { name: "City Tech", emailDomain: "stu-mail.citytech.cuny.edu" },
  ];

  for (const campus of campuses) {
    await prisma.campus.upsert({
      where: { name: campus.name },
      update: {},
      create: campus,
    });
  }

  console.log("Seeded campuses:", campuses.map((c) => c.name).join(", "));

  // Categories — these are what a listing gets filed under on Browse.
  // This list has to match CATEGORIES in frontend/src/data/campusThemes.js,
  // or posting a listing in a missing category fails with "Category not found".
  const categories = [
    "Electronics",
    "Textbooks",
    "Furniture",
    "Sports",
    "Clothing",
    "Services",
    "Other",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Seeded categories:", categories.join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
