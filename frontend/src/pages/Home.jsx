const listings = [
  {
    id: 1,
    title: "Graphing Calculator TI-84 Plus",
    price: 40,
    category: "Electronics",
    college: "Baruch College",
    condition: "Good",
    image:
      "https://images.unsplash.com/photo-1648201637025-1c77b9be3013?auto=format&fit=crop&w=600&h=400",
  },
  {
    id: 2,
    title: "Dell XPS 13 2022 Laptop",
    price: 650,
    category: "Electronics",
    college: "Hunter College",
    condition: "Like New",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&h=400",
  },
  {
    id: 3,
    title: "IKEA ALEX Desk - White",
    price: 55,
    category: "Furniture",
    college: "Brooklyn College",
    condition: "Like New",
    image:
      "https://images.unsplash.com/photo-1506664453913-f326aa81f54d?auto=format&fit=crop&w=600&h=400",
  },
  {
    id: 4,
    title: "Sony WH-1000XM4 Headphones",
    price: 180,
    category: "Electronics",
    college: "Queens College",
    condition: "Good",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=400",
  },
  {
    id: 5,
    title: "Organic Chemistry Textbook",
    price: 35,
    category: "Textbooks",
    college: "City College",
    condition: "Good",
    image:
      "https://images.unsplash.com/photo-1558021212-51b6ecfa0db9?auto=format&fit=crop&w=600&h=400",
  },
  {
    id: 6,
    title: "Schwinn Commuter Bike",
    price: 120,
    category: "Sports",
    college: "Lehman College",
    condition: "Fair",
    image:
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&h=400",
  },
];

const categories = [
  "Electronics",
  "Textbooks",
  "Furniture",
  "Sports",
  "Clothing",
  "Services",
  "Other",
];

export default function Home({ onNavigate, theme, campus }) {
  return (
    <div
      style={{
        maxWidth: 1152,
        margin: "0 auto",
        padding: "32px 24px",
      }}
    >
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 16,
          padding: 32,
          color: "#ffffff",
          background: theme.heroBg,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.1,
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(255,255,255,0.6) 30px, rgba(255,255,255,0.6) 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(255,255,255,0.6) 30px, rgba(255,255,255,0.6) 31px)",
          }}
        />

        <div style={{ position: "relative" }}>
          <p
            style={{
              margin: "0 0 8px",
              color: "rgba(255,255,255,0.72)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.4,
              textTransform: "uppercase",
            }}
          >
            CUNY Student Marketplace
          </p>

          <h1
            style={{
              maxWidth: 580,
              margin: 0,
              fontSize: "clamp(30px, 5vw, 44px)",
              lineHeight: 1.1,
            }}
          >
            Buy & sell within your{" "}
            <span style={{ color: theme.highlight }}>CUNY community.</span>
          </h1>

          <p
            style={{
              maxWidth: 560,
              margin: "16px 0 22px",
              color: "rgba(255,255,255,0.84)",
              fontSize: 15,
              lineHeight: 1.6,
            }}
          >
            Verified students only — textbooks, electronics, furniture, and more.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => onNavigate("browse")}
              style={{
                border: 0,
                borderRadius: 8,
                background: "#ffffff",
                color: "#003da5",
                cursor: "pointer",
                padding: "11px 18px",
                fontFamily: "inherit",
                fontWeight: 700,
              }}
            >
              Browse Listings
            </button>

            <button
              type="button"
              onClick={() => onNavigate("post")}
              style={{
                border: "1px solid rgba(255,255,255,0.45)",
                borderRadius: 8,
                background: "rgba(255,255,255,0.14)",
                color: "#ffffff",
                cursor: "pointer",
                padding: "11px 18px",
                fontFamily: "inherit",
                fontWeight: 700,
              }}
            >
              Sell Something
            </button>
          </div>
        </div>
      </section>

      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          margin: "28px 0 34px",
        }}
      >
        {categories.map((category) => (
          <button
            type="button"
            key={category}
            onClick={() => onNavigate("browse")}
            style={{
              border: `1px solid ${theme.primary}35`,
              borderRadius: 999,
              background: theme.accent,
              color: theme.primary,
              cursor: "pointer",
              padding: "7px 14px",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {category}
          </button>
        ))}
      </section>

      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 24 }}>Latest Listings</h2>

          <button
            type="button"
            onClick={() => onNavigate("browse")}
            style={{
              border: "1px solid #b9cdea",
              borderRadius: 999,
              background: "#e8f0fe",
              color: "#003da5",
              cursor: "pointer",
              padding: "7px 14px",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            View all
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          {listings.map((listing) => (
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
              <img
                src={listing.image}
                alt={listing.title}
                style={{
                  display: "block",
                  width: "100%",
                  height: 190,
                  objectFit: "cover",
                  background: "#e8f0fe",
                }}
              />

              <div style={{ padding: 16 }}>
                <span
                  style={{
                    display: "inline-block",
                    borderRadius: 999,
                    background: theme.primary,
                    color: "#ffffff",
                    padding: "4px 9px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {listing.category}
                </span>

                <h3
                  style={{
                    margin: "12px 0 10px",
                    color: "#0d2d6b",
                    fontSize: 16,
                  }}
                >
                  {listing.title}
                </h3>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      borderRadius: 999,
                      background: theme.primary,
                      color: "#ffffff",
                      padding: "5px 10px",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    ${listing.price}
                  </span>

                  <span style={{ color: "#64748b", fontSize: 12 }}>
                    {listing.college}
                  </span>
                </div>

                <p
                  style={{
                    margin: "10px 0 0",
                    color: "#94a3b8",
                    fontSize: 12,
                  }}
                >
                  Condition: {listing.condition}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}