const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/requireAuth");

// this lists the logged in user's paid orders (newest first), for "My orders" on their Profile
router.get("/mine", requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { buyerId: req.userId, status: "paid" },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const listingIds = orders.flatMap((o) => o.items.map((i) => i.listingId));
  const sellerIds = [...new Set(orders.flatMap((o) => o.items.map((i) => i.sellerId)))];

  const [listings, sellers] = await Promise.all([
    prisma.listing.findMany({
      where: { id: { in: listingIds } },
      select: { id: true, location: true, imageUrl: true, category: { select: { name: true } } },
    }),
    // only the seller's name goes out, never their email or phone
    prisma.user.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, name: true },
    }),
  ]);

  const listingById = new Map(listings.map((l) => [l.id, l]));
  const sellerName = new Map(sellers.map((s) => [s.id, s.name]));

  res.json(
    orders.map((o) => ({
      id: o.id,
      status: o.status,
      totalCents: o.totalCents,
      paidAt: o.paidAt || o.createdAt,
      items: o.items.map((i) => {
        const listing = listingById.get(i.listingId);
        return {
          listingId: i.listingId,
          title: i.title,
          priceCents: i.priceCents,
          sellerId: i.sellerId,
          sellerName: sellerName.get(i.sellerId) || null,
          location: listing?.location || null,
          imageUrl: listing?.imageUrl || null,
          category: listing?.category?.name || "Other",
        };
      }),
    })),
  );
});

module.exports = router;
