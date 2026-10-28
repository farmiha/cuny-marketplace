import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";
import { CATEGORY_ICON_PATHS } from "../data/listings";

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// the "My listings" section of the Profile tab (Seller view)
// use it in Dashboard.jsx: <MyListings />
export default function MyListings() {
  const [listings, setListings] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.auth.getSession();
        const list = await apiFetch("/listings/mine", {
          headers: { Authorization: `Bearer ${data.session?.access_token}` },
        });
        setListings(list);
      } catch {
        setError(true);
      }
    }
    load();
  }, []);

  return (
    <div className="profile-section">
      <h3>My listings</h3>
      <p className="profile-sub">Everything you've posted for sale.</p>

      {error && <p className="profile-sub">Couldn't load your listings. Try refreshing the page.</p>}
      {!listings && !error && <p className="profile-sub">Loading...</p>}
      {listings && listings.length === 0 && (
        <p className="profile-sub">You haven't posted anything yet.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {listings &&
          listings.map((l) => {
            const categoryName = l.category?.name || "Other";
            const active = l.status === "active";
            return (
              <div
                key={l.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  border: "1px solid var(--line)",
                  borderRadius: 14,
                  padding: "12px 16px",
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
                  {l.imageUrl ? (
                    <img
                      src={l.imageUrl}
                      alt={l.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                      <path d={CATEGORY_ICON_PATHS[categoryName] || CATEGORY_ICON_PATHS.Other} />
                    </svg>
                  )}
                </div>

                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>{l.title}</p>
                  <p className="profile-sub" style={{ margin: 0, fontSize: "0.78rem" }}>
                    {categoryName} · Posted {formatDate(l.createdAt)}
                  </p>
                  {l.soldTo && (
                    <p className="profile-sub" style={{ margin: 0, fontSize: "0.78rem" }}>
                      Sold to {l.soldTo}
                    </p>
                  )}
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                    ${Number(l.price).toFixed(2)}
                  </div>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: active ? "rgba(46,160,110,0.18)" : "var(--primary-soft)",
                    }}
                  >
                    {l.status}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
