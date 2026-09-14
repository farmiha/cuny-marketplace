import { useMemo, useState } from "react";

const listings = [
  {
    id: 1,
    title: "Graphing Calculator TI-84 Plus",
    price: 40,
    category: "Electronics",
    college: "Baruch College",
    condition: "Good",
    emoji: "🧮",
    posted: "2 hours ago",
  },
  {
    id: 2,
    title: "Dell XPS 13 2022 Laptop",
    price: 650,
    category: "Electronics",
    college: "Hunter College",
    condition: "Like New",
    emoji: "💻",
    posted: "5 hours ago",
  },
  {
    id: 3,
    title: "IKEA ALEX Desk - White",
    price: 55,
    category: "Furniture",
    college: "Brooklyn College",
    condition: "Like New",
    emoji: "🪑",
    posted: "1 day ago",
  },
  {
    id: 4,
    title: "Organic Chemistry Textbook",
    price: 35,
    category: "Textbooks",
    college: "City College",
    condition: "Good",
    emoji: "📚",
    posted: "3 days ago",
  },
  {
    id: 5,
    title: "Sony WH-1000XM4 Headphones",
    price: 180,
    category: "Electronics",
    college: "Queens College",
    condition: "Good",
    emoji: "🎧",
    posted: "2 days ago",
  },
  {
    id: 6,
    title: "Schwinn Commuter Bike",
    price: 120,
    category: "Sports",
    college: "Lehman College",
    condition: "Fair",
    emoji: "🚲",
    posted: "4 days ago",
  },
];

const categories = [
  "All Categories",
  "Electronics",
  "Textbooks",
  "Furniture",
  "Sports",
];

export default function Browse({ onNavigate, theme }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [sort, setSort] = useState("Newest");

  const filtered = useMemo(() => {
    const results = listings.filter((listing) => {
      const matchesSearch = listing.title
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "All Categories" || listing.category === category;

      return matchesSearch && matchesCategory;
    });

    return [...results].sort((a, b) => {
      if (sort === "Price: Low to High") return a.price - b.price;
      if (sort === "Price: High to Low") return b.price - a.price;
      return a.id - b.id;
    });
  }, [search, category, sort]);

  return (
    <div
      style={{
        maxWidth: 1152,
        margin: "0 auto",
        padding: "32px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Browse Listings</h1>
          <p style={{ margin: "7px 0 0", color: "#64748b", fontSize: 14 }}>
            All CUNY colleges · {filtered.length} item
            {filtered.length === 1 ? "" : "s"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate("post")}
          style={{
            border: 0,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${theme.buttonFrom}, ${theme.buttonTo})`,
            color: "#ffffff",
            cursor: "pointer",
            padding: "11px 16px",
            fontFamily: "inherit",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Post a Listing
        </button>
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(160px, 220px) minmax(160px, 220px)",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search items... e.g. textbook, laptop"
          style={{
            width: "100%",
            border: "1.5px solid #cbd5e1",
            borderRadius: 8,
            padding: "10px 12px",
            color: "#0d2d6b",
            fontFamily: "inherit",
            fontSize: 14,
            outline: "none",
          }}
        />

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          style={{
            border: "1.5px solid #cbd5e1",
            borderRadius: 8,
            padding: "10px 12px",
            background: "#ffffff",
            color: "#0d2d6b",
            fontFamily: "inherit",
            fontSize: 14,
          }}
        >
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          style={{
            border: "1.5px solid #cbd5e1",
            borderRadius: 8,
            padding: "10px 12px",
            background: "#ffffff",
            color: "#0d2d6b",
            fontFamily: "inherit",
            fontSize: 14,
          }}
        >
          <option>Newest</option>
          <option>Price: Low to High</option>
          <option>Price: High to Low</option>
        </select>
      </section>

      {filtered.length === 0 ? (
        <div
          style={{
            padding: "80px 24px",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          <h2 style={{ margin: 0, color: "#0d2d6b", fontSize: 20 }}>
            No listings found
          </h2>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <section
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          {filtered.map((listing) => (
            <article
              key={listing.id}
              style={{
                overflow: "hidden",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                background: "#ffffff",
                boxShadow: "0 2px 10px rgba(15, 23, 42, 0.05)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  height: 180,
                  background: "#e8f0fe",
                  fontSize: 70,
                }}
              >
                {listing.emoji}
              </div>

              <div style={{ padding: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      color: "#0d2d6b",
                      fontSize: 16,
                      lineHeight: 1.35,
                    }}
                  >
                    {listing.title}
                  </h2>

                  <strong style={{ color: theme.primary, whiteSpace: "nowrap" }}>
                    ${listing.price}
                  </strong>
                </div>

                <p style={{ margin: "10px 0", color: "#64748b", fontSize: 13 }}>
                  {listing.category} · {listing.condition}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: 12,
                    color: "#64748b",
                    fontSize: 12,
                  }}
                >
                  <span>{listing.college}</span>
                  <span>{listing.posted}</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}