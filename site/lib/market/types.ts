/** What a market-data source has to produce, whoever it is.
 *
 *  One interface with two methods, so the vendor is a detail. The sample
 *  generator implements it, Alpaca implements it, and the page cannot tell
 *  which answered except by reading the provenance it hands back — which it
 *  then prints, because a price whose source is unstated is worse than no
 *  price.
 */

export type RangeId = "1d" | "5d" | "1m" | "6m" | "ytd" | "5y" | "all";

export interface PriceRange {
  id: RangeId;
  label: string;
  /** What the window covers, for the caption under the chart. */
  title: string;
}

export const PRICE_RANGES: PriceRange[] = [
  { id: "1d", label: "1D", title: "One session, five-minute bars, 9:30 to 4:00 ET" },
  { id: "5d", label: "5D", title: "Five sessions, half-hour bars, regular hours" },
  { id: "1m", label: "1M", title: "One month of closes" },
  { id: "6m", label: "6M", title: "Six months of closes" },
  { id: "ytd", label: "YTD", title: "Year to date, from the last close of last year" },
  { id: "5y", label: "5Y", title: "Five years, weekly closes" },
  {
    id: "all",
    label: "Total",
    // Not "the whole history": the free plan's bars begin in 2016, decades
    // after most of these companies listed.
    title: "Monthly closes, from 2016 — the earliest the free data plan carries",
  },
];

export const rangeById = (id: string): PriceRange | null =>
  PRICE_RANGES.find((r) => r.id === id) ?? null;

/** The S&P 500 itself is licensed data and no free plan carries it. The ETF
 *  tracks it to within a rounding error and trades like any other symbol, so
 *  the benchmark line is SPY and the chart says so. */
export const BENCHMARK = { symbol: "SPY", label: "S&P 500 (SPY)" };

/** Alpaca's feeds. `delayed_sip` is the consolidated tape fifteen minutes late,
 *  which is what a free key gets for anything "latest"; `sip` is the same tape
 *  for windows that have already closed. */
export type Feed = "sip" | "delayed_sip" | "iex";

export interface Provenance {
  source: "alpaca" | "sample";
  /** Which feed answered: the consolidated tape, or IEX alone. */
  feed?: Feed;
  /** True when the numbers trail the live market. */
  delayed: boolean;
  /** One sentence, printed under the chart. */
  note: string;
}

export interface Quote {
  price: number;
  dayPct: number;
  /** The previous session's close — the denominator of dayPct. */
  prevClose: number;
  /** ISO timestamp of the price itself, not of the request. */
  at: string;
  /** Whether `price` is a live print or the last session's close. */
  session: "open" | "closed";
  /** The latest print outside the session, when it differs from the close
   *  enough to be worth saying. Null during the session. */
  outside: { label: string; price: number; pct: number } | null;
  provenance: Provenance;
}

export interface PriceHistory {
  symbol: string;
  range: RangeId;
  /** One label per point, already in US Eastern time. */
  labels: string[];
  values: number[];
  /** The level the window is measured from, when that is not its first point.
   *
   *  Only the one-day window sets it, to the previous session's close — which
   *  is what a day's change is measured against everywhere else on the page.
   *  Rebasing it to its own 9:30 bar instead made the chart's endpoint read
   *  −0.1% beside a tile reading −0.5% for the same day. */
  base?: number | null;
  benchmark: { symbol: string; label: string; values: number[]; base?: number | null } | null;
  provenance: Provenance;
}

export interface TradingStats {
  /** Highest and lowest price over the last year. */
  high52: number;
  low52: number;
  /** Sessions the figures actually cover. */
  sessions: number;
  /** True when that is materially less than a year — a recent listing, or a
   *  symbol the source carries only part of. The labels then say what the
   *  window really is instead of claiming a year. */
  partial: boolean;
  /** True when the range is drawn from intraday highs and lows rather than
   *  closes, which is wider and more correct. */
  intraday: boolean;
  /** Mean daily volume over the last month, where the source reports volume. */
  avgVolume: number | null;
  /** Trailing one-year change, percent. */
  year1Pct: number | null;
  provenance: Provenance;
}

export interface MarketSource {
  readonly name: "alpaca" | "sample";
  /** Null when this source has nothing for the symbol. */
  quote(symbol: string): Promise<Quote | null>;
  history(symbol: string, range: RangeId): Promise<PriceHistory | null>;
  /** The year's range and liquidity — free from the same bars as the chart. */
  stats(symbol: string): Promise<TradingStats | null>;
}
