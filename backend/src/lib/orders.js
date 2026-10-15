const prisma = require("../prismaClient");

// Called once Stripe says the payment went through.
// Safe to call more than once (the webhook AND the confirmation page both call it).
async function fulfillOrder(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.status === "paid") return order;

  const listingIds = order.items.map((i) => i.listingId);
  const now = new Date();

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "paid", paidAt: now },
    }),
    // sold items disappear from Browse (Browse only shows status "active")
    prisma.listing.updateMany({
      where: { id: { in: listingIds } },
      data: { status: "sold", soldAt: now },
    }),
    // clear them out of everybody's cart
    prisma.cartItem.deleteMany({ where: { listingId: { in: listingIds } } }),
  ]);

  return prisma.order.findUnique({ where: { id: orderId } });
}

module.exports = { fulfillOrder };
