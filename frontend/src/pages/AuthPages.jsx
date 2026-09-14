import { useState } from "react";
import { CAMPUS_NAMES } from "../data/campusThemes.js";

const authBackground =
  "radial-gradient(ellipse at 30% 40%, #2d1b69 0%, #1a1040 50%, #0f0a28 100%)";

const cardStyle = {
  width: "100%",
  maxWidth: 430,
  border: "1px solid rgba(139, 92, 246, 0.28)",
  borderRadius: 16,
  background: "rgba(30, 18, 80, 0.78)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  backdropFilter: "blur(16px)",
  padding: 32,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1.5px solid rgba(139, 92, 246, 0.36)",
  borderRadius: 10,
  background: "rgba(255,255,255,0.07)",
  color: "#f1f0f5",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: 14,
  outline: "none",
  padding: "12px 14px",
};

const labelStyle = {
  display: "block",
  marginBottom: 8,
  color: "#e2d9f3",
  fontSize: 13,
  fontWeight: 700,
};

function AuthLayout({ children }) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "calc(100vh - 62px)",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        background: authBackground,
      }}
    >
      <div style={cardStyle}>{children}</div>
    </div>
  );
}

function ErrorMessage({ error }) {
  if (!error) return null;

  return (
    <p
      style={{
        margin: 0,
        border: "1px solid rgba(239, 68, 68, 0.28)",
        borderRadius: 8,
        background: "rgba(239, 68, 68, 0.12)",
        color: "#fca5a5",
        padding: "9px 12px",
        fontSize: 12,
      }}
    >
      {error}
    </p>
  );
}

function PrimaryButton({ children, style, ...props }) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      style={{
        width: "100%",
        border: 0,
        borderRadius: 10,
        background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
        boxShadow: "0 4px 16px rgba(109,40,217,0.45)",
        color: "#ffffff",
        cursor: "pointer",
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 14,
        fontWeight: 700,
        padding: "13px 16px",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function LoginPage({ onNavigate, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please fill in both fields.");
      return;
    }

    setError("");
    onLogin();
    onNavigate("home");
  }

  return (
    <AuthLayout>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 17 }}>🎓</span>
        <span style={{ color: "#a78bfa", fontSize: 12, fontWeight: 700 }}>
          Verified CUNY students only
        </span>
      </div>

      <h1
        style={{
          margin: "0 0 8px",
          color: "#ffffff",
          fontSize: 32,
          lineHeight: 1.1,
        }}
      >
        Welcome back.
      </h1>

      <p
        style={{
          margin: "0 0 24px",
          color: "#c4b5fd",
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        Sign in to your verified student account.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <label>
          <span style={labelStyle}>CUNY Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="yourname@login.cuny.edu"
            style={inputStyle}
          />
        </label>

        <label>
          <span style={labelStyle}>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            style={inputStyle}
          />
        </label>

        <ErrorMessage error={error} />

        <PrimaryButton type="submit">Log In</PrimaryButton>
      </form>

      <p
        style={{
          margin: "20px 0 0",
          color: "#7c6fa0",
          fontSize: 12,
          textAlign: "center",
        }}
      >
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => onNavigate("signup")}
          style={{
            border: 0,
            background: "transparent",
            color: "#a78bfa",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 12,
            textDecoration: "underline",
          }}
        >
          Sign up
        </button>
      </p>
    </AuthLayout>
  );
}

export function SignupPage({ onNavigate, onStartVerification }) {
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (
      !normalizedEmail.endsWith("@login.cuny.edu") &&
      !normalizedEmail.endsWith("@cuny.edu")
    ) {
      setError("Only CUNY student email addresses can create an account.");
      return;
    }

    if (!college) {
      setError("Please select your college.");
      return;
    }

    setError("");
    onStartVerification(normalizedEmail);
    onNavigate("verify");
  }

  return (
    <AuthLayout>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 17 }}>🎓</span>
        <span style={{ color: "#a78bfa", fontSize: 12, fontWeight: 700 }}>
          Verified CUNY students only
        </span>
      </div>

      <h1
        style={{
          margin: "0 0 10px",
          color: "#ffffff",
          fontSize: 32,
          lineHeight: 1.1,
        }}
      >
        Buy and sell within your own campus.
      </h1>

      <p
        style={{
          margin: "0 0 24px",
          color: "#c4b5fd",
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        Sign up with your CUNY login email. We&apos;ll send a one-time code to
        confirm you&apos;re a real student.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <label>
          <span style={labelStyle}>School email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="yourname@login.cuny.edu"
            style={inputStyle}
          />
        </label>

        <label>
          <span style={labelStyle}>Your college</span>
          <select
            value={college}
            onChange={(event) => setCollege(event.target.value)}
            style={{
              ...inputStyle,
              color: college ? "#f1f0f5" : "#a78bfa",
            }}
          >
            <option value="" style={{ background: "#1e1040" }}>
              Select your college...
            </option>

            {CAMPUS_NAMES.filter((name) => name !== "All CUNY").map((name) => (
              <option
                key={name}
                value={name}
                style={{ background: "#1e1040" }}
              >
                {name}
              </option>
            ))}
          </select>
        </label>

        <ErrorMessage error={error} />

        <PrimaryButton type="submit">Send verification code</PrimaryButton>
      </form>

      <p
        style={{
          margin: "20px 0 0",
          color: "#7c6fa0",
          fontSize: 12,
          lineHeight: 1.5,
          textAlign: "center",
        }}
      >
        Only @login.cuny.edu and @cuny.edu student addresses are accepted.
      </p>
    </AuthLayout>
  );
}

export function VerifyPage({ email, onNavigate, onLogin }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();

    if (!code.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    setError("");
    onLogin();
    onNavigate("home");
  }

  return (
    <AuthLayout>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 17 }}>📬</span>
        <span style={{ color: "#a78bfa", fontSize: 12, fontWeight: 700 }}>
          Verified CUNY students only
        </span>
      </div>

      <h1
        style={{
          margin: "0 0 10px",
          color: "#ffffff",
          fontSize: 32,
          lineHeight: 1.1,
        }}
      >
        Check your inbox.
      </h1>

      <p
        style={{
          margin: "0 0 4px",
          color: "#c4b5fd",
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        We sent a 6-digit code to:
      </p>

      <p
        style={{
          margin: "0 0 24px",
          color: "#e2d9f3",
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {email || "your CUNY email"}
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <label>
          <span style={labelStyle}>Verification code</span>
          <input
            maxLength={6}
            autoFocus
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, ""))
            }
            placeholder="000000"
            style={{
              ...inputStyle,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.3em",
              textAlign: "center",
            }}
          />
        </label>

        <ErrorMessage error={error} />

        <PrimaryButton type="submit">Verify & Create Account</PrimaryButton>
      </form>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 20,
        }}
      >
        <button
          type="button"
          onClick={() => onNavigate("signup")}
          style={{
            border: 0,
            background: "transparent",
            color: "#7c6fa0",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 12,
            textDecoration: "underline",
          }}
        >
          Change email
        </button>

        <button
          type="button"
          onClick={() => {
            setResent(true);
            setTimeout(() => setResent(false), 3000);
          }}
          style={{
            border: 0,
            background: "transparent",
            color: resent ? "#4ade80" : "#a78bfa",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 12,
            textDecoration: "underline",
          }}
        >
          {resent ? "Code resent!" : "Resend code"}
        </button>
      </div>

      <p
        style={{
          margin: "18px 0 0",
          color: "#7c6fa0",
          fontSize: 12,
          textAlign: "center",
        }}
      >
        For demo purposes, any code will work.
      </p>
    </AuthLayout>
  );
}