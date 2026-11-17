/** Number and money formatting. One place, so the same figure never appears
 *  two ways on two pages. */

/** U+2212, the real minus sign. A hyphen is narrower than a digit and breaks
 *  tabular alignment in a column of signed numbers. */
export const MINUS = "−";

export type Direction = "up" | "down" | "flat";

/** A move too small to print as a signed figure is not a direction.
 *
 *  Without the band, a −0.04% day rounded to "−0.0%" and was coloured red: a
 *  loss the number itself denies. */
export const direction = (n: number, epsilon = 0.05): Direction =>
  n > epsilon ? "up" : n < -epsilon ? "down" : "flat";

const sign = (n: number) => (n > 0 ? "+" : n < 0 ? MINUS : "");

/** $420,740 */
export const usd0 = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

/** $184.26 */
export const usd2 = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** +1.8% / −2.1% / 0.0%
 *
 *  A value that rounds to zero prints unsigned: "+0.0%" and "−0.0%" both claim
 *  a direction the digits do not support. */
export function pct(n: number, dp = 1): string {
  const magnitude = Math.abs(n).toFixed(dp);
  return (Number(magnitude) === 0 ? "" : sign(n)) + magnitude + "%";
}

/** A change, in whatever unit reads: "+36.4%", or "218×" once a percentage
 *  stops being legible. A ten-year chart's endpoint was "+21709.8%" in 62px of
 *  axis padding. */
export function change(n: number, dp = 1): string {
  if (Math.abs(n) >= 500) return (n / 100 + 1).toFixed(n >= 5000 ? 0 : 1) + "×";
  return pct(n, dp);
}

/** 100 -> "100"; 20000 -> "20k". Axis ticks, where width is the constraint. */
export const axisNumber = (n: number) =>
  Math.abs(n) >= 10000 ? Math.round(n / 1000) + "k" : String(Number(n.toFixed(2)));

/** +$4,040 / −$705 */
export const dollars = (n: number) =>
  sign(n) + "$" + Math.abs(Math.round(n)).toLocaleString("en-US");

/** 4480 -> "$4.48T"; 412.35 -> "$412B"; 12.44 -> "$12.4B"; null -> "—"
 *
 *  Rounding matters now that this is computed from a live price times a share
 *  count rather than typed in: the product is never a round number. */
export function marketCap(billions: number | null): string {
  if (billions === null) return "—";
  // 999.6 is a trillion once rounded, and printing "$1,000B" beside "$1.02T"
  // invites the reader to compare two scales.
  if (billions >= 999.5) return "$" + (billions / 1000).toFixed(2) + "T";
  if (billions > 0 && billions < 0.01) return "<$0.01B";
  const dp = billions >= 100 ? 0 : billions >= 10 ? 1 : 2;
  // Trailing zeros stay: "$2.00B" belongs in a column with "$9.06B", where
  // "$2B" reads as a different precision.
  const whole = Math.floor(billions).toLocaleString("en-US");
  const decimals = dp > 0 ? billions.toFixed(dp).split(".")[1] : "";
  return "$" + whole + (decimals ? `.${decimals}` : "") + "B";
}

/** 41200000 -> "41.2m"; 1240000000 -> "1.24bn" */
export const volume = (n: number) =>
  n >= 1e9 ? (n / 1e9).toFixed(2) + "bn" : n >= 1e6 ? (n / 1e6).toFixed(1) + "m" : Math.round(n).toLocaleString("en-US");

/** 14532182000 -> "14.53bn"; 55143000 -> "55m"; 1 -> "1" */
export const shareCount = (n: number) =>
  n >= 1e9
    ? (n / 1e9).toFixed(2) + "bn"
    : n >= 1e6
      ? (n / 1e6).toFixed(0) + "m"
      : Math.round(n).toLocaleString("en-US");

/** 31.8 -> "31.8×"; null -> "—" */
export const multiple = (n: number | null) => (n === null ? "—" : n.toFixed(1) + "×");
