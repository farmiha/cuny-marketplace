import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCampusTheme } from "../hooks/useCampusTheme";
import { CATEGORIES } from "../data/campusThemes";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";

export default function Post() {
  const { theme } = useCampusTheme();
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "",
    location: "",
    condition: "",
    description: "",
  });

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
      setError(err.message);
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
    </div>
  );
}
