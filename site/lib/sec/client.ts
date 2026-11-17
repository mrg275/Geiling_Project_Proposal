/** EDGAR HTTP client.
 *
 *  Two things are load-bearing and were both verified against the live service:
 *
 *  1. A declared User-Agent. A bare one returns 403 "Request Rate Threshold
 *     Exceeded" on the first request; the same request with a UA carrying a
 *     contact address returns 200. The SEC asks for a contact so they can reach
 *     whoever is hammering them, so SEC_USER_AGENT is a real setting, not
 *     boilerplate.
 *  2. Staying under the published 10 requests/second. The limiter below is
 *     per-process, which is enough while this runs as one app; a fleet would
 *     need the budget held somewhere shared.
 */

const SEC_RPS = 5; // half the published ceiling, because being throttled costs more than being slow

let windowStart = 0;
let windowCount = 0;

async function throttle() {
  const now = Date.now();
  if (now - windowStart >= 1000) {
    windowStart = now;
    windowCount = 0;
  }
  if (windowCount >= SEC_RPS) {
    const wait = 1000 - (now - windowStart);
    await new Promise((r) => setTimeout(r, Math.max(wait, 10)));
    return throttle();
  }
  windowCount += 1;
}

export class SecError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
  ) {
    super(message);
    this.name = "SecError";
  }
}

function userAgent(): string {
  const ua = process.env.SEC_USER_AGENT;
  if (ua && ua.trim()) return ua.trim();
  if (process.env.NODE_ENV === "production") {
    throw new SecError(
      "SEC_USER_AGENT is not set. EDGAR refuses undeclared clients. Set it to " +
        '"YourApp/0.1 (you@example.com)" in the environment.',
      0,
      "",
    );
  }
  // Local dev only, so the app runs before anything is configured. Replace it:
  // the address below is a placeholder, not a contact anyone reads.
  return "ConvictionDev/0.1 (dev-contact@example.com)";
}

/** GET a JSON document from EDGAR, with one retry on a throttle response. */
export async function secJson<T>(url: string, attempt = 0): Promise<T> {
  await throttle();
  const res = await fetch(url, {
    headers: {
      "User-Agent": userAgent(),
      "Accept-Encoding": "gzip, deflate",
      Accept: "application/json",
    },
    // We do our own caching; Next's fetch cache would duplicate it and has a
    // 2MB per-entry ceiling that companyfacts documents can exceed.
    cache: "no-store",
  });

  if (res.status === 403 || res.status === 429) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      return secJson<T>(url, attempt + 1);
    }
    throw new SecError(
      `EDGAR throttled this client (${res.status}). Check SEC_USER_AGENT carries a contact address.`,
      res.status,
      url,
    );
  }
  if (!res.ok) throw new SecError(`EDGAR returned ${res.status}`, res.status, url);
  return (await res.json()) as T;
}

/** GET a filing document as text (HTML or plain). */
export async function secText(url: string): Promise<string> {
  await throttle();
  const res = await fetch(url, {
    headers: { "User-Agent": userAgent(), "Accept-Encoding": "gzip, deflate" },
    cache: "no-store",
  });
  if (!res.ok) throw new SecError(`EDGAR returned ${res.status}`, res.status, url);
  return res.text();
}

/** EDGAR wants the CIK zero-padded to ten digits in API paths. */
export const padCik = (cik: number | string) => String(cik).replace(/\D/g, "").padStart(10, "0");
