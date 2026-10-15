const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const stripe = require("../lib/stripe");
const requireAuth = require("../middleware/requireAuth");
const { calcTotals, toCents } = require("../lib/cart");
const { fulfillOrder } = require("../lib/orders");

// Step 1 of checkout: the server works out the price from the DATABASE
// (never trusting a price sent by the browser), creates an Order, and asks
// Stripe for a PaymentIntent. The browser gets back a clientSecret to show
// the card form.
router.post("/create-intent", requireAuth, async (req, res) => {
  const rows = await prisma.cartItem.findMany({
    where: { userId: req.userId, savedForLater: false },
    include: { listing: true },
  });

  if (rows.length === 0) {
    return res.status(400).json({ message: "Your cart is empty." });
  }
  if (rows.some((r) => r.listing.status !== "active")) {
    return res.status(409).json({
      message:
        "Some items in your cart are no longer available. Remove them and try again.",
    });
  }
  if (rows.some((r) => r.listing.sellerId === req.userId)) {
    return res.status(400).json({ message: "You can't buy your own listing." });
  }

  const items = rows.map((r) => ({
    listingId: r.listingId,
    sellerId: r.listing.sellerId,
    title: r.listing.title,
    priceCents: toCents(r.listing.price),
  }));

  const totals = await calcTotals(req.userId, items, req.body.promoCode);
  if (totals.promoError) {
    return res.status(400).json({ message: totals.promoError });
  }
  if (totals.totalCents < 50) {
    // Stripe can't charge less than 50 cents
    return res.status(400).json({ message: "Orders must total at least $0.50." });
  }

  // cancel any older unpaid attempts so they don't pile up
  const oldOrders = await prisma.order.findMany({
    where: { buyerId: req.userId, status: "pending" },
  });
  for (const old of oldOrders) {
    try {
      if (old.stripePaymentIntentId) {
        await stripe.paymentIntents.cancel(old.stripePaymentIntentId);
      }
      await prisma.order.update({
        where: { id: old.id },
        data: { status: "canceled" },
      });
    } catch (e) {
      // already paid or already gone, leave it alone
    }
  }

  const order = await prisma.order.create({
    data: {
      buyerId: req.userId,
      subtotalCents: totals.subtotalCents,
      discountCents: totals.discountCents,
      totalCents: totals.totalCents,
      promoCode: totals.promoCode,
      items: { create: items },
    },
  });

  const intent = await stripe.paymentIntents.create({
    amount: totals.totalCents,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: { orderId: String(order.id), buyerId: req.userId },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: intent.id },
  });

  res.json({ clientSecret: intent.client_secret, orderId: order.id, totals });
});

// Step 3: the confirmation page asks for the order.
// If Stripe says it's paid but the webhook hasn't arrived yet (or isn't set up
// locally), we confirm it with Stripe right here.
router.get("/orders/:id", requireAuth, async (req, res) => {
  const orderId = Number(req.params.id);

  const loadOrder = () =>
    prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            listing: {
              select: {
                location: true,
                imageUrl: true,
                seller: { select: { name: true } },
              },
            },
          },
        },
      },
    });

  let order = await loadOrder();
  if (!order || order.buyerId !== req.userId) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.status === "pending" && order.stripePaymentIntentId) {
    const intent = await stripe.paymentIntents.retrieve(
      order.stripePaymentIntentId,
    );
    if (intent.status === "succeeded") {
      await fulfillOrder(order.id);
      order = await loadOrder();
    }
  }

  res.json({
    id: order.id,
    status: order.status,
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    totalCents: order.totalCents,
    promoCode: order.promoCode,
    items: order.items.map((i) => ({
      listingId: i.listingId,
      title: i.title,
      priceCents: i.priceCents,
      sellerId: i.sellerId,
      sellerName: i.listing.seller.name,
      location: i.listing.location,
      imageUrl: i.listing.imageUrl,
    })),
  });
});

module.exports = router;
