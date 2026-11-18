const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const stripe = require("../lib/stripe");
const requireAuth = require("../middleware/requireAuth");
const { toCents } = require("../lib/cart");
const {
  REPLY_HOURS,
  HOLD_HOURS,
  MIN_OFFER_CENTS,
  hoursFromNow,
  fmt,
  dollarsToCents,
  expireStaleOffers,
  postMessage,
  isBlocked,
  displayName,
} = require("../lib/offers");

router.use(requireAuth);

// the price must be a real amount, at least $0.50, and below the asking price
function checkAmount(amountCents, askingCents) {
  if (amountCents === null || amountCents < MIN_OFFER_CENTS) {
    return `Offers must be at least ${fmt(MIN_OFFER_CENTS)}.`;
  }
  if (amountCents >= askingCents) {
    return `Your offer has to be lower than the asking price (${fmt(askingCents)}).`;
  }
  return null;
}

// GET /offers/listing/:listingId - the asking price etc. for the chat header
router.get("/listing/:listingId", async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: Number(req.params.listingId) },
    select: { id: true, title: true, price: true, status: true, sellerId: true },
  });
  if (!listing) return res.status(404).json({ message: "Listing not found" });
  res.json({
    id: listing.id,
    title: listing.title,
    status: listing.status,
    sellerId: listing.sellerId,
    priceCents: toCents(listing.price),
  });
});

// POST /offers  { listingId, amount, otherUserId }
// Buyer OR seller can start an offer. If the seller starts it, otherUserId is the buyer.
router.post("/", async (req, res) => {
  await expireStaleOffers();
  const listingId = Number(req.body.listingId);
  if (!Number.isInteger(listingId)) {
    return res.status(400).json({ message: "listingId is required" });
  }
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return res.status(404).json({ message: "Listing not found" });
  if (listing.status !== "active") {
    return res.status(409).json({ message: "This item has already been sold." });
  }

  const iAmSeller = listing.sellerId === req.userId;
  const buyerId = iAmSeller ? String(req.body.otherUserId || "") : req.userId;
  const otherId = iAmSeller ? buyerId : listing.sellerId;
  if (iAmSeller) {
    // a seller can only offer a price to someone they are already chatting with about this item
    const chatted = buyerId && buyerId !== req.userId
      ? await prisma.message.findFirst({
          where: {
            listingId,
            OR: [
              { senderId: req.userId, receiverId: buyerId },
              { senderId: buyerId, receiverId: req.userId },
            ],
          },
        })
      : null;
    if (!chatted) return res.status(400).json({ message: "Start a chat with this buyer first." });
  }

  if (await isBlocked(req.userId, otherId)) {
    return res.status(403).json({ message: "You can't make an offer because of a block." });
  }

  // the asking price comes from the database, never from the browser
  const askingCents = toCents(listing.price);
  const amountCents = dollarsToCents(req.body.amount);
  const problem = checkAmount(amountCents, askingCents);
  if (problem) return res.status(400).json({ message: problem });

  const open = await prisma.offer.findFirst({
    where: { listingId, buyerId, status: { in: ["pending", "accepted"] } },
  });
  if (open) {
    return res.status(409).json({ message: "You already have an open offer on this item." });
  }

  const offer = await prisma.offer.create({
    data: {
      listingId,
      buyerId,
      sellerId: listing.sellerId,
      proposerId: req.userId,
      amountCents,
      askingCents,
      expiresAt: hoursFromNow(REPLY_HOURS),
    },
  });
  await postMessage(req.app.get("io"), {
    senderId: req.userId,
    receiverId: otherId,
    listingId,
    kind: "offer",
    content: `Offered ${fmt(amountCents)}`,
    offerId: offer.id,
  });
  res.status(201).json(offer);
});

// Shared checks for accept / decline / counter:
// you must be in the deal, the OTHER person made the offer, and it must still be open.
async function loadOpenOffer(req, res) {
  await expireStaleOffers();
  const offer = await prisma.offer.findUnique({
    where: { id: Number(req.params.id) },
    include: { listing: true },
  });
  if (!offer || (offer.buyerId !== req.userId && offer.sellerId !== req.userId)) {
    res.status(404).json({ message: "Offer not found" });
    return null;
  }
  if (offer.proposerId === req.userId) {
    res.status(403).json({ message: "Wait for the other person to reply to your offer." });
    return null;
  }
  if (offer.status !== "pending") {
    res.status(409).json({ message: "This offer is no longer open." });
    return null;
  }
  if (await isBlocked(req.userId, offer.proposerId)) {
    res.status(403).json({ message: "You can't reply because of a block." });
    return null;
  }
  if (offer.listing.status !== "active") {
    res.status(409).json({ message: "This item has already been sold." });
    return null;
  }
  return offer;
}

