import { change, usd2, volume as vol } from "@/lib/format";
import type { TradingStats } from "@/lib/market/types";

/** Where the price sits in its year, which is the one piece of context a
 *  single price never carries.
 *
 *  Free from the same daily bars the chart already asks for, so it works for
 *  any ticker rather than only the ones with sample research.
 */
export default function TradingRange({
  stats,
  price,
}: {
  stats: TradingStats;
  price: number | null;
}) {
  const span = stats.high52 - stats.low52;
  const at =
    price !== null && span > 0
      ? Math.min(100, Math.max(0, ((price - stats.low52) / span) * 100))
      : null;

  return (
    <div className="pad-b" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="m2">
        {/* A symbol listed eight months ago has no 52-week range, and calling
            its eight months a year would be one more figure claiming more than
            it covers. */}
        <span>
          {stats.partial ? `Range over ${stats.sessions} sessions` : "52-week range"}
          {stats.intraday ? "" : " (closes)"}
        </span>
        <span>
          {stats.year1Pct !== null
            ? `${stats.partial ? `${stats.sessions} sessions` : "1y"} ${change(stats.year1Pct)}`
            : ""}
          {stats.avgVolume ? ` · ${vol(stats.avgVolume)} avg volume` : ""}
        </span>
      </div>
      <div className="rng">{at !== null && <i style={{ left: `${at}%` }} />}</div>
      <div className="m2">
        <span>{usd2(stats.low52)}</span>
        <span>{usd2(stats.high52)}</span>
      </div>
    </div>
  );
}
