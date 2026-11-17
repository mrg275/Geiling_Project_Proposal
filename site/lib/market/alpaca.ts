/** Alpaca as the live market-data source.
 *
 *  Why this one: the free plan carries aggregate bars back to 2016 and
 *  snapshots, at 200 requests a minute, and a paper-only account needs nothing
 *  but an email address. No other free plan covers intraday and ten years of
 *  history from one endpoint.
 *
 *  Two things about the free plan shape this file:
 *
 *  1. **It is fifteen minutes behind.** Not a limitation to work around — it is
 *     the thing to say out loud. Every window therefore ends fifteen minutes
 *     ago, which is what Alpaca does by default when `end` is omitted, and the
 *     page prints the delay rather than implying a live tape.
 *  2. **The feed is negotiated, not assumed.** Alpaca's own documentation says
 *     historical bars default to the consolidated tape while the free plan is
 *     entitled to IEX; which one a given key actually gets is not something to
 *     guess, so the first call asks for `sip`, falls back to `iex` on a 403,
 *     and the answer is cached and reported. IEX alone is one exchange and a
 *     few per cent of volume, so a chart drawn from it is not the same chart —
 *     the provenance line says which one you are looking at.
 *
 *  Bars are requested split- and dividend-adjusted. Without that, NVIDIA's ten
 *  year chart shows a 90% crash where its split was.
 */
import { DAY, HOUR, cached } from "@/lib/cache";
import { dottedSymbol, edgarSymbol } from "./symbols";
import {
  BENCHMARK,
  type Feed,
  type PriceHistory,
  type Provenance,
  type Quote,
  type RangeId,
  type MarketSource,
  type TradingStats,
} from "./types";

const DATA = "https://data.alpaca.markets/v2";
const ET = "America/New_York";
/** 200 a minute on the free plan; three a second leaves room to spare. */
const RPS = 3;

export class AlpacaError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AlpacaError";
  }
}

export function hasAlpacaKeys(): boolean {
  return Boolean(process.env.ALPACA_KEY_ID && process.env.ALPACA_SECRET_KEY);
}

const realtime = () => process.env.ALPACA_REALTIME === "true";

let windowStart = 0;
let windowCount = 0;

async function throttle(): Promise<void> {
  const now = Date.now();
  if (now - windowStart >= 1000) {
    windowStart = now;
    windowCount = 0;
  }
  if (windowCount >= RPS) {
    await new Promise((r) => setTimeout(r, Math.max(1000 - (now - windowStart), 10)));
    return throttle();
  }
  windowCount += 1;
}

/** The trading API, which is where the asset list lives.
 *
 *  Paper keys work only against the paper host and live keys only against the
 *  live one, so this is a setting rather than a constant. Market data takes
 *  either, which is why `DATA` above is fixed.
 */
const tradingBase = () =>
  process.env.ALPACA_TRADING_BASE ?? "https://paper-api.alpaca.markets";

async function get<T>(path: string, params: Record<string, string>): Promise<T> {
  return request<T>(DATA, path, params);
}

