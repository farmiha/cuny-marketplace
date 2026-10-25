import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import CampusSwitcher from "./CampusSwitcher";
import { useCampusTheme } from "../hooks/useCampusTheme";
import { supabase } from "../lib/supabaseClient";
import { useCart } from "../hooks/useCart";
import { useUnread } from "./MessageAlerts";

export default function Navbar() {
  const { mode, toggleMode } = useCampusTheme();
  const { count: cartCount } = useCart();
  const unread = useUnread();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  // Check if someone's already logged in when the page loads
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Keep this in sync automatically after sign in / sign out without refreshing the page
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setConfirmSignOut(false);
    navigate("/");
  }

  const navLinkClass = ({ isActive }) =>
    "nav-link" + (isActive ? " active" : "");

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Logo />
          </NavLink>

          <nav className="primary">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/browse" className={navLinkClass}>
              Browse
            </NavLink>
            <NavLink
              to="/dashboard?tab=messages"
              className={navLinkClass}
              style={{ position: "relative" }}
            >
              Messages
              {/* red badge with the number of unread messages */}
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -14,
                    minWidth: 18,
                    height: 18,
                    padding: "0 5px",
                    borderRadius: 9,
                    background: "#d64545",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: "18px",
                    textAlign: "center",
                  }}
                >
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </NavLink>
            <NavLink to="/dashboard?tab=profile" className={navLinkClass}>
              Profile
            </NavLink>
            <NavLink to="/analytics" className={navLinkClass}>
              Dashboard
            </NavLink>
          </nav>

          <div className="topbar-right">
            <CampusSwitcher />

            <button
              className="icon-btn"
              aria-label="Toggle dark mode"
              onClick={toggleMode}
            >
              {mode === "dark" ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.5 14.6A8.6 8.6 0 1 1 9.4 3.5a7 7 0 0 0 11.1 11.1z" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="4.2" />
                  <path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
                </svg>
              )}
            </button>

            {/* cart button with the number of items in it */}
            <NavLink
              to="/cart"
              className="icon-btn cart-nav"
              aria-label={`Cart, ${cartCount} items`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8h12l-1 12H7L6 8z" />
                <path d="M9 8a3 3 0 0 1 6 0" />
              </svg>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </NavLink>

            {session ? (
              <button
                className="btn-login"
                onClick={() => setConfirmSignOut(true)}
              >
                Sign Out
              </button>
            ) : (
              <button className="btn-login" onClick={() => navigate("/login")}>
                Log In
              </button>
            )}
          </div>
        </div>
      </header>

      {confirmSignOut && (
        <div
          onClick={() => setConfirmSignOut(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              color: "#1a1a1a",
              borderRadius: 16,
              padding: 28,
              maxWidth: 380,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
            }}
          >
            <h3 style={{ margin: "0 0 18px" }}>
              Are you sure you want to sign out?
            </h3>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmSignOut(false)}
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
                No
              </button>
              <button
                className="cta-primary-solid"
                style={{ flex: 1, padding: "10px 0", borderRadius: 10 }}
                onClick={handleSignOut}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
