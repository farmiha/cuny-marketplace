const prisma = require("../prismaClient");

// use after requireAuth (it sets req.userId)
module.exports = async function requireAdmin(req, res, next) {
  const me = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { isAdmin: true },
  });
  if (!me?.isAdmin) return res.status(403).json({ message: "Admins only" });
  next();
};