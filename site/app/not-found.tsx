import Link from "next/link";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <section className="pane">
      <header>
        <h2>No such page</h2>
        <span className="hint">404</span>
      </header>
      <div className="pad">
        <p className="sub">
          Nothing lives at this address. If you were after a ticker, it is not in EDGAR&rsquo;s
          index of US registrants and US-registered funds — which is what search covers, all
          39,000 of them, so a symbol missing from it is one the SEC does not list.
        </p>
        <div className="btns" style={{ marginTop: 16 }}>
          <Link className="btn" href="/">
            Portfolio
          </Link>
          <Link className="btn sec" href="/securities">
            Search securities
          </Link>
        </div>
      </div>
    </section>
  );
}
