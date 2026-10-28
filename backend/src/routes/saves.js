const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const supabase = require("../supabaseClient");

// works out who is logged in from the token
async function getUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// ids of every listing the logged in user has saved (it has to stay above "/:listingId")
router.get("/mine", async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ message: "Not logged in" });

  const saved = await prisma.savedListing.findMany({
    where: { userId: user.id },
    select: { listingId: true },
  });
  res.json(saved.map((s) => s.listingId));
});

// save a listing (the heart): counts as a save AND goes into "Saved for later" in the cart
router.post("/:listingId", async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ message: "Not logged in" });

  const listingId = Number(req.params.listingId);
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return res.status(404).json({ message: "Not found" });
  if (listing.sellerId === user.id) {
    return res.status(400).json({ message: "You can't save your own listing" });
  }

  await prisma.savedListing.upsert({
    where: { userId_listingId: { userId: user.id, listingId } },
    update: {},
    create: { userId: user.id, listingId },
  });

  // put it in the cart's "Saved for later" section
  // (if it's already in the cart, leave it where it is)
  if (listing.status === "active") {
    await prisma.cartItem.upsert({
      where: { userId_listingId: { userId: user.id, listingId } },
      update: {},
      create: { userId: user.id, listingId, savedForLater: true },
    });
  }

  const count = await prisma.savedListing.count({ where: { listingId } });
  res.json({ saved: true, count });
});

// unsave a listing: takes it out of "Saved for later" too
router.delete("/:listingId", async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ message: "Not logged in" });

  const listingId = Number(req.params.listingId);
  await prisma.savedListing.deleteMany({
    where: { userId: user.id, listingId },
  });

  // only remove it from the cart if it's sitting in "Saved for later"
  // (if they moved it to their cart to buy it, it stays there)
  await prisma.cartItem.deleteMany({
    where: { userId: user.id, listingId, savedForLater: true },
  });

  const count = await prisma.savedListing.count({ where: { listingId } });
  res.json({ saved: false, count });
});

module.exports = router;