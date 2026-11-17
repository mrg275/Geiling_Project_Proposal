import { direction } from "@/lib/format";
import { sparkValues } from "@/lib/series";

/** 30-session shape for a row. Deterministic from the ticker, so the server and
 *  the client draw the same path and the row does not flicker on hydration. */
export default function Sparkline({
  ticker,
  change,
  width = 62,
  height = 20,
}: {
  ticker: string;
  change: number;
  width?: number;
  height?: number;
}) {
  const values = sparkValues(ticker, change);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const x = (i: number) => (i / (values.length - 1)) * (width - 2) + 1;
  const y = (v: number) => height - 2 - ((v - lo) / span) * (height - 4);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const lastX = x(values.length - 1);
  const lastY = y(values[values.length - 1]);

  return (
    <svg
      className="spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <path
        d={d}
        fill="none"
        style={{ stroke: "var(--spark)" }}
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={lastX.toFixed(1)}
        cy={lastY.toFixed(1)}
        r="2"
        style={{ fill: `var(--${direction(change)}-ink)` }}
      />
    </svg>
  );
}
