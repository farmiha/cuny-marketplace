import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";
import { createTempClient } from "../lib/tempSupabase";
import { useCampusTheme } from "../hooks/useCampusTheme";

// the school email domain for each campus
const EMAIL_DOMAINS = {
  hunter: "stu-mail.hunter.cuny.edu",
  baruch: "stu-mail.baruch.cuny.edu",
  csi: "stu-mail.csi.cuny.edu",
  queens: "stu-mail.qc.cuny.edu",
  brooklyn: "stu-mail.brooklyn.cuny.edu",
  ccny: "stu-mail.ccny.edu",
  york: "stu-mail.york.edu",
  lehman: "stu-mail.lehman.cuny.edu",
  mec: "stu-mail.mec.cuny.edu",
  jjay: "stu-mail.jjay.cuny.edu",
  citytech: "stu-mail.citytech.cuny.edu",
  bmcc: "stu-mail.bmcc.cuny.edu",
  bcc: "stu-mail.bcc.cuny.edu",
  guttman: "stu-mail.guttman.cuny.edu",
  hostos: "stu-mail.hostos.cuny.edu",
  kcc: "stu-mail.kbcc.cuny.edu",
  laguardia: "stu-mail.laguardia.cuny.edu",
  qcc: "stu-mail.qcc.cuny.edu",
};

const YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"];

