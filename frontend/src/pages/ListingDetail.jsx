import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet, apiFetch } from "../lib/apiClient";
import { supabase } from "../lib/supabaseClient";

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [myId, setMyId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  // find out who is logged in, so we only show Delete on your own listing
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setMyId(data.session?.user?.id || null);
    });
  }, []);

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

  // get this one listing from the backend
  useEffect(() => {
    apiGet(`/listings/${id}`)
      .then(setListing)
      .catch(() => setNotFound(true));
  }, [id]);

  const backLink = (
    <span className="back-link" onClick={() => navigate("/browse")}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back to browse
    </span>
  );

  if (notFound) {
    return (
      <div className="page">
        {backLink}
        <p className="sub">That listing doesn't exist anymore.</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="page">
        {backLink}
        <p className="sub">Loading...</p>
      </div>
    );
  }

  return (
    <div className="page">
      {backLink}

      <div
        style={{ display: "flex", gap: 32, flexWrap: "wrap", marginTop: 20 }}
      >
        <div style={{ flex: "1 1 360px", maxWidth: 520 }}>
          {listing.imageUrl ? (
            <img
              src={listing.imageUrl}
              alt={listing.title}
              style={{ width: "100%", borderRadius: 16, objectFit: "cover" }}
            />
          ) : (
            <div className="thumb" style={{ height: 320, borderRadius: 16 }} />
          )}
        </div>

        <div style={{ flex: "1 1 320px" }}>
          <p className="listing-meta">
            {listing.category?.name?.toUpperCase()}
          </p>
          <h2 style={{ margin: "6px 0" }}>{listing.title}</h2>
          <h3 style={{ margin: "0 0 16px" }}>${Number(listing.price)}</h3>

          {listing.condition && <p>Condition: {listing.condition}</p>}
          {listing.location && <p>Meet at: {listing.location}</p>}
          <p>Campus: {listing.campus?.name}</p>
          <p>Seller: {listing.seller?.name || "CUNY student"}</p>
          <p className="listing-meta">
            Posted {new Date(listing.createdAt).toLocaleDateString()}
          </p>

          {listing.description && (
            <p style={{ marginTop: 16 }}>{listing.description}</p>
          )}

          {/* only the person who posted it sees the delete button */}
          {myId && myId === listing.sellerId && (
            <div style={{ marginTop: 24 }}>
              {error && (
                <p style={{ color: "crimson", marginBottom: 10 }}>{error}</p>
              )}
              <button
                onClick={() => setShowConfirm(true)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "1px solid crimson",
                  background: "transparent",
                  color: "crimson",
                  cursor: "pointer",
                }}
              >
                Delete listing
              </button>
            </div>
          )}
        </div>
      </div>

      {/* the "are you sure" popup */}
      {showConfirm && (
        <div
          onClick={() => !deleting && setShowConfirm(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              color: "#1a1a1a",
              borderRadius: 16,
              padding: 28,
              maxWidth: 400,
              width: "90%",
              boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
            }}
          >
            <h3 style={{ margin: "0 0 8px" }}>Delete this listing?</h3>
            <p style={{ margin: "0 0 20px" }}>
              "{listing.title}" will be removed for good. This can't be undone.
            </p>
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "1px solid #ccc",
                  background: "#fff",
                  color: "#1a1a1a",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "none",
                  background: "crimson",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
