import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import SignInModal from "./SignInModal";
import FollowButton from "./FollowButton";
import { CATEGORY_ICON_PATHS } from "../data/listings";

// soft background color for each category (same as the design)
const BGS = {
  Textbooks: "#DCE3FF",
  Electronics: "#D8F2E6",
  Furniture: "#FFE9B8",
  Clothing: "#FFD9D9",
  Other: "#EADFF5",
  Sports: "#D6EEF7",
  Services: "#FDE3C8",
};

export default function ListingCard({ listing, showMessage = true }) {
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

  const meta = [
    listing.condition,
    listing.location,
    !listing.condition ? listing.postedAt : null,
    typeof listing.saveCount === "number" ? `${listing.saveCount} saved` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      to={`/listing/${listing.id}`}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div className="mp-root">
        <div className="mp-lcard" style={{ position: "relative" }}>
          <div
            className={listing.imageUrl ? "mp-limg" : "mp-limg mp-limg-empty"}
            style={
              listing.imageUrl
                ? { background: BGS[listing.category] || BGS.Other }
                : { "--ph": BGS[listing.category] || BGS.Other }
            }
          >
            <span className="mp-tag">
              {listing.isNew ? "Just in" : listing.category}
            </span>
            {/* show the real photo if the listing has one, otherwise the category icon */}
            {listing.imageUrl ? (
              <img
                src={listing.imageUrl}
                alt={listing.title}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 20,
                }}
              />
            ) : (
              <svg
                width="52"
                height="52"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={iconPath} />
              </svg>
            )}
          </div>

          <div className="mp-lbody">
            <div className="mp-lprice">${listing.price}</div>
            <div className="mp-ltitle">{listing.title}</div>
            <div className="mp-lmeta">{meta}</div>
          </div>

          {/* who is selling it, with a small Follow button like the design */}
          {sellerName && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: showMessage ? "0 18px 14px" : "0 18px 18px",
              }}
            >
              <span
                className="mp-avatar"
                style={{ width: 26, height: 26, fontSize: 11, flex: "none" }}
              >
                {sellerInitial}
              </span>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 13,
                  color: "var(--mp-mute)",
                }}
              >
                Sold by {isMine ? "you" : sellerName}
              </span>
              {listing.sellerId && !isMine && (
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <FollowButton
                    sellerId={listing.sellerId}
                    sellerName={sellerName}
                    chip
                  />
                </span>
              )}
            </div>
          )}

          {showMessage && listing.sellerId && !isMine && (
            <div style={{ padding: "0 18px 18px" }}>
              <button
                className="mp-btn mp-btn-primary"
                style={{ width: "100%" }}
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
            </div>
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