export default function AuthPages() {
  const navigate = useNavigate();

  // login placeholder follows the campus picked in the navbar
  const { campus } = useCampusTheme();
  const emailPlaceholder = EMAIL_DOMAINS[campus]
    ? `firstname.lastname##@${EMAIL_DOMAINS[campus]}`
    : "firstname.lastname##@stu-mail.campus.cuny.edu";

  const [view, setView] = useState("login"); // "login" | "signup" | "recover"
  const [step, setStep] = useState("form"); // "form" | "code"

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [campuses, setCampuses] = useState([]);
  const [campusId, setCampusId] = useState("");
  const [year, setYear] = useState("");
  const [expectedGraduation, setExpectedGraduation] = useState("");

  // signup placeholder follows the campus picked in the dropdown
  const pickedCampus = campuses.find((c) => String(c.id) === String(campusId));
  const signupPlaceholder = pickedCampus?.emailDomain
    ? `firstname.lastname##@${pickedCampus.emailDomain}`
    : emailPlaceholder;

  const [error, setError] = useState("");
  // popup shown when someone tries to log in without an account (holds the message)
  const [noAccountMsg, setNoAccountMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // throwaway client used only for the backup email code (see lib/tempSupabase.js)
  const [tempClient] = useState(() => createTempClient());

  // Load campuses for the signup dropdown
  useEffect(() => {
    apiFetch("/campuses")
      .then(setCampuses)
      .catch(() => setError("Could not load the campus list"));
  }, []);

  function resetToForm() {
    setStep("form");
    setCode("");
    setError("");
  }

  // ----- LOGIN -----

  async function handleLoginSendCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // shouldCreateUser: false means login never makes a new account,
      // new people have to go through signup
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (otpError) {
        if (otpError.message?.toLowerCase().includes("not allowed")) {
          setNoAccountMsg("No account found for this email. Please sign up first.");
          return;
        }
        throw otpError;
      }
      setStep("code");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoginVerify(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });
      if (verifyError) throw verifyError;

      // Confirm this person actually has an account already
      const token = data.session.access_token;
      const me = await apiFetch("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!me) {
        await supabase.auth.signOut();
        setView("signup");
        resetToForm(); // this clears the error, so set the message after it
        setNoAccountMsg(
          "No account found for this email yet. Please finish signing up.",
        );
        return;
      }

      navigate("/");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // ----- RECOVER (lost access to the stu-mail, log in with the backup email) -----

  async function handleRecoverSendCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // only send a code if this backup email belongs to an account
      await apiFetch("/auth/recover/lookup", {
        method: "POST",
        body: JSON.stringify({ email }),
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

  async function handleRecoverVerify(e) {
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

      // the backend finds their real account and gives us a one-time login token
      const { tokenHash } = await apiFetch("/auth/recover/complete", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });

      const { error: loginError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email",
      });
      if (loginError) throw loginError;

      navigate("/");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // ----- SIGNUP -----

  async function handleSignupSendCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiFetch("/auth/check-domain", {
        method: "POST",
        body: JSON.stringify({ email, campusId: Number(campusId) }),
      });

      const { error: otpError } = await supabase.auth.signInWithOtp({ email });
      if (otpError) throw otpError;

      setStep("code");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignupVerify(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });
      if (verifyError) throw verifyError;

      await apiFetch("/auth/complete-signup", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({
          name,
          campusId: Number(campusId),
          year,
          expectedGraduation,
        }),
      });

      navigate("/");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // ----- small pieces used by every form -----
  const Err = () =>
    error ? (
      <p style={{ color: "var(--mp-bad)", fontSize: 14, fontWeight: 600 }}>{error}</p>
    ) : null;

  const CodeField = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontWeight: 700, fontSize: 14 }}>Verification code</label>
      <input
        className="mp-input"
        type="text"
        placeholder="123456"
        inputMode="numeric"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        required
      />
    </div>
  );

  const link = (fn, text) => (
    <a
      onClick={fn}
      style={{ color: "var(--mp-accent)", fontWeight: 700, cursor: "pointer" }}
    >
      {text}
    </a>
  );

  const heading = (title, sub) => (
    <div>
      <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-.03em" }}>{title}</h1>
      <p style={{ color: "var(--mp-mute)", marginTop: 4 }}>{sub}</p>
    </div>
  );

  const fieldStyle = { display: "flex", flexDirection: "column", gap: 6 };
  const labelStyle = { fontWeight: 700, fontSize: 14 };

  // text on the photo side changes with the view
  const side =
    view === "signup"
      ? { a: "Join your ", b: "CUNY", c: " marketplace", p: "Sell what you do not need and find what you do, right on your campus." }
      : { a: "Buy & sell within your ", b: "CUNY", c: " community", p: "Textbooks, dorm gear, tickets, tutoring. Just classmates, no strangers." };
  const bullets = ["Verified with your CUNY email", "Free to list, always", "Meet safely on campus"];

  return (
    <div className="mp-root" id="page-auth">
      <div className="mp-page" style={{ paddingTop: 40, paddingBottom: 64 }}>
        {noAccountMsg && (
          <div
            onClick={() => setNoAccountMsg("")}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
          >
            <div
              className="mp-card"
              onClick={(e) => e.stopPropagation()}
              style={{ padding: 28, maxWidth: 400, width: "100%", textAlign: "center" }}
            >
              <h3 style={{ margin: "0 0 18px" }}>{noAccountMsg}</h3>
              <button
                className="mp-btn mp-btn-primary"
                style={{ width: "100%" }}
                onClick={() => {
                  setNoAccountMsg("");
                  setView("signup");
                  resetToForm();
                }}
              >
                Sign up
              </button>
              <button
                className="mp-btn mp-btn-ghost"
                style={{ width: "100%", marginTop: 10 }}
                onClick={() => setNoAccountMsg("")}
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div className="mp-card mp-auth-card">
          {/* left: campus photo */}
          <div className="mp-hero mp-auth-side">
            <span style={{ alignSelf: "flex-start", padding: "5px 12px", borderRadius: 999, background: "rgba(255,255,255,.16)", fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
              Verified CUNY students only
            </span>
            <h2 style={{ fontSize: 40, lineHeight: 1.1, color: "#fff" }}>
              {side.a}
              <em style={{ color: "var(--mp-ca)" }}>{side.b}</em>
              {side.c}
            </h2>
            <p style={{ color: "rgba(255,255,255,.9)", maxWidth: 400 }}>{side.p}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 10, fontWeight: 600 }}>
              {bullets.map((b) => (
                <li key={b} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="m8.5 12.5 2.5 2.5 4.5-5" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* right: the form */}
          <div className="mp-auth-form">
            <span
              onClick={() => navigate("/")}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--mp-mute)", fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back to home
            </span>

            {/* ---------- LOGIN ---------- */}
            {view === "login" && step === "form" && (
              <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleLoginSendCode}>
                {heading("Welcome back", "Sign in to your account.")}
                <div style={fieldStyle}>
                  <label style={labelStyle}>CUNY Email</label>
                  <input className="mp-input" type="email" placeholder={emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Err />
                <button type="submit" className="mp-btn mp-btn-primary mp-btn-lg" style={{ width: "100%" }} disabled={loading}>
                  {loading ? "Sending..." : "Send verification code"}
                </button>
                <p style={{ textAlign: "center", color: "var(--mp-mute)" }}>
                  Don't have an account?{" "}
                  {link(() => { setView("signup"); resetToForm(); }, "Sign up")}
                </p>
                <p style={{ textAlign: "center" }}>
                  {link(() => { setView("recover"); resetToForm(); }, "Can't access your CUNY email?")}
                </p>
              </form>
            )}
            {view === "login" && step === "code" && (
              <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleLoginVerify}>
                {heading("Check your CUNY email", `We sent a code to ${email}.`)}
                <CodeField />
                <Err />
                <button type="submit" className="mp-btn mp-btn-primary mp-btn-lg" style={{ width: "100%" }} disabled={loading}>
                  {loading ? "Verifying..." : "Log In"}
                </button>
                <button type="button" className="mp-btn mp-btn-ghost" onClick={resetToForm}>Change email</button>
              </form>
            )}

            {/* ---------- RECOVER ---------- */}
            {view === "recover" && step === "form" && (
              <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleRecoverSendCode}>
                {heading("Recover your account", "Enter the backup email you saved in your profile. We'll send it a one-time code.")}
                <div style={fieldStyle}>
                  <label style={labelStyle}>Backup email</label>
                  <input className="mp-input" type="email" placeholder="you@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Err />
                <button type="submit" className="mp-btn mp-btn-primary mp-btn-lg" style={{ width: "100%" }} disabled={loading}>
                  {loading ? "Sending..." : "Send verification code"}
                </button>
                <p style={{ textAlign: "center" }}>
                  {link(() => { setView("login"); resetToForm(); }, "Back to login")}
                </p>
              </form>
            )}
            {view === "recover" && step === "code" && (
              <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleRecoverVerify}>
                {heading("Check your backup email", `We sent a code to ${email}.`)}
                <CodeField />
                <Err />
                <button type="submit" className="mp-btn mp-btn-primary mp-btn-lg" style={{ width: "100%" }} disabled={loading}>
                  {loading ? "Verifying..." : "Verify & log in"}
                </button>
              </form>
            )}

            {/* ---------- SIGNUP ---------- */}
            {view === "signup" && step === "form" && (
              <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleSignupSendCode}>
                {heading("Create your account", "Only CUNY students can join. It takes a minute.")}
                <div style={fieldStyle}>
                  <label style={labelStyle}>Full name</label>
                  <input className="mp-input" type="text" placeholder="First and last name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Which CUNY do you go to?</label>
                  <select className="mp-input" value={campusId} onChange={(e) => setCampusId(e.target.value)} required>
                    <option value="">Select your campus...</option>
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>What year are you in?</label>
                    <select className="mp-input" value={year} onChange={(e) => setYear(e.target.value)} required>
                      <option value="">Select your year...</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>When are you graduating?</label>
                    <input className="mp-input" type="month" value={expectedGraduation} onChange={(e) => setExpectedGraduation(e.target.value)} required />
                  </div>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>School email</label>
                  <input className="mp-input" type="email" placeholder={signupPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Err />
                <button type="submit" className="mp-btn mp-btn-primary mp-btn-lg" style={{ width: "100%" }} disabled={loading}>
                  {loading ? "Sending..." : "Send verification code"}
                </button>
                <p style={{ textAlign: "center", color: "var(--mp-mute)", fontSize: 14 }}>
                  Only your campus stu-mail address can create an account.
                </p>
                <p style={{ textAlign: "center", color: "var(--mp-mute)" }}>
                  Already have an account?{" "}
                  {link(() => { setView("login"); resetToForm(); }, "Log in")}
                </p>
              </form>
            )}
            {view === "signup" && step === "code" && (
              <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleSignupVerify}>
                {heading("Check your CUNY email", `We sent a code to ${email}.`)}
                <CodeField />
                <Err />
                <button type="submit" className="mp-btn mp-btn-primary mp-btn-lg" style={{ width: "100%" }} disabled={loading}>
                  {loading ? "Creating account..." : "Verify & create account"}
                </button>
                <button type="button" className="mp-btn mp-btn-ghost" onClick={resetToForm}>Change email</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}