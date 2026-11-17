import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function getJson(path, headers) {
  const res = await fetch(`${API}${path}`, { headers });
  if (!res.ok) throw new Error(`error ${res.status}`);
  return res.json();
}

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
        const headers = { Authorization: `Bearer ${token}` };
        let res;
        try {
          res = await getJson("/notifications?all=1", headers);
        } catch {
          // older backend without the history option: fall back to the normal list
          res = await getJson("/notifications", headers);
        }
        setItems(res.items);
      } catch (err) {
        console.error("notifications failed:", err);
        setError(`Couldn't load your notifications (${err.message}). Try refreshing the page.`);
        setItems([]);
      }
    }
    load();
  }, [navigate]);

  // group the list by day, keeping newest first
  const groups = [];
  (items || []).forEach((n) => {
    const label = dayLabel(n.at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(n);
    else groups.push({ label, items: [n] });
  });

  return (
    <div className="mp-root">
      <div className="mp-page" id="page-notifications">
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--mp-accent)" }}>
          Your account
        </p>
        <h1 style={{ fontSize: 44, lineHeight: 1.1, marginTop: 8 }}>Notifications</h1>
        <p style={{ color: "var(--mp-mute)", marginTop: 8 }}>Everything that has happened on your account, newest first.</p>

        {items === null && <p style={{ color: "var(--mp-mute)", marginTop: 28 }}>Loading...</p>}
        {error && <p style={{ color: "#d6455d", marginTop: 28 }}>{error}</p>}
        {items && items.length === 0 && !error && (
          <div className="mp-card" style={{ padding: 28, marginTop: 28, textAlign: "center", color: "var(--mp-mute)" }}>
            No notifications yet. When someone views, saves or follows you, it shows up here.
          </div>
        )}

        {groups.map((g) => (
          <section key={g.label} style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 18, marginBottom: 10, color: "var(--mp-mute)" }}>{g.label}</h2>
            <div className="mp-notif-list">
              {g.items.map((n) => (
                <button key={n.id} className="mp-card mp-notif-row" onClick={() => navigate(n.link)}>
                  <span className="mp-notif-type">{TYPE_LABEL[n.type] || "Update"}</span>
                  <span className="mp-notif-body">
                    {n.text}
                    <span className="mp-notif-time">
                      {new Date(n.at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </span>
                  {n.isNew && <span className="mp-notif-new">New</span>}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}