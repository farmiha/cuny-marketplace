import { useCampusTheme } from "../hooks/useCampusTheme";

export default function Footer() {
  const { theme } = useCampusTheme();

  return (
    <footer>
      <div className="wrap" style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <span className="foot-brand">
          <span className="sw" />
          Built by CUNY students, for CUNY students
        </span>
        <span>Currently browsing: {theme.full}</span>
      </div>
    </footer>
  );
}
