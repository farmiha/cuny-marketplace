import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import { supabase } from "../lib/supabaseClient";
import { money } from "../lib/money";
import {
  acceptOffer,
  counterOffer,
  declineOffer,
  getListingInfo,
  sendOffer,
} from "../lib/offersApi";
import {
  cancelMeetup,
  confirmMeetup,
  declineMeetup,
  getSpots,
  proposeMeetup,
  rescheduleMeetup,
} from "../lib/meetupsApi";


const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// Profile photo if the user has one, otherwise their first initial
function Avatar({ name, url }) {
  return (
    <span className="msg-avatar">
      {url ? <img src={url} alt="" /> : (name || "?")[0].toUpperCase()}
    </span>
  );
}

const when = (d) =>
  new Date(d).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

// an offer can run out while the chat is open, so check the clock too
function effStatus(o) {
  const now = Date.now();
  if (o.status === "pending" && new Date(o.expiresAt) < now) return "expired";
  if (o.status === "accepted" && o.holdUntil && new Date(o.holdUntil) < now) return "expired";
  return o.status;
}

// changes whenever a message, offer or meetup status changes (used by the 5 second refresh)
const signature = (list) =>
  list.map((m) => `${m.id}:${m.offer?.status || ""}:${m.meetup?.status || ""}`).join("|");

const whenLong = (d) =>
  new Date(d).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

// a meetup can pass while the chat is open, so check the clock too
function effMeetupStatus(m) {
  const now = Date.now();
  const start = new Date(m.startsAt).getTime();
  if (m.status === "pending" && start < now) return "expired";
  if (m.status === "confirmed" && start + 3 * 60 * 60 * 1000 < now) return "done";
  return m.status;
}

const MEETUP_LABEL = {
  declined: "Declined",
  rescheduled: "New time suggested",
  canceled: "Canceled",
  expired: "Expired",
  done: "Completed",
};

