import { createPortal } from "react-dom";
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

  // shown on top of everything (outside any card), same style as the other popups
  return createPortal(
    <div
      className="mp-root cm-modal-overlay"
      onClick={(e) => {
        stop(e);
        onClose();
      }}
    >
      <div
        className="cm-modal cm-modal-small"
        role="alertdialog"
        aria-modal="true"
        aria-label="Sign in required"
        onClick={stop}
      >
        <h3>Sign in to continue</h3>
        <p className="cm-modal-sub">{message}</p>
        <div className="cm-modal-actions">
          <button
            type="button"
            className="cm-modal-btn"
            onClick={(e) => {
              stop(e);
              onClose();
            }}
          >
            Not now
          </button>
          <button
            type="button"
            className="cm-modal-btn cm-modal-btn-primary"
            onClick={(e) => {
              stop(e);
              navigate("/login");
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
