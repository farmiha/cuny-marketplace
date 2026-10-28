import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet } from "../lib/apiClient";
import { supabase } from "../lib/supabaseClient";
import ListingCard from "../components/ListingCard";
import SellerRating from "../components/SellerRating";

export default function SellerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // if it's your own page, send you to your dashboard
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.id === id) navigate("/dashboard", { replace: true });
    });
    apiGet(`/sellers/${id}`)
      .then(setSeller)
      .catch(() => setNotFound(true));
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
      <h2 style={{ margin: "12px 0 4px" }}>{seller.name || "CUNY student"}</h2>
      <p className="listing-meta">
        {seller.campus?.name} · Joined{" "}
        {new Date(seller.createdAt).toLocaleDateString()} · {seller.soldCount} sold
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
              listing={{ ...l, price: Number(l.price), category: l.category?.name }}
            />
          ))}
        </div>
      )}
    </div>
  );
}