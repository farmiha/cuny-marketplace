// Thin fetch wrapper for your own backend endpoints (if you have any
// outside of Supabase — e.g. a serverless function for search/moderation).
// Set VITE_API_BASE_URL in your .env file.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";


async function request(path, options = {}) {
 const res = await fetch(`${BASE_URL}${path}`, {
   headers: { "Content-Type": "application/json", ...(options.headers || {}) },
   ...options,
 });
 if (!res.ok) {
   const message = await res.text().catch(() => res.statusText);
   throw new Error(`API error ${res.status}: ${message}`);
 }
 const contentType = res.headers.get("content-type") || "";
 return contentType.includes("application/json") ? res.json() : res.text();
}


// General-purpose call — pass method/headers/body directly.
// Used by AuthPages.jsx for the signup/login flow.
export const apiFetch = (path, options = {}) => request(path, options);


export const apiGet = (path) => request(path);


export const apiPost = (path, body) =>
 request(path, { method: "POST", body: JSON.stringify(body) });


// Example: swap the mock data in src/data/listings.js for this once your
// backend is live.
export function getListings(params = {}) {
 const query = new URLSearchParams(params).toString();
 return apiGet(`/listings${query ? `?${query}` : ""}`);
}


export function createListing(listing) {
 return apiPost("/listings", listing);
}
