import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { apiGet, apiFetch } from "../lib/apiClient";
import { supabase } from "../lib/supabaseClient";
import { useCart } from "../hooks/useCart";
import ReportButton from "../components/ReportButton";
import SellerRating from "../components/SellerRating";
import SaveButton from "../components/SaveButton";
import FollowButton from "../components/FollowButton";
import { CATEGORY_ICON_PATHS } from "../data/listings";

// soft background color for each category (same as the design)
const BGS = { Textbooks: "#DCE3FF", Electronics: "#D8F2E6", Furniture: "#FFE9B8", Clothing: "#FFD9D9", Other: "#EADFF5", Sports: "#D6EEF7", Services: "#FDE3C8" };
import { recordView } from "../lib/recommendationEngine";

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [myId, setMyId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const { cart, addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [cartError, setCartError] = useState("");

  // find out who is logged in, so we only show Delete on your own listing
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setMyId(data.session?.user?.id || null));
  }, []);

    // count one view point per listing
  useEffect(() => {
    if (!listing) return;
    recordView({
      id: listing.id,
      title: listing.title,
      category: listing.category?.name,
    });
  }, [listing?.id]);

  // this deletes the listing, then goes back to browse
  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      await apiFetch(`/listings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      navigate("/browse");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  // this puts the listing in the buyer's cart
  async function handleAddToCart() {
    if (!myId) {
      navigate("/login");
      return;
    }
    setAdding(true);
    setCartError("");
    try {
      await addToCart(listing.id);
    } catch (err) {
      setCartError(err.message);
    } finally {
      setAdding(false);
    }
  }

  // get this one listing from the backend
  useEffect(() => {
    apiGet(`/listings/${id}`)
      .then(setListing)
      .catch(() => setNotFound(true));
  }, [id]);

  const backLink = (
    <span
      onClick={() => navigate("/browse")}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--mp-mute)", fontWeight: 600, cursor: "pointer" }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back to browse
    </span>
  );

  if (notFound) {
    return (
      <div className="mp-root">
        <div className="mp-page">
          {backLink}
          <p style={{ color: "var(--mp-mute)", marginTop: 16 }}>That listing doesn't exist anymore.</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mp-root">
        <div className="mp-page">
          {backLink}
          <p style={{ color: "var(--mp-mute)", marginTop: 16 }}>Loading...</p>
        </div>
      </div>
    );
  }

  const inCart = [
    ...cart.groups.flatMap((g) => g.items),
    ...cart.saved,
  ].some((i) => i.listingId === listing.id);

  const isMine = !!myId && myId === listing.sellerId;
  const sellerName = listing.seller?.name || "CUNY student";

  return (
    <div className="mp-root" id="page-listing">
      <div className="mp-page">
        {backLink}
        <div className="mp-listing-layout">
          {/* photo (or the category icon on the category color when there is no photo) */}
          <div>
            {listing.imageUrl ? (
              <img
                src={listing.imageUrl}
                alt={listing.title}
                style={{ width: "100%", height: 440, borderRadius: 28, objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{ height: 440, borderRadius: 28, background: BGS[listing.category?.name] || BGS.Other, display: "grid", placeItems: "center", color: "rgba(20,24,43,.5)" }}>
                <svg width="88" height="88" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={CATEGORY_ICON_PATHS[listing.category?.name] || CATEGORY_ICON_PATHS.Other} />
                </svg>
              </div>
            )}
          </div>

          {/* details */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {listing.category?.name && <span className="mp-chip" style={{ height: 30, fontSize: 13 }}>{listing.category.name}</span>}
                {listing.condition && <span className="mp-chip" style={{ height: 30, fontSize: 13 }}>{listing.condition}</span>}
              </div>
              <h1 className="mp-listing-title">{listing.title}</h1>
              <div className="mp-listing-price">${Number(listing.price)}</div>
              {listing.location && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--mp-mute)", fontWeight: 600 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  Pickup at {listing.location}
                </div>
              )}
            </div>

            {/* buttons: message, cart, save (the seller does not see these on their own listing) */}
            {!isMine && listing.status === "active" && (
              <div>
                {cartError && <p style={{ color: "var(--mp-bad)", marginBottom: 10 }}>{cartError}</p>}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    className="mp-btn mp-btn-primary mp-btn-lg"
                    style={{ flex: "1 1 180px" }}
                    onClick={() => {
                      if (!myId) return navigate("/login");
                      navigate(`/dashboard?tab=messages&listingId=${listing.id}&receiverId=${listing.sellerId}`);
                    }}
                  >
                    Message seller
                  </button>
                  {inCart ? (
                    <button className="mp-btn mp-btn-dark mp-btn-lg" style={{ flex: "1 1 140px" }} onClick={() => navigate("/cart")}>
                      In your cart
                    </button>
                  ) : (
                    <button className="mp-btn mp-btn-dark mp-btn-lg" style={{ flex: "1 1 140px" }} onClick={handleAddToCart} disabled={adding}>
                      {adding ? "Adding..." : "Add to cart"}
                    </button>
                  )}
                  <SaveButton listingId={listing.id} count={listing.saveCount} sellerId={listing.sellerId} />
                </div>
              </div>
            )}
            {isMine && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <SaveButton listingId={listing.id} count={listing.saveCount} sellerId={listing.sellerId} />
              </div>
            )}

            {/* seller */}
            <div className="mp-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className="mp-avatar" style={{ width: 52, height: 52, flex: "none" }}>
                  {sellerName.trim().charAt(0).toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800 }}>{isMine ? "You" : sellerName}</div>
                  <div style={{ color: "var(--mp-mute)", fontSize: 14 }}>
                    <SellerRating sellerId={listing.sellerId} />
                    {listing.campus?.name ? ` · ${listing.campus.name}` : ""}
                  </div>
                </div>
                {!isMine && listing.sellerId && <FollowButton sellerId={listing.sellerId} sellerName={sellerName} chip />}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Link className="mp-chip" to={`/seller/${listing.sellerId}`}>View profile</Link>
                {/* buyers can report a listing (the button hides itself on your own listing) */}
                <ReportButton listing={listing} />
              </div>
            </div>

            {listing.description && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>Description</h2>
                <p style={{ color: "var(--mp-mute)", whiteSpace: "pre-wrap" }}>{listing.description}</p>
              </div>
            )}

            {/* only the person who posted it sees the delete button */}
            {isMine && (
              <div>
                {error && <p style={{ color: "var(--mp-bad)", marginBottom: 10 }}>{error}</p>}
                <button
                  className="mp-btn mp-btn-ghost"
                  style={{ color: "var(--mp-bad)", borderColor: "var(--mp-bad)" }}
                  onClick={() => setShowConfirm(true)}
                >
                  Delete listing
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, padding: 16, borderRadius: 16, background: "var(--mp-accent-soft)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", color: "var(--mp-accent)" }}>
                <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <p style={{ fontSize: 14 }}>Meet in a public spot on campus and check the item before you pay.</p>
            </div>
          </div>
        </div>
      </div>

      {/* the "are you sure" popup */}
      {showConfirm && (
        <div
          onClick={() => !deleting && setShowConfirm(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
        >
          <div className="mp-card" onClick={(e) => e.stopPropagation()} style={{ padding: 28, maxWidth: 400, width: "90%" }}>
            <h3 style={{ margin: "0 0 8px" }}>Delete this listing?</h3>
            <p style={{ margin: "0 0 20px", color: "var(--mp-mute)" }}>
              "{listing.title}" will be removed for good. This can't be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="mp-btn mp-btn-ghost" onClick={() => setShowConfirm(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="mp-btn" style={{ background: "var(--mp-bad)", color: "#fff" }} onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}