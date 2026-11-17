import Link from "next/link";
import ConvictionList from "@/components/convictions/ConvictionList";
import CorrelationMatrix from "@/components/convictions/CorrelationMatrix";
import EditThesis from "@/components/convictions/EditThesis";
import ExposureMap from "@/components/convictions/ExposureMap";
import Score from "@/components/Score";
import { direction, pct, usd0 } from "@/lib/format";
import { articlesFor, positionsFor, weight } from "@/lib/portfolio";
import type { Conviction } from "@/lib/types";

export default function ConvictionsView({ conviction }: { conviction: Conviction }) {
  const positions = positionsFor(conviction.id);
  const reading = articlesFor(conviction.id);

  return (
    <>
      <ExposureMap />

      <div className="md">
        <ConvictionList selectedId={conviction.id} />

        <div className="grid">
          <section className="pane">
            <header>
              <h2>{conviction.short}</h2>
              <span className="hint">
                {conviction.pct.toFixed(1)}% · {usd0(conviction.value)}
              </span>
            </header>
            <div className="pad">
              <h3 className="ph">{conviction.title}</h3>
              <dl className="dl" style={{ marginTop: 14 }}>
                <dt>Conviction</dt>
                <dd>
                  <Score value={conviction.score} />
                </dd>
                <dt>Horizon</dt>
                <dd>{conviction.horizon}</dd>
                <dt>Added</dt>
                <dd>{conviction.added}</dd>
                <dt>Thesis</dt>
                <dd>{conviction.thesis}</dd>
                <dt>Falsified by</dt>
                <dd>{conviction.falsifiedBy}</dd>
                {conviction.tension && (
                  <>
                    <dt>Tension</dt>
                    <dd style={{ color: "var(--warn-ink)" }}>{conviction.tension}</dd>
                  </>
                )}
                <dt>Correlation</dt>
                <dd>{conviction.correlationNote}</dd>
              </dl>
              <EditThesis thesis={conviction.thesis} />
            </div>
          </section>

          <section className="pane">
            <header>
              <h2>Positions behind it</h2>
            </header>
            <div className="tw">
              <table style={{ minWidth: 420 }}>
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Value</th>
                    <th>Today</th>
                    <th>All time</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="fine" style={{ padding: "16px 18px" }}>
                        No positions behind this conviction.
                      </td>
                    </tr>
                  )}
                  {positions.map((p) => (
                    <tr key={p.ticker}>
                      <td>
                        <Link className="cell" href={`/securities/${p.ticker}`}>
                          <span className="tk">{p.ticker}</span>
                          <span className="co">{p.name}</span>
                        </Link>
                      </td>
                      <td className="n">
                        {usd0(p.value)}
                        <span className="un">{weight(p).toFixed(1)}% of book</span>
                      </td>
                      <td className={`n ${direction(p.dayPct)}`}>{pct(p.dayPct)}</td>
                      <td className={`n ${direction(p.totalPct)}`}>{pct(p.totalPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="pane">
            <header>
              <h2>What this says to do</h2>
            </header>
            {conviction.ideas.map((idea) =>
              idea.ticker === "—" ? (
                <div className="fl" key={idea.kind} style={{ cursor: "default" }}>
                  <div className="flh">
                    <span className="kind add">{idea.kind}</span>
                  </div>
                  <p className="why">{idea.body}</p>
                </div>
              ) : (
                <Link className="fl" href={`/securities/${idea.ticker}`} key={idea.kind + idea.ticker}>
                  <div className="flh">
                    <span className="kind add">{idea.kind}</span>
                    <span className="tk">{idea.ticker}</span>
                  </div>
                  <p className="why">{idea.body}</p>
                </Link>
              ),
            )}
          </section>

          <CorrelationMatrix />

          <section className="pane">
            <header>
              <h2>Reading tied to this</h2>
            </header>
            {reading.length === 0 ? (
              <div className="pad-b" style={{ borderTop: "1px solid var(--line)" }}>
                <p className="fine">Nothing credible this week touches this conviction.</p>
              </div>
            ) : (
              reading.map((a) => (
                <article className="art" key={a.url + a.title}>
                  <div className="src">
                    <span>{a.source}</span>
                    <span>{a.when}</span>
                  </div>
                  <h3>
                    <a href={a.url} target="_blank" rel="noopener noreferrer">
                      {a.title}
                    </a>
                  </h3>
                  <p className="why">{a.why}</p>
                </article>
              ))
            )}
          </section>
        </div>
      </div>
    </>
  );
}
