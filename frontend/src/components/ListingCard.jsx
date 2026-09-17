import CategoryBadge from "./CategoryBadge";
import PriceBadge from "./PriceBadge";
import { CATEGORY_ICON_PATHS } from "../data/listings";

export default function ListingCard({ listing }) {
  const iconPath = CATEGORY_ICON_PATHS[listing.category] || CATEGORY_ICON_PATHS.Other;

  return (
    <div className="listing">
      <div className="thumb">
        {listing.isNew && <span className="badge-new">JUST IN</span>}
        <PriceBadge price={listing.price} />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d={iconPath} />
        </svg>
      </div>
      <div className="listing-body">
        <CategoryBadge category={listing.category} />
        <p className="listing-title">{listing.title}</p>
        <div className="listing-footer">
          <div className="seller">
            {listing.seller && <span className="avatar">{listing.seller}</span>}
            <span className="listing-meta">
              {listing.condition ? `Condition: ${listing.condition}` : listing.location}
            </span>
          </div>
          <span className="listing-meta">{listing.condition ? listing.location : listing.postedAt}</span>
        </div>
      </div>
    </div>
  );
}
