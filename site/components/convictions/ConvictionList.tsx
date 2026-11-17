import Link from "next/link";
import { book } from "@/lib/data";
import { keyVar } from "@/lib/keys";

export default function ConvictionList({ selectedId }: { selectedId?: string }) {
  return (
    <section className="pane">
      <header>
        <h2>Your convictions</h2>
        <Link className="btn gh" href="/convictions/new">
          + New
        </Link>
      </header>
      {book.convictions.map((c) => (
        <Link
          className="li"
          key={c.id}
          href={`/convictions/${c.id}`}
          aria-current={c.id === selectedId ? "page" : undefined}
        >
          <div className="t">{c.title}</div>
          <div className="m2">
            <span>
              {c.tickers.length
                ? `${c.tickers.length} position${c.tickers.length > 1 ? "s" : ""}`
                : "no positions"}
            </span>
            <span>{c.pct.toFixed(1)}%</span>
          </div>
          <div className="bar2">
            <i style={{ width: `${Math.max(c.pct, 1)}%`, background: keyVar(c.id) }} />
          </div>
        </Link>
      ))}
    </section>
  );
}
