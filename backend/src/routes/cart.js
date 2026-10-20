const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/requireAuth");
const { loadCart } = require("../lib/cart");

// every cart route needs a logged in user (sets req.userId)
router.use(requireAuth);

// get my cart (optionally with a promo code to preview the discount)
router.get("/", async (req, res) => {
  const cart = await loadCart(req.userId, req.query.promo);
  res.json(cart);
});

// add a listing to my cart
router.post("/", async (req, res) => {
  const listingId = Number(req.body.listingId);
  if (!Number.isInteger(listingId)) {
    return res.status(400).json({ message: "listingId is required" });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return res.status(404).json({ message: "Listing not found" });
  if (listing.status !== "active") {
    return res.status(409).json({ message: "This item has already been sold." });
  }
  if (listing.sellerId === req.userId) {
    return res.status(400).json({ message: "You can't buy your own listing." });
  }

  // each listing is a one-off item, so it can only be in your cart once
  await prisma.cartItem.upsert({
    where: { userId_listingId: { userId: req.userId, listingId } },
    update: { savedForLater: false },
    create: { userId: req.userId, listingId },
  });

  res.status(201).json({ ok: true });
});

// move an item to "saved for later" or back into the cart
router.patch("/:listingId", async (req, res) => {
  await prisma.cartItem.updateMany({
    where: { userId: req.userId, listingId: Number(req.params.listingId) },
    data: { savedForLater: Boolean(req.body.savedForLater) },
  });
  res.json({ ok: true });
});

// remove an item
router.delete("/:listingId", async (req, res) => {
  await prisma.cartItem.deleteMany({
    where: { userId: req.userId, listingId: Number(req.params.listingId) },
  });
  res.status(204).send();
});

module.exports = router;
