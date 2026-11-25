import { Link } from "react-router-dom";

// quick start, in order
const STEPS = [
  {
    title: "Log in",
    text: "Use your CUNY email. Only CUNY students can join.",
  },
  {
    title: "Pick your campus",
    text: "Use the campus picker at the top. The whole site changes to your campus colors.",
  },
  {
    title: "Browse or post",
    text: "Find an item or sell your own. Listing is free.",
  },
  {
    title: "Message and meet",
    text: "Chat with the seller, then meet in a public spot on campus.",
  },
];

// one card per page. Keep this list up to date when a page changes.
const PAGES = [
  {
    name: "Home",
    to: "/",
    lead: "Your starting point. See what is new and get anywhere in one tap.",
    tips: [
      "Pick your campus from the dropdown at the top. The navbar and colors follow it.",
      "Tap a category chip to filter the latest listings.",
      "Switch between light and dark mode with the sun and moon button.",
    ],
  },
  {
    name: "Browse",
    to: "/browse",
    lead: "Every listing in one place. Search, filter and message the seller.",
    tips: [
      "Search, pick a category, or filter by price and condition.",
      "Sort by Recommended, newest or price. Recommended learns from what you view, save and add to your cart.",
      "Press Follow on a seller to see their new listings, then press Message seller to chat.",
      "Press Post a listing to sell. You can post up to 10 listings a day.",
    ],
  },
  {
    name: "Listing",
    to: "/browse",
    lead: "Open any listing to see the details and decide.",
    tips: [
      "Message the seller, add it to your cart, or save it with the heart.",
      "Check the seller's rating and open their profile.",
      "Report a listing that looks wrong. Reports are private.",
    ],
  },
  {
    name: "Wanted",
    to: "/wanted",
    lead: "Can't find it in Browse? Ask for it.",
    tips: [
      "Press Post a request, say what you need and your budget. You can post up to 5 a day.",
      "Sellers answer with one of their listings. Pick the one you like.",
      "Mark the request as found when you are done. Find yours under My requests.",
    ],
  },
  {
    name: "Messages",
    to: "/messages",
    lead: "Talk to buyers and sellers, then agree on a time and place.",
    tips: [
      "Pick a chat on the left. Chats are grouped by listing.",
      "New messages show up right away and a number appears on Messages in the navbar.",
      "Press Make an offer to suggest a price. The other person can accept, counter or decline. If they accept, press Buy to pay that price.",
      "Press Propose meetup to pick a time and a safe spot on campus. The other person confirms it, and you both get a reminder 1 hour before.",
    ],
  },
  {
    name: "Notifications",
    to: "/notifications",
    isNew: true,
    lead: "The bell in the navbar tells you what is new.",
    tips: [
      "New followers, views, saves, sales, ratings, report decisions and meetup reminders show up here.",
      "Press View all this month to see every notification from this month. Each month starts fresh.",
    ],
  },
  {
    name: "Cart and checkout",
    to: "/cart",
    lead: "Buy from one or more sellers in one go.",
    tips: [
      "Add listings to your cart. They are grouped by seller.",
      "Add a promo code if you have one, then check out.",
      "Your order confirmation lists where to meet each seller.",
    ],
  },
  {
    name: "Profile",
    to: "/profile",
    lead: "Your details, orders, listings and settings.",
    tips: [
      "See your orders, your listings, your followers and who you follow.",
      "Choose your home campus. Each campus has its own color.",
      "Turn on Shop other CUNY campuses to see listings from every campus.",
      "Add a backup email so you keep your account after you graduate.",
      "Manage blocked users and rate the sellers you bought from.",
    ],
  },
  {
    name: "Dashboard",
    to: "/analytics",
    lead: "See how busy the marketplace is.",
    tips: [
      "Read the totals at the top. They count up when the page opens.",
      "Use the map to see where listings are.",
      "Pick a campus to filter the charts.",
    ],
  },
];

const SAFETY = [
  "Meet in a public place on campus, like the library or student center.",
  "Check the item before you pay.",
  "Report or block anyone from their listing or profile. Blocked users can't message you.",
  "Accounts get suspended after 5 upheld reports.",
];

