import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import CampusSwitcher from "./CampusSwitcher";
import { useCampusTheme } from "../hooks/useCampusTheme";
import { supabase } from "../lib/supabaseClient";
import { useCart } from "../hooks/useCart";

export default function Navbar() {
  const { mode, toggleMode } = useCampusTheme();
  const { count: cartCount } = useCart();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

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
    navigate("/");
  }

  const navLinkClass = ({ isActive }) =>
    "nav-link" + (isActive ? " active" : "");

  return (
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
          <NavLink to="/dashboard?tab=messages" className={navLinkClass}>
            Messages
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
            <button className="btn-login" onClick={handleSignOut}>
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
  );
}