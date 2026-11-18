import { useEffect, useState } from "react";

// Remembers the "Shop other CUNY campuses" switch from the Profile page,
// so Browse (and anything else) can read it. It is saved in this browser.
const KEY = "shopAllCampuses";
const EVENT = "shopall-change";

function read() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function useShopAll() {
  const [shopAll, setState] = useState(read);

  // stay in sync when the switch is changed on another page or tab
  useEffect(() => {
    const sync = () => setState(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function setShopAll(value) {
    const next = typeof value === "function" ? value(read()) : value;
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      // if the browser blocks storage, it still works until the page reloads
    }
    setState(next);
    window.dispatchEvent(new Event(EVENT));
  }

  return [shopAll, setShopAll];
}
