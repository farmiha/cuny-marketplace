import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";
import { money } from "../lib/money";
import { CATEGORY_ICON_PATHS } from "../data/listings";

// apiFetch errors look like 'API error 409: {"message":"..."}', this pulls out the message
function errorText(err) {
  const match = err.message?.match(/^API error \d+: ([\s\S]*)$/);
  if (match) {
    try {
      return JSON.parse(match[1]).message || err.message;
    } catch {
      return match[1] || err.message;
    }
  }
  return err.message || "Something went wrong";
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// the "My orders" section of the Profile tab (Buyer view)
// buyers can also rate the seller of each item here
// use it in Dashboard.jsx: <MyOrders />
export default function MyOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  // the item being rated right now (null when the popup is closed)
  const [rating, setRating] = useState(null);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  async function load() {
    try {
      const token = await getToken();
      const list = await apiFetch("/orders/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(list);
    } catch (err) {
      setError(errorText(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openRate(item) {
    setRating(item);
    setScore(0);
    setComment("");
    setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const token = await getToken();
      await apiFetch("/ratings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listingId: rating.listingId, score, comment }),
      });
      setRating(null);
      load();
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profile-section">
      <h3>My orders</h3>
      <p className="profile-sub">Items you've bought on the marketplace.</p>

      {error && (
        <p className="profile-sub" style={{ color: "#e06565" }}>
          {error}
        </p>
      )}
      {!orders && !error && <p className="profile-sub">Loading...</p>}
      {orders && orders.length === 0 && (
        <p className="profile-sub">
          No orders yet. Items you buy will show up here.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {orders &&
          orders.map((order) => (
            <div
              key={order.id}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 14,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <span className="profile-sub" style={{ margin: 0 }}>
                  Order #{order.id} · {formatDate(order.paidAt)}
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: "rgba(46,160,110,0.18)",
                  }}
                >
                  {order.status}
                </span>
              </div>

              {order.items.map((item) => (
                <div
                  key={item.listingId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 0",
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      flexShrink: 0,
                      overflow: "hidden",
                      borderRadius: 10,
                      background: "var(--primary-soft)",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        aria-hidden="true"
                      >
                        <path
                          d={
                            CATEGORY_ICON_PATHS[item.category] ||
                            CATEGORY_ICON_PATHS.Other
                          }
                        />
                      </svg>
                    )}
                  </div>

                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <p
                      style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="profile-sub"
                      style={{ margin: 0, fontSize: "0.78rem" }}
                    >
                      {[
                        item.sellerName ? `Sold by ${item.sellerName}` : null,
                        item.location,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {item.rated ? (
                      <p
                        className="profile-sub"
                        style={{ margin: "2px 0 0", fontSize: "0.78rem" }}
                      >
                        You rated {"★".repeat(item.rated.score)}
                        {"☆".repeat(5 - item.rated.score)}
                      </p>
                    ) : (
                      <button
                        className="view-all"
                        style={{
                          borderRadius: 8,
                          marginTop: 6,
                          padding: "4px 12px",
                          fontSize: "0.78rem",
                        }}
                        onClick={() => openRate(item)}
                      >
                        Rate seller
                      </button>
                    )}
                  </div>

                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                    {money(item.priceCents)}
                  </span>
                </div>
              ))}

              <div
                style={{
                  borderTop: "1px solid var(--line)",
                  marginTop: 6,
                  paddingTop: 10,
                  textAlign: "right",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              >
                Total: {money(order.totalCents)}
              </div>
            </div>
          ))}
      </div>

      {rating && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setRating(null)}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              background: "#fff",
              color: "#1a1a1a",
              borderRadius: 16,
              padding: 28,
              maxWidth: 420,
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 4px" }}>
              Rate {rating.sellerName || "the seller"}
            </h3>
            <p style={{ margin: "0 0 14px", color: "#555" }}>{rating.title}</p>

            <div style={{ fontSize: 32, marginBottom: 10 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  onClick={() => setScore(n)}
                  style={{
                    cursor: "pointer",
                    color: n <= score ? "#f1b400" : "#bbb",
                  }}
                >
                  ★
                </span>
              ))}
            </div>

            <textarea
              rows="3"
              maxLength={500}
              placeholder="Add a comment (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: "100%",
                color: "#1a1a1a",
                background: "#fff",
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: 8,
              }}
            />

            {formError && (
              <p style={{ color: "crimson", margin: "10px 0 0" }}>
                {formError}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button
                type="button"
                onClick={() => setRating(null)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "1px solid #ccc",
                  background: "#fff",
                  color: "#1a1a1a",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cta-primary-solid"
                style={{ flex: 1, padding: "10px 0", borderRadius: 10 }}
                disabled={!score || saving}
              >
                {saving ? "Saving..." : "Submit rating"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
