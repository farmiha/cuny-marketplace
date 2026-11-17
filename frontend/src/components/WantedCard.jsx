import { Link } from "react-router-dom";
import { STATUS_LABEL, timeAgo } from "../lib/wantedApi";

// one request on the Wanted page (new design)
export default function WantedCard({ request, myId }) {
  const name = request.requester?.name;
  const initial = name ? name.trim().charAt(0).toUpperCase() : "";
  const offers = request.responseCount || 0;
  // if you posted this request, it says "You" instead of your name
  const requesterId = request.requesterId ?? request.requester?.id;
  const isMine = !!myId && myId === requesterId;

  return (
    <Link to={`/wanted/${request.id}`} style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}>
      <div className="mp-root" style={{ height: "100%" }}>
        <article className="mp-card mp-wcard">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--mp-accent)" }}>
              {request.category?.name}
            </span>
            {request.status !== "open" && (
              <span className="mp-chip" style={{ height: 24, fontSize: 12, padding: "0 10px" }}>
                {STATUS_LABEL[request.status]}
              </span>
            )}
          </div>

          <h3 style={{ fontSize: 18, lineHeight: 1.3 }}>Looking for: {request.title}</h3>

          {request.description && (
            <p style={{ color: "var(--mp-mute)", fontSize: 14, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {request.description}
            </p>
          )}

          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 600 }}>
            {request.maxBudget ? `Up to $${request.maxBudget}` : "No budget set"}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="mp-avatar" style={{ width: 26, height: 26, fontSize: 11, flex: "none" }}>{initial}</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--mp-mute)" }}>
              {isMine ? "You" : name || "CUNY student"} · {request.campus?.name}
            </span>
            <span style={{ fontSize: 13, color: "var(--mp-mute)" }}>{timeAgo(request.createdAt)}</span>
          </div>

          <div>
            <span className="mp-chip" style={{ height: 28, fontSize: 12, padding: "0 12px" }}>
              {offers === 0 ? "No offers yet" : `${offers} offer${offers === 1 ? "" : "s"}`}
            </span>
          </div>
        </article>
      </div>
    </Link>
  );
}