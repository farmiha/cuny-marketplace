import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";

// an account is suspended at this many upheld strikes (same number as the backend)
const STRIKE_LIMIT = 5;

const box = {
  width: "100%",
  color: "#1a1a1a",
  background: "#fff",
  border: "1px solid #ccc",
  borderRadius: 8,
  padding: 8,
};

export default function AdminReports() {
  const [queue, setQueue] = useState([]);
  const [notes, setNotes] = useState({});
  const [message, setMessage] = useState("");
  const [forbidden, setForbidden] = useState(false);

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  async function load() {
    try {
      const t = await getToken();
      const list = await apiFetch("/reports/admin/queue", {
        headers: { Authorization: `Bearer ${t}` },
      });
      setQueue(list);
    } catch (err) {
      if (String(err.message).includes("403")) setForbidden(true);
      else setMessage(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(id, decision) {
    setMessage("");
    try {
      const t = await getToken();
      await apiFetch(`/reports/admin/${id}/decide`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${t}` },
        body: JSON.stringify({ decision, note: notes[id] || "" }),
      });
      await load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (forbidden) return <p style={{ padding: 24 }}>Admins only.</p>;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h2>Report queue</h2>
      {message && <p style={{ color: "crimson" }}>{message}</p>}
      {queue.length === 0 && <p>Nothing to review.</p>}

      {queue.map((r) => {
        const strikes = r.reported?.strikes ?? 0;
        // upholding this report would be the strike that suspends the account
        const willSuspend = strikes + 1 >= STRIKE_LIMIT;
        return (
          <div
            key={r.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: 10,
              padding: 14,
              marginTop: 12,
            }}
          >
            <strong>{r.listing?.title || "Deleted listing"}</strong>
            <p style={{ margin: "6px 0" }}>
              Seller: {r.reported?.name || r.reported?.email} (strikes:{" "}
              {strikes} of {STRIKE_LIMIT})
            </p>
            <p style={{ margin: "6px 0" }}>Reason: {r.reason}</p>
            <p style={{ margin: "6px 0" }}>
              Seller's response:{" "}
              {r.sellerResponse || "No response (deadline passed)"}
            </p>
            {willSuspend && (
              <p style={{ margin: "6px 0", color: "crimson", fontWeight: 600 }}>
                Upholding this will suspend the account.
              </p>
            )}
            <textarea
              rows="2"
              maxLength={500}
              placeholder="Note (optional, the seller will see it)"
              value={notes[r.id] || ""}
              onChange={(e) =>
                setNotes((n) => ({ ...n, [r.id]: e.target.value }))
              }
              style={box}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                className="cta-primary-solid"
                style={{ borderRadius: 10 }}
                onClick={() => decide(r.id, "upheld")}
              >
                {willSuspend ? "Uphold (suspend account)" : "Uphold (give strike)"}
              </button>
              <button
                style={{
                  borderRadius: 10,
                  border: "1px solid #ccc",
                  background: "#fff",
                  color: "#1a1a1a",
                  padding: "8px 14px",
                  cursor: "pointer",
                }}
                onClick={() => decide(r.id, "dismissed")}
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}