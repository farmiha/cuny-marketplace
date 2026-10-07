const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/requireAuth");

// NEW: GET /messages/conversations - inbox, one row per (listing, other person)
router.get("/conversations", requireAuth, async (req, res) => {
  const msgs = await prisma.message.findMany({
    where: { OR: [{ senderId: req.userId }, { receiverId: req.userId }] },
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { title: true } },
      sender: { select: { id: true, email: true, name: true } },
      receiver: { select: { id: true, email: true, name: true } },
    },
  });

  const convos = new Map();
  for (const m of msgs) {
    const other = m.senderId === req.userId ? m.receiver : m.sender;
    const key = `${m.listingId}:${other.id}`;
    if (!convos.has(key)) {
      convos.set(key, {
        listingId: m.listingId,
        listingTitle: m.listing.title,
        otherUserId: other.id,
        otherUserName: other.name || other.email.split("@")[0],
        lastMessage: m.content,
        lastAt: m.createdAt,
        unread: 0,
      });
    }
    if (m.receiverId === req.userId && !m.read) convos.get(key).unread++;
  }
  res.json([...convos.values()]);
});

// NEW: GET /messages/conversations/:listingId/:otherUserId - one chat's history
router.get("/conversations/:listingId/:otherUserId", requireAuth, async (req, res) => {
  const listingId = Number(req.params.listingId);
  const other = req.params.otherUserId;
  const messages = await prisma.message.findMany({
    where: {
      listingId,
      OR: [
        { senderId: req.userId, receiverId: other },
        { senderId: other, receiverId: req.userId },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(messages);
});

// NEW: PATCH /messages/conversations/:listingId/:otherUserId/read
router.patch("/conversations/:listingId/:otherUserId/read", requireAuth, async (req, res) => {
  const result = await prisma.message.updateMany({
    where: {
      listingId: Number(req.params.listingId),
      senderId: req.params.otherUserId,
      receiverId: req.userId,
      read: false,
    },
    data: { read: true },
  });
  res.json({ updated: result.count });
});

// GET /messages/:listingId?userId=... - load message history for a listing
router.get("/:listingId", async (req, res) => {
  const listingId = Number(req.params.listingId);
  const userId = req.query.userId;

  const messages = await prisma.message.findMany({
    where: {
      listingId,
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(messages);
});

// PATCH /messages/:id/read - mark a message as read
router.patch("/:id/read", async (req, res) => {
  const messageId = Number(req.params.id);

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { read: true },
  });
  res.json(updated);
});

module.exports = router;