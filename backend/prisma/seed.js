// PURPOSE OF THIS FILE:

// inserts 5 rows of data (name + email domain) into the Campus table
// once those rows exist, Farmiha's signup code can query the Campus table and check "does this student's email domain match any row here?"
// If yes, proceed to send the verification code;
// if no, reject before even sending one. Without the seeded rows, that check would have nothing to compare against

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const campuses = [
    { name: "Hunter", emailDomain: "stu-mail.hunter.cuny.edu" },
    { name: "Brooklyn", emailDomain: "stu-mail.brooklyn.cuny.edu" },
    { name: "Baruch", emailDomain: "stu-mail.baruch.cuny.edu" },
    { name: "Queens", emailDomain: "stu-mail.qc.cuny.edu" },
    { name: "CSI", emailDomain: "stu-mail.csi.cuny.edu" },
  ];

  // upsert = "update if it exists, otherwise create it"
  // This loop goes through each campus above and inserts it into the
  // database, matching on the unique "name" field.
  for (const campus of campuses) {
    await prisma.campus.upsert({
      where: { name: campus.name },
      update: {},
      create: campus,
    });
  }

  console.log("Seeded campuses:", campuses.map((c) => c.name).join(", "));
}

main()
  .catch((e) => {
    // If anything goes wrong (e.g. bad DB connection), log it and exit
    // with an error code so it's obvious the seed failed.
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Always close the database connection when we're done, whether
    // the seed succeeded or failed.
    await prisma.$disconnect();
  });
