import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCampusTheme } from "../hooks/useCampusTheme";
import { supabase } from "../lib/supabaseClient";
import SignInModal from "./SignInModal";

const linkStyle = {
  color: "var(--muted)",
  textDecoration: "none",
  fontSize: "0.85rem",
};

const headingStyle = {
  margin: "0 0 10px",
  fontSize: "0.78rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--ink)",
};

export default function Footer() {
  const { theme } = useCampusTheme();

  // "Sell something" needs a login, so logged out visitors get a popup instead
  const [loggedIn, setLoggedIn] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setLoggedIn(!!session),
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <footer>
      <div className="wrap" style={{ width: "100%" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 28,
            paddingBottom: 24,
          }}
        >
          {/* who we are */}
          <div>
            <span className="foot-brand" style={{ marginBottom: 10 }}>
              <span className="sw" />
              CUNY MarketPlace
            </span>
            <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.5 }}>
              Built by CUNY students, for CUNY students. Buy and sell within
              your campus community.
            </p>
          </div>

          {/* where to go */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={headingStyle}>Explore</p>
            <Link to="/browse" style={linkStyle}>
              Browse listings
            </Link>
            <Link to="/wanted" style={linkStyle}>
              Wanted
            </Link>
            <Link
              to="/post"
              style={linkStyle}
              onClick={(e) => {
                if (!loggedIn) {
                  e.preventDefault();
                  setShowSignIn(true);
                }
              }}
            >
              Sell something
            </Link>
            <Link to="/following" style={linkStyle}>
              Following
            </Link>
            <Link to="/dashboard?tab=messages" style={linkStyle}>
              Messages
            </Link>
            <Link to="/dashboard?tab=profile" style={linkStyle}>
              Profile
            </Link>
          </div>

          {/* about + help */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={headingStyle}>MarketPlace</p>
            <Link to="/about" style={linkStyle}>
              About us
            </Link>
            <Link to="/cart" style={linkStyle}>
              Your cart
            </Link>
          </div>

          {/* safety */}
          <div>
            <p style={headingStyle}>Stay safe</p>
            <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.5 }}>
              Meet in public places on campus, and report anything that looks
              suspicious from the listing page.
            </p>
          </div>
        </div>

        {/* bottom bar */}
        <div
          style={{
            borderTop: "1px solid var(--line)",
            paddingTop: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <span>© {new Date().getFullYear()} CUNY MarketPlace</span>
          <span>Currently browsing: {theme.full}</span>
        </div>
      </div>

      {showSignIn && (
        <SignInModal
          message="You must be logged in to post a listing"
          onClose={() => setShowSignIn(false)}
        />
      )}
    </footer>
  );
}
