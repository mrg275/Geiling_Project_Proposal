import { book } from "@/lib/data";
import { direction, dollars } from "@/lib/format";
import { bookTotals, dayDrift } from "@/lib/portfolio";

/** The day explained by cause rather than by position: three themes plus the
 *  drift that belongs to nothing, summing to the same figure as the tile. */
export default function TodaysRead() {
  const totals = bookTotals();

  return (
    <section className="pane">
      <header>
        <h2>Today&rsquo;s read</h2>
        <span className="hint">{dollars(totals.day)} explained</span>
      </header>

      {book.dayThemes.map((theme) => (
        <div className="rr" key={theme.headline}>
          <div className={`d ${direction(theme.dollars)}`}>{dollars(theme.dollars)}</div>
          <div>
            <div className="h">{theme.headline}</div>
            <p className="b">{theme.body}</p>
            <div className="t">{theme.tickers.join(", ")}</div>
          </div>
        </div>
      ))}

      <div className="rr">
        <div className="d flat">{dollars(dayDrift())}</div>
        <div>
          <div className="h">No common cause</div>
          <p className="b">{book.dayDriftNote}</p>
        </div>
      </div>

      <div className="pad-b" style={{ borderTop: "1px solid var(--line)" }}>
        <p className="fine">{book.themeNote}</p>
      </div>
    </section>
  );
}
