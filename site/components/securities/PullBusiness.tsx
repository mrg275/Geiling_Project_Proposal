"use client";

import { useState } from "react";
import type { BusinessResult } from "@/lib/ai/business";

/** The second button that can spend credits, and it is the cheap one.
 *
 *  Shown only for tickers with no hand-written note — which is to say, for the
 *  ten thousand this project did not write prose for. Same contract as the
 *  takeaways button: nothing is sent until it is pressed, the answer is cached
 *  against the filing's accession number, and a cached answer arrives from the
 *  server with no call at all.
 */
export default function PullBusiness({
  cik,
  accession,
  initial,
  estimatedUsd,
  industry,
}: {
  cik: string;
  accession: string;
  initial: BusinessResult | null;
  estimatedUsd: number;
  /** EDGAR's SIC description — all that is known for free. */
  industry: string;
}) {
  const [result, setResult] = useState<BusinessResult | null>(initial);
  const [pulling, setPulling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pull() {
    setPulling(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cik, accession }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "The pull failed.");
        return;
      }
      setResult(data as BusinessResult);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPulling(false);
    }
  }

  if (result) {
    return (
      <>
        <p className="sub">{result.how}</p>
        {result.streams.length > 0 && (
          <ul className="take">
            {result.streams.map((s) => (
              <li key={s.name}>
                <strong>{s.name}</strong> <span className="fine">{s.note}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="fine" style={{ marginTop: 10 }}>
          Read from the 10-K&rsquo;s business section with {result.model}, $
          {result.usd.toFixed(2)}. Cached against the accession number, so it holds until the next
          annual report.
        </p>
      </>
    );
  }

  return (
    <>
      <p className="fine">
        {industry ? (
          <>
            EDGAR classifies this registrant as <strong>{industry}</strong>, which is a code, not an
            answer. The business section of the 10-K is the answer.
          </>
        ) : (
          <>Nothing free describes this business, but its 10-K does.</>
        )}
      </p>
      <div className="btns" style={{ marginTop: 10 }}>
        <button className="btn" type="button" onClick={pull} disabled={pulling}>
          {pulling ? "Reading Item 1…" : "Read it from the 10-K"}
        </button>
        <span className="fine">
          {pulling
            ? "One model call, 10–30 seconds."
            : `~$${estimatedUsd.toFixed(2)} of credits, once for this company`}
        </span>
      </div>
      {error && (
        <p className="fine" style={{ marginTop: 10, color: "var(--warn-ink)" }}>
          {error}
        </p>
      )}
    </>
  );
}
