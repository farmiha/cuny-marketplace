import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";

const YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"];

export default function AuthPages() {
  const navigate = useNavigate();
  const [view, setView] = useState("login"); // "login" | "signup"
  const [step, setStep] = useState("form"); // "form" | "code"

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [campuses, setCampuses] = useState([]);
  const [campusId, setCampusId] = useState("");
  const [year, setYear] = useState("");
  const [expectedGraduation, setExpectedGraduation] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
          throw new Error(
            "No account found for this email. Please sign up first.",
          );
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
        setError(
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

  return (
    <div className="page" id="page-auth">
      <div className="auth-wrap">
        <span className="back-link" onClick={() => navigate("/")}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to home
        </span>

        <div className="auth-card">
          {error && (
            <p className="field hint" style={{ color: "#e06565" }}>
              {error}
            </p>
          )}

          {/* ---------- LOGIN ---------- */}
          {view === "login" && (
            <div className="auth-view active">
              <div className="auth-head">
                <h2>Welcome back</h2>
                <p>Sign in to your account.</p>
              </div>

              {step === "form" && (
                <form className="auth-body" onSubmit={handleLoginSendCode}>
                  <div className="field field-input-icon">
                    <label>CUNY Email</label>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 6l9 7 9-7" />
                      <path d="M21 6v12H3V6" />
                    </svg>
                    <input
                      type="email"
                      placeholder="you@stu-mail.hunter.cuny.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="auth-submit"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send verification code"}
                  </button>
                  <p className="auth-switch">
                    Don't have an account?{" "}
                    <a
                      onClick={() => {
                        setView("signup");
                        resetToForm();
                      }}
                    >
                      Sign up
                    </a>
                  </p>
                </form>
              )}

              {step === "code" && (
                <form className="auth-body" onSubmit={handleLoginVerify}>
                  <p className="field hint">We sent a code to {email}.</p>
                  <div className="field">
                    <label>Verification code</label>
                    <input
                      type="text"
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="auth-submit"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Log In"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ---------- SIGNUP ---------- */}
          {view === "signup" && (
            <div className="auth-view active">
              <div className="auth-head">
                <div className="eyebrow">
                  <span className="dot-pulse" />
                  <span>VERIFIED CUNY STUDENTS ONLY</span>
                </div>
                <h2>Buy &amp; sell within your own campus.</h2>
                <p>
                  Sign up with your campus stu-mail address. We'll send a
                  one-time code to verify it's really you.
                </p>
              </div>

              {step === "form" && (
                <form className="auth-body" onSubmit={handleSignupSendCode}>
                  <div className="field">
                    <label>Full name</label>
                    <input
                      type="text"
                      placeholder="First and last name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Which CUNY do you go to?</label>
                    <select
                      value={campusId}
                      onChange={(e) => setCampusId(e.target.value)}
                      required
                    >
                      <option value="">Select your campus...</option>
                      {campuses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>What year are you in?</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      required
                    >
                      <option value="">Select your year...</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>When are you graduating?</label>
                    <input
                      type="month"
                      value={expectedGraduation}
                      onChange={(e) => setExpectedGraduation(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field field-input-icon">
                    <label>School email</label>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 6l9 7 9-7" />
                      <path d="M21 6v12H3V6" />
                    </svg>
                    <input
                      type="email"
                      placeholder="firstname.lastname25@stu-mail.hunter.cuny.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="auth-submit"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send verification code"}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>

                  <p className="field hint" style={{ marginTop: 14 }}>
                    Only your campus stu-mail address can create an account.
                  </p>
                  <p className="auth-switch">
                    Already have an account?{" "}
                    <a
                      onClick={() => {
                        setView("login");
                        resetToForm();
                      }}
                    >
                      Log in
                    </a>
                  </p>
                </form>
              )}

              {step === "code" && (
                <form className="auth-body" onSubmit={handleSignupVerify}>
                  <p className="field hint">We sent a code to {email}.</p>
                  <div className="field">
                    <label>Verification code</label>
                    <input
                      type="text"
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="auth-submit"
                    disabled={loading}
                  >
                    {loading
                      ? "Creating account..."
                      : "Verify & create account"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