// POST /offers/:id/accept
router.post("/:id/accept", async (req, res) => {
  const offer = await loadOpenOffer(req, res);
  if (!offer) return;

  // only one buyer at a time can have the price held
  const held = await prisma.offer.findFirst({
    where: { listingId: offer.listingId, status: "accepted", id: { not: offer.id } },
  });
  if (held) {
    return res
      .status(409)
      .json({ message: "A price is already being held for another buyer on this item." });
  }

  // claim it only if it is STILL pending (stops a double click / two tabs)
  const now = new Date();
  const claimed = await prisma.offer.updateMany({
    where: { id: offer.id, status: "pending", expiresAt: { gt: now } },
    data: { status: "accepted", respondedAt: now, holdUntil: hoursFromNow(HOLD_HOURS) },
  });
  if (!claimed.count) return res.status(409).json({ message: "This offer is no longer open." });

  const name = await displayName(req.userId);
  await postMessage(req.app.get("io"), {
    senderId: req.userId,
    receiverId: offer.proposerId,
    listingId: offer.listingId,
    kind: "system",
    content: `${name} accepted the offer of ${fmt(offer.amountCents)}`,
    offerId: offer.id,
  });
  res.json({ ok: true });
});

// POST /offers/:id/decline
router.post("/:id/decline", async (req, res) => {
  const offer = await loadOpenOffer(req, res);
  if (!offer) return;

  const claimed = await prisma.offer.updateMany({
    where: { id: offer.id, status: "pending" },
    data: { status: "declined", respondedAt: new Date() },
  });
  if (!claimed.count) return res.status(409).json({ message: "This offer is no longer open." });

  const name = await displayName(req.userId);
  await postMessage(req.app.get("io"), {
    senderId: req.userId,
    receiverId: offer.proposerId,
    listingId: offer.listingId,
    kind: "system",
    content: `${name} declined the offer of ${fmt(offer.amountCents)}`,
    offerId: offer.id,
  });
  res.json({ ok: true });
});

// POST /offers/:id/counter  { amount }
router.post("/:id/counter", async (req, res) => {
  const offer = await loadOpenOffer(req, res);
  if (!offer) return;

  const askingCents = toCents(offer.listing.price);
  const amountCents = dollarsToCents(req.body.amount);
  const problem = checkAmount(amountCents, askingCents);
  if (problem) return res.status(400).json({ message: problem });

  const claimed = await prisma.offer.updateMany({
    where: { id: offer.id, status: "pending" },
    data: { status: "countered", respondedAt: new Date() },
  });
  if (!claimed.count) return res.status(409).json({ message: "This offer is no longer open." });

  const next = await prisma.offer.create({
    data: {
      listingId: offer.listingId,
      buyerId: offer.buyerId,
      sellerId: offer.sellerId,
      proposerId: req.userId,
      amountCents,
      askingCents,
      expiresAt: hoursFromNow(REPLY_HOURS),
    },
  });
  await postMessage(req.app.get("io"), {
    senderId: req.userId,
    receiverId: offer.proposerId,
    listingId: offer.listingId,
    kind: "offer",
    content: `Countered with ${fmt(amountCents)}`,
    offerId: next.id,
  });
  res.status(201).json(next);
});

// GET /offers/:id - used by the checkout page (buyer or seller only)
router.get("/:id", async (req, res) => {
  await expireStaleOffers();
  const offer = await prisma.offer.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      listing: { select: { id: true, title: true, location: true, imageUrl: true } },
      seller: { select: { name: true } },
    },
  });
  if (!offer || (offer.buyerId !== req.userId && offer.sellerId !== req.userId)) {
    return res.status(404).json({ message: "Offer not found" });
  }
  res.json(offer);
});

// POST /offers/:id/checkout - start paying for an ACCEPTED offer.
// The browser sends nothing about price. The amount below comes from the Offer row.
router.post("/:id/checkout", async (req, res) => {
  await expireStaleOffers();
  const offer = await prisma.offer.findUnique({
    where: { id: Number(req.params.id) },
    include: { listing: true },
  });
  if (!offer || offer.buyerId !== req.userId) {
    return res.status(404).json({ message: "Offer not found" });
  }
  if (offer.status !== "accepted" || !offer.holdUntil || offer.holdUntil <= new Date()) {
    return res.status(409).json({ message: "This price is no longer being held. Ask the seller again." });
  }
  if (offer.listing.status !== "active") {
    return res.status(409).json({ message: "This item has already been sold." });
  }

  const amount = offer.amountCents;
  const reusable = ["requires_payment_method", "requires_confirmation", "requires_action"];

  // refreshing the checkout page shouldn't create a second payment
  let order = await prisma.order.findFirst({
    where: { offerId: offer.id, buyerId: req.userId, status: "pending" },
    orderBy: { id: "desc" },
  });
  let intent = null;
  if (order?.stripePaymentIntentId) {
    const existing = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
    if (existing.amount === amount && reusable.includes(existing.status)) intent = existing;
  }

  if (!intent) {
    order = await prisma.order.create({
      data: {
        buyerId: req.userId,
        subtotalCents: amount,
        discountCents: 0,
        totalCents: amount,
        offerId: offer.id,
        items: {
          create: [
            {
              listingId: offer.listingId,
              sellerId: offer.sellerId,
              title: offer.listing.title,
              priceCents: amount,
            },
          ],
        },
      },
    });
    intent = await stripe.paymentIntents.create({
      amount: order.totalCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: String(order.id), offerId: String(offer.id) },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: intent.id },
    });
  }

  res.json({
    clientSecret: intent.client_secret,
    orderId: order.id,
    totals: { subtotalCents: amount, discountCents: 0, totalCents: amount, promoCode: null },
  });
});

module.exports = router;