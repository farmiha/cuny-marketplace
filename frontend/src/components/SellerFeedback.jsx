import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";

function Stars({ score }) {
  const full = Math.round(score);
  return (
    <span style={{ color: "#f1b400" }}>
      {"★".repeat(full)}
      <span style={{ color: "#bbb" }}>{"★".repeat(5 - full)}</span>
    </span>
  );
}

// shows the logged in seller the ratings and reports they got from buyers
// use it in the Seller view of the Profile tab: <SellerFeedback />
export default function SellerFeedback() {
  const [ratings, setRatings] = useState(null);
  const [reports, setReports] = useState(null);

  useEffect(() => {
    async function load() {
      // these two are private, so they need the logged in user's token
      const { data } = await supabase.auth.getSession();
      const headers = { Authorization: `Bearer ${data.session?.access_token}` };

      apiFetch("/ratings/received", { headers })
        .then(setRatings)
        .catch(() => setRatings({ count: 0, reviews: [] }));
      apiFetch("/reports/received", { headers })
        .then(setReports)
        .catch(() => setReports([]));
    }
    load();
  }, []);

  if (!ratings || !reports) return null;

  return (
    <div className="profile-section">
      <h3 style={{ margin: "0 0 4px" }}>Ratings from buyers</h3>
      {ratings.count > 0 ? (
        <p style={{ margin: "0 0 12px" }}>
          <Stars score={ratings.average} /> {Number(ratings.average).toFixed(1)}{" "}
          ({ratings.count} {ratings.count === 1 ? "rating" : "ratings"})
        </p>
      ) : (
        <p className="profile-sub">No ratings yet.</p>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {ratings.reviews.map((r) => (
          <div
            key={r.id}
            style={{
              padding: 12,
              border: "1px solid var(--line)",
              borderRadius: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span>
                <Stars score={r.score} /> <strong>{r.raterName}</strong>
              </span>
              <span className="listing-meta">
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="listing-meta" style={{ margin: "4px 0 0" }}>
              on {r.listingTitle}
            </p>
            {r.comment && <p style={{ margin: "6px 0 0" }}>{r.comment}</p>}
          </div>
        ))}
      </div>

      <h3 style={{ margin: "24px 0 4px" }}>Reports about you</h3>
      {reports.length === 0 ? (
        <p className="profile-sub">No reports. Nice!</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {reports.map((r) => (
            <div
              key={r.id}
              style={{
                padding: 12,
                border: "1px solid var(--line)",
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <strong>{r.listingTitle}</strong>
                <span className="listing-meta">
                  {r.status} · {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p style={{ margin: "6px 0 0" }}>{r.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
