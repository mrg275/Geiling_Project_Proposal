import Flagged from "@/components/portfolio/Flagged";
import HoldingsTable from "@/components/portfolio/HoldingsTable";
import PerformanceChart from "@/components/PerformanceChart";
import TodaysRead from "@/components/portfolio/TodaysRead";
import { book } from "@/lib/data";
import { direction, dollars, pct, usd0 } from "@/lib/format";
import { bookTotals } from "@/lib/portfolio";

// Next's `%s · Conviction` template does not apply to the segment that
// declares it, so the root page spells its own title out.
export const metadata = { title: "Portfolio · Conviction" };

export default function PortfolioPage() {
  const totals = bookTotals();

  return (
    <>
      <div className="tiles" style={{ marginBottom: 16 }}>
        <div className="tile">
          <div className="k">Book value</div>
          <div className="v">{usd0(book.total)}</div>
          <div className="d fine">Chase, 15 minutes delayed</div>
        </div>
        <div className="tile">
          <div className="k">Today</div>
          <div className={`v ${direction(totals.day)}`}>{dollars(totals.day)}</div>
          <div className={`d ${direction(totals.day)}`}>{pct(totals.dayPct)}</div>
        </div>
        <div className="tile">
          <div className="k">All time</div>
          <div className={`v ${direction(totals.gain)}`}>{dollars(totals.gain)}</div>
          <div className={`d ${direction(totals.gain)}`}>{pct(book.totalPct)}</div>
        </div>
        <div className="tile">
          <div className="k">Cash</div>
          <div className="v">{usd0(book.cash)}</div>
          <div className="d fine">{((book.cash / book.total) * 100).toFixed(1)}% of book</div>
        </div>
      </div>

      <div className="grid c2">
        <div className="grid">
          <PerformanceChart title="Performance" />
          <HoldingsTable />
        </div>
        <div className="grid">
          <TodaysRead />
          <Flagged />
        </div>
      </div>
    </>
  );
}
