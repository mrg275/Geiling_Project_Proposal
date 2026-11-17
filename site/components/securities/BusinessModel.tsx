import { BUSINESS_COST_USD, type BusinessResult } from "@/lib/ai/business";
import { cache } from "@/lib/cache";
import { book } from "@/lib/data";
import type { Company } from "@/lib/sec/submissions";
import PullBusiness from "./PullBusiness";

/** How it makes money, directly under the stock.
 *
 *  The first thing worth knowing about a company you do not follow, and the
 *  thing a sector code never tells you. Hand-written for the sample names; for
 *  anything else the cache is read here on the server, so a company already
 *  pulled renders free and only an unread one shows a button.
 */
export default async function BusinessModel({
  ticker,
  profile,
}: {
  ticker: string;
  profile: Company | null;
}) {
  const note = book.businesses[ticker];
  const tenK = profile?.latest10K ?? null;
  if (!note && !tenK) return null;

  const hit =
    !note && profile && tenK
      ? await cache.get<BusinessResult>(`ai:business:${profile.cik}:${tenK.accession}`)
      : null;

  return (
    <div className="pad-b" style={{ borderTop: "1px solid var(--line)" }}>
      <p className="lbl" style={{ marginBottom: 7 }}>
        How it makes money
      </p>
      {note ? (
        <p className="sub">{note.model}</p>
      ) : (
        profile &&
        tenK && (
          <PullBusiness
            cik={profile.cik}
            accession={tenK.accession}
            initial={hit}
            estimatedUsd={BUSINESS_COST_USD}
            industry={profile.industry}
          />
        )
      )}
    </div>
  );
}
