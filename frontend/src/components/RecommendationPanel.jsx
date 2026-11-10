import { CATEGORIES } from "../data/campusThemes";
import "../styles/RecommendationPanel.css";

export default function RecommendationPanel({
  activity, liveScores, appliedScores, pending, onUpdate, onReset,
}) {
  return (
    <section className="reco-panel" aria-label="Recommendation algorithm testing panel">
      <div className="reco-head">
        <div>
          <span className="reco-tag">Algorithm demo</span>
          <h3>How recommendations work</h3>
          <p>
            View: +1 once per listing. Saved or in cart: +3 per listing.
            Every 4th spot is a discovery pick from another category.
          </p>
        </div>
        <div className="reco-buttons">
          <button type="button" className="reco-btn primary" onClick={onUpdate}>
            Update recommendations
          </button>
          <button type="button" className="reco-btn" onClick={onReset}>
            Reset algorithm
          </button>
        </div>
      </div>

      <div className="reco-scores">
        {CATEGORIES.map((name) => (
          <div key={name}>
            <span>{name}</span>
            <strong>{liveScores[name] || 0}</strong>
            <small>Applied: {appliedScores[name] || 0}</small>
          </div>
        ))}
      </div>

      <p className="reco-note">
        {pending
          ? "Scores changed. Click Update recommendations to re-rank the listings."
          : "Ranking matches the current scores."}
      </p>

      <details>
        <summary>Recent activity ({activity.log.length})</summary>
        {activity.log.length === 0 ? (
          <p className="reco-note">No activity yet.</p>
        ) : (
          <ol className="reco-log">
            {activity.log.map((e) => <li key={e.id}>{e.message}</li>)}
          </ol>
        )}
      </details>
    </section>
  );
}