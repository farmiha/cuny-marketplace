import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";
import { useAdminMode } from "../hooks/useAdminMode";

// goes on the Profile page. Students never see it (it returns null).
export default function AdminSection() {
  const { isAdmin, adminView, toggle } = useAdminMode();
  const [pending, setPending] = useState([]);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function auth() {
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session.access_token}` };
  }

  async function load() {
    try {
      setPending(
        await apiFetch("/admin/listings/pending", { headers: await auth() }),
      );
    } catch (e) {
      setMsg(e.message);
    }
  }

  useEffect(() => {
    if (adminView) load();
  }, [adminView]);

  async function decide(id, action) {
    setMsg("");
    try {
      await apiFetch(`/admin/listings/${id}/${action}`, {
        method: "PATCH",
        headers: await auth(),
      });
      load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function makeAdmin() {
    setMsg("");
    try {
      const r = await apiFetch("/admin/users/admin", {
        method: "PATCH",
        headers: await auth(),
        body: JSON.stringify({ email, isAdmin: true }),
      });
      setMsg(`${r.email} is now an admin.`);
      setEmail("");
    } catch (e) {
      setMsg(e.message);
    }
  }

  if (!isAdmin) return null;

  return (
    <div className="mp-card" style={{ padding: 20, marginTop: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ fontSize: 20 }}>Admin</h2>
        <button className="mp-btn mp-btn-dark" onClick={toggle}>
          {adminView ? "Switch to student view" : "Switch to admin view"}
        </button>
      </div>

      {adminView && (
        <>
          <h3 style={{ marginTop: 16 }}>
            Reported listings pending review ({pending.length})
          </h3>
          {pending.length === 0 && (
            <p style={{ color: "var(--mp-mute)" }}>Nothing to review.</p>
          )}
          {pending.map((l) => (
            <div
              key={l.id}
              style={{ borderTop: "1px solid #ddd", padding: "12px 0" }}
            >
              <b>{l.title}</b> · ${l.price} · {l.category?.name}
              <div style={{ color: "var(--mp-mute)", fontSize: 14 }}>
                Seller: {l.seller?.name || l.seller?.email}
              </div>
              {l.imageUrl && (
                <img
                  src={l.imageUrl}
                  alt=""
                  style={{ height: 90, borderRadius: 8, marginTop: 6 }}
                />
              )}
              <p style={{ fontSize: 14 }}>{l.description}</p>
              <ul style={{ fontSize: 13, paddingLeft: 18 }}>
                {l.reports.map((r, i) => (
                  <li key={i}>{r.reason}</li>
                ))}
              </ul>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="mp-btn mp-btn-primary"
                  onClick={() => decide(l.id, "approve")}
                >
                  Approve
                </button>
                <button
                  className="mp-btn"
                  style={{ background: "var(--mp-bad)", color: "#fff" }}
                  onClick={() => decide(l.id, "reject")}
                >
                  Reject / delete
                </button>
              </div>
            </div>
          ))}

          <h3 style={{ marginTop: 20 }}>Add an admin</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="their school email"
              style={{ flex: 1, padding: 8 }}
            />
            <button className="mp-btn mp-btn-primary" onClick={makeAdmin}>
              Make admin
            </button>
          </div>
        </>
      )}
      {msg && <p style={{ color: "var(--mp-bad)" }}>{msg}</p>}
    </div>
  );
}