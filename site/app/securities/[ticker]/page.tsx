import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BusinessModel from "@/components/securities/BusinessModel";
import TradingRange from "@/components/securities/TradingRange";
import FilingsSection from "@/components/securities/FilingsSection";
import PriceChart from "@/components/securities/PriceChart";
import SecuritySearch from "@/components/securities/SecuritySearch";
import SecuritySections, {
  SECTIONS,
  type SectionId,
} from "@/components/securities/SecuritySections";
import { book } from "@/lib/data";
import { direction, marketCap, multiple, pct, shareCount, usd0, usd2 } from "@/lib/format";
import { isLive, priceHistory, quoteFor, tradingStats } from "@/lib/market";
import { edgarSymbol } from "@/lib/market/symbols";
import { positionFor, weight } from "@/lib/portfolio";
import { sharesOutstanding } from "@/lib/sec/facts";
import { company, type Company } from "@/lib/sec/submissions";
import { isFund, resolve } from "@/lib/sec/tickers";
import { brokerNames, securityName } from "@/lib/securities/name";

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const symbol = edgarSymbol(ticker);
  // The same resolver the body uses. EDGAR's fund index carries no names, so
  // `registrant.name` is "" for an ETF — and `?? ` keeps an empty string,
  // which titled VOO's page "VOO" while the page itself said "Vanguard S&P
  // 500 ETF".
  const [registrant, broker] = await Promise.all([
    resolve(symbol).catch(() => null),
    brokerNames(),
  ]);
  const name = securityName({
    ticker: symbol,
    edgar: registrant?.name,
    broker: broker[symbol],
    fund: isFund(registrant),
  });
  return { title: name ? `${symbol} · ${name}` : symbol };
}

