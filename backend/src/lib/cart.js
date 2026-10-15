const prisma = require("../prismaClient");

// Promo codes for the MVP. Amounts are in cents.
const PROMOS = {
  FIRSTBUY: { cents: 500, firstPurchaseOnly: true },
};

// Prices in the database are dollars (Float). Stripe wants whole cents.
const toCents = (price) => Math.round(Number(price) * 100);

// Works out subtotal / discount / total for a list of { priceCents } items.
async function calcTotals(userId, items, promoCode) {
  const subtotalCents = items.reduce((sum, i) => sum + i.priceCents, 0);
  let discountCents = 0;
  let appliedCode = null;
  let promoError = null;

  const code = (promoCode || "").trim().toUpperCase();
  if (code) {
    const promo = PROMOS[code];
    if (!promo) {
      promoError = "That promo code isn't valid.";
    } else {
      const paidOrders = await prisma.order.count({
        where: { buyerId: userId, status: "paid" },
      });
      if (promo.firstPurchaseOnly && paidOrders > 0) {
        promoError = `${code} only works on your first purchase.`;
      } else {
        discountCents = Math.min(promo.cents, subtotalCents);
        appliedCode = code;
      }
    }
  }

  return {
    subtotalCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
    promoCode: appliedCode,
    promoError,
  };
}

// Everything the cart page needs, in one object:
// items grouped by seller, saved-for-later items, and the totals.
async function loadCart(userId, promoCode) {
  const rows = await prisma.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        include: {
          category: true,
          seller: {
            select: {
              id: true,
              name: true,
              campus: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  // seller stats for the header of each seller card
  const sellerIds = [...new Set(rows.map((r) => r.listing.sellerId))];
  const [ratings, sales] = await Promise.all([
    prisma.rating.groupBy({
      by: ["rateeId"],
      where: { rateeId: { in: sellerIds } },
      _avg: { score: true },
    }),
    prisma.listing.groupBy({
      by: ["sellerId"],
      where: { sellerId: { in: sellerIds }, status: "sold" },
      _count: { _all: true },
    }),
  ]);
  const ratingBySeller = Object.fromEntries(
    ratings.map((r) => [r.rateeId, r._avg.score]),
  );
  const salesBySeller = Object.fromEntries(
    sales.map((s) => [s.sellerId, s._count._all]),
  );

  const toItem = (row) => ({
    listingId: row.listingId,
    title: row.listing.title,
    category: row.listing.category.name,
    priceCents: toCents(row.listing.price),
    condition: row.listing.condition,
    location: row.listing.location,
    imageUrl: row.listing.imageUrl,
    sellerId: row.listing.sellerId,
    sellerName: row.listing.seller.name,
    // someone else may have bought it since it was added
    unavailable: row.listing.status !== "active",
  });

  const bySeller = new Map();
  const saved = [];
  for (const row of rows) {
    const item = toItem(row);
    if (row.savedForLater) {
      saved.push(item);
      continue;
    }
    const s = row.listing.seller;
    if (!bySeller.has(s.id)) {
      const avg = ratingBySeller[s.id];
      bySeller.set(s.id, {
        seller: {
          id: s.id,
          name: s.name,
          campus: s.campus.name,
          rating: avg ? Number(avg.toFixed(1)) : null,
          sales: salesBySeller[s.id] || 0,
        },
        items: [],
      });
    }
    bySeller.get(s.id).items.push(item);
  }

  const groups = [...bySeller.values()];
  const allItems = groups.flatMap((g) => g.items);
  const activeItems = allItems.filter((i) => !i.unavailable);
  const totals = await calcTotals(userId, activeItems, promoCode);

  return {
    groups,
    saved,
    totals,
    count: activeItems.length,
    unavailableCount: allItems.length - activeItems.length,
  };
}

module.exports = { loadCart, calcTotals, toCents };
