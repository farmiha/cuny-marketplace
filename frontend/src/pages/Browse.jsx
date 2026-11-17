import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "../data/campusThemes";
import ListingCard from "../components/ListingCard";
import SignInModal from "../components/SignInModal";
import RecommendationPanel from "../components/RecommendationPanel";
import { getListings } from "../lib/apiClient";
import { supabase } from "../lib/supabaseClient";
import { useCart } from "../hooks/useCart";
import { useRecommendations } from "../hooks/useRecommendations";
import { recommendOrder, syncInterest } from "../lib/recommendationEngine";

// Later: replace with a moderator check so only the 5 creators see the panel.
const SHOW_ALGORITHM_PANEL = true;

// how many cards show at first, and how many more load each time you scroll
const PAGE_SIZE = 8;

export default function Browse() {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [sort, setSort] = useState("Recommended for you");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // side filters (price range and condition)
  const CONDITIONS = ["New", "Like new", "Good", "Fair"];
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [conds, setConds] = useState(CONDITIONS);
  const sentinelRef = useRef(null);

  // is someone logged in? (used for the "Post a Listing" button)
  const [loggedIn, setLoggedIn] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  const { cart, loading: cartLoading } = useCart();
  const reco = useRecommendations(listings);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
  }, []);

  // get the real listings from the backend when the page loads
  useEffect(() => {
    getListings()
      .then((data) =>
        setListings(
          data.map((l) => ({
            ...l,
            price: Number(l.price),
            category: l.category?.name,
          })),
        ),
      )
      .catch((err) => console.error("Could not load listings:", err));
  }, []);

  // copy the real saved + cart items into the algorithm
  useEffect(() => {
    if (cartLoading || listings.length === 0) return;
    const savedIds = (cart?.saved ?? []).map((i) => i.listingId);
    const cartIds = (cart?.groups ?? [])
      .flatMap((g) => g.items)
      .map((i) => i.listingId);
    syncInterest(listings, savedIds, cartIds);
  }, [cartLoading, listings, cart]);

  const filtered = useMemo(() => {
    let items = listings.filter((l) =>
      l.title.toLowerCase().includes(search.toLowerCase()),
    );

    if (category !== "All categories") {
      items = items.filter((l) => l.category === category);
    }
    if (minPrice !== "") items = items.filter((l) => l.price >= Number(minPrice));
    if (maxPrice !== "") items = items.filter((l) => l.price <= Number(maxPrice));
    // listings without a condition always show
    items = items.filter((l) => !l.condition || conds.includes(l.condition));

    if (sort === "Recommended for you") {
      return recommendOrder(items, reco.appliedScores);
    }

    if (sort === "Price: low to high") {
      items = [...items].sort((a, b) => a.price - b.price);
    } else if (sort === "Price: high to low") {
      items = [...items].sort((a, b) => b.price - a.price);
    }
    return items;
  }, [listings, search, category, sort, reco.appliedScores, minPrice, maxPrice, conds]);

  // go back to the first 8 whenever the filters or the ranking change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, category, sort, reco.appliedScores, minPrice, maxPrice, conds]);

  // when the invisible marker under the grid scrolls into view, show 8 more
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisibleCount((n) => n + PAGE_SIZE);
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, filtered.length]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const toggleCond = (c) =>
    setConds((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setConds(CONDITIONS);
    setCategory("All categories");
    setSearch("");
  };

  return (
    <div className="mp-root" id="page-browse">
      <div className="mp-page">
        <div className="mp-sec-head" style={{ alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 40 }}>Browse listings</h1>
            <p style={{ color: "var(--mp-mute)", marginTop: 4 }}>
              Filter by search, category and sort order.
            </p>
          </div>
          <Link
            to="/post"
            className="mp-btn mp-btn-primary"
            onClick={(e) => {
              // logged out visitors get a popup instead of the post page
              if (!loggedIn) {
                e.preventDefault();
                setShowSignIn(true);
              }
            }}
          >
            Post a listing
          </Link>
        </div>

        {SHOW_ALGORITHM_PANEL && (
          <div style={{ marginBottom: 20 }}>
            <RecommendationPanel
              activity={reco.activity}
              liveScores={reco.liveScores}
              appliedScores={reco.appliedScores}
              pending={reco.pending}
              onUpdate={reco.update}
              onReset={reco.reset}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            className="mp-input"
            style={{ flex: "1 1 320px", width: "auto" }}
            type="text"
            placeholder="Search items (e.g., textbook, laptop)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="mp-input"
            style={{ width: 220 }}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option>Recommended for you</option>
            <option>Newest</option>
            <option>Price: low to high</option>
            <option>Price: high to low</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
          {["All categories", ...CATEGORIES].map((c) => (
            <button
              key={c}
              type="button"
              className={"mp-chip" + (category === c ? " mp-on" : "")}
              onClick={() => setCategory(c)}
            >
              {c === "All categories" ? "All" : c}
            </button>
          ))}
        </div>

        <div className="mp-browse-layout">
          {/* filters */}
          <aside className="mp-card mp-filters">
            <h3 style={{ fontSize: 15 }}>Price</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              <input className="mp-input" type="number" min="0" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              <input className="mp-input" type="number" min="0" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
            <h3 style={{ fontSize: 15, marginTop: 20 }}>Condition</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {CONDITIONS.map((c) => (
                <label key={c} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                  <input type="checkbox" checked={conds.includes(c)} onChange={() => toggleCond(c)} />
                  {c}
                </label>
              ))}
            </div>
            <button type="button" className="mp-btn mp-btn-ghost" style={{ width: "100%", marginTop: 20 }} onClick={clearFilters}>
              Clear filters
            </button>
          </aside>

          {/* results */}
          <div>
            <p style={{ color: "var(--mp-mute)", marginBottom: 12 }}>
              {filtered.length} listing{filtered.length === 1 ? "" : "s"}
            </p>
            <div className="mp-grid3">
              {visible.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="mp-card" style={{ padding: 36, textAlign: "center", color: "var(--mp-mute)" }}>
                No listings match your filters yet.
              </div>
            )}

            {/* invisible marker: when it scrolls into view, 8 more cards load */}
            {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}

            {!hasMore && filtered.length > PAGE_SIZE && (
              <p style={{ textAlign: "center", marginTop: 24, color: "var(--mp-mute)" }}>
                You've seen all {filtered.length} listings.
              </p>
            )}
          </div>
        </div>
      </div>

      {showSignIn && (
        <SignInModal
          message="You must be logged in to post a listing"
          onClose={() => setShowSignIn(false)}
        />
      )}
    </div>
  );
}