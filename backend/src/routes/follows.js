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
