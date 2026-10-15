import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { money } from "../lib/money";
import CheckoutSteps from "../components/CheckoutSteps";
import { CATEGORY_ICON_PATHS } from "../data/listings";

const initials = (name) =>
  (name || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const firstName = (name) => (name || "seller").split(/\s+/)[0];

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  );
}

function CartItemRow({ item, saved, onSave, onRemove, busy }) {
  const iconPath =
    CATEGORY_ICON_PATHS[item.category] || CATEGORY_ICON_PATHS.Other;

  return (
    <div className={`cart-item${item.unavailable ? " is-unavailable" : ""}`}>
      <Link to={`/listing/${item.listingId}`} className="cart-thumb">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d={iconPath} />
          </svg>
        )}
      </Link>

      <div className="cart-item-main">
        <p className="cart-cat">{item.category}</p>
        <Link to={`/listing/${item.listingId}`} className="cart-item-title">
          {item.title}
        </Link>
        <div className="cart-chips">
          {item.condition && (
            <span className="cart-chip">Condition: {item.condition}</span>
          )}
          {item.location && (
            <span className="cart-chip">
              <PinIcon />
              Meet at {item.location}
            </span>
          )}
          {item.category === "Furniture" && (
            <span className="cart-chip cart-chip-note">
              Pickup only, too big to ship
            </span>
          )}
        </div>
        <div className="cart-links">
          <button type="button" disabled={busy} onClick={onSave}>
            {saved ? "Move to cart" : "Save for later"}
          </button>
          <button type="button" disabled={busy} onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>

      <div className="cart-item-price">
        <strong>{money(item.priceCents)}</strong>
        <span>{item.unavailable ? "No longer available" : "1 available"}</span>
      </div>
    </div>
  );
}

export default function Cart() {
  const navigate = useNavigate();
  const { cart, loading, loggedIn, removeItem, setSaved, applyPromo, promoCode } =
    useCart();
  const [busyId, setBusyId] = useState(null);
  const [promoInput, setPromoInput] = useState(promoCode || "");
  const [error, setError] = useState("");

  const { groups, saved, totals, count, unavailableCount } = cart;
  const sellerCount = groups.filter((g) =>
    g.items.some((i) => !i.unavailable),
  ).length;
  const promoApplied = Boolean(totals.promoCode);

  async function run(listingId, action) {
    setBusyId(listingId);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handlePromo(e) {
    e.preventDefault();
    setError("");
    try {
      await applyPromo(promoApplied ? "" : promoInput);
      if (promoApplied) setPromoInput("");
    } catch (err) {
      setError(err.message);
    }
  }

  const savedSection = saved.length > 0 && (
    <section className="cart-saved">
      <h2>Saved for later ({saved.length})</h2>
      <div className="cart-card">
        {saved.map((item) => (
          <CartItemRow
            key={item.listingId}
            item={item}
            saved
            busy={busyId === item.listingId}
            onSave={() => run(item.listingId, () => setSaved(item.listingId, false))}
            onRemove={() => run(item.listingId, () => removeItem(item.listingId))}
          />
        ))}
      </div>
    </section>
  );

  // ----- not logged in -----
  if (!loading && !loggedIn) {
    return (
      <div className="cart-page">
        <h1 className="cart-title">Your cart</h1>
        <div className="cart-empty">
          <p>Log in with your CUNY email to see your cart.</p>
          <button className="cart-btn-primary" onClick={() => navigate("/login")}>
            Log in
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cart-page">
        <h1 className="cart-title">Your cart</h1>
        <p className="cart-sub">Loading...</p>
      </div>
    );
  }

  // ----- empty cart -----
  if (groups.length === 0) {
    return (
      <div className="cart-page">
        <h1 className="cart-title">Your cart</h1>
        <div className="cart-empty">
          <p>Your cart is empty. Items you add from Browse show up here.</p>
          <Link to="/browse" className="cart-btn-primary">
            Browse listings
          </Link>
        </div>
        {savedSection}
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-head">
        <div>
          <h1 className="cart-title">Your cart</h1>
          <p className="cart-sub">
            {count} {count === 1 ? "item" : "items"} from {sellerCount}{" "}
            {sellerCount === 1 ? "student" : "students"}. Each seller confirms
            their own meetup.
          </p>
        </div>
        <CheckoutSteps current={1} />
      </div>

      {error && <p className="cart-error">{error}</p>}

      <div className="cart-layout">
        <div className="cart-sellers">
          {groups.map(({ seller, items }) => (
            <section key={seller.id} className="cart-card">
              <header className="cart-seller">
                <span className="cart-avatar">{initials(seller.name)}</span>
                <div className="cart-seller-info">
                  <p className="cart-seller-name">
                    {seller.name || "CUNY student"}
                    <span className="verified">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                      Verified CUNY
                    </span>
                  </p>
                  <p className="cart-seller-meta">
                    {seller.campus} ·{" "}
                    {seller.rating ? `★ ${seller.rating}` : "New seller"} ·{" "}
                    {seller.sales} {seller.sales === 1 ? "sale" : "sales"}
                  </p>
                </div>
                <button
                  type="button"
                  className="cart-btn-outline"
                  onClick={() =>
                    navigate(
                      `/dashboard?tab=messages&listingId=${items[0].listingId}&receiverId=${seller.id}`,
                    )
                  }
                >
                  Message {firstName(seller.name)}
                </button>
              </header>

              {items.map((item) => (
                <CartItemRow
                  key={item.listingId}
                  item={item}
                  busy={busyId === item.listingId}
                  onSave={() => run(item.listingId, () => setSaved(item.listingId, true))}
                  onRemove={() => run(item.listingId, () => removeItem(item.listingId))}
                />
              ))}
            </section>
          ))}

          {savedSection}
        </div>

        {/* ---------- order summary ---------- */}
        <aside className="cart-summary">
          <div className="cart-summary-body">
            <h2>Order summary</h2>
            <dl>
              <div>
                <dt>Subtotal ({count} {count === 1 ? "item" : "items"})</dt>
                <dd>{money(totals.subtotalCents)}</dd>
              </div>
              {promoApplied && (
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

            <form className="promo-form" onSubmit={handlePromo}>
              <input
                value={promoApplied ? totals.promoCode : promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Promo code"
                aria-label="Promo code"
                readOnly={promoApplied}
              />
              <button
                type="submit"
                className="cart-btn-outline"
                disabled={!promoApplied && !promoInput.trim()}
              >
                {promoApplied ? "Applied" : "Apply"}
              </button>
            </form>
            {promoApplied && (
              <p className="promo-note">
                $5 off your first purchase on CUNY Marketplace. Tap Applied to remove.
              </p>
            )}
            {totals.promoError && (
              <p className="cart-error-inline">{totals.promoError}</p>
            )}

            <div className="cart-total">
              <span>Total</span>
              <span>{money(totals.totalCents)}</span>
            </div>

            {unavailableCount > 0 && (
              <p className="cart-error-inline">
                Some items are no longer available. Remove them to continue.
              </p>
            )}

            <button
              type="button"
              className="cart-btn-primary cart-btn-block"
              disabled={count === 0 || unavailableCount > 0}
              onClick={() => navigate("/checkout")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              Continue to checkout
            </button>
            <Link to="/browse" className="cart-keep-browsing">
              Keep browsing
            </Link>
          </div>
          <p className="cart-protect">
            <strong>Secure payment.</strong> Card details go straight to Stripe
            and never touch our servers.
          </p>
        </aside>
      </div>
    </div>
  );
}
