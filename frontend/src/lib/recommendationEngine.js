import { CATEGORIES } from "../data/campusThemes";

const STORAGE_KEY = "cuny-marketplace-reco-v1";

const emptyActivity = () => ({ viewed: [], saved: [], cart: [], log: [] });

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed) return emptyActivity();
    const ids = (v) => (Array.isArray(v) ? [...new Set(v.map(String))] : []);
    return {
      viewed: ids(parsed.viewed),
      saved: ids(parsed.saved),
      cart: ids(parsed.cart),
      log: Array.isArray(parsed.log) ? parsed.log.slice(0, 40) : [],
    };
  } catch {
    return emptyActivity();
  }
}

let state = load();
const listeners = new Set();

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getSnapshot = () => state;

function commit(next) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((fn) => fn());
}

const isInterested = (a, id) => a.saved.includes(id) || a.cart.includes(id);

function change(listing, label, mutate) {
  const id = String(listing.id);
  const next = {
    viewed: [...state.viewed],
    saved: [...state.saved],
    cart: [...state.cart],
    log: state.log,
  };
  mutate(next, id);

  const unchanged = ["viewed", "saved", "cart"].every(
    (k) => next[k].join("|") === state[k].join("|"),
  );
  if (unchanged) return;

  const delta =
    next.viewed.length -
    state.viewed.length +
    3 * (Number(isInterested(next, id)) - Number(isInterested(state, id)));

  next.log = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      message: `${label}: ${listing.title} · ${listing.category} ${delta > 0 ? "+" : ""}${delta}`,
    },
    ...state.log,
  ].slice(0, 40);

  commit(next);
}

// +1 point, once per listing
export const recordView = (listing) =>
  change(listing, "Viewed", (a, id) => {
    if (!a.viewed.includes(id)) a.viewed.push(id);
  });

// copies the real saved + cart items (from useCart) into the algorithm
export function syncInterest(listings, savedIds, cartIds) {
  const saved = [...new Set(savedIds.map(String))];
  const cart = [...new Set(cartIds.map(String))];
  const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
  if (same(saved, state.saved) && same(cart, state.cart)) return;

  const byId = new Map(listings.map((l) => [String(l.id), l]));
  const entry = (id, label) => {
    const l = byId.get(id);
    return l
      ? {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          message: `${label}: ${l.title} · ${l.category}`,
        }
      : null;
  };

  const entries = [
    ...saved.filter((id) => !state.saved.includes(id)).map((id) => entry(id, "Saved")),
    ...state.saved.filter((id) => !saved.includes(id)).map((id) => entry(id, "Unsaved")),
    ...cart.filter((id) => !state.cart.includes(id)).map((id) => entry(id, "Added to cart")),
    ...state.cart.filter((id) => !cart.includes(id)).map((id) => entry(id, "Removed from cart")),
  ].filter(Boolean);

  commit({
    viewed: [...state.viewed],
    saved,
    cart,
    log: [...entries, ...state.log].slice(0, 40),
  });
}

export function resetActivity() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  commit(emptyActivity());
}

// view = 1 point, saved or in cart = 3 points (counted once per listing)
export function calculateScores(listings, activity) {
  const scores = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  const viewed = new Set(activity.viewed);
  const interested = new Set([...activity.saved, ...activity.cart]);

  for (const l of listings) {
    const id = String(l.id);
    if (!(l.category in scores)) continue;
    if (viewed.has(id)) scores[l.category] += 1;
    if (interested.has(id)) scores[l.category] += 3;
  }
  return scores;
}

function seededRandom(seed) {
  let s = Number(seed) >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let v = s;
    v = Math.imul(v ^ (v >>> 15), v | 1);
    v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(items, random) {
  const r = [...items];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

const choose = (items, random) => items[Math.floor(random() * items.length)];
const time = (l) => new Date(l.createdAt || 0).getTime() || 0;
const UNAVAILABLE = ["sold", "hidden", "removed", "deleted"];

export function recommendOrder(listings, scores) {
  const eligible = listings.filter(
    (l) => !UNAVAILABLE.includes(String(l.status ?? "").toLowerCase()),
  );
  const newest = [...eligible].sort((a, b) => time(b) - time(a));
  const seed = Number(scores.__seed) || 0;
  const hasInterest = CATEGORIES.some((n) => (scores[n] || 0) > 0);

  // new user or fresh reset: newest first
  if (!hasInterest && seed === 0) {
    return newest.map((l) => ({
      ...l,
      recommendationReason: "Newest listing · no activity yet",
      recommendationType: "newest",
    }));
  }

  const random = seededRandom(seed);
  const groups = new Map();
  for (const l of newest) {
    if (!groups.has(l.category)) groups.set(l.category, []);
    groups.get(l.category).push(l);
  }
  for (const [name, items] of groups) groups.set(name, shuffled(items, random));

  const ranked = [];
  while (ranked.length < eligible.length) {
    const available = [...groups.keys()].filter((n) => groups.get(n).length > 0);
    if (!available.length) break;

    const top = Math.max(...available.map((n) => scores[n] || 0));
    const topCats = available.filter((n) => (scores[n] || 0) === top);

    // positions 4, 8, 12... are discovery spots
    const discoverySlot = (ranked.length + 1) % 4 === 0;
    const recent = new Set(ranked.slice(-3).map((l) => l.category));

    let cat, reason, type;
    if (discoverySlot) {
      const lower = available.filter((n) => (scores[n] || 0) < top);
      const unfamiliar = available.filter((n) => !recent.has(n));
      const pool = lower.length ? lower : unfamiliar.length ? unfamiliar : available;
      cat = choose(pool, random);
      reason = "Discover another category";
      type = "discovery";
    } else {
      const prev = ranked.at(-1)?.category;
      const varied = topCats.filter((n) => n !== prev);
      cat = choose(varied.length ? varied : topCats, random);
      reason =
        top > 0
          ? `Based on your ${cat.toLowerCase()} interest`
          : "Explore the marketplace";
      type = top > 0 ? "interest" : "discovery";
    }

    ranked.push({
      ...groups.get(cat).pop(),
      recommendationReason: reason,
      recommendationType: type,
    });
  }
  return ranked;
}