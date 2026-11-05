import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "../data/campusThemes";
import WantedCard from "../components/WantedCard";
import SignInModal from "../components/SignInModal";
import { apiGet } from "../lib/apiClient";
import { authedFetch } from "../lib/wantedApi";
import { supabase } from "../lib/supabaseClient";

// the Wanted board: things students are looking for
export default function Wanted() {
  const [tab, setTab] = useState("all"); // all | mine
  const [requests, setRequests] = useState([]);
  const [mine, setMine] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | error | ready
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [loggedIn, setLoggedIn] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      if (!data.session) return;
      authedFetch("/wanted/mine")
        .then(setMine)
        .catch(() => {});
    });
  }, []);

  useEffect(() => {
    apiGet("/wanted")
      .then((data) => {
        setRequests(data);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Could not load requests:", err);
        setStatus("error");
      });
  }, []);

  const source = tab === "mine" ? mine : requests;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return source.filter(
      (r) =>
        (category === "All categories" || r.category?.name === category) &&
        (!q ||
          r.title.toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q)),
    );
  }, [source, search, category]);

  return (
    <div className="page" id="page-wanted">
      <div className="browse-head">
        <div>
          <h2>Wanted</h2>
          <p className="sub">
            Can't find it in Browse? Ask for it. Students with one to sell can
            answer with their listing.
          </p>
        </div>
        <Link
          to="/wanted/new"
          className="cta-primary"
          style={{ padding: "11px 20px" }}
          onClick={(e) => {
            // logged out visitors get a popup instead of the form
            if (!loggedIn) {
              e.preventDefault();
              setShowSignIn(true);
            }
          }}
        >
          Post a Request
        </Link>
      </div>

      {loggedIn && (
        <div className="wanted-tabs">
          <button
            className={"wanted-tab" + (tab === "all" ? " active" : "")}
            onClick={() => setTab("all")}
          >
            All requests
          </button>
          <button
            className={"wanted-tab" + (tab === "mine" ? " active" : "")}
            onClick={() => setTab("mine")}
          >
            My requests
          </button>
        </div>
      )}

      <div
        className="filters-row"
        style={{ gridTemplateColumns: "1.6fr 1fr" }}
      >
        <input
          type="text"
          placeholder="Search requests... (e.g., calculator, textbook)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {status === "loading" && <p className="sub">Loading...</p>}
      {status === "error" && (
        <p className="sub">Couldn't load requests. Try refreshing the page.</p>
      )}

      {status === "ready" && (
        <div className="wanted-grid">
          {filtered.map((r) => (
            <WantedCard key={r.id} request={r} />
          ))}
          {filtered.length === 0 && (
            <p className="sub" style={{ gridColumn: "1 / -1" }}>
              {tab === "mine"
                ? "You haven't posted any requests yet."
                : requests.length === 0
                  ? "No one is looking for anything right now. Be the first to post a request."
                  : "No requests match your filters yet."}
            </p>
          )}
        </div>
      )}

      {showSignIn && (
        <SignInModal
          message="You must be logged in to post a request"
          onClose={() => setShowSignIn(false)}
        />
      )}
    </div>
  );
}
