const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");


router.get("/", async (req, res) => {
 const campuses = await prisma.campus.findMany({
   select: { id: true, name: true },
   orderBy: { name: "asc" },
 });
 res.json(campuses);
});


module.exports = router;
