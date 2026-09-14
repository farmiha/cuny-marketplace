const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");

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