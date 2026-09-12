// const express = require("express");
// const router = express.Router();
// const prisma = require("../prismaClient");

// router.get("/", async (req, res) => {
//   const listings = await prisma.listing.findMany({
//     where: { status: "active" },
//   });
//   res.json(listings);
// });

// router.get("/:id", async (req, res) => {
//   const listing = await prisma.listing.findUnique({
//     where: { id: Number(req.params.id) },
//   });
//   if (!listing) return res.status(404).json({ message: "Not found" });
//   res.json(listing);
// });

// router.post("/", async (req, res) => {
//   const listing = await prisma.listing.create({ data: req.body });
//   res.status(201).json(listing);
// });

module.exports = router;
