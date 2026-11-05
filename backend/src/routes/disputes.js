const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/requireAuth");

async function requireAdmin(req, res, next) {
  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!me?.isAdmin) return res.status(403).json({ message: "Admins only" });
  next();
}

// reports a moderator can decide: seller replied, or deadline passed with no reply
// (old reports with no deadline count too)
const decidable = () => ({
  OR: [
    { status: "responded" },
    { status: "pending", responseDeadline: { lt: new Date() } },
    { status: "pending", responseDeadline: null },
  ],
});

// seller replies to a report about them
router.patch("/:id/respond", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const text =
    typeof req.body.response === "string" ? req.body.response.trim() : "";
  if (!text || text.length > 1000) {
    return res
      .status(400)
      .json({ message: "Response must be 1-1000 characters" });
  }

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return res.status(404).json({ message: "Report not found" });
  if (report.reportedId !== req.userId) {
    return res.status(403).json({ message: "Not your report" });
  }
  if (report.status !== "pending") {
    return res
      .status(409)
      .json({ message: "This report was already answered or closed" });
  }
  if (report.responseDeadline && report.responseDeadline < new Date()) {
    return res
      .status(409)
      .json({ message: "The response deadline has passed" });
  }

  const updated = await prisma.report.update({
    where: { id },
    data: {
      sellerResponse: text,
      respondedAt: new Date(),
      status: "responded",
    },
  });
  res.json({ id: updated.id, status: updated.status });
});

// moderator queue (never shows reports you're involved in)
router.get("/admin/queue", requireAuth, requireAdmin, async (req, res) => {
  const reports = await prisma.report.findMany({
    where: {
      AND: [
        decidable(),
        { NOT: [{ reportedId: req.userId }, { reporterId: req.userId }] },
      ],
    },
    include: {
      listing: { select: { id: true, title: true } },
      reported: {
        select: { id: true, name: true, email: true, strikes: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(reports);
});

// moderator decides: "upheld" (seller gets a strike) or "dismissed"
router.patch(
  "/admin/:id/decide",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);
    const { decision, note } = req.body;
    if (!["upheld", "dismissed"].includes(decision)) {
      return res
        .status(400)
        .json({ message: "decision must be upheld or dismissed" });
    }

    const target = await prisma.report.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ message: "Report not found" });
    if (target.reportedId === req.userId || target.reporterId === req.userId) {
      return res
        .status(403)
        .json({ message: "You can't decide a report you're involved in" });
    }

    try {
      await prisma.$transaction(async (tx) => {
        // two admins can't decide the same report twice
        const r = await tx.report.updateMany({
          where: { id, ...decidable() },
          data: {
            status: decision,
            resolution:
              typeof note === "string" ? note.trim().slice(0, 500) : null,
            resolvedAt: new Date(),
          },
        });
        if (r.count === 0) throw new Error("NOT_DECIDABLE");

        if (decision === "upheld") {
          await tx.user.update({
            where: { id: target.reportedId },
            data: { strikes: { increment: 1 } },
          });
        }
      });
      res.json({ message: "Decision saved" });
    } catch (err) {
      if (err.message === "NOT_DECIDABLE") {
        return res
          .status(409)
          .json({ message: "Report not found or not ready for a decision" });
      }
      throw err;
    }
  },
);

module.exports = router;