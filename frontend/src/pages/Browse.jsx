import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "../data/campusThemes";
import ListingCard from "../components/ListingCard";
import SignInModal from "../components/SignInModal";
import { getListings, apiFetch } from "../lib/apiClient";
import { supabase } from "../lib/supabaseClient";

export default function Browse() {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [sort, setSort] = useState("Newest");

  // is someone logged in? (used for the "Post a Listing" button)
  const [loggedIn, setLoggedIn] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  // the sellers this person follows, for the "Following" filter
  const [followingIds, setFollowingIds] = useState([]);
  const [followingOnly, setFollowingOnly] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      if (!data.session) return;
      apiFetch("/follows/me/lists", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      })
        .then((res) => setFollowingIds(res.following.map((p) => p.id)))
        .catch(() => {});
    });
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

  const filtered = useMemo(() => {
    let items = listings.filter((l) =>
      l.title.toLowerCase().includes(search.toLowerCase()),
    );
    if (followingOnly) {
      items = items.filter((l) => followingIds.includes(l.sellerId));
    }
    if (category !== "All categories") {
      items = items.filter((l) => l.category === category);
    }
    if (sort === "Price: low to high") {
      items = [...items].sort((a, b) => a.price - b.price);
    } else if (sort === "Price: high to low") {
      items = [...items].sort((a, b) => b.price - a.price);
    }
    return items;
  }, [listings, search, category, sort, followingOnly, followingIds]);

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

      <div
        className="filters-row"
        style={
          loggedIn ? { gridTemplateColumns: "1.6fr 1fr 1fr auto" } : undefined
        }
      >
        <input
          type="text"
          placeholder="Search items... (e.g., textbook, laptop)"
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
          <option>Newest</option>
          <option>Price: low to high</option>
          <option>Price: high to low</option>
        </select>
        {loggedIn && (
          <button
            className={followingOnly ? "cta-primary-solid" : "view-all"}
            style={{
              borderRadius: 10,
              whiteSpace: "nowrap",
              padding: "11px 18px",
            }}
            onClick={() => setFollowingOnly((v) => !v)}
          >
            Following only
          </button>
        )}
      </div>

      <div className="grid">
        {filtered.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
        {filtered.length === 0 && (
          <p className="sub">
            {followingOnly && followingIds.length === 0
              ? "You're not following anyone yet. Open a seller's page and tap Follow."
              : "No listings match your filters yet."}
          </p>
        )}
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
