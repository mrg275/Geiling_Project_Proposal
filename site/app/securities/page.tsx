import Link from "next/link";
import SecuritySearch from "@/components/securities/SecuritySearch";
import { positionsByValue } from "@/lib/portfolio";

export const metadata = { title: "Securities" };

export default function SecuritiesPage() {
  const held = positionsByValue().slice(0, 6);

  return (
    <div className="md">
      <SecuritySearch />
      <section className="pane">
        <header>
          <h2>Any publicly traded security</h2>
          <span className="hint">one page per name</span>
        </header>
        <div className="pad">
          <p className="sub">
            Search 39,000 tickers — every EDGAR registrant and every US-registered fund — and get
            one page per name: the price and its chart over seven ranges, the 52-week range, a
            market cap computed from shares outstanding, how the company earns, and the latest
            10-K, 10-Q and earnings release with their takeaways a button away.
          </p>
          <p className="fine" style={{ marginTop: 12 }}>
            Try <Link href="/securities/AAPL">AAPL</Link> for a name this project knows nothing
            about in advance, or <Link href="/securities/NVDA">NVDA</Link>, which carries the full
            sample research page. Valuation ratios, comps, targets and debates are still sample
            content and only cover NVDA.
          </p>
          <nav className="filters" style={{ marginTop: 16 }} aria-label="Your positions">
            {held.map((p) => (
              <Link key={p.ticker} href={`/securities/${p.ticker}`}>
                {p.ticker}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </div>
  );
}
