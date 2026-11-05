const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/requireAuth");

// how many requests one person can post in a rolling 24 hours
const DAILY_LIMIT = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 500;
const NOTE_MAX = 300;

// what we send about a request: only the requester's name, never their email
const requestInclude = {
  category: true,
  campus: { select: { id: true, name: true } },
  requester: { select: { name: true } },
};

// the part of a listing a response card needs
const listingSummary = {
  select: {
    id: true,
    title: true,
    price: true,
    condition: true,
    imageUrl: true,
    location: true,
    status: true,
  },
};

// this lists every open request (the Wanted page)
router.get("/", async (req, res) => {
  const requests = await prisma.wantedRequest.findMany({
    where: { status: "open" },
    include: {
      ...requestInclude,
      // count only answers whose listing is still for sale
      _count: {
        select: { responses: { where: { listing: { status: "active" } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(
    requests.map(({ _count, ...r }) => ({ ...r, responseCount: _count.responses })),
  );
});

// this lists the logged in user's own requests (open, fulfilled and closed)
// (it has to stay above "/:id" or "mine" would be read as a request id)
router.get("/mine", requireAuth, async (req, res) => {
  const requests = await prisma.wantedRequest.findMany({
    where: { requesterId: req.userId },
    include: {
      ...requestInclude,
      _count: {
        select: { responses: { where: { listing: { status: "active" } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(
    requests.map(({ _count, ...r }) => ({ ...r, responseCount: _count.responses })),
  );
});

// this lists the requests the logged in user has answered with a listing
router.get("/answered", requireAuth, async (req, res) => {
  const responses = await prisma.wantedResponse.findMany({
    where: { sellerId: req.userId },
    select: { requestId: true, listingId: true },
  });
  res.json(responses);
});

// this gets one request and the listings people offered for it
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ message: "Not found" });

  const request = await prisma.wantedRequest.findUnique({
    where: { id },
    include: {
      ...requestInclude,
      responses: {
        // offers whose listing was sold or taken down are hidden
        where: { listing: { status: "active" } },
        orderBy: { createdAt: "asc" },
        include: {
          listing: listingSummary,
          seller: { select: { name: true } },
        },
      },
    },
  });
  if (!request) return res.status(404).json({ message: "Not found" });

  res.json(request);
});

// this posts a new request
router.post("/", requireAuth, async (req, res) => {
  const { title, description, maxBudget, categoryName } = req.body || {};

  const cleanTitle = typeof title === "string" ? title.trim() : "";
  if (!cleanTitle || cleanTitle.length > TITLE_MAX) {
    return res
      .status(400)
      .json({ message: `A title is required (up to ${TITLE_MAX} characters)` });
  }

  const cleanDescription =
    typeof description === "string" ? description.trim() : "";
  if (cleanDescription.length > DESCRIPTION_MAX) {
    return res.status(400).json({
      message: `The description can be up to ${DESCRIPTION_MAX} characters`,
    });
  }

  // the budget is optional, but if it's there it's a whole number above 0
  let budget = null;
  if (maxBudget !== undefined && maxBudget !== null && maxBudget !== "") {
    budget = Number(maxBudget);
    if (!Number.isInteger(budget) || budget <= 0 || budget > 100000) {
      return res
        .status(400)
        .json({ message: "The budget has to be a whole number above 0" });
    }
  }

  const category = await prisma.category.findUnique({
    where: { name: String(categoryName || "") },
  });
  if (!category) return res.status(404).json({ message: "Category not found" });

  // the request goes under the poster's own campus
  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!me) {
    return res
      .status(403)
      .json({ message: "Finish signing up before posting a request" });
  }

  // stop people who already posted 5 requests in the last 24 hours
  // (deleting a request gives the slot back, like listings)
  const recent = await prisma.wantedRequest.findMany({
    where: {
      requesterId: me.id,
      createdAt: { gte: new Date(Date.now() - DAY_MS) },
    },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  if (recent.length >= DAILY_LIMIT) {
    const blocking = recent[recent.length - DAILY_LIMIT];
    return res.status(429).json({
      message: "You reached your limit, try again in 24 hours",
      nextPostAt: new Date(blocking.createdAt.getTime() + DAY_MS),
    });
  }

  const request = await prisma.wantedRequest.create({
    data: {
      title: cleanTitle,
      description: cleanDescription || null,
      maxBudget: budget,
      categoryId: category.id,
      campusId: me.campusId,
      requesterId: me.id,
    },
  });

  res.status(201).json(request);
});

// this answers a request with one of your own active listings
router.post("/:id/responses", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const listingId = Number(req.body?.listingId);
  if (!Number.isInteger(id) || !Number.isInteger(listingId)) {
    return res.status(400).json({ message: "listingId is required" });
  }

  const note = typeof req.body?.note === "string" ? req.body.note.trim() : "";
  if (note.length > NOTE_MAX) {
    return res
      .status(400)
      .json({ message: `The note can be up to ${NOTE_MAX} characters` });
  }

  const request = await prisma.wantedRequest.findUnique({ where: { id } });
  if (!request) return res.status(404).json({ message: "Request not found" });
  if (request.status !== "open") {
    return res.status(409).json({ message: "This request is no longer open" });
  }
  if (request.requesterId === req.userId) {
    return res
      .status(403)
      .json({ message: "You can't answer your own request" });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== req.userId) {
    return res
      .status(403)
      .json({ message: "You can only offer your own listings" });
  }
  if (listing.status !== "active") {
    return res
      .status(409)
      .json({ message: "That listing isn't for sale anymore" });
  }

  const existing = await prisma.wantedResponse.findUnique({
    where: { requestId_listingId: { requestId: id, listingId } },
  });
  if (existing) {
    return res
      .status(409)
      .json({ message: "You already offered that listing for this request" });
  }

  const response = await prisma.wantedResponse.create({
    data: {
      requestId: id,
      listingId,
      sellerId: req.userId,
      note: note || null,
    },
  });

  res.status(201).json(response);
});

// this takes back an offer (only the person who made it)
router.delete("/:id/responses/:responseId", requireAuth, async (req, res) => {
  const response = await prisma.wantedResponse.findUnique({
    where: { id: Number(req.params.responseId) },
  });
  if (!response || response.requestId !== Number(req.params.id)) {
    return res.status(404).json({ message: "Not found" });
  }
  if (response.sellerId !== req.userId) {
    return res
      .status(403)
      .json({ message: "You can only remove your own offers" });
  }

  await prisma.wantedResponse.delete({ where: { id: response.id } });
  res.status(204).send();
});

// this marks your request as found ("fulfilled"), closed, or open again
router.patch("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!["open", "fulfilled", "closed"].includes(status)) {
    return res
      .status(400)
      .json({ message: "status has to be open, fulfilled or closed" });
  }

  const request = await prisma.wantedRequest.findUnique({ where: { id } });
  if (!request) return res.status(404).json({ message: "Not found" });
  if (request.requesterId !== req.userId) {
    return res
      .status(403)
      .json({ message: "You can only change your own requests" });
  }

  const updated = await prisma.wantedRequest.update({
    where: { id },
    data: { status, closedAt: status === "open" ? null : new Date() },
  });
  res.json(updated);
});

// this deletes a request, only if it's yours (its offers go with it)
router.delete("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const request = await prisma.wantedRequest.findUnique({ where: { id } });
  if (!request) return res.status(404).json({ message: "Not found" });
  if (request.requesterId !== req.userId) {
    return res
      .status(403)
      .json({ message: "You can only delete your own requests" });
  }

  await prisma.wantedRequest.delete({ where: { id } });
  res.status(204).send();
});

module.exports = router;
