const stripe = require("../lib/stripe");
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
    const orderId = Number(event.data.object.metadata?.orderId);
    if (orderId) await fulfillOrder(orderId);
  }

  res.json({ received: true });
};