async function request<T>(
  base: string,
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const id = process.env.ALPACA_KEY_ID;
  const secret = process.env.ALPACA_SECRET_KEY;
  if (!id || !secret) {
    throw new AlpacaError(
      "ALPACA_KEY_ID and ALPACA_SECRET_KEY are not set, so there is no live price source. " +
        "A paper-only account at alpaca.markets issues both free.",
      0,
    );
  }

  await throttle();
  const query = new URLSearchParams(params).toString();
  const url = `${base}${path}${query ? `?${query}` : ""}`;
  const res = await fetch(url, {
    headers: { "APCA-API-KEY-ID": id, "APCA-API-SECRET-KEY": secret, Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    // These messages reach the page, so they say what to do about it rather
    // than forwarding nginx's HTML error document.
    if (res.status === 401) {
      throw new AlpacaError(
        "Alpaca rejected the key (401). Check ALPACA_KEY_ID and ALPACA_SECRET_KEY.",
        401,
      );
    }
    if (res.status === 429) {
      throw new AlpacaError(
        "Alpaca rate-limited this app (429). The free plan allows 200 requests a minute.",
        429,
      );
    }
    const body = (await res.text().catch(() => ""))
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    throw new AlpacaError(
      `Alpaca returned ${res.status}${body ? `: ${body.slice(0, 120)}` : "."}`,
      res.status,
    );
  }
  return (await res.json()) as T;
}

/** The end of every window, which is the whole shape of the free plan.
 *
 *  Measured, not assumed: asking for SIP bars with no `end` returns
 *  403 "subscription does not permit querying recent SIP data". The default end
 *  is now, and now is not fifteen minutes ago. So the window is closed
 *  explicitly, with a minute of margin, and the consolidated tape is allowed.
 */
function windowEnd(): string | null {
  if (realtime()) return null;
  return new Date(Date.now() - 16 * 60_000).toISOString();
}

/** Which feed this key is entitled to — asked, per endpoint, rather than
 *  assumed.
 *
 *  Entitlements differ by endpoint, which is the trap here: a free key may read
 *  the consolidated tape for a window that has closed while being refused the
 *  same tape's "latest" value. So bars and snapshots negotiate separately, each
 *  against its own endpoint, and 403 is the documented answer for "your
 *  subscription does not cover that". Cached for an hour per endpoint.
 */
const CANDIDATES: Record<"bars" | "quote", Feed[]> = {
  // `delayed_sip` is not a documented historical feed value; `sip` with a
  // closed window is the way to the consolidated tape here.
  bars: ["sip", "iex"],
  quote: ["delayed_sip", "sip", "iex"],
};

async function feed(kind: "bars" | "quote"): Promise<Feed> {
  return cached(`alpaca:feed:${kind}:v2`, HOUR, async () => {
    for (const candidate of CANDIDATES[kind]) {
      try {
        if (kind === "bars") {
          const end = windowEnd();
          await get<BarsResponse>("/stocks/bars", {
            symbols: BENCHMARK.symbol,
            timeframe: "1Day",
            start: backDays(10),
            ...(end ? { end } : {}),
            limit: "1",
            feed: candidate,
          });
        } else {
          await get<SnapshotResponse>("/stocks/snapshots", {
            symbols: BENCHMARK.symbol,
            feed: candidate,
          });
        }
        return candidate;
      } catch (error) {
        if (error instanceof AlpacaError && error.status === 403) continue;
        throw error;
      }
    }
    throw new AlpacaError(
      `No ${kind} feed on this plan returned data. Check the market-data subscription on the key.`,
      403,
    );
  });
}

function provenanceFor(f: Feed): Provenance {
  const delayed = !realtime() || f === "delayed_sip";
  const lag = delayed ? ", fifteen minutes behind the market" : ", real time";
  return {
    source: "alpaca",
    feed: f,
    delayed,
    note:
      f === "iex"
        ? `Alpaca, IEX only — one exchange, a few per cent of the volume${lag}, adjusted for splits and dividends.`
        : `Alpaca, consolidated tape${lag}, adjusted for splits and dividends.`,
  };
}

interface Asset {
  symbol: string;
  name: string;
  exchange: string;
  tradable: boolean;
}

/** Ticker to name, for every active US equity and ETF Alpaca trades.
 *
 *  EDGAR's fund index carries no names at all, so without this VOO is a search
 *  result reading "VOO" and nothing else. A broker is the right authority for
 *  what a tradable symbol is called: this returns "Vanguard S&P 500 ETF" where
 *  EDGAR would at best return the trust that files for it.
 *
 *  One call, cached for a day, and it only ever supplies names EDGAR is missing
 *  — company names stay as EDGAR writes them.
 */
export async function assetNames(): Promise<Record<string, string>> {
  return cached("alpaca:assets:v1", DAY, async () => {
    const assets = await request<Asset[]>(tradingBase(), "/v2/assets", {
      status: "active",
      asset_class: "us_equity",
    });
    const names: Record<string, string> = {};
    for (const asset of assets) {
      if (asset.symbol && asset.name) names[asset.symbol.toUpperCase()] = asset.name;
    }
    return names;
  });
}

/** What this vendor calls the symbol the rest of the app calls `symbol`.
 *
 *  Decided from the asset list rather than guessed: if Alpaca lists the dashed
 *  spelling it is used as-is, if it lists the dotted one that is used, and if
 *  the list cannot be fetched the dotted form is the better guess, since Alpaca
 *  holds no dashed symbols at all.
 */
async function vendorSymbol(symbol: string): Promise<string> {
  const canonical = edgarSymbol(symbol);
  if (!canonical.includes("-")) return canonical;
  const dotted = dottedSymbol(canonical);
  try {
    const names = await assetNames();
    if (names[canonical]) return canonical;
    if (names[dotted]) return dotted;
    return canonical;
  } catch {
    return dotted;
  }
}

/** Which feed each endpoint negotiated, for the setup check. */
export async function negotiatedFeeds(): Promise<{ bars: Feed; quote: Feed }> {
  const [bars, quote] = await Promise.all([feed("bars"), feed("quote")]);
  return { bars, quote };
}

interface Bar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface BarsResponse {
  bars: Record<string, Bar[]> | null;
  next_page_token: string | null;
}

interface SnapshotResponse {
  [symbol: string]:
    | {
        latestTrade?: { p: number; t: string };
        minuteBar?: Bar;
        dailyBar?: Bar;
        prevDailyBar?: Bar;
      }
    | undefined;
}

const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: ET });

