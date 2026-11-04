const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const supabase = require("../supabaseClient");

const REASONS = [
  "Spam",
  "Scam or fraud",
  "Prohibited item",
  "Inappropriate",
  "Wrong category",
  "Other",
];

// sellers get 72 hours to respond to a report
const RESPONSE_HOURS = 72;

// a report is "open" while it's waiting on the seller or the moderator
const OPEN_STATUSES = ["pending", "responded"];

async function getAuthUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// reports about the logged in seller (reporter's name is never sent)
router.get("/received", async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ message: "Not logged in" });

  const reports = await prisma.report.findMany({
    where: { reportedId: authUser.id },
    include: { listing: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });

  res.json(
    reports.map((r) => ({
      id: r.id,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
      listingTitle: r.listing?.title || "Deleted listing",
      responseDeadline: r.responseDeadline,
      sellerResponse: r.sellerResponse,
      respondedAt: r.respondedAt,
      resolution: r.resolution,
      resolvedAt: r.resolvedAt,
    })),
  );
});

// does the logged in user already have an open report on this listing?
router.get("/mine/:listingId", async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ message: "Not logged in" });

  const open = await prisma.report.findFirst({
    where: {
      reporterId: authUser.id,
      listingId: Number(req.params.listingId),
      status: { in: OPEN_STATUSES },
    },
  });

  res.json({ pending: Boolean(open) });
});

// send a new report about a listing
router.post("/", async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ message: "Not logged in" });

  const { listingId, reason, details } = req.body;
  if (!listingId || !REASONS.includes(reason)) {
    return res
      .status(400)
      .json({ message: "listingId and a valid reason are required" });
  }

  const me = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!me) {
    return res
      .status(403)
      .json({ message: "Finish signing up before reporting a listing" });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: Number(listingId) },
  });
  if (!listing) return res.status(404).json({ message: "Listing not found" });

  if (listing.sellerId === me.id) {
    return res
      .status(403)
      .json({ message: "You can't report your own listing" });
  }

  // one open report per person per listing
  const open = await prisma.report.findFirst({
    where: {
      reporterId: me.id,
      listingId: listing.id,
      status: { in: OPEN_STATUSES },
    },
  });
  if (open) {
    return res.status(409).json({
      message: "You already reported this listing, we're reviewing it",
    });
  }

  const extra = typeof details === "string" ? details.trim().slice(0, 500) : "";

  await prisma.report.create({
    data: {
      reason: extra ? `${reason}: ${extra}` : reason,
      reporterId: me.id,
      reportedId: listing.sellerId,
      listingId: listing.id,
      responseDeadline: new Date(Date.now() + RESPONSE_HOURS * 60 * 60 * 1000),
    },
  });

  res.status(201).json({ message: "Report sent" });
});

module.exports = router;