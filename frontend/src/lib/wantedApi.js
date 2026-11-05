import { supabase } from "./supabaseClient";
import { apiFetch } from "./apiClient";

// calls the backend with the logged in user's token
export async function authedFetch(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("API error 401: Not logged in");
  return apiFetch(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
}

// apiFetch throws errors like `API error 409: {"message":"..."}`,
// this pulls out the part a person can read
export function errorMessage(err) {
  const fallback = "Something went wrong. Please try again.";
  const match = String(err?.message || "").match(/^API error \d+: ([\s\S]*)$/);
  if (!match) return fallback;
  try {
    return JSON.parse(match[1]).message || fallback;
  } catch {
    return match[1] || fallback;
  }
}

// "5m ago", "3h ago", "2d ago", then a plain date
export function timeAgo(iso) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export const STATUS_LABEL = { open: "Open", fulfilled: "Found", closed: "Closed" };
