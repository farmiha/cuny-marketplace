import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";

// Follow / Following button for a seller.
// onChange(+1 or -1) lets the page update its follower count right away.
export default function FollowButton({ sellerId, sellerName, onChange }) {
  const navigate = useNavigate();
  const [myId, setMyId] = useState(null);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      setMyId(session?.user?.id || null);
      if (!session) return;
      try {
        const res = await apiFetch(`/follows/status/${sellerId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        setFollowing(res.following);
      } catch {
        // leave it as "Follow"
      }
    }
    load();
  }, [sellerId]);

  // nobody follows themselves
  if (myId && myId === sellerId) return null;

  // clicking "Following" asks first, clicking "Follow" goes straight through
  function handleClick() {
    if (following) setConfirming(true);
    else toggle();
  }

  async function toggle() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      navigate("/login");
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/follows/${sellerId}`, {
        method: following ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      setFollowing(!following);
      onChange?.(following ? -1 : 1);
    } catch {
      // keep the old state if it failed
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className={following ? "view-all" : "cta-primary-solid"}
        style={{ padding: "8px 20px", borderRadius: 10 }}
        onClick={handleClick}
        disabled={busy}
      >
        {following ? "Following" : "Follow"}
      </button>

      {confirming && (
        <div
          onClick={() => setConfirming(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
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
              width: "100%",
              textAlign: "center",
              boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
            }}
          >
            <h3 style={{ margin: "0 0 8px" }}>
              Are you sure you want to unfollow {sellerName || "this seller"}?
            </h3>
            <p style={{ margin: "0 0 18px", color: "#555" }}>
              You can follow them again later if you want.
            </p>
            <button
              className="cta-primary-solid"
              style={{ width: "100%", padding: "12px 0", borderRadius: 10 }}
              onClick={async () => {
                setConfirming(false);
                await toggle();
              }}
            >
              Unfollow
            </button>
            <button
              onClick={() => setConfirming(false)}
              style={{
                marginTop: 10,
                background: "none",
                border: "none",
                color: "#555",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
