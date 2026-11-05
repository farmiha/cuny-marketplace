import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";

function Stars({ score }) {
  const full = Math.round(score);
  return (
    <span style={{ color: "#f1b400" }}>
      {"\u2605".repeat(full)}
      <span style={{ color: "#bbb" }}>{"\u2605".repeat(5 - full)}</span>
    </span>
  );
}

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

const STATUS_TEXT = {
  pending: "Waiting for your response",
  responded: "Response sent, under review",
  upheld: "Upheld (you received a strike)",
  dismissed: "Dismissed",
};

// shows the logged in seller the ratings and reports they got from buyers
// use it in the Seller view of the Profile tab: <SellerFeedback />
export default function SellerFeedback() {
  const [ratings, setRatings] = useState(null);
  const [reports, setReports] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [errors, setErrors] = useState({});
  const [savingId, setSavingId] = useState(null);

  async function getHeaders() {
    // these are private, so they need the logged in user's token
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token}` };
  }

  async function loadReports() {
    try {
      const headers = await getHeaders();
      setReports(await apiFetch("/reports/received", { headers }));
    } catch {
      setReports([]);
    }
  }

  useEffect(() => {
    async function load() {
      const headers = await getHeaders();
      apiFetch("/ratings/received", { headers })
        .then(setRatings)
        .catch(() => setRatings({ count: 0, reviews: [] }));
      loadReports();
    }
    load();
  }, []);

  async function respond(id) {
    setErrors((e) => ({ ...e, [id]: "" }));
    setSavingId(id);
    try {
      const headers = await getHeaders();
      await apiFetch(`/reports/${id}/respond`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ response: drafts[id] || "" }),
      });
      await loadReports();
    } catch (err) {
      setErrors((e) => ({ ...e, [id]: errorText(err) }));
    } finally {
      setSavingId(null);
    }
  }

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
          {reports.map((r) => {
            const expired =
              r.responseDeadline && new Date(r.responseDeadline) < new Date();
            const canRespond = r.status === "pending" && !expired;
            const statusLabel =
              r.status === "pending" && expired
                ? "Deadline passed, waiting on a moderator"
                : STATUS_TEXT[r.status] || r.status;

            return (
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
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ margin: "6px 0 0" }}>{r.reason}</p>
                <p className="listing-meta" style={{ margin: "6px 0 0" }}>
                  {statusLabel}
                  {canRespond && r.responseDeadline
                    ? ` \u00b7 respond by ${new Date(
                        r.responseDeadline,
                      ).toLocaleString()}`
                    : ""}
                </p>

                {r.sellerResponse && (
                  <p style={{ margin: "6px 0 0" }}>
                    <strong>Your response:</strong> {r.sellerResponse}
                  </p>
                )}
                {r.resolution && (
                  <p style={{ margin: "6px 0 0" }}>
                    <strong>Moderator note:</strong> {r.resolution}
                  </p>
                )}

                {canRespond && (
                  <div style={{ marginTop: 10 }}>
                    <textarea
                      rows="3"
                      maxLength={1000}
                      placeholder="Explain your side"
                      value={drafts[r.id] || ""}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [r.id]: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        color: "#1a1a1a",
                        background: "#fff",
                        border: "1px solid #ccc",
                        borderRadius: 8,
                        padding: 8,
                      }}
                    />
                    {errors[r.id] && (
                      <p style={{ color: "crimson", margin: "6px 0 0" }}>
                        {errors[r.id]}
                      </p>
                    )}
                    <button
                      className="cta-primary-solid"
                      style={{ marginTop: 8, borderRadius: 10 }}
                      disabled={
                        !(drafts[r.id] || "").trim() || savingId === r.id
                      }
                      onClick={() => respond(r.id)}
                    >
                      {savingId === r.id ? "Sending..." : "Send response"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}