export default async function SecurityPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const [{ ticker }, { section }] = await Promise.all([params, searchParams]);
  const symbol = edgarSymbol(ticker);
  // "BRK.B" is what a person types and "BRK-B" is what EDGAR calls it. One
  // page, one spelling, so the dotted form redirects rather than 404ing.
  if (symbol !== ticker.toUpperCase()) {
    redirect(`/securities/${symbol}${section ? `?section=${section}` : ""}`);
  }

  // Identity comes from EDGAR's ticker index: any of 10,400 registrants, not
  // the eleven in the sample book.
  const registrant = await resolve(symbol).catch(() => null);
  // Still sample data: price, the book position, and the research sections.
  const entry = book.universe.find((u) => u.ticker === symbol);
  if (!registrant && !entry) notFound();

  // A fund is not in that index. EDGAR keeps mutual funds and ETFs in a
  // separate one, keyed by series and class rather than by ticker, so VOO —
  // which is a position in this book — resolves to nothing. The page still has
  // to open, on what the book knows.
  const identity = registrant ?? { ticker: symbol, cik: "", name: entry?.name ?? symbol };

  let profile: Company | null = null;
  let profileError: string | null = null;
  if (registrant) {
    try {
      profile = await company(registrant.cik);
    } catch (error) {
      profileError = error instanceof Error ? error.message : "EDGAR is unreachable.";
    }
  } else {
    profileError =
      "EDGAR's company index does not list this ticker. Funds and trusts file under a separate " +
      "index, keyed by series rather than symbol, so there is no 10-K to show here.";
  }
  const sample = book.securities[symbol];
  const held = positionFor(symbol);

  const active: SectionId = SECTIONS.some((s) => s.id === section)
    ? (section as SectionId)
    : "filings";

  // Price, history and share count in parallel: three sources, none of which
  // should hold up the others. The market layer decides whether a live source
  // or the sample generator answers, and says which in the provenance it hands
  // back — which is what the tile and the chart caption print.
  // When the market layer throws it is because the source failed, not because
  // the symbol has no history — and those are different sentences.
  let priceError: string | null = null;
  const keep = (error: unknown) => {
    priceError ??= error instanceof Error ? error.message : "The price source failed.";
    return null;
  };

  const [quote, history, stats, shares, broker] = await Promise.all([
    quoteFor(symbol).catch(keep),
    priceHistory(symbol, "6m").catch(keep),
    tradingStats(symbol).catch(keep),
    registrant && !isFund(registrant)
      ? sharesOutstanding(registrant.cik).catch(() => null)
      : Promise.resolve(null),
    brokerNames(),
  ]);

  // Funds are named by the broker or by the book; companies by EDGAR. The
  // registrant behind VOO is "Vanguard Index Funds", which is true and not
  // what anyone is looking for.
  const fund = isFund(registrant);
  const name = securityName({
    ticker: symbol,
    edgar: profile?.name ?? registrant?.name,
    broker: broker[symbol],
    fund,
  });

  // A market cap is a live price times a share count, and the share count is
  // free from XBRL. Falling back to the sample figure is why NVIDIA used to
  // read $4.48T whatever the market did.
  const capB =
    quote && shares ? (quote.price * shares.shares) / 1e9 : (entry?.marketCapB ?? null);

  // The time of the price, not of the request: a delayed feed means the two are
  // different, and the one that matters is when it traded.
  const stamp = (iso: string) =>
    new Date(iso)
      .toLocaleTimeString("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "2-digit",
      })
      .replace("AM", "am")
      .replace("PM", "pm");

  const venues = [...new Set(profile?.exchanges ?? [])];

  // An ETF is a fund whether or not EDGAR files it in the fund index: SPY is a
  // unit investment trust and sits in the *company* index, which had the page
  // saying it "needs price × shares outstanding" for something that has no
  // share count to find.
  const fundLike = fund || /\b(ETF|FUND|TRUST)\b/i.test(name);

  const priceNote = quote
    ? `${pct(quote.dayPct)} · ${
        quote.provenance.source === "sample"
          ? "sample"
          : quote.session === "open"
            ? `${stamp(quote.at)} ET`
            : "at the close"
      }`
    : priceError
      ? "price source failed"
      : isLive()
        ? "no quote for this symbol"
        : "no price source connected";

  return (
    <div className="md">
      <SecuritySearch selected={symbol} />

      <div className="grid">
        <section className="pane">
          <header>
            <h2>{identity.ticker}</h2>
            <span className="hint">
              {name || identity.ticker}
              {fund ? " · fund or ETF" : ""}
              {profile?.industry ? ` · ${profile.industry}` : ""}
              {/* EDGAR lists one entry per ticker, not per venue, so a
                  two-class filer reported "NYSE, NYSE" and Alphabet reported
                  Nasdaq four times. */}
              {venues.length > 0 ? ` · ${venues.join(", ")}` : ""}
            </span>
          </header>

          <div className="kv">
            <div>
              <div className="k">Last</div>
              <div className="v">{quote ? usd2(quote.price) : "—"}</div>
              <div className={`nt ${quote ? direction(quote.dayPct) : ""}`}>{priceNote}</div>
              {quote?.outside && (
                <div className="nt">
                  {quote.outside.label} {usd2(quote.outside.price)} {pct(quote.outside.pct)}
                </div>
              )}
            </div>
            <div>
              <div className="k">Market cap</div>
              <div className="v">{marketCap(capB)}</div>
              <div className="nt">
                {shares
                  ? `${shareCount(shares.shares)} ${
                      shares.average ? "diluted avg shares" : "shares"
                    }, ${shares.form || "filing"} ${shares.asOf}${
                      shares.tickers > 1 ? ` · ${shares.tickers} tickers at EDGAR` : ""
                    }`
                  : fundLike
                    ? "a fund reports holdings, not shares outstanding"
                    : "no recent share count in EDGAR's XBRL facts"}
              </div>
            </div>
            <div>
              <div className="k">Held</div>
              <div className="v">{held ? `${weight(held).toFixed(1)}%` : "—"}</div>
              <div className="nt">
                {held ? `${usd0(held.value)} · ${pct(held.totalPct)}` : "not in the book"}
              </div>
            </div>
            <div>
              <div className="k">{profile?.fiscalYearEnd ? "Fiscal year end" : "P/E forward"}</div>
              <div className="v">
                {profile?.fiscalYearEnd
                  ? `${profile.fiscalYearEnd.slice(0, 2)}/${profile.fiscalYearEnd.slice(2)}`
                  : multiple(entry?.forwardPE ?? null)}
              </div>
              {profile?.cik && <div className="nt">CIK {profile.cik.replace(/^0+/, "")}</div>}
            </div>
          </div>

          {history ? (
            <PriceChart symbol={symbol} initial={history} />
          ) : (
            <div className="pad-b" style={{ borderTop: "1px solid var(--line)" }}>
              <p className="fine">
                {priceError
                  ? `The market-data source failed: ${priceError}`
                  : isLive()
                    ? "No price history: the market-data source has no bars for this symbol. Delisted names, unlisted registrants and most of the OTC tail are not tradable, so there is nothing to draw."
                    : "No price history: this symbol is outside the sample universe and no market-data source is connected."}{" "}
                Identity and filings below are live from EDGAR.
              </p>
            </div>
          )}

          {stats && <TradingRange stats={stats} price={quote?.price ?? null} />}

          <BusinessModel ticker={symbol} profile={profile} />
        </section>

        <section className="pane">
          <nav className="tabs2" aria-label="Research sections">
            {SECTIONS.map((s) => (
              <Link
                key={s.id}
                href={`/securities/${symbol}?section=${s.id}`}
                aria-current={s.id === active ? "page" : undefined}
                scroll={false}
              >
                {s.label}
              </Link>
            ))}
          </nav>

          {active === "filings" ? (
            profileError ? (
              <div className="pad">
                <p className="fine">{profileError}</p>
              </div>
            ) : profile ? (
              <FilingsSection profile={profile} />
            ) : null
          ) : sample ? (
            <SecuritySections security={sample} section={active} />
          ) : (
            <div className="pad">
              <p className="sub">
                Live on this page for every ticker: identity and industry from EDGAR, the filings
                with their takeaways, the price and chart, the 52-week range, and a market cap
                computed from shares outstanding rather than typed in.
              </p>
              <p className="fine" style={{ marginTop: 10 }}>
                Not yet: P/E, EV/EBITDA and the industry ratios, which need the XBRL fundamentals
                pipeline; comps, which need a peer list and the same ratios; and targets and
                debates, which need a research source. Those four tabs carry sample content, and
                the sample only covers NVDA.{" "}
                <Link href={`/securities/${symbol}?section=filings`}>See filings</Link>.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
