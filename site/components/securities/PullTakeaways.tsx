"use client";

import { useState } from "react";
import type { TakeawaysResult } from "@/lib/ai/takeaways";

/** The button that spends credits, and nothing else on the page does.
 *
 *  If the server already found a cached pull, it arrives as `initial` and this
 *  renders it with no call at all. Otherwise the person presses the button,
 *  once, and the result is cached against the filing's accession number — so
 *  the same filing is never paid for twice.
 */
export default function PullTakeaways({
  cik,
  accession,
  initial,
  estimatedUsd,
}: {
  cik: string;
  accession: string;
  initial: TakeawaysResult | null;
  /** What the first pull is expected to cost, shown on the button. */
  estimatedUsd: number;
}) {
  const [result, setResult] = useState<TakeawaysResult | null>(initial);
  const [pulling, setPulling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pull() {
    setPulling(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/takeaways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cik, accession }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "The pull failed.");
        return;
      }
      setResult(data as TakeawaysResult);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPulling(false);
    }
  }

  if (result) {
    return (
      <>
        <ul className="take">
          {result.takeaways.map((t) => (
            <li key={t.point}>
              {t.point} <span className="fine">{t.soWhat}</span>
            </li>
          ))}
        </ul>
        <p className="fine" style={{ marginTop: 10 }}>
          {result.truncated && "Document truncated at the input limit. "}
          Pulled {new Date(result.at).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}{" "}
          with {result.model}, ${result.usd.toFixed(2)}. Cached against the accession number, so
          reading it again is free.
        </p>
      </>
    );
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div className="btns">
        <button className="btn" type="button" onClick={pull} disabled={pulling}>
          {pulling ? "Reading the filing…" : "Pull biggest takeaways"}
        </button>
        <span className="fine">
          {pulling
            ? "One model call, 20–60 seconds."
            : `~$${estimatedUsd.toFixed(2)} of credits, once for this filing`}
        </span>
      </div>
      {error && (
        <p className="fine" style={{ marginTop: 10, color: "var(--warn-ink)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
