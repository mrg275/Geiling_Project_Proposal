/** Sample price history, at whatever granularity the range control asks for.
 *
 *  A range control is only honest if every range is drawn from the same
 *  history: 1D and 5Y must be two windows onto one series, or the chart will
 *  contradict itself as you click along the row. So one daily series is
 *  generated per instrument — ten years of trading days — and every range is a
 *  slice of it. The two intraday ranges interpolate inside the days they
 *  cover, so the last point of 1D is the last point of 5Y.
 *
 *  Three numbers in the sample book are treated as true and the walk is bent to
 *  hit them exactly: today's close, the day's percentage move, and the trailing
 *  one-year return. Everything between them is invented.
 *
 *  The calendar is weekdays with no holidays, which is wrong by about nine days
 *  a year. When a real market-data source lands, this whole file is replaced by
 *  its bars and that stops mattering.
 */
import { book } from "@/lib/data";
import type { RangeId } from "@/lib/market/types";

export interface Instrument {
  /** Ticker, and the seed for this instrument's walk. */
  key: string;
  price: number;
  dayPct: number;
  /** Trailing twelve months, percent. */
  year1Pct: number;
  /** Daily log-return standard deviation. Left out, it is drawn from the seed. */
  vol?: number;
}

export interface PriceWindow {
  labels: string[];
  values: number[];
}

/** Matches book.asOf. The sample book has one timestamp, and the chart has to
 *  agree with the footer. */
export const SAMPLE_AS_OF = new Date(2026, 10, 16);
/** Weekdays in a year. Not 252: that is trading days net of holidays, and this
 *  calendar does not keep holidays, so 252 would make "5Y" five years less a
 *  fortnight. */
const YEAR = 261;
const SPAN = YEAR * 10;