// the value a <input type="datetime-local"> needs for "15 minutes from now"
function minLocal() {
  const d = new Date(Date.now() + 15 * 60 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const STATUS_LABEL = {
  accepted: "Accepted",
  declined: "Declined",
  countered: "Countered",
  expired: "Expired",
  used: "Purchased",
};

function OfferCard({ offer, myId, otherName, busy, onAccept, onDecline, onCounter, onBuy }) {
  const status = effStatus(offer);
  const mine = offer.proposerId === myId;
  const iAmBuyer = offer.buyerId === myId;
  const price = money(offer.amountCents);

  return (
    <div className={"neg-card " + (mine ? "me" : "them")}>
      <span className="neg-label">{mine ? "You offered" : `${otherName} offered`}</span>
      <span className="neg-price">{price}</span>

      {status !== "pending" && status !== "accepted" && (
        <span className={"neg-status " + status}>{STATUS_LABEL[status]}</span>
      )}

      {status === "pending" && (
        <>
          {mine ? (
            <span className="neg-note">Waiting for a reply...</span>
          ) : (
            <div className="neg-actions">
              <button type="button" className="neg-btn primary" disabled={busy} onClick={onAccept}>
                Accept
              </button>
              <button type="button" className="neg-btn" disabled={busy} onClick={onCounter}>
                Counter
              </button>
              <button type="button" className="neg-btn danger" disabled={busy} onClick={onDecline}>
                Decline
              </button>
            </div>
          )}
          <span className="neg-note">Reply by {when(offer.expiresAt)}</span>
        </>
      )}

      {status === "accepted" && (
        <>
          <span className="neg-status accepted">Accepted</span>
          {iAmBuyer ? (
            <button type="button" className="neg-btn primary" disabled={busy} onClick={onBuy}>
              Buy at {price}
            </button>
          ) : (
            <span className="neg-note">The buyer can now pay this price.</span>
          )}
          <span className="neg-note">This price is held until {when(offer.holdUntil)}</span>
        </>
      )}
    </div>
  );
}

function MeetupCard({ meetup, myId, otherName, busy, onConfirm, onDecline, onReschedule, onCancel }) {
  const status = effMeetupStatus(meetup);
  const mine = meetup.proposerId === myId;

  return (
    <div className={"neg-card " + (mine ? "me" : "them")}>
      <span className="neg-label">
        {mine ? "You proposed a meetup" : `${otherName} proposed a meetup`}
      </span>
      <span className="neg-when">{whenLong(meetup.startsAt)}</span>
      <span className="neg-spot">{meetup.spot}</span>
      {meetup.note && <span className="neg-note">"{meetup.note}"</span>}

      {MEETUP_LABEL[status] && <span className={"neg-status " + status}>{MEETUP_LABEL[status]}</span>}

      {status === "pending" &&
        (mine ? (
          <>
            <span className="neg-note">Waiting for a reply...</span>
            <button type="button" className="neg-btn" disabled={busy} onClick={onCancel}>
              Take back
            </button>
          </>
        ) : (
          <div className="neg-actions">
            <button type="button" className="neg-btn primary" disabled={busy} onClick={onConfirm}>
              Confirm meetup
            </button>
            <button type="button" className="neg-btn" disabled={busy} onClick={onReschedule}>
              Other time
            </button>
            <button type="button" className="neg-btn danger" disabled={busy} onClick={onDecline}>
              Decline
            </button>
          </div>
        ))}

      {status === "confirmed" && (
        <>
          <span className="neg-status accepted">Confirmed</span>
          <span className="neg-note">You'll get a reminder 1 hour before.</span>
          <span className="neg-note">Stay in busy public areas, and bring a friend if you can.</span>
          <button type="button" className="neg-btn danger" disabled={busy} onClick={onCancel}>
            Cancel meetup
          </button>
        </>
      )}
    </div>
  );
}

export default function LiveMessagesTab({ fallback }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState(null);
  const [myId, setMyId] = useState(null);
  const [convos, setConvos] = useState([]);
  const [active, setActive] = useState(null); // { listingId, otherUserId, otherUserName, listingTitle }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [listingInfo, setListingInfo] = useState(null); // asking price, status, seller
  const [offerMode, setOfferMode] = useState(null); // null | "new" | { counterFor: offerId }
  const [offerAmount, setOfferAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [spots, setSpots] = useState([]); // safe meetup spots for this listing
  const [meetupMode, setMeetupMode] = useState(null); // null | "new" | { rescheduleFor: meetupId }
  const [meetupWhen, setMeetupWhen] = useState("");
  const [meetupSpot, setMeetupSpot] = useState("");
  const [meetupCustom, setMeetupCustom] = useState("");
  const [meetupNote, setMeetupNote] = useState("");
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
    setOfferMode(null);
    setOfferAmount("");
    setMeetupMode(null);
    setError("");
    getListingInfo(c.listingId).then(setListingInfo).catch(() => setListingInfo(null));
    getSpots(c.listingId).then((r) => setSpots(r.spots)).catch(() => setSpots([]));
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

            // an offer was answered: reload so the older offer card shows its new status
            if (m.kind && m.kind !== "text") {
              apiFetch(`/messages/conversations/${a.listingId}/${a.otherUserId}`, {
                headers: authHeader(t),
              })
                .then(setMessages)
                .catch(() => {});
            }

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
        setMessages((prev) => (signature(prev) === signature(history) ? prev : history));
        getListingInfo(a.listingId).then(setListingInfo).catch(() => {});
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

  // reload this chat (after an offer action)
  async function refreshThread() {
    const a = activeRef.current;
    if (!a) return;
    const history = await apiFetch(
      `/messages/conversations/${a.listingId}/${a.otherUserId}`,
      { headers: authHeader(token) }
    );
    setMessages(history);
    getListingInfo(a.listingId).then(setListingInfo).catch(() => {});
    loadConvos(token).catch(() => {});
  }

  async function runOfferAction(fn) {
    setError("");
    setBusy(true);
    try {
      await fn();
      setOfferMode(null);
      setOfferAmount("");
      setMeetupMode(null);
      await refreshThread();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function submitOffer(e) {
    e.preventDefault();
    if (!offerAmount) return;
    runOfferAction(() =>
      offerMode === "new"
        ? sendOffer(active.listingId, offerAmount, active.otherUserId)
        : counterOffer(offerMode.counterFor, offerAmount)
    );
  }

  function openMeetupForm(mode) {
    setError("");
    setOfferMode(null);
    setMeetupWhen("");
    setMeetupSpot(spots[0] || "__other");
    setMeetupCustom("");
    setMeetupNote("");
    setMeetupMode(mode);
  }

  function submitMeetup(e) {
    e.preventDefault();
    if (!meetupWhen) return;
    const startsAt = new Date(meetupWhen).toISOString();
    const spot = meetupSpot === "__other" ? meetupCustom.trim() : meetupSpot;
    runOfferAction(() =>
      meetupMode === "new"
        ? proposeMeetup(active.listingId, active.otherUserId, startsAt, spot, meetupNote)
        : rescheduleMeetup(meetupMode.rescheduleFor, startsAt, spot, meetupNote)
    );
  }

  const meetups = messages.map((m) => m.meetup).filter(Boolean);
  const openMeetup = meetups.find((x) => ["pending", "confirmed"].includes(effMeetupStatus(x)));
  const canMeet = !!active && !openMeetup;

  const offers = messages.map((m) => m.offer).filter(Boolean);
  const openOffer = offers.find((o) => ["pending", "accepted"].includes(effStatus(o)));
  const iAmSeller = !!listingInfo && listingInfo.sellerId === myId;
  const canOffer = !!listingInfo && listingInfo.status === "active" && !openOffer;

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
              <Avatar name={c.otherUserName} url={c.otherUserAvatar} />
              <div className="msg-item-body">
                <p className="msg-name">
                  {c.otherUserName}{c.unread > 0 ? ` (${c.unread})` : ""}
                </p>
                <p className="msg-subject">{c.listingTitle}</p>
                <p className="msg-preview">{c.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="msg-thread">
          {active ? (
            <>
              <div className="msg-thread-head">
                <Avatar name={active.otherUserName} url={active.otherUserAvatar} />
                <div>
                  <p className="msg-name">{active.otherUserName}</p>
                  <p className="msg-subject">Re: {active.listingTitle}</p>
                </div>
              </div>
              <div className="msg-bubbles">
                {messages.map((m) =>
                  m.kind === "system" ? (
                    <div key={m.id} className="neg-system">{m.content}</div>
                  ) : m.kind === "offer" && m.offer ? (
                    <OfferCard
                      key={m.id}
                      offer={m.offer}
                      myId={myId}
                      otherName={active.otherUserName}
                      busy={busy}
                      onAccept={() => runOfferAction(() => acceptOffer(m.offer.id))}
                      onDecline={() => runOfferAction(() => declineOffer(m.offer.id))}
                      onCounter={() => {
                        setError("");
                        setOfferAmount("");
                        setOfferMode({ counterFor: m.offer.id });
                      }}
                      onBuy={() => navigate(`/checkout?offer=${m.offer.id}`)}
                    />
                  ) : m.kind === "meetup" && m.meetup ? (
                    <MeetupCard
                      key={m.id}
                      meetup={m.meetup}
                      myId={myId}
                      otherName={active.otherUserName}
                      busy={busy}
                      onConfirm={() => runOfferAction(() => confirmMeetup(m.meetup.id))}
                      onDecline={() => runOfferAction(() => declineMeetup(m.meetup.id))}
                      onReschedule={() => openMeetupForm({ rescheduleFor: m.meetup.id })}
                      onCancel={() => runOfferAction(() => cancelMeetup(m.meetup.id))}
                    />
                  ) : (
                    <div key={m.id} className={"bubble " + (m.senderId === myId ? "me" : "them")}>
                      {m.content}
                    </div>
                  )
                )}
                <div ref={bottomRef} />
              </div>
              {error && <p className="field hint" style={{ color: "#e06565" }}>{error}</p>}
              {offerMode && listingInfo && (
                <form className="neg-bar" onSubmit={submitOffer}>
                  <span className="neg-ask">Asking {money(listingInfo.priceCents)}</span>
                  <label className="neg-field">
                    <span>{offerMode === "new" ? "Your offer: $" : "Your counter: $"}</span>
                    <input
                      type="number"
                      min="0.5"
                      step="0.01"
                      inputMode="decimal"
                      autoFocus
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                    />
                  </label>
                  <button type="submit" className="neg-btn primary" disabled={busy || !offerAmount}>
                    {offerMode === "new" ? "Send offer" : "Send counter"}
                  </button>
                  <button type="button" className="neg-cancel" onClick={() => setOfferMode(null)}>
                    Cancel
                  </button>
                </form>
              )}
              {meetupMode && (
                <form className="neg-bar meet-bar" onSubmit={submitMeetup}>
                  <span className="neg-ask">
                    {meetupMode === "new" ? "Propose a meetup" : "Suggest another time"}
                  </span>
                  <label className="neg-field">
                    <span>When</span>
                    <input
                      type="datetime-local"
                      className="meet-when"
                      min={minLocal()}
                      required
                      value={meetupWhen}
                      onChange={(e) => setMeetupWhen(e.target.value)}
                    />
                  </label>
                  <label className="neg-field">
                    <span>Where</span>
                    <select
                      className="meet-spot"
                      value={meetupSpot}
                      onChange={(e) => setMeetupSpot(e.target.value)}
                    >
                      {spots.map((sp) => (
                        <option key={sp} value={sp}>{sp}</option>
                      ))}
                      <option value="__other">Other (type your own)</option>
                    </select>
                  </label>
                  {meetupSpot === "__other" && (
                    <input
                      type="text"
                      className="meet-text"
                      maxLength={80}
                      placeholder="A public campus spot"
                      value={meetupCustom}
                      onChange={(e) => setMeetupCustom(e.target.value)}
                    />
                  )}
                  <input
                    type="text"
                    className="meet-text"
                    maxLength={140}
                    placeholder="Note (optional)"
                    value={meetupNote}
                    onChange={(e) => setMeetupNote(e.target.value)}
                  />
                  <p className="neg-safe">
                    Pick a busy public spot. Libraries and security desks are the safest.
                  </p>
                  <button
                    type="submit"
                    className="neg-btn primary"
                    disabled={busy || !meetupWhen || (meetupSpot === "__other" && !meetupCustom.trim())}
                  >
                    {meetupMode === "new" ? "Send meetup" : "Send new time"}
                  </button>
                  <button type="button" className="neg-cancel" onClick={() => setMeetupMode(null)}>
                    Cancel
                  </button>
                </form>
              )}
              <form className="msg-input" onSubmit={send}>
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                {canOffer && (
                  <button
                    type="button"
                    className="neg-make"
                    disabled={!!offerMode || !!meetupMode}
                    onClick={() => {
                      setError("");
                      setOfferAmount("");
                      setMeetupMode(null);
                      setOfferMode("new");
                    }}
                  >
                    <span className="neg-long">Make an offer</span>
                    <span className="neg-short">Offer</span>
                  </button>
                )}
                {canMeet && (
                  <button
                    type="button"
                    className="neg-make"
                    disabled={!!offerMode || !!meetupMode}
                    onClick={() => openMeetupForm("new")}
                  >
                    <span className="neg-long">Propose meetup</span>
                    <span className="neg-short">Meetup</span>
                  </button>
                )}
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