"use client";

import { useEffect, useRef, useState } from "react";
import PerformanceChart, { type CustomSeries } from "@/components/PerformanceChart";
import { PRICE_RANGES, type PriceHistory, type RangeId } from "@/lib/market/types";

/** The price chart on a company page, with the range row above it.
 *
 *  The server renders the opening range, so the chart is there on first paint;
 *  the rest are fetched on click and kept, so a range already looked at comes
 *  back instantly and costs the source nothing.
 *
 *  Both lines are rebased to 100 at the start of the window rather than plotted
 *  in dollars. One axis then carries the stock and the index together, and the
 *  chart answers "how has this done against the market, over this window" — the
 *  dollar price belongs in the tile above, where it is.
 */
export default function PriceChart({
  symbol,
  initial,
}: {
  symbol: string;
  initial: PriceHistory;
}) {
  const [range, setRange] = useState<RangeId>(initial.range);
  const [windows, setWindows] = useState<Partial<Record<RangeId, PriceHistory>>>({
    [initial.range]: initial,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  const shown = useRef<PriceHistory>(initial);

  useEffect(() => {
    const hit = windows[range];
    if (hit) {
      shown.current = hit;
      return;
    }
    const mine = ++seq.current;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(
          `/api/market/history?symbol=${encodeURIComponent(symbol)}&range=${range}`,
        );
        const data = await res.json();
        // A slower earlier request must not overwrite a newer one's answer.
        if (mine !== seq.current) return;
        if (!res.ok) {
          setError(data.error ?? "That range could not be loaded.");
          return;
        }
        setWindows((all) => ({ ...all, [range]: data as PriceHistory }));
      } catch {
        if (mine === seq.current) setError("Could not reach the server.");
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    })();
  }, [range, symbol, windows]);

  const current = windows[range] ?? shown.current;
  const spec = PRICE_RANGES.find((r) => r.id === current.range) ?? PRICE_RANGES[3];

  const series: CustomSeries[] = [
    {
      key: "price",
      label: current.symbol,
      color: "var(--c-port)",
      width: 2.2,
      raw: current.values,
      base: current.base ?? null,
    },
    ...(current.benchmark
      ? [
          {
            key: "benchmark",
            label: current.benchmark.label,
            color: "var(--c-sp)",
            width: 1.4,
            raw: current.benchmark.values,
            base: current.benchmark.base ?? null,
          },
        ]
      : []),
  ];

  return (
    <div className="pad">
      <div className="ctl" style={{ marginBottom: 12 }}>
        <div className="seg" role="group" aria-label="Range">
          {PRICE_RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={r.id === range}
              title={r.title}
              onClick={() => setRange(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
        {loading && <span className="fine">loading…</span>}
      </div>

      <PerformanceChart customSeries={series} labels={current.labels} compact />

      <p className="fine" style={{ marginTop: 8 }}>
        {spec.title}, rebased to 100 at{" "}
        {current.base ? "the previous close" : "the start of the window"}.{" "}
        {current.provenance.note}
      </p>

      {error && (
        <p className="fine" style={{ marginTop: 8, color: "var(--warn-ink)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
