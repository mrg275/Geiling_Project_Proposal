import { book } from "@/lib/data";
import { HATCH, keyVar } from "@/lib/keys";

/** Percent of the book standing behind each stated belief, plus the slice
 *  standing behind none. Every segment is named and numbered in the legend, so
 *  the colour is a scanning aid rather than the only way to read it. */
export default function ExposureMap() {
  const funded = book.convictions.filter((c) => c.pct > 0);

  return (
    <section className="pane" style={{ marginBottom: 16 }}>
      <header>
        <h2>Exposure map</h2>
        <span className="hint">
          {funded[0].pct.toFixed(1)}% of the book sits behind one idea
        </span>
      </header>
      <div className="pad">
        <div className="xbar">
          {funded.map((c) => (
            <div key={c.id} style={{ width: `${c.pct}%`, background: keyVar(c.id) }} title={c.short} />
          ))}
          <div style={{ width: `${book.unassigned.pct}%`, background: HATCH }} title="No conviction" />
        </div>

        <div className="xlegend">
          {funded.map((c) => (
            <div className="xrow" key={c.id}>
              <i style={{ background: keyVar(c.id) }} />
              <span className="lbl">{c.short}</span>
              <span className="v">{c.pct.toFixed(1)}%</span>
            </div>
          ))}
          <div className="xrow">
            <i style={{ background: HATCH }} />
            <span className="lbl">No conviction</span>
            <span className="v">{book.unassigned.pct.toFixed(1)}%</span>
          </div>
        </div>

        <p className="fine" style={{ marginTop: 16 }}>
          {book.exposureNote}
        </p>
      </div>
    </section>
  );
}
