const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const supabase = require("../supabaseClient");

// this gets every listing that's currently active in browsing page
router.get("/", async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { status: "active" },
  });
  res.json(listings);
});

// this gets one listing by its id, for the listing detail page
router.get("/:id", async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: Number(req.params.id) },
  });

  if (!listing) return res.status(404).json({ message: "Not found" });

  res.json(listing);
});

// this creates a new listing from the post a listing page
router.post("/", async (req, res) => {
  const listing = await prisma.listing.create({ data: req.body });
  res.status(201).json(listing);
});

// this deletes a listing, only if it's yours
router.delete("/:id", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Not logged in" });
  }

  // check if this is a real logged in user
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ message: "Invalid session" });
  }

  // check if the listing exists
  const listing = await prisma.listing.findUnique({
    where: { id: Number(req.params.id) },
  });
  if (!listing) return res.status(404).json({ message: "Not found" });

  // check if the logged in user owns this listing
  if (listing.sellerId !== data.user.id) {
    return res
      .status(403)
      .json({ message: "You can only delete your own listings" });
  }

  await prisma.listing.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});

module.exports = router;
