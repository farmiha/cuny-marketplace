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
        sold · {followers} {followers === 1 ? "follower" : "followers"}
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
    </div>
  );
}
