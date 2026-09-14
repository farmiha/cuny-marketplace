const overview = [
  { label: "Chats to answer", value: 2, icon: "💬" },
  { label: "Active listings", value: 3, icon: "📦" },
  { label: "Listings to renew", value: 1, icon: "🔄" },
  { label: "To delete / relist", value: 0, icon: "🗑️" },
];

const performance = [
  { label: "Clicks on listings", sub: "Last 7 days", value: 47, icon: "👆" },
  { label: "Seller rating", sub: "12 ratings", value: 4.8, icon: "⭐" },
  { label: "New followers", sub: "Last 7 days", value: 5, icon: "👥" },
  { label: "Unread comments", sub: "", value: 3, icon: "🔔" },
];

const listings = [
  {
    id: 1,
    title: "Graphing Calculator TI-84 Plus",
    category: "Electronics",
    posted: "2 hours ago",
    price: 40,
    image:
      "https://images.unsplash.com/photo-1648201637025-1c77b9be3013?auto=format&fit=crop&w=200&h=200",
  },
  {
    id: 2,
    title: "Dell XPS 13 2022 Laptop",
    category: "Electronics",
    posted: "5 hours ago",
    price: 650,
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=200&h=200",
  },
  {
    id: 3,
    title: "IKEA ALEX Desk - White",
    category: "Furniture",
    posted: "1 day ago",
    price: 55,
    image:
      "https://images.unsplash.com/photo-1506664453913-f326aa81f54d?auto=format&fit=crop&w=200&h=200",
  },
];

function Card({ children }) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        background: "#ffffff",
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.05)",
      }}
    >
      {children}
    </div>
  );
}

export default function Dashboard({ onNavigate, theme }) {
  return (
    <div
      style={{
        maxWidth: 960,
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
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Selling Dashboard</h1>
          <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>
            Track your listings, chats, and performance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate("post")}
          style={{
            border: 0,
            borderRadius: 8,
            background: "linear-gradient(135deg, #003da5, #0052cc)",
            color: "#ffffff",
            cursor: "pointer",
            padding: "11px 16px",
            fontFamily: "inherit",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Create listing
        </button>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h2
          style={{
            margin: "0 0 14px",
            color: "#94a3b8",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Overview
        </h2>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          }}
        >
          {overview.map((item) => (
            <Card key={item.label}>
              <div style={{ padding: 20 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong style={{ color: theme.primary, fontSize: 32 }}>
                    {item.value}
                  </strong>

                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                </div>

                <p style={{ margin: "12px 0 0", color: "#64748b", fontSize: 13 }}>
                  {item.label}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2
          style={{
            margin: "0 0 14px",
            color: "#94a3b8",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Performance
        </h2>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          }}
        >
          {performance.map((item) => (
            <Card key={item.label}>
              <div style={{ padding: 20 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong style={{ color: theme.primary, fontSize: 32 }}>
                    {item.value}
                  </strong>

                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                </div>

                <p
                  style={{
                    margin: "12px 0 0",
                    color: "#334155",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {item.label}
                </p>

                {item.sub && (
                  <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 12 }}>
                    {item.sub}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2
          style={{
            margin: "0 0 14px",
            color: "#94a3b8",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          My Listings
        </h2>

        <Card>
          {listings.map((listing, index) => (
            <article
              key={listing.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: 16,
                borderBottom:
                  index === listings.length - 1
                    ? "none"
                    : "1px solid #e2e8f0",
              }}
            >
              <img
                src={listing.image}
                alt={listing.title}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 8,
                  objectFit: "cover",
                  background: "#e8f0fe",
                }}
              />

              <div style={{ minWidth: 0, flex: 1 }}>
                <h3
                  style={{
                    overflow: "hidden",
                    margin: 0,
                    color: "#0d2d6b",
                    fontSize: 14,
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {listing.title}
                </h3>

                <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 12 }}>
                  {listing.category} · {listing.posted}
                </p>
              </div>

              <span
                style={{
                  borderRadius: 999,
                  background: "#003da5",
                  color: "#ffffff",
                  padding: "5px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                ${listing.price}
              </span>

              <span
                style={{
                  borderRadius: 999,
                  background: "#dcfce7",
                  color: "#15803d",
                  padding: "5px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Active
              </span>
            </article>
          ))}
        </Card>
      </section>
    </div>
  );
}