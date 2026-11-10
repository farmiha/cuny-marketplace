// to delete: node prisma/seed-test-listings.cjs --cleanup --yes


try { require("dotenv").config(); } catch {}
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const TAG = "[TEST] ";
const args = process.argv.slice(2);
const confirmed = args.includes("--yes");
const cleanup = args.includes("--cleanup");

const ITEMS = {
  Electronics: [
    ["Wireless Headphones", 35], ["Mechanical Keyboard", 45], ["24-inch Monitor", 80],
    ["Scientific Calculator", 20], ["USB-C Hub", 15], ["Bluetooth Speaker", 25],
    ["Wireless Mouse", 12], ["HD Webcam", 22],
  ],
  Textbooks: [
    ["Calculus Textbook", 40], ["Biology Textbook", 38], ["Chemistry Textbook", 45],
    ["Psychology Textbook", 30], ["Economics Textbook", 35], ["Statistics Textbook", 32],
    ["Computer Science Textbook", 50], ["College Writing Guide", 12],
  ],
  Furniture: [
    ["Study Desk", 60], ["Desk Chair", 35], ["Table Lamp", 10], ["Small Bookshelf", 28],
    ["Nightstand", 25], ["Folding Table", 30], ["Storage Drawers", 22], ["Floor Lamp", 18],
  ],
  Sports: [
    ["Basketball", 15], ["Yoga Mat", 12], ["Dumbbell Set", 40], ["Tennis Racket", 28],
    ["Resistance Bands", 8], ["Jump Rope", 6], ["Volleyball", 14], ["Gym Bag", 18],
  ],
  Clothing: [
    ["Winter Jacket", 45], ["Campus Hoodie", 20], ["Running Sneakers", 35], ["Raincoat", 18],
    ["Interview Blazer", 30], ["Knit Sweater", 16], ["Winter Boots", 38], ["Wool Scarf", 9],
  ],
  Services: [
    ["Math Tutoring Session", 20], ["Essay Feedback Session", 15], ["Coding Tutoring Session", 25],
    ["Resume Review", 12], ["Spanish Conversation Practice", 10], ["Poster Design Help", 18],
    ["Campus Moving Help", 30], ["Laptop Setup Help", 15],
  ],
  Other: [
    ["Campus Backpack", 25], ["Coffee Maker", 20], ["Reusable Water Bottle", 8],
    ["Compact Umbrella", 7], ["Art Supply Set", 22], ["Board Game", 14],
    ["Small Houseplant", 6], ["Storage Bin", 9],
  ],
};

const CONDITIONS = ["New", "Like new", "Good", "Fair"];
const LOCATIONS = ["Library", "Dorms", "Student Center", "Main Entrance"];

async function seed() {
  const sellers = await prisma.user.findMany({
    select: { id: true, campusId: true },
    take: 20,
  });
  if (sellers.length === 0) throw new Error("No users found to use as sellers.");

  const existing = await prisma.listing.count({
    where: { title: { startsWith: TAG } },
  });
  if (existing > 0) {
    console.log(`Found ${existing} existing test listings. Run --cleanup first.`);
    return;
  }

  const categories = {};
  for (const name of Object.keys(ITEMS)) {
    categories[name] = confirmed
      ? await prisma.category.upsert({ where: { name }, update: {}, create: { name } })
      : { id: 0 };
  }

  // interleave categories so no single category is "newest"
  const rows = [];
  let n = 0;
  for (let i = 0; i < 8; i++) {
    for (const [categoryName, items] of Object.entries(ITEMS)) {
      const [title, price] = items[i];
      const seller = sellers[n % sellers.length];
      rows.push({
        title: TAG + title,
        description: "Test listing for the recommendation algorithm. Not a real item.",
        price,
        condition: categoryName === "Services" ? null : CONDITIONS[(n + i) % 4],
        location: LOCATIONS[n % LOCATIONS.length],
        status: "active",
        sellerId: seller.id,
        categoryId: categories[categoryName].id,
        campusId: seller.campusId,
        createdAt: new Date(Date.now() - n * 7 * 60 * 60 * 1000), // 7 hours apart
      });
      n++;
    }
  }

  if (!confirmed) {
    console.log(`DRY RUN: would create ${rows.length} listings across ${sellers.length} sellers.`);
    console.log("Run again with --yes to create them.");
    return;
  }

  const result = await prisma.listing.createMany({ data: rows });
  console.log(`Created ${result.count} test listings.`);
}

async function removeTestListings() {
  const where = { title: { startsWith: TAG } };
  const count = await prisma.listing.count({ where });

  if (!confirmed) {
    console.log(`DRY RUN: would delete ${count} test listings and their related rows.`);
    console.log("Run again with --cleanup --yes to delete them.");
    return;
  }

  // delete rows that don't cascade first
  const listingFilter = { listing: where };
  await prisma.listingView.deleteMany({ where: listingFilter });
  await prisma.message.deleteMany({ where: listingFilter });
  await prisma.report.deleteMany({ where: listingFilter });
  await prisma.rating.deleteMany({ where: listingFilter });
  const result = await prisma.listing.deleteMany({ where });
  console.log(`Deleted ${result.count} test listings.`);
}

(cleanup ? removeTestListings() : seed())
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());