const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const supabase = require("../supabaseClient");

// who is looking at this page? (the page is public, so no login is fine)
async function getViewerId(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

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

  // if this seller blocked the person looking, the profile is hidden from them
  const viewerId = await getViewerId(req);
  if (viewerId && viewerId !== seller.id) {
    const blocked = await prisma.followBlock.findUnique({
      where: {
        blockerId_blockedId: { blockerId: seller.id, blockedId: viewerId },
      },
    });
    if (blocked) {
      return res
        .status(403)
        .json({ code: "BLOCKED", message: "This seller has blocked you" });
    }
  }

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
