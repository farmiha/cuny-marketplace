export default function Logo() {
  return (
    <div className="brand">
      <span className="brand-row">
        <span className="mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 2.5H7a2 2 0 0 0-1.4.6L2.6 6a2 2 0 0 0 0 2.9l9 9a2 2 0 0 0 2.9 0l6.5-6.5a2 2 0 0 0 0-2.9l-4.6-4.6a2 2 0 0 0-1.4-.6z" />
            <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <span>
          CUNY <span className="brand-accent">MarketPlace</span>
        </span>
      </span>
      <span className="brand-underline" />
    </div>
  );
}
