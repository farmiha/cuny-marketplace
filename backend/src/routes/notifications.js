const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/requireAuth");

// the first time (or after a long break) we only look back this far
const MAX_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// GET /notifications - everything new for the logged in user since they last opened the bell
// GET /notifications?all=1 - the full history for the notifications page (newest first, with dates)
router.get("/", requireAuth, async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { notificationsSeenAt: true, suspendedAt: true },
  });
  if (!me) return res.json({ count: 0, items: [] });

  // the notifications page asks for everything, the bell only for what is new
  const all = req.query.all === "1";
  const weekAgo = new Date(Date.now() - MAX_LOOKBACK_MS);
  const since = all
    ? new Date(0)
    : me.notificationsSeenAt && me.notificationsSeenAt > weekAgo
      ? me.notificationsSeenAt
      : weekAgo;

  const items = [];

  // new followers
  const followers = await prisma.follow.findMany({
    where: { followingId: req.userId, createdAt: { gt: since } },
    include: { follower: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  if (all) {
    // on the history page every follower gets their own line
    for (const f of followers) {
      items.push({
        id: `follower-${f.id}`,
        type: "follow",
        text: `${f.follower.name || "Someone"} started following you`,
        link: "/dashboard?tab=profile",
        at: f.createdAt,
      });
    }
  } else if (followers.length === 1) {
    items.push({
      id: "followers",
      type: "follow",
      text: `${followers[0].follower.name || "Someone"} started following you`,
      link: "/dashboard?tab=profile",
      at: followers[0].createdAt,
    });
  } else if (followers.length > 1) {
    items.push({
      id: "followers",
      type: "follow",
      text: `You have ${followers.length} new followers`,
      link: "/dashboard?tab=profile",
      at: followers[0].createdAt,
    });
  }

  // new views on each of the user's listings
  const views = await prisma.listingView.groupBy({
    by: ["listingId"],
    where: { createdAt: { gt: since }, listing: { sellerId: req.userId } },
    _count: { _all: true },
    _max: { createdAt: true },
  });
  const viewedListings = await prisma.listing.findMany({
    where: { id: { in: views.map((v) => v.listingId) } },
    select: { id: true, title: true },
  });
  for (const v of views) {
    const listing = viewedListings.find((l) => l.id === v.listingId);
    if (!listing) continue;
    items.push({
      id: `views-${v.listingId}`,
      type: "views",
      text: `${plural(v._count._all, "person")} viewed your listing "${listing.title}"`,
      link: `/listing/${v.listingId}`,
      at: v._max.createdAt,
    });
  }

  // people who saved (hearted) the user's listings
  const saves = await prisma.savedListing.groupBy({
    by: ["listingId"],
    where: {
      createdAt: { gt: since },
      userId: { not: req.userId },
      listing: { sellerId: req.userId },
    },
    _count: { _all: true },
    _max: { createdAt: true },
  });
  const savedListings = await prisma.listing.findMany({
    where: { id: { in: saves.map((s) => s.listingId) } },
    select: { id: true, title: true },
  });
  for (const s of saves) {
    const listing = savedListings.find((l) => l.id === s.listingId);
    if (!listing) continue;
    items.push({
      id: `saves-${s.listingId}`,
      type: "save",
      text: `${plural(s._count._all, "person")} saved your listing "${listing.title}"`,
      link: `/listing/${s.listingId}`,
      at: s._max.createdAt,
    });
  }

  // items that sold
  const sold = await prisma.orderItem.findMany({
    where: {
      sellerId: req.userId,
      order: { status: "paid", paidAt: { gt: since } },
    },
    include: { order: { select: { paidAt: true } } },
  });
  for (const s of sold) {
    items.push({
      id: `sold-${s.id}`,
      type: "sold",
      text: `"${s.title}" sold`,
      link: "/dashboard?tab=profile",
      at: s.order.paidAt,
    });
  }

  // new ratings
  const ratings = await prisma.rating.findMany({
    where: { rateeId: req.userId, createdAt: { gt: since } },
    orderBy: { createdAt: "desc" },
  });
  if (all) {
    for (const r of ratings) {
      items.push({
        id: `rating-${r.id}`,
        type: "rating",
        text: `You got a new ${r.score}-star rating`,
        link: "/dashboard?tab=profile",
        at: r.createdAt,
      });
    }
  } else if (ratings.length > 0) {
    items.push({
      id: "ratings",
      type: "rating",
      text:
        ratings.length === 1
          ? `You got a new ${ratings[0].score}-star rating`
          : `You got ${ratings.length} new ratings`,
      link: "/dashboard?tab=profile",
      at: ratings[0].createdAt,
    });
  }

  // report decisions (the reporter's name is never sent)
  const reports = await prisma.report.findMany({
    where: {
      reportedId: req.userId,
      status: { in: ["upheld", "dismissed"] },
      resolvedAt: { gt: since },
    },
    include: { listing: { select: { title: true } } },
    orderBy: { resolvedAt: "desc" },
  });
  for (const r of reports) {
    items.push({
      id: `report-${r.id}`,
      type: "report",
      text:
        r.status === "upheld"
          ? `A report on "${r.listing?.title || "your listing"}" was upheld, you got a strike`
          : `A report on "${r.listing?.title || "your listing"}" was dismissed`,
      link: "/dashboard?tab=profile",
      at: r.resolvedAt,
    });
  }

  // suspension
  if (me.suspendedAt && me.suspendedAt > since) {
    items.push({
      id: "suspended",
      type: "suspended",
      text: "Your account was suspended after 5 strikes",
      link: "/dashboard?tab=profile",
      at: me.suspendedAt,
    });
  }

  items.sort((a, b) => new Date(b.at) - new Date(a.at));

  if (all) {
    // mark the ones the user has not opened the bell for yet
    const seen = me.notificationsSeenAt
      ? new Date(me.notificationsSeenAt)
      : new Date(0);
    const list = items
      .slice(0, 200)
      .map((n) => ({ ...n, isNew: new Date(n.at) > seen }));
    return res.json({ count: list.filter((n) => n.isNew).length, items: list });
  }

  res.json({ count: items.length, items });
});

// POST /notifications/read - the user opened the bell, so everything so far counts as seen
router.post("/read", requireAuth, async (req, res) => {
  await prisma.user.update({
    where: { id: req.userId },
    data: { notificationsSeenAt: new Date() },
  });
  res.json({ ok: true });
});

module.exports = router;
