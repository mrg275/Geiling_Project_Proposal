/** One symbol, two spellings.
 *
 *  EDGAR writes a share class with a dash and the brokers write it with a dot.
 *  Measured, not assumed: EDGAR's company index holds 532 dashed tickers and
 *  one dotted; Alpaca's asset list holds 512 dotted and none dashed. Twenty-four
 *  of EDGAR's dashed tickers are tradable symbols at Alpaca under the dotted
 *  spelling — BRK-B, BRK-A, BF-B, MOG-A, HEI-A, PBR-A, LEN-B and the rest.
 *
 *  Untranslated, that meant `/securities/BRK-B` rendered with no price, no
 *  chart and no 52-week range while the data sat one character away, and
 *  `/securities/BRK.B` — the spelling anyone would type — 404ed.
 *
 *  EDGAR's spelling is canonical inside the app, because EDGAR is what the URL,
 *  the search index and the filings are keyed by. The vendor spelling is
 *  produced at the edge of the vendor call and nowhere else; that translation
 *  lives in the adapter, which is the only place that knows what the vendor
 *  calls things.
 */

/** The app's canonical spelling: upper case, dots folded to dashes. */
export const edgarSymbol = (symbol: string) =>
  symbol.trim().toUpperCase().replace(/\./g, "-");

/** The spelling a broker is likelier to know, used only as a fallback when the
 *  asset list cannot be consulted. */
export const dottedSymbol = (symbol: string) => symbol.trim().toUpperCase().replace(/-/g, ".");