const SESSION_OPEN = 9 * 60 + 30;
const SESSION_CLOSE = 16 * 60;

/** Minutes past midnight, US Eastern — which is the only clock a US session
 *  keeps, and not the one the server happens to run on. */
function etMinutes(iso: string): number {
  const [hours, minutes] = new Date(iso)
    .toLocaleTimeString("en-GB", { timeZone: ET, hour12: false, hour: "2-digit", minute: "2-digit" })
    .split(":")
    .map(Number);
  return hours * 60 + minutes;
}

/** Regular hours only.
 *
 *  Alpaca returns intraday bars for the whole trading day — 4am to 8pm ET — so
 *  an unfiltered "1D" was 157 five-minute bars running from pre-market to
 *  after-hours, with its last point an after-hours print rather than the close.
 *  Extended-hours volume is thin enough that including it silently draws a
 *  chart nobody means.
 */
const inSession = (iso: string) => {
  const minute = etMinutes(iso);
  return minute >= SESSION_OPEN && minute < SESSION_CLOSE;
};

const timeLabel = (iso: string) =>
  new Date(iso)
    .toLocaleTimeString("en-US", { timeZone: ET, hour: "numeric", minute: "2-digit" })
    .replace(/\s?[AP]M$/i, "");

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { timeZone: ET, month: "short", day: "numeric" });

const weekdayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { timeZone: ET, weekday: "short" });

const yearLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { timeZone: ET, year: "2-digit" });

const monthLabel = (iso: string) => {
  const d = new Date(iso);
  const month = d.toLocaleDateString("en-US", { timeZone: ET, month: "short" });
  const year = d.toLocaleDateString("en-US", { timeZone: ET, year: "2-digit" });
  return `${month} ’${year}`;
};

const backDays = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

const etYear = () => Number(new Date().toLocaleDateString("en-CA", { timeZone: ET }).slice(0, 4));

/** Sessions in a year. 252, the trading-day count — not the 261 weekdays the
 *  sample calendar uses, which is a year plus a fortnight and made NVIDIA's
 *  "1y" read −21.6% where the real 52-week move was −12.9%. */
const SESSIONS_PER_YEAR = 252;

/** Sessions in six months, so the caption and the window agree. */
const SESSIONS_PER_HALF_YEAR = 126;

/** What to ask for, per range. `end` is deliberately left out: Alpaca then ends
 *  the window fifteen minutes ago on a free key and now on a paid one. */
function plan(range: RangeId): { timeframe: string; start: string } {
  switch (range) {
    case "1d":
      return { timeframe: "5Min", start: backDays(6) };
    case "5d":
      return { timeframe: "30Min", start: backDays(12) };
    case "1m":
      return { timeframe: "1Day", start: backDays(45) };
    case "6m":
      return { timeframe: "1Day", start: backDays(200) };
    case "ytd":
      // The year in New York, not the year on the server: for an hour each
      // 31 December the two disagree, and the window would start in the middle
      // of December instead of at last year's final close.
      return { timeframe: "1Day", start: `${etYear() - 1}-12-15` };
    case "5y":
      return { timeframe: "1Week", start: backDays(365 * 5 + 14) };
    default:
      return { timeframe: "1Month", start: "2016-01-01" };
  }
}

