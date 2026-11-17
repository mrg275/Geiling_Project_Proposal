"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { book } from "@/lib/data";
import { direction, pct } from "@/lib/format";
import { positionsByValue } from "@/lib/portfolio";

interface Hit {
  ticker: string;
  cik: string;
  /** Empty for a fund EDGAR does not name and no broker is connected to name. */
  name: string;
  exchange: string | null;
}

/** EDGAR's fund index has tickers and no names, so this is what an unnamed row
 *  says rather than printing the ticker twice. */
const UNNAMED = "Fund or ETF share class";

/** Search over every EDGAR registrant with a ticker — 10,400 names, not the
 *  eleven in the book. With an empty box it shows the positions, because that
 *  is what you want nine visits out of ten. */
export default function SecuritySearch({ selected }: { selected?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHits(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const mine = ++seq.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as {
          hits: Hit[];
          total?: number;
          truncated?: boolean;
          error?: string;
        };
        // A slower earlier request must not overwrite a newer one's results.
        if (mine !== seq.current) return;
        setHits(data.hits);
        if (typeof data.total === "number") setTotal(data.total);
        setTruncated(Boolean(data.truncated));
        setError(data.error ?? null);
      } catch {
        if (mine !== seq.current) return;
        setError("Search is unavailable offline.");
        setHits([]);
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  const positions = positionsByValue();

  return (
    <section className="pane">
      <header>
        <h2>Search</h2>
        <span className="hint">
          {loading
            ? "searching…"
            : hits
              ? `${truncated ? "top " : ""}${hits.length} of ${(total ?? 0).toLocaleString("en-US")}`
              : "your positions"}
        </span>
      </header>

      <div className="pad">
        <label className="sr" htmlFor="q">
          Ticker or company name
        </label>
        <input
          id="q"
          type="search"
          value={query}
          placeholder="Ticker or company name"
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            // Enter opens the best match, which is what typing a ticker means.
            if (e.key === "Enter" && hits && hits.length > 0) {
              e.preventDefault();
              router.push(`/securities/${hits[0].ticker}`);
            }
          }}
        />
      </div>

      {error && (
        <div className="pad-b" style={{ borderTop: "1px solid var(--line)" }}>
          <p className="fine">{error}</p>
        </div>
      )}

      {hits === null
        ? positions.map((p) => (
            <Link
              className="li"
              key={p.ticker}
              href={`/securities/${p.ticker}`}
              aria-current={p.ticker === selected ? "page" : undefined}
            >
              <div className="m2" style={{ marginBottom: 4 }}>
                <span className="tk">{p.ticker}</span>
                <span className={direction(p.dayPct)}>{pct(p.dayPct)}</span>
              </div>
              <div className="t" style={{ fontWeight: 400, margin: 0 }}>
                {p.name}
              </div>
              <div className="m2" style={{ marginTop: 5 }}>
                <span>held</span>
                <span />
              </div>
            </Link>
          ))
        : hits.length === 0 && !error
          ? (
              <div className="pad-b" style={{ borderTop: "1px solid var(--line)" }}>
                <p className="fine">
                  Nothing matches. The index is US registrants and US-registered funds, so a
                  foreign listing without an ADR will not appear.
                </p>
              </div>
            )
          : hits.map((hit) => {
              const held = book.positions.find((p) => p.ticker === hit.ticker);
              return (
                <Link
                  className="li"
                  key={hit.cik + hit.ticker}
                  href={`/securities/${hit.ticker}`}
                  aria-current={hit.ticker === selected ? "page" : undefined}
                >
                  <div className="m2" style={{ marginBottom: 4 }}>
                    <span className="tk">{hit.ticker}</span>
                    {held && <span className={direction(held.dayPct)}>{pct(held.dayPct)}</span>}
                  </div>
                  <div className="t" style={{ fontWeight: 400, margin: 0 }}>
                    {hit.name || <span className="fine">{UNNAMED}</span>}
                  </div>
                  <div className="m2" style={{ marginTop: 5 }}>
                    <span>{hit.exchange ?? "unlisted"}</span>
                    <span>{held ? "held" : ""}</span>
                  </div>
                </Link>
              );
            })}
    </section>
  );
}
