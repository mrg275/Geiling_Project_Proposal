import Link from "next/link";
import Sparkline from "@/components/Sparkline";
import { TagList } from "@/components/Tag";
import { direction, pct, usd0 } from "@/lib/format";
import { positionsByValue, weight } from "@/lib/portfolio";

export default function HoldingsTable() {
  const positions = positionsByValue();

  return (
    <section className="pane">
      <header>
        <h2>Holdings</h2>
        <span className="hint">{positions.length} positions</span>
      </header>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Position</th>
              <th>30 days</th>
              <th>Value</th>
              <th>Today</th>
              <th>All time</th>
              <th style={{ textAlign: "left" }}>Conviction</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <tr key={p.ticker}>
                <td>
                  <Link className="cell" href={`/securities/${p.ticker}`}>
                    <span className="tk">{p.ticker}</span>
                    <span className="co">{p.name}</span>
                  </Link>
                </td>
                <td>
                  <Sparkline ticker={p.ticker} change={p.thirtyDayPct} />
                </td>
                <td className="n">
                  {usd0(p.value)}
                  <span className="un">{weight(p).toFixed(1)}% of book</span>
                </td>
                <td className={`n ${direction(p.dayPct)}`}>{pct(p.dayPct)}</td>
                <td className={`n ${direction(p.totalPct)}`}>{pct(p.totalPct)}</td>
                <td style={{ textAlign: "left" }}>
                  <TagList ids={p.convictions} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
