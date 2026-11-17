/** The search universe.
 *
 *  Every EDGAR registrant with a ticker, in one 180KB file: 10,400 rows. This
 *  is the whole of the search feature's data dependency — no key, no quota, no
 *  vendor.
 *
 *  Two things in that file do more work than they look like they should:
 *
 *  - **Row order is a size ranking.** The file opens AAPL, NVDA, MSFT, GOOGL,
 *    AMZN, AVGO, META, TSLA — Micron sits at row 14, Microchip at 450,
 *    Microalgo at 5,556. Nothing documents this, so it is treated as a hint and
 *    not as truth: it only breaks ties between equally good text matches, which
 *    is enough to put Microsoft above Microalgo when someone types "micro".
 *  - **The exchange column separates listings from the OTC tail.** A quarter of
 *    the rows are OTC, and they are almost never what someone searching for a
 *    company means.
 */
import { DAY, cached } from "@/lib/cache";
import { padCik, secJson } from "./client";

const TICKERS_URL = "https://www.sec.gov/files/company_tickers_exchange.json";
/** Funds and ETFs live in their own index, keyed by series and class rather
 *  than by company. VOO is not in the file above — which made a holding in this
 *  very book unsearchable — and nor are QQQ, VTI or ARKK. SPY is, because it is
 *  a unit investment trust and files like a company. */
const FUNDS_URL = "https://www.sec.gov/files/company_tickers_mf.json";

interface RawFile {
  fields: string[];
  data: (string | number | null)[][];
}

export interface Registrant {
  ticker: string;
  /** Zero-padded, ready for API paths. */
  cik: string;
  /** Empty for funds: EDGAR's fund index carries tickers and no names. */
  name: string;
  /** "Nasdaq", "NYSE", "OTC", "CBOE", "TXSE", "Fund", or null for unlisted. */
  exchange: string | null;
  /** Position in EDGAR's file. Lower is bigger; see the note above. */
  rank: number;
}

export const isFund = (r: Registrant | null) => r?.exchange === "Fund";

export async function registrants(): Promise<Registrant[]> {
  return cached("sec:tickers:v4", DAY, async () => {
    const raw = await secJson<RawFile>(TICKERS_URL);
    const col = {
      cik: raw.fields.indexOf("cik"),
      name: raw.fields.indexOf("name"),
      ticker: raw.fields.indexOf("ticker"),
      exchange: raw.fields.indexOf("exchange"),
    };
    return raw.data.map((row, index) => ({
      ticker: String(row[col.ticker] ?? "").toUpperCase(),
      cik: padCik(String(row[col.cik] ?? "")),
      name: titleCase(String(row[col.name] ?? "")),
      exchange: (row[col.exchange] as string | null) ?? null,
      rank: index,
    }));
  });
}

/** Every fund and ETF share class with a ticker: 28,600 of them.
 *
 *  The file is one row per share class — the same fund appears under five
 *  tickers — and carries no names at all, only CIK, series, class and symbol.
 *  So a fund resolves and is searchable, and its name comes from wherever one
 *  exists: the book for the names it knows, EDGAR's registrant name otherwise,
 *  which for an ETF is the trust that files rather than the fund itself.
 */
export async function fundTickers(): Promise<Registrant[]> {
  return cached("sec:funds:v1", DAY, async () => {
    const raw = await secJson<RawFile>(FUNDS_URL);
    const col = { cik: raw.fields.indexOf("cik"), symbol: raw.fields.indexOf("symbol") };
    const seen = new Set<string>();
    const out: Registrant[] = [];
    for (const row of raw.data) {
      const ticker = String(row[col.symbol] ?? "")
        .toUpperCase()
        .trim();
      if (!ticker || seen.has(ticker)) continue;
      seen.add(ticker);
      out.push({
        ticker,
        cik: padCik(String(row[col.cik] ?? "")),
        name: "",
        exchange: "Fund",
        // The fund file is not sorted by size, so every fund shares one rank:
        // below the listed companies, above the OTC tail.
        rank: 12_000,
      });
    }
    return out;
  });
}

/** Companies first, then funds: a ticker that is both resolves to the company,
 *  which is the one with filings to read. */
async function universe(): Promise<Registrant[]> {
  const [companies, funds] = await Promise.all([registrants(), fundTickers()]);
  return [...companies, ...funds];
}

/** How many tickers are searchable, so the UI does not hardcode a number that
 *  changes every time EDGAR publishes the file. */
export async function universeSize(): Promise<number> {
  return (await universe()).length;
}

/** How many tickers a registrant has in EDGAR's company index.
 *
 *  A CIK appearing more than once has more than one listing — HEI/HEI-A,
 *  FOXA/FOX, BRK-A/BRK-B, and Alphabet's four (GOOG, GOOGL, GOOGM, GOOGN).
 *  That matters for a market cap: the cover-page share count is reported per
 *  class and dimensioned, and companyconcept returns only undimensioned facts,
 *  so the count on hand may describe one listing rather than the company. The
 *  page says when that is possible rather than quietly multiplying.
 */
export async function listedTickers(cik: string): Promise<number> {
  const companies = await registrants();
  return new Set(companies.filter((r) => r.cik === cik).map((r) => r.ticker)).size || 1;
}

export async function resolve(ticker: string): Promise<Registrant | null> {
  const symbol = ticker.trim().toUpperCase();
  if (!symbol) return null;
  const all = await universe();
  // A ticker can appear twice across registrants; the better-ranked row wins.
  const matches = all.filter((r) => r.ticker === symbol);
  if (matches.length === 0) return null;
  return matches.sort((a, b) => a.rank - b.rank)[0];
}

export interface SearchHit extends Registrant {
  score: number;
}

