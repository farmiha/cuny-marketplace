import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";

// Gives the whole app the unread message count, and shows a small
// "New message from [SELLER]" popup when a message arrives.
const MessageAlertsContext = createContext({ unread: 0 });

export function useUnread() {
  return useContext(MessageAlertsContext).unread;
}

export function MessageAlertsProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  // on the messages tab already? then no popup is needed
  const onMessagesRef = useRef(false);
  onMessagesRef.current =
    location.pathname === "/dashboard" &&
    new URLSearchParams(location.search).get("tab") !== "profile";

  // keep track of who is logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s),
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const token = session?.access_token;
  const myId = session?.user?.id;

  async function refresh() {
    if (!token) {
      setUnread(0);
      return;
    }
    try {
      const data = await apiFetch("/messages/unread-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnread(data.count);
    } catch {
      // keep the old number if the request fails
    }
  }

  // refresh the count when logging in, changing pages, and every 20 seconds
  useEffect(() => {
    refresh();
    if (!token) return;
    const id = setInterval(refresh, 20000);
    return () => clearInterval(id);
  }, [token, location.pathname, location.search]);

  // the chat page says when messages were read, so the count drops right away
  useEffect(() => {
    window.addEventListener("messages-read", refresh);
    return () => window.removeEventListener("messages-read", refresh);
  }, [token]);

  // live connection: a new message bumps the count and shows the popup
  useEffect(() => {
    if (!token) return;

    const socket = io(import.meta.env.VITE_API_BASE_URL || undefined, {
      auth: { token },
    });

    socket.on("new_message", (msg) => {
      // hand every message to the chat page too, so it updates without a refresh
      window.dispatchEvent(new CustomEvent("new-message", { detail: msg }));

      if (msg.senderId === myId) return; // my own message
      refresh();
      if (onMessagesRef.current) return;

      setToast(msg);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(null), 5000);
    });

    return () => {
      socket.disconnect();
      clearTimeout(timer.current);
    };
  }, [token]);

  function openMessages() {
    setToast(null);
    navigate("/dashboard?tab=messages");
  }

  const preview =
    toast && toast.content.length > 70
      ? toast.content.slice(0, 70) + "..."
      : toast?.content;

  return (
    <MessageAlertsContext.Provider value={{ unread, refresh }}>
      {children}

      {toast && (
        <div
          onClick={openMessages}
          style={{
            position: "fixed",
            top: 76,
            right: 20,
            zIndex: 2000,
            width: 320,
            maxWidth: "calc(100vw - 40px)",
            background: "#1f2937",
            color: "#fff",
            borderRadius: 14,
            padding: "14px 16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>New message from {toast.senderName}</strong>
            <span
              onClick={(e) => {
                e.stopPropagation();
                setToast(null);
              }}
              style={{ opacity: 0.7, cursor: "pointer" }}
            >
              ✕
            </span>
          </div>
          {toast.listingTitle && (
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>
              Re: {toast.listingTitle}
            </div>
          )}
          <div style={{ marginTop: 6, opacity: 0.9 }}>{preview}</div>
        </div>
      )}
    </MessageAlertsContext.Provider>
  );
}