import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CATEGORIES } from "../data/campusThemes";
import { subscribe, getSnapshot, calculateScores, resetActivity } from "../lib/recommendationEngine";

export function useRecommendations(listings) {
  const activity = useSyncExternalStore(subscribe, getSnapshot);
  const liveScores = useMemo(() => calculateScores(listings, activity), [listings, activity]);

  // Scores used for ordering stay frozen until "Update recommendations".
  const [applied, setApplied] = useState(null);

  useEffect(() => {
    if (applied === null && listings.length > 0) setApplied(liveScores);
  }, [applied, listings, liveScores]);

  const appliedScores = applied ?? liveScores;
  const pending = CATEGORIES.some((n) => (liveScores[n] || 0) !== (appliedScores[n] || 0));

  const update = useCallback(() => {
    setApplied({ ...liveScores, __seed: Math.floor(Math.random() * 4294967295) + 1 });
  }, [liveScores]);

  const reset = useCallback(() => {
    if (!window.confirm("Reset all views, saves, cart interest, and scores for this browser?")) return;
    resetActivity();
    setApplied(null);
  }, []);

  return { activity, liveScores, appliedScores, pending, update, reset };
}