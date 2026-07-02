/** Indian-locale currency + number formatters used across WealthX. */

const inr0 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const inr2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const num = new Intl.NumberFormat("en-IN");

export const formatINR = (v: number, decimals: 0 | 2 = 0) =>
  (decimals === 2 ? inr2 : inr0).format(isFinite(v) ? v : 0);

export const formatCompactINR = (v: number) => {
  if (!isFinite(v)) return "₹0";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000)    return `${sign}₹${(abs / 1_00_000).toFixed(2)} L`;
  if (abs >= 1_000)       return `${sign}₹${(abs / 1_000).toFixed(1)} K`;
  return `${sign}₹${abs.toFixed(0)}`;
};

export const formatNumber = (v: number) => num.format(v);
export const formatPct = (v: number, decimals = 2) =>
  `${v >= 0 ? "+" : ""}${v.toFixed(decimals)}%`;

/** ₹ symbol as literal — for places that need it without any spacing. */
export const RUPEE = "₹";
