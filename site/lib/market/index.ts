/** Which source answers, and for how long its answer stands.
 *
 *  Everything the app asks about a price goes through here. Three rules:
 *
 *  1. **Live if there is a key, sample if there is not.** No branch in a page,
 *     no half-configured state: the app works either way and says which.
 *  2. **Cached by range, because the free plan's limit is the real ceiling.**
 *     An intraday window is worth re-asking in minutes; a ten-year monthly one
 *     is not worth re-asking today. Two hundred calls a minute is generous
 *     until a page fans out over a comps table, and then it is not.
 *  3. **A failed live call degrades to the sample with the failure in the
 *     note, and throws when there is no sample to fall back to.** Falling back
 *     silently would put invented prices on screen dressed as real ones. The
 *     earlier version of this file returned null in that case, which was its
 *     own version of the same sin: the sample book covers nineteen of 39,034
 *     symbols, so for every other symbol a 401 or a 429 reached the page as
 *     "this security has no price history". The reason now survives.
 */
import { DAY, HOUR, cachedNullable } from "@/lib/cache";
import { alpaca, hasAlpacaKeys } from "./alpaca";
import { sample } from "./sample";
import type { MarketSource, PriceHistory, Quote, RangeId, TradingStats } from "./types";

const HISTORY_TTL: Record<RangeId, number> = {
  "1d": 5 * 60,
  "5d": 5 * 60,
  "1m": HOUR,
  "6m": HOUR,
  ytd: HOUR,
  "5y": DAY,
  all: DAY,
};

const QUOTE_TTL = 5 * 60;

/** The live source, or null when no key is configured. */
export function liveSource(): MarketSource | null {
  return hasAlpacaKeys() ? alpaca : null;
}

export const isLive = () => liveSource() !== null;

const reason = (error: unknown) =>
  error instanceof Error ? error.message : "The market-data source is unreachable.";

/** The sample's answer, labelled with why the live one is missing — or the
 *  failure itself, when there is no sample answer to label. */
function degradedOrThrow<T extends { provenance: { note: string } }>(
  value: T | null,
  error: unknown,
): T {
  if (!value) throw error instanceof Error ? error : new Error(reason(error));
  return {
    ...value,
    provenance: { ...value.provenance, note: `${reason(error)} Showing sample prices instead.` },
  };
}

export async function priceHistory(symbol: string, range: RangeId): Promise<PriceHistory | null> {
  const live = liveSource();
  if (live) {
    try {
      const hit = await cachedNullable(`market:bars:v2:${symbol}:${range}`, HISTORY_TTL[range], () =>
        live.history(symbol, range),
      );
      if (hit) return hit;
    } catch (error) {
      return degradedOrThrow(await sample.history(symbol, range), error);
    }
  }
  return sample.history(symbol, range);
}

export async function quoteFor(symbol: string): Promise<Quote | null> {
  const live = liveSource();
  if (live) {
    try {
      const hit = await cachedNullable(`market:quote:v2:${symbol}`, QUOTE_TTL, () =>
        live.quote(symbol),
      );
      if (hit) return hit;
    } catch (error) {
      return degradedOrThrow(await sample.quote(symbol), error);
    }
  }
  return sample.quote(symbol);
}

export async function tradingStats(symbol: string): Promise<TradingStats | null> {
  const live = liveSource();
  if (live) {
    try {
      const hit = await cachedNullable(`market:stats:v2:${symbol}`, 6 * HOUR, () =>
        live.stats(symbol),
      );
      if (hit) return hit;
    } catch (error) {
      return degradedOrThrow(await sample.stats(symbol), error);
    }
  }
  return sample.stats(symbol);
}

export * from "./types";
