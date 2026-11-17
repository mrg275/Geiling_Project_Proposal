/** Time-series maths for the performance chart and the row sparklines. */

/** 35 monthly labels ending at the last data point, Jan 2024 to Nov 2026. */
export const MONTH_LABELS: string[] = Array.from({ length: 35 }, (_, i) => {
  const d = new Date(2024, i, 1);
  return d.toLocaleString("en-US", { month: "short" }) + " ’" + String(d.getFullYear()).slice(2);
});

export interface Range {
  id: string;
  label: string;
  months: number;
}

export const RANGES: Range[] = [
  { id: "ytd", label: "YTD", months: 11 },
  { id: "1y", label: "1Y", months: 12 },
  { id: "3y", label: "3Y", months: 35 },
];

/** Axis ticks on 1/2/2.5/5/10 × a power of ten, so labels read as round numbers. */
export function niceTicks(lo: number, hi: number, count: number): number[] {
  const raw = (hi - lo) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(6));
  return out;
}

/** Re-index a slice so its first point is 100.
 *
 *  This is what lets the portfolio and two benchmarks share one axis. Plotting a
 *  dollar book value against index points would need two scales, and a
 *  dual-axis chart can be made to show any relationship you like.
 */
export const rebase = (values: number[]): number[] => {
  const base = values[0];
  return values.map((v) => (v / base) * 100);
};

/** A deterministic random walk for a ticker, ending exactly at `change`.
 *
 *  Seeded off the ticker so a row's sparkline is stable across renders and
 *  identical on the server and the client. It is decoration with a correct
 *  endpoint, not price history — real bars replace it with the same signature.
 */
export function sparkValues(ticker: string, change: number, n = 30): number[] {
  let seed = 0;
  for (const ch of ticker) seed = (seed * 31 + ch.charCodeAt(0)) % 99991;
  let x = seed || 7;
  const rnd = () => ((x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

  const out: number[] = [];
  let v = 100;
  for (let i = 0; i < n; i++) {
    v += (rnd() - 0.47) * 2.6;
    out.push(v);
  }
  // Shear the walk so it lands on the real endpoint without flattening the shape.
  const base = out[0];
  const end = out[n - 1];
  const target = base * (1 + change / 100);
  return out.map((q, i) => q + (i / (n - 1)) * (target - end));
}
