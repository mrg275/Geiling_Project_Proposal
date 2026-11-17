import Link from "next/link";
import { Tag } from "@/components/Tag";
import { book } from "@/lib/data";
import { direction, pct, usd2 } from "@/lib/format";

/** Opportunities scored against the convictions, not against a screen: each one
 *  names the conviction it serves and why now. */
export default function Flagged() {
  return (
    <section className="pane">
      <header>
        <h2>Flagged</h2>
        <span className="hint">against your convictions</span>
      </header>
      {book.flagged.map((idea) => (
        <Link className="fl" href={`/securities/${idea.ticker}`} key={idea.kind + idea.ticker}>
          <div className="flh">
            <span className={`kind ${idea.kind.toLowerCase()}`}>{idea.kind}</span>
            <span className="tk">{idea.ticker}</span>
            <span className="mv r">
              {usd2(idea.price)}{" "}
              <span className={direction(idea.move)}>{pct(idea.move)}</span> {idea.window}
            </span>
          </div>
          <p className="why">{idea.why}</p>
          <div className="flh" style={{ margin: "8px 0 0" }}>
            <Tag id={idea.conviction} />
          </div>
        </Link>
      ))}
    </section>
  );
}
