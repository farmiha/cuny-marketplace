const prisma = require("../prismaClient");

const REPLY_HOURS = 24; // seller/buyer has this long to answer an offer
const HOLD_HOURS = 24; // an accepted price is held for the buyer this long
const MIN_OFFER_CENTS = 50; // Stripe can't charge less than $0.50

const hoursFromNow = (h) => new Date(Date.now() + h * 60 * 60 * 1000);
const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

// "50" or "49.99" -> cents. Returns null when it isn't a real number.
function dollarsToCents(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

// Offers expire by themselves. Instead of a timer we just clean up
// whenever someone loads a chat or touches an offer.
async function expireStaleOffers() {
  const now = new Date();
  await prisma.offer.updateMany({
    where: { status: "pending", expiresAt: { lt: now } },
    data: { status: "expired" },
  });
  await prisma.offer.updateMany({
    where: { status: "accepted", holdUntil: { lt: now } },
    data: { status: "expired" },
  });
}

// the little message that shows up in the chat (offer card or system line).
// It is pushed through the same "user:<id>" socket rooms as normal chat
// messages, so both people see it right away.
async function postMessage(io, { senderId, receiverId, listingId, kind, content, offerId }) {
  const created = await prisma.message.create({
    data: { senderId, receiverId, listingId, kind, content, offerId: offerId || null },
    include: {
      offer: true,
      sender: { select: { name: true, email: true } },
      listing: { select: { title: true } },
    },
  });
  const { sender, listing, ...message } = created;
  const payload = {
    ...message,
    senderName: sender.name || sender.email.split("@")[0],
    listingTitle: listing.title,
  };
  io?.to(`user:${receiverId}`).emit("new_message", payload);
  io?.to(`user:${senderId}`).emit("new_message", payload);
  return message;
}

// same rule as chat: if either person blocked the other, no offers
async function isBlocked(a, b) {
  const row = await prisma.followBlock.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
  });
  return !!row;
}

async function displayName(userId) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  return u?.name || u?.email?.split("@")[0] || "Someone";
}

module.exports = {
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
};