import { supabase } from "./supabaseClient";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Every offer call sends the login token. The server decides every price,
// so the only number we ever send is what the buyer types as their offer.
async function call(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `Something went wrong (${res.status})`);
  return body;
}

const post = (path, body) =>
  call(path, { method: "POST", body: JSON.stringify(body || {}) });

export const getListingInfo = (listingId) => call(`/offers/listing/${listingId}`);
export const getOffer = (offerId) => call(`/offers/${offerId}`);
export const sendOffer = (listingId, amount, otherUserId) =>
  post("/offers", { listingId, amount, otherUserId });
export const acceptOffer = (offerId) => post(`/offers/${offerId}/accept`);
export const declineOffer = (offerId) => post(`/offers/${offerId}/decline`);
export const counterOffer = (offerId, amount) => post(`/offers/${offerId}/counter`, { amount });
export const startOfferCheckout = (offerId) => post(`/offers/${offerId}/checkout`);