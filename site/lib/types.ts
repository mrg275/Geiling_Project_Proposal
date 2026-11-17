/** Domain types for the portfolio interface.
 *
 *  These describe the shape the real data layer will have to produce. Right now
 *  they are satisfied by the invented dataset in `data.ts`; when a broker
 *  connection and a filings pipeline land, they produce the same shapes and
 *  nothing in the component tree changes.
 */

export type ConvictionId = string;

/** A holding in the book. */
export interface Position {
  ticker: string;
  name: string;
  /** Market value in USD. */
  value: number;
  /** Today's move, percent. */
  dayPct: number;
  /** Trailing 30 sessions, percent. Drives the row sparkline. */
  thirtyDayPct: number;
  /** Since purchase, percent. */
  totalPct: number;
  price: number;
  /** Convictions this position is held against. Empty means unassigned. */
  convictions: ConvictionId[];
}

/** Three indexed series, same length, one point per month. */
export interface Performance {
  portfolio: number[];
  sp500: number[];
  nasdaq100: number[];
}

/** One cumulative cause behind today's move. */
export interface DayTheme {
  headline: string;
  body: string;
  /** Contribution to today's P&L in USD. Signed. */
  dollars: number;
  tickers: string[];
}

/** An actionable idea, either an option structure or a position change. */
export interface ConvictionIdea {
  kind: string;
  ticker: string;
  body: string;
}

/** A stated belief, with the things that would prove it wrong. */
export interface Conviction {
  id: ConvictionId;
  short: string;
  title: string;
  /** Self-rated 1-10. */
  score: number;
  added: string;
  horizon: string;
  thesis: string;
  falsifiedBy: string;
  /** Market value of positions held against it, USD. */
  value: number;
  /** Share of the book, percent. */
  pct: number;
  tickers: string[];
  /** Mean pairwise correlation of its positions, or null below two positions. */
  correlation: number | null;
  correlationNote: string;
  /** Set when the book argues against the conviction. */
  tension?: string;
  ideas: ConvictionIdea[];
}

/** Part of the book held against no stated conviction. */
export interface Unassigned {
  value: number;
  pct: number;
  tickers: string[];
}

/** Square correlation matrix with its row/column labels. */
export interface CorrelationMatrix {
  tickers: string[];
  values: number[][];
}

/** A surfaced buy/sell/decide, scored against a conviction. */
export interface FlaggedIdea {
  kind: "Buy" | "Add" | "Trim" | "Decide";
  ticker: string;
  name: string;
  price: number;
  /** Move over `window`, percent. */
  move: number;
  window: string;
  conviction: ConvictionId;
  owned: boolean;
  why: string;
}

export interface Article {
  source: string;
  url: string;
  title: string;
  when: string;
  readingTime: string;
  convictions: ConvictionId[];
  deepDive?: boolean;
  why: string;
}

export interface TechMilestone {
  domain: string;
  when: string;
  source: string;
  title: string;
  why: string;
  convictions: ConvictionId[];
}

/** How a company actually earns, in two lengths.
 *
 *  Hand-written for the names in the sample universe, because a sector code is
 *  not an answer: "Electronic Computers" does not tell you that Apple sells
 *  phones. For every other ticker the same two fields are read out of the
 *  10-K's business section on a button press.
 */
export interface BusinessNote {
  /** A comps row's worth: what it does, in a handful of words. */
  does: string;
  /** How the money is made, in two or three sentences. */
  model: string;
}

/** A searchable security. Index funds carry nulls for the equity ratios. */
export interface UniverseEntry {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  dayPct: number;
  /** Market cap in USD billions. */
  marketCapB: number | null;
  forwardPE: number | null;
  evEbitda: number | null;
  /** Revenue growth, percent. */
  revGrowth: number | null;
  /** Trailing twelve months, percent. Drives the price chart's endpoint. */
  year1Pct: number;
}

export interface Stat {
  label: string;
  value: string;
  note?: string;
}

export interface IndustryRatio {
  label: string;
  value: string;
  why: string;
}

export interface Comp {
  ticker: string;
  marketCap: string;
  evEbitda: string;
  forwardPE: string;
  revGrowth: string;
  grossMargin: string;
  /** The subject of the page. */
  self?: boolean;
  /** The median row, which is not a company. */
  median?: boolean;
}

export interface PriceTarget {
  firm: string;
  target: number;
  rating: string;
  when: string;
  note: string;
}

export interface Filing {
  kind: "10-K" | "10-Q" | "Call";
  label: string;
  when: string;
  takeaways: string[];
}

/** An argument that is still unresolved and still moving the price. */
export interface Debate {
  question: string;
  state: string;
  why: string;
  watch: string;
}

export interface CannedAnswer {
  question: string;
  answer: string;
}

export interface Security {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  dayPct: number;
  dayAbs: number;
  low52: number;
  high52: number;
  nextCall: string;
  held: { value: number; weight: number; totalPct: number } | null;
  stats: Stat[];
  industryRatios: IndustryRatio[];
  comps: Comp[];
  targets: PriceTarget[];
  filings: Filing[];
  debates: Debate[];
  cannedChat: CannedAnswer[];
}

export interface Book {
  asOf: string;
  total: number;
  basis: number;
  totalPct: number;
  cash: number;
  positions: Position[];
  performance: Performance;
  dayThemes: DayTheme[];
  /** Prose for the day P&L that belongs to no theme. The figure itself is
   *  computed from the positions, so it cannot disagree with the total. */
  dayDriftNote: string;
  themeNote: string;
  convictions: Conviction[];
  unassigned: Unassigned;
  /** Caveats the exposure bar cannot show: double-counted names, convictions
   *  with nothing behind them. */
  exposureNote: string;
  correlationMatrix: CorrelationMatrix;
  pressureTestQuestions: string[];
  flagged: FlaggedIdea[];
  news: Article[];
  emergingTech: TechMilestone[];
  universe: UniverseEntry[];
  /** Keyed by ticker, for the stock header and the comps table alike. */
  businesses: Record<string, BusinessNote>;
  securities: Record<string, Security>;
}
