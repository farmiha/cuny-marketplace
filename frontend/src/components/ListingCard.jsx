import { Link, useNavigate } from "react-router-dom";
import CategoryBadge from "./CategoryBadge";
import PriceBadge from "./PriceBadge";
import { CATEGORY_ICON_PATHS } from "../data/listings";

// hi
export default function ListingCard({ listing }) {
  const navigate = useNavigate();
  const iconPath =
    CATEGORY_ICON_PATHS[listing.category] || CATEGORY_ICON_PATHS.Other;

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
            <div className="seller">
              {listing.seller && (
                <span className="avatar">{listing.seller}</span>
              )}
              <span className="listing-meta">
                {listing.condition
                  ? `Condition: ${listing.condition}`
                  : listing.location}
              </span>
            </div>
            <span className="listing-meta">
              {listing.condition ? listing.location : listing.postedAt}
            </span>
          </div>
        </div>
        {listing.sellerId && (
          <button
            className="cta-primary-solid"
            style={{ marginTop: 10, width: "100%" }}
            onClick={(e) => {
              e.preventDefault();
              navigate(
                `/dashboard?tab=messages&listingId=${listing.id}&receiverId=${listing.sellerId}`,
              );
            }}
          >
            Message seller
          </button>
        )}
      </div>
    </Link>
  );
}
