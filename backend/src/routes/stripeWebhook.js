const stripe = require("../lib/stripe");
const prisma = require("../prismaClient");
const { fulfillOrder } = require("../lib/orders");

// Stripe calls this URL by itself when a payment succeeds, even if the buyer
// closed the tab. It must receive the RAW body (see index.js) so the
// signature can be checked.
module.exports = async function stripeWebhook(req, res) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    const orderId = Number(pi.metadata?.orderId);
    if (orderId) {
      // only mark it paid if Stripe really collected the amount WE saved on the order
      // (for offers that is the accepted price, set by the server)
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (order && pi.amount === order.totalCents && pi.currency === "usd") {
        await fulfillOrder(orderId);
      } else {
        console.error(`Webhook: amount mismatch for order ${orderId}, not fulfilling.`);
      }
    }
  }

  res.json({ received: true });
};