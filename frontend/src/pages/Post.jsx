import { useState } from "react";

const initialForm = {
  title: "",
  price: "",
  category: "",
  location: "",
  condition: "",
  description: "",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1.5px solid #cbd5e1",
  borderRadius: 8,
  padding: "10px 12px",
  background: "#ffffff",
  color: "#0d2d6b",
  fontFamily: "inherit",
  fontSize: 14,
};

export default function Post({ onNavigate, theme }) {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            background: "#ffffff",
            boxShadow: "0 2px 10px rgba(15, 23, 42, 0.05)",
            padding: 32,
          }}
        >
          <div
            style={{
              display: "grid",
              placeItems: "center",
              width: 64,
              height: 64,
              margin: "0 auto 18px",
              borderRadius: "50%",
              background: "#003da5",
              color: "#ffffff",
              fontSize: 28,
            }}
          >
            ✓
          </div>

          <h1 style={{ margin: 0, fontSize: 28 }}>Listing Posted!</h1>

          <p style={{ margin: "14px 0 24px", color: "#64748b", lineHeight: 1.6 }}>
            Your item, <strong>{form.title}</strong>, is now visible to CUNY
            students.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => onNavigate("browse")}
              style={{
                border: 0,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${theme.buttonFrom}, ${theme.buttonTo})`,
                color: "#ffffff",
                cursor: "pointer",
                padding: "11px 16px",
                fontFamily: "inherit",
                fontWeight: 700,
              }}
            >
              Browse Listings
            </button>

            <button
              type="button"
              onClick={() => {
                setForm(initialForm);
                setSubmitted(false);
              }}
              style={{
                border: "1.5px solid #b9cdea",
                borderRadius: 8,
                background: "#ffffff",
                color: "#003da5",
                cursor: "pointer",
                padding: "11px 16px",
                fontFamily: "inherit",
                fontWeight: 700,
              }}
            >
              Post Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "32px 24px",
      }}
    >
      <h1 style={{ margin: 0, fontSize: 28 }}>Post a Listing</h1>

      <p style={{ margin: "8px 0 28px", color: "#64748b", fontSize: 14 }}>
        Fill in the details below. Listings are visible to verified CUNY
        students.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          background: "#ffffff",
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.05)",
          padding: 24,
        }}
      >
        <label>
          <span
            style={{
              display: "block",
              marginBottom: 7,
              color: "#475569",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Title
          </span>

          <input
            required
            name="title"
            value={form.title}
            onChange={updateField}
            placeholder="e.g., CSCI 135 Textbook — Good Condition"
            style={inputStyle}
          />
        </label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <label>
            <span
              style={{
                display: "block",
                marginBottom: 7,
                color: "#475569",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Price
            </span>

            <input
              required
              min="0"
              type="number"
              name="price"
              value={form.price}
              onChange={updateField}
              placeholder="25"
              style={inputStyle}
            />
          </label>

          <label>
            <span
              style={{
                display: "block",
                marginBottom: 7,
                color: "#475569",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Category
            </span>

            <select
              required
              name="category"
              value={form.category}
              onChange={updateField}
              style={inputStyle}
            >
              <option value="">Select a category...</option>
              <option>Electronics</option>
              <option>Textbooks</option>
              <option>Furniture</option>
              <option>Sports</option>
              <option>Clothing</option>
              <option>Services</option>
              <option>Other</option>
            </select>
          </label>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <label>
            <span
              style={{
                display: "block",
                marginBottom: 7,
                color: "#475569",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Location
            </span>

            <input
              required
              name="location"
              value={form.location}
              onChange={updateField}
              placeholder="e.g., Hunter West, Library, Dorms"
              style={inputStyle}
            />
          </label>

          <label>
            <span
              style={{
                display: "block",
                marginBottom: 7,
                color: "#475569",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Condition
            </span>

            <select
              required
              name="condition"
              value={form.condition}
              onChange={updateField}
              style={inputStyle}
            >
              <option value="">Select condition...</option>
              <option>Like New</option>
              <option>Good</option>
              <option>Fair</option>
              <option>For Parts</option>
            </select>
          </label>
        </div>

        <label>
          <span
            style={{
              display: "block",
              marginBottom: 7,
              color: "#475569",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Description
          </span>

          <textarea
            required
            rows="5"
            name="description"
            value={form.description}
            onChange={updateField}
            placeholder="Add details like condition, accessories, and where to meet."
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </label>

        <button
          type="submit"
          style={{
            border: 0,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${theme.buttonFrom}, ${theme.buttonTo})`,
            color: "#ffffff",
            cursor: "pointer",
            padding: "12px 16px",
            fontFamily: "inherit",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          Post Listing
        </button>
      </form>
    </div>
  );
}