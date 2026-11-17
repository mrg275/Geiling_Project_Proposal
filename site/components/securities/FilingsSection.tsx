import { cache } from "@/lib/cache";
import type { TakeawaysResult } from "@/lib/ai/takeaways";
import { typicalPullCostUsd } from "@/lib/ai/takeaways";
import { filingLabel, keyFilings, type Company } from "@/lib/sec/submissions";
import PullTakeaways from "./PullTakeaways";

/** The last 10-K, 10-Q and earnings release — real, from EDGAR, for any ticker.
 *
 *  The cache is read here on the server, so a filing whose takeaways were
 *  already pulled renders them immediately and spends nothing. Only the button
 *  underneath an un-pulled filing costs anything.
 */
export default async function FilingsSection({ profile }: { profile: Company }) {
  const filings = keyFilings(profile);

  if (filings.length === 0) {
    return (
      <div className="pad">
        <p className="fine">
          No 10-K, 10-Q or earnings 8-K in this registrant&rsquo;s recent index. Funds, trusts and
          foreign issuers file different forms.
        </p>
      </div>
    );
  }

  const withCache = await Promise.all(
    filings.map(async (filing) => ({
      filing,
      cached: await cache.get<TakeawaysResult>(`ai:takeaways:${profile.cik}:${filing.accession}`),
    })),
  );

  return (
    <>
      {withCache.map(({ filing, cached: hit }) => (
        <article className="art" key={filing.accession}>
          <div className="src">
            <span>{filing.form}</span>
            <span>Filed {filing.filed}</span>
            {filing.period && <span>Period ending {filing.period}</span>}
          </div>
          <h3>{filingLabel(filing)}</h3>

          <div className="btns" style={{ margin: "10px 0 0" }}>
            <a className="btn sec" href={filing.url} target="_blank" rel="noopener noreferrer">
              Open document
            </a>
            <a className="btn sec" href={filing.indexUrl} target="_blank" rel="noopener noreferrer">
              All exhibits
            </a>
          </div>

          <PullTakeaways
            cik={profile.cik}
            accession={filing.accession}
            initial={hit}
            estimatedUsd={typicalPullCostUsd(filing.form)}
          />
        </article>
      ))}
    </>
  );
}
