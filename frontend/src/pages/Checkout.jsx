import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useCart } from "../hooks/useCart";
import { createPaymentIntent } from "../lib/cartApi";
import { money } from "../lib/money";
import CheckoutSteps from "../components/CheckoutSteps";
import { getOffer, startOfferCheckout } from "../lib/offersApi";

// The PUBLISHABLE key (pk_test_...) is safe to use in the browser.
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

// Make Stripe's card form match the site (campus colors + dark mode).
function stripeAppearance() {
  const root = document.documentElement;
  const css = getComputedStyle(root);
  return {
    theme: root.getAttribute("data-mode") === "dark" ? "night" : "stripe",
    variables: {
      colorPrimary: css.getPropertyValue("--primary").trim() || "#1e3a73",
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      borderRadius: "10px",
    },
  };
}

// The card form + Pay button. Must live inside <Elements>.
function PaymentForm({ orderId, totalCents }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setMessage("");

    // On success Stripe sends the browser to return_url (the confirmation page).
    // We only get past this line if something went wrong.
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order/${orderId}/confirmation`,
      },
    });

    setMessage(error?.message || "Something went wrong. Please try again.");
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {message && <p className="cart-error-inline">{message}</p>}
      <button
        type="submit"
        className="cart-btn-primary cart-btn-block pay-btn"
        disabled={!stripe || submitting}
      >
        {submitting ? "Processing..." : `Pay ${money(totalCents)}`}
      </button>
    </form>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // /checkout?offer=12 means "pay the price the seller accepted". The page only
  // passes the offer id. The server looks up the price itself.
  const offerId = Number(params.get("offer")) || null;
  const [offer, setOffer] = useState(null);
  const { cart, loading, loggedIn } = useCart();
  const [intent, setIntent] = useState(null); // { clientSecret, orderId, totals }
  const [error, setError] = useState("");
  const started = useRef(false); // makes sure we only create ONE payment

  useEffect(() => {
    if (loading) return;
    if (!loggedIn) {
      navigate("/login");
      return;
    }
    if (offerId) {
      if (started.current) return;
      started.current = true;
      getOffer(offerId).then(setOffer).catch((err) => setError(err.message));
      startOfferCheckout(offerId)
        .then(setIntent)
        .catch((err) => setError(err.message));
      return;
    }
    if (cart.count === 0) {
      navigate("/cart");
      return;
    }
    if (started.current) return;
    started.current = true;

    createPaymentIntent(cart.totals.promoCode)
      .then(setIntent)
      .catch((err) => setError(err.message));
  }, [loading, loggedIn, cart.count, offerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals =
    intent?.totals ||
    (offer
      ? { subtotalCents: offer.amountCents, discountCents: 0, totalCents: offer.amountCents, promoCode: null }
      : cart.totals);
  const groups = offerId
    ? offer
      ? [
          {
            seller: { id: offer.sellerId, name: offer.seller?.name },
            items: [
              {
                listingId: offer.listingId,
                title: offer.listing.title,
                location: offer.listing.location,
                priceCents: offer.amountCents,
              },
            ],
          },
        ]
      : []
    : cart.groups
        .map((g) => ({ ...g, items: g.items.filter((i) => !i.unavailable) }))
        .filter((g) => g.items.length > 0);
  const backLabel = offerId ? "Back to messages" : "Back to cart";

  return (
    <div className="cart-page">
      <div className="cart-head">
        <div>
          <h1 className="cart-title">Checkout</h1>
          <p className="cart-sub">Pay securely, then meet each seller on campus.</p>
        </div>
        <CheckoutSteps current={2} />
      </div>

      <div className="cart-layout">
        <div className="cart-sellers">
          <section className="cart-card checkout-section">
            <h2>Campus meetups</h2>
            <ul className="meetup-list">
              {groups.map(({ seller, items }) => (
                <li key={seller.id}>
                  <strong>{seller.name || "CUNY student"}</strong>
                  <span>
                    {items
                      .map((i) => i.location)
                      .filter(Boolean)
                      .join(", ") || "Agree on a spot after you pay"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="checkout-hint">
              Message each seller after you pay to pick a time.
            </p>
          </section>

          <section className="cart-card checkout-section">
            <h2>Payment</h2>
            {!stripePromise && (
              <p className="cart-error-inline">
                Stripe isn't set up yet. Add VITE_STRIPE_PUBLISHABLE_KEY to the
                frontend .env file and restart the dev server.
              </p>
            )}
            {error && (
              <>
                <p className="cart-error-inline">{error}</p>
                {offerId ? (
                  <button type="button" className="cart-btn-outline" onClick={() => navigate(-1)}>
                    {backLabel}
                  </button>
                ) : (
                  <Link to="/cart" className="cart-btn-outline">
                    {backLabel}
                  </Link>
                )}
              </>
            )}
            {stripePromise && !error && !intent && (
              <p className="cart-sub">Loading secure payment form...</p>
            )}
            {stripePromise && intent && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: intent.clientSecret,
                  appearance: stripeAppearance(),
                }}
              >
                <PaymentForm
                  orderId={intent.orderId}
                  totalCents={totals.totalCents}
                />
              </Elements>
            )}
          </section>
        </div>

        <aside className="cart-summary">
          <div className="cart-summary-body">
            <h2>Order summary</h2>
            <ul className="summary-items">
              {groups.flatMap((g) =>
                g.items.map((item) => (
                  <li key={item.listingId}>
                    <span>{item.title}</span>
                    <span>
                      {offer && (
                        <s className="offer-was">{money(offer.askingCents)}</s>
                      )}{" "}
                      {money(item.priceCents)}
                    </span>
                  </li>
                )),
              )}
            </ul>
            <dl>
              {offer ? (
                <>
                  <div>
                    <dt>Asking price</dt>
                    <dd><s className="offer-was">{money(offer.askingCents)}</s></dd>
                  </div>
                  <div className="promo-row">
                    <dt>Your accepted offer</dt>
                    <dd>{money(offer.amountCents)}</dd>
                  </div>
                </>
              ) : (
                <div>
                  <dt>Subtotal</dt>
                  <dd>{money(totals.subtotalCents)}</dd>
                </div>
              )}
              {totals.promoCode && (
                <div className="promo-row">
                  <dt>Promo · {totals.promoCode}</dt>
                  <dd>-{money(totals.discountCents)}</dd>
                </div>
              )}
              <div>
                <dt>Campus meetup</dt>
                <dd>Free</dd>
              </div>
            </dl>
            <div className="cart-total">
              <span>Total</span>
              <span>{money(totals.totalCents)}</span>
            </div>
            {offerId ? (
              <button type="button" className="cart-keep-browsing" onClick={() => navigate(-1)}>
                {backLabel}
              </button>
            ) : (
              <Link to="/cart" className="cart-keep-browsing">
                {backLabel}
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}