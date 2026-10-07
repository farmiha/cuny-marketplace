import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import { supabase } from "../lib/supabaseClient";


const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export default function LiveMessagesTab({ fallback }) {
  const [searchParams] = useSearchParams();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState(null);
  const [myId, setMyId] = useState(null);
  const [convos, setConvos] = useState([]);
  const [active, setActive] = useState(null); // { listingId, otherUserId, otherUserName, listingTitle }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const activeRef = useRef(null);
  const bottomRef = useRef(null);

  const authHeader = (t) => ({ Authorization: `Bearer ${t}` });

  async function loadConvos(t) {
    const list = await apiFetch("/messages/conversations", { headers: authHeader(t) });
    setConvos(list);
    return list;
  }

  async function openConvo(t, c) {
    setActive(c);
    activeRef.current = c;
    const history = await apiFetch(
      `/messages/conversations/${c.listingId}/${c.otherUserId}`,
      { headers: authHeader(t) }
    );
    setMessages(history);
    apiFetch(`/messages/conversations/${c.listingId}/${c.otherUserId}/read`, {
      method: "PATCH",
      headers: authHeader(t),
    }).then(() => loadConvos(t)).catch(() => {});
  }

  // Set up session, inbox, and socket once
  useEffect(() => {
    let socket;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (!session) return setReady(true);

        const t = session.access_token;
        setToken(t);
        setMyId(session.user.id);
        const list = await loadConvos(t);

        // Optional: opened from a "Message seller" link
        const listingId = Number(searchParams.get("listingId"));
        const receiverId = searchParams.get("receiverId");
        if (listingId && receiverId) {
          const existing = list.find(
            (c) => c.listingId === listingId && c.otherUserId === receiverId
          );
          const c = existing || {
            listingId,
            otherUserId: receiverId,
            otherUserName: "Seller",
            listingTitle: `Listing #${listingId}`,
          };
          setConvos((prev) => (existing ? prev : [{ ...c, lastMessage: "", unread: 0 }, ...prev]));
          await openConvo(t, c);
        }

        socket = io(API, { auth: { token: t } });
        socketRef.current = socket;
        socket.on("new_message", (m) => {
          const a = activeRef.current;
          if (a && m.listingId === a.listingId &&
              (m.senderId === a.otherUserId || m.receiverId === a.otherUserId)) {
            setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          }
          loadConvos(t).catch(() => {});
        });
      } catch (err) {
        console.error(err);
      } finally {
        setReady(true);
      }
    })();
    return () => socket?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content || !active) return;
    setError("");
    socketRef.current?.emit(
      "send_message",
      { listingId: active.listingId, receiverId: active.otherUserId, content },
      (res) => {
        if (res?.error) setError(res.error);
        else setText("");
      }
    );
  }

  if (!ready) return null;
  if (!token || (convos.length === 0 && !active)) return fallback;

  return (
    <>
      <div className="section-head" style={{ marginBottom: 20 }}>
        <div><h2>Messages</h2></div>
      </div>
      <div className="msg-shell">
        <div className="msg-list">
          {convos.map((c) => (
            <div
              key={`${c.listingId}:${c.otherUserId}`}
              className={
                "msg-item" +
                (active && active.listingId === c.listingId && active.otherUserId === c.otherUserId
                  ? " active" : "")
              }
              onClick={() => openConvo(token, c)}
            >
              <p className="msg-name">
                {c.otherUserName}{c.unread > 0 ? ` (${c.unread})` : ""}
              </p>
              <p className="msg-subject">{c.listingTitle}</p>
              <p className="msg-preview">{c.lastMessage}</p>
            </div>
          ))}
        </div>

        <div className="msg-thread">
          {active ? (
            <>
              <div className="msg-thread-head">
                <p className="msg-name">{active.otherUserName}</p>
                <p className="msg-subject">Re: {active.listingTitle}</p>
              </div>
              <div className="msg-bubbles">
                {messages.map((m) => (
                  <div key={m.id} className={"bubble " + (m.senderId === myId ? "me" : "them")}>
                    {m.content}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              {error && <p className="field hint" style={{ color: "#e06565" }}>{error}</p>}
              <form className="msg-input" onSubmit={send}>
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button type="submit" className="cta-primary-solid">Send</button>
              </form>
            </>
          ) : (
            <p className="sub" style={{ padding: 20 }}>Pick a conversation to start chatting.</p>
          )}
        </div>
      </div>
    </>
  );
}