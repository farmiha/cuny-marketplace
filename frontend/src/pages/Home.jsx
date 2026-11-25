import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCampusTheme } from "../hooks/useCampusTheme";
import { CATEGORIES } from "../data/campusThemes";
import { LISTINGS } from "../data/listings";
import { supabase } from "../lib/supabaseClient";
import ListingCard from "../components/ListingCard";
import SignInModal from "../components/SignInModal";

const TRUST = [
  {
    text: ["Verified with your", "CUNY email"],
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12.5 2.5 2.5 4.5-5" />
      </>
    ),
  },
  {
    text: ["Free to list,", "always"],
    icon: (
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    ),
  },
  {
    text: ["Meet safely", "on campus"],
    icon: <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />,
  },
];

export default function Home() {
  const { theme } = useCampusTheme();
  const [cat, setCat] = useState("All");
  const shown = LISTINGS.filter((l) => cat === "All" || l.category === cat);
  const latest = shown.slice(0, 4);

  // find out if someone is logged in, so "Sell something" can ask visitors to sign in
  const [loggedIn, setLoggedIn] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
  }, []);

  return (
    <div className="mp-root" id="page-home">
      <div className="mp-page">
        <section
          className="mp-hero"
          style={{
            position: "relative",
            overflow: "hidden",
            color: "#fff",
            borderRadius: 32,
            padding: 48,
            minHeight: 290,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              maxWidth: 640,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <span
              style={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 12px",
                borderRadius: 999,
                background: "rgba(255,255,255,.16)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".06em",
                textTransform: "uppercase",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#fff",
                  opacity: 0.7,
                }}
              />
              {theme.full} Marketplace
            </span>
            <h1 style={{ fontSize: 48, lineHeight: 1.08 }}>
              Buy &amp; sell within your{" "}
              <em style={{ color: "var(--mp-ca)" }}>{theme.name}</em> community
            </h1>
            <p
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,.9)",
                maxWidth: 480,
              }}
            >
              Textbooks, dorm gear, tickets, tutoring. Sell what you don't need,
              find what you do. Just classmates, no strangers.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link
                to="/browse"
                className="mp-btn"
                style={{ background: "var(--mp-ca)", color: "var(--mp-cai)" }}
              >
                Browse listings
              </Link>
              <Link
                to="/post"
                className="mp-btn"
                style={{ borderColor: "rgba(255,255,255,.6)", color: "#fff" }}
                onClick={(e) => {
                  // logged out visitors get a popup instead of the post page
                  if (!loggedIn) {
                    e.preventDefault();
                    setShowSignIn(true);
                  }
                }}
              >
                Sell something
              </Link>
            </div>
          </div>
        </section>

        <div className="mp-grid3" style={{ marginTop: 20 }}>
          {TRUST.map((t) => (
            <div
              key={t.text[0]}
              className="mp-card"
              style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                borderRadius: 20,
              }}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "var(--mp-accent-soft)",
                  color: "var(--mp-accent)",
                  display: "grid",
                  placeItems: "center",
                  flex: "none",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {t.icon}
                </svg>
              </span>
              <span style={{ fontWeight: 600, lineHeight: 1.3 }}>
                {t.text[0]}
                <br />
                {t.text[1]}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 28 }}
        >
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              type="button"
              className={"mp-chip" + (cat === c ? " mp-on" : "")}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div
          className="mp-sec-head"
          style={{ marginTop: 44, alignItems: "center" }}
        >
          <div>
            <h2>Latest listings</h2>
            <p style={{ color: "var(--mp-mute)", marginTop: 2 }}>
              {cat === "All"
                ? "Fresh drops from students near you"
                : `${shown.length} in ${cat}`}
            </p>
          </div>
          <Link
            to="/browse"
            className="mp-btn mp-btn-ghost"
            style={{ height: 40 }}
          >
            View all
          </Link>
        </div>

        {latest.length === 0 ? (
          <div
            className="mp-card"
            style={{
              padding: 36,
              textAlign: "center",
              color: "var(--mp-mute)",
            }}
          >
            No listings in this category yet. Be the first to post one.
          </div>
        ) : (
          <div className="mp-grid4">
            {latest.map((listing) => (
              <ListingCard
                showMessage={false}
                key={listing.id}
                listing={listing}
              />
            ))}
          </div>
        )}
      </div>

      {showSignIn && (
        <SignInModal
          message="You must be signed in to sell stuff"
          onClose={() => setShowSignIn(false)}
        />
      )}
    </div>
  );
}
