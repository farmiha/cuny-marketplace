import { CAMPUS_ORDER, CAMPUS_THEMES } from "../data/campusThemes";
import { useCampusTheme } from "../hooks/useCampusTheme";

export default function CampusSwitcher() {
  const { campus, setCampus } = useCampusTheme();

  return (
    <div className="campus-select">
      <select
        aria-label="Choose campus"
        value={campus}
        onChange={(e) => setCampus(e.target.value)}
      >
        {CAMPUS_ORDER.map((key) => (
          <option key={key} value={key}>
            {CAMPUS_THEMES[key].full}
          </option>
        ))}
      </select>
    </div>
  );
}
