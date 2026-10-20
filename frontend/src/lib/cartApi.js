import { apiFetch } from "./apiClient";
import { supabase } from "./supabaseClient";

// apiClient throws errors like: API error 400: {"message":"..."}
// This pulls out just the message so we can show it to the user.
function friendlyError(err) {
  const match = String(err.message).match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (parsed.message) return new Error(parsed.message);
    } catch {
      /* not JSON, fall through */
    }
  }
  return err;
}

// Same as apiFetch, but adds the logged-in user's token.
async function authed(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Please log in first.");
  try {
    return await apiFetch(path, {
      ...options,
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    throw friendlyError(err);
  }
}

export const getCart = (promo) =>
  authed(`/cart${promo ? `?promo=${encodeURIComponent(promo)}` : ""}`);

export const addToCart = (listingId) =>
  authed("/cart", { method: "POST", body: JSON.stringify({ listingId }) });

export const setSavedForLater = (listingId, savedForLater) =>
  authed(`/cart/${listingId}`, {
    method: "PATCH",
    body: JSON.stringify({ savedForLater }),
  });

export const removeFromCart = (listingId) =>
  authed(`/cart/${listingId}`, { method: "DELETE" });

export const createPaymentIntent = (promoCode) =>
  authed("/payments/create-intent", {
    method: "POST",
    body: JSON.stringify({ promoCode }),
  });

export const getOrder = (orderId) => authed(`/payments/orders/${orderId}`);
