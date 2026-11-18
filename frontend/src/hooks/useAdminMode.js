import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";

const KEY = "mp-admin-view";

// isAdmin: this account is an admin
// adminView: an admin who has the admin view turned on
export function useAdminMode() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminView, setAdminView] = useState(
    () => localStorage.getItem(KEY) !== "student",
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      apiFetch("/auth/me", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      })
        .then((me) => setIsAdmin(!!me?.isAdmin))
        .catch(() => {});
    });

    // keeps every component using this hook in sync when the toggle flips
    const sync = () => setAdminView(localStorage.getItem(KEY) !== "student");
    window.addEventListener("mp-admin-view", sync);
    return () => window.removeEventListener("mp-admin-view", sync);
  }, []);

  function toggle() {
    localStorage.setItem(KEY, adminView ? "student" : "admin");
    window.dispatchEvent(new Event("mp-admin-view"));
  }

  return { isAdmin, adminView: isAdmin && adminView, toggle };
}