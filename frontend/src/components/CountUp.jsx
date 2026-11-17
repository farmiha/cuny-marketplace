import { useEffect, useRef, useState } from "react";

// Shows a number that counts up smoothly.
//
// SAFE BY DESIGN:
// - It always ends on the real value. It can never end on 0 or an old number.
// - If the value is not a number (loading, null, "—"), it just shows it as is.
// - When the value changes later (for example the 20 second refresh), it animates
//   from the number on screen to the new one. It never restarts from 0.
// - If the user has "reduce motion" turned on, it shows the real value right away.
//
// Usage:  <CountUp value={totalListings} />
export default function CountUp({ value, duration = 900, animateOnMount = true }) {
  const target = Number(value);
  const valid = value !== null && value !== "" && Number.isFinite(target);
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [shown, setShown] = useState(valid && !(animateOnMount && !reduce) ? target : 0);
  const fromRef = useRef(shown);

  useEffect(() => {
    if (!valid) return undefined;
    if (reduce || fromRef.current === target) {
      fromRef.current = target;
      setShown(target);
      return undefined;
    }
    const from = Number.isFinite(fromRef.current) ? fromRef.current : 0;
    let raf;
    let start;
    const step = (t) => {
      if (start === undefined) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = p >= 1 ? target : Math.round(from + (target - from) * eased);
      fromRef.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, valid, duration, reduce]);

  if (!valid) return <>{value}</>;
  return <>{shown.toLocaleString()}</>;
}
