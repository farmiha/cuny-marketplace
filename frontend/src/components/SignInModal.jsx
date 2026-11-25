import { useNavigate } from "react-router-dom";

// A small popup that tells a logged out visitor they need to sign in.
// message: what to say, onClose: called when they close the popup
// Uses the same popup style (cm-modal) as the blocked users / unblock popups.
export default function SignInModal({ message, onClose }) {
  const navigate = useNavigate();

  // clicks in here must not trigger a link the popup sits inside (like a listing card)
  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className="cm-modal-overlay"
      onClick={(e) => {
        stop(e);
        onClose();
      }}
    >
      <div className="cm-modal cm-modal-small" onClick={stop}>
        <h3>{message}</h3>
        <p className="cm-modal-sub">
          Sign in with your CUNY email to continue.
        </p>
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
    </div>
  );
}
