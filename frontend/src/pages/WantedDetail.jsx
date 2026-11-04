import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CategoryBadge from "../components/CategoryBadge";
import SignInModal from "../components/SignInModal";
import { apiGet } from "../lib/apiClient";
import { supabase } from "../lib/supabaseClient";
import {
  STATUS_LABEL,
  authedFetch,
  errorMessage,
  timeAgo,
} from "../lib/wantedApi";

// the form a seller uses to answer a request with one of their listings
function OfferForm({ requestId, takenListingIds, onDone }) {
  const [listings, setListings] = useState(null); // null while loading
  const [listingId, setListingId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authedFetch("/listings/mine")
      .then((all) =>
        setListings(
          all.filter(
            (l) => l.status === "active" && !takenListingIds.includes(l.id),
          ),
        ),
      )
      .catch(() => setListings([]));
  }, [takenListingIds]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await authedFetch(`/wanted/${requestId}/responses`, {
        method: "POST",
        body: JSON.stringify({ listingId: Number(listingId), note }),
      });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  if (listings === null) return <p className="sub">Loading your listings...</p>;

  if (listings.length === 0) {
    return (
      <div className="offer-form">
        <p className="sub" style={{ marginBottom: 12 }}>
          You don't have an active listing to offer. Post one first, then come
          back and attach it to this request.
        </p>
        <Link to="/post" className="cta-primary-solid" style={{ padding: "10px 18px", borderRadius: 10, textDecoration: "none" }}>
          Post a listing
        </Link>
      </div>
    );
  }

  return (
    <form className="offer-form" onSubmit={submit}>
      <div className="field">
        <label>Which listing fits?</label>
        <select
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          required
        >
          <option value="">Select one of your listings...</option>
          {listings.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title} (${Number(l.price)})
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Note (optional)</label>
        <textarea
          rows="3"
          maxLength={300}
          placeholder="e.g., Barely used, I can meet at the library"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {error && <p style={{ color: "crimson", marginBottom: 10 }}>{error}</p>}
      <button type="submit" className="cta-primary-solid" style={{ padding: "11px 22px", borderRadius: 10 }} disabled={saving}>
        {saving ? "Sending..." : "Send offer"}
      </button>
    </form>
  );
}