/** Weekdays, oldest first, ending on the book's as-of date. */
const DATES: Date[] = (() => {
  const out: Date[] = [];
  const cursor = new Date(SAMPLE_AS_OF);
  while (out.length < SPAN) {
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) out.push(new Date(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return out.reverse();
})();

function rng(seed: string): () => number {
  let x = 0;
  for (const ch of seed) x = (x * 31 + ch.charCodeAt(0)) % 2147483647;
  x = x || 7;
  return () => (x = (x * 48271) % 2147483647) / 2147483647;
}

/** Box–Muller, one draw per call. */
function gauss(r: () => number): number {
  const u = Math.max(r(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

const cache = new Map<string, number[]>();

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Ten years of daily closes, ending exactly on the book's price.
 *
 *  Not a random walk with drift. Over ten years a daily walk's noise swamps its
 *  drift — one seed lands NVIDIA a quarter below where it started — and a ten
 *  year chart that says that is simply wrong, whoever's sample data it is. So
 *  the series is a long-run trend plus a bounded deviation: the trend decides
 *  where the line goes, the deviation decides how it gets there, and the
 *  deviation cannot win.
 *
 *  Then two bends, both exact. The last year is tilted to pass through the level
 *  implied by `year1Pct`, and today's close is appended exactly `dayPct` above
 *  yesterday's — so the 1D chart's endpoint and the day move in the tile are the
 *  same number by construction, not by coincidence.
 */
function closesFor(inst: Instrument): number[] {
  const id = `${inst.key}:${inst.price}:${inst.dayPct}:${inst.year1Pct}`;
  const hit = cache.get(id);
  if (hit) return hit;

  const r = rng(inst.key);
  const sigma = inst.vol ?? 0.012 + r() * 0.012;
  // Tilted by this name's own year, so a compounder's decade looks like one.
  const cagr = clamp(5 + r() * 7 + inst.year1Pct * 0.25, 2, 34);
  const amplitude = 0.11 + r() * 0.15; // how far off trend the line may wander

  const n = DATES.length;
  const last = n - 2; // yesterday: today is appended from dayPct
  const walk: number[] = [0];
  for (let i = 1; i <= last; i++) walk.push(walk[i - 1] + gauss(r) * sigma);

  // Detrend the walk, then scale it, so it is deviation and nothing else.
  const dev = walk.map((v, i) => v - (walk[last] * i) / last);
  const reach = Math.max(...dev.map(Math.abs)) || 1;
  const scale = amplitude / reach;

  const perSession = Math.log(1 + cagr / 100) / YEAR;
  const logYesterday = Math.log(inst.price / (1 + inst.dayPct / 100));
  const logYearAgo = Math.log(inst.price / (1 + inst.year1Pct / 100));
  const trend = (i: number) => logYesterday - perSession * (last - i) + dev[i] * scale;

  // Bend the final year onto the one-year-ago level; everything older shifts
  // with it, which keeps the join continuous and the shape intact.
  const anchor = n - 1 - YEAR;
  const bend = logYearAgo - trend(anchor);

  const out: number[] = [];
  for (let i = 0; i <= last; i++) {
    const share = i >= anchor ? (last - i) / (last - anchor) : 1;
    out.push(Math.exp(trend(i) + bend * share));
  }
  out.push(inst.price);

  cache.set(id, out);
  return out;
}

/** The last `sessions` daily closes, for anything that needs a window of the
 *  history rather than one of the chart's ranges. */
export function dailyCloses(inst: Instrument, sessions: number): number[] {
  const daily = closesFor(inst);
  return daily.slice(Math.max(0, daily.length - sessions));
}

const OPEN = 9 * 60 + 30;
const CLOSE = 16 * 60;

function marks(stepMinutes: number): number[] {
  const out: number[] = [];
  for (let t = OPEN; t <= CLOSE; t += stepMinutes) out.push(t);
  return out;
}

function timeLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const h = h24 > 12 ? h24 - 12 : h24;
  return `${h}:${String(minutes % 60).padStart(2, "0")}`;
}

function dayLabel(date: Date, monthly: boolean): string {
  const month = date.toLocaleDateString("en-US", { month: "short" });
  if (monthly) return `${month} ’${String(date.getFullYear()).slice(2)}`;
  return `${month} ${date.getDate()}`;
}

/** One session, interpolated between the previous close and this one. */
function intraday(inst: Instrument, day: number, count: number): number[] {
  const daily = closesFor(inst);
  const from = Math.log(daily[day - 1]);
  const to = Math.log(daily[day]);
  const r = rng(`${inst.key}:${day}:${count}`);
  const sigma = (inst.vol ?? 0.014) * 0.32;

  const walk: number[] = [0];
  for (let i = 1; i < count; i++) walk.push(walk[i - 1] + gauss(r) * sigma);
  const slope = (to - from - walk[count - 1]) / (count - 1);
  return walk.map((v, i) => Math.exp(from + v + slope * i));
}

/** Every nth close back to `from`, always including both ends. */
function closeWindow(daily: number[], from: number, step: number): PriceWindow {
  const start = Math.max(0, from);
  const index: number[] = [];
  for (let i = daily.length - 1; i >= start; i -= step) index.unshift(i);
  if (index[0] !== start) index.unshift(start);
  const monthly = step >= 5;
  return {
    labels: index.map((i) => dayLabel(DATES[i], monthly)),
    values: index.map((i) => daily[i]),
  };
}

/** The first session of the current year, less one, so year-to-date is measured
 *  from the last close of the year before — which is what year-to-date means. */
function yearToDateStart(): number {
  const year = DATES[DATES.length - 1].getFullYear();
  const first = DATES.findIndex((d) => d.getFullYear() === year);
  return Math.max(0, first - 1);
}

export function priceWindow(inst: Instrument, range: RangeId): PriceWindow {
  const daily = closesFor(inst);
  const n = daily.length;

  if (range === "1d") {
    const times = marks(5);
    return {
      labels: times.map(timeLabel),
      values: intraday(inst, n - 1, times.length),
    };
  }

  if (range === "5d") {
    const times = marks(30);
    const labels: string[] = [];
    const values: number[] = [];
    for (let day = n - 5; day <= n - 1; day++) {
      const path = intraday(inst, day, times.length);
      const weekday = DATES[day].toLocaleDateString("en-US", { weekday: "short" });
      // Each day opens on the previous close, so skip that duplicate point.
      for (let i = day === n - 5 ? 0 : 1; i < path.length; i++) {
        labels.push(`${weekday} ${timeLabel(times[i])}`);
        values.push(path[i]);
      }
    }
    return { labels, values };
  }

  if (range === "1m") return closeWindow(daily, n - 23, 1);
  if (range === "6m") return closeWindow(daily, n - Math.round(YEAR / 2), 1);
  if (range === "ytd") return closeWindow(daily, yearToDateStart(), 1);
  if (range === "5y") return closeWindow(daily, n - YEAR * 5, 5);
  return closeWindow(daily, 0, 21);
}

/** The benchmark every security is drawn against.
 *
 *  Its one-year return comes from the book's monthly index series, so the
 *  comparison agrees with the portfolio chart on the home page. The day move is
 *  the one number the book does not carry for the index.
 */
export function sp500Instrument(): Instrument {
  const sp = book.performance.sp500;
  const last = sp[sp.length - 1];
  const yearAgo = sp[sp.length - 13];
  return {
    key: "SP500",
    price: last,
    dayPct: 0.32,
    year1Pct: (last / yearAgo - 1) * 100,
    vol: 0.0072,
  };
}
