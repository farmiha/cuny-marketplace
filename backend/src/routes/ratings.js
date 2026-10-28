const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const supabase = require("../supabaseClient");

// get the logged in Supabase user from the request, or null
async function getAuthUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// this gets a seller's average rating and how many ratings they have (public)
router.get("/seller/:sellerId", async (req, res) => {
  const result = await prisma.rating.aggregate({
    where: { rateeId: req.params.sellerId },
    _avg: { score: true },
    _count: { score: true },
  });

  res.json({
    average: result._avg.score,
    count: result._count.score,
  });
});

// this lists the ratings the logged in seller received, with comments (for their Profile)
router.get("/received", async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ message: "Not logged in" });

  const [ratings, summary] = await Promise.all([
    prisma.rating.findMany({
      where: { rateeId: authUser.id },
      include: {
        rater: { select: { name: true } },
        listing: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.rating.aggregate({
      where: { rateeId: authUser.id },
      _avg: { score: true },
      _count: { score: true },
    }),
  ]);

  res.json({
    average: summary._avg.score,
    count: summary._count.score,
    reviews: ratings.map((x) => ({
      id: x.id,
      score: x.score,
      comment: x.comment,
      createdAt: x.createdAt,
      raterName: (x.rater?.name || "A buyer").split(" ")[0],
      listingTitle: x.listing?.title || "a listing",
    })),
  });
});

// this lists the things the logged in user bought (paid orders only),
// and which ones they already rated
router.get("/purchases", async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ message: "Not logged in" });

  const items = await prisma.orderItem.findMany({
    where: { order: { buyerId: authUser.id, status: "paid" } },
    include: { order: { select: { paidAt: true } } },
    orderBy: { id: "desc" },
  });

  const listingIds = items.map((i) => i.listingId);
  const sellerIds = [...new Set(items.map((i) => i.sellerId))];

  const [myRatings, sellers] = await Promise.all([
    prisma.rating.findMany({
      where: { raterId: authUser.id, listingId: { in: listingIds } },
    }),
    // only the seller's name goes out, never their email or phone
    prisma.user.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, name: true },
    }),
  ]);

  const ratingByListing = new Map(myRatings.map((r) => [r.listingId, r]));
  const sellerName = new Map(sellers.map((s) => [s.id, s.name]));

  res.json(
    items.map((item) => {
      const rating = ratingByListing.get(item.listingId);
      return {
        listingId: item.listingId,
        title: item.title,
        priceCents: item.priceCents,
        sellerId: item.sellerId,
        sellerName: sellerName.get(item.sellerId) || null,
        paidAt: item.order.paidAt,
        rated: rating ? { score: rating.score, comment: rating.comment } : null,
      };
    }),
  );
});

// this saves a rating, only from someone who really bought the item (paid order)
router.post("/", async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ message: "Not logged in" });

  const { listingId, score, comment } = req.body;
  const scoreNumber = Number(score);

  if (
    !listingId ||
    !Number.isInteger(scoreNumber) ||
    scoreNumber < 1 ||
    scoreNumber > 5
  ) {
    return res
      .status(400)
      .json({ message: "listingId and a score from 1 to 5 are required" });
  }

  // they have to have bought it
  const purchase = await prisma.orderItem.findFirst({
    where: {
      listingId: Number(listingId),
      order: { buyerId: authUser.id, status: "paid" },
    },
  });
  if (!purchase) {
    return res
      .status(403)
      .json({ message: "You can only rate sellers you bought from" });
  }

  if (purchase.sellerId === authUser.id) {
    return res.status(403).json({ message: "You can't rate yourself" });
  }

  // one rating per purchase
  const existing = await prisma.rating.findFirst({
    where: { raterId: authUser.id, listingId: Number(listingId) },
  });
  if (existing) {
    return res.status(409).json({ message: "You already rated this purchase" });
  }

  const text = typeof comment === "string" ? comment.trim().slice(0, 500) : "";

  await prisma.rating.create({
    data: {
      score: scoreNumber,
      comment: text || null,
      raterId: authUser.id,
      rateeId: purchase.sellerId,
      listingId: Number(listingId),
    },
  });

  res.status(201).json({ message: "Rating saved" });
});

module.exports = router;
