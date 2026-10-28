import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/apiClient";
import { supabase } from "../lib/supabaseClient";

// the ids this user has saved, loaded once and shared by every heart on the page
let mineSet = null;
let minePromise = null;

async function readJson(res) {
  return typeof res?.json === "function" ? await res.json() : res;
}

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

function loadMine() {
  if (mineSet) return Promise.resolve(mineSet);
  if (!minePromise) {
    minePromise = (async () => {
      const token = await getToken();
      if (!token) {
        minePromise = null;
        return new Set();
      }
      const res = await apiFetch("/saves/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      mineSet = new Set(await readJson(res));
      return mineSet;
    })().catch(() => {
      minePromise = null;
      return new Set();
    });
  }
  return minePromise;
}

// a heart you can click to save a listing, plus how many people saved it
export default function SaveButton({ listingId, count = 0, sellerId }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [total, setTotal] = useState(count);
  const [myId, setMyId] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => setTotal(count), [count]);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setMyId(data.session?.user?.id || null));
    loadMine().then((set) => setSaved(set.has(listingId)));
  }, [listingId]);

  const isMine = !!myId && myId === sellerId;

  async function toggle(e) {
    // the card is a link, so don't let this click open the listing
    e.preventDefault();
    e.stopPropagation();
    if (busy || isMine) return;

    const token = await getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    const next = !saved;
    setBusy(true);
    setSaved(next);
    setTotal((t) => Math.max(0, t + (next ? 1 : -1)));
    try {
      const res = await apiFetch(`/saves/${listingId}`, {
        method: next ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readJson(res);
      if (typeof data?.count === "number") setTotal(data.count);
      const set = await loadMine();
      if (next) set.add(listingId);
      else set.delete(listingId);
    } catch {
      // put it back if the save didn't go through
      setSaved(!next);
      setTotal((t) => Math.max(0, t + (next ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={saved ? "Remove from saved" : "Save listing"}
      title={isMine ? "This is your listing" : saved ? "Saved" : "Save"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: isMine ? "default" : "pointer",
        color: saved ? "crimson" : "inherit",
        fontSize: 15,
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>{saved ? "♥" : "♡"}</span>
      <span>{total}</span>
    </button>
  );
}