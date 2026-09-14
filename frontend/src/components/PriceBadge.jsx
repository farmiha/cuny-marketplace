export function PriceBadge({ price, theme }) {
  return (
    <span
      className="text-xs font-bold px-2.5 py-1 rounded-full"
      style={{
        background: theme.primary,
        color: "#ffffff",
      }}
    >
      ${price}
    </span>
  );
}