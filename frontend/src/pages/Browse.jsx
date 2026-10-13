import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LISTINGS } from "../data/listings";
import { CATEGORIES } from "../data/campusThemes";
import ListingCard from "../components/ListingCard";

export default function Browse() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [sort, setSort] = useState("Newest");

    const [allListings, setAllListings] = useState(LISTINGS);

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    fetch(`${base}/listings`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data) && data.length) setAllListings(data);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
        let items = allListings.filter((l) =>
      l.title.toLowerCase().includes(search.toLowerCase())
    );
    if (category !== "All categories") {
      items = items.filter((l) => l.category === category);
    }
    if (sort === "Price: low to high") {
      items = [...items].sort((a, b) => a.price - b.price);
    } else if (sort === "Price: high to low") {
      items = [...items].sort((a, b) => b.price - a.price);
    }
    return items;
    }, [search, category, sort, allListings]);

  return (
    <div className="page" id="page-browse">
      <div className="browse-head">
        <div>
          <h2>Browse Listings</h2>
          <p className="sub">Filter by search, category, and sort order.</p>
        </div>
        <Link to="/post" className="cta-primary" style={{ padding: "11px 20px" }}>
          Post a Listing
        </Link>
      </div>

      <div className="filters-row">
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
      </div>

      <div className="grid">
        {filtered.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
        {filtered.length === 0 && (
          <p className="sub">No listings match your filters yet.</p>
        )}
      </div>
    </div>
  );
}
