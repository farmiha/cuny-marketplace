import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CAMPUS_ORDER, CAMPUS_THEMES } from "../data/campusThemes";
import { useCampusTheme } from "../hooks/useCampusTheme";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";
import { createTempClient } from "../lib/tempSupabase";
import { useUnread } from "../components/MessageAlerts";

import LiveMessagesTab from "../components/LiveMessages";

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

// turns "sanila.chowdhury27@stu-mail..." into "Sanila Chowdhury"
function nameFromEmail(email) {
  return email
    .split("@")[0]
    .replace(/[0-9]/g, "")
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

// turns "2027-05" into "May 2027"
function formatGraduation(value) {
  if (!value) return "";
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function MessagesTab() {
  const [activeThread, setActiveThread] = useState("maya");
  const thread = THREADS[activeThread];

  return (
    <>
      <div className="section-head" style={{ marginBottom: 20 }}>
        <div>
          <h2>Messages</h2>
        </div>
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
              <div
                key={i}
                className={"bubble " + (b.who === "me" ? "me" : "them")}
              >
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

// turns "janedoe@gmail.com" into "ja*****@gmail.com"
function maskEmail(email) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}${"*".repeat(Math.max(name.length - 2, 1))}@${domain}`;
}

// lets a student save a personal email, so they can still log in after
// their CUNY stu-mail stops working
function BackupEmailSection({ saved, onSaved }) {
  const [editing, setEditing] = useState(!saved);
  const [step, setStep] = useState("form"); // "form" | "code"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // throwaway client so the real login is never touched (see lib/tempSupabase.js)
  const [tempClient] = useState(() => createTempClient());

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  async function handleSendCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = await getToken();

      // the backend checks the email is allowed before we send anything to it
      await apiFetch("/auth/backup-email/check", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ backupEmail: email }),
      });

      const { error: otpError } = await tempClient.auth.signInWithOtp({
        email: email.trim(),
      });
      if (otpError) throw otpError;

      setStep("code");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // prove they own the backup email
      const { data, error: verifyError } = await tempClient.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "email",
      });
      if (verifyError) throw verifyError;

      const token = await getToken();
      const result = await apiFetch("/auth/backup-email/save", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ backupToken: data.session.access_token }),
      });

      onSaved(result.backupEmail);
      setEditing(false);
      setStep("form");
      setEmail("");
      setCode("");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="profile-section">
      <h3>Backup email</h3>
      <p className="profile-sub">
        Your CUNY email stops working after you graduate. Add a personal email so
        you can still log in and keep your listings and messages.
      </p>

      {saved && !editing && (
        <>
          <p className="profile-sub">Saved: {maskEmail(saved)}</p>
          <button
            className="view-all"
            style={{ borderRadius: 10 }}
            onClick={() => setEditing(true)}
          >
            Change backup email
          </button>
        </>
      )}

      {editing && (
        <form
          onSubmit={step === "form" ? handleSendCode : handleVerify}
          style={{ maxWidth: 360 }}
        >
          {error && (
            <p className="profile-sub" style={{ color: "#e06565" }}>
              {error}
            </p>
          )}

          {step === "form" && (
            <>
              <input
                type="email"
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: "100%", marginBottom: 10 }}
              />
              <button
                type="submit"
                className="cta-primary-solid"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send verification code"}
              </button>
            </>
          )}

          {step === "code" && (
            <>
              <p className="profile-sub">We sent a code to {email}.</p>
              <input
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                style={{ width: "100%", marginBottom: 10 }}
              />
              <button
                type="submit"
                className="cta-primary-solid"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify & save"}
              </button>
            </>
          )}

          {saved && (
            <button
              type="button"
              className="view-all"
              style={{ borderRadius: 10, marginLeft: 10 }}
              onClick={() => {
                setEditing(false);
                setStep("form");
                setError("");
              }}
            >
              Cancel
            </button>
          )}
        </form>
      )}
    </div>
  );
}

function ProfileTab() {
  const navigate = useNavigate();
  const { campus, setCampus } = useCampusTheme();
  const [role, setRole] = useState("buyer");
  const [shopAll, setShopAll] = useState(false);

  // the logged in user's real profile
  const [profile, setProfile] = useState(null);
  const [campusName, setCampusName] = useState("");
  const [status, setStatus] = useState("loading"); // "loading" | "loggedOut" | "error" | "ready"

  useEffect(() => {
    async function loadProfile() {
      // check if someone is logged in
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setStatus("loggedOut");
        return;
      }

      try {
        // get their profile from our backend, and the campus list to find their campus name
        const [me, campuses] = await Promise.all([
          apiFetch("/auth/me", {
            headers: { Authorization: `Bearer ${data.session.access_token}` },
          }),
          apiFetch("/campuses"),
        ]);

        if (!me) {
          setStatus("error");
          return;
        }

        setProfile(me);
        setCampusName(campuses.find((c) => c.id === me.campusId)?.name || "");
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    }

    loadProfile();
  }, []);

  if (status !== "ready") {
    return (
      <>
        <div className="section-head" style={{ marginBottom: 20 }}>
          <div>
            <h2>Profile</h2>
          </div>
        </div>
        {status === "loading" && (
          <p className="profile-sub">Loading your profile...</p>
        )}
        {status === "error" && (
          <p className="profile-sub">
            Couldn't load your profile. Try refreshing the page.
          </p>
        )}
        {status === "loggedOut" && (
          <>
            <p className="profile-sub">Log in to see your profile.</p>
            <button
              className="cta-primary-solid"
              onClick={() => navigate("/login")}
            >
              Log In
            </button>
          </>
        )}
      </>
    );
  }

  const displayName = profile.name || nameFromEmail(profile.email);
  const graduation = formatGraduation(profile.expectedGraduation);
  const details = [
    campusName,
    profile.year,
    graduation && `Graduating ${graduation}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="section-head" style={{ marginBottom: 20 }}>
        <div>
          <h2>Profile</h2>
        </div>
      </div>
      <div className="profile-shell">
        <div className="profile-card">
          <div className="profile-avatar">{displayName[0]}</div>
          <p className="profile-name">{displayName}</p>
          <p className="profile-email">{profile.email}</p>
          <p className="profile-sub">{details}</p>
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
              This determines your default feed and your listings' pickup
              location.
            </p>
            <div className="campus-card-grid">
              {CAMPUS_ORDER.filter((k) => k !== "all").map((key) => {
                const c = CAMPUS_THEMES[key];
                return (
                  <div
                    key={key}
                    className={
                      "campus-pick-card" + (campus === key ? " selected" : "")
                    }
                  >
                    <p className="cp-name">{c.full}</p>
                    <p className="cp-loc">{c.borough}</p>
                    <button
                      className="cp-select"
                      onClick={() => setCampus(key)}
                    >
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
              <span>
                {shopAll
                  ? "On — showing listings from every campus"
                  : "Off — showing your campus only"}
              </span>
            </div>
          </div>

          <BackupEmailSection
            saved={profile.backupEmail}
            onSaved={(backupEmail) => setProfile({ ...profile, backupEmail })}
          />

          <div className="profile-section">
            <h3>Safety</h3>
            <p className="profile-sub">
              Report or block a listing or user any time from their page.
            </p>
            <button className="view-all" style={{ borderRadius: 10 }}>
              Blocked users (0)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "profile" ? "profile" : "messages";
  const unread = useUnread();

  return (
    <div className="page" id="page-dashboard">
      <div className="segmented" style={{ maxWidth: 260, marginBottom: 26 }}>
        <button
          className={"seg-btn" + (tab === "messages" ? " active" : "")}
          onClick={() => setSearchParams({ tab: "messages" })}
        >
          Messages{unread > 0 && ` (${unread > 9 ? "9+" : unread})`}
        </button>
        <button
          className={"seg-btn" + (tab === "profile" ? " active" : "")}
          onClick={() => setSearchParams({ tab: "profile" })}
        >
          Profile
        </button>
      </div>
      {tab === "messages" ? <LiveMessagesTab fallback={<MessagesTab />} /> : <ProfileTab />}
    </div>
  );
}