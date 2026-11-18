import { useEffect, useState } from "react";

import { getAnalytics } from "../lib/analyticsBackend";
import { supabase } from "../lib/supabaseClient";
import CountUp from "../components/CountUp";
import { useCampusTheme } from "../hooks/useCampusTheme";

import {
  CAMPUS_THEMES,
  CAMPUS_ORDER,
  getCampusKey,
} from "../data/campusThemes";

import ListingDensityMap from "../data/ListingDensityMap";
import "./AnalyticsDashboard.css";

const REFRESH_MS = 20000;

function getThemeKey(campusName) {
  return getCampusKey(campusName);
}

function formatNumber(value) {
  if (value === null || value === undefined) return "—";

  const number = Number(value);

  return Number.isFinite(number) ? number.toLocaleString() : "—";
}

function StatCard({ label, value, note, accent = false }) {
  return (
    <article className={`analytics-stat${accent ? " is-accent" : ""}`}>
      <p className="analytics-stat-label">{label}</p>
      <p className="analytics-stat-value">
        {value !== null &&
        value !== undefined &&
        Number.isFinite(Number(value)) ? (
          <CountUp value={value} />
        ) : (
          "—"
        )}
      </p>
      <p className="analytics-stat-note">{note}</p>
    </article>
  );
}

function ChartCard({ title, subtitle, empty, children }) {
  return (
    <section className="analytics-card analytics-chart-card">
      <h2 className="analytics-chart-title">{title}</h2>
      <p className="analytics-chart-sub">{subtitle}</p>
      {empty ? (
        <div className="analytics-empty">
          No data available for this selection.
        </div>
      ) : (
        children
      )}
    </section>
  );
}

// ---------- line chart: this week (solid) vs last week (dashed) ----------
function TrendChart({ data }) {
  const W = 320,
    H = 200,
    L = 40,
    R = 300,
    T = 20,
    B = 180;
  const max = Math.max(4, ...data.flatMap((d) => [d.thisWeek, d.lastWeek]));
  const x = (i) => L + (i * (R - L)) / Math.max(1, data.length - 1);
  const y = (v) => B - (v / max) * (B - T);
  const pts = (key) => data.map((d, i) => `${x(i)},${y(d[key])}`).join(" ");
  const grid = [0, 1, 2, 3, 4].map((n) => T + (n * (B - T)) / 4);
  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="New listings this week versus last week"
      >
        {grid.map((gy) => (
          <line key={gy} x1={L} x2={R} y1={gy} y2={gy} stroke="var(--line)" />
        ))}
        <polyline
          fill="none"
          stroke="var(--muted)"
          strokeWidth="2"
          strokeDasharray="4 4"
          points={pts("lastWeek")}
        />
        <polyline
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
          strokeLinejoin="round"
          points={pts("thisWeek")}
        />
        <g fontSize="10" fill="var(--muted)" textAnchor="middle">
          {data.map((d, i) =>
            i % 2 === 0 ? (
              <text key={d.day + i} x={x(i)} y="196">
                {d.day}
              </text>
            ) : null,
          )}
        </g>
      </svg>
      <div className="analytics-trend-legend">
        <span>&#9472; This week</span>
        <span>- - Last week</span>
      </div>
    </>
  );
}

