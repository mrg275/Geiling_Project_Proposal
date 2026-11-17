import { book } from "@/lib/data";
import { pct } from "@/lib/format";
import DebatesChat from "./DebatesChat";
import type { Security } from "@/lib/types";

export type SectionId = "valuation" | "comps" | "targets" | "filings" | "debates";

export const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "valuation", label: "Valuation" },
  { id: "comps", label: "Comps" },
  { id: "targets", label: "Targets" },
  { id: "filings", label: "Filings" },
  { id: "debates", label: "Debates" },
];

const edgar = (ticker: string, kind: string) =>
  `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker}&type=${
    kind === "Call" ? "8-K" : kind
  }`;

export default function SecuritySections({
  security,
  section,
}: {
  security: Security;
  section: SectionId;
}) {
  if (section === "valuation") {
    return (
      <>
        <div className="kv">
          {security.stats.map((stat) => (
            <div key={stat.label}>
              <div className="k">{stat.label}</div>
              <div className="v">{stat.value}</div>
              {stat.note && <div className="nt">{stat.note}</div>}
            </div>
          ))}
        </div>
        <div className="pad-b" style={{ borderTop: "1px solid var(--line)" }}>
          <p className="lbl" style={{ marginBottom: 10 }}>
            What semis analysts actually value this on
          </p>
          {security.industryRatios.map((ratio, i) => (
            <div
              key={ratio.label}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: "3px 16px",
                padding: "12px 0",
                borderTop: i ? "1px solid var(--line)" : undefined,
              }}
            >
              <div style={{ fontWeight: 500 }}>{ratio.label}</div>
              <div className="m" style={{ textAlign: "right" }}>
                {ratio.value}
              </div>
              <p className="fine" style={{ gridColumn: "1 / -1", margin: 0 }}>
                {ratio.why}
              </p>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (section === "comps") {
    return (
      <>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Mkt cap</th>
                <th>EV/EBITDA</th>
                <th>P/E fwd</th>
                <th>Rev growth</th>
                <th>Gross margin</th>
              </tr>
            </thead>
            <tbody>
              {security.comps.map((c) => (
                <tr key={c.ticker} style={c.self ? { background: "var(--surf2)" } : undefined}>
                  <td>
                    <span className="tk">{c.ticker}</span>
                    {/* What the peer does, so the row means something to
                        someone who does not already know the sector. */}
                    {book.businesses[c.ticker] && (
                      <div className="does">{book.businesses[c.ticker].does}</div>
                    )}
                  </td>
                  <td className="n">{c.marketCap}</td>
                  <td className="n">{c.evEbitda}</td>
                  <td className="n">{c.forwardPE}</td>
                  <td className="n">{c.revGrowth}</td>
                  <td className="n">{c.grossMargin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pad-b" style={{ borderTop: "1px solid var(--line)" }}>
          <p className="fine">
            Peers by revenue exposure to accelerated computing, not by sector code — which is why
            a foundry and a memory maker are not in this table and a connectivity company is.
            Every multiple here is sample content, the subject&rsquo;s own row included, so its
            market cap in this table can disagree with the computed one above. The one above is
            the real figure: a live price times the share count on the latest filing&rsquo;s cover.
          </p>
        </div>
      </>
    );
  }

  if (section === "targets") {
    const sorted = [...security.targets].map((t) => t.target).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    return (
      <>
        <div className="pad">
          <p className="lbl">
            Median ${median}, {pct((median / security.price - 1) * 100)} from here
          </p>
        </div>
        {security.targets.map((t) => (
          <article className="art" key={t.firm}>
            <div className="src">
              <span>{t.firm}</span>
              <span>{t.rating}</span>
              <span>{t.when}</span>
            </div>
            <h3 className="pt">
              ${t.target} <span className="fine">{pct((t.target / security.price - 1) * 100)}</span>
            </h3>
            <p className="why">{t.note}</p>
            <a
              className="fine"
              href={`https://www.google.com/search?q=${encodeURIComponent(
                `${t.firm} ${security.name} price target note`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Research note →
            </a>
          </article>
        ))}
      </>
    );
  }

  if (section === "filings") {
    return (
      <>
        {security.filings.map((f) => (
          <article className="art" key={f.label}>
            <div className="src">
              <span>{f.kind}</span>
              <span>{f.when}</span>
            </div>
            <h3>{f.label}</h3>
            <div className="btns" style={{ margin: "10px 0 0" }}>
              <details className="tk-take">
                <summary>Biggest takeaways</summary>
                <ul className="take">
                  {f.takeaways.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </details>
              <a
                className="btn sec"
                href={edgar(security.ticker, f.kind)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open on EDGAR
              </a>
            </div>
          </article>
        ))}
      </>
    );
  }

  return (
    <>
      <div className="pad">
        <p className="sub">
          {security.debates.length} unresolved arguments. Everything else about this company is
          settled enough to be in the price already.
        </p>
      </div>
      {security.debates.map((d) => (
        <article className="art" key={d.question}>
          <h3>{d.question}</h3>
          <dl className="dl" style={{ marginTop: 12 }}>
            <dt>Where it stands</dt>
            <dd>{d.state}</dd>
            <dt>Why it moves price</dt>
            <dd>{d.why}</dd>
            <dt>What to watch</dt>
            <dd>{d.watch}</dd>
          </dl>
        </article>
      ))}
      <DebatesChat canned={security.cannedChat} />
    </>
  );
}
