import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";

const REASONS = [
  "Spam",
  "Scam or fraud",
  "Prohibited item",
  "Inappropriate",
  "Wrong category",
  "Other",
];

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

// "Report listing" link + popup. Put it on the listing page: <ReportButton listing={listing} />
export default function ReportButton({ listing }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // hide the button on your own listing, and show "Reported" if you already reported it
  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      if (data.session.user.id === listing.sellerId) {
        setIsOwner(true);
        return;
      }
      try {
        const res = await apiFetch(`/reports/mine/${listing.id}`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
        setAlreadyReported(res.pending);
      } catch {
        // not a big deal, the backend still blocks duplicates
      }
    }
    load();
  }, [listing.id, listing.sellerId]);

  if (isOwner) return null;

  async function handleOpen() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      navigate("/login");
      return;
    }
    setError("");
    setSent(false);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setReason("");
    setDetails("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const { data } = await supabase.auth.getSession();
      await apiFetch("/reports", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ listingId: listing.id, reason, details }),
      });
      setSent(true);
      setAlreadyReported(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {alreadyReported && !open ? (
        <p className="listing-meta" style={{ marginTop: 14 }}>
          You reported this listing. We're reviewing it.
        </p>
      ) : (
        <button
          className="view-all"
          style={{ borderRadius: 10, marginTop: 14 }}
          onClick={handleOpen}
        >
          Report listing
        </button>
      )}

      {open && (
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
          onClick={handleClose}
        >
          <div
            style={{
              background: "#fff",
              color: "#1a1a1a",
              borderRadius: 16,
              padding: 28,
              maxWidth: 440,
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {sent ? (
              <div style={{ textAlign: "center" }}>
                <h3 style={{ margin: "0 0 10px" }}>
                  Thanks for letting us know
                </h3>
                <p style={{ margin: "0 0 20px" }}>
                  We'll review this listing. You don't need to do anything else.
                </p>
                <button className="cta-primary-solid" onClick={handleClose}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 style={{ margin: "0 0 6px" }}>Report this listing</h3>
                <p style={{ margin: "0 0 14px", color: "#555" }}>
                  What's wrong with it?
                </p>

                {REASONS.map((r) => (
                  <label
                    key={r}
                    style={{
                      display: "block",
                      margin: "6px 0",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      style={{ marginRight: 8 }}
                    />
                    {r}
                  </label>
                ))}

                <textarea
                  rows="3"
                  maxLength={500}
                  placeholder="Add details (optional)"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: 12,
                    color: "#1a1a1a",
                    background: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: 8,
                    padding: 8,
                  }}
                />

                {error && (
                  <p style={{ color: "crimson", margin: "10px 0 0" }}>
                    {error}
                  </p>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button
                    type="button"
                    onClick={handleClose}
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
                    disabled={!reason || saving}
                  >
                    {saving ? "Sending..." : "Send report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
