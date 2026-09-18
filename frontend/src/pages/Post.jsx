import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCampusTheme } from "../hooks/useCampusTheme";
import { CATEGORIES } from "../data/campusThemes";
// import { createListing } from "../lib/apiClient";

export default function Post() {
  const { theme } = useCampusTheme();
  const navigate = useNavigate();
  const [fileName, setFileName] = useState("");
  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "",
    location: "",
    condition: "",
    description: "",
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Wire this up to lib/apiClient.js or lib/supabaseClient.js once the
    // backend is ready, e.g. await createListing({ ...form, campus: theme.key });
    console.log("New listing:", form);
    navigate("/browse");
  };

  return (
    <div className="page" id="page-post">
      <span className="back-link" onClick={() => navigate("/browse")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
              placeholder="25"
              value={form.price}
              onChange={update("price")}
              required
            />
          </div>

          <div className="field">
            <label>Category</label>
            <select value={form.category} onChange={update("category")} required>
              <option value="">Select a category...</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Listing Image</label>
            <label className="file-input">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="11" r="2" />
                <path d="M21 16l-5-4-4 3-3-2-6 5" />
              </svg>
              <span>{fileName || "Choose file — no file chosen"}</span>
              <input
                type="file"
                style={{ display: "none" }}
                onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
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
            <button type="submit" className="auth-submit">Post Listing</button>
          </div>
        </div>
      </form>
    </div>
  );
}
