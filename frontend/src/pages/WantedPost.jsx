import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CATEGORIES } from "../data/campusThemes";
import SignInModal from "../components/SignInModal";
import { supabase } from "../lib/supabaseClient";
import { authedFetch, errorMessage } from "../lib/wantedApi";

// turns a date into "10/21/2026 at 7:42 PM" in the person's own time zone
function formatWhen(iso) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  })} at ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

export default function WantedPost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [form, setForm] = useState({
    // Browse links here with what the person searched for
    title: (searchParams.get("title") || "").slice(0, 100),
    maxBudget: "",
    category: "",
    description: "",
  });

  // you have to be logged in to post: logged out visitors get a popup
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) setShowSignIn(true);
    });
  }, []);

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const created = await authedFetch("/wanted", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          categoryName: form.category,
          maxBudget: form.maxBudget || undefined,
          description: form.description || undefined,
        }),
      });
      navigate(`/wanted/${created.id}`);
    } catch (err) {
      let message = errorMessage(err);
      // the backend says 429 when the daily limit is hit
      const limit = String(err.message).match(/^API error 429: ([\s\S]*)$/);
      if (limit) {
        try {
          const info = JSON.parse(limit[1]);
          message = `You can post up to 5 requests per day. You can post again on ${formatWhen(info.nextPostAt)}.`;
        } catch {
          // keep the plain message
        }
      }
      setError(message);
      setSaving(false);
    }
  }

  return (
    <div
      className="page"
      id="page-wanted-post"
      style={{ maxWidth: 640, margin: "0 auto" }}
    >
      <span className="back-link" onClick={() => navigate("/wanted")}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to Wanted
      </span>

      <div className="section-head" style={{ marginBottom: 20 }}>
        <div>
          <h2>Post a Request</h2>
          <p className="sub">
            Tell students what you're looking for. Sellers can answer with a
            listing, and you pick the one you like.
          </p>
        </div>
      </div>

      <form className="post-shell" onSubmit={handleSubmit}>
        <div className="post-grid">
          <div className="field field-full">
            <label>What are you looking for?</label>
            <input
              type="text"
              placeholder="e.g., TI-84 graphing calculator"
              maxLength={100}
              value={form.title}
              onChange={update("title")}
              required
            />
          </div>

          <div className="field">
            <label>Max budget ($)</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Optional"
              value={form.maxBudget}
              onChange={(e) =>
                // whole dollars only: drop anything that isn't a digit
                setForm({
                  ...form,
                  maxBudget: e.target.value.replace(/\D/g, ""),
                })
              }
            />
          </div>

          <div className="field">
            <label>Category</label>
            <select
              value={form.category}
              onChange={update("category")}
              required
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="field field-full">
            <label>Details</label>
            <textarea
              rows="4"
              maxLength={500}
              placeholder="Anything that helps: condition you're okay with, course code, edition, when you need it by..."
              value={form.description}
              onChange={update("description")}
            />
          </div>

          <div className="field-full">
            {error && (
              <p style={{ color: "crimson", marginBottom: 10 }}>{error}</p>
            )}
            <button type="submit" className="auth-submit" disabled={saving}>
              {saving ? "Posting..." : "Post Request"}
            </button>
          </div>
        </div>
      </form>

      {showSignIn && (
        <SignInModal
          message="You must be logged in to post a request"
          onClose={() => navigate("/wanted")}
        />
      )}
    </div>
  );
}
