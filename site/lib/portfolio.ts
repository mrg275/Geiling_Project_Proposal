/** Figures derived from the book.
 *
 *  Everything the interface shows about totals runs through here, so the hero
 *  number and the sum of the rows underneath it cannot drift apart.
 */
import { book } from "./data";
import type { Article, Conviction, ConvictionId, Position } from "./types";

/** Today's move on a position, in dollars, backed out of its percent move. */
export const dayDollars = (p: Position) => p.value - p.value / (1 + p.dayPct / 100);

/** Share of the book, percent. */
export const weight = (p: Position) => (p.value / book.total) * 100;

/** Book-level day and lifetime P&L, summed from the positions themselves. */
export function bookTotals() {
  const day = book.positions.reduce((acc, p) => acc + dayDollars(p), 0);
  const prior = book.total - day;
  return {
    day,
    dayPct: (day / prior) * 100,
    gain: book.total - book.basis,
  };
}

/** The part of today's move no theme claims.
 *
 *  Derived, so the three themes plus this residual always add up to the figure
 *  in the tile. Authoring it by hand let a rounding cent put the rows a dollar
 *  away from the total they were explaining.
 */
export function dayDrift() {
  const themed = book.dayThemes.reduce((acc, t) => acc + t.dollars, 0);
  return bookTotals().day - themed;
}

export const convictionById = (id: ConvictionId): Conviction | undefined =>
  book.convictions.find((c) => c.id === id);

export const convictionName = (id: ConvictionId): string => convictionById(id)?.short ?? id;

/** Convictions with money behind them, largest first. */
export const fundedConvictions = (): Conviction[] =>
  book.convictions.filter((c) => c.pct > 0).sort((a, b) => b.pct - a.pct);

export const positionsFor = (id: ConvictionId): Position[] =>
  book.positions.filter((p) => p.convictions.includes(id));

export const articlesFor = (id: ConvictionId): Article[] =>
  book.news.filter((a) => a.convictions.includes(id));

export const positionsByValue = (): Position[] =>
  [...book.positions].sort((a, b) => b.value - a.value);

export const isHeld = (ticker: string) => book.positions.some((p) => p.ticker === ticker);

export const positionFor = (ticker: string) => book.positions.find((p) => p.ticker === ticker);
