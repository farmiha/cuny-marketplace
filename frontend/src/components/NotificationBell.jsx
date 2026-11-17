import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";

// Bell icon in the navbar. The red number is how many new things happened since the user last opened it.
// The list only shows what is new; "View older notifications" opens the full history page.
export default function NotificationBell() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // keep track of who is logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token || null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setToken(s?.access_token || null);
      if (!s) {
        setItems([]);
        setCount(0);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ask the backend for new notifications now, then every 30 seconds
  useEffect(() => {
    if (!token) return;
    function load() {
      apiFetch("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          setItems(res.items);
          setCount(res.count);
        })
        .catch(() => {});
    }
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [token]);

  // close the dropdown when clicking anywhere else
  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // only logged in users have notifications
  if (!token) return null;

  function toggle() {
    const opening = !open;
    setOpen(opening);
    // opening the bell marks everything as seen, but the list stays visible until it closes
    if (opening && count > 0) {
      setCount(0);
      apiFetch("/notifications/read", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <button
        className="mp-icon-btn"
        aria-label={`Notifications, ${count} new`}
        aria-expanded={open}
        onClick={toggle}
        style={{ position: "relative" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9a6 6 0 0 1 12 0c0 6 2 7.5 2 7.5H4S6 15 6 9z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {count > 0 && (
          <span
            style={{
              position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, padding: "0 5px",
              borderRadius: 9, background: "#d64545", color: "#fff", fontSize: 11, fontWeight: 700,
              lineHeight: "18px", textAlign: "center",
            }}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div role="menu" className="mp-notif-menu">
          <div className="mp-notif-head">Notifications</div>
          {items.length === 0 && <p className="mp-notif-empty">You're all caught up.</p>}
          {items.map((n) => (
            <button
              key={n.id}
              role="menuitem"
              className="mp-notif-item"
              onClick={() => {
                setOpen(false);
                navigate(n.link);
              }}
            >
              {n.text}
              <span className="mp-notif-time">{new Date(n.at).toLocaleString()}</span>
            </button>
          ))}
          <button
            className="mp-notif-more"
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
          >
            View older notifications →
          </button>
        </div>
      )}
    </div>
  );
} 