const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/requireAuth");
const { SAFE_SPOTS, expireStaleMeetups, checkProposal } = require("../lib/meetups");
const { postMessage, isBlocked, displayName } = require("../lib/offers");

router.use(requireAuth);

const cleanNote = (n) =>
  typeof n === "string" && n.trim() ? n.trim().slice(0, 140) : null;

// GET /meetups/spots?listingId=5 - safe spots, plus any spots the seller put on the listing
router.get("/spots", async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: Number(req.query.listingId) },
    select: { location: true },
  });
  const extra = (listing?.location || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && !SAFE_SPOTS.some((x) => x.toLowerCase() === s.toLowerCase()));
  res.json({ spots: [...SAFE_SPOTS, ...extra] });
});

// POST /meetups { listingId, otherUserId, startsAt, spot, note }
// buyer or seller can propose
router.post("/", async (req, res) => {
  await expireStaleMeetups();
  const listingId = Number(req.body.listingId);
  const startsAt = new Date(req.body.startsAt);
  const spot = String(req.body.spot || "").trim();

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return res.status(404).json({ message: "Listing not found" });

  const iAmSeller = listing.sellerId === req.userId;
  const otherId = iAmSeller ? String(req.body.otherUserId || "") : listing.sellerId;
  if (!otherId || otherId === req.userId) {
    return res.status(400).json({ message: "Pick who you are meeting." });
  }
  const buyerId = iAmSeller ? otherId : req.userId;

  // you can only plan a meetup with someone you are already chatting with
  const chatted = await prisma.message.findFirst({
    where: {
      listingId,
      OR: [
        { senderId: req.userId, receiverId: otherId },
        { senderId: otherId, receiverId: req.userId },
      ],
    },
  });
  if (!chatted) return res.status(400).json({ message: "Start a chat first." });

  if (await isBlocked(req.userId, otherId)) {
    return res.status(403).json({ message: "You can't plan a meetup because of a block." });
  }

  const problem = checkProposal(startsAt, spot);
  if (problem) return res.status(400).json({ message: problem });

  const open = await prisma.meetup.findFirst({
    where: { listingId, buyerId, status: { in: ["pending", "confirmed"] } },
  });
  if (open) {
    return res.status(409).json({ message: "You already have a meetup planned for this item." });
  }

  const meetup = await prisma.meetup.create({
    data: {
      listingId,
      buyerId,
      sellerId: listing.sellerId,
      proposerId: req.userId,
      startsAt,
      spot,
      note: cleanNote(req.body.note),
    },
  });
  await postMessage(req.app.get("io"), {
    senderId: req.userId,
    receiverId: otherId,
    listingId,
    kind: "meetup",
    content: "Proposed a meetup",
    meetupId: meetup.id,
  });
  res.status(201).json(meetup);
});

// shared checks for confirm / decline / reschedule: you are in it, the OTHER person proposed, still open
async function loadOpenMeetup(req, res) {
  await expireStaleMeetups();
  const meetup = await prisma.meetup.findUnique({ where: { id: Number(req.params.id) } });
  if (!meetup || (meetup.buyerId !== req.userId && meetup.sellerId !== req.userId)) {
    res.status(404).json({ message: "Meetup not found" });
    return null;
  }
  if (meetup.proposerId === req.userId) {
    res.status(403).json({ message: "Wait for the other person to reply." });
    return null;
  }
  if (meetup.status !== "pending") {
    res.status(409).json({ message: "This meetup is no longer open." });
    return null;
  }
  if (await isBlocked(req.userId, meetup.proposerId)) {
    res.status(403).json({ message: "You can't reply because of a block." });
    return null;
  }
  return meetup;
}

async function systemLine(req, meetup, otherId, verb) {
  const name = await displayName(req.userId);
  await postMessage(req.app.get("io"), {
    senderId: req.userId,
    receiverId: otherId,
    listingId: meetup.listingId,
    kind: "system",
    content: `${name} ${verb} the meetup`,
    meetupId: meetup.id,
  });
}

// POST /meetups/:id/confirm
router.post("/:id/confirm", async (req, res) => {
  const meetup = await loadOpenMeetup(req, res);
  if (!meetup) return;
  const now = new Date();
  const claimed = await prisma.meetup.updateMany({
    where: { id: meetup.id, status: "pending", startsAt: { gt: now } },
    data: { status: "confirmed", respondedAt: now, confirmedAt: now },
  });
  if (!claimed.count) return res.status(409).json({ message: "This meetup is no longer open." });
  await systemLine(req, meetup, meetup.proposerId, "confirmed");
  res.json({ ok: true });
});

// POST /meetups/:id/decline
router.post("/:id/decline", async (req, res) => {
  const meetup = await loadOpenMeetup(req, res);
  if (!meetup) return;
  const claimed = await prisma.meetup.updateMany({
    where: { id: meetup.id, status: "pending" },
    data: { status: "declined", respondedAt: new Date() },
  });
  if (!claimed.count) return res.status(409).json({ message: "This meetup is no longer open." });
  await systemLine(req, meetup, meetup.proposerId, "declined");
  res.json({ ok: true });
});

// POST /meetups/:id/reschedule { startsAt, spot, note } - "suggest another time"
router.post("/:id/reschedule", async (req, res) => {
  const meetup = await loadOpenMeetup(req, res);
  if (!meetup) return;
  const startsAt = new Date(req.body.startsAt);
  const spot = String(req.body.spot || "").trim();
  const problem = checkProposal(startsAt, spot);
  if (problem) return res.status(400).json({ message: problem });

  const claimed = await prisma.meetup.updateMany({
    where: { id: meetup.id, status: "pending" },
    data: { status: "rescheduled", respondedAt: new Date() },
  });
  if (!claimed.count) return res.status(409).json({ message: "This meetup is no longer open." });

  const next = await prisma.meetup.create({
    data: {
      listingId: meetup.listingId,
      buyerId: meetup.buyerId,
      sellerId: meetup.sellerId,
      proposerId: req.userId,
      startsAt,
      spot,
      note: cleanNote(req.body.note),
    },
  });
  await postMessage(req.app.get("io"), {
    senderId: req.userId,
    receiverId: meetup.proposerId,
    listingId: meetup.listingId,
    kind: "meetup",
    content: "Suggested another time",
    meetupId: next.id,
  });
  res.status(201).json(next);
});

// POST /meetups/:id/cancel - either person can cancel a confirmed meetup,
// or the proposer can take back a proposal nobody has answered yet
router.post("/:id/cancel", async (req, res) => {
  await expireStaleMeetups();
  const meetup = await prisma.meetup.findUnique({ where: { id: Number(req.params.id) } });
  if (!meetup || (meetup.buyerId !== req.userId && meetup.sellerId !== req.userId)) {
    return res.status(404).json({ message: "Meetup not found" });
  }
  const mayCancel =
    meetup.status === "confirmed" ||
    (meetup.status === "pending" && meetup.proposerId === req.userId);
  if (!mayCancel) return res.status(409).json({ message: "This meetup can't be canceled." });

  const claimed = await prisma.meetup.updateMany({
    where: { id: meetup.id, status: meetup.status },
    data: { status: "canceled", respondedAt: new Date() },
  });
  if (!claimed.count) return res.status(409).json({ message: "This meetup can't be canceled." });

  const otherId = meetup.buyerId === req.userId ? meetup.sellerId : meetup.buyerId;
  await systemLine(req, meetup, otherId, "canceled");
  res.json({ ok: true });
});

module.exports = router;