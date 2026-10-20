import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { getOrder } from "../lib/cartApi";
import { money } from "../lib/money";
import CheckoutSteps from "../components/CheckoutSteps";

const firstName = (name) => (name || "seller").split(/\s+/)[0];

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useCart();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  // Ask the backend for the order. If it still says "pending" (Stripe can take
  // a moment), check again a few times.
  useEffect(() => {
    let cancelled = false;
    let tries = 0;

    async function load() {
      try {
        const result = await getOrder(orderId);
        if (cancelled) return;
        setOrder(result);
        if (result.status === "paid") {
          refresh(); // the cart is now empty, update the navbar badge
        } else if (tries++ < 5) {
          setTimeout(load, 2000);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="cart-page">
        <h1 className="cart-title">Order</h1>
        <p className="cart-error">{error}</p>
        <Link to="/browse" className="cart-btn-outline">
          Back to browse
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="cart-page">
        <h1 className="cart-title">Order</h1>
        <p className="cart-sub">Loading...</p>
      </div>
    );
  }

  const failed = params.get("redirect_status") === "failed";
  const paid = order.status === "paid";

  // group the bought items by seller
  const bySeller = {};
  for (const item of order.items) {
    bySeller[item.sellerId] ??= { name: item.sellerName, items: [] };
    bySeller[item.sellerId].items.push(item);
  }

  return (
    <div className="cart-page">
      <div className="cart-head">
        <div>
          <h1 className="cart-title">
            {paid
              ? "Order confirmed"
              : failed
                ? "Payment didn't go through"
                : "Finishing your order"}
          </h1>
          <p className="cart-sub">
            {paid
              ? `Order #${order.id} · ${money(order.totalCents)} paid. Now meet your sellers on campus.`
              : failed
                ? "You haven't been charged. Go back and try again."
                : "Your payment is being confirmed. This page updates by itself."}
          </p>
        </div>
        <CheckoutSteps current={3} />
      </div>

      {failed && !paid && (
        <button className="cart-btn-primary" onClick={() => navigate("/checkout")}>
          Try again
        </button>
      )}

      {paid && (
        <div className="cart-sellers confirm-list">
          {Object.entries(bySeller).map(([sellerId, seller]) => (
            <section key={sellerId} className="cart-card">
              <header className="cart-seller">
                <div className="cart-seller-info">
                  <p className="cart-seller-name">{seller.name || "CUNY student"}</p>
                  <p className="cart-seller-meta">
                    Message them to pick a time and place.
                  </p>
                </div>
                <button
                  type="button"
                  className="cart-btn-outline"
                  onClick={() =>
                    navigate(
                      `/dashboard?tab=messages&listingId=${seller.items[0].listingId}&receiverId=${sellerId}`,
                    )
                  }
                >
                  Message {firstName(seller.name)}
                </button>
              </header>
              {seller.items.map((item) => (
                <div key={item.listingId} className="confirm-item">
                  <div>
                    <p className="cart-item-title">{item.title}</p>
                    {item.location && (
                      <p className="cart-seller-meta">Meet at {item.location}</p>
                    )}
                  </div>
                  <strong>{money(item.priceCents)}</strong>
                </div>
              ))}
            </section>
          ))}
          <Link to="/browse" className="cart-btn-outline confirm-back">
            Keep browsing
          </Link>
        </div>
      )}
    </div>
  );
}
