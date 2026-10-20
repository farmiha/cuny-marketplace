require("dotenv/config");
const Stripe = require("stripe");

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is missing from backend/.env, payments will fail.");
}

// One shared Stripe client for the whole backend.
// The SECRET key lives only here (server side), never in the frontend.
module.exports = new Stripe(process.env.STRIPE_SECRET_KEY);
