import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";

const linkBtn = {
  background: "none",
  border: "none",
  padding: 0,
  font: "inherit",
  color: "inherit",
  cursor: "pointer",
};

// "3 followers · 2 following" on the Profile card.
// Clicking either one opens a popup with the list of people.
export default function FollowStats() {
  const navigate = useNavigate();
  const [lists, setLists] = useState({ followers: [], following: [] });
  const [open, setOpen] = useState(null); // null | "followers" | "following"
  const [toUnfollow, setToUnfollow] = useState(null); // the person we are asking about

  async function unfollow(person) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    try {
      await apiFetch(`/follows/${person.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      // take them off the list right away
      setLists((l) => ({
        ...l,
        following: l.following.filter((p) => p.id !== person.id),
      }));
    } catch {
      // keep them on the list if it failed
    }
  }

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      try {
        const res = await apiFetch("/follows/me/lists", {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
        setLists(res);
      } catch {
        // just show 0 and 0
      }
    }
    load();
  }, []);

  const people = open ? lists[open] : [];

  return (
    <>
      <p className="profile-sub" style={{ marginTop: 6 }}>
        <button style={linkBtn} onClick={() => setOpen("followers")}>
          <strong>{lists.followers.length}</strong>{" "}
          {lists.followers.length === 1 ? "follower" : "followers"}
        </button>
        {" · "}
        <button style={linkBtn} onClick={() => setOpen("following")}>
          <strong>{lists.following.length}</strong> following
        </button>
      </p>

      {open && (
        <div
          onClick={() => setOpen(null)}
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
              padding: 24,
              maxWidth: 400,
              width: "100%",
              maxHeight: "70vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
            }}
          >
            <div className="segmented" style={{ marginBottom: 14 }}>
              <button
                className={"seg-btn" + (open === "followers" ? " active" : "")}
                onClick={() => setOpen("followers")}
              >
                Followers ({lists.followers.length})
              </button>
              <button
                className={"seg-btn" + (open === "following" ? " active" : "")}
                onClick={() => setOpen("following")}
              >
                Following ({lists.following.length})
              </button>
            </div>

            <div style={{ overflowY: "auto" }}>
              {people.length === 0 && (
                <p className="sub" style={{ textAlign: "center" }}>
                  {open === "followers"
                    ? "No followers yet."
                    : "You're not following anyone yet."}
                </p>
              )}
              {people.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/seller/${p.id}`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 4px",
                    borderBottom: "1px solid var(--line)",
                    cursor: "pointer",
                  }}
                >
                  <div
                    className="profile-avatar"
                    style={{
                      width: 34,
                      height: 34,
                      fontSize: "0.9rem",
                      margin: 0,
                    }}
                  >
                    {p.name[0]}
                  </div>
                  <span style={{ flex: 1 }}>{p.name}</span>
                  {open === "following" && (
                    <button
                      className="view-all"
                      style={{ padding: "6px 14px", borderRadius: 10 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setToUnfollow(p);
                      }}
                    >
                      Unfollow
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setOpen(null)}
              style={{
                marginTop: 12,
                background: "none",
                border: "none",
                color: "#555",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {toUnfollow && (
        <div
          onClick={() => setToUnfollow(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
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
              Are you sure you want to unfollow {toUnfollow.name}?
            </h3>
            <p style={{ margin: "0 0 18px", color: "#555" }}>
              You can follow them again later if you want.
            </p>
            <button
              className="cta-primary-solid"
              style={{ width: "100%", padding: "12px 0", borderRadius: 10 }}
              onClick={async () => {
                const person = toUnfollow;
                setToUnfollow(null);
                await unfollow(person);
              }}
            >
              Unfollow
            </button>
            <button
              onClick={() => setToUnfollow(null)}
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
