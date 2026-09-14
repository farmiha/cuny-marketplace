import { CategoryBadge } from "./CategoryBadge";
import { PriceBadge } from "./PriceBadge";

export function ListingCard({ listing, theme, onClick }) {
  return (
    <button
      className="listing-card text-left w-full overflow-hidden"
      onClick={onClick}
    >
      <div
        className="relative"
        style={{ height: 210, background: theme.accent }}
      >
        <img
          src={listing.image}
          alt={listing.title}
          className="w-full h-full object-cover"
        />

        <div className="absolute top-3 left-3">
          <CategoryBadge label={listing.category} theme={theme} />
        </div>
      </div>

      <div className="p-4">
        <p
          className="font-semibold text-sm mb-2 leading-snug"
          style={{ color: "#0d2d6b" }}
        >
          {listing.title}
        </p>

        <div className="flex items-center justify-between">
          <PriceBadge price={listing.price} theme={theme} />

          <span className="text-xs" style={{ color: "#64748b" }}>
            {listing.college}
          </span>
        </div>

        <p className="text-xs mt-1.5" style={{ color: "#94a3b8" }}>
          Condition: {listing.condition}
        </p>
      </div>
    </button>
  );
}