const FAQ = [
  {
    q: "Do I need a CUNY email?",
    a: "Yes. Only students with a CUNY stu-mail address can create an account, so everyone you meet is a classmate.",
  },
  { q: "Does it cost anything?", a: "No. Listing and browsing are free." },
  {
    q: "Can I see other campuses?",
    a: "Yes. Open your Profile and turn on Shop other CUNY campuses.",
  },
  {
    q: "What happens after I graduate?",
    a: "Add a backup email in your Profile before you graduate so you can still log in and keep your listings and messages.",
  },
  {
    q: "How do I sell something?",
    a: "Press Post a listing on the Browse page, add a photo, a price and where you can meet.",
  },
];

export default function Guide() {
  return (
    <div className="mp-root" id="page-guide">
      <div className="mp-page" style={{ paddingBottom: 24 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "var(--mp-accent)",
          }}
        >
          A student guide
        </p>
        <h1
          style={{
            fontSize: "clamp(24px, 5.2vw, 56px)",
            lineHeight: 1.1,
            marginTop: 8,
            whiteSpace: "nowrap",
          }}
        >
          How <span style={{ color: "var(--mp-accent)" }}>CUNY</span>{" "}
          MarketPlace works
        </h1>
        <p style={{ color: "var(--mp-mute)", marginTop: 10, fontSize: 17 }}>
          A quick look at every page and what it does.
        </p>

        {/* the four steps */}
        <div className="mp-grid4" style={{ marginTop: 32 }}>
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="mp-card"
              style={{
                padding: 22,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <span
                className="mp-bullet"
                style={{
                  background: "var(--mp-accent)",
                  color: "var(--mp-cink)",
                }}
              >
                {i + 1}
              </span>
              <b style={{ fontSize: 17 }}>{s.title}</b>
              <span style={{ color: "var(--mp-mute)", fontSize: 14 }}>
                {s.text}
              </span>
            </div>
          ))}
        </div>

        {/* one card per page */}
        <div className="mp-grid3" style={{ marginTop: 28 }}>
          {PAGES.map((page, idx) => (
            <div
              key={page.name}
              className="mp-card"
              style={{
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "var(--mp-mute)",
                }}
              >
                Page {idx + 1}
                {page.isNew && (
                  <span
                    style={{
                      marginLeft: 8,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "var(--mp-accent)",
                      color: "var(--mp-cink)",
                      letterSpacing: 0,
                    }}
                  >
                    New
                  </span>
                )}
              </span>
              <h2 style={{ fontSize: 24 }}>{page.name}</h2>
              <p style={{ color: "var(--mp-mute)" }}>{page.lead}</p>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontSize: 14,
                }}
              >
                {page.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <Link
                to={page.to}
                style={{
                  marginTop: "auto",
                  paddingTop: 6,
                  fontWeight: 700,
                  color: "var(--mp-accent)",
                }}
              >
                Open page →
              </Link>
            </div>
          ))}
        </div>

        {/* safety */}
        <div
          className="mp-card"
          style={{ marginTop: 28, padding: 26, display: "grid", gap: 10 }}
        >
          <h2 style={{ fontSize: 24 }}>Stay safe</h2>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
            {SAFETY.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>

        {/* common questions */}
        <h2 style={{ fontSize: 28, marginTop: 40, marginBottom: 14 }}>
          Common questions
        </h2>
        <div style={{ display: "grid", gap: 10, maxWidth: 760 }}>
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="mp-card"
              style={{ padding: "16px 20px", borderRadius: 20 }}
            >
              <summary style={{ fontWeight: 700, cursor: "pointer" }}>
                {f.q}
              </summary>
              <p style={{ color: "var(--mp-mute)", marginTop: 10 }}>{f.a}</p>
            </details>
          ))}
        </div>

        <p style={{ marginTop: 32, color: "var(--mp-mute)" }}>
          Ready to try it?{" "}
          <Link
            to="/browse"
            style={{ color: "var(--mp-accent)", fontWeight: 700 }}
          >
            Browse listings
          </Link>
        </p>
      </div>
    </div>
  );
}
