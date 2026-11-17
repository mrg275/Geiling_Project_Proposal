import { brokerNames, securityName } from "@/lib/securities/name";
import { SecError } from "@/lib/sec/client";
import { search, universeSize } from "@/lib/sec/tickers";

/** Typeahead over every EDGAR registrant with a ticker.
 *
 *  The index is one cached file, so this is cheap enough to call on every
 *  keystroke; the 5-minute edge cache below is belt and braces.
 */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  if (!query.trim()) return Response.json({ hits: [] });

  try {
    // The broker's asset list fills in the names EDGAR has none of — every
    // fund and ETF. It is cached for a day and skipped entirely without keys.
    const limit = 20;
    const [hits, broker, total] = await Promise.all([
      search(query, limit),
      brokerNames(),
      universeSize(),
    ]);
    return Response.json(
      {
        total,
        // A full page of hits means the list was cut, and the header should not
        // read "20 of 39,034" as though twenty were all there were.
        truncated: hits.length >= limit,
        hits: hits.map((hit) => ({
          ticker: hit.ticker,
          cik: hit.cik,
          exchange: hit.exchange,
          name: securityName({
            ticker: hit.ticker,
            edgar: hit.name,
            broker: broker[hit.ticker],
            fund: hit.exchange === "Fund",
          }),
        })),
      },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } },
    );
  } catch (error) {
    const message =
      error instanceof SecError
        ? error.message
        : "Could not reach EDGAR. The ticker index is unavailable.";
    // 503, not 500: the app is fine, the upstream is not, and the UI says so.
    return Response.json({ hits: [], error: message }, { status: 503 });
  }
}
