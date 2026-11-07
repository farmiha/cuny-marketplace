import { Link } from "react-router-dom";
import CategoryBadge from "./CategoryBadge";
import { STATUS_LABEL, timeAgo } from "../lib/wantedApi";

// one request on the Wanted page
export default function WantedCard({ request, myId }) {
  const name = request.requester?.name;
  const initial = name ? name.trim().charAt(0).toUpperCase() : "";
  const offers = request.responseCount || 0;
  // if you posted this request, it says "You" instead of your name
  const requesterId = request.requesterId ?? request.requester?.id;
  const isMine = !!myId && myId === requesterId;

  return (
    <Link
      to={`/wanted/${request.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="listing wanted-card">
        <div className="listing-body">
          <div className="wanted-card-top">
            <CategoryBadge category={request.category?.name} />
            {request.status !== "open" && (
              <span className="wanted-chip muted">
                {STATUS_LABEL[request.status]}
              </span>
            )}
          </div>

          <h3 className="listing-title wanted-card-title">
            Looking for: {request.title}
          </h3>

          {request.description && (
            <p className="wanted-card-desc">{request.description}</p>
          )}

          <p className="wanted-budget">
            {request.maxBudget
              ? `Up to $${request.maxBudget}`
              : "No budget set"}
          </p>

          <div className="listing-footer">
            <div className="seller">
              <span className="avatar">{initial}</span>
              <span className="listing-meta">
                {isMine ? "You" : name || "CUNY student"} ·{" "}
                {request.campus?.name}
              </span>
            </div>
            <span className="listing-meta">{timeAgo(request.createdAt)}</span>
          </div>

          <div style={{ marginTop: 12 }}>
            <span className={"wanted-chip" + (offers > 0 ? " offers" : "")}>
              {offers === 0
                ? "No offers yet"
                : `${offers} offer${offers === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
