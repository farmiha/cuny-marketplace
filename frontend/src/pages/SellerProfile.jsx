import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet } from "../lib/apiClient";
import { supabase } from "../lib/supabaseClient";
import ListingCard from "../components/ListingCard";
import SellerRating from "../components/SellerRating";
import FollowButton from "../components/FollowButton";

export default function SellerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [showFollowers, setShowFollowers] = useState(false);
  const [followerList, setFollowerList] = useState([]);

  useEffect(() => {
    // if it's your own page, send you to your dashboard
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.id === id)
        navigate("/dashboard", { replace: true });
    });
    apiGet(`/sellers/${id}`)
      .then(setSeller)
      .catch(() => setNotFound(true));
    apiGet(`/follows/count/${id}`)
      .then((res) => setFollowers(res.followers))
      .catch(() => {});
  }, [id]);

  // open the popup with the names of this seller's followers
  function openFollowers() {
    apiGet(`/follows/list/${id}`)
      .then((res) => setFollowerList(res.followers))
      .catch(() => setFollowerList([]));
    setShowFollowers(true);
  }

  if (notFound)
    return (
      <div className="page">
        <p className="sub">That seller doesn't exist.</p>
      </div>
    );
  if (!seller)
    return (
      <div className="page">
        <p className="sub">Loading...</p>
      </div>
    );

  return (
    <div className="page">
      <span className="back-link" onClick={() => navigate(-1)}>
        ‹ Back
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          margin: "12px 0 4px",
        }}
      >
        <h2 style={{ margin: 0 }}>{seller.name || "CUNY student"}</h2>
        <FollowButton
          sellerId={seller.id}
          sellerName={seller.name}
          onChange={(change) => setFollowers((n) => n + change)}
        />
      </div>
      <p className="listing-meta">
        {seller.campus?.name} · Joined{" "}
        {new Date(seller.createdAt).toLocaleDateString()} · {seller.soldCount}{" "}
        sold ·{" "}
        <button
          onClick={openFollowers}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            font: "inherit",
            color: "inherit",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {followers} {followers === 1 ? "follower" : "followers"}
        </button>
      </p>
      <SellerRating sellerId={seller.id} />

      <h3 style={{ marginTop: 24 }}>Listings ({seller.listings.length})</h3>
      {seller.listings.length === 0 ? (
        <p className="sub">No active listings right now.</p>
      ) : (
        <div className="grid">
          {seller.listings.map((l) => (
            <ListingCard
              key={l.id}
              listing={{
                ...l,
                price: Number(l.price),
                category: l.category?.name,
              }}
            />
          ))}
        </div>
      )}

      {showFollowers && (
        <div
          onClick={() => setShowFollowers(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              color: "#1a1a1a",
              borderRadius: 16,
              padding: 24,
              maxWidth: 400,
              width: "100%",
              maxHeight: "70vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
            }}
          >
            <h3 style={{ margin: "0 0 12px" }}>
              Followers ({followerList.length})
            </h3>
            <div style={{ overflowY: "auto" }}>
              {followerList.length === 0 && (
                <p className="sub">No followers yet.</p>
              )}
              {followerList.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setShowFollowers(false);
                    navigate(`/seller/${p.id}`);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 4px",
                    borderBottom: "1px solid var(--line)",
                    cursor: "pointer",
                  }}
                >
                  <div
                    className="profile-avatar"
                    style={{
                      width: 34,
                      height: 34,
                      fontSize: "0.9rem",
                      margin: 0,
                    }}
                  >
                    {p.name[0]}
                  </div>
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowFollowers(false)}
              style={{
                marginTop: 12,
                background: "none",
                border: "none",
                color: "#555",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
