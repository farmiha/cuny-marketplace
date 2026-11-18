import { useEffect, useState } from "react";

// Intro screen. Shows every time the site is opened or refreshed
// (it does not show again when you just click between pages).
export default function IntroCurtain() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 3500);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;
  return (
    <div className="mp-root mp-intro" aria-hidden="true">
      <div className="mp-loader">
        <span>
          CUNY Market<b>Place</b>
        </span>
      </div>
    </div>
  );
}
