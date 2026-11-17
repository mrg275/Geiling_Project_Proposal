/** Company identity and filing history, from EDGAR's submissions endpoint.
 *
 *  This is what makes the equity page real for any ticker: the legal name, the
 *  exchange, the SIC industry code that drives which ratios matter, and direct
 *  URLs to the last 10-K, 10-Q and earnings release.
 */
import { HOUR, cached } from "@/lib/cache";
import { secJson } from "./client";

export interface Filing {
  /** "10-K", "10-Q", "8-K", … */
  form: string;
  /** ISO date the filing was accepted. */
  filed: string;
  /** ISO date the period ended, when the form has one. */
  period: string | null;
  /** With dashes: 0001045810-26-000021 */
  accession: string;
  /** The primary document itself. */
  url: string;
  /** EDGAR's filing index page, which lists every exhibit. */
  indexUrl: string;
  /** 8-K item numbers, e.g. "2.02,9.01". */
  items: string | null;
}

export interface Company {
  cik: string;
  name: string;
  tickers: string[];
  exchanges: string[];
  sic: string;
  industry: string;
  fiscalYearEnd: string | null;
  latest10K: Filing | null;
  latest10Q: Filing | null;
  /** The 8-K carrying Item 2.02, "Results of Operations" — the earnings release. */
  latestEarnings: Filing | null;
  recent: Filing[];
}

interface RawSubmissions {
  cik: string;
  name: string;
  tickers?: string[];
  exchanges?: string[];
  sic?: string;
  sicDescription?: string;
  fiscalYearEnd?: string;
  filings: {
    recent: {
      form: string[];
      filingDate: string[];
      reportDate: string[];
      accessionNumber: string[];
      primaryDocument: string[];
      items: string[];
    };
  };
}

export async function company(cik: string): Promise<Company> {
  return cached(`sec:submissions:${cik}`, 6 * HOUR, async () => {
    const raw = await secJson<RawSubmissions>(
      `https://data.sec.gov/submissions/CIK${cik}.json`,
    );
    const bare = String(Number(cik)); // Archives paths use the unpadded CIK
    const r = raw.filings.recent;

    const recent: Filing[] = r.form.map((form, i) => {
      const accession = r.accessionNumber[i];
      const flat = accession.replace(/-/g, "");
      return {
        form,
        filed: r.filingDate[i],
        period: r.reportDate[i] || null,
        accession,
        url: `https://www.sec.gov/Archives/edgar/data/${bare}/${flat}/${r.primaryDocument[i]}`,
        indexUrl: `https://www.sec.gov/Archives/edgar/data/${bare}/${flat}/${accession}-index.htm`,
        items: r.items[i] || null,
      };
    });

    const newestOf = (predicate: (f: Filing) => boolean) =>
      recent.filter(predicate).sort((a, b) => b.filed.localeCompare(a.filed))[0] ?? null;

    return {
      cik,
      name: raw.name,
      tickers: raw.tickers ?? [],
      exchanges: raw.exchanges ?? [],
      sic: raw.sic ?? "",
      industry: raw.sicDescription ?? "",
      fiscalYearEnd: raw.fiscalYearEnd ?? null,
      latest10K: newestOf((f) => f.form === "10-K"),
      latest10Q: newestOf((f) => f.form === "10-Q"),
      // Item 2.02 is "Results of Operations and Financial Condition", which is
      // how you find the earnings release among dozens of unrelated 8-Ks.
      latestEarnings: newestOf((f) => f.form === "8-K" && (f.items ?? "").includes("2.02")),
      recent: recent.slice(0, 40),
    };
  });
}

/** The filings the research page shows, newest first, with nulls dropped. */
export function keyFilings(c: Company): Filing[] {
  return [c.latest10K, c.latest10Q, c.latestEarnings].filter((f): f is Filing => f !== null);
}

/** A human label for a filing, since EDGAR gives only the form type. */
export function filingLabel(f: Filing): string {
  if (f.form === "10-K") return `Annual report${f.period ? `, FY ending ${f.period}` : ""}`;
  if (f.form === "10-Q") return `Quarterly report${f.period ? `, quarter ending ${f.period}` : ""}`;
  if (f.form === "8-K") return "Earnings release";
  return f.form;
}
