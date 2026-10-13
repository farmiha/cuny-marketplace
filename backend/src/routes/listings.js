const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const supabase = require("../supabaseClient");

// this gets every listing that's currently active in browsing page
router.get("/", async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { status: "active" },
    include: {
      category: true,
      // only the seller's name goes out, never their email or phone
      seller: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(listings);
});

// this gets one listing by its id, for the listing detail page
router.get("/:id", async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      category: true,
      campus: true,
      // only the seller's name goes out, never their email or phone
      seller: { select: { name: true } },
    },
  });

  if (!listing) return res.status(404).json({ message: "Not found" });

  res.json(listing);
});

// this creates a new listing from the new listing form
router.post("/", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Not logged in" });
  }

  // check if this is a real logged in user
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ message: "Invalid session" });
  }

  // pull out the fields we need from the new listing form
  // the form sends the category name (like "Textbooks"), curl can still send categoryId
  const {
    title,
    price,
    categoryId,
    categoryName,
    campusId,
    description,
    condition,
    imageUrl,
    location,
  } = req.body;

  // check the required fields are actually there
  if (!title || !price || !(categoryId || categoryName) || !campusId) {
    return res
      .status(400)
      .json({ message: "title, price, a category, and campusId are required" });
  }

  // check the price is a real number above 0 (this also turns "25" into 25)
  const priceNumber = Number(price);
  if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
    return res
      .status(400)
      .json({ message: "price has to be a number above 0" });
  }

  // check the category and campus actually exist
  const category = categoryId
    ? await prisma.category.findUnique({ where: { id: Number(categoryId) } })
    : await prisma.category.findUnique({ where: { name: categoryName } });
  if (!category) return res.status(404).json({ message: "Category not found" });

  const campus = await prisma.campus.findUnique({
    where: { id: Number(campusId) },
  });
  if (!campus) return res.status(404).json({ message: "Campus not found" });

  const listing = await prisma.listing.create({
    data: {
      title,
      price: priceNumber,
      categoryId: category.id,
      campusId: campus.id,
      description,
      condition,
      imageUrl,
      location,
      sellerId: data.user.id,
    },
  });

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
