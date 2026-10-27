const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const supabase = require("../supabaseClient");

// the reasons people can pick from in the report popup
const REASONS = [
  "Spam",
  "Scam or fraud",
  "Prohibited item",
  "Inappropriate",
  "Wrong category",
  "Other",
];

// get the logged in Supabase user from the request, or null
async function getAuthUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// this lists the reports other people sent about the logged in seller (for their Profile)
// the reporter's name is never sent, so sellers can't see who reported them
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
    })),
  );
});

// this checks if the logged in user already has an open report on a listing
// (the listing page uses it to show "Reported" instead of the report button)
router.get("/mine/:listingId", async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ message: "Not logged in" });

  const open = await prisma.report.findFirst({
    where: {
      reporterId: authUser.id,
      listingId: Number(req.params.listingId),
      status: "pending",
    },
  });

  res.json({ pending: Boolean(open) });
});

// this sends a new report about a listing
router.post("/", async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ message: "Not logged in" });

  const { listingId, reason, details } = req.body;
  if (!listingId || !REASONS.includes(reason)) {
    return res
      .status(400)
      .json({ message: "listingId and a valid reason are required" });
  }

  // the reporter needs a real account (not just a Supabase login)
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

  // one open report per person per listing, they can report again after it's been reviewed
  const open = await prisma.report.findFirst({
    where: { reporterId: me.id, listingId: listing.id, status: "pending" },
  });
  if (open) {
    return res
      .status(409)
      .json({
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
    },
  });

  res.status(201).json({ message: "Report sent" });
});

module.exports = router;
