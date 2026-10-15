// 8500 -> "$85.00"
export const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;
