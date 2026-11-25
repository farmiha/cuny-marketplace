const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/requireAuth");

// the first time (or after a long break) we only look back this far
const MAX_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

// Notifications only cover the CURRENT MONTH. On the 1st of each month the list starts fresh,
// and last month's notifications stop showing (nothing is deleted, they are just not loaded).
// The month is counted in New York time because that's where our students are.
const TZ = "America/New_York";

function startOfCurrentMonth() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year").value);
  const month = Number(parts.find((p) => p.type === "month").value);
  // 05:00 UTC on the 1st is midnight (winter) or 1am (summer) in New York,
  // so subtract the extra hour when it is summer time
  const guess = new Date(Date.UTC(year, month - 1, 1, 5));
  const hour =
    Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: TZ,
        hour: "numeric",
        hour12: false,
      }).format(guess),
    ) % 24;
  return new Date(guess.getTime() - hour * 60 * 60 * 1000);
}

const monthLabel = () =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "long",
    year: "numeric",
  }).format(new Date());

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// GET /notifications - everything new for the logged in user since they last opened the bell
// GET /notifications?all=1 - everything from the current month for the notifications page (newest first, with dates)
router.get("/", requireAuth, async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { notificationsSeenAt: true, suspendedAt: true },
  });
  if (!me) return res.json({ count: 0, items: [] });

  // the notifications page asks for everything, the bell only for what is new
  const all = req.query.all === "1";
  const weekAgo = new Date(Date.now() - MAX_LOOKBACK_MS);
  const monthStart = startOfCurrentMonth();
  const recent =
    me.notificationsSeenAt && me.notificationsSeenAt > weekAgo
      ? me.notificationsSeenAt
      : weekAgo;
  // the page shows the whole month; the bell shows what is new, but never older than this month
  const since = all ? monthStart : recent > monthStart ? recent : monthStart;

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

  // meetup reminders: 1 hour before a confirmed meetup (or right away if it was confirmed later than that)
  const upcoming = await prisma.meetup.findMany({
    where: {
      status: "confirmed",
      startsAt: { gt: new Date() },
      OR: [{ buyerId: req.userId }, { sellerId: req.userId }],
    },
    include: { listing: { select: { title: true } } },
  });
  for (const m of upcoming) {
    const reminderAt = new Date(
      Math.max(
        m.startsAt.getTime() - 60 * 60 * 1000,
        (m.confirmedAt || m.createdAt).getTime(),
      ),
    );
    if (reminderAt > since && reminderAt <= new Date()) {
      const otherId = m.buyerId === req.userId ? m.sellerId : m.buyerId;
      const mins = Math.max(1, Math.round((m.startsAt - Date.now()) / 60000));
      items.push({
        id: `meetup-${m.id}`,
        type: "meetup",
        text: `Meetup in ${mins} min: "${m.listing.title}" at ${m.spot}`,
        link: `/dashboard?tab=messages&listingId=${m.listingId}&receiverId=${otherId}`,
        at: reminderAt,
      });
    }
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
    return res.json({
      count: list.filter((n) => n.isNew).length,
      items: list,
      month: monthLabel(), // e.g. "November 2026", for the page heading
    });
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