// ---------- horizontal bar rows ----------
function BarRows({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="analytics-bars">
      {rows.map((r) => (
        <div
          key={r.name}
          className="analytics-bar-row"
          title={`${r.name}: ${r.value}`}
        >
          <span className="analytics-bar-name">{r.label}</span>
          <div className="analytics-bar-track">
            <div
              className="analytics-bar-fill"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
          <span className="analytics-bar-value">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------- donut + chip legend ----------
function CategoryDonut({ data, colors }) {
  const total = data.reduce((sum, d) => sum + d.listings, 0) || 1;
  const r = 48;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <>
      <svg
        viewBox="0 0 160 160"
        width="170"
        height="170"
        className="analytics-donut"
        role="img"
        aria-label="Listings by category"
      >
        {data.map((d, i) => {
          const len = (d.listings / total) * c;
          const el = (
            <circle
              key={d.category}
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="22"
              strokeDasharray={`${Math.max(0, len - 2)} ${c - Math.max(0, len - 2)}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 80 80)"
            >
              <title>{`${d.category}: ${d.listings}`}</title>
            </circle>
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="analytics-chips">
        {data.map((d, i) => (
          <span key={d.category} className="analytics-chip">
            <i style={{ background: colors[i % colors.length] }} />
            {d.category} {d.listings}
          </span>
        ))}
      </div>
    </>
  );
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [studentsPerCampus, setStudentsPerCampus] = useState([]);
  const [listingsPerCampus, setListingsPerCampus] = useState([]);
  const [last14Days, setLast14Days] = useState([]);
  const [byCategory, setByCategory] = useState([]);

  // the campus chosen in the navbar is the campus shown here (they stay in sync)
  const { campus: campusKey, setCampus: setCampusKey } = useCampusTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadedAt, setLoadedAt] = useState(null);

  const theme = CAMPUS_THEMES[campusKey];

  const seriesColors = [
    theme.primary,
    "#C48A3A",
    "#7C6BB8",
    "#C86B85",
    "#6F8FA0",
    "#A9A3D6",
    "#8A8575",
  ];

  useEffect(() => {
    let active = true;
    let debounce = null;

    async function loadData() {
      try {
        const data = await getAnalytics();

        if (!active) return;

        setStats(data.summary);
        setStudentsPerCampus(data.studentsPerCampus);
        setListingsPerCampus(data.listingsPerCampus);
        setLast14Days(data.last14Days);
        setByCategory(data.byCategory);
        setLoadedAt(new Date());
        setError(null);
      } catch (err) {
        if (!active) return;

        console.error(err);

        setError(
          err instanceof Error ? err.message : err?.message || "Unknown error",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    function scheduleRefresh() {
      clearTimeout(debounce);
      debounce = setTimeout(loadData, 400);
    }

    loadData();

    const channel = supabase
      .channel(`analytics-dashboard-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Listing" },
        scheduleRefresh,
      )
      .subscribe((status) => console.log("realtime:", status));

    const timer = setInterval(loadData, REFRESH_MS);

    return () => {
      active = false;
      clearTimeout(debounce);
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  const visibleStudents =
    campusKey === "all"
      ? studentsPerCampus
      : studentsPerCampus.filter(
          (entry) => getThemeKey(entry.campus) === campusKey,
        );

  const visibleListings =
    campusKey === "all"
      ? listingsPerCampus
      : listingsPerCampus.filter(
          (entry) => getThemeKey(entry.campus) === campusKey,
        );

  const campusSubtitle = campusKey === "all" ? "All campuses" : theme.full;

  return (
    <div
      className="analytics-app"
      style={{
        "--primary": theme.primary,
        "--primary-ink": theme.primaryInk,
        "--accent": theme.accent,
        "--accent-ink": theme.accentInk,
        "--primary-soft": `${theme.primary}12`,
      }}
    >
      <main className="analytics-workspace">
        <header className="analytics-page-heading">
          <p className="analytics-eyebrow">
            {campusKey === "all" ? "All CUNY" : theme.full} MarketPlace
          </p>

          <h1>Campus & Listings Analytics</h1>

          <p className="analytics-description">
            Explore your campus community through marketplace data.
          </p>
        </header>

        {loading ? (
          <div className="analytics-card analytics-message" role="status">
            Loading analytics…
          </div>
        ) : error && !stats ? (
          <div className="analytics-card analytics-message" role="alert">
            <h2>Couldn’t load analytics</h2>
            <p>{error}</p>

            <button
              type="button"
              className="analytics-button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="analytics-dashboard">
            <div className="analytics-content">
              <section
                className="analytics-stats"
                aria-label="Marketplace-wide summary metrics"
              >
                <StatCard
                  label="Total listings"
                  value={stats.totalListings}
                  note="Marketplace-wide"
                />

                <StatCard
                  label="Registered students"
                  value={stats.registeredStudents}
                  note="Marketplace-wide"
                />

                <StatCard
                  label="New this week"
                  value={stats.newThisWeek}
                  note="Marketplace-wide"
                  accent
                />
              </section>

              <ListingDensityMap campusKey={campusKey} />

              <div className="analytics-chart-grid">
                <ChartCard
                  title="New listing trends"
                  subtitle="This week compared with last week · all campuses"
                  empty={!last14Days.length}
                >
                  <TrendChart data={last14Days} />
                </ChartCard>

                <ChartCard
                  title="Listings per campus"
                  subtitle={campusSubtitle}
                  empty={!visibleListings.length}
                >
                  <BarRows
                    rows={visibleListings.map((e) => ({
                      name: e.campus,
                      label:
                        CAMPUS_THEMES[getThemeKey(e.campus)]?.name || e.campus,
                      value: Number(e.listings) || 0,
                    }))}
                  />
                </ChartCard>

                <ChartCard
                  title="Registered students per campus"
                  subtitle={campusSubtitle}
                  empty={!visibleStudents.length}
                >
                  <BarRows
                    rows={visibleStudents.map((e) => ({
                      name: e.campus,
                      label:
                        CAMPUS_THEMES[getThemeKey(e.campus)]?.name || e.campus,
                      value: Number(e.students) || 0,
                    }))}
                  />
                </ChartCard>

                <ChartCard
                  title="Listings by category"
                  subtitle="Category distribution · all campuses"
                  empty={!byCategory.length}
                >
                  <CategoryDonut data={byCategory} colors={seriesColors} />
                </ChartCard>
              </div>
            </div>

            <aside className="analytics-card analytics-sidebar">
              <section>
                <h2>Filter campus charts</h2>

                <label
                  className="analytics-filter-label"
                  htmlFor="campus-filter"
                >
                  Campus
                </label>

                <select
                  id="campus-filter"
                  className="analytics-select"
                  value={campusKey}
                  onChange={(event) => {
                    setCampusKey(event.target.value);
                  }}
                >
                  {CAMPUS_ORDER.map((key) => (
                    <option key={key} value={key}>
                      {CAMPUS_THEMES[key].full}
                    </option>
                  ))}
                </select>

                <p className="analytics-sidebar-note">
                  Selecting a campus filters the map and the two campus charts.
                  Summary totals, weekly trends, and categories remain
                  marketplace-wide.
                </p>

                <button
                  type="button"
                  className="analytics-button"
                  onClick={() => setCampusKey("all")}
                  disabled={campusKey === "all"}
                >
                  Reset campus filter
                </button>
              </section>

              <section className="analytics-sidebar-section">
                <h2>Data coverage</h2>

                <ul className="analytics-coverage">
                  {[
                    "Registered students",
                    "Listings by campus",
                    "Weekly listing trends",
                    "Category distribution",
                    "Campus listing map",
                  ].map((label) => (
                    <li key={label}>
                      <span className="analytics-dot" />
                      {label}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="analytics-sidebar-section">
                <h2>Snapshot</h2>

                <p className="analytics-sidebar-note">
                  Last updated at{" "}
                  {loadedAt?.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                  . Charts refresh automatically when listings are posted or
                  deleted, and re-check every 20 seconds.
                </p>
              </section>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
