import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import { signIn, signUp } from "../lib/supabaseClient";

export default function AuthPages() {
  const navigate = useNavigate();
  const [view, setView] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    // await signIn(email, password);
    console.log("Log in with", email);
    navigate("/");
  };

  const handleSignup = (e) => {
    e.preventDefault();
    // await signUp(email) — sends the one-time verification code
    console.log("Send verification code to", email);
  };

  return (
    <div className="page" id="page-auth">
      <div className="auth-wrap">
        <span className="back-link" onClick={() => navigate("/")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to home
        </span>

        <div className="auth-card">
          {view === "login" ? (
            <div className="auth-view active">
              <div className="auth-head">
                <h2>Welcome back</h2>
                <p>Sign in to your account.</p>
              </div>
              <form className="auth-body" onSubmit={handleLogin}>
                <div className="field field-input-icon">
                  <label>CUNY Email</label>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <div className="field">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="auth-submit">Log In</button>
                <p className="auth-switch">
                  Don't have an account?{" "}
                  <a onClick={() => setView("signup")}>Sign up</a>
                </p>
              </form>
            </div>
          ) : (
            <div className="auth-view active">
              <div className="auth-head">
                <div className="eyebrow">
                  <span className="dot-pulse" />
                  <span>VERIFIED CUNY STUDENTS ONLY</span>
                </div>
                <h2>Buy &amp; sell within your own campus.</h2>
                <p>
                  Sign up with your CUNY login email, or your campus stu-mail address — either
                  works. We'll send a one-time code, and if you use your stu-mail address we can
                  tell your campus automatically.
                </p>
              </div>
              <form className="auth-body" onSubmit={handleSignup}>
                <div className="field field-input-icon">
                  <label>School email</label>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <button type="submit" className="auth-submit">
                  Send verification code
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
                <p className="field hint" style={{ marginTop: 14 }}>
                  Only CUNY-issued addresses (@login.cuny.edu or a campus @stu-mail alias) can
                  create an account. Faculty, staff, and outside emails are not accepted.
                </p>
                <p className="auth-switch">
                  Already have an account? <a onClick={() => setView("login")}>Log in</a>
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
