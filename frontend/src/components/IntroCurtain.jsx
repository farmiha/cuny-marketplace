import { useEffect, useState } from "react";

// Short intro screen. Shows ONLY the first time someone opens the site in a
// browser tab (not on every page change). Uses sessionStorage to remember.
// If sessionStorage is blocked, it just shows once per page load.
export default function IntroCurtain() {
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem("cm-intro-seen");
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!show) return undefined;
    try {
      sessionStorage.setItem("cm-intro-seen", "1");
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setShow(false), 1500);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;
  return (
    <div className="mp-root" aria-hidden="true">
      <div className="mp-loader">
        <span>
          CUNY Market<b>Place</b>
        </span>
      </div>
    </div>
  );
}
