const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const supabase = require("../supabaseClient");

// get the logged in Supabase user from the request, or null
async function getAuthUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// newest listings from everyone the logged in user follows
router.get("/feed", async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ message: "Not logged in" });

  const follows = await prisma.follow.findMany({
    where: { followerId: authUser.id },
    select: { followingId: true },
  });

  const listings = await prisma.listing.findMany({
    where: {
      sellerId: { in: follows.map((f) => f.followingId) },
      status: "active",
    },
    include: { category: true, seller: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  res.json({ followingCount: follows.length, listings });
});

// is the logged in user following this person? (false if nobody is logged in)
router.get("/status/:userId", async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return res.json({ following: false });

  const row = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: authUser.id,
        followingId: req.params.userId,
      },
    },
  });
  res.json({ following: !!row });
});

// how many people follow this user (public, no login needed)
router.get("/count/:userId", async (req, res) => {
  const followers = await prisma.follow.count({
    where: { followingId: req.params.userId },
  });
  res.json({ followers });
});

// the logged in user's own followers and the people they follow (names only, nothing private)
router.get("/me/lists", async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ message: "Not logged in" });

  const [followers, following] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: authUser.id },
      include: { follower: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.follow.findMany({
      where: { followerId: authUser.id },
      include: { following: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  res.json({
    followers: followers.map((f) => ({
      id: f.follower.id,
      name: f.follower.name || "CUNY student",
    })),
    following: following.map((f) => ({
      id: f.following.id,
      name: f.following.name || "CUNY student",
    })),
  });
});

// who follows this user (names only, public like the follower count)
router.get("/list/:userId", async (req, res) => {
  const rows = await prisma.follow.findMany({
    where: { followingId: req.params.userId },
    include: { follower: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({
    followers: rows.map((f) => ({
      id: f.follower.id,
      name: f.follower.name || "CUNY student",
    })),
  });
});

// follow someone
router.post("/:userId", async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ message: "Not logged in" });

  const targetId = req.params.userId;
  if (targetId === authUser.id) {
    return res.status(400).json({ message: "You can't follow yourself" });
  }

  const [me, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: authUser.id } }),
    prisma.user.findUnique({ where: { id: targetId } }),
  ]);
  if (!me) return res.status(404).json({ message: "Account not found" });
  if (!target) return res.status(404).json({ message: "User not found" });

  // if this seller blocked me, I can't follow them
  const blocked = await prisma.followBlock.findUnique({
    where: {
      blockerId_blockedId: { blockerId: target.id, blockedId: me.id },
    },
  });
  if (blocked) {
    return res.status(403).json({ message: "You can't follow this seller" });
  }

  // following twice does nothing, it is not an error
  await prisma.follow.upsert({
    where: {
      followerId_followingId: { followerId: me.id, followingId: target.id },
    },
    update: {},
    create: { followerId: me.id, followingId: target.id },
  });

  res.status(201).json({ following: true });
});

// remove one of MY followers (they can follow me again)
router.delete("/followers/:followerId", async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ message: "Not logged in" });

  await prisma.follow.deleteMany({
    where: { followerId: req.params.followerId, followingId: authUser.id },
  });
  res.json({ removed: true });
});

// block someone from following me: removes them now, and they can't follow again
router.post("/block/:userId", async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ message: "Not logged in" });

  const targetId = req.params.userId;
  if (targetId === authUser.id) {
    return res.status(400).json({ message: "You can't block yourself" });
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return res.status(404).json({ message: "User not found" });

  await prisma.followBlock.upsert({
    where: {
      blockerId_blockedId: { blockerId: authUser.id, blockedId: targetId },
    },
    update: {},
    create: { blockerId: authUser.id, blockedId: targetId },
  });
  await prisma.follow.deleteMany({
    where: { followerId: targetId, followingId: authUser.id },
  });

  res.json({ blocked: true });
});

// unfollow someone
router.delete("/:userId", async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ message: "Not logged in" });

  await prisma.follow.deleteMany({
    where: { followerId: authUser.id, followingId: req.params.userId },
  });

  res.json({ following: false });
});

module.exports = router;
