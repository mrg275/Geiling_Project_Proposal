/** Does the live market-data connection work?
 *
 *  One call to run after pasting keys in, because "the chart still says sample"
 *  has several possible causes and guessing between them is miserable. This
 *  asks Alpaca directly rather than going through the selector, so a bad key
 *  reports itself instead of being papered over by the sample fallback.
 *
 *  It never echoes a key — only whether one is set, which feed it reached, and
 *  what it got back.
 */
import { alpaca, assetNames, hasAlpacaKeys, negotiatedFeeds } from "@/lib/market/alpaca";

export async function GET() {
  if (!hasAlpacaKeys()) {
    return Response.json({
      ok: false,
      keys: false,
      message:
        "ALPACA_KEY_ID and ALPACA_SECRET_KEY are not set, so the app is using its sample " +
        "generator. Add both to .env.local and restart the dev server.",
    });
  }

  const started = Date.now();
  try {
    // Both feeds, because they are negotiated separately and the price and the
    // timestamp can come from different ones: reporting only the feed that
    // supplied the price made this route answer a question it was not asked.
    const [quote, feeds] = await Promise.all([alpaca.quote("SPY"), negotiatedFeeds()]);
    let assets: number | string;
    try {
      assets = Object.keys(await assetNames()).length;
    } catch (error) {
      // The asset list is on the trading API, which is host-specific: paper
      // keys only work against the paper host. Names degrade, prices do not.
      assets = error instanceof Error ? error.message : "unavailable";
    }

    return Response.json({
      ok: Boolean(quote),
      keys: true,
      feeds,
      feed: quote?.provenance.feed ?? null,
      delayed: quote?.provenance.delayed ?? null,
      spy: quote ? { price: quote.price, dayPct: quote.dayPct, at: quote.at } : null,
      namedSymbols: assets,
      ms: Date.now() - started,
      message: quote
        ? `Live. ${quote.provenance.note}`
        : "The key works but SPY returned no snapshot, which should not happen.",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        keys: true,
        ms: Date.now() - started,
        error: error instanceof Error ? error.message : "The market-data source failed.",
      },
      { status: 502 },
    );
  }
}