/** How much a listing venue counts against a result. OTC names are real, and
 *  still findable by exact ticker — they just lose ties on a name fragment. */
function venuePenalty(exchange: string | null): number {
  if (exchange === "Nasdaq" || exchange === "NYSE") return 0;
  if (exchange === "CBOE" || exchange === "TXSE") return 20;
  if (exchange === "Fund") return 35; // findable by ticker, rarely by fragment
  return 90; // OTC, or unlisted
}

/** Rank by how a person actually types: the exact ticker first, then tickers
 *  that start with the query, then company names — with size breaking ties. */
export async function search(query: string, limit = 20): Promise<SearchHit[]> {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  // A share class is "BRK-B" in EDGAR's index and "BRK.B" everywhere a person
  // has ever seen it, so a ticker typed either way has to match. Only the
  // ticker tests use this form; a name fragment containing a dot is left as
  // typed.
  const qTicker = q.replace(/\./g, "-");
  const all = await universe();
  const hits: SearchHit[] = [];

  for (const r of all) {
    const name = r.name.toUpperCase();
    let base = 0;
    if (r.ticker === q || r.ticker === qTicker) base = 1000;
    else if (r.ticker.startsWith(q) || r.ticker.startsWith(qTicker))
      base = 520 - (r.ticker.length - qTicker.length) * 6;
    else if (name.startsWith(q)) base = 320;
    else if (name.includes(` ${q}`)) base = 240;
    else if (r.ticker.includes(q)) base = 160;
    else if (name.includes(q)) base = 120;
    if (base <= 0) continue;

    // Log, not linear: the gap between rank 2 and rank 14 should matter much
    // less than the gap between rank 14 and rank 5,000.
    const score = base - Math.log1p(r.rank) * 12 - venuePenalty(r.exchange);
    hits.push({ ...r, score });
  }

  hits.sort((a, b) => b.score - a.score || a.ticker.localeCompare(b.ticker));

  // One row per ticker. A handful of tickers sit in both the company and the
  // fund index (IA, SPCX), and two rows linking to the same page — one of them
  // mislabelled — is a worse answer than one. `resolve()` already picks the
  // better-ranked row; this keeps search agreeing with it.
  const seen = new Set<string>();
  const unique = hits.filter((hit) => {
    if (seen.has(hit.ticker)) return false;
    seen.add(hit.ticker);
    return true;
  });
  return unique.slice(0, limit);
}

/** EDGAR stores names shouted — "NVIDIA CORP", "ELI LILLY & Co" — and a page
 *  headline should not shout back.
 *
 *  Two rules, both arrived at by being wrong first:
 *
 *  1. **Keeping a word because it equals the ticker was wrong.** It is right
 *     for ASML and wrong for GAP, POOL, BOX, FIVE, HOPE and 344 other rows
 *     whose ticker is an ordinary English word, and nothing in the name
 *     distinguishes the two. Nothing can: brand casing needs a list, so there
 *     is a list, curated from the shouted initialisms that actually appear
 *     among EDGAR's largest registrants. Everything not on it gets cased, on
 *     the principle that "Gap Inc" misreads less than "GAP Inc".
 *  2. **Bailing out on the first lowercase letter was wrong.** It meant one
 *     "Co" exempted the whole string, so "ELI LILLY & Co" and "CVS HEALTH
 *     Corp" went through untouched. A name is treated as EDGAR's when two or
 *     more of its words are shouted, which a filer who typed its own name
 *     mixed-case does not trip.
 */
const ACRONYMS = new Set([
  // Suffixes and instrument types.
  "AG", "SA", "NV", "SE", "PLC", "LP", "LLC", "ETF", "REIT", "USA", "UK", "ADR",
  "III", "IV", "VI", "SPDR",
  // Initialisms, from a scan of the 600 largest rows in EDGAR's own index.
  "SK", "ASML", "HSBC", "SAP", "RTX", "GE", "BHP", "TJX", "UBS", "BP", "CME",
  "CVS", "PDD", "HCA", "GSK", "CSX", "ING", "PNC", "KKR", "EOG", "SLB", "RELX",
  "NXP", "CRH", "TE", "MPLX", "MSCI", "WEC", "CBRE", "TKO", "EQT", "DTE", "ASE",
  "IBM", "ADP", "UPS", "AIG", "AES", "HP", "3M",
]);

/** A word carrying two or more capitals and no lower case: EDGAR's doing. */
const SHOUTED = /^[^a-z]*[A-Z]{2,}[^a-z]*$/;

function caseWord(word: string): string {
  const bare = word.replace(/[^a-z]/gi, "").toUpperCase();
  if (bare.length > 1 && ACRONYMS.has(bare)) return word.toUpperCase();
  if (/^[a-z](\.[a-z])+\.?$/i.test(word)) return word.toUpperCase();
  // Capitalise every letter-run, not just the first: "s&p 500" has to read
  // "S&P 500". A run straight after an apostrophe is left alone, so
  // "mcdonald's" does not come back as "Mcdonald'S".
  const lower = word.toLowerCase();
  return lower.replace(/[a-z]+/g, (run, at: number) => {
    const before = at > 0 ? lower[at - 1] : "";
    if (before === "'" || before === "\u2019") return run;
    return run.charAt(0).toUpperCase() + run.slice(1);
  });
}

export function titleCase(s: string): string {
  const words = s.split(/\s+/);
  const shouted = words.filter(
    (w) => SHOUTED.test(w) && w.replace(/[^A-Za-z]/g, "").length > 1,
  ).length;
  // One shouted word in an otherwise mixed-case name is the filer's own
  // styling — "SK hynix Inc.", "T-Mobile US, Inc." — and is left alone.
  if (shouted < 2) return s;
  return words.map(caseWord).join(" ");
}
