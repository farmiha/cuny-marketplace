import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";

const TYPE_LABEL = {
  follow: "Follower",
  views: "Views",
  save: "Saved",
  sold: "Sold",
  rating: "Rating",
  report: "Report",
  suspended: "Account",
};

// "Today", "Yesterday", or "November 12, 2026"
function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null); // null while loading
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      // you have to be logged in to see notifications
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const res = await apiFetch("/notifications?all=1", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems(res.items);
      } catch {
        setError("Couldn't load your notifications. Try refreshing the page.");
        setItems([]);
      }
    }
    load();
  }, [navigate]);

  // group the list by day, newest first
  const groups = [];
  (items || []).forEach((n) => {
    const label = dayLabel(n.at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(n);
    else groups.push({ label, items: [n] });
  });

  return (
    <div className="page" id="page-notifications" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div className="section-head" style={{ marginBottom: 20 }}>
        <div>
          <h2>Notifications</h2>
          <p className="sub">Everything that has happened on your account, newest first.</p>
        </div>
      </div>

      {items === null && <p className="sub">Loading...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {items && items.length === 0 && !error && (
        <p className="sub">No notifications yet. When someone views, saves or follows you, it shows up here.</p>
      )}

      {groups.map((g) => (
        <section key={g.label} style={{ marginTop: 24 }}>
          <h3 style={{ margin: "0 0 10px" }}>{g.label}</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {g.items.map((n) => (
              <button
                key={n.id}
                className="post-shell"
                onClick={() => navigate(n.link)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  width: "100%",
                  maxWidth: "none",
                  textAlign: "left",
                  padding: "14px 18px",
                  cursor: "pointer",
                  font: "inherit",
                  color: "inherit",
                }}
              >
                <span style={{ flex: "none", minWidth: 70, textAlign: "center", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "rgba(0,0,0,0.07)" }}>
                  {TYPE_LABEL[n.type] || "Update"}
                </span>
                <span style={{ flex: 1 }}>
                  {n.text}
                  <span style={{ display: "block", fontSize: 12, opacity: 0.65, marginTop: 3 }}>
                    {new Date(n.at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </span>
                {n.isNew && (
                  <span style={{ flex: "none", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: "#d64545", color: "#fff" }}>
                    New
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
