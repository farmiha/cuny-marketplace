import { useState } from "react";

// Same Formspree form as the portfolio contact section.
// The hidden "source" field tells the messages apart in the inbox.
const FORMSPREE_URL = "https://formspree.io/f/mjywlpdw";

const STEPS = [
  {
    n: "01",
    title: "What this is",
    text: "CUNY MarketPlace is a student-to-student marketplace for textbooks, dorm gear, tickets, tutoring, and anything else students want to buy or sell within their own campus community — verified with a CUNY email, so it's always classmates, never strangers.",
  },
  {
    n: "02",
    title: "How it works",
    text: "Sign up with your CUNY login or campus stu-mail address, pick your home campus, and you're set — browse what's listed near you, or post something in a couple of minutes. Turn on \"Shop other CUNY campuses\" from your profile any time you want to see listings from across the whole university.",
  },
  {
    n: "03",
    title: "Why we made it",
    text: "Every semester, CUNY students overpay for textbooks and dorm essentials, then toss them because reselling is hard. Apps like Facebook Marketplace can't confirm who is a student. We built a safer, cheaper way to trade with verified classmates, with meetups on campus and usable items getting a second life.",
  },
];

const fieldStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1.5px solid var(--mp-line)",
  background: "var(--mp-card)",
  color: "var(--mp-ink)",
  font: "inherit",
  fontSize: 15,
};

const labelStyle = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 700,
  color: "var(--mp-ink)",
};

export default function About() {
  const [sending, setSending] = useState(false);
  const [popup, setPopup] = useState(null); // null | "ok" | "error"

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setSending(true);
    try {
      const res = await fetch(FORMSPREE_URL, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        form.reset();
        setPopup("ok");
      } else {
        setPopup("error");
      }
    } catch {
      setPopup("error");
    }
    setSending(false);
  };

  return (
    <div className="mp-root" id="page-about">
      <div className="mp-page">
        <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 1.1 }}>
          About <span style={{ color: "var(--mp-accent)" }}>CUNY</span>{" "}
          MarketPlace
        </h1>
        <p style={{ color: "var(--mp-mute)", fontSize: 18, marginTop: 8 }}>
          Built by students, for students, across every CUNY campus.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 48,
            marginTop: 40,
            alignItems: "flex-start",
            // let this row stretch past the page column, out toward the right edge of the screen
            marginRight: "min(0px, calc(50% - 50vw + 80px))",
          }}
        >
          {/* the story, straight on the page */}
          <div
            style={{ display: "grid", gap: 36, minWidth: 0, flex: "1 1 280px" }}
          >
            {STEPS.map((s) => (
              <div key={s.n} style={{ display: "flex", gap: 20 }}>
                <span
                  style={{
                    fontFamily: '"Fraunces", Georgia, serif',
                    fontSize: 44,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: "var(--mp-accent)",
                    flex: "none",
                    width: 68,
                  }}
                >
                  {s.n}
                </span>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: 26, margin: "0 0 8px" }}>{s.title}</h2>
                  <p
                    style={{
                      color: "var(--mp-mute)",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {s.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* contact form */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gap: 14,
              padding: 28,
              borderRadius: 28,
              background:
                "color-mix(in srgb, var(--mp-accent) 9%, transparent)",
              minWidth: 0,
              flex: "2.2 1 480px",
            }}
          >
            <div>
              <h2 style={{ fontSize: 26, margin: 0 }}>Get in touch</h2>
              <p
                style={{
                  color: "var(--mp-mute)",
                  margin: "6px 0 0",
                  lineHeight: 1.5,
                }}
              >
                Questions, feedback, or something not working? Send us a
                message.
              </p>
            </div>

            <input type="hidden" name="source" value="CUNY MarketPlace" />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 14,
              }}
            >
              <label style={labelStyle}>
                Name
                <input
                  name="name"
                  placeholder="Your name"
                  required
                  style={fieldStyle}
                />
              </label>
              <label style={labelStyle}>
                Email
                <input
                  name="email"
                  type="email"
                  placeholder="Your email"
                  required
                  style={fieldStyle}
                />
              </label>
            </div>
            <label style={labelStyle}>
              Subject
              <input
                name="subject"
                placeholder="Subject of your message"
                required
                style={fieldStyle}
              />
            </label>
            <label style={labelStyle}>
              Message
              <textarea
                name="message"
                placeholder="Your message"
                required
                rows={5}
                style={{ ...fieldStyle, resize: "vertical", minHeight: 120 }}
              />
            </label>

            <button
              type="submit"
              className="mp-btn"
              disabled={sending}
              style={{ justifySelf: "start" }}
            >
              {sending ? "Sending…" : "Send message"}
            </button>
          </form>
        </div>
      </div>

      {popup && (
        <div className="cm-modal-overlay" onClick={() => setPopup(null)}>
          <div
            className="cm-modal cm-modal-small"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{popup === "ok" ? "Message sent!" : "Something went wrong"}</h3>
            <p className="cm-modal-sub">
              {popup === "ok"
                ? "Thank you for reaching out. We'll get back to you soon."
                : "Please try again in a moment."}
            </p>
            <div className="cm-modal-actions">
              <button
                type="button"
                className="cm-modal-btn cm-modal-btn-primary"
                onClick={() => setPopup(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
