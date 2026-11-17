/** Price history for one symbol and one range.
 *
 *  A GET, unlike the AI routes: bars cost nothing, the response is cached, and
 *  the range control needs to switch without a page navigation. The source
 *  behind it may be Alpaca or the sample generator — the response says which,
 *  and the chart prints it.
 */
import { priceHistory, rangeById } from "@/lib/market";
import { edgarSymbol } from "@/lib/market/symbols";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  // Canonical spelling, so "BRK.B" and "BRK-B" are one symbol and one cache
  // entry rather than one 404 and one chart.
  const symbol = edgarSymbol(params.get("symbol") ?? "");
  const range = rangeById(params.get("range") ?? "");

  if (!/^[A-Z][A-Z.\-]{0,9}$/.test(symbol) || !range) {
    return Response.json({ error: "A symbol and a known range are required." }, { status: 400 });
  }

  try {
    const history = await priceHistory(symbol, range.id);
    if (!history) {
      return Response.json(
        { error: `No price history for ${symbol} over ${range.label}.` },
        { status: 404 },
      );
    }
    return Response.json(history, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The price source failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
