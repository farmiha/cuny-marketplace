import { useNavigate } from "react-router-dom";

// Popup shown when a seller has blocked you from following, viewing or messaging them.
export default function BlockedModal({ sellerName }) {
  const navigate = useNavigate();
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="You can't do that"
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
          You can't follow {sellerName || "this seller"}
        </h3>
        <p style={{ margin: "0 0 18px", color: "#555" }}>
          This seller has blocked you, so you can't follow them, see their
          profile, or message them.
        </p>
        <button
          className="cta-primary-solid"
          style={{ width: "100%", padding: "12px 0", borderRadius: 10 }}
          onClick={() => navigate("/browse")}
        >
          Back to browsing
        </button>
      </div>
    </div>
  );
}
