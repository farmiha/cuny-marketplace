import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { CAMPUS_ORDER, CAMPUS_THEMES } from "../data/campusThemes";
import { useCampusTheme } from "../hooks/useCampusTheme";
import { supabase } from "../lib/supabaseClient";
import { useCart } from "../hooks/useCart";
import { useUnread } from "./MessageAlerts";
import NotificationBell from "./NotificationBell";
import "../styles/navbar-mobile.css";

export default function Navbar() {
  const { mode, toggleMode, campus, setCampus, theme } = useCampusTheme();
  const { count: cartCount } = useCart();
  const unread = useUnread();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // hamburger menu on small screens
  const [campusOpen, setCampusOpen] = useState(false); // campus dropdown
  const campusRef = useRef(null);

  // close the campus dropdown when clicking anywhere else
  useEffect(() => {
    function onDown(e) {
      if (campusRef.current && !campusRef.current.contains(e.target))
        setCampusOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // stop the page behind the menu from scrolling while it is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

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
    "mp-link nav-link" + (isActive ? " mp-on active" : "");

  return (
    <>
      <header className="mp-root mp-topbar">
        <div className="mp-nav">
          <NavLink to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Logo />
          </NavLink>

          <nav className="mp-links">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/browse" className={navLinkClass}>
              Browse
            </NavLink>
            <NavLink to="/wanted" className={navLinkClass}>
              Wanted
            </NavLink>
            <NavLink
              to="/messages"
              className={navLinkClass}
              style={{ position: "relative" }}
            >
              Messages
              {/* red badge with the number of unread messages */}
              {unread > 0 && (
                <span className="mp-badge">{unread > 9 ? "9+" : unread}</span>
              )}
            </NavLink>
            <NavLink to="/profile" className={navLinkClass}>
              Profile
            </NavLink>
            <NavLink to="/analytics" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/guide" className={navLinkClass}>
              Guide
            </NavLink>
          </nav>

          <div className="mp-right topbar-right">
            {/* campus picker (changes the whole site's colors) */}
            <div style={{ position: "relative" }} ref={campusRef}>
              <button
                className="mp-pill-select"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={campusOpen}
                onClick={() => setCampusOpen((v) => !v)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                {theme.full}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {campusOpen && (
                <div
                  className="mp-cmenu"
                  role="listbox"
                  aria-label="Choose campus"
                >
                  {CAMPUS_ORDER.map((key) => {
                    const c = CAMPUS_THEMES[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        role="option"
                        aria-selected={key === campus}
                        className={
                          "mp-cmenu-item" + (key === campus ? " mp-on" : "")
                        }
                        onClick={() => {
                          setCampus(key);
                          setCampusOpen(false);
                        }}
                      >
                        <span
                          className="mp-dot"
                          style={{ background: c.primary }}
                        />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", fontWeight: 700 }}>
                            {c.full}
                          </span>
                          <span
                            style={{
                              display: "block",
                              fontSize: 12,
                              color: "var(--mp-mute)",
                            }}
                          >
                            {c.borough || "All campuses"}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              className="mp-icon-btn"
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

            {/* notification bell with the number of new things */}
            <NotificationBell />

            {/* cart button with the number of items in it */}
            <NavLink
              to="/cart"
              className="mp-icon-btn cart-nav"
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
              {cartCount > 0 && <span className="mp-badge">{cartCount}</span>}
            </NavLink>

            {session ? (
              <button
                className="mp-btn mp-btn-ghost"
                onClick={() => setConfirmSignOut(true)}
              >
                Sign Out
              </button>
            ) : (
              <button
                className="mp-btn mp-btn-ghost"
                onClick={() => navigate("/login")}
              >
                Log In
              </button>
            )}

            {/* hamburger button, only shows on small screens */}
            <button
              className="mp-icon-btn hamburger"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* the same links as the top bar, as a dropdown for small screens */}
        {menuOpen && (
          <nav className="mobile-menu" onClick={() => setMenuOpen(false)}>
            <button className="menu-close" aria-label="Close menu">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/browse" className={navLinkClass}>
              Browse
            </NavLink>
            <NavLink to="/wanted" className={navLinkClass}>
              Wanted
            </NavLink>
            <NavLink to="/messages" className={navLinkClass}>
              Messages
              {unread > 0 && (
                <span className="menu-badge">{unread > 9 ? "9+" : unread}</span>
              )}
            </NavLink>
            <NavLink to="/profile" className={navLinkClass}>
              Profile
            </NavLink>
            <NavLink to="/analytics" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/guide" className={navLinkClass}>
              Guide
            </NavLink>
          </nav>
        )}
      </header>

      {confirmSignOut &&
        createPortal(
          <div
            className="mp-root cm-modal-overlay"
            onClick={() => setConfirmSignOut(false)}
          >
            <div
              className="cm-modal cm-modal-small"
              role="alertdialog"
              aria-modal="true"
              aria-label="Confirm sign out"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Sign out?</h3>
              <p className="cm-modal-sub">Are you sure you want to sign out?</p>
              <div className="cm-modal-actions">
                <button
                  type="button"
                  className="cm-modal-btn"
                  onClick={() => setConfirmSignOut(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="cm-modal-btn cm-modal-btn-primary"
                  onClick={handleSignOut}
                >
                  Yes, sign out
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
