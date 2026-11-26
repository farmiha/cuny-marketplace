import { Link } from "react-router-dom";
import { useCampusTheme } from "../hooks/useCampusTheme";

// after a footer link is clicked, start the new page at the top
const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });

// The footer uses the campus color (same as the navbar), with the matching text color.
const linkStyle = {
  color: "var(--primary-ink)",
  opacity: 0.85,
  textDecoration: "none",
  fontSize: "0.85rem",
};

const headingStyle = {
  margin: "0 0 10px",
  fontSize: "0.78rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--primary-ink)",
};

const textStyle = {
  margin: 0,
  fontSize: "0.85rem",
  lineHeight: 1.5,
  color: "var(--primary-ink)",
  opacity: 0.85,
};

export default function Footer() {
  const { theme } = useCampusTheme();

  return (
    <footer
      style={{
        background: "var(--primary)",
        color: "var(--primary-ink)",
        borderTop: "none",
      }}
    >
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
            <span
              className="foot-brand"
              style={{ marginBottom: 10, color: "var(--primary-ink)" }}
            >
              <span
                className="sw"
                style={{ background: "var(--primary-ink)" }}
              />
              CUNY MarketPlace
            </span>
            <p style={textStyle}>
              Built by CUNY students, for CUNY students. Buy and sell within
              your campus community.
            </p>
          </div>

          {/* where to go */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={headingStyle}>Explore</p>
            <Link to="/browse" style={linkStyle} onClick={toTop}>
              Browse listings
            </Link>
            <Link to="/post" style={linkStyle} onClick={toTop}>
              Sell something
            </Link>
            <Link
              to="/dashboard?tab=messages"
              style={linkStyle}
              onClick={toTop}
            >
              Messages
            </Link>
            <Link to="/dashboard?tab=profile" style={linkStyle} onClick={toTop}>
              Profile
            </Link>
          </div>

          {/* about + help */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={headingStyle}>MarketPlace</p>
            <Link to="/about" style={linkStyle} onClick={toTop}>
              About us
            </Link>
            <Link to="/guide" style={linkStyle} onClick={toTop}>
              How it works
            </Link>
            <Link to="/cart" style={linkStyle} onClick={toTop}>
              Your cart
            </Link>
          </div>

          {/* safety */}
          <div>
            <p style={headingStyle}>Stay safe</p>
            <p style={textStyle}>
              Meet in public places on campus, and report anything that looks
              suspicious from the listing page.
            </p>
          </div>
        </div>

        {/* bottom bar */}
        <div
          style={{
            borderTop:
              "1px solid color-mix(in srgb, var(--primary-ink) 25%, transparent)",
            paddingTop: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            color: "var(--primary-ink)",
            opacity: 0.85,
          }}
        >
          <span>© {new Date().getFullYear()} CUNY MarketPlace</span>
          <span>Currently browsing: {theme.full}</span>
        </div>
      </div>
    </footer>
  );
}
