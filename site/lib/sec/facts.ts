/** Shares outstanding, which is the other half of a market cap.
 *
 *  A live price alone does not fix a stale market cap — it needs a share count,
 *  and the share count is free from EDGAR's XBRL API. Three tags carry it,
 *  because no single one covers every filer:
 *
 *  1. `dei:EntityCommonStockSharesOutstanding` — the cover-page count, the
 *     closest thing to today. Apple, NVIDIA and Micron all report it.
 *  2. `us-gaap:CommonStockSharesOutstanding` — the balance-sheet-date count.
 *     Usually the consolidated total, so it is the one that works for
 *     multi-class filers: Alphabet reports its cover-page count per share
 *     class, and companyconcept returns only facts carrying no dimensions, so
 *     tag 1 is a 404 there while this one returns 12.29bn.
 *  3. `us-gaap:WeightedAverageNumberOfDilutedSharesOutstanding` — an average
 *     over a period rather than a count on a date, so it is the last resort and
 *     is labelled as what it is.
 *
 *  **All three are read, and then the answer is validated**, because taking the
 *  first tag that answers printed figures that were plainly wrong:
 *
 *    - Fox's only undimensioned `dei` fact is `{"end":"2019-03-18","val":1}` —
 *      one share, seven years old — and its `us-gaap` equivalent 404s. The page
 *      read "Market cap $0B".
 *    - HEICO's `dei` facts stop in 2015 at 26.9m shares while `us-gaap` has
 *      55.1m as of 2025-10-31. The page read $9.06B against a real ~$46B.
 *    - Berkshire's dashed B class produced "1m shares, 10-Q 2011-04-29".
 *
 *  So a candidate must be recent and plausible, and if none is, the answer is
 *  no answer. A wrong market cap is worse than a blank one: the blank says it
 *  does not know.
 */
import { HOUR, cached } from "@/lib/cache";
import { SecError, secJson } from "./client";
import { listedTickers } from "./tickers";

interface ConceptFact {
  end: string;
  start?: string;
  val: number;
  form?: string;
  filed?: string;
}

interface ConceptResponse {
  units?: Record<string, ConceptFact[]>;
}

export interface ShareCount {
  shares: number;
  /** The date the count is as of. */
  asOf: string;
  /** The form it came from, for the provenance line. */
  form: string;
  /** Which tag answered, since they do not mean quite the same thing. */
  tag: string;
  /** True for the weighted-average fallback, which is an average, not a count. */
  average: boolean;
  /** How many tickers this registrant has in EDGAR's index. More than one
   *  means an undimensioned share count may describe one listing rather than
   *  the company — the cover-page count is reported per class and dimensioned,
   *  and companyconcept drops dimensioned facts. Alphabet has four (GOOG,
   *  GOOGL, GOOGM, GOOGN), which is why this counts tickers and not classes:
   *  tickers are what can actually be counted here. */
  tickers: number;
}

const TAGS: { taxonomy: string; tag: string; average: boolean }[] = [
  { taxonomy: "dei", tag: "EntityCommonStockSharesOutstanding", average: false },
  { taxonomy: "us-gaap", tag: "CommonStockSharesOutstanding", average: false },
  { taxonomy: "us-gaap", tag: "WeightedAverageNumberOfDilutedSharesOutstanding", average: true },
];

/** Older than this and it is history, not a share count. Fifteen months, so a
 *  filer who has missed a quarter still counts but 2015 does not. */
const MAX_AGE_DAYS = 450;

/** Below this it is a placeholder, not a company. Fox filed `1`. */
const MIN_PLAUSIBLE_SHARES = 100_000;

/** The newest fact from an annual or quarterly report.
 *
 *  Where two facts share an end date — which happens constantly, because a
 *  10-Q reports both the quarter and the year so far — the shorter period wins,
 *  since that is the one that describes the period rather than the run-up to it.
 */
function newest(facts: ConceptFact[]): ConceptFact | null {
  const usable = facts.filter((f) => f.form === "10-K" || f.form === "10-Q");
  if (usable.length === 0) return null;
  const span = (f: ConceptFact) =>
    f.start ? new Date(f.end).getTime() - new Date(f.start).getTime() : 0;
  return usable.sort(
    (a, b) =>
      a.end.localeCompare(b.end) || span(b) - span(a) || (a.filed ?? "").localeCompare(b.filed ?? ""),
  )[usable.length - 1];
}

async function candidate(
  cik: string,
  spec: (typeof TAGS)[number],
): Promise<Omit<ShareCount, "tickers"> | null> {
  let data: ConceptResponse;
  try {
    data = await secJson<ConceptResponse>(
      `https://data.sec.gov/api/xbrl/companyconcept/CIK${cik}/${spec.taxonomy}/${spec.tag}.json`,
    );
  } catch (error) {
    // A filer that does not report this tag is a 404, which is an answer, not
    // a failure.
    if (error instanceof SecError && error.status === 404) return null;
    throw error;
  }

  const hit = newest(data.units?.shares ?? []);
  if (!hit) return null;
  return {
    shares: hit.val,
    asOf: hit.end,
    form: hit.form ?? "",
    tag: `${spec.taxonomy}:${spec.tag}`,
    average: spec.average,
  };
}

export async function sharesOutstanding(cik: string): Promise<ShareCount | null> {
  if (!/^\d{10}$/.test(cik)) return null;

  // v3: the derivation changed from first-tag-wins to validated-best, and then
  // the payload's `classes` became `tickers`. Either change alone would have
  // left the old key serving yesterday's answer for half a day — the second
  // silently, since a renamed field reads as undefined rather than failing.
  return cached(`sec:shares:v3:${cik}`, 12 * HOUR, async () => {
    const [found, tickers] = await Promise.all([
      Promise.all(TAGS.map((spec) => candidate(cik, spec))),
      listedTickers(cik).catch(() => 1),
    ]);

    const cutoff = Date.now() - MAX_AGE_DAYS * 864e5;
    const usable = found.filter(
      (c): c is Omit<ShareCount, "tickers"> =>
        c !== null && c.shares >= MIN_PLAUSIBLE_SHARES && new Date(c.asOf).getTime() >= cutoff,
    );
    if (usable.length === 0) return null;

    // Newest wins, but an exact count gets a quarter's grace against an
    // average: a count from last quarter describes the company better than a
    // diluted average from last month, and worse than one from this quarter.
    const effective = (c: Omit<ShareCount, "tickers">) =>
      new Date(c.asOf).getTime() + (c.average ? 0 : 90 * 864e5);
    usable.sort((a, b) => effective(b) - effective(a));

    return { ...usable[0], tickers };
  });
}
