// PURPOSE OF THIS FILE:

// inserts 5 rows of data (name + email domain) into the Campus table
// once those rows exist, Farmiha's signup code can query the Campus table and check "does this student's email domain match any row here?"
// If yes, proceed to send the verification code;
// if no, reject before even sending one. Without the seeded rows, that check would have nothing to compare against

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // the 5 schools and their email domain
  const campuses = [
    { name: "Hunter", emailDomain: "stu-mail.hunter.cuny.edu" },
    { name: "Brooklyn", emailDomain: "stu-mail.brooklyn.cuny.edu" },
    { name: "Baruch", emailDomain: "stu-mail.baruch.cuny.edu" },
    { name: "Queens", emailDomain: "stu-mail.qc.cuny.edu" },
    { name: "CSI", emailDomain: "stu-mail.csi.cuny.edu" },
  ];

  // check to see if the campus already exist in the db
  // if it's not, add it
  for (const campus of campuses) {
    await prisma.campus.upsert({
      where: { name: campus.name },
      update: {},
      create: campus,
    });
  }

  console.log("Seeded campuses:", campuses.map((c) => c.name).join(", ")); // print a message in console so we know it worked

  // the 5 categories a listing can be filed under
  const categories = [
    "Textbooks",
    "Electronics",
    "Furniture",
    "Services",
    "Other",
  ];

  for (const name of categories) {
    // add it if it doesn't already exist, skip it if it does
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Seeded categories:", categories.join(", "));
}

// runs the function of all work above
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
