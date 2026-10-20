const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");

// how many registered students each campus has
router.get("/students", async (req, res) => {
  try {
    const [groups, campuses] = await Promise.all([
      prisma.user.groupBy({
        by: ["campusId"],
        _count: { _all: true },
      }),
      prisma.campus.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const counts = new Map(groups.map((g) => [g.campusId, g._count._all]));

    res.json(
      campuses.map((c) => ({
        campus: c.name,
        students: counts.get(c.id) ?? 0,
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load student analytics" });
  }
});

module.exports = router;