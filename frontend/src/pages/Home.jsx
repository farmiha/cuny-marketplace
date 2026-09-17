import { Link } from "react-router-dom";
import { useCampusTheme } from "../hooks/useCampusTheme";
import { CATEGORIES } from "../data/campusThemes";
import { LISTINGS, CATEGORY_ICON_PATHS } from "../data/listings";
import ListingCard from "../components/ListingCard";

export default function Home() {
  const { theme } = useCampusTheme();
  const latest = LISTINGS.slice(0, 4);

  return (
    <div className="page" id="page-home">
      <section className="hero">
        <div className="hero-photo" aria-hidden="true" />
        <div className="hero-content">
          <div className="eyebrow">
            <span className="dot-pulse" />
            <span>{theme.full.toUpperCase()} MARKETPLACE</span>
          </div>
          <h1>
            Buy &amp; sell within your <span className="accent-word">{theme.name}</span> community
          </h1>
          <p className="lede">
            Textbooks, dorm gear, tickets, tutoring — sell what you don't need, find what you do.
            Just classmates, no strangers.
          </p>
          <div className="hero-ctas">
            <Link to="/browse" className="cta-primary">Browse listings</Link>
            <Link to="/post" className="cta-secondary">Sell something</Link>
          </div>
        </div>
      </section>

      <div className="trust-strip">
        <div className="trust-card">
          <span className="ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>
          <p>Verified with your<br />CUNY email</p>
        </div>
        <div className="trust-card">
          <span className="ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.65-9.5 9-9.5 9z" />
            </svg>
          </span>
          <p>Free to list,<br />always</p>
        </div>
        <div className="trust-card">
          <span className="ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21c4.5-2.6 8-6.9 8-11.6A8 8 0 0 0 4 9.4C4 14.1 7.5 18.4 12 21z" />
            </svg>
          </span>
          <p>Meet safely<br />on campus</p>
        </div>
      </div>

      <div className="categories">
        {CATEGORIES.map((cat) => (
          <a href="#" className="chip" key={cat}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={CATEGORY_ICON_PATHS[cat]} />
            </svg>
            {cat}
          </a>
        ))}
      </div>

      <section>
        <div className="section-head">
          <div>
            <h2>Latest listings</h2>
            <p className="sub">Fresh drops from students near you</p>
          </div>
          <Link to="/browse" className="view-all">View all</Link>
        </div>

        <div className="grid">
          {latest.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  );
}
