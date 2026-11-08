import { Link } from "react-router-dom";
import { useCampusTheme } from "../hooks/useCampusTheme";
import { GUIDE_PAGES } from "./guideData";
import "../styles/guide.css";

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

const STEPS = [
  { title: "Log in", text: "Use your CUNY email. Only CUNY students can join." },
  { title: "Pick your campus", text: "Use the campus picker at the top." },
  { title: "Browse or post", text: "Find an item or sell your own. Listing is free." },
  { title: "Message and meet", text: "Chat with the seller, then meet on campus." },
];

// One screenshot with its arrows and labels.
function Shot({ shot, alt, index }) {
  const { w, h, img, pins, caption } = shot;
  const markerId = `guide-arrow-${index}`;

  return (
    <figure className="guide-shot">
      {caption && <figcaption>{caption}</figcaption>}
      <div className="guide-scroll">
        <div className="guide-frame" style={{ aspectRatio: `${w} / ${h}` }}>
          <img src={img} alt={alt} width="1000" loading="lazy" />
          <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <marker
                id={markerId}
                markerUnits="userSpaceOnUse"
                markerWidth="30"
                markerHeight="30"
                refX="24"
                refY="15"
                orient="auto"
              >
                <path d="M2 3 L26 15 L2 27 Z" fill="#1f3a73" />
              </marker>
            </defs>
            {pins.map((p, i) => {
              // stop the arrow a little short of the target
              const dx = p.tx - p.lx;
              const dy = p.ty - p.ly;
              const d = Math.hypot(dx, dy) || 1;
              const off = Math.min(36, d * 0.45);
              return (
                <line
                  key={i}
                  x1={p.lx}
                  y1={p.ly}
                  x2={p.tx - (dx / d) * off}
                  y2={p.ty - (dy / d) * off}
                  markerEnd={`url(#${markerId})`}
                />
              );
            })}
          </svg>
          {pins.map((p, i) => (
            <span
              key={i}
              className="guide-tag"
              style={{ left: `(p.lx/w)*100%`,top:`{(p.ly / h) * 100}%` }}
            >
              {p.text}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}

export default function Guide() {
  const { mode } = useCampusTheme();
  let shotCount = 0;

  return (
    <div className={`guide${mode === "dark" ? " guide-dark" : ""}`}>
      <div className="guide-wrap">
        <header className="guide-hero">
          <div>
            <p className="guide-eyebrow">A student guide</p>
            <h1>
              How <em>CUNY</em> MarketPlace works
            </h1>
            <p className="guide-sub">
              A quick look at every page. The arrows show what things do.
            </p>
            <nav className="guide-jump" aria-label="Jump to a page">
              {GUIDE_PAGES.map((p) => (
                <a key={p.id} href={`#guide-${p.id}`}>
                  {p.name}
                </a>
              ))}
            </nav>
          </div>
          <div className="guide-art">
            <img src="/guide/home.jpg" alt="The CUNY MarketPlace home page" />
          </div>
        </header>

        <ol className="guide-steps">
          {STEPS.map((s) => (
            <li key={s.title}>
              <b>{s.title}</b>
              <span>{s.text}</span>
            </li>
          ))}
        </ol>

        {GUIDE_PAGES.map((page, n) => (
          <section className="guide-page" id={`guide-${page.id}`} key={page.id}>
            <div className="guide-text">
              <p className="guide-eyebrow">Page {ROMAN[n]}</p>
              <h2>{page.name}</h2>
              <p className="guide-lead">{page.lead}</p>
              <ul className="guide-tips">
                {page.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="guide-shots">
              {page.shots.map((shot) => (
                <Shot key={shot.img} shot={shot} alt={`${page.name} page`} index={shotCount++} />
              ))}
            </div>
          </section>
        ))}

        <p className="guide-end">
          Ready to try it? <Link to="/browse">Browse listings</Link>
        </p>
      </div>
    </div>
  );
}

