import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";

// Popup for sellers: shows the result of a report once, and tells suspended
// accounts why they can't use the site. It sits in App.jsx so it shows on any page.
export default function OutcomeNotice() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [info, setInfo] = useState(null);

  // keep track of who is logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token || null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setToken(s?.access_token || null);
      if (!s) setInfo(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ask the backend for outcomes the seller hasn't seen yet
  useEffect(() => {
    if (!token) return;
    apiFetch("/reports/outcomes", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        if (data.suspended || data.outcomes.length > 0) setInfo(data);
      })
      .catch(() => {});
  }, [token]);

  if (!info) return null;

  async function close() {
    // mark the outcomes as seen so the popup doesn't come back
    if (info.outcomes.length > 0) {
      await apiFetch("/reports/outcomes/seen", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: info.outcomes.map((o) => o.id) }),
      }).catch(() => {});
    }
    setInfo(null);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setInfo(null);
    navigate("/");
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Report update"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--card, #fff)",
          color: "var(--text, #1d2540)",
          borderRadius: 16,
          padding: 24,
          maxWidth: 460,
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        {info.suspended ? (
          <>
            <h2 style={{ marginTop: 0 }}>Your account is suspended</h2>
            <p>
              You reached {info.limit} strikes from upheld reports, so you can't
              post listings and your listings are hidden.
            </p>
            <button className="btn" onClick={signOut}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <h2 style={{ marginTop: 0 }}>Update on a report</h2>
            {info.outcomes.map((o) => (
              <div key={o.id} style={{ marginBottom: 14 }}>
                <strong>{o.listingTitle}</strong>
                <div>
                  {o.status === "upheld"
                    ? "The report was upheld. You got a strike."
                    : "The report was dismissed. No action was taken."}
                </div>
                {o.resolution && (
                  <div style={{ opacity: 0.8 }}>Note: {o.resolution}</div>
                )}
              </div>
            ))}
            <p>
              Strikes: {info.strikes} of {info.limit}
              {info.strikes >= info.limit - 1 && info.strikes < info.limit
                ? " (one more strike suspends your account)"
                : ""}
            </p>
            <button className="btn" onClick={close}>
              Got it
            </button>
          </>
        )}
      </div>
    </div>
  );
}