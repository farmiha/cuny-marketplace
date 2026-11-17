import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCampusTheme } from "../hooks/useCampusTheme";
import { supabase } from "../lib/supabaseClient";
import SignInModal from "./SignInModal";

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
    <footer style={{ border: 0, padding: 0, margin: 0, background: "transparent" }}>
      <div className="mp-root">
      <div className="mp-foot">
      <div className="mp-wrap">
        <div className="mp-foot-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--mp-accent)" }} />
              CUNY MarketPlace
            </div>
            <p style={{ color: "var(--mp-mute)", fontSize: 14, marginTop: 8 }}>
              Built by CUNY students, for CUNY students. Buy and sell within your campus community.
            </p>
          </div>

          <div>
            <h3 className="mp-fh">Explore</h3>
            <div className="mp-fl">
              <Link to="/browse">Browse listings</Link>
              <Link to="/wanted">Wanted</Link>
              <Link
                to="/post"
                onClick={(e) => {
                  if (!loggedIn) {
                    e.preventDefault();
                    setShowSignIn(true);
                  }
                }}
              >
                Sell something
              </Link>
              <Link to="/following">Following</Link>
              <Link to="/messages">Messages</Link>
              <Link to="/profile">Profile</Link>
            </div>
          </div>

          <div>
            <h3 className="mp-fh">Marketplace</h3>
            <div className="mp-fl">
              <Link to="/about">About us</Link>
              <Link to="/guide">How it works</Link>
              <Link to="/cart">Your cart</Link>
            </div>
          </div>

          <div>
            <h3 className="mp-fh">Stay safe</h3>
            <p style={{ color: "var(--mp-mute)", fontSize: 14 }}>
              Meet in public places on campus, and report anything that looks suspicious from the listing page.
            </p>
          </div>
        </div>

        <div className="mp-foot-bottom">
          <span>© {new Date().getFullYear()} CUNY MarketPlace</span>
          <span>Currently browsing: {theme.full}</span>
        </div>
      </div>
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