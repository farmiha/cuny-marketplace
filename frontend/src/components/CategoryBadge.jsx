export function CategoryBadge({ label, theme }) {
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{
        background: theme.badgeBg,
        color: theme.badgeText,
        opacity: 0.92,
      }}
    >
      {label}
    </span>
  );
}