/** Cut the fetched window down to what the range actually means. */
function trim(bars: Bar[], range: RangeId): Bar[] {
  if (bars.length === 0) return bars;

  if (range === "1d" || range === "5d") {
    // Sessions, not calendar days: holidays and weekends sort themselves out
    // because a day with no bars simply is not in the data.
    const regular = bars.filter((bar) => inSession(bar.t));
    const wanted = range === "1d" ? 1 : 5;
    const days: string[] = [];
    for (const bar of regular) {
      const key = dayKey(bar.t);
      if (!days.includes(key)) days.push(key);
    }
    const keep = new Set(days.slice(-wanted));
    return regular.filter((bar) => keep.has(dayKey(bar.t)));
  }

  if (range === "1m") return bars.slice(-23);
  if (range === "6m") return bars.slice(-SESSIONS_PER_HALF_YEAR);

  if (range === "ytd") {
    // Year to date is measured from the last close of last year, so the window
    // starts on that bar rather than on the first bar of January.
    const year = String(etYear());
    let base = -1;
    for (let i = 0; i < bars.length; i++) if (dayKey(bars[i].t) < `${year}-01-01`) base = i;
    return base >= 0 ? bars.slice(base) : bars;
  }

  return bars;
}

function labelFor(iso: string, range: RangeId): string {
  if (range === "1d") return timeLabel(iso);
  if (range === "5d") return `${weekdayLabel(iso)} ${timeLabel(iso)}`;
  // Weekly bars inside one month would all read "Nov ’21", so five years keeps
  // the day. Monthly bars cannot collide, so the whole history does not.
  if (range === "5y") return `${dateLabel(iso)} ’${yearLabel(iso)}`;
  if (range === "all") return monthLabel(iso);
  return dateLabel(iso);
}

/** The benchmark on the subject's timestamps.
 *
 *  Two symbols do not always print in the same minute, so the benchmark is
 *  carried forward: each of the subject's bars takes the benchmark's last close
 *  at or before it. Interpolating instead would invent prices; dropping the
 *  unmatched bars would shorten the line people came to read.
 */
function align(subject: Bar[], other: Bar[]): number[] | null {
  if (other.length === 0) return null;
  const out: number[] = [];
  let i = 0;
  let last = other[0].c;
  for (const bar of subject) {
    while (i < other.length && other[i].t <= bar.t) {
      last = other[i].c;
      i += 1;
    }
    out.push(last);
  }
  return out;
}

/** The close of the session before the one on screen.
 *
 *  A day's change is measured from the previous close, so the one-day chart has
 *  to be too — and that bar is outside the window being drawn, which is why it
 *  is picked out of the untrimmed response.
 */
function priorSessionClose(all: Bar[], shown: Bar[]): number | null {
  if (shown.length === 0) return null;
  const firstDay = dayKey(shown[0].t);
  const before = all.filter((bar) => inSession(bar.t) && dayKey(bar.t) < firstDay);
  return before.length ? before[before.length - 1].c : null;
}

async function bars(
  symbols: string[],
  timeframe: string,
  start: string,
  f: Feed,
): Promise<Record<string, Bar[]>> {
  const merged: Record<string, Bar[]> = {};
  let token: string | null = null;
  // Every window this app asks for fits in one page; the loop is here so a
  // wider one later cannot silently truncate.
  for (let page = 0; page < 6; page++) {
    const end = windowEnd();
    const params: Record<string, string> = {
      symbols: symbols.join(","),
      timeframe,
      start,
      ...(end ? { end } : {}),
      limit: "10000",
      adjustment: "all",
      sort: "asc",
      feed: f,
    };
    if (token) params.page_token = token;
    const res: BarsResponse = await get<BarsResponse>("/stocks/bars", params);
    for (const [symbol, list] of Object.entries(res.bars ?? {})) {
      merged[symbol] = (merged[symbol] ?? []).concat(list);
    }
    token = res.next_page_token;
    if (!token) break;
  }
  return merged;
}

