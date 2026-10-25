import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCampusTheme } from "../hooks/useCampusTheme";
import { CATEGORIES } from "../data/campusThemes";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";

// turns a date into "10/21/2026 at 7:42 PM" in the person's own time zone
function formatNextPost(iso) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} at ${time}`;
}

export default function Post() {
  const { theme } = useCampusTheme();
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null); // set when they hit the daily posting limit
  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "",
    location: "",
    condition: "",
    description: "",
  });

  // if they already hit the limit, tell them right away instead of after filling the form
  useEffect(() => {
    async function checkLimit() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      try {
        const info = await apiFetch("/listings/me/limit", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (info.reached) setLimitInfo(info);
      } catch {
        // if this check fails, the backend still blocks the post when they submit
      }
    }
    checkLimit();
  }, []);

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // you have to be logged in to post
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      navigate("/login");
      return;
    }
    const authHeaders = { Authorization: `Bearer ${token}` };

    setSaving(true);
    try {
      // check the limit before uploading the image, so nothing gets uploaded for nothing
      const limit = await apiFetch("/listings/me/limit", {
        headers: authHeaders,
      });
      if (limit.reached) {
        setLimitInfo(limit);
        setSaving(false);
        return;
      }

      // the listing goes under the poster's own campus
      const me = await apiFetch("/auth/me", { headers: authHeaders });
      if (!me) {
        setError("Finish signing up before posting a listing.");
        setSaving(false);
        return;
      }

      // upload the image (if there is one) to the listing-images bucket
      let imageUrl;
      if (imageFile) {
        const path = `${data.session.user.id}/${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(path, imageFile);
        if (uploadError) {
          setError("Image upload failed: " + uploadError.message);
          setSaving(false);
          return;
        }
        imageUrl = supabase.storage.from("listing-images").getPublicUrl(path)
          .data.publicUrl;
      }

      await apiFetch("/listings", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          title: form.title,
          price: form.price,
          categoryName: form.category,
          campusId: me.campusId,
          location: form.location || undefined,
          condition: form.condition || undefined,
          description: form.description || undefined,
          imageUrl,
        }),
      });

      navigate("/browse");
    } catch (err) {
      // the backend says 429 when the daily limit is hit
      const limitMatch = err.message.match(/^API error 429: ([\s\S]*)$/);
      if (limitMatch) {
        let info = {};
        try {
          info = JSON.parse(limitMatch[1]);
        } catch {
          // keep going with an empty object
        }
        setLimitInfo(info);
      } else {
        setError(err.message);
      }
      setSaving(false);
    }
  };

  return (
    <div
      className="page"
      id="page-post"
      style={{ maxWidth: 640, margin: "0 auto" }}
    >
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

      <div className="section-head" style={{ marginBottom: 20 }}>
        <div>
          <h2>Post a Listing</h2>
          <p className="sub">
            {theme.key === "all"
              ? "Fill in the details below. Listings are visible to CUNY students."
              : `Fill in the details below. Listings are visible to ${theme.full} students.`}
          </p>
        </div>
      </div>

      <form className="post-shell" onSubmit={handleSubmit}>
        <div className="post-grid">
          <div className="field field-full">
            <label>Title</label>
            <input
              type="text"
              placeholder="e.g., CSCI 135 Textbook (Good Condition)"
              value={form.title}
              onChange={update("title")}
              required
            />
          </div>

          <div className="field">
            <label>Price ($)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="25"
              value={form.price}
              onChange={update("price")}
              required
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

          <div className="field">
            <label>Listing Image</label>
            <label className="file-input">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="11" r="2" />
                <path d="M21 16l-5-4-4 3-3-2-6 5" />
              </svg>
              <span>{imageFile?.name || "Choose file — no file chosen"}</span>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="field">
            <label>Location</label>
            <input
              type="text"
              placeholder="e.g., Hunter West, Library, Dorms"
              value={form.location}
              onChange={update("location")}
            />
          </div>

          <div className="field">
            <label>Condition</label>
            <select value={form.condition} onChange={update("condition")}>
              <option value="">Select condition...</option>
              <option>New</option>
              <option>Like new</option>
              <option>Good</option>
              <option>Fair</option>
            </select>
          </div>

          <div className="field field-full">
            <label>Description</label>
            <textarea
              rows="4"
              placeholder="Add details like condition, included accessories, when/where to meet, etc."
              value={form.description}
              onChange={update("description")}
            />
          </div>

          <div className="field-full">
            {error && (
              <p style={{ color: "crimson", marginBottom: 10 }}>{error}</p>
            )}
            <button type="submit" className="auth-submit" disabled={saving}>
              {saving ? "Posting..." : "Post Listing"}
            </button>
          </div>
        </div>
      </form>

      {/* popup when they reach the daily posting limit */}
      {limitInfo && (
        <div
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
          onClick={() => setLimitInfo(null)}
        >
          <div
            style={{
              background: "#fff",
              color: "#1a1a1a",
              borderRadius: 16,
              padding: 28,
              maxWidth: 420,
              width: "100%",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 10px" }}>You reached your limit</h3>
            <p style={{ margin: "0 0 6px" }}>
              You can post up to 10 listings per day. Try again in 24 hours.
            </p>
            {limitInfo.nextPostAt && (
              <p style={{ margin: "0 0 20px", color: "#555" }}>
                You can post again on {formatNextPost(limitInfo.nextPostAt)}.
              </p>
            )}
            <button
              className="cta-primary-solid"
              onClick={() => setLimitInfo(null)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
