import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import SignInModal from "./SignInModal";
import CategoryBadge from "./CategoryBadge";
import PriceBadge from "./PriceBadge";
import { CATEGORY_ICON_PATHS } from "../data/listings";

// hi
export default function ListingCard({ listing }) {
  const navigate = useNavigate();

  // who is logged in, so we can tell if this is my own listing
  const [myId, setMyId] = useState(null);
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setMyId(data.session?.user?.id || null));
  }, []);
  const isMine = !!myId && listing.sellerId === myId;
  const [showSignIn, setShowSignIn] = useState(false);
  const iconPath =
    CATEGORY_ICON_PATHS[listing.category] || CATEGORY_ICON_PATHS.Other;

  // the backend sends seller as { name }, the old sample data used a plain string
  const sellerName =
    typeof listing.seller === "string" ? listing.seller : listing.seller?.name;
  const sellerInitial = sellerName
    ? sellerName.trim().charAt(0).toUpperCase()
    : "";

  return (
    <Link
      to={`/listing/${listing.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="listing">
        <div className="thumb">
          {listing.isNew && <span className="badge-new">JUST IN</span>}
          <PriceBadge price={listing.price} />
          {/* show the real photo if the listing has one, otherwise the category icon */}
          {listing.imageUrl ? (
            <img
              src={listing.imageUrl}
              alt={listing.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d={iconPath} />
            </svg>
          )}
        </div>
        <div className="listing-body">
          <CategoryBadge category={listing.category} />
          <p className="listing-title">{listing.title}</p>
          <div className="listing-footer">
            <span className="listing-meta">
              {listing.condition
                ? `Condition: ${listing.condition}`
                : listing.location}
            </span>
            <span className="listing-meta">
              {listing.condition ? listing.location : listing.postedAt}
            </span>
          </div>

          {/* who is selling it: initial in a circle and "Sold by name" */}
          {sellerName && (
            <div className="seller" style={{ marginTop: 12 }}>
              <span className="avatar">{sellerInitial}</span>
              <span className="listing-meta">
                Sold by {isMine ? "you" : sellerName}
              </span>
            </div>
          )}

          {listing.sellerId && !isMine && (
            <button
              className="cta-primary-solid"
              style={{
                marginTop: 14,
                width: "100%",
                padding: "10px 0",
                borderRadius: 10,
                fontSize: "0.85rem",
              }}
              onClick={(e) => {
                e.preventDefault();
                // logged out visitors get a popup instead
                if (!myId) {
                  setShowSignIn(true);
                  return;
                }
                navigate(
                  `/dashboard?tab=messages&listingId=${listing.id}&receiverId=${listing.sellerId}`,
                );
              }}
            >
              Message seller
            </button>
          )}
        </div>
      </div>

      {showSignIn && (
        <SignInModal
          message="You must be signed in to message this seller"
          onClose={() => setShowSignIn(false)}
        />
      )}
    </Link>
  );
}
