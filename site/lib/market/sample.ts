/** The invented source, behind the same interface as the real one.
 *
 *  Keeping the sample generator as a *source* rather than as a special case in
 *  the page is what makes the live connection safe to add: the page asks for a
 *  quote, something answers, and what answered is printed underneath. With no
 *  key configured the app still runs, still charts, and still says plainly that
 *  the numbers are invented.
 */
import { book } from "@/lib/data";
import {
  SAMPLE_AS_OF,
  dailyCloses,
  priceWindow,
  sp500Instrument,
  type Instrument,
} from "@/lib/prices";
import type {
  MarketSource,
  PriceHistory,
  Provenance,
  Quote,
  RangeId,
  TradingStats,
} from "./types";

export const SAMPLE_NOTE =
  "Sample prices — no market-data source is connected, so the shape is invented. " +
  "Only the close, the day move and the one-year return are anchored.";

const provenance: Provenance = { source: "sample", delayed: false, note: SAMPLE_NOTE };

function instrumentFor(symbol: string): Instrument | null {
  const entry = book.universe.find((u) => u.ticker === symbol);
  if (!entry) return null;
  return {
    key: entry.ticker,
    price: entry.price,
    dayPct: entry.dayPct,
    year1Pct: entry.year1Pct,
  };
}

export const sample: MarketSource = {
  name: "sample",

  async quote(symbol: string): Promise<Quote | null> {
    const instrument = instrumentFor(symbol);
    if (!instrument) return null;
    return {
      price: instrument.price,
      prevClose: instrument.price / (1 + instrument.dayPct / 100),
      dayPct: instrument.dayPct,
      at: SAMPLE_AS_OF.toISOString(),
      // The book's as-of is a closing print, 4:02pm ET.
      session: "closed",
      outside: null,
      provenance,
    };
  },

  async stats(symbol: string): Promise<TradingStats | null> {
    const instrument = instrumentFor(symbol);
    if (!instrument) return null;
    // Closes, not intraday highs: the generator has no bars, only a daily
    // series, so the range it reports is narrower than a real one.
    const year = dailyCloses(instrument, 252);
    return {
      high52: Math.max(...year),
      low52: Math.min(...year),
      sessions: year.length,
      partial: false,
      intraday: false,
      avgVolume: null,
      year1Pct: instrument.year1Pct,
      provenance,
    };
  },

  async history(symbol: string, range: RangeId): Promise<PriceHistory | null> {
    const instrument = instrumentFor(symbol);
    if (!instrument) return null;
    const own = priceWindow(instrument, range);
    const bench = priceWindow(sp500Instrument(), range);
    return {
      symbol,
      range,
      labels: own.labels,
      values: own.values,
      benchmark: { symbol: "SPX", label: "S&P 500", values: bench.values },
      provenance,
    };
  },
};
