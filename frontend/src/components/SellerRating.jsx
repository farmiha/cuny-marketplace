import { useState, useEffect } from "react";
import { apiGet } from "../lib/apiClient";

// shows a seller's average rating, like "★ 4.5 (3 ratings)"
// use it on the listing page: <SellerRating sellerId={listing.sellerId} />
export default function SellerRating({ sellerId }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!sellerId) return;
    apiGet(`/ratings/seller/${sellerId}`)
      .then(setInfo)
      .catch(() => setInfo(null));
  }, [sellerId]);

  if (!info) return null;

  if (!info.count) {
    return <span className="listing-meta">No ratings yet</span>;
  }

  return (
    <span className="listing-meta">
      ★ {Number(info.average).toFixed(1)} ({info.count}{" "}
      {info.count === 1 ? "rating" : "ratings"})
    </span>
  );
}