export default function WantedDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [state, setState] = useState("loading"); // loading | notFound | error | ready
  const [myId, setMyId] = useState(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setMyId(data.session?.user?.id || null));
  }, []);

  const load = useCallback(async () => {
    try {
      setRequest(await apiGet(`/wanted/${id}`));
      setState("ready");
    } catch (err) {
      setState(/API error 404/.test(err.message) ? "notFound" : "error");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const backLink = (
    <span className="back-link" onClick={() => navigate("/wanted")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back to Wanted
    </span>
  );

  if (state === "loading") {
    return <div className="page">{backLink}<p className="sub">Loading...</p></div>;
  }
  if (state === "notFound") {
    return <div className="page">{backLink}<p className="sub">This request doesn't exist anymore.</p></div>;
  }
  if (state === "error") {
    return <div className="page">{backLink}<p className="sub">Couldn't load this request. Try refreshing the page.</p></div>;
  }

  const isOwner = !!myId && myId === request.requesterId;
  const isOpen = request.status === "open";
  const offers = request.responses;
  const takenListingIds = offers.map((o) => o.listingId);

  async function run(fn) {
    setActionError("");
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setActionError(errorMessage(err));
    }
    setBusy(false);
  }

  const setStatus = (status) =>
    run(async () => {
      await authedFetch(`/wanted/${request.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    });

  const deleteRequest = () =>
    run(async () => {
      await authedFetch(`/wanted/${request.id}`, { method: "DELETE" });
      navigate("/wanted");
    });

  const withdraw = (offerId) =>
    run(async () => {
      await authedFetch(`/wanted/${request.id}/responses/${offerId}`, {
        method: "DELETE",
      });
      await load();
    });

  function startOffer() {
    // logged out visitors get a popup instead of the form
    if (!myId) return setShowSignIn(true);
    setShowForm((v) => !v);
  }

  return (
    <div className="page" id="page-wanted-detail" style={{ maxWidth: 760, margin: "0 auto" }}>
      {backLink}

      <div className="post-shell" style={{ maxWidth: "none" }}>
        <div className="wanted-card-top">
          <CategoryBadge category={request.category?.name} />
          <span className={"wanted-chip" + (isOpen ? " offers" : " muted")}>
            {STATUS_LABEL[request.status]}
          </span>
        </div>
        <h2 style={{ margin: "4px 0 8px" }}>Looking for: {request.title}</h2>
        <p className="wanted-budget">
          {request.maxBudget ? `Up to $${request.maxBudget}` : "No budget set"}
        </p>
        {request.description && (
          <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{request.description}</p>
        )}
        <p className="listing-meta" style={{ marginTop: 14 }}>
          Posted {timeAgo(request.createdAt)} by{" "}
          {isOwner ? "you" : request.requester?.name || "a CUNY student"} ·{" "}
          {request.campus?.name}
        </p>

        {actionError && (
          <p style={{ color: "crimson", marginTop: 12 }}>{actionError}</p>
        )}

        {/* the person who asked can mark it found, close it, reopen it or delete it */}
        {isOwner && (
          <div className="wanted-actions">
            {isOpen ? (
              <>
                <button className="cta-primary-solid" style={{ padding: "10px 18px", borderRadius: 10 }} disabled={busy} onClick={() => setStatus("fulfilled")}>
                  I found it
                </button>
                <button className="view-all" style={{ borderRadius: 10 }} disabled={busy} onClick={() => setStatus("closed")}>
                  Close request
                </button>
              </>
            ) : (
              <button className="view-all" style={{ borderRadius: 10 }} disabled={busy} onClick={() => setStatus("open")}>
                Reopen
              </button>
            )}
            {confirmDelete ? (
              <span className="wanted-confirm">
                Delete for good?
                <button className="wanted-danger" disabled={busy} onClick={deleteRequest}>Yes, delete</button>
                <button className="view-all" style={{ borderRadius: 10 }} onClick={() => setConfirmDelete(false)}>No</button>
              </span>
            ) : (
              <button className="wanted-danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </button>
            )}
          </div>
        )}

        {/* everyone else can offer a listing while the request is open */}
        {!isOwner && isOpen && (
          <div style={{ marginTop: 22 }}>
            <button className="cta-primary-solid" style={{ padding: "12px 24px", borderRadius: 10 }} onClick={startOffer}>
              {showForm ? "Cancel" : "I have this"}
            </button>
            {showForm && (
              <OfferForm
                requestId={request.id}
                takenListingIds={takenListingIds}
                onDone={() => {
                  setShowForm(false);
                  load();
                }}
              />
            )}
          </div>
        )}
        {!isOwner && !isOpen && (
          <p className="sub" style={{ marginTop: 18 }}>
            This request is {STATUS_LABEL[request.status].toLowerCase()}, so it isn't taking offers.
          </p>
        )}
      </div>

      <h3 style={{ margin: "28px 0 14px" }}>
        Offers {offers.length > 0 && `(${offers.length})`}
      </h3>

      {offers.length === 0 && (
        <p className="sub">
          {isOwner
            ? "No offers yet. We'll show them here when students answer."
            : "No offers yet. Be the first to answer."}
        </p>
      )}

      <div style={{ display: "grid", gap: 14 }}>
        {offers.map((o) => {
          const mineOffer = !!myId && myId === o.sellerId;
          return (
            <div className="offer-card" key={o.id}>
              <div className="offer-thumb">
                {o.listing.imageUrl ? (
                  <img src={o.listing.imageUrl} alt={o.listing.title} />
                ) : (
                  <span className="listing-meta">No photo</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/listing/${o.listing.id}`} className="offer-title">
                  {o.listing.title}
                </Link>
                <p className="wanted-budget">${Number(o.listing.price)}</p>
                <p className="listing-meta">
                  {[o.listing.condition, o.listing.location && `Meet at ${o.listing.location}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="listing-meta" style={{ marginTop: 4 }}>
                  Offered by{" "}
                  {mineOffer ? (
                    "you"
                  ) : (
                    <Link to={`/seller/${o.sellerId}`} style={{ fontWeight: 700, textDecoration: "underline" }}>
                      {o.seller?.name || "a CUNY student"}
                    </Link>
                  )}{" "}
                  · {timeAgo(o.createdAt)}
                </p>
                {o.note && <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>“{o.note}”</p>}

                <div className="wanted-actions" style={{ marginTop: 12 }}>
                  <Link to={`/listing/${o.listing.id}`} className="view-all" style={{ borderRadius: 10, textDecoration: "none" }}>
                    View listing
                  </Link>
                  {isOwner && (
                    <button
                      className="cta-primary-solid"
                      style={{ padding: "9px 16px", borderRadius: 10 }}
                      onClick={() =>
                        navigate(
                          `/dashboard?tab=messages&listingId=${o.listing.id}&receiverId=${o.sellerId}`,
                        )
                      }
                    >
                      Message seller
                    </button>
                  )}
                  {mineOffer && (
                    <button className="wanted-danger" disabled={busy} onClick={() => withdraw(o.id)}>
                      Withdraw offer
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showSignIn && (
        <SignInModal
          message="You must be logged in to offer an item"
          onClose={() => setShowSignIn(false)}
        />
      )}
    </div>
  );
}
