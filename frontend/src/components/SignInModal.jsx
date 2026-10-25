import { useNavigate } from "react-router-dom";

// A small popup that tells a logged out visitor they need to sign in.
// message: what to say, onClose: called when they close the popup
export default function SignInModal({ message, onClose }) {
  const navigate = useNavigate();

  // clicks in here must not trigger a link the popup sits inside (like a listing card)
  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      onClick={(e) => {
        stop(e);
        onClose();
      }}
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
        onClick={stop}
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
        <h3 style={{ margin: "0 0 18px" }}>{message}</h3>
        <button
          className="cta-primary-solid"
          style={{ width: "100%", padding: "12px 0", borderRadius: 10 }}
          onClick={(e) => {
            stop(e);
            navigate("/login");
          }}
        >
          Sign in
        </button>
        <button
          onClick={(e) => {
            stop(e);
            onClose();
          }}
          style={{
            marginTop: 10,
            background: "none",
            border: "none",
            color: "#555",
            cursor: "pointer",
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
