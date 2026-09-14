import { useState } from "react";

import { CAMPUS_NAMES, CAMPUS_THEMES } from "./data/campusThemes";
import Home from "./pages/Home.jsx";
import Browse from "./pages/Browse.jsx";
import Post from "./pages/Post.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import {
  LoginPage,
  SignupPage,
  VerifyPage,
} from "./pages/AuthPages.jsx";

export default function App() {
  const [page, setPage] = useState("home");
  const [campus, setCampus] = useState("All CUNY");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  const theme = CAMPUS_THEMES[campus] ?? CAMPUS_THEMES["All CUNY"];

  function handleLogin() {
    setIsLoggedIn(true);
  }

  function handleLogout() {
    setIsLoggedIn(false);
    setPage("home");
  }

  function renderPage() {
    const commonProps = {
      onNavigate: setPage,
      theme,
      campus,
      isLoggedIn,
    };

    switch (page) {
      case "browse":
        return <Browse {...commonProps} />;

      case "post":
        return <Post {...commonProps} />;

      case "dashboard":
        return <Dashboard {...commonProps} />;

      case "login":
        return <LoginPage onNavigate={setPage} onLogin={handleLogin} />;

      case "signup":
        return (
          <SignupPage
            onNavigate={setPage}
            onStartVerification={setVerificationEmail}
          />
        );

      case "verify":
        return (
          <VerifyPage
            email={verificationEmail}
            onNavigate={setPage}
            onLogin={handleLogin}
          />
        );

      case "home":
      default:
        return <Home {...commonProps} />;
    }
  }

  const navLinks = isLoggedIn
    ? [
        ["home", "Home"],
        ["browse", "Browse"],
        ["dashboard", "Dashboard"],
      ]
    : [
        ["home", "Home"],
        ["browse", "Browse"],
      ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f4f9",
        color: "#0d2d6b",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      {!["login", "signup", "verify"].includes(page) && (
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: theme.nav,
            boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
          }}
        >
          <div
            style={{
              maxWidth: 1152,
              margin: "0 auto",
              padding: "12px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => setPage("home")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: 0,
                background: "transparent",
                color: "#ffffff",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  padding: "2px 8px",
                  border: "1px solid rgba(255,255,255,0.35)",
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.22)",
                  fontSize: 14,
                  letterSpacing: 0.4,
                }}
              >
                CUNY
              </span>
              <span>Market</span>
            </button>

            <nav
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              {navLinks.map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setPage(key)}
                  style={{
                    border: 0,
                    borderBottom:
                      page === key
                        ? "2px solid #ffffff"
                        : "2px solid transparent",
                    background: "transparent",
                    color:
                      page === key
                        ? "#ffffff"
                        : "rgba(255,255,255,0.72)",
                    cursor: "pointer",
                    padding: "8px 4px",
                    fontFamily: "inherit",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <select
                aria-label="Choose CUNY campus theme"
                value={campus}
                onChange={(event) => setCampus(event.target.value)}
                style={{
                  maxWidth: 160,
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.18)",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "7px 10px",
                }}
              >
                {CAMPUS_NAMES.map((name) => (
                  <option
                    key={name}
                    value={name}
                    style={{ background: "#ffffff", color: "#0d2d6b" }}
                  >
                    {name}
                  </option>
                ))}
              </select>

              {isLoggedIn ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPage("post")}
                    style={{
                      border: "1px solid rgba(255,255,255,0.4)",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.16)",
                      color: "#ffffff",
                      cursor: "pointer",
                      padding: "7px 13px",
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Sell
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      border: "1px solid rgba(255,255,255,0.3)",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.16)",
                      color: "#ffffff",
                      cursor: "pointer",
                      padding: "7px 13px",
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setPage("login")}
                  style={{
                    border: 0,
                    borderRadius: 999,
                    background: "#ffffff",
                    color: theme.primary,
                    cursor: "pointer",
                    padding: "7px 14px",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Log In
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      <main>{renderPage()}</main>

      {!["login", "signup", "verify"].includes(page) && (
        <footer
          style={{
            marginTop: 64,
            background: theme.nav,
            color: "rgba(255,255,255,0.72)",
            padding: "28px 24px",
          }}
        >
          <div style={{ maxWidth: 1152, margin: "0 auto", fontSize: 13 }}>
            <strong style={{ color: "#ffffff" }}>CUNY Market</strong>
            <p style={{ margin: "8px 0 0" }}>
              A student-to-student marketplace for all CUNY colleges. Buy, sell,
              and trade safely.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}