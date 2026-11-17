/** What to call a security, given three sources that each know different things.
 *
 *  - **EDGAR** names the registrant, which is right for a company and wrong for
 *    a fund: VOO's registrant is "Vanguard Index Funds", the trust that files,
 *    not the ETF anyone is looking for. For funds it is also usually absent —
 *    EDGAR's fund index carries tickers and no names at all.
 *  - **The broker** names the tradable instrument: "Vanguard S&P 500 ETF". Best
 *    for funds, wordier than EDGAR for companies ("Apple Inc. Common Stock").
 *  - **The book** names the handful this project already knew about.
 *
 *  So the order of preference depends on which kind of thing it is, and an
 *  empty string is a real answer — the UI says "fund or ETF" rather than
 *  printing the ticker twice.
 */
import { book } from "@/lib/data";
import { assetNames, hasAlpacaKeys } from "@/lib/market/alpaca";
import { titleCase } from "@/lib/sec/tickers";

export function bookName(ticker: string): string | null {
  return (
    book.universe.find((u) => u.ticker === ticker)?.name ??
    book.positions.find((p) => p.ticker === ticker)?.name ??
    null
  );
}

/** Broker names, or nothing at all: search must never fail over a nicety. */
export async function brokerNames(): Promise<Record<string, string>> {
  if (!hasAlpacaKeys()) return {};
  try {
    return await assetNames();
  } catch {
    return {};
  }
}

export function securityName(source: {
  ticker: string;
  edgar?: string | null;
  broker?: string | null;
  fund?: boolean;
}): string {
  // EDGAR shouts its names, and the page headline should not.
  const edgar = titleCase((source.edgar ?? "").trim());
  const broker = (source.broker ?? "").trim();
  const known = bookName(source.ticker) ?? "";
  const ordered = source.fund ? [broker, known, edgar] : [edgar, broker, known];
  return ordered.find((name) => name.length > 0) ?? "";
}