export const alpaca: MarketSource = {
  name: "alpaca",

  async history(symbol: string, range: RangeId): Promise<PriceHistory | null> {
    const f = await feed("bars");
    const canonical = edgarSymbol(symbol);
    const vendor = await vendorSymbol(canonical);
    const { timeframe, start } = plan(range);
    const wantBenchmark = vendor !== BENCHMARK.symbol;
    const symbols = wantBenchmark ? [vendor, BENCHMARK.symbol] : [vendor];

    const all = await bars(symbols, timeframe, start, f);
    const raw = all[vendor] ?? [];
    const own = trim(raw, range);
    if (own.length < 2) return null;

    const benchRaw = wantBenchmark ? (all[BENCHMARK.symbol] ?? []) : [];
    const benchValues = wantBenchmark ? align(own, benchRaw) : null;

    // Only the intraday window moves its anchor off the first point, and both
    // lines move together — one chart with two different anchors would be a
    // new way of saying something untrue.
    const base = range === "1d" ? priorSessionClose(raw, own) : null;
    const benchBase = range === "1d" ? priorSessionClose(benchRaw, own) : null;

    return {
      // The app's spelling, not the vendor's: the URL, the search index and the
      // filings are all keyed by EDGAR's.
      symbol: canonical,
      range,
      labels: own.map((bar) => labelFor(bar.t, range)),
      values: own.map((bar) => bar.c),
      base,
      benchmark: benchValues ? { ...BENCHMARK, values: benchValues, base: benchBase } : null,
      provenance: provenanceFor(f),
    };
  },

  async stats(symbol: string): Promise<TradingStats | null> {
    const f = await feed("bars");
    const vendor = await vendorSymbol(symbol);
    // 400 calendar days to be sure of covering 252 sessions through holidays.
    const all = await bars([vendor], "1Day", backDays(400), f);
    const daily = (all[vendor] ?? []).slice(-SESSIONS_PER_YEAR);
    if (daily.length < 2) return null;

    // Intraday highs and lows, not closes: a 52-week range is the range the
    // price actually traded in, and the two differ by more than rounding.
    const recent = daily.slice(-21);
    const volumes = recent.map((bar) => bar.v).filter((v) => v > 0);
    return {
      high52: Math.max(...daily.map((bar) => bar.h)),
      low52: Math.min(...daily.map((bar) => bar.l)),
      sessions: daily.length,
      // A listing younger than a year has no 52-week range, and saying it does
      // would be the fourth way this page found to state something untrue.
      partial: daily.length < SESSIONS_PER_YEAR - 12,
      intraday: true,
      avgVolume: volumes.length ? volumes.reduce((a, b) => a + b, 0) / volumes.length : null,
      year1Pct: (daily[daily.length - 1].c / daily[0].c - 1) * 100,
      provenance: provenanceFor(f),
    };
  },

  async quote(symbol: string): Promise<Quote | null> {
    const [fq, fb] = await Promise.all([feed("quote"), feed("bars")]);
    // The snapshot is one call for the last trade, today's bar and yesterday's
    // close — which is exactly a quote and a day move, and nothing more.
    // Two calls, because neither answers this on its own.
    //
    // The snapshot's `latestTrade` includes extended hours, and so — less
    // obviously — does its daily bar's close: at 5pm both read $156.72 for
    // NVIDIA while the chart, drawn from regular-hours bars, ended at $155.45.
    // Same company, same page, two prices. So the close comes from the session
    // bars, the same ones the 1D chart is made of, and the after-hours print is
    // said out loud instead of quietly standing in for the close.
    const vendor = await vendorSymbol(symbol);
    const [res, intraday] = await Promise.all([
      get<SnapshotResponse>("/stocks/snapshots", { symbols: vendor, feed: fq }),
      bars([vendor], "5Min", backDays(8), fb).catch(() => ({}) as Record<string, Bar[]>),
    ]);

    const snap = res[vendor];
    const trade = snap?.latestTrade;
    const open = trade ? inSession(trade.t) : false;

    // Regular-hours bars, split into the last two sessions.
    const session = (intraday[vendor] ?? []).filter((bar) => inSession(bar.t));
    const days: string[] = [];
    for (const bar of session) {
      const key = dayKey(bar.t);
      if (!days.includes(key)) days.push(key);
    }
    const closeOn = (day: string | undefined) => {
      if (!day) return undefined;
      const onDay = session.filter((bar) => dayKey(bar.t) === day);
      return onDay.length ? onDay[onDay.length - 1].c : undefined;
    };

    const lastClose = closeOn(days[days.length - 1]);
    const priorClose = closeOn(days[days.length - 2]);

    // Falling back to the snapshot keeps thinly traded symbols working, where
    // five-minute bars can be missing entirely.
    const price = open ? trade?.p : (lastClose ?? snap?.dailyBar?.c ?? trade?.p);
    const prevClose = (open ? lastClose : priorClose) ?? snap?.prevDailyBar?.c;
    if (!price || !prevClose) return null;

    const drift = trade && !open ? trade.p / price - 1 : 0;
    return {
      price,
      prevClose,
      dayPct: (price / prevClose - 1) * 100,
      at: trade?.t ?? new Date().toISOString(),
      session: open ? "open" : "closed",
      outside:
        trade && Math.abs(drift) > 0.0025
          ? {
              label: etMinutes(trade.t) < SESSION_OPEN ? "pre-market" : "after hours",
              price: trade.p,
              pct: drift * 100,
            }
          : null,
      provenance: provenanceFor(price === lastClose || open ? fb : fq),
    };
  },
};
