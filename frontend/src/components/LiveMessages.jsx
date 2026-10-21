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
    }).then(() => {
      loadConvos(t);
      // tell the navbar to update its unread count
      window.dispatchEvent(new Event("messages-read"));
    }).catch(() => {});
  }

  // Set up session, inbox, and socket once
  useEffect(() => {
    let socket;
    let handler;
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

        // one handler for every incoming message
        const onMessage = (m) => {
          console.log("[live] new message arrived", m.id);
          const a = activeRef.current;
          if (a && m.listingId === a.listingId &&
              (m.senderId === a.otherUserId || m.receiverId === a.otherUserId)) {
            setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));

            // I'm looking at this chat, so a message from them counts as read
            if (m.senderId === a.otherUserId) {
              apiFetch(`/messages/conversations/${a.listingId}/${a.otherUserId}/read`, {
                method: "PATCH",
                headers: authHeader(t),
              })
                .then(() => {
                  loadConvos(t);
                  window.dispatchEvent(new Event("messages-read"));
                })
                .catch(() => {});
              return;
            }
          }
          loadConvos(t).catch(() => {});
        };

        // messages come in through this page's own socket, and also from the
        // navbar's socket (MessageAlerts.jsx), so a message is never missed
        socket = io(API, { auth: { token: t } });
        socketRef.current = socket;
        socket.on("new_message", onMessage);

        handler = (e) => onMessage(e.detail);
        window.addEventListener("new-message", handler);
      } catch (err) {
        console.error(err);
      } finally {
        setReady(true);
      }
    })();
    return () => {
      socket?.disconnect();
      if (handler) window.removeEventListener("new-message", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Backup: check for new messages every 5 seconds, in case the instant push is missed
  useEffect(() => {
    if (!token || !myId) return;
    const id = setInterval(async () => {
      try {
        loadConvos(token).catch(() => {});
        const a = activeRef.current;
        if (!a) return;
        const history = await apiFetch(
          `/messages/conversations/${a.listingId}/${a.otherUserId}`,
          { headers: authHeader(token) }
        );
        setMessages((prev) =>
          prev.length === history.length &&
          prev[prev.length - 1]?.id === history[history.length - 1]?.id
            ? prev
            : history
        );
        // they sent something while I'm looking at this chat: mark it read
        if (history.some((m) => m.receiverId === myId && !m.read)) {
          apiFetch(`/messages/conversations/${a.listingId}/${a.otherUserId}/read`, {
            method: "PATCH",
            headers: authHeader(token),
          })
            .then(() => window.dispatchEvent(new Event("messages-read")))
            .catch(() => {});
        }
      } catch {
        // try again on the next round
      }
    }, 5000);
    return () => clearInterval(id);
  }, [token, myId]);

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