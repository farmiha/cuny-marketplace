import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CAMPUS_ORDER, CAMPUS_THEMES } from "../data/campusThemes";
import { useCampusTheme } from "../hooks/useCampusTheme";

const THREADS = {
  maya: {
    name: "Maya K.",
    subject: "Re: Calculus: Early Transcendentals, 9th Ed",
    preview: "Sure, does 3pm at the library work?",
    bubbles: [
      { who: "them", text: "Hey! Is the calc textbook still available?" },
      { who: "me", text: "Yep, still have it! Want to meet at the library?" },
      { who: "them", text: "Sure, does 3pm at the library work?" },
    ],
  },
  dev: {
    name: "Dev P.",
    subject: "Re: IKEA MICKE desk, white",
    preview: "Cool, I'll bring cash.",
    bubbles: [
      { who: "them", text: "Is the desk still up for grabs?" },
      { who: "me", text: "Yup! $60, pickup near the quad." },
      { who: "them", text: "Cool, I'll bring cash." },
    ],
  },
};

function MessagesTab() {
  const [activeThread, setActiveThread] = useState("maya");
  const thread = THREADS[activeThread];

  return (
    <>
      <div className="section-head" style={{ marginBottom: 20 }}>
        <div><h2>Messages</h2></div>
      </div>
      <div className="msg-shell">
        <div className="msg-list">
          {Object.entries(THREADS).map(([key, t]) => (
            <div
              key={key}
              className={"msg-item" + (key === activeThread ? " active" : "")}
              onClick={() => setActiveThread(key)}
            >
              <p className="msg-name">{t.name}</p>
              <p className="msg-subject">{t.subject.replace(/^Re: /, "")}</p>
              <p className="msg-preview">{t.preview}</p>
            </div>
          ))}
        </div>
        <div className="msg-thread">
          <div className="msg-thread-head">
            <p className="msg-name">{thread.name}</p>
            <p className="msg-subject">{thread.subject}</p>
          </div>
          <div className="msg-bubbles">
            {thread.bubbles.map((b, i) => (
              <div key={i} className={"bubble " + (b.who === "me" ? "me" : "them")}>
                {b.text}
              </div>
            ))}
          </div>
          <div className="msg-input">
            <input type="text" placeholder="Write a message..." />
            <button className="cta-primary-solid">Send</button>
          </div>
        </div>
      </div>
    </>
  );
}

function ProfileTab() {
  const { campus, setCampus } = useCampusTheme();
  const [role, setRole] = useState("buyer");
  const [shopAll, setShopAll] = useState(false);

  return (
    <>
      <div className="section-head" style={{ marginBottom: 20 }}>
        <div><h2>Profile</h2></div>
      </div>
      <div className="profile-shell">
        <div className="profile-card">
          <div className="profile-avatar">S</div>
          <p className="profile-name">Sam Rivera</p>
          <p className="profile-email">sam.rivera23@login.cuny.edu</p>
          <div className="segmented">
            <button
              className={"seg-btn" + (role === "buyer" ? " active" : "")}
              onClick={() => setRole("buyer")}
            >
              Buyer
            </button>
            <button
              className={"seg-btn" + (role === "seller" ? " active" : "")}
              onClick={() => setRole("seller")}
            >
              Seller
            </button>
          </div>
        </div>

        <div className="profile-main">
          <div className="profile-section">
            <h3>Home campus</h3>
            <p className="profile-sub">
              This determines your default feed and your listings' pickup location.
            </p>
            <div className="campus-card-grid">
              {CAMPUS_ORDER.filter((k) => k !== "all").map((key) => {
                const c = CAMPUS_THEMES[key];
                return (
                  <div
                    key={key}
                    className={"campus-pick-card" + (campus === key ? " selected" : "")}
                  >
                    <p className="cp-name">{c.full}</p>
                    <p className="cp-loc">{c.borough}</p>
                    <button className="cp-select" onClick={() => setCampus(key)}>
                      Select
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="profile-section">
            <h3>Shop other CUNY campuses</h3>
            <p className="profile-sub">
              Turn this on to see listings from every campus, not just your own.
            </p>
            <div className="toggle-row">
              <button
                className="toggle-switch"
                aria-pressed={shopAll}
                onClick={() => setShopAll((v) => !v)}
              >
                <span className="knob" />
              </button>
              <span>{shopAll ? "On — showing listings from every campus" : "Off — showing your campus only"}</span>
            </div>
          </div>

          <div className="profile-section">
            <h3>Safety</h3>
            <p className="profile-sub">Report or block a listing or user any time from their page.</p>
            <button className="view-all" style={{ borderRadius: 10 }}>Blocked users (0)</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "profile" ? "profile" : "messages";

  return (
    <div className="page" id="page-dashboard">
      <div className="segmented" style={{ maxWidth: 260, marginBottom: 26 }}>
        <button
          className={"seg-btn" + (tab === "messages" ? " active" : "")}
          onClick={() => setSearchParams({ tab: "messages" })}
        >
          Messages
        </button>
        <button
          className={"seg-btn" + (tab === "profile" ? " active" : "")}
          onClick={() => setSearchParams({ tab: "profile" })}
        >
          Profile
        </button>
      </div>
      {tab === "messages" ? <MessagesTab /> : <ProfileTab />}
    </div>
  );
}
