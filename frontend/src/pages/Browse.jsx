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

    if (sort === "Recommended for you") {
      return recommendOrder(items, reco.appliedScores);
    }

    if (sort === "Price: low to high") {
      items = [...items].sort((a, b) => a.price - b.price);
    } else if (sort === "Price: high to low") {
      items = [...items].sort((a, b) => b.price - a.price);
    }
    return items;
  }, [listings, search, category, sort, reco.appliedScores]);

  // go back to the first 8 whenever the filters or the ranking change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, category, sort, reco.appliedScores]);

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

  return (
    <div className="page" id="page-browse">
      <div className="browse-head">
        <div>
          <h2>Browse Listings</h2>
          <p className="sub">Filter by search, category, and sort order.</p>
        </div>
        <Link
          to="/post"
          className="cta-primary"
          style={{ padding: "11px 20px" }}
          onClick={(e) => {
            // logged out visitors get a popup instead of the post page
            if (!loggedIn) {
              e.preventDefault();
              setShowSignIn(true);
            }
          }}
        >
          Post a Listing
        </Link>
      </div>

      {SHOW_ALGORITHM_PANEL && (
        <RecommendationPanel
          activity={reco.activity}
          liveScores={reco.liveScores}
          appliedScores={reco.appliedScores}
          pending={reco.pending}
          onUpdate={reco.update}
          onReset={reco.reset}
        />
      )}

      <div className="filters-row">
        <input
          type="text"
          placeholder="Search items... e.g., textbook, laptop"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option>Recommended for you</option>
          <option>Newest</option>
          <option>Price: low to high</option>
          <option>Price: high to low</option>
        </select>
      </div>

      <div className="grid">
        {visible.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
        {filtered.length === 0 && (
          <p className="sub">No listings match your filters yet.</p>
        )}
      </div>

      {/* invisible marker: when it scrolls into view, 8 more cards load */}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}

      {!hasMore && filtered.length > PAGE_SIZE && (
        <p className="sub" style={{ textAlign: "center", marginTop: 24 }}>
          You've seen all {filtered.length} listings.
        </p>
      )}

      {showSignIn && (
        <SignInModal
          message="You must be logged in to post a listing"
          onClose={() => setShowSignIn(false)}
        />
      )}
    </div>
  );
}