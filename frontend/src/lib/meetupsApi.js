import { supabase } from "./supabaseClient";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function call(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `Something went wrong (${res.status})`);
  return body;
}

const post = (path, body) => call(path, { method: "POST", body: JSON.stringify(body || {}) });

export const getSpots = (listingId) => call(`/meetups/spots?listingId=${listingId}`);
export const proposeMeetup = (listingId, otherUserId, startsAt, spot, note) =>
  post("/meetups", { listingId, otherUserId, startsAt, spot, note });
export const confirmMeetup = (id) => post(`/meetups/${id}/confirm`);
export const declineMeetup = (id) => post(`/meetups/${id}/decline`);
export const rescheduleMeetup = (id, startsAt, spot, note) =>
  post(`/meetups/${id}/reschedule`, { startsAt, spot, note });
export const cancelMeetup = (id) => post(`/meetups/${id}/cancel`);