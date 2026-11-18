const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

const OPEN_STATUSES = ["pending", "responded"];

// every route in this file is admins only
router.use(requireAuth, requireAdmin);

// make (or remove) an admin by email
router.patch("/users/admin", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const isAdmin = req.body.isAdmin !== false;

  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) {
    return res.status(404).json({ message: "No account with that email" });
  }
  if (target.id === req.userId && !isAdmin) {
    return res
      .status(400)
      .json({ message: "You can't remove your own admin access" });
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { isAdmin },
    select: { email: true, isAdmin: true },
  });
  res.json(updated);
});

// listings that got 5 reports and are waiting for an admin
router.get("/listings/pending", async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { status: "under_review" },
    include: {
      category: true,
      seller: { select: { name: true, email: true } },
      reports: {
        where: { status: { in: OPEN_STATUSES } },
        // the reporters' names are never sent
        select: { reason: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(listings);
});

// approve: the listing goes back on Browse and its open reports are dismissed
router.patch("/listings/:id/approve", async (req, res) => {
  const id = Number(req.params.id);
  await prisma.$transaction([
    prisma.listing.update({ where: { id }, data: { status: "active" } }),
    prisma.report.updateMany({
      where: { listingId: id, status: { in: OPEN_STATUSES } },
      data: {
        status: "dismissed",
        resolution: "An admin reviewed this listing and put it back up.",
        resolvedAt: new Date(),
      },
    }),
  ]);
  res.json({ ok: true });
});

// reject: the listing is deleted for good. Its open reports are closed as
// upheld first (no strike), then the rows that point at the listing go.
router.patch("/listings/:id/reject", async (req, res) => {
  const id = Number(req.params.id);

  // a listing that was already bought is part of someone's receipt, keep it
  const inOrder = await prisma.orderItem.count({ where: { listingId: id } });
  if (inOrder > 0) {
    return res.status(409).json({
      message: "This listing is part of an order, so it can't be deleted.",
    });
  }

  await prisma.$transaction([
    prisma.report.updateMany({
      where: { listingId: id, status: { in: OPEN_STATUSES } },
      data: {
        status: "upheld",
        resolution: "An admin reviewed this listing and deleted it.",
        resolvedAt: new Date(),
      },
    }),
    prisma.listingView.deleteMany({ where: { listingId: id } }),
    prisma.message.deleteMany({ where: { listingId: id } }),
    prisma.listing.delete({ where: { id } }),
  ]);
  res.json({ ok: true });
});

module.exports = router;