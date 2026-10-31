import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";
import ListingCard from "../components/ListingCard";

// newest listings from the sellers you follow
export default function Following() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | loggedOut | error | ready
  const [feed, setFeed] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return setStatus("loggedOut");
      try {
        const res = await apiFetch("/follows/feed", {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
        setFeed(res);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    }
    load();
  }, []);

  return (
    <div className="page">
      <div className="section-head" style={{ marginBottom: 20 }}>
        <div>
          <h2>Following</h2>
          <p className="sub">New listings from sellers you follow.</p>
        </div>
      </div>

      {status === "loading" && <p className="sub">Loading...</p>}
      {status === "error" && (
        <p className="sub">Couldn't load your feed. Try refreshing the page.</p>
      )}
      {status === "loggedOut" && (
        <>
          <p className="sub">Log in to see listings from sellers you follow.</p>
          <button className="cta-primary-solid" onClick={() => navigate("/login")}>
            Log In
          </button>
        </>
      )}

      {status === "ready" && feed.followingCount === 0 && (
        <p className="sub">
          You're not following anyone yet. Open a seller's page from any listing
          and tap Follow.
        </p>
      )}
      {status === "ready" && feed.followingCount > 0 && feed.listings.length === 0 && (
        <p className="sub">The sellers you follow have nothing for sale right now.</p>
      )}
      {status === "ready" && feed.listings.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          {feed.listings.map((l) => (
            <ListingCard
              key={l.id}
              listing={{ ...l, price: Number(l.price), category: l.category?.name }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
