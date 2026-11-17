/** A tiny read-through cache.
 *
 *  Every external call in this app writes the cache before anything reads it.
 *  The free data tiers are small enough that an uncached page is one refresh
 *  from a 429, and the paid ones spend real credits per call.
 *
 *  Three drivers, chosen by what the environment offers:
 *    fs       - a directory on disk. Durable in local dev; on Vercel this lands
 *               in /tmp, which survives warm invocations but not a cold start.
 *    memory   - last resort, per-process.
 *    postgres - not written yet. The only driver that makes a paid result
 *               durable in production; see README "Caching".
 *
 *  Keys are namespaced strings: "sec:tickers", "sec:facts:0001045810",
 *  "ai:takeaways:0001045810:0001045810-26-000021".
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface Entry<T> {
  value: T;
  /** Epoch ms, or null for "never expires". */
  expires: number | null;
}

export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number | null): Promise<void>;
}

const live = (entry: Entry<unknown>) => entry.expires === null || entry.expires > Date.now();

class MemoryCache implements Cache {
  private store = new Map<string, Entry<unknown>>();

  async get<T>(key: string): Promise<T | null> {
    const hit = this.store.get(key);
    if (!hit) return null;
    if (!live(hit)) {
      this.store.delete(key);
      return null;
    }
    return hit.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number | null = null): Promise<void> {
    this.store.set(key, { value, expires: ttlSeconds === null ? null : Date.now() + ttlSeconds * 1000 });
  }
}

class FsCache implements Cache {
  private memo = new MemoryCache();

  constructor(private dir: string) {}

  /** Keys contain colons and slashes; hash them so they are safe filenames,
   *  and keep a readable prefix so the directory can be eyeballed. */
  private path(key: string) {
    const slug = key.replace(/[^a-z0-9._-]+/gi, "-").slice(0, 60);
    const hash = createHash("sha1").update(key).digest("hex").slice(0, 10);
    return join(this.dir, `${slug}.${hash}.json`);
  }

  async get<T>(key: string): Promise<T | null> {
    const hot = await this.memo.get<T>(key);
    if (hot !== null) return hot;
    try {
      const raw = await readFile(this.path(key), "utf8");
      const entry = JSON.parse(raw) as Entry<T>;
      if (!live(entry)) return null;
      // Re-warm the in-process layer so a hot path does not touch disk twice.
      await this.memo.set(key, entry.value, entry.expires === null ? null : Math.ceil((entry.expires - Date.now()) / 1000));
      return entry.value;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number | null = null): Promise<void> {
    const entry: Entry<T> = {
      value,
      expires: ttlSeconds === null ? null : Date.now() + ttlSeconds * 1000,
    };
    await this.memo.set(key, value, ttlSeconds);
    try {
      await mkdir(this.dir, { recursive: true });
      await writeFile(this.path(key), JSON.stringify(entry), "utf8");
    } catch {
      // A read-only filesystem is survivable: the memory layer still holds it
      // for this process. Nothing here should ever fail a request.
    }
  }
}

function chooseCache(): Cache {
  const dir = process.env.CACHE_DIR ?? (process.env.VERCEL ? "/tmp/conviction-cache" : ".cache");
  if (dir === "off") return new MemoryCache();
  return new FsCache(dir);
}

/** One instance per process. */
export const cache: Cache = chooseCache();

/** Read-through helper: return the cached value, or compute, store and return it. */
export async function cached<T>(
  key: string,
  ttlSeconds: number | null,
  compute: () => Promise<T>,
): Promise<T> {
  const hit = await cache.get<T>(key);
  if (hit !== null) return hit;
  const value = await compute();
  await cache.set(key, value, ttlSeconds);
  return value;
}

/** Read-through, for a computation whose answer may legitimately be null.
 *
 *  `cached` treats a stored null as a miss, which is right for "not computed
 *  yet" and wrong for "the vendor has nothing for this symbol" — and the second
 *  is the answer most worth keeping. Without this, every OTC ticker reachable
 *  by URL re-spent about five Alpaca calls on every single page view, against a
 *  200-a-minute ceiling.
 *
 *  The envelope is what distinguishes absent from null, and it is deliberately
 *  only used by the market layer: the keys read directly through `cache.get`
 *  elsewhere (`ai:takeaways:*`, `ai:business:*`) keep their bare shape.
 */
export async function cachedNullable<T>(
  key: string,
  ttlSeconds: number | null,
  compute: () => Promise<T | null>,
): Promise<T | null> {
  const hit = await cache.get<{ v: T | null }>(key);
  if (hit && typeof hit === "object" && "v" in hit) return hit.v;
  const value = await compute();
  await cache.set(key, { v: value }, ttlSeconds);
  return value;
}

export const DAY = 60 * 60 * 24;
export const HOUR = 60 * 60;
/** Filings never change once filed, so anything derived from one is permanent. */
export const FOREVER = null;
