const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");

// public seller page: name, campus, join date, and their active listings
router.get("/:id", async (req, res) => {
  const seller = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      createdAt: true,
      campus: { select: { name: true } },
    },
  });
  if (!seller) return res.status(404).json({ message: "Seller not found" });

  const listings = await prisma.listing.findMany({
    where: { sellerId: seller.id, status: "active" },
    include: {
      category: true,
      seller: { select: { name: true } },
      _count: { select: { saves: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const soldCount = await prisma.listing.count({
    where: { sellerId: seller.id, status: "sold" },
  });

  res.json({
    ...seller,
    listings: listings.map(({ _count, ...l }) => ({
      ...l,
      saveCount: _count.saves,
    })),
    soldCount,
  });
});

module.exports = router;